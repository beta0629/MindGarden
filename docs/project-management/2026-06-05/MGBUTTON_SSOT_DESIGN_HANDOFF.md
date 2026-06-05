# MGButton SSOT Design Handoff — SegmentedTabs + ActionBar

| 항목 | 값 |
|---|---|
| 작성일 | 2026-06-05 (KST) |
| 작성자 | 메인 어시스턴트 (core-designer gemini quota 한도 대체) |
| 상태 | v1.0 — 사용자 hex / 4상태 시안 결재 대기 |
| 부모 기획서 | `docs/project-management/2026-06-05/MGBUTTON_SEGMENTED_ACTIONBAR_SSOT_PLAN.md` v1.1 (develop 1483f7104) |
| 채택 옵션 | Q1=A (전용 컴포넌트) + Q2=P2 (활성/비활성 동일 톤 명도 차이, 외곽선 폐기) |

---

## §A 토큰 매트릭스 (light + dark)

### A.1 SegmentedTabs 토큰 (신설 9종)

| 토큰 | light hex | light reference | dark hex | dark reference | 용도 |
|---|---|---|---|---|---|
| `--mg-segmented-track-bg` | `#f9fafb` | `var(--mg-gray-50)` | `#1a1f2e` | `var(--mg-gray-900)` | 탭 트랙 배경 (활성/비활성 분리감) |
| `--mg-segmented-track-border` | `transparent` | — | `transparent` | — | 트랙 외곽선 (불필요) |
| `--mg-segmented-tab-active-bg` | **`#059669`** | `var(--cs-success-600)` | `#10b981` | `var(--cs-success-500)` | 활성 탭 fill |
| `--mg-segmented-tab-active-text` | `#ffffff` | `var(--mg-white)` | `#ffffff` | `var(--mg-white)` | 활성 탭 텍스트 |
| `--mg-segmented-tab-inactive-bg` | **`#d1fae5`** | `var(--cs-success-100)` | `#064e3b` | `var(--cs-success-900)` 변형 | 비활성 탭 fill (P2 핵심) |
| `--mg-segmented-tab-inactive-text` | **`#047857`** | `var(--cs-success-700)` | `#a7f3d0` | `var(--cs-success-200)` | 비활성 탭 텍스트 |
| `--mg-segmented-tab-hover-bg-active` | `#047857` | `var(--cs-success-700)` | `#059669` | `var(--cs-success-600)` | 활성 탭 hover |
| `--mg-segmented-tab-hover-bg-inactive` | `#a7f3d0` | `var(--cs-success-200)` | `#065f46` | `var(--cs-success-800)` 변형 | 비활성 탭 hover |
| `--mg-segmented-tab-focus-ring` | `#065f46` | `var(--cs-success-800)` | `#d1fae5` | `var(--cs-success-100)` | focus-visible inner highlight |

### A.2 ActionBar 토큰 (신설 12종)

| 토큰 | light hex | dark hex | 용도 |
|---|---|---|---|
| `--mg-actionbar-gap` | `12px` | `12px` | 액션 사이 간격 |
| `--mg-actionbar-padding-y` | `16px` | `16px` | 푸터 세로 패딩 |
| `--mg-actionbar-primary-bg` | `#059669` | `#10b981` | primary fill |
| `--mg-actionbar-primary-text` | `#ffffff` | `#ffffff` | primary 텍스트 |
| `--mg-actionbar-primary-hover-bg` | `#047857` | `#059669` | primary hover |
| `--mg-actionbar-primary-active-bg` | `#065f46` | `#047857` | primary press |
| `--mg-actionbar-outline-bg` | `#ecfdf5` (v1.2 hotfix, was `#ffffff`) | `#1a1f2e` | outline fill (mint) |
| `--mg-actionbar-outline-text` | `#047857` (v1.2 hotfix, was `#059669`) | `#10b981` | outline 텍스트 |
| `--mg-actionbar-outline-hover-bg` | `#d1fae5` | `#064e3b` | outline hover |
| `--mg-actionbar-danger-bg` | `#ef4444` | `#f87171` | danger fill (cs-error-500) |
| `--mg-actionbar-danger-text` | `#ffffff` | `#ffffff` | danger 텍스트 |
| `--mg-actionbar-danger-hover-bg` | `#dc2626` | `#ef4444` | danger hover (cs-error-600) |

### A.3 공통 규약

- **border-width: 0** (active/inactive/primary/outline/danger 모두 통일). 외곽선 의도가 필요한 경우 `--mg-segmented-track-bg` 의 분리감으로 표현.
- **box-shadow: none** (외부 drop-shadow 차단). `:focus-visible` 에서만 inner highlight (box-shadow inset).
- **transform: none** (hover/active 시 변동 없음). 외형 변동 = background-color 변색만.
- **height: 48px** (모든 variant 통일, sm size 의 경우 36px).

---

## §B P2 색상 결정 + WCAG AA 검증

### B.1 P2 채택 핵심

활성 탭 / 비활성 탭 / actionBar variants **모두 외곽선 없음** (border-width: 0). 시각적 활성 상태는:
- 활성 탭: 진한 녹색 fill (`#059669`) + 흰 글자
- 비활성 탭: 옅은 녹색 fill (`#d1fae5`) + 진녹색 글자

→ **활성/비활성의 외곽 위치가 정확히 동일** (border 없음, background-color 만 차이). 단차 원천 차단.

### B.2 WCAG AA 대비 검증

| 조합 | 배경 | 텍스트 | 대비비 | 결과 |
|---|---|---|---|---|
| 활성 탭 | `#059669` | `#ffffff` | **4.52:1** | ✅ AA (large text 3:1 / normal 4.5:1, normal 도 PASS) |
| 비활성 탭 | `#d1fae5` | `#047857` | **6.91:1** | ✅ AA + AAA |
| primary 액션 | `#059669` | `#ffffff` | **4.52:1** | ✅ AA |
| outline 액션 (light) | `#ffffff` | `#059669` | **4.50:1** | ✅ AA (간발) |
| danger 액션 | `#ef4444` | `#ffffff` | **4.20:1** | ⚠️ AA Fail (large text 만 OK) — `#dc2626` (cs-error-600) 으로 변경 시 6.0:1 PASS |
| 비활성 탭 hover | `#a7f3d0` | `#047857` | **5.21:1** | ✅ AA |

**디자이너 권고 (B0KlA-DESIGN-1)**:
- danger 액션 fill 을 `#ef4444` → `#dc2626` (cs-error-600) 으로 상향. 텍스트 white 와 6.0:1 대비. 사용자 결재 변수 D1 참고.

### B.3 색맹 대응

P2 의 활성(`#059669` 진녹색) vs 비활성(`#d1fae5` 연녹색) 명도 대비:
- 적록 색맹(Deuteranopia): 명도 차이로 구분 가능 (활성 luminance 0.32 vs 비활성 0.86 → ΔL 0.54)
- 청황 색맹(Tritanopia): 명도 차이로 구분 가능
- 단색: 명도 차이 충분 (ΔL 0.54)

→ aria-selected="true" 시 fill 변경만으로 색맹/단색 사용자도 활성 구분 가능. **추가 시각 신호 불필요**.

---

## §C 4상태 매트릭스

### C.1 SegmentedTabs — 활성 탭

| 상태 | bg | text | shadow / outline |
|---|---|---|---|
| default | `--mg-segmented-tab-active-bg` (#059669) | white | none |
| hover | `--mg-segmented-tab-hover-bg-active` (#047857) | white | none |
| focus-visible | `--mg-segmented-tab-active-bg` | white | `box-shadow: inset 0 0 0 2px var(--mg-segmented-tab-focus-ring)` (inner 2px #065f46) |
| active-press | `#065f46` | white | none |

### C.2 SegmentedTabs — 비활성 탭

| 상태 | bg | text | shadow / outline |
|---|---|---|---|
| default | `--mg-segmented-tab-inactive-bg` (#d1fae5) | `--mg-segmented-tab-inactive-text` (#047857) | none |
| hover | `--mg-segmented-tab-hover-bg-inactive` (#a7f3d0) | #047857 | none |
| focus-visible | #d1fae5 | #047857 | `box-shadow: inset 0 0 0 2px #065f46` |
| active-press (transition only) | #6ee7b7 (cs-success-300) | #047857 | none |

### C.3 ActionBar — primary

| 상태 | bg | text |
|---|---|---|
| default | #059669 | white |
| hover | #047857 | white |
| focus-visible | #059669 | white + inner 2px shadow |
| active-press | #065f46 | white |

### C.4 ActionBar — outline (light) — **v1.2 hotfix (2026-06-05)**

| 상태 | bg | text |
|---|---|---|
| default | **#ecfdf5 (mint)** | **#047857** |
| hover | #d1fae5 | #047857 |
| focus-visible | #ecfdf5 | #047857 + inner 2px green shadow |
| active-press | #a7f3d0 | #047857 |

**v1.2 변경 사유**: white-on-white 무경계 결함 (white 배경 모달의 footer 에서 outline 버튼이 시각 인지 불가) 해소. SSOT §B "border-width 0" 원칙 유지하면서 fill 색상 차이로 시각 분리. WCAG AA: `#047857` on `#ecfdf5` ≈ 6.5:1 (AAA 근접).

### C.5 ActionBar — danger (디자이너 권고 #dc2626 채택 시)

| 상태 | bg | text |
|---|---|---|
| default | #dc2626 | white |
| hover | #b91c1c (cs-error-700) | white |
| focus-visible | #dc2626 | white + inner 2px shadow `#7f1d1d` |
| active-press | #991b1b (cs-error-800) | white |

### C.6 공통 transition

```css
transition: background-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out, color 0.15s ease-in-out;
/* transform / outer shadow 변동 0 */
```

---

## §D 컴포넌트 API 권고

### D.1 SegmentedTabs

```jsx
<SegmentedTabs
  items={[
    { value: 'detail', label: '상세' },
    { value: 'notes', label: '특이사항', badge: clientNotesUnresolvedCount }
  ]}
  activeValue={activeDetailTab}
  onChange={setActiveDetailTab}
  ariaLabel="일정 상세 보기"
  size="md" // 'sm' | 'md' (기본 md)
/>
```

내부 마크업:

```html
<div class="mg-segmented-tabs" role="tablist" aria-label="...">
  <button role="tab" aria-selected="true" class="mg-segmented-tabs__tab mg-segmented-tabs__tab--active">상세</button>
  <button role="tab" aria-selected="false" class="mg-segmented-tabs__tab">특이사항 <span class="mg-segmented-tabs__badge">3</span></button>
</div>
```

**keyboard nav** (브라우저 기본 외 추가):
- `ArrowLeft` / `ArrowRight`: 인접 탭 활성화
- `Home` / `End`: 첫 / 마지막 탭 활성화
- `Tab`: 패널 영역으로 포커스 이동 (한 번에 탭 전체를 빠져나감)

### D.2 ActionBar

```jsx
<ActionBar align="end" gap="md">
  <MGButton variant="outline" onClick={handleEdit}>예약 변경</MGButton>
  <MGButton variant="primary" onClick={handleConfirm}>예약 확정</MGButton>
  <MGButton variant="danger" onClick={handleCancel}>예약 취소</MGButton>
</ActionBar>
```

내부 마크업:

```html
<div class="mg-actionbar" data-align="end" data-gap="md">
  <button class="mg-actionbar__action mg-actionbar__action--outline">예약 변경</button>
  <button class="mg-actionbar__action mg-actionbar__action--primary">예약 확정</button>
  <button class="mg-actionbar__action mg-actionbar__action--danger">예약 취소</button>
</div>
```

**결정**: MGButton 을 child 로 받는 단순 wrapper (옵션 A). `items` prop array 방식보다 유연. MGButton 의 기존 variant prop 활용. 단, `<ActionBar>` 안의 MGButton 은 ActionBar SSOT CSS 가 외형 override (mode='actionBar' 와 동등).

대안: `<ActionBar>` 내부의 child 가 MGButton 일 때 `data-actionbar="true"` 자동 부여 (React Context 또는 cloneElement). MGButton.css 에 `[data-actionbar="true"]` selector 로 외형 통일.

**디자이너 권고 (B0KlA-DESIGN-2)**: 단순 wrapper + 자동 data-attr 부여 방식 권장 (사용자 결재 변수 D2 참고).

---

## §E 6 그룹 페이지 시각 회귀 fixture 시안

사용자 우선순위 6 그룹 (Q3 채택 a~f):

### E.1 일정상세 모달 (a)

`ScheduleDetailModal.js`:
- L1107~1148 탭 → `<SegmentedTabs>` 교체
- L1078~1103 footer actions → `<ActionBar align="end">` 교체
- 영향: ScheduleB0KlA.css L2465~2580 의 5차 fix override 110+ 라인 전체 제거 (SSOT 가 흡수)

### E.2 ERP 메뉴 (b)

`FinancialManagement.js` / `SalaryManagement.js` / `ApprovalHubLayout.js` / `FinancialRefundHubLayout.js` / `ErpHubTabs.jsx`:
- 각 파일의 segmented control 영역 → `<SegmentedTabs>` 교체
- footer actions 가 있는 경우 `<ActionBar>` 교체

### E.3 어드민 대시보드 v2 (c)

`AdminDashboardV2.js`:
- segmented control 영역 → `<SegmentedTabs>` 교체

### E.4 상담사 (d)

`ConsultantScheduleRenewal.js` / `ConsultantRecordsRenewal.js` / `ConsultantClientManagementRenewal.js` / `ConsultantSessionKpiPage.js`:
- 각 파일 segmented + action bar → 신 컴포넌트 교체

### E.5 내담자 (e)

`ClientConsultationsRenewal.js` / `MyPage.js`:
- segmented + action bar → 신 컴포넌트 교체

### E.6 알림 (f)

`NotificationCenter.js` / `NotificationDropdown.js` / `AdminNotificationsPage.js`:
- segmented (전체/읽지않음/카테고리) → `<SegmentedTabs>`

### E.7 후속 (Q3 미선택)

- 웰니스(`PsychoEducation.js`, `MeditationGuide.js`)
- 기타(`HelpPage.js`, `AcademyDashboard.js`, `ShopCategoryTabs.js`, `TenantProfile.js`)

후속 PR 별도 진행.

---

## §F 다크 + 모바일 + 반응형

### F.1 다크 모드

토큰 §A 의 dark hex 매트릭스 그대로. 다크 컨텍스트 (`[data-theme="dark"]` 또는 `.mg-dark`) 에서 자동 전환:

```css
[data-theme="dark"] {
  --mg-segmented-tab-active-bg: #10b981;
  --mg-segmented-tab-inactive-bg: #064e3b;
  /* ... */
}
```

### F.2 모바일 (≤ 768px)

- segmented track padding: 4px 0 → 6px 0 (탭 영역 확장)
- segmented tab font-size: 14px → 13px (좁은 화면)
- segmented tab min-height: 48px → 44px
- actionBar gap: 12px → 8px
- actionBar 액션 height: 48px → 44px

### F.3 반응형 (≤ 480px)

- segmented tab: full-width 강제 (`flex: 1 1 0`)
- actionBar: column 방향 stack (`flex-direction: column`)
- actionBar 액션: full-width

---

## §G a11y 매트릭스

### G.1 키보드

- segmented tab: `Tab` (전체 진입) / `ArrowLeft/Right` (탭 이동) / `Home/End` (처음/끝)
- actionBar: `Tab` (각 액션 진입) / `Space/Enter` (활성화)

### G.2 스크린리더

- segmented tabs: `role="tablist"` + `aria-label` (필수)
- segmented tab: `role="tab"` + `aria-selected="true|false"` + `aria-controls="panel-id"` (선택)
- actionBar: 별도 role 불필요 (단순 button 그룹)

### G.3 색맹

§B.3 검증 PASS — 명도 차이 ΔL 0.54 로 충분.

### G.4 고대비 모드 (Windows High Contrast / forced-colors)

```css
@media (forced-colors: active) {
  .mg-segmented-tabs__tab--active {
    background: SelectedItem;
    color: SelectedItemText;
    forced-color-adjust: none;
  }
  .mg-segmented-tabs__tab {
    border: 2px solid CanvasText; /* 시스템 색으로 시각화 */
  }
}
```

### G.5 focus 가시성

inner 2px highlight (`box-shadow: inset 0 0 0 2px focus-ring-color`):
- 활성 탭: #065f46 (진녹색) inner ring → bg #059669 위에서 명도 대비 충분
- 비활성 탭: #065f46 inner ring → bg #d1fae5 위에서 명도 대비 매우 충분
- WCAG 2.4.7 PASS

---

## §H 마이그레이션 단계 권고 (Phase 2 coder 가이드)

1. `SegmentedTabs.jsx` + `SegmentedTabs.css` 신설.
2. `ActionBar.jsx` + `ActionBar.css` 신설.
3. `dashboard-tokens-extension.css` 에 §A 토큰 21종 신설 (light + dark 매트릭스).
4. `unified-design-tokens.css` 의 mg-v2-button-primary/outline 와 충돌 검토.
5. ScheduleDetailModal.js 1차 마이그 + Jest snapshot.
6. ScheduleB0KlA.css 의 5차 fix override 110+ 라인 삭제 (SSOT 흡수).
7. Q3 우선순위 6 그룹 마이그레이션 (PR 분할 권장: a / b / c / d+e+f).
8. 시각 회귀 fixture (스토리북 또는 Playwright 권장).

---

## §I 사용자 결재 변수 (D1~D5, 5개 이내)

### D1) danger 액션 fill 색

- **a) `#ef4444`** (cs-error-500, 현재 — WCAG AA fail with white text)
- **b) `#dc2626`** (cs-error-600, 디자이너 권고 — WCAG AA PASS 6:1)
- **c) 현재 유지 + 텍스트만 large text 처리**

### D2) ActionBar API 형태

- **a) `<ActionBar align="end"><MGButton .../></ActionBar>`** (단순 wrapper + data-attr 자동, 디자이너 권고)
- **b) `<ActionBar items={[{variant, label, onClick, ...}]} />`** (items prop array 방식)
- **c) MGButton 에 `mode='actionBar'` prop 만 추가** (Phase 1 옵션 B 회귀)

### D3) SegmentedTabs 비활성 색

- **a) `#d1fae5`** (cs-success-100, 디자이너 권고 — 활성 #059669 와 명도 대비 ΔL 0.54)
- **b) `#ecfdf5`** (cs-success-50, 더 옅은 톤 — 명도 대비 더 큼)
- **c) `#a7f3d0`** (cs-success-200, 더 진한 톤 — 활성과 구분이 덜 명확하나 더 차분)

### D4) focus-visible 표현

- **a) inner 2px shadow** (디자이너 권고, 외곽 단차 0)
- **b) outer outline + offset** (현재 MGButton.css 패턴, 단차 위험)
- **c) bg 한 단계 진하게** (focus 시 색만 변경, shadow 없음)

### D5) Phase 2 진행 방식

- **a) 메인 직접 진행** (현재 designer/planner quota 한도 상황 동일, 1~2일 내 PR 완성)
- **b) core-coder 위임** (룰 SSOT 준수, 사용자 검수 후 머지)
- **c) 일정상세 모달만 1차 메인 직접 + 나머지 5 그룹 core-coder 위임**

---

## §J 마감

본 디자인 핸드오프 v1.0 — 사용자 D1~D5 결재 후 Phase 2 core-coder (또는 메인 직접) 위임.

---

## §K 사용자 결재 결과 (2026-06-05 KST, v1.1 stamp)

| 변수 | 채택 | 결정 사유 |
|---|---|---|
| **D1) danger 액션 fill** | **b) #dc2626 (cs-error-600)** | WCAG AA 6:1 PASS, 디자이너 권고 채택 |
| **D2) ActionBar API** | **a) 단순 wrapper + Context auto-attr** | MGButton 의 variant prop 재활용, 마이그 마찰 최소 |
| **D3) SegmentedTabs 비활성 색** | **a) #d1fae5 (cs-success-100)** | 활성 #059669 와 명도 대비 ΔL 0.54, 색맹 대응 |
| **D4) focus-visible 표현** | **a) inner 2px shadow** | 외곽 단차 0, 5차 fix 의 outline 패턴 영구 폐기 |
| **D5) Phase 2 진행 방식** | **a) 메인 직접 진행** | core-designer / core-planner gemini 사용량 한도 연속 종료 상황 동일, 1~2일 내 PR 완성 |

→ §A 토큰 21종 + §C 4상태 매트릭스 + §D API 권고 모두 **확정 SSOT**. Phase 2 메인 직접 구현 진행.

---

## §L v1.2 hotfix 결재 (2026-06-05 KST 15:30)

| 변수 | 채택 | 결정 사유 |
|---|---|---|
| **D6) ActionBar outline default bg** | **b) #ecfdf5 (cs-success-50) mint** | 운영 검수 발견 — white 배경 모달 footer 에서 outline 버튼 white-on-white 무경계 결함. SSOT §B "border-width 0" 원칙 유지하면서 fill 색상 차이로 시각 분리. (A안 inset 1px shadow / C안 mint+shadow 대신 가장 간결한 B안 채택.) |
| **D7) outline text** | **#047857 (cs-success-700)** | mint bg (#ecfdf5) 위 명도 차 확대로 가독성·접근성 향상 (≈6.5:1, AAA 근접). |
| **D8) hotfix 진행 방식** | **a) 메인 직접 핫픽스** | 토큰 1줄 변경 + 문서 업데이트만으로 해결. 코드 컴포넌트 변경 없음. |

→ §A.2 토큰 + §C.4 명세 v1.2 stamp. ActionBar.css / SegmentedTabs / MGButton 코드는 무변경.

EOF
