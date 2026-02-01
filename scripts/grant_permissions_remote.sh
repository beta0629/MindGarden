#!/bin/bash
# 개발 서버에 SSH로 접속하여 권한 부여하는 스크립트
# 사용법: ./scripts/grant_permissions_remote.sh

SERVER="beta0629.cafe24.com"
DB_USER="mindgarden_dev"
DB_NAME="core_solution"

echo "개발 서버에 SSH로 접속하여 권한 부여 중..."
echo "서버: $SERVER"
echo ""

# SSH로 접속하여 MySQL 명령 실행
ssh $SERVER << 'ENDSSH'
mysql -u root -p << 'ENDMYSQL'
USE core_solution;

GRANT SELECT, INSERT, UPDATE, DELETE ON core_solution.popups TO 'mindgarden_dev'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON core_solution.popups TO 'mindgarden_dev'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON core_solution.popups TO 'mindgarden_dev'@'127.0.0.1';

GRANT SELECT, INSERT, UPDATE, DELETE ON core_solution.banners TO 'mindgarden_dev'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON core_solution.banners TO 'mindgarden_dev'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON core_solution.banners TO 'mindgarden_dev'@'127.0.0.1';

FLUSH PRIVILEGES;

SELECT '권한 부여 완료!' AS result;
ENDMYSQL
ENDSSH

echo ""
echo "완료!"
