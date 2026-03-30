# PL/SQL 프로시저 배포 가이드

## 개요
온보딩 승인 시 관리자 계정 생성을 PL/SQL 프로시저에서 처리하도록 변경했습니다.

## 배포 순서

### 1. CreateTenantAdminAccount 프로시저 생성
```bash
# 개발 서버에 접속
ssh beta0629.cafe24.com

# SQL 스크립트 실행
mysql -u [DB_USER] -p [DB_NAME] < /path/to/sql/create_tenant_admin_account_procedure.sql
```

또는 MySQL 클라이언트에서 직접 실행:
```sql
SOURCE /path/to/sql/create_tenant_admin_account_procedure.sql;
```

### 2. ProcessOnboardingApproval 프로시저 업데이트
```bash
# SQL 스크립트 실행
mysql -u [DB_USER] -p [DB_NAME] < /path/to/sql/update_process_onboarding_approval_with_admin_account.sql
```

또는 MySQL 클라이언트에서 직접 실행:
```sql
SOURCE /path/to/sql/update_process_onboarding_approval_with_admin_account.sql;
```

## 변경 사항 확인

### 프로시저 파라미터 확인
```sql
-- ProcessOnboardingApproval 프로시저 파라미터 확인
SHOW CREATE PROCEDURE ProcessOnboardingApproval;

-- CreateTenantAdminAccount 프로시저 확인
SHOW CREATE PROCEDURE CreateTenantAdminAccount;
```

### 프로시저 목록 확인
```sql
SHOW PROCEDURE STATUS WHERE Db = '[DB_NAME]';
```

## 테스트 방법

### 1. 온보딩 요청 생성
- `checklistJson`에 `adminPassword` 포함
- `requestedBy`에 이메일 주소 포함

### 2. 온보딩 승인
- Ops Portal에서 온보딩 요청 승인
- 프로시저가 자동으로 관리자 계정 생성

### 3. 확인 사항
```sql
-- 관리자 계정 생성 확인
SELECT 
    id, tenant_id, email, username, role, is_active, is_email_verified
FROM users
WHERE tenant_id = '[TENANT_ID]' 
    AND role = 'ADMIN'
    AND is_deleted = FALSE;

-- 온보딩 요청 상태 확인
SELECT 
    id, tenant_id, status, decision_note
FROM onboarding_requests
WHERE id = [REQUEST_ID];
```

## 롤백 방법

만약 문제가 발생하면:

1. **이전 버전의 ProcessOnboardingApproval 프로시저로 복원**
   - Git에서 이전 버전의 프로시저 확인
   - 프로시저 재생성

2. **Java 코드 롤백**
   ```bash
   git revert 3509fbaa
   git push origin develop
   ```

## 주의사항

1. **BCrypt 해시**: Java에서 비밀번호를 BCrypt로 해시하여 프로시저에 전달합니다.
2. **트랜잭션**: 모든 작업이 하나의 트랜잭션에서 처리되므로 일관성이 보장됩니다.
3. **에러 처리**: 관리자 계정 생성 실패 시에도 온보딩 프로세스는 계속 진행됩니다 (경고만).

## 문제 해결

### 프로시저 실행 오류
```sql
-- 프로시저 상태 확인
SHOW PROCEDURE STATUS;

-- 프로시저 삭제 후 재생성
DROP PROCEDURE IF EXISTS CreateTenantAdminAccount;
DROP PROCEDURE IF EXISTS ProcessOnboardingApproval;
-- 그 다음 SQL 스크립트 재실행
```

### 관리자 계정이 생성되지 않는 경우
1. `checklistJson`에 `adminPassword`가 있는지 확인
2. `requestedBy`에 유효한 이메일이 있는지 확인
3. 프로시저 로그 확인 (MySQL 에러 로그)

