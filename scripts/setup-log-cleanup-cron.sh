#!/bin/bash

# 개발 서버 로그 파일 자동 정리 Cron 작업 설정 스크립트
# Usage: ./scripts/setup-log-cleanup-cron.sh

set -e

SERVER="root@beta0629.cafe24.com"
SCRIPT_PATH="/var/www/mindgarden-dev/scripts/clean-dev-server-logs.sh"
CRON_SCHEDULE="0 2 * * *"  # 매일 오전 2시 실행

echo "🔧 개발 서버 로그 파일 자동 정리 Cron 작업 설정 시작..."
echo "=========================================="
echo ""

# 1. 스크립트 파일을 서버에 업로드
echo "📤 로그 정리 스크립트 업로드..."
ssh $SERVER "mkdir -p /var/www/mindgarden-dev/scripts" || true

# 로컬 스크립트를 서버에 복사
scp scripts/clean-dev-server-logs.sh $SERVER:$SCRIPT_PATH
ssh $SERVER "chmod +x $SCRIPT_PATH"

echo "  ✅ 스크립트 업로드 완료: $SCRIPT_PATH"
echo ""

# 2. Cron 작업 추가 (중복 방지)
echo "📅 Cron 작업 설정..."
CRON_JOB="$CRON_SCHEDULE $SCRIPT_PATH 3 >/dev/null 2>&1"

# 기존 cron 작업 확인
EXISTING_CRON=$(ssh $SERVER "crontab -l 2>/dev/null | grep -F '$SCRIPT_PATH' || echo ''")

if [ -n "$EXISTING_CRON" ]; then
    echo "  ℹ️  이미 Cron 작업이 설정되어 있습니다"
    ssh $SERVER "crontab -l | grep -F '$SCRIPT_PATH'"
else
    # 기존 crontab 백업 후 추가
    ssh $SERVER "(crontab -l 2>/dev/null; echo '$CRON_JOB') | crontab -"
    echo "  ✅ Cron 작업 추가 완료"
    echo "  실행 시간: 매일 오전 2시"
    echo "  대상: 3일 이상 된 로그 파일"
fi
echo ""

# 3. Cron 작업 확인
echo "📋 현재 Cron 작업 목록 (로그 정리 관련)"
ssh $SERVER "crontab -l | grep -E '(clean|log|$SCRIPT_PATH)' || echo '  (관련 작업 없음)'"
echo ""

echo "=========================================="
echo "✅ 로그 파일 자동 정리 Cron 작업 설정 완료"
echo ""
echo "💡 설정 내용:"
echo "  - 실행 시간: 매일 오전 2시"
echo "  - 삭제 대상: 3일 이상 된 로그 파일"
echo "  - 스크립트 경로: $SCRIPT_PATH"
echo "  - Cron 작업 확인: ssh $SERVER 'crontab -l'"
echo ""

