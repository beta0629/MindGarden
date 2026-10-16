#!/usr/bin/env bash
# 개발 서버 기동 후 검증: PID 변경 + actuator git.commit 또는 실행 중 JAR sha256.
#
# 사용:
#   verify-dev-running-build.sh \
#     --pre-pid "$PRE_PID" \
#     --deploy-jar-sha "$DEPLOY_JAR_SHA" \
#     --github-sha "$GITHUB_SHA" \
#     --unit mindgarden-dev.service \
#     --app-jar /var/www/mindgarden-dev/app.jar \
#     --info-url http://127.0.0.1:8080/actuator/info
#
# 종료 코드:
#   0  — post-start verify OK
#   1  — PID unchanged / git mismatch / jar mismatch / 인자·도구 누락
#
# 로그에는 SHA/commit 접두 12자만 출력. 시크릿 없음.
set -euo pipefail

PRE_PID=""
DEPLOY_JAR_SHA=""
GITHUB_SHA=""
UNIT="mindgarden-dev.service"
APP_JAR="/var/www/mindgarden-dev/app.jar"
INFO_URL="http://127.0.0.1:8080/actuator/info"

usage() {
  cat <<'EOF'
Usage: verify-dev-running-build.sh \
  --pre-pid <pid> \
  --deploy-jar-sha <sha256> \
  --github-sha <sha> \
  [--unit mindgarden-dev.service] \
  [--app-jar /var/www/mindgarden-dev/app.jar] \
  [--info-url http://127.0.0.1:8080/actuator/info]

Verify post-start: MainPID changed, then git.commit.id matches GITHUB_SHA
(or, if git commit missing, running -jar sha256 matches --deploy-jar-sha).
EOF
}

prefix12() {
  local s="${1:-}"
  if [ "${#s}" -ge 12 ]; then
    printf '%s' "${s:0:12}"
  else
    printf '%s' "$s"
  fi
}

# full or prefix match either way
sha_matches() {
  local a="$1" b="$2"
  if [ -z "$a" ] || [ -z "$b" ]; then
    return 1
  fi
  case "$a" in
    "$b"|"$b"*) return 0 ;;
  esac
  case "$b" in
    "$a"|"$a"*) return 0 ;;
  esac
  return 1
}

extract_git_commit() {
  local json="$1"
  # heredoc keeps indentation safe (unlike workflow-inline python3 -c).
  # JSON is argv[1] so the heredoc can own stdin.
  python3 - "$json" <<'PY'
import json
import sys

try:
    data = json.loads(sys.argv[1] if len(sys.argv) > 1 else "{}")
except Exception:
    data = {}


def dig(obj, *keys):
    cur = obj
    for key in keys:
        if not isinstance(cur, dict):
            return ""
        cur = cur.get(key)
    if isinstance(cur, str):
        return cur
    return ""


commit = (
    dig(data, "git", "commit", "id")
    or dig(data, "git", "commit", "id", "full")
    or ""
)
print(commit or "")
PY
}

resolve_running_jar() {
  local pid="$1"
  local cmdline_file="/proc/${pid}/cmdline"
  local cwd_link="/proc/${pid}/cwd"
  if [ ! -r "$cmdline_file" ]; then
    echo ""
    return 0
  fi
  local -a args=()
  # null-separated cmdline → bash array
  while IFS= read -r -d '' arg; do
    args+=("$arg")
  done <"$cmdline_file" || true
  local i jar=""
  for ((i = 0; i < ${#args[@]}; i++)); do
    if [ "${args[$i]}" = "-jar" ] && [ $((i + 1)) -lt ${#args[@]} ]; then
      jar="${args[$((i + 1))]}"
      break
    fi
  done
  if [ -z "$jar" ]; then
    echo ""
    return 0
  fi
  if [[ "$jar" != /* ]]; then
    local cwd
    cwd="$(readlink -f "$cwd_link" 2>/dev/null || true)"
    if [ -n "$cwd" ]; then
      jar="${cwd}/${jar}"
    fi
  fi
  printf '%s' "$jar"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --pre-pid)
      PRE_PID="${2:-}"
      shift 2
      ;;
    --deploy-jar-sha)
      DEPLOY_JAR_SHA="${2:-}"
      shift 2
      ;;
    --github-sha)
      GITHUB_SHA="${2:-}"
      shift 2
      ;;
    --unit)
      UNIT="${2:-}"
      shift 2
      ;;
    --app-jar)
      APP_JAR="${2:-}"
      shift 2
      ;;
    --info-url)
      INFO_URL="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "::error::unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

if [ -z "$PRE_PID" ] || [ -z "$DEPLOY_JAR_SHA" ]; then
  echo "::error::--pre-pid and --deploy-jar-sha are required"
  usage
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "::error::python3 required for actuator/info parse"
  exit 1
fi

POST_PID="$(sudo systemctl show -p MainPID --value "$UNIT" 2>/dev/null || echo 0)"
if [ -z "$POST_PID" ]; then
  POST_PID=0
fi

echo "🔍 post-start verify PRE=$(prefix12 "$PRE_PID") POST=$(prefix12 "$POST_PID") unit=$UNIT"

if [ "${PRE_PID}" != "0" ] && [ -n "$PRE_PID" ] && [ "$POST_PID" = "$PRE_PID" ]; then
  echo "::error::PID unchanged after restart (PRE=$PRE_PID POST=$POST_PID)"
  exit 1
fi

INFO_JSON="$(curl -fsS --max-time 8 "$INFO_URL" 2>/dev/null || echo '{}')"
GIT_COMMIT="$(extract_git_commit "$INFO_JSON")"

# Always log both values on one line (full SHAs — not secrets).
COMMIT_MATCH=false
if [ -n "$GIT_COMMIT" ] && [ -n "${GITHUB_SHA:-}" ] && sha_matches "$GIT_COMMIT" "$GITHUB_SHA"; then
  COMMIT_MATCH=true
fi
echo "running_commit=${GIT_COMMIT:-} expected=${GITHUB_SHA:-} match=${COMMIT_MATCH}"

if [ -n "$GIT_COMMIT" ]; then
  if [ -z "${GITHUB_SHA:-}" ]; then
    echo "::error::git.commit present but --github-sha empty (git_prefix=$(prefix12 "$GIT_COMMIT"))"
    exit 1
  fi
  if [ "$COMMIT_MATCH" != "true" ]; then
    echo "::error::git.commit mismatch git_prefix=$(prefix12 "$GIT_COMMIT") github_prefix=$(prefix12 "$GITHUB_SHA")"
    exit 1
  fi
  echo "✅ post-start verify OK (git.commit) PRE=${PRE_PID} POST=${POST_PID} git_prefix=$(prefix12 "$GIT_COMMIT") github_prefix=$(prefix12 "$GITHUB_SHA")"
  exit 0
fi

echo "ℹ️ git.commit empty — fallback to running jar sha256 (app-jar ref=$(prefix12 "$APP_JAR"))"
if [ "${POST_PID}" = "0" ] || [ ! -d "/proc/${POST_PID}" ]; then
  echo "::error::POST_PID missing/invalid for jar fallback (POST=${POST_PID})"
  exit 1
fi

RUN_JAR="$(resolve_running_jar "$POST_PID")"
if [ -z "$RUN_JAR" ] || [ ! -f "$RUN_JAR" ]; then
  echo "::error::running jar not found via /proc/${POST_PID}/cmdline (-jar)"
  exit 1
fi

RUN_JAR_SHA="$(sha256sum "$RUN_JAR" | awk '{print $1}')"
if [ "$RUN_JAR_SHA" != "$DEPLOY_JAR_SHA" ]; then
  echo "::error::running jar sha mismatch run_prefix=$(prefix12 "$RUN_JAR_SHA") deploy_prefix=$(prefix12 "$DEPLOY_JAR_SHA") path=$RUN_JAR"
  exit 1
fi

echo "✅ post-start verify OK (jar sha fallback) PRE=${PRE_PID} POST=${POST_PID} jar_prefix=$(prefix12 "$DEPLOY_JAR_SHA") path=$RUN_JAR"
exit 0
