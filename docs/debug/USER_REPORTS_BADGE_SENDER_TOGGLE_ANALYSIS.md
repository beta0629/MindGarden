# 사용자 리포트 3건 원인 분석 및 수정 제안 (Phase 0 기반)

**작성:** core-debugger  
**일자:** 2026-03-17  
**대상:** (1) 알림 배지 미표시, (2) 발신자 "알 수 없음" → 시스템 메시지, (3) 목록 보기 토글 ariaLabel 일관화

---

## 1. 알림 배지 미표시

### 1-1. 원인 정리 (1~3가지)

| # | 원인 | 설명 |
|---|------|------|
| 1 | **드롭다운 오픈 시에만 unreadCount 갱신** | GNB 알림 배지는 `NotificationDropdown.js`의 로컬 state `unreadCount`만 사용하며, 이 값은 **드롭다운이 열릴 때만** `fetchNotifications()` → GET `/api/v1/alerts` 호출로 갱신된다. 마운트 시·폴링·다른 트리거 없음. |
| 2 | **unread-count API 미사용** | 백엔드에 GET `/api/v1/alerts/unread-count`가 있으나 프론트에서 호출하지 않음. 배지용으로는 이 API가 적합함(전체 미읽음 개수). |
| 3 | **초기값 0** | `useState(0)`으로 시작하므로, 사용자가 알림 버튼을 한 번도 열지 않으면 배지는 항상 0 → 미표시. |

### 1-2. 수정 방향 제안

- **방향 A (권장):**  
  - **마운트 시** GET `/api/v1/alerts/unread-count` 호출하여 `setUnreadCount(response)` 적용.  
  - 파일: `frontend/src/components/dashboard-v2/molecules/NotificationDropdown.js`.  
  - `StandardizedApi.get('/api/v1/alerts/unread-count')` 응답이 `data` 래핑인지 직접 Long인지 확인 후 `setUnreadCount`에 넣을 값 결정.
- **방향 B (보조):**  
  - 드롭다운 오픈 시 `fetchNotifications()`에서 기존처럼 목록으로 미읽음 개수를 세는 방식은 유지하되, **첫 페이지만**으로는 전체 미읽음 수와 다를 수 있으므로, unread-count API를 호출해 배지 수를 덮어쓰면 일관됨.
- **방향 C (선택):**  
  - 주기적 폴링(예: 60초)으로 `/api/v1/alerts/unread-count` 재호출해 배지 갱신. 마운트 + 오픈 시 갱신만으로도 충분할 수 있음.

### 1-3. core-coder용 체크리스트

- [ ] `NotificationDropdown.js`: 마운트 시 `useEffect`에서 GET `/api/v1/alerts/unread-count` 호출 후 `setUnreadCount` 반영.
- [ ] `StandardizedApi`/백엔드 응답 형식 확인: `ApiResponse<Long>`이면 `response?.data ?? response` 등으로 숫자 추출.
- [ ] 드롭다운 오픈 시 `fetchNotifications()` 후에도 unread 개수를 unread-count API 결과로 맞출지, 기존 로직(첫 페이지 기준) 유지할지 결정 후 적용.
- [ ] 수정 후: 페이지 로드 직후 알림 버튼을 열지 않아도 미읽음이 있으면 배지 표시되는지 확인.
- [ ] 읽음 처리 후 배지 감소는 기존대로 동작하는지 확인.

---

## 2. 발신자 표기 — "시스템 메시지"

### 2-1. "알 수 없음"이 나오는 분기

- **백엔드:**  
  `ConsultationMessageController.java`의 `getUserName(Long userId, String userType)` (라인 65~80).  
  - `userType` 파라미터는 받지만 **사용하지 않음**.  
  - `userId == null` 또는 `userService.findById(userId)` 결과가 null이면 `"알 수 없음"` 반환.  
  - 시스템 발신(senderId=0 또는 null, senderType=SYSTEM)인 경우 사용자 엔티티가 없어 "알 수 없음"이 반환됨.

- **프론트:**  
  API 응답의 `senderName`을 그대로 표시하는 곳에서, 백엔드가 "알 수 없음"을 주면 그대로 노출됨.  
  - `senderType`은 이미 API에 포함(`data.put("senderType", message.getSenderType())`).

### 2-2. 수정할 위치

| 구분 | 파일 | 위치 | 내용 |
|------|------|------|------|
| 프론트 | `frontend/src/components/notifications/UnifiedNotifications.js` | 365~366행 근처 | 리스트: `senderType === 'SYSTEM'`이면 "시스템 메시지", 아니면 `senderName \|\| '알 수 없음'`. |
| 프론트 | `frontend/src/components/notifications/UnifiedNotifications.js` | 383행 근처 | 모달 subtitle: `senderType === 'SYSTEM'`이면 "시스템 메시지", 아니면 `authorName \|\| senderName \|\| '관리자'` 등. |
| 프론트 | `frontend/src/components/admin/AdminMessages.js` | 247행 | 발신: `senderType === 'SYSTEM' ? '시스템 메시지' : message.senderName`. |
| 프론트 | `frontend/src/components/admin/AdminMessages.js` | 297행 | 모달 발신자: `senderType === 'SYSTEM' ? '시스템 메시지' : selectedMessage.senderName`. |
| 백엔드(선택) | `ConsultationMessageController.java` | `getUserName` 메서드 | `userType != null && "SYSTEM".equals(userType)` 또는 `userId == null || userId == 0`이면 `"시스템 메시지"` 반환. |

### 2-3. 공통 규칙 제안

- **규칙:**  
  - `senderType === 'SYSTEM'`(또는 동일 의미 문자열)이면 발신자 표기에 **"시스템 메시지"** 사용.  
  - 그 외에는 기존대로 `senderName` 사용, 없을 때만 "알 수 없음" 등 폴백.
- **적용 위치:**  
  - `UnifiedNotifications.js` (리스트·모달),  
  - `AdminMessages.js` (리스트·모달),  
  - 동일 consultation-messages API를 쓰는 다른 발신자 표기 있는 컴포넌트(검색으로 추가 확인 권장).

### 2-4. core-coder용 체크리스트

- [ ] `UnifiedNotifications.js`: 리스트·모달에서 `senderType === 'SYSTEM'`일 때 "시스템 메시지" 표기 적용.
- [ ] `AdminMessages.js`: 247행·297행에서 `senderType === 'SYSTEM'`일 때 "시스템 메시지" 표기 적용.
- [ ] consultation-messages를 쓰는 다른 화면에서 발신자 표기 검색 후, 동일 규칙 적용 여부 확인.
- [ ] (선택) `ConsultationMessageController.getUserName`: SYSTEM 또는 userId 0/null일 때 "시스템 메시지" 반환하도록 수정.
- [ ] 수정 후: 시스템 발송 메시지에서 "시스템 메시지"로만 노출되는지, 그 외 발신자는 기존대로인지 확인.

---

## 3. 목록 보기 전환 토글 — ariaLabel 명시 전달

### 3-1. 상황

- 매핑 리스트 블록(`MappingListBlock.js`)은 이미 `ViewModeToggle`에 `ariaLabel="목록 보기 전환"` 명시 전달함.
- `ViewModeToggle` 기본값은 `ariaLabel = '목록 보기 전환'`이므로 미전달 시에도 동일하나, **일관성·접근성 명시**를 위해 동일 화면군에서도 prop으로 넘기는 것이 좋음.

### 3-2. 수정 제안

다음 세 파일에서 `ViewModeToggle` 사용 시 **`ariaLabel="목록 보기 전환"` 명시 전달.**

| 파일 | 대략 라인 | 현재 | 수정 |
|------|------------|------|------|
| `frontend/src/components/admin/ClientComprehensiveManagement.js` | 549~553 | `ViewModeToggle`에 `ariaLabel` 없음 | `ariaLabel="목록 보기 전환"` 추가 |
| `frontend/src/components/admin/ConsultantComprehensiveManagement.js` | 1094~1098, 1306~1310 | 동일 | 두 곳 모두 `ariaLabel="목록 보기 전환"` 추가 |
| `frontend/src/components/admin/StaffManagement.js` | 462~466 | 동일 | `ariaLabel="목록 보기 전환"` 추가 |

### 3-3. core-coder용 체크리스트

- [ ] `ClientComprehensiveManagement.js`: 해당 `ViewModeToggle`에 `ariaLabel="목록 보기 전환"` 추가.
- [ ] `ConsultantComprehensiveManagement.js`: 두 곳의 `ViewModeToggle`에 각각 `ariaLabel="목록 보기 전환"` 추가.
- [ ] `StaffManagement.js`: 해당 `ViewModeToggle`에 `ariaLabel="목록 보기 전환"` 추가.
- [ ] 수정 후: 스크린 리더/접근성 검사에서 톱글 그룹에 "목록 보기 전환"이 읽히는지 확인(선택).

---

## 요약

| 이슈 | 핵심 원인 | 수정 요약 |
|------|-----------|-----------|
| 알림 배지 미표시 | 배지가 드롭다운 오픈 시에만 갱신, unread-count API 미호출 | 마운트 시 GET `/api/v1/alerts/unread-count` 호출로 배지 초기값 설정 |
| 발신자 "알 수 없음" | 백엔드가 SYSTEM일 때 사용자 없어 "알 수 없음" 반환, 프론트에서 senderType 미반영 | 프론트에서 senderType===SYSTEM이면 "시스템 메시지" 표기 (필요 시 백엔드 getUserName 보완) |
| 토글 ariaLabel | 기본값에만 의존, 명시 전달 없음 | Client/Consultant/Staff 관리 화면의 ViewModeToggle에 ariaLabel 명시 |

코드 수정은 **core-coder**에게 위임하며, 본 문서의 수정 방향과 체크리스트를 전달해 적용하면 됨.
