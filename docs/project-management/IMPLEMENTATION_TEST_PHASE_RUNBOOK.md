# 구현·테스트 단계 직전 런북 (복사 실행)

**전제**: `develop` 최신, 문서 SSOT는 [ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md](./ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md), 무중단 갭은 [ZERO_DOWNTIME_GAP_AND_ROADMAP.md](../deployment/ZERO_DOWNTIME_GAP_AND_ROADMAP.md).

---

## 0. 한 번에 상태 확인

```bash
cd /Users/mind/mindGarden && git status -sb && git pull origin develop
```

---

## 1. 백엔드 컴파일·관련 테스트 (zsh는 `-Dtest` 값을 **따옴표**로)

```bash
cd /Users/mind/mindGarden && mvn -q -DskipTests compile
```

```bash
cd /Users/mind/mindGarden && mvn -q test '-Dtest=AdminServiceImplConfirmDepositApproveTest,AdminServiceImplRegisterClientContactTest,AdminServiceImplUpdateClientTest'
```

(RESV·알림톡 배치 시 `Notification*`·`TenantKakao*` 테스트를 체크리스트에 맞춰 추가.)

---

## 2. 프론트 lint·Jest

```bash
cd /Users/mind/mindGarden/frontend && npm run lint:check && npm test -- --watchAll=false --testPathPattern="passwordPolicyUi|MenuPermission|FinancialManagement|PasswordChange" --passWithNoTests
```

---

## 3. E2E — 로그인 없음(항상 가능)

```bash
cd /Users/mind/mindGarden/tests/e2e && BASE_URL=http://localhost:3000 npx playwright test tests/erp/erp-legacy-path-redirects.spec.ts --project=chromium
```

---

## 4. E2E — ERP 전체(백엔드 8080 + 계정 env 필요)

[ERP_FINANCIAL_HUB_SMOKE.md](../guides/testing/ERP_FINANCIAL_HUB_SMOKE.md) 「E2E 선행 조건」·[NEXT_LOCAL_VERIFICATION_COMMANDS.md](./NEXT_LOCAL_VERIFICATION_COMMANDS.md) 준수.

```bash
cd /Users/mind/mindGarden/tests/e2e && \
export BASE_URL=http://localhost:3000 && \
export E2E_TEST_EMAIL='…' && export E2E_TEST_PASSWORD='…' && \
npx playwright test tests/erp/ --project=chromium
```

---

## 5. 배포 직후(워크플로 변경 PR이 있을 때)

[ZERO_DOWNTIME_POST_DEPLOY_CHECKLIST.md](../guides/testing/ZERO_DOWNTIME_POST_DEPLOY_CHECKLIST.md)

---

## 6. 기획 순서 알림

다음 **단일 구현 PR**은 ONGOING·플래너 기준 **RESV-ALIM-P0** 우선, **ZERO-DT 정적 스왑**은 RESV 머지 후 별 PR로 진행한다.
