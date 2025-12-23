#!/bin/bash
# 온보딩 프로세스 로그 직접 확인 스크립트
# GitHub Actions를 사용하지 않고 직접 서버에 접속하여 로그 확인

set -e

SERVER_HOST="beta0629.cafe24.com"
SERVER_USER="root"
LOG_LINES="${1:-100}"

echo "=========================================="
echo "📋 온보딩 프로세스 로그 확인 (직접 접속)"
echo "=========================================="
echo "서버: $SERVER_HOST"
echo "로그 라인 수: $LOG_LINES"
echo ""

# SSH를 통한 로그 확인
ssh "$SERVER_USER@$SERVER_HOST" << 'EOF'
    echo "=========================================="
    echo "📋 온보딩 프로세스 관련 로그 (최근 200줄):"
    echo "=========================================="
    sudo journalctl -u mindgarden-dev.service --no-pager -n 1000 | grep -i -E "(온보딩|onboarding|ProcessOnboardingApproval|프로시저 실행|프로시저 결과|프로시저 실행 실패|권한 그룹|commonCodes|roleCodes|permissionGroups|Transaction.*rolled back|프로세스가 false를 반환)" | tail -n 200 || echo "온보딩 관련 로그 없음"
    echo ""
    
    echo "=========================================="
    echo "📋 온보딩 프로세스 에러 로그 (필터링):"
    echo "=========================================="
    if [ -f /var/log/mindgarden/dev-error.log ]; then
        sudo tail -n 500 /var/log/mindgarden/dev-error.log | grep -i -E "(온보딩|onboarding|ProcessOnboardingApproval|프로시저 실행 실패|프로시저 결과|권한 그룹|Transaction.*rolled back|프로세스가 false를 반환)" | tail -n 100 || echo "온보딩 관련 에러 로그 없음"
    else
        echo "에러 로그 파일 없음: /var/log/mindgarden/dev-error.log"
    fi
    echo ""
    
    echo "=========================================="
    echo "📋 최근 온보딩 프로세스 실행 로그 (상세):"
    echo "=========================================="
    sudo journalctl -u mindgarden-dev.service --no-pager -n 1000 | grep -i -E "(온보딩 승인 프로세스|processOnboardingApproval|프로시저 실행 시작|프로시저 실행 완료|프로시저 결과|프로시저 실행 실패)" | tail -n 50 || echo "상세 로그 없음"
    echo ""
    
    echo "=========================================="
    echo "✅ 로그 확인 완료"
    echo "=========================================="
EOF

