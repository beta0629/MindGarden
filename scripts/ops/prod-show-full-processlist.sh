#!/usr/bin/env bash
# 운영 MySQL PROCESSLIST 읽기 전용 캡처 (슬로쿼리·락 진단용).
# 허용: SHOW FULL PROCESSLIST / information_schema.processlist SELECT 만.
# 금지: KILL, DDL, DML, 재시작. 이 스크립트에서 절대 KILL 하지 않는다.
# deploy-production.yml 과 트리거·책임 분리 — 배포 워크플로에서 호출하지 않는다.
set -euo pipefail

DB_HOST="${DB_HOST:-}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-mindgarden}"
DB_NAME="${DB_NAME:-core_solution}"
PROCESSLIST_LIMIT="${PROCESSLIST_LIMIT:-200}"

if [[ -z "${DB_HOST}" ]]; then
    echo "ERROR: DB_HOST is required" >&2
    exit 1
fi

# DB_PASSWORD 우선, 없으면 MYSQL_PWD (mysql 클라이언트 표준)
if [[ -n "${DB_PASSWORD:-}" ]]; then
    export MYSQL_PWD="${DB_PASSWORD}"
elif [[ -z "${MYSQL_PWD:-}" ]]; then
    echo "ERROR: DB_PASSWORD or MYSQL_PWD is required" >&2
    exit 1
fi

if ! command -v mysql >/dev/null 2>&1; then
    echo "ERROR: mysql client not found. Install mysql-client (e.g. apt-get install mysql-client)." >&2
    exit 1
fi

# 비밀번호는 로그에 출력하지 않음
echo "=== Prod MySQL PROCESSLIST (read-only) ==="
echo "Time (UTC): $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Host: ${DB_HOST}:${DB_PORT} User: ${DB_USER} DB: ${DB_NAME}"
echo "Note: KILL 금지 / DDL·DML 금지 / deploy-production 책임 분리"
echo ""

mysql_ro() {
    mysql \
        -h "${DB_HOST}" \
        -P "${DB_PORT}" \
        -u "${DB_USER}" \
        "${DB_NAME}" \
        --connect-timeout=15 \
        "$@"
}

echo "--- connection check (SELECT 1) ---"
if ! mysql_ro -N -B -e "SELECT 1;" >/dev/null; then
    echo "ERROR: MySQL connection failed (host=${DB_HOST} port=${DB_PORT} user=${DB_USER} db=${DB_NAME})" >&2
    exit 1
fi
echo "CONNECT: OK"
echo ""

echo "--- SHOW FULL PROCESSLIST ---"
mysql_ro -e "SHOW FULL PROCESSLIST;"
echo ""

# LIMIT 는 양의 정수만 허용 (주입 방지)
if ! printf '%s' "${PROCESSLIST_LIMIT}" | grep -Eq '^[1-9][0-9]*$'; then
    echo "ERROR: PROCESSLIST_LIMIT must be a positive integer (got: ${PROCESSLIST_LIMIT})" >&2
    exit 1
fi

echo "--- information_schema.processlist (ORDER BY TIME DESC, LIMIT ${PROCESSLIST_LIMIT}) ---"
mysql_ro -e "
SELECT
    ID,
    USER,
    HOST,
    DB,
    COMMAND,
    TIME,
    STATE,
    LEFT(INFO, 500) AS INFO_PREFIX
FROM information_schema.processlist
ORDER BY TIME DESC
LIMIT ${PROCESSLIST_LIMIT};
"
echo ""

echo "=== processlist end ==="
