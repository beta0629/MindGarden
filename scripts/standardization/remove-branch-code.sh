#!/bin/bash

# 브랜치 코드 제거 스크립트
# 표준화 작업: 브랜치 코드 완전 제거

set -e

echo "🚀 브랜치 코드 제거 스크립트 시작"
echo "=================================="

# 프로젝트 루트 디렉토리
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

# 백업 디렉토리
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo ""
echo "📋 1단계: 백엔드 Repository 쿼리에서 브랜치 필터링 제거"
echo "---------------------------------------------------"

# Repository 파일 목록
REPOSITORY_FILES=(
    "src/main/java/com/coresolution/consultation/repository/ConsultantRepository.java"
    "src/main/java/com/coresolution/consultation/repository/UserRepository.java"
    "src/main/java/com/coresolution/consultation/repository/ClientRepository.java"
    "src/main/java/com/coresolution/consultation/repository/SalaryCalculationRepository.java"
    "src/main/java/com/coresolution/consultation/repository/PaymentRepository.java"
    "src/main/java/com/coresolution/consultation/repository/ConsultationRepository.java"
    "src/main/java/com/coresolution/consultation/repository/ConsultationMessageRepository.java"
    "src/main/java/com/coresolution/consultation/repository/ConsultantPerformanceRepository.java"
    "src/main/java/com/coresolution/consultation/repository/ConsultantClientMappingRepository.java"
    "src/main/java/com/coresolution/consultation/repository/AlertRepository.java"
    "src/main/java/com/coresolution/consultation/repository/AccountRepository.java"
    "src/main/java/com/coresolution/consultation/repository/DailyStatisticsRepository.java"
)

for file in "${REPOSITORY_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  📝 처리 중: $file"
        # 백업
        cp "$file" "$BACKUP_DIR/$(basename $file).backup"
    fi
done

echo ""
echo "📋 2단계: Service 레이어에서 브랜치 코드 사용 제거"
echo "---------------------------------------------------"

# Service 파일 목록
SERVICE_FILES=(
    "src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java"
    "src/main/java/com/coresolution/consultation/service/impl/BranchServiceImpl.java"
    "src/main/java/com/coresolution/consultation/service/impl/UserServiceImpl.java"
    "src/main/java/com/coresolution/consultation/service/impl/ConsultantServiceImpl.java"
    "src/main/java/com/coresolution/consultation/service/impl/ClientServiceImpl.java"
    "src/main/java/com/coresolution/consultation/service/impl/SalaryManagementServiceImpl.java"
    "src/main/java/com/coresolution/consultation/service/impl/StatisticsServiceImpl.java"
)

for file in "${SERVICE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  📝 처리 중: $file"
        # 백업
        cp "$file" "$BACKUP_DIR/$(basename $file).backup"
    fi
done

echo ""
echo "✅ 백업 완료: $BACKUP_DIR"
echo ""
echo "⚠️  주의: 실제 제거 작업은 안전을 위해 수동으로 진행해야 합니다."
echo "이 스크립트는 파일 목록과 백업만 수행합니다."
echo ""
echo "다음 단계:"
echo "1. 백업 확인"
echo "2. 파일별 브랜치 코드 제거 작업"
echo "3. 컴파일 및 테스트"

