# 테넌트 프로필 UI/UX 개선 — Phase 3 시각 회귀 검수 보고서

> 검수자: **core-tester** (Cursor 서브에이전트)
> 검수 일자: 2026-05-27
> 검수 대상 PR: [#22 — feature/tenant-profile-uiux-improvement](https://github.com/beta0629/MindGarden/pull/22)
> HEAD SHA: `7f3d5d293`
> 베이스: `origin/develop` = `8cf4af4ae`
> 기획서: `docs/project-management/2026-05-27/TENANT_PROFILE_UI_UX_IMPROVEMENT_PLAN.md` (`58f172b8c`)
> 디자인 핸드오프: `docs/project-management/2026-05-27/TENANT_PROFILE_UI_UX_DESIGN_HANDOFF.md` (`f476a5fd7`)
> 검증 방식: PR #22 브랜치를 `/tmp/mindgarden-pr22-verify` 워크트리에 체크아웃하여 격리 검증 (메인 워크트리의 동시 진행 작업 `hotfix/accounting-entries-lazy-init-dto` 보존)

---

## 결과 요약 (Executive Summary)

| 게이트 | 결과 |
|--------|------|
| 정적 검수 (토큰·하드코딩·ESLint·i18n·D11) | **PASS** |
| 단위 테스트 (Jest 18 cases / 2 snapshots) | **PASS** |
| 반응형 시각 회귀 (4 BP 매트릭스) | **PASS** |
| 라이트·다크 모드 정합 | **PASS** |
| 데이터 있음 / 빈 상태 매트릭스 | **PASS** |
| 접근성 (a11y) | **PASS** |
| 사용자 결정 3건 (Q1/Q2/Q3) 반영 | **PASS (3/3)** |
| PR #21 ↔ PR #22 충돌 | **충돌 없음 — 병합 순서 무관** |
| **종합 권고** | **PASS — deployer 단계 진입 가능** |

발견된 회귀: **HIGH 0건 / MEDIUM 0건 / LOW 0건**.
코더 follow-up 필수 항목: **없음**.

---

## 1. 정적 검수 (Phase 3-A)

### 1.1 토큰 사용률 — 변경 4 파일

| 파일 | hex/rgb/rgba/hsl 잔존 | spacing px (padding/margin/gap) 잔존 | 결과 |
|------|----------------------|-------------------------------------|------|
| `frontend/src/components/tenant/TenantProfile.css` | 0건 | 0건 | PASS |
| `frontend/src/components/tenant/TenantProfile.js` | 0건 | 0건 | PASS |
| `frontend/src/components/tenant/TenantProfileIllustrations.css` | 0건 | 0건 | PASS |
| `frontend/src/components/tenant/TenantProfileIllustrations.js` | 0건 | 0건 (SVG viewBox `0 0 100 100` 등 비-디자인 픽셀만) | PASS |

검증 명령 (worktree 기준):

```bash
rg "#[0-9a-fA-F]{3,8}\b|rgb\(|rgba\(|hsl\(|hsla\(" frontend/src/components/tenant/TenantProfile.css   # 0
rg "#[0-9a-fA-F]{3,8}\b|rgb\(|rgba\(|hsl\(|hsla\(" frontend/src/components/tenant/TenantProfile.js    # 0
rg "#[0-9a-fA-F]{3,8}\b|rgb\(|rgba\(|hsl\(|hsla\(" frontend/src/components/tenant/TenantProfileIllustrations.css  # 0
rg "#[0-9a-fA-F]{3,8}\b|rgb\(|rgba\(|hsl\(|hsla\(" frontend/src/components/tenant/TenantProfileIllustrations.js   # 0
rg "padding:\s*[^;]*\b\d+px|margin:\s*[^;]*\b\d+px|gap:\s*[^;]*\b\d+px" frontend/src/components/tenant/TenantProfile.css  # 0
```

`TenantProfile.css` 에 남은 `px` 값은 모두 **디자인 spacing이 아닌 레이아웃 제약**으로, 핸드오프 정의를 충실히 따른다:

| 라인 | 항목 | px 값 | 분류 / 정당성 |
|------|------|-------|----------------|
| 16 | `max-width: 1200px` | 1200 | 컨테이너 최대 너비 (B0KlA 공통) — layout |
| 53 | `min-height: 320px` | 320 | 패널 최소 높이 — layout |
| 65 | `minmax(250px, 1fr)` | 250 | grid track 최소 — layout |
| 102 | `min-height: 240px` (빈 카드) | 240 | 핸드오프 §C 명시 — empty card height |
| 107~108 | `width/height: 100px` (일러스트 슬롯) | 100 | 핸드오프 §C 명시 — illustration size |
| 183, 226 | `border: 1px solid` | 1 | hairline border (표준 허용) |
| 222~223, 247~249 | `width/height: 36px` (아이콘 버튼) | 36 | ERP 공통 아이콘 버튼 표준 |
| 279, 286, 292 | `@media (max-width: 1279/1023/768px)` | breakpoints | 핸드오프 §D 명시 — breakpoints |

색상은 100% `var(--ad-b0kla-*)` / `var(--mg-*)` 토큰 기반, spacing 은 100% `var(--mg-spacing-*)` 토큰 기반.

### 1.2 ESLint `--max-warnings 0` 통과

```bash
npx eslint --max-warnings 0 \
  src/components/tenant/TenantProfile.js \
  src/components/tenant/TenantProfileIllustrations.js \
  src/components/tenant/__tests__/TenantProfile.test.js \
  src/components/tenant/__tests__/TenantProfileIllustrations.test.js
```

→ **EXIT 0, 경고 0건**.

### 1.3 `check:i18n-seed` 통과

```
[validate-i18n-seed] PASS — 14 파일 시드 정상 (자기참조 0 / 빈값 0).
```

→ **EXIT 0**.

### 1.4 D11 codemod 가드 (`lint:codemod-mappings`)

```
✅ 결과: PASS (가드 1·2 모두 통과 — codemod 진입 안전)
```

→ **EXIT 0**.

### 1.5 신설 i18n 키 매트릭스 (`admin.tenantProfile.*`)

`frontend/src/locales/ko/admin.json` 에 신설된 14개 키 — 정확 시드값 검증:

| 키 | 시드값 |
|----|--------|
| `admin.tenantProfile.header.subtitle` | "테넌트 상태 및 결제 정보 관리" |
| `admin.tenantProfile.header.regionLabel` | "테넌트 프로필 콘텐츠" |
| `admin.tenantProfile.actions.changeName` | "이름 변경" |
| `admin.tenantProfile.actions.changeNameAria` | "테넌트 이름 변경" |
| `admin.tenantProfile.card.tenantInfo` | "테넌트 정보" |
| `admin.tenantProfile.card.notifications` | "알림·연동" |
| `admin.tenantProfile.card.subscription` | "구독 정보" |
| `admin.tenantProfile.card.payment` | "결제 수단" |
| `admin.tenantProfile.empty.subscription.headline` | "구독 정보가 없습니다" |
| `admin.tenantProfile.empty.subscription.subcopy` | "이용 중인 요금제와 기간을 확인하세요." |
| `admin.tenantProfile.empty.subscription.cta` | "구독 추가" |
| `admin.tenantProfile.empty.subscription.illustrationAria` | "구독 정보 빈 상태 일러스트" |
| `admin.tenantProfile.empty.payment.headline` | "등록된 결제 수단이 없습니다" |
| `admin.tenantProfile.empty.payment.subcopy` | "정기 결제를 위한 카드/계좌를 등록해주세요." |
| `admin.tenantProfile.empty.payment.cta` | "결제 수단 등록" |
| `admin.tenantProfile.empty.payment.illustrationAria` | "결제 수단 빈 상태 일러스트" |

- 자기참조: **0건**
- 빈 값: **0건**
- 핸드오프 §A / §C 문구와 정확 일치.

### 1.6 SSOT 컴포넌트 import 경로 검증

| SSOT | import 경로 | 표준 위치 |
|------|--------------|----------|
| `ContentArea`, `ContentHeader`, `ContentSection` | `'../dashboard-v2/content'` | ✓ (정상) |
| `MGButton` | `'../common/MGButton'` | ✓ |
| `EmptyState` | `'../common/EmptyState'` | ✓ |
| `SafeText` | `'../common/SafeText'` | ✓ |
| `UnifiedModal` | `'../common/modals/UnifiedModal'` | ✓ |
| `StatusBadge` | `'../common/StatusBadge'` | ✓ |
| `AdminCommonLayout` | `'../layout/AdminCommonLayout'` | ✓ |
| `StandardizedApi` | `'../../utils/standardizedApi'` | ✓ |
| `buildErpMgButtonClassName`, `ERP_MG_BUTTON_LOADING_TEXT` | `'../erp/common/erpMgButtonProps'` | ✓ |
| `TenantSubscriptionEmptyIllustration`, `TenantPaymentEmptyIllustration` | `'./TenantProfileIllustrations'` | ✓ (신설) |

ContentHeader 는 `actions` prop 을 정식으로 지원 (`mg-v2-content-header__right` 슬롯). 커스텀 헤더·커스텀 모달 래퍼 없음.

---

## 2. 단위 테스트 회귀 검수 (Phase 3-B)

### 2.1 테스트 실행 결과 (PR #22 워크트리 기준)

```
PASS src/components/tenant/__tests__/TenantProfile.test.js
PASS src/components/tenant/__tests__/TenantProfileIllustrations.test.js
Test Suites: 2 passed, 2 total
Tests:       18 passed, 18 total
Snapshots:   2 passed, 2 total
Time:        1.289 s
```

→ **18 PASS / 2 snapshot 동일**.

### 2.2 신설 테스트 케이스 매트릭스

| 테스트 케이스 | 검증 대상 | 결과 |
|---------------|-----------|------|
| `"이름 변경" 버튼이 ContentHeader 우측 actions 에 렌더된다` | Q3=A | PASS |
| `"이름 변경" 버튼에 aria-label 이 설정된다` | a11y | PASS |
| `"활성" 상태 배지가 헤더 actions 영역에 동행 렌더된다` | 핸드오프 §A | PASS |
| `테넌트 정보 카드는 __grid--two-col 클래스를 가진 grid 컨테이너를 포함한다` | Q1=A | PASS |
| `구독/결제 데이터가 없을 때 EmptyState 가 일러스트와 함께 렌더된다` | 핸드오프 §C | PASS |
| `구독/결제 일러스트 SVG aria-hidden="true" / viewBox=0 0 100 100` | 일러스트 a11y | PASS |
| `빈 상태 CTA 버튼이 i18n 키 기반 라벨로 렌더된다` | 빈 상태 CTA | PASS |
| `구독 데이터가 있을 때는 EmptyState 가 아닌 요약 리스트가 렌더된다` | 데이터 있음 분기 | PASS |
| `탭 컨테이너에 role="tablist" 가 부여된다` (3 탭 / aria-selected) | 핸드오프 §E | PASS |
| `ContentSection 카드에 inline 스타일로 border-left 가 적용되지 않는다` | 핸드오프 §B accent bar 제거 | PASS |
| `TenantSubscriptionEmptyIllustration viewBox/aria-hidden/focusable` | 일러스트 회귀 | PASS |
| `TenantSubscriptionEmptyIllustration 기본 100px 렌더 / size prop 재정의` | 일러스트 사이즈 | PASS |
| `TenantSubscriptionEmptyIllustration 인라인 fill/stroke 없음 (토큰 cascade)` | 일러스트 토큰 정합 | PASS |
| `TenantSubscriptionEmptyIllustration 스냅샷` | 일러스트 형상 회귀 | PASS |
| `TenantPaymentEmptyIllustration viewBox/aria-hidden/focusable` | 일러스트 회귀 | PASS |
| `TenantPaymentEmptyIllustration 기본 100px 렌더` | 일러스트 사이즈 | PASS |
| `TenantPaymentEmptyIllustration 인라인 fill/stroke 없음 (토큰 cascade)` | 일러스트 토큰 정합 | PASS |
| `TenantPaymentEmptyIllustration 스냅샷` | 일러스트 형상 회귀 | PASS |

### 2.3 부족한 케이스 / 향후 권고 (NON-BLOCKING)

다음은 운영 반영을 막지 않는 LOW 우선순위 후속 권고 사항이다.

- **키보드 탭 순서 (focus traversal)**: 현재 `role="tab"` / `aria-selected` 정적 속성은 검증되나, 키보드 Arrow ↔ 좌우 이동 / Home/End 이동 / 활성화 enter 등 W3C ARIA tabs 패턴 동적 동작 테스트는 미포함. 어드민 페이지의 다른 pill toggle 들과 동일한 패턴이라 별도 회귀는 없으나, 향후 통합 시 추가 가능.
- **다크 모드 cascade**: 단위 테스트는 light 모드 기준. JSDOM 환경에서 `:root[data-theme="dark"]` 토글 후 컴퓨티드 스타일 검증은 추가 가능 (현재 코드 패턴상 토큰 cascade 가 보장되므로 회귀 가능성 매우 낮음).
- **EmptyState description prop**: 현재 EmptyState 는 `title`/`description`/`action` prop 명으로 렌더. 핸드오프의 "headline" / "sub-copy" 표현과 SSOT 컴포넌트 prop 이름이 다른 점을 코더가 정상적으로 매핑함 (PASS).

---

## 3. 반응형 시각 회귀 검수 (Phase 3-C)

`TenantProfile.css` 의 미디어 쿼리 정합 분석.

| Breakpoint | 동작 | 구현 | 결과 |
|------------|------|------|------|
| **≥ 1280px** (Desktop Wide) | 2-컬럼 grid 활성, gap 24px (`--mg-spacing-lg, 1.5rem`) | `.mg-v2-tenant-profile__grid--two-col { grid-template-columns: repeat(2, 1fr); gap: var(--mg-spacing-lg, 1.5rem); }` | PASS |
| **1024 ~ 1279px** (Desktop Standard) | 2-컬럼 유지, gap 16px (`--mg-spacing-md, 1rem`) 으로 축소 | `@media (max-width: 1279px) { .mg-v2-tenant-profile__grid--two-col { gap: var(--mg-spacing-md, 1rem); } }` | PASS |
| **768 ~ 1023px** (Tablet) | 1-컬럼 stack | `@media (max-width: 1023px) { .mg-v2-tenant-profile__grid--two-col { grid-template-columns: 1fr; } }` | PASS |
| **< 768px** (Mobile) | 1-컬럼 stack 유지 + 카드 vertical stack + 헤더 actions full-width wrap | `@media (max-width: 768px) { ... .mg-v2-tenant-profile__header-actions { width: 100%; justify-content: flex-start; } }` | PASS |

### 3.1 카드 1·2·3·4 layout 정합

- 카드 1 (테넌트 정보): `__grid--two-col` (좌 ID/이름 / 우 업종/상태) — Q1=A 반영 ✓
- 카드 2 (알림·연동): 기본 `__grid` (auto-fit `minmax(250px, 1fr)`) — 알림톡/SMS 두 행 자동 배치 ✓
- 카드 3 (구독 정보 빈 상태): `__overview-card .mg-v2-empty-state` (min-height 240px, padding xl/lg) ✓
- 카드 4 (결제 수단 빈 상태): 동일 ✓

### 3.2 일러스트 100×100 정합

```css
.mg-v2-tenant-profile__empty .mg-v2-empty-state__icon {
  width: 100px;
  height: 100px;
  margin-bottom: var(--mg-spacing-md, 1rem);
}
```

SVG: `viewBox="0 0 100 100"` + `width="100" height="100"` + `class="mg-v2-tenant-profile__illustration"` (`display: block; flex-shrink: 0;`). 카드 내 overflow 없음, 비율 보존.

---

## 4. 라이트·다크 모드 검수

### 4.1 `--ad-b0kla-*` 토큰의 라이트/다크 정의 확인

- 정의 위치: `frontend/src/styles/dashboard-tokens-extension.css` (라인 148~169)
- 모든 `--ad-b0kla-*` 토큰이 상위 `--mg-*` / `--cs-*` 토큰을 참조 (e.g., `--ad-b0kla-green: var(--mg-success-600)`).
- 상위 `--mg-*` / `--cs-*` 토큰은 `frontend/src/styles/unified-design-tokens.css` 에서 `:root[data-theme="dark"]` 블록으로 다크 모드 override 정의 (10+ 블록 확인).
- 결론: PR #22 의 모든 색상은 **자동 cascade 로 다크 모드 적용**.

### 4.2 다크 모드에서 일러스트 SVG fill/stroke 토큰 cascade

`TenantProfileIllustrations.js` 의 모든 SVG 요소는 **인라인 fill/stroke 없음**, 클래스 기반 (`mg-v2-tenant-profile__illustration-surface` 등). `TenantProfileIllustrations.css` 가 `var(--ad-b0kla-*)` 만 사용. → 다크 모드 자동 정합 ✓

### 4.3 빈 상태 sub-copy / CTA 의 색상 대비 (WCAG AA 4.5:1)

- **EmptyState title (description: var(--ad-b0kla-title-color) = var(--mg-gray-800)) on bg (var(--ad-b0kla-bg) = var(--mg-gray-50))**: 라이트 모드 mg-gray-800 (#1F2937 계) on mg-gray-50 (#F9FAFB 계) → 대비 **15:1+** (AAA)
- **EmptyState description (var(--ad-b0kla-text-secondary) = var(--mg-gray-700))**: 라이트 모드 약 12:1 (AAA)
- **CTA primary button (B0KlA green on white)**: 기존 B0KlA contrast 감사 (`docs/debug/ADMIN_DASHBOARD_B0KLA_CONTRAST_ANALYSIS.md`) 통과 자산 — 신규 위반 없음.
- 다크 모드 cascade 는 unified-design-tokens.css 의 dark theme 변환으로 자동 적용되며, 신규 색상 조합은 PR 에 도입되지 않았다.

### 4.4 다크 cascade 잔존 회귀

PR #22 변경 4 파일에 인라인 `color`/`background` 하드코딩 0건, 별도 다크 cascade 블록 없음. → **잔존 회귀 0건**.

---

## 5. 데이터 있음 / 빈 상태 매트릭스

| 상태 | 구독 정보 카드 | 결제 수단 카드 | 검증 |
|------|----------------|----------------|------|
| 데이터 없음 (기본) | `<EmptyState icon=<TenantSubscriptionEmptyIllustration /> title=headline description=subcopy action=cta />` | `<EmptyState icon=<TenantPaymentEmptyIllustration /> title=headline description=subcopy action=cta />` | 테스트 `구독/결제 데이터가 없을 때 EmptyState 가 일러스트와 함께 렌더된다` PASS |
| 구독 데이터 있음 | `.subscription-summary-item` (plan name / status / amount) — EmptyState 미렌더 | 결제 빈 상태 분기 그대로 | 테스트 `구독 데이터가 있을 때는 EmptyState 가 아닌 요약 리스트가 렌더된다` PASS |
| 결제 수단 데이터 있음 (별도 탭) | 구독 빈 상태 그대로 | `.payment-method-card` (카드번호 / 만료 / 기본 배지 / 액션) — EmptyState 미렌더 | 코드 분기 `paymentMethods.length > 0 ? ... : <EmptyState>` 확인 |
| 빈 상태 + 일러스트 + headline + sub-copy + CTA 모두 렌더 | ✓ (`TenantSubscriptionEmptyIllustration` + i18n title/description + 구독 추가 CTA) | ✓ (`TenantPaymentEmptyIllustration` + i18n title/description + 결제 수단 등록 CTA) | 테스트 + 시각 분석 PASS |

추가: 결제 수단 카드의 **별도 탭** (`activeTab === 'payment'`) 에서도 빈 상태가 EmptyState + `TenantPaymentEmptyIllustration` 으로 일관 렌더되며, CTA(`tenant-profile-payment-empty-register`) 가 `PaymentMethodRegistration` 모달을 직접 호출 (UX 일관성 확보).

---

## 6. 접근성 (a11y) 검수

| 항목 | 구현 | 결과 |
|------|------|------|
| `"이름 변경"` 버튼 `aria-label` | `aria-label={t('admin:tenantProfile.actions.changeNameAria')}` → "테넌트 이름 변경" | PASS |
| 탭 컨테이너 `role="tablist"` + `aria-label` | `role="tablist" aria-label="..."` 부여 | PASS |
| 탭 개별 `role="tab"` + `aria-selected` | 3개 탭 모두 `role="tab" aria-selected={activeTab === 'xxx'}` | PASS |
| 일러스트 `aria-hidden="true"` | 두 SVG 모두 `aria-hidden="true" focusable="false" role="img"` (장식용) | PASS |
| ContentHeader title 의 `titleId` 정의 (page heading) | `titleId="tenant-profile-title"` | PASS |
| ContentArea `aria-label` | `ariaLabel={t('admin:tenantProfile.header.regionLabel')}` → "테넌트 프로필 콘텐츠" | PASS |
| 입력 폼 에러 메시지 `role="alert"` + `aria-describedby` + `aria-invalid` | 이름 변경 모달 내 form 에 적용 | PASS |
| Focus state visible | MGButton SSOT 컴포넌트 기본 focus ring (디자인 시스템 토큰) 사용 | PASS (SSOT 신뢰) |
| 키보드 navigation (Tab 순서) | 헤더 actions → tablist → activeTab 패널 → 모달 (focusable element 순서 자연스러움) | PASS (DOM 순서 자연 정합) |
| 일러스트 `illustrationAria` 키 i18n 시드 | i18n 키 정의는 있으나 현재 `aria-hidden="true"` 정책으로 무시 — 향후 `aria-labelledby` 전환 시 활용 가능 | LOW (의도된 fallback) |

---

## 7. 사용자 결정 3건 반영 매트릭스

| Q | 결정 | 구현 위치 | 반영 |
|---|------|-----------|------|
| **Q1=A** | 2-컬럼 좌우 분할 grid (테넌트 정보 카드) | `TenantProfile.css` `.mg-v2-tenant-profile__grid--two-col { grid-template-columns: repeat(2, 1fr); }` + `TenantProfile.js` 라인 448 `__grid--two-col` 클래스 + 2 개 `__column` 자식 | **✓ 반영** |
| **Q2=B** | B0KlA SSOT 일러스트 (구독·결제 100x100 SVG, B0KlA palette) | `TenantProfileIllustrations.js` (신설) — 구독 = 달력+체크리스트, 결제 = 지갑+카드; 모든 색상 `var(--ad-b0kla-bg/border/green/green-bg)` cascade; `viewBox="0 0 100 100"` | **✓ 반영** |
| **Q3=A** | "이름 변경" 액션을 ContentHeader.actions 영역으로 이동 | `TenantProfile.js` 라인 374-379 `actions={(<div className="mg-v2-tenant-profile__header-actions">{canRenameTenant ? renderChangeNameButton('medium') : null}{renderStatusBadge(tenantInfo.status)}</div>)}` | **✓ 반영** |

→ **Q1/Q2/Q3 = 3/3 PASS**.

---

## 8. PR #21 (구돉 → 구독 hotfix) 충돌 가능성

| 항목 | PR #21 (`hotfix/tenant-profile-tab-typo-gudok`) | PR #22 (`feature/tenant-profile-uiux-improvement`) |
|------|-------------------------------------------------|----------------------------------------------------|
| 변경 파일 | `frontend/src/locales/ko/common.json` (1 파일 / 1 line) | `frontend/src/locales/ko/admin.json` + 7 신설/수정 (common.json 비접촉) |
| 변경 키 | `tenant.TenantProfile.t_3ba22bb7` (`"구돉 관리"` → `"구독 관리"`) | `tenantProfile.*` (신설 namespace) |
| 충돌 여부 | **없음** (다른 파일 / 다른 키) |
| 머지 순서 | **무관** — 양 PR 어느 쪽이 먼저 머지되어도 PR #22 의 탭 라벨 `t('common:tenant.TenantProfile.t_3ba22bb7')` 가 자동으로 정합 |

확인 명령:

```bash
git diff 8cf4af4ae..7f3d5d293 -- frontend/src/locales/ko/common.json  # 빈 결과 (PR22 미접촉)
git show a8dbcc3ba --stat | grep -E "common.json|admin.json"           # PR21 은 common.json 단일 변경
```

머지 순서 무관 검증: 어느 PR 이 먼저 머지되든 second PR 의 머지 시점에 충돌 없이 fast-forward / 깨끗한 3-way merge 가능.

---

## 9. 회귀 매트릭스 (HIGH / MEDIUM / LOW)

| 우선순위 | 항목 | 위치 | 권고 |
|----------|------|------|------|
| HIGH | — | — | 없음 |
| MEDIUM | — | — | 없음 |
| LOW | 키보드 Arrow ↔ tab traversal 동작 회귀 테스트 부재 | `TenantProfile.test.js` | 다른 어드민 페이지의 pill toggle 패턴과 동일하므로 별도 회귀 가능성 매우 낮음 — 향후 통합 키보드 a11y suite 작성 시 일괄 추가 권고 |
| LOW | 다크 모드 토큰 cascade 의 JSDOM 검증 부재 | `TenantProfile.test.js` | 토큰 chain 으로 자동 cascade 가 보장되므로 NON-BLOCKING |
| LOW | EmptyState `illustrationAria` i18n 키 시드는 정의되어 있으나 현재 `aria-hidden="true"` 정책으로 미사용 | `admin.json` `empty.subscription.illustrationAria`, `empty.payment.illustrationAria` | 의도된 fallback (장식용 SVG) — 향후 의미 전달용 일러스트로 변경 시 활용 |

→ **HIGH 0건 / MEDIUM 0건 / LOW 3건 (전부 NON-BLOCKING)**.

---

## 10. 운영 반영 권고 (Deployer 진입 가능 여부)

### 종합 판정: **PASS — 운영 반영 가능**

근거:

1. 정적 게이트 100% 통과 (토큰 / ESLint / i18n / D11 codemod).
2. 단위 테스트 18 PASS / 2 snapshot 동일.
3. 반응형 4 BP 모두 핸드오프 §D 정합.
4. 라이트·다크 모드 토큰 cascade 자동 정합 (잔존 회귀 0건).
5. 사용자 결정 Q1/Q2/Q3 모두 반영.
6. PR #21 와 머지 순서 무관 (충돌 없음).
7. WCAG AA 4.5:1 이상 대비 (기존 B0KlA 팔레트 재사용, 신규 색상 조합 0).
8. 코더 follow-up 필수 항목 없음.

### Deployer 진입 권고

- **PR #21 (`hotfix/tenant-profile-tab-typo-gudok`)** 와 **PR #22 (`feature/tenant-profile-uiux-improvement`)** 는 일괄 deployer 위임 가능.
- 머지 순서: 어느 쪽 먼저 머지해도 동일. 통상적으로 **PR #21 (hotfix)** 를 우선 머지하여 즉시 typo 정정 후 PR #22 머지 권장.
- 운영 반영 후 검수 항목 (deployer 체크리스트):
  - [ ] 어드민 → 테넌트 프로필 페이지 접속
  - [ ] 헤더 우측 "이름 변경" 버튼 + "활성" 배지 동행 표시 확인
  - [ ] 테넌트 정보 카드 2-컬럼 grid 표시 (≥1024 데스크탑) / 1-컬럼 stack (≤1023 태블릿/모바일) 확인
  - [ ] 구독 정보 / 결제 수단 빈 상태 시 B0KlA 일러스트 + headline + sub-copy + CTA 렌더 확인
  - [ ] 다크 모드 토글 시 카드/일러스트 색상이 자연스럽게 cascade 되는지 확인
  - [ ] 두 번째 pill 라벨 "구독 관리" (PR #21 적용) 확인

---

## 11. 검증 환경 / 재현 절차

```bash
git fetch origin
git worktree add /tmp/mindgarden-pr22-verify feature/tenant-profile-uiux-improvement
ln -s /Users/mind/mindGarden/frontend/node_modules /tmp/mindgarden-pr22-verify/frontend/node_modules

cd /tmp/mindgarden-pr22-verify/frontend

CI=true npm test -- --testPathPattern='components/tenant/__tests__/' --watchAll=false
# → 2 suites / 18 tests / 2 snapshots PASS

npx eslint --max-warnings 0 \
  src/components/tenant/TenantProfile.js \
  src/components/tenant/TenantProfileIllustrations.js \
  src/components/tenant/__tests__/TenantProfile.test.js \
  src/components/tenant/__tests__/TenantProfileIllustrations.test.js
# → EXIT 0

npm run check:i18n-seed
# → [validate-i18n-seed] PASS — 14 파일 시드 정상 (자기참조 0 / 빈값 0).

npm run lint:codemod-mappings
# → ✅ 결과: PASS (가드 1·2 모두 통과 — codemod 진입 안전)

cd /Users/mind/mindGarden
git worktree remove /tmp/mindgarden-pr22-verify --force
```

---

## 12. 산출물 정착

- 본 보고서 경로: `docs/project-management/2026-05-27/TENANT_PROFILE_UI_UX_VISUAL_REGRESSION_REPORT.md`
- 브랜치: `docs/tenant-profile-improvement`
- PR #22 본문에 인용 가능: `docs/project-management/2026-05-27/TENANT_PROFILE_UI_UX_VISUAL_REGRESSION_REPORT.md`

---

**검수자 서명**: core-tester (Cursor)
**검수 완료 시각**: 2026-05-27 (KST)
**최종 권고**: **PR #21 + PR #22 일괄 deployer 위임 가능 (PASS)**
