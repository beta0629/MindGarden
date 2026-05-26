# 알림 발송 비즈니스 룰 표준 (단회기 가드 SSOT)

**문서 유형**: 운영 비즈니스 룰 · SSOT
**버전**: 1.0.0
**최종 갱신**: 2026-05-26
**상태**: 정착 (`hotfix/single-session-welcome-block` 와 함께 적용)
**관련 문서**:
- `docs/standards/NOTIFICATION_SCHEDULER_SAFE_DEFAULT.md` (자동 발송 스케줄러 안전 기본값)
- `docs/standards/NOTIFICATION_SYSTEM_STANDARD.md` (알림 시스템 표준)

---

## 0. 요약

- **정책**: 단회기(`consultant_client_mappings.total_sessions == 1`) 신규 매핑은 **환영 메시지(`CLIENT_WELCOME_FIRST`)** 를 **모든 채널(SMS·알림톡·인앱·푸시)** 차단한다.
- **차단 위치**: `AdminServiceImpl.createMapping` 호출자 가드(옵션 A) — dispatch 호출 자체를 skip.
- **유지 항목**: 예약 안내(`RESERVATION_IMMEDIATE_SINGLE`) 는 단회기여도 정상 비즈니스 흐름이므로 **변경 없음**.
- **NULL 처리**: `total_sessions == null` 은 단회기 아님으로 간주하여 정상 발송 (안전 측 폴백).

---

## 1. 배경 (2026-05-26 핫픽스)

직전 24h 운영 실측 결과:

1. 환영 메시지(`CLIENT_WELCOME_FIRST`) **5건 전부** 단회기(`total_sessions == 1`) 신규 매핑에서 발송됨.
2. 알림톡 템플릿 매핑 누락으로 **SMS 폴백** → 사용자에게 직접 SMS 가시화 → 스팸 인지.
3. 단회기 매핑은 1회성 결제·1회 상담 흐름이라 빈도가 높으며, 매번 환영 메시지를 보내면 동일 사용자에게 누적 SMS/알림톡이 발생.

`AdminServiceImpl.createConsultantClientMapping` (실제 메서드명: `createMapping`, 라인 737~744 부근) 에서 단회기 분기 없이 `batchNotificationDispatchService.dispatchClientWelcomeFirst(...)` 를 호출하던 것이 직접적인 원인.

---

## 2. 정책

### 2.1 차단 대상 메시지 종류

| 템플릿 코드 | 단회기 차단 여부 | 비고 |
|---|---|---|
| `CLIENT_WELCOME_FIRST` | **차단** | 본 가드 — 신규 매핑 환영 메시지 |
| `RESERVATION_IMMEDIATE_SINGLE` | **유지** | 단회기 결제 시 예약 안내 (정상 비즈니스 흐름) |
| `RESERVATION_IMMEDIATE_LATE` | 유지 | D-2 미만 예약 안내 |
| `RESERVATION_REMINDER_D2` | 유지 (`total_sessions >= 2` 가 대상) | 회기제 패키지 D-2 리마인더 |
| `SESSION_ENDING_SOON` | 유지 (`total_sessions >= 3` 가 대상) | 마지막 회기 안내 |
| `SESSION_RENEW_PROMPT` | 유지 (패키지만, `total_sessions > 1`) | 회기 종료 후 갱신 안내 |

> 본 핫픽스는 **`CLIENT_WELCOME_FIRST` 한 종류만** 차단한다. 다른 메시지 종류의 단회기 차단은 별도 운영 검토 후 결정한다.

### 2.2 차단 채널 범위

**모든 채널 일괄 차단**: SMS, 알림톡, 인앱, 푸시.

호출자 가드(옵션 A) 위치에서 dispatch 호출 자체를 skip 하므로, 채널 별 분기·우선순위와 무관하게 일괄 차단된다. 향후 같은 위치에서 인앱(`consultationMessageService.sendMessage`) 또는 푸시(`mobilePushDispatchService.dispatch*`) 호출이 추가되면 **동일한 단회기 분기에 묶어** 차단해야 한다.

### 2.3 단회기 식별 기준

- 컬럼: `consultant_client_mappings.total_sessions` (`Integer`, NULL 허용).
- 식별: `total_sessions == 1` → 단회기.
- 별도 enum / `is_single_session` 플래그는 사용하지 않는다 (현재 스키마 기준).
- NULL 은 단회기 아님으로 간주 (안전 측 폴백 — 누락된 컬럼 때문에 환영 메시지가 무차별 차단되는 것을 방지).

### 2.4 차단 위치 (옵션 A · 호출자 가드)

`src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java` 의 `createMapping(ConsultantClientMappingCreateRequest dto)` 메서드 내부, `mappingRepository.save(mapping)` 직후 분기:

```java
Integer totalSessions = savedMapping.getTotalSessions();
if (totalSessions != null && totalSessions == 1) {
    log.info("📭 단회기 매핑(total_sessions=1) — CLIENT_WELCOME_FIRST 모든 채널 차단: mappingId={}, clientId={}",
        savedMapping.getId(),
        savedMapping.getClient() != null ? savedMapping.getClient().getId() : null);
} else {
    try {
        batchNotificationDispatchService.dispatchClientWelcomeFirst(savedMapping.getId());
    } catch (Exception welcomeError) {
        log.warn("CLIENT_WELCOME_FIRST 발송 실패(무시): mappingId={}, error={}",
            savedMapping.getId(), welcomeError.getMessage());
    }
}
```

> **dispatch 레이어 가드(옵션 B)** 는 채택하지 않는다 — 단회기 차단은 비즈니스 룰(스팸 방지) 이지 dispatch 멱등 가드(이미 발송된 user 재차단) 와 의미가 다르므로 호출자 레이어에서 분리한다.

---

## 3. 유지 항목 — `RESERVATION_IMMEDIATE_SINGLE`

`ScheduleServiceImpl.dispatchImmediateReservationNotification` (라인 670~714 부근) 에서 단회기 결제 직후 예약 안내(`RESERVATION_IMMEDIATE_SINGLE`) 를 발송하는 흐름은 **변경하지 않는다**:

```java
if (total != null && total == 1) {
    batchNotificationDispatchService
        .dispatchReservationImmediateSingle(schedule.getId());
} else if (daysUntil < 2) {
    batchNotificationDispatchService
        .dispatchReservationImmediateLate(schedule.getId());
}
```

**이유**:
- 예약 안내는 1회성 결제·예약을 한 사용자가 **자기 예약을 인지**하는 데 필수.
- 환영 메시지처럼 동일 user 에게 누적되지 않고, 예약 1건당 1회 발송으로 끝남.
- 사용자 결정: 환영 메시지만 차단, 예약 안내는 유지.

---

## 4. 향후 추가 가드 권고 (대기 — 별도 결정 필요)

- [ ] 단회기 매핑에서 입금 확인 후 발송되는 다른 메시지 종류(예: 입금 확인 알림) 차단 검토.
- [ ] 단회기 매핑 갱신/재활성화 시 환영 메시지 재발송 가능성 분석 (현재 `createMapping` 신규 분기만 통과하므로 영향 없음).
- [ ] 알림톡 템플릿 매핑 누락 → SMS 폴백 자동 감지·차단 게이트 (스팸 가시화 방지).

> 위 항목은 운영 검토 후 별도 위임으로 추가한다. 본 핫픽스 범위 외.

---

## 5. 운영 게이트 검증 SQL

배포 직후 24h 단회기 환영 메시지 발송 0건 확인:

```sql
-- 직전 24h 단회기 매핑에서 CLIENT_WELCOME_FIRST 발송 0건 확인.
-- 0 행이면 정책 정착 OK. 1행 이상이면 가드 미작동 → 즉시 롤백 검토.
SELECT
    n.id              AS notification_id,
    n.tenant_id,
    n.user_id,
    n.template_code,
    n.created_at,
    m.id              AS mapping_id,
    m.total_sessions
FROM notifications n
JOIN consultant_client_mappings m
  ON m.client_id = n.user_id
 AND m.tenant_id = n.tenant_id
WHERE n.template_code = 'CLIENT_WELCOME_FIRST'
  AND n.created_at >= NOW() - INTERVAL 24 HOUR
  AND m.total_sessions = 1
ORDER BY n.created_at DESC;
```

> 컬럼명·테이블명은 실제 스키마(`notifications`, `consultant_client_mappings`) 기준. 환경별 차이가 있으면 deployer 가 보정한다.

추가 운영 게이트:

- 직전 24h 신규 단회기 매핑 건수 (분모) + 환영 메시지 발송 0건 (분자) 비교.
- 같은 24h 윈도에 회기제(`total_sessions >= 2`) 매핑의 환영 메시지 발송은 평소와 동일한 수준인지 확인 (가드가 회기제까지 잘못 차단하지 않았는지).

---

## 6. 변경 이력

| 일자 | 버전 | 변경 사유 | 관련 브랜치 |
|---|---|---|---|
| 2026-05-26 | 1.0.0 | 단회기 환영 메시지 차단 정책 신설 (호출자 가드 옵션 A) | `hotfix/single-session-welcome-block` |
