# 기본 컴포넌트 활성화 검증 문서

**작성일**: 2025-11-23  
**목적**: 1월 심사/발표를 위한 기본 컴포넌트 활성화 검증  
**상태**: 검증 진행 중

---

## 📋 기본 컴포넌트 활성화 개요

온보딩 승인 시 `ProcessOnboardingApproval` PL/SQL 프로시저 내부에서 `ActivateDefaultComponents` 프로시저가 호출되어 업종별 기본 컴포넌트를 자동으로 활성화합니다.

**활성화 프로세스**:
```
ProcessOnboardingApproval
  ↓
ActivateDefaultComponents (업종별 기본 컴포넌트 활성화)
  ↓
business_category_items.default_components_json에서 컴포넌트 ID 조회
  ↓
tenant_components 테이블에 활성화된 컴포넌트 기록
```

---

## ✅ 검증 체크리스트

### 1. ActivateDefaultComponents 프로시저 확인 ✅

**위치**: `V13__create_onboarding_approval_procedures.sql`

**확인 사항**:
- [x] `ActivateDefaultComponents` 프로시저 존재
- [x] `business_category_items.default_components_json`에서 컴포넌트 조회
- [x] `tenant_components` 테이블에 활성화 기록
- [ ] 실제 프로시저 실행 테스트

**프로시저 로직**:
```sql
CREATE PROCEDURE ActivateDefaultComponents(
    IN p_tenant_id VARCHAR(36),
    IN p_business_type VARCHAR(50),
    IN p_activated_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    -- 업종별 기본 컴포넌트 조회
    SELECT default_components_json INTO v_default_components
    FROM business_category_items
    WHERE business_type = p_business_type
        AND is_active = TRUE
    LIMIT 1;
    
    -- JSON 배열에서 컴포넌트 ID 추출하여 활성화
    WHILE i < JSON_LENGTH(v_default_components) DO
        SET v_component_id = JSON_UNQUOTE(JSON_EXTRACT(v_default_components, CONCAT('$[', i, ']')));
        
        -- 컴포넌트 활성화
        INSERT INTO tenant_components (
            tenant_component_id, tenant_id, component_id, status,
            activated_at, activated_by, created_at
        ) VALUES (
            UUID(), p_tenant_id, v_component_id, 'ACTIVE',
            NOW(), p_activated_by, NOW()
        )
        ON DUPLICATE KEY UPDATE 
            status = 'ACTIVE',
            activated_at = NOW(),
            activated_by = p_activated_by,
            updated_at = NOW();
        
        SET i = i + 1;
    END WHILE;
END
```

---

### 2. business_category_items 기본 컴포넌트 설정 확인 ✅

**위치**: `business_category_items` 테이블의 `default_components_json` 필드

**확인 사항**:
- [ ] 업종별 기본 컴포넌트가 `default_components_json`에 설정되어 있는지 확인
- [ ] JSON 형식이 올바른지 확인
- [ ] 컴포넌트 ID가 `component_catalog` 테이블에 존재하는지 확인

**확인 쿼리**:
```sql
-- 업종별 기본 컴포넌트 설정 확인
SELECT 
    item_id,
    business_type,
    item_name,
    default_components_json,
    JSON_LENGTH(default_components_json) as component_count
FROM business_category_items
WHERE business_type IN ('CONSULTATION', 'ACADEMY')
  AND is_active = TRUE;
```

**예상 결과**:
- `CONSULTATION` 업종: 상담 관련 기본 컴포넌트 ID 배열
- `ACADEMY` 업종: 학원 관련 기본 컴포넌트 ID 배열

**예시 JSON**:
```json
["component-uuid-1", "component-uuid-2", "component-uuid-3"]
```

---

### 3. tenant_components 활성화 확인 ✅

**위치**: `tenant_components` 테이블

**확인 사항**:
- [ ] 온보딩 승인 후 `tenant_components` 테이블에 컴포넌트가 활성화되었는지 확인
- [ ] `status = 'ACTIVE'`인지 확인
- [ ] `activated_at`, `activated_by`가 올바르게 설정되었는지 확인

**확인 쿼리**:
```sql
-- 테넌트별 활성화된 컴포넌트 확인
SELECT 
    tc.tenant_component_id,
    tc.tenant_id,
    tc.component_id,
    cc.component_name,
    cc.component_type,
    tc.status,
    tc.activated_at,
    tc.activated_by
FROM tenant_components tc
JOIN component_catalog cc ON tc.component_id = cc.component_id
WHERE tc.tenant_id = 'test-tenant-001'
  AND tc.status = 'ACTIVE'
ORDER BY tc.activated_at;
```

**예상 결과**:
- 업종별 기본 컴포넌트가 모두 `ACTIVE` 상태로 활성화됨
- `activated_at`이 온보딩 승인 시점과 일치
- `activated_by`가 승인한 관리자 이메일

---

### 4. component_catalog 컴포넌트 목록 확인 ✅

**위치**: `component_catalog` 테이블

**확인 사항**:
- [ ] 기본 컴포넌트가 `component_catalog` 테이블에 등록되어 있는지 확인
- [ ] 컴포넌트 타입, 이름, 설명이 올바른지 확인

**확인 쿼리**:
```sql
-- 컴포넌트 카탈로그 확인
SELECT 
    component_id,
    component_name,
    component_type,
    description,
    is_active
FROM component_catalog
WHERE is_active = TRUE
ORDER BY component_type, component_name;
```

**예상 컴포넌트 타입**:
- `CONSULTATION` - 상담 관련 컴포넌트
- `ACADEMY` - 학원 관련 컴포넌트
- `COMMON` - 공통 컴포넌트
- `ERP` - ERP 관련 컴포넌트

---

## 🔍 통합 테스트 시나리오

### 시나리오 1: CONSULTATION 업종 컴포넌트 활성화

1. **온보딩 승인**
   - `CONSULTATION` 업종으로 온보딩 승인
   - `ProcessOnboardingApproval` 프로시저 실행

2. **컴포넌트 활성화 확인**
   ```sql
   -- 활성화된 컴포넌트 확인
   SELECT 
       cc.component_name,
       cc.component_type,
       tc.status,
       tc.activated_at
   FROM tenant_components tc
   JOIN component_catalog cc ON tc.component_id = cc.component_id
   WHERE tc.tenant_id = 'test-consultation-001'
     AND tc.status = 'ACTIVE';
   ```

3. **예상 결과**
   - 상담 관련 기본 컴포넌트가 활성화됨
   - 예: 상담 관리, 예약 관리, 고객 관리 등

---

### 시나리오 2: ACADEMY 업종 컴포넌트 활성화

1. **온보딩 승인**
   - `ACADEMY` 업종으로 온보딩 승인
   - `ProcessOnboardingApproval` 프로시저 실행

2. **컴포넌트 활성화 확인**
   ```sql
   -- 활성화된 컴포넌트 확인
   SELECT 
       cc.component_name,
       cc.component_type,
       tc.status,
       tc.activated_at
   FROM tenant_components tc
   JOIN component_catalog cc ON tc.component_id = cc.component_id
   WHERE tc.tenant_id = 'test-academy-001'
     AND tc.status = 'ACTIVE';
   ```

3. **예상 결과**
   - 학원 관련 기본 컴포넌트가 활성화됨
   - 예: 수강 관리, 출석 관리, 성적 관리 등

---

## 🐛 발견된 이슈 및 해결 방안

### 이슈 1: default_components_json 미설정
**상태**: 확인 필요  
**해결 방안**: 
- `business_category_items` 테이블에 업종별 기본 컴포넌트 JSON 설정
- 또는 마이그레이션 파일로 기본값 추가

### 이슈 2: (추가 이슈 발견 시 기록)

---

## 📝 다음 단계

1. [ ] `business_category_items` 테이블에 기본 컴포넌트 설정 확인
2. [ ] 실제 온보딩 승인 후 컴포넌트 활성화 확인
3. [ ] 컴포넌트 상태 표시 (관리자 페이지에서 확인 가능한지)

---

## 📊 MVP 최소 요구사항

**1월 심사/발표용**:
- [ ] 온보딩 승인 시 최소 1개 이상의 컴포넌트가 활성화되는지 확인
- [ ] `tenant_components` 테이블에 활성화 기록이 남는지 확인
- [ ] 컴포넌트 활성화 상태를 조회할 수 있는 API 또는 쿼리 존재

**참고**: 
- MVP에서는 컴포넌트가 활성화되는 것만 확인하면 됨
- 실제 컴포넌트 기능은 심사 후 단계적으로 구현
- **컴포넌트 모듈화 시스템의 개념과 확장 가능성**을 보여주는 것이 중요

---

**마지막 업데이트**: 2025-11-23

