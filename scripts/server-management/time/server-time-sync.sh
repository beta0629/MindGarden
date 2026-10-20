#!/usr/bin/env bash
# 서버 시각 진단(diagnose) / slew-only 적용(apply)
#
# 사용법: sudo bash server-time-sync.sh <diagnose|apply>
#
# 주의:
# - app JAR / DB / nginx 설정·서비스에 손대지 않음
# - 시크릿·키를 로그에 출력하지 않음
# - apply 는 slew-only: date -s / chronyc makestep / 강제 스텝 금지
# - makestep -1 -1 로 스텝 비활성, maxslewrate 로 슬루 상한

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=server-time-sync-lib.sh
. "$SCRIPT_DIR/server-time-sync-lib.sh"

MODE_RAW="${1:-}"
MODE="$(sts_validate_mode "$MODE_RAW")" || exit $?

# 런타임 경로 (테스트에서 오버라이드 가능)
STS_CHRONY_CONFD="${STS_CHRONY_CONFD:-/etc/chrony/conf.d}"
STS_CHRONY_DROPIN="${STS_CHRONY_DROPIN:-$STS_CHRONY_CONFD/99-mindgarden-time-sync.conf}"
STS_CHRONY_MAIN_CANDIDATES="${STS_CHRONY_MAIN_CANDIDATES:-/etc/chrony/chrony.conf /etc/chrony.conf}"
STS_TIMESYNCD_CONF="${STS_TIMESYNCD_CONF:-/etc/systemd/timesyncd.conf}"

# ---------------------------------------------------------------------------
# 공통 헬퍼 (best-effort)
# ---------------------------------------------------------------------------

sts_cmd_exists() {
    command -v "$1" >/dev/null 2>&1
}

sts_section() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
}

sts_unit_probe() {
    local unit="$1"
    local active="n/a" enabled="n/a"
    if ! sts_cmd_exists systemctl; then
        echo "  $unit: systemctl 없음"
        return 0
    fi
    active=$(systemctl is-active "$unit" 2>/dev/null || echo "inactive")
    enabled=$(systemctl is-enabled "$unit" 2>/dev/null || echo "disabled")
    echo "  $unit: active=$active enabled=$enabled"
}

sts_detect_chrony_unit() {
    if ! sts_cmd_exists systemctl; then
        return 1
    fi
    if systemctl list-unit-files chrony.service >/dev/null 2>&1 \
        && systemctl cat chrony.service >/dev/null 2>&1; then
        echo "chrony"
        return 0
    fi
    if systemctl list-unit-files chronyd.service >/dev/null 2>&1 \
        && systemctl cat chronyd.service >/dev/null 2>&1; then
        echo "chronyd"
        return 0
    fi
    # 유닛 파일이 아직 없어도 패키지명 추정
    if sts_cmd_exists chronyd || dpkg -l chrony 2>/dev/null | grep -q '^ii'; then
        if systemctl list-unit-files 2>/dev/null | grep -qE '^chrony\.service'; then
            echo "chrony"
            return 0
        fi
        echo "chronyd"
        return 0
    fi
    return 1
}

sts_active_time_daemon() {
    local u
    for u in chrony chronyd systemd-timesyncd ntpd ntp; do
        if sts_cmd_exists systemctl && systemctl is-active --quiet "$u" 2>/dev/null; then
            echo "$u"
            return 0
        fi
    done
    echo "none"
    return 0
}

sts_sync_enabled_guess() {
    if sts_cmd_exists timedatectl; then
        if timedatectl show -p NTPSynchronized --value 2>/dev/null | grep -qi '^yes$'; then
            echo "yes (NTPSynchronized)"
            return 0
        fi
        if timedatectl status 2>/dev/null | grep -qiE 'System clock synchronized:[[:space:]]*yes'; then
            echo "yes (timedatectl)"
            return 0
        fi
        if timedatectl status 2>/dev/null | grep -qiE 'NTP service:[[:space:]]*active'; then
            echo "partial (NTP service active, sync unknown)"
            return 0
        fi
    fi
    local daemon
    daemon=$(sts_active_time_daemon)
    if [ "$daemon" != "none" ]; then
        echo "unknown (daemon=$daemon active)"
        return 0
    fi
    echo "no/unknown"
}

sts_collect_configured_servers() {
    local f found=0
    for f in \
        /etc/chrony/chrony.conf \
        /etc/chrony.conf \
        /etc/chrony/conf.d/*.conf \
        "$STS_CHRONY_DROPIN" \
        /etc/systemd/timesyncd.conf; do
        # glob 미매칭 방지
        [ -e "$f" ] || continue
        if [ -f "$f" ]; then
            lines=$(sts_grep_ntp_server_lines "$f" || true)
            if [ -n "${lines:-}" ]; then
                echo "  [$f]"
                printf '%s\n' "$lines" | sed 's/^/    /'
                found=1
            fi
        fi
    done
    if [ "$found" -eq 0 ]; then
        echo "  (configured server lines not found)"
    fi
}

# UDP 123 query-only. 사용 도구를 문서화. soft-fail.
# 환경변수 STS_SKIP_NETWORK=1 이면 스킵
sts_probe_udp123() {
    local host="$1"
    local tool="" out="" rc=0

    if [ "${STS_SKIP_NETWORK:-0}" = "1" ]; then
        echo "  $host: SKIPPED (STS_SKIP_NETWORK=1)"
        return 0
    fi

    if sts_cmd_exists sntp; then
        tool="sntp -q"
        out=$(sntp -q "$host" 2>&1) && rc=0 || rc=$?
    elif sts_cmd_exists ntpdate; then
        tool="ntpdate -q"
        out=$(ntpdate -q "$host" 2>&1) && rc=0 || rc=$?
    elif sts_cmd_exists chronyd; then
        # -Q : query only, do not set clock (man chronyd)
        tool="chronyd -Q"
        out=$(chronyd -Q "server $host iburst" 2>&1) && rc=0 || rc=$?
    else
        echo "  $host: SOFT-FAIL (no sntp/ntpdate/chronyd for query-only)"
        return 0
    fi

    if [ "$rc" -eq 0 ]; then
        echo "  $host: REACHABLE via $tool"
    else
        echo "  $host: UNREACHABLE or error via $tool (rc=$rc) [soft]"
        # 출력이 길면 앞부분만
        printf '%s\n' "$out" | head -5 | sed 's/^/    /'
    fi
    return 0
}

# HTTP Date 헤더와 로컬 UTC 비교. diagnose 에서 hard-fail 하지 않음.
sts_probe_http_date_skew() {
    local url headers date_val remote_epoch local_epoch skew
    local summary_lines="" max_abs=0

    if [ "${STS_SKIP_NETWORK:-0}" = "1" ]; then
        echo "  SKIPPED (STS_SKIP_NETWORK=1)"
        SUMMARY_HTTP_SKEW="skipped"
        return 0
    fi

    if ! sts_cmd_exists curl; then
        echo "  curl 없음 — HTTP Date 비교 생략 [soft]"
        SUMMARY_HTTP_SKEW="n/a (no curl)"
        return 0
    fi

    local_epoch=$(date -u +%s)
    echo "  local date -u: $(date -u)"
    echo "  local epoch:   $local_epoch"

    for url in $STS_HTTP_DATE_URLS; do
        headers=$(curl -sI --max-time 10 "$url" 2>/dev/null || true)
        date_val=$(sts_extract_http_date_header "$headers" || true)
        if [ -z "$date_val" ]; then
            echo "  $url: Date 헤더 없음 [soft]"
            continue
        fi
        remote_epoch=$(sts_http_date_to_epoch "$date_val" || true)
        if [ -z "${remote_epoch:-}" ]; then
            echo "  $url: Date 파싱 실패 ($date_val) [soft]"
            continue
        fi
        skew=$(sts_skew_seconds "$local_epoch" "$remote_epoch" || echo "?")
        echo "  $url: Date=$date_val epoch=$remote_epoch skew_sec(remote-local)=$skew"
        summary_lines="${summary_lines}${url}=${skew}s; "
        if [[ "$skew" =~ ^-?[0-9]+$ ]]; then
            local abs=$skew
            [ "$abs" -lt 0 ] && abs=$((-abs))
            [ "$abs" -gt "$max_abs" ] && max_abs=$abs
        fi
    done

    if [ -z "$summary_lines" ]; then
        SUMMARY_HTTP_SKEW="n/a"
    else
        SUMMARY_HTTP_SKEW="max_abs≈${max_abs}s (${summary_lines})"
    fi
    return 0
}

SUMMARY_SYNC=""
SUMMARY_DAEMON=""
SUMMARY_SERVERS=""
SUMMARY_UDP=""
SUMMARY_HTTP_SKEW=""

# ---------------------------------------------------------------------------
# diagnose (READ-ONLY)
# ---------------------------------------------------------------------------

sts_run_diagnose() {
    SUMMARY_SYNC=""
    SUMMARY_DAEMON=""
    SUMMARY_SERVERS=""
    SUMMARY_UDP=""
    SUMMARY_HTTP_SKEW=""

    sts_section "SERVER TIME DIAGNOSE (read-only)"
    echo "host: $(hostname -f 2>/dev/null || hostname)"
    echo "mode: diagnose"
    echo "constraint: no config write / no service restart / no date set"

    sts_section "1. timedatectl"
    if sts_cmd_exists timedatectl; then
        timedatectl status 2>/dev/null || echo "  timedatectl status 실패 [soft]"
        echo ""
        echo "--- timedatectl show-timesync ---"
        timedatectl show-timesync 2>/dev/null || echo "  show-timesync 불가 [soft]"
    else
        echo "  timedatectl 없음"
    fi

    sts_section "2. time daemon units"
    for u in chronyd chrony systemd-timesyncd ntpd ntp; do
        sts_unit_probe "$u"
    done
    SUMMARY_DAEMON=$(sts_active_time_daemon)
    SUMMARY_SYNC=$(sts_sync_enabled_guess)

    sts_section "3. chronyc / ntpq (if available)"
    if sts_cmd_exists chronyc; then
        echo "--- chronyc tracking ---"
        chronyc tracking 2>/dev/null || echo "  chronyc tracking 실패 [soft]"
        echo ""
        echo "--- chronyc sources -v ---"
        chronyc sources -v 2>/dev/null || echo "  chronyc sources 실패 [soft]"
    else
        echo "  chronyc 없음"
    fi
    if sts_cmd_exists ntpq; then
        echo ""
        echo "--- ntpq -p ---"
        ntpq -p 2>/dev/null || echo "  ntpq -p 실패 [soft]"
    else
        echo "  ntpq 없음"
    fi

    sts_section "4. configured NTP servers (grep)"
    # 서브셸 없이 수집해 SUMMARY에 요약
    local server_dump
    server_dump=$(sts_collect_configured_servers)
    printf '%s\n' "$server_dump"
    SUMMARY_SERVERS=$(printf '%s\n' "$server_dump" | grep -E 'server |pool |NTP|FallbackNTP' | tr '\n' ' ' | sed 's/[[:space:]]\+/ /g')
    [ -n "$SUMMARY_SERVERS" ] || SUMMARY_SERVERS="(none found)"

    sts_section "5. UDP 123 reachability (query-only)"
    echo "tools preferred: sntp -q | ntpdate -q | chronyd -Q (never set clock)"
    sts_probe_udp123 "time.bora.net"
    sts_probe_udp123 "kr.pool.ntp.org"
    SUMMARY_UDP="see section 5 (query-only soft-fail)"

    sts_section "6. clock skew vs HTTP Date"
    sts_probe_http_date_skew

    sts_section "SUMMARY"
    echo "  sync enabled?:     $SUMMARY_SYNC"
    echo "  active daemon:     $SUMMARY_DAEMON"
    echo "  configured servers:$SUMMARY_SERVERS"
    echo "  UDP123:            $SUMMARY_UDP"
    echo "  clock skew HTTP:   $SUMMARY_HTTP_SKEW"
    echo ""
    echo "DIAGNOSE_DONE"
    return 0
}

# ---------------------------------------------------------------------------
# apply (SLEW ONLY)
# ---------------------------------------------------------------------------

sts_snapshot_short() {
    local label="$1"
    echo "--- $label ---"
    if sts_cmd_exists timedatectl; then
        timedatectl status 2>/dev/null | head -20 || true
    else
        date -u
    fi
    if sts_cmd_exists chronyc; then
        echo "(chronyc tracking)"
        chronyc tracking 2>/dev/null | head -15 || true
    fi
}

sts_ensure_chrony_package() {
    if sts_cmd_exists chronyd || sts_cmd_exists chronyc; then
        echo "  chrony 이미 사용 가능"
        return 0
    fi
    if ! sts_cmd_exists apt-get; then
        echo "  WARN: chrony 없고 apt-get 없음 — timesyncd 폴백 시도" >&2
        return 1
    fi
    echo "  chrony 패키지 설치 시도 (apt-get)..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq || {
        echo "  ERROR: apt-get update 실패" >&2
        return 1
    }
    apt-get install -y -qq chrony || {
        echo "  ERROR: chrony 설치 실패" >&2
        return 1
    }
    return 0
}

sts_pick_chrony_conf_target() {
    # conf.d 드롭인 우선
    if [ -d "$STS_CHRONY_CONFD" ] || [ -d /etc/chrony ]; then
        mkdir -p "$STS_CHRONY_CONFD" 2>/dev/null || true
        if [ -d "$STS_CHRONY_CONFD" ]; then
            echo "$STS_CHRONY_DROPIN"
            return 0
        fi
    fi
    local f
    for f in $STS_CHRONY_MAIN_CANDIDATES; do
        if [ -f "$f" ] || [ -d "$(dirname "$f")" ]; then
            echo "$f"
            return 0
        fi
    done
    # 최후: 드롭인 경로 생성 시도
    mkdir -p "$(dirname "$STS_CHRONY_DROPIN")" || return 1
    echo "$STS_CHRONY_DROPIN"
}

sts_reload_chrony() {
    local unit="$1"
    if sts_cmd_exists chronyc; then
        chronyc reload sources 2>/dev/null && echo "  chronyc reload sources OK" && return 0
    fi
    if sts_cmd_exists systemctl; then
        systemctl reload "$unit" 2>/dev/null && echo "  systemctl reload $unit OK" && return 0
        systemctl restart "$unit" 2>/dev/null && echo "  systemctl restart $unit OK (reload 불가)" && return 0
    fi
    echo "  WARN: chrony reload 실패 [soft]" >&2
    return 0
}

sts_run_apply() {
    local hard_fail=0
    local chrony_unit="" conf_target=""

    sts_section "SERVER TIME APPLY (slew-only)"
    echo "host: $(hostname -f 2>/dev/null || hostname)"
    echo "mode: apply"
    echo "constraint: NO date -s / NO chronyc makestep / NO forced step"
    echo "servers: $STS_NTP_SERVERS"
    echo "makestep: $STS_MAKESTEP_LINE ; maxslewrate: $STS_MAXSLEWRATE"

    sts_section "BEFORE snapshot"
    sts_snapshot_short "BEFORE"

    sts_section "1. ensure chrony (preferred)"
    if sts_ensure_chrony_package; then
        conf_target=$(sts_pick_chrony_conf_target) || {
            echo "  ERROR: chrony conf 경로를 결정할 수 없음" >&2
            hard_fail=1
        }
        if [ "$hard_fail" -eq 0 ]; then
            echo "  conf target: $conf_target"
            if ! sts_write_chrony_conf_idempotent "$conf_target"; then
                echo "  ERROR: chrony conf 기록 실패" >&2
                hard_fail=1
            fi
        fi

        # 메인 conf 의 Ubuntu 기본 makestep 1.0 3 등이 드롭인보다 먼저
        # 해석되지 않도록 managed 밖 활성 makestep 을 주석 처리 (멱등)
        if [ "$hard_fail" -eq 0 ]; then
            echo "  disable unmanaged makestep in main chrony.conf (slew-only)"
            if ! sts_comment_unmanaged_makestep_mains; then
                echo "  ERROR: 메인 conf makestep 주석 처리 실패" >&2
                hard_fail=1
            fi
            # 드롭인이 아닌 메인 conf 자체에 managed 블록을 쓴 경우도 동일 파일 재처리
            if [ -n "$conf_target" ] && [ -f "$conf_target" ]; then
                case " $STS_CHRONY_MAIN_CANDIDATES " in
                    *" $conf_target "*) ;;
                    *)
                        sts_comment_unmanaged_makestep "$conf_target" || {
                            echo "  ERROR: conf_target makestep 주석 처리 실패" >&2
                            hard_fail=1
                        }
                        ;;
                esac
            fi
        fi

        if [ "$hard_fail" -eq 0 ]; then
            chrony_unit=$(sts_detect_chrony_unit || echo "chrony")
            echo "  chrony unit: $chrony_unit"
            if sts_cmd_exists systemctl; then
                # timesyncd 충돌 방지 (app/nginx/DB 미접촉)
                if systemctl is-active --quiet systemd-timesyncd 2>/dev/null \
                    || systemctl is-enabled --quiet systemd-timesyncd 2>/dev/null; then
                    echo "  systemd-timesyncd disable --now (chrony 충돌 방지)"
                    systemctl disable --now systemd-timesyncd 2>/dev/null || \
                        echo "  WARN: timesyncd disable 실패 [soft]" >&2
                fi
                systemctl enable --now "$chrony_unit" || {
                    # 유닛명 교차 시도
                    if [ "$chrony_unit" = "chrony" ]; then
                        systemctl enable --now chronyd || hard_fail=1
                        chrony_unit="chronyd"
                    else
                        systemctl enable --now chrony || hard_fail=1
                        chrony_unit="chrony"
                    fi
                }
                if [ "$hard_fail" -ne 0 ]; then
                    echo "  ERROR: chrony 유닛 기동 실패" >&2
                else
                    sts_reload_chrony "$chrony_unit"
                fi
            else
                echo "  WARN: systemctl 없음 — conf 만 기록됨" >&2
            fi
        fi
    else
        sts_section "1b. timesyncd fallback"
        if [ -d /etc/systemd ] || [ -f "$STS_TIMESYNCD_CONF" ]; then
            if ! sts_write_timesyncd_ntp_idempotent "$STS_TIMESYNCD_CONF"; then
                echo "  ERROR: timesyncd.conf 기록 실패" >&2
                hard_fail=1
            else
                if sts_cmd_exists systemctl; then
                    systemctl enable --now systemd-timesyncd 2>/dev/null || {
                        echo "  ERROR: systemd-timesyncd 기동 실패" >&2
                        hard_fail=1
                    }
                    systemctl restart systemd-timesyncd 2>/dev/null || true
                    timedatectl set-ntp true 2>/dev/null || true
                fi
            fi
        else
            echo "  ERROR: chrony/timesyncd 모두 구성 불가" >&2
            hard_fail=1
        fi
    fi

    sts_section "AFTER snapshot"
    sts_snapshot_short "AFTER"

    sts_section "APPLY RESULT"
    if [ "$hard_fail" -ne 0 ]; then
        echo "  APPLY_FAILED (hard)"
        return 1
    fi
    echo "  APPLY_OK (slew-only; UDP unreachable is soft)"
    return 0
}

# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

case "$MODE" in
    diagnose) sts_run_diagnose ;;
    apply) sts_run_apply ;;
esac
