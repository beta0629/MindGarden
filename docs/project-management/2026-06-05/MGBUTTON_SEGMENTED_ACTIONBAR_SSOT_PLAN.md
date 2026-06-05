# MGButton + Segmented Tab + Action Bar SSOT 통일 기획서

| 항목 | 값 |
|---|---|
| 작성일 | 2026-06-05 (KST) |
| 작성자 | 메인 어시스턴트 (core-planner gemini quota 한도로 대체) |
| 상태 | 초안 v1.0 — 사용자 결재 대기 |
| 트리거 | 일정상세 모달 탭 단차 1~5차 fix 누적 → "원천적 개선 필요. 다른 곳에도 동일 문제. 색상 변경 같이 고려" 사용자 결재 |
| 직전 임시 차단 | main `60c3a1562` (5차 fix `:focus-visible outline:none`) — prod 정착 |

---

## §1 배경 & 근본 원인

### 1.1 누적된 1~5차 fix 시도

| 차수 | 시점 | 시도 | 결과 |
|---|---|---|---|
| 1 | PR #106 | box-shadow 제거 | 단차 잔존 |
| 2 | `1ae486316` | primary border-color transparent → green | 단차 잔존 |
| 3 | `6e2e5e272` | border transparent + box-shadow inset | 단차 잔존 |
| 4 | `a6efd00b0` | !important + border-width 통일 + transform 차단 | 단차 잔존 |
| 5 | `60c3a1562` | `:focus-visible outline:none` 차단 | **현재 임시 차단 (단차 원인은 차단됐으나 본질 미해결)** |

### 1.2 근본 원인 (메인 진단)

```3:25:frontend/src/components/common/MGButton.css
.mg-button {
  position: relative;
  display: inline-flex;
  ...
  border: 1px solid transparent;
  ...
}

.mg-button:focus-visible {
  outline: 2px solid var(--mg-color-primary-main, var(--mg-layout-sidebar-active-bg));
  outline-offset: 2px;
}
```

`MGButton` 을 segmented control 과 action bar 에 그대로 재활용하면서:

1. **variant 별 외형 차이가 상호 간섭**:
   - `.mg-button--primary { border-color: transparent }` (base)
   - `.mg-button--outline { border: 1px solid border-main }` (base)
   - `.mg-v2-button-primary { border: none }` (unified-design-tokens L12312)
   - `.mg-v2-button-outline { border: 2px solid color-primary }` (unified-design-tokens L12439)
   - `.mg-v2-btn--primary { ... }` (L11275, border 명시 없음)
2. **focus-visible 의 outline: 2px + offset: 2px** → 활성 탭에만 4px 외곽 추가 (5차 fix 차단 전 단차 원인).
3. **hover transform: translateY(-1px) + box-shadow: soft** → variant 별 적용 → 일시적 단차.
4. **CSS override 누적 (ScheduleB0KlA.css L2465-2580 만 110+ 라인)** → 패치 한 번 추가할 때마다 다른 측면이 노출.

### 1.3 위험 페이지 인벤토리 (Grep 결과)

#### Segmented Control / Tab 패턴 사용 — 26개 파일

| 카테고리 | 파일 | 추정 영향 |
|---|---|---|
| 일정 | `ScheduleDetailModal.js`, `ConsultantScheduleRenewal.js` | **현재 단차 보고 위치** |
| ERP | `FinancialManagement.js`, `SalaryManagement.js`, `ApprovalHubLayout.js`, `FinancialRefundHubLayout.js`, `ErpHubTabs.jsx` | 동일 패턴 |
| 어드민 | `AdminDashboardV2.js`, `AdminNotificationsPage.js`, `TenantProfile.js` | 동일 패턴 |
| 상담사 | `ConsultantScheduleRenewal.js`, `ConsultantRecordsRenewal.js`, `ConsultantClientManagementRenewal.js`, `ConsultantSessionKpiPage.js` | 동일 패턴 |
| 내담자 | `ClientConsultationsRenewal.js`, `MyPage.js` | 동일 패턴 |
| 알림 | `NotificationCenter.js`, `NotificationDropdown.js` | 동일 패턴 |
| 웰니스 | `PsychoEducation.js`, `MeditationGuide.js` | 동일 패턴 |
| 기타 | `HelpPage.js`, `AcademyDashboard.js`, `ShopCategoryTabs.js` | 동일 패턴 |

#### Action Bar (footer actions) 사용 — UnifiedModal 사용 전 페이지

UnifiedModal 의 `actions` prop 을 사용하는 모달 = **수십 곳**. 일정상세 모달 푸터(예약 변경/확정/취소 3개) 와 동일 메커니즘으로 잠재 단차.

---

## §2 구조 옵션 비교 (3안)

### 옵션 A) `SegmentedTabs` / `ActionBar` 전용 컴포넌트 분리

```
frontend/src/components/common/
├── SegmentedTabs.jsx       # native button + 자체 CSS
├── SegmentedTabs.css       # SSOT
├── ActionBar.jsx           # 다중 MGButton 컨테이너 + flexbox SSOT
└── ActionBar.css
```

| 항목 | 평가 |
|---|---|
| 변경 범위 | 26개 segmented 페이지 + 수십 곳 modal footer 마이그레이션 |
| 작업량 | **대규모** (1~2주, designer + coder + tester) |
| 재발 방지 | **최고** (MGButton 변동 영향 0, 자체 토큰 SSOT) |
| 위험 | 마이그레이션 누락 시 일관성 깨짐, 시각 회귀 광역 |
| 권장 시점 | 중장기 (D11 이상 라운드와 묶음) |

### 옵션 B) MGButton 에 `mode='segmented' | 'actionBar'` prop 추가 ★ **권장**

```jsx
<MGButton mode="segmented" variant={active ? 'primary' : 'outline'}>...</MGButton>
<MGButton mode="actionBar" variant="primary">...</MGButton>
```

내부 처리:
- `mode='segmented'`: focus-visible outline 자동 차단 + hover transform 차단 + border-width 강제 통일 + box-shadow none + variant 무관 동일 box geometry.
- `mode='actionBar'`: 모든 variant 동일 height/padding/focus 처리 + variant 색만 차이.
- `mode` 미지정: 현재 동작 유지 (호환).

| 항목 | 평가 |
|---|---|
| 변경 범위 | MGButton.js + MGButton.css + 사용처 prop 추가 (26 + N 페이지) |
| 작업량 | **중간** (3~5일) |
| 재발 방지 | **높음** (variant 별 외형 차이 SSOT 통일) |
| 위험 | mg-v2-* 외부 클래스 잔존 (별도 sweep 필요) |
| 권장 시점 | **즉시 (이번 라운드)** |

### 옵션 C) Reset utility class (`.mg-button--in-segmented`, `.mg-button--in-actionbar`)

```jsx
<MGButton className="mg-button--in-segmented" variant={active ? 'primary' : 'outline'}>...</MGButton>
```

CSS 한 곳 (`MGButton.css` 추가 섹션) 에 reset class 정의. variant 무관 외형 통일.

| 항목 | 평가 |
|---|---|
| 변경 범위 | MGButton.css + 사용처 className 추가 |
| 작업량 | **소** (1~2일) |
| 재발 방지 | **중간** (className 누락 시 단차 재발) |
| 위험 | className 깜빡 누락 |
| 권장 시점 | 단기 (검수 우선순위 페이지 한정) |

### 비교 요약

| | A | B ★ | C |
|---|---|---|---|
| 작업량 | 1~2주 | 3~5일 | 1~2일 |
| 재발 방지 | ★★★★★ | ★★★★ | ★★★ |
| 향후 확장 | ★★★★★ | ★★★★ | ★★ |
| 즉시 적용 | × | ○ | ○ |
| 권장 | 중장기 | **즉시** | 단기 |

---

## §3 색상 토큰 정합 (사용자 명시 "색상 변경도 고려")

### 3.1 현재 토큰 혼재 매트릭스

| 토큰 | 정의처 | 사용처 | 비고 |
|---|---|---|---|
| `--ad-b0kla-green` | unified-design-tokens D10 P2-c | B0KlA 모달/페이지 | SSOT |
| `--ad-b0kla-green-bg` | 동일 | track 배경 (옅은 녹색) | SSOT |
| `--ad-b0kla-card-bg` | 동일 | outline 탭 fill (white) | SSOT |
| `--color-primary` | unified-design-tokens 글로벌 | `.mg-v2-button-primary` etc | 글로벌 |
| `--mg-color-primary-main` | MGButton.css | `.mg-button--primary` | 글로벌 |
| `--mg-primary-color` / `--mg-primary-500` | unified-modals.css | 모달 actions | 모달 한정 |

→ B0KlA 컨텍스트에서 활성/비활성 색 사용 시 `--ad-b0kla-green` SSOT 사용 권장.

### 3.2 색상 변경 옵션 (사용자 결재용)

#### 옵션 P1) 기존 B0KlA 녹색 유지 (현재) — 무변경
- 활성: `--ad-b0kla-green` (#???? 운영 hex 확인 필요)
- 비활성: white + green border

#### 옵션 P2) 활성/비활성 모두 같은 녹색 톤 (진/연) — 단차 가능성 최저
- 활성: `--ad-b0kla-green` (진녹색 fill)
- 비활성: `--ad-b0kla-green-bg` 또는 신설 `--ad-b0kla-green-50` (연녹색 fill)
- 외곽선 없음 → 시각적 단차 0

#### 옵션 P3) 다른 강조색 (예: 마린/티얼/네이비) 전환
- 활성: 새 SSOT (예: `--ad-b0kla-teal`)
- 비활성: 옅은 톤
- B0KlA 전역 색 변경 → 광역 영향, D11 라운드와 묶음 권장

### 3.3 권장: P2 (활성/비활성 동일 톤 명도 차이) + 옵션 B 구조

색상 변경을 P2 로 가져가면 **외곽선 자체가 불필요** → 옵션 B (mode='segmented') 의 외형 SSOT 가 더욱 단순화. focus/hover/border/box-shadow 모두 동일 → 단차 원천 차단.

---

## §4 시각 통일 spec (4상태 매트릭스, P2 + B 채택 시)

| 상태 | 활성 탭 (segmented) | 비활성 탭 (segmented) | primary 액션 (actionBar) | outline 액션 (actionBar) | danger 액션 |
|---|---|---|---|---|---|
| default | green fill, white text | green-50 fill, green text | green fill | white fill + green border | red fill |
| hover | 동일 (변동 없음) | green-100 fill, green text | green-dark fill | green-50 fill | red-dark fill |
| focus-visible | aria-selected 강조 (inner highlight 2px green) | 동일 | outer outline (visible) | outer outline (visible) | outer outline (visible) |
| active(press) | 동일 | green-200 fill | green-darker fill | green-100 fill | red-darker fill |

a11y:
- 탭에는 `aria-selected="true"` + `role="tab"` (현재 마크업 유지).
- 키보드 탐색: 좌우 화살표 (현재 brower default).
- focus 가시성: active 탭은 background 자체로 명시, focus-visible 은 inner highlight (border 위치 무관) 로 단차 0.

다크 모드: D10 P2-b 의 `mg-shadow-light` 다크 cascade 답습. green 톤도 다크 변형 토큰 필요.

모바일: track padding 4px 0 → 8px 0 (탭 영역 가독성).

---

## §5 Phase 별 위임 명세

### Phase 1: Designer (gemini-3.1-pro)

산출물: `docs/project-management/2026-06-05/MGBUTTON_SSOT_DESIGN_HANDOFF.md`
- §4 4상태 매트릭스의 hex 확정 (light + dark)
- segmented / actionBar SSOT 토큰 (10~15종 추정)
- 스토리북 fixture 시안 (선택)
- B0KlA palette 정합 (D10 P2-c §C7 6종 기준)

### Phase 2: Coder

산출물: PR `feature/mgbutton-mode-segmented-actionbar`
- MGButton.js 에 `mode` prop 추가 + propTypes
- MGButton.css 에 `[data-mode="segmented"]` / `[data-mode="actionBar"]` 섹션 신설
- unified-design-tokens.css 신설 토큰 SSOT
- ScheduleDetailModal.js 탭/푸터 `mode` prop 적용 (첫 마이그레이션)
- 시각 회귀 fixture (Jest snapshot)
- ScheduleB0KlA.css 의 5차 fix override 제거 (mode SSOT 가 흡수)
- 사용처 26 + N 페이지 마이그레이션 (별도 PR 분할 가능)

### Phase 3: Tester

산출물: `MGBUTTON_SSOT_VISUAL_REGRESSION_REPORT.md`
- 단위 테스트 (Jest snapshot + a11y)
- 시각 회귀: 26 페이지 light + dark + 모바일 + focus/hover/active 매트릭스
- D11 가드 + check-hardcode + i18n-seed PASS
- HIGH 0 / MEDIUM ≤3 / LOW 자유

### Phase 4: Deployer

- develop FF → main FF → deploy-frontend-prod
- 운영 반영 후 사용자 검수 게이트

---

## §6 사용자 결재 질문 (5개)

### Q1 — 구조 옵션 채택

- **a) 옵션 A** (전용 컴포넌트 분리, 1~2주, 재발 방지 최고)
- **b) 옵션 B** ★ **권장** (MGButton mode prop, 3~5일, 즉시 적용 가능)
- **c) 옵션 C** (utility class, 1~2일, 단기 대응)
- **d) B + C 병행** (즉시 단차 위험 페이지에 C 적용 + B 본격 진행)

### Q2 — 색상 변경 옵션

- **a) P1 무변경** (현재 B0KlA 녹색 유지)
- **b) P2** ★ **권장** (활성/비활성 동일 톤 명도 차이, 외곽선 폐기, 단차 원천 차단)
- **c) P3** (다른 강조색 전환, D11 라운드와 묶음)
- **d) 디자이너 위임** (Phase 1 designer 가 시안 3종 제안 후 결정)

### Q3 — Phase 2 검수 우선순위 페이지

사용자가 자주 보는 페이지 = 우선 마이그레이션 대상. 다음 중 우선 검수 필요 페이지를 선택 (복수 가능).
- **a) 일정상세 모달** (현재 단차 보고)
- **b) ERP 메뉴 (FinancialManagement / SalaryManagement / ApprovalHub)**
- **c) 어드민 대시보드 v2**
- **d) 상담사 일정 / 기록 / 내담자 관리**
- **e) 내담자 마이페이지 / 상담 내역**
- **f) 알림 센터**
- **g) 전체 일괄** (테스터 부담 큼)

### Q4 — 마이그레이션 범위

- **a) Phase 2 일괄 마이그** (26 페이지 한 PR — 위험 크나 빠름)
- **b) Phase 2 우선순위 페이지만** (Q3 답변 기준 + 후속 PR 별도)
- **c) Phase 2 일정상세 모달만** (검증 후 확산)

### Q5 — 작업 진행 방식

- **a) 메인 직접 진행** (planner quota 한도 상황 동일, 1~2일 내 PR 완성)
- **b) core-coder 위임** (룰 SSOT, 사용자가 결재 + 검수)
- **c) core-designer 먼저 (Phase 1)** + 결재 후 coder 위임 (가장 안전)

---

## §7 위험 / 의존성

1. **5차 fix 의존**: 본 SSOT 정착 전까지 `:focus-visible outline:none` (5차 fix) 가 일정상세 모달에 적용된 상태. 본 PR 이 mode='segmented' 로 흡수하면 5차 fix 제거 (override 정리).
2. **mg-v2-* 토큰 혼재**: D9~D11 색상 라운드와 영역 겹침. 본 SSOT 가 B0KlA palette 6종 SSOT (D10 P2-c) 와 정합되어야 함.
3. **PR #107 + PR #105/#106 운영 미반영**: 사용자 검증 후 통합 배포 예정. 본 SSOT PR 은 그 다음 라운드.
4. **시각 회귀 광역**: 26 페이지 + N 모달 → 테스터 부담. Phase 3 시각 회귀 fixture 자동화 필요 (스토리북 또는 Playwright).

---

## §8 마감

본 기획서 v1.0 초안 — 사용자 §6 Q1~Q5 결재 후 Phase 1 designer (또는 메인 직접) 진행. 결재 받기 전까지 코드 변경 없음.

EOF
