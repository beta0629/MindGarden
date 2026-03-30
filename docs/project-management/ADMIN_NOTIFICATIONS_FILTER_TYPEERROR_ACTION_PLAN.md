# 통합알림 filter TypeError 수정 — 조치 계획(코더용 태스크 명세)

**관련 분석 문서**: `docs/debug/ADMIN_NOTIFICATIONS_FILTER_TYPEERROR_ANALYSIS.md`  
**목표**: 통합알림 접근 시 `TypeError: n.filter is not a function` 제거. API 응답 파싱에서 배열 추출·Array.isArray 보장 적용.  
**담당**: core-coder (기획·분석은 완료, 코드 수정만 수행)

---

## 1. 요약

| 항목 | 내용 |
|------|------|
| **증상** | `/admin/notifications` 접근 시 `TypeError: n.filter is not a function` |
| **원인** | `system-notifications/admin/all` API가 `{ notifications: [...], totalElements, ... }` 객체를 주는데, `response?.data ?? response ?? []` 파싱으로 **객체가 state에 들어감** → `.filter()` 호출 시 오류 |
| **수정 방향** | (1) 파싱에서 **배열 키 명시 추출** (`notifications` / `messages` / `content` / `data`), (2) **set 시·사용 전** `Array.isArray(...) ? ... : []` 로 배열 보장 |

---

## 2. 수정 대상 파일

| 파일 | 역할 |
|------|------|
| `frontend/src/components/admin/organisms/SystemNotificationListBlock.js` | 시스템 공지 목록·필터. `loadNotifications` 파싱 + 164행 `.filter()` |
| `frontend/src/components/admin/organisms/AdminMessageListBlock.js` | 메시지 목록·필터. `loadMessages` 파싱 + 52행 `.filter()` |

---

## 3. 수정 내용 요약

### 3.1 SystemNotificationListBlock.js

- **loadNotifications (49–51행 부근)**  
  - **현재**: `const list = Array.isArray(response) ? response : (response?.data ?? response ?? []);`  
  - **수정**:  
    - 배열 추출: `response?.notifications ?? response?.content ?? response?.data ?? []`  
    - 설정: `setNotifications(Array.isArray(list) ? list : []);`
- **164행 부근 (filter 호출)**  
  - **현재**: `notifications.filter((n) => { ... })`  
  - **수정**: `(Array.isArray(notifications) ? notifications : []).filter((n) => { ... })` (또는 변수로 배열 보장 후 filter)

### 3.2 AdminMessageListBlock.js

- **loadMessages (36–37행 부근)**  
  - **현재**: `const list = Array.isArray(response) ? response : (response?.data ?? response ?? []);`  
  - **수정**:  
    - 배열 추출: `response?.content ?? response?.messages ?? response?.data ?? []`  
    - 설정: `setMessages(Array.isArray(list) ? list : []);`
- **52행 부근 (filter 호출)**  
  - **현재**: `messages.filter((message) => { ... })`  
  - **수정**: `(Array.isArray(messages) ? messages : []).filter((message) => { ... })`

---

## 4. core-coder 전달용 태스크 설명 (호출 시 복사)

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

## 5. 완료 기준·체크리스트

- [ ] **SystemNotificationListBlock.js**  
  - [ ] `loadNotifications`에서 `response?.notifications`(및 `content`/`data`) 추출 후 `setNotifications(Array.isArray(list) ? list : []);`  
  - [ ] 164행 근처에서 `notifications` 사용 전 `Array.isArray(notifications) ? notifications : []` 적용  
  - [ ] `/admin/notifications` 접속 → 시스템 공지 탭 목록·필터 동작, 콘솔에 `n.filter` 관련 오류 없음  
- [ ] **AdminMessageListBlock.js**  
  - [ ] `loadMessages`에서 배열 추출 후 `setMessages(Array.isArray(list) ? list : []);`  
  - [ ] 52행 근처에서 `messages` 사용 전 `Array.isArray(messages) ? messages : []` 적용  
  - [ ] `/admin/notifications` 접속 → 메시지 탭 목록·필터 동작 확인  
- [ ] **UnifiedNotifications.js**  
  - [ ] 동일 페이지에서 시스템 공지/메시지 탭 전환 시 오류 없음 확인 (필요 시 동일 배열 보장 패턴 적용)

---

## 6. 참조

- **원인 분석·수정 제안 상세**: `docs/debug/ADMIN_NOTIFICATIONS_FILTER_TYPEERROR_ANALYSIS.md` (§4 수정 방향, §5 체크리스트)
