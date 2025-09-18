#!/bin/bash

# MindGarden 수동 배포 스크립트 (비밀번호 인증)
# 서버: beta74.cafe24.com
# 계정: beta74 / beta0629!@

set -e

SERVER_HOST="beta74.cafe24.com"
SERVER_USER="beta74"
SERVER_PASS="beta0629!@"
DEPLOY_PATH="/home/beta74/mindgarden"

echo "🚀 MindGarden 수동 배포 시작..."
echo "📍 서버: ${SERVER_HOST}"
echo "👤 사용자: ${SERVER_USER}"
echo "🌐 도메인: http://m-garden.co.kr"
echo ""

# 1. 빌드는 이미 완료됨 (이전 실행에서)
echo "✅ 빌드 파일 확인..."
if [ ! -f "target/consultation-management-system-1.0.0.jar" ]; then
    echo "❌ 백엔드 JAR 파일이 없습니다. 먼저 빌드를 실행하세요."
    echo "   mvn clean package -DskipTests"
    exit 1
fi

if [ ! -d "frontend/build" ]; then
    echo "❌ 프론트엔드 빌드 파일이 없습니다. 먼저 빌드를 실행하세요."
    echo "   cd frontend && npm run build && cd .."
    exit 1
fi

# 2. 서버 디렉토리 준비
echo "📁 2. 서버 디렉토리 준비 중..."
sshpass -p "${SERVER_PASS}" ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${DEPLOY_PATH} && mkdir -p ${DEPLOY_PATH}/backup"

# 3. 파일 전송
echo "📤 3. 파일 전송 중..."

# JAR 파일 전송
echo "   - 백엔드 JAR 파일..."
sshpass -p "${SERVER_PASS}" scp target/consultation-management-system-1.0.0.jar ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/app.jar

# 프론트엔드 빌드 파일 전송
echo "   - 프론트엔드 빌드 파일..."
sshpass -p "${SERVER_PASS}" ssh ${SERVER_USER}@${SERVER_HOST} "sudo mkdir -p /var/www/html && sudo chown ${SERVER_USER}:${SERVER_USER} /var/www/html"
sshpass -p "${SERVER_PASS}" scp -r frontend/build/* ${SERVER_USER}@${SERVER_HOST}:/var/www/html/

# 설정 파일 전송
echo "   - 설정 파일..."
sshpass -p "${SERVER_PASS}" scp deployment/application-production.yml ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/application.yml
sshpass -p "${SERVER_PASS}" scp deployment/production-db-setup.sql ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/

# 관리 스크립트 전송
echo "   - 관리 스크립트..."
sshpass -p "${SERVER_PASS}" scp deployment/memory-management.sh ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
sshpass -p "${SERVER_PASS}" scp deployment/jvm-memory-config.sh ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
sshpass -p "${SERVER_PASS}" scp deployment/oauth2-callback-test.sh ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
sshpass -p "${SERVER_PASS}" scp deployment/production-env-template.sh ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/

# 4. 서버에서 초기 설정
echo "🔧 4. 서버 초기 설정 중..."
sshpass -p "${SERVER_PASS}" ssh ${SERVER_USER}@${SERVER_HOST} << 'EOF'
    cd ~/mindgarden
    chmod +x *.sh
    
    # 환경변수 파일 생성
    ./production-env-template.sh
    
    # JVM 메모리 설정
    ./jvm-memory-config.sh
    
    echo "✅ 서버 초기 설정 완료"
EOF

echo ""
echo "✅ 파일 전송 및 초기 설정 완료!"
echo ""
echo "📋 다음 수동 작업을 서버에서 진행해주세요:"
echo ""
echo "1. 🔗 서버 접속:"
echo "   ssh ${SERVER_USER}@${SERVER_HOST}"
echo "   (비밀번호: ${SERVER_PASS})"
echo ""
echo "2. 🗄️ 데이터베이스 설정:"
echo "   mysql -u root -p < ~/mindgarden/production-db-setup.sql"
echo ""
echo "3. 🔧 환경변수 로드:"
echo "   cd ~/mindgarden"
echo "   source .env.production"
echo ""
echo "4. 🚀 애플리케이션 시작:"
echo "   nohup java -jar app.jar > app.log 2>&1 &"
echo ""
echo "5. 🔍 상태 확인:"
echo "   tail -f app.log  # 로그 확인 (Ctrl+C로 종료)"
echo "   ./oauth2-callback-test.sh  # OAuth2 테스트"
echo "   ./memory-management.sh check  # 메모리 확인"
echo ""
echo "🌐 배포 후 접속 URL:"
echo "   - 프론트엔드: http://m-garden.co.kr"
echo "   - API 상태: http://m-garden.co.kr/api/actuator/health"
echo "   - 로그인: http://m-garden.co.kr/login"
