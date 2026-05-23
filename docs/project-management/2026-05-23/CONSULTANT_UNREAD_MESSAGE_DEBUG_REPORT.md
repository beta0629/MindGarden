# 상담사 KPI "안읽은 메시지" 갱신 실패 — 디버그 진단 보고서

- 작성일: 2026-05-23 22:35 KST
- 작성자: core-debugger 서브에이전트
- 분류: 운영 환경 결함 분석 (읽기 전용, 코드 미수정)
- 범위: GNB `NotificationDropdown` "모두 읽음" 클릭 → KPI `unreadMessages` 미감소

---

## §1 요약

### 결론

1차 추정(메인 어시스턴트) **확정**. 백엔드 DB 갱신이 1회 클릭당 정확히 **`LIST_SIZE = 10`건만** 일어나는 것이 운영 access log·DB SELECT로 100% 입증됨.

- **근본 원인 1 (D1-1, HIGH)**: `ConsultationMessageController`에 **일괄 markAllAsRead 엔드포인트가 부재**. `mark-all-read` / `read-all` 패턴 grep 결과 ConsultationMessage 계열에는 0건 (SystemNotification에는 존재).
- **근본 원인 2 (D1-2, HIGH)**: 프론트 `NotificationDropdown.handleMarkAllRead`가 백엔드 엔드포인트가 없으므로, `messageList`에 로딩된 **상위 `LIST_SIZE = 10`건만** `GET /{messageId}/read` 개별 호출. `messageList`는 `fetchMessages()`에서 `{ page: 0, size: 10 }`로 로딩됨.
- **운영 검증**: 김선희 상담사(`userId=3`, `tenant-incheon-counseling-001`) 미읽음 수신 메시지 = **273건**, 22:21:11 "모두 읽음" 1회 클릭 → **정확히 10건(ID 1110~1119, 모두 SYSTEM 발신, receiver_id=3)만 `read_at`이 기록됨** → 미읽음 273 → 263 으로만 감소.

### 권고 fix 트랙 (P1)

- **D1 (P1, 핫픽스)**: 백엔드 `POST /api/v1/consultation-messages/mark-all-read` 신설 + Repository `@Modifying @Query` UPDATE 메서드 추가 + 프론트 `handleMarkAllRead`를 단일 호출로 치환. 예상 LOC: 80~120.

상세 케이스 매트릭스·핫픽스 의사코드는 §6·§7 참고.

---

## §2 백엔드 코드 진단

### §2.1 `ConsultationMessageController` (전체 엔드포인트 인벤토리)

`src/main/java/com/coresolution/consultation/controller/ConsultationMessageController.java`

| HTTP | 경로 | 메서드 | 설명 | 권한 |
|---|---|---|---|---|
| GET | `/api/v1/consultation-messages/all` | `getAllMessages` | 전체 (관리자) | `MESSAGE_MANAGE` 필수 |
| GET | `/consultant/{consultantId}` | `getConsultantMessages` | 상담사 송수신 통합 목록 | 세션 검사 |
| GET | `/client/{clientId}` | `getClientMessages` | 내담자 수신 목록 | 본인 / 관리자 / API 권한 |
| GET | `/{messageId}` | `getMessage` | 상세 조회 + 자동 markAsRead | 수신자 본인 또는 발신자 또는 `MESSAGE_MANAGE` |
| GET | `/{messageId}/read` | `markAsRead` | **개별** 읽음 처리 | 수신자 본인 또는 `MESSAGE_MANAGE` |
| POST | `` | `sendMessage` | 발송 | — |
| POST | `/{messageId}/reply` | `replyToMessage` | 답장 | — |
| DELETE | `/{messageId}` | `deleteMessage` | 삭제 | — |
| PUT | `/{messageId}/archive` | `archiveMessage` | 아카이브 | — |
| GET | `/unread-count?userId=&userType=` | `getUnreadCount` | 미읽음 수 | 본인만 (sessionUserId == paramUserId) |

**핵심 결함**: **일괄 markAllAsRead 엔드포인트 부재** (Grep `mark-all|read-all|markAllAsRead` → ConsultationMessage 계열 0건).

비교 — `SystemNotificationController`는 `POST /api/v1/system-notifications/read-all` 보유 (L324).

### §2.2 `ConsultationMessageServiceImpl`

- `markAsRead(Long messageId)` (L242~256)
  - 클래스 레벨 `@Transactional` + 메서드 레벨 `@Transactional` (이중) → 트랜잭션 정상.
  - `findActiveById` (`isDeleted=false` 필터) 후 `message.markAsRead()` → `update(tenantId, message)`.
  - `TenantContextHolder.getRequiredTenantId()` 사용 → tenantId 컨텍스트 누락 시 즉시 throw (D2-2 차단).
- `getUnreadCount(Long userId, String userType)` (L283~294)
  - `consultationMessageRepository.countByTenantIdAndReceiverIdAndIsReadFalse(tenantId, userId)` — **receiver_id 기준만** (송수신 통합 아님).

### §2.3 `ConsultationMessageRepository`

`src/main/java/com/coresolution/consultation/repository/ConsultationMessageRepository.java`

- `@Modifying` UPDATE 메서드 **0건** (다른 Repository는 보유).
- `countByTenantIdAndReceiverIdAndIsReadFalse(tenantId, receiverId)` (L117~119) — KPI source.
- `findByTenantIdAndReceiverIdOrSenderId` (L69~77) — `/consultant/{id}` 가 사용 → **송수신 통합** (D1-3 위험).
- `findByTenantIdAndClientIdAndConsultantIdAndStatusAndIsReadAndIsImportantAndIsUrgent` — `/client/{id}` 가 사용 → **수신자 기준만**.

### §2.4 `ConsultationMessage` 엔티티

- `is_read`, `read_at`, `receiver_id`, `is_deleted` 필드 정상 매핑 (TINYINT/BOOLEAN, 트리거 없음 — D2-4 차단).
- `markAsRead()` 비즈니스 메서드 (L133~137): `isRead=true`, `readAt=now`, `status="READ"`.

### §2.5 권한 체크

- `isMessageReceiver` (L60~65): `user.id == message.receiverId` 이면 권한 통과 (MESSAGE_MANAGE 불필요).
- `markAsRead` 엔드포인트(L463~504): `hasManage || isReceiver` 모두 false → 403, **silent catch 가능** (D1-4).
- 김선희(상담사)는 본인 수신 메시지(receiverId=3)에 대해 정상 200 응답이 확인됨 (운영 access log 13건 모두 200).

---

## §3 프론트엔드 코드 진단

### §3.1 `NotificationDropdown.handleMarkAllRead`

`frontend/src/components/dashboard-v2/molecules/NotificationDropdown.js`

```141:161:frontend/src/components/dashboard-v2/molecules/NotificationDropdown.js
  const handleMarkAllRead = async() => {
    try {
      if ((unreadSystemCount || 0) > 0) {
        await markAllSystemNotificationsAsRead();
      }
      const unreadMessages = messageList.filter((m) => !m.isRead);
      for (const m of unreadMessages) {
        try {
          await markMessageAsRead(m.id);
        } catch {
          // 개별 실패 시 무시
        }
      }
      refreshNotifications();
      await loadUnreadCount();
      ...
```

- `messageList`는 `fetchMessages()`에서 `{ page: 0, size: LIST_SIZE }` 로 로딩 (L128).
- `LIST_SIZE = 10` (L34, 동일 파일 상단 상수).
- **시스템 공지는 백엔드 일괄 API (`POST /system-notifications/read-all`)를 사용해 한 방에 처리**되지만, **메시지는 messageList 상위 10건만 개별 처리** → 본 결함.
- 개별 호출 실패 시 `catch {}` silent — 권한 거부·삭제된 메시지가 섞여도 사용자/콘솔에 알림 없음.

### §3.2 `fetchMessages` (L120~139)

- `getConsultationMessagesListPath(user)` 헬퍼 결과 사용.
- 상담사: `/api/v1/consultation-messages/consultant/{user.id}?page=0&size=10` — 백엔드 `findByTenantIdAndReceiverIdOrSenderId` 사용 → **수신자 또는 발신자**. 발신자 메시지(receiverId ≠ user.id)도 섞일 수 있음.
- 그 경우 해당 메시지의 markAsRead는 403 (`isReceiver=false`) → silent catch.

### §3.3 `NotificationContext.markMessageAsRead`

`frontend/src/contexts/NotificationContext.js` L221~231

- `apiGet('/api/v1/consultation-messages/{messageId}/read')` — 200/오류 모두 catch만, 사용자 알림 없음.
- 성공 시 `loadUnreadMessageCount()` 재호출 → KPI는 갱신되지만, **처리된 건수가 10건뿐이라 사용자 입장에서는 변동이 작음**.

### §3.4 KPI Store (`ConsultantDashboardV2.js`)

`frontend/src/components/dashboard-v2/consultant/ConsultantDashboardV2.js`

- L223~235: `unreadMessages = stats.unreadMessages ?? 0`, 이후 `GET /unread-count?userId=&userType=CONSULTANT&_t=Date.now()` 호출로 덮어씀.
- L700~706: KPI 카드 렌더링 (`dashboardData.stats.unreadMessages`).
- 캐싱 방지 `_t` 타임스탬프 사용 (D3-2 차단).
- 페이지 mount 시·refresh 시 fetch — F5 후에도 273+로 유지되는 이유는 **백엔드 DB 자체가 안 바뀌었기 때문** (운영 DB 검증 결과 일치).

### §3.5 `getConsultationMessagesListPath`

`frontend/src/utils/consultationMessagesApi.js`

- 상담사 → `/consultant/{id}` (송수신 통합).
- 내담자 → `/client/{id}` (수신 전용).
- 관리자 → `/all` (MESSAGE_MANAGE 필수).

---

## §4 운영 DB 검증 결과 (읽기 전용 SELECT)

### §4.1 환경

- 호스트: `beta74.cafe24.com` (운영, blue/green 둘 다 active, 트래픽: 8080)
- DB: localhost:3306 / `core_solution` (MySQL 8.0.43)
- 시각: 2026-05-23 22:31~22:34 KST

### §4.2 미읽음 상위 receiver

| tenant_id | receiver_id | unread_cnt | role | name |
|---|---|---:|---|---|
| `tenant-incheon-counseling-001` | **3** | **273** | CONSULTANT | **김선희** |
| `tenant-incheon-counseling-001` | 8 | 101 | CLIENT | 모서형 |
| `tenant-incheon-counseling-001` | 16 | 91 | CLIENT | 박수경 |
| (이하 생략) | | | | |

**김선희 = 사용자 보고 상담사로 추정** (보고 294 ≒ DB 273, 22:21:11 클릭으로 10건 처리 후 + 그 외 일부 변동).

### §4.3 김선희 미읽음 분포

| 지표 | 값 |
|---|---:|
| 수신자(receiver_id=3) 미읽음 | 273 |
| 본인이 보낸(sender_id=3) 미읽음 (상대방이 안 읽음) | 5 |
| consultant_id=3 미읽음 (송수신 통합) | **865** |
| 최근 30분 read_at 처리 건수 (receiver_id=3) | **10** |

### §4.4 receiver_id=3 미읽음 273건의 sender_type 분포

| sender_type | cnt |
|---|---:|
| SYSTEM | **263** |
| CLIENT | 6 |
| 심리상담 내담자 역할 | 2 |
| 심리상담 상담사 역할 | 2 |

**263/273 = 96.3%가 SYSTEM 발신**. KPI "안읽은 메시지"는 실제로 시스템 자동 알림(예약/결제/스케줄 등) 누적이 대부분.

**데이터 품질 경고**: `sender_type`에 한글 값("심리상담 내담자 역할", "심리상담 상담사 역할") 4건이 혼입 — 별도 정합성 점검 필요 (본 결함과 직접 연관 없음).

### §4.5 22:21:11 처리된 10건 상세 (운영 로그 + DB)

```
id    sender_id  receiver_id  is_read  read_at                       sender_type
1119  0          3            1        2026-05-23 22:21:11.333506    SYSTEM
1118  0          3            1        2026-05-23 22:21:11.387539    SYSTEM
1117  0          3            1        2026-05-23 22:21:11.439458    SYSTEM
1116  0          3            1        2026-05-23 22:21:11.493692    SYSTEM
1115  0          3            1        2026-05-23 22:21:11.552859    SYSTEM
1114  0          3            1        2026-05-23 22:21:11.608718    SYSTEM
1113  0          3            1        2026-05-23 22:21:11.674532    SYSTEM
1112  0          3            1        2026-05-23 22:21:11.729162    SYSTEM
1111  0          3            1        2026-05-23 22:21:11.779485    SYSTEM
1110  0          3            1        2026-05-23 22:21:11.952546    SYSTEM
```

→ 정확히 10건 = `LIST_SIZE` 일치. 모두 receiver_id=3 (정상 권한 통과). 모두 SYSTEM 발신 (`messageList` 상위 10건이 SYSTEM 알림이었음).

---

## §5 운영 로그 결과

### §5.1 Nginx access log (`/var/log/nginx/tenant.core-solution.co.kr.access.log`)

**김선희(IP `122.203.237.243`, /consultant/dashboard) 22:21:11 회차**:

```
GET /api/v1/consultation-messages/1119/read HTTP/2.0  200
GET /api/v1/consultation-messages/1118/read HTTP/2.0  200
GET /api/v1/consultation-messages/1117/read HTTP/2.0  200
GET /api/v1/consultation-messages/1116/read HTTP/2.0  200
GET /api/v1/consultation-messages/1115/read HTTP/2.0  200
GET /api/v1/consultation-messages/1114/read HTTP/2.0  200
GET /api/v1/consultation-messages/1113/read HTTP/2.0  200
GET /api/v1/consultation-messages/1112/read HTTP/2.0  200
GET /api/v1/consultation-messages/1111/read HTTP/2.0  200
GET /api/v1/consultation-messages/1110/read HTTP/2.0  200
```

- 1초 동안 13건(추가 3건은 다른 사용자) 모두 200 응답. 403/404 없음.
- 같은 사용자 직전 22:18:07~27: `GET /unread-count` 3회 (전부 200, body 111 bytes) + `GET /consultant/3?page=0&size=50` 1회 (200, body 2198 bytes).

### §5.2 애플리케이션 로그 (`/var/www/mindgarden/releases/blue/logs/coresolution.log`)

- 활성 로그 파일에 INFO 레벨 로그가 거의 누적되지 않음 (logback profile prod 설정으로 INFO 미기록 가능성). `메시지 읽음 처리`/`markAsRead` 로그 0건.
- ERROR 레벨만 활성 (SecurityHeaderFilter 스택트레이스 등). **본 결함 관련 ERROR/WARN 없음**.

### §5.3 결론

- 백엔드 markAsRead 자체는 **정상 200 동작**. 권한 거부/예외 0건.
- 결함의 위치는 **호출 횟수가 10건뿐인 프론트 로직 + 백엔드 일괄 엔드포인트 부재**.

---

## §6 15 케이스 매트릭스

각 케이스: (a) 코드 증거, (b) DB/로그 증거, (c) 확률, (d) 권고 트랙.

### D1: 백엔드/프론트 일괄 처리 경로 결함 (HIGH 우세)

| # | 케이스 | (a) 코드 증거 | (b) DB/로그 증거 | (c) 확률 | (d) 트랙 |
|---|---|---|---|---|---|
| D1-1 | **일괄 markAllAsRead 엔드포인트 부재** | `ConsultationMessageController` grep `mark-all\|read-all` 0건. SystemNotificationController에는 존재(L324) | 일괄 API 호출 access log 0건. 운영 access log 22:21:11에 `/{id}/read` 10회 개별 호출 관측 | **확정 (HIGH)** | **D1** |
| D1-2 | **`LIST_SIZE=10` 으로 상위 N건만 처리** | `NotificationDropdown.js` L34 `const LIST_SIZE = 10`. L128 `fetchMessages` 가 `page:0,size:LIST_SIZE`로 로딩. L146 `messageList.filter(!isRead)` 만 순회 | DB read_at 최근 30분 = **10건 정확히 일치**. access log 10건 (1110~1119) | **확정 (HIGH)** | **D1** |
| D1-3 | `/consultant/{id}` 가 송수신 통합 endpoint → 발신자 메시지가 messageList에 섞임 | `findByTenantIdAndReceiverIdOrSenderId` (Repository L69~77). | 22:21:11 회차에는 10건 모두 receiver_id=3 → 본 회차에는 미발현. 단, 김선희 sender_id=3 미읽음 5건 보유 → 차회 발현 가능 | MEDIUM | D1 (수신자 전용 일괄 API 신설 시 자동 해결) |
| D1-4 | `markMessageAsRead` 403 silent catch | `handleMarkAllRead` L147~152 `catch {}`. Controller L487 receiver/MESSAGE_MANAGE 둘 다 false → 403 | 22:21:11 access log 13건 모두 200 → 본 회차 미발현. 단, D1-3 발현 시 동반 발현 | MEDIUM | D1·D2 (사용자 토스트 표시 권고) |
| D1-5 | markAsRead 200 응답이지만 트랜잭션 미커밋 | Service L243 `@Transactional` + 클래스 L32 `@Transactional` 이중. update() 호출 | DB read_at 정확히 10건 채워짐 → 미발현 | LOW | — |

### D2: 백엔드 데이터·트랜잭션 결함

| # | 케이스 | (a) 코드 증거 | (b) DB/로그 증거 | (c) 확률 | (d) 트랙 |
|---|---|---|---|---|---|
| D2-1 | `isDeleted=true` 메시지 차단 | `findActiveById` (Service L406~409) `filter(m -> !m.getIsDeleted())` | 미발현 (10건 모두 처리됨) | LOW | — |
| D2-2 | tenantId 컨텍스트 미설정 | Controller L481 `TenantContextHolder.setTenantId(tenantId)`, Service L251 `getRequiredTenantId()` (없으면 throw) | 미발현 | LOW | — |
| D2-3 | `receiverId` ≠ `user.id` 매핑 결함 | Service L289 count `receiverId=userId` 사용. Entity L51 `receiver_id` 필수 NOT NULL | DB 검증: 김선희 user.id=3 ⇨ receiver_id=3 메시지 273건 정상 매핑 → 미발현 | LOW | — |
| D2-4 | `is_read` 컬럼 trigger/view wrap | Entity L77 `@Column(name="is_read") private Boolean isRead = false;` — 트리거 없음 | DB UPDATE 정상 반영 (read_at 채워짐) → 미발현 | LOW | — |
| D2-5 | 다중 receiver_id 분기 (통합 inbox + 개별 inbox) | 단일 `receiver_id` 컬럼만 존재 | 미발현 | LOW | — |

### D3: 프론트 KPI/캐시 결함

| # | 케이스 | (a) 코드 증거 | (b) DB/로그 증거 | (c) 확률 | (d) 트랙 |
|---|---|---|---|---|---|
| D3-1 | `loadUnreadCount`가 page=0 size=N 결과 그대로 count 사용 | `NotificationContext.loadUnreadMessageCount` L75~112 가 `/unread-count` API 호출 → 응답 `unreadCount` 사용 (page/size 안 씀) | unread-count API 응답 body 111 bytes로 정상 | LOW | — |
| D3-2 | `unread-count` API stale cache | `_t=Date.now()` (NotificationContext L94, ConsultantDashboardV2 L228) | 미발현 (요청마다 새 응답) | LOW | — |
| D3-3 | 대시보드 stats mount 시에만 fetch — F5 후 trigger 없음 | KPI는 페이지 mount 시·loadDashboardData 호출 시 fetch | 사용자 보고 F5 후에도 294 유지 → KPI는 정상 fetch했지만 **DB 자체가 안 변함** | LOW (실은 정상) | — |
| D3-4 | `unreadSystemCount`/`unreadMessages` GNB store 동기화 미흡 | NotificationContext L338~346 useEffect로 합계 계산 | 미발현 | LOW | — |
| D3-5 | KPI 카드가 별도 store 값 표시 | `dashboardData.stats.unreadMessages` (L704) — 단일 source | 미발현 | LOW | — |

### 종합

- **확정 원인**: D1-1 + D1-2 (HIGH).
- **잠재 동반 결함**: D1-3 (송수신 통합) → 다음 회차에 발현 가능. D1-4 (silent catch) → 사용자 가시성 부재.
- **무관**: D2 전체, D3 전체.

---

## §7 권고 fix 트랙

### P1 — D1: 백엔드 일괄 markAllAsRead 엔드포인트 신설 + 프론트 호출 치환 (핫픽스)

**예상 LOC: 80~120**.

#### P1-1. Repository — `@Modifying` UPDATE 메서드 추가

`src/main/java/com/coresolution/consultation/repository/ConsultationMessageRepository.java`

```java
import org.springframework.data.jpa.repository.Modifying;
import java.time.LocalDateTime;

/**
 * 수신자 기준 미읽음 메시지 일괄 읽음 처리 (tenantId 필수, isDeleted=false 만 대상).
 * @return UPDATE된 행 수
 */
@Modifying(clearAutomatically = true, flushAutomatically = true)
@Query("UPDATE ConsultationMessage m " +
       "   SET m.isRead = true, m.readAt = :readAt, m.status = 'READ' " +
       " WHERE m.tenantId = :tenantId " +
       "   AND m.receiverId = :receiverId " +
       "   AND m.isRead = false " +
       "   AND m.isDeleted = false")
int markAllAsReadByTenantIdAndReceiverId(
    @Param("tenantId") String tenantId,
    @Param("receiverId") Long receiverId,
    @Param("readAt") LocalDateTime readAt);
```

#### P1-2. Service — 인터페이스·구현

`src/main/java/com/coresolution/consultation/service/ConsultationMessageService.java`

```java
/** 수신자 기준 미읽음 메시지 일괄 읽음 처리. @return 처리된 건수 */
int markAllAsRead(Long receiverUserId);
```

`src/main/java/com/coresolution/consultation/service/impl/ConsultationMessageServiceImpl.java`

```java
@Override
@Transactional
public int markAllAsRead(Long receiverUserId) {
    log.info("📨 미읽음 메시지 일괄 읽음 처리 - 수신자 ID: {}", receiverUserId);
    String tenantId = TenantContextHolder.getRequiredTenantId();
    int updated = consultationMessageRepository
        .markAllAsReadByTenantIdAndReceiverId(tenantId, receiverUserId, LocalDateTime.now());
    log.info("✅ 일괄 읽음 처리 완료 - 수신자 ID: {}, 처리 건수: {}", receiverUserId, updated);
    return updated;
}
```

#### P1-3. Controller — 신규 엔드포인트

`src/main/java/com/coresolution/consultation/controller/ConsultationMessageController.java`

```java
/**
 * 수신자 본인 미읽음 메시지 일괄 읽음 처리.
 * POST /api/v1/consultation-messages/mark-all-read
 */
@PostMapping("/mark-all-read")
public ResponseEntity<ApiResponse<Map<String, Object>>> markAllAsRead(HttpSession session) {
    User currentUser = SessionUtils.getCurrentUser(session);
    if (currentUser == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ApiResponse.error("로그인이 필요합니다."));
    }
    String tenantId = currentUser.getTenantId();
    if (tenantId == null || tenantId.trim().isEmpty()) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ApiResponse.error("테넌트 정보가 없습니다."));
    }
    try {
        TenantContextHolder.setTenantId(tenantId.trim());
        int updated = consultationMessageService.markAllAsRead(currentUser.getId());
        Map<String, Object> data = new HashMap<>();
        data.put("updatedCount", updated);
        return success("미읽음 메시지를 모두 읽음 처리했습니다.", data);
    } finally {
        TenantContextHolder.clear();
    }
}
```

권한: 본인 수신함만 처리하므로 `MESSAGE_MANAGE` 불필요. `currentUser.getId()`로 강제 → 다른 사용자 데이터 변경 불가.

#### P1-4. 프론트 — `NotificationContext`에 `markAllMessagesAsRead` 추가

`frontend/src/contexts/NotificationContext.js`

```js
const API_CONSULTATION_MESSAGES_MARK_ALL_READ = '/api/v1/consultation-messages/mark-all-read';

const markAllMessagesAsRead = async () => {
  try {
    await apiPost(API_CONSULTATION_MESSAGES_MARK_ALL_READ, {});
    setNotifications([]);
    setUnreadMessageCount(0);
    await loadUnreadMessageCount();
  } catch (error) {
    console.error('❌ 메시지 일괄 읽음 처리 오류:', error);
    throw error;
  }
};

// value 객체에 markAllMessagesAsRead 추가
```

#### P1-5. 프론트 — `NotificationDropdown.handleMarkAllRead` 치환

`frontend/src/components/dashboard-v2/molecules/NotificationDropdown.js` L141~161

```js
const handleMarkAllRead = async () => {
  try {
    if ((unreadSystemCount || 0) > 0) {
      await markAllSystemNotificationsAsRead();
    }
    if ((unreadMessageCount || 0) > 0) {
      await markAllMessagesAsRead();
    }
    refreshNotifications();
    await loadUnreadCount();
    if (isOpen && activeTab === TAB_SYSTEM) fetchSystemNotifications();
    if (isOpen && activeTab === TAB_MESSAGES) fetchMessages();
  } catch (err) {
    console.error('전체 읽음 처리 실패:', err);
  }
};
```

#### P1-6. 테스트 (core-tester 위임)

- 단위: `markAllAsRead(receiverId)` UPDATE 쿼리 — 다른 테넌트/다른 수신자 데이터 미수정.
- 통합: 상담사 본인 미읽음 N건 (N > LIST_SIZE) 클릭 → 1회 호출, KPI 0 응답.
- 권한: 비로그인 401, 타사용자 ID 영향 없음 (강제 currentUser.id 사용).
- 회귀: 시스템 공지 일괄 처리는 그대로, 단발 `GET /{id}/read` 동작 유지.

### P2 — D1-3: 송수신 통합 endpoint 분리 (선택, 차회 회차 안전망)

상담사 메시지 KPI/inbox는 수신 전용으로 일원화 (`/consultant/{id}?direction=inbox` 등). 또는 NotificationDropdown 메시지 목록만 별도 endpoint 사용. 본 fix 트랙은 P1로 결함 해소 후 추후 정리.

### P3 — D1-4: silent catch 가시화

`NotificationDropdown.handleMarkAllRead` catch 블록에서 사용자 토스트(예: "일부 메시지 처리 실패") 표시. P1과 함께 작업 권장.

### 운영 백필 (선택, P2)

이미 누적된 미읽음 SYSTEM 메시지 (김선희 263건 등)는 신 엔드포인트 한 번 호출로 해결됨. 별도 백필 SQL 불필요.

---

## §8 사용자에게 받을 추가 정보 요청

다음 1~3 항목을 회신해 주시면 진단·픽스 검증을 가속할 수 있습니다.

1. **사용자 계정**: 본 분석은 운영 미읽음 상위 1순위 = 상담사 김선희(`user_id=3`, `tenant-incheon-counseling-001`)로 추정. 보고 시점의 상담사 계정이 동일한지 (다르면 user_id/로그인 ID 회신).
2. **"모두 읽음" 버튼 위치**: GNB(우측 상단 종 아이콘) 드롭다운 패널 헤더의 "모두 읽음" 버튼 (`NotificationDropdown.js`)이 맞는지. 다른 화면(메시지 페이지·관리자 페이지 등)에서 호출된 경우는 본 결함과 별개 경로 가능.
3. **브라우저 Network 탭 (선택)**: "모두 읽음" 클릭 시 호출 URL/응답 (HAR 파일 제공 시 더 정확). 운영 access log로 22:21:11 회차는 이미 캡처됨 — 새 회차 회신은 필수 아님.

---

## §9 부록 — 검증 명령 모음

```bash
ssh beta74.cafe24.com 'sudo mysql -hlocalhost -P3306 -umindgarden -p"$DB_PASSWORD" -Dcore_solution -B -e "
SELECT m.tenant_id, m.receiver_id, COUNT(*) AS unread_cnt
  FROM consultation_messages m
 WHERE m.is_read=0 AND m.is_deleted=0
 GROUP BY m.tenant_id, m.receiver_id
 ORDER BY unread_cnt DESC LIMIT 10;"'

ssh beta74.cafe24.com 'sudo grep -E "consultation-messages/[0-9]+/read" \
  /var/log/nginx/tenant.core-solution.co.kr.access.log | tail -n 30'

ssh beta74.cafe24.com 'sudo systemctl is-active mindgarden-core-blue.service mindgarden-core-green.service'
```

---

## 변경 이력

| 일시 | 작성자 | 내용 |
|---|---|---|
| 2026-05-23 22:35 KST | core-debugger | 최초 작성 — 1차 추정 운영 DB·log로 확정, P1 핫픽스 의사코드 제시 |
