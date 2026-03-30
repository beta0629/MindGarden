# 배지/칩 기반 선택 컴포넌트 디자인 스펙

**버전**: 1.0.0  
**작성**: core-designer  
**참조**: PENCIL_DESIGN_GUIDE.md, 어드민 대시보드 샘플 (https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample), **모달/폼 배치**: `docs/design/BADGE_SELECT_LAYOUT_GUIDE.md`  
**목적**: 드롭다운 대신 배지/칩 선택 UI 적용 시 비주얼·레이아웃·접근성 기준 정의. 전체 교체 시 UI 일관성 유지 방안 포함.

---

## 1. 개요 및 검토 결론

### 1.1 드롭다운 vs 배지 선택

| 구분 | 드롭다운 (CustomSelect) | 배지/칩 선택 |
|------|-------------------------|--------------|
| **공간** | 한 줄에 트리거만 노출, 옵션은 열릴 때만 표시 | 옵션이 항상 노출되어 한눈에 파악 가능 |
| **스크롤/포커스** | 모달·스크롤과 충돌 가능(포탈·위치 갱신 필요) | 인라인 배치로 스크롤·z-index 이슈 적음 |
| **옵션 수** | 많을 때(10개+) 검색·스크롤 리스트에 유리 | 적을 때(3~8개) 직관적, 많을 때는 그리드+스크롤/접기 필요 |
| **선택 피드백** | 트리거에 선택값만 표시 | 선택된 배지 시각적 강조로 즉시 인지 |
| **다중 선택** | 체크박스 리스트 형태로 구현 가능 | 토글형 배지가 자연스러움 |

**검토 결론**: 옵션이 **적은 단일/다중 선택** 필드(결제 수단, 담당자, 상태 등)는 **배지 기반 선택**이 드롭다운보다 유리하다. 옵션이 **매우 많은 경우**(50개 이상) 또는 **검색이 필수**인 경우에는 드롭다운(또는 콤보+검색)을 유지하는 것이 좋다. **전체를 무조건 배지로 바꾸기보다**, 화면별로 옵션 수·다중 선택 여부를 보고 배지 vs 드롭다운를 선택하는 것을 권장한다.

---

## 2. 배지/칩 선택 UI 스펙

### 2.1 모드

- **단일 선택 (Single Select)**  
  여러 배지 중 **하나만** 선택 가능. 선택된 배지 시각적 강조, 나머지는 비선택 스타일.
- **다중 선택 (Multi Select)**  
  여러 개 선택 가능. **토글 형태** — 클릭 시 선택/해제 전환.

### 2.2 상태별 스타일 (디자인 토큰)

프로젝트 단일 소스: `mindgarden-design-system.pen`, `pencil-new.pen`, `unified-design-tokens.css`. 아래는 B0KlA 팔레트 및 `var(--mg-*)` 계열 토큰 기준.

| 상태 | 배경 | 테두리 | 텍스트 | 비고 |
|------|------|--------|--------|------|
| **기본 (Default)** | `var(--mg-color-surface-main)` (#F5F3EF) | 1px `var(--mg-color-border-main)` (#D4CFC8) | `var(--mg-color-text-main)` (#2C2C2C) | 비선택 배지 |
| **호버 (Hover)** | `var(--mg-color-surface-main)` 또는 약간 어둡게 | 1px `var(--mg-color-primary-main)` 또는 동일 | 동일 | cursor: pointer, transition 부드럽게 |
| **선택됨 (Selected)** | `var(--mg-color-primary-main)` (#3D5246) | 1px `var(--mg-color-primary-main)` | #FAF9F7 또는 `var(--mg-color-background-main)` 대비 밝은 색 | 단일/다중 공통 |
| **선택됨 + 호버** | `var(--mg-color-primary-light)` (#4A6354) | 동일 | 동일 | 해제 가능함을 암시 |
| **비활성 (Disabled)** | `var(--mg-color-surface-main)` | `var(--mg-color-border-main)` | `var(--mg-color-text-secondary)` (#5C6B61), opacity 0.7 | 클릭 불가, 포커스 없음 |
| **포커스 (Focus)** | 기본/선택 상태 유지 | 2px `var(--mg-color-primary-main)` + outline 또는 box-shadow (접근성) | 동일 | 키보드 포커스 링 명확히 |

### 2.3 치수·타이포·간격

- **패딩**: 세로 10px, 가로 16px (또는 `var(--cs-spacing-sm)` 8px, `var(--cs-spacing-md)` 16px). 버튼 높이 40px와 맞추려면 min-height 40px 권장.
- **border-radius**: 10px (사이드바 메뉴와 동일, B0KlA). 토큰: `var(--radius-md)` (1rem) 또는 10px 고정.
- **폰트**: Noto Sans KR. 크기 14px (본문), 선택 시 font-weight 600 가능.
- **배지 간격**: 가로·세로 gap 8px~12px (`var(--cs-spacing-sm)` ~ `var(--cs-spacing-md)`). 현재 구현(`BadgeSelect.css`)은 `gap: var(--cs-spacing-sm, 8px)` 사용 — 스펙 범위 내.

**점검 요약 (스펙 ↔ BadgeSelect.css)**  
컨테이너: `padding: 2px 0`(포커스 링 클리핑 방지), `min-height: 40px`, `gap: 8px`, `flex-wrap: wrap`, `align-items: center`. 배지 아이템: `padding: 10px 16px`, `min-height: 40px`, `border-radius: 10px`. 2줄 이상 시 줄바꿈·정렬은 §3.4 및 BADGE_SELECT_LAYOUT_GUIDE.md 참고.

### 2.4 구현 시 클래스/토큰 제안

코더가 추측 없이 쓰도록 **클래스명·토큰**을 명시한다.

- 컨테이너: `mg-v2-badge-select` (또는 `mg-badge-select`)
- 배지 공통: `mg-v2-badge-select__item`
- 상태: `mg-v2-badge-select__item--selected`, `mg-v2-badge-select__item--disabled`
- 색상은 위 표의 `var(--mg-color-*)` 사용. 없으면 `var(--mg-primary-500)`, `var(--mg-color-text-main)` 등 기존 토큰으로 매핑.

---

## 3. 레이아웃 가이드

### 3.1 옵션 수에 따른 배치

| 옵션 수 | 배치 | 비고 |
|---------|------|------|
| **3~8개** | 한 줄 또는 2줄 그리드 | flex-wrap: wrap, gap 8~12px. 한 줄에 다 안 들어가면 자동 줄바꿈. |
| **9~15개** | 2줄 그리드 + 필요 시 영역 스크롤 | max-height 예: 120px~160px, overflow-y: auto. |
| **16개 이상** | 그리드 + 영역 스크롤 또는 **「더보기」 접기** | 기본 8~12개만 노출 후 “더보기” 클릭 시 나머지 확장. 또는 스크롤 영역으로 전체 노출. |

### 3.2 모달/폼 내부

- **여백 (상하좌우)**  
  - **라벨 ↔ 배지 그룹**: 8px (`var(--cs-spacing-sm)`). 라벨 아래에 배지 그룹이 오는 경우 이 간격만 적용.  
  - **배지 그룹 상하**: 다른 폼 행·섹션과의 간격 12~16px (`var(--cs-spacing-sm)` ~ `var(--cs-spacing-md)`).  
  - **배지 그룹 좌우**: 0 — 필드 영역 내에서 라벨과 동일 시작선(좌측 정렬), 우측은 컨테이너 끝까지.
- **정렬**: 라벨은 왼쪽 정렬, 배지 그룹은 라벨과 동일한 시작선(좌측 정렬). 폼이 좌측 라벨 + 우측 필드 구조면 배지 영역은 필드 셀에 배치.
- **섹션 블록**: `docs/design-system/PENCIL_DESIGN_GUIDE.md`의 섹션 블록(배경 `var(--mg-color-surface-main)`, 테두리 1px `var(--mg-color-border-main)`, radius 16px, 패딩 24px) 안에 넣을 때는 **섹션 내부 gap 16px** (`var(--cs-spacing-md)`) 유지 — 배지 행과 다른 블록 자식 간 간격도 16px로 통일.

### 3.3 라벨·필수 표시

- 그룹 라벨: 12px, `var(--mg-color-text-secondary)`, fontWeight 500~600. 필수일 때 별표(*) 또는 “(필수)” 텍스트.
- 그룹 컨테이너에 `role="group"`, `aria-label` 또는 `aria-labelledby`로 라벨 연결.

### 3.4 폼 행 하나(라벨 + BadgeSelect) 레이아웃

모달/폼에서 **한 행 = 라벨 + BadgeSelect**로 쓸 때 공통 규칙.

| 항목 | 권장값 | 토큰/비고 |
|------|--------|-----------|
| 라벨 → 배지 그룹 간격 | 8px | `var(--cs-spacing-sm)` 또는 margin-top on wrapper |
| 배지 영역 min-height | 40px | 컴포넌트 `.mg-v2-badge-select`에 이미 적용. 옵션 0개·1줄일 때도 높이 유지 |
| 배지 그룹 → 다음 폼 행 | 12~16px | `var(--cs-spacing-sm)` ~ `var(--cs-spacing-md)` |
| 2줄 이상 시 정렬 | 좌측 정렬, 줄 간 gap 동일 | 컨테이너 `align-items: flex-start` 권장 — 라벨 아래 첫 줄이 수직으로 일정함 |
| 섹션 블록 내부 | 자식 간 gap 16px | `var(--cs-spacing-md)`. BadgeSelect를 감싼 행도 한 “자식”으로 간주 |

**래퍼 마크업 예시 (코더 참고)**  
라벨과 BadgeSelect를 하나의 폼 행으로 감쌀 때: 라벨에 `margin-bottom: 8px`, BadgeSelect 래퍼에 `margin-bottom: 16px`(섹션 내) 또는 12~16px. 좌우 패딩은 섹션 블록 24px에 맡기고, 래퍼는 추가 좌우 margin 없음.

---

## 4. 접근성·반응형

### 4.1 접근성

- **키보드**: 각 배지는 버튼 또는 role="button" + tabIndex={0}. Enter/Space로 선택·해제. 단일 선택 시 선택 후 포커스는 그룹으로 이동해도 됨.
- **포커스**: focus-visible 시 outline 또는 box-shadow(0 0 0 2px `var(--mg-color-primary-main)`)로 명확히 표시.
- **역할·라벨**:  
  - 컨테이너: `role="group"` + `aria-label="결제 수단"` 등.  
  - 단일 선택: `role="radiogroup"`, 각 배지 `role="radio"`, `aria-checked`.  
  - 다중 선택: `role="group"`, 각 배지 `role="checkbox"`, `aria-checked`.  
  - 비활성: `aria-disabled="true"`.
- **스크린 리더**: 라벨 + “선택됨”/“선택 안 됨” 등 상태 안내. 예: “결제 수단, 카드, 선택됨”.

### 4.2 반응형

- **모바일 (375px~)**: 터치 영역 최소 **44×44px** (RESPONSIVE_LAYOUT_SPEC). 배지 min-height 44px 또는 padding 확대.
- **태블릿·데스크톱**: 40px 높이 유지 가능, 호버 상태 명확히.
- **줄바꿈**: flex-wrap으로 자동 줄바꿈, 좌측 정렬 유지.

---

## 5. 기존 드롭다운(CustomSelect)과의 시각적 차이

| 항목 | CustomSelect (현재) | 배지 선택 (본 스펙) |
|------|---------------------|----------------------|
| **트리거** | 한 줄 박스 + 화살표, 클릭 시 드롭 열림 | 없음. 옵션이 곧 버튼들. |
| **색상** | 트리거 #f8fafc, 테두리 #cbd5e0, 포커스 파란 계열 | B0KlA: 서페이스 #F5F3EF, 테두리 #D4CFC8, 주조 #3D5246 |
| **타이포** | var(--font-size-sm), 일부 iOS 스타일 | Noto Sans KR, 14px, 선택 시 600 |
| **레이아웃** | 인라인 블록, min-width 180px | 블록 레벨 그리드/플렉스, 줄바꿈 |

CustomSelect는 현재 iOS/파란 계열 변수가 섞여 있음. 배지는 **처음부터 B0KlA·unified-design-tokens**만 사용해 어드민 샘플과 동일한 톤을 유지한다.

---

## 6. 전체 교체 시 UI 일관성 유지 방안

1. **용도별 선택 기준**  
   - 옵션 **3~약 15개** + 단일/다중 선택 → **배지**  
   - 옵션 **많음 + 검색 필요** → **CustomSelect(드롭다운)** 유지. 단, CustomSelect도 B0KlA 토큰으로 리팩터링 권장.
2. **공통 토큰**  
   배지와 드롭다운 모두 `var(--mg-color-primary-main)`, `var(--mg-color-border-main)`, `var(--mg-color-surface-main)`, `var(--mg-color-text-main)` 등 동일 토큰 사용 → 색·타이포 일관.
3. **컴포넌트 네이밍**  
   배지 컴포넌트는 `BadgeSelect` 또는 `mg-v2-badge-select`로 통일. 단일/다중은 prop으로 구분.
4. **폼 필드 라벨·에러**  
   기존 MGForm·폼 레이아웃과 동일한 라벨 위치, 에러 메시지 스타일 적용.
5. **점진적 전환**  
   한 화면 단위로 배지 적용 후, 결제 수단·담당자·상태 등부터 교체하고, 옵션 많은 필드는 드롭다운 유지.

---

## 7. 체크리스트 (디자이너·코더)

- [ ] 배지 기본/선택/호버/비활성/포커스에 PENCIL 가이드 토큰만 사용했는가?
- [ ] 단일 선택은 radiogroup, 다중 선택은 checkbox 시맨틱으로 설계했는가?
- [ ] 옵션 3~8 / 9~15 / 16+ 구간별 레이아웃(한 줄·2줄·스크롤·더보기)을 적용했는가?
- [ ] 모달/폼 내부에서 배지 영역 여백·정렬이 섹션 블록과 맞는가? (상세: `docs/design/BADGE_SELECT_LAYOUT_GUIDE.md`)
- [ ] 모바일 터치 44px, 키보드 포커스, aria 역할·라벨을 반영했는가?
- [ ] 전체 교체 시 “배지 vs 드롭다운” 용도 기준과 공통 토큰 적용으로 일관성을 유지할 수 있는가?

---

**문서 끝.**
