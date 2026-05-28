#!/bin/bash
# acme-dns register API 호출 + 가비아 CNAME 가이드 출력 + 자격증명 누적 저장
#
# 설계서: docs/project-management/2026-05-28/SSL_WILDCARD_ACMEDNS_AUTO_RENEW_HANDOFF.md
# 사용법:
#   sudo ./register-acme-dns-domain.sh <domain>           # 예: core-solution.co.kr
#   sudo ./register-acme-dns-domain.sh <domain> --dry-run # 호출 없이 단계만 출력
#
# 동작:
#   - acme-dns API (http://127.0.0.1:8053/register) 호출 → username/password/fulldomain/subdomain 수신
#   - /etc/letsencrypt/acmedns.json 에 도메인별 키로 누적 저장 (jq merge)
#   - 멱등: 이미 등록된 도메인은 기존 자격 증명 그대로 반환 (acme-dns 자체가 도메인↔자격증명 mapping을 강제하지 않으므로 저장된 값 우선 사용)
#   - 가비아 CNAME 가이드 출력

set -euo pipefail

readonly ACME_DNS_API="${ACME_DNS_API:-http://127.0.0.1:8053}"
readonly ACMEDNS_CREDENTIALS="${ACMEDNS_CREDENTIALS:-/etc/letsencrypt/acmedns.json}"
readonly LOG_PREFIX="[register-acme-dns-domain]"
DRY_RUN=0
DOMAIN=""

# ===== 옵션 파싱 =====
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=1 ;;
        -h|--help)
            grep '^#' "$0" | head -20
            exit 0
            ;;
        --*)
            echo "${LOG_PREFIX} 알 수 없는 옵션: $arg" >&2
            exit 2
            ;;
        *)
            if [[ -z "${DOMAIN}" ]]; then
                DOMAIN="$arg"
            else
                echo "${LOG_PREFIX} 도메인 인자는 1개만 허용됩니다." >&2
                exit 2
            fi
            ;;
    esac
done

if [[ -z "${DOMAIN}" ]]; then
    echo "${LOG_PREFIX} 사용법: $0 <domain> [--dry-run]" >&2
    exit 2
fi

log() { echo "${LOG_PREFIX} $*"; }

# ===== 사전 체크 =====
if [[ "${DRY_RUN}" -eq 0 && "$(id -u)" -ne 0 ]]; then
    echo "${LOG_PREFIX} root 권한 필요 (/etc/letsencrypt 쓰기)." >&2
    exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
    echo "${LOG_PREFIX} jq 미설치. 'apt-get install -y jq' 후 재실행." >&2
    [[ "${DRY_RUN}" -eq 0 ]] && exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
    echo "${LOG_PREFIX} curl 미설치." >&2
    exit 1
fi

log "도메인: ${DOMAIN}"
log "acme-dns API: ${ACME_DNS_API}/register"
log "자격증명 파일: ${ACMEDNS_CREDENTIALS}"

# ===== 기존 등록 확인 (멱등) =====
if [[ -f "${ACMEDNS_CREDENTIALS}" ]]; then
    if [[ "${DRY_RUN}" -eq 0 ]] && jq -e --arg d "${DOMAIN}" '.[$d]' "${ACMEDNS_CREDENTIALS}" >/dev/null 2>&1; then
        log "기존 자격증명 발견 → 재사용 (멱등)"
        EXISTING=$(jq --arg d "${DOMAIN}" '.[$d]' "${ACMEDNS_CREDENTIALS}")
        FULLDOMAIN=$(echo "${EXISTING}" | jq -r '.fulldomain')
        log ""
        log "=== 가비아 CNAME 가이드 (기존 등록) ==="
        log "  레코드: _acme-challenge.${DOMAIN}"
        log "  타입  : CNAME"
        log "  값    : ${FULLDOMAIN}."
        log "  TTL   : 600 (10분, 권장)"
        log ""
        echo "${EXISTING}" | jq .
        exit 0
    fi
fi

# ===== register 호출 =====
if [[ "${DRY_RUN}" -eq 1 ]]; then
    log "[dry-run] curl -X POST ${ACME_DNS_API}/register"
    log "[dry-run] 응답 예시: { \"username\": \"<uuid>\", \"password\": \"<...>\", \"fulldomain\": \"<uuid>.acme.core-solution.co.kr\", \"subdomain\": \"<uuid>\", \"allowfrom\": [] }"
    exit 0
fi

log "register API 호출 중..."
RESPONSE=$(curl -fsS -X POST -H "Content-Type: application/json" -d '{}' "${ACME_DNS_API}/register")
if [[ -z "${RESPONSE}" ]]; then
    echo "${LOG_PREFIX} 빈 응답. acme-dns 서비스 상태 확인." >&2
    exit 1
fi

USERNAME=$(echo "${RESPONSE}" | jq -r '.username')
PASSWORD=$(echo "${RESPONSE}" | jq -r '.password')
FULLDOMAIN=$(echo "${RESPONSE}" | jq -r '.fulldomain')
SUBDOMAIN=$(echo "${RESPONSE}" | jq -r '.subdomain')

if [[ -z "${USERNAME}" || "${USERNAME}" == "null" ]]; then
    echo "${LOG_PREFIX} register 응답 파싱 실패. 응답 원문:" >&2
    echo "${RESPONSE}" >&2
    exit 1
fi

# ===== 자격증명 누적 저장 =====
mkdir -p "$(dirname "${ACMEDNS_CREDENTIALS}")"
if [[ ! -f "${ACMEDNS_CREDENTIALS}" ]]; then
    echo '{}' > "${ACMEDNS_CREDENTIALS}"
    chmod 0600 "${ACMEDNS_CREDENTIALS}"
fi

NEW_ENTRY=$(jq -n \
    --arg u "${USERNAME}" \
    --arg p "${PASSWORD}" \
    --arg f "${FULLDOMAIN}" \
    --arg s "${SUBDOMAIN}" \
    '{username:$u, password:$p, fulldomain:$f, subdomain:$s, allowfrom:[]}')

MERGED=$(jq --arg d "${DOMAIN}" --argjson e "${NEW_ENTRY}" '. + {($d): $e}' "${ACMEDNS_CREDENTIALS}")
echo "${MERGED}" > "${ACMEDNS_CREDENTIALS}"
chown root:root "${ACMEDNS_CREDENTIALS}"
chmod 0600 "${ACMEDNS_CREDENTIALS}"

log ""
log "=== 등록 완료 ==="
log "  도메인       : ${DOMAIN}"
log "  username     : ${USERNAME}"
log "  fulldomain   : ${FULLDOMAIN}"
log "  subdomain    : ${SUBDOMAIN}"
log "  저장 위치    : ${ACMEDNS_CREDENTIALS}"
log ""
log "=== 가비아에 등록할 CNAME (Phase B 사용자 1회 작업) ==="
log "  레코드: _acme-challenge.${DOMAIN}"
log "  타입  : CNAME"
log "  값    : ${FULLDOMAIN}."
log "  TTL   : 600 (10분, 권장)"
log ""
log "전파 확인 (5~10분 후):"
log "  dig CNAME _acme-challenge.${DOMAIN} +short"
log "  → 결과가 '${FULLDOMAIN}.' 이면 OK"
