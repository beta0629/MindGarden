#!/bin/bash

# 디스크 공간 자동 정리 스크립트
# 디스크 사용률이 80% 이상이면 자동으로 정리하여 20% 이상 여유 공간 확보

set -e

THRESHOLD=80  # 디스크 사용률 임계값 (%)
TARGET_FREE=20  # 목표 여유 공간 (%)

echo "🔍 디스크 공간 모니터링 및 자동 정리"
echo "=================================="

# 현재 디스크 사용률 확인
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
DISK_FREE=$(df -h / | awk 'NR==2 {print $4}')
DISK_TOTAL=$(df -h / | awk 'NR==2 {print $2}')
DISK_USED=$(df -h / | awk 'NR==2 {print $3}')

echo "📊 현재 디스크 상태:"
echo "  전체: $DISK_TOTAL"
echo "  사용: $DISK_USED ($DISK_USAGE%)"
echo "  여유: $DISK_FREE ($((100 - DISK_USAGE))%)"
echo ""

# 임계값 미만이면 정리 불필요
if [ "$DISK_USAGE" -lt "$THRESHOLD" ]; then
    echo "✅ 디스크 사용률이 ${THRESHOLD}% 미만입니다. 정리 불필요."
    exit 0
fi

echo "⚠️ 디스크 사용률이 ${THRESHOLD}% 이상입니다. 자동 정리 시작..."
echo ""

# 1. 오래된 syslog 파일 정리
echo "🧹 1. syslog 파일 정리..."
find /var/log -name "syslog.*" -type f -mtime +3 -delete 2>/dev/null || true
find /var/log -name "*.gz" -type f -mtime +7 -delete 2>/dev/null || true
echo "✅ syslog 파일 정리 완료"

# 2. journal 로그 정리 (7일 이상)
echo "🧹 2. journal 로그 정리..."
journalctl --vacuum-time=7d >/dev/null 2>&1 || true
echo "✅ journal 로그 정리 완료"

# 3. 애플리케이션 로그 정리 (7일 이상)
echo "🧹 3. 애플리케이션 로그 정리..."
if [ -d "/var/www/mindgarden-dev/logs" ]; then
    find /var/www/mindgarden-dev/logs -type f -mtime +7 -delete 2>/dev/null || true
    echo "✅ 애플리케이션 로그 정리 완료"
else
    echo "⚠️ 애플리케이션 로그 디렉토리 없음"
fi

# 4. 백업 파일 정리 (30일 이상)
echo "🧹 4. 백업 파일 정리..."
if [ -d "/var/www/mindgarden-dev/backups" ]; then
    find /var/www/mindgarden-dev/backups -type f -mtime +30 -delete 2>/dev/null || true
    echo "✅ 백업 파일 정리 완료"
else
    echo "⚠️ 백업 디렉토리 없음"
fi

# 5. /tmp 정리 (1일 이상)
echo "🧹 5. /tmp 정리..."
find /tmp -type f -mtime +1 -delete 2>/dev/null || true
echo "✅ /tmp 정리 완료"

# 정리 후 디스크 상태 확인
echo ""
echo "📊 정리 후 디스크 상태:"
DISK_USAGE_AFTER=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
DISK_FREE_AFTER=$(df -h / | awk 'NR==2 {print $4}')
DISK_USED_AFTER=$(df -h / | awk 'NR==2 {print $3}')

echo "  사용: $DISK_USED_AFTER ($DISK_USAGE_AFTER%)"
echo "  여유: $DISK_FREE_AFTER ($((100 - DISK_USAGE_AFTER))%)"

# 목표 여유 공간 달성 여부 확인
if [ "$DISK_USAGE_AFTER" -lt "$((100 - TARGET_FREE))" ]; then
    echo ""
    echo "✅ 목표 달성: 여유 공간 ${TARGET_FREE}% 이상 확보 완료"
else
    echo ""
    echo "⚠️ 경고: 여전히 디스크 사용률이 높습니다. 추가 정리가 필요할 수 있습니다."
fi

echo ""
echo "✅ 디스크 정리 완료"

