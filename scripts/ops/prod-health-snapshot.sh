#!/usr/bin/env bash
# 운영 헬스·디스크·로그 디렉터리 스냅샷 (읽기 전용).
# 호스트/IP 하드코딩 없음. 로컬 또는 SSH 세션에서 환경변수만으로 실행.
set -euo pipefail

MG_SERVICE_NAME="${MG_SERVICE_NAME:-mindgarden.service}"
MG_HEALTH_URL="${MG_HEALTH_URL:-http://127.0.0.1:8080/actuator/health}"
MG_LOG_DIRS="${MG_LOG_DIRS:-/var/log/mindgarden}"
MG_HEALTH_CONNECT_TIMEOUT="${MG_HEALTH_CONNECT_TIMEOUT:-10}"

echo "=== MindGarden prod health snapshot ==="
echo "Time (UTC): $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

echo "--- systemctl is-active (${MG_SERVICE_NAME}) ---"
_svc_state=$(systemctl is-active "$MG_SERVICE_NAME" 2>&1 || true)
echo "${_svc_state}"
echo ""

echo "--- df -h ---"
df -h
echo ""

echo "--- df -i ---"
df -i
echo ""

echo "--- log directories (du -sh) ---"
IFS=':' read -r -a _log_dirs <<< "${MG_LOG_DIRS}"
for _dir in "${_log_dirs[@]}"; do
    [[ -z "$_dir" ]] && continue
    if [[ -d "$_dir" ]]; then
        echo -n "${_dir}: "
        du -sh "$_dir" 2>/dev/null || echo "(unreadable)"
    else
        echo "${_dir}: (not a directory or missing)"
    fi
done
echo ""

echo "--- HTTP health (${MG_HEALTH_URL}) ---"
set +e
_http_code=$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout "$MG_HEALTH_CONNECT_TIMEOUT" "$MG_HEALTH_URL" 2>/dev/null)
_curl_exit=$?
set -e
if [[ $_curl_exit -ne 0 ]]; then
    echo "HTTP check failed: curl exit ${_curl_exit} (no response code)"
else
    echo "HTTP ${_http_code}"
fi
echo ""
echo "=== snapshot end ==="
