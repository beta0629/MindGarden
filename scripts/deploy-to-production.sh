#!/bin/bash

# 🚀 MindGarden 운영 서버 배포 스크립트
# 로컬 테스트 → 운영 배포 프로세스

set -e

echo "🚀 MindGarden 운영 서버 배포 시작..."
echo "=================================="

# 1단계: 로컬 테스트
echo "📋 1단계: 로컬 테스트"
echo "🔄 백엔드 빌드 중..."
mvn clean package -DskipTests -q

echo "🧪 로컬 테스트 서버 시작..."
# 기존 로컬 서버 중지
pkill -f "java.*consultation-management-system" 2>/dev/null || echo "로컬 서버 이미 중지됨"

# 로컬 테스트 서버 백그라운드 시작
SPRING_PROFILES_ACTIVE=local java -Dserver.port=8080 -jar target/consultation-management-system-1.0.0.jar > /tmp/local-test.log 2>&1 &
LOCAL_PID=$!

# 서버 시작 대기
sleep 20

# 헬스체크
if curl -s http://localhost:8080/actuator/health > /dev/null; then
    echo "✅ 로컬 서버 정상 시작"
else
    echo "❌ 로컬 서버 시작 실패"
    kill $LOCAL_PID 2>/dev/null
    exit 1
fi

# API 테스트
echo "🧪 current-user API 테스트..."
curl -c /tmp/test_cookies -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@mindgarden.com","password":"admin123"}' 2>/dev/null > /dev/null

STATUS=$(curl -b /tmp/test_cookies -X GET http://localhost:8080/api/auth/current-user -w '%{http_code}' -o /dev/null -s)

if [ "$STATUS" = "200" ]; then
    echo "✅ 로컬 API 테스트 성공"
else
    echo "❌ 로컬 API 테스트 실패: $STATUS"
    kill $LOCAL_PID 2>/dev/null
    rm -f /tmp/test_cookies
    exit 1
fi

# 로컬 서버 중지
kill $LOCAL_PID 2>/dev/null
rm -f /tmp/test_cookies
echo "✅ 로컬 테스트 완료"

# 2단계: 운영 배포
echo ""
echo "📋 2단계: 운영 서버 배포"
echo "🚀 JAR 파일 업로드 중..."
scp target/consultation-management-system-1.0.0.jar root@beta74.cafe24.com:/var/www/mindgarden/app-new.jar

echo "🔧 운영 서버 배포 중..."
ssh root@beta74.cafe24.com "
cd /var/www/mindgarden

echo '=== 기존 JAR 백업 ==='
cp app.jar app-backup-\$(date +%Y%m%d-%H%M%S).jar

echo '=== YAML 수정사항 적용 ==='
jar xf app-new.jar BOOT-INF/classes/application-prod.yml
sed -i '177,181d' BOOT-INF/classes/application-prod.yml 2>/dev/null || true
jar uf app-new.jar BOOT-INF/classes/application-prod.yml

echo '=== JAR 파일 교체 ==='
mv app-new.jar app.jar
chmod +x app.jar

echo '=== 서비스 재시작 ==='
sudo systemctl restart mindgarden.service
sleep 20

echo '=== 배포 검증 ==='
if sudo systemctl is-active --quiet mindgarden.service; then
    echo '✅ 서비스 정상 실행 중'
else
    echo '❌ 서비스 시작 실패'
    sudo systemctl status mindgarden.service --no-pager
    exit 1
fi

if curl -f -s http://localhost:8080/actuator/health > /dev/null; then
    echo '✅ HTTP 헬스체크 통과'
else
    echo '❌ HTTP 헬스체크 실패'
    exit 1
fi

rm -rf BOOT-INF
echo '✅ 운영 서버 배포 완료!'
"

echo ""
echo "🎉 배포 완료!"
echo "=================================="
echo "✅ 로컬 테스트 성공"
echo "✅ 운영 서버 배포 성공"
echo "🌐 접속: http://m-garden.co.kr"
echo ""
