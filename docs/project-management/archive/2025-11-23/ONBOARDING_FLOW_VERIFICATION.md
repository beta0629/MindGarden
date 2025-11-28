# 온보딩 플로우 검증 문서

**작성일**: 2025-11-23  
**목적**: 1월 심사/발표를 위한 온보딩 플로우 완성도 검증  
**상태**: 검증 진행 중

---

## 📋 온보딩 플로우 개요

온보딩 요청부터 실제 서비스 사용까지의 전체 플로우:

```
1. 온보딩 요청 생성 (Trinity 홈페이지)
   ↓
2. 온보딩 승인 (관리자 또는 자동 승인)
   ↓
3. ProcessOnboardingApproval PL/SQL 프로시저 실행
   ├─ 테넌트 생성/활성화 (CreateOrActivateTenant)
   ├─ 카테고리 매핑 설정 (SetupTenantCategoryMapping)
   ├─ 기본 컴포넌트 활성화 (ActivateDefaultComponents)
   ├─ 기본 요금제 구독 생성 (CreateDefaultSubscription)
   ├─ 기본 역할 템플릿 적용 (ApplyDefaultRoleTemplates)
   └─ ERD 자동 생성 (GenerateErdOnOnboardingApproval)
   ↓
4. Java 서비스 레벨 처리
   ├─ 기본 대시보드 생성 (createDefaultDashboards)
   └─ 관리자 계정 생성 (createTenantAdminAccount)
   ↓
5. 관리자 로그인 및 대시보드 접근
```

---

## ✅ 검증 체크리스트

### 1. 온보딩 요청 생성 ✅

**위치**: `OnboardingService.create()`

**확인 사항**:
- [x] 온보딩 요청 생성 API 존재
- [x] `OnboardingRequest` 엔티티 저장
- [x] 상태가 `PENDING`으로 설정됨
- [ ] Trinity 홈페이지에서 실제 요청 생성 테스트

**테스트 방법**:
```bash
# API 테스트
POST /api/v1/onboarding/requests
{
  "tenantId": "test-tenant-001",
  "tenantName": "테스트 테넌트",
  "requestedBy": "test@example.com",
  "businessType": "CONSULTATION",
  "checklistJson": "{\"adminPassword\": \"test1234\"}"
}
```

---

### 2. 온보딩 승인 처리 ✅

**위치**: `OnboardingService.decide()`

**확인 사항**:
- [x] 승인/거부 결정 API 존재
- [x] `ProcessOnboardingApproval` PL/SQL 프로시저 호출
- [x] 승인 시 상태가 `APPROVED`로 변경됨
- [ ] 실제 승인 프로세스 테스트

**테스트 방법**:
```bash
# 승인 API 테스트
PUT /api/v1/onboarding/requests/{id}/decide
{
  "status": "APPROVED",
  "decidedBy": "admin@example.com",
  "decisionNote": "테스트 승인"
}
```

---

### 3. ProcessOnboardingApproval 프로시저 실행 ✅

**위치**: `V15__create_process_onboarding_approval_procedure.sql`

**확인 사항**:
- [x] 프로시저 존재 확인
- [x] 테넌트 생성/활성화 로직
- [x] 카테고리 매핑 설정
- [x] 기본 컴포넌트 활성화
- [x] 기본 요금제 구독 생성
- [x] 기본 역할 템플릿 적용
- [x] ERD 자동 생성
- [ ] 실제 프로시저 실행 테스트

**확인 쿼리**:
```sql
-- 테넌트 생성 확인
SELECT * FROM tenants WHERE tenant_id = 'test-tenant-001';

-- 카테고리 매핑 확인
SELECT * FROM tenant_category_mappings WHERE tenant_id = 'test-tenant-001';

-- 컴포넌트 활성화 확인
SELECT * FROM tenant_components WHERE tenant_id = 'test-tenant-001';

-- 구독 확인
SELECT * FROM subscriptions WHERE tenant_id = 'test-tenant-001';

-- 역할 템플릿 적용 확인
SELECT * FROM tenant_roles WHERE tenant_id = 'test-tenant-001';
```

---

### 4. 테넌트 settings_json 초기화 ✅

**위치**: `V40__add_tenant_settings_json_features.sql` (새로 생성)

**확인 사항**:
- [x] `CreateOrActivateTenant` 프로시저에 features 설정 추가
- [ ] 마이그레이션 실행 확인
- [ ] 온보딩 후 settings_json 확인

**확인 쿼리**:
```sql
-- settings_json 확인
SELECT 
    tenant_id,
    name,
    business_type,
    JSON_EXTRACT(settings_json, '$.features.consultation') as consultation_enabled,
    JSON_EXTRACT(settings_json, '$.features.academy') as academy_enabled,
    JSON_EXTRACT(settings_json, '$.subdomain') as subdomain,
    JSON_EXTRACT(settings_json, '$.domain') as domain
FROM tenants 
WHERE tenant_id = 'test-tenant-001';
```

**예상 결과**:
- `CONSULTATION` 업종: `consultation_enabled = true`, `academy_enabled = false`
- `ACADEMY` 업종: `consultation_enabled = false`, `academy_enabled = true`

---

### 5. 기본 대시보드 생성 ✅

**위치**: `TenantDashboardService.createDefaultDashboards()`

**확인 사항**:
- [x] `createDefaultDashboards()` 메서드 존재
- [x] 업종별 기본 역할에 대한 대시보드 생성
- [x] `OnboardingServiceImpl.decide()`에서 호출됨
- [ ] 실제 대시보드 생성 확인

**확인 쿼리**:
```sql
-- 대시보드 생성 확인
SELECT 
    dashboard_id,
    tenant_id,
    dashboard_type,
    dashboard_name,
    role_code,
    is_default
FROM tenant_dashboards 
WHERE tenant_id = 'test-tenant-001'
ORDER BY created_at;
```

**예상 결과**:
- 업종별 기본 역할에 대한 대시보드가 생성됨
- 예: `CONSULTATION` → `CLIENT`, `CONSULTANT`, `ADMIN` 대시보드
- 예: `ACADEMY` → `STUDENT`, `TEACHER`, `ADMIN` 대시보드

---

### 6. 관리자 계정 생성 ✅

**위치**: `OnboardingServiceImpl.createTenantAdminAccount()`

**확인 사항**:
- [x] `createTenantAdminAccount()` 메서드 존재
- [x] `checklistJson`에서 `adminPassword` 추출
- [x] `requestedBy` 이메일로 관리자 계정 생성
- [x] 멀티 테넌트 지원 (같은 이메일로 여러 테넌트 계정 생성 가능)
- [ ] 실제 관리자 계정 생성 확인

**확인 쿼리**:
```sql
-- 관리자 계정 확인
SELECT 
    id,
    tenant_id,
    email,
    username,
    name,
    role,
    is_active,
    is_email_verified
FROM users 
WHERE tenant_id = 'test-tenant-001' 
  AND role = 'ADMIN';
```

**예상 결과**:
- `requestedBy` 이메일로 관리자 계정이 생성됨
- `role = 'ADMIN'`
- `is_active = true`
- `is_email_verified = true` (온보딩 시 이메일 인증 완료)

---

### 7. 관리자 로그인 및 대시보드 접근 ✅

**확인 사항**:
- [ ] 생성된 관리자 계정으로 로그인 가능
- [ ] 역할별 대시보드 라우팅 동작
- [ ] 기본 위젯 표시 확인

**테스트 방법**:
1. 로그인 API 호출
2. 대시보드 조회 API 호출
3. 프론트엔드에서 대시보드 접근 확인

---

## 🔍 통합 테스트 시나리오

### 시나리오 1: CONSULTATION 업종 온보딩

1. **온보딩 요청 생성**
   ```json
   {
     "tenantId": "test-consultation-001",
     "tenantName": "테스트 상담소",
     "requestedBy": "admin@consultation.com",
     "businessType": "CONSULTATION",
     "checklistJson": "{\"adminPassword\": \"test1234\"}"
   }
   ```

2. **온보딩 승인**
   - 관리자가 승인 처리
   - `ProcessOnboardingApproval` 프로시저 실행

3. **검증**
   - 테넌트 생성 확인
   - `settings_json.features.consultation = true` 확인
   - 기본 대시보드 생성 확인 (CLIENT, CONSULTANT, ADMIN)
   - 관리자 계정 생성 확인
   - 관리자 로그인 및 대시보드 접근 확인

---

### 시나리오 2: ACADEMY 업종 온보딩

1. **온보딩 요청 생성**
   ```json
   {
     "tenantId": "test-academy-001",
     "tenantName": "테스트 학원",
     "requestedBy": "admin@academy.com",
     "businessType": "ACADEMY",
     "checklistJson": "{\"adminPassword\": \"test1234\"}"
   }
   ```

2. **온보딩 승인**
   - 관리자가 승인 처리
   - `ProcessOnboardingApproval` 프로시저 실행

3. **검증**
   - 테넌트 생성 확인
   - `settings_json.features.academy = true` 확인
   - 기본 대시보드 생성 확인 (STUDENT, TEACHER, ADMIN)
   - 관리자 계정 생성 확인
   - 관리자 로그인 및 대시보드 접근 확인

---

## 🐛 발견된 이슈 및 해결 방안

### 이슈 1: settings_json features 누락
**상태**: ✅ 해결됨  
**해결**: V40 마이그레이션 파일 생성하여 `CreateOrActivateTenant` 프로시저 업데이트

### 이슈 2: (추가 이슈 발견 시 기록)

---

## 📝 다음 단계

1. [ ] V40 마이그레이션 실행 및 테스트
2. [ ] 실제 온보딩 플로우 통합 테스트
3. [ ] 관리자 계정 로그인 테스트
4. [ ] 대시보드 접근 테스트
5. [ ] 기본 위젯 표시 확인

---

**마지막 업데이트**: 2025-11-23

