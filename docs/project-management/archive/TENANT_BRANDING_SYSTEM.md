# 입점사 브랜딩 시스템 계획

## 1. 개요

### 1.1 목적
- 입점사(테넌트)가 자신의 브랜드로 시스템을 운영할 수 있도록 지원
- 로고 및 상호를 모든 화면에 노출
- 브랜드 일관성 유지

### 1.2 핵심 기능
- ✅ 로고 업로드 및 관리
- ✅ 상호(회사명) 표시
- ✅ 브랜딩 정보 저장 및 관리
- ✅ 모든 화면에서 자동 노출

## 2. 데이터 구조

### 2.1 Tenant 엔티티 확장

**현재 구조:**
```java
@Column(name = "branding_json", columnDefinition = "JSON")
private String brandingJson;
```

**branding_json 구조:**
```json
{
  "logo": {
    "url": "https://cdn.example.com/tenants/{tenant_id}/logo.png",
    "width": 200,
    "height": 60,
    "format": "png"
  },
  "companyName": "○○ 학원",
  "companyNameEn": "OO Academy",
  "primaryColor": "#FF6B6B",
  "secondaryColor": "#4ECDC4",
  "favicon": "https://cdn.example.com/tenants/{tenant_id}/favicon.ico"
}
```

### 2.2 데이터베이스 스키마

**기존 필드 활용:**
- `tenants.name` - 상호(회사명)
- `tenants.branding_json` - 브랜딩 정보 (로고, 색상 등)

**추가 필요 사항:**
- 로고 파일 저장소 (S3 또는 로컬 스토리지)
- 파일 업로드 API
- 이미지 리사이징 및 최적화

## 3. 기능 구현

### 3.1 로고 업로드

**API 엔드포인트:**
```
POST /api/core/tenants/{tenant_id}/branding/logo
Content-Type: multipart/form-data

파일: logo.png
```

**기능:**
- 이미지 파일 업로드
- 자동 리사이징 (다양한 크기)
- 최적화 (압축)
- CDN 또는 스토리지에 저장
- `branding_json` 업데이트

### 3.2 상호 관리

**API 엔드포인트:**
```
PUT /api/core/tenants/{tenant_id}/branding/company-name
{
  "companyName": "○○ 학원",
  "companyNameEn": "OO Academy"
}
```

**기능:**
- 상호(회사명) 수정
- 한글/영문 지원
- `tenants.name` 필드 업데이트

### 3.3 브랜딩 정보 조회

**API 엔드포인트:**
```
GET /api/core/tenants/{tenant_id}/branding
```

**응답:**
```json
{
  "logo": {
    "url": "https://cdn.example.com/tenants/{tenant_id}/logo.png",
    "width": 200,
    "height": 60
  },
  "companyName": "○○ 학원",
  "companyNameEn": "OO Academy",
  "primaryColor": "#FF6B6B",
  "secondaryColor": "#4ECDC4"
}
```

## 4. 화면 노출 전략

### 4.1 핵심 노출 위치 (고객 니즈 부합)

**헤더 영역 (필수):**
- 로고 표시 (좌측 상단)
- 상호 표시 (로고 옆 또는 아래)
- 모든 페이지에서 일관되게 표시

**대시보드 (필수):**
- 대시보드 상단에 로고 및 상호 표시
- 브랜드 일관성 유지

**푸터 영역:**
- 상호 및 연락처 정보

**인쇄물/리포트:**
- 로고 및 상호 자동 포함
- PDF 리포트 헤더/푸터

### 4.2 기본값 처리 (Fallback)

**고객 로고/상호가 없을 경우:**
- ✅ **코어시스템(플랫폼) 로고로 대체**
- ✅ **코어시스템 상호로 대체** (예: "CoreSolution" 또는 "MindGarden")
- ✅ 사용자에게 플랫폼 브랜드 인지

**Fallback 우선순위:**
1. 고객 로고/상호 (있을 경우)
2. 코어시스템 로고/상호 (없을 경우)

**Fallback 로직:**
```javascript
// 프론트엔드 예시
const logoUrl = tenant.branding?.logo?.url || '/images/core-solution-logo.png';
const companyName = tenant.name || tenant.branding?.companyName || 'CoreSolution';
```

### 4.2 컴포넌트 구조

**공통 컴포넌트:**
```jsx
// TenantHeader.jsx
<TenantHeader>
  <TenantLogo 
    src={branding?.logo?.url || '/images/core-solution-logo.png'} 
    alt={branding?.companyName || tenant?.name || 'CoreSolution'}
  />
  <TenantName>
    {branding?.companyName || tenant?.name || 'CoreSolution'}
  </TenantName>
</TenantHeader>

// DashboardHeader.jsx (대시보드 전용)
<DashboardHeader>
  <TenantLogo 
    src={branding?.logo?.url || '/images/core-solution-logo.png'} 
    alt={branding?.companyName || tenant?.name || 'CoreSolution'}
  />
  <TenantName>
    {branding?.companyName || tenant?.name || 'CoreSolution'}
  </TenantName>
</DashboardHeader>

// TenantFooter.jsx
<TenantFooter>
  <TenantInfo>
    <CompanyName>
      {branding?.companyName || tenant?.name || 'CoreSolution'}
    </CompanyName>
    <ContactInfo>{tenant.contactPhone}</ContactInfo>
  </TenantInfo>
</TenantFooter>
```

**Fallback 상수 정의:**
```javascript
// constants/branding.js
export const DEFAULT_LOGO_URL = '/images/core-solution-logo.png';
export const DEFAULT_COMPANY_NAME = 'CoreSolution';
export const DEFAULT_COMPANY_NAME_KO = '코어솔루션';
```

## 5. 구현 계획

### Phase 1: 백엔드 API 구현 (3일)
- [ ] 로고 업로드 API
- [ ] 상호 관리 API
- [ ] 브랜딩 정보 조회 API
- [ ] 파일 스토리지 연동

### Phase 2: 프론트엔드 컴포넌트 (2일)
- [ ] 로고 업로드 UI
- [ ] 상호 입력 UI
- [ ] 브랜딩 미리보기
- [ ] 공통 헤더/푸터 컴포넌트

### Phase 3: 화면 적용 (2일)
- [ ] **헤더에 로고 및 상호 표시** (모든 페이지)
- [ ] **대시보드에 로고 및 상호 표시** (고객 니즈 부합)
- [ ] Fallback 로직 구현 (코어시스템 로고/상호로 대체)
- [ ] 리포트에 브랜딩 적용
- [ ] 이메일 템플릿에 브랜딩 적용

## 6. 사용성 고려사항

### 6.1 간편한 업로드
- 드래그 앤 드롭 지원
- 이미지 자동 리사이징 (사용자가 크기 조정 불필요)
- 미리보기 제공

### 6.2 기본값 제공 (Fallback)
- **로고가 없을 경우 코어시스템 로고 표시**
- **상호가 없을 경우 코어시스템 상호 표시**
- 사용자에게 플랫폼 브랜드 인지
- 회원가입 시 입력한 이름이 있으면 우선 사용

### 6.3 자동 적용
- 한 번 업로드하면 모든 화면에 자동 적용
- 추가 설정 불필요

## 7. 기술 스택

### 7.1 파일 스토리지
- AWS S3 또는 로컬 스토리지
- CDN 연동 (이미지 최적화)

### 7.2 이미지 처리
- 이미지 리사이징 라이브러리 (Thumbnailator, ImageMagick)
- 자동 최적화 (압축)

### 7.3 프론트엔드
- React 컴포넌트
- 드래그 앤 드롭 (react-dropzone)
- 이미지 미리보기

## 8. 보안 및 검증

### 8.1 파일 검증
- 이미지 파일만 허용 (png, jpg, jpeg, svg)
- 파일 크기 제한 (최대 5MB)
- 이미지 크기 제한 (최대 2000x2000px)

### 8.2 접근 제어
- 테넌트 관리자만 브랜딩 수정 가능
- 다른 테넌트의 브랜딩 정보 접근 불가

## 9. 성능 최적화

### 9.1 이미지 최적화
- 다양한 크기로 리사이징 (캐싱)
- WebP 형식 지원
- Lazy loading

### 9.2 캐싱
- 브랜딩 정보 캐싱
- CDN 캐싱

## 10. Fallback 전략 상세

### 10.1 코어시스템 브랜딩

**코어시스템 기본 정보:**
- 로고: `/images/core-solution-logo.png`
- 상호: "CoreSolution" (영문) / "코어솔루션" (한글)
- 대체 상호: "MindGarden" (레거시 호환)

**Fallback 로직:**
```java
// 백엔드 예시
public BrandingInfo getBrandingInfo(String tenantId) {
    Tenant tenant = tenantRepository.findByTenantId(tenantId)
        .orElseThrow(() -> new EntityNotFoundException("Tenant not found"));
    
    BrandingInfo branding = parseBrandingJson(tenant.getBrandingJson());
    
    // Fallback 처리
    if (branding == null || branding.getLogoUrl() == null) {
        branding = BrandingInfo.builder()
            .logoUrl("/images/core-solution-logo.png")
            .companyName(tenant.getName() != null ? tenant.getName() : "CoreSolution")
            .build();
    }
    
    return branding;
}
```

### 10.2 화면별 Fallback 적용

**헤더:**
- 고객 로고 → 코어시스템 로고
- 고객 상호 → 코어시스템 상호

**대시보드:**
- 고객 로고 → 코어시스템 로고
- 고객 상호 → 코어시스템 상호

**리포트:**
- 고객 로고 → 코어시스템 로고
- 고객 상호 → 코어시스템 상호

## 11. 마이그레이션

### 11.1 기존 데이터
- 기존 테넌트의 `name` 필드를 상호로 사용
- 로고는 null → 코어시스템 로고로 Fallback

### 11.2 점진적 적용
- 기존 화면에 점진적으로 적용
- 하위 호환성 유지
- Fallback으로 인한 화면 깨짐 방지

