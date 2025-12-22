#!/bin/bash

# 디스크 공간 확인 스크립트
# 디스크 사용률이 80% 이상이면 경고

set -e

THRESHOLD=80
WARNING_THRESHOLD=75

echo "🔍 디스크 공간 확인"
echo "=================================="

# 현재 디스크 사용률 확인
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
DISK_FREE=$(df -h / | awk 'NR==2 {print $4}')
DISK_TOTAL=$(df -h / | awk 'NR==2 {print $2}')
DISK_USED=$(df -h / | awk 'NR==2 {print $3}')
DISK_FREE_PERCENT=$((100 - DISK_USAGE))

echo "📊 디스크 상태:"
echo "  전체: $DISK_TOTAL"
echo "  사용: $DISK_USED ($DISK_USAGE%)"
echo "  여유: $DISK_FREE ($DISK_FREE_PERCENT%)"
echo ""

# 큰 디렉토리 확인
echo "📁 큰 디렉토리 (상위 10개):"
du -h / 2>/dev/null | sort -rh | head -10 | while read size path; do
    echo "  $size  $path"
done

echo ""
echo "📊 로그 파일 크기:"
if [ -d "/var/log" ]; then
    du -sh /var/log/* 2>/dev/null | sort -rh | head -10 | while read size path; do
        echo "  $size  $path"
    done
fi

echo ""
echo "📊 애플리케이션 로그 크기:"
if [ -d "/var/www/mindgarden-dev/logs" ]; then
    du -sh /var/www/mindgarden-dev/logs/* 2>/dev/null | sort -rh | head -10 | while read size path; do
        echo "  $size  $path"
    done
fi

echo ""
echo "📊 백업 파일 크기:"
if [ -d "/var/www/mindgarden-dev/backups" ]; then
    du -sh /var/www/mindgarden-dev/backups/* 2>/dev/null | sort -rh | head -10 | while read size path; do
        echo "  $size  $path"
    done
fi

echo ""

# 경고 체크
if [ "$DISK_USAGE" -ge "$THRESHOLD" ]; then
    echo "🚨 경고: 디스크 사용률이 ${THRESHOLD}% 이상입니다!"
    echo "   자동 정리 스크립트 실행 권장: ./scripts/development/utilities/auto-disk-cleanup.sh"
    exit 1
elif [ "$DISK_USAGE" -ge "$WARNING_THRESHOLD" ]; then
    echo "⚠️ 주의: 디스크 사용률이 ${WARNING_THRESHOLD}% 이상입니다."
    echo "   곧 정리가 필요할 수 있습니다."
    exit 0
else
    echo "✅ 디스크 공간이 충분합니다."
    exit 0
fi

