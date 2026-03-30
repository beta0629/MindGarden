# 통합 스케줄 레이아웃·카드 스펙 (core-coder 구현용)

**대상 화면**: `/admin/integrated-schedule`  
**목적**: (1) fc-event 포함 여부와 무관한 카드 시각 통일 (2) 필터·리스트 영역 레이아웃 고정  
**참조**: `INTEGRATED_SCHEDULE_DEBUG_REPORT.md`, `INTEGRATED_SCHEDULE_CARD_UNIFIED_SPEC.md`, `PENCIL_DESIGN_GUIDE.md`

---

## 1. 카드 시각 통일 스펙

### 1.1 대상 셀렉터

```
.integrated-schedule__sidebar .integrated-schedule__card
```

- **fc-event 유무와 관계없이** 모든 카드에 동일 스타일 적용
- 사이드바 내부 카드만 대상 (캘린더 `.fc-event`와 분리)

### 1.2 최종 수치 (토큰 우선)

| 속성 | 값 | 설명 |
|------|-----|------|
| **border** | `1px solid var(--mg-color-border-main)` | 테두리. fc-event 전역 `border: none` 무효화 |
| **border-radius** | `var(--mg-radius-lg)` (12px) | fc-event `4px` 덮어쓰기 |
| **padding** | `var(--mg-spacing-16)` (16px) | fc-event `2px 4px/6px` 덮어쓰기 |
| **min-height** | `140px` | 고정 |
| **box-shadow** | `var(--mg-shadow-sm)` | `0 1px 2px rgba(0,0,0,0.05)` 등 |
| **box-shadow (hover)** | `var(--mg-card-hover-shadow)` | `0 4px 12px rgba(0,0,0,0.08)` |
| **background** | `var(--mg-bg-card, var(--mg-color-surface-main))` | fc-event 배경 덮어쓰기 방지 |
| **font-size** | `inherit` | fc-event `0.8rem`·`11px` 무효화 |
| **좌측 악센트** | `::before` 4px, `var(--mg-color-primary-main)`, radius `12px 0 0 12px` | 유지 |

### 1.3 fc-event 전역 스타일 무시 방법 (specificity/scope)

- **권장**: `.integrated-schedule__sidebar .integrated-schedule__card`로 모든 위 속성 선언 → specificity (0,2,0)로 `.fc-event`(0,1,0) 및 `.mg-v2-mapping-calendar-wrapper .fc-event`와 **스코프 분리** (캘린더는 `.mg-v2-mapping-calendar-wrapper` 내부, 카드는 `.integrated-schedule__sidebar` 내부).
- **추가**: `IntegratedMatchingSchedule.css` 로드 순서를 `ScheduleCalendar.css`, `ConsultantSchedule.css`, `unified-design-tokens.css` 등 fc-event 스타일 **이후**로 두어 덮어쓰기 보장.
- **선택(강화)**: 덮어쓰기 보장이 어렵다면 `.integrated-schedule__sidebar .integrated-schedule__card.fc-event`에 동일 값 적용. `!important`는 최소화.
- **대안(구조 변경 시)**: `fc-event` 대신 `integrated-schedule__card--draggable` 사용 + Draggable `itemSelector` 변경 → fc-event와 완전 분리.

### 1.4 hover 스펙

| 상태 | 적용 값 |
|------|---------|
| 기본 | `box-shadow: var(--mg-shadow-sm)` |
| hover | `box-shadow: var(--mg-card-hover-shadow)` (또는 `0 4px 12px rgba(0,0,0,0.08)`) |
| transition | `0.2s ease` |

- fc-event 전역 `transform: scale(1.02)` 등은 카드에 **적용하지 않음** (캘린더 이벤트 전용).

---

## 2. 레이아웃 스펙 (리스트만 스크롤)

### 2.1 상위 flex 구조

```
.integrated-schedule
  height: 100%
  display: flex
  flex-direction: column
  gap: var(--mg-spacing-24)

.integrated-schedule__content
  flex: 1
  min-height: 0          ← 유지 (필수)
  overflow: hidden       ← 유지
  display: flex
  gap: var(--mg-spacing-24)

.integrated-schedule__sidebar
  min-width: 320px
  flex-shrink: 0
  min-height: 0          ← 추가
  overflow: hidden       ← 유지
  display: flex
  flex-direction: column

.integrated-schedule__filter
  flex-shrink: 0

.integrated-schedule__list
  flex: 1
  min-height: 0          ← 추가
  overflow-y: auto       ← 유지
```

### 2.2 추가/수정할 CSS 규칙

| 대상 | 추가/수정 |
|------|-----------|
| `.integrated-schedule__sidebar` | `min-height: 0` 추가 |
| `.integrated-schedule__list` | `min-height: 0` 추가 |

### 2.3 동작 원리

- `min-height: 0`: flex 기본 `min-height: auto`로 인해 콘텐츠가 커지면 영역이 늘어나는 것을 막음.
- `__content`에 `min-height: 0` + `overflow: hidden` → 전체 콘텐츠가 viewport 높이 내로 제한.
- `__sidebar`에 `min-height: 0` → 사이드바가 `__content` 높이를 넘지 않음.
- `__list`에 `min-height: 0` + `overflow-y: auto` → 남은 높이만 차지하고 내부 스크롤 발생. **캘린더는 `__calendar-wrapper`가 `flex: 1`로 고정 영역 유지.**

---

## 3. 구현 체크리스트

### 카드 시각 통일

- [ ] `.integrated-schedule__sidebar .integrated-schedule__card`에 `border`, `border-radius`, `padding`, `min-height`, `box-shadow`, `background`, `font-size` 명시
- [ ] `:hover` 시 `box-shadow`만 변경, fc-event `transform` 미적용
- [ ] `IntegratedMatchingSchedule.css` 로드 순서 확인 (fc-event 스타일 이후)
- [ ] fc-event 있는 카드와 없는 카드 시각 동일 확인

### 레이아웃

- [ ] `.integrated-schedule__sidebar`에 `min-height: 0` 추가
- [ ] `.integrated-schedule__list`에 `min-height: 0` 추가
- [ ] “전체” 필터 선택 후 **리스트만 스크롤**, 캘린더는 고정되는지 확인
- [ ] 신규 매칭/회기 남은 매칭/전체 필터 모두 동일 동작 확인

---

**문서 버전**: 1.0  
**작성일**: 2025-03-14  
**참조**: `INTEGRATED_SCHEDULE_DEBUG_REPORT.md`, `INTEGRATED_SCHEDULE_CARD_UNIFIED_SPEC.md`, `PENCIL_DESIGN_GUIDE.md`
