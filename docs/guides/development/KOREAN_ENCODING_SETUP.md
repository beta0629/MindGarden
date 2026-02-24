문서 위치: docs/guides/development/KOREAN_ENCODING_SETUP.md

# 한글 인코딩 설정 가이드

## 🎯 PL/SQL 재무 시스템 한글 인코딩 설정

### 1. 데이터베이스 설정
```sql
-- MySQL 문자셋 설정
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
```

### 2. JDBC 연결 설정
```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mindgarden_consultation?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8&useUnicode=true&allowPublicKeyRetrieval=true
  jpa:
    properties:
      hibernate:
        connection:
          characterEncoding: utf8mb4
          useUnicode: true
```

### 3. 배포 스크립트 설정
```bash
# deploy-plsql-financial.sh
export LANG=ko_KR.UTF-8
export LC_ALL=ko_KR.UTF-8

# MySQL 클라이언트 한글 인코딩
mysql --default-character-set=utf8mb4
```

### 4. SQL 스크립트 설정
```sql
-- sql-scripts/*.sql
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
```

## 🔍 한글 인코딩 확인 방법

### 1. 데이터베이스 문자셋 확인
```sql
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';
```

### 2. 지점명 한글 확인
```sql
SELECT code_value, code_label, code_group 
FROM common_codes 
WHERE code_group = 'BRANCH';
```

### 3. PL/SQL 프로시저 한글 주석 확인
```sql
SELECT ROUTINE_NAME, ROUTINE_COMMENT 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'mindgarden' 
AND ROUTINE_NAME LIKE '%Financial%';
```

## ✅ 확인사항

- [ ] `character_set_server`: utf8mb4
- [ ] `character_set_database`: utf8mb4  
- [ ] `character_set_client`: utf8mb4
- [ ] 지점명이 한글로 정상 표시
- [ ] PL/SQL 프로시저 주석이 한글로 정상 표시
- [ ] API 응답에서 한글이 깨지지 않음

## 🚀 배포 순서

1. **한글 인코딩 테스트**
   ```bash
   ./test-korean-encoding.sh
   ```

2. **PL/SQL 프로시저 배포**
   ```bash
   ./deploy-plsql-financial.sh
   ```

3. **API 테스트**
   ```bash
   curl -X GET "http://localhost:8080/api/hq/erp/consolidated"
   curl -X GET "http://localhost:8080/api/hq/erp/reports"
   ```

## 📝 주의사항

- 모든 파일은 UTF-8 인코딩으로 저장
- MySQL 클라이언트는 `--default-character-set=utf8mb4` 옵션 사용
- 터미널 환경변수: `LANG=ko_KR.UTF-8`, `LC_ALL=ko_KR.UTF-8`
- JDBC URL에 `characterEncoding=UTF-8&useUnicode=true` 포함
