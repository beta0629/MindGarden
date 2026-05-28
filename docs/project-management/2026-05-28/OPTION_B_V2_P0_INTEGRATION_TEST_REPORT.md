# 옵션 B v2.0 P0 통합 회귀 매트릭스 테스트 보고서

**작성일**: 2026-05-28
**작성자**: core-tester (subagent)
**대상 PR**: **#63** — `fix(option-b): TenantContext save/restore + 멱등성 가드 (P0 v2.0 Path 1)`
**통합 컨텍스트**:
- PR #61 (Path 2 — 캘린더 점선 + setMappingId) → **MERGED** `db7036ab` (2026-05-28T06:45:33Z)
- PR #62 (R4 시각 — 풀-width Danger Outline 버튼) → **MERGED** `dd1b1f56` (2026-05-28T06:46:07Z)
- PR #60 (Path 3 — 자동 모달 오픈 제거) → develop 머지 완료 (`cac50f3f`)
- PR #59 (R4 정책 — 매칭 취소 동작) → develop 머지 완료

**연관 SSOT**:
- `docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN_V2.md` §7 위임 명세 + §4 백엔드 정책
- `docs/project-management/2026-05-28/OPTION_B_V2_TEST_MATRIX.md` 82+ 케이스 + §14 수동 체크리스트
- `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md` 테스터 게이트

**시뮬레이션 환경**:
- worktree: `/Users/mind/mindgarden-tester-p1`
- base: `origin/develop` tip `dd1b1f566` (PR #61·#62 머지 직후)
- merge: `origin/hotfix/option-b-v2-path1-tenant-idempotency` (`441e985f`) → no conflict, 23 files (+1473 / −39)
- 결과 HEAD: `98a358188` (`tester/option-b-v2-p0-simulation`)

---

## §1 게이트 결과 요약

| 항목 | 결과 |
|---|---|
| 통합 머지 시뮬레이션 | **PASS** (충돌 0건, 23 파일 변경) |
| 백엔드 Path 1 타깃 4 클래스 | **PASS 36 / 36** |
| 백엔드 광역 회귀 (`*Admin*Test,*Schedule*Test,*Lifecycle*Test,*Mapping*Test`) | **PASS 548 / 548** (0 errors, 0 failures, 0 skipped) |
| Flyway H2 호환 (V20260528_007) | **PASS** (Spring Boot integration 컨텍스트에서 `admin_request_idempotency` 테이블 정상 생성) |
| 프론트 RTL 5 스위트 (옵션 B 범위) | **PASS 81 / 82** (1 건 pre-existing failure on develop, **PR #63 와 무관**) |
| 프론트 i18n 시드 (16 파일) | **PASS** (자기참조 0 / 빈값 0) |
| 프론트 하드코딩 D11 메트릭 | **PASS** (canonical / withR2 / r2Protected / unifiedRawLine / coverage **델타 0**) |
| 프론트 codemod 매핑 가드 | **PASS** (가드 1·2 모두 통과) |
| 멀티 테넌트 격리 (§1.4 사용자 가드) | **PASS** (`TenantContextHolder.peekTenantId` save/restore 12 케이스 PASS) |
| 멱등성 가드 (X-Request-Id + mapping.status) | **PASS** (`AdminRequestIdempotencyServiceImplTest` 9건 + `AdminServiceImplCheckoutSameDayTest` status 가드 PASS) |
| 회귀 (HIGH / MEDIUM / LOW) | **0 / 0 / 1 (pre-existing on develop)** |

**최종 판정**: ✅ **PASS** — PR #63 머지 시뮬레이션은 옵션 B v2.0 합의서 §7·§8 게이트 요건을 충족.

> **유일한 FAIL 1건은 PR #63 와 무관한 pre-existing develop tip 결함**으로 별도 트랙(현행 develop 핫픽스)으로 처리 권장. PR #63 운영 반영을 차단하는 요인은 아님.

---

## §2 매트릭스별 통과 통계

### §2.1 백엔드 Path 1 타깃 (합의서 §7.1)

| 테스트 클래스 | Run | Pass | Fail | Error | 소요 |
|---|---:|---:|---:|---:|---:|
| `AdminRequestIdempotencyServiceImplTest` | 9 | 9 | 0 | 0 | 0.62s |
| `AdminServiceImplCheckoutSameDayTenantContextTest` | 12 | 12 | 0 | 0 | 1.47s |
| `AdminServiceImplCheckoutSameDayTest` | 11 | 11 | 0 | 0 | 1.43s |
| `AdminServiceImplCreateMappingPendingPaymentGuardTest` | 4 | 4 | 0 | 0 | 1.20s |
| **합계** | **36** | **36** | **0** | **0** | — |

→ 매트릭스 §1 (1~15) + §4 (30~32) 의 Path 1 핵심 케이스 모두 PASS.

### §2.2 백엔드 광역 회귀 (`*Admin*Test,*Schedule*Test,*Lifecycle*Test,*Mapping*Test`)

| 항목 | 값 |
|---|---:|
| 총 테스트 실행 | **548** |
| 실패 (Failures) | **0** |
| 오류 (Errors) | **0** |
| 스킵 (Skipped) | **0** |
| 실행된 test 클래스 (suite) | 112 |
| 소요 시간 | 약 5분 30초 |
| BUILD | **SUCCESS** |

**옵션 B 범위 SSOT 클래스 PASS 표 (발췌)**:

| 합의서 매핑 | 클래스 | Run / Pass |
|---|---|---|
| §7.1 Path 1 (TenantContext + 멱등성) | `AdminServiceImplCheckoutSameDayTenantContextTest` | 12/12 |
| §7.1 Path 1 (당일 카드 결제) | `AdminServiceImplCheckoutSameDayTest` | 11/11 |
| §7.1 Path 1 (멱등성 서비스) | `AdminRequestIdempotencyServiceImplTest` | 9/9 |
| §7.1 Path 1 (PENDING_PAYMENT 가드) | `AdminServiceImplCreateMappingPendingPaymentGuardTest` | 4/4 |
| §7.2 Path 2 (`setMappingId` wiring) | `ScheduleServiceImplCreateConsultantScheduleMappingIdWiringTest` | 10/10 |
| §7.2 Path 2 (SAME_DAY_CARD 분기) | `ScheduleServiceImplCreateConsultantScheduleSameDayCardTest` | 11/11 |
| §7.2 Path 2 (Pre-validation) | `ScheduleServiceImplCreateConsultantSchedulePreValidationTest` | (포함, PASS) |
| §7.2 Path 2 (TENTATIVE → CONFIRMED) | `ScheduleServiceImplFinalizeTentativeAfterDepositTest` | 1/1 |
| §7.3 Path 3 (Schedule 알림 baseline) | `ScheduleServiceImplCreateConsultantScheduleNotificationBaselineTest` | 1/1 |
| §7.4 R4 (Mapping 종료) | `AdminServiceImplTerminatePendingPaymentTest` | (포함, PASS) |
| §7.4 회귀 (Lifecycle 마이그) | `LifecycleAuditAndDestructionMigrationTest` | 10/10 |
| §7.4 회귀 (Lifecycle 상태 마이그) | `LifecycleStateMigrationV20260605Test` | 10/10 |
| §7.5 운영 시뮬레이션 (Lifecycle 관리) | `AdminLifecycleServiceImplTest` | 10/10 |
| Spring 통합 (Flyway H2 검증) | `ScheduleControllerAdminIntegrationTest` | 1/1 |

> 매트릭스 §1~§4 (1~36), §11 (69~71), §13 (77·82) 의 자동화 영역 전부 자동 회귀 통과.

### §2.3 프론트 RTL (합의서 §7.2 + 매트릭스 §5~§9)

| 파일 | Run | Pass | Fail | 비고 |
|---|---:|---:|---:|---|
| `CheckoutSameDayModal.test.js` | (PASS) | ✓ | 0 | 매트릭스 §9 (57~60) — 멱등성 안내 토스트 검증 포함 |
| `IntegratedMatchingSchedule.test.js` | (PASS) | ✓ | 0 | 매트릭스 §5 (37~42) — 자동 모달 오픈 0 회귀 |
| `CardActionGroup.test.js` | (PASS) | ✓ | 0 | 매트릭스 §6 (43~47) — 매칭 취소 텍스트 링크 |
| `sameDayPendingEventDecorator.test.js` | **23** | **23** | 0 | 매트릭스 §8 (53~56) — 점선 + prefix + 다크 모드 cascade |
| `MappingCreationModal.test.js` | 6 | 5 | **1** | **(pre-existing develop 결함, PR #63 무관)** — 매트릭스 §3.1 외 케이스 |
| **합계 (옵션 B 범위)** | **82** | **81** | **1** | 회귀 1건은 develop tip 에서도 동일 재현 → §3 참조 |

### §2.4 프론트 정적 가드

| 가드 | 명령 | 결과 |
|---|---|---|
| i18n 시드 (16 파일) | `node scripts/i18n/validate-i18n-seed.js` | **PASS** (자기참조 0, 빈값 0) |
| 하드코딩 컬러 (D11 SSOT) | `node scripts/design-system/color-management/count-hardcoded-colors.js` | **PASS** — develop 베이스라인 대비 **델타 0** (§6 참조) |
| codemod 매핑 (가드 1·2) | `node scripts/design-system/color-management/validate-codemod-mappings.js` | **PASS** |

### §2.5 멀티 테넌트 격리 (§1.4 사용자 강조)

`AdminServiceImplCheckoutSameDayTenantContextTest` 12 케이스 PASS:
- `TenantContextHolder.peekTenantId` save/restore 동작 검증
- `runInNewTransaction` 진입 전/후 ThreadLocal tenantId 보존
- finally 블록의 `clear()` → `restoreTo(prevTenantId)` 변경 후 동일 매핑 다른 테넌트 누출 0건
- 매트릭스 §4 (30~32) 케이스 충족

### §2.6 멱등성 시나리오

`AdminRequestIdempotencyServiceImplTest` 9 케이스 PASS + `AdminServiceImplCheckoutSameDayTest` status 가드 시나리오 PASS:
- 동일 X-Request-Id 빠른 더블 클릭 → UNIQUE 충돌 (`req-race` 케이스 로그 검증)
- 결과 캐시 echo (`req-dup` 케이스 로그 검증)
- 다른 X-Request-Id 로 동일 매핑 재시도 + status≠PENDING_PAYMENT → `🛡️ 멱등성 가드 발동 (status)` 차단 (`req-active-001`, `req-exh-001`, `req-pc-001`, `null requestId + TERMINATED` 케이스 모두 검증)
- 매트릭스 §1 케이스 3 (멱등성), 11 (status guard) 충족

### §2.7 Flyway H2 호환 (V20260528_007)

`grep "admin_request_idempotency" broad-regression.log` 결과 — Spring Boot 통합 컨텍스트에서 H2 가 idempotency 테이블 + UNIQUE 제약을 정상 생성:

```
create table admin_request_idempotency (
  on admin_request_idempotency (created_at)
  on admin_request_idempotency (tenant_id, operation, mapping_id)
alter table if exists admin_request_idempotency
  add constraint uk_admin_request_idempotency_tenant_request unique (tenant_id, request_id)
```

기존 마이그(`V20260528_001`, `V20260528_002`, `V20260528_004`~`V20260528_006`)와 버전 순서 충돌 없음 — `V20260528_003` 슬롯은 develop tip 에 미존재 (Flyway gap 허용, 신규 마이그 영향 0).

---

## §3 발견된 신규 회귀

### §3.1 PR #63 직접 회귀 — **0건 (HIGH / MEDIUM / LOW 모두)**

### §3.2 Pre-existing develop 결함 (PR #63 무관) — 1건 (LOW)

| ID | 위치 | 증상 | 분류 | 처리 권고 |
|---|---|---|---|---|
| **R-1** | `frontend/src/components/admin/__tests__/MappingCreationModal.test.js:221` <br/>케이스 "step 3 에서 패키지 미선택 시 '다음' 버튼 disabled (default 패키지 제거)" | `expect(nextButton).toBeDisabled()` 실패 → 버튼이 활성 상태. <br/>JSDOM 환경에서 `getCommonCodes` fetch 실패로 인해 default 패키지가 '표준 패키지'로 fallback 되어 step 3 자동 선택 상태 진입. | **PR #63 무관 — develop tip 에서도 동일 재현 확인** (해당 `origin/develop` 체크아웃 후 동일 실패 재현) | PR #63 게이트 차단 사유 **아님**. 별도 핫픽스 트랙 (테스트 mock 보강 또는 default fallback 제거) 권장. |

**검증 방법 (재현 가능)**:
```bash
cd /Users/mind/mindgarden-tester-p1
git checkout origin/develop
cd frontend && CI=true npm test -- --testPathPattern='MappingCreationModal' --watchAll=false
# → 동일 1 failed / 5 passed 재현
```

### §3.3 missing test file 메모 (회귀 아님, 매트릭스 SSOT 와 실 코드의 차이 보고)

| 메모 | 내용 | 대응 |
|---|---|---|
| **M-1** | 합의서 §7.1 / 매트릭스 §6 인용 `MappingMatchActions.test.js` 미존재 | 컴포넌트 `MappingMatchActions.js` 자체는 존재. RTL 커버리지는 `CardActionGroup.test.js` (매트릭스 §6) 가 동일 분기를 커버. 향후 별도 신규 RTL 작성 권장 (별도 트랙). |
| **M-2** | 합의서 §7 인용 `ScheduleServiceImplValidateMappingForTentativeBeforeDepositTest` 미존재 | 동일 검증 범위가 `ScheduleServiceImplCreateConsultantScheduleMappingIdWiringTest` (10/10 PASS) + `ScheduleServiceImplCreateConsultantSchedulePreValidationTest` (PASS) 에 분산. 매트릭스 §2 (16~24) 커버리지 충족. |

---

## §4 사용자 수동 검증 가이드 (dev 환경 체크리스트)

> 매트릭스 §14 의 8~10 시나리오. 운영 반영 전 사용자가 dev 환경에서 직접 PASS 확인 후 결재 권장. 자동화 영역 외 UX/시각/multi-환경 차이 검증 대상.

### 필수 PASS (8 시나리오)

- [ ] **[1] 옵션 B 정상 흐름** — 매칭 생성 (상담사→내담자→패키지→사후 카드) → 사이드바 카드 확인 (점선 또는 색 톤 차이) → 캘린더 드래그/드롭 → 시간 설정 → 예약 완료 → 캘린더 점선 + prefix 시각 확인 → "당일 결제 + 활성화" 클릭 → 결제 완료 → ACTIVE 전이 + 캘린더 솔리드 전환 + 토스트
- [ ] **[2] 결제 모달 자동 오픈 0 회귀** — 매칭 생성 직후 / 가예약 일정 생성 직후 결제 모달 자동 오픈이 **발생하지 않음** 확인 (Path 3 합의 사항)
- [ ] **[3] 사용자 재시도 멱등성** — 결제 진행 중 네트워크 끊김 시뮬레이션 (DevTools Network → Offline) → 재시도 → 회계 거래 1건 보장 + **"이미 처리 중입니다. 새 매칭 카드로 확인하세요."** 토스트 노출 (X-Request-Id 동일 + status 가드 동시 작동)
- [ ] **[4] 매칭 취소 (R4)** — PENDING_PAYMENT 매칭 사이드바 "매칭 취소" 텍스트 링크 → 확인 모달 (UnifiedModal, AlertTriangle 아이콘) → 확인 → 매칭 TERMINATED + 가예약 CANCELLED + paymentStatus REJECTED/CANCELLED
- [ ] **[5] 옵션 A (선납 입금) 회귀 0** — 기존 옵션 A 흐름 정상 작동 (회귀 0)
- [ ] **[6] 캘린더 시각 분기** — TENTATIVE_PENDING_PAYMENT (점선 + prefix) vs CONFIRMED (솔리드) vs ACTIVE 일반 일정 (솔리드) 시각 차이 명확
- [ ] **[7] 다크 모드** — 모든 시각 토큰 cascade 정상 (점선·prefix·텍스트 링크·Danger Outline 버튼 색상)
- [ ] **[8] dev DB 회계 거래 transactionId=109 정합** — 멱등성 가드 도입 후 동일 매칭 재시도 시 `financial_transactions` 단건 commit 보장 (매트릭스 §12 케이스 74 후속)

### 선택 (시간 허용 시)

- [ ] **[9] 모바일 반응형** — 사이드바 280~320px 폭에서 텍스트 링크 줄바꿈 0, 영역 이탈 0
- [ ] **[10] 다중 테넌트 격리 (수동)** — 테넌트 A 어드민 로그인 후 다른 테넌트 매칭 직접 URL 접근 시 차단 (자동 단위 테스트는 PASS, 운영 환경 실 검증)

### 사용자 결재 절차 (합의서 §8.1 + Q12)

1. 본 보고서 §1 PASS 확인 + §2 매트릭스 통과 통계 검토
2. 사용자가 dev 환경에서 위 [1]~[8] 필수 시나리오 직접 PASS 확인 ([9]·[10] 시간 허용 시 추가)
3. 미통과 시나리오가 1건이라도 존재 → 운영 반영 차단 + core-coder 재작업 위임
4. 모두 PASS → blue 슬롯 검증 모드 배포 → cutover (§5 권고)

---

## §5 운영 반영 권고

### 권고 결과: ✅ **PR #63 머지 + main FF + deploy-production 권고**

**근거**:
1. **자동 회귀 매트릭스 PASS 548 + 36 (광역 + 타깃 중복 포함) 전부 통과** — 합의서 §7 게이트 요건 충족.
2. **TenantContext save/restore 핵심 결함 A 검증** — `AdminServiceImplCheckoutSameDayTenantContextTest` 12 케이스 0 실패 → 운영 401 회복 시나리오 (매칭 #98 부분 commit 재현 가드).
3. **멱등성 (X-Request-Id + status) 양방향 적용 확인** — Q11 "둘 다 적용" 정착.
4. **Path 2 (mapping_id wiring) 회귀 0** — `ScheduleServiceImplCreateConsultantScheduleMappingIdWiringTest` 10 케이스 PASS → PR #61 머지와의 통합 정합 검증 완료.
5. **Flyway V20260528_007 H2 호환 검증** — 신규 마이그가 모든 Spring Boot 통합 테스트에서 정상 적용.
6. **D11 / i18n / codemod 정적 가드 델타 0** — 비기능 회귀 0.
7. **유일한 RTL FAIL 1건은 develop tip 에서도 동일 재현** → PR #63 책임 영역 외 (별도 트랙으로 처리).

### 권장 배포 순서 (합의서 §8.2 — Q10)

1. core-planner 가 본 보고서 + §4 사용자 체크리스트 사용자 결재 수령
2. 사용자 §4 [1]~[8] PASS 확정 → deployer 위임 (자동 PR 머지는 본 가이드 적용 금지)
3. PR #63 머지 → develop (Squash 또는 Merge — PR 정책 따름)
4. develop → main FF
5. **blue 슬롯 검증 모드** 배포 (외부 트래픽 격리 + 내부 테스트 데이터 commit)
6. 30분 모니터링: `checkoutSameDayCard` 401 응답률 / 회계 거래 중복 / `TENTATIVE_PENDING_PAYMENT → CONFIRMED` 전환 실패율 / SMS_GATE tenant=null
7. blue → green cutover

### 차단/롤백 시나리오 (FAIL 시 — 본 보고서에서는 적용 안 됨)

> 본 보고서는 PASS 이므로 차단 사유 0건. 참고용으로 보존:
- HIGH 회귀 감지 → 즉시 deployer STOP + coder 핫픽스 위임
- 운영 cutover 후 30분 내 401 응답률 > 0.1% sustained → roll back → blue 슬롯 재검증

---

## §6 r2Protected 메트릭 델타 (D11)

### 측정 방법

```bash
# baseline (develop tip, dd1b1f566)
git checkout origin/develop
node scripts/design-system/color-management/count-hardcoded-colors.js

# post-merge (tester/option-b-v2-p0-simulation, 98a358188 = develop + PR#63)
git checkout tester/option-b-v2-p0-simulation
node scripts/design-system/color-management/count-hardcoded-colors.js
```

### 결과

| 메트릭 | develop baseline | PR #63 머지 후 | 델타 |
|---|---:|---:|---:|
| `canonical` (D6 §8 운영 게이트) | 410 | 410 | **0** |
| `withR2` (canonical + R-2 보호) | 423 | 423 | **0** |
| `r2Protected` (R-2 보호 hex 종) | 13 | 13 | **0** |
| `legacyRawLine` (== `rawLine` alias) | 1263 | 1263 | **0** |
| `rawLineCss` | 1251 | 1251 | **0** |
| `rawLineJs` | 12 | 12 | **0** |
| `unifiedRawLine` (hex + rgba + hsl + 8hex) | 2129 | 2129 | **0** |
| `coverage` (var() / (var() + unified)) | 87.62% | 87.62% | **0** |
| `varCount` | 15075 | 15075 | **0** |
| `filesScanned` | 1464 | 1464 | **0** |

**판정**: ✅ PR #63 의 CSS/JS 변경 = `CheckoutSameDayModal.js` 1건 + `CheckoutSameDayModal.test.js` 1건 (테스트 파일) — 색상 변경 0, D11 KPI 영향 0. **델타 0 SSOT 확정.**

---

## §7 부록 — 실행 명령 추적성

### A. 백엔드 (총 약 6분 + 약 27초)

```bash
cd /Users/mind/mindgarden-tester-p1

# A.1 Path 1 타깃 (27초)
mvn test -Dtest='AdminServiceImplCheckoutSameDayTest,AdminServiceImplCheckoutSameDayTenantContextTest,AdminRequestIdempotencyServiceImplTest,AdminServiceImplCreateMappingPendingPaymentGuardTest' -DfailIfNoTests=false -q -B

# A.2 광역 회귀 (5분 33초)
mvn test -Dtest='*Admin*Test,*Schedule*Test,*Lifecycle*Test,*Mapping*Test' -DfailIfNoTests=false -B
```

### B. 프론트엔드

```bash
cd /Users/mind/mindgarden-tester-p1/frontend

# B.1 옵션 B 범위 RTL 5 스위트
CI=true npm test -- --testPathPattern='(CheckoutSameDayModal|MappingCreationModal|IntegratedMatchingSchedule|CardActionGroup|sameDayPendingEventDecorator)' --watchAll=false --no-coverage

# B.2 추가 RTL (MappingMatch / MappingCancel / SameDayPending 정착)
CI=true npm test -- --testPathPattern='(MappingCancel|MappingMatch|SameDayPending)' --watchAll=false --no-coverage
```

### C. 정적 가드

```bash
cd /Users/mind/mindgarden-tester-p1

# C.1 i18n 시드
node scripts/i18n/validate-i18n-seed.js

# C.2 하드코딩 컬러 (D11)
node scripts/design-system/color-management/count-hardcoded-colors.js

# C.3 codemod 매핑
node scripts/design-system/color-management/validate-codemod-mappings.js
```

### D. 머지 시뮬레이션

```bash
cd /Users/mind/mindGarden
git fetch origin --prune
git worktree add /Users/mind/mindgarden-tester-p1 origin/develop
cd /Users/mind/mindgarden-tester-p1
git checkout -b tester/option-b-v2-p0-simulation
git merge origin/hotfix/option-b-v2-path1-tenant-idempotency --no-ff --no-edit
# → no conflict, 23 files (+1473 / −39)
```

---

## §8 변경 파일 인벤토리 (PR #63)

```
src/main/java/.../AdminServiceUserFacingMessages.java         (+10)
src/main/java/.../AdminController.java                        (+13/-1)
src/main/java/.../entity/AdminRequestIdempotency.java         (+90, NEW)
src/main/java/.../exception/GlobalExceptionHandler.java       (+46)
src/main/java/.../MappingAlreadyProcessedException.java       (+79, NEW)
src/main/java/.../AdminRequestIdempotencyRepository.java      (+45, NEW)
src/main/java/.../service/AdminRequestIdempotencyService.java (+53, NEW)
src/main/java/.../service/AdminService.java                   (+23)
src/main/java/.../impl/AdminRequestIdempotencyServiceImpl.java (+107, NEW)
src/main/java/.../impl/AdminServiceImpl.java                  (+99/-?)
src/main/java/.../core/context/TenantContextHolder.java       (+35)
src/main/resources/db/migration/V20260528_007__admin_request_idempotency.sql (+43, NEW)
src/test/.../AdminRequestIdempotencyServiceImplTest.java      (+158, NEW)
src/test/.../AdminServiceImplCheckoutSameDayTenantContextTest.java (+497, NEW)
... (기존 테스트 5건 mock 보강)
frontend/src/components/admin/mapping/CheckoutSameDayModal.js (멱등성 토스트 안내)
frontend/src/components/admin/mapping/__tests__/CheckoutSameDayModal.test.js (멱등성 케이스 추가)
```

총 23 파일, +1473 / −39.

---

**보고서 작성 완료**: 2026-05-28 (KST)
**다음 액션**: core-planner 가 사용자에게 본 보고서 + §4 체크리스트 결재 요청 → PASS 확인 후 deployer 에 운영 반영 위임. 자동 PR 머지 금지.
