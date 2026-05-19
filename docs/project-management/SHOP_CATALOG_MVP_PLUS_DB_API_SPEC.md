# Shop Catalog UX MVP+ — DB·API 스펙

| 항목 | 내용 |
|------|------|
| 문서 제목 | 쇼핑 카탈로그 MVP+ — DDL·SKU 자동 생성·이미지(multipart)·Admin/Client API |
| 상태 | **Phase A-2 확정(문서)** — 구현은 Phase B (`core-coder`) |
| 작성일 | 2026-05-19 |
| SSOT 역할 | Flyway·엔드포인트·DTO·검증·에러·저장 경로의 **구현 단일 기준** |
| 상위 SSOT | [SHOP_CATALOG_UX_MVP_PLUS_ORCHESTRATION.md](./SHOP_CATALOG_UX_MVP_PLUS_ORCHESTRATION.md) §3 A-2 |
| 참조 | [SHOP_CATALOG_UX_MVP_PLUS_DESIGN_HANDOFF.md](./SHOP_CATALOG_UX_MVP_PLUS_DESIGN_HANDOFF.md) · [SHOP_CATALOG_UX_MVP_PLUS_COMPONENT_AUDIT.md](./SHOP_CATALOG_UX_MVP_PLUS_COMPONENT_AUDIT.md) · [SHOP_REWARD_PLATFORM_ORCHESTRATION.md](./SHOP_REWARD_PLATFORM_ORCHESTRATION.md) |

**명명 정합 (오케스트레이션 SSOT)**

| 개념 | DB 컬럼 | API JSON (camelCase) | 비고 |
|------|---------|----------------------|------|
| 대표 이미지 1장 (PLP 썸네일·PDP 히어로 동일 URL) | `hero_image_url` | `heroImageUrl` | `thumbnail_url` **사용 안 함** (단일 URL 이중 컬럼 금지) |
| SKU 코드 | `sku_code` | `skuCode` | 신규 생성 시 서버 발급·수정 불가 |

**이미지 전달 방식 (MVP+ 합의)**

| 방안 | 설명 | MVP+ |
|------|------|:----:|
| **A안** | 클라이언트가 외부 URL 문자열을 body에 실어 저장 | ✗ (OPS backfill·시드 placeholder만 예외) |
| **B안** | `multipart/form-data`로 파일 업로드 → 서버가 저장 후 `hero_image_url` 기록 | **◎ 권장** (히어로 필수와 정합) |

---

## §0 현행 베이스라인 (2026-05-19)

| 영역 | 현황 |
|------|------|
| 테이블 | `shop_catalog_skus` — `V20260514_003`, 카테고리 `V20260519_007`, 가격이력 `V20260520_001` |
| UK | `uk_shop_sku_tenant_code (tenant_id, sku_code)` |
| 엔티티 | `ShopCatalogSku` — 이미지 컬럼 **없음** |
| 어드민 API | `POST/PUT /api/v1/admin/shop/catalog-skus` — `skuCode` **@NotBlank 필수** |
| 내담자 API | `GET /api/v1/clients/me/shop/catalog` — `skuCode` 단건 조회 **없음** |
| 업로드 선례 | `BrandingService` — `uploads/logos/`, 공개 URL `/api/files/logos/{file}` |
| 컴포넌트 게이트 | 어드민 `ADMIN_SHOP_CATALOG`, 내담자 `CLIENT_SHOP` |

---

## §1 DDL — Flyway 스케치

### 1.1 신규 마이그레이션

| 항목 | 값 |
|------|-----|
| 파일명 (안) | `V20260523_001__shop_catalog_sku_hero_image.sql` |
| 선행 버전 | `V20260522_002__shop_reward_default_components_onboarding.sql` **이후** (007·020·021·022 포함 전체 적용 후) |
| 롤백 | 운영 DB **DOWN 금지** — 역마이그레이션 스크립트 별도 OPS 문서만 |

### 1.2 컬럼 추가

```sql
-- V20260523_001__shop_catalog_sku_hero_image.sql (스케치)
-- 1단계: nullable 추가 (기존 행 backfill 전)
ALTER TABLE shop_catalog_skus
  ADD COLUMN hero_image_url VARCHAR(512) NULL
    COMMENT '대표 이미지 공개 URL (PLP·PDP 동일)' 
    AFTER catalog_category;

-- 2단계: 기존 행 backfill (동일 마이그레이션 또는 V20260523_002)
-- placeholder는 테넌트·환경별 정적 자산 URL (하드코딩 금지 → application 설정 키 shop.catalog.placeholder-hero-url)
UPDATE shop_catalog_skus
SET hero_image_url = :placeholderUrl
WHERE hero_image_url IS NULL
  AND is_deleted = 0;

-- 3단계 (선택·운영 합의 후): NOT NULL 강제
-- ALTER TABLE shop_catalog_skus MODIFY hero_image_url VARCHAR(512) NOT NULL;
```

| 정책 | 내용 |
|------|------|
| **앱 검증 (MVP+ 기본)** | DB는 **nullable 유지** 가능. 신규·수정 저장 시 서비스에서 `hero_image_url` 비어 있으면 **400** |
| **DB NOT NULL** | backfill·시드·OPS placeholder **완료 후** 별도 마이그레이션으로 승격 (선택) |
| `tenant_id` | 기존과 동일 — **NOT NULL**, 모든 DML/SELECT에 조건 필수 |
| 인덱스 | MVP+는 단건·목록 조회만 — **추가 인덱스 불필요** (필요 시 `idx_shop_sku_tenant_list` 유지) |

### 1.3 JPA 매핑 (구현 참고)

```java
@Column(name = "hero_image_url", length = 512)
private String heroImageUrl;
```

### 1.4 하위 호환·시드

| 대상 | 조치 |
|------|------|
| 기존 SKU | Flyway placeholder URL backfill → 어드민에서 실이미지로 교체 유도 |
| `scripts/ops/seed-shop-demo-catalog.sql` | `hero_image_url` 컬럼 추가(환경별 URL은 실행 시 변수) |
| 주문 라인 스냅샷 | MVP+ **미변경** — `shop_order_lines`에 이미지 스냅샷 없음 (후속) |

---

## §2 SKU 코드 자동 생성

### 2.1 형식

| 항목 | 규칙 |
|------|------|
| **패턴** | `PKG-{tenantShort}-{seq}` |
| **PREFIX** | `PKG` (상담 패키지 기본; `catalogCategory=ASSESSMENT` 시 `ASM` 허용 — 동일 알고리즘) |
| **tenantShort** | `tenants.subdomain` 정규화: 영숫자만, **대문자**, 최대 12자. 없으면 `tenant_id`에서 하이픈 제거 후 **앞 8자** |
| **seq** | 테넌트·PREFIX별 **0 패딩 4자리** 순번 (`0001`…) |
| **예시** | `PKG-MYGARDEN-0001`, `ASM-MYGARDEN-0002` |
| **최대 길이** | `sku_code` VARCHAR(64) — 초과 시 tenantShort 축약 |

### 2.2 발급 알고리즘 (서버)

```
1. tenantId ← TenantContextHolder.getRequiredTenantId()
2. prefix ← catalogCategory == ASSESSMENT ? "ASM" : "PKG"
3. tenantShort ← resolveTenantShort(tenantId)   // subdomain 우선
4. loop attempt = 0 .. MAX_RETRIES(5):
     seq ← nextSeq(tenantId, prefix)            // SELECT MAX suffix FOR UPDATE 또는 전용 시퀀스 테이블
     candidate ← prefix + "-" + tenantShort + "-" + zeroPad(seq, 4)
     if !exists(tenantId, candidate): return candidate
5. 실패 시 → 409 또는 IllegalStateException("SKU 코드 발급에 실패했습니다")
```

| 요구 | 내용 |
|------|------|
| **UK** | `(tenant_id, sku_code)` — 기존 `uk_shop_sku_tenant_code` 유지 |
| **멱등** | 동일 요청 재시도 시 **새 코드 중복 생성 금지** — 클라이언트는 201 응답의 `skuCode` 보관 |
| **충돌** | UK 위반 시 seq 증가 후 재시도 (최대 5회) |
| **수정 시 immutable** | `PUT`·`PATCH`에서 `skuCode` **무시** — body에 포함돼도 변경하지 않음 |
| **신규 POST** | `skuCode` **생략·null·빈 문자열** → 서버 발급. **비어 있지 않은 값**이 오면 **400** `SHOP_SKU_CODE_NOT_ALLOWED_ON_CREATE` (MVP+에서 수동 입력 폐지) |

### 2.3 레거시 SKU

| 상황 | 처리 |
|------|------|
| `DEV-CONSULT-DEMO-01` 등 시드 코드 | 유지 — 재발급 없음 |
| 어드민 UI | 생성 전: 필드 숨김 또는 “저장 시 자동 발급”. 생성 후: **read-only** |

---

## §3 Admin API

**Base**: `/api/v1/admin/shop/catalog-skus`  
**인가**: `@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")`  
**게이트**: `TenantComponentActivationService.isComponentActive(tenantId, ADMIN_SHOP_CATALOG)` — 비활성 **403**

### 3.1 엔드포인트 요약

| Method | Path | Content-Type | 설명 |
|--------|------|--------------|------|
| GET | `/` | — | 목록 (`heroImageUrl` 포함) |
| GET | `/{id}` | — | 상세 |
| GET | `/{id}/price-history` | — | 기존 유지 |
| **POST** | `/` | `multipart/form-data` **(B안 권장)** 또는 `application/json` + 후속 업로드 | 신규 생성 (`skuCode` 없음) |
| **PUT** | `/{id}` | `multipart/form-data` 또는 JSON + 후속 업로드 | 수정 (`skuCode` 불변) |
| **POST** | `/{id}/hero-image` | `multipart/form-data` | 대표 이미지만 교체 (JSON-only 플로우 보조) |
| PATCH | `/{id}/catalog-visible` | `application/json` | 기존 유지 |

### 3.2 Multipart 계약 (B안 — 권장)

**Part 이름**

| Part | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `payload` | `application/json` | ○ | 아래 Upsert JSON (`skuCode` 제외·무시) |
| `heroImage` | `binary` | POST: ○ / PUT: △ | 신규·이미지 교체 시 필수. PUT에서 생략 시 기존 URL 유지 |

**`ShopCatalogSkuUpsertRequest` (MVP+ 확장)**

| 필드 | 타입 | POST | PUT | 검증 |
|------|------|:----:|:---:|------|
| `skuCode` | string | ✗ 전송 금지 | 무시(read-only) | — |
| `title` | string | ○ | ○ | @NotBlank, max 200 |
| `descriptionText` | string | | | max 4000 |
| `unitPriceMinor` | long | ○ | ○ | ≥ 0 |
| `currency` | string | | | 3자, 기본 KRW |
| `catalogVisible` | boolean | ○ | ○ | |
| `active` | boolean | ○ | ○ | |
| `sortOrder` | int | ○ | ○ | ≥ 0 |
| **`catalogCategory`** | string | ○ | ○ | `CONSULTATION` \| `ASSESSMENT` (현행 엔티티·FE 상수와 동일) |

**저장 시 히어로 필수**

- POST: `heroImage` part 없고 `hero_image_url` 없음 → **400** `SHOP_HERO_IMAGE_REQUIRED`
- PUT: 기존 URL 없고 part 없음 → **400** 동일

### 3.3 JSON-only 플로우 (보조 — 2단계)

1. `POST` `application/json` — 이미지 없이 생성 **불가** (MVP+).  
   **예외 없음** — 반드시 multipart 한 번에 또는 아래 2단계:
2. (비권장) 내부 구현이 허용할 경우에만: `POST` JSON → 즉시 `POST /{id}/hero-image` → 미완료 SKU는 `active=false` 등 — **MVP+ 구현에서는 단일 multipart POST만 허용**하여 분기 최소화.

### 3.4 이미지 검증

| 항목 | 값 |
|------|-----|
| MIME | `image/jpeg`, `image/png`, `image/webp` (Branding과 동일 계열; SVG는 MVP+ **제외** 권장) |
| 최대 크기 | **5MB** (디자인 핸드오프 §3) |
| 해상도 | 서버 강제 없음; 클라 권장 400~800px 정방형 |
| 파일명 | PII 금지; 저장명 `{tenantId}_{skuId}_{uuid}.{ext}` |

### 3.5 Admin Response DTO 확장

**`ShopCatalogSkuAdminDetail` / `ShopCatalogSkuAdminItem`**

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | long | |
| `skuCode` | string | |
| `title` | string | |
| `descriptionText` | string? | |
| `unitPriceMinor` | long | |
| `currency` | string | |
| `catalogVisible` | boolean | |
| `active` | boolean | |
| `sortOrder` | int | |
| **`catalogCategory`** | string | 목록·상세 모두 |
| **`heroImageUrl`** | string | 상대 또는 절대 URL |

### 3.6 JSON 예시

**POST multipart — payload part**

```json
{
  "title": "5회 상담 패키지",
  "descriptionText": "대면·화상 포함",
  "unitPriceMinor": 450000,
  "currency": "KRW",
  "catalogVisible": true,
  "active": true,
  "sortOrder": 10,
  "catalogCategory": "CONSULTATION"
}
```

**201 Response**

```json
{
  "success": true,
  "message": "생성되었습니다.",
  "data": {
    "id": 42,
    "skuCode": "PKG-MYGARDEN-0003",
    "title": "5회 상담 패키지",
    "descriptionText": "대면·화상 포함",
    "unitPriceMinor": 450000,
    "currency": "KRW",
    "catalogVisible": true,
    "active": true,
    "sortOrder": 10,
    "catalogCategory": "CONSULTATION",
    "heroImageUrl": "/api/v1/files/shop-catalog/tenant-uuid_42_a1b2c3d4.webp"
  }
}
```

**PUT — skuCode 변경 시도 (body에 포함해도 서버 무시)**

```json
{
  "skuCode": "HACK-CODE",
  "title": "제목 수정",
  "unitPriceMinor": 460000,
  "currency": "KRW",
  "catalogVisible": true,
  "active": true,
  "sortOrder": 10,
  "catalogCategory": "CONSULTATION"
}
```

→ 응답 `skuCode`는 기존 `PKG-MYGARDEN-0003` 유지.

**POST `/{id}/hero-image` only**

```
Content-Type: multipart/form-data
heroImage: (binary)
```

**200 Response** — `data.heroImageUrl` 갱신된 `ShopCatalogSkuAdminDetail`.

---

## §4 Client API

**Base**: `/api/v1/clients/me/shop`  
**인가**: 내담자 세션 + `CLIENT_SHOP` 활성

### 4.1 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/catalog` | PLP — `catalogVisible=true`·`active=true` SKU 목록 (기존) |
| **GET** | `/catalog/{skuCode}` | **신규** — PDP 단건 (동일 tenant·노출 조건) |

### 4.2 `ShopCatalogSkuResponse` 확장

| 필드 | 타입 | PLP | PDP | 비고 |
|------|------|:---:|:---:|------|
| `skuCode` | string | ○ | ○ | |
| `title` | string | ○ | ○ | |
| `descriptionText` | string? | ○ | ○ | |
| `unitPriceMinor` | long | ○ | ○ | |
| `currency` | string | ○ | ○ | |
| `catalogCategory` | string | ○ | ○ | `CONSULTATION` \| `ASSESSMENT` |
| **`heroImageUrl`** | string? | ○ | ○ | 어드민과 **동일 값**; null이면 FE placeholder |

**URL 규칙**

| 유형 | 예 | 처리 |
|------|-----|------|
| 상대 경로 | `/api/v1/files/shop-catalog/...` | FE·Expo: `StandardizedApi` base 또는 `window.location.origin` 결합 |
| 절대 HTTPS | `https://cdn.example/...` | 그대로 사용 (향후 CDN) |
| 교차 tenant | — | **403** — 다른 tenant 파일명 추측 접근 차단 (`FileController` tenant 검증) |

### 4.3 JSON 예시

**GET `/catalog`**

```json
{
  "success": true,
  "data": [
    {
      "skuCode": "PKG-MYGARDEN-0001",
      "title": "Dev 상담 패키지 (QA)",
      "descriptionText": null,
      "unitPriceMinor": 50000,
      "currency": "KRW",
      "catalogCategory": "CONSULTATION",
      "heroImageUrl": "/api/v1/files/shop-catalog/tenant-uuid_1_demo.webp"
    }
  ]
}
```

**GET `/catalog/PKG-MYGARDEN-0001`**

```json
{
  "success": true,
  "data": {
    "skuCode": "PKG-MYGARDEN-0001",
    "title": "Dev 상담 패키지 (QA)",
    "descriptionText": "상세 설명",
    "unitPriceMinor": 50000,
    "currency": "KRW",
    "catalogCategory": "CONSULTATION",
    "heroImageUrl": "/api/v1/files/shop-catalog/tenant-uuid_1_demo.webp"
  }
}
```

**404** — 미노출·삭제·타 tenant·없는 코드.

---

## §5 에러 코드·tenant 격리·파일 저장

### 5.1 HTTP·메시지 표

| HTTP | code (body.message 또는 전용 code 필드) | 조건 |
|------|-------------------------------------------|------|
| 400 | `SHOP_HERO_IMAGE_REQUIRED` | hero 없이 POST/PUT 완료 시도 |
| 400 | `SHOP_SKU_CODE_NOT_ALLOWED_ON_CREATE` | POST에 `skuCode` 포함 |
| 400 | `SHOP_INVALID_IMAGE_TYPE` | MIME 비허용 |
| 400 | `SHOP_IMAGE_TOO_LARGE` | 5MB 초과 |
| 400 | `SHOP_INVALID_CATALOG_CATEGORY` | category enum 외 |
| 400 | (validation) | title/price 등 Bean Validation |
| 403 | 어드민 쇼핑 비활성 메시지 (기존) | `ADMIN_SHOP_CATALOG` off |
| 403 | 내담자 쇼핑 비활성 (기존) | `CLIENT_SHOP` off |
| 403 | `SHOP_FILE_TENANT_MISMATCH` | 파일 다운로드 tenant 불일치 |
| 404 | `EntityNotFoundException` | SKU id/code 없음 |
| 409 | `SHOP_SKU_CODE_GENERATION_FAILED` | 자동 발급 재시도 초과 |

> 구현 시 `ApiResponse.error(message)` 패턴 유지. 전용 `code` 필드 추가는 선택(프론트 상수화 시 `adminShopCatalogErrors.js` 등 **문구 하드코딩 금지**).

### 5.2 tenant 격리 체크리스트

| 레이어 | 규칙 |
|--------|------|
| DDL | `tenant_id NOT NULL` |
| Repository | `findByIdAndTenantIdAndIsDeletedFalse`, `existsByTenantIdAndSkuCode...` |
| Service | `TenantContextHolder.getRequiredTenantId()` — null 쿼리 **금지** |
| 업로드 | 디스크 경로·DB URL 모두 tenant 스코프; 파일명에 타 tenant id **금지** |
| Client catalog | 세션 `user.tenantId`만; `skuCode` 단건 조회도 tenant 조건 필수 |
| File download | `FileController` — 요청 tenant와 저장 메타 일치 검증 |

### 5.3 파일 저장 경로 (Branding 패턴 정렬)

| 항목 | 값 |
|------|-----|
| 디스크 | `uploads/shop-catalog/{tenantId}/` |
| 저장 파일명 | `{tenantId}_{skuId}_{uuid}.{ext}` |
| 공개 URL prefix | `/api/v1/files/shop-catalog/` (기존 `FileController` 확장 또는 동일 컨트롤러 서브경로) |
| 레거시 prefix | `/api/files/logos/` — Shop **사용 안 함** |
| 암호화 저장 | Psych assessment용 `EncryptedFileStorageService` — catalog hero는 **공개 이미지**이므로 Branding과 동일 **평문 파일 + 인증 다운로드** (catalogVisible SKU만 익명 허용 여부는 보안 리뷰; 기본: **로그인 내담자·어드민**) |

**환경 설정 (하드코딩 금지)**

```properties
# application.yml 예시 키 (구현 시 상수 클래스로 노출)
shop.catalog.upload-dir=uploads/shop-catalog/
shop.catalog.max-image-bytes=5242880
shop.catalog.placeholder-hero-url=${SHOP_PLACEHOLDER_HERO_URL:}
```

---

## §6 core-coder 체크리스트·테스트 포인트

### 6.1 구현 체크리스트 (Phase B-1)

| # | 항목 | 완료 |
|---|------|:----:|
| 1 | Flyway `V20260523_001` + backfill·시드·runbook §1행 | ☐ |
| 2 | `ShopCatalogSku.heroImageUrl` · Repository·Service | ☐ |
| 3 | SKU 자동 `PKG-{tenantShort}-{seq}` · POST `skuCode` 거부 · PUT immutable | ☐ |
| 4 | Admin multipart POST/PUT + `POST .../hero-image` · MIME·5MB | ☐ |
| 5 | `ShopCatalogSkuUpsertRequest`에 `catalogCategory` · Admin DTO `heroImageUrl` | ☐ |
| 6 | Client `GET /catalog/{skuCode}` · `ShopCatalogSkuResponse.heroImageUrl` | ☐ |
| 7 | `FileController` shop-catalog 경로 · tenant 검증 | ☐ |
| 8 | Admin FE: 라우트 `/admin/shop/catalog-skus/new`, `.../:id/edit` · 모달 CRUD 제거 | ☐ |
| 9 | Client FE: `SkuCard`·PDP·placeholder · `safeDisplay` | ☐ |
| 10 | 상수: `adminShopApi.js`, `clientShopConstants.js` — URL·카피 하드코딩 0 | ☐ |
| 11 | `check-hardcode` Shop/catalog 경로 신규 위반 0 | ☐ |
| 12 | Go-Live·§17 multipart·tenant 항목 | ☐ |

**참조 스킬·문서**

- `.cursor/skills/core-solution-backend`, `core-solution-frontend`, `core-solution-api`, `core-solution-multi-tenant`
- `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`
- `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17
- `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`

### 6.2 단위·통합 테스트 (Maven)

| 테스트 클래스 | 시나리오 |
|---------------|----------|
| `AdminShopCatalogSkuServiceImplTest` | 자동 skuCode 발급·UK 충돌 재시도·PUT skuCode 불변·hero 필수 |
| `AdminShopCatalogSkuControllerMvcTest` | multipart 201·hero 없음 400·403 게이트·`skuCode` on create 400 |
| `ClientShopControllerMvcTest` | catalog 목록 `heroImageUrl`·`GET /catalog/{skuCode}` 200/404·tenant 격리 |

### 6.3 E2E (core-tester)

| Spec | 포인트 |
|------|--------|
| `admin-shop-catalog-skus-smoke.spec.ts` | 전용 등록 화면 진입·multipart 업로드·목록 썸네일 컬럼 또는 이미지 셀 |
| `client-shop-catalog-to-cart.spec.ts` | PLP 카드 `heroImageUrl` 또는 placeholder `data-testid` DOM assert (network idle 비의존) |

### 6.4 수동·OPS

| 항목 | 내용 |
|------|------|
| 기존 tenant backfill | placeholder 후 어드민에서 실이미지 업로드 |
| `seed-shop-demo-catalog.sql` | demo SKU에 `hero_image_url` |
| R10 | `ADMIN_SHOP_CATALOG` + `CLIENT_SHOP` activate 전제 |

---

## §7 변경 이력

| 일자 | 작성 | 내용 |
|------|------|------|
| 2026-05-19 | Phase A-2 (explore + 스펙) | 최초 작성 — `hero_image_url`, B안 multipart, `PKG-{tenantShort}-{seq}`, Admin/Client API |

---

**다음 단계**: Phase B-1 `core-coder` — 본 문서 + [SHOP_CATALOG_UX_MVP_PLUS_DESIGN_HANDOFF](./SHOP_CATALOG_UX_MVP_PLUS_DESIGN_HANDOFF.md) 및 화면설계서(A-1) 승인 후 구현.
