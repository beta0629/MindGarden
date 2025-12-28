#!/bin/bash

# 개발 서버 로그 파일 정리 스크립트
# Usage: ./scripts/clean-dev-server-logs.sh [days] (기본값: 7일)

set -e

SERVER="root@beta0629.cafe24.com"
DAYS=${1:-7}  # 기본값: 7일

echo "🧹 개발 서버 로그 파일 정리 시작..."
echo "=========================================="
echo ""

# 1. 현재 로그 디렉토리 크기 확인
echo "📊 현재 로그 디렉토리 크기"
LOG_SIZE_BEFORE=$(ssh $SERVER "du -sh /var/www/mindgarden-dev/logs 2>/dev/null | awk '{print \$1}' || echo '0'")
echo "  현재 크기: ${LOG_SIZE_BEFORE}"
echo ""

# 2. 삭제 대상 로그 파일 수 확인
echo "🔍 ${DAYS}일 이상 된 로그 파일 확인"
OLD_LOG_COUNT=$(ssh $SERVER "find /var/www/mindgarden-dev/logs -name '*.log' -mtime +${DAYS} 2>/dev/null | wc -l")
if [ "$OLD_LOG_COUNT" -eq "0" ]; then
    echo "  ✅ 삭제할 로그 파일이 없습니다"
    exit 0
fi

echo "  삭제 대상: ${OLD_LOG_COUNT}개"
echo ""

# 3. 삭제 대상 파일 미리보기 (최대 10개)
echo "📋 삭제 대상 파일 (샘플)"
ssh $SERVER "find /var/www/mindgarden-dev/logs -name '*.log' -mtime +${DAYS} 2>/dev/null | head -10 | while read file; do ls -lh \"\$file\" | awk '{printf \"  - %s (%s)\\n\", \$9, \$5}'; done"
echo ""

# 4. 사용자 확인
read -p "위 로그 파일들을 삭제하시겠습니까? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 취소되었습니다"
    exit 1
fi

# 5. 로그 파일 삭제
echo "🗑️  로그 파일 삭제 중..."
DELETED_COUNT=$(ssh $SERVER "find /var/www/mindgarden-dev/logs -name '*.log' -mtime +${DAYS} -delete 2>/dev/null && echo 'OK' || echo 'FAILED'")

if [ "$DELETED_COUNT" = "OK" ]; then
    echo "  ✅ 로그 파일 삭제 완료"
else
    echo "  ⚠️  로그 파일 삭제 중 오류 발생"
    exit 1
fi
echo ""

# 6. 정리 후 로그 디렉토리 크기 확인
echo "📊 정리 후 로그 디렉토리 크기"
LOG_SIZE_AFTER=$(ssh $SERVER "du -sh /var/www/mindgarden-dev/logs 2>/dev/null | awk '{print \$1}' || echo '0'")
echo "  정리 후 크기: ${LOG_SIZE_AFTER}"
echo ""

# 7. 디스크 사용량 확인
echo "💾 디스크 사용량 확인"
DISK_USAGE=$(ssh $SERVER "df -h / | awk 'NR==2 {print \$5}'")
echo "  디스크 사용률: ${DISK_USAGE}"
echo ""

echo "=========================================="
echo "✅ 로그 파일 정리 완료"
echo "  - 삭제된 파일: 약 ${OLD_LOG_COUNT}개"
echo "  - 정리 전: ${LOG_SIZE_BEFORE}"
echo "  - 정리 후: ${LOG_SIZE_AFTER}"
echo ""

