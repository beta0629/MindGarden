# 동적 업종 카테고리 시스템

## 1. 개요

### 1.1 목적
- **온보딩에서 추가된 카테고리를 동적으로 사용**
- 하드코딩된 `BusinessType` enum 제거
- `business_categories` 테이블에서 동적으로 카테고리 조회
- 확장 가능한 업종 관리 시스템

### 1.2 변경 사항

**이전 (하드코딩):**
```java
public enum BusinessType {
    CONSULTATION("상담"),
    ACADEMY("학원"),
    FOOD_SERVICE("요식업"),
    RETAIL("소매"),
    SERVICE("서비스");
}
```

**현재 (동적 조회):**
```java
@Column(name = "business_type", nullable = false, length = 50)
private String businessType; // business_category_items.business_type과 매핑
```

## 2. 아키텍처

### 2.1 데이터베이스 구조

```
business_categories (대분류)
  └── business_category_items (소분류)
       └── business_type (tenants.business_type과 매핑)
```

### 2.2 서비스 레이어

```
BusinessCategoryService
  ├── BusinessCategoryRepository
  └── BusinessCategoryItemRepository
```

## 3. API 엔드포인트

### 3.1 카테고리 조회

**모든 카테고리 조회:**
```
GET /api/business-categories
GET /api/business-categories?level=1
GET /api/business-categories?parentCategoryId={parentCategoryId}
```

**루트 카테고리 조회:**
```
GET /api/business-categories/root
```

**카테고리 상세 조회:**
```
GET /api/business-categories/{categoryId}
```

### 3.2 카테고리 아이템 조회

**모든 아이템 조회:**
```
GET /api/business-categories/items
GET /api/business-categories/items?categoryId={categoryId}
```

**business_type으로 조회:**
```
GET /api/business-categories/items/by-business-type/{businessType}
```

**business_type 유효성 검증:**
```
GET /api/business-categories/validate/{businessType}
```

### 3.3 카테고리 트리 구조

**계층 구조 조회:**
```
GET /api/business-categories/tree
```

## 4. 사용 방법

### 4.1 백엔드에서 사용

```java
@Autowired
private BusinessCategoryService businessCategoryService;

// business_type 유효성 검증
boolean isValid = businessCategoryService.isValidBusinessType("ACADEMY");

// business_type으로 카테고리 정보 조회
Optional<BusinessCategoryItem> item = businessCategoryService.getCategoryItemByBusinessType("ACADEMY");
if (item.isPresent()) {
    BusinessCategoryItem categoryItem = item.get();
    String nameKo = categoryItem.getNameKo();
    String categoryId = categoryItem.getCategoryId();
}
```

### 4.2 프론트엔드에서 사용

```javascript
// 모든 카테고리 조회
const response = await fetch('/api/business-categories');
const { data: categories } = await response.json();

// business_type으로 조회
const response = await fetch('/api/business-categories/items/by-business-type/ACADEMY');
const { data: item } = await response.json();

// business_type 유효성 검증
const response = await fetch('/api/business-categories/validate/ACADEMY');
const { valid } = await response.json();
```

## 5. 마이그레이션 가이드

### 5.1 하드코딩된 부분 찾기

다음 패턴을 찾아서 동적 조회로 변경:

```java
// ❌ 하드코딩
if (tenant.getBusinessType() == Tenant.BusinessType.ACADEMY) {
    // ...
}

// ✅ 동적 조회
if ("ACADEMY".equals(tenant.getBusinessType())) {
    // ...
}

// 또는
Optional<BusinessCategoryItem> item = businessCategoryService.getCategoryItemByBusinessType(tenant.getBusinessType());
if (item.isPresent() && "ACADEMY".equals(item.get().getBusinessType())) {
    // ...
}
```

### 5.2 주요 변경 파일

1. **Tenant.java**
   - `BusinessType` enum 제거
   - `businessType` 필드를 `String`으로 변경

2. **하드코딩된 BusinessType 사용 부분**
   - `ErdGenerationServiceImpl.java`
   - `ErdValidationServiceImpl.java`
   - 기타 `BusinessType` enum을 사용하는 모든 파일

## 6. 캐싱

### 6.1 캐시 전략

- `@Cacheable` 어노테이션 사용
- 카테고리 정보는 자주 변경되지 않으므로 캐싱 적합
- 카테고리 추가/수정 시 캐시 무효화 필요

### 6.2 캐시 키

- `businessCategories:allActive`
- `businessCategories:{categoryId}`
- `businessCategories:code:{categoryCode}`
- `businessCategoryItems:businessType:{businessType}`

## 7. 확장성

### 7.1 새로운 업종 추가

1. `business_categories` 테이블에 대분류 추가
2. `business_category_items` 테이블에 소분류 추가
3. `business_type` 값 설정
4. 자동으로 API에서 조회 가능

### 7.2 계층 구조 지원

- 다단계 계층 구조 지원 (대분류 → 중분류 → 소분류)
- `parent_category_id`로 계층 관계 관리
- `level` 필드로 계층 레벨 관리

## 8. 보안 고려사항

### 8.1 입력 검증

- `business_type` 입력 시 유효성 검증 필수
- `BusinessCategoryService.isValidBusinessType()` 사용

### 8.2 권한 관리

- 카테고리 조회는 공개 API (인증 불필요)
- 카테고리 수정은 관리자 권한 필요 (향후 구현)

## 9. 성능 최적화

### 9.1 캐싱

- 카테고리 정보는 캐싱하여 성능 향상
- 변경 시에만 캐시 무효화

### 9.2 인덱스

- `business_type` 컬럼에 인덱스 설정
- `category_id`, `category_code`에 인덱스 설정

## 10. 테스트

### 10.1 단위 테스트

- `BusinessCategoryService` 테스트
- `BusinessCategoryController` 테스트

### 10.2 통합 테스트

- API 엔드포인트 테스트
- business_type 유효성 검증 테스트

