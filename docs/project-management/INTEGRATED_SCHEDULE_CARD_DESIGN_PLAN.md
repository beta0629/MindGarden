# 통합 스케줄 사이드바 카드 디자인 개선 기획서

**작성일**: 2025-03-14  
**대상**: `li.integrated-schedule__card.fc-event` (예: 김선희→이재학 활성 1회 남음 등)  
**목적**: 카드 시각 일관성 확보 및 fc-event 관련 스타일 충돌 해결  
**참조**: `FC_EVENT_CARD_BORDER_DEBUG.md`, `INTEGRATED_SCHEDULE_LAYOUT_AND_CARD_SPEC.md`, `CARD_VISUAL_UNIFIED_SPEC.md`

---

## 1. 현재 카드 디자인 문제점 요약

| 구분 | 내용 |
|------|------|
| **테두리 미표시** | `canScheduleForMapping === true`인 카드(fc-event 클래스 부여)에서 border가 보이지 않음. 전역 `.fc-event` 규칙(border: none / border-color: transparent)이 IntegratedMatchingSchedule.css 오버라이드를 덮어씀. |
| **시각적 불일치** | fc-event 있는 카드 vs 없는 카드가 min-height·테두리·배경 등에서 상이하게 보임. 동일 영역 내 카드 간 일관성 부족. |
| **fc-event 전역 의존** | FullCalendar Draggable을 위해 `fc-event` 클래스를 사용 중. 여러 CSS 파일(ScheduleCalendar.css, ConsultantSchedule.css, unified-design-tokens.css, ScheduleB0KlA.css 등)에 `.fc-event` 규칙이 있어 specificity·로드 순서에 따라 예측 어려움. |
| **스타일 충돌 위험** | `.integrated-schedule__sidebar .integrated-schedule__card.fc-event` (0,3,0)이 이론상 우선해야 하나, 번들 포함된 다른 .fc-event 규칙·인라인 스타일·로드 순서로 덮어쓰기 실패 가능. |

---

## 2. 관련 파일

| 영역 | 파일 | 역할 |
|------|------|------|
| **레이아웃·카드 루트** | `IntegratedMatchingSchedule.js`, `IntegratedMatchingSchedule.css` | 사이드바 구조, 카드 li 래퍼, fc-event 조건부 부여, Draggable itemSelector |
| **카드 본문** | `MappingScheduleCard.js`, `MappingScheduleCard.css` | card-body, 내부 컴포넌트 구성 |
| **메타·배지** | `CardMeta.js`, `CardMeta.css` | StatusBadge + RemainingSessionsBadge |
| **행·버튼** | `MappingPartiesRow.js/css`, `CardActionGroup.js/css` | 상담사→내담자 표시, 스케줄 등록·결제·입금·승인 버튼 |
| **배지 원자** | `StatusBadge.js/css`, `RemainingSessionsBadge.js/css` | 상태·회기 표시 스타일 |
| **충돌 규칙** | `ScheduleB0KlA.css`, `ScheduleCalendar.css`, `unified-design-tokens.css` 등 | 전역 `.fc-event` 스타일 (캘린더·과거 이벤트 등) |

---

## 3. 해결 방향 제안 (1페이지)

### 3.1 목표

- **fc-event 유무와 관계없이** 모든 사이드바 카드가 동일한 시각(border, border-radius, padding, min-height, box-shadow, 좌측 악센트)을 가지도록 통일.
- fc-event 관련 전역 스타일 충돌을 근본적으로 제거하거나 최소화.

### 3.2 권장 방향: fc-event 분리 (옵션 B)

- **fc-event**를 사이드바 카드에서 제거하고, **`integrated-schedule__card--draggable`**로 대체.
- FullCalendar Draggable `itemSelector`를 `.integrated-schedule__card--draggable`로 변경.
- 효과: 전역 `.fc-event` 영향 완전 차단, 테두리·스타일 일관성 확보.

### 3.3 대안 방향

| 옵션 | 내용 | 비고 |
|------|------|------|
| **A. Specificity 강화** | 셀렉터에 `.integrated-schedule`, `.mg-v2-ad-b0kla` 추가, `border !important` 등으로 덮어쓰기 보장 | 빠른 수정, 근본 해결 아님 |
| **C. ScheduleB0KlA 스코프 한정** | `.mg-v2-ad-b0kla .fc .fc-event`만 캘린더 내부에 적용 (이미 `.fc`로 한정된 것으로 보임) | 사이드바는 .fc 밖이라 영향 적을 수 있으나, 다른 전역 .fc-event는 여전히 존재 |

### 3.4 통일 시각 수치 (CARD_VISUAL_UNIFIED_SPEC 기준)

- border: `1px solid var(--mg-color-border-main)`
- border-radius: `var(--mg-radius-lg)` (12px)
- padding: `var(--mg-spacing-16)` (16px)
- min-height: 140px
- box-shadow: `var(--mg-shadow-sm)`, hover: `var(--mg-card-hover-shadow)`
- 좌측 악센트: `::before` 4px, `var(--mg-color-primary-main)`, radius `12px 0 0 12px`

---

## 4. 분배실행 (역할별 실행 분배)

| Phase | 담당 | 목표 | 호출 시 전달할 태스크 설명 요약 |
|-------|------|------|--------------------------------|
| **1** | **core-coder** | fc-event 분리 및 스타일 통일 적용 | `INTEGRATED_SCHEDULE_CARD_DESIGN_PLAN.md`, `CARD_VISUAL_UNIFIED_SPEC.md` 참조. IntegratedMatchingSchedule.js: `fc-event` → `integrated-schedule__card--draggable` 변경, Draggable itemSelector `.integrated-schedule__card--draggable`로 수정. IntegratedMatchingSchedule.css: `.integrated-schedule__sidebar .integrated-schedule__card`에 통일 수치 적용, fc-event 전용 규칙 제거 또는 `--draggable`로 통합. |
| **2** | **core-designer** | (선택) 추가 시각 개선·접근성 검토 | 카드 hover·포커스, 배지·버튼 배치에 대한 디자인 검토가 필요한 경우, CARD_VISUAL_UNIFIED_SPEC과 현재 컴포넌트 구조를 바탕으로 개선 제안. |
| **3** | **core-tester** | 시각·동작 검증 | fc-event 없는 카드와 draggable 카드 시각 동일 여부, 드래그·스케줄 등록·결제·입금 버튼 동작 확인. |

**실행 순서**: Phase 1(코더) → Phase 2(필요 시) → Phase 3(검증). Phase 2·3은 Phase 1 완료 후 진행.

---

## 5. 완료 기준·체크리스트

- [ ] fc-event → integrated-schedule__card--draggable 전환 완료
- [ ] Draggable itemSelector 업데이트
- [ ] 모든 사이드바 카드에 동일 border, radius, padding, min-height, box-shadow, 좌측 악센트 적용
- [ ] 드래그 가능 카드와 불가 카드 시각적으로 구분 불가(동일 시각)
- [ ] 드래그·스케줄 등록·결제·입금·승인 동작 정상

---

**문서 버전**: 1.0
