# GNB 알림 배지 항상 99 표시 원인 분석

## 1. 증상

- **증상**: GNB 알림 배지 숫자가 실제 읽지 않은 개수와 관계없이 **항상 99**로 표시됨.
- **관련 코드**: 알림 배지는 `NotificationDropdown`의 `totalUnread`를 사용하며, 이 값은 `NotificationContext`의 `unreadMessageCount`와 `unreadSystemCount`의 합이다.

---

## 2. 99 출처 분석 (하드코딩·캡·초기값·API 파싱)

| 후보 | 결론 | 근거 |
|------|------|------|
| **하드코딩** | 해당 없음 | 프론트/백엔드에 `99`를 배지 값으로 넣는 코드 없음. `Badge.js`의 `DEFAULT_MAX_COUNT = 99`는 표시 캡(99+)용일 뿐, 값을 99로 고정하지 않음. |
| **캡(표시 제한)** | 해당 없음 | `dashboard-v2/atoms/NotificationBadge.js`는 `count > 99 ? '99+' : count`로 **표시만** 99+로 바꿀 뿐, `count` 자체를 99로 바꾸지 않음. “항상 99”가 나온다면 `count === 99`인 경우임. |
| **초기값 오류** | 해당 없음 | `NotificationContext` 초기값은 `useState(0)` (unreadMessageCount, unreadSystemCount 모두). 99 초기값 없음. |
| **API 응답 파싱 오류** | 가능성 있음 | 아래 3절·4절과 연동. 응답 구조가 다르거나 한쪽 API만 99를 주고 다른 쪽이 0이면, 합이 99로 고정될 수 있음. |
| **API가 99 반환** | **가장 유력** | 프론트는 `response.unreadCount`가 `number`일 때만 사용하고 아니면 0으로 처리함. 따라서 **백엔드 unread-count API 중 하나가 해당 조건(예: ADMIN)에서 99를 반환**하면 배지가 99로 고정됨. |

**요약**: 99는 **하드코딩/캡/초기값이 아니라**, **unread-count API 응답에서 오는 값**이 99로 설정되는 경로가 유력함. 프론트에는 99를 “만드는” 코드가 없고, 표시 캡만 99+로 처리함.

---

## 3. 관리자(ADMIN) 역할일 때 unread-count API 동작

### 3.1 호출·응답 형태 (역할 공통)

- **메시지 unread-count**  
  - **URL**: `GET /api/v1/consultation-messages/unread-count?userId={id}&userType={userType}&_t={ts}`  
  - **ADMIN 시**: `NotificationContext`에서 `userType = 'ADMIN'`으로 호출 (78–86행).  
  - **응답**: `{ success: true, data: { unreadCount: N } }` → `apiGet`이 `data`만 반환하므로 `response = { unreadCount: N }`.  
  - **역할별 차이**: 동일 엔드포인트·동일 응답 구조. 서비스에서는 **userType을 사용하지 않고** `receiverId`(userId)만으로 집계함.

- **시스템 공지 unread-count**  
  - **URL**: `GET /api/v1/system-notifications/unread-count?_t={ts}`  
  - **ADMIN 시**: 세션의 `userRole`(예: `ROLE_ADMIN`)으로 서버에서 조회.  
  - **응답**: 동일하게 `{ success: true, data: { unreadCount: N } }` → `response = { unreadCount: N }`.

즉, **호출/응답 형태는 다른 역할과 동일**하다. 다만 **서버 내부 로직**에서 ADMIN일 때 집계 결과가 달라질 수 있음.

### 3.2 ADMIN일 때 서버 동작 차이

- **메시지**  
  - `ConsultationMessageServiceImpl.getUnreadCount(userId, userType)`  
  - 실제로는 `userType` 미사용. `countByTenantIdAndReceiverIdAndIsReadFalse(tenantId, userId)`만 사용 → **tenantId 격리 적용**. ADMIN이어도 동일.

- **시스템 공지**  
  - `SystemNotificationServiceImpl.getUnreadCount(userId, userRole)`  
  - `getTargetTypesForUser(userRole)`: ADMIN/SUPER 분기 없음 → `["ALL"]`만 사용.  
  - **중요**: 185행에서 **deprecated** 메서드 `countUnreadNotificationsByUser(userId, targetTypes)` 호출 → **tenantId 없이** 조회.  
  - Repository에는 **tenantId 적용** 메서드 `countUnreadNotificationsByTenantIdAndUser(tenantId, userId, targetTypes)`가 있으나 사용하지 않음.  
  - 따라서 **ADMIN뿐 아니라 해당 API를 쓰는 모든 역할**에서, 시스템 공지 unread 수가 **테넌트 격리 없이** 여러 테넌트 공지를 합산할 수 있음. 그 결과가 우연히 99가 되면 “항상 99”처럼 보일 수 있음.

---

## 4. 원인 요약 (1개 파일·1개 지점)

- **파일**: `src/main/java/com/coresolution/consultation/service/impl/SystemNotificationServiceImpl.java`  
- **위치**: **181–190행** `getUnreadCount` 메서드 내부, 185행.

**근본 원인**:  
시스템 공지 unread 수 조회 시 **tenantId를 쓰지 않는 deprecated** 메서드 `countUnreadNotificationsByUser(userId, targetTypes)`를 사용하고 있음.  
그 결과:

1. 테넌트 격리가 되지 않아, 다른 테넌트 공지까지 포함된 “읽지 않은 수”가 반환될 수 있고,  
2. 그 집계값이 (데이터 구성에 따라) 99로 나오면, GNB 배지가 **항상 99**로 보일 수 있음.

(메시지 unread가 99를 반환하는 경우도 가능하나, 메시지 서비스는 tenantId를 사용하므로, “역할과 관계없이 잘못된 99”가 나오는 쪽은 **시스템 공지 쪽**이 더 유력함.)

---

## 5. 수정 방향

- **파일**: `SystemNotificationServiceImpl.java`  
- **위치**: `getUnreadCount` 메서드 (181–191행 근처).

**변경 내용**:

1. `TenantContextHolder.getTenantId()`로 `tenantId`를 얻는다.  
2. `countUnreadNotificationsByUser(userId, targetTypes)` 호출을 제거하고,  
3. **tenantId를 사용하는** `countUnreadNotificationsByTenantIdAndUser(tenantId, userId, targetTypes)`를 호출하도록 변경한다.  
4. `tenantId`가 null/비어 있을 때는 기존 표준(에러 처리 또는 0 반환)에 맞게 처리한다.

이렇게 하면 테넌트별로만 읽지 않은 공지 수가 집계되어, 실제 개수와 일치하고 “항상 99” 현상이 사라질 가능성이 높다.

---

## 6. 재현 절차

1. 관리자(ADMIN) 계정으로 로그인한다.  
2. GNB(상단 알림 아이콘)를 확인해 배지 숫자가 99인지 본다.  
3. 알림/메시지 페이지에서 실제 “읽지 않음” 개수를 확인한다.  
4. (선택) 다른 역할(CLIENT, CONSULTANT)으로 로그인해 동일 경로에서 배지와 실제 개수를 비교한다.

---

## 7. 확인할 로그·네트워크

### 7.1 브라우저 네트워크 탭

- **메시지 unread-count**  
  - 필터: `unread-count` 또는 `consultation-messages`.  
  - 요청: `GET /api/v1/consultation-messages/unread-count?userId=...&userType=ADMIN&_t=...`  
  - 확인: 응답 JSON `data.unreadCount` 값 (숫자 N).

- **시스템 공지 unread-count**  
  - 요청: `GET /api/v1/system-notifications/unread-count?_t=...`  
  - 확인: 응답 JSON `data.unreadCount` 값 (숫자 N).

두 응답의 `unreadCount`를 합한 값이 GNB 배지와 일치하는지, 그리고 어느 한쪽이 99인지 확인하면 원인(메시지 vs 시스템 공지)을 좁힐 수 있다.

### 7.2 브라우저 콘솔 로그

- `NotificationContext`에서 찍는 로그:  
  - `📨 메시지 개수 API 호출:`  
  - `📊 읽지 않은 메시지 개수 업데이트: {count}`  
  - `📢 읽지 않은 공지 개수 업데이트: {count}`  
  - `📊 통합 알림 개수 계산: { unreadMessageCount, unreadSystemCount, totalUnread }`  

위에서 `unreadMessageCount` / `unreadSystemCount` / `totalUnread`가 각각 얼마로 설정되는지 확인하면, 99가 메시지 쪽인지 시스템 공지 쪽인지 구분할 수 있다.

### 7.3 백엔드 로그

- `SystemNotificationServiceImpl`:  
  - `📢 읽지 않은 공지 수 조회 - 사용자 ID: ..., 역할: ...`  
  - `✅ 읽지 않은 공지 수: {count}`  
- `ConsultationMessageServiceImpl`:  
  - `📨 읽지 않은 메시지 수 조회 - 사용자 ID: ..., 유형: ...`  
  - `📊 읽지 않은 메시지 수: {count} (수신자 ID: ...)`  

위 `count` 값이 99인 쪽이 배지 99의 직접 원인이다.

---

## 8. 수정 후 체크리스트

- [ ] ADMIN으로 로그인 후 GNB 알림 배지가 실제 읽지 않은 개수(메시지+시스템 공지)와 일치하는지 확인.  
- [ ] 다른 역할(CLIENT, CONSULTANT)으로도 배지가 실제 개수와 일치하는지 확인.  
- [ ] 네트워크 탭에서 두 unread-count 응답의 `data.unreadCount` 합이 배지와 일치하는지 확인.  
- [ ] 콘솔의 `📊 통합 알림 개수 계산` 로그에서 `totalUnread`가 위 합과 같은지 확인.

---

**작성**: core-debugger (원인 분석·수정 제안만 수행, 코드 수정은 core-coder 위임)
