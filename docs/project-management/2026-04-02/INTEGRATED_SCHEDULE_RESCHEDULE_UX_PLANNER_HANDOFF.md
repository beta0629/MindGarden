# 통합 일정 — 예약 시간 변경 UX 고도화 (기획 위임용)

> **목적**: 관리자가 통합 일정(매칭·스케줄) 화면에서 **예약 시간을 쉽게 바꿀 수 있는** 흐름·컴포넌트를 정의한다.  
> **위임 대상**: **core-planner** (에픽/스토리 분해, IA, 수용 기준, 디자이너·코더 배정).  
> **구현**: 스펙 확정 후 **core-coder** / 필요 시 **core-designer**. 검증은 **core-tester** 게이트.

---

## 1. 현황·문제 (개발 관찰 요약)

- **월간 FullCalendar**에서 이벤트는 `fc-event-draggable` 등으로 보이나, 실제 편집성은 **역할(`ADMIN` / `BRANCH_SUPER_ADMIN`)**·**뷰(월간 컴팩트)**·**기능 연결**에 따라 체감 난이도가 높음.
- `ScheduleCalendarView`에는 **`eventDrop`만** 연결되어 있고 **`eventResize`는 없음** → 막대 끝으로 종료 시각만 조정하는 패턴이 빠져 있음.
- 드래그 이동 시 **과거 날짜·동일 상담사 시간 충돌** 등은 프론트에서 차단; 백엔드는 `CONFIRMED`만으로 수정을 막는 구조는 아님(완료 등 다른 규칙은 별도).
- 사용자 피드백: **“예약 시간 변경이 쉽지 않다”** → **전용 UI(빠른 재예약)** 가 필요하다는 요구로 수렴.

**참고 코드 (코더 전달 시 경로)**  
- `frontend/src/components/ui/Schedule/ScheduleCalendarView.js` — 캘린더 옵션·`eventDrop` / `eventResize` 부재  
- `frontend/src/components/schedule/UnifiedScheduleComponent.js` — `handleEventDrop`, 이벤트 `editable` 규칙  
- `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js` — 통합 일정 페이지 조합  
- 상세 모달: `ScheduleDetailModal` 등 기존 수정 경로와 **중복·일원화** 여부는 기획 판단

---

## 2. 기획에서 결정할 사항 (체크리스트)

### 2.1 대상 사용자·권한

- [ ] 시간 변경 가능 역할: 본사 관리자만 / 지점 관리자 포함 / 상담사 본인 일정만 등  
- [ ] 상태별 허용: `BOOKED` / `CONFIRMED` / `IN_REVIEW` 등 (완료·취소는 제외는 공통 가정)

### 2.2 UX 패턴 (안 제시 — 기획이 선택)

- [ ] **빠른 재예약 패널**: 이벤트 클릭 → “날짜·시작·종료”를 한 화면에서 숫자/타임피커로 수정 후 저장  
- [ ] **주간·일간 뷰 기본화** 또는 “시간 편집 모드” 전환  
- [ ] **`eventResize` 도입** + 스냅(예: 30분) + 최소·최대 길이  
- [ ] 모바일: 터치 타겟·바텀시트 등 별도 패턴 여부

### 2.3 비즈니스 규칙

- [ ] 휴가·다른 예약과 겹칠 때: 즉시 거부 vs 대안 시간 제안(범위)  
- [ ] 변경 시 내담자 알림(알림톡/메일) 발송 여부  
- [ ] 감사 로그(누가 언제 변경) 필수 여부

### 2.4 API·데이터

- [ ] 기존 `PUT /api/v1/schedules/{id}`(날짜·startTime·endTime)로 충분한지, 전용 “재예약” API가 필요한지  
- [ ] ERP/회기 차감과 연동된 edge case (기획·백엔드 협의)

---

## 3. 산출물 기대 (기획 → 코더)

1. 와이어/플로우: **통합 일정**에서 “시간 변경” 진입점 1~2개로 수렴  
2. **수용 기준** (Given/When/Then) 예시 5~10개  
3. **디자인 시스템**: B0KlA·`mg-v2-ad-*` / 모달·폼 컴포넌트 재사용 지침  
4. **롤아웃**: MVP(예: 관리자만 + 모달 내 시간 필드) vs 2차(리사이즈·충돌 UI)

---

## 4. 위임 시 core-planner 프롬프트에 넣을 한 줄

> 통합 일정(`IntegratedMatchingSchedule` + `ScheduleCalendarView`)에서 예약 시간 변경이 어렵다는 피드백이 있다. `INTEGRATED_SCHEDULE_RESCHEDULE_UX_PLANNER_HANDOFF.md`를 읽고, 쉬운 재예약 UX(컴포넌트·플로·권한·상태 규칙)를 에픽으로 쪼개라. 구현은 스펙 확정 후 core-coder에 위임하고 core-tester로 검증한다.

---

## 5. 관련 문서

- `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`  
- `docs/project-management/2026-04-02/CORE_SOLUTION_ENHANCEMENT_DIRECTION_DRAFT.md` (플랫폼 고도화 초안, 별도 에픽과 링크 가능)

---

**문서 버전**: 초안  
**작성일**: 2026-04-02
