#!/bin/bash

# 개발 서버 전체 자동 세팅 스크립트
# 서버 IP: 114.202.247.246
# 사용법: 서버에 접속 후 sudo ./full-dev-server-setup.sh

set -e

echo "=========================================="
echo "개발 서버 전체 자동 세팅 시작"
echo "서버 IP: 114.202.247.246"
echo "=========================================="
echo ""

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${BLUE}ℹ️ $1${NC}"; }

# 1. 사전 준비 확인
echo "1. 사전 준비 확인..."
echo ""

# Nginx 확인
if command -v nginx &> /dev/null; then
    success "Nginx: $(nginx -v 2>&1 | head -n 1)"
else
    error "Nginx가 설치되어 있지 않습니다."
    read -p "Nginx를 설치하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo apt-get update
        sudo apt-get install -y nginx
        success "Nginx 설치 완료"
    else
        exit 1
    fi
fi

# Certbot 확인
if command -v certbot &> /dev/null; then
    success "Certbot: $(certbot --version)"
else
    warning "Certbot이 설치되어 있지 않습니다."
    read -p "Certbot을 설치하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
        success "Certbot 설치 완료"
    fi
fi

# Java 확인
if command -v java &> /dev/null; then
    success "Java: $(java -version 2>&1 | head -n 1)"
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
ALL_OK=true

for domain in "${DOMAINS[@]}"; do
    if command -v nslookup &> /dev/null; then
        RESULT=$(nslookup $domain 2>/dev/null | grep -A 1 "Name:" | tail -n 1 | awk '{print $2}' || echo "")
        if [ "$RESULT" == "$EXPECTED_IP" ]; then
            success "$domain → $RESULT"
        else
            warning "$domain → $RESULT (예상: $EXPECTED_IP)"
            ALL_OK=false
        fi
    else
        warning "$domain DNS 확인 불가 (nslookup 미설치)"
    fi
done

if [ "$ALL_OK" = false ]; then
    warning "일부 도메인의 DNS 전파가 완료되지 않았습니다."
    read -p "계속 진행하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# 3. SSL 인증서 발급
echo "3. SSL 인증서 발급..."
echo ""

if [ -f "issue-ssl-dev.sh" ]; then
    info "SSL 인증서 발급 스크립트 실행..."
    sudo bash issue-ssl-dev.sh
else
    warning "issue-ssl-dev.sh 파일을 찾을 수 없습니다."
    echo "개별 도메인 SSL 인증서 발급이 필요합니다."
    read -p "개별 발급을 진행하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        EMAIL="admin@e-trinity.co.kr"
        sudo certbot --nginx -d dev.e-trinity.co.kr --non-interactive --agree-tos --email $EMAIL || true
        sudo certbot --nginx -d apply.dev.e-trinity.co.kr --non-interactive --agree-tos --email $EMAIL || true
        sudo certbot --nginx -d ops.dev.e-trinity.co.kr --non-interactive --agree-tos --email $EMAIL || true
        sudo certbot --nginx -d dev.core-solution.co.kr --non-interactive --agree-tos --email admin@core-solution.co.kr || true
        sudo certbot --nginx -d api.dev.core-solution.co.kr --non-interactive --agree-tos --email admin@core-solution.co.kr || true
        sudo certbot --nginx -d dev.m-garden.co.kr --non-interactive --agree-tos --email admin@m-garden.co.kr || true
    fi
fi

echo ""

# 4. Nginx 설정
echo "4. Nginx 설정..."
echo ""

if [ -f "create-nginx-config-dev.sh" ]; then
    info "Nginx 설정 파일 생성 스크립트 실행..."
    sudo bash create-nginx-config-dev.sh
else
    warning "create-nginx-config-dev.sh 파일을 찾을 수 없습니다."
    echo "Nginx 설정 파일을 수동으로 생성해야 합니다."
fi

echo ""

# 5. 환경 변수 파일 확인
echo "5. 환경 변수 파일 확인..."
echo ""

ENV_FILE="/etc/mindgarden/dev.env"

if [ ! -f "$ENV_FILE" ]; then
    warning "환경 변수 파일이 없습니다: $ENV_FILE"
    echo "환경 변수 파일을 생성하세요."
    echo ""
    echo "예시:"
    echo "  sudo mkdir -p /etc/mindgarden"
    echo "  sudo nano $ENV_FILE"
    echo ""
    echo "docs/mgsb/DEV_SERVER_SETUP_GUIDE.md를 참조하세요."
else
    success "환경 변수 파일 확인: $ENV_FILE"
fi

echo ""

# 6. Systemd 서비스 설정
echo "6. Systemd 서비스 설정..."
echo ""

if [ -f "create-systemd-service-dev.sh" ]; then
    info "Systemd 서비스 파일 생성 스크립트 실행..."
    sudo bash create-systemd-service-dev.sh
else
    warning "create-systemd-service-dev.sh 파일을 찾을 수 없습니다."
    echo "Systemd 서비스 파일을 수동으로 생성해야 합니다."
fi

echo ""

# 7. 완료 요약
echo "=========================================="
echo "개발 서버 세팅 완료"
echo "=========================================="
echo ""
echo "다음 단계:"
echo ""
echo "1. 환경 변수 파일 설정 (아직 안 했다면):"
echo "   sudo nano /etc/mindgarden/dev.env"
echo ""
echo "2. 애플리케이션 JAR 파일 업로드:"
echo "   scp target/mindgarden-*.jar root@114.202.247.246:/opt/mindgarden/mindgarden.jar"
echo ""
echo "3. 서비스 시작:"
echo "   sudo systemctl start mindgarden-dev.service"
echo ""
echo "4. 서비스 상태 확인:"
echo "   sudo systemctl status mindgarden-dev.service"
echo ""
echo "5. 로그 확인:"
echo "   sudo journalctl -u mindgarden-dev.service -f"
echo ""
echo "상세 가이드: docs/mgsb/DEV_SERVER_SETUP_GUIDE.md"

