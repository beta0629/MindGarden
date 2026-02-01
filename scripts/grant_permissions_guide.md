# 개발 서버 권한 부여 가이드

## 방법 1: SSH로 개발 서버 접속 후 MySQL 실행

```bash
# 1. 개발 서버에 SSH 접속
ssh user@beta0629.cafe24.com

# 2. MySQL에 root로 접속
mysql -u root -p

# 3. 다음 SQL 실행
USE core_solution;

GRANT SELECT, INSERT, UPDATE, DELETE ON core_solution.popups TO 'mindgarden_dev'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON core_solution.popups TO 'mindgarden_dev'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON core_solution.popups TO 'mindgarden_dev'@'127.0.0.1';

GRANT SELECT, INSERT, UPDATE, DELETE ON core_solution.banners TO 'mindgarden_dev'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON core_solution.banners TO 'mindgarden_dev'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON core_solution.banners TO 'mindgarden_dev'@'127.0.0.1';

FLUSH PRIVILEGES;
```

## 방법 2: SQL 파일 직접 실행

```bash
# 개발 서버에 접속 후
mysql -h localhost -u root -p core_solution < /path/to/grant_permissions.sql
```

## 방법 3: 원격에서 직접 실행 (MySQL이 원격 접속 허용하는 경우)

```bash
mysql -h beta0629.cafe24.com -u root -p core_solution < scripts/grant_permissions.sql
```
