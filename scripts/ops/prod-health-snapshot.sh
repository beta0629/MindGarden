#!/usr/bin/env bash
# 운영 헬스·디스크·로그 디렉터리 스냅샷 (읽기 전용).
# 코어 솔루션(MindGarden 백엔드) + OPS 포털(공개 URL) + 선택 systemd.
# 공개 URL은 환경변수로만 지정(기본값 있음). 비활성: MG_SKIP_PUBLIC_EDGE_CHECKS=1
# 기본 유닛: blue+green (레거시 mindgarden.service 는 masked — 기본에서 제외).
set -euo pipefail

# 유닛 목록: MG_SERVICE_NAMES(공백 구분) > MG_SERVICE_NAME(단일) > blue+green 기본.
# 예: MG_SERVICE_NAMES="mindgarden-core-blue.service mindgarden-core-green.service"
# 예: MG_SERVICE_NAME=mindgarden-core-blue.service
if [[ -n "${MG_SERVICE_NAMES:-}" ]]; then
    # shellcheck disable=SC2206
    _MG_SERVICES=(${MG_SERVICE_NAMES})
elif [[ -n "${MG_SERVICE_NAME:-}" ]]; then
    _MG_SERVICES=("${MG_SERVICE_NAME}")
else
    _MG_SERVICES=(mindgarden-core-blue.service mindgarden-core-green.service)
fi

# 전역 오버라이드가 있으면 모든 유닛에 동일 URL. 미설정 시 blue→8080 / green→8081.
MG_HEALTH_URL="${MG_HEALTH_URL:-}"
MG_LOG_DIRS="${MG_LOG_DIRS:-/var/log/mindgarden:/var/log/nginx}"
MG_HEALTH_CONNECT_TIMEOUT="${MG_HEALTH_CONNECT_TIMEOUT:-10}"
# Track3 stacking metrics (Hikari/JVM/Tomcat/heap). Best-effort; missing metrics never abort.
MG_METRIC_CONNECT_TIMEOUT="${MG_METRIC_CONNECT_TIMEOUT:-5}"
MG_INCLUDE_PROCESSLIST="${MG_INCLUDE_PROCESSLIST:-0}"
# Optional custom count-only command (must print "active=N total=M" or two integers). Never dump query text.
# MG_MYSQL_PROCESSLIST_CMD — set by operator; no hardcoded tenant DB names.

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

# 유닛명 → 로컬 actuator URL (MG_HEALTH_URL 이 있으면 그대로 사용).
mg_actuator_url_for() {
    local _unit="$1"
    if [[ -n "${MG_HEALTH_URL}" ]]; then
        echo "${MG_HEALTH_URL}"
        return 0
    fi
    local _base="${_unit%.service}"
    case "${_base}" in
        mindgarden-core-blue)
            echo "http://127.0.0.1:8080/actuator/health"
            ;;
        mindgarden-core-green)
            echo "http://127.0.0.1:8081/actuator/health"
            ;;
        *)
            echo "http://127.0.0.1:8080/actuator/health"
            ;;
    esac
}

# health URL → metrics base (…/actuator/metrics).
mg_metrics_url_from_health() {
    local _health="$1"
    case "${_health}" in
        */actuator/health)
            echo "${_health%/actuator/health}/actuator/metrics"
            ;;
        */actuator/health/)
            echo "${_health%/actuator/health/}/actuator/metrics"
            ;;
        */health)
            echo "${_health%/health}/metrics"
            ;;
        *)
            echo "${_health%/}/actuator/metrics"
            ;;
    esac
}

# Extract listen port from actuator URL for summary lines (best-effort).
mg_port_from_url() {
    local _url="$1"
    if [[ "${_url}" =~ :([0-9]+)(/|$) ]]; then
        echo "${BASH_REMATCH[1]}"
    else
        echo "?"
    fi
}

# Curl one Micrometer metric value (measurements[0].value). Never fails the script; never logs secrets.
# Args: base_metrics_url metric_name [query_string without ?]
mg_curl_metric_value() {
    local _base="$1"
    local _name="$2"
    local _query="${3:-}"
    local _url="${_base%/}/${_name}"
    if [[ -n "${_query}" ]]; then
        _url="${_url}?${_query}"
    fi
    set +e
    local _body
    _body=$(curl -sS --connect-timeout "${MG_METRIC_CONNECT_TIMEOUT}" \
        --max-time "${MG_METRIC_CONNECT_TIMEOUT}" "${_url}" 2>/dev/null)
    local _ce=$?
    set -e
    if [[ ${_ce} -ne 0 || -z "${_body}" ]]; then
        echo "(unavailable)"
        return 0
    fi
    local _val=""
    if command -v python3 >/dev/null 2>&1; then
        set +e
        _val=$(printf '%s' "${_body}" | python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
    m = d.get("measurements") or []
    if m and "value" in m[0]:
        print(m[0]["value"])
    else:
        print("(unavailable)")
except Exception:
    print("(unavailable)")
' 2>/dev/null)
        set -e
    elif command -v jq >/dev/null 2>&1; then
        set +e
        _val=$(printf '%s' "${_body}" | jq -r '.measurements[0].value // "(unavailable)"' 2>/dev/null)
        set -e
    else
        set +e
        _val=$(printf '%s' "${_body}" | grep -oE '"value"[[:space:]]*:[[:space:]]*-?[0-9.eE+-]+' | head -n1 | grep -oE '-?[0-9.eE+-]+$')
        set -e
        if [[ -z "${_val}" ]]; then
            _val="(unavailable)"
        fi
    fi
    if [[ -z "${_val}" || "${_val}" == "null" ]]; then
        echo "(unavailable)"
    else
        echo "${_val}"
    fi
}

# Optional heap_pct from used/max when both numeric.
mg_heap_pct() {
    local _used="$1"
    local _max="$2"
    if [[ "${_used}" =~ ^[0-9.]+$ && "${_max}" =~ ^[0-9.]+$ ]]; then
        # awk avoids bc dependency
        awk -v u="${_used}" -v m="${_max}" 'BEGIN { if (m+0 > 0) printf "%.1f", (u/m)*100; else print "(unavailable)" }'
    else
        echo "(unavailable)"
    fi
}

# Optional processlist counts only (never dump SQL text / credentials).
mg_processlist_counts() {
    if [[ -n "${MG_MYSQL_PROCESSLIST_CMD:-}" ]]; then
        set +e
        local _out
        _out=$(eval "${MG_MYSQL_PROCESSLIST_CMD}" 2>/dev/null)
        local _ce=$?
        set -e
        if [[ ${_ce} -ne 0 || -z "${_out}" ]]; then
            echo "processlist: skipped (MG_MYSQL_PROCESSLIST_CMD failed or empty)"
            return 0
        fi
        # Accept "active=N total=M" or first two integers
        if [[ "${_out}" =~ active=([0-9]+)[[:space:]]+total=([0-9]+) ]]; then
            echo "processlist: active=${BASH_REMATCH[1]} total=${BASH_REMATCH[2]}"
            return 0
        fi
        local _a _t
        _a=$(printf '%s' "${_out}" | grep -oE '[0-9]+' | head -n1)
        _t=$(printf '%s' "${_out}" | grep -oE '[0-9]+' | head -n2 | tail -n1)
        if [[ -n "${_a}" && -n "${_t}" ]]; then
            echo "processlist: active=${_a} total=${_t}"
        else
            echo "processlist: skipped (unparseable MG_MYSQL_PROCESSLIST_CMD output)"
        fi
        return 0
    fi
    if ! command -v mysql >/dev/null 2>&1; then
        echo "processlist: skipped (mysql client not found; set MG_MYSQL_PROCESSLIST_CMD or install mysql)"
        return 0
    fi
    # Credentials via standard mysql env / defaults file only — no hardcoded tenant DB names.
    if [[ -z "${MYSQL_PWD:-}" && -z "${MYSQL_HOST:-}" && ! -f "${HOME}/.my.cnf" && -z "${MG_MYSQL_DEFAULTS_EXTRA_FILE:-}" ]]; then
        echo "processlist: skipped (no MYSQL_* / ~/.my.cnf / MG_MYSQL_DEFAULTS_EXTRA_FILE)"
        return 0
    fi
    local _mysql_args=()
    if [[ -n "${MG_MYSQL_DEFAULTS_EXTRA_FILE:-}" ]]; then
        _mysql_args+=(--defaults-extra-file="${MG_MYSQL_DEFAULTS_EXTRA_FILE}")
    fi
    if [[ -n "${MYSQL_HOST:-}" ]]; then
        _mysql_args+=(-h "${MYSQL_HOST}")
    fi
    if [[ -n "${MYSQL_PORT:-}" ]]; then
        _mysql_args+=(-P "${MYSQL_PORT}")
    fi
    if [[ -n "${MYSQL_USER:-}" ]]; then
        _mysql_args+=(-u "${MYSQL_USER}")
    fi
    set +e
    local _counts
    _counts=$(mysql "${_mysql_args[@]}" -N -e \
        "SELECT SUM(COMMAND != 'Sleep'), COUNT(*) FROM information_schema.processlist;" 2>/dev/null)
    local _ce=$?
    set -e
    if [[ ${_ce} -ne 0 || -z "${_counts}" ]]; then
        echo "processlist: skipped (mysql query failed; check credentials/env — no secrets logged)"
        return 0
    fi
    local _active _total
    _active=$(printf '%s' "${_counts}" | awk '{print $1}')
    _total=$(printf '%s' "${_counts}" | awk '{print $2}')
    echo "processlist: active=${_active:-?} total=${_total:-?}"
}

# Collect Track3 stacking metrics for one actuator health URL (read-only, best-effort).
mg_collect_stacking_for_health() {
    local _svc="$1"
    local _health_url="$2"
    local _metrics_base
    _metrics_base="$(mg_metrics_url_from_health "${_health_url}")"
    local _port
    _port="$(mg_port_from_url "${_health_url}")"

    echo "--- stacking metrics (${_svc}, port=${_port}) ---"
    echo "metrics base: ${_metrics_base}"

    local hikari_active hikari_idle hikari_pending hikari_max
    local jvm_threads_live jvm_threads_peak
    local tomcat_busy tomcat_current
    local heap_used heap_max heap_pct

    hikari_active="$(mg_curl_metric_value "${_metrics_base}" "hikaricp.connections.active")"
    hikari_idle="$(mg_curl_metric_value "${_metrics_base}" "hikaricp.connections.idle")"
    hikari_pending="$(mg_curl_metric_value "${_metrics_base}" "hikaricp.connections.pending")"
    hikari_max="$(mg_curl_metric_value "${_metrics_base}" "hikaricp.connections.max")"
    jvm_threads_live="$(mg_curl_metric_value "${_metrics_base}" "jvm.threads.live")"
    jvm_threads_peak="$(mg_curl_metric_value "${_metrics_base}" "jvm.threads.peak")"
    tomcat_busy="$(mg_curl_metric_value "${_metrics_base}" "tomcat.threads.busy")"
    tomcat_current="$(mg_curl_metric_value "${_metrics_base}" "tomcat.threads.current")"
    heap_used="$(mg_curl_metric_value "${_metrics_base}" "jvm.memory.used" "tag=area:heap")"
    heap_max="$(mg_curl_metric_value "${_metrics_base}" "jvm.memory.max" "tag=area:heap")"
    heap_pct="$(mg_heap_pct "${heap_used}" "${heap_max}")"

    echo "hikari.active=${hikari_active} idle=${hikari_idle} pending=${hikari_pending} max=${hikari_max}"
    echo "jvm.threads.live=${jvm_threads_live} peak=${jvm_threads_peak}"
    echo "tomcat.threads.busy=${tomcat_busy} current=${tomcat_current}"
    echo "heap.used=${heap_used} max=${heap_max} pct=${heap_pct}"

    echo "--- stacking check summary (read-only) ---"
    echo "port=${_port} hikari_active=${hikari_active} hikari_idle=${hikari_idle} hikari_pending=${hikari_pending} hikari_max=${hikari_max} jvm_threads_live=${jvm_threads_live} jvm_threads_peak=${jvm_threads_peak} tomcat_busy=${tomcat_busy} tomcat_current=${tomcat_current} heap_used=${heap_used} heap_max=${heap_max} heap_pct=${heap_pct}"
    echo ""
}

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

for _svc in "${_MG_SERVICES[@]}"; do
    echo "--- Core Solution (MindGarden) — systemctl (${_svc}) ---"
    _svc_state=$(systemctl is-active "$_svc" 2>&1 || true)
    echo "${_svc_state}"
    echo ""
done

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
for _svc in "${_MG_SERVICES[@]}"; do
    _act_url="$(mg_actuator_url_for "${_svc}")"
    curl_health "actuator (${_svc})" "${_act_url}"
done

# Track3: Hikari / JVM threads / Tomcat / heap stacking (read-only, best-effort).
echo "=== Track3 stacking observability (read-only) ==="
for _svc in "${_MG_SERVICES[@]}"; do
    _act_url="$(mg_actuator_url_for "${_svc}")"
    mg_collect_stacking_for_health "${_svc}" "${_act_url}"
done

if [[ "${MG_INCLUDE_PROCESSLIST}" == "1" || -n "${MG_MYSQL_PROCESSLIST_CMD:-}" ]]; then
    echo "--- optional processlist counts (read-only) ---"
    mg_processlist_counts
    echo ""
else
    echo "--- optional processlist — skipped (set MG_INCLUDE_PROCESSLIST=1 or MG_MYSQL_PROCESSLIST_CMD) ---"
    echo ""
fi

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
    for _svc in "${_MG_SERVICES[@]}"; do
        echo "--- journalctl (${_svc}, last ${MG_JOURNAL_LINES} lines, redacted) ---"
        set +e
        journalctl -u "${_svc}" --no-pager -n "${MG_JOURNAL_LINES}" 2>&1 | mg_redact_log_stream | head -n "${MG_JOURNAL_OUT_MAX_LINES}"
        _jc="${PIPESTATUS[0]}"
        set -e
        if [[ ${_jc} -ne 0 && ${_jc} -ne 141 ]]; then
            echo "(journalctl exited ${_jc})"
        fi
        echo ""
    done
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
