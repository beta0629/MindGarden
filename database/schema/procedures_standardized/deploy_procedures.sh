#!/bin/bash
# 표준화된 프로시저 배포 스크립트
# 사용법: ./deploy_procedures.sh [프로시저명]

DB_HOST="beta0629.cafe24.com"
DB_USER="mindgarden_dev"
DB_PASS="MindGardenDev2025!@#"
DB_NAME="core_solution"

PROCEDURES_DIR="$(dirname "$0")"

if [ -z "$1" ]; then
    echo "모든 표준화된 프로시저 배포 중..."
    for file in "$PROCEDURES_DIR"/*_standardized.sql; do
        if [ -f "$file" ]; then
            procedure_name=$(basename "$file" _standardized.sql)
            echo "배포 중: $procedure_name"
            mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$file" 2>&1 | grep -v "Warning: Using a password"
            if [ $? -eq 0 ]; then
                echo "✅ $procedure_name 배포 완료"
            else
                echo "❌ $procedure_name 배포 실패"
            fi
        fi
    done
else
    procedure_name="$1"
    file="$PROCEDURES_DIR/${procedure_name}_standardized.sql"
    if [ -f "$file" ]; then
        echo "배포 중: $procedure_name"
        mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$file" 2>&1 | grep -v "Warning: Using a password"
        if [ $? -eq 0 ]; then
            echo "✅ $procedure_name 배포 완료"
        else
            echo "❌ $procedure_name 배포 실패"
        fi
    else
        echo "❌ 파일을 찾을 수 없습니다: $file"
        exit 1
    fi
fi

