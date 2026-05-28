#!/bin/bash
# acme-dns 셀프호스팅 인프라 설치 스크립트 (Phase A)
#
# 설계서: docs/project-management/2026-05-28/SSL_WILDCARD_ACMEDNS_AUTO_RENEW_HANDOFF.md
# 결재 변수:
#   - 배치 위치   : beta0629.cafe24.com (dev 서버 단독, 설계서 §2 (a))
#   - 서비스 도메인: acme.core-solution.co.kr
#   - 데이터 저장 : SQLite (/var/lib/acme-dns/acme-dns.db)
#   - API 포트   : 127.0.0.1:8053 (mindgarden-dev가 8080 점유 → 충돌 방지)
#   - 53 UDP/TCP : 외부 공개 (dns-01 challenge용)
#
# 사용법:
#   sudo ./install-acme-dns.sh           # 실제 설치
#   sudo ./install-acme-dns.sh --dry-run # 단계만 출력 (다운로드/설치 없음)
#
# 멱등: 재실행 시 안전 (기존 바이너리/계정/설정은 보존, 부족분만 추가)

set -euo pipefail

# ===== 상수 (하드코딩 방지: 운영 변수는 함수 인자/환경변수로 노출) =====
readonly ACME_DNS_USER="acme-dns"
readonly ACME_DNS_GROUP="acme-dns"
readonly ACME_DNS_BIN="/usr/local/bin/acme-dns"
readonly ACME_DNS_ETC_DIR="/etc/acme-dns"
readonly ACME_DNS_CONFIG="${ACME_DNS_ETC_DIR}/config.cfg"
readonly ACME_DNS_DATA_DIR="/var/lib/acme-dns"
readonly ACME_DNS_DB="${ACME_DNS_DATA_DIR}/acme-dns.db"
readonly ACME_DNS_LOG_DIR="/var/log/acme-dns"
readonly ACME_DNS_DOMAIN="${ACME_DNS_DOMAIN:-acme.core-solution.co.kr}"
readonly ACME_DNS_NSADMIN="${ACME_DNS_NSADMIN:-admin.core-solution.co.kr}"
readonly ACME_DNS_API_BIND="${ACME_DNS_API_BIND:-127.0.0.1:8053}"
# 53 포트는 systemd-resolve(127.0.0.53:53) 와 충돌 회피를 위해 외부 IP 에만 바인딩.
# 0.0.0.0:53 으로 강제 시 ACME_DNS_DNS_BIND_OVERRIDE 사용.
ACME_DNS_DNS_BIND_OVERRIDE="${ACME_DNS_DNS_BIND_OVERRIDE:-}"
# acme-dns 저장소: 2024년경 joohoi → acme-dns 조직으로 이전. 새 release URL 패턴은
#   https://github.com/acme-dns/acme-dns/releases/download/<tag>/acme-dns_<version>_linux_amd64.tar.gz
# 기본값 v1.0 (안정). v2.x 는 2026-05-28 기준 startup deadlock 이슈로 회피 (Go 1.25 + go.sum 변경 영향).
# 새 안정 release 가 나오면 ACME_DNS_VERSION 환경변수로 override.
readonly ACME_DNS_VERSION="${ACME_DNS_VERSION:-1.0}"
readonly ACME_DNS_RELEASE_URL="${ACME_DNS_RELEASE_URL:-https://github.com/acme-dns/acme-dns/releases/download/v${ACME_DNS_VERSION}/acme-dns_${ACME_DNS_VERSION}_linux_amd64.tar.gz}"

readonly LOG_PREFIX="[install-acme-dns]"
DRY_RUN=0
SKIP_FIREWALL=0
ACME_DNS_PUBLIC_IP="${ACME_DNS_PUBLIC_IP:-}"
ACME_DNS_SYSTEMD_UNIT_SRC="${ACME_DNS_SYSTEMD_UNIT_SRC:-}"

# ===== 옵션 파싱 =====
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=1 ;;
        --skip-firewall) SKIP_FIREWALL=1 ;;
        --public-ip=*) ACME_DNS_PUBLIC_IP="${arg#*=}" ;;
        --systemd-unit=*) ACME_DNS_SYSTEMD_UNIT_SRC="${arg#*=}" ;;
        -h|--help)
            grep '^#' "$0" | head -40
            exit 0
            ;;
        *)
            echo "${LOG_PREFIX} 알 수 없는 옵션: $arg" >&2
            exit 2
            ;;
    esac
done

log() { echo "${LOG_PREFIX} $*"; }
run() {
    if [[ "${DRY_RUN}" -eq 1 ]]; then
        echo "${LOG_PREFIX} [dry-run] $*"
    else
        eval "$@"
    fi
}

# ===== 사전 체크 =====
if [[ "${DRY_RUN}" -eq 0 && "$(id -u)" -ne 0 ]]; then
    echo "${LOG_PREFIX} root 권한 필요 (sudo)." >&2
    exit 1
fi

if [[ "${DRY_RUN}" -eq 1 ]]; then
    log "==== DRY-RUN 모드: 실제 설치/다운로드를 수행하지 않습니다 ===="
fi

log "1/8) 시스템 계정 ${ACME_DNS_USER} 생성 (멱등)"
if id "${ACME_DNS_USER}" >/dev/null 2>&1; then
    log "   - 이미 존재: skip"
else
    run "useradd --system --no-create-home --shell /usr/sbin/nologin --user-group ${ACME_DNS_USER}"
fi

log "2/8) 디렉터리 생성 (${ACME_DNS_ETC_DIR}, ${ACME_DNS_DATA_DIR}, ${ACME_DNS_LOG_DIR})"
for d in "${ACME_DNS_ETC_DIR}" "${ACME_DNS_DATA_DIR}" "${ACME_DNS_LOG_DIR}"; do
    run "install -d -m 0750 -o ${ACME_DNS_USER} -g ${ACME_DNS_GROUP} ${d}"
done

log "3/8) acme-dns 바이너리 설치 (${ACME_DNS_BIN})"
if [[ -x "${ACME_DNS_BIN}" ]]; then
    if [[ "${DRY_RUN}" -eq 0 ]]; then
        log "   - 기존 바이너리 발견: 버전 확인"
        "${ACME_DNS_BIN}" -v 2>&1 || true
    fi
    log "   - 재설치는 별도 절차 (이번 단계에서는 skip)"
else
    TMP_DIR="$(mktemp -d 2>/dev/null || echo /tmp/acme-dns-install-$$)"
    log "   - 다운로드: ${ACME_DNS_RELEASE_URL} → ${TMP_DIR}"
    run "curl -fsSL '${ACME_DNS_RELEASE_URL}' -o ${TMP_DIR}/acme-dns.tar.gz"
    run "tar -xzf ${TMP_DIR}/acme-dns.tar.gz -C ${TMP_DIR}"
    # 2.x 부터 tar 안에 acme-dns 바이너리만 들어있음. 경로 자동 탐색.
    if [[ "${DRY_RUN}" -eq 0 ]]; then
        EXTRACTED_BIN="$(find ${TMP_DIR} -maxdepth 3 -name 'acme-dns' -type f -executable | head -1)"
        if [[ -z "${EXTRACTED_BIN}" ]]; then
            echo "${LOG_PREFIX} 다운로드된 tar 에서 acme-dns 바이너리 미발견" >&2
            ls -la "${TMP_DIR}" >&2
            exit 1
        fi
        install -m 0755 -o root -g root "${EXTRACTED_BIN}" "${ACME_DNS_BIN}"
    else
        log "   - [dry-run] install -m 0755 -o root -g root <extracted-bin> ${ACME_DNS_BIN}"
    fi
    run "rm -rf ${TMP_DIR}"
fi

log "4/8) 53 포트 바인딩 권한 부여 (CAP_NET_BIND_SERVICE)"
if [[ "${DRY_RUN}" -eq 0 ]]; then
    if command -v setcap >/dev/null 2>&1 && [[ -x "${ACME_DNS_BIN}" ]]; then
        setcap 'cap_net_bind_service=+ep' "${ACME_DNS_BIN}" || \
            log "   - setcap 실패 (systemd AmbientCapabilities로 대체)"
    else
        log "   - setcap 미사용 (systemd AmbientCapabilities로 대체)"
    fi
else
    log "   - [dry-run] setcap cap_net_bind_service=+ep ${ACME_DNS_BIN}"
fi

log "5/8) 설정 파일 ${ACME_DNS_CONFIG} 생성"
# 외부 IP 결정: --public-ip 옵션 > 환경변수 > 자동 감지 (ifconfig.me / hostname -I)
if [[ -z "${ACME_DNS_PUBLIC_IP}" ]]; then
    if command -v curl >/dev/null 2>&1; then
        ACME_DNS_PUBLIC_IP="$(curl -s --max-time 5 https://ifconfig.me 2>/dev/null || true)"
    fi
    if [[ -z "${ACME_DNS_PUBLIC_IP}" ]] && command -v hostname >/dev/null 2>&1; then
        ACME_DNS_PUBLIC_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
    fi
fi
if [[ -z "${ACME_DNS_PUBLIC_IP}" ]]; then
    ACME_DNS_PUBLIC_IP="0.0.0.0"
    log "   - 경고: 외부 IP 미감지. records A 레코드 0.0.0.0 로 설정 (수동 수정 필요)"
else
    log "   - 외부 IP: ${ACME_DNS_PUBLIC_IP}"
fi

# DNS listen 결정: override 우선, 없으면 외부 IP:53 (systemd-resolve 회피)
if [[ -n "${ACME_DNS_DNS_BIND_OVERRIDE}" ]]; then
    ACME_DNS_DNS_BIND="${ACME_DNS_DNS_BIND_OVERRIDE}"
else
    ACME_DNS_DNS_BIND="${ACME_DNS_PUBLIC_IP}:53"
fi
log "   - DNS listen: ${ACME_DNS_DNS_BIND}"

CONFIG_CONTENT=$(cat <<EOF
# acme-dns config.cfg
# 자동 생성: $(date -u +%Y-%m-%dT%H:%M:%SZ) by scripts/server-management/ssl/install-acme-dns.sh
# 설계서: docs/project-management/2026-05-28/SSL_WILDCARD_ACMEDNS_AUTO_RENEW_HANDOFF.md
# 변경 시: install-acme-dns.sh 재실행 또는 직접 수정 후 'systemctl restart acme-dns'

[general]
listen = "${ACME_DNS_DNS_BIND}"
protocol = "both"
domain = "${ACME_DNS_DOMAIN}"
nsname = "${ACME_DNS_DOMAIN}"
nsadmin = "${ACME_DNS_NSADMIN}"
records = [
    "${ACME_DNS_DOMAIN}. A ${ACME_DNS_PUBLIC_IP}",
    "${ACME_DNS_DOMAIN}. NS ${ACME_DNS_DOMAIN}.",
]
debug = false

[database]
engine = "sqlite3"
connection = "${ACME_DNS_DB}"

[api]
ip = "127.0.0.1"
disable_registration = false
# Phase B 종료 후 운영 단계에서 신규 register 차단 시: true 로 변경 후 systemctl restart acme-dns
port = "8053"
tls = "none"
corsorigins = [
    "*",
]
use_header = false
header_name = "X-Forwarded-For"

[logconfig]
loglevel = "info"
logtype = "stdout"
logformat = "text"
EOF
)

if [[ "${DRY_RUN}" -eq 1 ]]; then
    log "   - [dry-run] ${ACME_DNS_CONFIG} 작성 예정 (length=${#CONFIG_CONTENT} bytes)"
else
    if [[ -f "${ACME_DNS_CONFIG}" ]]; then
        BACKUP_PATH="${ACME_DNS_CONFIG}.bak.$(date +%Y%m%d-%H%M%S)"
        log "   - 기존 설정 백업: ${BACKUP_PATH}"
        cp -a "${ACME_DNS_CONFIG}" "${BACKUP_PATH}"
    fi
    echo "${CONFIG_CONTENT}" > "${ACME_DNS_CONFIG}"
    chown "${ACME_DNS_USER}:${ACME_DNS_GROUP}" "${ACME_DNS_CONFIG}"
    chmod 0640 "${ACME_DNS_CONFIG}"
    log "   - records A 레코드 IP=${ACME_DNS_PUBLIC_IP} (변경 필요 시 ${ACME_DNS_CONFIG} 수정 후 systemctl restart acme-dns)"
fi

log "5.5/8) 방화벽 (ufw) 53 포트 열기"
if [[ "${SKIP_FIREWALL}" -eq 1 ]]; then
    log "   - skip: --skip-firewall"
elif [[ "${DRY_RUN}" -eq 1 ]]; then
    log "   - [dry-run] ufw allow 53/udp / ufw allow 53/tcp"
elif command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q '^Status: active'; then
    ufw allow 53/udp comment 'acme-dns' || true
    ufw allow 53/tcp comment 'acme-dns' || true
    log "   - ufw 53/udp + 53/tcp allow 적용 (active)"
else
    log "   - ufw 비활성 또는 미설치 (skip)"
fi

log "6/8) systemd 유닛 설치 (/etc/systemd/system/acme-dns.service)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_UNIT=""
if [[ -n "${ACME_DNS_SYSTEMD_UNIT_SRC}" && -f "${ACME_DNS_SYSTEMD_UNIT_SRC}" ]]; then
    SOURCE_UNIT="${ACME_DNS_SYSTEMD_UNIT_SRC}"
else
    # 후보 경로 탐색 (저장소 root 또는 dev 서버 임시 디렉터리)
    CANDIDATES=(
        "${SCRIPT_DIR}/../../../config/systemd/acme-dns.service"
        "${SCRIPT_DIR}/../../config/systemd/acme-dns.service"
        "${SCRIPT_DIR}/../config/systemd/acme-dns.service"
    )
    for c in "${CANDIDATES[@]}"; do
        if [[ -f "$c" ]]; then
            SOURCE_UNIT="$c"
            break
        fi
    done
fi
if [[ -n "${SOURCE_UNIT}" ]]; then
    log "   - 소스: ${SOURCE_UNIT}"
    run "install -m 0644 -o root -g root ${SOURCE_UNIT} /etc/systemd/system/acme-dns.service"
    run "systemctl daemon-reload"
else
    log "   - 경고: acme-dns.service 미발견. --systemd-unit=<path> 옵션 또는 ACME_DNS_SYSTEMD_UNIT_SRC 환경변수로 명시"
fi

log "7/8) systemd 서비스 enable + start"
run "systemctl enable acme-dns.service"
run "systemctl restart acme-dns.service"

log "8/8) 헬스 체크"
if [[ "${DRY_RUN}" -eq 0 ]]; then
    sleep 3
    if ss -ulnp 2>/dev/null | grep -q ':53 '; then
        log "   ✅ 53/UDP listen 확인"
    else
        log "   ❌ 53/UDP listen 실패. journalctl -u acme-dns -n 50 확인"
    fi
    if curl -fsS "http://${ACME_DNS_API_BIND}/health" >/dev/null 2>&1; then
        log "   ✅ HTTP API health 200 OK (http://${ACME_DNS_API_BIND}/health)"
    else
        log "   ❌ HTTP API health 실패. journalctl -u acme-dns -n 50 확인"
    fi
else
    log "   - [dry-run] ss -ulnp / curl /health 생략"
fi

log "==== 설치 완료 ===="
log "다음 단계:"
log "  1) register-acme-dns-domain.sh core-solution.co.kr      # 운영 와일드카드 username/uuid 발급"
log "  2) register-acme-dns-domain.sh dev.core-solution.co.kr  # dev 와일드카드 username/uuid 발급"
log "  3) 가비아에 A 1건 + CNAME 2건 등록 (Phase B 사용자 작업)"
log "  4) issue-wildcard-ssl-via-acmedns.sh 로 인증서 발급 (Phase C)"
