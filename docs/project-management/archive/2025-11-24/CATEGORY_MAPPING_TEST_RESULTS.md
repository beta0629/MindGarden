# 카테고리 매핑 테스트 결과

**작성일**: 2025-11-24  
**테스트 목적**: 테넌트 생성 시 카테고리 정보 자동 저장 확인

---

## 테스트 결과

### ✅ 성공 항목

1. **프로시저 수정 및 배포**
   - `SetupTenantCategoryMapping` 프로시저 SELECT INTO 구문 수정
   - COUNT(*)와 item_id를 분리하여 조회하도록 개선
   - 프로시저 정상 작동 확인

2. **카테고리 매핑 생성**
   - 테넌트 ID: `test-tenant-category-1763957079`
   - 카테고리: `상담소` (CONSULTATION)
   - 카테고리 아이템 ID: `a10b84ee-c382-11f0-b5cc-00163ee63ca3`
   - 기본 카테고리: `TRUE`

3. **데이터베이스 확인**
   ```sql
   SELECT 
       tcm.tenant_id,
       t.name AS tenant_name,
       bci.name_ko AS category_name,
       bci.business_type,
       tcm.is_primary
   FROM tenant_category_mappings tcm
   INNER JOIN tenants t ON tcm.tenant_id = t.tenant_id
   INNER JOIN business_category_items bci ON tcm.category_item_id = bci.item_id
   WHERE tcm.tenant_id = 'test-tenant-category-1763957079';
   ```
   
   **결과:**
   - ✅ 테넌트: `카테고리 테스트 테넌트 1763957079`
   - ✅ 카테고리: `상담소`
   - ✅ 업종: `CONSULTATION`
   - ✅ 기본 카테고리: `TRUE`

---

## 프로시저 수정 내용

### 문제점
- 기존: `SELECT item_id, COUNT(*) INTO ...` 구문에서 NULL 반환
- 원인: COUNT(*)와 item_id를 동시에 가져오는 것이 문제

### 해결 방법
```sql
-- 수정 전
SELECT item_id, COUNT(*) INTO v_category_item_id, v_category_item_count
FROM business_category_items
WHERE business_type = p_business_type
LIMIT 1;

-- 수정 후
SELECT COUNT(*) INTO v_category_item_count
FROM business_category_items
WHERE business_type = p_business_type
    AND (is_active IS NULL OR is_active = TRUE)
    AND (is_deleted IS NULL OR is_deleted = FALSE);

IF v_category_item_count > 0 THEN
    SELECT item_id INTO v_category_item_id
    FROM business_category_items
    WHERE business_type = p_business_type
        AND (is_active IS NULL OR is_active = TRUE)
        AND (is_deleted IS NULL OR is_deleted = FALSE)
    ORDER BY display_order ASC, created_at ASC
    LIMIT 1;
END IF;
```

---

## 동작 확인

### 프로시저 직접 호출 테스트
```sql
SET @tenant_id = 'test-tenant-category-1763957079';
SET @business_type = 'CONSULTATION';
SET @approved_by = 'test';

CALL SetupTenantCategoryMapping(@tenant_id, @business_type, @approved_by, @success, @message);

SELECT @success AS success, @message AS message;
```

**결과:**
- `success`: `1` (TRUE)
- `message`: `카테고리 매핑 설정 완료: business_type=CONSULTATION, category_item_id=a10b84ee-c382-11f0-b5cc-00163ee63ca3`

---

## 다음 단계

1. ✅ 프로시저 수정 및 배포 완료
2. ✅ 카테고리 매핑 생성 확인 완료
3. ⏳ 전체 온보딩 프로세스 통합 테스트
4. ⏳ 카테고리별 테넌트 조회 기능 추가
5. ⏳ Ops Portal에서 카테고리별 필터링 기능 추가

---

## 참고

- 카테고리 매핑은 `ProcessOnboardingApproval` 프로시저의 2단계에서 자동 실행
- `business_type`으로 `business_category_items` 테이블에서 카테고리 아이템 조회
- 첫 번째 매핑은 `is_primary = TRUE`로 설정
- 카테고리 아이템이 없어도 테넌트 생성은 계속 진행 (경고만)

