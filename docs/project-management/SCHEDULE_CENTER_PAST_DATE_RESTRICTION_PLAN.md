# 스케줄 센터 과거 날짜 예약 제한 기획

> **목표**: 스케줄 드래그로 예약 생성/변경 시 **과거 날짜(오늘 이전)** 로의 드롭·변경을 막고, 사용자 안내 및 API 검증을 적용한다.  
> **적용**: core-solution 프레임워크. 코드 수정은 core-coder에 위임.

---

## 1. 요구·배경

- 스케줄 센터에서 매칭 카드를 캘린더에 드래그하면 예약 생성 모달이 열리고, 기존 스케줄을 드래그하면 일정이 이동(수정)된다.
- **과거 날짜에는 예약을 생성·변경할 수 없도록** 제한해야 한다.
- 요청 사항: (1) 드래그 시 과거 날짜 드롭/변경 차단, (2) UI에서 "과거 날짜에는 예약할 수 없습니다" 등 안내, (3) 백엔드에서 시작일 과거 시 400 거부 및 메시지 반환.

---

## 2. 범위

| 포함 | 제외 |
|------|------|
| 매칭 카드 → 캘린더 드롭 시 예약 생성 흐름(과거 날짜 시 모달 미오픈 + 안내) | 다른 도메인(학원 시간표 등) |
| 기존 스케줄 이벤트 드래그 이동 시 과거로 이동 차단(일부 경로에만 적용된 상태 정리) | |
| 예약 생성 API POST /api/v1/schedules/consultant 의 과거 날짜 검증 | |
| 예약 수정 API PUT /api/v1/schedules/{id} 의 날짜/시간 변경 시 과거 날짜 검증 | |

**영향 컴포넌트·API**

- **프론트**: `IntegratedMatchingSchedule.js`(매칭 카드 드롭 → 예약 생성), `UnifiedScheduleComponent.js`(이벤트 드래그 이동 — 이미 과거 검증 있음), `ScheduleCalendar.js`(이벤트 드롭 — 과거 검증 없음, ClientSchedule 등에서 사용)
- **백엔드**: `ScheduleController.java` — POST `/consultant`, PUT `/{id}`

---

## 3. 검증 전략: 프론트 + 백엔드 둘 다

| 레이어 | 역할 | 이유 |
|--------|------|------|
| **프론트** | 드롭/이동 시점에 과거면 진행 차단 + 토스트 안내 | 즉시 피드백, 불필요한 API 호출 방지 |
| **백엔드** | 생성/수정 API에서 시작일이 오늘 이전이면 400 + 메시지 | 보안·일관성(직접 API 호출 등 회피 방지) |

과거 기준: **날짜만 비교, 자정(00:00:00) 기준**. "오늘"은 서버/클라이언트 각각 LocalDate.now() / new Date() 자정 기준으로 판단.

---

## 4. 코드 위치 요약 (수정 대상)

### 4.1 프론트엔드

| 파일 | 역할 | 현재 상태 | 수정 내용 |
|------|------|-----------|-----------|
| `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js` | 매칭 카드 캘린더 드롭 → `handleDropFromExternal(date, payload)` 호출 후 모달 오픈 | 과거 날짜 검증 없음 | `date`가 오늘 이전이면 `notificationManager.warning('과거 날짜에는 예약할 수 없습니다.');` 후 return, 모달 미오픈 |
| `frontend/src/components/schedule/UnifiedScheduleComponent.js` | 이벤트 드래그 이동 → `handleEventDrop` | **이미 과거 검증 있음**(739–758행) | 변경 없음(참고용) |
| `frontend/src/components/schedule/ScheduleCalendar.js` | 이벤트 드롭 → `handleEventDrop` → PUT 스케줄 수정 | 과거 검증 없음 | `handleEventDrop` 내에서 드롭 날짜가 오늘 이전이면 revert + 경고 토스트 후 return |

### 4.2 백엔드

| 파일 | API | 수정 내용 |
|------|-----|-----------|
| `src/main/java/com/coresolution/consultation/controller/ScheduleController.java` | POST `/consultant` (createConsultantSchedule) | `LocalDate date` 파싱 후 `date.isBefore(LocalDate.now())` 이면 400 + "과거 날짜에는 예약할 수 없습니다." (또는 동일 의미 메시지) |
| 동일 | PUT `/{id}` (updateSchedule) | `updateData`에 `date`가 있을 때, 변경 후 날짜가 `LocalDate.now()` 이전이면 400 + 동일 메시지 |

---

## 5. 의존성·순서

- 프론트 2곳(IntegratedMatchingSchedule, ScheduleCalendar)과 백엔드 2곳(POST/PUT)은 **서로 의존 없음**. **병렬 구현 가능**.
- 권장: 프론트와 백엔드를 동시에 진행하고, 마지막에 통합 확인.

---

## 6. Phase 목록 및 분배실행

| Phase | 담당 | 목표 | 호출 시 전달할 태스크 설명 초안 |
|-------|------|------|----------------------------------|
| **Phase 1** | **core-coder** | 프론트: 매칭 카드 과거 드롭 차단 + ScheduleCalendar 과거 이동 차단 | 아래 [Phase 1 전달문] 참조 |
| **Phase 2** | **core-coder** | 백엔드: 예약 생성/수정 API 과거 날짜 400 검증 | 아래 [Phase 2 전달문] 참조 |

**병렬**: Phase 1과 Phase 2는 동시에 진행 가능.

---

### [Phase 1 전달문] — core-coder (프론트엔드)

- **참조 문서**: `docs/project-management/SCHEDULE_CENTER_PAST_DATE_RESTRICTION_PLAN.md` §2–§4.
- **작업 내용**:
  1. **IntegratedMatchingSchedule.js**  
     `handleDropFromExternal(date, mappingPayload)` 내에서, `date`(Date 또는 변환 가능한 값)가 **오늘 자정 이전**이면  
     - `notificationManager.warning('과거 날짜에는 예약할 수 없습니다.');` 호출 후  
     - **return** (모달 열지 않음).  
     날짜 비교는 자정 기준(같은 날짜는 허용, 그 이전만 차단).
  2. **ScheduleCalendar.js**  
     `handleEventDrop(info)` 내에서, 드롭된 `event.start`의 **날짜**가 오늘 자정 이전이면  
     - `info.revert();`  
     - `notificationManager.warning('과거 날짜에는 예약할 수 없습니다.');` (또는 "과거 날짜로는 스케줄을 이동할 수 없습니다.")  
     - **return**.  
     참고: `UnifiedScheduleComponent.js` 739–758행에 동일한 과거 검증 로직이 있으므로 같은 기준(자정 기준 날짜 비교)으로 맞출 것.
- **표준**: `/core-solution-frontend`, `/core-solution-code-style`. 기존 `notificationManager` 사용 방식 유지.

---

### [Phase 2 전달문] — core-coder (백엔드)

- **참조 문서**: `docs/project-management/SCHEDULE_CENTER_PAST_DATE_RESTRICTION_PLAN.md` §2–§4.
- **작업 내용**:
  1. **ScheduleController.java** — **POST** `/consultant` (createConsultantSchedule)  
     - `LocalDate date = LocalDate.parse(request.getDate());` 이후  
     - `if (date.isBefore(LocalDate.now()))` 이면  
       - `ResponseEntity.badRequest().body(ApiResponse.error("과거 날짜에는 예약할 수 없습니다."));` 반환 (또는 프로젝트 표준에 맞는 400 + 메시지 방식).
  2. **ScheduleController.java** — **PUT** `/{id}` (updateSchedule)  
     - `updateData`에 `date`가 있을 때, 파싱한 새 `LocalDate`가 `LocalDate.now()` 이전이면  
       - 동일하게 400 + "과거 날짜에는 예약할 수 없습니다." 반환.  
     - `date`가 없고 startTime/endTime만 변경하는 경우는 기존 스케줄의 date 기준으로, “시작일”이 오늘 이전으로 바뀌는지만 필요 시 검증(요구사항상 “시작일이 과거”이면 거부하면 됨).
- **표준**: `/core-solution-backend`. tenantId·권한 등 기존 로직 유지.

---

## 7. 완료 기준·체크리스트

- [x] IntegratedMatchingSchedule: 매칭 카드를 과거 날짜에 드롭 시 모달이 열리지 않고 "과거 날짜에는 예약할 수 없습니다." 토스트 노출.
- [x] ScheduleCalendar: 기존 스케줄을 과거 날짜로 드래그 시 이동 취소(revert) 후 동일(또는 유사) 경고 메시지 노출.
- [x] POST /api/v1/schedules/consultant: body의 date가 오늘 이전이면 400 + 메시지 반환.
- [x] PUT /api/v1/schedules/{id}: body의 date가 오늘 이전으로 변경되면 400 + 메시지 반환.
- [x] UnifiedScheduleComponent의 기존 과거 검증 동작 유지(회귀 없음).

---

## 8. 리스크·제약

- 타임존: 서버는 `LocalDate.now()`, 클라이언트는 `new Date()` 자정 기준. 운영 환경이 KST로 통일되어 있다고 가정. 필요 시 서버에서 타임존 명시 가능.
- "오늘"은 포함·과거만 차단하는 것으로 기획함. 당일 예약은 허용.

---

**문서 위치**: `docs/project-management/SCHEDULE_CENTER_PAST_DATE_RESTRICTION_PLAN.md`
