#!/usr/bin/env bash
# 운영 헬스·디스크·로그 디렉터리 스냅샷 (읽기 전용).
# 코어 솔루션(MindGarden 백엔드) + OPS 포털(공개 URL) + 선택 systemd.
# 공개 URL은 환경변수로만 지정(기본값 있음). 비활성: MG_SKIP_PUBLIC_EDGE_CHECKS=1
set -euo pipefail

MG_SERVICE_NAME="${MG_SERVICE_NAME:-mindgarden.service}"
MG_HEALTH_URL="${MG_HEALTH_URL:-http://127.0.0.1:8080/actuator/health}"
MG_LOG_DIRS="${MG_LOG_DIRS:-/var/log/mindgarden:/var/log/nginx}"
MG_HEALTH_CONNECT_TIMEOUT="${MG_HEALTH_CONNECT_TIMEOUT:-10}"

# journalctl / memory-alert (선택). GNU sed -E 기준(운영 Linux). 마스킹 후 줄 상한 적용.
MG_JOURNAL_LINES="${MG_JOURNAL_LINES:-50}"
MG_JOURNAL_OUT_MAX_LINES="${MG_JOURNAL_OUT_MAX_LINES:-80}"
MG_MEMORY_ALERT_CANDIDATES="${MG_MEMORY_ALERT_CANDIDATES:-/var/log/mindgarden/memory-alert.log:/var/www/mindgarden/logs/memory-alert.log}"
MG_MEMORY_ALERT_TAIL_LINES="${MG_MEMORY_ALERT_TAIL_LINES:-30}"
MG_MEMORY_ALERT_OUT_MAX_LINES="${MG_MEMORY_ALERT_OUT_MAX_LINES:-80}"

# OPS 포털 / 코어 공개 엣지. 명시적으로 빈 문자열이면 해당 curl 생략(기본값은 - 만 사용: unset일 때만 채움).
OPS_PORTAL_HEALTH_URL="${OPS_PORTAL_HEALTH_URL-https://ops.e-trinity.co.kr/api/v1/health/server}"
CORE_EDGE_HEALTH_URL="${CORE_EDGE_HEALTH_URL-https://mindgarden.core-solution.co.kr/api/v1/health/server}"

# 별도 ops-backend 유닛이 있는 호스트만 설정 (예: ops-backend.service). 미설정 시 블록 생략.
OPS_BACKEND_SERVICE="${OPS_BACKEND_SERVICE:-}"

# stdin 한 줄씩: Authorization·Bearer·password/token/secret=·이메일·JWT 형태 문자열 과마스킹.
mg_redact_log_stream() {
    sed -E \
        -e 's/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/[REDACTED-jwt]/g' \
        -e 's/(Bearer[[:space:]]+)[^[:space:]]+/\1[REDACTED]/gi' \
        -e 's/(Authorization:[[:space:]]*)[^[:cntrl:]]*/\1[REDACTED]/gi' \
        -e 's/(password|token|secret)=[^[:space:]]*/\1=[REDACTED]/gi' \
        -e 's/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/[REDACTED]@email/g'
}

curl_health() {
    local _label="$1"
    local _url="$2"
    [[ -z "$_url" ]] && return 0
    echo "--- ${_label} ---"
    echo "URL: ${_url}"
    set +e
    local _http_code
    _http_code=$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout "$MG_HEALTH_CONNECT_TIMEOUT" "$_url" 2>/dev/null)
    local _ce=$?
    set -e
    if [[ $_ce -ne 0 ]]; then
        echo "HTTP check failed: curl exit ${_ce}"
    else
        echo "HTTP ${_http_code}"
    fi
    echo ""
}

echo "=== Core Solution & OPS — prod health snapshot ==="
echo "Time (UTC): $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

echo "--- Core Solution (MindGarden) — systemctl (${MG_SERVICE_NAME}) ---"
_svc_state=$(systemctl is-active "$MG_SERVICE_NAME" 2>&1 || true)
echo "${_svc_state}"
echo ""

if [[ -n "${OPS_BACKEND_SERVICE}" ]]; then
    echo "--- OPS backend — systemctl (${OPS_BACKEND_SERVICE}) ---"
    _ops_svc=$(systemctl is-active "$OPS_BACKEND_SERVICE" 2>&1 || true)
    echo "${_ops_svc}"
    echo ""
fi

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

echo "--- Core Solution — local actuator (JVM 직접) ---"
curl_health "actuator" "$MG_HEALTH_URL"

if [[ -z "${MG_SKIP_PUBLIC_EDGE_CHECKS:-}" ]]; then
    if [[ -n "$OPS_PORTAL_HEALTH_URL" ]]; then
        echo "--- OPS 포털 — 공개 URL (nginx / TLS 경로 포함) ---"
        curl_health "OPS portal" "$OPS_PORTAL_HEALTH_URL"
    fi

    if [[ -n "$CORE_EDGE_HEALTH_URL" ]]; then
        echo "--- Core Solution — 공개 엣지 URL ---"
        curl_health "Core edge" "$CORE_EDGE_HEALTH_URL"
    fi
else
    echo "--- 공개 엣지 HTTP (OPS/Core) — MG_SKIP_PUBLIC_EDGE_CHECKS=1 로 생략 ---"
    echo ""
fi

if ! command -v journalctl >/dev/null 2>&1; then
    echo "--- journalctl — skipped (journalctl not found) ---"
    echo ""
elif [[ "${MG_SKIP_JOURNAL:-0}" == "1" ]]; then
    echo "--- journalctl — skipped (MG_SKIP_JOURNAL=1) ---"
    echo ""
else
    echo "--- journalctl (${MG_SERVICE_NAME}, last ${MG_JOURNAL_LINES} lines, redacted) ---"
    set +e
    journalctl -u "${MG_SERVICE_NAME}" --no-pager -n "${MG_JOURNAL_LINES}" 2>&1 | mg_redact_log_stream | head -n "${MG_JOURNAL_OUT_MAX_LINES}"
    _jc="${PIPESTATUS[0]}"
    set -e
    if [[ ${_jc} -ne 0 && ${_jc} -ne 141 ]]; then
        echo "(journalctl exited ${_jc})"
    fi
    echo ""
fi

_memory_file=""
IFS=':' read -r -a _mem_cands <<< "${MG_MEMORY_ALERT_CANDIDATES}"
for _mp in "${_mem_cands[@]}"; do
    [[ -z "$_mp" ]] && continue
    if [[ -f "$_mp" ]]; then
        _memory_file="${_mp}"
        break
    fi
done
if [[ -z "${_memory_file}" ]]; then
    echo "--- memory-alert: no file ---"
else
    echo "--- memory-alert.log (tail ${MG_MEMORY_ALERT_TAIL_LINES}, redacted) ---"
    echo "file: ${_memory_file}"
    set +e
    tail -n "${MG_MEMORY_ALERT_TAIL_LINES}" "${_memory_file}" 2>&1 | mg_redact_log_stream | head -n "${MG_MEMORY_ALERT_OUT_MAX_LINES}"
    _tc="${PIPESTATUS[0]}"
    set -e
    if [[ ${_tc} -ne 0 && ${_tc} -ne 141 ]]; then
        echo "(tail exited ${_tc})"
    fi
fi
echo ""

echo "=== snapshot end ==="
