#!/bin/bash
# acme-dns 기반 와일드카드 SSL 발급 래퍼 (Phase C 사용 대비)
#
# 설계서: docs/project-management/2026-05-28/SSL_WILDCARD_ACMEDNS_AUTO_RENEW_HANDOFF.md
# 기존 issue-wildcard-ssl-prod.sh / issue-wildcard-ssl-dev.sh 의 무인 대체.
#
# 사용법:
#   sudo ./issue-wildcard-ssl-via-acmedns.sh <root-domain> [--email <email>] [--force] [--dry-run]
# 예:
#   sudo ./issue-wildcard-ssl-via-acmedns.sh core-solution.co.kr
#   sudo ./issue-wildcard-ssl-via-acmedns.sh dev.core-solution.co.kr --email admin@e-trinity.co.kr
#   sudo ./issue-wildcard-ssl-via-acmedns.sh core-solution.co.kr --dry-run
#
# 사전 조건:
#   1) acme-dns systemd active (install-acme-dns.sh 완료)
#   2) register-acme-dns-domain.sh <root-domain> 완료 → /etc/letsencrypt/acmedns.json 항목 존재
#   3) 가비아 CNAME 등록 + 전파 완료 (Phase B)
#   4) certbot + certbot-dns-acmedns 플러그인 설치

set -euo pipefail

readonly ACMEDNS_CREDENTIALS="${ACMEDNS_CREDENTIALS:-/etc/letsencrypt/acmedns.json}"
readonly DEFAULT_EMAIL="${ACME_DNS_EMAIL:-admin@e-trinity.co.kr}"
readonly LOG_PREFIX="[issue-wildcard-ssl-via-acmedns]"

DRY_RUN=0
FORCE=0
EMAIL="${DEFAULT_EMAIL}"
ROOT_DOMAIN=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run) DRY_RUN=1; shift ;;
        --force)   FORCE=1; shift ;;
        --email)   EMAIL="$2"; shift 2 ;;
        -h|--help)
            grep '^#' "$0" | head -25
            exit 0
            ;;
        --*)
            echo "${LOG_PREFIX} 알 수 없는 옵션: $1" >&2
            exit 2
            ;;
        *)
            if [[ -z "${ROOT_DOMAIN}" ]]; then
                ROOT_DOMAIN="$1"
            else
                echo "${LOG_PREFIX} 도메인 인자는 1개만 허용됩니다." >&2
                exit 2
            fi
            shift
            ;;
    esac
done

if [[ -z "${ROOT_DOMAIN}" ]]; then
    echo "${LOG_PREFIX} 사용법: $0 <root-domain> [--email <email>] [--force] [--dry-run]" >&2
    exit 2
fi

log() { echo "${LOG_PREFIX} $*"; }

if [[ "${DRY_RUN}" -eq 0 && "$(id -u)" -ne 0 ]]; then
    echo "${LOG_PREFIX} root 권한 필요 (sudo)." >&2
    exit 1
fi

# ===== 사전 점검 =====
log "사전 점검..."
if ! command -v certbot >/dev/null 2>&1; then
    echo "${LOG_PREFIX} certbot 미설치. apt-get install -y certbot 후 재실행." >&2
    [[ "${DRY_RUN}" -eq 0 ]] && exit 1
fi

PLUGIN_OK=0
if command -v certbot >/dev/null 2>&1; then
    if certbot plugins 2>/dev/null | grep -q "dns-acmedns"; then
        PLUGIN_OK=1
    fi
fi
if [[ "${PLUGIN_OK}" -eq 0 ]]; then
    echo "${LOG_PREFIX} certbot-dns-acmedns 플러그인 미설치." >&2
    echo "${LOG_PREFIX}   설치: pip3 install certbot-dns-acmedns" >&2
    [[ "${DRY_RUN}" -eq 0 ]] && exit 1
fi

if [[ ! -f "${ACMEDNS_CREDENTIALS}" ]]; then
    echo "${LOG_PREFIX} 자격증명 파일 ${ACMEDNS_CREDENTIALS} 미존재. register-acme-dns-domain.sh ${ROOT_DOMAIN} 먼저 실행." >&2
    [[ "${DRY_RUN}" -eq 0 ]] && exit 1
fi

if [[ "${DRY_RUN}" -eq 0 ]] && command -v jq >/dev/null 2>&1; then
    if ! jq -e --arg d "${ROOT_DOMAIN}" '.[$d]' "${ACMEDNS_CREDENTIALS}" >/dev/null 2>&1; then
        echo "${LOG_PREFIX} ${ACMEDNS_CREDENTIALS} 에 ${ROOT_DOMAIN} 항목 없음. register-acme-dns-domain.sh ${ROOT_DOMAIN} 먼저 실행." >&2
        exit 1
    fi
fi

# ===== CNAME 전파 확인 =====
CHALLENGE_NAME="_acme-challenge.${ROOT_DOMAIN}"
log "CNAME 전파 확인: dig CNAME ${CHALLENGE_NAME} +short"
if [[ "${DRY_RUN}" -eq 0 ]] && command -v dig >/dev/null 2>&1; then
    CNAME_RESULT="$(dig CNAME "${CHALLENGE_NAME}" +short || true)"
    if [[ -z "${CNAME_RESULT}" ]]; then
        echo "${LOG_PREFIX} ⚠️  ${CHALLENGE_NAME} CNAME 미전파. 가비아 등록 + 5-10분 대기 후 재실행." >&2
        if [[ "${FORCE}" -ne 1 ]]; then
            echo "${LOG_PREFIX} 강제 진행: --force 옵션 사용" >&2
            exit 1
        fi
    else
        log "   ✅ ${CHALLENGE_NAME} → ${CNAME_RESULT}"
    fi
fi

# ===== certbot 호출 =====
CERTBOT_ARGS=(
    certonly
    --non-interactive
    --agree-tos
    --email "${EMAIL}"
    --authenticator dns-acmedns
    --dns-acmedns-credentials "${ACMEDNS_CREDENTIALS}"
    --dns-acmedns-propagation-seconds 60
    -d "*.${ROOT_DOMAIN}"
    -d "${ROOT_DOMAIN}"
)

if [[ "${FORCE}" -eq 1 ]]; then
    CERTBOT_ARGS+=(--force-renewal)
fi

log "certbot 호출:"
log "  certbot ${CERTBOT_ARGS[*]}"

if [[ "${DRY_RUN}" -eq 1 ]]; then
    log "[dry-run] certbot 호출 생략"
    exit 0
fi

certbot "${CERTBOT_ARGS[@]}"

log ""
log "=== 발급 완료 ==="
log "  인증서 경로: /etc/letsencrypt/live/${ROOT_DOMAIN}/"
log "  fullchain  : /etc/letsencrypt/live/${ROOT_DOMAIN}/fullchain.pem"
log "  privkey    : /etc/letsencrypt/live/${ROOT_DOMAIN}/privkey.pem"
log ""
log "후속:"
log "  - nginx ssl_certificate 경로 확인 후 systemctl reload nginx"
log "  - 자동 갱신 검증: certbot renew --dry-run"
