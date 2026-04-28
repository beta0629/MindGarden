# 다음 세션 — 로컬 검증 명령 (복사 실행)

**목적**: 터미널을 새로 열었을 때 **순서만 맞추면** ERP 스모크·회귀 테스트를 바로 돌릴 수 있게 한다.  
**선행**: [ERP_FINANCIAL_HUB_SMOKE.md](../guides/testing/ERP_FINANCIAL_HUB_SMOKE.md) 「E2E 선행 조건 (로컬)」·[`tests/e2e/README.md`](../../tests/e2e/README.md).

**주의**: `E2E_TEST_*` / `TEST_*` 값은 **저장소에 커밋하지 말 것**. 로컬 셸·`.env`·CI Secrets만 사용한다.

---

## 1. 백엔드 (터미널 A)

```bash
cd /Users/mind/mindGarden && mvn spring-boot:run
```

팀 표준이 `spring-boot:run`이 아니면 동일 목표의 기동 명령으로 바꾼다. API는 **8080**이 기본이다.

---

## 2. 프론트 (터미널 B)

```bash
cd /Users/mind/mindGarden/frontend && npm start
```

기본 **3000**. `REACT_APP_API_BASE_URL` 등은 로컬 분기(`environment.js`)와 맞출 것.

---

## 3. ERP Playwright — 로그인 스펙 (터미널 C)

**zsh**: `mvn -Dtest=...*` 는 글로브로 깨지므로 **항상 작은따옴표**로 감싼다.

```bash
cd /Users/mind/mindGarden/tests/e2e && \
export BASE_URL=http://localhost:3000 && \
export E2E_TEST_EMAIL='로컬_관리자_이메일' && \
export E2E_TEST_PASSWORD='로컬_비밀번호' && \
npx playwright test tests/erp/ --project=chromium
```

로그인 없이 **리다이렉트만** 빠르게 보려면:

```bash
cd /Users/mind/mindGarden/tests/e2e && BASE_URL=http://localhost:3000 npx playwright test tests/erp/erp-legacy-path-redirects.spec.ts --project=chromium
```

---

## 4. 프론트 lint + Jest (한 줄)

```bash
cd /Users/mind/mindGarden/frontend && npm run lint:check && npm test -- --watchAll=false --testPathPattern="passwordPolicyUi|MenuPermission|FinancialManagement" --passWithNoTests
```

---

## 5. 백엔드 AdminService 관련 단위 테스트 (예시 클래스명)

```bash
cd /Users/mind/mindGarden && mvn -q test '-Dtest=AdminServiceImplConfirmDepositApproveTest,AdminServiceImplRegisterClientContactTest,AdminServiceImplUpdateClientTest'
```

클래스 목록은 `rg "class Admin.*Test" src/test/java` 로 갱신해도 된다.

---

## 6. 전체 컴파일만

```bash
cd /Users/mind/mindGarden && mvn -q -DskipTests compile
```

---

**갱신**: 문서·스크립트 경로가 바뀌면 이 파일과 `ERP_FINANCIAL_HUB_SMOKE.md`를 함께 맞춘다.
