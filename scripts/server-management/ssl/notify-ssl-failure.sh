#!/bin/bash
# SSL 발급/갱신 실패 알림 (이메일)
#
# 설계서: docs/project-management/2026-05-28/SSL_WILDCARD_ACMEDNS_AUTO_RENEW_HANDOFF.md
# 통합:
#   - certbot post-hook: /etc/letsencrypt/renewal-hooks/post/notify-ssl.sh → 이 스크립트 호출
#   - manual 호출: /usr/local/bin/notify-ssl-failure.sh "subject" "body"
#   - systemd timer 실패 시: OnFailure= 로 트리거 가능 (별도 unit)
#
# 사용법:
#   ./notify-ssl-failure.sh "SSL renewal failure on dev" "/var/log/letsencrypt/letsencrypt.log"
#   ./notify-ssl-failure.sh --dry-run "subject" "log-or-body"
#
# 환경변수:
#   SSL_NOTIFY_EMAIL  : 수신자 (기본 beta74@live.co.kr)
#   SSL_NOTIFY_FROM   : 발신자 (기본 acme-dns@<hostname>)

set -euo pipefail

readonly NOTIFY_EMAIL="${SSL_NOTIFY_EMAIL:-beta74@live.co.kr}"
readonly NOTIFY_FROM="${SSL_NOTIFY_FROM:-acme-dns@$(hostname -f 2>/dev/null || hostname)}"
readonly LOG_PREFIX="[notify-ssl-failure]"

DRY_RUN=0
SUBJECT=""
BODY_OR_LOG=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run) DRY_RUN=1; shift ;;
        -h|--help)
            grep '^#' "$0" | head -20
            exit 0
            ;;
        *)
            if [[ -z "${SUBJECT}" ]]; then
                SUBJECT="$1"
            elif [[ -z "${BODY_OR_LOG}" ]]; then
                BODY_OR_LOG="$1"
            else
                echo "${LOG_PREFIX} 인자 너무 많음." >&2
                exit 2
            fi
            shift
            ;;
    esac
done

if [[ -z "${SUBJECT}" ]]; then
    SUBJECT="[$(hostname)] SSL operation"
fi

log() { echo "${LOG_PREFIX} $*"; }

# Body 결정: 파일 경로면 tail, 아니면 그대로
BODY=""
if [[ -n "${BODY_OR_LOG}" && -f "${BODY_OR_LOG}" ]]; then
    BODY="$(tail -n 200 "${BODY_OR_LOG}" 2>/dev/null || echo "log read failed: ${BODY_OR_LOG}")"
elif [[ -n "${BODY_OR_LOG}" ]]; then
    BODY="${BODY_OR_LOG}"
else
    BODY="(no body)"
fi

# 표준 헤더 추가
FULL_BODY="$(cat <<EOF
Host    : $(hostname -f 2>/dev/null || hostname)
Time    : $(date -u +%Y-%m-%dT%H:%M:%SZ)
Subject : ${SUBJECT}

----- 8< -----
${BODY}
----- 8< -----

certbot 상태:
$(certbot certificates 2>/dev/null | head -40 || echo "(certbot 미설치 또는 인증서 없음)")

acme-dns 상태:
$(systemctl is-active acme-dns 2>/dev/null || echo "(inactive)")
EOF
)"

log "수신자  : ${NOTIFY_EMAIL}"
log "제목    : ${SUBJECT}"

if [[ "${DRY_RUN}" -eq 1 ]]; then
    log "[dry-run] 메일 발송 생략. 본문 미리보기:"
    echo "${FULL_BODY}" | head -30
    exit 0
fi

# 메일 전송: mail 우선, sendmail fallback
if command -v mail >/dev/null 2>&1; then
    echo "${FULL_BODY}" | mail -s "${SUBJECT}" -r "${NOTIFY_FROM}" "${NOTIFY_EMAIL}"
    log "✅ mail 전송 완료"
elif command -v sendmail >/dev/null 2>&1; then
    {
        echo "From: ${NOTIFY_FROM}"
        echo "To: ${NOTIFY_EMAIL}"
        echo "Subject: ${SUBJECT}"
        echo ""
        echo "${FULL_BODY}"
    } | sendmail -t
    log "✅ sendmail 전송 완료"
else
    echo "${LOG_PREFIX} mail/sendmail 미설치. journalctl 에 기록만:" >&2
    logger -t notify-ssl-failure "${SUBJECT}: ${BODY}" || true
    echo "${LOG_PREFIX} 'apt-get install -y bsd-mailx' 또는 'mailutils' 설치 권장." >&2
    exit 1
fi
