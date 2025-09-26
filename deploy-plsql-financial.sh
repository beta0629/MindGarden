#!/bin/bash

# PL/SQL 재무 프로시저 배포 스크립트
# 통합 재무현황과 재무 보고서를 PL/SQL로 변경

echo "🚀 PL/SQL 재무 프로시저 배포 시작..."

# 데이터베이스 연결 정보 (환경변수에서 가져오기)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-mindgarden}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}

# SQL 스크립트 실행 (PL/SQL 한글 인코딩 설정)
echo "📊 통합 재무현황 PL/SQL 프로시저 생성..."
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD --default-character-set=utf8mb4 $DB_NAME < sql-scripts/consolidated_financial_procedures.sql

if [ $? -eq 0 ]; then
    echo "✅ 통합 재무현황 PL/SQL 프로시저 생성 완료"
else
    echo "❌ 통합 재무현황 PL/SQL 프로시저 생성 실패"
    exit 1
fi

echo "📊 재무 보고서 PL/SQL 프로시저 생성..."
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD --default-character-set=utf8mb4 $DB_NAME < sql-scripts/financial_reports_procedures.sql

if [ $? -eq 0 ]; then
    echo "✅ 재무 보고서 PL/SQL 프로시저 생성 완료"
else
    echo "❌ 재무 보고서 PL/SQL 프로시저 생성 실패"
    exit 1
fi

echo "🔍 PL/SQL 프로시저 확인..."
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD --default-character-set=utf8mb4 $DB_NAME -e "
SHOW PROCEDURE STATUS WHERE Db = '$DB_NAME' AND Name LIKE '%Financial%';
"

echo "✅ PL/SQL 재무 프로시저 배포 완료!"
echo ""
echo "📋 생성된 프로시저 목록:"
echo "  - GetConsolidatedFinancialData: 전사 통합 재무 현황"
echo "  - GetBranchFinancialBreakdown: 지점별 재무 상세"
echo "  - GetMonthlyFinancialTrend: 월별 재무 추이"
echo "  - GetCategoryFinancialBreakdown: 카테고리별 분석"
echo "  - GenerateMonthlyFinancialReport: 월별 보고서"
echo "  - GenerateQuarterlyFinancialReport: 분기별 보고서"
echo "  - GenerateYearlyFinancialReport: 연도별 보고서"
echo "  - CalculateFinancialKPIs: 재무 성과 지표"
echo ""
echo "🎯 이제 통합 재무현황과 재무 보고서가 PL/SQL로 처리됩니다!"
