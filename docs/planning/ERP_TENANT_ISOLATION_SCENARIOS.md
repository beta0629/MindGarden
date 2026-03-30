# ERP 테넌트 격리 시나리오

**작성일**: 2025-03-04  
**목적**: Phase 4 검증용 — 테넌트 A/B 로그인 시 ERP 데이터 격리 및 tenantId 미전달 시 400/403 반환 확인  
**전제**: Phase 1(tenant 안정화), Phase 2(API 경로 `/api/v1/erp` 통일), Phase 3(메뉴·라우트 정리) 적용 완료

---

## 1. 테넌트 A / B 데이터 격리 시나리오

### 1.1 공통 전제

- **테넌트 A**: `tenant-a-uuid` (예: 테넌트 A 소속 사용자만 사용)
- **테넌트 B**: `tenant-b-uuid` (예: 테넌트 B 소속 사용자만 사용)
- 각 테넌트에 **ERP_ACCESS** 권한이 있는 사용자로 로그인
- 세션/헤더에 해당 테넌트의 `tenantId`가 설정된 상태에서 API 호출

### 1.2 아이템(Items) 격리

| 시나리오 ID | 설명 | Given | When | Then |
|-------------|------|-------|------|------|
| T-ITEM-1 | 테넌트 A 로그인 후 아이템 목록 조회 | 테넌트 A 사용자 로그인, A에만 아이템 3건 등록 | `GET /api/v1/erp/items` (A 세션) | 200, `data`에 테넌트 A 소속 아이템만 포함, 개수 3 |
| T-ITEM-2 | 테넌트 B 로그인 후 아이템 목록 조회 | 테넌트 B 사용자 로그인, B에만 아이템 2건 등록 | `GET /api/v1/erp/items` (B 세션) | 200, `data`에 테넌트 B 소속 아이템만 포함, 개수 2 |
| T-ITEM-3 | A에서 등록한 아이템이 B 목록에 없음 | T-ITEM-1 수행 후 B로 로그인 | `GET /api/v1/erp/items` (B 세션) | 200, A에서 등록한 아이템 ID가 응답 배열에 없음 |
| T-ITEM-4 | 테넌트 A에서 아이템 등록 | 테넌트 A 사용자 로그인 | `POST /api/v1/erp/items` (A 세션, body에 name/category 등) | 201, 생성된 항목의 `tenantId`가 A와 일치 |

### 1.3 구매요청(Purchase Requests) 격리

| 시나리오 ID | 설명 | Given | When | Then |
|-------------|------|-------|------|------|
| T-PR-1 | 테넌트 A 구매요청 목록 조회 | 테넌트 A 사용자 로그인, A에 구매요청 2건 존재 | `GET /api/v1/erp/purchase-requests` (A 세션) | 200, A 소속 구매요청만 반환 |
| T-PR-2 | 테넌트 B 구매요청 목록 조회 | 테넌트 B 사용자 로그인, B에 구매요청 1건 존재 | `GET /api/v1/erp/purchase-requests` (B 세션) | 200, B 소속 구매요청만 반환 |
| T-PR-3 | A 구매요청이 B 목록에 없음 | T-PR-1에서 반환된 ID 하나 기록 후 B로 로그인 | `GET /api/v1/erp/purchase-requests` (B 세션) | 200, A의 구매요청 ID가 목록에 없음 |
| T-PR-4 | 테넌트 A에서 구매요청 등록 | 테넌트 A 사용자 로그인 | `POST /api/v1/erp/purchase-requests` (A 세션, 유효 body) | 201, 생성된 구매요청의 `tenantId`가 A와 일치 |

### 1.4 재무(Finance) 격리

| 시나리오 ID | 설명 | Given | When | Then |
|-------------|------|-------|------|------|
| T-FIN-1 | 테넌트 A 재무 대시보드 | 테넌트 A 사용자 로그인, A에 거래 데이터 존재 | `GET /api/v1/erp/finance/dashboard` (A 세션) | 200, 응답에 A 테넌트 데이터만 반영(통계/요약가 A 기준) |
| T-FIN-2 | 테넌트 B 재무 대시보드 | 테넌트 B 사용자 로그인, B에 거래 데이터 존재 | `GET /api/v1/erp/finance/dashboard` (B 세션) | 200, B 테넌트 데이터만 반영 |
| T-FIN-3 | 테넌트 A 거래 목록 조회 | 테넌트 A 사용자 로그인 | `GET /api/v1/erp/finance/transactions` (A 세션) | 200, `data`에 A 소속 거래만 포함 |
| T-FIN-4 | 테넌트 A에서 지출 등록 | 테넌트 A 사용자 로그인 | `POST /api/v1/erp/finance/quick-expense` (A 세션, category/amount 등) | 200/201, 생성된 거래의 tenantId가 A |

### 1.5 예산(Budgets) 격리

| 시나리오 ID | 설명 | Given | When | Then |
|-------------|------|-------|------|------|
| T-BUD-1 | 테넌트 A 예산 목록 조회 | 테넌트 A 사용자 로그인, A에 예산 2건 존재 | `GET /api/v1/erp/budgets` (A 세션) | 200, A 소속 예산만 반환 |
| T-BUD-2 | 테넌트 B 예산 목록 조회 | 테넌트 B 사용자 로그인, B에 예산 1건 존재 | `GET /api/v1/erp/budgets` (B 세션) | 200, B 소속 예산만 반환 |
| T-BUD-3 | A 예산이 B 목록에 없음 | T-BUD-1에서 반환된 예산 ID 기록 후 B로 로그인 | `GET /api/v1/erp/budgets` (B 세션) | 200, A의 예산 ID가 목록에 없음 |
| T-BUD-4 | 테넌트 A에서 예산 등록 | 테넌트 A 사용자 로그인 | `POST /api/v1/erp/budgets` (A 세션, 유효 body) | 201, 생성된 예산의 tenantId가 A와 일치 |

---

## 2. tenantId 없이 API 호출 시 400/403 반환 시나리오

**전제**: 인증 토큰(세션)은 있으나, **테넌트 컨텍스트가 설정되지 않은 상태** (예: TenantContextHolder에 tenantId 없음, 또는 X-Tenant-ID 미전달·세션에 tenantId 없음).

| 시나리오 ID | 설명 | When | Then |
|-------------|------|------|------|
| T-NO-1 | tenantId 없이 아이템 목록 조회 | `GET /api/v1/erp/items` (인증 O, tenantId 없음) | **403** 또는 **400**, body에 "테넌트" 관련 메시지 포함. `data`에 타 테넌트 데이터 노출 없음 |
| T-NO-2 | tenantId 없이 구매요청 목록 조회 | `GET /api/v1/erp/purchase-requests` (인증 O, tenantId 없음) | **403** 또는 **400** |
| T-NO-3 | tenantId 없이 재무 대시보드 조회 | `GET /api/v1/erp/finance/dashboard` (인증 O, tenantId 없음) | **403** 또는 **400** (세션에서 tenantId 미취득 시) |
| T-NO-4 | tenantId 없이 예산 목록 조회 | `GET /api/v1/erp/budgets` (인증 O, tenantId 없음) | **403** 또는 **400** |
| T-NO-5 | tenantId 없이 거래 등록 시도 | `POST /api/v1/erp/finance/transactions` (인증 O, tenantId 없음) | **403** 또는 **400**, 거래 생성되지 않음 |
| T-NO-6 | tenantId 없이 빠른 지출 시도 | `POST /api/v1/erp/finance/quick-expense` (인증 O, tenantId 없음) | **403** 또는 **400** |

**참고**: 현재 ErpController의 `getAllItems()` 등은 `TenantContextHolder.getTenantId()`가 null/empty일 때 **403**과 "테넌트 정보를 찾을 수 없습니다." 반환. 통합 테스트에서 인증은 유지하고 TenantContext를 비우거나, 테넌트 미설정 사용자로 호출하여 검증.

---

## 3. 검증 시 주의사항

- **테스트 데이터**: 테넌트 A/B용 데이터는 동적 생성(UUID, TestDataBuilder 등). 하드코딩된 tenantId/ID 금지(표준).
- **인증**: 통합 테스트 시 `@BeforeEach`에서 로그인 후 토큰 획득, **X-Tenant-ID** 헤더에 해당 테넌트 값 설정 후 API 호출.
- **격리 실패 시**: 다른 테넌트 데이터가 보이면 보안·격리 위반이므로 즉시 수정 대상.

---

## 4. 참조

- `docs/planning/ERP_SECTION_AUDIT_AND_PLANNING.md` Phase 4
- `docs/standards/TESTING_STANDARD.md` — 테넌트 격리 테스트, 통합 테스트 헤더
- `docs/standards/API_DESIGN_STANDARD.md` — 테넌트 격리 원칙
