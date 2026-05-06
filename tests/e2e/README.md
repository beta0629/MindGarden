# E2E (Playwright)

`tests/e2e/tests/**/*.spec.ts` — 주로 ERP·관리자 흐름. 루트에서 `cd tests/e2e && npx playwright install --with-deps chromium` 후 `npx playwright test` (프로젝트·경로는 팀 표준 스크립트가 있으면 그에 따름). 일부 관리자 스모크는 **콘솔 게이트**: React **#130**·**invalid child** 문자열만 실패로 간주하고 그 외 `console.error` 노이즈는 무시한다. 수집·필터 SSOT: [`helpers/react130ConsoleGate.ts`](./helpers/react130ConsoleGate.ts) (`admin-dashboard-lnb-console-smoke`, `integrated-schedule-client-notes` S5).

설정 SSOT: [`playwright.config.ts`](./playwright.config.ts) (`BASE_URL`, 로컬 시 `webServer`로 `frontend`의 `npm start`).

**로컬 회귀 — 스펙 경로**: `cd tests/e2e` 후 `npx playwright test`의 인자는 `testDir`(./tests) 기준이므로 `tests/admin/…spec.ts` 형태다. 저장소 루트에서 `tests/e2e/tests/admin/…`처럼 중복 prefix를 붙이면 파일을 찾지 못한다. 예: `npx playwright test tests/admin/integrated-schedule-detail-modal.spec.ts tests/admin/integrated-schedule-client-notes.spec.ts --project=chromium`.

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
