# Admin Mobile — 상용화 C2 품질 게이트 테스트 리포트

**작성일**: 2026-05-18  
**작성자**: core-tester  
**Phase**: **C2** (P0 화면 시각·표시 경계) — **코더 Sprint C2 완료 후 재검증**  
**상태**: **CONDITIONAL** — 정적 **7 PASS / 2 CONDITIONAL**; G2 Jest **PASS**; `tsc --noEmit` **FAIL**; G3·UAT 실기기 **PENDING**  
**형식 참고**: [`ADMIN_MOBILE_MAPPING_PAYMENT_TEST_REPORT.md`](./ADMIN_MOBILE_MAPPING_PAYMENT_TEST_REPORT.md)

---

## SSOT

| 문서 | 용도 |
|------|------|
| [`ADMIN_MOBILE_COMMERCIALIZATION_DESIGN_HANDOFF.md`](./ADMIN_MOBILE_COMMERCIALIZATION_DESIGN_HANDOFF.md) | §5 패리티 A(60%) 6항 · §6 core-coder 완료 10항 |
| [`ADMIN_MOBILE_COMMERCIALIZATION_ORCHESTRATION.md`](./ADMIN_MOBILE_COMMERCIALIZATION_ORCHESTRATION.md) | §6 상용화 디자인 10항 · §7 G1~G4 |
| [`ADMIN_MOBILE_COMMERCIALIZATION_COMPONENT_AUDIT.md`](./ADMIN_MOBILE_COMMERCIALIZATION_COMPONENT_AUDIT.md) | 추출·safeDisplay grep·import SSOT |
| [`COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`](./COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md) | safeDisplay · React #130 |
| [`ADMIN_MOBILE_MAPPING_PAYMENT_TEST_REPORT.md`](./ADMIN_MOBILE_MAPPING_PAYMENT_TEST_REPORT.md) | 1d 결제 3단계 U1~U5·회귀 |

---

## 1. 요약

| 구분 | 결과 |
|------|------|
| **C2 제품 게이트** | **CONDITIONAL** — 정적 9항 중 7 PASS · 2 CONDITIONAL (C2-05·C2-08); `tsc` 미통과 |
| **G2 회귀 (`test:utils`)** | **PASS** — **18** suites, **99** tests (~17.6s) |
| **C2·1d focused Jest** | **PASS** — **4** suites, **25** tests (~17.6s) |
| **G2 타입 (`tsc --noEmit`)** | **FAIL** — `AdminMappingPaymentConfirmModal.tsx` 4건 |
| **G3 시각 QA (6항)** | **4/6 STATIC PASS** · G3-5·G3-6 수동 **PENDING** |
| **수동 UAT (5줄)** | **0/5 PENDING** — dev APK·실기기 대기 |
| **1d 결제 회귀 (utils)** | **PASS** — `adminMappingSettlement`·`openAdminWebMappingPayment`·`adminMappingCreateBody`·`resolveThemeForRole` green |

**게이트 스냅샷 (2026-05-18, C2 재검증)**

| 게이트 | 판정 | 비고 |
|--------|------|------|
| G1 | CONDITIONAL 유지 | STAFF `review` 탭 `href: null` 정적 확인; Maestro·역할 스모크는 C4 |
| G2 | **CONDITIONAL** | Jest PASS; **tsc FAIL** → 코더 수정 후 재실행 |
| G3 | **CONDITIONAL (정적)** | STATIC 4/6; 실기기·#130 콘솔 미검 |
| G4 | PENDING | §6 UAT 5줄 |

**판정 1줄**: C2 **CONDITIONAL** — utils **99/99** green, C2 정적 **7/9 PASS** + **tsc 4 errors**; G3·UAT·Maestro **미실행**.

---

## 2. C2 검증 표 (구현·정적·수동)

| ID | 검증 항목 | SSOT | 정적 (파일·grep) | 수동 (APK·샘플) | 판정 |
|----|-----------|------|------------------|-----------------|------|
| **C2-01** | **adminTheme** — `tokens.ts` `ADMIN_COLORS` + `admin-theme.ts` | Design §2.1 · Coder §6 #1 | `tokens.ts` `ADMIN_COLORS`·`colors.admin`; `admin-theme.ts` `adminTheme` export; `theme/index.ts` re-export | 홈·카드 배경·보더 샘플 대조 | **PASS** (정적) |
| **C2-02** | **ThemeProvider** — `admin` \| `staff` → `adminTheme` | Design §2 · Coder §6 #2 | `resolveThemeForRole.ts` L14–15; `ThemeProvider.tsx` `resolveThemeForRole(role)`; Jest `resolveThemeForRole.test.ts` | CLIENT·CONSULTANT 색·탭 회귀 | **PASS** (정적) · 수동 **PENDING** |
| **C2-03** | **STAFF 검수 탭 숨김** | G1 · Coder §6 #3 | `app/(admin)/_layout.tsx` `hideReviewTab` + `href: hideReviewTab ? null` | STAFF 5탭·검수 미노출 | **PASS** (정적) · 수동 **PENDING** |
| **C2-04** | **44pt** — wizard·segment·modals | Design §2.2 · Coder §6 #4 | `ADMIN_MIN_TOUCH_TARGET=44` in `tokens.ts`; `AdminWizardShell` footer; `schedule/index` segment; payment/deposit modals·`AdminMappingListCard`·`AdminFabActionSheet` | 터치 영역 실측 | **PASS** (정적) · 수동 **PENDING** |
| **C2-05** | **AdminWizardShell** — `schedule/create`·`mapping/create` | Component audit §3 #1 · Coder §6 #6 | `components/templates/AdminWizardShell.tsx`; both create import·wrap | 4·5스텝 progress·footer | **PASS** (정적) · 수동 **PENDING** |
| **C2-06** | **AdminMappingListCard** | Component audit §3 #2 | `molecules/AdminMappingListCard.tsx`; `schedule/index.tsx` `AdminMappingListCard` only (인라인 `MappingListCard` **0**) | 매칭 탭 카드·CTA | **PASS** (정적) · 수동 **PENDING** |
| **C2-07** | **AdminFabActionSheet** | Design §3.3 · Component §3 #4 | Molecule 존재; **`schedule/index.tsx`만 import**. `user-management/index`는 FAB+`UnifiedModal` **인라인** (동등 패턴, 컴포넌트 미사용) | FAB·시트 Handle·옵션 | **CONDITIONAL** — 스케줄 허브만 SSOT 통합 |
| **C2-08** | **홈 accent** — `StatCard` `showAccentBar` | Design §3.2 · 패리티 #4 | `(home)/index.tsx` L108–127 `showAccentBar`; `atoms/StatCard.tsx` accent bar | KPI 그리드 시각 | **PASS** (정적) · 수동 **PENDING** |
| **C2-09** | **1d 결제 회귀** — settlement·웹 CTA utils | Mapping payment 리포트 | Jest 25 tests (4 suites) green; `AdminMappingListCard` → `adminMappingSettlement` | M2~M5 결제 3단계 스모크 | **PASS** (자동) · UI 수동 **PENDING** |

**부가 (Coder §6 #9 safeDisplay)**: `messages/index`·`mapping/create`·`AdminMappingListCard` — `toDisplayString`/`toSafeNumber` 적용. `schedule/index` **일정 탭** `ScheduleCard`에 `startTime`/`consultationType`/`status` **raw** (문자열 가정) → **C2-08 표와 별도 CONDITIONAL**.

**C2 종합**: 정적 **7 PASS + 2 CONDITIONAL** (9/9 엄격 PASS 아님) + **tsc FAIL** → 제품 게이트 **CONDITIONAL**. Orchestration §6 **≥8/10**·G3 **≥4/6**·1d UI 스모크는 **미충족/미실행**.

---

## 3. core-coder §6 완료 10항 — 교차 추적

| # | 항목 | C2 표 ID | 정적 결과 |
|---|------|----------|-----------|
| 1 | `adminTheme` in tokens | C2-01 | **PASS** |
| 2 | ThemeProvider admin/staff | C2-02 | **PASS** |
| 3 | STAFF `review` 탭 숨김 | C2-03 | **PASS** |
| 4 | 터치 44pt | C2-04 | **PASS** (핵심 경로) |
| 5 | P0 카드 adminTheme surface | C2-01,06,08 | **PASS** |
| 6 | AdminWizardShell | C2-05 | **PASS** |
| 7 | AdminFabActionSheet | C2-07 | **CONDITIONAL** (`user-management` 미마이그레이션) |
| 8 | `PENDING_PAYMENT` Primary disabled + 웹 Secondary | C2-09 | **PASS** (utils); UI **PENDING** |
| 9 | safeDisplay 전역 | C2-08† | **CONDITIONAL** — 일정 `ScheduleCard` 3필드 raw |
| 10 | 비목표 미구현 | — | **PASS** (정적 샘플) |

† safeDisplay는 별도 행 없음; C2-08은 accent 항목 — §2 부가 참고.

---

## 4. 자동 게이트

### 4.1 Baseline (코더 착수 전) — **2026-05-18 AM**

| 항목 | 값 |
|------|-----|
| **결과** | **PASS** |
| **Suites** | **17** passed, 17 total |
| **Tests** | **96** passed, 96 total |
| **Wall time** | ~14.1s |

### 4.2 C2 재검증 (코더 Sprint C2 완료) — **2026-05-18 PM**

```bash
cd expo-app && npm run test:utils
cd expo-app && npm run test:utils -- --testPathPattern='resolveThemeForRole|adminMapping|openAdminWeb|MappingSettlement'
cd expo-app && npx tsc --noEmit
```

| 순서 | 명령 | 결과 | Suites / Tests / exit |
|------|------|------|------------------------|
| 1 | `npm run test:utils` | **PASS** | **18** / **99** / 0 |
| 2 | focused `testPathPattern` | **PASS** | **4** / **25** / 0 |
| 3 | `npx tsc --noEmit` | **FAIL** | exit **2** — 4 errors in `AdminMappingPaymentConfirmModal.tsx` (payment method state literal narrowing) |

**`test:utils` suite 목록 (C2 후)**

`adminConsultantDayScheduleNormalize` · `adminConsultantPickerParse` · `adminMappingCreateBody` · `adminMappingSettlement` · `adminRole` · `adminScheduleCreateBody` · `adminSessionDiag` · `communityFeedMerge` · `dateFormat` · `jwtPayload` · `navigateAfterAuth` · `openAdminWebMappingPayment` · `resolveEffectiveTenantIdForApi` · `resolveTenantIdForApi` · **`resolveThemeForRole`** · `retryAdminApiSession` · `scheduleTimeSlotConflict` · `tenantHydrationGate`

**Focused breakdown (25 tests)**

| Suite | Tests (approx.) |
|-------|-----------------|
| `resolveThemeForRole.test.ts` | 3 |
| `adminMappingCreateBody.test.ts` | 3 |
| `adminMappingSettlement.test.ts` | 13 |
| `openAdminWebMappingPayment.test.ts` | 6 |

> Baseline 대비 **+1 suite / +3 tests** (`resolveThemeForRole`). 1d 결제 focused는 문서 초안 22→**25** (테마·토큰 케이스 포함).

### 4.3 미실행 (본 배치)

| 명령 | 사유 |
|------|------|
| `node scripts/check-hardcoding-enhanced.js` | 범위 외; G3 #5 별도 배치 |
| `mvn …ScheduleServiceImplAdminStaff…` | 백엔드 선택 스모크 — 미요청 |
| `admin-mvp-smoke-prep.sh` / Maestro | G4·실기기·APK 환경 없음 |

---

## 5. G3 시각 QA 샘플링 (6항)

| # | 샘플링 항목 | 화면 | PASS 기준 | 결과 |
|---|-------------|------|-----------|------|
| G3-1 | **레이아웃** — `#FAF9F7` / `#F5F3EF` / `#D4CFC8` | 홈·허브 | 토큰·`colors.admin`·`common.border` | **STATIC PASS** |
| G3-2 | **타이포** — 제목 20px+ / 본문 14px | 홈 KPI·카드 | `theme.fontSize` 계층 | **STATIC PASS** (코드) · 실기기 **PENDING** |
| G3-3 | **Primary `#3D5246`** | 홈·FAB·CTA | `colors.admin.primary` | **STATIC PASS** |
| G3-4 | **카드 악센트 바** 4px | `(home)/index` | `StatCard` `showAccentBar` | **STATIC PASS** |
| G3-5 | **터치·disabled** 44pt+, `PENDING_PAYMENT` | 세그먼트·결제 CTA | `ADMIN_MIN_TOUCH_TARGET`·settlement tests | **STATIC PASS** (코드) · disabled 시각 **PENDING** |
| G3-6 | **safeDisplay** — #130 | messages·schedule | 객체 미렌더 | **STATIC CONDITIONAL** (일정 탭 raw 3필드) · 콘솔 **PENDING** |

**G3 판정**: 정적 **4/6 STATIC PASS** + 1 CONDITIONAL + 1 수동 대기 → 실기기 전 **CONDITIONAL**. **6/6 PASS**는 디자이너·APK 검수 후.

---

## 6. 수동 UAT (5줄)

dev APK ([`ADMIN_MOBILE_MVP_SMOKE_RUN.md`](./ADMIN_MOBILE_MVP_SMOKE_RUN.md) §6) · ADMIN 계정 · 필요 시 STAFF 2차.

| # | 시나리오 | 경로·기대 | 결과 |
|---|----------|-----------|------|
| U1 | **ADMIN 홈** | `/(admin)/(home)` — KPI StatCard·accent·admin 배경 | **PENDING** |
| U2 | **스케줄 허브** | `schedule` — 세그먼트·목록·FAB 시트 | **PENDING** |
| U3 | **위저드** | `schedule/create` 4스텝 + `mapping/create` 5스텝 | **PENDING** |
| U4 | **결제 3단계 (네이티브)** | `PENDING_PAYMENT` → 입금 → 승인 | **PENDING** |
| U5 | **웹 Secondary + STAFF** | Primary disabled·웹 CTA; STAFF 검수 탭 없음 | **PENDING** |

---

## 7. 코더 완료 후 core-tester 체크리스트

- [x] §2 C2 표 9항 정적 채움
- [x] §4.2 명령 1~3 실행·결과 기록
- [x] §4.2 focused — 1d utils **25** tests **PASS**
- [ ] §4.2 `tsc` — **FAIL** → `core-coder` (`AdminMappingPaymentConfirmModal.tsx` payment method union)
- [ ] §5 G3 실기기 6항 designer 합치
- [ ] §6 UAT 5줄
- [ ] `ADMIN_MOBILE_COMMERCIALIZATION_ORCHESTRATION.md` §7 스냅샷 (별도 배치)
- [x] FAIL/CONDITIONAL 시 재위임: **tsc** · **C2-07** (`user-management` → `AdminFabActionSheet`) · **C2-08** 일정 `ScheduleCard` safeDisplay

---

## 8. 변경 이력

| 날짜 | 변경 |
|------|------|
| 2026-05-18 | **초안 (PRE-CODER)** — C2 검증 표·G3 6항·UAT 5줄·baseline 17/96 |
| 2026-05-18 | **C2 재검증** — 정적 7P+2C; Jest 18/99·focused 4/25; **tsc FAIL**; G3 STATIC 4/6; 종합 **CONDITIONAL** |
