# Shop Catalog UX MVP+ — 디자인 핸드오프 (Design Handoff)

본 문서는 **Shop Catalog UX MVP+** 기능(어드민 상품 등록/수정 페이지화, 썸네일 이미지 추가, 내담자 상품 상세 페이지)에 대한 디자인 스펙 및 구현 가이드라인을 정의합니다.

해당 스펙은 `mindgarden-design-system.pen`, `pencil-new.pen` 및 어드민 대시보드 샘플 톤(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample)을 기준으로 작성되었습니다. 코드 구현 담당자(core-coder)는 아래 정의된 토큰과 BEM 클래스 구조를 반드시 준수하여 구현해 주세요.

---

## 1. 어드민: 상품(SKU) 등록/수정 전용 페이지 (모달 탈피)

기존 `UnifiedModal`에서 처리하던 상품 등록/수정을 독립된 **페이지(Page)** 컴포넌트로 분리합니다.

### 1.1 레이아웃 구조 (Wireframe)
- **전체 래퍼**: `<div className="mg-v2-ad-b0kla">`
- **구조**: `AdminCommonLayout` > `ContentArea` > `ContentHeader` (타이틀: 상품 등록/수정, 액션: 취소/저장) > `ContentSection`
- **섹션 블록**: 
  - 기본 배경 `var(--mg-color-surface-main)`, 테두리 `1px solid var(--mg-color-border-main)`, `border-radius: 16px`
  - 섹션 제목에 좌측 세로 악센트 바 (4px 넓이, `var(--mg-color-primary-main)`)

### 1.2 필드 구성 및 UI
- **대표 이미지 업로드 (최상단)**
  - 높이: `200px` (권장 비율 1:1)
  - 디자인: 점선 테두리 (`2px dashed var(--mg-color-border-main)`), 배경 `var(--mg-color-background-main)`.
  - 상태: 드래그 앤 드롭 영역 또는 클릭하여 파일 선택. 업로드 완료 시 중앙에 이미지 미리보기 및 '변경/삭제' 오버레이 버튼 노출.
- **SKU 코드 (읽기 전용)**
  - 기존 입력 폼에서 **자동 생성(Read-only)** 텍스트로 변경.
  - 배경: 옅은 회색 (`#EFEFEF` 또는 `rgba(0,0,0,0.05)`), 텍스트 색상: `var(--mg-color-text-secondary)`.
- **상품명 / 단가 / 설명**
  - 기존 `mg-v2-form-stack`, `mg-v2-input`, `mg-v2-label` 재사용.
- **카테고리 (Category)**
  - 라디오 버튼 폼: `상담 패키지(CONSULTATION)` / `심리 검사(ASSESSMENT)`
  - 상수 `SHOP_CATALOG_CATEGORY` 사용.
- **노출 및 판매 활성**
  - 기존 체크박스 UI (`mg-v2-checkbox-row`) 유지.

### 1.3 화면 상태 (States) & Test ID
- **Loading**: `UnifiedLoading` 사용 (`data-testid="admin-sku-form-loading"`)
- **Error**: `EmptyState` 또는 `notificationManager.error` 활용.
- **Test ID**:
  - 페이지 루트: `data-testid="admin-shop-sku-form-page"`
  - 폼 요소: `data-testid="admin-sku-title-input"`, `data-testid="admin-sku-image-upload"`
  - 제출 버튼: `data-testid="admin-sku-save-button"`

---

## 2. 내담자(Client): 웹·앱 뷰 (PLP & PDP)

### 2.1 상품 목록 카드 (PLP - SkuCard.js)
기존 `SkuCard` 상단에 대표 이미지(썸네일) 영역을 추가합니다.

- **레이아웃**:
  - `client-shop__sku-card` 내 최상단에 `<figure className="client-shop__sku-image-wrapper">` 추가.
  - 이미지 컨테이너 속성: `aspect-ratio: 1 / 1; width: 100%; overflow: hidden; border-radius: 12px 12px 0 0; background-color: var(--mg-color-surface-main);`
  - 이미지 (`img`): `object-fit: cover; width: 100%; height: 100%;`
- **구조 변경**: 
  - 좌측 악센트 바(`client-shop__accent-bar`)는 유지하되 이미지 하단 텍스트 영역(`client-shop__sku-body`) 옆으로 배치.

### 2.2 상품 상세 페이지 (PDP - ShopSkuDetailPage)
새로운 상품 상세 페이지(PDP)를 신설합니다.

- **레이아웃 구조**:
  - 모바일 반응형(최대 너비 100%, 패딩 좌우 16~24px) 중심의 스크롤 뷰.
  - `<div className="client-shop__pdp" data-testid="client-shop-pdp">`
- **상단: 썸네일 이미지**
  - 화면 상단을 꽉 채우는 (또는 양옆 여백 약간) 1:1 비율 이미지.
  - `className="client-shop__pdp-image"`
- **중단: 텍스트 정보**
  - **카테고리 뱃지**: `상담 패키지` 또는 `심리 검사` (텍스트 크기 12px, 글자색 `var(--mg-color-primary-main)`, 배경 옅은 초록)
  - **상품명**: `20~24px`, `font-weight: 600`, 색상 `var(--mg-color-text-main)`
  - **단가**: `PriceText` 재사용, `24px`, `font-weight: 600`
  - **설명(Description)**: `14~16px`, `white-space: pre-wrap`, `color: var(--mg-color-text-secondary)`
- **하단: 플로팅 액션 바 (Sticky Footer)**
  - 화면 하단 고정 영역: 배경 `var(--mg-color-background-main)`, 상단 그림자(`box-shadow: 0 -4px 12px rgba(0,0,0,0.05)`).
  - 버튼: 100% width 주조 버튼(`mg-v2-btn mg-v2-btn--primary` 또는 `client-shop__cta--primary`) 텍스트 "장바구니 담기".
  - `data-testid="pdp-add-to-cart-button"`

---

## 3. 이미지 비율 및 용량 가이드

- **종횡비**: `1:1 (정방형)`을 권장합니다. (카드 및 상세 뷰에서 가장 안정적인 비율)
- **권장 해상도**: 최소 `400 x 400px` ~ 최대 `800 x 800px`
- **파일 크기**: 최대 `5MB` 이하 (JPEG, PNG, WebP 권장)
- **Fallback (대체 이미지)**: 업로드된 이미지가 없거나 로드 실패 시 노출할 기본 플레이스홀더 이미지(로고 워터마크 또는 회색 배경에 아이콘) 구현 필수.

---

## 4. Coder (core-coder) 구현 체크리스트

코더는 본 문서를 바탕으로 구현을 진행할 때 다음 항목을 확인해야 합니다.

- [ ] 어드민 SKU 관리 페이지가 기존 모달 UI를 완전히 대체하는가? (라우팅 추가: `/admin/shop/catalog/skus/new`, `/admin/shop/catalog/skus/:id`)
- [ ] 어드민 폼에서 SKU 코드가 수정 불가(Read-only) 상태로 표시되는가?
- [ ] 이미지 업로드 UI(미리보기, 드래그앤드롭) 컴포넌트가 디자인 시스템 토큰(점선 테두리 등)을 사용하여 구현되었는가?
- [ ] 카테고리(상담/심리검사) 선택이 `SHOP_CATALOG_CATEGORY` 상수를 참조하여 폼에 반영되었는가?
- [ ] Client Web/App 의 `SkuCard.js` 상단에 1:1 비율의 썸네일 이미지가 삽입되었는가? (object-fit: cover 속성 적용)
- [ ] Client 상품 상세 페이지(PDP)가 썸네일, 뱃지, 제목, 설명, 가격 및 **하단 고정형(Sticky) 장바구니 담기 버튼** 구조로 구현되었는가?
- [ ] 디자인 톤 (배경 `#FAF9F7`, 서페이스 `#F5F3EF`, 주조색 `#3D5246` 등) 토큰과 `mg-v2-ad-b0kla`, `client-shop__*` BEM 클래스 구조가 정확히 사용되었는가?
- [ ] Test ID(`data-testid`)가 스펙대로 부여되었으며 E2E 테스트 검증 준비가 되었는가?
- [ ] 에러 상태 및 로딩 상태(`UnifiedLoading`, `EmptyState`)가 정의된 대로 적용되었는가?
