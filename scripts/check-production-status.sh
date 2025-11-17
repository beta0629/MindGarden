#!/bin/bash

# 운영 서버 상태 확인 스크립트
# 사용법: ./scripts/check-production-status.sh

echo "🔍 운영 서버 상태 확인"
echo "=================================="

echo ""
echo "1. 서비스 상태:"
sudo systemctl status mindgarden.service --no-pager -l | head -30

echo ""
echo "2. 서비스 로그 (최근 50줄):"
sudo journalctl -u mindgarden.service --no-pager -n 50

echo ""
echo "3. 포트 리스닝 확인:"
if command -v netstat &> /dev/null; then
  netstat -tlnp 2>/dev/null | grep 8080 || echo "포트 8080 리스닝 안 됨"
elif command -v ss &> /dev/null; then
  ss -tlnp 2>/dev/null | grep 8080 || echo "포트 8080 리스닝 안 됨"
else
  echo "netstat 또는 ss 명령어 없음"
fi

echo ""
echo "4. Java 프로세스 확인:"
ps aux | grep java | grep -v grep || echo "Java 프로세스 없음"

echo ""
echo "5. 애플리케이션 로그 (최근 50줄):"
if [ -f /var/www/mindgarden/logs/mindgarden-prod.log ]; then
  tail -50 /var/www/mindgarden/logs/mindgarden-prod.log
else
  echo "로그 파일 없음: /var/www/mindgarden/logs/mindgarden-prod.log"
  echo "대체 로그 위치 확인:"
  find /var/www/mindgarden -name "*.log" -type f 2>/dev/null | head -5
fi

echo ""
echo "6. JAR 파일 확인:"
if [ -f /var/www/mindgarden/app.jar ]; then
  ls -lh /var/www/mindgarden/app.jar
  echo "JAR 파일 크기 및 수정 시간 확인 완료"
else
  echo "JAR 파일 없음: /var/www/mindgarden/app.jar"
  echo "디렉토리 내용:"
  ls -lh /var/www/mindgarden/ | head -10
fi

echo ""
echo "7. 환경 변수 확인:"
if [ -f /etc/mindgarden/prod.env ]; then
  echo "환경 변수 파일 존재: /etc/mindgarden/prod.env"
  echo "파일 크기: $(ls -lh /etc/mindgarden/prod.env | awk '{print $5}')"
else
  echo "환경 변수 파일 없음: /etc/mindgarden/prod.env"
fi

echo ""
echo "8. 데이터베이스 연결 확인:"
if command -v mysql &> /dev/null; then
  echo "MySQL 클라이언트 존재"
else
  echo "MySQL 클라이언트 없음"
fi

echo ""
echo "9. 디스크 사용량:"
df -h /var/www/mindgarden 2>/dev/null || df -h /var/www

echo ""
echo "10. 메모리 사용량:"
free -h

echo ""
echo "=================================="
echo "✅ 상태 확인 완료"

