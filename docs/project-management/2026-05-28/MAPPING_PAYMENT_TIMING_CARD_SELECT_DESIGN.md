# [Design Handoff] MappingCreationModal 결제 방식 카드형 선택 UI

## 1. 개요
- **대상**: `MappingCreationModal.js` 내 결제 방식 선택 (`fieldset.mg-v2-mapping-creation-modal__payment-timing`)
- **목적**: 기존 단순 라디오 버튼(작은 동그라미 + 텍스트)을 카드형 선택 UI로 변경하여 시각적 인지도를 높이고, 사용자가 결제 흐름의 차이(선납 입금 vs 사후 카드 결제)를 명확히 인지하도록 함.
- **디자인 원칙**: Atomic Design 패턴, B0KlA 디자인 시스템, SSOT 토큰 (`unified-design-tokens.css`) 준수.

## 2. 시각 스펙 (Visual Specs)

### 2.1. 레이아웃 및 구조
- **Wrapper (`fieldset`)**:
  - `display: grid`
  - **데스크탑 (≥768px)**: `grid-template-columns: 1fr 1fr;` (가로 2열 2카드 row layout)
  - **모바일 (<768px)**: `grid-template-columns: 1fr;` (세로 2카드 stack)
  - `gap: var(--mg-spacing-md, 16px);`
  - 기존의 박스 형태(`border`, `background`, `padding`)를 제거하고 투명한 컨테이너로 변경.

- **Card Item (`label`)**:
  - `display: flex; flex-direction: row; align-items: flex-start; gap: var(--mg-spacing-sm, 8px);`
  - `padding: var(--mg-spacing-md, 16px);`
  - `min-height: 84px;`
  - `border-radius: var(--ad-b0kla-radius, 8px);`
  - `cursor: pointer; transition: all 0.2s ease;`
  - `position: relative;`

- **Card Content**:
  - **좌측 아이콘**: `lucide-react` 아이콘 (크기 `20px`, 색상 `var(--ad-b0kla-green)`)
    - 선납 입금: `<Wallet />`
    - 사후 카드 결제: `<CreditCard />`
  - **중앙 텍스트 영역**: `display: flex; flex-direction: column; gap: var(--mg-spacing-xs, 4px);`
    - **메인 라벨**: `font-size: var(--mg-font-size-sm, 14px); font-weight: 600; color: var(--ad-b0kla-title-color);`
    - **보조 설명**: `font-size: var(--mg-font-size-xs, 12px); color: var(--ad-b0kla-text-secondary); line-height: 1.4;`
  - **우측 상단 (선택 시)**: `<CheckCircle />` 아이콘 (크기 `18px`, 색상 `var(--ad-b0kla-green)`). 우측 상단에 `absolute` 또는 flex 우측 정렬로 배치.

### 2.2. SSOT 토큰 매트릭스 (State Matrix)

하드코딩 hex를 배제하고 `unified-design-tokens.css` 및 B0KlA 컨텍스트 변수를 활용합니다.

| State | Background | Border | Text (Main) | Text (Sub) | Shadow |
|-------|------------|--------|-------------|------------|--------|
| **Default (Unselected)** | `var(--ad-b0kla-card-bg)` | `1px solid var(--ad-b0kla-border)` | `var(--ad-b0kla-title-color)` | `var(--ad-b0kla-text-secondary)` | `none` |
| **Hover** | `var(--ad-b0kla-card-bg)` | `1px solid var(--ad-b0kla-green)` | `var(--ad-b0kla-title-color)` | `var(--ad-b0kla-text-secondary)` | `var(--mg-shadow-sm)` |
| **Selected** | `var(--ad-b0kla-green-bg)` | `2px solid var(--ad-b0kla-green)` | `var(--ad-b0kla-title-color)` | `var(--ad-b0kla-text-secondary)` | `var(--mg-shadow-sm)` |
| **Focus-Visible** | - | `outline: 2px solid var(--ad-b0kla-green)` | - | - | - |
| **Disabled** | `var(--ad-b0kla-bg-soft)` | `1px solid var(--ad-b0kla-border)` | `var(--ad-b0kla-text-muted)` | `var(--ad-b0kla-text-muted)` | `none` |

*(참고: Selected 상태에서 border 두께가 2px로 증가함에 따라 레이아웃 시프트가 발생하지 않도록, 선택 시 padding을 `calc(var(--mg-spacing-md) - 1px)`로 보정하거나 `box-sizing: border-box` 내에서 내부 콘텐츠 크기가 유지되도록 처리 권고)*

## 3. 접근성 (a11y) 매트릭스
- **구조 유지**: 기존 `<fieldset>` 및 `<legend>` 구조를 유지하여 폼 그룹의 의미를 보존.
- **ARIA 속성**:
  - `<fieldset role="radiogroup" aria-labelledby="mapping-creation-payment-timing-legend">`
- **시각적 숨김 처리 (sr-only)**:
  - 실제 `<input type="radio">`는 화면에서 보이지 않게 처리하되(`width: 0, height: 0, opacity: 0, position: absolute`), 스크린 리더와 키보드 포커스는 받을 수 있도록 유지.
- **키보드 네비게이션**:
  - `input[type="radio"]`가 포커스를 받을 때, 부모 `<label>` 카드 요소에 `:focus-visible` 스타일(`outline: 2px solid var(--ad-b0kla-green); outline-offset: 2px;`)이 적용되도록 CSS 인접 형제 선택자(`+` 또는 `:has(:focus-visible)`) 활용.
  - Arrow 키 네비게이션 및 Space/Enter 선택 지원 (기본 radio input 동작).

## 4. 다국어 (i18n) 키 매트릭스
기존 키를 유지하며, 카드 내부에 표시될 보조 설명 텍스트를 위한 신규 키를 추가합니다. (`admin.json`)

| Key | Description | Example (ko) |
|-----|-------------|--------------|
| `admin:mappingCreation.paymentTiming.title` | 범주 제목 | 결제 방식 (기존 유지) |
| `admin:mappingCreation.paymentTiming.advance` | 선납 입금 라벨 | 선납 입금 (기존 유지) |
| `admin:mappingCreation.paymentTiming.advanceDesc` | 선납 입금 보조 설명 | 매칭 확정 전 입금 확인 (신규 추가) |
| `admin:mappingCreation.paymentTiming.sameDayCard` | 사후 카드 결제 라벨 | 사후 카드 결제 (기존 유지) |
| `admin:mappingCreation.paymentTiming.sameDayCardDesc` | 사후 카드 결제 보조 설명 | 당일 방문 시 카드 결제 (신규 추가) |

## 5. core-coder 위임 명세 (Implementation Guide)

### 대상 파일
- `frontend/src/components/admin/MappingCreationModal.js`
- `frontend/src/components/admin/MappingCreationModal.css`
- `frontend/src/locales/ko/admin.json`

### CSS 클래스 구조 제안 (MappingCreationModal.css)
```css
/* 기존 fieldset 스타일 덮어쓰기 (카드 그리드 컨테이너로 변환) */
.mg-v2-mapping-creation-modal__payment-timing {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--mg-spacing-md, 16px);
  margin-bottom: var(--mg-spacing-md, 16px);
  padding: 0;
  border: none;
  background: transparent;
}

@media (max-width: 768px) {
  .mg-v2-mapping-creation-modal__payment-timing {
    grid-template-columns: 1fr;
  }
}

/* 카드형 라디오 옵션 */
.mg-v2-mapping-creation-modal__payment-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--mg-spacing-sm, 8px);
  padding: var(--mg-spacing-md, 16px);
  border: 1px solid var(--ad-b0kla-border);
  border-radius: var(--ad-b0kla-radius, 8px);
  background: var(--ad-b0kla-card-bg);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 84px;
}

.mg-v2-mapping-creation-modal__payment-card:hover {
  border-color: var(--ad-b0kla-green);
  box-shadow: var(--mg-shadow-sm);
}

.mg-v2-mapping-creation-modal__payment-card--selected {
  border: 2px solid var(--ad-b0kla-green);
  background: var(--ad-b0kla-green-bg);
  padding: calc(var(--mg-spacing-md, 16px) - 1px); /* border 두께 보정 */
}

/* 실제 라디오 인풋 숨김 (접근성 유지) */
.mg-v2-mapping-creation-modal__payment-card input[type="radio"] {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* 키보드 포커스 가시성 */
.mg-v2-mapping-creation-modal__payment-card:has(input[type="radio"]:focus-visible) {
  outline: 2px solid var(--ad-b0kla-green);
  outline-offset: 2px;
}

/* 카드 내부 콘텐츠 구조 */
.mg-v2-mapping-creation-modal__payment-card-icon {
  color: var(--ad-b0kla-green);
  flex-shrink: 0;
  margin-top: 2px;
}

.mg-v2-mapping-creation-modal__payment-card-content {
  display: flex;
  flex-direction: column;
  gap: var(--mg-spacing-xs, 4px);
  flex: 1;
}

.mg-v2-mapping-creation-modal__payment-card-title {
  font-size: var(--mg-font-size-sm, 14px);
  font-weight: 600;
  color: var(--ad-b0kla-title-color);
}

.mg-v2-mapping-creation-modal__payment-card-desc {
  font-size: var(--mg-font-size-xs, 12px);
  color: var(--ad-b0kla-text-secondary);
  line-height: 1.4;
}

.mg-v2-mapping-creation-modal__payment-card-check {
  color: var(--ad-b0kla-green);
  flex-shrink: 0;
}
```
