# 카드 시각 통일 기획 (core-designer·core-coder 전달용)

**작성일**: 2025-03-14  
**목표**: 결제대기·결제확인·승인대기·활성 등 모든 상태 카드 및 매칭 섹션 카드가 기준 카드(`integrated-schedule__card` without fc-event)와 동일한 시각을 갖도록 통일

---

## 1. 현재 차이점 분석 (코드 레벨 요약)

### 1.1 기준 카드 (fc-event 없음)

- **위치**: 통합 스케줄 좌측 사이드바, `canScheduleForMapping(mapping) === false`인 카드 (예: 테스트 상담사→마음이 결제 대기)
- **클래스**: `.integrated-schedule__card` only
- **스타일 출처**: `IntegratedMatchingSchedule.css` L269~296
  - `border: 1px solid var(--mg-color-border-main)`
  - `border-radius: var(--mg-radius-lg)` (12px)
  - `padding: var(--mg-spacing-16)` (16px)
  - `min-height: 140px`
  - `::before` 좌측 4px 악센트
  - hover: `box-shadow`만 변경, `transform: none`

### 1.2 fc-event 있는 카드

- **조건**: `PAYMENT_CONFIRMED`, `DEPOSIT_PENDING`, `ACTIVE` 중 `canScheduleForMapping === true` → `integrated-schedule__card fc-event`
- **충돌**: 전역 `.fc-event` 스타일이 카드에 덮어씀
  - `ScheduleCalendar.css`: `border-radius: 4px`, `border: none`, `padding: 2px 6px`, `font-size: 0.8rem`
  - `ConsultantSchedule.css`: `:hover { transform: scale(1.02) }`
  - `ScheduleB0KlA.css`: `.mg-v2-ad-b0kla .fc-event` (페이지 컨텍스트에 따라 적용)
- **현재 대응**: `IntegratedMatchingSchedule.css` L300~312에 `.integrated-schedule__sidebar .integrated-schedule__card.fc-event`로 덮어쓰기 시도. specificity·로드 순서에 따라 여전히 차이 발생 가능.

### 1.3 매칭(mapping) 섹션 카드

- **타입별 분리**:
  - **통합 스케줄 사이드바**: `integrated-schedule__card` (MappingScheduleCard) — 위 1.1·1.2와 동일
  - **매칭 관리 목록**: `mg-v2-content-card mg-v2-mapping-card` (`admin/mapping/MappingCard.js`) — `unified-design-tokens.css` `mg-v2-mapping-card` 계열, 구조·레이아웃 상이
  - **매칭 목록 리스트**: `mg-v2-mapping-list-card` (MappingListSection) — ContentCard 기반
  - **내담자 매칭 탭**: `mg-v2-card mg-v2-mapping-card mg-v2-mapping-card__compact` (ClientMappingTab)
- **캘린더 내 이벤트**: `.mg-v2-mapping-calendar-wrapper .fc-event` — `MappingCalendarView.css` (4px radius, 2px 4px padding, 11px font). **드롭 후 칸 내 표시용**이라 사이드바 카드와 목적이 다름. 이건 "카드 통일" 범위에서 **제외** 가능 (캘린더 셀 내 컴팩트 스타일 유지).

---

## 2. 통일 범위 (파일·컴포넌트 경로)

| 구분 | 파일/컴포넌트 | 클래스/요소 |
|------|---------------|-------------|
| **통합 스케줄 사이드바** | `IntegratedMatchingSchedule.js` | `integrated-schedule__card` (± fc-event) |
| | `IntegratedMatchingSchedule.css` | `.integrated-schedule__sidebar .integrated-schedule__card` |
| | `integrated-schedule/organisms/MappingScheduleCard.js` | 래퍼 `integrated-schedule__card` |
| | `integrated-schedule/` 하위 `*.css` | StatusBadge, CardActionGroup, MappingPartiesRow 등 |
| **매칭 관리 목록** | `admin/mapping/MappingCard.js` | `mg-v2-content-card mg-v2-mapping-card` |
| | `unified-design-tokens.css` | `.mg-v2-mapping-card`, `.mg-v2-mapping-card-*` |
| **매칭 목록 섹션** | `mapping-management/organisms/MappingListSection.js` | `mg-v2-mapping-list-card` |
| | `MappingListSection.css` | `.mg-v2-mapping-list-section .mg-v2-content-card.mg-v2-mapping-card` |
| **내담자 매칭 탭** | `ClientComprehensiveManagement/ClientMappingTab.js` | `mg-v2-card mg-v2-mapping-card__compact` |
| | `ClientMappingTab.css` | `.mg-v2-mapping-client-block .mg-v2-card.mg-v2-mapping-card` |
| **fc-event 전역** | `ScheduleCalendar.css`, `ConsultantSchedule.css` | `.fc-event` |
| | `ScheduleB0KlA.css` | `.mg-v2-ad-b0kla .fc-event` |
| | `unified-design-tokens.css` | `.fc-event.fc-event-past` |
| **캘린더 내 이벤트 (선택 제외)** | `MappingCalendarView.css` | `.mg-v2-mapping-calendar-wrapper .fc-event` |

---

## 3. 수정 방향

### 3.1 시각 스펙 수렴 (a)

- **기준**: `INTEGRATED_SCHEDULE_CARD_UNIFIED_SPEC.md` / `INTEGRATED_SCHEDULE_LAYOUT_AND_CARD_SPEC.md`
- **공통 수치**: `min-height: 140px`, `padding: 16px`, `border-radius: 12px`, `border: 1px solid var(--mg-color-border-main)`, 좌측 4px 악센트 `::before`, hover 시 `box-shadow`만 변경.

### 3.2 fc-event 전역 스타일 격리 (b)

- **옵션 A**: `.integrated-schedule__sidebar .integrated-schedule__card` 및 `.integrated-schedule__sidebar .integrated-schedule__card.fc-event`에 동일 스펙 적용, specificity(0,2,0)로 전역 `.fc-event`(0,1,0) 덮어쓰기. CSS 로드 순서를 fc-event 스타일 **이후**로 두기.
- **옵션 B (권장)**: 드래그 대상에 `fc-event` 대신 `integrated-schedule__card--draggable` 사용. FullCalendar Draggable `itemSelector`를 해당 클래스로 변경. fc-event와 완전 분리.

### 3.3 매칭 카드와 동일 클래스/스타일 공유 (c)

- **방안 1**: 매칭 목록용 `MappingCard`에 `integrated-schedule__card` 계열 BEM 클래스 또는 공통 베이스 클래스 적용. 시각 스펙을 `INTEGRATED_SCHEDULE_CARD_UNIFIED_SPEC`에 맞추기.
- **방안 2**: 공통 베이스 클래스(예: `mg-v2-mapping-card-unified`)를 도입하고, `integrated-schedule__card`·`mg-v2-mapping-card`가 해당 베이스를 상속하도록 CSS 정리. 토큰 기반 스펙은 `unified-design-tokens.css` 또는 공통 모듈로 일원화.

---

## 4. Phase 분배실행 (core-designer·core-coder 전달)

| Phase | 담당 | 전달할 태스크 설명 |
|-------|------|-------------------|
| **Phase 1** | **core-designer** | 통일된 카드 시각 스펙 최종 확정. 기준: `integrated-schedule__card`. 적용 대상: integrated-schedule 사이드바 + 매칭 관리 목록 카드. 산출: (1) 1페이지 시각 스펙 요약 (border/radius/padding/min-height/::before/hover) (2) 매칭 목록 카드가 사이드바 카드와 동일하게 보이기 위한 변형 규칙(있는 경우). 참조: B0KlA, `unified-design-tokens.css`, `INTEGRATED_SCHEDULE_CARD_UNIFIED_SPEC.md`. |
| **Phase 2** | **core-coder** | Phase 1 산출물 기준으로 (1) fc-event 격리: 옵션 B(`integrated-schedule__card--draggable` + Draggable itemSelector 변경) 또는 옵션 A(specificity·로드 순서 조정) 구현 (2) integrated-schedule 사이드바 카드 시각 통일 확인 (3) 매칭 목록 카드(`MappingCard`, `MappingListSection`, `ClientMappingTab`)에 통일 스펙 적용. 대상 파일: `IntegratedMatchingSchedule.js`·`.css`, `integrated-schedule/` 하위 CSS, `MappingCard.js`, `unified-design-tokens.css`, `MappingListSection.css`, `ClientMappingTab.css`. |

---

## 5. 참조 문서

- `docs/project-management/INTEGRATED_SCHEDULE_DEBUG_REPORT.md`
- `docs/design-system/v2/INTEGRATED_SCHEDULE_LAYOUT_AND_CARD_SPEC.md`
- `docs/design-system/v2/INTEGRATED_SCHEDULE_CARD_UNIFIED_SPEC.md`
- `docs/standards/SUBAGENT_USAGE.md`
