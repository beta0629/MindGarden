# 스케줄 모달 Step 3·Step 4 아토믹 디자인 스펙

**대상**: 스케줄 모달 **Step 3: 시간 선택**, **Step 4: 스케줄 세부사항**  
**기준**: MindGarden 어드민 대시보드 샘플, B0KlA 토큰(`--ad-b0kla-*`), `mg-v2-ad-*` 네이밍  
**목적**: 기존 UI를 레거시 클래스 없이 새 디자인 시스템으로 1:1 교체 가능하도록 스펙만 정의 (디자인 전용, 코드 없음)

---

## 공통 기준

- **섹션 블록**: Step 1·2와 동일하게 `mg-v2-ad-section-block`, `mg-v2-ad-section-block__header`, `mg-v2-ad-section-block__title`, `mg-v2-ad-section-block__content` 사용.
- **토큰 소스**: `frontend/src/styles/dashboard-tokens-extension.css` 및 `unified-design-tokens.css`의 `--ad-b0kla-*`, `--mg-*`. 신규 토큰은 `--ad-b0kla-*`로 추가.
- **스페이싱**: `--mg-spacing-xs`(4px), `--mg-spacing-sm`(8px), `--mg-spacing-md`(16px), `--mg-spacing-lg`(20px), `--mg-spacing-xl`(24px). 미정의 시 `16px` 등 fallback 명시.

---

## Step 3: 시간 선택 (Time Selection)

### 1. 아토믹 클래스명 (Time Step 전체)

| 역할 | 클래스명 | 비고 |
|------|----------|------|
| Step 3 래퍼(콘텐츠 영역) | `mg-v2-ad-time-step` | `mg-v2-ad-section-block__content` 직계 자식으로 사용. Step 2의 `mg-v2-ad-client-step`과 동일 계층 |
| 인트로(선택 시 부가 안내) | `mg-v2-ad-time-step__intro` | 선택 사항. 있으면 subtitle/note 감쌈 |
| 인트로 부제목 | `mg-v2-ad-time-step__subtitle` | 예: "상담 유형과 시간을 선택한 뒤 시간대를 골라주세요." |
| 인트로 보조 문구 | `mg-v2-ad-time-step__note` | 작은 안내 문구 |
| 폼 한 줄(상담 유형 + 상담 시간) | `mg-v2-ad-time-step__form-row` | flex row, 두 select 나란히 |
| 폼 그룹(라벨+select 한 쌍) | `mg-v2-ad-time-step__form-group` | flex: 1 권장 |
| 라벨 | `mg-v2-ad-time-step__label` | "상담 유형", "상담 시간" |
| select | `mg-v2-ad-time-step__select` | B0KlA 스타일 셀렉트 (또는 공용 `mg-v2-input` 사용 시 상위에 `.mg-v2-ad-time-step` 스코프) |

**구조 예 (의사 구조)**  
- `mg-v2-ad-section-block`  
  - `mg-v2-ad-section-block__header` + `mg-v2-ad-section-block__title` "시간 선택"  
  - `mg-v2-ad-section-block__content`  
    - `mg-v2-ad-time-step`  
      - (선택) `mg-v2-ad-time-step__intro` → `__subtitle`, `__note`  
      - `mg-v2-ad-time-step__form-row`  
        - `mg-v2-ad-time-step__form-group` → `__label` + `__select` (상담 유형)  
        - `mg-v2-ad-time-step__form-group` → `__label` + `__select` (상담 시간)  
      - TimeSlotGrid (아래 `mg-v2-ad-ts` 블록)

---

### 2. TimeSlotGrid (모달 내부 전용) — `mg-v2-ad-ts-*` 프리픽스

모달 안에서만 쓰일 때 전부 `mg-v2-ad-ts`(time-slot) 네이밍으로 통일. 기존 `mg-v2-time-slot-*`, `time-slot-grid-*` 제거 후 아래로 교체.

| 역할 | 클래스명 | 비고 |
|------|----------|------|
| 그리드 최상위 래퍼 | `mg-v2-ad-ts` | 스크롤 영역 포함한 전체 |
| 로딩 시 컨테이너 | `mg-v2-ad-ts mg-v2-ad-ts--loading` | 로딩 시 동일 래퍼에 modifier |
| 헤더 영역 | `mg-v2-ad-ts__header` | 제목 + duration 배지 한 줄 |
| 헤더 제목 | `mg-v2-ad-ts__title` | "시간 선택" (h5 수준) |
| 상담 시간 배지 | `mg-v2-ad-ts__duration-badge` | "상담 시간: 50분 (휴식 10분 포함)" |
| 범례 래퍼 | `mg-v2-ad-ts__legend` | 사용 가능/휴가/충돌/사용 불가/선택됨 |
| 범례 항목 하나 | `mg-v2-ad-ts__legend-item` | dot + 텍스트 |
| 범례 색상 점 | `mg-v2-ad-ts__legend-dot` | 정사각/원형 색상 칩 |
| 범례 dot – 사용 가능 | `mg-v2-ad-ts__legend-dot--available` | |  
| 범례 dot – 휴가 | `mg-v2-ad-ts__legend-dot--vacation` | |  
| 범례 dot – 과거 | `mg-v2-ad-ts__legend-dot--past` | |  
| 범례 dot – 충돌 | `mg-v2-ad-ts__legend-dot--conflict` | |  
| 범례 dot – 사용 불가 | `mg-v2-ad-ts__legend-dot--unavailable` | |  
| 범례 dot – 선택됨 | `mg-v2-ad-ts__legend-dot--selected` | |  
| 슬롯 그리드 컨테이너 | `mg-v2-ad-ts__container` | 시간대별 row 묶음 |
| 시간대 한 줄(row) | `mg-v2-ad-ts__row` | 한 시각(예: 9:00) + 해당 슬롯들 |
| 시각 라벨(예 9:00) | `mg-v2-ad-ts__hour` | |  
| 슬롯 그리드 | `mg-v2-ad-ts__grid` | 같은 시각의 슬롯들 flex/grid |
| 슬롯 아이템 기본 | `mg-v2-ad-ts-item` | 기본 = 사용 가능 |
| 슬롯 – 사용 가능 | `mg-v2-ad-ts-item mg-v2-ad-ts-item--available` (또는 modifier만) | 기본 상태면 `--available` 생략 가능 |
| 슬롯 – 휴가 | `mg-v2-ad-ts-item--vacation` | |  
| 슬롯 – 과거 | `mg-v2-ad-ts-item--past` | |  
| 슬롯 – 선택됨 | `mg-v2-ad-ts-item--selected` | |  
| 슬롯 – 충돌 | `mg-v2-ad-ts-item--conflict` | |  
| 슬롯 – 사용 불가 | `mg-v2-ad-ts-item--unavailable` | |  
| 슬롯 내 아이콘 | `mg-v2-ad-ts-item__icon` | |  
| 슬롯 내 시간 텍스트 | `mg-v2-ad-ts-item__time` | |  
| 슬롯 내 duration 텍스트 | `mg-v2-ad-ts-item__duration` | "50분" 등 |
| 빈 상태 래퍼 | `mg-v2-ad-ts__empty` | 슬롯 0개일 때 |
| 빈 상태 메시지 | `mg-v2-ad-ts__empty-text` | "사용 가능한 시간이 없습니다." |
| 빈 상태 보조 문구 | `mg-v2-ad-ts__empty-subtext` | "상담 시간과 휴식 시간을 고려한 결과입니다." |
| 기존 스케줄 박스 | `mg-v2-ad-ts__existing` | 기존 스케줄 목록 영역 |
| 기존 스케줄 제목 | `mg-v2-ad-ts__existing-title` | "기존 스케줄" (h6 수준) |
| 기존 스케줄 목록 | `mg-v2-ad-ts__existing-list` | |  
| 기존 스케줄 한 항목 | `mg-v2-ad-ts__existing-item` | |  
| 기존 스케줄 시간 | `mg-v2-ad-ts__existing-time` | "09:00 - 09:50" |
| 기존 스케줄 제목/설명 | `mg-v2-ad-ts__existing-label` | 상담 제목 등 |

---

### 3. Step 3 · TimeSlotGrid 토큰 매핑

| 요소 | 용도 | 토큰명 |
|------|------|--------|
| 섹션 제목 | "시간 선택" 텍스트 | `--ad-b0kla-title-color` |
| 인트로 부제/노트 | 보조 텍스트 | 부제: `--ad-b0kla-title-color`, 노트: `--ad-b0kla-text-secondary` |
| 폼 라벨 | 라벨 텍스트 | `--ad-b0kla-text-secondary` (또는 `--ad-b0kla-title-color` 600) |
| select 테두리/배경 | 기본 | border: `--ad-b0kla-border`, background: `--ad-b0kla-card-bg` 또는 `--ad-b0kla-bg` |
| select 포커스 | 포커스 링 | `--ad-b0kla-green` |
| select 텍스트 | 선택값 | `--ad-b0kla-title-color` |
| TS 헤더 구분선 | 하단 선 | `--ad-b0kla-border` |
| TS 제목 | "시간 선택" | `--ad-b0kla-title-color` |
| TS duration 배지 | 배경/텍스트 | background: `--ad-b0kla-bg`, color: `--ad-b0kla-text-secondary`, border-radius: `--ad-b0kla-radius-sm` |
| TS 범례 배경 | 범례 영역 | `--ad-b0kla-bg`, border: `--ad-b0kla-border`, radius: `--ad-b0kla-radius-sm` |
| TS 범례 텍스트 | 범례 라벨 | `--ad-b0kla-text-secondary` |
| 슬롯 카드 배경(기본) | 사용 가능 | `--ad-b0kla-card-bg`, border: `--ad-b0kla-border` |
| 슬롯 카드 테두리(기본) | | `--ad-b0kla-border` |
| 슬롯 선택됨(녹색) | 배경/테두리/강조 | border: `--ad-b0kla-green`, background: `--ad-b0kla-green-bg`, 강조 텍스트: `--ad-b0kla-green` |
| 슬롯 휴가(주황) | 배경/테두리 | border: `--ad-b0kla-orange`, background: `--ad-b0kla-orange-bg` |
| 슬롯 충돌(빨강) | 배경/테두리 | border: `--ad-b0kla-danger`, background: `--mg-error-50` (또는 `--ad-b0kla-danger` 연한 배경용 토큰 추가) |
| 슬롯 과거/사용 불가 | 배경/비활성 | background: `--ad-b0kla-bg`, color: `--ad-b0kla-text-secondary`, opacity 0.5~0.6 |
| 슬롯 호버(가능한 슬롯만) | 테두리/배경 | border: `--ad-b0kla-green`, background: `--ad-b0kla-green-bg` |
| 슬롯 radius | 카드 모서리 | `--ad-b0kla-radius-sm` |
| 빈 상태 텍스트 | 메인/보조 | 메인: `--ad-b0kla-title-color`, 보조: `--ad-b0kla-text-secondary` |
| 기존 스케줄 박스 | 배경/테두리 | background: `--ad-b0kla-bg`, border: `--ad-b0kla-border`, radius: `--ad-b0kla-radius-sm` |
| 기존 스케줄 제목 | 제목 | `--ad-b0kla-title-color` |
| 기존 스케줄 항목 텍스트 | 시간/라벨 | `--ad-b0kla-text-secondary`, 강조: `--ad-b0kla-title-color` |
| 간격(form-row gap) | 폼 그룹 사이 | `--mg-spacing-md` (16px) |
| 간격(인트로–폼–그리드 사이) | 세로 | `--mg-spacing-md` |
| 간격(범례 내부) | legend item gap | `--mg-spacing-sm` |
| 간격(슬롯 그리드) | slot 간격 | `--mg-spacing-sm` |
| 패딩(폼 그룹 내부) | label–select 간격 | `--mg-spacing-xs` (label 아래) |
| 패딩(TS 헤더/범례/빈 상태) | 내부 패딩 | `--mg-spacing-sm` ~ `--mg-spacing-md` |

**추가 권장 토큰(없으면 확장)**  
- `--ad-b0kla-danger-bg`: 충돌 슬롯 배경 (예: `var(--mg-error-50)`).  
- `--ad-b0kla-past-bg` / `--ad-b0kla-unavailable-bg`: 과거·사용불가 배경(선택).

---

### 4. Step 3 레이아웃

- **mg-v2-ad-time-step**  
  - `display: flex; flex-direction: column; gap: var(--mg-spacing-md);`  
  - 인트로(있을 때) → `__form-row` → TimeSlotGrid(`mg-v2-ad-ts`) 순서.

- **mg-v2-ad-time-step__form-row**  
  - `display: flex; gap: var(--mg-spacing-md); flex-wrap: wrap;`  
  - 자식 `__form-group`은 `flex: 1; min-width: 200px;` 수준 권장.

- **mg-v2-ad-ts**  
  - `display: flex; flex-direction: column; gap: var(--mg-spacing-md);`  
  - `__header` → `__legend` → `__container`(스크롤) → (있을 때) `__empty` 또는 `__existing`.

- **mg-v2-ad-ts__header**  
  - `display: flex; justify-content: space-between; align-items: center; padding-bottom: var(--mg-spacing-sm); border-bottom: 1px solid var(--ad-b0kla-border); margin-bottom: 0;`  
  - 제목과 duration 배지 한 줄.

- **mg-v2-ad-ts__legend**  
  - `display: flex; flex-wrap: wrap; gap: var(--mg-spacing-sm); align-items: center; padding: var(--mg-spacing-sm) var(--mg-spacing-md); background: var(--ad-b0kla-bg); border: 1px solid var(--ad-b0kla-border); border-radius: var(--ad-b0kla-radius-sm);`

- **mg-v2-ad-ts__container**  
  - `overflow-y: auto; max-height: 400px;` (또는 모달 높이에 맞춘 값)  
  - 내부: `__row` 반복. row당 `__hour` + `__grid`.

- **mg-v2-ad-ts__row**  
  - `display: flex; align-items: center; gap: var(--mg-spacing-md); margin-bottom: var(--mg-spacing-sm);`  
  - `__hour`: 고정 너비(예 40px). `__grid`: flex 또는 grid로 슬롯 나열.

- **mg-v2-ad-ts__grid**  
  - `display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: var(--mg-spacing-sm);` (또는 flex + wrap).

- **mg-v2-ad-ts-item**  
  - `display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--mg-spacing-xs); padding: var(--mg-spacing-md) var(--mg-spacing-sm); min-width: 80px; border-radius: var(--ad-b0kla-radius-sm); border: 2px solid; transition: border-color, background-color 0.2s;`

- **mg-v2-ad-ts__empty**  
  - `padding: var(--mg-spacing-xl) var(--mg-spacing-lg); text-align: center; background: var(--ad-b0kla-bg); border: 1px solid var(--ad-b0kla-border); border-radius: var(--ad-b0kla-radius-sm);`  
  - `__empty-text` / `__empty-subtext` 사이에 `--mg-spacing-sm` gap.

- **mg-v2-ad-ts__existing**  
  - `margin-top: var(--mg-spacing-md); padding: var(--mg-spacing-md); background: var(--ad-b0kla-bg); border: 1px solid var(--ad-b0kla-border); border-radius: var(--ad-b0kla-radius-sm);`  
  - `__existing-list`: `display: flex; flex-direction: column; gap: var(--mg-spacing-xs);`

---

## Step 4: 스케줄 세부사항 (Schedule Details)

### 1. 아토믹 클래스명 (Details Step)

기존 `mg-v2-schedule-details-*` 전부 제거하고 아래로 통일.

| 역할 | 클래스명 | 비고 |
|------|----------|------|
| Step 4 래퍼(콘텐츠 영역) | `mg-v2-ad-details-step` | `mg-v2-ad-section-block__content` 직계 자식 |
| 인트로(선택) | `mg-v2-ad-details-step__intro` | 필요 시 |
| 요약 카드 전체 | `mg-v2-ad-details-summary` | 상담사/내담자/시간/유형 카드 |
| 요약 한 줄 | `mg-v2-ad-details-summary__row` | label + value 한 행 |
| 요약 강조 행(유형 등) | `mg-v2-ad-details-summary__row--highlight` | 상단 구분선 + primary 색 |
| 요약 라벨 | `mg-v2-ad-details-summary__label` | "상담사:", "내담자:" 등 |
| 요약 값 | `mg-v2-ad-details-summary__value` | 이름, 시간, 유형 값 |
| 폼 그룹(제목) | `mg-v2-ad-details-step__form-group` | 제목 input 한 묶음 |
| 폼 그룹(설명) | `mg-v2-ad-details-step__form-group` | 설명 textarea 한 묶음 |
| 라벨 | `mg-v2-ad-details-step__label` | "제목", "설명" |
| 입력(텍스트) | `mg-v2-ad-details-step__input` | input type="text" (또는 공용 `mg-v2-input` + 스코프) |
| 입력(여러 줄) | `mg-v2-ad-details-step__textarea` | textarea (또는 `mg-v2-input mg-v2-textarea` + 스코프) |

**구조 예**  
- `mg-v2-ad-section-block`  
  - `mg-v2-ad-section-block__header` + `mg-v2-ad-section-block__title` "스케줄 세부사항"  
  - `mg-v2-ad-section-block__content`  
    - `mg-v2-ad-details-step`  
      - `mg-v2-ad-details-summary`  
        - `mg-v2-ad-details-summary__row` × 3 (상담사, 내담자, 시간)  
        - `mg-v2-ad-details-summary__row mg-v2-ad-details-summary__row--highlight` (유형)  
      - `mg-v2-ad-details-step__form-group` → `__label` + `__input` (제목)  
      - `mg-v2-ad-details-step__form-group` → `__label` + `__textarea` (설명)

---

### 2. Step 4 토큰 매핑

| 요소 | 용도 | 토큰명 |
|------|------|--------|
| 요약 카드 배경/테두리 | 카드 컨테이너 | background: `--ad-b0kla-card-bg`, border: `--ad-b0kla-border`, border-radius: `--ad-b0kla-radius-sm`, box-shadow: `--ad-b0kla-shadow` |
| 요약 라벨 | "상담사:", "내담자:" 등 | color: `--ad-b0kla-text-secondary`, font-size: 13px 수준 |
| 요약 값 | 이름/시간 텍스트 | color: `--ad-b0kla-title-color`, font-weight: 600 |
| 요약 강조 행(유형) | 상단 구분선 + 텍스트 | border-top: 1px solid `--ad-b0kla-border`; label/value 모두 color: `--ad-b0kla-green`, font-weight: 600 |
| 제목/설명 라벨 | "제목", "설명" | color: `--ad-b0kla-text-secondary` (또는 title-color), font-size: 13px, font-weight: 600 |
| input/textarea 테두리 | 기본 | border: 1px solid `--ad-b0kla-border`, background: `--ad-b0kla-card-bg`, color: `--ad-b0kla-title-color` |
| input/textarea 포커스 | 포커스 | border-color: `--ad-b0kla-green`, outline/box-shadow: `--ad-b0kla-green` 연한 톤 |
| placeholder | placeholder | color: `--ad-b0kla-placeholder` |
| 요약 카드 패딩 | 내부 여백 | `--mg-spacing-md` (16px) |
| 요약 row 간격 | 행 사이 | gap: `--mg-spacing-sm` (8px) |
| 요약–폼–폼 간격 | 세로 | `--mg-spacing-md` |
| 폼 그룹 내부 | label–input 간격 | `--mg-spacing-xs` (label 아래) |

---

### 3. Step 4 레이아웃

- **mg-v2-ad-details-step**  
  - `display: flex; flex-direction: column; gap: var(--mg-spacing-md);`

- **mg-v2-ad-details-summary**  
  - `display: flex; flex-direction: column; gap: var(--mg-spacing-sm); padding: var(--mg-spacing-md); background: var(--ad-b0kla-card-bg); border: 1px solid var(--ad-b0kla-border); border-radius: var(--ad-b0kla-radius-sm); box-shadow: var(--ad-b0kla-shadow);`

- **mg-v2-ad-details-summary__row**  
  - `display: flex; justify-content: space-between; align-items: center;`

- **mg-v2-ad-details-summary__row--highlight**  
  - `padding-top: var(--mg-spacing-sm); margin-top: var(--mg-spacing-xs); border-top: 1px solid var(--ad-b0kla-border);`

- **mg-v2-ad-details-step__form-group**  
  - `display: flex; flex-direction: column; gap: var(--mg-spacing-xs);`  
  - 제목/설명 각각 한 그룹.

- **mg-v2-ad-details-step__textarea**  
  - `min-height: 80px; resize: vertical;` (기존 textarea 스펙 유지)

---

## 체크리스트 (구현 시)

- [ ] Step 3: `mg-v2-ad-time-step`, `__form-row`, `__form-group`, `__label`, `__select` 모두 B0KlA 토큰만 사용.
- [ ] TimeSlotGrid: 모든 레거시 클래스(`time-slot-grid-*`, `mg-v2-time-slot-*` 등) 제거 후 `mg-v2-ad-ts`, `mg-v2-ad-ts__*`, `mg-v2-ad-ts-item`, `mg-v2-ad-ts-item--*` 로 1:1 교체.
- [ ] Step 4: `mg-v2-schedule-details-*` 제거 후 `mg-v2-ad-details-step`, `mg-v2-ad-details-summary`, `__row`, `__label`, `__value`, `__row--highlight`, `__form-group`, `__input`, `__textarea` 로 교체.
- [ ] 색상/간격/radius에 하드코딩 없이 위 토큰명만 사용.
- [ ] 모달이 `mg-v2-ad-b0kla` 스코프 안에 있으므로, 해당 스코프에서 위 클래스들이 위 토큰을 참조하도록 CSS 작성.

---

*문서 버전: 1.0 | 작성: 디자인 스펙 전용 (코드 없음)*
