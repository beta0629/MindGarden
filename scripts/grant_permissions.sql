-- 개발 서버에 popups, banners 테이블 권한 부여 SQL
-- 실행 방법: mysql -h beta0629.cafe24.com -u root -p < scripts/grant_permissions.sql

USE core_solution;

-- popups 테이블에 대한 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON core_solution.popups TO 'mindgarden_dev'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON core_solution.popups TO 'mindgarden_dev'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON core_solution.popups TO 'mindgarden_dev'@'127.0.0.1';

-- banners 테이블에 대한 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON core_solution.banners TO 'mindgarden_dev'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON core_solution.banners TO 'mindgarden_dev'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON core_solution.banners TO 'mindgarden_dev'@'127.0.0.1';

FLUSH PRIVILEGES;
