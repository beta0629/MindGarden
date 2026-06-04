# 스케줄 등록 시 D-2/D-1/당일 + TENTATIVE 즉시 SMS 발송 정책 적용 보고서

- **작성일**: 2026-06-04
- **작성 역할**: `core-coder` (위임자: 메인 어시스턴트, 결재자: 사용자)
- **대상 브랜치**: `hotfix/schedule-immediate-notification-policy`
- **우선순위**: P1 (운영 미발송 회귀 해소)
- **SSOT**: 사용자 결재 메시지 (2026-06-04)
- **참조 표준**: `core-solution-backend`, `core-solution-multi-tenant`, `core-solution-code-style`, `core-solution-testing`

## 1. 사용자 정책 (요구사항)

> "스케줄에 등록된 상태면 발송이 되어야 해. D-2, D-1, 당일은 스케줄에 등록이 되면 바로 발송. 알림톡은 사용 안 함, 현장결제도 예약이 취소된 게 아니면 문자 발송."

## 2. 변경 매트릭스 (PR 후 기대 동작)

| 일정 상태 | D-2 | D-1 | 당일(D-0) | D-3 이상 |
|---|---|---|---|---|
| BOOKED / CONFIRMED 다회기 (`totalSessions >= 2`) | 즉시 SMS (`RESERVATION_REMINDER_D2`) | 즉시 SMS (`RESERVATION_IMMEDIATE_LATE`) | 즉시 SMS (`RESERVATION_IMMEDIATE_LATE`) | 09:00 D-2 배치만 (`ReservationReminderScheduler`) |
| BOOKED / CONFIRMED 단발성 (`totalSessions == 1`) | 즉시 SMS (`RESERVATION_IMMEDIATE_SINGLE`) | 즉시 SMS | 즉시 SMS | 즉시 SMS (등록 시점·D-N 무관, 기존 동작 유지) |
| **TENTATIVE_PENDING_PAYMENT 다회기** | 즉시 SMS (`RESERVATION_REMINDER_D2`) | 즉시 SMS (`RESERVATION_IMMEDIATE_LATE`) | 즉시 SMS (`RESERVATION_IMMEDIATE_LATE`) | 09:00 D-2 배치만 |
| **TENTATIVE_PENDING_PAYMENT 단발성** | 즉시 SMS (`RESERVATION_IMMEDIATE_SINGLE`) | 즉시 SMS | 즉시 SMS | 즉시 SMS |
| CANCELLED | 발송 안 함 | 발송 안 함 | 발송 안 함 | 발송 안 함 |

**채널 정책**: 알림톡 채널 영구 OFF. SMS 전용. 박도영(`schedule_id=106`, 2026-05-30) `TEMPLATE_NOT_MAPPED` 알림톡 매핑 결함 사례가 자연 해소된다.

## 3. 변경 항목 (코드)

### 3.1 `ScheduleServiceImpl.java`

- **`dispatchImmediateReservationNotification`** (L815~)
  - status 가드: `BOOKED/CONFIRMED` → **`BOOKED/CONFIRMED/TENTATIVE_PENDING_PAYMENT`** (3종)로 확장. `CANCELLED/COMPLETED/IN_PROGRESS` 는 제외 (기존 가드 유지).
  - 일자 분기:
    - `total == 1` 단발성 → `dispatchReservationImmediateSingle` (기존 유지)
    - `daysUntil == 2L` 신설 → `dispatchReservationReminderD2` (09:00 D-2 배치와 동일 본문/멱등 키 공유 → 중복 자동 차단)
    - `daysUntil < 2L` (D-1/D-0) → `dispatchReservationImmediateLate`
    - 그 외 (D-3 이상) → 즉시 발송 없음 (배치 처리)
- **`createConsultantSchedule` 두 오버로드** (L470~, L560~)
  - 기존: `if (!effectiveTentative)` 에서만 `notifyScheduleCreated` 호출 → TENTATIVE 분기 누락.
  - 변경: `else` 추가 → `notifyTentativeScheduleCreated(savedSchedule)` 호출. 회기 차감/인앱 푸시 없이 외부 SMS 채널만 멱등 발송.
- **`notifyTentativeScheduleCreated`** 신규 메서드 — `dispatchImmediateReservationNotification` 만 호출하는 얇은 래퍼. CANCELLED 가드는 내부 status 검사로 자연 처리.

### 3.2 `BatchNotificationProperties.java`

- `alimtalkEnabled` 필드 신규. default **false**. 운영 환경변수 `NOTIFICATION_BATCH_ALIMTALK_ENABLED=true` 로 일시 활성화 가능.

### 3.3 `BatchNotificationDispatchServiceImpl.java`

- `dispatchInternal` 내 알림톡 매핑 lookup 직전 게이트 추가.
  - `properties.isAlimtalkEnabled() == false` 면 `templateMappingResolver.resolveSolapiTemplateId` 호출 자체를 skip → `solapiTemplateId = null` → 기존 F1 정보성 SMS 폴백 분기 진입.
  - 멱등 로그/SMS 게이트(`smsTemplateService.isAutoDispatchEnabledFor`)·F2 마케팅 정책은 변경 없음.

### 3.4 `application.yml`

- `notification.batch.alimtalk-enabled: ${NOTIFICATION_BATCH_ALIMTALK_ENABLED:false}` 키 신설 (배치 알림 토글 섹션). yml 가시성 확보.

### 3.5 `application-prod.yml`

- `kakao.alimtalk.enabled: true` → `${KAKAO_ALIMTALK_ENABLED:false}` (환경변수 default false). `BatchNotificationProperties` 코드 가드와 병행되는 이중 안전망.
- `simulation-mode`, `api-url` 도 환경변수 바인딩 정합.

## 4. 멱등 로그 + 중복 차단 검증 (Task D)

`NotificationBatchSendLogRepository.existsByIdempotencyKey` 의 키 튜플:

```
(tenant_id, template_code, target_type, target_id, recipient_user_id)
```

- **D-2 즉시 발송** = `RESERVATION_REMINDER_D2 + SCHEDULE + scheduleId + clientId`.
- **D-2 09:00 배치** = 동일 5튜플.
- 두 발송 경로의 멱등 키가 완전히 일치하므로 어느 한 쪽이 INSERT 성공하면 다른 쪽은 사전 가드(`existsByIdempotencyKey`)로 `SKIPPED_DUPLICATE` 반환.
- D-1/D-0 즉시 발송(`RESERVATION_IMMEDIATE_LATE`) 은 별도 template_code 로 09:00 배치(`RESERVATION_REMINDER_D2`) 와 키 미충돌 → 정상 분리.
- 단발성(`RESERVATION_IMMEDIATE_SINGLE`) 도 별도 키. 기존 동작 유지.

## 5. 단위 테스트 매트릭스 (Task E)

신규: `src/test/java/com/coresolution/consultation/service/impl/ScheduleServiceImplImmediateReservationNotificationTest.java`

| 케이스 | 기대 결과 |
|---|---|
| D-2 다회기 BOOKED | `dispatchReservationReminderD2` 호출 1회, late/single 미호출 |
| D-1 다회기 BOOKED | `dispatchReservationImmediateLate` 호출 1회, d2 미호출 |
| D-0 다회기 BOOKED | `dispatchReservationImmediateLate` 호출 1회, d2 미호출 |
| D-5 다회기 BOOKED | 즉시 발송 3종 모두 미호출 (배치 위임) |
| D-5 단발성(`total==1`) BOOKED | `dispatchReservationImmediateSingle` 호출 1회 (기존 동작 유지) |
| D-2 다회기 TENTATIVE_PENDING_PAYMENT (SAME_DAY_CARD 강제) | `dispatchReservationReminderD2` 호출 1회, `scheduleCreatedNotificationHelper.notifyScheduleCreated` 미호출 (회기 차감/인앱 없음, 외부 SMS만) |

기존 확장: `BatchNotificationDispatchServiceImplTest.java`
- `setUp()` 에서 `properties.setAlimtalkEnabled(true)` 명시 — 기존 ALIMTALK_* 시나리오 보존.
- 신규 케이스 2건:
  - "알림톡 OFF — 매핑 존재해도 알림톡 시도 0건 + SMS-only 발송 (`SMS_ONLY_SENT`)"
  - "알림톡 OFF — RESERVATION_IMMEDIATE_LATE 도 SMS-only 발송"

기존 테스트 영향 검증: 32건 PASS (`mvn test -Dtest='ScheduleServiceImplImmediateReservationNotificationTest,BatchNotificationDispatchServiceImplTest,ScheduleServiceImplCreateConsultantScheduleNotificationBaselineTest'`).

## 6. 운영 점검 — 6/5 ~ 6/6 일정 7건 미발송 추적 (Task F)

### 6.1 추적 절차 (운영 DB 쿼리)

```sql
-- 6/5 ~ 6/6 일정 등록 시점 분포
SELECT s.id, s.tenant_id, s.client_id, s.consultant_id, s.date, s.start_time,
       s.status, s.created_at, m.total_sessions, m.remaining_sessions
FROM schedules s
LEFT JOIN consultant_client_mappings m ON s.mapping_id = m.id
WHERE s.date IN ('2026-06-05', '2026-06-06')
  AND s.is_deleted = FALSE
ORDER BY s.created_at;

-- 등록 시점의 SMS_TEMPLATE 가드 상태 (V20260602_001 OFF 기간 vs V20260607_007 복구)
SELECT version, script, installed_on, success
FROM flyway_schema_history
WHERE version IN ('20260602.001', '20260607.007')
ORDER BY installed_on;

-- 박도영 schedule_id=106 외 알림톡 매핑 결함 이력
SELECT id, tenant_id, template_code, target_type, target_id, recipient_user_id,
       channel_used, fallback_to_sms, success, error_code, error_message,
       sent_at
FROM notification_batch_send_log
WHERE target_type = 'SCHEDULE'
  AND target_id IN (/* 6/5~6/6 일정 id 목록 */)
ORDER BY sent_at;
```

### 6.2 결론 매트릭스 (실측 보강 필요)

| 가능성 | 진단 단서 | 본 PR 후 자연 해소 여부 |
|---|---|---|
| 등록 시점이 V20260602_001 OFF 기간 (2026-05-26 ~ 2026-06-07 V20260607_007 복구 전) | `notification_batch_send_log.error_code = TEMPLATE_NOT_MAPPED` + `is_active=FALSE` 시드 | **해소 안 됨** (시드 비활성 + `smsStaticFallbackEnabled=false` 정책은 본 PR 무관) — 시드 복구 PR 이후 등록 분만 정상화 |
| 박도영 case (알림톡 매핑 누락 `TEMPLATE_NOT_MAPPED`) | `error_code = TEMPLATE_NOT_MAPPED` + 알림톡 매핑 row 없음 | **해소** — 알림톡 시도 자체 skip 으로 SMS 폴백 직진 |
| TENTATIVE_PENDING_PAYMENT 등록 분이 `notifyScheduleCreated` 미호출 | `notification_batch_send_log` 에 시도 row 자체 없음 + schedule.status=TENTATIVE_PENDING_PAYMENT | **해소** — `notifyTentativeScheduleCreated` 신규 분기로 SMS 발송 |
| D-2 등록 분이 `daysUntil < 2` 가드에 누락 | `notification_batch_send_log` 에 시도 row 없음 + `daysUntil==2` + `total > 1` | **해소** — `daysUntil == 2L` 분기 신설로 `RESERVATION_REMINDER_D2` 즉시 발송 |

본 PR 머지 후 dev 환경에서 D-2 다회기 1건 + TENTATIVE 1건 통합 테스트 검증을 권고한다 (사용자 결재 메시지 §8 끝).

## 7. 운영 영향 / 위험

### 7.1 비용

- D-2 즉시 발송 활성화 → 평시 SMS 발송량 증가 가능. LMS 31원/건 × D-2 신규 등록 수 (1일 평균 5건 가정 시 일 약 155원, 월 약 4,650원). 09:00 D-2 배치와 멱등 키 공유로 중복 발송 0건.
- TENTATIVE_PENDING_PAYMENT 즉시 발송 → 결제 전 안내 추가 → LMS 추가 발송 분만큼 비용 증가. 본문은 `RESERVATION_IMMEDIATE_LATE / SINGLE` 그대로 사용 (별도 본문 분기는 본 PR 범위 밖).
- 알림톡 OFF 영구화 → 솔라피 알림톡 비용 0. LMS 로 일부 전환되어 비용 일부 상쇄.

### 7.2 기능

- 단위 테스트 32건 PASS 로 회귀 없음 확인.
- 박도영 사례(`TEMPLATE_NOT_MAPPED`) 등 알림톡 매핑 의존 회귀 자연 해소.
- F2 마케팅 템플릿(`SESSION_RENEW_PROMPT`) 미폴백 정책은 변경 없음.

### 7.3 게이트 (PR 본문 §5 게이트)

- `mvn test` 관련 테스트 32건 PASS — 본 PR 범위 회귀 없음.
- Jest: 프론트 영향 없음 — NO-OP.
- `npm run check:i18n-seed`: i18n 변경 없음 — NO-OP.
- `scripts/check-hardcode.sh`: 신규 한글/하드코딩 0건 — 모든 본문은 SMS_TEMPLATE 시드(SSOT) 경유.
- D11 i18n delta 0.

## 8. 운영 반영 절차 (deployer 위임 예정)

1. PR 머지 → develop / main.
2. dev 환경 자동 배포 → 통합 테스트 1건 (D-2 다회기 BOOKED 등록 → SMS 수신 확인) + TENTATIVE 1건.
3. 운영 systemd 환경변수 점검:
   - `KAKAO_ALIMTALK_ENABLED` 미설정 OK (default false 반영).
   - `NOTIFICATION_BATCH_ALIMTALK_ENABLED` 미설정 OK (default false 반영).
4. 운영 배포 후 7일 모니터링:
   - `notification_batch_send_log` 의 `channel_used = SMS` 비율이 100% 인지 확인.
   - `error_code = TEMPLATE_NOT_MAPPED` 발생 0건 확인 (알림톡 시도 자체 skip 검증).

## 9. 권고 후속 작업 (별도 PR / 별도 합의)

- TENTATIVE_PENDING_PAYMENT 전용 본문 신설 (예: `RESERVATION_TENTATIVE_AWAITING_PAYMENT`) — "결제 안내" 문안 추가. 본 PR 은 `RESERVATION_REMINDER_D2 / IMMEDIATE_LATE / IMMEDIATE_SINGLE` 본문 그대로 사용.
- 알림톡 채널 복구 시 `NOTIFICATION_BATCH_ALIMTALK_ENABLED=true` + `AlimtalkTemplateMappingResolver` 시드 정합 점검을 동시에 수행.
- `notification_batch_send_log` 의 알림톡 매핑 결함 사례(박도영 외) 일괄 백필 발송은 별도 운영 task 로 처리.

