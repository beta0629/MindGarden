# 대시보드 생성 테스트 체크리스트

**작성일**: 2025-12-10  
**테스트 대상**: 온보딩 승인 후 대시보드 생성 프로세스

---

## 📋 테스트 전 확인 사항

### 온보딩 요청 정보
- **ID**: (승인 시 확인)
- **tenant_name**: "탁구와 마음 상담센터"
- **region**: "INCHEON"
- **brand_name**: "탁구와 마음이 심리상담 센터"
- **requested_by**: "beta0629@gmail.com"
- **status**: "PENDING"
- **business_type**: "CONSULTATION"

---

## ✅ 승인 후 확인 체크리스트

### 1. 테넌트 생성 확인
- [ ] `tenants` 테이블에 새 테넌트 생성 확인
- [ ] `tenant_id` 형식 확인: `tenant-{지역코드}-{업종코드}-{순번}` (예: `tenant-incheon-consultation-008`)
- [ ] `name` 필드: "탁구와 마음 상담센터"
- [ ] `business_type`: "CONSULTATION"
- [ ] `status`: "ACTIVE"
- [ ] `branding_json` 필드에 브랜드명 포함 확인

### 2. 관리자 계정 생성 확인
- [ ] `users` 테이블에 관리자 계정 생성 확인
- [ ] `email`: "beta0629@gmail.com"
- [ ] `role`: "ADMIN"
- [ ] `tenant_id`: 생성된 테넌트 ID와 일치
- [ ] `is_active`: TRUE
- [ ] `is_email_verified`: TRUE (또는 적절한 값)

### 3. 기본 역할 생성 확인
- [ ] `tenant_roles` 테이블에 4개 역할 생성 확인
  - [ ] 원장 (Principal) - `display_order: 1`
  - [ ] 상담사 (Consultant) - `display_order: 2`
  - [ ] 내담자 (Client) - `display_order: 3`
  - [ ] 사무원 (Staff) - `display_order: 4`
- [ ] 각 역할의 `tenant_id`가 생성된 테넌트 ID와 일치

### 4. 대시보드 생성 확인
- [ ] `tenant_dashboards` 테이블에 대시보드 생성 확인
- [ ] 각 역할별 대시보드 생성 확인
  - [ ] 원장 대시보드
  - [ ] 상담사 대시보드
  - [ ] 내담자 대시보드
  - [ ] 사무원 대시보드 (있는 경우)
- [ ] 대시보드 이름 형식: "{역할명} 대시보드"
- [ ] 각 대시보드의 `tenant_id`가 생성된 테넌트 ID와 일치

### 5. 온보딩 요청 상태 업데이트 확인
- [ ] `onboarding_request.status`: "APPROVED"
- [ ] `onboarding_request.tenant_id`: 생성된 테넌트 ID
- [ ] `onboarding_request.decided_by`: "ops_core" (또는 승인자 ID)
- [ ] `onboarding_request.decision_at`: 승인 시간 기록

### 6. 브랜딩 정보 확인
- [ ] `tenants.branding_json` 필드 확인
- [ ] JSON 구조: `{"companyName": "탁구와 마음이 심리상담 센터", "companyNameEn": "탁구와 마음이 심리상담 센터"}`

---

## 🔍 확인 SQL 쿼리

### 테넌트 생성 확인
```sql
SELECT 
    tenant_id,
    name,
    business_type,
    status,
    branding_json,
    created_at
FROM tenants
WHERE name = '탁구와 마음 상담센터'
  AND (is_deleted IS NULL OR is_deleted = FALSE)
ORDER BY created_at DESC
LIMIT 1;
```

### 관리자 계정 확인
```sql
SELECT 
    user_id,
    email,
    username,
    role,
    tenant_id,
    is_active,
    is_email_verified,
    created_at
FROM users
WHERE email = 'beta0629@gmail.com'
  AND tenant_id = '{생성된_테넌트_ID}'
  AND role = 'ADMIN'
  AND (is_deleted IS NULL OR is_deleted = FALSE);
```

### 기본 역할 확인
```sql
SELECT 
    tenant_role_id,
    tenant_id,
    name,
    name_ko,
    display_order,
    created_at
FROM tenant_roles
WHERE tenant_id = '{생성된_테넌트_ID}'
  AND (is_deleted IS NULL OR is_deleted = FALSE)
ORDER BY display_order;
```

### 대시보드 생성 확인
```sql
SELECT 
    dashboard_id,
    tenant_id,
    dashboard_name,
    role_code,
    is_active,
    created_at
FROM tenant_dashboards
WHERE tenant_id = '{생성된_테넌트_ID}'
  AND (is_deleted IS NULL OR is_deleted = FALSE)
ORDER BY created_at;
```

### 온보딩 요청 상태 확인
```sql
SELECT 
    id,
    tenant_id,
    tenant_name,
    region,
    brand_name,
    status,
    decided_by,
    decision_at,
    decision_note,
    updated_at
FROM onboarding_request
WHERE requested_by = 'beta0629@gmail.com'
  AND created_at >= '2025-12-10 08:55:00'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 📝 테스트 결과 기록

### 승인 시간
- **승인 시각**: (기록)
- **승인자**: ops_core

### 생성된 테넌트 정보
- **tenant_id**: (기록)
- **생성 시간**: (기록)

### 생성된 대시보드 목록
1. (역할명) 대시보드 - dashboard_id: (기록)
2. (역할명) 대시보드 - dashboard_id: (기록)
3. (역할명) 대시보드 - dashboard_id: (기록)
4. (역할명) 대시보드 - dashboard_id: (기록)

### 발견된 문제
- (문제 내용 기록)

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-10

