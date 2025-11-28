#!/bin/bash
# 개발 서버 상태 확인 스크립트
# 사용법: ssh root@beta0629.cafe24.com 'bash -s' < check-dev-server-status.sh

echo "=========================================="
echo "개발 서버 상태 확인"
echo "=========================================="
echo ""

echo "1. Nginx 상태 확인"
echo "----------------------------------------"
systemctl status nginx --no-pager | head -10
echo ""

echo "2. Nginx 설정 파일 확인"
echo "----------------------------------------"
echo "설정 파일 위치:"
ls -la /etc/nginx/sites-enabled/ | grep -E "(core-solution|e-trinity)"
echo ""

echo "3. apply.dev.e-trinity.co.kr 설정 확인"
echo "----------------------------------------"
if [ -f /etc/nginx/sites-available/core-solution-dev ]; then
    echo "설정 파일 존재: /etc/nginx/sites-available/core-solution-dev"
    grep -A 20 "server_name apply.dev.e-trinity.co.kr" /etc/nginx/sites-available/core-solution-dev | head -25
else
    echo "❌ 설정 파일 없음: /etc/nginx/sites-available/core-solution-dev"
fi
echo ""

echo "4. Nginx 설정 테스트"
echo "----------------------------------------"
nginx -t
echo ""

echo "5. Trinity 프론트엔드 파일 확인"
echo "----------------------------------------"
if [ -d /var/www/html-trinity ]; then
    echo "디렉토리 존재: /var/www/html-trinity"
    echo "파일 개수: $(find /var/www/html-trinity -type f 2>/dev/null | wc -l)"
    echo "index.html 존재: $([ -f /var/www/html-trinity/index.html ] && echo '예' || echo '아니오')"
    ls -la /var/www/html-trinity/ | head -10
else
    echo "❌ 디렉토리 없음: /var/www/html-trinity"
fi
echo ""

echo "6. 백엔드 서비스 상태 확인"
echo "----------------------------------------"
systemctl status mindgarden --no-pager | head -10 || echo "mindgarden 서비스 없음"
echo ""

echo "7. 포트 8080 리스닝 확인"
echo "----------------------------------------"
netstat -tlnp | grep 8080 || ss -tlnp | grep 8080
echo ""

echo "8. Nginx 에러 로그 (최근 20줄)"
echo "----------------------------------------"
tail -20 /var/log/nginx/error.log
echo ""

echo "9. apply.dev.e-trinity.co.kr 접근 로그 (최근 10줄)"
echo "----------------------------------------"
if [ -f /var/log/nginx/apply.dev.e-trinity.co.kr.error.log ]; then
    tail -10 /var/log/nginx/apply.dev.e-trinity.co.kr.error.log
else
    echo "로그 파일 없음"
fi
echo ""

echo "=========================================="
echo "확인 완료"
echo "=========================================="

