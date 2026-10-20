#!/usr/bin/env bash
# ensure-auto-renewal.sh 용 테스트 가능 라이브러리
# (root/certbot/네트워크 없이 fixture로 단위 검증)
#
# SSOT: docs/runbooks/SSL_CERTIFICATE_STATUS.md

# mindgarden 단일 호스트 LE lineage (이미 non-standalone — 전환 대상 아님)
SSL_MINDGARDEN_LINEAGE_NAME="${SSL_MINDGARDEN_LINEAGE_NAME:-mindgarden.dev.core-solution.co.kr}"
SSL_WEBROOT_PATH="${SSL_WEBROOT_PATH:-/var/www/html}"
SSL_RENEWAL_DIR="${SSL_RENEWAL_DIR:-/etc/letsencrypt/renewal}"
SSL_DEPLOY_HOOK_PATH="${SSL_DEPLOY_HOOK_PATH:-/etc/letsencrypt/renewal-hooks/deploy/01-reload-nginx.sh}"

# ---------------------------------------------------------------------------
# renewal conf 헬퍼
# ---------------------------------------------------------------------------

ssl_renewal_authenticator() {
    local conf="$1"
    [ -f "$conf" ] || return 1
    grep -E '^[[:space:]]*authenticator[[:space:]]*=' "$conf" 2>/dev/null \
        | head -1 \
        | sed -E 's/^[[:space:]]*authenticator[[:space:]]*=[[:space:]]*//;s/[[:space:]]+$//'
}

# domains= 줄 또는 파일명(basename .conf)에서 도메인 목록 추출
ssl_renewal_domains() {
    local conf="$1"
    local domains_line name
    [ -f "$conf" ] || return 1
    domains_line=$(grep -E '^[[:space:]]*domains[[:space:]]*=' "$conf" 2>/dev/null | head -1 || true)
    if [ -n "$domains_line" ]; then
        echo "$domains_line" \
            | sed -E 's/^[[:space:]]*domains[[:space:]]*=[[:space:]]*//' \
            | tr ',' '\n' \
            | sed -E 's/^[[:space:]]+//;s/[[:space:]]+$//' \
            | grep -v '^$'
        return 0
    fi
    name=$(basename "$conf" .conf)
    [ -n "$name" ] && echo "$name"
}

ssl_is_mindgarden_lineage() {
    local conf="$1"
    local name
    name=$(basename "$conf" .conf)
    [ "$name" = "$SSL_MINDGARDEN_LINEAGE_NAME" ]
}

# ---------------------------------------------------------------------------
# standalone → webroot (DEV only). conf 직접 패치 + .bak
# ---------------------------------------------------------------------------

# 인자: conf_file [webroot_path]
# stdout: CHANGED|SKIP|ALREADY_WEBROOT|ERROR
# return: 0=ok, 1=error
ssl_patch_standalone_to_webroot() {
    local conf="$1"
    local webroot="${2:-$SSL_WEBROOT_PATH}"
    local auth bak tmp domain map_block

    if [ ! -f "$conf" ]; then
        echo "ERROR"
        return 1
    fi

    if ssl_is_mindgarden_lineage "$conf"; then
        echo "SKIP"
        return 0
    fi

    auth=$(ssl_renewal_authenticator "$conf" || true)
    case "$auth" in
        webroot)
            echo "ALREADY_WEBROOT"
            return 0
            ;;
        standalone) ;;
        *)
            echo "SKIP"
            return 0
            ;;
    esac

    bak="${conf}.bak"
    cp -a "$conf" "$bak" || {
        echo "ERROR"
        return 1
    }

    map_block=""
    while IFS= read -r domain; do
        [ -n "$domain" ] || continue
        map_block="${map_block}${domain} = ${webroot}"$'\n'
    done < <(ssl_renewal_domains "$conf")

    if [ -z "$map_block" ]; then
        domain=$(basename "$conf" .conf)
        map_block="${domain} = ${webroot}"$'\n'
    fi

    tmp=$(mktemp)
    # authenticator / webroot_path 갱신, 기존 [[webroot_map]] 제거 후 재작성
    awk -v webroot="$webroot" '
        BEGIN { in_map = 0; wrote_auth = 0; wrote_path = 0 }
        /^\[\[webroot_map\]\]/ { in_map = 1; next }
        in_map {
            if ($0 ~ /^\[/) { in_map = 0 } else { next }
        }
        /^[[:space:]]*authenticator[[:space:]]*=/ {
            print "authenticator = webroot"
            wrote_auth = 1
            next
        }
        /^[[:space:]]*webroot_path[[:space:]]*=/ {
            print "webroot_path = " webroot ","
            wrote_path = 1
            next
        }
        { print }
        END {
            if (!wrote_auth) print "authenticator = webroot"
            if (!wrote_path) print "webroot_path = " webroot ","
        }
    ' "$conf" > "$tmp" || {
        rm -f "$tmp"
        echo "ERROR"
        return 1
    }

    {
        cat "$tmp"
        printf '\n[[webroot_map]]\n'
        printf '%s' "$map_block"
    } > "$conf" || {
        rm -f "$tmp"
        cp -a "$bak" "$conf" 2>/dev/null || true
        echo "ERROR"
        return 1
    }
    rm -f "$tmp"
    echo "CHANGED"
    return 0
}

# 인자: mode renewal_dir [webroot]
# MODE=prod 이면 standalone 변경하지 않고 경고만 (stdout에 WARN 줄)
ssl_convert_standalone_renewals() {
    local mode="$1"
    local renewal_dir="${2:-$SSL_RENEWAL_DIR}"
    local webroot="${3:-$SSL_WEBROOT_PATH}"
    local f name auth result changed=0 warned=0

    if [ ! -d "$renewal_dir" ]; then
        echo "INFO: renewal dir 없음: $renewal_dir"
        return 0
    fi

    shopt -s nullglob
    for f in "$renewal_dir"/*.conf; do
        name=$(basename "$f" .conf)
        auth=$(ssl_renewal_authenticator "$f" || echo "")

        if ssl_is_mindgarden_lineage "$f"; then
            echo "MINDGARDEN_LINEAGE: $name authenticator=${auth:-unknown} (standalone→webroot 전환 대상 아님)"
            continue
        fi

        if [ "$auth" != "standalone" ]; then
            continue
        fi

        if [ "$mode" = "prod" ]; then
            echo "WARN: PROD standalone 유지(변경 안 함): $name"
            warned=1
            continue
        fi

        result=$(ssl_patch_standalone_to_webroot "$f" "$webroot") || result="ERROR"
        case "$result" in
            CHANGED)
                echo "CONVERTED: $name standalone → webroot ($webroot)"
                changed=$((changed + 1))
                ;;
            ERROR)
                echo "ERROR: $name webroot 전환 실패"
                return 1
                ;;
            *)
                echo "INFO: $name → $result"
                ;;
        esac
    done
    shopt -u nullglob

    echo "CONVERT_SUMMARY: changed=$changed prod_warned=$warned"
    return 0
}

# mindgarden lineage 상태를 항상 한 줄 이상 출력
ssl_report_mindgarden_lineage() {
    local renewal_dir="${1:-$SSL_RENEWAL_DIR}"
    local conf="$renewal_dir/${SSL_MINDGARDEN_LINEAGE_NAME}.conf"
    local auth

    if [ -f "$conf" ]; then
        auth=$(ssl_renewal_authenticator "$conf" || echo "unknown")
        echo "MINDGARDEN_LINEAGE: ${SSL_MINDGARDEN_LINEAGE_NAME} authenticator=${auth} (별도 single-host LE, standalone→webroot 전환 대상 아님)"
    else
        echo "MINDGARDEN_LINEAGE: ${SSL_MINDGARDEN_LINEAGE_NAME} conf 없음 ($conf) — 전환 대상 아님"
    fi
}

# ---------------------------------------------------------------------------
# dry-run 로그 판정 (certbot exit + rate-limit 문구)
# ---------------------------------------------------------------------------

# 인자: certbot_exit_code log_file_or_string
# stdout: SUCCESS|FAIL|RATE_LIMITED
# return: 0=전부 성공, 1=실패(또는 rate limit)
ssl_evaluate_dryrun_result() {
    local certbot_exit="$1"
    local log_src="$2"
    local log_text

    if [ -f "$log_src" ]; then
        log_text=$(cat "$log_src" 2>/dev/null || true)
    else
        log_text="$log_src"
    fi

    if echo "$log_text" | grep -Eiq 'rateLimited|too many requests|rate limit'; then
        echo "RATE_LIMITED"
        return 1
    fi

    if [ "$certbot_exit" -ne 0 ]; then
        echo "FAIL"
        return 1
    fi

    # certbot이 0을 줘도 일부 실패 문구가 있으면 실패로 본다
    if echo "$log_text" | grep -Eiq 'simulated renewals? failed|The following simulated renewals failed|Certbot failed'; then
        echo "FAIL"
        return 1
    fi

    echo "SUCCESS"
    return 0
}

# pipefail 환경에서 certbot|tee 실행 후 PIPESTATUS[0] 반환용 래퍼
# 인자: log_path -- certbot 인자들...
# 환경: SSL_CERTBOT_BIN (기본 certbot)
ssl_run_certbot_renew_dryrun() {
    local log_path="$1"
    shift
    local bin="${SSL_CERTBOT_BIN:-certbot}"
    local certbot_exit
    local pipefail_was_on=0

    # 호출 측 set -e / pipefail 상태를 깨지 않도록 보존
    if set -o | grep -q 'pipefail[[:space:]]*on'; then
        pipefail_was_on=1
    fi
    set +e
    set -o pipefail
    "$bin" renew --dry-run "$@" 2>&1 | tee "$log_path"
    certbot_exit=${PIPESTATUS[0]}
    if [ "$pipefail_was_on" -eq 0 ]; then
        set +o pipefail
    fi
    return "$certbot_exit"
}

# ---------------------------------------------------------------------------
# nginx reload deploy hook 설치
# ---------------------------------------------------------------------------

ssl_nginx_reload_hook_body() {
    cat <<'HOOK'
#!/bin/bash
# Let's Encrypt deploy hook: 갱신 성공 시 nginx reload
# 설치 경로: /etc/letsencrypt/renewal-hooks/deploy/01-reload-nginx.sh
set -euo pipefail
if command -v systemctl >/dev/null 2>&1; then
  systemctl reload nginx
else
  nginx -s reload
fi
HOOK
}

# 인자: [dest_path] [source_file]
# source_file 이 있으면 그 내용을 복사, 없으면 heredoc 본문 사용
ssl_install_nginx_reload_hook() {
    local dest="${1:-$SSL_DEPLOY_HOOK_PATH}"
    local src="${2:-}"
    local dir

    dir=$(dirname "$dest")
    mkdir -p "$dir"
    if [ -n "$src" ] && [ -f "$src" ]; then
        cp -a "$src" "$dest"
    else
        ssl_nginx_reload_hook_body > "$dest"
    fi
    chmod 755 "$dest"
    echo "HOOK_INSTALLED: $dest"
}
