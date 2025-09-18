-- MindGarden 운영 데이터베이스 설정
-- 실행 방법: mysql -u root -p < production-db-setup.sql

-- 1. 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS mindgarden_prod 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 2. 운영용 사용자 생성 및 권한 부여
CREATE USER IF NOT EXISTS 'mindgarden_prod'@'localhost' IDENTIFIED BY 'MindGarden2025!@#';
CREATE USER IF NOT EXISTS 'mindgarden_prod'@'%' IDENTIFIED BY 'MindGarden2025!@#';

-- 3. 데이터베이스 권한 부여
GRANT ALL PRIVILEGES ON mindgarden_prod.* TO 'mindgarden_prod'@'localhost';
GRANT ALL PRIVILEGES ON mindgarden_prod.* TO 'mindgarden_prod'@'%';

-- 4. 읽기 전용 사용자 (모니터링용)
CREATE USER IF NOT EXISTS 'mindgarden_readonly'@'localhost' IDENTIFIED BY 'ReadOnly2025!';
GRANT SELECT ON mindgarden_prod.* TO 'mindgarden_readonly'@'localhost';

-- 5. 백업용 사용자
CREATE USER IF NOT EXISTS 'mindgarden_backup'@'localhost' IDENTIFIED BY 'Backup2025!';
GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON mindgarden_prod.* TO 'mindgarden_backup'@'localhost';

-- 6. 권한 적용
FLUSH PRIVILEGES;

-- 7. 데이터베이스 선택
USE mindgarden_prod;

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

SHOW GRANTS FOR 'mindgarden_prod'@'localhost';
