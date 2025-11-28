# 카테고리 매핑 구현 완료

**작성일**: 2025-11-24  
**목적**: 테넌트 생성 시 카테고리 정보를 자동으로 저장하여 나중에 분류하기 쉽도록 구현

---

## 구현 내용

### 1. SetupTenantCategoryMapping 프로시저 수정

**변경 사항:**
- 기존: MVP로 스킵 (카테고리 매핑 미구현)
- 수정: `business_type`으로 카테고리 아이템을 찾아서 `tenant_category_mappings` 테이블에 저장

**로직:**
1. `business_category_items` 테이블에서 `business_type`이 일치하는 활성화된 카테고리 아이템 조회
2. 카테고리 아이템이 있으면 `tenant_category_mappings` 테이블에 매핑 생성
3. `is_primary = TRUE`로 설정하여 첫 번째 매핑을 기본 카테고리로 지정
4. 이미 매핑이 존재하면 업데이트만 수행

**프로시저 시그니처:**
```sql
CREATE PROCEDURE SetupTenantCategoryMapping(
    IN p_tenant_id VARCHAR(64),
    IN p_business_type VARCHAR(50),
    IN p_approved_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
```

---

## 테이블 구조

### tenant_category_mappings 테이블

```sql
CREATE TABLE tenant_category_mappings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    category_item_id VARCHAR(36) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ...
    UNIQUE KEY uk_tenant_category (tenant_id, category_item_id)
)
```

### business_category_items 테이블

```sql
CREATE TABLE business_category_items (
    item_id VARCHAR(36) UNIQUE NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    name_ko VARCHAR(255) NOT NULL,
    business_type VARCHAR(50) NOT NULL,  -- tenants.business_type과 매핑
    ...
)
```

---

## 동작 흐름

1. **온보딩 요청 생성**
   - 사용자가 `businessType` 선택 (예: `CONSULTATION`)

2. **온보딩 승인**
   - `ProcessOnboardingApproval` 프로시저 실행
   - `CreateOrActivateTenant` 호출 (테넌트 생성)
   - `SetupTenantCategoryMapping` 호출 (카테고리 매핑)

3. **카테고리 매핑 생성**
   - `business_type = 'CONSULTATION'`으로 `business_category_items` 조회
   - 찾은 카테고리 아이템의 `item_id`를 `tenant_category_mappings`에 저장
   - `is_primary = TRUE`로 설정

---

## 예시

### 입력
- `p_tenant_id`: `test-tenant-123`
- `p_business_type`: `CONSULTATION`
- `p_approved_by`: `superadmin@mindgarden.com`

### 처리
1. `business_category_items`에서 `business_type = 'CONSULTATION'` 조회
   - 결과: `item_id = 'a10b84ee-c382-11f0-b5cc-00163ee63ca3'`, `name_ko = '상담소'`

2. `tenant_category_mappings`에 삽입
   ```sql
   INSERT INTO tenant_category_mappings (
       tenant_id,
       category_item_id,
       is_primary,
       ...
   ) VALUES (
       'test-tenant-123',
       'a10b84ee-c382-11f0-b5cc-00163ee63ca3',
       TRUE,
       ...
   )
   ```

### 결과
- 테넌트가 카테고리와 매핑되어 저장됨
- 나중에 카테고리별로 테넌트를 조회/분류 가능

---

## 활용 방법

### 카테고리별 테넌트 조회

```sql
SELECT 
    t.tenant_id,
    t.name,
    bci.name_ko AS category_name,
    bci.business_type
FROM tenants t
INNER JOIN tenant_category_mappings tcm ON t.tenant_id = tcm.tenant_id
INNER JOIN business_category_items bci ON tcm.category_item_id = bci.item_id
WHERE tcm.is_primary = TRUE
    AND t.is_deleted = FALSE
    AND bci.business_type = 'CONSULTATION';
```

### 카테고리 통계

```sql
SELECT 
    bci.name_ko AS category_name,
    bci.business_type,
    COUNT(DISTINCT tcm.tenant_id) AS tenant_count
FROM business_category_items bci
LEFT JOIN tenant_category_mappings tcm ON bci.item_id = tcm.category_item_id
    AND tcm.is_primary = TRUE
    AND tcm.is_deleted = FALSE
LEFT JOIN tenants t ON tcm.tenant_id = t.tenant_id
    AND t.is_deleted = FALSE
GROUP BY bci.item_id, bci.name_ko, bci.business_type
ORDER BY tenant_count DESC;
```

---

## 다음 단계

1. ✅ 카테고리 매핑 프로시저 구현 완료
2. ⏳ 프론트엔드에서 카테고리별 테넌트 조회 기능 추가
3. ⏳ Ops Portal에서 카테고리별 필터링 기능 추가
4. ⏳ 카테고리별 통계 대시보드 추가

---

## 참고

- 카테고리 매핑은 선택적 기능 (카테고리 아이템이 없어도 테넌트 생성은 계속 진행)
- 하나의 테넌트는 여러 카테고리에 매핑 가능 (현재는 첫 번째만 `is_primary = TRUE`)
- 향후 다중 카테고리 지원 시 `is_primary` 플래그 활용

