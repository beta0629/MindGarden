# 알림 자동 발송 스케줄러 안전 기본값 표준

**문서 유형**: 운영 안전 정책 · SSOT
**버전**: 1.0.0
**최종 갱신**: 2026-05-26
**상태**: 정착 (V20260530_003 핫픽스와 함께 적용)

---

## 0. 요약

- **정책**: 알림 자동 발송 스케줄러 4종은 `system_config` 전역 행(`tenant_id = ''`) 의 명시적 `config_value='true'` 가 있을 때만 발화한다.
- **폴백 기본값**: `NotificationSchedulerFlagKeys.DEFAULT_ENABLED = false` (안전 차단).
- **시드 패턴**: 신규 스케줄러 추가 시 동일한 UPSERT 패턴(`ON DUPLICATE KEY UPDATE`)을 사용하고, `config_value` 의 초기값은 `'false'` 로 등록한다.

---

## 1. 배경 (2026-05-26 핫픽스)

2026-05-26 09:00 KST 운영에서 `wellness-tip` 자동 발송이 1건 발화함. 분석(Agent `f5c54b54`) 결과:

1. `system_config.notification.scheduler.wellness-tip.enabled` row 가 누락되었거나 운영 토글로 `'true'` 가 잔존.
2. `NotificationSchedulerFlagKeys.DEFAULT_ENABLED = true` 폴백이 row 누락 시 자동 ON 동작.
3. V20260529_003 시드는 `INSERT … WHERE NOT EXISTS` 패턴이라 운영 row 잔존 시 강제 OFF 갱신이 불가했음.

다른 3종(`reservation-reminder`, `consultation-record-alert`, `workflow-automation`)은 ENV 가드(`@ConditionalOnProperty`) 또는 다른 차단 경로로 정상 차단됨.

---

## 2. SSOT 구조

### 2.1 키 상수

`src/main/java/com/coresolution/consultation/constant/NotificationSchedulerFlagKeys.java`

```java
public static final String WELLNESS_TIP_ENABLED             = "notification.scheduler.wellness-tip.enabled";
public static final String CONSULTATION_RECORD_ALERT_ENABLED = "notification.scheduler.consultation-record-alert.enabled";
public static final String WORKFLOW_AUTOMATION_ENABLED       = "notification.scheduler.workflow-automation.enabled";
public static final String RESERVATION_REMINDER_ENABLED      = "notification.scheduler.reservation-reminder.enabled";

public static final String  CATEGORY        = "NOTIFICATION";
public static final boolean DEFAULT_ENABLED = false; // 운영 안전 기본값
```

### 2.2 DB 시드 / 안전망

| 파일 | 역할 |
|------|------|
| `V20260529_003__seed_notification_scheduler_flags.sql` | 초기 행 등록 (멱등 INSERT, 사용자 토글 보존) |
| `V20260530_003__notification_scheduler_flags_upsert.sql` | 안전망 UPSERT — 4 행 모두 `false` 강제 정렬 |

### 2.3 런타임 가드

| 스케줄러 | 파일 |
|----------|------|
| `WellnessNotificationScheduler` | 메서드 진입 시 `getGlobalBoolean(WELLNESS_TIP_ENABLED, DEFAULT_ENABLED)` 확인 |
| `ConsultationRecordAlertScheduler` | `CONSULTATION_RECORD_ALERT_ENABLED` |
| `WorkflowAutomationServiceImpl` | `WORKFLOW_AUTOMATION_ENABLED` |
| `ReservationReminderScheduler` | `RESERVATION_REMINDER_ENABLED` |

---

## 3. 신규 스케줄러 추가 시 체크리스트

신규 자동 발송 스케줄러를 추가하는 모든 PR 은 아래 항목을 반드시 만족해야 한다.

1. **키 상수 추가** — `NotificationSchedulerFlagKeys` 에 `*_ENABLED` 상수 추가 + `ALL` Set 에 포함.
2. **런타임 가드 추가** — 스케줄러 메서드 진입 시 `getGlobalBoolean(KEY, DEFAULT_ENABLED)` 확인 후 false 면 즉시 return.
3. **시드 UPSERT** — Flyway 마이그레이션에 아래 패턴으로 추가:

```sql
INSERT INTO system_config (
    tenant_id, config_key, config_value, description, category,
    is_encrypted, is_active, created_by, updated_by, created_at, updated_at
) VALUES
    ('', 'notification.scheduler.<name>.enabled', 'false',
     '<설명> ON/OFF (운영 안전 기본 false)', 'NOTIFICATION',
     false, true, 'SYSTEM', 'SYSTEM', NOW(), NOW())
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    category    = 'NOTIFICATION',
    updated_at  = NOW(),
    updated_by  = 'SYSTEM';
```

> 신규 키의 초기 `config_value` 는 항상 `'false'`. 운영 결정권자가 어드민 또는 SQL UPDATE 로 ON 한다.

4. **단위 테스트** — DB 플래그 false → 다운스트림 미호출(예: `*GuardTest`).
5. **운영 게이트 갱신** — 본 표준 §5 검증 SQL 의 키 LIKE 패턴 범위가 자동으로 새 키를 포함하므로 추가 작업 불필요.

---

## 4. 운영 토글 표준 절차

### 4.1 ON (활성화)

```sql
-- 운영 책임자 어드민 ID/이메일로 updated_by 기록.
UPDATE system_config
   SET config_value = 'true',
       updated_by   = '<admin>',
       updated_at   = NOW()
 WHERE tenant_id = ''
   AND config_key = 'notification.scheduler.<name>.enabled';
```

또는 어드민 UI `AdminNotificationSchedulerController` 통해 토글.

### 4.2 OFF (즉시 차단)

```sql
UPDATE system_config
   SET config_value = 'false',
       updated_by   = '<admin>',
       updated_at   = NOW()
 WHERE tenant_id = ''
   AND config_key = 'notification.scheduler.<name>.enabled';
```

> 변경은 즉시 반영됨 (다음 cron 발화 시 가드가 다시 조회).

---

## 5. 운영 게이트 검증 SQL

배포 직후 (또는 정기 점검) 본 SQL 의 결과는 반드시 **4 행** 이고, `config_value` 가 운영 결정값과 일치해야 한다.

```sql
SELECT config_key, config_value, is_active, updated_at, updated_by
  FROM system_config
 WHERE tenant_id = ''
   AND category  = 'NOTIFICATION'
   AND config_key LIKE 'notification.scheduler.%'
 ORDER BY config_key;
```

기대값(V20260530_003 적용 직후):

| config_key | config_value | updated_by |
|------------|--------------|------------|
| `notification.scheduler.consultation-record-alert.enabled` | `false` | `system-hotfix-20260526` |
| `notification.scheduler.reservation-reminder.enabled`       | `false` | `system-hotfix-20260526` |
| `notification.scheduler.wellness-tip.enabled`               | `false` | `system-hotfix-20260526` |
| `notification.scheduler.workflow-automation.enabled`        | `false` | `system-hotfix-20260526` |

---

## 6. 관련 문서

- `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` §5.8 (자동 발송 플래그 검증)
- `docs/standards/NOTIFICATION_SYSTEM_STANDARD.md`
- `docs/standards/BATCH_SCHEDULER_STANDARD.md`
- `src/main/resources/db/migration/V20260529_003__seed_notification_scheduler_flags.sql`
- `src/main/resources/db/migration/V20260530_003__notification_scheduler_flags_upsert.sql`

---

**문서 끝.** 정책 변경 시 본 파일과 `NotificationSchedulerFlagKeys.DEFAULT_ENABLED` JavaDoc 동시 갱신 필수.
