# 온보딩 프로시저 디버깅 가이드

## 문제 상황
- 온보딩 승인은 성공하지만 테넌트가 생성되지 않음
- 프로시저는 반영되었지만 실행 중 오류 발생 가능성

## 1단계: 프로시저 존재 확인

```bash
ssh root@beta0629.cafe24.com
mysql -u mindgarden_dev -p'MindGardenDev2025!@#' core_solution -e "SHOW PROCEDURE STATUS WHERE Db = 'core_solution' AND Name IN ('ProcessOnboardingApproval', 'CreateOrActivateTenant', 'SetupTenantCategoryMapping', 'ActivateDefaultComponents', 'CreateDefaultSubscription', 'ApplyDefaultRoleTemplates', 'GenerateErdOnOnboardingApproval');"
```

**확인 사항**: 모든 프로시저가 존재하는지 확인

## 2단계: 최근 온보딩 요청 확인

```bash
mysql -u mindgarden_dev -p'MindGardenDev2025!@#' core_solution -e "SELECT id, tenant_id, tenant_name, status, decision_status, decision_note FROM onboarding_requests ORDER BY id DESC LIMIT 5;"
```

**확인 사항**: 
- `decision_status`가 `APPROVED`인지 확인
- `tenant_id` 값 확인 (예: `test-CONSULTATION-1763901075357`)

## 3단계: 테넌트 존재 확인

```bash
mysql -u mindgarden_dev -p'MindGardenDev2025!@#' core_solution -e "SELECT tenant_id, name, status, business_type, created_at FROM tenants WHERE tenant_id LIKE 'test-%' ORDER BY created_at DESC LIMIT 10;"
```

**확인 사항**: 최근 생성된 테스트 테넌트가 있는지 확인

## 4단계: 프로시저 직접 실행 테스트

```bash
mysql -u mindgarden_dev -p'MindGardenDev2025!@#' core_solution << 'EOF'
SET @request_id = 27;
SET @tenant_id = 'test-CONSULTATION-1763901075357';
SET @tenant_name = 'Test Consultation Tenant';
SET @business_type = 'CONSULTATION';
SET @approved_by = 'superadmin@mindgarden.com';
SET @decision_note = 'Test approval';

CALL ProcessOnboardingApproval(
    @request_id,
    @tenant_id,
    @tenant_name,
    @business_type,
    @approved_by,
    @decision_note,
    @success,
    @message
);

SELECT @success as success, @message as message;
SELECT tenant_id, name, status FROM tenants WHERE tenant_id = @tenant_id;
EOF
```

**확인 사항**:
- `@success`가 `1` (TRUE)인지 확인
- `@message` 내용 확인
- 테넌트가 생성되었는지 확인

## 5단계: 백엔드 로그 확인

```bash
ssh root@beta0629.cafe24.com
journalctl -u mindgarden-dev.service --since '30 minutes ago' --no-pager | grep -i "온보딩\|onboarding\|tenant\|프로시저\|procedure" | tail -50
```

**확인 사항**:
- 프로시저 실행 로그
- 오류 메시지
- 예외 스택 트레이스

## 6단계: CreateOrActivateTenant 프로시저 직접 테스트

```bash
mysql -u mindgarden_dev -p'MindGardenDev2025!@#' core_solution << 'EOF'
SET @tenant_id = 'test-direct-12345';
SET @tenant_name = 'Direct Test Tenant';
SET @business_type = 'CONSULTATION';
SET @approved_by = 'test@test.com';

CALL CreateOrActivateTenant(
    @tenant_id,
    @tenant_name,
    @business_type,
    @approved_by,
    @success,
    @message
);

SELECT @success as success, @message as message;
SELECT tenant_id, name, status, settings_json FROM tenants WHERE tenant_id = @tenant_id;
EOF
```

**확인 사항**:
- 프로시저가 성공하는지 확인
- 테넌트가 생성되는지 확인
- 오류 메시지가 있는지 확인

## 7단계: MySQL 버전 확인

```bash
mysql -u mindgarden_dev -p'MindGardenDev2025!@#' core_solution -e "SELECT VERSION();"
```

**확인 사항**: 
- MySQL 8.0 이상이어야 `REGEXP_REPLACE` 함수 사용 가능
- 5.7 이하인 경우 프로시저 수정 필요

## 8단계: 프로시저 정의 확인

```bash
mysql -u mindgarden_dev -p'MindGardenDev2025!@#' core_solution -e "SHOW CREATE PROCEDURE CreateOrActivateTenant\G"
```

**확인 사항**: 프로시저 정의가 올바른지 확인

## 예상 문제 및 해결 방법

### 문제 1: REGEXP_REPLACE 함수 오류
**증상**: MySQL 5.7 이하에서 `REGEXP_REPLACE` 사용 불가
**해결**: 프로시저에서 `REGEXP_REPLACE` 제거하고 다른 방법 사용

### 문제 2: 프로시저 실행 중 예외 발생
**증상**: 프로시저는 존재하지만 실행 시 오류
**해결**: 프로시저 정의 확인 및 수정

### 문제 3: 트랜잭션 롤백
**증상**: 프로시저 실행은 되지만 데이터가 저장되지 않음
**해결**: 트랜잭션 로그 확인 및 COMMIT 확인

## 빠른 확인 스크립트

```bash
#!/bin/bash
# quick_check.sh

DB_USER="mindgarden_dev"
DB_PASS="MindGardenDev2025!@#"
DB_NAME="core_solution"

echo "=== 1. 프로시저 존재 확인 ==="
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "SHOW PROCEDURE STATUS WHERE Db = '$DB_NAME' AND Name = 'ProcessOnboardingApproval';"

echo -e "\n=== 2. 최근 온보딩 요청 ==="
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "SELECT id, tenant_id, tenant_name, status, decision_status FROM onboarding_requests ORDER BY id DESC LIMIT 3;"

echo -e "\n=== 3. 최근 테넌트 ==="
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "SELECT tenant_id, name, status, created_at FROM tenants ORDER BY created_at DESC LIMIT 5;"

echo -e "\n=== 4. MySQL 버전 ==="
mysql -u $DB_USER -p"$DB_PASS" $DB_NAME -e "SELECT VERSION();"
```

## 다음 단계

위 단계를 순서대로 실행하여 문제를 특정한 후, 결과를 공유해주시면 추가 해결 방법을 제시하겠습니다.

