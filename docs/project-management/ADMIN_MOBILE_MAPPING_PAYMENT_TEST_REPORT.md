# Admin Mobile Sprint 1d — 네이티브 매칭 결제 3단계 테스트 리포트

**작성일**: 2026-05-18  
**작성자**: core-tester  
**기준 워크스페이스**: `e91bfca5c` (로컬 미커밋 1d 구현 diff 포함)  
**기획 SSOT**: [`ADMIN_MOBILE_MAPPING_PAYMENT_APPROVAL_ORCHESTRATION.md`](./ADMIN_MOBILE_MAPPING_PAYMENT_APPROVAL_ORCHESTRATION.md)  
**디자인 SSOT**: [`ADMIN_MOBILE_MAPPING_PAYMENT_DESIGN_HANDOFF.md`](./ADMIN_MOBILE_MAPPING_PAYMENT_DESIGN_HANDOFF.md) (1c 웹 브릿지 · 1d 네이티브 우선)  
**형식 참고**: [`ADMIN_MOBILE_SCHEDULE_REGISTER_TEST_REPORT.md`](./ADMIN_MOBILE_SCHEDULE_REGISTER_TEST_REPORT.md)

---

## 1. 요약

| 구분 | 결과 |
|------|------|
| **Sprint 1d 제품 게이트** | **CONDITIONAL** — 자동·정적 **PASS**; 수동 UAT **0/5 PENDING** (디바이스 미실행) |
| **Sprint 1d 단위 (타깃)** | **PASS** — 3 suites, **22** tests |
| **회귀 `test:utils`** | **PASS** — 17 suites, **96** tests (~8.5s) |
| **수동 UAT (M1~M5)** | **0/5 실행** — **PENDING** |
| **이전 판정 대비** | 1c/1d 미구현 **FAIL** → 구현·Jest 반영 후 **CONDITIONAL** (현장 UAT만 잔여) |

**게이트 판정: CONDITIONAL**

- **PASS 근거**: `adminMappingSettlement` CTA SSOT(U1~U4), 웹 URL·CTA 회귀, 3 API mutation 훅·UnifiedModal·`schedule/index`·`mapping/create` 연동 정적 확인, 전체 utils 회귀 green.
- **CONDITIONAL 사유**: M1~M5 실기기·웹 연동 UAT 미실행; `confirm-payment` POST body 필드(U5) **훅 단위 mock 테스트 없음**(정적만 PASS).

---

## 2. 자동 게이트

### 2.1 실행 명령·결과 (필수)

| # | 명령 | 결과 |
|---|------|------|
| A1 | `cd expo-app && npm run test:utils -- --testPathPattern='adminMapping\|openAdminWeb\|MappingSettlement'` | **PASS** — **3** suites, **22** tests, ~2.4s |
| A2 | `cd expo-app && npm run test:utils` | **PASS** — **17** suites, **96** tests, ~8.5s |

**A1 suite 상세**

| Suite | Tests | 비고 |
|-------|-------|------|
| `src/utils/__tests__/adminMappingSettlement.test.ts` | 11 | U1~U4, 웹 CTA, hint, deposit ref |
| `src/utils/__tests__/openAdminWebMappingPayment.test.ts` | 8 | URL·CTA re-export (1c 회귀) |
| `src/utils/__tests__/adminMappingCreateBody.test.ts` | 3 | 생성 body `PENDING_PAYMENT` (1b 회귀) |

---

## 3. 단위 시나리오 (U1~U5)

| ID | 내용 | Jest / 정적 | 판정 |
|----|------|-------------|------|
| **U1** | `canScheduleAdminMapping` — **ACTIVE** + `remainingSessions > 0` 만 true | `adminMappingSettlement.test.ts` — ACTIVE 0·비ACTIVE 거부 | **PASS** |
| **U2** | `PENDING_PAYMENT` → 네이티브 결제 CTA | `getAdminMappingPrimaryActionKind` → `'payment'`; `shouldShowAdminMappingPrimaryCta(..., true)`; `index.tsx` `onOpenPayment` | **PASS** |
| **U3** | `PAYMENT_CONFIRMED` → 입금 CTA | kind `'deposit'`; `AdminMappingDepositConfirmModal` + `onOpenDeposit` | **PASS** |
| **U4** | `DEPOSIT_PENDING` → 승인 CTA | kind `'approve'`; `useApproveMapping` + approve `UnifiedModal` on `index.tsx` | **PASS** |
| **U5** | `confirm-payment` body — `paymentMethod`, `paymentReference`, `paymentAmount` | **정적**: `useAdminMappingSettlement.ts` `postConfirmPayment` body 3필드; 모달 `mutateAsync` 동일 전달. **Jest**: 훅/mock **없음** | **PASS (정적)** / 단위 mock **미작성** |

**U2 명칭**: SSOT에 `shouldShowNativePaymentCta` 심볼 없음 → **`shouldShowAdminMappingPrimaryCta` + `getAdminMappingPrimaryActionKind`** 가 네이티브 Primary CTA SSOT.

**U2 보조 (웹 Secondary)**: `shouldShowWebPaymentCta('PENDING_PAYMENT')` — `openAdminWebMappingPayment.test.ts` + `index.tsx` Secondary CTA.

---

## 4. 정적 코드 리뷰 (Sprint 1d 구현)

| 항목 | 경로 | 판정 |
|------|------|------|
| 결제 확인 mutation | `expo-app/src/api/hooks/useAdminMappingSettlement.ts` — `useConfirmMappingPayment` / `postConfirmPayment` | ✓ |
| 입금 확인 mutation | 동일 — `useConfirmMappingDeposit` / `confirm-deposit` | ✓ |
| 승인 mutation | 동일 — `useApproveMapping` / `approve` + `resolveAdminApproveName` | ✓ |
| CTA·일정 차단 SSOT | `expo-app/src/utils/adminMappingSettlement.ts` | ✓ |
| 결제 모달 | `expo-app/src/components/organisms/AdminMappingPaymentConfirmModal.tsx` — `UnifiedModal`, `useConfirmMappingPayment` | ✓ |
| 입금 모달 | `expo-app/src/components/organisms/AdminMappingDepositConfirmModal.tsx` | ✓ |
| 매칭 허브 카드 | `expo-app/app/(admin)/(operation)/schedule/index.tsx` — Primary 3종 + 웹 Secondary + 일정 disabled·hint | ✓ |
| 5스텝 완료 후 결제 | `expo-app/app/(admin)/(operation)/schedule/mapping/create.tsx` — `AdminMappingPaymentConfirmModal` Step 5 | ✓ |
| 엔드포인트 | `expo-app/src/api/endpoints.ts` — `confirm-payment` / `confirm-deposit` / `approve` | ✓ |
| 웹 브릿지 (1c 회귀) | `openAdminWebMappingPayment.ts`, `adminMobileScreensCopy` 경로 상수 | ✓ |

---

## 5. 수동 UAT (M1~M5)

| # | 시나리오 | 기대 | 실행 | 판정 |
|---|----------|------|------|------|
| **M1** | `PENDING_PAYMENT` 카드 → 「결제 확인」 | 네이티브 `AdminMappingPaymentConfirmModal` → `confirm-payment` 200 → 목록 `PAYMENT_CONFIRMED` | 미실행 | **PENDING** |
| **M2** | `PAYMENT_CONFIRMED` → 「입금 확인」 | `AdminMappingDepositConfirmModal` → `confirm-deposit` → `DEPOSIT_PENDING` | 미실행 | **PENDING** |
| **M3** | `DEPOSIT_PENDING` → 「매칭 승인」 | approve POST → `ACTIVE` | 미실행 | **PENDING** |
| **M4** | 결제·승인 대기 중 「이 매칭으로 일정 잡기」 | **비활성** + 상태별 hint (`isScheduleBlockedByPaymentStatus`) | 미실행 | **PENDING** |
| **M5** | `ACTIVE` + 잔여 회기 | Primary 일정 CTA 활성 → Step 3 prefill·POST | 미실행 | **PENDING** |

**5줄 요약 (현장용)**  
1. ADMIN 로그인 → 일정·매칭 허브 → `PENDING_PAYMENT` 행에서 「결제 확인」.  
2. 결제 수단·금액·참조 입력 후 제출 → 목록 새로고침으로 `PAYMENT_CONFIRMED` 확인.  
3. 동일 행 「입금 확인」→ `DEPOSIT_PENDING` 전이 확인.  
4. 「매칭 승인」→ `ACTIVE` 후 일정 CTA 활성·hint 제거 확인.  
5. 「이 매칭으로 일정 잡기」→ 일정 등록 Step 3 prefill·POST 성공.

**권장 계정**: ADMIN; STAFF + `MAPPING_MANAGE` 각 1회.

---

## 6. 회귀·권장 후속

| 영역 | 결과 |
|------|------|
| `adminRole` · `tenantHydrationGate` · `adminMappingCreateBody` 등 | A2 **PASS** (96 tests) |
| Maestro 네이티브 결제 3단계 | **미작성** — M1~M5 후 `admin-mvp-smoke` 확장 제안 |

**core-coder 제안 (블로커 아님)**

| 우선순위 | 항목 |
|----------|------|
| P2 | `useAdminMappingSettlement` — `apiPost` mock으로 U5 body 스냅샷 1건 |
| P1 | M1~M5 실기기 UAT 후 본 문서 **PASS** 승격 |

---

## 7. Sprint 1d 완료 기준 대조

| 기준 | 자동 | 정적/수동 |
|------|------|-----------|
| 네이티브 `confirm-payment` UI·mutation | — | ✓ 모달·훅 |
| 네이티브 `confirm-deposit` | — | ✓ |
| 네이티브 `approve` | — | ✓ |
| 일정 CTA — ACTIVE+잔여만 | U1 **PASS** | ✓ `index.tsx` |
| 결제 파이프라인 Primary CTA | U2~U4 **PASS** | ✓ |
| 웹 Secondary CTA (1c) | Jest **PASS** | ✓ |
| `test:utils` 회귀 | **PASS** 96 | — |
| 실기기 E2E M1~M5 | — | **PENDING** |

---

## 8. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-05-18 | Sprint 1c 초판 — 미구현 **FAIL** |
| 2026-05-18 | **Sprint 1d 재검증** — 타깃 22·전체 96 PASS, 정적 구현 확인, **CONDITIONAL** (UAT PENDING) |
