#!/bin/bash
# 배포 상태 확인 및 온보딩 테스트 준비

echo "=========================================="
echo "📋 배포 상태 확인"
echo "=========================================="
echo ""

# 1. 서버 연결 확인 (여러 포트 시도)
echo "1. 서버 연결 확인..."
for port in 8080 80 443; do
    echo -n "  포트 $port: "
    if timeout 3 curl -s "http://beta0629.cafe24.com:$port/actuator/health" > /dev/null 2>&1; then
        echo "✅ 연결 성공"
        BASE_URL="http://beta0629.cafe24.com:$port"
        break
    else
        echo "❌ 연결 실패"
    fi
done

if [ -z "$BASE_URL" ]; then
    echo ""
    echo "⚠️ 서버에 연결할 수 없습니다."
    echo "가능한 원인:"
    echo "  1. 서버가 아직 재시작 중입니다"
    echo "  2. 방화벽 설정 문제"
    echo "  3. 네트워크 문제"
    echo ""
    echo "다음 단계:"
    echo "  1. GitHub Actions 배포 로그 확인"
    echo "  2. 서버에서 직접 확인: ssh root@beta0629.cafe24.com"
    echo "  3. 서비스 상태 확인: systemctl status mindgarden-dev"
    exit 1
fi

echo ""
echo "✅ 서버 연결 확인: $BASE_URL"
echo ""

# 2. 헬스체크
echo "2. 헬스체크..."
HEALTH=$(curl -s "${BASE_URL}/api/health/server" 2>/dev/null)
if [ -n "$HEALTH" ]; then
    echo "$HEALTH"
else
    echo "⚠️ 헬스체크 응답 없음"
fi
echo ""

# 3. 프로시저 상태 확인
echo "3. 프로시저 상태 확인..."
PROC_HEALTH=$(curl -s "${BASE_URL}/api/health/procedures/create-or-activate-tenant" 2>/dev/null)
if [ -n "$PROC_HEALTH" ]; then
    echo "$PROC_HEALTH"
    if echo "$PROC_HEALTH" | grep -q '"exists":true'; then
        echo "✅ CreateOrActivateTenant 프로시저 존재"
    else
        echo "⚠️ CreateOrActivateTenant 프로시저 없음"
    fi
else
    echo "⚠️ 프로시저 상태 확인 실패"
fi
echo ""

echo "=========================================="
echo "📝 다음 단계"
echo "=========================================="
echo "서버가 준비되면 다음 명령으로 테스트:"
echo ""
echo "  ./scripts/test/quick-test-onboarding.sh"
echo ""

