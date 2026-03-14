# FC-Event 카드 테두리 미표시 디버그 리포트

**작성일**: 2025-03-14  
**대상**: 통합 스케줄 사이드바 `fc-event` 카드 테두리 이슈  
**목적**: `.fc-event` 전역 스타일과 `.integrated-schedule__sidebar .integrated-schedule__card.fc-event` 오버라이드 실패 원인 분석 및 수정 방향

---

## 1. 증상 요약

| 카드 유형 | 예시 | 증상 |
|-----------|------|------|
| **fc-event 있음** | 김선희→이재학, 김선희→이혁진 | 카드 테두리 미표시 |
| **fc-event 없음** | 테스트 상담사→마음이 | 161px 높이, 기준 카드 시각 (정상) |

- **조건**: `canScheduleForMapping(mapping) === true` → `integrated-schedule__card fc-event` 클래스 부여 (PAYMENT_CONFIRMED, DEPOSIT_PENDING, ACTIVE)
- **요구**: 모든 카드에 동일 테두리·시각 적용

---

## 2. `.fc-event` 전역 스타일 검색 결과

### 2.1 border·border-color·border-radius 정의

| 파일 | 셀렉터 | border/border-color/border-radius |
|------|--------|----------------------------------|
| **ScheduleCalendar.css** L483 | `.fc-event` | `border: none`, `border-radius: 4px` |
| **ConsultantSchedule.css** L227 | `.fc-event` | `border: none`, `border-radius: var(--border-radius-md)` |
| **ScheduleB0KlA.css** L470 | `.mg-v2-ad-b0kla .fc-event` | `border-color: transparent`, `border-radius: var(--ad-b0kla-radius-sm)` |
| **unified-design-tokens.css** L15126 | `.fc-event.fc-event-past` | (border 없음, opacity/grayscale만) |
| **ScheduleCalendarView.css** L9 | `.mg-v2-schedule-calendar-view .fc-event` | `border: none !important` (캘린더 내부만) |
| **MappingCalendarView.css** L46 | `.mg-v2-mapping-calendar-wrapper .fc-event` | `border-radius: 4px` (캘린더 내부만) |
| **ConsultationLogCalendarBlock.css** L50 | `.mg-v2-consultation-log-calendar-wrapper .fc-event` | `border-color: transparent` |

### 2.2 통합 스케줄 페이지 로드되는 CSS

- **IntegratedMatchingSchedule.js**: `unified-design-tokens.css`, `AdminDashboardB0KlA.css`, `IntegratedMatchingSchedule.css`
- **UnifiedScheduleComponent** (우측 캘린더): `AdminDashboardB0KlA.css`, `ScheduleB0KlA.css`
- **ScheduleCalendarView**: `ScheduleCalendarView.css`

**중요**: 통합 스케줄 페이지는 `AdminCommonLayout` → `mg-v2-ad-b0kla` 래퍼 내부.  
따라서 **`.mg-v2-ad-b0kla .fc-event` (ScheduleB0KlA.css)** 가 사이드바 카드에도 적용됨.

- `ScheduleCalendar.css`, `ConsultantSchedule.css`는 `ScheduleCalendar.js`, `ConsultantSchedule.js`에서 로드되며, 통합 스케줄 화면에서는 **직접 import되지 않음** (다른 경로로 번들에 포함될 수 있음).

---

## 3. specificity·로드 순서 분석

### 3.1 현재 오버라이드 규칙

**IntegratedMatchingSchedule.css** L304~313:

```css
.integrated-schedule__sidebar .integrated-schedule__card.fc-event {
  border: 1px solid var(--mg-color-border-main);
  border-radius: var(--mg-radius-lg);
  padding: var(--mg-spacing-16);
  min-height: 140px;
  box-shadow: var(--mg-shadow-sm);
  background: var(--mg-bg-card, var(--mg-color-surface-main));
  font-size: inherit;
}
```

- **Specificity**: (0, 3, 0) — 클래스 3개

### 3.2 충돌 규칙과 specificity

| 규칙 | Specificity | 적용 여부 (사이드바 카드) |
|------|-------------|---------------------------|
| `.integrated-schedule__sidebar .integrated-schedule__card.fc-event` | (0,3,0) | ✅ 적용 대상 |
| `.mg-v2-ad-b0kla .fc-event` | (0,2,0) | ✅ 적용 (부모가 mg-v2-ad-b0kla) |
| `.fc-event` (전역) | (0,1,0) | ✅ 적용 |

이론상 `.integrated-schedule__sidebar .integrated-schedule__card.fc-event` (0,3,0)이 `.mg-v2-ad-b0kla .fc-event` (0,2,0)보다 구체적이므로 **오버라이드가 되어야 함**.

### 3.3 덮어쓰기 실패 가능 원인

1. **로드 순서**:  
   `ScheduleB0KlA.css`는 `UnifiedScheduleComponent`에서 로드. `IntegratedMatchingSchedule.css`와의 로드 순서에 따라, `ScheduleB0KlA.css`가 **나중**에 로드되면 동일 specificity 내에서 **나중 규칙이 우선**할 수 없음 (specificity가 낮으므로).  
   → **가능성 낮음** (0,3,0) > (0,2,0).

2. **`border-color: transparent`**:  
   `ScheduleB0KlA.css`의 `.mg-v2-ad-b0kla .fc-event`는 `border-color: transparent`만 설정.  
   `border` shorthand와 `border-color`는 **별도 속성**.  
   오버라이드 규칙에서 `border: 1px solid var(--mg-color-border-main)`를 주면, `border-color`도 암묵적으로 설정됨.  
   만약 **FullCalendar 기본 CSS** 또는 **인라인 스타일**에서 `border-color`/`border`를 덮어쓰면 테두리가 사라질 수 있음.

3. **FullCalendar 기본 CSS**:  
   `@fullcalendar/core` 등에서 `.fc-event`에 `border`, `border-color`를 주는 경우, 번들/로드 순서에 따라 나중에 적용될 수 있음.

4. **부모 컨텍스트 미포함**:  
   오버라이드 셀렉터가 `.integrated-schedule` 또는 `.mg-v2-ad-b0kla`를 포함하지 않아, 다른 B0KlA/전역 규칙과 같은 계층에서 경쟁할 때 예측이 어려울 수 있음.

---

## 4. 수정 방향 (core-coder용)

### 4.1 옵션 A: Specificity·scope 강화 (권장, 빠른 수정)

**파일**: `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.css`

**변경**:
- 셀렉터에 상위 컨텍스트 추가 → `.integrated-schedule .integrated-schedule__sidebar .integrated-schedule__card.fc-event`  
  또는 `.mg-v2-ad-b0kla .integrated-schedule__sidebar .integrated-schedule__card.fc-event`
- `border` 관련만 확실히 덮으려면 `border-color`를 명시:
  - `border: 1px solid var(--mg-color-border-main);`
  - `border-color: var(--mg-color-border-main);` (필요 시 추가)

```css
/* fc-event 카드: 전역 .fc-event 스타일 확실히 덮어쓰기 */
.integrated-schedule .integrated-schedule__sidebar .integrated-schedule__card.fc-event,
.mg-v2-ad-b0kla .integrated-schedule__sidebar .integrated-schedule__card.fc-event {
  border: 1px solid var(--mg-color-border-main) !important; /* 최소 !important */
  border-color: var(--mg-color-border-main);
  border-radius: var(--mg-radius-lg);
  /* ... 기타 속성 동일 */
}
```

- `!important`는 `border`에만 한정하고, 다른 속성은 specificity로 처리하는 것을 권장.

### 4.2 옵션 B: fc-event 완전 분리 (근본 해결, 권장)

- `fc-event` 대신 `integrated-schedule__card--draggable` 사용.
- **IntegratedMatchingSchedule.js** L338: `className`에서 `fc-event` → `integrated-schedule__card--draggable`로 변경.
- **IntegratedMatchingSchedule.js** L133: Draggable `itemSelector`를 `.integrated-schedule__card--draggable`로 변경.
- FullCalendar `fc-event`와 완전 분리 → 전역 `.fc-event` 영향 제거.

### 4.3 옵션 C: ScheduleB0KlA.css 스코프 한정

- `ScheduleB0KlA.css`의 `.mg-v2-ad-b0kla .fc-event` 규칙을 **캘린더 내부만** 적용되도록 수정:
  - 예: `.mg-v2-ad-b0kla .mg-v2-schedule-calendar-view .fc-event` 또는 `.mg-v2-ad-b0kla .fc .fc-event`
- 사이드바 카드는 `.mg-v2-schedule-calendar-view` 바깥에 있으므로 해당 규칙의 영향을 받지 않게 됨.

---

## 5. core-coder용 체크리스트

- [ ] `IntegratedMatchingSchedule.css`에서 `.integrated-schedule__sidebar .integrated-schedule__card.fc-event` 셀렉터에 `border`·`border-color` 명시 및 specificity 강화 (옵션 A)
- [ ] 또는 옵션 B: `fc-event` → `integrated-schedule__card--draggable` 전환, `itemSelector` 변경
- [ ] 또는 옵션 C: `ScheduleB0KlA.css`의 `.mg-v2-ad-b0kla .fc-event`를 캘린더 내부로 스코프 제한
- [ ] 수정 후 fc-event 카드(김선희→이재학 등)에 테두리 표시 확인
- [ ] fc-event 없는 카드(테스트 상담사→마음이)와 시각 일치 확인
- [ ] 드래그 동작 정상 확인 (옵션 B 적용 시)

---

## 6. 참조 문서

- `INTEGRATED_SCHEDULE_DEBUG_REPORT.md`
- `CARD_VISUAL_CONSISTENCY_PLAN.md`
- `docs/design-system/v2/INTEGRATED_SCHEDULE_LAYOUT_AND_CARD_SPEC.md`
- `docs/design-system/v2/CARD_VISUAL_UNIFIED_SPEC.md`
