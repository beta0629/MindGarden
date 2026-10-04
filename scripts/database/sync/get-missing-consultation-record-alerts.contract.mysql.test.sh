#!/bin/bash
# GetMissingConsultationRecordAlerts 계약 테스트 — 일회용 MySQL 8.0 에서 배포 SQL 을 적재하고 CALL 결과를 검사한다.
# Java(PlSqlConsultationRecordAlertServiceImpl) 가 넘기는 인자 순서·타입과 OUT 파라미터를 그대로 쓴다.
# 필요 env: DB_HOST DB_USER DB_PASS DB_NAME (DB_PORT 선택), PROCEDURE_STAGING_TEST_DB=disposable
# 개발·운영 DB 에는 실행하지 않는다. CI 서비스 컨테이너·로컬 일회용 컨테이너 전용.
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
DEPLOY_SQL="$ROOT/database/schema/procedures_standardized/deployment/GetMissingConsultationRecordAlerts_deploy.sql"
PARAM_TAIL=", @alerts, @total, @ok, @msg); SELECT @ok, @total, JSON_LENGTH(@alerts), @alerts;"

fail() {
    echo "FAIL: $*" >&2
    exit 1
}

[ "${PROCEDURE_STAGING_TEST_DB:-}" = "disposable" ] \
    || fail "PROCEDURE_STAGING_TEST_DB=disposable 일 때만 실행합니다 (일회용 컨테이너 DB 전용)."
: "${DB_HOST:?DB_HOST 필요}"
: "${DB_USER:?DB_USER 필요}"
: "${DB_PASS:?DB_PASS 필요}"
: "${DB_NAME:?DB_NAME 필요}"

sql() {
    MYSQL_PWD="$DB_PASS" mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -N -B "$DB_NAME" "$@"
}

sql <<'SQL'
DROP TABLE IF EXISTS mg_contract_dummy;
DROP TABLE IF EXISTS institution_link_consultation_logs;
DROP TABLE IF EXISTS consultation_records;
DROP TABLE IF EXISTS schedules;
CREATE TABLE schedules (
    id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36),
    consultant_id BIGINT NOT NULL,
    client_id BIGINT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(32) NOT NULL,
    is_deleted BIT(1) NOT NULL DEFAULT b'0'
);
CREATE TABLE consultation_records (
    id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36),
    consultation_id BIGINT NOT NULL,
    is_deleted BIT(1) NOT NULL DEFAULT b'0'
);
CREATE TABLE institution_link_consultation_logs (
    id BIGINT PRIMARY KEY,
    tenant_id VARCHAR(36),
    schedule_id BIGINT,
    is_deleted BIT(1) NOT NULL DEFAULT b'0'
);
INSERT INTO schedules (id, tenant_id, consultant_id, client_id, date, start_time, end_time, status, is_deleted) VALUES
 (1, 'tenant-a', 10, 20, '2026-09-10', '10:00', '10:50', 'COMPLETED', b'0'),
 (2, 'tenant-a', 10, 21, '2026-09-11', '11:00', '11:50', 'CONFIRMED', b'0'),
 (3, 'tenant-a', 11, 22, '2026-09-11', '09:00', '09:50', 'BOOKED', b'0'),
 (4, 'tenant-a', 10, 20, '2026-09-12', '10:00', '10:50', 'COMPLETED', b'0'),
 (5, 'tenant-a', 10, 20, '2026-09-13', '10:00', '10:50', 'COMPLETED', b'0'),
 (6, 'tenant-a', 10, 20, '2026-09-14', '10:00', '10:50', 'CANCELLED', b'0'),
 (7, 'tenant-a', 10, 20, '2026-09-15', '10:00', '10:50', 'COMPLETED', b'1'),
 (8, 'tenant-a', 10, 20, '2026-09-30', '10:00', '10:50', 'COMPLETED', b'0'),
 (9, 'tenant-b', 90, 91, '2026-09-10', '10:00', '10:50', 'COMPLETED', b'0'),
 (10, 'tenant-a', 10, 20, '2026-09-16', '10:00', '10:50', 'COMPLETED', b'0');
INSERT INTO consultation_records (id, tenant_id, consultation_id, is_deleted) VALUES
 (100, 'tenant-a', 4, b'0'),
 (101, 'tenant-a', 10, b'1'),
 (102, 'tenant-b', 1, b'0');
INSERT INTO institution_link_consultation_logs (id, tenant_id, schedule_id, is_deleted) VALUES
 (200, 'tenant-a', 5, b'0');
SQL

sql < "$DEPLOY_SQL" || fail "배포 SQL 적재 실패"

params=$(sql -e "SELECT GROUP_CONCAT(CONCAT(PARAMETER_MODE,' ',PARAMETER_NAME,' ',DATA_TYPE) ORDER BY ORDINAL_POSITION SEPARATOR '|')
  FROM information_schema.PARAMETERS WHERE SPECIFIC_SCHEMA=DATABASE() AND SPECIFIC_NAME='GetMissingConsultationRecordAlerts'")
expected="IN p_tenant_id varchar|IN p_start_date date|IN p_end_date date|IN p_today date|IN p_statuses varchar|OUT p_alerts json|OUT p_total_count int|OUT p_success tinyint|OUT p_message text"
[ "$params" = "$expected" ] || fail "파라미터 계약 불일치: $params"

call() {
    sql -e "CALL GetMissingConsultationRecordAlerts($1$PARAM_TAIL"
}

# 1) 테넌트 A, 9월, 오늘 9/30: 1(COMPLETED)·2(CONFIRMED)·3(BOOKED)·10(삭제된 일지 → 미작성) = 4건.
#    4(일지 있음)·5(타기관 일지)·6(취소)·7(삭제 일정)·8(오늘)·9(B 테넌트) 제외.
row=$(call "'tenant-a', '2026-09-01', '2026-09-30', '2026-09-30', 'BOOKED,COMPLETED,CONFIRMED'")
IFS=$'\t' read -r ok total len alerts <<<"$row"
[ "$ok" = "1" ] || fail "성공 플래그 아님: $ok"
[ "$total" = "4" ] || fail "총 건수 4 기대, 실제 $total"
[ "$len" = "4" ] || fail "JSON 길이 4 기대, 실제 $len"
ids=$(sql -e "SELECT GROUP_CONCAT(j.id ORDER BY j.ord) FROM JSON_TABLE(CAST('$alerts' AS JSON), '\$[*]'
  COLUMNS (ord FOR ORDINALITY, id BIGINT PATH '\$.scheduleId')) j")
[ "$ids" = "10,2,3,1" ] || fail "최신 일정 순서·대상 불일치: $ids"
echo "$alerts" | grep -q '"tenant-b"\|"consultantId": 90' && fail "다른 테넌트 행이 섞였습니다"
echo "$alerts" | grep -q '"consultantName"' && fail "프로시저가 이름(암호화 컬럼)을 돌려주면 안 됩니다"

# 2) 대상 상태 인자로만 거른다 (COMPLETED 만 → 1, 10)
row=$(call "'tenant-a', '2026-09-01', '2026-09-30', '2026-09-30', 'COMPLETED'")
IFS=$'\t' read -r ok total _ _ <<<"$row"
[ "$ok/$total" = "1/2" ] || fail "상태 필터 결과 1/2 기대, 실제 $ok/$total"

# 3) 해당 없음 → 성공 + 빈 배열
row=$(call "'tenant-none', '2026-09-01', '2026-09-30', '2026-09-30', 'COMPLETED'")
IFS=$'\t' read -r ok total len _ <<<"$row"
[ "$ok/$total/$len" = "1/0/0" ] || fail "빈 결과 1/0/0 기대, 실제 $ok/$total/$len"

# 4) 잘못된 인자 → 실패 + 빈 배열 (오류 문구는 Java 가 공용 문구로 바꾼다)
row=$(call "NULL, '2026-09-01', '2026-09-30', '2026-09-30', 'COMPLETED'")
IFS=$'\t' read -r ok total len _ <<<"$row"
[ "$ok/$total/$len" = "0/0/0" ] || fail "잘못된 인자 0/0/0 기대, 실제 $ok/$total/$len"

# 5) ONLY_FULL_GROUP_BY 세션에서도 오류 없이 동작
mode_row=$(sql -e "SET SESSION sql_mode='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES';
  CALL GetMissingConsultationRecordAlerts('tenant-a', '2026-09-01', '2026-09-30', '2026-09-30', 'COMPLETED'$PARAM_TAIL")
IFS=$'\t' read -r ok _ _ _ <<<"$mode_row"
[ "$ok" = "1" ] || fail "ONLY_FULL_GROUP_BY 에서 실패"

sql -e "DROP TABLE IF EXISTS institution_link_consultation_logs; DROP TABLE IF EXISTS consultation_records;
  DROP TABLE IF EXISTS schedules; DROP PROCEDURE IF EXISTS GetMissingConsultationRecordAlerts;"
echo "PASS get-missing-consultation-record-alerts contract"
