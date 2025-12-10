# 지역코드 매핑 및 브랜드명 저장 확인

**작성일**: 2025-12-10  
**목적**: 테넌트 ID 생성 시 지역코드 매핑과 브랜드명 저장이 올바르게 되는지 확인

---

## 📋 현재 데이터베이스 상태

### 온보딩 요청 정보
- **tenant_name**: "탁구와 마음 상담센터"
- **region**: "INCHEON" (대문자)
- **brand_name**: "탁구와 마음이 심리상담 센터" ✅ (정상 저장됨)
- **checklist_json.regionCode**: "INCHEON"
- **checklist_json.brandName**: "탁구와 마음이 심리상담 센터"

---

## 🔍 지역코드 매핑 로직 확인

### `normalizeRegionCode` 메서드 동작

**입력**: "INCHEON" (대문자)
1. `region.trim().toLowerCase()` → "incheon"
2. `normalized.equals("incheon")` → `true`
3. **반환**: "incheon" ✅

**입력**: "인천"
1. `region.trim().toLowerCase()` → "인천"
2. `normalized.equals("인천")` → `true`
3. **반환**: "incheon" ✅

**입력**: null 또는 빈 문자열
1. `if (region == null || region.isBlank())` → `true`
2. **반환**: `null` (호출자가 "unknown" 처리)

---

## ✅ 수정 사항

### 1. `generateTenantId` 메서드 개선
- **문제**: `normalizeRegionCode`가 `null`을 반환할 수 있는데 처리하지 않음
- **수정**: `null` 또는 빈 문자열인 경우 "unknown"으로 처리
- **위치**: `backend-ops/src/main/java/com/mindgarden/ops/service/onboarding/OnboardingService.java:162-172`

```java
private String generateTenantId(String region, String businessType) {
    // 지역 코드 정규화
    String regionCode = normalizeRegionCode(region);
    
    // normalizeRegionCode가 null을 반환할 수 있으므로 "unknown"으로 처리
    if (regionCode == null || regionCode.isBlank()) {
        regionCode = "unknown";
        log.warn("[OnboardingService] generateTenantId: regionCode가 null이어서 'unknown' 사용 - region={}", region);
    }
    
    // ... 나머지 로직
}
```

### 2. `decide` 메서드 확인
- **상태**: 이미 올바르게 처리됨 ✅
- **로직**: 
  1. `checklistJson`에서 `regionCode` 추출 시도
  2. 없으면 `request.getRegion()` 사용
  3. 그래도 없으면 "unknown" 사용

---

## 🧪 예상 테스트 결과

### 테넌트 ID 생성 예상
- **입력**: `region="INCHEON"`, `businessType="CONSULTATION"`
- **정규화된 지역코드**: "incheon"
- **정규화된 업종코드**: "consultation"
- **예상 테넌트 ID**: `tenant-incheon-consultation-008` (또는 다음 순번)

### 브랜드명 저장 예상
- **입력**: `brandName="탁구와 마음이 심리상담 센터"`
- **저장 위치**: 
  1. `onboarding_request.brand_name` ✅ (이미 저장됨)
  2. `tenants.branding_json` (승인 시 저장됨)

---

## 📝 확인 SQL 쿼리

### 승인 전 확인
```sql
SELECT 
    id,
    tenant_name,
    region,
    brand_name,
    requested_by,
    status,
    JSON_EXTRACT(checklist_json, '$.regionCode') as checklist_regionCode,
    JSON_EXTRACT(checklist_json, '$.brandName') as checklist_brandName
FROM onboarding_request
WHERE is_deleted = FALSE
  AND requested_by = 'beta0629@gmail.com'
  AND status = 'PENDING'
ORDER BY created_at DESC
LIMIT 1;
```

### 승인 후 확인
```sql
-- 테넌트 ID 확인
SELECT 
    tenant_id,
    name,
    business_type,
    branding_json,
    created_at
FROM tenants
WHERE name = '탁구와 마음 상담센터'
  AND (is_deleted IS NULL OR is_deleted = FALSE)
ORDER BY created_at DESC
LIMIT 1;

-- 온보딩 요청 상태 확인
SELECT 
    id,
    tenant_id,
    tenant_name,
    region,
    brand_name,
    status,
    decided_by,
    decision_at
FROM onboarding_request
WHERE requested_by = 'beta0629@gmail.com'
  AND created_at >= '2025-12-10 08:55:00'
ORDER BY created_at DESC
LIMIT 1;
```

---

## ✅ 체크리스트

### 지역코드 매핑
- [x] `normalizeRegionCode("INCHEON")` → "incheon" 반환 확인
- [x] `normalizeRegionCode("인천")` → "incheon" 반환 확인
- [x] `normalizeRegionCode(null)` → `null` 반환 후 "unknown" 처리 확인
- [x] `generateTenantId`에서 `null` 처리 추가

### 브랜드명 저장
- [x] `onboarding_request.brand_name` 필드에 저장 확인
- [ ] 승인 시 `tenants.branding_json`에 저장 확인 (승인 후 테스트 필요)

### 테넌트 ID 생성
- [ ] 승인 시 `tenant-incheon-consultation-{순번}` 형식으로 생성 확인 (승인 후 테스트 필요)

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-10

