#!/bin/bash

echo "🔄 서버 강제 재기동 스크립트"
echo "============================="

# 운영 서버에 직접 접속하여 강제 재기동
echo "🔗 운영 서버 접속 중..."

# SSH 키 파일이 있는지 확인
if [ -f ~/.ssh/mindgarden_deploy ]; then
    SSH_KEY="-i ~/.ssh/mindgarden_deploy"
else
    SSH_KEY=""
fi

# 서버 강제 재기동
ssh $SSH_KEY -o StrictHostKeyChecking=no root@m-garden.co.kr << 'EOF'

echo "🛑 현재 실행 중인 프로세스 확인..."
ps aux | grep -E "(mindgarden|app\.jar|java.*8080)" | grep -v grep

echo ""
echo "🔥 모든 관련 프로세스 강제 종료..."

# systemd 서비스 정지
sudo systemctl stop mindgarden.service 2>/dev/null || true
sleep 2

# Java 프로세스 강제 종료
sudo pkill -9 -f "mindgarden" 2>/dev/null || true
sudo pkill -9 -f "app.jar" 2>/dev/null || true
sudo pkill -9 -f "consultation-management-system" 2>/dev/null || true
sudo pkill -9 -f "spring.profiles.active=prod" 2>/dev/null || true
sudo pkill -9 -f "server.port=8080" 2>/dev/null || true

# 포트 점유 프로세스 강제 종료
sudo fuser -k 8080/tcp 2>/dev/null || true
sudo fuser -k 8081/tcp 2>/dev/null || true
sleep 3

echo ""
echo "🔍 프로세스 정리 확인..."
REMAINING=$(ps aux | grep -E "(mindgarden|app\.jar|java.*8080)" | grep -v grep | wc -l)
if [ $REMAINING -eq 0 ]; then
    echo "✅ 모든 프로세스 정리 완료"
else
    echo "⚠️  남은 프로세스:"
    ps aux | grep -E "(mindgarden|app\.jar|java.*8080)" | grep -v grep
fi

echo ""
echo "🚀 서비스 재시작..."
cd /var/www/mindgarden

# JAR 파일 확인
if [ -f app.jar ]; then
    echo "✅ app.jar 파일 존재"
    ls -la app.jar
else
    echo "❌ app.jar 파일 없음"
    ls -la *.jar 2>/dev/null || echo "JAR 파일이 없습니다"
fi

# systemd 재시작
sudo systemctl daemon-reload
sudo systemctl enable mindgarden.service
sudo systemctl start mindgarden.service

echo ""
echo "⏳ 서비스 시작 대기 (15초)..."
sleep 15

echo ""
echo "🔍 서비스 상태 확인..."
sudo systemctl status mindgarden.service --no-pager -l

echo ""
echo "🔍 최근 로그 확인..."
sudo journalctl -u mindgarden.service -n 10 --no-pager

EOF

echo ""
echo "🔍 재기동 후 서버 응답 확인..."
sleep 5
curl -s -o /dev/null -w "서버 상태: %{http_code}\n" --connect-timeout 10 --max-time 15 http://m-garden.co.kr/actuator/health || echo "서버 응답 없음"
