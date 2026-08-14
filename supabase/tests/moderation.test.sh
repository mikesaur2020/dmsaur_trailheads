#!/usr/bin/env bash
#
# DMSaur Trailheads — Phase 3B moderation backend tests (LOCAL stack only).
#
# Verifies: is_moderator() gating, moderator-only RLS SELECT on the private queue
# and moderation_events, reject_submission, approve_submission (which reuses the
# existing publish_submission path), and that publish_submission stays owner-only.
#
# Simulates an authenticated user in psql via `set role authenticated` +
# `set request.jwt.claim.sub = <uuid>` (what auth.uid() reads). Two auth users
# are created through the local admin API so the moderators FK is satisfied.
#
# Prereqs: supabase start; supabase db reset (applies the moderation migration).
# Run: bash supabase/tests/moderation.test.sh

set -uo pipefail
eval "$(npx --no-install supabase status -o env 2>/dev/null)"
API_URL="${API_URL:-http://127.0.0.1:54321}"
DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

PASS=0; FAIL=0
ok(){ echo "  PASS: $1"; PASS=$((PASS+1)); }
bad(){ echo "  FAIL: $1 ${2:+→ $2}"; FAIL=$((FAIL+1)); }
chk(){ [ "$2" = "$3" ] && ok "$1" || bad "$1" "got '$2' want '$3'"; }
q(){ psql "$DB_URL" -tAqc "$1" 2>/dev/null; }
# Run a statement AS an authenticated user with a given jwt sub; prints result.
# ON_ERROR_STOP makes psql exit non-zero on a SQL error so denial checks work.
as_user(){ # $1=uuid $2=sql
  psql "$DB_URL" -tAq -v ON_ERROR_STOP=1 2>/dev/null <<SQL
set role authenticated;
set request.jwt.claim.sub = '$1';
$2
SQL
}
as_anon(){ psql "$DB_URL" -tAq -v ON_ERROR_STOP=1 2>/dev/null <<SQL
set role anon;
$1
SQL
}
create_user(){ # $1=email -> prints uuid
  curl -s -X POST "${API_URL}/auth/v1/admin/users" \
    -H "apikey: ${SERVICE_ROLE_KEY}" -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"Passw0rd!23\",\"email_confirm\":true}" \
    | python3 -c "import sys,json;print(json.load(sys.stdin).get('id',''))" 2>/dev/null
}

echo "== setup: create moderator + non-moderator auth users, a pending submission =="
MOD=$(create_user "mod-$(uuidgen|tr A-Z a-z|cut -c1-8)@test.local")
NON=$(create_user "non-$(uuidgen|tr A-Z a-z|cut -c1-8)@test.local")
[ -n "$MOD" ] && [ -n "$NON" ] && ok "created two auth users" || { bad "could not create auth users (MOD='$MOD' NON='$NON')"; echo "== RESULT: ${PASS} passed, $((FAIL+1)) failed =="; exit 1; }
q "insert into public.moderators(id) values ('$MOD');" >/dev/null
SID=$(q "insert into public.idea_submissions(status,problem_statement,who_experiences_it,recognition,contributor_display,contact_consent,contact_email,idempotency_key) values('pending','a real problem worth reviewing here','van lifers','first-name','Dana R.',true,'dana@example.com',gen_random_uuid()) returning id;")
[ -n "$SID" ] && ok "seeded a pending submission" || bad "seed failed"

echo "== is_moderator() gating =="
chk "moderator uid → is_moderator true" "$(as_user "$MOD" 'select public.is_moderator();')" "t"
chk "non-moderator uid → is_moderator false" "$(as_user "$NON" 'select public.is_moderator();')" "f"
as_anon "select public.is_moderator();" >/dev/null 2>&1; [ $? -ne 0 ] && ok "anon cannot execute is_moderator (no grant)" || bad "anon executed is_moderator"

echo "== RLS: moderator-only reads =="
chk "moderator SELECT queue → sees rows" "$(as_user "$MOD" 'select count(*)>0 from public.idea_submissions;')" "t"
chk "non-moderator SELECT queue → 0 rows" "$(as_user "$NON" 'select count(*) from public.idea_submissions;')" "0"
as_anon "select count(*) from public.idea_submissions;" >/dev/null 2>&1; [ $? -ne 0 ] && ok "anon SELECT queue denied" || bad "anon read the queue"
chk "moderator SELECT moderation_events ok" "$(as_user "$MOD" 'select count(*)>=0 from public.moderation_events;')" "t"
chk "non-moderator SELECT moderation_events → 0" "$(as_user "$NON" 'select count(*) from public.moderation_events;')" "0"

echo "== reject_submission (moderator-gated, never deletes) =="
RS=$(q "insert into public.idea_submissions(status,problem_statement,recognition,contributor_display,idempotency_key) values('pending','a submission to be rejected here','anonymous',null,gen_random_uuid()) returning id;")
as_user "$NON" "select public.reject_submission('$RS','x');" >/dev/null 2>&1; [ $? -ne 0 ] && ok "non-moderator reject denied" || bad "non-moderator rejected"
as_user "$MOD" "select public.reject_submission('$RS','not a fit');" >/dev/null 2>&1 && ok "moderator reject succeeded" || bad "moderator reject failed"
chk "rejected row status='rejected'" "$(q "select status from public.idea_submissions where id='$RS';")" "rejected"
chk "rejection note stored" "$(q "select rejection_reason from public.idea_submissions where id='$RS';")" "not a fit"
chk "rejected row NOT deleted (still exists)" "$(q "select count(*) from public.idea_submissions where id='$RS';")" "1"
chk "reject logged an event" "$(q "select count(*) from public.moderation_events where submission_id='$RS' and action='rejected';")" "1"

echo "== approve_submission → reuses publish_submission =="
as_user "$NON" "select public.approve_submission('$SID','T','S','technology');" >/dev/null 2>&1; [ $? -ne 0 ] && ok "non-moderator approve denied" || bad "non-moderator approved"
IID=$(as_user "$MOD" "select public.approve_submission('$SID','Fresh water level is a guess','RV gauges are coarse','camping-rv');")
[ -n "$IID" ] && ok "moderator approve returned an idea id" || bad "approve failed"
chk "submission status → published" "$(q "select status from public.idea_submissions where id='$SID';")" "published"
chk "published_idea_id linked" "$(q "select published_idea_id from public.idea_submissions where id='$SID';")" "$IID"
chk "public ideas row created" "$(q "select count(*) from public.ideas where id='$IID';")" "1"
chk "initial idea_status_events row created" "$(q "select count(*) from public.idea_status_events where idea_id='$IID';")" "1"
chk "approve logged a 'published' event" "$(q "select count(*) from public.moderation_events where submission_id='$SID' and action='published';")" "1"

echo "== publish_submission() stays owner-only =="
as_user "$MOD" "select public.publish_submission('$SID','x','y','technology');" >/dev/null 2>&1; [ $? -ne 0 ] && ok "authenticated cannot EXECUTE publish_submission directly" || bad "authenticated executed publish_submission"

echo "== moderators table is locked =="
as_user "$MOD" "select count(*) from public.moderators;" >/dev/null 2>&1; [ $? -ne 0 ] && ok "moderator cannot read moderators table directly" || bad "moderators table readable by authenticated"

echo ""
echo "== RESULT: ${PASS} passed, ${FAIL} failed =="
[ "$FAIL" -eq 0 ]
