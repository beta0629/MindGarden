# 통합 스케줄 디버그 리포트

**작성일**: 2025-03-14  
**대상 화면**: `/admin/integrated-schedule`  
**분석 범위**: 카드 디자인 불일치, 필터 클릭 시 레이아웃 깨짐

---

## 1. 관련 파일 목록

| 구분 | 경로 |
|------|------|
| 메인 페이지 | `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js` |
| 메인 스타일 | `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.css` |
| 카드 컴포넌트 | `frontend/src/components/admin/mapping-management/integrated-schedule/organisms/MappingScheduleCard.js` |
| 카드 스타일 | `integrated-schedule/` 하위 `*.css` (CardMeta, CardActionGroup, MappingPartiesRow, StatusBadge, RemainingSessionsBadge, MappingScheduleCard) |
| 드래그용 클래스 | `IntegratedMatchingSchedule.js` L338: `integrated-schedule__card` + 조건부 `fc-event` |
| 디자인 스펙 | `docs/design-system/v2/INTEGRATED_SCHEDULE_CARD_UNIFIED_SPEC.md`, `INTEGRATED_SCHEDULE_FILTER_UI_SPEC.md` |

---

## 2. 카드 디자인 불일치 (fc-event vs non-fc-event)

### 2.1 원인

- `fc-event`는 **스케줄 등록(드래그) 가능** 매칭 카드에만 붙음 (`IntegratedMatchingSchedule.js` L338).  
- 상태가 `PAYMENT_CONFIRMED`, `DEPOSIT_PENDING`, `ACTIVE`일 때 `canScheduleForMapping(mapping) === true` → `fc-event` 클래스 추가.  
- `fc-event`가 붙은 카드는 **전역 `.fc-event` 스타일**과 충돌·덮어쓰기가 발생함.

### 2.2 적용되는 스타일 (충돌 지점)

| 출처 | 셀렉터 | 내용 |
|------|--------|------|
| `IntegratedMatchingSchedule.css` | `.integrated-schedule__card` | `border: 1px solid`, `border-radius: 12px`, `padding: 16px`, `min-height: 140px` |
| `ScheduleB0KlA.css` | `.mg-v2-ad-b0kla .fc-event` | `border-radius`, `border-color: transparent` (페이지가 `mg-v2-ad-b0kla` 사용) |
| `ScheduleCalendar.css` (로드 시) | `.fc-event` | `border-radius: 4px`, `border: none`, `font-size: 0.8rem`, `padding: 2px 6px` |
| `unified-design-tokens.css` | `.fc-event.fc-event-past` | `opacity: 0.5`, `filter: grayscale(50%)` |
| `ConsultantSchedule.css` (로드 시) | `.fc-event:hover` | `transform: scale(1.02)`, `box-shadow` |

- **fc-event 있는 카드**: 위 전역 규칙이 `.integrated-schedule__card`보다 더 구체적이거나 나중에 선언되어 덮어씀 → border, radius, padding, hover 등이 달라짐.
- **fc-event 없는 카드**: `.integrated-schedule__card`만 적용 → 시각이 일관됨.

### 2.3 재현 절차

1. `/admin/integrated-schedule` 접속
2. “전체” 필터로 전환 후 여러 카드 노출
3. 드래그 가능 카드(김선희→이재학, 김선희→이혁진 등)와 불가 카드(테스트 상담사→마음이 등) 비교
4. 결과: 카드 테두리, 모서리, hover 효과 차이 확인

### 2.4 수정 방향

1. **fc-event 스타일 격리**: `.integrated-schedule__sidebar .integrated-schedule__card`에 대해 `!important` 또는更高 specificity로 카드 스펙 고정, `.fc-event` 전역 스타일이 카드에 덮어쓰지 않도록.
2. **또는** 드래그 대상에 `fc-event` 대신 전용 클래스(예: `integrated-schedule__card--draggable`) 사용하고, `Draggable` `itemSelector`를 해당 클래스로 변경.
3. **디자인 스펙 준수**: `INTEGRATED_SCHEDULE_CARD_UNIFIED_SPEC.md`의 `min-height: 140px`, `padding: 16px`, `border-radius: 12px` 등 그대로 유지.

---

## 3. 필터 “전체” 클릭 시 레이아웃 깨짐

### 3.1 증상

- `.integrated-schedule__filter`의 “전체” 라벨 클릭 시 카드 리스트뿐 아니라 캘린더까지 같이 늘어남.
- 요구: **카드 리스트만 스크롤**, 캘린더는 고정 높이 유지.

### 3.2 구조 요약

```
.integrated-schedule (height: 100%)
  └── .integrated-schedule__content (flex: 1, min-height: 0, overflow: hidden)
        ├── .integrated-schedule__sidebar (flex-shrink: 0, overflow: hidden)  ← min-height 없음
        │     ├── filter (flex-shrink: 0)
        │     └── .integrated-schedule__list (flex: 1, overflow-y: auto)
        └── .integrated-schedule__calendar-wrapper (flex: 1, min-width: 0)
```

### 3.3 추정 원인

1. **사이드바 `min-height: 0` 부재**  
   `.integrated-schedule__sidebar`에 `min-height: 0`가 없음. Flex 아이템 기본값 `min-height: auto` 때문에 콘텐츠(카드 개수)가 많아지면 사이드바 높이가 늘어나려 함.

2. **“전체” 선택 시 카드 수 증가**  
   `viewFilter === 'all'`일 때 `byView = mappings`로 모든 매칭이 표시되며, 리스트 높이가 커짐. 이로 인해 사이드바가 커지고, `__content`가 함께 늘어날 수 있음.

3. **상위 `overflow-y: auto`**  
   `DesktopLayout.css`의 `.mg-v2-desktop-layout__main`에 `overflow-y: auto`가 있어, 콘텐츠가 커지면 전체 페이지 스크롤이 생길 수 있음.

### 3.4 수정 방향

1. **사이드바에 `min-height: 0` 추가**  
   - 파일: `IntegratedMatchingSchedule.css`  
   - 대상: `.integrated-schedule__sidebar`  
   - 추가: `min-height: 0`  
   - 목적: flex에서 높이를 줄일 수 있게 해 `.integrated-schedule__list`가 고정 높이 내에서 스크롤되도록 함.

2. **리스트에 `min-height: 0` 추가**  
   - 대상: `.integrated-schedule__list`  
   - 추가: `min-height: 0`  
   - 목적: flex 자식이 내용보다 작아질 수 있게 해 `overflow-y: auto`가 실제로 스크롤을 발생시키도록 함.

3. **콘텐츠 영역 고정**  
   - `.integrated-schedule__content`는 이미 `min-height: 0`, `overflow: hidden` 적용.  
   - `.integrated-schedule`가 `height: 100%`로 부모 높이를 채우는지, 부모(예: `AdminCommonLayout`)의 메인 영역이 고정 높이인지 확인 필요.

---

## 4. 수정 체크리스트 (core-coder 전달용)

### 카드 디자인 통일

- [ ] `.integrated-schedule__sidebar .integrated-schedule__card` (또는 `.integrated-schedule__card.fc-event`)에 카드 스펙 강제 적용
  - `border`, `border-radius`, `padding`, `box-shadow`, `min-height` 등 `INTEGRATED_SCHEDULE_CARD_UNIFIED_SPEC` 기준으로 고정
- [ ] `fc-event` 전역 스타일이 카드에 영향을 주지 않도록 scope 또는 specificity 조정
- [ ] 드래그용 클래스 분리 검토 (`integrated-schedule__card--draggable` + `itemSelector` 변경)

### 레이아웃 고정

- [ ] `.integrated-schedule__sidebar`에 `min-height: 0` 추가
- [ ] `.integrated-schedule__list`에 `min-height: 0` 추가
- [ ] “전체” 필터 선택 후 리스트만 스크롤되고, 캘린더 높이는 그대로인지 확인
- [ ] 신규 매칭 / 회기 남은 매칭 / 전체 필터 모두에서 동일하게 동작하는지 확인

---

## 5. 참조 문서

- `docs/standards/ERROR_HANDLING_STANDARD.md`
- `docs/design-system/v2/INTEGRATED_SCHEDULE_CARD_UNIFIED_SPEC.md`
- `docs/design-system/v2/INTEGRATED_SCHEDULE_FILTER_UI_SPEC.md`
- `docs/project-management/INTEGRATED_SCHEDULE_CARD_ATOMIC_PLAN.md`
