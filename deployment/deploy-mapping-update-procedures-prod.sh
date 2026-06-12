#!/bin/bash

# 운영 DB에 매핑 수정 프로시저 배포 스크립트
# 사용법: ./deployment/deploy-mapping-update-procedures-prod.sh

echo "========================================"
echo "매핑 수정 프로시저 배포 스크립트"
echo "========================================"

# 운영 서버 정보
PROD_SERVER="beta74.cafe24.com"
SSH_USER="root"

# SQL 파일 경로
SQL_FILE="sql/mapping_update_procedures_mysql.sql"

# B8 (P0 보안, 2026-06-12): 저장소 평문 비밀번호 제거 — 환경변수 주입 필수.
# - 운영 SSH 실행 전 다음 중 하나로 비밀번호를 주입합니다.
#   1) source /etc/mindgarden/prod.env (DB_PASSWORD 등)
#   2) export PRODUCTION_DB_PASSWORD=... (GitHub Secrets 와 동일 이름)
#   3) export DB_PASSWORD=...
# heredoc 안으로 전달하기 위해 외부 변수에서 한 번에 확정한 뒤 unquoted heredoc 로 주입한다.
DB_PASSWORD_VALUE="${PRODUCTION_DB_PASSWORD:-${DB_PASSWORD:-}}"
: "${DB_PASSWORD_VALUE:?DB_PASSWORD 또는 PRODUCTION_DB_PASSWORD 환경변수가 필요합니다. /etc/mindgarden/prod.env 를 source 하거나 GitHub Secrets PRODUCTION_DB_PASSWORD 를 export 하세요.}"

echo ""
echo "1. SQL 파일 확인..."
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQL 파일을 찾을 수 없습니다: $SQL_FILE"
    exit 1
fi
echo "✅ SQL 파일 확인 완료"

echo ""
echo "2. 운영 서버로 SQL 파일 복사..."
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REMOTE_SQL_FILE="/tmp/mapping_update_procedures_${TIMESTAMP}.sql"
scp "$SQL_FILE" ${SSH_USER}@${PROD_SERVER}:${REMOTE_SQL_FILE}
if [ $? -ne 0 ]; then
    echo "❌ SQL 파일 복사 실패"
    exit 1
fi
echo "✅ SQL 파일 복사 완료"

echo ""
echo "3. 운영 서버에서 프로시저 배포..."

ssh ${SSH_USER}@${PROD_SERVER} << EOF
cd /tmp
REMOTE_SQL_FILE="${REMOTE_SQL_FILE}"
echo ""
echo "운영 데이터베이스에 프로시저 배포 중..."

# DB 정보 (기본값)
# B8 (P0 보안, 2026-06-12): heredoc 외부의 \$DB_PASSWORD_VALUE 가 unquoted heredoc 으로 주입됨.
DB_USER="mindgarden"
DB_PASS="${DB_PASSWORD_VALUE}"
DB_NAME="core_solution"

# 기존 프로시저 확인
echo "기존 프로시저 확인 중..."
mysql -h localhost -u "\$DB_USER" -p"\$DB_PASS" "\$DB_NAME" -e "SHOW PROCEDURE STATUS WHERE Db = '\$DB_NAME' AND Name IN ('UpdateMappingInfo', 'UpdateMappingStatistics', 'CheckMappingUpdatePermission');" 2>/dev/null || true

# 프로시저 배포 실행
echo "프로시저 배포 중..."
mysql -h localhost -u "\$DB_USER" -p"\$DB_PASS" "\$DB_NAME" < "\$REMOTE_SQL_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 프로시저 배포 완료"
    echo ""
    echo "4. 프로시저 존재 확인..."
    mysql -h localhost -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
    SHOW PROCEDURE STATUS WHERE Db = '$DB_NAME' AND Name IN ('UpdateMappingInfo', 'UpdateMappingStatistics', 'CheckMappingUpdatePermission');
    " 2>/dev/null
    
    echo ""
    echo "5. 임시 SQL 파일 삭제..."
    rm -f mapping_update_procedures_*.sql
    echo "✅ 완료"
    echo ""
    echo "========================================"
    echo "배포된 프로시저:"
    echo "  - UpdateMappingInfo: 매핑 정보 수정 및 ERP 재무 거래 동기화"
    echo "  - UpdateMappingStatistics: 매핑 통계 업데이트"
    echo "  - CheckMappingUpdatePermission: 매핑 수정 권한 확인"
    echo "========================================"
else
    echo "❌ 프로시저 배포 실패"
    echo ""
    echo "에러 확인을 위해 SQL 파일을 확인하세요:"
    ls -la mapping_update_procedures_*.sql
    exit 1
fi
EOF

echo ""
echo "========================================"
echo "프로시저 배포 완료!"
echo "========================================"
echo ""
echo "이제 매핑 수정 시 자동으로 ERP 재무 거래가 업데이트됩니다."
echo ""

