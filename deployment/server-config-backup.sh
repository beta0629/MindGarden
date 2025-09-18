#!/bin/bash

# 서버 설정 백업 및 복원 스크립트
# UFW, SSH, 시스템 설정 등을 백업하고 복원

BACKUP_DIR="/home/beta74/config-backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔧 서버 설정 백업/복원 도구"
echo "=========================="

backup_configs() {
    echo "💾 서버 설정 백업 중..."
    
    mkdir -p "$BACKUP_DIR/$TIMESTAMP"
    
    # UFW 설정 백업
    sudo ufw status numbered > "$BACKUP_DIR/$TIMESTAMP/ufw-status.txt"
    sudo cp /etc/ufw/user.rules "$BACKUP_DIR/$TIMESTAMP/" 2>/dev/null || true
    
    # SSH 설정 백업
    sudo cp /etc/ssh/sshd_config "$BACKUP_DIR/$TIMESTAMP/"
    cp ~/.ssh/authorized_keys "$BACKUP_DIR/$TIMESTAMP/" 2>/dev/null || true
    
    # 시스템 설정 백업
    sudo systemctl list-enabled > "$BACKUP_DIR/$TIMESTAMP/enabled-services.txt"
    sudo netstat -tlnp > "$BACKUP_DIR/$TIMESTAMP/open-ports.txt"
    
    # 환경변수 백업
    cp ~/.bashrc "$BACKUP_DIR/$TIMESTAMP/" 2>/dev/null || true
    cp ~/mindgarden/.env.production "$BACKUP_DIR/$TIMESTAMP/" 2>/dev/null || true
    
    echo "✅ 백업 완료: $BACKUP_DIR/$TIMESTAMP"
}

restore_ufw() {
    echo "🔥 UFW 설정 복원 중..."
    
    # UFW 비활성화
    sudo ufw --force reset
    
    # 기본 정책 설정
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # 필수 포트 허용
    sudo ufw allow 22/tcp     # SSH
    sudo ufw allow 80/tcp     # HTTP
    sudo ufw allow 443/tcp    # HTTPS
    sudo ufw allow 8080/tcp   # Spring Boot
    
    # UFW 활성화
    sudo ufw --force enable
    
    echo "✅ UFW 설정 복원 완료"
    sudo ufw status verbose
}

check_connectivity() {
    echo "🔍 연결성 확인 중..."
    
    echo "포트 상태:"
    sudo netstat -tlnp | grep -E ":(22|80|443|8080|3306)\s"
    
    echo ""
    echo "UFW 상태:"
    sudo ufw status numbered
    
    echo ""
    echo "SSH 서비스 상태:"
    sudo systemctl status ssh --no-pager
}

setup_auto_restore() {
    echo "⚡ 자동 복원 설정 중..."
    
    # 부팅 시 UFW 설정 복원 스크립트
    cat > /tmp/restore-firewall.sh << 'SCRIPT'
#!/bin/bash
# 부팅 시 UFW 설정 자동 복원

# UFW 설정
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp  
ufw allow 443/tcp
ufw allow 8080/tcp
ufw --force enable

# 로그 기록
echo "$(date): UFW 설정 자동 복원 완료" >> /var/log/ufw-auto-restore.log
SCRIPT
    
    sudo mv /tmp/restore-firewall.sh /usr/local/bin/
    sudo chmod +x /usr/local/bin/restore-firewall.sh
    
    # systemd 서비스로 등록
    cat > /tmp/ufw-restore.service << 'SERVICE'
[Unit]
Description=UFW Auto Restore
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/restore-firewall.sh
RemainAfterExit=true

[Install]
WantedBy=multi-user.target
SERVICE
    
    sudo mv /tmp/ufw-restore.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable ufw-restore.service
    
    echo "✅ 자동 복원 설정 완료"
}

# 메뉴 표시
case "${1:-menu}" in
    "backup")
        backup_configs
        ;;
    "restore-ufw")
        restore_ufw
        ;;
    "check")
        check_connectivity
        ;;
    "auto-restore")
        setup_auto_restore
        ;;
    "menu"|*)
        echo "사용법: $0 [backup|restore-ufw|check|auto-restore]"
        echo ""
        echo "backup       - 현재 설정 백업"
        echo "restore-ufw  - UFW 설정 복원"
        echo "check        - 연결성 확인"
        echo "auto-restore - 자동 복원 설정"
        ;;
esac
