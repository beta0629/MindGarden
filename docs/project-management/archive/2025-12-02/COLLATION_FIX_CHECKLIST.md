# MySQL Collation 문제 해결 체크리스트

**작성일:** 2025-12-02  
**목적:** 프로시저 Collation 문제 완전 해결 (우회 금지)  
**원칙:** 근본 원인을 완전히 제거하여 재발 방지

---

## 🎯 핵심 원칙

### ✅ 해야 할 것
- ✅ 모든 프로시저 파라미터에 collation 명시
- ✅ 모든 변수에 collation 명시
- ✅ 모든 비교 연산에 COLLATE 절 추가
- ✅ 100% 테스트 통과 확인
- ✅ 문서화 완료

### ❌ 하지 말아야 할 것
- ❌ 임시 우회 (Java fallback만으로 해결)
- ❌ 부분 수정 (일부 프로시저만 수정)
- ❌ 테스트 생략
- ❌ 문서화 생략

---

## 📋 프로시저별 체크리스트

### 1. ProcessOnboardingApproval (메인 프로시저)

#### 파라미터 Collation 명시
```sql
CREATE PROCEDURE ProcessOnboardingApproval(
    IN p_request_id BINARY(16),
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_tenant_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_approved_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_decision_note TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_contact_email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_admin_password_hash VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
```

#### 체크리스트
- [ ] 파라미터 collation 명시 완료
- [ ] 변수 collation 명시 완료
- [ ] 하위 프로시저 호출 시 collation 보장
- [ ] 단위 테스트 통과
- [ ] 마이그레이션 스크립트 작성

---

### 2. CreateOrActivateTenant

#### 파라미터 Collation 명시
```sql
CREATE PROCEDURE CreateOrActivateTenant(
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_tenant_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_created_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
```

#### 변수 Collation 명시
```sql
DECLARE v_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### WHERE 절 COLLATE 추가
```sql
WHERE tenant_id COLLATE utf8mb4_unicode_ci = p_tenant_id COLLATE utf8mb4_unicode_ci
```

#### 체크리스트
- [ ] 파라미터 collation 명시 완료
- [ ] 변수 collation 명시 완료
- [ ] WHERE 절 COLLATE 추가 완료
- [ ] 단위 테스트 통과
- [ ] 마이그레이션 스크립트 작성

---

### 3. CopyDefaultTenantCodes

#### 파라미터 Collation 명시
```sql
CREATE PROCEDURE CopyDefaultTenantCodes(
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_template_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_created_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
```

#### 체크리스트
- [ ] 파라미터 collation 명시 완료
- [ ] 변수 collation 명시 완료
- [ ] JOIN 절 COLLATE 추가 완료
- [ ] WHERE 절 COLLATE 추가 완료
- [ ] 단위 테스트 통과
- [ ] 마이그레이션 스크립트 작성

---

### 4. SetupTenantCategoryMapping

#### 파라미터 Collation 명시
```sql
CREATE PROCEDURE SetupTenantCategoryMapping(
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_created_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
```

#### 체크리스트
- [ ] 파라미터 collation 명시 완료
- [ ] 변수 collation 명시 완료
- [ ] WHERE 절 COLLATE 추가 완료
- [ ] 단위 테스트 통과
- [ ] 마이그레이션 스크립트 작성

---

### 5. ActivateDefaultComponents

#### 파라미터 Collation 명시
```sql
CREATE PROCEDURE ActivateDefaultComponents(
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_created_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
```

#### 체크리스트
- [ ] 파라미터 collation 명시 완료
- [ ] 변수 collation 명시 완료
- [ ] WHERE 절 COLLATE 추가 완료
- [ ] 단위 테스트 통과
- [ ] 마이그레이션 스크립트 작성

---

### 6. CreateDefaultSubscription

#### 파라미터 Collation 명시
```sql
CREATE PROCEDURE CreateDefaultSubscription(
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_created_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_subscription_id BIGINT
)
```

#### 체크리스트
- [ ] 파라미터 collation 명시 완료
- [ ] 변수 collation 명시 완료
- [ ] WHERE 절 COLLATE 추가 완료
- [ ] 단위 테스트 통과
- [ ] 마이그레이션 스크립트 작성

---

### 7. ApplyDefaultRoleTemplates ✅

#### 상태: 부분 완료 (V20251202_015)

#### 체크리스트
- [x] 파라미터 collation 명시 완료
- [x] 변수 collation 명시 완료
- [x] WHERE 절 COLLATE 추가 완료
- [ ] 단위 테스트 통과 (재검증 필요)
- [x] 마이그레이션 스크립트 작성

#### 추가 검증 필요
- [ ] 커서 내부 SELECT 문 COLLATE 확인
- [ ] INSERT 문 collation 확인
- [ ] 10회 이상 반복 테스트

---

### 8. GenerateErdOnOnboardingApproval

#### 파라미터 Collation 명시
```sql
CREATE PROCEDURE GenerateErdOnOnboardingApproval(
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_tenant_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_business_type VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_created_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
```

#### 체크리스트
- [ ] 파라미터 collation 명시 완료
- [ ] 변수 collation 명시 완료
- [ ] WHERE 절 COLLATE 추가 완료
- [ ] 단위 테스트 통과
- [ ] 마이그레이션 스크립트 작성

---

### 9. CreateTenantAdminAccount

#### 파라미터 Collation 명시
```sql
CREATE PROCEDURE CreateTenantAdminAccount(
    IN p_tenant_id VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_contact_email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_tenant_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_admin_password_hash VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    IN p_approved_by VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
```

#### 체크리스트
- [ ] 파라미터 collation 명시 완료
- [ ] 변수 collation 명시 완료
- [ ] WHERE 절 COLLATE 추가 완료
- [ ] 단위 테스트 통과
- [ ] 마이그레이션 스크립트 작성

---

## 🧪 테스트 체크리스트

### 단위 테스트 (각 프로시저별)

#### 테스트 템플릿
```sql
-- 테스트 데이터 준비
SET @tenant_id = 'tenant-test-collation-001';
SET @business_type = 'CONSULTATION';
SET @created_by = 'system-test';

-- 프로시저 실행
CALL [프로시저명](@tenant_id, @business_type, @created_by, @success, @message);

-- 결과 확인
SELECT @success AS success, @message AS message;

-- Collation 오류 확인
SHOW WARNINGS;
```

#### 체크리스트
- [ ] CreateOrActivateTenant 테스트
- [ ] CopyDefaultTenantCodes 테스트
- [ ] SetupTenantCategoryMapping 테스트
- [ ] ActivateDefaultComponents 테스트
- [ ] CreateDefaultSubscription 테스트
- [ ] ApplyDefaultRoleTemplates 테스트 (재검증)
- [ ] GenerateErdOnOnboardingApproval 테스트
- [ ] CreateTenantAdminAccount 테스트
- [ ] ProcessOnboardingApproval 테스트 (통합)

---

### 통합 테스트

#### 전체 온보딩 프로세스
```bash
# 테스트 스크립트 실행
./scripts/test-widget-grouping-system.sh
```

#### 검증 항목
- [ ] 테넌트 생성 확인
- [ ] 역할 4개 생성 확인
  - [ ] ADMIN (원장)
  - [ ] MANAGER (관리자)
  - [ ] CONSULTANT (상담사)
  - [ ] CLIENT (내담자)
- [ ] 대시보드 4개 생성 확인
- [ ] 관리자 계정 생성 확인
- [ ] 위젯 그룹 생성 확인
- [ ] Collation 오류 미발생 확인

#### 멱등성 테스트
- [ ] 1차 실행: 성공
- [ ] 2차 실행: 성공 (동일 결과)
- [ ] 3차 실행: 성공 (동일 결과)
- [ ] 10차 실행: 성공 (동일 결과)

---

## 📊 진행 상황 추적

### 프로시저 수정 진행률

| 프로시저 | 파라미터 | 변수 | WHERE/JOIN | 테스트 | 마이그레이션 | 완료율 |
|---------|---------|------|-----------|--------|------------|-------|
| ProcessOnboardingApproval | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 0% |
| CreateOrActivateTenant | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 0% |
| CopyDefaultTenantCodes | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 0% |
| SetupTenantCategoryMapping | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 0% |
| ActivateDefaultComponents | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 0% |
| CreateDefaultSubscription | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 0% |
| ApplyDefaultRoleTemplates | ✅ | ✅ | ✅ | ⬜ | ✅ | 80% |
| GenerateErdOnOnboardingApproval | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 0% |
| CreateTenantAdminAccount | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | 0% |

**전체 진행률:** 약 9% (1/9 프로시저 80% 완료)

---

## 🎯 완료 기준

### 각 프로시저 완료 기준
- ✅ 파라미터 collation 명시 100%
- ✅ 변수 collation 명시 100%
- ✅ WHERE/JOIN 절 COLLATE 추가 100%
- ✅ 단위 테스트 통과
- ✅ 마이그레이션 스크립트 작성

### 전체 작업 완료 기준
- ✅ 9개 프로시저 모두 수정 완료
- ✅ 통합 테스트 11/11 통과 (100%)
- ✅ 10회 이상 반복 테스트 통과
- ✅ Collation 오류 0건
- ✅ 문서화 완료

---

## 📝 작업 로그

### 2025-12-02
- [x] 문제 분석 및 진단 완료
- [x] ApplyDefaultRoleTemplates 프로시저 수정 (V20251202_015)
- [x] OnboardingApprovalServiceImpl 세션 변수 설정 추가
- [ ] 나머지 8개 프로시저 수정 대기

### 다음 작업 (예정)
- [ ] CreateOrActivateTenant 프로시저 수정
- [ ] CopyDefaultTenantCodes 프로시저 수정
- [ ] 나머지 프로시저 순차 수정
- [ ] 통합 테스트 실행
- [ ] 문서화 완료

---

**작성일:** 2025-12-02  
**최종 수정:** 2025-12-02  
**상태:** 🔴 진행 중 (9% 완료)  
**다음 체크:** 프로시저 수정 완료 후

