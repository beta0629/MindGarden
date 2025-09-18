#!/bin/bash

# MindGarden 운영 서버 배포 스크립트
# 서버: beta74.cafe24.com (211.37.179.204)
# 도메인: https://m-garden.co.kr

set -e  # 오류 발생 시 스크립트 중단

echo "🚀 MindGarden 운영 서버 배포 시작..."
echo "📍 서버: beta74.cafe24.com"
echo "🌐 도메인: https://m-garden.co.kr"
echo ""

# 배포 변수 설정
SERVER_HOST="beta74.cafe24.com"
SERVER_USER="beta74"
DEPLOY_PATH="/home/beta74/mindgarden"
BACKUP_PATH="/home/beta74/mindgarden-backup"
SERVICE_NAME="mindgarden"

echo "📦 1. 프로젝트 빌드 중..."
mvn clean package -DskipTests -Pprod

echo "📦 2. 프론트엔드 빌드 중..."
cd frontend
npm install
npm run build
cd ..

echo "📤 3. 서버로 파일 전송 중..."
# 백엔드 JAR 파일 전송
scp target/consultation-management-system-*.jar ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/app.jar

# 프론트엔드 빌드 파일 전송
scp -r frontend/build/* ${SERVER_USER}@${SERVER_HOST}:/var/www/html/

# 설정 파일 전송
scp deployment/application-production.yml ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/application.yml
scp deployment/production-db-setup.sql ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/

echo "🔧 4. 서버 설정 중..."
ssh ${SERVER_USER}@${SERVER_HOST} << 'EOF'
    # 디렉토리 생성
    sudo mkdir -p /var/log/mindgarden
    sudo mkdir -p /var/mindgarden/uploads
    sudo mkdir -p /etc/ssl/mindgarden
    
    # 권한 설정
    sudo chown -R beta74:beta74 /var/log/mindgarden
    sudo chown -R beta74:beta74 /var/mindgarden
    sudo chmod 755 /var/log/mindgarden
    sudo chmod 755 /var/mindgarden/uploads
    
    # 백업 디렉토리 생성
    mkdir -p ~/mindgarden-backup/$(date +%Y%m%d_%H%M%S)
EOF

echo "💾 5. 데이터베이스 설정 중..."
echo "⚠️  다음 명령어를 서버에서 실행해주세요:"
echo "   mysql -u root -p < ${DEPLOY_PATH}/production-db-setup.sql"
echo ""

echo "🔒 6. 환경변수 설정 안내..."
cat << 'EOF'
서버에서 다음 환경변수를 설정해주세요:

# ~/.bashrc 또는 /etc/environment에 추가
export DB_USERNAME=mindgarden_prod
export DB_PASSWORD=MindGarden2025!@#
export JWT_SECRET=$(openssl rand -base64 64)
export PERSONAL_DATA_ENCRYPTION_KEY=$(openssl rand -base64 32)
export PERSONAL_DATA_ENCRYPTION_IV=$(openssl rand -base64 16)

# OAuth2 설정
export KAKAO_CLIENT_ID=your_kakao_client_id
export KAKAO_CLIENT_SECRET=your_kakao_client_secret
export NAVER_CLIENT_ID=your_naver_client_id
export NAVER_CLIENT_SECRET=your_naver_client_secret

# 이메일 설정
export SMTP_USERNAME=mindgarden1013@gmail.com
export SMTP_PASSWORD=your_app_password

# 결제 시스템
export PAYMENT_TOSS_SECRET_KEY=your_toss_secret
export PAYMENT_IAMPORT_API_KEY=your_iamport_key
export PAYMENT_IAMPORT_API_SECRET=your_iamport_secret

# 카카오 알림톡
export KAKAO_ALIMTALK_API_KEY=your_alimtalk_key
export KAKAO_ALIMTALK_SENDER_KEY=your_sender_key

# SMS 설정
export SMS_API_KEY=your_sms_key
export SMS_API_SECRET=your_sms_secret
export SMS_SENDER_NUMBER=your_phone_number

EOF

echo "🌐 7. 웹서버 설정 안내..."
cat << 'EOF'
Nginx 설정 (/etc/nginx/sites-available/mindgarden):

server {
    listen 80;
    server_name m-garden.co.kr www.m-garden.co.kr;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name m-garden.co.kr www.m-garden.co.kr;
    
    # SSL 인증서 설정
    ssl_certificate /etc/ssl/mindgarden/fullchain.pem;
    ssl_certificate_key /etc/ssl/mindgarden/privkey.pem;
    
    # SSL 보안 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 프론트엔드 (React 빌드 파일)
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # 캐시 설정
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 백엔드 API 프록시
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 타임아웃 설정
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Actuator (헬스체크)
    location /actuator/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # IP 제한 (관리자만)
        allow 211.37.179.204;  # 서버 자체
        deny all;
    }
}

EOF

echo "🔧 8. 시스템 서비스 설정 안내..."
cat << 'EOF'
Systemd 서비스 설정 (/etc/systemd/system/mindgarden.service):

[Unit]
Description=MindGarden Consultation System
After=network.target mysql.service

[Service]
Type=simple
User=beta74
Group=beta74
WorkingDirectory=/home/beta74/mindgarden
ExecStart=/usr/bin/java -jar -Dspring.profiles.active=production app.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=JAVA_OPTS="-Xms512m -Xmx2g -XX:+UseG1GC"

[Install]
WantedBy=multi-user.target

설정 후 실행:
sudo systemctl daemon-reload
sudo systemctl enable mindgarden
sudo systemctl start mindgarden
sudo systemctl status mindgarden

EOF

echo "✅ 배포 스크립트 준비 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 서버에 SSH 접속"
echo "2. MySQL 데이터베이스 설정 실행"
echo "3. 환경변수 설정"
echo "4. SSL 인증서 설치"
echo "5. Nginx 설정"
echo "6. 시스템 서비스 등록"
echo "7. 애플리케이션 시작"
echo ""
echo "🧠 7. 메모리 관리 설정 중..."
scp deployment/memory-management.sh ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
scp deployment/jvm-memory-config.sh ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
scp deployment/setup-memory-cron.sh ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
scp deployment/memory-dashboard.sh ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
scp deployment/production-env-template.sh ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/
scp deployment/oauth2-callback-test.sh ${SERVER_USER}@${SERVER_HOST}:${DEPLOY_PATH}/

ssh ${SERVER_USER}@${SERVER_HOST} << 'EOF'
    cd ~/mindgarden
    chmod +x *.sh
    
    # JVM 메모리 설정
    ./jvm-memory-config.sh
    
    # 메모리 관리 크론잡 설정
    ./setup-memory-cron.sh
    
    # 메모리 모니터링 대시보드 설정
    ./memory-dashboard.sh
    
    # 환경변수 템플릿 생성
    ./production-env-template.sh
EOF

echo ""
echo "🔍 배포 후 확인사항:"
echo "- https://m-garden.co.kr (프론트엔드)"
echo "- https://m-garden.co.kr/api/actuator/health (백엔드)"
echo "- https://m-garden.co.kr/login (로그인 테스트)"
echo "- https://m-garden.co.kr/admin/memory/ (메모리 모니터링)"
echo ""
echo "🧠 메모리 관리 명령어:"
echo "- ./memory-management.sh check    # 메모리 확인"
echo "- ./memory-management.sh monitor  # 실시간 모니터링"
echo "- ./memory-management.sh optimize # 메모리 최적화"
echo ""
echo "🔐 OAuth2 설정 확인:"
echo "- ./oauth2-callback-test.sh       # 콜백 URL 테스트"
echo ""
echo "📋 OAuth2 콜백 URL (개발자 콘솔에 등록 필요):"
echo "- 카카오: http://m-garden.co.kr/api/auth/kakao/callback"
echo "- 네이버: http://m-garden.co.kr/api/auth/naver/callback"
