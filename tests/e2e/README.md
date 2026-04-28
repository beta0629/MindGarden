# E2E (Playwright)

`tests/e2e/tests/**/*.spec.ts` — 주로 ERP·관리자 흐름. 루트에서 `cd tests/e2e && npx playwright install --with-deps chromium` 후 `npx playwright test` (프로젝트·경로는 팀 표준 스크립트가 있으면 그에 따름).

설정 SSOT: [`playwright.config.ts`](./playwright.config.ts) (`BASE_URL`, 로컬 시 `webServer`로 `frontend`의 `npm start`).

## ERP / 관리자 로그인 스펙

Playwright가 **로그인 URL·navigation 타임아웃**으로 실패할 때 아래를 먼저 본다. 자격 증명은 [`docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`](../../docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) 보안 원칙에 따라 **문서·PR에 평문 금지**(변수명·Secrets·로컬 env만). 우선순위·기본값은 [`.cursor/skills/core-solution-testing/SKILL.md`](../../.cursor/skills/core-solution-testing/SKILL.md)·[`helpers/erpAuth.ts`](./helpers/erpAuth.ts) SSOT.

1. **`BASE_URL`**: `use.baseURL`과 동일(기본 `http://localhost:3000`). [`playwright.config.ts`](./playwright.config.ts) 참고.
2. **기동**: 백엔드 API **8080** + 프론트 **3000**이 함께 기동되고, 프론트 API 베이스가 **8080**과 맞는지 확인한다.
3. **로그인 환경 변수**: `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` 최우선, 없으면 `TEST_USERNAME` / `TEST_PASSWORD` 폴백(값은 Secrets·로컬 전용 env에만).
4. **계정**: **ERP 권한**이 있는 관리자(또는 동일 역할) 계정.
5. **타임아웃 시 점검 순서**: (1) 8080·인증 API (2) `BASE_URL`·3000·`webServer` (3) 자격 증명·ERP 권한 (4) `/api/v1/auth` 등 네트워크·trace — 수동 스모크와의 교차는 [`docs/guides/testing/ERP_FINANCIAL_HUB_SMOKE.md`](../../docs/guides/testing/ERP_FINANCIAL_HUB_SMOKE.md) **E2E 선행 조건** 절과 동일 블록(중복 정의 최소화).

## 레거시 안내

과거 `e2e-tests` 디렉터리 안내가 있었다면 폐기하고, 본 `tests/e2e` 트리·위 `playwright.config.ts`를 기준으로 한다.
