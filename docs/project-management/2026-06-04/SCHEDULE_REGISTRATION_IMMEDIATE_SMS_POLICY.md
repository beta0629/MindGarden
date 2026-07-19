# 스케줄 등록 시 D-2/D-1/당일 + TENTATIVE 즉시 SMS 발송 정책 적용 보고서

- **작성일**: 2026-06-04
- **최종 갱신**: 2026-07-19 (단발성 배치 포함 + D-1 SMS 배치 + afterCommit)
- **작성 역할**: `core-coder` (위임자: 메인 어시스턴트, 결재자: 사용자)
- **대상 브랜치**: `hotfix/schedule-immediate-notification-policy`
- **우선순위**: P1 (운영 미발송 회귀 해소)
- **SSOT**: 사용자 결재 메시지 (2026-06-04), 2026-07-19 단발성·D-1 배치 확장
- **참조 표준**: `core-solution-backend`, `core-solution-multi-tenant`, `core-solution-code-style`, `core-solution-testing`

## 1. 사용자 정책 (요구사항)

> "스케줄에 등록된 상태면 발송이 되어야 해. D-2, D-1, 당일은 스케줄에 등록이 되면 바로 발송. 알림톡은 사용 안 함, 현장결제도 예약이 취소된 게 아니면 문자 발송."

> **2026-07-19**: 단발성(`totalSessions == 1`)도 고객이므로 **예약 전 안내 SMS** 배치(D-2/D-1/D-0)에서 제외하지 않는다. 등록이 D-1이면 즉시 LATE, 실패·누락 시 09:00 D-1 배치가 백업한다.

## 2. 변경 매트릭스 (PR 후 기대 동작)

| 상황 | 발송 |
|------|------|
| **등록 시** (D-3+ / D-2 / D-1 / D-0), BOOKED/CONFIRMED/TENTATIVE(+PENDING_PAYMENT) | 단발성 → `RESERVATION_IMMEDIATE_SINGLE`. 다회기 D-2 → `RESERVATION_REMINDER_D2`. 다회기 D-1/D-0 → `RESERVATION_IMMEDIATE_LATE`. 다회기 D-3+ → 즉시 없음(배치). **트랜잭션 커밋 후(`afterCommit`) 실행** 권장·적용 |
| **09:00 D-2 배치** | 단발성 포함 → `RESERVATION_REMINDER_D2` (멱등) |
| **09:00 D-1 배치** (신규) | 단발성 포함 → `RESERVATION_IMMEDIATE_LATE` (등록 미발송·실패 백업, 멱등) |
| **09:00 D-0 배치** | 단발성 포함 → `RESERVATION_IMMEDIATE_LATE` (멱등) |
| **CANCELLED** | 미발송 |

### 2.1 등록 시점 × status 상세 (즉시 채널)

| 일정 상태 | D-2 | D-1 | 당일(D-0) | D-3 이상 |
|---|---|---|---|---|
| BOOKED / CONFIRMED 다회기 (`totalSessions >= 2`) | 즉시 SMS (`RESERVATION_REMINDER_D2`) | 즉시 SMS (`RESERVATION_IMMEDIATE_LATE`) | 즉시 SMS (`RESERVATION_IMMEDIATE_LATE`) | 즉시 없음 → 09:00 D-2/D-1/D-0 배치 |
| BOOKED / CONFIRMED 단발성 (`totalSessions == 1`) | 즉시 SMS (`RESERVATION_IMMEDIATE_SINGLE`) | 즉시 SMS (SINGLE) | 즉시 SMS (SINGLE) | 즉시 SMS (SINGLE) + **09:00 D-2/D-1/D-0 배치도 대상**(이미 보낸 템플릿+scheduleId는 `SKIPPED_DUPLICATE`) |
| **TENTATIVE_PENDING_PAYMENT 다회기** | 즉시 D2 | 즉시 LATE | 즉시 LATE | 09:00 D-2/D-1/D-0 배치 (BOOKED와 동일, SMS only) |
| **TENTATIVE_PENDING_PAYMENT 단발성** | 즉시 SINGLE | 즉시 SINGLE | 즉시 SINGLE | 즉시 SINGLE + **09:00 D-2/D-1/D-0 배치 대상** |
| CANCELLED | 발송 안 함 | 발송 안 함 | 발송 안 함 | 발송 안 함 |

> **2026-07-19 확장**:
> 1. 상담 당일 09:00 D-0 배치(`ReservationReminderD0` → `RESERVATION_IMMEDIATE_LATE`).
> 2. 내일 09:00 D-1 배치(`ReservationReminderD1` → `RESERVATION_IMMEDIATE_LATE`) — D-1 푸시와 병행 가능.
> 3. 단발성도 D-2/D-1/D-0 배치 포함 (`shouldSendForSchedule` 의 `total==1` early return 제거).
> 4. 등록 시 즉시 SMS는 `TransactionSynchronizationManager.afterCommit` 으로 지연 — `TARGET_NOT_FOUND` 재발 방지.
> BOOKED/CONFIRMED/TENTATIVE_PENDING_PAYMENT 공통. CANCELLED만 스킵. D-0 인앱/푸시는 추가하지 않음.

**채널 정책**: 알림톡 채널 영구 OFF. SMS 전용. 박도영(`schedule_id=106`, 2026-05-30) `TEMPLATE_NOT_MAPPED` 알림톡 매핑 결함 사례가 자연 해소된다.

## 3. 변경 항목 (코드)

### 3.1 `ScheduleServiceImpl.java`

- **`dispatchImmediateReservationNotification`**
  - status 가드: `BOOKED/CONFIRMED/TENTATIVE_PENDING_PAYMENT` (3종). `CANCELLED/COMPLETED/IN_PROGRESS` 제외.
  - 일자 분기:
    - `total == 1` 단발성 → `dispatchReservationImmediateSingle`
    - `daysUntil == 2L` → `dispatchReservationReminderD2`
    - `daysUntil < 2L` (D-1/D-0) → `dispatchReservationImmediateLate`
    - 그 외 (D-3 이상) → 즉시 발송 없음 (배치 처리)
  - **2026-07-19**: 활성 트랜잭션 동기화가 있으면 `afterCommit` 후 `executeImmediateReservationNotification` 실행. 없으면 동기 실행(단위 테스트·비TX 호환).
- **`createConsultantSchedule`**: TENTATIVE 시 `notifyTentativeScheduleCreated` → SMS only.
- **`notifyTentativeScheduleCreated`**: `dispatchImmediateReservationNotification` 래퍼.

### 3.2 `BatchNotificationProperties.java`

- `alimtalkEnabled` 필드. default **false**.

### 3.3 `BatchNotificationDispatchServiceImpl.java`

- 알림톡 OFF 시 SMS-only 폴백.
- **2026-07-19**: Schedule 기반 디스패치에서 **CANCELLED만** 차단. 단발성 스킵 없음. D-2는 단발성에도 `ReminderD2`.

### 3.4 `ReservationReminderScheduler.java` (2026-07-19)

- `shouldSendForSchedule` — `total == 1` early return **제거**. 매핑 없으면 skip만.
- 09:00 배치: **D-2** (`ReminderD2`) + **D-1** (`ImmediateLate`) + **D-0** (`ImmediateLate`). 단발성 포함.
- D-1 SMS는 D-1 푸시와 동일 대상일(`today+1`)에 병행. TENTATIVE는 SMS 배치에 포함, D-1 푸시는 BOOKED/CONFIRMED만(기존).

### 3.5 `application.yml` / `application-prod.yml`

- `notification.batch.alimtalk-enabled`, `kakao.alimtalk.enabled` 환경변수 default false.

## 4. 멱등 로그 + 중복 차단

`NotificationBatchSendLogRepository.existsByIdempotencyKey` 키 튜플:

```
(tenant_id, template_code, target_type, target_id, recipient_user_id)
```

- D-2 즉시 = D-2 09:00 배치 → 동일 키 → `SKIPPED_DUPLICATE`.
- D-1/D-0 즉시 LATE = D-1/D-0 09:00 배치 LATE → 동일 키 → 중복 차단.
- 단발성 등록 SINGLE 과 D-2 ReminderD2 / D-1·D-0 LATE 는 **별도 template_code** → 배치에서 ReminderD2/LATE 추가 발송 가능(정책상 ReminderD2 통일 OK).

## 5. 단위 테스트 매트릭스

`ScheduleServiceImplImmediateReservationNotificationTest` — 등록 시점 매트릭스 + afterCommit 회귀.
`ReservationReminderSchedulerTest` — 단발성 D-2/D-1/D-0, 다회기 회귀, TENTATIVE+PENDING_PAYMENT, D-1 SMS 로그 키.

## 6. 운영 영향 / 잔여 리스크

- 단발성: 등록 시 SINGLE + 이후 D-2 ReminderD2 / D-1·D-0 LATE 추가 가능 → LMS 비용·문안 중복은 의도된 리마인더.
- afterCommit: TX 없는 경로는 동기 실행 유지.
- CANCELLED만 미발송. D-0 인앱/푸시 없음.
- 변한나(schedule 203)형 TARGET_NOT_FOUND + 단발성 배치 제외 → 본 변경으로 해소 기대.

## 7. 권고 후속 작업

- TENTATIVE 전용 본문 시드.
- 단발성 전용 Reminder 본문이 필요하면 SMS_TEMPLATE 분리.
- 알림톡 채널 복구 시 가드·시드 동시 점검.
