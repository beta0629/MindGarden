#!/bin/bash
# acme-dns SQLite DB 백업 (일일, 7일 rolling)
#
# 설계서: docs/project-management/2026-05-28/SSL_WILDCARD_ACMEDNS_AUTO_RENEW_HANDOFF.md
# 운영:
#   - systemd timer (config/systemd/acme-dns-backup.timer) 가 매일 02:30 KST 호출
#   - 또는 cron: 30 2 * * * /usr/local/bin/backup-acme-dns-sqlite.sh
#
# 사용법:
#   sudo ./backup-acme-dns-sqlite.sh           # 백업 실행
#   sudo ./backup-acme-dns-sqlite.sh --dry-run # 동작만 출력
#   sudo ./backup-acme-dns-sqlite.sh --verify  # 백업 무결성 sqlite3 .schema 검증

set -euo pipefail

readonly ACME_DNS_DB="${ACME_DNS_DB:-/var/lib/acme-dns/acme-dns.db}"
readonly BACKUP_DIR="${ACME_DNS_BACKUP_DIR:-/var/backups/acme-dns}"
readonly RETENTION_DAYS="${ACME_DNS_BACKUP_RETENTION:-7}"
readonly LOG_PREFIX="[backup-acme-dns-sqlite]"

DRY_RUN=0
VERIFY=0

for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=1 ;;
        --verify)  VERIFY=1 ;;
        -h|--help)
            grep '^#' "$0" | head -15
            exit 0
            ;;
        *)
            echo "${LOG_PREFIX} 알 수 없는 옵션: $arg" >&2
            exit 2
            ;;
    esac
done

log() { echo "${LOG_PREFIX} $*"; }

if [[ "${DRY_RUN}" -eq 0 && "$(id -u)" -ne 0 ]]; then
    echo "${LOG_PREFIX} root 권한 필요." >&2
    exit 1
fi

if [[ ! -f "${ACME_DNS_DB}" ]]; then
    if [[ "${DRY_RUN}" -eq 1 ]]; then
        log "[dry-run] DB 미존재 (${ACME_DNS_DB}). 운영 환경에서 정상."
    else
        echo "${LOG_PREFIX} DB 미존재: ${ACME_DNS_DB}" >&2
        exit 1
    fi
fi

TIMESTAMP="$(date +%Y%m%d)"
BACKUP_FILE="${BACKUP_DIR}/acme-dns-${TIMESTAMP}.db"

log "원본       : ${ACME_DNS_DB}"
log "백업 위치  : ${BACKUP_FILE}"
log "보관 일수  : ${RETENTION_DAYS}"

if [[ "${DRY_RUN}" -eq 1 ]]; then
    log "[dry-run] install -d -m 0750 ${BACKUP_DIR}"
    log "[dry-run] sqlite3 ${ACME_DNS_DB} \".backup ${BACKUP_FILE}\""
    log "[dry-run] find ${BACKUP_DIR} -name 'acme-dns-*.db' -mtime +${RETENTION_DAYS} -delete"
    exit 0
fi

install -d -m 0750 -o root -g root "${BACKUP_DIR}"

# sqlite3 .backup 명령은 활성 DB 도 안전하게 복제 (PRAGMA WAL 호환)
if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "${ACME_DNS_DB}" ".backup '${BACKUP_FILE}'"
    log "✅ sqlite3 .backup 완료"
else
    # fallback: cp (acme-dns 가 활성 상태면 약간의 일관성 위험)
    log "⚠️  sqlite3 CLI 미설치. cp 로 대체 (acme-dns 정지 권장)"
    cp -a "${ACME_DNS_DB}" "${BACKUP_FILE}"
fi

chmod 0640 "${BACKUP_FILE}"

if [[ "${VERIFY}" -eq 1 ]] && command -v sqlite3 >/dev/null 2>&1; then
    log "백업 무결성 검증..."
    if sqlite3 "${BACKUP_FILE}" "PRAGMA integrity_check;" | grep -q "^ok$"; then
        log "✅ integrity_check OK"
    else
        echo "${LOG_PREFIX} ❌ integrity_check FAIL: ${BACKUP_FILE}" >&2
        exit 1
    fi
fi

# 7일 rolling
DELETED=$(find "${BACKUP_DIR}" -maxdepth 1 -name 'acme-dns-*.db' -mtime "+${RETENTION_DAYS}" -print -delete | wc -l)
log "rolling 정리: ${DELETED} 개 삭제 (보관 ${RETENTION_DAYS}일)"

# 백업 통계
TOTAL=$(find "${BACKUP_DIR}" -maxdepth 1 -name 'acme-dns-*.db' | wc -l)
SIZE=$(du -sh "${BACKUP_DIR}" 2>/dev/null | awk '{print $1}')
log "현재 백업 ${TOTAL} 개, 디렉터리 크기 ${SIZE}"
