#!/bin/bash

# 개발 서버 시작 스크립트 생성
# 사용법: sudo ./create-start-script-dev.sh

set -e

START_SCRIPT="/opt/mindgarden/start.sh"
ENV_FILE="/etc/mindgarden/dev.env"

echo "=========================================="
echo "개발 서버 시작 스크립트 생성"
echo "=========================================="
echo ""

# 디렉토리 생성
if [ ! -d "/opt/mindgarden" ]; then
    echo "디렉토리 생성 중: /opt/mindgarden"
    sudo mkdir -p /opt/mindgarden
    sudo chown root:root /opt/mindgarden
    echo "✅ 디렉토리 생성 완료"
fi

# 시작 스크립트 생성
echo "시작 스크립트 생성 중: $START_SCRIPT"
sudo tee $START_SCRIPT > /dev/null <<'EOF'
#!/bin/bash
set -e
source /etc/mindgarden/dev.env
export DB_PASSWORD
export DB_USERNAME
export DB_HOST
export DB_NAME
export DB_PORT
export JWT_SECRET
export PERSONAL_DATA_ENCRYPTION_KEY
export PERSONAL_DATA_ENCRYPTION_IV
cd /var/www/mindgarden-dev
exec /usr/bin/java -jar app.jar --spring.profiles.active=dev
EOF

sudo chmod +x $START_SCRIPT
echo "✅ 시작 스크립트 생성 완료: $START_SCRIPT"

echo ""
echo "=========================================="
echo "시작 스크립트 생성 완료"
echo "=========================================="

