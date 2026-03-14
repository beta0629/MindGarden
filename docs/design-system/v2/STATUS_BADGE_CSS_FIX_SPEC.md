# StatusBadge 배지 미표시 현상 수정 스펙 (core-coder 전달용)

**작성일**: 2025-03-14  
**목적**: StatusBadge(활성 등) 배지 디자인 미적용·흰색 글씨 미표시 원인 정리 및 수정 방안  
**참조**: StatusBadge.js, StatusBadge.css, dashboard-tokens-extension.css, COMMON_UI_IMPLEMENTATION_SPEC.md

---

## 1. 현상 요약

- **증상**: 상태 배지(활성, 결제 대기 등)에 배지 스타일이 적용되지 않음. 흰색 글씨로 안 보이거나 배지 배경/글자색이 전혀 나오지 않음.
- **추정 원인**: CSS 정리 과정에서 레거시 규칙이 공통 배지 스타일을 덮어씀.

---

## 2. 마크업·클래스 구조 (현재 정상)

### 2.1 StatusBadge 컴포넌트 (common/StatusBadge.js)

- **기본 클래스**: `mg-v2-status-badge`
- **variant modifier**: `mg-v2-badge--success` | `mg-v2-badge--warning` | `mg-v2-badge--neutral` | `mg-v2-badge--danger` | `mg-v2-badge--info`
- **출력 예**: `<span class="mg-v2-status-badge mg-v2-badge--success" role="status">활성</span>`

**마크업 변경 불필요.** 퍼블리셔 관점에서 클래스 구조는 COMMON_UI_IMPLEMENTATION_SPEC 및 BADGE_LIGHT_BG_CONTRAST_SPEC과 일치함.

### 2.2 common/StatusBadge.css (의도된 스타일)

- `.mg-v2-status-badge`: 레이아웃·패딩·폰트크기·border-radius (배경/글자색 없음)
- `.mg-v2-badge--success` 등: `background-color`, `color`를 `var(--mg-badge-status-*-bg)`, `var(--mg-badge-status-*-text)` 사용
- dashboard-tokens-extension.css에서 위 변수 정의됨 (밝은 배경 대비: *-300 bg, *-900 text)

---

## 3. 원인: unified-design-tokens.css 레거시 규칙

### 3.1 흰색 글씨를 강제하는 규칙

| 위치 (파일:행) | 셀렉터 | 문제 속성 |
|----------------|--------|-----------|
| unified-design-tokens.css:16987-16999 | `.mg-v2-status-badge` | **color: var(--mg-white);** |
| unified-design-tokens.css:16681-16683 | `.mg-v2-badge--success` | **color: var(--color-white);** |
| unified-design-tokens.css:16676-16677 | `.mg-v2-badge--danger` | color: var(--color-white); |
| unified-design-tokens.css:16686-16688 | `.mg-v2-badge--warning` | color: var(--color-white); |

- 공통 StatusBadge는 **진한 글자색**(예: `--mg-badge-status-success-text` = `--mg-success-900`)을 쓰도록 설계되어 있음.
- `unified-design-tokens.css`가 index.css 등으로 전역 로드되며, 위 레거시 규칙이 **나중에 적용**되면 common/StatusBadge.css의 `color`를 덮어써서 흰 글씨가 됨.
- 배경은 `.mg-v2-badge--success` 등에서 `var(--color-success)` 등으로 들어갈 수 있어, “배경만 있고 글씨는 흰색” 또는 변수 미정의 시 “스타일이 하나도 안 나옴”처럼 보일 수 있음.

### 3.2 클래스명 불일치 (참고)

- 레거시: `mg-v2-status-badge--active`, `mg-v2-status-badge--pending` (상태명 modifier)
- 공통 컴포넌트: `mg-v2-badge--success`, `mg-v2-badge--warning` (variant modifier)
- AdminDashboardB0KlA.css 109~120행: `.mg-v2-mapping-client-block .mg-v2-status-badge--success` 등으로 오버라이드하는데, 실제 마크업은 `mg-v2-badge--success`이므로 해당 B0KlA 규칙은 **매칭되지 않음**. (수정 시 B0KlA 측 셀렉터도 정리 가능)

---

## 4. 토큰·변수 점검 결과

- **dashboard-tokens-extension.css**: `--mg-badge-status-success-bg`, `--mg-badge-status-success-text` 등 배지용 변수 정의됨. `--mg-success-300`, `--mg-success-900` 등은 unified-design-tokens의 `--cs-success-*`에 매핑됨.
- **--mg-font-xs**: dashboard-tokens-extension에서 `var(--mg-font-size-xs)` 참조. unified-design-tokens에는 `--mg-font-size-xs` 없고 `--font-size-xs`만 있음. 필요 시 `--mg-font-size-xs` 별칭 추가 또는 StatusBadge.css에서 `var(--mg-font-xs, 0.75rem)` 형태 폴백 유지 권장.
- **--mg-spacing-2, --mg-spacing-8**: StatusBadge.css에서 이미 `var(--mg-spacing-2, 2px)` 등 폴백 사용 중. dashboard-tokens-extension에 `--mg-spacing-2` 없음. 폴백으로 동작 가능.

---

## 5. 다른 CSS 오버라이드 여부

- **ConsultantClientList.css**: `.mg-v2-status-badge` 레이아웃만 정의, modifier는 `mg-v2-status-badge--active` 등 (상태명). 공통의 `mg-v2-badge--success`와는 별개. 해당 화면에서 common StatusBadge를 쓰면 common CSS가 적용되며, 레거시 unified 규칙이 나중에 오면 흰색 문제 동일.
- **AdminDashboardB0KlA.css**: `.mg-v2-ad-b0kla .mg-v2-badge.success` (단일 클래스 조합) 등이 있어, 공통의 `mg-v2-status-badge.mg-v2-badge--success`와는 셀렉터가 다름. IntegratedMatchingSchedule 루트는 `integrated-schedule`이라 `mg-v2-ad-b0kla`가 없어 해당 오버라이드는 미적용.
- **CardMeta.css**: `.integrated-schedule__card-meta .mg-v2-status-badge`에 min-height만 지정, color/background 없음.

---

## 6. 수정 방안 (core-coder 적용용)

### 6.1 권장: unified-design-tokens.css 레거시 규칙 제거/조정

1. **.mg-v2-status-badge 전역 color 제거**  
   - **파일**: `frontend/src/styles/unified-design-tokens.css`  
   - **위치**: 약 16987~16999행  
   - **조치**: `.mg-v2-status-badge` 블록에서 `color: var(--mg-white);` 제거.  
   - 또는 공통 배지만 제외하도록, 공통 modifier가 있을 때는 color를 건드리지 않게 규칙을 나누어 수정 (예: `.mg-v2-status-badge:not([class*="mg-v2-badge--"]) { color: var(--mg-white); }` 등).  
   - **권장**: 공통 StatusBadge가 항상 `mg-v2-badge--*`를 함께 쓰므로, **해당 블록에서 color 라인만 제거**하는 것이 가장 단순하고 안전.

2. **.mg-v2-badge--success / --warning / --danger / --primary 색상 정리**  
   - **파일**: `frontend/src/styles/unified-design-tokens.css`  
   - **위치**: 약 16676~16694행  
   - **조치**:  
     - 공통 StatusBadge(및 RemainingSessionsBadge)가 사용하는 variant와 충돌하지 않도록,  
     - 이 블록들을 **삭제**하거나,  
     - **공통 배지 스펙과 통일**: `color`를 `var(--mg-badge-status-success-text)` 등 토큰을 쓰도록 변경.  
   - **권장**: 공통 컴포넌트가 같은 클래스명(`mg-v2-badge--success` 등)을 사용하므로, 이 레거시 블록 전체를 제거하고 **common/StatusBadge.css + dashboard-tokens-extension.css**만 배지 스타일을 담당하게 하는 것이 일관적.

3. **.mg-v2-status-badge--active 등 (16902~17007)**  
   - 이 셀렉터는 `mg-v2-status-badge--active`(상태명) 형식이라 현재 common StatusBadge 마크업과는 매칭되지 않음.  
   - 다른 레거시 화면(ConsultantClientList 등)에서만 사용 중이라면, 해당 화면을 common StatusBadge로 통일한 뒤 이 블록을 제거하거나, 레거시 전용 스코프(예: 특정 부모 클래스) 안으로 옮기는 것을 권장.

### 6.2 대안: common/StatusBadge.css 셀렉터 강화

- **목적**: 로드 순서와 관계없이 공통 배지가 항상 이긴다.  
- **방법**: modifier와 함께 지정해 우선순위를 높임.  
  - 예: `.mg-v2-status-badge.mg-v2-badge--success { ... }`  
  - StatusBadge.css에서 기존 `.mg-v2-badge--success`를 `.mg-v2-status-badge.mg-v2-badge--success`로 변경하고, `color`·`background-color`를 명시.  
- **단점**: unified-design-tokens의 레거시 규칙이 계속 전역에 있으면, 다른 페이지에서 동일 클래스 조합을 쓰는 레거시 UI와 충돌할 수 있음. **근본 해결은 6.1 레거시 제거/조정.**

### 6.3 AdminDashboardB0KlA.css (선택)

- **위치**: 109~120행  
- **내용**: `.mg-v2-ad-b0kla .mg-v2-mapping-client-block .mg-v2-status-badge--success` 등.  
- **사실**: 실제 마크업은 `mg-v2-badge--success`이므로 이 셀렉터는 적용되지 않음.  
- **조치**: B0KlA에서도 공통 배지 클래스명을 쓰기로 했다면, 해당 규칙을 **삭제**하거나 셀렉터를 `.mg-v2-mapping-client-block .mg-v2-status-badge.mg-v2-badge--success` 등으로 맞춘 뒤, 필요 시 B0KlA 전용 색만 오버라이드.

---

## 7. 체크리스트 (구현 후 확인)

- [ ] 통합 스케줄(IntegratedMatchingSchedule) 카드에서 StatusBadge가 **밝은 배경 + 진한 글자**(success/warning/neutral 등)로 보이는지.
- [ ] 매칭 목록(MappingListRow, MappingCard 등)에서도 동일하게 배지 스타일이 적용되는지.
- [ ] ConsultantClientList 등 레거시에서 `mg-v2-status-badge--active` 등을 쓰는 부분이 있다면, common StatusBadge로 통일했는지 또는 레거시 규칙을 스코프 안으로 제한했는지.
- [ ] `unified-design-tokens.css`에서 제거/수정한 규칙이 다른 화면(특히 레거시 배지 사용처)에 부작용이 없는지 한 번씩 확인.

---

## 8. 요약

| 구분 | 내용 |
|------|------|
| **마크업** | 변경 없음. `mg-v2-status-badge` + `mg-v2-badge--{variant}` 유지. |
| **원인** | unified-design-tokens.css의 `.mg-v2-status-badge { color: var(--mg-white); }` 및 `.mg-v2-badge--success` 등 `color: var(--color-white)`가 공통 배지 스타일을 덮어씀. |
| **수정** | unified-design-tokens.css에서 해당 레거시 규칙 제거/조정(권장). 필요 시 StatusBadge.css 셀렉터 강화 또는 B0KlA 셀렉터 정리. |
| **참조 CSS** | common/StatusBadge.css, dashboard-tokens-extension.css(배지 변수), COMMON_UI_IMPLEMENTATION_SPEC.md, BADGE_LIGHT_BG_CONTRAST_SPEC. |

이 스펙대로 적용하면 StatusBadge 배지가 정상적으로 표시되고, 흰색 글씨 미표시 현상이 해소됩니다.
