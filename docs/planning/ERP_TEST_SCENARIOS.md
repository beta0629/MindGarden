# ERP E2E·통합 테스트 시나리오

**작성일**: 2025-03-04  
**목적**: Phase 4 — ERP 메뉴 접근, 목록 조회, 등록/수정 플로우에 대한 E2E 및 API 통합 테스트 시나리오 정리  
**전제**: Phase 1~3 적용 완료. core-tester는 시나리오 문서화·제안만 수행하며, 실제 테스트 코드 구현은 core-coder 또는 별도 태스크에서 진행.

---

## 1. 기존 테스트 현황

### 1.1 백엔드

- **ErpProcedureJournalEntryIntegrationTest** (`src/test/java/.../integration/ErpProcedureJournalEntryIntegrationTest.java`)
  - ERP **프로시저 자동 분개 생성** 통합 테스트 (ApplyDiscountAccounting, ProcessDiscountRefund, FinancialTransactionService.createTransaction).
  - **테넌트**: `TenantContextHolder.setTenantId("test-tenant-001")` 사용.
  - **범위**: 회계 분개·거래 생성 연동만 해당. **메뉴/라우트/아이템·구매요청·예산 CRUD API**는 미포함.

### 1.2 E2E (Playwright)

ERP 관련 Playwright 스펙은 `tests/e2e/tests/erp/`에 있으며, 예로 `erp-legacy-path-redirects.spec.ts`(로그인 없이 레거시 경로 → 정규 경로 리다이렉트), `erp-approval-hub-redirect.spec.ts`(승인 허브 라우트·리다이렉트 및 일부 로그인 시나리오), `erp-menu-and-list.spec.ts`(ERP 권한 사용자로 대시보드·구매·재무·예산·아이템 등 화면 진입)가 있다. 일반 인증·관리자·상담사 등 비ERP 스펙은 상위 `tests/e2e/tests/`의 `auth.spec.ts`, `admin/`, `consultant/` 등에 그대로 둔다. GitHub Actions `.github/workflows/e2e-erp-smoke.yml`는 `frontend`에서 `npm run verify:erp`를 실행한 뒤, Chromium으로 `erp-legacy-path-redirects.spec.ts` 전체와 `erp-approval-hub-redirect.spec.ts`를 `--grep "super-approvals"`로 **일부만** 돌린다. 따라서 로그인·백엔드 API에 의존하는 `erp-menu-and-list.spec.ts` 전체와 승인 허브의 admin 로드 케이스 등은 **스모크 워크플로에 포함되지 않을 수 있다**. 전 로그인형 ERP E2E를 CI에서 보려면 별도 워크플로 또는 수동 실행으로 해당 스펙을 추가해야 한다.

### 1.3 결론

“ERP 전용 E2E가 없다”는 과거 서술은 더 이상 맞지 않으며, 리다이렉트·승인·메뉴/목록 조회까지 저장소에 스펙이 존재한다. 다만 PR 스모크는 정적 `verify:erp`와 제한된 Playwright 실행만 보장하므로, 문서 §3 표의 모든 행이 매번 CI에서 검증된다고 읽어서는 안 된다. API 통합(API-1~11)과 표에서 다루는 등록/수정·권한 부정 시나리오(E2E-8·9 등)는 여전히 구현·보강 대상일 수 있다. 아래 §2·§3은 확장·정합 시 참고용이며, 구현 시 `docs/standards/TESTING_STANDARD.md` 및 `docs/planning/ERP_TENANT_ISOLATION_SCENARIOS.md`와 함께 사용한다.

---

## 2. API 통합 테스트 시나리오 (제안)

**환경**: `@SpringBootTest(webEnvironment = RANDOM_PORT)`, `MockMvc`, 인증 토큰 + `X-Tenant-ID` 헤더.

| ID | 시나리오 | Given | When | Then |
|----|----------|-------|------|------|
| API-1 | ERP 아이템 목록 조회 성공 | 테넌트 사용자 로그인, 해당 테넌트에 아이템 존재 | `GET /api/v1/erp/items` (Authorization, X-Tenant-ID) | 200, `success: true`, `data` 배열, 모든 항목 tenantId 일치 |
| API-2 | ERP 아이템 등록 성공 | 테넌트 사용자 로그인 | `POST /api/v1/erp/items` (유효 body) | 201, 생성된 항목 tenantId = 요청 테넌트 |
| API-3 | ERP 아이템 수정 성공 | 해당 테넌트 소유 아이템 존재 | `PUT /api/v1/erp/items/{id}` (유효 body) | 200, 수정 반영 |
| API-4 | 구매요청 목록 조회 성공 | 테넌트 사용자 로그인 | `GET /api/v1/erp/purchase-requests` (Authorization, X-Tenant-ID) | 200, 해당 테넌트 구매요청만 |
| API-5 | 구매요청 등록 성공 | 테넌트 사용자 로그인 | `POST /api/v1/erp/purchase-requests` (유효 body) | 201, tenantId 일치 |
| API-6 | 재무 대시보드 조회 성공 | 테넌트 사용자 로그인 | `GET /api/v1/erp/finance/dashboard` | 200, 테넌트별 통계/데이터 |
| API-7 | 재무 거래 목록 조회 | 테넌트 사용자 로그인 | `GET /api/v1/erp/finance/transactions` | 200, 해당 테넌트 거래만 |
| API-8 | 빠른 지출 등록 | 테넌트 사용자 로그인 | `POST /api/v1/erp/finance/quick-expense` (category, amount 등) | 200/201, 생성 거래 tenantId 일치 |
| API-9 | 예산 목록 조회 성공 | 테넌트 사용자 로그인 | `GET /api/v1/erp/budgets` | 200, 해당 테넌트 예산만 |
| API-10 | tenantId 없이 호출 시 403/400 | 인증 O, X-Tenant-ID/세션 tenant 없음 | `GET /api/v1/erp/items` | 403 또는 400, 테넌트 관련 메시지 |
| API-11 | ERP 권한 없이 호출 시 403 | ERP_ACCESS 없는 사용자 로그인 | `GET /api/v1/erp/items` | 403, "ERP 접근 권한" 관련 메시지 |

**구현 시 참고**: `docs/standards/TESTING_STANDARD.md` 통합 테스트 섹션 — `Authorization: Bearer {token}`, `X-Tenant-ID: {tenantId}` 필수.

---

## 3. E2E 테스트 시나리오 (제안)

**환경**: Playwright, 구현 스펙은 `tests/e2e/tests/erp/`(`erp-menu-and-list.spec.ts` 등). baseURL·백엔드 가용 여부에 따라 로그인 후 케이스는 실패할 수 있음.

| ID | 시나리오 | Given | When | Then |
|----|----------|-------|------|------|
| E2E-1 | ERP 메뉴 접근 | 로그인(ERP 권한 있는 사용자) | LNB에서 "ERP 관리" 또는 동일 메뉴 클릭 → "ERP 대시보드" 또는 "구매 관리" 등 진입 | URL에 `/erp/` 포함, ERP 관련 제목/목록 또는 대시보드 영역 노출 |
| E2E-2 | ERP 대시보드 화면 로드 | 로그인(ERP 권한) | `/erp/dashboard` 이동 | 200, 대시보드 위젯/통계 영역 로드 (에러 토스트 없음) |
| E2E-3 | 구매 관리 목록 조회 | 로그인(ERP 권한) | `/erp/purchase` 이동 | 구매 목록 테이블 또는 카드 노출, 로딩 후 데이터 또는 빈 목록 메시지 |
| E2E-4 | 재무 관리 목록 조회 | 로그인(ERP 권한) | `/erp/financial` 이동 | 재무/거래 목록 또는 대시보드 영역 노출 |
| E2E-5 | 예산 관리 목록 조회 | 로그인(ERP 권한) | `/erp/budget` 이동 | 예산 목록 또는 예산 관리 UI 노출 |
| E2E-6 | 아이템 관리 목록 조회 | 로그인(ERP 권한) | `/erp/items` 이동 | 아이템 목록 테이블/그리드 노출 |
| E2E-7 | 아이템 등록 플로우(있을 경우) | `/erp/items` 화면 | "등록" 또는 "추가" 버튼 클릭 → 폼 입력 → 제출 | 성공 시 목록에 새 항목 반영 또는 성공 메시지 |
| E2E-8 | 구매요청 등록 플로우(있을 경우) | `/erp/purchase-requests` 화면 | 새 구매요청 작성 → 제출 | 성공 시 목록에 반영 또는 성공 메시지 |
| E2E-9 | ERP 권한 없을 때 메뉴 비노출 또는 접근 거부 | 로그인(ERP_ACCESS 없는 사용자) | LNB 확인 또는 `/erp/dashboard` 직접 이동 | ERP 메뉴 비노출 또는 403/리다이렉트/권한 메시지 |

**각주 (표 ID ↔ `erp-menu-and-list.spec.ts` 테스트 제목)**: ¹ 동일 ID `E2E-7`로는 어드민 통합 재무(`/admin/erp/financial`) 접근·탭 시나리오가 구현되어 있어, 본 표의 “아이템 등록” 서술과 불일치한다. ² `E2E-8`에 해당하는 이름의 테스트는 현재 해당 스펙에 없다. ³ `E2E-9`에 해당하는 이름의 테스트는 현재 해당 스펙에 없다.

**구현 시 참고**: `docs/standards/TESTING_STANDARD.md` E2E 섹션, `tests/e2e/playwright.config.ts` baseURL. 테스트 데이터는 동적 생성, 하드코딩 ID 금지.

---

## 4. 테스트 구현 제안 요약

1. **API 통합 테스트**
   - **위치**: `src/test/java/com/coresolution/consultation/integration/erp/` (예: `ErpControllerIntegrationTest.java`).
   - **내용**: 위 API-1 ~ API-11 시나리오를 `@DisplayName`과 Given-When-Then으로 구현. 테넌트 격리는 `ERP_TENANT_ISOLATION_SCENARIOS.md`의 T-ITEM-1~T-NO-6와 연계 가능.
2. **E2E 테스트**
   - **위치**: `tests/e2e/tests/erp/` (`erp-menu-and-list.spec.ts`, `erp-legacy-path-redirects.spec.ts`, `erp-approval-hub-redirect.spec.ts` 등).
   - **내용**: E2E-1 ~ E2E-9(상기 각주·CI 스모크 범위 참고). 로그인 픽스처는 `helpers/erpAuth` 등 공통 모듈 활용.
3. **실제 코드 작성**: core-coder 또는 별도 태스크에서 진행. core-tester는 시나리오 문서·체크리스트 제공만 수행.

---

## 5. 참조

- `docs/planning/ERP_SECTION_AUDIT_AND_PLANNING.md` Phase 4
- `docs/planning/ERP_TENANT_ISOLATION_SCENARIOS.md`
- `docs/standards/TESTING_STANDARD.md`
- `docs/standards/API_DESIGN_STANDARD.md`
