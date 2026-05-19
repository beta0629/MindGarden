# Shop Catalog UX MVP+ — 컴포넌트·모듈 인벤토리 감사

**작성**: core-component-manager (코드 수정 없음)  
**일자**: 2026-05-19  
**범위**: 프론트(`frontend/`), Expo(`expo-app/`), 백엔드 Shop Admin API·엔티티, 재사용·배치 제안  
**대상 화면**: 어드민 SKU 카탈로그 (`AdminShopCatalogSkusPage` 및 MVP+ 확장)

---

## 1. 요약

| 항목 | 결론 |
|------|------|
| **이미지 업로드** | 프로필·브랜딩·심리검사 업로드 패턴은 있음. **Shop SKU용 이미지 컬럼·API·UI 없음** → 신규 Organism + 백엔드 업로드 API 선행 필요 |
| **목록+CRUD** | `AdminShopCatalogSkusPage`가 이미 **ListTableView + UnifiedModal(등록/수정) + 가격이력 모달** 패턴. ERP `ItemManagement`·Shop `AdminShopOrdersPage`와 동형 |
| **코드 자동생성 UI** | SKU 전용 없음. **참조번호·대시보드명** 등 도메인별 인라인 `generate*` 패턴 분산 → SKU는 **공통 util 추출** 또는 **서버 발급** 중 택일 |
| **expo-app 어드민 Shop** | **없음** (클라이언트 Shop만). `ADMIN_SHOP_CATALOG` 상수만 존재 |
| **페이지 분리** | MVP+는 **`AdminShopCatalogSkusPage` 확장 권장**. 전용 `AdminShopCatalogSkuEditorPage`는 딥링크·다탭·대형 폼 필요 시에만 |

---

## 2. 이미지 업로드 — 재사용 후보

### 2.1 프론트엔드 (웹)

| 구분 | 경로 | 역할 | Shop MVP+ 적합도 | 비고 |
|------|------|------|------------------|------|
| **프로필 (공통 Atom)** | `frontend/src/components/common/ProfileImageInput.js` | 파일 선택 → `processProfileImage` → **정사각 크롭·data URL** | △ | 아바타 전용. 상품 썸네일에는 부적합 |
| **프로필 유틸** | `frontend/src/utils/imageResizeCrop.js` | 리사이즈·크롭·용량 검사 | ○ | 상품용 **비율 옵션** 추가 시 재사용 |
| **마이페이지** | `frontend/src/components/mypage/components/ProfileImageUpload.js` | 드래그·크롭·UnifiedModal | △ | 프로필 UX, Shop과 분리 |
| **마이페이지 API** | `frontend/src/utils/mypageApi.js` (`uploadProfileImage`) | base64 업로드 | ✗ | 엔드포인트·페이로드 다름 |
| **어드민 프로필** | `StaffManagement.js`, `ClientModal.js`, `ConsultantComprehensiveManagement.js` | `ProfileImageInput` 삽입 | △ | 동일 제약 |
| **브랜딩 (어드민)** | `frontend/src/components/admin/BrandingManagement.js` | 로고·파비콘 **드래그존·MIME·용량** | **◎** | **상품 이미지 UI 레퍼런스** (비율·크롭 없음) |
| **브랜딩 API** | `frontend/src/utils/brandingUtils.js` (`uploadLogo`, `uploadFavicon`) | `FormData` + `csrfTokenManager.fetchWithCsrfMultipart` | ○ | **multipart 패턴** 재사용. URL은 Shop 전용 필요 |
| **심리검사 (어드민)** | `frontend/src/components/admin/psych-assessment/organisms/PsychUploadSection.js` | `react-dropzone`, PDF/이미지, 50MB, `mg-upload-area` | **◎** | **다중 파일·드래그** 상품 갤러리 1차 후보 |
| **커뮤니티** | `frontend/src/components/community/*` | — | ✗ | **이미지 업로드 UI 없음** (피드·상세만) |
| **공통 업로드 transport** | `frontend/src/utils/ajax.js` (`apiUpload`), `standardizedApi.js`, `csrfTokenManager.js` | multipart fetch | **◎** | 모든 신규 업로드의 **전송층** |

### 2.2 모바일·Expo

| 구분 | 경로 | Shop 관련 |
|------|------|-----------|
| RN 프로필 | `mobile/src/services/ImageService.js`, `ProfilePhotoScreen.js` | ✗ |
| Expo 프로필 | `expo-app/src/api/hooks/useProfileImageUpload.ts`, `MoreAccountProfile.tsx` | ✗ |

### 2.3 백엔드 업로드 API (참고)

| API | Controller | 용도 |
|-----|------------|------|
| `/api/admin/branding/logo`, `.../favicon` | `BrandingController` | 테넌트 브랜딩 |
| 프로필 | `MyPageServiceImpl` 등 | 사용자 프로필 |
| `/api/v1/assessments/psych/...` | `PsychAssessmentController` | PDF/스캔 이미지 |
| **Shop SKU 이미지** | — | **미구현** (`ShopCatalogSku` 엔티티에 image 필드 없음) |

### 2.4 이미지 — component-manager 제안

1. **신규** `frontend/src/components/shop/organisms/ShopProductImageUpload.js` (가칭): `PsychUploadSection`의 dropzone + `BrandingManagement`의 미리보기·제거 UX를 합성. **정사각 크롭은 ProfileImageInput 사용 금지**.
2. **유틸**: `imageResizeCrop.js`에 `aspectRatio: '4/3' | '1/1'` 옵션만 확장 (코더).
3. **API**: Shop 전용 `POST /api/v1/admin/shop/catalog-skus/{id}/images` 등 백엔드 선행 후 `adminShopApi.js`·`adminShopCatalogService.js`에 래퍼.

---

## 3. 상품/목록+상세 CRUD 패턴

### 3.1 현재 Shop Admin (기준선)

| 페이지 | 경로 | 패턴 | API |
|--------|------|------|-----|
| **SKU 카탈로그** | `frontend/src/components/admin/AdminShopCatalogSkusPage.js` | `AdminCommonLayout` → `ContentArea`/`ContentHeader` → `ListTableView` → 행 클릭·등록 버튼 → **`UnifiedModal` CRUD** → 가격이력 **별도 모달** | `GET/POST /catalog-skus`, `GET/PUT /{id}`, `PATCH .../catalog-visible`, `GET .../price-history` |
| 포인트 정책 | `AdminShopPointPoliciesPage.js` | 단일 페이지 **인라인 폼** (목록 없음) | `GET/PATCH .../point-policies` |
| 주문 | `AdminShopOrdersPage.js` | `ListTableView` + **상세·환불 `UnifiedModal`** | `adminShopOrderService.js` |

**공통 Shop 어드민 스택**: `AdminTenantComponentGate` (`ADMIN_SHOP_CATALOG`), `adminShopApi.js`, `clientShopFormat.js`, `erpMgButtonProps`, B0KlA CSS.

### 3.2 ERP·어드민 유사 패턴 (재사용 레퍼런스)

| 화면 | 경로 | 목록 | 생성/수정 | 상세 |
|------|------|------|-----------|------|
| **ERP 아이템** | `frontend/src/components/erp/ItemManagement.js` | 테이블·`ErpPageShell` | **`showCreateModal` / `showEditModal`** (UnifiedModal 2개) | 모달 내 편집 |
| **스태프** | `frontend/src/components/admin/StaffManagement.js` | `ListTableView` + `ViewModeToggle` + 카드 그리드 | **여러 UnifiedModal** (등록·역할·프로필) | 모달·인라인 |
| **패키지 요금** | `package-pricing/pages/PackagePricingDetailPage.js` | 동 페이지 하단 목록 | **별도 라우트** `/.../:id` 전체 페이지 폼 | URL 기반 create/edit |
| **내담자 종합** | `ClientComprehensiveManagement.js` | 목록+필터 | `ClientModal.js` (대형 모달) | — |
| **상담사 종합** | `ConsultantComprehensiveManagement.js` | 동일 | 대형 모달 + 탭 | — |

**가장 가까운 형제**: `ItemManagement` ≈ `AdminShopCatalogSkusPage` (목록 + 모달 CRUD, tenant 스코프).

### 3.3 백엔드 Shop SKU 모듈

| 계층 | 경로 |
|------|------|
| Controller | `AdminShopCatalogSkuController.java` |
| Service | `AdminShopCatalogSkuService` / `AdminShopCatalogSkuServiceImpl.java` |
| Entity | `ShopCatalogSku.java` (`sku_code`, `title`, `description_text`, `unit_price_minor`, `catalog_visible`, `active`, `sort_order`, `catalog_category`) |
| DTO | `ShopCatalogSkuUpsertRequest`, `ShopCatalogSkuAdminDetail`, … |
| Repository | `ShopCatalogSkuRepository.java` |

---

## 4. 코드 자동생성 UI 패턴

**SKU 코드·상품 코드를 UI에서 자동 채우는 전용 컴포넌트는 없음.**

| 패턴 | 위치 | 동작 | Shop SKU 적용 시 |
|------|------|------|------------------|
| **결제·입금 참조번호** | `MappingCreationModal.js`, `MappingPaymentModal.js`, `MappingDepositModal.js` | `generateReferenceNumber(method)` → `BANK_YYYYMMDD_HHMMSS` | 타임스탬프 기반 **SKU-xxx** 초안 생성 가능 (클라이언트) |
| **대시보드/위젯 ID·이름** | `DashboardFormModal.js` + `dashboardFormModalStrings.js` | 역할 선택 시 이름 자동 생성, **수정 가능** placeholder | UX 참고: “자동 생성 (수정 가능)” |
| **userId** | `ConsultantComprehensiveManagement.js` | 저장 시 name 기반 slug (UI 미리보기 없음) | 서버 저장 직전 변환만 |
| **스태프 비밀번호** | `staffManagementStrings.js` | “미입력 시 자동 생성” **문구만** | 서버 위임 |
| **테넌트 코드** | `TenantCodeManagement.js` | `codeValue` **수동 입력** + `tenantCodeUtils` 검증 | 패키지 요금 `PackagePricingDetailPage`와 동일 |
| **서버 ID** | `TenantIdGenerator.java` 등 | 테넌트 온보딩 | Shop SKU와 무관 |

**제안**: SKU 코드 자동생성이 MVP+에 포함되면  
- (A) `frontend/src/utils/shopSkuCodeGenerator.js` 신설 + 모달 `placeholder`/`readOnly` 토글, 또는  
- (B) `POST /catalog-skus` 응답에서 서버 발급 (중복 방지에 유리).  
분산된 `generateReferenceNumber`를 Shop에 복붙하지 말 것.

---

## 5. expo-app — Shop·어드민

| 영역 | 존재 | 경로 예시 |
|------|------|-----------|
| **클라이언트 Shop** | ○ | `expo-app/app/(client)/(shop)/*`, `src/components/shop/**`, `useClientShopCatalog.ts` |
| **어드민 Shop UI** | **✗** | — |
| **컴포넌트 게이트 상수** | ○ (코드만) | `expo-app/src/constants/platformComponentCodes.ts` → `ADMIN_SHOP_CATALOG` |

MVP+ 어드민 SKU UX는 **웹 `frontend` 전용**으로 계획. Expo는 클라이언트 카탈로그 표시(`SkuCard`, `ShopCategoryTabs`)만 연계.

---

## 6. 중복·배치 제안: `AdminShopCatalogSkusPage` 확장 vs `AdminShopCatalogSkuEditorPage`

### 6.1 현재 `AdminShopCatalogSkusPage` 구조 (~497 LOC)

- **Template/Page**: 단일 파일에 목록·폼·가격이력 모두 포함  
- **Organisms**: 없음 (인라인 `renderCell`, 모달 body)  
- **상수**: `adminShopCatalog.js`, `adminShopApi.js`  
- **서비스**: `listAdminShopCatalogSkuPriceHistory`만 분리 (`adminShopCatalogService.js`)

### 6.2 비교

| 기준 | **A. 기존 페이지 확장** | **B. 신규 `AdminShopCatalogSkuEditorPage`** |
|------|---------------------------|---------------------------------------------|
| 라우트 | `/admin/shop/catalog-skus` 유지 | `/admin/shop/catalog-skus/new`, `.../:id/edit` 추가 |
| CRUD UX | 모달 유지·필드 추가 | 전체 페이지 폼 (`PackagePricingDetailPage`형) |
| 가격 이력 | 기존 모달 재사용 용이 | 탭 또는 하위 섹션 |
| 이미지·카테고리 등 필드 증가 | 모달 `size="large"` + 스크롤 | **유리** (공간) |
| 북마크·공유 URL | ✗ | ○ |
| 중복 위험 | 낮음 | 목록 로드·`mapRowToForm`·`buildUpsertBody` **복제 위험** |
| E2E | `admin-shop-catalog-skus-smoke.spec.ts` 유지 | 라우트·셀렉터 추가 |

### 6.3 권장 (component-manager)

| Phase | 권장 |
|-------|------|
| **MVP+ (이미지·카테고리·SKU 자동코드·설명 강화)** | **A. `AdminShopCatalogSkusPage` 확장** + 파일 비대 시 **organisms 분리만** |
| **분리 추출 후보 (코더)** | `AdminShopCatalogSkuFormModal.js`, `AdminShopCatalogSkuPriceHistoryModal.js`, `adminShopCatalogForm.js` (map/build/emptyForm) |
| **B. Editor 전용 페이지** | 다음 조건 **2개 이상**일 때만: (1) 모달 15필드 초과·다탭 (2) 운영자 URL 공유 필수 (3) 감사 로그·버전 UI 전체 페이지 |

**중복 방지**: `AdminShopCatalogSkuEditorPage` 신설 시 반드시 `adminShopCatalogForm.js`(또는 hook `useAdminShopCatalogSkuForm`)로 **폼·API body 단일화**. `PackagePricingDetailPage`는 “별도 라우트” 레퍼런스이지 Shop SKU와 1:1 대응하지 않음.

### 6.4 아토믹 배치 (MVP+ 목표 구조)

```
frontend/src/components/shop/          # 도메인 shop (client + admin 공용)
  atoms/       PriceMinorInput, CatalogVisibleToggle (기존 utils 연계)
  molecules/   ShopSkuTableRowActions (가격이력·노출·수정)
  organisms/   ShopProductImageUpload, AdminShopCatalogSkuFormFields
  templates/   (선택) AdminShopCatalogLayout
frontend/src/components/admin/
  AdminShopCatalogSkusPage.js          # Page — 조합만
```

어드민 전용이라도 **Shop 도메인 UI는 `components/shop/`** 하위가 `components/admin/` 단독 신규 페이지보다 적재적소 (클라이언트 `pages/client/shop`·`components/shop/templates`와 대칭).

---

## 7. core-coder 권장 재사용 목록 (체크리스트)

구현 시 **아래 순서로** 기존 모듈을 끌어다 쓸 것.

### 7.1 레이아웃·리스트·모달 (필수)

| # | 모듈 | 경로 |
|---|------|------|
| 1 | AdminCommonLayout | `components/layout/AdminCommonLayout` |
| 2 | ContentArea, ContentHeader, ContentSection | `components/dashboard-v2/content` |
| 3 | ListTableView, EmptyState | `components/common` |
| 4 | UnifiedModal | `components/common/modals/UnifiedModal` |
| 5 | MGButton + erpMgButtonProps | `components/common/MGButton`, `erp/common/erpMgButtonProps` |
| 6 | UnifiedLoading | `components/common/UnifiedLoading` |
| 7 | SafeText / toDisplayString | `components/common/SafeText`, `utils/safeDisplay` |
| 8 | AdminTenantComponentGate | `components/shop/templates/AdminTenantComponentGate` |

### 7.2 Shop Admin API·포맷 (필수)

| # | 모듈 | 경로 |
|---|------|------|
| 9 | ADMIN_SHOP_API, path builders | `constants/adminShopApi.js` |
| 10 | 가격·날짜 포맷 | `utils/clientShopFormat.js` |
| 11 | 가격 이력 서비스 | `services/adminShopCatalogService.js` |
| 12 | 카피·컬럼 라벨 | `constants/adminShopCatalog.js` |

### 7.3 MVP+ 필드별 (조건부)

| # | 필요 시 | 재사용 | 신규 |
|---|---------|--------|------|
| 13 | 카테고리 선택 | `BadgeSelect` + `ShopCatalogCategory` 백엔드 enum | — |
| 14 | 상품 이미지 | multipart: `csrfTokenManager` + `brandingUtils` 패턴 | **ShopProductImageUpload** + Shop upload API |
| 15 | 이미지 리사이즈 | `imageResizeCrop.js` (옵션 확장) | — |
| 16 | 다중 파일 드래그 | `PsychUploadSection` 구조·`react-dropzone` | Shop 전용 accept/limits |
| 17 | SKU 코드 자동 | — | `shopSkuCodeGenerator.js` 또는 서버 발급 |
| 18 | CRUD 폼 분리 | `ItemManagement` 모달 필드 배치 | `AdminShopCatalogSkuFormModal` |

### 7.4 사용하지 말 것

| 모듈 | 이유 |
|------|------|
| `ProfileImageInput` / `ProfileImageUpload` | 정사각 아바타 크롭 |
| `mypageApi.uploadProfileImage` | 엔드포인트 불일치 |
| 커뮤니티 컴포넌트 | 업로드 없음 |
| expo-app 어드민 | 미존재 |

---

## 8. 서버 모듈 — MVP+ 시 공통화 후보

| 항목 | 현재 | 제안 |
|------|------|------|
| SKU CRUD | `AdminShopCatalogSkuServiceImpl` | 이미지·카테고리 필드 추가 시 DTO·Entity 한곳 |
| 파일 저장 | `BrandingService`, `PsychAssessmentIngestService` | **공통 `TenantFileStorageService`** 검토 (코더·백엔드 표준) |
| 가격 이력 | `ShopCatalogSkuPriceHistory` | 유지 — UI는 기존 모달 |

---

## 9. 테스트·문서 연계

| 자산 | 경로 |
|------|------|
| E2E smoke | `tests/e2e/tests/admin/admin-shop-catalog-skus-smoke.spec.ts` |
| 통합 테스트 | `AdminShopCatalogSkuControllerMvcTest` |
| Shop 상태 문서 | `docs/project-management/SHOP_REWARD_IMPLEMENTATION_STATUS.md` |

MVP+ UI 변경 후 **E2E 셀렉터** (`data-testid="admin-shop-catalog-page"`) 유지 또는 확장만 — 라우트 분리 시 별도 spec 추가.

---

## 10. 변경 이력

| 일자 | 작성 | 내용 |
|------|------|------|
| 2026-05-19 | core-component-manager | 최초 인벤토리·재사용·배치 감사 |
