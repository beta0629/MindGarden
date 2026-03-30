#!/bin/bash
# 표준화된 프로시저 배포용 파일 생성 스크립트
# DELIMITER 유지 (mysql 클라이언트에서 직접 실행 시 필요)

set -e

PROCEDURES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="${PROCEDURES_DIR}/deployment"

echo "🔧 배포용 프로시저 파일 생성 중..."

# 배포 디렉토리 생성
mkdir -p "$DEPLOY_DIR"

# 모든 표준화된 프로시저 파일 처리
for file in "$PROCEDURES_DIR"/*_standardized.sql; do
    if [ -f "$file" ]; then
        proc_name=$(basename "$file" _standardized.sql)
        deploy_file="${DEPLOY_DIR}/${proc_name}_deploy.sql"
        
        echo "처리 중: $proc_name"
        
        # 표준화된 파일을 그대로 복사 (DELIMITER 유지)
        cp "$file" "$deploy_file"
        
        echo "✅ ${proc_name}_deploy.sql 생성 완료"
    fi
done

echo ""
echo "✅ 배포용 프로시저 파일 생성 완료!"
echo "위치: $DEPLOY_DIR"
