#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-3100}"
BASE_URL="http://127.0.0.1:${PORT}"
LOG_FILE="/tmp/career-smoke-server.log"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

cd "${ROOT_DIR}"

echo "[smoke] building web assets"
npm --prefix web run build >/tmp/career-smoke-web-build.log

echo "[smoke] starting server on port ${PORT}"
PORT="${PORT}" node src/server.js >"${LOG_FILE}" 2>&1 &
SERVER_PID=$!
sleep 1

echo "[smoke] health check"
curl -fsS "${BASE_URL}/health" | rg -q '"status":"ok"'

echo "[smoke] onboarding step: consent"
curl -fsS -X POST "${BASE_URL}/v1/onboarding/consent" \
  -H 'Content-Type: application/json' \
  -d '{"profiling_accepted":true,"market_data_linking_accepted":true,"research_opt_in":false}' \
  | rg -q '"saved":true'

echo "[smoke] onboarding step: goals"
curl -fsS -X POST "${BASE_URL}/v1/onboarding/goals" \
  -H 'Content-Type: application/json' \
  -d '{"goal_type":"switch_role","time_horizon_months":12,"time_per_week_hours":8,"salary_floor":85000,"location":"US-NYC","relocation_ok":true,"remote_only":false}' \
  | rg -q '"saved":true'

echo "[smoke] onboarding step: upload"
curl -fsS -X POST "${BASE_URL}/v1/onboarding/upload" \
  -F "pasted_history=Orbit Labs | Product Analyst | Jan 2022 - Present | Increased conversion by 12%" \
  -F "linkedin_url=linkedin.com/in/example-user" \
  | rg -q '"extracted_items"'

echo "[smoke] onboarding step: confirm"
curl -fsS -X POST "${BASE_URL}/v1/onboarding/confirm" \
  -H 'Content-Type: application/json' \
  -d '{"resume_items":[{"org":"Orbit Labs","role_title":"Product Analyst","start_date":"2022-01-01","end_date":null,"location":"US-NYC","achievements":["Increased conversion by 12%"],"tools":["SQL"],"self_claimed_skills":["Business Analytics"]}]}' \
  | rg -q '"saved_count":1'

echo "[smoke] onboarding step: quick preferences"
curl -fsS -X POST "${BASE_URL}/v1/onboarding/quick-preferences" \
  -H 'Content-Type: application/json' \
  -d '{"autonomy_vs_structure":64,"stability_vs_growth":58,"income_vs_impact":62,"team_vs_solo":55,"hands_on_vs_strategic":61}' \
  | rg -q '"saved":true'

echo "[smoke] onboarding step: first test"
START_PAYLOAD="$(curl -fsS -X POST "${BASE_URL}/v1/onboarding/first-test/start" -H 'Content-Type: application/json' -d '{}')"
ATTEMPT_ID="$(printf '%s\n' "${START_PAYLOAD}" | sed -n 's/.*"attempt_id":"\([^"]*\)".*/\1/p')"
if [[ -z "${ATTEMPT_ID}" ]]; then
  echo "[smoke] failed: attempt_id missing from first-test start payload"
  exit 1
fi

curl -fsS -X POST "${BASE_URL}/v1/assessments/events" \
  -H 'Content-Type: application/json' \
  -d "{\"attempt_id\":\"${ATTEMPT_ID}\",\"events\":[{\"t\":45000,\"name\":\"answer\",\"data\":{\"question_id\":\"problem_framing\",\"dimension\":\"reasoning\",\"rating\":5}},{\"t\":90000,\"name\":\"answer\",\"data\":{\"question_id\":\"execution_speed\",\"dimension\":\"execution\",\"rating\":4}},{\"t\":135000,\"name\":\"answer\",\"data\":{\"question_id\":\"communication\",\"dimension\":\"communication\",\"rating\":4}}]}" >/dev/null

curl -fsS -X POST "${BASE_URL}/v1/onboarding/first-test/complete" \
  -H 'Content-Type: application/json' \
  -d "{\"attempt_id\":\"${ATTEMPT_ID}\"}" \
  | rg -q '"starter_blueprint"'

echo "[smoke] onboarding completed check"
curl -fsS "${BASE_URL}/v1/onboarding/state" | rg -q '"next_step":"app-dashboard"'

echo "[smoke] app shell check"
curl -fsSI "${BASE_URL}/app/dashboard" | rg -q 'HTTP/1.1 200 OK'

echo "[smoke] PASS"
