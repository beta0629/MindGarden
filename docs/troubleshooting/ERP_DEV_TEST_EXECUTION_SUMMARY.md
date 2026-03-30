# ERP 개발 서버 테스트 실행 결과 요약

**작성일**: 2025-03-04  
**작업**: core-tester — ERP 테스트 시나리오 작성·실행·검토 (코드 구현 수정 없음)

---

## 1. 수행 내용 요약

| 항목 | 내용 |
|------|------|
| **테스트 데이터 가이드** | `docs/troubleshooting/ERP_DEV_TEST_DATA_GUIDE.md` — 테넌트·사용자·회계 데이터 준비 절차, 기존 `erp_test_data_*.sql` 참고 및 tenant_id 주의 사항 |
| **재무제표 API 테스트 스크립트** | `scripts/testing/test-erp-statements-api.sh` — `GET statements/balance`, `GET statements/income` 호출 및 HTTP 200·success 검증. 사용법: `BASE_URL`, `TENANT_ID`, `COOKIE`(선택) |
| **스케줄러 검증 시나리오** | `docs/troubleshooting/ERP_SCHEDULER_TEST_SCENARIOS.md` — ErpAutomationScheduler 작업 목록, 단위/수동 검증 체크리스트, 수정 제안 방향 |
| **E2E 시나리오** | `tests/e2e/tests/erp/erp-menu-and-list.spec.ts` — E2E-1~E2E-7 (ERP 메뉴 접근, 대시보드, 구매/재무/예산/아이템, 어드민 재무) |

---

## 2. 실행 결과 (개발 서버 기준)

### 2.1 재무제표 API (`test-erp-statements-api.sh`)

- **대상 URL**: `https://dev.core-solution.co.kr` (config 기준)
- **실행**: `BASE_URL=https://dev.core-solution.co.kr TENANT_ID=dev ./scripts/testing/test-erp-statements-api.sh`
- **결과**: curl **exit code 60** (SSL 인증서/연결 문제로 응답 미수). HTTP 코드 000.
- **해석**:  
  - 인증 없이 호출 시 서버에 따라 **401 Unauthorized** 또는 **403 Forbidden**이 예상됨 (재무제표 API는 세션 인증 사용).  
  - 실제 200 검증을 하려면 **브라우저에서 로그인 후 JSESSIONID 쿠키**를 복사해 `COOKIE="JSESSIONID=..."` 로 넘기거나, 동일 도메인에서 로그인 API로 쿠키를 받아 사용해야 함.  
  - SSL 오류는 클라이언트/네트워크 환경에 따라 다를 수 있음.

### 2.2 E2E (Playwright)

- **실행**: `npx playwright test tests/erp/erp-menu-and-list.spec.ts --project=chromium` (tests/e2e 디렉터리에서)
- **결과**: **실패** — `Process from config.webServer exited early`
- **원인**: `playwright.config.ts`의 `webServer.command`가 `echo "..."` 로 설정되어 있어, Playwright가 이 명령을 서버로 기대하고 실행한 뒤 프로세스가 즉시 종료됨.
- **권장**:
  - **로컬 서버로 E2E**: 로컬에서 `./scripts/start-all.sh` 등으로 프론트/백엔드 실행 후 `BASE_URL=http://localhost:3000` (기본값)으로 Playwright 실행. 이때 webServer가 echo를 실행하면 동일 오류가 나므로, **로컬 서버를 수동으로 띄운 뒤** `reuseExistingServer: true`로 이미 떠 있는 서버를 쓰도록 두거나, webServer 구간을 조건부로 비활성화하는 설정 변경이 필요함 (구현은 core-coder에 위임).
  - **개발 서버(https://dev.core-solution.co.kr)로 E2E**: `BASE_URL=https://dev.core-solution.co.kr` 로 실행하고, webServer를 사용하지 않도록 설정이 바뀌어야 함 (예: `BASE_URL`이 localhost가 아닐 때 webServer 생략).

---

## 3. 시나리오·체크리스트 요약

### 3.1 재무제표 API

- **balance**: `GET /api/v1/erp/accounting/statements/balance?asOfDate={date}` — 200, `success: true`, `data.assets/liabilities/equity`, `data.isBalanced` 등.
- **income**: `GET /api/v1/erp/accounting/statements/income?startDate={}&endDate={}` — 200, `success: true`, `data.revenue/expenses/netIncome`.
- **인증**: 세션 쿠키 필요. 테넌트는 세션 또는 `X-Tenant-Id` 헤더.

### 3.2 ErpAutomationScheduler

- **검증 포인트**: 테넌트 순회, `TenantContextHolder.setTenantId` 설정, 재무제표/정산/원장 동기화 등 각 작업별 호출 여부 및 예외 시 다음 테넌트 진행.
- **수동 트리거**: 관리용 API 또는 통합 테스트에서 스케줄러 메서드 직접 호출 (구현은 core-coder).

### 3.3 ERP 화면 (E2E)

- **E2E-1**: LNB에서 ERP 링크 클릭 → URL에 `/erp/`, ERP 관련 영역 노출.
- **E2E-2**: `/erp/dashboard` 로드.
- **E2E-3~E2E-6**: `/erp/purchase`, `/erp/financial`, `/erp/budget`, `/erp/items` 각각 로드.
- **E2E-7**: `/admin/erp/financial` (통합 재무 대시보드) 로드.

---

## 4. 실패 케이스별 원인 및 수정 제안

| 케이스 | 원인 | 수정 제안 (담당: core-coder 등) |
|--------|------|--------------------------------|
| 재무제표 API curl 401/403 | 세션 미인증 | 스크립트 사용 시 로그인 후 `COOKIE` 전달. 또는 개발/테스트용 API 키·토큰 지원 검토. |
| 재무제표 API curl SSL(60) | 인증서/연결 문제 | 클라이언트 환경·프록시 확인. 필요 시 `curl -k`는 보안상 비권장이므로, 개발 서버 SSL 설정 점검. |
| E2E webServer exited early | webServer.command가 echo로 설정됨 | BASE_URL이 원격(dev 등)일 때 webServer 비활성화, 또는 로컬만 사용 시 실제 서버 실행 명령으로 변경. |

---

## 5. 산출물 목록

- `docs/troubleshooting/ERP_DEV_TEST_DATA_GUIDE.md` — 테스트 데이터 준비 가이드
- `docs/troubleshooting/ERP_SCHEDULER_TEST_SCENARIOS.md` — ErpAutomationScheduler 검증 시나리오
- `docs/troubleshooting/ERP_DEV_TEST_EXECUTION_SUMMARY.md` — 본 요약
- `scripts/testing/test-erp-statements-api.sh` — 재무제표 API 호출 스크립트
- `tests/e2e/tests/erp/erp-menu-and-list.spec.ts` — ERP 메뉴·목록 E2E 시나리오

---

## 6. 참조

- `docs/planning/ERP_TEST_SCENARIOS.md`
- `docs/project-management/ERP_COMPREHENSIVE_AUDIT_PLAN.md` §9.3(3-3)
- `docs/standards/TESTING_STANDARD.md`
