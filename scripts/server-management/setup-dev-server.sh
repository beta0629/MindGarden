#!/bin/bash

# 개발 서버 전체 세팅 스크립트
# 서버 IP: 114.202.247.246
# 사용법: sudo ./setup-dev-server.sh

set -e

echo "=========================================="
echo "개발 서버 세팅 시작"
echo "서버 IP: 114.202.247.246"
echo "=========================================="
echo ""

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 함수: 성공 메시지
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 함수: 경고 메시지
warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# 함수: 에러 메시지
error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. 사전 준비 확인
echo "1. 사전 준비 확인..."
echo ""

# Nginx 확인
if command -v nginx &> /dev/null; then
    success "Nginx 설치 확인: $(nginx -v 2>&1 | head -n 1)"
else
    error "Nginx가 설치되어 있지 않습니다."
    echo "설치: sudo apt-get install nginx"
    exit 1
fi

# Certbot 확인
if command -v certbot &> /dev/null; then
    success "Certbot 설치 확인: $(certbot --version)"
else
    warning "Certbot이 설치되어 있지 않습니다."
    read -p "Certbot을 설치하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
        success "Certbot 설치 완료"
    else
        error "Certbot 설치가 필요합니다."
        exit 1
    fi
fi

# Java 확인
if command -v java &> /dev/null; then
    success "Java 설치 확인: $(java -version 2>&1 | head -n 1)"
else
    warning "Java가 설치되어 있지 않습니다."
    echo "Java 설치가 필요합니다."
fi

echo ""

# 2. DNS 전파 확인
echo "2. DNS 전파 확인..."
echo ""

DOMAINS=(
    "dev.e-trinity.co.kr"
    "apply.dev.e-trinity.co.kr"
    "ops.dev.e-trinity.co.kr"
    "dev.core-solution.co.kr"
    "api.dev.core-solution.co.kr"
    "dev.m-garden.co.kr"
)

EXPECTED_IP="114.202.247.246"

for domain in "${DOMAINS[@]}"; do
    if command -v nslookup &> /dev/null; then
        RESULT=$(nslookup $domain 2>/dev/null | grep -A 1 "Name:" | tail -n 1 | awk '{print $2}')
        if [ "$RESULT" == "$EXPECTED_IP" ]; then
            success "$domain → $RESULT"
        else
            warning "$domain → $RESULT (예상: $EXPECTED_IP)"
        fi
    else
        warning "$domain DNS 확인 불가 (nslookup 미설치)"
    fi
done

echo ""
read -p "DNS 전파가 완료되었나요? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    warning "DNS 전파를 기다린 후 다시 실행하세요."
    exit 1
fi

echo ""

# 3. SSL 인증서 발급
echo "3. SSL 인증서 발급..."
echo ""

if [ -f "issue-ssl-dev.sh" ]; then
    echo "SSL 인증서 발급 스크립트 실행..."
    sudo bash issue-ssl-dev.sh
else
    warning "issue-ssl-dev.sh 파일을 찾을 수 없습니다."
    echo "개별 도메인 SSL 인증서 발급이 필요합니다."
fi

echo ""

# 4. Nginx 설정
echo "4. Nginx 설정..."
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/core-solution-dev"

if [ ! -f "$NGINX_CONFIG" ]; then
    warning "Nginx 설정 파일이 없습니다: $NGINX_CONFIG"
    echo "docs/mgsb/NGINX_MULTI_DOMAIN_CONFIG.md를 참조하여 설정 파일을 생성하세요."
else
    success "Nginx 설정 파일 확인: $NGINX_CONFIG"
    
    # 심볼릭 링크 확인
    if [ ! -L "/etc/nginx/sites-enabled/core-solution-dev" ]; then
        echo "심볼릭 링크 생성..."
        sudo ln -s $NGINX_CONFIG /etc/nginx/sites-enabled/
        success "심볼릭 링크 생성 완료"
    fi
    
    # Nginx 설정 테스트
    echo "Nginx 설정 테스트..."
    if sudo nginx -t; then
        success "Nginx 설정 테스트 통과"
        echo "Nginx 재시작..."
        sudo systemctl restart nginx
        success "Nginx 재시작 완료"
    else
        error "Nginx 설정 오류가 있습니다."
        exit 1
    fi
fi

echo ""

# 5. 환경 변수 설정
echo "5. 환경 변수 설정..."
echo ""

ENV_FILE="/etc/mindgarden/dev.env"

if [ ! -f "$ENV_FILE" ]; then
    warning "환경 변수 파일이 없습니다: $ENV_FILE"
    echo "환경 변수 파일을 생성하세요."
    echo "docs/mgsb/DEV_SERVER_SETUP_GUIDE.md를 참조하세요."
else
    success "환경 변수 파일 확인: $ENV_FILE"
fi

echo ""

# 6. Systemd 서비스 설정
echo "6. Systemd 서비스 설정..."
echo ""

SERVICE_FILE="/etc/systemd/system/mindgarden-dev.service"

if [ ! -f "$SERVICE_FILE" ]; then
    warning "Systemd 서비스 파일이 없습니다: $SERVICE_FILE"
    echo "서비스 파일을 생성하세요."
    echo "docs/mgsb/DEV_SERVER_SETUP_GUIDE.md를 참조하세요."
else
    success "Systemd 서비스 파일 확인: $SERVICE_FILE"
    
    # 서비스 활성화
    sudo systemctl daemon-reload
    sudo systemctl enable mindgarden-dev.service
    success "Systemd 서비스 활성화 완료"
fi

echo ""

# 7. 완료 요약
echo "=========================================="
echo "개발 서버 세팅 완료"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "1. 환경 변수 파일 설정: /etc/mindgarden/dev.env"
echo "2. Nginx 설정 파일 생성: /etc/nginx/sites-available/core-solution-dev"
echo "3. Systemd 서비스 파일 생성: /etc/systemd/system/mindgarden-dev.service"
echo "4. 애플리케이션 JAR 파일 업로드: /opt/mindgarden/mindgarden.jar"
echo "5. 서비스 시작: sudo systemctl start mindgarden-dev.service"
echo ""
echo "상세 가이드: docs/mgsb/DEV_SERVER_SETUP_GUIDE.md"

