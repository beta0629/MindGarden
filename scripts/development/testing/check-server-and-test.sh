#!/bin/bash
# 서버 상태 확인 및 온보딩 테스트

echo "=========================================="
echo "📋 서버 상태 확인 및 테스트"
echo "=========================================="
echo ""

# 서버 상태 확인 (SSH로 직접 확인)
echo "1. 서버 상태 확인 중..."
ssh root@beta0629.cafe24.com << 'EOF'
    echo "=== 서비스 상태 ==="
    systemctl status mindgarden-dev --no-pager | head -20
    
    echo ""
    echo "=== 최근 로그 (프로시저 관련) ==="
    journalctl -u mindgarden-dev -n 100 --no-pager | grep -E 'CreateOrActivateTenant|프로시저|PlSqlInitializer|V42|Flyway|ERROR|Exception' | tail -30 || echo "로그 없음"
    
    echo ""
    echo "=== 포트 확인 ==="
    netstat -tlnp | grep 8080 || ss -tlnp | grep 8080 || echo "포트 8080 확인 불가"
    
    echo ""
    echo "=== 프로시저 존재 여부 ==="
    if [ -f /etc/mindgarden/dev.env ]; then
        source /etc/mindgarden/dev.env
        mysql -u "${DB_USERNAME}" -p"${DB_PASSWORD}" "${DB_NAME}" -e "SHOW PROCEDURE STATUS WHERE Name = 'CreateOrActivateTenant';" 2>/dev/null || echo "프로시저 조회 실패"
    fi
EOF

echo ""
echo "=========================================="
echo "📝 다음 단계"
echo "=========================================="
echo "서버가 정상이면 다음 명령으로 테스트:"
echo "  ./scripts/test/force-test-onboarding.sh"
echo ""

