#!/usr/bin/env bash
#
# DMSaur Trailheads — Phase 3A.1 backend test harness (LOCAL stack only).
#
# Sections:
#   U) Edge Function unit tests (deno): body.ts (#1,2,4,5) + turnstile.ts (#6-14)
#   A) schema / RLS / grants / constraints (#18-26)
#   B) publish_submission() behavior + security (#27-37)
#   C) submit-idea Edge Function (#3,15,16,17,22,38,39,40,42,43,44,45,46)
#   (#41 invalid-Turnstile-403 is run separately with the always-fail secret.)
#
# Never touches the hosted project — reads local details from `supabase status`.
# Prereqs: supabase start; supabase db reset; functions serve (always-pass secret).

set -uo pipefail

eval "$(npx --no-install supabase status -o env 2>/dev/null)"
API_URL="${API_URL:-http://127.0.0.1:54321}"
DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
REST="${API_URL}/rest/v1"
FUNC_URL="${API_URL}/functions/v1/submit-idea"
ORIGIN="https://trailheads.dmsaur.com"
BAD_ORIGIN="https://evil.example.com"

PASSED=0; FAILED=0
ok()   { echo "  PASS: $1"; PASSED=$((PASSED+1)); }
bad()  { echo "  FAIL: $1"; FAILED=$((FAILED+1)); }
check(){ if [ "$2" = "0" ]; then ok "$1"; else bad "$1 (got: ${3:-})"; fi; }  # callers pass $? (0 = success)
uuid() { uuidgen | tr 'A-Z' 'a-z'; }
q()    { psql "$DB_URL" -tAqc "$1" 2>/dev/null; }
qerr() { psql "$DB_URL" -tAqc "$1" >/dev/null 2>&1; }  # returns nonzero on SQL error

echo "== U) Edge Function unit tests (deno) =="
if command -v deno >/dev/null 2>&1; then
  if deno test --allow-import --quiet supabase/tests/body.test.ts supabase/tests/turnstile.test.ts supabase/tests/cors.test.ts; then
    ok "U deno unit tests (body #1,2,4,5 + turnstile #6-14 + cors #43/#44 logic)"
  else
    bad "U deno unit tests (body + turnstile)"
  fi
else
  echo "  SKIP: deno not installed"
fi

echo "== A) schema / RLS / grants / constraints =="

# #18 anon cannot SELECT.
code=$(curl -s -o /dev/null -w '%{http_code}' -H "apikey: ${ANON_KEY}" -H "Authorization: Bearer ${ANON_KEY}" "${REST}/idea_submissions?select=id")
{ [ "$code" = "401" ] || [ "$code" = "403" ]; }; check "#18a anon SELECT denied" $? "$code"
# #18 anon cannot INSERT.
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "apikey: ${ANON_KEY}" -H "Authorization: Bearer ${ANON_KEY}" -H "Content-Type: application/json" \
  -d '{"problem_statement":"anon should not be able to write this","recognition":"anonymous","idempotency_key":"'"$(uuid)"'"}' "${REST}/idea_submissions")
{ [ "$code" = "401" ] || [ "$code" = "403" ]; }; check "#18b anon INSERT denied" $? "$code"

# #19 authenticated cannot SELECT/INSERT (role-level check via psql).
qerr "set role authenticated; select * from public.idea_submissions limit 1;"; [ $? -ne 0 ]; check "#19a authenticated SELECT denied" $?
qerr "set role authenticated; insert into public.idea_submissions(problem_statement,recognition,idempotency_key) values('a sufficiently long problem statement','anonymous','$(uuid)');"; [ $? -ne 0 ]; check "#19b authenticated INSERT denied" $?

# #20 service_role can SELECT + INSERT (via REST with the service key).
code=$(curl -s -o /dev/null -w '%{http_code}' -H "apikey: ${SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" "${REST}/idea_submissions?select=id&limit=1")
[ "$code" = "200" ]; check "#20a service_role SELECT ok" $? "$code"
KEY=$(uuid)
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "apikey: ${SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" -H "Content-Type: application/json" -H "Prefer: return=minimal" \
  -d '{"problem_statement":"service role may insert a pending submission","recognition":"anonymous","idempotency_key":"'"$KEY"'"}' "${REST}/idea_submissions")
[ "$code" = "201" ]; check "#20b service_role INSERT ok" $? "$code"

# #21 service_role cannot UPDATE/DELETE (only select+insert granted).
qerr "set role service_role; update public.idea_submissions set moderator_notes='x' where idempotency_key='${KEY}';"; [ $? -ne 0 ]; check "#21a service_role UPDATE denied" $?
qerr "set role service_role; delete from public.idea_submissions where idempotency_key='${KEY}';"; [ $? -ne 0 ]; check "#21b service_role DELETE denied" $?

# #23 DB constraints reject invalid rows.
qerr "insert into public.idea_submissions(problem_statement,recognition,idempotency_key) values('short','anonymous','$(uuid)');"; [ $? -ne 0 ]; check "#23a problem < 12 chars rejected" $?
qerr "insert into public.idea_submissions(problem_statement,recognition,idempotency_key,frequency) values('a sufficiently long problem statement','anonymous','$(uuid)','sometimes');"; [ $? -ne 0 ]; check "#23b invalid frequency rejected" $?
DKEY=$(uuid)
qerr "insert into public.idea_submissions(problem_statement,recognition,idempotency_key) values('a valid length problem statement here','anonymous','${DKEY}');"
qerr "insert into public.idea_submissions(problem_statement,recognition,idempotency_key) values('another valid length problem statement','anonymous','${DKEY}');"; [ $? -ne 0 ]; check "#23c duplicate idempotency_key rejected" $?

# #24 email requires consent.
qerr "insert into public.idea_submissions(problem_statement,recognition,contributor_display,contact_email,idempotency_key) values('a valid length problem statement here','first-name','Dana','x@y.z','$(uuid)');"; [ $? -ne 0 ]; check "#24 email without consent rejected" $?

# #25 anonymous recognition works WITHOUT a display name.
qerr "insert into public.idea_submissions(problem_statement,recognition,idempotency_key) values('a valid length anonymous problem','anonymous','$(uuid)');"; [ $? -eq 0 ]; check "#25 anonymous without display_name accepted" $?

# #26 non-anonymous recognition REQUIRES a display name.
qerr "insert into public.idea_submissions(problem_statement,recognition,idempotency_key) values('a valid length named problem here','first-name','$(uuid)');"; [ $? -ne 0 ]; check "#26 non-anonymous null display_name rejected" $?

echo "== B) publish_submission() =="

# #27-30 happy path.
SID=$(q "insert into public.idea_submissions(status,problem_statement,who_experiences_it,recognition,contributor_display,idempotency_key) values('approved','people who cannot tell how full their tank is','van lifers','first-name','Dana R.','$(uuid)') returning id;")
IID=$(q "select public.publish_submission('${SID}'::uuid,'Fresh water level is a guess','RV gauges are too coarse','camping-rv');")
[ -n "$IID" ]; check "#27 approved submission publishes (returns idea id)" $? "$IID"
[ "$(q "select count(*) from public.ideas where id='${IID}';")" = "1" ]; check "#28 public ideas row created" $?
[ "$(q "select count(*) from public.idea_status_events where idea_id='${IID}';")" = "1" ]; check "#29 initial status event created" $?
[ "$(q "select status from public.idea_submissions where id='${SID}';")" = "published" ]; check "#30a submission marked published" $?
[ "$(q "select published_idea_id from public.idea_submissions where id='${SID}';")" = "$IID" ]; check "#30b submission linked to published_idea_id" $?

# #34 slug collisions → -2, -3.
S2=$(q "insert into public.idea_submissions(status,problem_statement,recognition,idempotency_key) values('approved','second problem with same title text here','anonymous','$(uuid)') returning id;")
I2=$(q "select public.publish_submission('${S2}'::uuid,'Fresh water level is a guess','dup','camping-rv');")
S3=$(q "insert into public.idea_submissions(status,problem_statement,recognition,idempotency_key) values('approved','third problem with same title text here','anonymous','$(uuid)') returning id;")
I3=$(q "select public.publish_submission('${S3}'::uuid,'Fresh water level is a guess','dup','camping-rv');")
[ "$(q "select slug from public.ideas where id='${I2}';")" = "fresh-water-level-is-a-guess-2" ]; check "#34a slug collision → -2" $?
[ "$(q "select slug from public.ideas where id='${I3}';")" = "fresh-water-level-is-a-guess-3" ]; check "#34b slug collision → -3" $?

# #31-33 state guards raise.
qerr "select public.publish_submission('${SID}'::uuid,'x','y','camping-rv');"; [ $? -ne 0 ]; check "#32 already-published submission cannot publish" $?
SIDP=$(q "insert into public.idea_submissions(status,problem_statement,recognition,idempotency_key) values('pending','a pending problem that is long enough','anonymous','$(uuid)') returning id;")
qerr "select public.publish_submission('${SIDP}'::uuid,'x','y','camping-rv');"; [ $? -ne 0 ]; check "#31 pending submission cannot publish" $?
qerr "select public.publish_submission('$(uuid)'::uuid,'x','y','camping-rv');"; [ $? -ne 0 ]; check "#33 unknown submission cannot publish" $?

# #35-37 EXECUTE denied to Data API roles.
qerr "set role anon; select public.publish_submission('${SIDP}'::uuid,'x','y','camping-rv');"; [ $? -ne 0 ]; check "#35 anon cannot EXECUTE publish_submission" $?
qerr "set role authenticated; select public.publish_submission('${SIDP}'::uuid,'x','y','camping-rv');"; [ $? -ne 0 ]; check "#36 authenticated cannot EXECUTE publish_submission" $?
qerr "set role service_role; select public.publish_submission('${SIDP}'::uuid,'x','y','camping-rv');"; [ $? -ne 0 ]; check "#37 service_role cannot EXECUTE publish_submission" $?

echo "== C) submit-idea Edge Function =="

valid_payload() { cat <<JSON
{"idempotencyKey":"$1","turnstileToken":"XXXX.DUMMY.TOKEN","problem":"it is hard to know how much fresh water is left","story":"our gauge jumped from two-thirds to empty","who":"van lifers and weekend campers","frequency":"often","workaround":"we tap the tank and guess","willingness":"maybe","recognition":"first-name","displayName":"Dana R.","contactConsent":false}
JSON
}
payload_no_token() { cat <<JSON
{"idempotencyKey":"$1","problem":"it is hard to know how much fresh water is left","recognition":"anonymous","contactConsent":false}
JSON
}
post()   { curl -s -o /tmp/si_body -w '%{http_code}' -X POST -H "Origin: ${ORIGIN}" -H "Content-Type: application/json" -d "$1" "${FUNC_URL}"; }
postO()  { curl -s -o /tmp/si_body -w '%{http_code}' -X POST -H "Origin: $1" -H "Content-Type: application/json" -d "$2" "${FUNC_URL}"; }
postNO() { curl -s -o /tmp/si_body -w '%{http_code}' -X POST -H "Content-Type: application/json" -d "$1" "${FUNC_URL}"; }  # no Origin

# #38 / #15 valid submit → 200 ok, exactly one row.
K1=$(uuid); code=$(post "$(valid_payload "$K1")")
{ [ "$code" = "200" ] && grep -q '"ok":true' /tmp/si_body; }; check "#38 POST valid payload → 200 ok" $? "$code $(cat /tmp/si_body)"
[ "$(q "select count(*) from public.idea_submissions where idempotency_key='${K1}';")" = "1" ]; check "#15 first valid submit → exactly one row" $?
# #22 status server-forced to pending (row came through the Edge Function).
[ "$(q "select status from public.idea_submissions where idempotency_key='${K1}';")" = "pending" ]; check "#22 edge-submitted row status forced 'pending'" $?

# #39 invalid payload → 400.
code=$(post '{"idempotencyKey":"'"$(uuid)"'","turnstileToken":"t","recognition":"anonymous","contactConsent":false}')
{ [ "$code" = "400" ] && grep -q '"error":"validation"' /tmp/si_body; }; check "#39 invalid payload (missing problem) → 400" $? "$code"

# #40 honeypot → fake 200, no row.
KH=$(uuid); code=$(post '{"idempotencyKey":"'"$KH"'","website":"http://spam","turnstileToken":"t","problem":"a sufficiently long problem statement","recognition":"anonymous","contactConsent":false}')
[ "$code" = "200" ]; check "#40a honeypot → 200" $? "$code"
[ "$(q "select count(*) from public.idea_submissions where idempotency_key='${KH}';")" = "0" ]; check "#40b honeypot stored NO row" $?

# #16 retry w/ same key and NO Turnstile token → still 200 duplicate, one row.
K16=$(uuid); post "$(valid_payload "$K16")" >/dev/null; code=$(post "$(payload_no_token "$K16")")
{ [ "$code" = "200" ] && grep -q '"duplicate":true' /tmp/si_body; }; check "#16 retry w/o Turnstile token → 200 duplicate" $? "$code $(cat /tmp/si_body)"
[ "$(q "select count(*) from public.idea_submissions where idempotency_key='${K16}';")" = "1" ]; check "#16b retry stored exactly one row" $?

# #17 concurrent same-key → exactly one row.
KC=$(uuid)
post "$(valid_payload "$KC")" >/dev/null 2>&1 &
post "$(valid_payload "$KC")" >/dev/null 2>&1 &
wait
[ "$(q "select count(*) from public.idea_submissions where idempotency_key='${KC}';")" = "1" ]; check "#17 concurrent same-key → exactly one row" $?

# #3 oversized body with Content-Length → 413.
BIG=$(printf 'x%.0s' $(seq 1 20000))
code=$(post '{"idempotencyKey":"'"$(uuid)"'","turnstileToken":"t","problem":"'"$BIG"'","recognition":"anonymous","contactConsent":false}')
[ "$code" = "413" ]; check "#3 oversized body (Content-Length) → 413" $? "$code"

# #42 GET and PUT → 405.
code=$(curl -s -o /dev/null -w '%{http_code}' -X GET -H "Origin: ${ORIGIN}" "${FUNC_URL}"); [ "$code" = "405" ]; check "#42a GET → 405" $? "$code"
code=$(curl -s -o /dev/null -w '%{http_code}' -X PUT -H "Origin: ${ORIGIN}" "${FUNC_URL}"); [ "$code" = "405" ]; check "#42b PUT → 405" $? "$code"

# #43 / #44a — OPTIONS preflight ACAO echo. The local `functions serve` relay
# auto-answers OPTIONS with a generic `Access-Control-Allow-Origin: *`, so header
# echo cannot be verified here. The handler's actual policy (echo exact origin /
# no ACAO for disallowed) is verified authoritatively by cors.test.ts (section U);
# the access-control behavior is verified by #44b (POST) and #45 below.
echo "  SKIP: #43/#44a OPTIONS ACAO echo (local relay forces '*'; covered by cors.test.ts + #44b/#45)"

# #44b disallowed Origin POST → 403 (handler-enforced; not relay-dependent).
code=$(postO "$BAD_ORIGIN" "$(valid_payload "$(uuid)")"); [ "$code" = "403" ]; check "#44b disallowed Origin POST → 403" $? "$code"

# #45 no-Origin request (curl) still allowed through the CORS layer.
KNO=$(uuid); code=$(postNO "$(valid_payload "$KNO")")
{ [ "$code" = "200" ] && grep -q '"ok":true' /tmp/si_body; }; check "#45 no-Origin request allowed → 200" $? "$code $(cat /tmp/si_body)"

# #46 unexpected DB error → generic server response only (temp revoke INSERT, restore).
q "revoke insert on public.idea_submissions from service_role;" >/dev/null
K46=$(uuid); code=$(post "$(valid_payload "$K46")"); resp=$(cat /tmp/si_body)
q "grant insert on public.idea_submissions to service_role;" >/dev/null   # ALWAYS restore
{ [ "$code" = "500" ] && [ "$resp" = '{"ok":false,"error":"server"}' ]; }; check "#46 unexpected DB error → generic 500 (no leak)" $? "$code $resp"

echo ""
echo "== RESULT: ${PASSED} passed, ${FAILED} failed =="
[ "$FAILED" -eq 0 ]
