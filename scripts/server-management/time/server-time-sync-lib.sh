#!/usr/bin/env bash
# server-time-sync.sh 용 테스트 가능 라이브러리
# (root/네트워크 없이 fixture로 단위 검증 가능)
#
# 제약: app/DB/nginx 미접촉. apply 는 slew-only (date -s / makestep 금지).
# chrony: managed 블록에 활성 makestep 을 넣지 않음 (생략 = never step).

# 권장 NTP 서버 (대한민국 공용)
STS_NTP_SERVERS="${STS_NTP_SERVERS:-time.bora.net kr.pool.ntp.org}"
# no makestep ⇒ chrony 기본값 = never step (매 업데이트 step 인 makestep -1 -1 금지)
STS_MAXSLEWRATE="${STS_MAXSLEWRATE:-500}"
STS_MANAGED_BEGIN="# BEGIN MINDGARDEN_TIME_SYNC"
STS_MANAGED_END="# END MINDGARDEN_TIME_SYNC"
# HTTP Date 비교용 (diagnose). 테스트에서 오버라이드 가능.
STS_HTTP_DATE_URLS="${STS_HTTP_DATE_URLS:-https://www.google.com https://cloudflare.com}"

# ---------------------------------------------------------------------------
# 모드 검증
# ---------------------------------------------------------------------------

# 인자: mode
# stdout: 정규화된 mode (diagnose|apply)
# return: 0=ok, 2=unknown
sts_validate_mode() {
    local mode="${1:-}"
    case "$mode" in
        diagnose|apply)
            printf '%s\n' "$mode"
            return 0
            ;;
        *)
            echo "알 수 없는 모드: ${mode:-"(empty)"} (diagnose|apply)" >&2
            return 2
            ;;
    esac
}

# ---------------------------------------------------------------------------
# HTTP Date / skew
# ---------------------------------------------------------------------------

# curl -sI 출력 등에서 Date 헤더 값만 추출
# stdout: RFC1123 날짜 문자열 (없으면 빈 줄 + return 1)
sts_extract_http_date_header() {
    local headers="$1"
    local line value
    line=$(printf '%s\n' "$headers" | grep -iE '^[[:space:]]*Date:' | head -1 || true)
    if [ -z "$line" ]; then
        return 1
    fi
    value=$(printf '%s\n' "$line" | sed -E 's/^[[:space:]]*[Dd][Aa][Tt][Ee]:[[:space:]]*//;s/[[:space:]]+$//')
    if [ -z "$value" ]; then
        return 1
    fi
    printf '%s\n' "$value"
    return 0
}

# RFC1123 (또는 date -d 가 이해하는) 문자열 → epoch 초
# stdout: epoch
# return: 0=ok, 1=parse fail
sts_http_date_to_epoch() {
    local date_str="$1"
    local epoch
    if [ -z "$date_str" ]; then
        return 1
    fi
    # GNU date (ubuntu-latest / 서버)
    epoch=$(date -u -d "$date_str" +%s 2>/dev/null) || return 1
    if ! [[ "$epoch" =~ ^[0-9]+$ ]]; then
        return 1
    fi
    printf '%s\n' "$epoch"
    return 0
}

# 인자: local_epoch remote_epoch
# stdout: remote - local (양수면 원격이 앞섬 / 로컬이 느림)
sts_skew_seconds() {
    local local_epoch="$1"
    local remote_epoch="$2"
    if ! [[ "$local_epoch" =~ ^-?[0-9]+$ ]] || ! [[ "$remote_epoch" =~ ^-?[0-9]+$ ]]; then
        echo "sts_skew_seconds: invalid epoch" >&2
        return 1
    fi
    printf '%s\n' "$((remote_epoch - local_epoch))"
    return 0
}

# ---------------------------------------------------------------------------
# chrony conf 생성 / 멱등 패치
# ---------------------------------------------------------------------------

# managed 블록 본문 (BEGIN/END 마커 포함) 출력
# 활성 makestep 줄 없음 (생략 = never step). servers + maxslewrate 만.
sts_generate_chrony_managed_block() {
    local srv
    printf '%s\n' "$STS_MANAGED_BEGIN"
    printf '%s\n' "# Managed by server-time-sync.sh — slew only (no step)"
    printf '%s\n' "# no makestep ⇒ never step (do not use makestep -1 -1; that steps every update)"
    for srv in $STS_NTP_SERVERS; do
        printf 'server %s iburst\n' "$srv"
    done
    printf 'maxslewrate %s\n' "$STS_MAXSLEWRATE"
    printf '%s\n' "$STS_MANAGED_END"
}

# 인자: conf_path
# managed 섹션을 멱등하게 기록. 파일이 없으면 생성.
# 기존 BEGIN..END 구간을 제거하고 새 블록을 파일 끝에 붙임.
# 본문 trailing 공백 줄을 정규화해 반복 적용 시 개행이 늘지 않게 함.
# return: 0=ok, 1=write fail
sts_write_chrony_conf_idempotent() {
    local conf="$1"
    local dir tmp stripped body
    dir=$(dirname "$conf")
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir" || return 1
    fi
    tmp=$(mktemp) || return 1
    stripped=$(mktemp) || {
        rm -f "$tmp"
        return 1
    }
    body=$(mktemp) || {
        rm -f "$tmp" "$stripped"
        return 1
    }

    if [ -f "$conf" ]; then
        # 기존 managed 블록 제거 (중첩 없이 BEGIN..END)
        awk -v begin="$STS_MANAGED_BEGIN" -v end="$STS_MANAGED_END" '
            $0 == begin { in_block = 1; next }
            $0 == end { in_block = 0; next }
            !in_block { print }
        ' "$conf" > "$stripped" || {
            rm -f "$tmp" "$stripped" "$body"
            return 1
        }
    else
        : > "$stripped"
    fi

    # trailing 빈 줄 제거 후, 본문이 있으면 빈 줄 하나 + managed 블록
    awk '
        { lines[++n] = $0 }
        END {
            while (n > 0 && lines[n] ~ /^[[:space:]]*$/) n--
            for (i = 1; i <= n; i++) print lines[i]
        }
    ' "$stripped" > "$body" || {
        rm -f "$tmp" "$stripped" "$body"
        return 1
    }

    {
        if [ -s "$body" ]; then
            cat "$body"
            printf '\n'
        fi
        sts_generate_chrony_managed_block
    } > "$tmp" || {
        rm -f "$tmp" "$stripped" "$body"
        return 1
    }

    rm -f "$stripped" "$body"

    # 멱등: 내용이 동일하면 덮어쓰지 않음
    if [ -f "$conf" ] && cmp -s "$tmp" "$conf"; then
        rm -f "$tmp"
        echo "CHRONY_CONF_UNCHANGED:$conf"
        return 0
    fi

    if ! mv "$tmp" "$conf"; then
        rm -f "$tmp"
        return 1
    fi
    echo "CHRONY_CONF_UPDATED:$conf"
    return 0
}

# conf 내용이 slew-only 요건을 만족하는지 검사 (테스트/검증용)
# servers + maxslewrate 있고, 활성(uncommented) makestep 이 없어야 함
# return: 0=ok, 1=missing
sts_chrony_conf_is_slew_only() {
    local conf="$1"
    [ -f "$conf" ] || return 1
    grep -qE '^[[:space:]]*server[[:space:]]+time\.bora\.net' "$conf" || return 1
    grep -qE '^[[:space:]]*server[[:space:]]+kr\.pool\.ntp\.org' "$conf" || return 1
    grep -qE '^[[:space:]]*maxslewrate[[:space:]]+[0-9]+' "$conf" || return 1
    sts_chrony_no_active_step_makestep "$conf" || return 1
    return 0
}

# 활성(주석 아님) makestep 줄이 하나도 없어야 OK (never step)
# return: 0=ok, 1=활성 makestep 잔존
sts_chrony_no_active_step_makestep() {
    local conf="$1"
    [ -f "$conf" ] || return 1
    if grep -qE '^[[:space:]]*makestep([[:space:]]|$)' "$conf" 2>/dev/null; then
        return 1
    fi
    return 0
}

# 메인 chrony.conf 등에서 managed 블록 밖의 활성 makestep 줄을 주석 처리 (멱등)
# Ubuntu 기본 `makestep 1.0 3` 등이 남아 스텝이 허용되는 것을 막기 위함.
# 이미 `#` 주석인 줄은 유지. managed BEGIN..END 내부는 변경하지 않음
# (managed 블록에는 활성 makestep 을 넣지 않음).
# stdout: MAKESTEP_COMMENTED:path | MAKESTEP_UNCHANGED:path | MAKESTEP_SKIP:path
# return: 0=ok, 1=write fail
sts_comment_unmanaged_makestep() {
    local conf="$1"
    local tmp changed=0
    if [ ! -f "$conf" ]; then
        echo "MAKESTEP_SKIP:$conf"
        return 0
    fi
    tmp=$(mktemp) || return 1
    local awk_rc=0
    awk -v begin="$STS_MANAGED_BEGIN" -v end="$STS_MANAGED_END" '
        BEGIN { in_block = 0; changed = 0 }
        $0 == begin { in_block = 1; print; next }
        $0 == end { in_block = 0; print; next }
        !in_block && /^[[:space:]]*makestep([[:space:]]|$)/ {
            print "# " $0
            changed = 1
            next
        }
        { print }
        END { if (changed) exit 10; else exit 0 }
    ' "$conf" > "$tmp" || awk_rc=$?
    if [ "$awk_rc" -ne 0 ] && [ "$awk_rc" -ne 10 ]; then
        rm -f "$tmp"
        return 1
    fi
    if [ "$awk_rc" -eq 0 ]; then
        rm -f "$tmp"
        echo "MAKESTEP_UNCHANGED:$conf"
        return 0
    fi
    if ! mv "$tmp" "$conf"; then
        rm -f "$tmp"
        return 1
    fi
    echo "MAKESTEP_COMMENTED:$conf"
    return 0
}

# 메인 conf 후보들에 대해 unmanaged makestep 주석 처리
# 인자: [공백 구분 경로 목록] — 없으면 STS_CHRONY_MAIN_CANDIDATES
sts_comment_unmanaged_makestep_mains() {
    local candidates="${1:-${STS_CHRONY_MAIN_CANDIDATES:-/etc/chrony/chrony.conf /etc/chrony.conf}}"
    local f rc=0
    for f in $candidates; do
        if ! sts_comment_unmanaged_makestep "$f"; then
            rc=1
        fi
    done
    return "$rc"
}

# NTP 설정 파일에서 server / NTP= 줄만 추출 (diagnose용)
sts_grep_ntp_server_lines() {
    local conf="$1"
    [ -f "$conf" ] || return 1
    grep -E '^[[:space:]]*(server|pool|NTP|FallbackNTP)[[:space:]]*[= ]' "$conf" 2>/dev/null \
        | grep -vE '^[[:space:]]*#' || true
}

# ---------------------------------------------------------------------------
# timesyncd conf 멱등 패치 (diagnose/단위테스트용 — apply 에서 호출 금지)
# ---------------------------------------------------------------------------

# 인자: timesyncd.conf 경로
# [Time] 섹션에 NTP= / FallbackNTP= 를 멱등 설정
sts_write_timesyncd_ntp_idempotent() {
    local conf="$1"
    local primary secondary tmp dir
    # shellcheck disable=SC2086
    set -- $STS_NTP_SERVERS
    primary="${1:-time.bora.net}"
    secondary="${2:-kr.pool.ntp.org}"
    dir=$(dirname "$conf")
    [ -d "$dir" ] || mkdir -p "$dir" || return 1
    tmp=$(mktemp) || return 1

    if [ -f "$conf" ]; then
        awk -v primary="$primary" -v secondary="$secondary" '
            BEGIN { in_time = 0; wrote_ntp = 0; wrote_fb = 0 }
            /^\[Time\]/ { in_time = 1; print; next }
            /^\[/ {
                if (in_time && !wrote_ntp) { print "NTP=" primary " " secondary; wrote_ntp = 1 }
                if (in_time && !wrote_fb) { print "FallbackNTP=" secondary; wrote_fb = 1 }
                in_time = 0
                print
                next
            }
            in_time && /^[[:space:]]*NTP=/ {
                print "NTP=" primary " " secondary
                wrote_ntp = 1
                next
            }
            in_time && /^[[:space:]]*FallbackNTP=/ {
                print "FallbackNTP=" secondary
                wrote_fb = 1
                next
            }
            { print }
            END {
                if (!in_time && !wrote_ntp) {
                    print ""
                    print "[Time]"
                    print "NTP=" primary " " secondary
                    print "FallbackNTP=" secondary
                } else if (in_time) {
                    if (!wrote_ntp) print "NTP=" primary " " secondary
                    if (!wrote_fb) print "FallbackNTP=" secondary
                }
            }
        ' "$conf" > "$tmp" || {
            rm -f "$tmp"
            return 1
        }
    else
        {
            printf '%s\n' '[Time]'
            printf 'NTP=%s %s\n' "$primary" "$secondary"
            printf 'FallbackNTP=%s\n' "$secondary"
        } > "$tmp" || {
            rm -f "$tmp"
            return 1
        }
    fi

    if [ -f "$conf" ] && cmp -s "$tmp" "$conf"; then
        rm -f "$tmp"
        echo "TIMESYNCD_CONF_UNCHANGED:$conf"
        return 0
    fi
    mv "$tmp" "$conf" || return 1
    echo "TIMESYNCD_CONF_UPDATED:$conf"
    return 0
}
