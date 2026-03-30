# 온보딩 데이터 저장 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-09  
**상태**: 공식 표준

---

## 📌 개요

온보딩 요청 시 입력된 데이터를 데이터베이스에 저장하는 표준입니다.  
**중요**: 나중에 수정 요청이 올 수 있으므로, 모든 필드는 별도 컬럼으로 저장해야 합니다.

### 참조 문서
- [테넌트 ID 생성 표준](./TENANT_ID_GENERATION_STANDARD.md)
- [Ops Portal 표준](./OPS_PORTAL_STANDARD.md)
- [데이터베이스 스키마 표준](./DATABASE_SCHEMA_STANDARD.md)

---

## 🎯 핵심 원칙

### ⭐ 필수 원칙: 별도 필드로 저장

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  모든 데이터는 별도 필드로 저장해야 합니다
  checklistJson에만 저장하면 나중에 수정이 어렵습니다
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**이유**:
1. ✅ 나중에 수정 요청 시 별도 필드에서 직접 수정 가능
2. ✅ 쿼리 성능 향상 (JSON 파싱 불필요)
3. ✅ 데이터 무결성 보장
4. ✅ 인덱싱 가능

---

## 📋 필수 저장 필드

### 1. 온보딩 요청 테이블 (`onboarding_request`)

#### 필수 필드
| 필드명 | 타입 | 설명 | 비고 |
|--------|------|------|------|
| `tenant_name` | VARCHAR(120) | 회사명/테넌트명 | 필수 |
| `brand_name` | VARCHAR(255) | 브랜드명 | **별도 필드로 저장** ⭐ |
| `region` | VARCHAR(50) | 지역 정보 | **별도 필드로 저장** ⭐ |
| `requested_by` | VARCHAR(64) | 신청자 이메일 | 필수 |
| `business_type` | VARCHAR(50) | 업종 타입 | 필수 |
| `checklist_json` | TEXT | 체크리스트 JSON | 보조 데이터 |

#### 브랜드명 (`brand_name`)
- **용도**: 헤더, 햄버거 메뉴, 메인 페이지에 표시
- **저장 위치**: `onboarding_request.brand_name` + `tenants.branding_json`
- **추출 방법**: `checklistJson`에서 `brandName` 추출
- **기본값**: `brandName`이 없으면 `tenantName` 사용
- **수정 가능**: 나중에 변경 요청 시 필드 직접 수정

#### 지역 정보 (`region`)
- **용도**: 테넌트 ID 생성 시 사용 (`tenant-{지역코드}-{업종코드}-{순번}`)
- **저장 위치**: `onboarding_request.region`
- **추출 방법**: `checklistJson`에서 `regionCode` 추출
- **정규화**: 한글 지역명 → 영문 코드 변환 (예: "인천" → "incheon")
- **기본값**: 없으면 "unknown" 사용

#### 관리자 비밀번호 (`adminPassword`)
- **용도**: 온보딩 승인 시 관리자 계정 생성에 사용
- **저장 위치**: `checklistJson`에만 저장 (보안상 별도 필드 저장 금지)
- **추출 방법**: `checklistJson`에서 `adminPassword` 필드를 JSON 파싱으로 추출
- **암호화**: 추출 후 BCrypt(강도 12)로 해시하여 `users.password`에 저장
- **표준화**: `backend-ops`와 `CoreSolution` 모두 BCrypt 강도 12 사용 필수
- **주의사항**: 문자열 파싱 대신 `objectMapper.readTree()` 사용 필수

---

## 🔄 데이터 흐름

### 1. 온보딩 요청 생성 시

```
프론트엔드 (Trinity)
    ↓
checklistJson 전송
{
  "regionCode": "INCHEON",
  "brandName": "탁구와마음 전문 상담소",
  "contactPhone": "01086322121",
  ...
}
    ↓
백엔드 (Ops)
    ↓
OnboardingService.create()
    ↓
1. checklistJson 파싱
2. regionCode → region 필드에 저장
3. brandName → brand_name 필드에 저장
    ↓
onboarding_request 테이블 저장
```

### 2. 온보딩 승인 시

```
Ops Portal에서 승인
    ↓
OnboardingService.decide()
    ↓
1. region 필드에서 지역 코드 사용
2. brand_name 필드에서 브랜드명 사용
3. checklistJson에서 adminPassword 추출 (JSON 파싱)
4. adminPassword를 BCrypt(강도 12)로 해시
5. 테넌트 ID 생성: tenant-{region}-{businessType}-{순번}
6. tenants.branding_json에 브랜드명 저장
7. 관리자 계정 생성 (users 테이블)
    ↓
테넌트 생성 완료
```

---

## 📝 구현 가이드

### 1. 온보딩 요청 생성 (`OnboardingService.create()`)

```java
@Transactional
public OnboardingRequest create(OnboardingCreateRequest request) {
    OnboardingRequest entity = new OnboardingRequest();
    
    // 1. checklistJson에서 regionCode 추출
    String region = request.region();
    if ((region == null || region.isBlank()) 
        && request.checklistJson() != null 
        && !request.checklistJson().isEmpty()) {
        JsonNode jsonNode = objectMapper.readTree(request.checklistJson());
        if (jsonNode.has("regionCode") && jsonNode.get("regionCode").isTextual()) {
            region = jsonNode.get("regionCode").asText();
        }
    }
    
    // 2. checklistJson에서 brandName 추출
    String brandName = null;
    if (request.checklistJson() != null && !request.checklistJson().isEmpty()) {
        JsonNode jsonNode = objectMapper.readTree(request.checklistJson());
        if (jsonNode.has("brandName") && jsonNode.get("brandName").isTextual()) {
            brandName = jsonNode.get("brandName").asText();
        }
    }
    
    // 3. brandName이 없으면 tenantName 사용
    if (brandName == null || brandName.isBlank()) {
        brandName = request.tenantName();
    }
    
    // 4. 필드에 저장
    entity.setTenantName(request.tenantName());
    entity.setBrandName(brandName);  // ⭐ 별도 필드로 저장
    entity.setRegion(region);        // ⭐ 별도 필드로 저장
    entity.setChecklistJson(request.checklistJson());
    
    return repository.save(entity);
}
```

### 2. 온보딩 승인 시 관리자 비밀번호 추출

```java
/**
 * 체크리스트 JSON에서 관리자 비밀번호 추출
 * ⚠️ 중요: JSON 파싱을 사용하여 안전하게 추출 (문자열 파싱 금지)
 */
private String extractAdminPasswordFromChecklist(String checklistJson) {
    if (checklistJson == null || checklistJson.isEmpty()) {
        log.warn("⚠️ 체크리스트 JSON이 null이거나 비어있음, 기본 비밀번호 사용");
        return "TempPassword123!"; // 기본 비밀번호
    }
    try {
        // JSON 파싱을 사용하여 안전하게 추출
        JsonNode jsonNode = objectMapper.readTree(checklistJson);
        if (jsonNode.has("adminPassword") && jsonNode.get("adminPassword").isTextual()) {
            String extractedPassword = jsonNode.get("adminPassword").asText();
            if (extractedPassword != null && !extractedPassword.isEmpty()) {
                log.info("✅ 체크리스트에서 adminPassword 추출 성공 (JSON 파싱): length={}", 
                    extractedPassword.length());
                return extractedPassword;
            }
        }
        log.warn("⚠️ 체크리스트 JSON에서 adminPassword 필드를 찾을 수 없거나 비어있음");
    } catch (Exception e) {
        log.warn("⚠️ 체크리스트 JSON에서 adminPassword 추출 실패: {}", e.getMessage());
    }
    return "TempPassword123!"; // 추출 실패 시 기본 비밀번호
}
```

### 3. 온보딩 승인 시 브랜딩 정보 설정

```java
private void setTenantBranding(String tenantId, OnboardingRequest request) {
    // brand_name 필드에서 가져오기 (이미 저장되어 있음)
    String brandName = request.getBrandName();
    if (brandName == null || brandName.trim().isEmpty()) {
        brandName = request.getTenantName();
    }
    
    // tenants.branding_json에 저장
    String brandingJson = String.format(
        "{\"companyName\":\"%s\",\"companyNameEn\":\"%s\"}",
        brandName.replace("\"", "\\\""),
        brandName.replace("\"", "\\\"")
    );
    
    jdbcTemplate.update(
        "UPDATE tenants SET branding_json = ?, updated_at = NOW() WHERE tenant_id = ?",
        brandingJson, tenantId
    );
}
```

---

## 🗄️ 데이터베이스 스키마

### `onboarding_request` 테이블

```sql
CREATE TABLE onboarding_request (
    id BINARY(16) PRIMARY KEY,
    tenant_id VARCHAR(64),
    tenant_name VARCHAR(120) NOT NULL,
    brand_name VARCHAR(255) NULL,        -- ⭐ 브랜드명 (별도 필드)
    region VARCHAR(50) NULL,             -- ⭐ 지역 정보 (별도 필드)
    requested_by VARCHAR(64) NOT NULL,
    business_type VARCHAR(50),
    status ENUM('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ON_HOLD') NOT NULL,
    checklist_json TEXT,                 -- 보조 데이터
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    -- ... 기타 필드
);
```

### 마이그레이션 예시

```sql
-- V4: brand_name 필드 추가
ALTER TABLE onboarding_request
ADD COLUMN brand_name VARCHAR(255) NULL AFTER tenant_name;

-- 기존 데이터의 checklistJson에서 brandName 추출하여 brand_name 필드에 저장
UPDATE onboarding_request
SET brand_name = JSON_UNQUOTE(JSON_EXTRACT(checklist_json, '$.brandName'))
WHERE checklist_json IS NOT NULL
  AND JSON_EXTRACT(checklist_json, '$.brandName') IS NOT NULL
  AND brand_name IS NULL;

-- brand_name이 없으면 tenant_name 사용
UPDATE onboarding_request
SET brand_name = tenant_name
WHERE brand_name IS NULL OR brand_name = '';
```

---

## ✅ 체크리스트

### 온보딩 요청 생성 시
- [ ] `checklistJson`에서 `regionCode` 추출하여 `region` 필드에 저장
- [ ] `checklistJson`에서 `brandName` 추출하여 `brand_name` 필드에 저장
- [ ] `brandName`이 없으면 `tenantName` 사용
- [ ] `region`이 없으면 "unknown" 사용
- [ ] 로그에 추출 과정 기록

### 온보딩 승인 시
- [ ] `region` 필드에서 지역 코드 사용 (테넌트 ID 생성)
- [ ] `brand_name` 필드에서 브랜드명 사용
- [ ] `checklistJson`에서 `adminPassword` 추출 (JSON 파싱 필수)
- [ ] `adminPassword`를 BCrypt(강도 12)로 해시
- [ ] 관리자 계정 생성 시 해시된 비밀번호 저장
- [ ] `tenants.branding_json`에 브랜드명 저장
- [ ] 헤더/메뉴/메인 페이지에 표시 확인

### 브랜드명 수정 요청 시
- [ ] `onboarding_request.brand_name` 필드 직접 수정
- [ ] `tenants.branding_json`도 함께 업데이트
- [ ] 변경 이력 기록 (audit log)

---

## 🚫 금지 사항

### ❌ checklistJson에만 저장 금지

```java
// ❌ 금지: checklistJson에만 저장
entity.setChecklistJson(request.checklistJson());
// 나중에 수정하려면 JSON 파싱해야 함

// ✅ 필수: 별도 필드로 저장
entity.setBrandName(brandName);
entity.setRegion(region);
entity.setChecklistJson(request.checklistJson()); // 보조 데이터
```

### ❌ 하드코딩 금지

```java
// ❌ 금지
String brandName = "기본 브랜드명";

// ✅ 필수: checklistJson에서 추출 또는 tenantName 사용
String brandName = extractBrandNameFromChecklist(request.checklistJson());
if (brandName == null) {
    brandName = request.tenantName();
}
```

### ❌ 문자열 파싱 금지 (adminPassword 추출)

```java
// ❌ 금지: 문자열 파싱은 JSON 구조 변경 시 실패 가능
int startIndex = checklistJson.indexOf("\"adminPassword\": \"");
String password = checklistJson.substring(startIndex, endIndex);

// ✅ 필수: JSON 파싱 사용
JsonNode jsonNode = objectMapper.readTree(checklistJson);
String password = jsonNode.get("adminPassword").asText();
```

---

## 📚 참고 사항

### 브랜드명 사용 위치
1. **헤더**: `UnifiedHeader` 컴포넌트에서 `branding_json.companyName` 표시
2. **햄버거 메뉴**: 메뉴 상단에 브랜드명 표시
3. **메인 페이지**: 대시보드 상단에 브랜드명 표시
4. **브랜딩 정보**: `tenants.branding_json`에서 조회

### 지역 코드 정규화
- 한글 지역명 → 영문 코드 (예: "인천" → "incheon")
- 영문 코드 그대로 사용 (예: "INCHEON" → "incheon")
- 없으면 "unknown" 사용

### 테넌트 ID 생성
- 형식: `tenant-{지역코드}-{업종코드}-{순번}`
- 예시: `tenant-incheon-consultation-001`
- `region` 필드에서 지역 코드 사용

---

## 🔗 관련 문서

- [테넌트 ID 생성 표준](./TENANT_ID_GENERATION_STANDARD.md)
- [Ops Portal 표준](./OPS_PORTAL_STANDARD.md)
- [데이터베이스 스키마 표준](./DATABASE_SCHEMA_STANDARD.md)
- [시스템 명칭 통일 표준](./SYSTEM_NAMING_STANDARD.md)

