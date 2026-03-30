# 매칭 관리 배지·환불 버튼 가시성 원인 분석

**작성일**: 2025-03-17  
**담당**: core-debugger (원인 분석·수정 제안만, 코드 수정 없음)

---

## 1. 매칭 관리에서 배지가 나오는 위치 정리

| 위치 | 사용 컴포넌트/마크업 | 적용 클래스·토큰 | 비고 |
|------|----------------------|------------------|------|
| **상태 배지 (카드/리스트 뷰)** | common **StatusBadge** | `mg-v2-mapping-list-row__status` + `mg-v2-status-badge` + `mg-v2-badge--{variant}` | StatusBadge.css → `--mg-badge-status-*` (dashboard-tokens-extension BADGE_LIGHT_BG_CONTRAST_SPEC) 적용됨. |
| **상태 배지 (테이블 뷰)** | **인라인 span** (StatusBadge 미사용) | `mg-v2-badge` + variant 문자열(success, warning, info, error, secondary) | AdminDashboardB0KlA.css `.mg-v2-ad-b0kla .mg-v2-badge.*` 적용. **공통 Badge/StatusBadge 미사용** → 공통 배지 가시성 토큰 미적용. |
| **KPI 카드 라벨** | MappingKpiSection | `mg-v2-mapping-kpi-section__label` | `color: var(--ad-b0kla-text-secondary, #64748b)` (MappingKpiSection.css). |
| **KPI 카드 값** | MappingKpiSection | `mg-v2-mapping-kpi-section__value` | `color: var(--ad-b0kla-title-color)` (진하게 보임). |
| **필터 pill/칩** | MappingSearchSection | `mg-v2-mapping-search-section__chip` / `__chip--active` | 비활성: `color: var(--ad-b0kla-text-secondary)`. 활성: green 배경·텍스트. |
| **테이블 헤더** | MappingTableView | `mg-v2-mapping-table th` | `color: var(--ad-b0kla-text-secondary, #64748b)`. |
| **ERP 표시** | MappingListRow / MappingTableView | `mg-v2-mapping-list-row__erp`, `mg-v2-mapping-table__erp` | 배지가 아니라 작은 라벨. `--ad-b0kla-blue` 등. |

- **공통 Badge(common/Badge.js)**  
  매칭 관리 페이지에서는 **사용처 없음**. KPI·필터 칩·테이블 상태는 모두 로컬 클래스 또는 인라인 `mg-v2-badge` 사용.
- **공통 StatusBadge**  
  **MappingListRow(카드/리스트 뷰)** 에서만 사용. **MappingTableView(테이블 뷰)** 는 동일 상태를 `mg-v2-badge` + variant span으로만 표시.

---

## 2. 공통 배지 색상 가시성이 “적용 안 됨”인 이유

### 2.1 B0KlA 스코프·토큰 반영 여부

- 매칭 관리 페이지 루트는 `MappingManagementPage.js`에서 `<div className="mg-v2-ad-b0kla mg-v2-mapping-management">` 이므로 **B0KlA 스코프(.mg-v2-ad-b0kla) 안에 있음**. 따라서 `dashboard-tokens-extension.css`의 B0KlA 토큰은 **페이지 전체에 적용됨**.
- `dashboard-tokens-extension.css` 159행 기준 **`--ad-b0kla-text-secondary`는 현재 `var(--mg-gray-600)`으로 정의**되어 있음.  
  `ADMIN_DASHBOARD_B0KLA_CONTRAST_ANALYSIS.md`에서 제안한 **gray-700 변경이 아직 반영되지 않은 상태**이므로, 이 토큰을 쓰는 라벨·부제·칩·테이블 헤더는 계속 **gray-600**으로 표시되어 **밝은 배경 대비 체감이 약함**.

### 2.2 테이블 뷰: 공통 StatusBadge 미사용

- **MappingTableView**는 상태 컬럼에 common **StatusBadge**를 쓰지 않고, `<span className={\`mg-v2-badge ${badgeVariant}\`}>` 형태의 **인라인 span**만 사용함.
- 이 span은 **AdminDashboardB0KlA.css**의 `.mg-v2-ad-b0kla .mg-v2-badge.success/warning/info/error/secondary` 규칙으로만 스타일되며, **dashboard-tokens-extension.css**의 **BADGE_LIGHT_BG_CONTRAST_SPEC**(`--mg-badge-status-success-bg`, `--mg-badge-status-success-text` 등)을 **참조하지 않음**.
- 따라서 “공통 배지 색상 가시성”은 **카드/리스트 뷰(StatusBadge 사용)** 에만 적용되고, **테이블 뷰(인라인 mg-v2-badge)** 에는 적용되지 않음.

### 2.3 B0KlA 배지의 secondary와 토큰

- AdminDashboardB0KlA.css에서 `.mg-v2-badge.secondary`는 `background: var(--ad-b0kla-text-secondary); color: #fff` 로 정의됨.  
  즉 **배경에 gray-600**을 쓰므로, 토큰을 gray-700으로 올리지 않으면 secondary 배지도 상대적으로 옅은 톤으로 보일 수 있음.

### 2.4 정리

- **적용 안 됨**의 주요 원인:
  1. **`--ad-b0kla-text-secondary`가 아직 gray-600**이라, 이 토큰을 쓰는 라벨·칩·헤더 전반이 체감상 옅게 보임.
  2. **테이블 뷰 상태 배지**가 common StatusBadge가 아닌 **인라인 mg-v2-badge**라서, 공통 배지용 가시성 토큰(`--mg-badge-status-*`)이 **아예 적용되지 않음**.

---

## 3. 환불 버튼이 잘 안 보이는 원인

### 3.1 사용 클래스·선택자

| 위치 | 버튼 클래스 | 가시성 강화 적용 선택자 |
|------|-------------|-------------------------|
| **MappingListRow** | ActionButton → `mg-v2-button--danger` (이중 하이픈) | MappingListRow.css: `.mg-v2-mapping-list-row__actions .mg-v2-button--danger` ✓<br>AdminDashboardB0KlA.css: `.mg-v2-ad-b0kla .mg-v2-mapping-list-row__actions .mg-v2-button--danger` ✓ |
| **MappingTableView** | raw `<button>` → `mg-v2-button mg-v2-button-danger mg-v2-button-sm` (**단일 하이픈**) | MappingTableView.css: `.mg-v2-mapping-table__actions-inner .mg-v2-button-danger` 및 `.mg-v2-button--danger` ✓<br>AdminDashboardB0KlA.css: `.mg-v2-mapping-table__actions-inner .mg-v2-button--danger` 만 존재 → **mg-v2-button-danger(단일 하이픈)은 B0KlA 가시성 블록에 없음** |

- **MappingListRow**: ActionButton이 `mg-v2-button--danger`를 쓰므로, ListRow 전용 CSS와 AdminDashboardB0KlA.css의 “환불 버튼 가시성 강화” 블록 **둘 다 적용됨**.
- **MappingTableView**: 버튼은 **mg-v2-button-danger**(단일 하이픈)인데, AdminDashboardB0KlA.css의 가시성 강화는 **mg-v2-button--danger**(이중 하이픈)만 대상으로 함.  
  따라서 **테이블 뷰 환불 버튼**은 B0KlA 가시성 블록에는 **선택자 불일치로 적용되지 않고**, **MappingTableView.css**의 규칙에만 의존함.

### 3.2 B0KlA 기본 danger 스타일과의 관계

- AdminDashboardB0KlA.css 81–91행에서 `.mg-v2-ad-b0kla .mg-v2-button-danger` 및 `.mg-v2-button--danger`에 `background: var(--ad-b0kla-danger); color: #fff` 가 적용됨.
- 가시성 강화 블록(93–107행)은 `mg-error-600/700`, border, box-shadow 등으로 **더 진한 빨강**을 주지만, **테이블 뷰**는 위와 같이 **mg-v2-button--danger**만 선택하므로, 테이블의 `mg-v2-button-danger` 버튼은 **B0KlA 기본 danger만** 받을 수 있음.
- 실제로는 **MappingTableView.css**가 `.mg-v2-mapping-table__actions-inner .mg-v2-button-danger`를 포함해 가시성 강화를 주므로, 로드 순서·특이도에 따라 테이블에서도 강화 스타일이 적용될 수 있음. 다만 **B0KlA 측 선택자는 테이블 버튼 클래스와 불일치**하므로, 일관성과 유지보수를 위해 **테이블 뷰용 클래스(mg-v2-button-danger)도 B0KlA 가시성 블록에 포함하는 것**이 안전함.

### 3.3 MappingCard와의 관계

- AdminDashboardB0KlA.css 가시성 강화는 `.mg-v2-mapping-card .mg-v2-card-footer .mg-v2-button--danger` 도 대상으로 함.
- 매칭 관리의 **MappingListBlock**은 카드 뷰일 때 **MappingListRow** 그리드를 사용하며, **MappingCard**(admin/MappingCard.js)는 이 페이지에서 사용하지 않음.  
  따라서 “매칭 관리” 화면 자체에서는 카드 푸터 선택자 불일치가 직접 원인은 아니나, 다른 화면에서 MappingCard + 환불 버튼을 쓸 경우를 위해 **MappingCard** 구조는 `.mg-v2-mapping-card-actions`를 쓰므로 `.mg-v2-card-footer` 선택자와 맞지 않을 수 있음.

### 3.4 정리

- 환불 버튼이 잘 안 보일 수 있는 요인:
  1. **테이블 뷰**에서 사용하는 클래스 **mg-v2-button-danger**(단일 하이픈)가 AdminDashboardB0KlA.css의 가시성 강화 선택자(**mg-v2-button--danger**만 포함)와 **불일치**하여, B0KlA 스코프 내에서도 가시성 강화가 보장되지 않음.
  2. **B0KlA 기본 danger**가 `--ad-b0kla-danger`(mg-error-500) 수준이라, 배경·조명에 따라 상대적으로 덜 돋보일 수 있음.  
  → 가시성 강화 규칙이 **매칭 관리 전체(리스트·테이블)** 에 동일하게 적용되도록, **mg-v2-button-danger**를 B0KlA 가시성 블록에 포함하는 것이 좋음.

---

## 4. 결론 (근본 원인 요약)

- **배지 가시성**  
  (1) **`--ad-b0kla-text-secondary`**가 아직 **gray-600**으로 남아 있어, 이 토큰을 쓰는 KPI 라벨·필터 칩·테이블 헤더 등이 밝은 배경 대비에서 옅게 보인다.  
  (2) **테이블 뷰**의 상태 배지는 common **StatusBadge**가 아닌 **인라인 mg-v2-badge**만 사용하므로, 공통 배지용 가시성 토큰(`--mg-badge-status-*`)이 적용되지 않는다.  
  → “공통 배지 색상 가시성이 적용되지 않는다”는 사용자 인식은 **토큰 미반영** + **테이블 뷰의 비공통 배지 사용** 두 가지가 겹친 결과로 보는 것이 타당하다.

- **환불 버튼 가시성**  
  테이블 뷰의 환불 버튼은 **mg-v2-button-danger**(단일 하이픈)를 쓰는데, B0KlA의 “환불 버튼 가시성 강화” 규칙은 **mg-v2-button--danger**(이중 하이픈)만 선택하고 있어 **클래스 불일치**로 인해 B0KlA 블록이 테이블 버튼에 적용되지 않을 수 있다.  
  리스트 뷰는 ActionButton의 **mg-v2-button--danger**를 쓰므로 동일 블록이 적용되나, 테이블까지 동일한 가시성을 보장하려면 **mg-v2-button-danger**도 같은 강화 규칙에 포함할 필요가 있다.

---

## 5. 수정 제안

### 5.1 토큰·CSS 수정

- **파일**: `frontend/src/styles/dashboard-tokens-extension.css`  
  - `--ad-b0kla-text-secondary`를 `var(--mg-gray-600)` → **`var(--mg-gray-700)`** 로 변경.  
  - (선택) `--ad-b0kla-subtitle-color`를 `var(--mg-gray-700)`으로 변경해 부제·보조 문구 가독성 확보.  
  → `ADMIN_DASHBOARD_B0KLA_CONTRAST_ANALYSIS.md` §4와 동일. 변경 시 매칭 관리의 KPI 라벨·필터 칩·테이블 헤더 등이 일괄 개선됨.

### 5.2 공통 Badge / StatusBadge 적용

- **MappingTableView** 상태 컬럼:  
  현재 `<span className={\`mg-v2-badge ${badgeVariant}\`}>` 대신 **common StatusBadge**를 사용하도록 변경.  
  - status prop은 기존 매핑 상태 문자열, variant는 기존 getStatusVariant 결과를 StatusBadge의 variant(success/warning/neutral/danger/info)로 넘기면 됨.  
  - 이렇게 하면 테이블 뷰에도 **StatusBadge.css**와 **dashboard-tokens-extension**의 `--mg-badge-status-*`가 적용되어, 공통 배지 색상 가시성이 테이블에도 동일하게 적용됨.
- (선택) KPI·필터 칩 등에 공통 **Badge** variant=pill/tab 적용 검토:  
  `COMMON_BADGE_MODULE_PROPOSAL.md` Phase 2 이후, 매칭 관리 필터 칩을 common Badge(pill/tab, selected)로 교체하면 토큰·가독성 일관성 확보에 유리함.

### 5.3 환불 버튼 가시성 규칙이 매칭 관리 전체에 적용되도록

- **파일**: `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css`  
  - “환불 버튼 가시성 강화” 블록(93–107행 근처)에서,  
    `.mg-v2-mapping-table__actions-inner .mg-v2-button--danger` 와 함께  
    **`.mg-v2-mapping-table__actions-inner .mg-v2-button-danger`** (단일 하이픈)를 **동일 규칙으로 추가**.  
  - 그러면 테이블 뷰에서 사용 중인 `mg-v2-button-danger` 클래스에도 B0KlA 가시성 강화가 적용되어, 리스트 뷰와 동일한 수준의 환불 버튼 가시성을 보장할 수 있음.
- (선택) **MappingTableView.js**에서 환불 버튼 클래스를 ActionButton과 동일하게 **mg-v2-button--danger**로 통일하면, 기존 B0KlA 선택자만으로도 적용 가능.  
  이 경우 AdminDashboardB0KlA.css에 mg-v2-button-danger를 추가하지 않아도 되나, 다른 곳에서 `mg-v2-button-danger`를 쓰는 경우를 위해 **두 클래스 모두** 가시성 블록에 넣어 두는 편이 안전함.

---

## 6. core-coder 전달용 체크리스트

- [ ] `dashboard-tokens-extension.css`: `--ad-b0kla-text-secondary`를 `var(--mg-gray-700)`으로 변경.
- [ ] (선택) `--ad-b0kla-subtitle-color`를 `var(--mg-gray-700)`으로 변경.
- [ ] MappingTableView 상태 컬럼: 인라인 `mg-v2-badge` span → common **StatusBadge** 사용으로 교체, variant 매핑 유지.
- [ ] AdminDashboardB0KlA.css: 환불 버튼 가시성 강화 선택자에 `.mg-v2-mapping-table__actions-inner .mg-v2-button-danger` 추가.
- [ ] 매칭 관리 화면에서 카드/테이블 뷰 전환 후 배지·라벨·필터 칩·환불 버튼 가독성 확인.

---

## 7. 요약

| 항목 | 내용 |
|------|------|
| **배지 가시성** | (1) `--ad-b0kla-text-secondary`가 아직 gray-600이라 라벨·칩·헤더가 옅게 보임. (2) 테이블 뷰는 StatusBadge 대신 인라인 mg-v2-badge만 사용해 공통 배지 가시성 토큰이 적용되지 않음. |
| **환불 버튼** | 테이블 뷰는 `mg-v2-button-danger`(단일 하이픈) 사용, B0KlA 가시성 블록은 `mg-v2-button--danger`만 선택해 클래스 불일치. |
| **수정 방향** | 토큰을 gray-700으로 변경; 테이블 뷰 상태를 StatusBadge로 통일; B0KlA 환불 가시성 블록에 `mg-v2-button-danger` 포함 또는 테이블 버튼 클래스를 `mg-v2-button--danger`로 통일. |
