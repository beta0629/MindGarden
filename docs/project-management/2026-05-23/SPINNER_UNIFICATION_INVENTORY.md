# Spinner Unification Inventory (2026-05-23)

> 위임 출처: 사용자 보고 "웹 스피너(로딩바) 통일, 현재 로딩바는 깨지고 있어 돌아가는게 엇박자".
> 위임 채널: `core-coder` (frontend) — SSOT 단일화 + jitter 제거.

## 1. 원인 분석 (왜 엇박자가 발생하는가)

`@keyframes` 정의 자체는 50+ 곳에 흩어져 있지만, **회전 보간(curve)**·**duration**·**timing-function**이 일관되지 않아 시각적으로 엇박자처럼 보이는 화면이 다수 있다. 가장 큰 원인은 다음 두 가지다.

### A. `ease-in-out` 타이밍 (가속·감속 회전)

회전 스피너는 일반적으로 `linear` 가 표준이다. `ease-in-out`은 360° 회전마다 가속·감속이 발생해 **육안으로 엇박자처럼** 보인다. 다음 활성 CSS 파일에서 `ease-in-out`이 사용되고 있어 **즉시 수정** 대상이다.

| 파일 | 라인 | 현재 값 |
|------|------|---------|
| `frontend/src/styles/auth/TabletLogin.css` | 435 | `animation: spin 1s ease-in-out infinite;` |
| `frontend/src/styles/tablet/index.css` | 1320 | `animation: spin 1s ease-in-out infinite;` |
| `frontend/src/styles/tablet/index.css` | 1554 | `animation: spin 1s ease-in-out infinite;` |
| `frontend/src/styles/tablet/index.css` | 1833 | `animation: spin 1s ease-in-out infinite;` |
| `frontend/src/styles/index.css` | 138 | `animation: spin 1s ease-in-out infinite;` |

### B. compositor jank (메인 스레드 점유)

`will-change: transform`이 없거나 `transform-origin`이 명시되지 않으면 브라우저가 매 프레임 레이아웃·페인트 비용을 새로 계산해 **마이크로 잰크**가 발생한다. SSOT 컴포넌트(`UnifiedLoading` / `.mg-loading-spinner-icon`)부터 적용한다.

### C. 컴포넌트 산재 (디자인 비통일)

여러 화면이 자체 `LoadingSpinner` / `MGLoading` / `Spinner` / `LoadingState` / 자체 CSS `.spinner` 를 사용해 사이즈·색·테두리 두께가 달라 같은 앱에서 다른 모양의 스피너가 보인다.

---

## 2. 산재 인벤토리 (정의 카운트)

### 2.1 React 컴포넌트 (스피너/로딩 책임)

| 경로 | 상태 | 결정 |
|------|------|------|
| `frontend/src/components/common/UnifiedLoading.js` | 살아있음 — SSOT 후보 | **강화 → SSOT** |
| `frontend/src/components/common/CommonLoading.js` | `UnifiedLoading` 래퍼 | 유지 (호환 래퍼) |
| `frontend/src/components/common/MGLoading.js` + `.css` | **사용처 없음** (orphan) | **삭제** |
| `frontend/src/components/common/LoadingSpinnerDemo.js` + `.css` | `LoadingSpinner` 임포트 — 파일 없음 (broken) | **UnifiedLoading 기반으로 재작성** |
| `frontend/src/components/common/LoadingSpinner.css` | 자체 `.loading-spinner-*` 정의 — 사용처 없음 | **삭제 (orphan)** |
| `frontend/src/components/ui/Loading/Loading.js` | 이미 `UnifiedLoading` 재export | 유지 |
| `frontend/src/components/ui/Loading/Spinner.js` | 자체 `.mg-spinner` div | **UnifiedLoading 래퍼로 교체** |
| `frontend/src/components/academy/shared/LoadingState.js` + `.css` | `<Spinner>` 사용 | **`UnifiedLoading` 직접 사용** |
| `frontend/src/components/test/UnifiedLoadingTest.js` | 데모/테스트 페이지 | 유지 |

### 2.2 CSS 정의 (활성 SSOT vs 산재)

| 분류 | 경로 | 비고 |
|------|------|------|
| **SSOT (활성)** | `frontend/src/styles/06-components/_loading.css` | `main.css`에서 import — `mg-loading*` / `mg-spin` 정의 |
| Orphan (미import) | `frontend/src/styles/06-components/_base/_loading.css` | 정의 중복 — **삭제** |
| Orphan (미사용 클래스) | `frontend/src/components/common/LoadingSpinner.css` | **삭제** |
| 전역 1 | `frontend/src/styles/unified-design-tokens.css` | `.mg-spinner` (3292), `.mg-v2-spinner` (15742), `.mg-spinner--sm` (8740) — 디자인 토큰 + 토큰 외 정의 혼재. **추가 토큰만 신규**, 기존 정의는 유지 (호환성) |
| 전역 2 | `frontend/src/styles/mindgarden-design-system.css` | 자체 `mg-spin` 정의 |
| 전역 3 | `frontend/src/styles/index.css` (138) | jitter 원인 — **수정** |
| 전역 4 | `frontend/src/styles/common/components.css` | `@keyframes spin` 2회 |
| 인증/태블릿 | `frontend/src/styles/auth/TabletLogin.css`, `frontend/src/styles/tablet/index.css` | jitter 원인 — **수정** |

### 2.3 컴포넌트별 자체 `@keyframes spin` (54개 파일)

대부분 자체 컴포넌트의 **아이콘 회전(예: refresh, loading dot, 카드 로딩)** 용으로 정의된 동일 내용(`0% → 100% rotate`)이며 등속이라 **단독으로는 엇박자를 유발하지 않는다.** 다만 SSOT 통합 차원에서 향후 `mg-spinner-spin` 으로 점진 마이그레이션 권장.

대표 파일: `MGButton.css`, `MGForm.css`, `MGPagination.css`, `MGTable.css`, `MGFilter.css`, `MGStatistics.css`, `MGChart.css`, `iPhone17Button.css`, `HealingCard.css`, `StatisticsCard.css`, `SimpleHamburgerMenu.css`, `SimpleHeader.css`, `ScheduleList.css`, `SchedulePage.css`, `TodayStats.css`, `BranchLogin.css`, `WellnessManagement.css`, `CommonCodeList.css`, `CacheMonitoringDashboard.css`, `SecurityMonitoringDashboard.css`, `SystemConfigManagement.css`, `SystemStatus.css`, `SystemTools.css`, `TenantCodeManagement.css`, `TodayStatistics.css`, `ConsultantTransferHistory.css`, `ConsultantRecords.css`, `ClientRegistrationWidget.css`, `ConsultantRegistrationWidget.css`, `HealingCardWidget.css`, `Widget.css` (3개), `DashboardWidgetManager.css`, `PredictionDashboard.css`, `EmotionDashboard.css`, `ErdListPage.css`, `ErdDetailPage.css`, `ClinicalRiskAlertBadge.css`, `DiagnosticReportEditor.css`, `SmartNoteTab.css`, `BillingCallback.css`, `IntegrationTest.css`, `PaymentTest.css`.

→ 본 PR 범위: **수정하지 않는다** (jitter 무관, 사용처가 자체 아이콘 회전용). 다만 `mg-spin` SSOT 키프레임이 명시적으로 존재하므로, 후속 PR에서 점진 일원화 가능.

---

## 3. 사용처 인벤토리 (JSX 사용)

| 패턴 | 사용처 카운트 (예시) |
|------|---------------------|
| `<UnifiedLoading ...>` | 100+ 파일 (이미 광범위 마이그레이션 완료) |
| `<MGLoading ...>` | **0** (orphan — 안전하게 삭제 가능) |
| `<Spinner ...>` | 1 (`academy/shared/LoadingState.js`) + 1 (스피너 자체 docstring) |
| `<LoadingSpinner ...>` | 1 (`LoadingSpinnerDemo.js` — 깨진 import) |
| `<CommonLoading|InlineLoading|FullscreenLoading|PageLoading|ButtonLoading|DataLoading>` | 다수 (CommonLoading.js 래퍼, UnifiedLoading로 위임 중) |
| `<LoadingState ...>` | 다수 (academy 영역) |

→ **본 PR 마이그레이션 핵심 대상**: `MGLoading.js`(orphan 삭제), `Spinner.js`(SSOT 래퍼), `LoadingState.js`(SSOT 직접 호출), `LoadingSpinnerDemo.js`(재작성), 미 import 되는 CSS 파일 2개 삭제.

---

## 4. 목표 (KPI)

| 항목 | Before | After (이 PR) |
|------|--------|---------------|
| SSOT React 컴포넌트 수 | 5종 (UnifiedLoading, MGLoading, Spinner, LoadingState, LoadingSpinner) | **1종** (UnifiedLoading), 나머지는 thin re-export/wrapper |
| 자체 `ease-in-out` 회전 스피너 | 5개 활성 위치 | **0** |
| jitter 핵심 CSS 보강 | 없음 | `will-change`·`transform-origin`·`backface-visibility`·`prefers-reduced-motion` |
| Orphan CSS 파일 | 2 (`_base/_loading.css`, `LoadingSpinner.css`) | **0** |
| 디자인 토큰 (스피너 사이즈/색/duration) | 없음 | `--mg-spinner-size-{xs,sm,md,lg,xl}`, `--mg-spinner-duration`, `--mg-spinner-thickness`, `--mg-spinner-track-color`, `--mg-spinner-accent-color` 추가 |
| `<Spinner>` / `<MGLoading>` 사용처 | 2/0 | **0** (모두 SSOT로 위임) |

---

## 5. 후속 권장 (이 PR 범위 외)

- **PR-B**: `mg-spin` SSOT 키프레임을 신규 `mg-spinner-spin` prefix로 통일하고, 컴포넌트별 자체 `@keyframes spin` 50+ 곳을 점진 제거 (codemod 가능).
- **PR-C**: `mg-v2-spinner`, `.mg-spinner--sm` 등 `unified-design-tokens.css` 내부 중복 정의 정리 (디자인 토큰 SSOT 정합).
- **시각 회귀**: `core-tester`에 위임 (Storybook/Chromatic 또는 Playwright 스냅샷).
- **운영 반영 게이트**: `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` 답습 — 본 PR 신규 하드코딩 0건 목표.

---

---

## 6. 실행 결과 (Phase 2 — 2026-05-23)

### 6.1 변경 통계

```
18 files changed, 651 insertions(+), 1641 deletions(-)
순 LOC −990 (덜어내기 위주)
```

| 분류 | 변경 |
|------|------|
| SSOT 강화 | `UnifiedLoading.js` (+160), `_loading.css` (재구성: +400/−397) |
| 디자인 토큰 신설 | `--mg-spinner-size-{xs,sm,md,lg,xl}`, `--mg-spinner-thickness-*`, `--mg-spinner-duration`, `--mg-spinner-track-color`, `--mg-spinner-accent-color` (`_loading.css` 상단) |
| 키프레임 SSOT | `mg-spinner-spin` 신설 + `mg-spin` 레거시 alias 유지 |
| 위임 래퍼 변경 | `ui/Loading/Spinner.js`, `academy/shared/LoadingState.js`, `LoadingSpinnerDemo.js` |
| `<div className="mg-spinner" />` → `<UnifiedLoading>` 마이그레이션 | 5건 (`ErpPurchaseRequestPanel`, `HealingCard`, `ConsultationRecordSection`, `ConsultantRatingDisplay`, `DashboardWidgetManagerPresentation`) |
| 자체 `ease-in-out` 회전 → `linear` | 5건 (`TabletLogin.css`, `index.css`, `tablet/index.css` × 3) |
| 삭제 (orphan) | `MGLoading.js` + `.css`, `LoadingSpinner.css`, `_base/_loading.css` (총 1,144 LOC 정리) |

### 6.2 jitter fix 핵심 CSS diff (요약)

```css
/* Before — 산재된 .mg-spinner */
animation: spin 1s ease-in-out infinite;  /* 가속·감속 → 엇박자 */

/* After — _loading.css SSOT */
.mg-loading-spinner-icon {
  animation: mg-spinner-spin var(--mg-spinner-duration) linear infinite;
  transform-origin: 50% 50%;
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
```

### 6.3 접근성 강화

- `role="status"`, `aria-live="polite"`, `aria-busy="true"`, `aria-label` 자동 부여
- `@media (prefers-reduced-motion: reduce)` 대응 — 회전·바운스 정지, 페이드만 표시

### 6.4 테스트 결과

- 신규: `frontend/src/components/common/__tests__/UnifiedLoading.test.jsx` — **35 테스트 전부 통과**
- 전체 회귀: `craco test --watchAll=false` — **49 suites, 396 tests 전부 통과** (0 regression)
- 린트: 변경 파일 `npx eslint --max-warnings 0` — **0 warning / 0 error**
- 하드코딩 색상: `_loading.css` `#hex`/`rgb()` 검색 결과 **0건**

### 6.5 시각 회귀 사전 점검 체크리스트 (core-coder 자체)

| 항목 | 결과 |
|------|------|
| `<UnifiedLoading>` 기본 (spinner / md / primary) — DOM 구조 동일 | ✓ |
| 레거시 size (`small/medium/large`) 별칭 → 신규 (`sm/md/lg`) 매핑 | ✓ (테스트) |
| 기존 사용처 (`CommonLoading`, `Loading.js`, `Spinner.js`, `LoadingState.js`) Props 시그니처 호환 | ✓ |
| 자체 `.mg-spinner` div 5건 마이그레이션 후 동일 텍스트·동일 영역 차지 | ✓ (수동) |
| `prefers-reduced-motion` 적용 시 회전 정지 | ✓ (CSS) |
| `tone` 별 색상 변화 — 디자인 토큰 매핑 | ✓ (테스트 + CSS) |
| 모바일/태블릿 반응형 사이즈 동작 | ✓ (CSS @media 유지) |

**본격 시각 회귀 검증은 `core-tester`로 별도 위임 권고** (Playwright 스냅샷 / Chromatic / 라이브 페이지 캡처 등).

### 6.6 운영 반영 권고

1. **본 PR 자체**: 신규 하드코딩 색상 0건, 키프레임·classname 충돌 없음 → develop 안전 머지.
2. **시각 회귀**: `core-tester` 위임 — 핵심 페이지(로그인, 어드민 대시보드, ERP, 상담 일지, 위젯 관리, 힐링 카드, 평가 표시) 스피너 표시 화면 캡처 비교 권장.
3. **운영 반영 게이트** (`docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`): 본 PR에서 신규 하드코딩 0건. 기존 207개 파일 하드코딩(2729개)은 본 PR 범위 외.
4. **후속 PR-B/C** (선택): 컴포넌트별 자체 `@keyframes spin` 50+ 개 점진 통합, `unified-design-tokens.css` 내 `.mg-spinner` / `.mg-v2-spinner` / `.mg-spinner--sm` 중복 정리.

---

@author MindGarden (core-coder)
@since 2026-05-23
@version 1.1.0 (실행 결과 추가)
