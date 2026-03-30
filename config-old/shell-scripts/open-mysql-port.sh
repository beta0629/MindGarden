#!/bin/bash

# MySQL 3306 포트 열기 스크립트
echo "🔧 MySQL 3306 포트 열기 시작..."

# 1. MySQL 서비스 상태 확인
echo "📋 MySQL 서비스 상태 확인 중..."
sudo systemctl status mysql --no-pager

# 2. UFW 방화벽에서 3306 포트 열기
echo "🔥 UFW 방화벽에서 3306 포트 열기..."
sudo ufw allow 3306/tcp
sudo ufw reload

# 3. iptables에서도 3306 포트 열기 (이중 보장)
echo "🔥 iptables에서 3306 포트 열기..."
sudo iptables -A INPUT -p tcp --dport 3306 -j ACCEPT
sudo iptables-save > /etc/iptables/rules.v4 2>/dev/null || echo "iptables 규칙 저장 건너뜀"

# 4. MySQL 설정에서 외부 접속 허용
echo "⚙️ MySQL 설정에서 외부 접속 허용..."
sudo sed -i 's/bind-address.*=.*127.0.0.1/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf

# 5. MySQL 재시작
echo "🔄 MySQL 서비스 재시작..."
sudo systemctl restart mysql

# 6. 포트 확인
echo "🔍 3306 포트 열림 상태 확인..."
sudo netstat -tlnp | grep 3306 || echo "netstat으로 확인 불가"
sudo ss -tlnp | grep 3306 || echo "ss로 확인 불가"

# 7. MySQL 사용자 권한 설정
echo "👤 MySQL 사용자 권한 설정..."
mysql -u root -p -e "
CREATE USER IF NOT EXISTS 'mindgarden'@'%' IDENTIFIED BY 'mindgarden2025';
GRANT ALL PRIVILEGES ON mind_garden.* TO 'mindgarden'@'%';
FLUSH PRIVILEGES;
SELECT 'MySQL 사용자 설정 완료' as status;
" 2>/dev/null || echo "MySQL 사용자 설정 건너뜀 (수동으로 해야 함)"

echo "✅ MySQL 3306 포트 열기 완료!"
echo "🔗 이제 211.37.179.204:3306으로 접속 가능합니다."
