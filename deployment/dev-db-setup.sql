-- MindGarden 개발 데이터베이스 설정
-- 실행 방법: mysql -u root -p < dev-db-setup.sql

-- 1. 데이터베이스 생성 (운영과 동일한 구조, 이름만 다름)
CREATE DATABASE IF NOT EXISTS mind_garden 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 2. 개발용 사용자 생성 및 권한 부여
CREATE USER IF NOT EXISTS 'mindgarden_dev'@'localhost' IDENTIFIED BY 'MindGardenDev2025!@#';
CREATE USER IF NOT EXISTS 'mindgarden_dev'@'%' IDENTIFIED BY 'MindGardenDev2025!@#';

-- 3. 데이터베이스 권한 부여
GRANT ALL PRIVILEGES ON mind_garden.* TO 'mindgarden_dev'@'localhost';
GRANT ALL PRIVILEGES ON mind_garden.* TO 'mindgarden_dev'@'%';

-- 4. 읽기 전용 사용자 (모니터링용)
CREATE USER IF NOT EXISTS 'mindgarden_readonly'@'localhost' IDENTIFIED BY 'ReadOnlyDev2025!';
GRANT SELECT ON mind_garden.* TO 'mindgarden_readonly'@'localhost';

-- 5. 백업용 사용자
CREATE USER IF NOT EXISTS 'mindgarden_backup'@'localhost' IDENTIFIED BY 'BackupDev2025!';
GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON mind_garden.* TO 'mindgarden_backup'@'localhost';

-- 6. 권한 적용
FLUSH PRIVILEGES;

-- 7. 데이터베이스 선택
USE mind_garden;

-- 8. 기본 설정 확인
SELECT 
    'Database Created' as status,
    DATABASE() as current_db,
    @@character_set_database as charset,
    @@collation_database as collation;

-- 9. 사용자 권한 확인
SELECT 
    User, 
    Host, 
    Select_priv, 
    Insert_priv, 
    Update_priv, 
    Delete_priv 
FROM mysql.user 
WHERE User LIKE 'mindgarden%';

SHOW GRANTS FOR 'mindgarden_dev'@'localhost';

