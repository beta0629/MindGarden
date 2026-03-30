#!/bin/bash
# 온보딩 프로세스 로그 확인 스크립트
# 사용법: ./check-onboarding-logs.sh [서버]
# 서버를 지정하지 않으면 로컬 로그 확인

set -e

SERVER="${1:-local}"
LOG_LINES="${2:-200}"

echo "=========================================="
echo "📋 온보딩 프로세스 로그 확인"
echo "=========================================="
echo "서버: $SERVER"
echo "로그 라인 수: $LOG_LINES"
echo ""

if [ "$SERVER" = "local" ]; then
    echo "⚠️ 로컬 로그 확인은 지원하지 않습니다."
    echo "GitHub Actions 워크플로우를 사용하거나 서버에 직접 접속하여 확인하세요."
    echo ""
    echo "GitHub Actions 워크플로우 실행 방법:"
    echo "1. GitHub 저장소로 이동"
    echo "2. Actions 탭 클릭"
    echo "3. '🔍 개발 서버 로그 확인' 워크플로우 선택"
    echo "4. 'Run workflow' 버튼 클릭"
    exit 0
fi

# 서버별 설정
case "$SERVER" in
    "dev"|"development")
        SERVER_HOST="beta0629.cafe24.com"
        SERVER_USER="root"
        ;;
    "prod"|"production")
        SERVER_HOST="beta74.cafe24.com"
        SERVER_USER="root"
        ;;
    *)
        echo "❌ 알 수 없는 서버: $SERVER"
        echo "사용 가능한 서버: dev, prod"
        exit 1
        ;;
esac

echo "🔍 서버: $SERVER_HOST"
echo ""

# SSH를 통한 로그 확인
ssh "$SERVER_USER@$SERVER_HOST" << EOF
    echo "=========================================="
    echo "📋 온보딩 프로세스 관련 로그 (최근 $LOG_LINES줄):"
    echo "=========================================="
    sudo journalctl -u mindgarden-dev.service --no-pager -n 1000 | grep -i -E "(온보딩|onboarding|ProcessOnboardingApproval|프로시저 실행|프로시저 결과|프로시저 실행 실패|권한 그룹|commonCodes|roleCodes|permissionGroups|Transaction.*rolled back|프로세스가 false를 반환)" | tail -n $LOG_LINES || echo "온보딩 관련 로그 없음"
    echo ""
    
    echo "=========================================="
    echo "📋 온보딩 프로세스 에러 로그 (필터링):"
    echo "=========================================="
    if [ -f /var/log/mindgarden/dev-error.log ]; then
        sudo tail -n 500 /var/log/mindgarden/dev-error.log | grep -i -E "(온보딩|onboarding|ProcessOnboardingApproval|프로시저 실행 실패|프로시저 결과|권한 그룹|Transaction.*rolled back|프로세스가 false를 반환)" | tail -n $LOG_LINES || echo "온보딩 관련 에러 로그 없음"
    else
        echo "에러 로그 파일 없음: /var/log/mindgarden/dev-error.log"
    fi
    echo ""
    
    echo "=========================================="
    echo "📋 최근 온보딩 프로세스 실행 로그 (상세):"
    echo "=========================================="
    sudo journalctl -u mindgarden-dev.service --no-pager -n 1000 | grep -i -E "(온보딩 승인 프로세스|processOnboardingApproval|프로시저 실행 시작|프로시저 실행 완료|프로시저 결과)" | tail -n 50 || echo "상세 로그 없음"
    echo ""
    
    echo "=========================================="
    echo "✅ 로그 확인 완료"
    echo "=========================================="
EOF

