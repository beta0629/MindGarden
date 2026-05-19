# E2E (Playwright)

`tests/e2e/tests/**/*.spec.ts` — 주로 ERP·관리자 흐름. 루트에서 `cd tests/e2e && npx playwright install --with-deps chromium` 후 `npx playwright test` (프로젝트·경로는 팀 표준 스크립트가 있으면 그에 따름). 일부 관리자 스모크는 **콘솔 게이트**: React **#130**·**invalid child** 문자열만 실패로 간주하고 그 외 `console.error` 노이즈는 무시한다. 수집·필터 SSOT: [`helpers/react130ConsoleGate.ts`](./helpers/react130ConsoleGate.ts) (`admin-dashboard-lnb-console-smoke`, `integrated-schedule-client-notes` S5).

설정 SSOT: [`playwright.config.ts`](./playwright.config.ts) (`BASE_URL`, 로컬 시 `webServer`로 `frontend`의 `npm start`).

**로컬 회귀 — 스펙 경로**: `cd tests/e2e` 후 `npx playwright test`의 인자는 `testDir`(./tests) 기준이므로 `tests/admin/…spec.ts` 형태다. 저장소 루트에서 `tests/e2e/tests/admin/…`처럼 중복 prefix를 붙이면 파일을 찾지 못한다. 예: `npx playwright test tests/admin/integrated-schedule-detail-modal.spec.ts tests/admin/integrated-schedule-client-notes.spec.ts --project=chromium`.

**로컬 API(8080) 미기동**: `skipWhenLocalBackend8080Down()`가 있는 스펙은 전부 스킵되고, 없는 스펙(예: `integrated-schedule-detail-modal`)은 로그인 단계에서 타임아웃·실패할 수 있다 — 의미 있는 회귀는 8080+3000 기동 후 실행.

**dev-only 수동 스모크** (로컬 `127.0.0.1:8080` down · Playwright R10 **BLOCKED** 시, 5줄):

1. dev API: `curl -sS -o /dev/null -w "%{http_code}" https://dev.core-solution.co.kr/actuator/health` → **200** ([OPS 런북](../../docs/project-management/SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md) §4.1).
2. 프론트: `BASE_URL=https://mindgarden.dev.core-solution.co.kr` — 어드민·내담자 로그인(자격은 env·Secrets만; 문서·커밋 금지).
3. DB OPS: [activate + (선택) seed](../../docs/project-management/SHOP_REWARD_OPS_ACTIVATION_RUNBOOK.md#42-ops-실행-카드-tier-a--copy-paste) → `CLIENT_SHOP`·`CLIENT_REWARD`·`ADMIN_SHOP_CATALOG`·`catalogVisible=true` SKU ≥1.
4. 내담자: `/client/shop` PLP → SKU 담기 → `/client/shop/cart` 소계 ([수동 QA](../../docs/project-management/SHOP_REWARD_MANUAL_QA_RUN_SHEET.md) C1~C3).
5. 어드민: `/admin/shop/catalog-skus` 셸·테이블 로드(빈 목록 허용) — LNB 「쇼핑·리워드」 스크린샷 1장.

**R10 재현** (8080 up 후): `curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/actuator/health` → 200 이면 `cd tests/e2e && npx playwright test client-shop-catalog-to-cart admin-shop-catalog-skus-smoke --project=chromium`.
**dev API만 검증**: `E2E_API_BASE=https://dev.core-solution.co.kr` 등으로 `$E2E_API_BASE/actuator/health`가 **200**이면 8080 없이도 해당 가드 스킵을 해제한다(`helpers/erpAuth.ts`).

### dev 인천 테넌트 (`tenant-incheon-counseling-001`) — Shop·리워드 E2E

Tier-A·R10 재검증 시 **반드시** 아래를 맞춘다. `E2E_TENANT_ID`가 없으면 `loginClientWeb`·`loginErpUser`가 `/login`만 열어 **다른 테넌트 세션**·`CLIENT_SHOP` off·`client-shop-catalog-page` 미노출로 실패할 수 있다.

```bash
export E2E_TENANT_ID=tenant-incheon-counseling-001
# 관리자·내담자 계정은 위 tenant에 소속된 계정만 (Secrets·로컬 env, 문서·커밋 금지)
```

- OPS: [`activate-shop-reward-tenant-components.sql`](../../scripts/ops/activate-shop-reward-tenant-components.sql) → `CLIENT_SHOP`·`CLIENT_REWARD`·`ADMIN_SHOP_CATALOG` ACTIVE.
- (선택) [`seed-shop-demo-catalog.sql`](../../scripts/ops/seed-shop-demo-catalog.sql) → 어드민에 `DEV-CONSULT-DEMO-01` 노출.
- 내담자 Playwright 자격(`TEST_CLIENT_USERNAME` / `E2E_CLIENT_LOGIN_ID` 등)은 **해당 테넌트의 내담자**여야 한다.

- **SEC-01 (Playwright 후속)**: 공개 API·레이트리밋 등 H2/로컬 단일 스택에서 재현이 어려운 구간은 백엔드 단위·통합 테스트를 우선하고, E2E는 스테이징·자격 증명 Secrets가 갖춰진 환경에서만 보강한다.

## 내담자 쇼핑 (CLIENT_SHOP) — Playwright 전제

스펙: [`tests/client/client-shop-catalog-to-cart.spec.ts`](./tests/client/client-shop-catalog-to-cart.spec.ts) (`testDir` 기준 `./tests/client/…`) (PLP → 장바구니). SSOT: [`docs/project-management/SHOP_P2_INTEGRATION_TEST_REPORT.md`](../docs/project-management/SHOP_P2_INTEGRATION_TEST_REPORT.md) §6.1. **콘솔 게이트**: React **#130**만 실패·`Failed to load resource` **401/404(favicon)** 등 부가 네트워크 노이즈는 [`helpers/react130ConsoleGate.ts`](./helpers/react130ConsoleGate.ts) `BENIGN_CONSOLE_NETWORK_NOISE`로 무시(장바구니 API 성공과 무관).

| # | 전제 | 확인 |
|---|------|------|
| 1 | 백엔드 API **8080** + 프론트 **3000** (`BASE_URL`, API 베이스 8080 일치) 또는 `E2E_API_BASE` health **200** | `skipWhenLocalBackend8080Down()` (로컬·CI=false) |
| 2 | Flyway Shop P2 (**002~007**, 001 salary 충돌 해소) | DB·카탈로그 컬럼·`point_tenant_policies` |
| 3 | 테넌트 **`CLIENT_SHOP`**·**`CLIENT_REWARD`** 컴포넌트 활성 | 어드민 컴포넌트 또는 시드 |
| 3a | **`E2E_TENANT_ID`** — OPS·로그인과 동일 MindGarden tenant 문자열 ID (dev: `tenant-incheon-counseling-001`). **내담자·관리자 계정 모두 해당 tenant 소속** | 미설정 시 README §「dev 인천 테넌트」 경고·게이트 skip. `loginClientWeb`·`loginErpUser` → `/login?tenantId=` (`erpAuth.ts`) |
| 4 | 어드민에서 **`catalogVisible=true`** SKU ≥1 (활성 PLP 탭) | `shop-sku-add-first` testid 노출 |
| 5 | 내담자 로그인 자격 (`loginClientWeb` — `tests/e2e/helpers/erpAuth.ts`) | CI: `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD` 또는 `TEST_USERNAME`/`TEST_PASSWORD` |

**R10 실행 순서** (5줄, `tests/e2e` 디렉터리):

1. 백엔드 **8080** + 프론트 **3000** 기동 (`BASE_URL`·API 베이스 8080 일치).
2. Flyway Shop P2 **`002`~`007`** + **`V20260520_001`** + **`V20260521_001`** 적용 확인.
3. OPS **`activate-shop-reward-tenant-components.sql`** — `CLIENT_SHOP`·`CLIENT_REWARD`·`ADMIN_SHOP_CATALOG` 활성.
4. 어드민에서 **`catalogVisible=true`** SKU ≥1 (또는 `scripts/ops/seed-shop-demo-catalog.sql`).
5. `npx playwright test client-shop-catalog-to-cart --project=chromium` (내담자 자격: `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD` 또는 `TEST_USERNAME`/`TEST_PASSWORD`).

**회귀 명령** (위 1~4 충족 후):

```bash
npx playwright test client-shop-catalog-to-cart --project=chromium
```

PG·checkout 결제는 범위 외. 8080 미기동 시 스펙 전체 스킵(로그인 타임아웃 방지). 수동 QA 표: [`SHOP_REWARD_MANUAL_QA_RUN_SHEET.md`](../docs/project-management/SHOP_REWARD_MANUAL_QA_RUN_SHEET.md).

## 어드민 쇼핑·리워드 (ADMIN_SHOP_CATALOG) — Playwright 스모크

스펙: [`tests/admin/admin-shop-catalog-skus-smoke.spec.ts`](./tests/admin/admin-shop-catalog-skus-smoke.spec.ts). 전제: 8080+3000, ERP 어드민 자격, TenantComponent **`ADMIN_SHOP_CATALOG`** 활성(Maestro는 Expo 전용·어드민 웹 미지원). `cd tests/e2e` 후 `npx playwright test admin-shop-catalog-skus-smoke --project=chromium`.

## ERP / 관리자 로그인 스펙

Playwright가 **로그인 URL·navigation 타임아웃**으로 실패할 때 아래를 먼저 본다. 자격 증명은 [`docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`](../../docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) 보안 원칙에 따라 **문서·PR에 평문 금지**(변수명·Secrets·로컬 env만). 우선순위·기본값은 [`.cursor/skills/core-solution-testing/SKILL.md`](../../.cursor/skills/core-solution-testing/SKILL.md)·[`helpers/erpAuth.ts`](./helpers/erpAuth.ts) SSOT.

1. **`BASE_URL`**: `use.baseURL`과 동일(기본 `http://localhost:3000`). [`playwright.config.ts`](./playwright.config.ts) 참고.
2. **기동**: 백엔드 API **8080** + 프론트 **3000**이 함께 기동되고, 프론트 API 베이스가 **8080**과 맞는지 확인한다.
3. **로그인 환경 변수**: `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` 최우선, 없으면 `TEST_USERNAME` / `TEST_PASSWORD` 폴백(값은 Secrets·로컬 전용 env에만).
4. **계정**: **ERP 권한**이 있는 관리자(또는 동일 역할) 계정.

### CI(GitHub Actions 등) 필수

로그인·관리자 스모크가 **스킵되지 않고** 통과하려면 Secrets(또는 env)에 아래를 넣는다. 미설정 시 `helpers/erpAuth.ts`의 `skipWhenCiMissingE2eCredentials()`가 있는 스펙은 전체를 건너뛴다.

```bash
E2E_TEST_EMAIL=<관리자 이메일>
E2E_TEST_PASSWORD=<비밀번호>
BASE_URL=<프론트 URL>   # playwright.config.ts 기본과 동일하게
```

대안: `TEST_USERNAME` + `TEST_PASSWORD` 쌍을 함께 설정.
5. **타임아웃 시 점검 순서**: (1) 8080·인증 API (2) `BASE_URL`·3000·`webServer` (3) 자격 증명·ERP 권한 (4) `/api/v1/auth` 등 네트워크·trace — 수동 스모크와의 교차는 [`docs/guides/testing/ERP_FINANCIAL_HUB_SMOKE.md`](../../docs/guides/testing/ERP_FINANCIAL_HUB_SMOKE.md) **E2E 선행 조건** 절과 동일 블록(중복 정의 최소화).

### E2E_INTEGRATED_SCHEDULE_NOTES_CRUD

통합 스케줄(`/admin/integrated-schedule`)에서 일정 클릭 → `ScheduleDetailModal`의 **상세 | 특이사항** 탭, 휴가 이벤트 시 특이사항 비노출, 특이사항 CRUD·모달 UI 스모크는 `tests/e2e/tests/admin/integrated-schedule-*.spec.ts`에 모은다. 자격·기동은 위 절과 동일.

### GitHub Actions: `e2e-integrated-schedule-smoke` · `integrated-schedule-client-notes.spec.ts`

- 워크플로: [`.github/workflows/e2e-integrated-schedule-smoke.yml`](../../.github/workflows/e2e-integrated-schedule-smoke.yml). 스펙: [`tests/admin/integrated-schedule-client-notes.spec.ts`](./tests/admin/integrated-schedule-client-notes.spec.ts).
- **시크릿 게이트는 `e2e-consultation-log-smoke`와 동일**: `E2E_TEST_EMAIL` 또는 `E2E_ADMIN_USERNAME`이 비어 있지 않을 때만 Node·npm·Playwright 스텝이 돈다. 없으면 이후 스텝 생략·잡은 녹색(포크 PR 등).
- CI에서 `BASE_URL`은 `E2E_BASE_URL` 우선, 없으면 `http://localhost:3000` → 로컬호스트면 `playwright.config.ts`의 `webServer`로 **프론트(3000)만** 뜬다. **8080 백엔드 기동은 이 워크플로에 없음** — 의미 있는 통과는 API·로그인이 이미 열린 URL(self-hosted·스테이징 등) 전제.
- 로컬: `skipWhenLocalBackend8080Down()`이 **CI가 아닐 때만** 8080을 프로브하므로, 로컬 재현은 8080+3000(또는 README의 기동 절) 후 동일 스펙 실행.

## 레거시 안내

과거 `e2e-tests` 디렉터리 안내가 있었다면 폐기하고, 본 `tests/e2e` 트리·위 `playwright.config.ts`를 기준으로 한다.
