#!/bin/bash

# MindGarden 수동 배포 스크립트 (간소화 버전)
# 서버: $PROD_SERVER_HOST
# 도메인: http://m-garden.co.kr

set -e

SERVER_HOST="mindgarden-prod"  # SSH config 별칭 사용
SERVER_USER="beta74"
DEPLOY_PATH="/home/beta74/mindgarden"

echo "🚀 MindGarden 수동 배포 시작..."
echo "📍 서버: ${SERVER_HOST}"
echo "🌐 도메인: http://m-garden.co.kr"
echo ""

# 1. 프로젝트 빌드
echo "📦 1. 백엔드 빌드 중..."
mvn clean package -DskipTests

echo "📦 2. 프론트엔드 빌드 중..."
cd frontend
npm install
REACT_APP_API_BASE_URL=http://m-garden.co.kr npm run build
cd ..

# 2. 서버 디렉토리 준비
echo "📁 3. 서버 디렉토리 준비 중..."
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${DEPLOY_PATH} && mkdir -p ${DEPLOY_PATH}/backup"

# 3. 파일 전송
echo "📤 4. 파일 전송 중..."

# JAR 파일 전송
echo "   - 백엔드 JAR 파일..."
scp target/consultation-management-system-*.jar ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/app.jar

# 프론트엔드 빌드 파일 전송
echo "   - 프론트엔드 빌드 파일..."
ssh ${SERVER_USER}@${SERVER_HOST} "sudo mkdir -p /var/www/html && sudo chown ${SERVER_USER}:${SERVER_USER} /var/www/html"
scp -r frontend/build/* ${SERVER_USER}@${SERVER_HOST}:/var/www/html/

# 설정 파일 전송
echo "   - 설정 파일..."
scp deployment/application-production.yml ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/application.yml
scp deployment/production-db-setup.sql ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/

# 관리 스크립트 전송
echo "   - 관리 스크립트..."
scp deployment/memory-management.sh ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
scp deployment/jvm-memory-config.sh ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
scp deployment/oauth2-callback-test.sh ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
scp deployment/production-env-template.sh ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/

# 4. 서버에서 초기 설정
echo "🔧 5. 서버 초기 설정 중..."
ssh ${SERVER_USER}@${SERVER_HOST} << 'EOF'
    cd ~/mindgarden
    chmod +x *.sh
    
    # 환경변수 파일 생성
    ./production-env-template.sh
    
    # JVM 메모리 설정
    ./jvm-memory-config.sh
    
    echo "✅ 서버 초기 설정 완료"
EOF

echo ""
echo "✅ 수동 배포 완료!"
echo ""
echo "📋 다음 수동 작업이 필요합니다:"
echo ""
echo "1. 🗄️ 데이터베이스 설정:"
echo "   ssh ${SERVER_USER}@${SERVER_HOST}"
echo "   envsubst < ~/mindgarden/production-db-setup.sql | mysql -u root -p"
echo ""
echo "2. 🔧 환경변수 로드:"
echo "   source ~/mindgarden/.env.production"
echo ""
echo "3. 🚀 애플리케이션 시작:"
echo "   cd ~/mindgarden"
echo "   nohup java -jar app.jar > app.log 2>&1 &"
echo ""
echo "4. 🔍 상태 확인:"
echo "   ./oauth2-callback-test.sh"
echo "   ./memory-management.sh check"
echo ""
echo "🌐 배포 후 접속 URL:"
echo "   - 프론트엔드: http://m-garden.co.kr"
echo "   - API 상태: http://m-garden.co.kr/api/actuator/health"
echo "   - 로그인: http://m-garden.co.kr/login"
