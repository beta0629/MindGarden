# 통합알림 페이지 TypeError: n.filter is not a function 원인 분석

**발생 경로**: `/admin/notifications`, `/notifications` (통합알림 페이지)  
**증상**: `TypeError: n.filter is not a function` (minified 시 변수명 `n`)  
**분석일**: 2026-03-17  
**담당**: core-debugger (원인 분석·수정 제안만, 코드 수정은 core-coder 위임)

---

## 1. 발생 위치 특정

### 1.1 `.filter()` 호출 위치

| 파일 | 라인 | 호출 코드 | 변수 |
|------|------|-----------|------|
| `frontend/src/components/admin/organisms/SystemNotificationListBlock.js` | 164 | `notifications.filter((n) => { ... })` | `notifications` |
| `frontend/src/components/admin/organisms/AdminMessageListBlock.js` | 52 | `messages.filter((message) => { ... })` | `messages` |

두 컴포넌트 모두 **state**에 목록을 넣은 뒤, 그 state에 `.filter()`를 호출하고 있음.

### 1.2 변수 설정 경로 추적

**SystemNotificationListBlock**

- State: `const [notifications, setNotifications] = useState([]);` (31행)
- 설정: `loadNotifications` (40–59행)
  - `StandardizedApi.get('/api/v1/system-notifications/admin/all', params)` 호출
  - `const list = Array.isArray(response) ? response : (response?.data ?? response ?? []);`
  - `setNotifications(list);`

**AdminMessageListBlock**

- State: `const [messages, setMessages] = useState([]);` (26행)
- 설정: `loadMessages` (33–45행)
  - `StandardizedApi.get('/api/v1/consultation-messages/all')` 호출
  - `const list = Array.isArray(response) ? response : (response?.data ?? response ?? []);`
  - `setMessages(list);`

**UnifiedNotifications** (`frontend/src/components/notifications/UnifiedNotifications.js`)

- 시스템 공지: `response.notifications || (Array.isArray(response) ? response : [])` (38행) → 배열 보장 로직 있음
- 메시지: `response.messages || (Array.isArray(response) ? response : [])` (87행) → 동일
- 이 페이지는 `.filter`를 직접 쓰지 않고, 위 두 블록과 달리 **객체 응답에서 배열 키를 명시적으로 추출**하고 있음.

---

## 2. API 응답 형식 (백엔드 기준)

### 2.1 GET `/api/v1/system-notifications/admin/all`

- **컨트롤러**: `SystemNotificationController.getAllNotificationsForAdmin`  
  (`src/main/java/com/coresolution/consultation/controller/SystemNotificationController.java` 320–363행)
- **반환 타입**: `ResponseEntity<ApiResponse<Map<String, Object>>>`
- **실제 응답 body**: `ApiResponse` 래퍼 적용 시  
  `{ "success": true, "message": "...", "data": { "notifications": [...], "totalElements": N, "totalPages": N, "currentPage": N } }`
- **프론트에서 apiGet 반환값**: `frontend/src/utils/ajax.js` 251–253행에서  
  `success`·`data` 키가 있으면 **`jsonData.data`만 반환**  
  → 즉 **`response` = `{ notifications: [...], totalElements, totalPages, currentPage }`** (객체, 배열 아님).

### 2.2 GET `/api/v1/consultation-messages/all`

- **컨트롤러**: `ConsultationMessageController.getAllMessages`  
  (`src/main/java/com/coresolution/consultation/controller/ConsultationMessageController.java` 87–157행)
- **반환 타입**: `ResponseEntity<ApiResponse<List<Map<String, Object>>>>`
- **실제 응답 body**: `{ "success": true, "message": "...", "data": [ {...}, {...} ] }`  
  → `data`가 **배열**.
- **프론트에서 apiGet 반환값**: `jsonData.data` = **배열**  
  → `response`가 배열이므로 `Array.isArray(response)`가 true이고, 현재 코드만으로도 메시지 쪽은 동작 가능.

---

## 3. 근본 원인

### 3.1 시스템 공지 (SystemNotificationListBlock) — 여기서 오류 발생

- `/api/v1/system-notifications/admin/all`은 **배열을 직접 주지 않고**,  
  `data: { notifications: [...], totalElements, totalPages, currentPage }` 형태로 줌.
- ajax 레이어가 `data`만 떼어서 주므로,  
  `response` = `{ notifications: [...], totalElements, totalPages, currentPage }`.
- 현재 파싱:
  - `Array.isArray(response)` → false
  - `response?.data` → undefined (이 객체에는 `data` 키 없음, `notifications` 키만 있음)
  - `response ?? []` → **response(객체)** 가 그대로 사용됨
- 결과: `setNotifications(객체)` → **notifications state가 배열이 아님**  
  → 164행 `notifications.filter(...)` 호출 시 **`TypeError: n.filter is not a function`** 발생.

즉, **API가 배열이 아닌 페이지네이션 객체를 주는데, 코드는 `response` 또는 `response.data`만 보고 배열이라고 가정**한 것이 근본 원인.

### 3.2 메시지 (AdminMessageListBlock)

- `/api/v1/consultation-messages/all`은 `data`가 **List**이므로,  
  현재 구조에서는 `response`가 배열로 들어와서 당장은 오류가 나지 않을 수 있음.
- 다만 다른 엔드포인트/프록시 변경 시 `{ content: [] }`, `{ messages: [] }` 등으로 바뀌면  
  동일한 패턴(`response?.data ?? response ?? []`)으로 **객체가 state에 들어갈 여지**가 있음.
- 따라서 **배열 보장**을 명시적으로 하는 편이 안전함.

---

## 4. 수정 방향 제안 (코드 수정 없이 제안만)

### 4.1 (가) API 응답에서 배열만 추출하도록 파싱 수정

**SystemNotificationListBlock.js** (`loadNotifications` 내부, 49–51행 부근)

- **현재**:  
  `const list = Array.isArray(response) ? response : (response?.data ?? response ?? []);`
- **제안**:  
  시스템 공지 API 실제 형식에 맞춰 **배열 키를 우선 사용**하고, 그 다음에만 `data`/배열/빈 배열 fallback 사용.  
  예:  
  `const list = Array.isArray(response) ? response : (response?.notifications ?? response?.content ?? response?.data ?? []);`  
  그리고 **배열이 아닐 수 있는 경우를 한 번 더 방어**:  
  `setNotifications(Array.isArray(list) ? list : []);`

**AdminMessageListBlock.js** (`loadMessages` 내부, 36–37행 부근)

- **현재**:  
  `const list = Array.isArray(response) ? response : (response?.data ?? response ?? []);`
- **제안**:  
  메시지 API는 `data`가 배열이므로 `response?.content ?? response?.messages ?? response?.data ?? []` 등으로 **가능한 배열 키**를 나열하고,  
  마지막에 **배열 보장**:  
  `setMessages(Array.isArray(list) ? list : []);`

이렇게 하면 백엔드가 `content`/`messages`/`data` 중 어떤 키로 배열을 주더라도, 그리고 일시적으로 객체가 오더라도 state에는 항상 배열만 들어감.

### 4.2 (나) state 사용 전 Array.isArray 체크 + fallback []

**.filter를 호출하는 쪽**에서도 방어적으로 처리할 수 있음.

**SystemNotificationListBlock.js** (164행 부근)

- **현재**:  
  `const filteredList = notifications.filter((n) => { ... });`
- **제안**:  
  `const list = Array.isArray(notifications) ? notifications : [];`  
  `const filteredList = list.filter((n) => { ... });`  
  또는 한 줄:  
  `const filteredList = (Array.isArray(notifications) ? notifications : []).filter((n) => { ... });`

**AdminMessageListBlock.js** (52행 부근)

- **현재**:  
  `const filteredMessages = messages.filter((message) => { ... });`
- **제안**:  
  `const filteredMessages = (Array.isArray(messages) ? messages : []).filter((message) => { ... });`

**(가)와 (나)를 함께 적용**하면,  
- (가): API 파싱 단계에서 올바른 배열 추출 + set 시 배열만 넣기  
- (나): 렌더 단계에서 혹시 모를 비배열 값에 대한 방어  
로 이중으로 안전해짐.

---

## 5. 수정 제안 체크리스트 (core-coder 적용 후 확인용)

- [ ] **SystemNotificationListBlock.js**  
  - [ ] `loadNotifications`에서 `response?.notifications`(및 필요 시 `content`/`data`) 추출 후,  
        `setNotifications(Array.isArray(list) ? list : []);` 로 설정
  - [ ] 164행 근처에서 `notifications` 사용 전 `Array.isArray(notifications) ? notifications : []` 적용
  - [ ] `/admin/notifications` 접속 → 시스템 공지 탭에서 목록·필터 동작 확인, 콘솔에 `n.filter` 관련 오류 없음
- [ ] **AdminMessageListBlock.js**  
  - [ ] `loadMessages`에서 배열 추출 시 `response?.content ?? response?.messages ?? response?.data ?? []` 등 적용 후  
        `setMessages(Array.isArray(list) ? list : []);` 로 설정
  - [ ] 52행 근처에서 `messages` 사용 전 `Array.isArray(messages) ? messages : []` 적용
  - [ ] `/admin/notifications` 접속 → 메시지 탭에서 목록·필터 동작 확인
- [ ] **UnifiedNotifications.js**  
  - [ ] 현재도 `response.notifications` / `response.messages` + `Array.isArray(response) ? response : []` 사용 중이므로,  
        동일 페이지에서 시스템 공지/메시지 탭 전환 시 오류 없음만 한 번 더 확인 (필요 시 동일한 배열 보장 패턴 적용)

---

## 6. core-coder 전달용 태스크 설명 초안

> **통합알림 페이지 `TypeError: n.filter is not a function` 수정**  
> 1. **SystemNotificationListBlock.js**:  
>    - `loadNotifications`에서 API 응답이 `{ notifications: [], totalElements, ... }` 형태이므로,  
>      `response?.notifications ?? response?.content ?? response?.data ?? []` 로 배열을 추출하고,  
>      `setNotifications(Array.isArray(list) ? list : []);` 로만 설정.  
>    - 164행 `notifications.filter` 호출 전에 `Array.isArray(notifications) ? notifications : []` 로 배열 보장.  
> 2. **AdminMessageListBlock.js**:  
>    - `loadMessages`에서 배열 추출 시 `response?.content ?? response?.messages ?? response?.data ?? []` 적용 후  
>      `setMessages(Array.isArray(list) ? list : []);` 로 설정.  
>    - 52행 `messages.filter` 호출 전에 `Array.isArray(messages) ? messages : []` 적용.  
> 3. 상세 원인·체크리스트는 `docs/debug/ADMIN_NOTIFICATIONS_FILTER_TYPEERROR_ANALYSIS.md` 참고.

---

## 7. 기획(core-planner) 위임 시 조치 제안

- **조치**: 이 문서를 core-planner에 전달하고, “통합알림 페이지 filter TypeError 수정” 태스크를 **core-coder**에게 할당 요청.
- **참고 문서**: 본 문서(`docs/debug/ADMIN_NOTIFICATIONS_FILTER_TYPEERROR_ANALYSIS.md`)의 §4 수정 방향, §5 체크리스트, §6 태스크 설명 초안을 그대로 전달하면 됨.
- **추가 제안**: API 설계 표준 문서에 “목록 API는 `data`를 배열로 반환하거나, 객체일 경우 `content`/`notifications`/`messages` 등 배열 필드명을 명시”하는 규칙을 넣어 두면, 이후 동일 유형 오류 예방에 도움이 됨.
