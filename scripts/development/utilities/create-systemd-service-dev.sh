#!/bin/bash

# 개발 서버 Systemd 서비스 파일 생성 스크립트
# 사용법: sudo ./create-systemd-service-dev.sh

set -e

SERVICE_FILE="/etc/systemd/system/mindgarden-dev.service"
APP_DIR="/opt/mindgarden"
APP_JAR="$APP_DIR/mindgarden.jar"
ENV_FILE="/etc/mindgarden/dev.env"

echo "=========================================="
echo "개발 서버 Systemd 서비스 파일 생성"
echo "=========================================="
echo ""

# 애플리케이션 디렉토리 생성
if [ ! -d "$APP_DIR" ]; then
    echo "애플리케이션 디렉토리 생성 중: $APP_DIR"
    sudo mkdir -p $APP_DIR
    sudo chown root:root $APP_DIR
    echo "✅ 디렉토리 생성 완료"
fi

# 환경 변수 파일 확인
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️ 환경 변수 파일이 없습니다: $ENV_FILE"
    echo "환경 변수 파일을 생성하세요."
    echo "docs/mgsb/DEV_SERVER_SETUP_GUIDE.md를 참조하세요."
fi

# Systemd 서비스 파일 생성
echo "Systemd 서비스 파일 생성 중: $SERVICE_FILE"
sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=MindGarden Development Server
After=network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/java -jar $APP_JAR --spring.profiles.active=dev
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mindgarden-dev

# 메모리 제한 (선택)
# MemoryLimit=2G

# 로그 설정
StandardOutput=append:/var/log/mindgarden/dev.log
StandardError=append:/var/log/mindgarden/dev-error.log

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Systemd 서비스 파일 생성 완료"
echo ""

# 로그 디렉토리 생성
LOG_DIR="/var/log/mindgarden"
if [ ! -d "$LOG_DIR" ]; then
    echo "로그 디렉토리 생성 중: $LOG_DIR"
    sudo mkdir -p $LOG_DIR
    sudo chown root:root $LOG_DIR
    echo "✅ 로그 디렉토리 생성 완료"
fi

# systemd 재로드
echo "systemd 재로드 중..."
sudo systemctl daemon-reload
echo "✅ systemd 재로드 완료"

# 서비스 활성화
echo "서비스 활성화 중..."
sudo systemctl enable mindgarden-dev.service
echo "✅ 서비스 활성화 완료"

# JAR 파일 확인
if [ -f "$APP_JAR" ]; then
    echo ""
    echo "✅ JAR 파일 확인: $APP_JAR"
    read -p "서비스를 시작하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo systemctl start mindgarden-dev.service
        echo "✅ 서비스 시작 완료"
        echo ""
        echo "서비스 상태 확인:"
        sudo systemctl status mindgarden-dev.service --no-pager
    fi
else
    echo ""
    echo "⚠️ JAR 파일이 없습니다: $APP_JAR"
    echo "JAR 파일을 업로드한 후 다음 명령어로 서비스를 시작하세요:"
    echo "  sudo systemctl start mindgarden-dev.service"
fi

echo ""
echo "=========================================="
echo "Systemd 서비스 설정 완료"
echo "=========================================="
echo ""
echo "서비스 관리 명령어:"
echo "  시작:   sudo systemctl start mindgarden-dev.service"
echo "  중지:   sudo systemctl stop mindgarden-dev.service"
echo "  재시작: sudo systemctl restart mindgarden-dev.service"
echo "  상태:   sudo systemctl status mindgarden-dev.service"
echo "  로그:   sudo journalctl -u mindgarden-dev.service -f"

