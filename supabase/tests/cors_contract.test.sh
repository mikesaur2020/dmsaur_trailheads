#!/usr/bin/env bash
#
# CORS contract test for the public submit-idea Edge Function.
#
# WHY THIS EXISTS: the browser enforces a CORS preflight for the submit POST
# (Content-Type: application/json is not a "simple" content-type). The function
# allowlists ONLY `content-type` in Access-Control-Allow-Headers. If the frontend
# attaches any other custom header (e.g. apikey / Authorization), the browser's
# preflight fails and the POST never leaves the browser — while `curl` (which does
# NOT enforce CORS) still succeeds. That mismatch shipped the Phase 3A.2 bug.
#
# This test therefore guards the ROOT CAUSE deterministically:
#   A) STATIC — the frontend submit request sends no apikey/Authorization header.
#   B) LIVE   — the deployed function's preflight allows exactly the frontend's
#               header set (content-type) and NOT apikey/authorization.
#
# The definitive browser reproduction (fetch from the production origin: old
# headers => "TypeError: Failed to fetch"; content-type only => reaches the
# function) is documented in the Phase 3A.2 fix and can be re-run in a browser
# console on https://trailheads.dmsaur.com.

set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SVC="$ROOT/src/services/submitIdea.ts"
FURL="${FUNC_URL:-https://ejtqjqwfjcfetzovpbma.supabase.co/functions/v1/submit-idea}"
ORIGIN="${ORIGIN:-https://trailheads.dmsaur.com}"

PASS=0; FAIL=0
ok(){ echo "  PASS: $1"; PASS=$((PASS+1)); }
bad(){ echo "  FAIL: $1"; FAIL=$((FAIL+1)); }

echo "== A) STATIC: frontend submit sends only CORS-allowed headers =="
# The fetch in submitIdea.ts must NOT attach apikey or Authorization headers.
if grep -qiE '(^|[^a-z])apikey[[:space:]]*:|Authorization[[:space:]]*:' "$SVC"; then
  bad "submitIdea.ts attaches apikey/Authorization → browser CORS preflight will fail"
  grep -niE 'apikey|Authorization' "$SVC" | sed 's/^/      /'
else
  ok "submitIdea.ts attaches no apikey/Authorization header"
fi

echo "== B) LIVE: deployed function preflight contract =="
allow_headers(){ # $1 = Access-Control-Request-Headers value
  curl -s -D - -o /dev/null -X OPTIONS \
    -H "Origin: $ORIGIN" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: $1" \
    "$FURL" | tr -d '\r' | awk -F': ' 'tolower($1)=="access-control-allow-headers"{print tolower($2)}'
}

# The header set the FIXED frontend sends (content-type only) must be allowed.
ah=$(allow_headers "content-type")
echo "$ah" | grep -q 'content-type' && ok "preflight allows content-type (the frontend's only header)" || bad "content-type not in Allow-Headers (got: '$ah')"

# apikey / authorization must NOT be advertised as allowed (they aren't sent, and
# if the frontend regressed to sending them the browser would block the POST).
ah2=$(allow_headers "apikey,authorization,content-type")
{ ! echo "$ah2" | grep -qE 'apikey|authorization'; } && ok "preflight does NOT allow apikey/authorization (expected)" || bad "preflight unexpectedly allows apikey/authorization (got: '$ah2')"

echo ""
echo "== RESULT: ${PASS} passed, ${FAIL} failed =="
[ "$FAIL" -eq 0 ]
