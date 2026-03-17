# 매칭관리 상태 배지·환불 버튼 가시성 정밀 분석

**작성일**: 2025-03-17  
**담당**: core-debugger (원인 분석·수정 제안만, 코드 수정 없음)

---

## 1. 증상 요약

| 항목 | 사용자 증상 |
|------|-------------|
| **상태 배지** | 배경이 백색이거나 없고, 글씨도 하얀색이라 안 보이는 것처럼 보임 → 배경색이 있으면 됨. |
| **환불 버튼** | 버튼 색상이 없어 보임. |

---

## 2. 상태 배지: 매칭 리스트 행(.mg-v2-mapping-list-row) 내 배지가 흰 글씨만 보이는 원인

### 2.1 적용되는 CSS 규칙 (선택자·우선순위·로드 순서)

매칭관리 **리스트 뷰**에서 한 행은 `MappingListRow.js`로 렌더되며, 상태 배지는 공통 **StatusBadge**를 사용한다.

- **요소 클래스**: `mg-v2-status-badge` + `mg-v2-badge--{variant}`(success/warning/neutral 등) + `mg-v2-mapping-list-row__status`
- **부모 구조**: `.mg-v2-ad-b0kla.mg-v2-mapping-management` → … → `.mg-v2-mapping-list-row` → `.mg-v2-mapping-list-row__status-col` → `<span class="mg-v2-status-badge mg-v2-badge--success mg-v2-mapping-list-row__status">`

**실제로 해당 배지에 적용될 수 있는 규칙만 정리:**

| 순서 | 파일 | 선택자 | 속성 | 비고 |
|------|------|--------|------|------|
| 1 | StatusBadge.css | `.mg-v2-status-badge.mg-v2-badge--success` | `background-color: var(--mg-badge-status-success-bg); color: var(--mg-badge-status-success-text);` | 배지 색상의 유일한 소스(리스트 행 기준). |
| 2 | MappingListRow.css | `.mg-v2-mapping-list-row__status.mg-v2-status-badge` | `font-size: 12px;` | 배경/글자색 없음. |

**AdminDashboardB0KlA.css의 배지 배경/글자색 규칙:**

- 129–142행: `.mg-v2-ad-b0kla .mg-v2-mapping-**client-block** .mg-v2-status-badge--success` 및 `.mg-v2-status-badge.mg-v2-badge--success` 등에만 적용.
- 선택자에 **`.mg-v2-mapping-client-block`** 이 들어가므로, **`.mg-v2-mapping-list-row`** 안의 배지는 이 규칙에 **해당하지 않음**.
- 즉, B0KlA에서 “배지 배경·글자색을 확실히 주는” 규칙은 **매칭 카드 블록**용만 있고, **리스트 행**용은 없음.

**결론 (규칙 측면):**

- 리스트 행 내 상태 배지의 배경/글자색은 **StatusBadge.css의 `var(--mg-badge-status-success-bg)` / `var(--mg-badge-status-success-text)` 등에만 의존**한다.
- B0KlA의 배지 강화 규칙은 **.mg-v2-mapping-client-block** 안에만 있어서, **.mg-v2-mapping-list-row** 안의 배지는 배경을 받지 못하는 구조가 맞다.

### 2.2 토큰이 매칭관리 페이지 컨텍스트에서 유효한지

- **정의 위치**: `dashboard-tokens-extension.css` 175–184행  
  `--mg-badge-status-success-bg: var(--mg-success-300);`  
  `--mg-badge-status-success-text: var(--mg-success-900);`  
  (warning/neutral/danger/info 동일 패턴)
- **의존 체인**: `--mg-success-300` / `--mg-success-900` 등은 `unified-design-tokens.css`에서 `--cs-success-*`로 매핑되고, `--cs-success-*`는 해당 파일 상단에서 **hex 값으로 직접 정의**되어 있어 **순환 없음**.

**로드 순서:**

- `index.js`: `unified-design-tokens.css` → `index.css`
- `index.css`: `@import unified-design-tokens.css` → `@import dashboard-tokens-extension.css`
- **MappingManagementPage.js**: `unified-design-tokens.css` → `AdminDashboardB0KlA.css` → `MappingManagementPage.css`  
  → **dashboard-tokens-extension.css는 이 페이지에서 직접 import하지 않음** (전역은 `index.css` 경로로만 로드).

가능한 시나리오:

1. **번들 순서**에 따라 매칭관리 페이지 진입 시 **MappingManagementPage 청크**에서 `unified-design-tokens.css`가 **다시 적용**되면, `:root`가 한 번 더 덮어씌워질 수 있음.  
   이때 **dashboard-tokens-extension.css**는 해당 청크에 없으므로, **같은 청크 안에서는** `--mg-badge-status-*`가 재정의되지 않음.  
   전역으로는 이미 `index.css`로 로드된 상태이므로, 일반적으로는 `:root`에 `--mg-badge-status-*`가 있어야 함.
2. 그럼에도 “배경 없음 + 흰 글씨”처럼 보인다면:
   - **A)** `--mg-badge-status-*`가 (로드 순서/캐시 등으로) **해당 컨텍스트에서 적용되지 않거나**,  
   - **B)** 다른 스타일이 **배경을 transparent로, color를 흰색 계열로** 덮어쓰고 있거나,  
   - **C)** 상위에서 **color**가 흰색으로 상속되고, 배경만 비어 있게 되는 경우.

**추가 확인 결과:**

- `.mg-v2-mapping-list-row` 또는 `.mg-v2-mapping-list-row__status`를 대상으로 **background: transparent** 또는 **color: white/#fff/var(--mg-white)** 를 주는 규칙은 **매핑관리·B0KlA·MappingListRow 관련 CSS에서 발견되지 않음**.
- 따라서 **규칙 누락**이 원인일 가능성이 가장 큼:  
  **B0KlA 스코프에서 “리스트 행 안의 배지”에 대한 배경/글자색 규칙이 없고**,  
  전역 토큰(`--mg-badge-status-*`)만으로는 (로드 순서·환경에 따라) 배경이 비어 보이거나, 상속된 흰색 글씨만 보일 수 있는 구조다.

### 2.3 근본 원인 정리 (상태 배지)

1. **B0KlA 배지 규칙의 스코프 한계**  
   `.mg-v2-ad-b0kla .mg-v2-mapping-**client-block** .mg-v2-status-badge...` 만 있어서,  
   **.mg-v2-mapping-list-row** 안의 `.mg-v2-status-badge`에는 **배경/글자색을 주는 B0KlA 규칙이 적용되지 않음.**

2. **리스트 행 배지는 StatusBadge.css + 토큰에만 의존**  
   `var(--mg-badge-status-success-bg)` / `var(--mg-badge-status-success-text)` 등이 **해당 페이지에서 유효하지 않거나**, 또는 **다른 요인(상속·다른 스타일)** 으로 배경이 비고 글자색만 흰색처럼 보일 수 있음.

3. **같은 요소를 덮어쓰는 “배경 없음/흰 글자” 규칙**  
   리스트 행·배지를 직접 타깃으로 한 그런 규칙은 **검색 결과 없음**.  
   → 원인은 “B0KlA 리스트 행 배지용 규칙 부재 + (필요 시) 토큰 유효성/로드 순서”로 보는 것이 타당함.

---

## 3. 환불 버튼: 색상이 없어 보이는 원인

### 3.1 적용되는 CSS 규칙

- **사용처**: `MappingListRow.js`에서 `ActionButton variant="danger"` → 클래스 `mg-v2-button--danger`.
- **위치**: `.mg-v2-mapping-list-row__actions` 안.

**관련 규칙:**

| 순서 | 파일 | 선택자 | 속성 |
|------|------|--------|------|
| 1 | ActionButton.css | `.mg-v2-button--danger` | `background: var(--mg-error-500); color: var(--mg-white); border: none;` |
| 2 | MappingListRow.css | `.mg-v2-mapping-list-row__actions .mg-v2-button--danger` | `background: var(--mg-error-600, #dc2626); color: var(--mg-white, #fff); border: 1px solid var(--mg-error-700, #b91c1c); ...` |
| 3 | AdminDashboardB0KlA.css | `.mg-v2-ad-b0kla .mg-v2-mapping-list-row__actions .mg-v2-button--danger` | `background: var(--mg-error-600, #dc2626); color: var(--mg-white, #fff); border: 1px solid var(--mg-error-700, #b91c1c); ...` |

MappingListRow / B0KlA 규칙은 **fallback**으로 `#dc2626`, `#fff`, `#b91c1c`를 주므로, **변수가 유효하면** 빨간 배경과 흰 글자가 나와야 함.  
따라서 “색상이 없다”는 현상은 **변수 자체가 유효하지 않을 때** 발생할 가능성이 큼.

### 3.2 --mg-error-500 / --mg-white 유효성 (순환 참조)

**unified-design-tokens.css:**

- **59행**: `--cs-error-500: var(--mg-error-500);`
- **316행**: `--mg-error-500: var(--cs-error-500);`

→ **--cs-error-500**과 **--mg-error-500**이 서로만 참조하여 **어느 쪽도 구체 값(hex)이 없음**.  
CSS custom property는 순환 시 **invalid**로 처리되므로, `var(--mg-error-500)`을 쓰는 모든 속성(background 등)은 **유효한 색을 얻지 못함**.

**unified-design-tokens.css:**

- **190행**: `--cs-white: var(--mg-white);`
- **368행**: `--mg-white: var(--cs-white);`

→ **--mg-white**와 **--cs-white**도 **순환 참조**.  
동일하게 **invalid**가 되어, `color: var(--mg-white)` 등은 유효한 색을 얻지 못할 수 있음.

**dashboard-tokens-extension.css (145행):**

- `--mg-white: #ffffff;` 로 **순환 깨는 재정의**가 있음.
- 이 파일은 **index.css**를 통해서만 로드되고, **MappingManagementPage**는 이 파일을 **직접 import하지 않음**.
- 앱 부트 시 `index.css`가 먼저 로드되면 전역 `:root`에는 `--mg-white: #ffffff`가 적용됨.
- 하지만 **매칭관리 페이지 진입 시** MappingManagementPage 청크에서 **unified-design-tokens.css가 다시 로드**되면, 같은 `:root`에 `--mg-white: var(--cs-white)`가 **다시 덮어씌워질 수 있음**.  
  그 순간 **--mg-white**는 다시 순환으로 invalid가 됨.

**정리:**

- **--mg-error-500** / **--cs-error-500**은 **unified-design-tokens.css 내에서만** 정의되며, **어디에도 hex로 끊어주는 정의가 없음** → 항상 **invalid** 가능성이 높음.
- **--mg-white**는 **dashboard-tokens-extension.css**에서 한 번 끊어주지만, **unified-design-tokens.css가 나중에 다시 적용되면** 다시 순환이 되어 **invalid**가 될 수 있음.

### 3.3 근본 원인 정리 (환불 버튼)

1. **--mg-error-500 순환**  
   `--cs-error-500 ↔ --mg-error-500` 때문에 **버튼 background**에 사용되는 `var(--mg-error-500)`이 **invalid** → 배경색이 비어 보임.

2. **--mg-white 순환 + 재적용**  
   `--mg-white ↔ --cs-white` 순환이 있고, 매칭관리 페이지에서 **unified-design-tokens.css를 다시 로드**하면 **--mg-white**가 다시 순환으로 덮어씌워질 수 있어 **invalid** → 글자색도 비어 보이거나 상속에만 의존할 수 있음.

3. **Fallback이 있어도**  
   MappingListRow.css / B0KlA.css의 `var(--mg-error-600, #dc2626)`, `var(--mg-white, #fff)` 등은 **--mg-error-600**, **--mg-error-700**도 결국 **unified-design-tokens** 체인을 타는데, **--mg-error-500**이 invalid라도 **--mg-error-600/700**은 해당 파일에서 `--cs-error-600/700`(hex)로 이어지므로 유효할 수 있음.  
   다만 **선택자 우선순위**상 ActionButton.css의 `.mg-v2-button--danger`가 먼저 적용되고, 그 다음에 ListRow/B0KlA 규칙이 오므로, **먼저 적용된** `background: var(--mg-error-500)`가 invalid이면 그대로 “색 없음”이 되고, **나중 규칙**이 `var(--mg-error-600, #dc2626)`로 덮어줘야 보임.  
   실제로 “색이 없다”면 (1) **나중 규칙이 적용되지 않았거나**(선택자/로드 순서), (2) **--mg-error-600/700도 해당 컨텍스트에서 invalid이거나**, (3) **--mg-white**가 invalid로 **color**까지 빠져서 버튼이 전반적으로 안 보일 수 있음.  
   **가장 확실한 원인**은 **--mg-error-500**과 **--mg-white**의 **순환으로 인한 invalid**이다.

---

## 4. 수정 제안 (코드 수정 없이, 파일·선택자·방향만)

### 4.1 상태 배지: 매칭 리스트 행에서 배경·글자색 확실히 보이게

- **방안 A (권장)**  
  - **파일**: `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css`  
  - **위치**: 기존 “매칭 카드 내 배지” 블록(129–142행) 아래 또는 동일 블록 인근.  
  - **내용**:  
    - **선택자 추가**:  
      `.mg-v2-ad-b0kla .mg-v2-mapping-list-row .mg-v2-status-badge.mg-v2-badge--success`,  
      `.mg-v2-ad-b0kla .mg-v2-mapping-list-row .mg-v2-status-badge.mg-v2-badge--warning`,  
      `.mg-v2-ad-b0kla .mg-v2-mapping-list-row .mg-v2-status-badge.mg-v2-badge--neutral`  
      (필요 시 danger, info 동일).  
    - **속성**:  
      - success: `background: var(--ad-b0kla-green); color: #fff;` (또는 `var(--mg-badge-status-success-bg)` 등 토큰 사용 시 **fallback** 반드시 추가, 예: `var(--mg-badge-status-success-bg, #...)`).  
      - warning: `background: var(--ad-b0kla-orange); color: #fff;`  
      - neutral: `background: var(--ad-b0kla-text-secondary); color: #fff;`  
    - **목적**: B0KlA 스코프 안의 **리스트 행** 배지에도 카드 블록과 동일하게 배경·글자색을 보장.

- **방안 B (보조)**  
  - **파일**: `frontend/src/styles/dashboard-tokens-extension.css`  
  - **확인**: 매칭관리 페이지가 이 파일을 **반드시** 사용하도록 진입 경로/번들에서 로드되는지 확인.  
  - 필요 시 매칭관리 페이지 또는 상위 레이아웃에서 **dashboard-tokens-extension.css를 명시적으로 import**하여, `--mg-badge-status-*`가 항상 정의되게 함.

### 4.2 환불 버튼: 배경·글자색 확실히 적용되게

- **방안 A: 순환 제거 (권장)**  
  - **파일**: `frontend/src/styles/unified-design-tokens.css`  
  - **위치**: 59행 근처.  
  - **내용**:  
    - `--cs-error-500: var(--mg-error-500);` 를 **구체 hex 한 번만** 정의하도록 변경.  
      예: `--cs-error-500: #ef4444;` (또는 프로젝트 에러 색상에 맞는 hex).  
    - 316행 `--mg-error-500: var(--cs-error-500);` 는 유지해도 됨 (이제 순환 아님).  
  - **동일 파일**:  
    - 190행 `--cs-white: var(--mg-white);` 와 368행 `--mg-white: var(--cs-white);` 순환 제거.  
      예: **한쪽만** 구체 값으로 끊기.  
      - `:root` 상단 등 한 곳에 `--mg-white: #ffffff;` 로 두고,  
      - `--cs-white: var(--mg-white);` 만 두거나,  
      - 또는 `--cs-white: #ffffff;` 로 두고 `--mg-white: var(--cs-white);` 유지.  
  - **목적**: `var(--mg-error-500)`, `var(--mg-white)` 가 항상 유효한 값으로 해석되게 함.

- **방안 B: 스코프에서 fallback 강화**  
  - **파일**: `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css`  
  - **위치**: 환불 버튼 가시성 강화 블록(93–109행).  
  - **내용**:  
    - `background: var(--mg-error-600, #dc2626);` → 이미 fallback 있음.  
    - `color: var(--mg-white, #fff);` → 이미 fallback 있음.  
  - **추가**:  
    - 더 앞선 단계(ActionButton.css)를 덮기 위해, **동일 선택자**에서 `background` / `color` 를 **완전히 구체 값으로** 한 번 더 명시해도 됨.  
      예: `background: #dc2626; color: #ffffff;` (또는 B0KlA danger 토큰 hex로).  
  - **목적**: 변수가 invalid여도 해당 스코프에서만이라도 버튼 색이 보이게 함.

- **방안 C: dashboard-tokens-extension 로드 보장**  
  - **파일**: `frontend/src/components/admin/mapping-management/pages/MappingManagementPage.js` (또는 매칭관리 레이아웃).  
  - **내용**:  
    - `import '../../../../styles/dashboard-tokens-extension.css';` 를 **unified-design-tokens.css 다음**에 추가.  
  - **목적**: 이 페이지에서 **--mg-white** 등이 재정의된 상태로 유지되게 하여, unified-design-tokens 재로드 후에도 순환이 재적용되지 않게 함.

---

## 5. 적용 위치·체크리스트 요약

| 구분 | 파일 | 적용 위치 | 수정 방향 |
|------|------|-----------|-----------|
| **상태 배지** | AdminDashboardB0KlA.css | .mg-v2-mapping-client-block 배지 블록 인근 | `.mg-v2-ad-b0kla .mg-v2-mapping-list-row .mg-v2-status-badge.mg-v2-badge--*` 규칙 추가, 배경·글자색 명시 (또는 토큰+fallback). |
| **상태 배지** | (선택) dashboard-tokens-extension / 매칭관리 페이지 | :root 또는 페이지 진입 시 | 매칭관리에서 dashboard-tokens-extension 로드 보장해 `--mg-badge-status-*` 유효화. |
| **환불 버튼** | unified-design-tokens.css | 59행, 190/368행 근처 | --cs-error-500을 hex로 한 번 정의해 순환 제거; --mg-white/--cs-white 중 한 곳을 hex로 끊기. |
| **환불 버튼** | AdminDashboardB0KlA.css | 93–109행 | (이미 fallback 있음) 필요 시 background/color를 구체 hex로 한 번 더 명시해 변수 invalid 시에도 가시성 확보. |
| **환불 버튼** | (선택) MappingManagementPage.js | 상단 import | `dashboard-tokens-extension.css` import 추가해 --mg-white 재정의 유지. |

### core-coder 전달용 체크리스트

- [ ] AdminDashboardB0KlA.css: `.mg-v2-ad-b0kla .mg-v2-mapping-list-row` 내 `.mg-v2-status-badge.mg-v2-badge--success/warning/neutral`(및 필요 시 danger, info)에 배경·글자색 규칙 추가.
- [ ] unified-design-tokens.css: `--cs-error-500`을 hex(#ef4444 등)로 정의해 `--mg-error-500` 순환 제거.
- [ ] unified-design-tokens.css: `--mg-white` 또는 `--cs-white` 중 한 곳을 #ffffff로 정의해 순환 제거.
- [ ] (선택) AdminDashboardB0KlA.css: 환불 버튼 가시성 블록에서 background/color를 fallback 또는 구체 hex로 한 번 더 명시.
- [ ] (선택) MappingManagementPage에서 dashboard-tokens-extension.css 명시 import.
- [ ] 매칭관리 화면에서 카드/리스트 뷰 상태 배지·환불 버튼 가독성 및 색상 적용 여부 확인.

---

## 6. 참고: 기존 분석 문서와의 관계

- `docs/debug/MAPPING_MANAGEMENT_BADGE_REFUND_VISIBILITY_ANALYSIS.md`: 테이블 뷰 배지(StatusBadge 미사용), 테이블 환불 버튼 클래스(mg-v2-button-danger vs mg-v2-button--danger), 토큰 gray-600 등 정리됨.
- 본 문서는 **리스트 행(.mg-v2-mapping-list-row) 상태 배지**와 **환불 버튼**에 대해, **실제 적용 규칙·토큰 유효성(순환 참조)·수정 위치**를 정밀히 보완한 내용이다.  
  두 문서를 함께 참고해 배지·버튼 가시성 수정을 진행하면 된다.
