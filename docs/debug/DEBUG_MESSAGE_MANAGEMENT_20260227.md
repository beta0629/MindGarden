# 메시지 관리(상담사-내담자 메시지) 오류 원인 분석

**작성일**: 2026-02-27  
**담당**: core-debugger  
**상태**: 분석 완료, 수정은 core-coder 위임

---

## 목차

1. [원인 분석 요약](#1-원인-분석-요약)
2. [프론트엔드 — API 호출 및 에러 핸들링](#2-프론트엔드--api-호출-및-에러-핸들링)
3. [백엔드 — 권한·예외 경로](#3-백엔드--권한예외-경로)
4. [가능 원인 정리](#4-가능-원인-정리)
5. [재현 절차](#5-재현-절차)
6. [수정 제안(체크리스트) — core-coder 위임용](#6-수정-제안체크리스트--core-coder-위임용)
7. [서버 로그 확인용 명령·키워드](#7-서버-로그-확인용-명령키워드)
8. [메시지 테이블 tenant_id 없이 조회하는 경로](#8-메시지-테이블-tenant_id-없이-조회하는-경로)
9. [참조](#9-참조)

---

## 1. 원인 분석 요약

### 증상
- **메시지 관리** 화면(`/admin/messages`)에서 오류 발생. 접근(공지)은 되지만 **메시지는 오류**.
- 사용자 전달: **서버에서 오류가 나고 있는 것 같다**.

### 추적 경로
1. **프론트**: `AdminMessages.js` → 마운트 시 `loadMessages()` → `apiGet('/api/v1/consultation-messages/all')`. **응답 처리**: `apiGet`은 성공 시 `ApiResponse`의 `data`만 반환(배열)하는데, 컴포넌트는 `response.success` / `response.data`를 기대함 → **성공 시에도 목록이 비어 있고 "메시지 목록을 불러오는데 실패했습니다" 표시되는 프론트 버그 가능성**.
2. **백엔드 목록 API** (`GET /api/v1/consultation-messages/all`): `SessionUtils.getCurrentUser(session)` → null이면 401. `dynamicPermissionService.hasPermission(currentUser, "MESSAGE_MANAGE")` → false면 403 "메시지 관리 권한이 필요합니다.". `currentUser.getTenantId()` null/빈값이면 403 "테넌트 정보가 없습니다.". 위 통과 후 `TenantContextHolder.setTenantId(tenantId)` 설정 후 `consultationMessageService.getAllMessages()` 호출. **이 try 블록 내에서 예외 발생 시** 컨트롤러가 **403**으로 응답하며 body에 "메시지 목록을 조회할 수 없습니다. " + 예외 메시지 반환(500이 아님).
3. **백엔드 상세 API** (`GET /api/v1/consultation-messages/{messageId}`): **세션/권한/tenantId 검사 없음.** `getById(messageId)` → null이면 `RuntimeException("메시지를 찾을 수 없습니다.")` → `GlobalExceptionHandler.handleRuntime()` → **500**. 읽음 처리 시 `markAsRead(messageId)` 내부에서 `TenantContextHolder.getTenantId()` 사용하나 null이면 repository.save만 수행해 예외는 없음. 단, 그 외 서비스 예외 시 500.

### 근본 원인 후보 (우선순위)
| 우선순위 | 원인 | 설명 |
|---------|------|------|
| 1 | **(d) 프론트 응답 처리 불일치** | `apiGet`이 성공 시 **배열(data)**만 반환하는데, `AdminMessages`는 `response.success`, `response.data`를 보고 있어 **성공해도 빈 목록 + 실패 메시지**로 보일 수 있음. |
| 2 | (a) **MESSAGE_MANAGE 권한 미반영** | `role_permissions`에 해당 사용자 역할의 `MESSAGE_MANAGE` 없음 → 403 "메시지 관리 권한이 필요합니다." |
| 3 | (b) **tenant_id 없음** | 현재 사용자 `tenant_id`가 null/빈값 → 403 "테넌트 정보가 없습니다." |
| 4 | (c) **목록 조회 중 예외** | `getAllMessages()` 또는 스트림 변환 중 NPE/DB 예외 → 컨트롤러 catch에서 **403** + "메시지 목록을 조회할 수 없습니다. ..." (서버 로그에 스택 트레이스). |
| 5 | (e) **상세 조회 500** | `GET /{messageId}`에서 메시지 없음 → RuntimeException → 500. 또는 다른 비검사 예외. |

---

## 2. 프론트엔드 — API 호출 및 에러 핸들링

### 라우트·컴포넌트
- **라우트**: `/admin/messages` (`App.js` 491행, `element={<AdminMessages />}`).
- **컴포넌트**: `frontend/src/components/admin/AdminMessages.js`.

### 호출 API
| 동작 | API | 코드 위치 |
|------|-----|-----------|
| 목록 로드 | `GET /api/v1/consultation-messages/all` | `loadMessages()` → `apiGet('/api/v1/consultation-messages/all')` (43–44행) |
| 상세 보기 | `GET /api/v1/consultation-messages/{messageId}` | `handleMessageClick(message)` → `apiGet(\`/api/v1/consultation-messages/${message.id}\`)` (86행) |
| 저장/수정/삭제 | 해당 화면에서는 **호출 없음** (목록·상세만 사용). | — |

### 응답 처리 (목록)
- `apiGet` 성공 시 (`ajax.js` 239–241행): 응답이 `{ success, data }` 형태면 **`data`만 반환** (배열).
- `AdminMessages.js` (44–49행):
  - `if (response && response.success)` → **성공 시 `response`는 배열이므로 `response.success`는 undefined** → 조건 실패.
  - `else`로 가서 `notificationManager.show(response?.message || '메시지 목록을 불러오는데 실패했습니다.', 'error')` 실행 → **성공인데도 실패 메시지 + 목록 미설정**.
- **결론**: 목록 API가 200으로 성공해도 화면에는 "메시지 목록을 불러오는데 실패했습니다"가 뜨고 목록이 비어 있게 되는 **프론트 버그** 가능성이 큼.

### 403 / 500 / 네트워크 오류 시 표시 메시지
- **403**: `ajax.js` 216–223행 — `jsonData.message`가 있으면 그대로, 없으면 "접근 권한이 없습니다." 로 `Error` throw. `AdminMessages` catch (51–53행)에서 `err.message` 또는 "메시지를 불러오는 중 오류가 발생했습니다." 토스트.
- **500**: `ajax.js` 229–231행 — `handleError(new Error('서버 오류'), response.status)` → `getErrorMessage(500)` → `API_ERROR_MESSAGES.SERVER_ERROR` ("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.") throw. 동일 catch에서 `err.message`로 토스트.
- **네트워크/기타**: fetch 실패 시 catch에서 `err.message` 또는 "메시지를 불러오는 중 오류가 발생했습니다.".

### 에러 핸들링 경로 요약
- **경로**: `apiGet` → `fetch` → `response.ok` false 시 status별 분기 → 403이면 서버 `message` 담은 Error throw → `AdminMessages`의 `loadMessages` catch → `notificationManager.show(message, 'error')`.
- **응답 body**: 403/500 시 `jsonData`(또는 Error의 `error.response.data`)에 `message`, `errorCode` 등. 백엔드는 `ApiResponse.error(message)` 또는 `ErrorResponse` 사용.

---

## 3. 백엔드 — 권한·예외 경로

### 컨트롤러
- **파일**: `src/main/java/com/coresolution/consultation/controller/ConsultationMessageController.java`.
- **Base path**: `/api/v1/consultation-messages`.

### GET /api/v1/consultation-messages/all (목록)
- **권한**: `SessionUtils.getCurrentUser(session)` → null이면 401. `dynamicPermissionService.hasPermission(currentUser, "MESSAGE_MANAGE")` → false면 403 "메시지 관리 권한이 필요합니다.".
- **tenant_id**: `currentUser.getTenantId()` null/trim 빈값이면 403 "테넌트 정보가 없습니다.".
- **예외**: try 내부에서 `getAllMessages()` 또는 스트림 변환 중 예외 시 **403** 반환, body: "메시지 목록을 조회할 수 없습니다. " + `e.getMessage()` (161–162행). **500이 아님.** finally에서 `TenantContextHolder.clear()`.
- **서비스**: `ConsultationMessageServiceImpl.getAllMessages()`는 `TenantContextHolder.getRequiredTenantId()` 사용. 컨트롤러에서 이미 set하므로 정상 흐름에서는 tenant 있음. 미설정이면 여기서 예외 → 컨트롤러 catch → 403.

### GET /api/v1/consultation-messages/{messageId} (상세)
- **권한/세션/tenant**: **검사 없음** (메서드 시그니처에 `HttpSession` 없음).
- **예외**: `consultationMessageService.getById(messageId)`가 null이면 `RuntimeException("메시지를 찾을 수 없습니다.")` (335–336행) → `GlobalExceptionHandler.handleRuntime()` → **500** + 해당 메시지. `markAsRead` 등에서 발생한 예외도 500.

### GlobalExceptionHandler에서 메시지 관련 처리
- **RuntimeException**: `handleRuntime()` → 500, body에 예외 메시지 또는 "서버 내부 오류가 발생했습니다." (`GlobalExceptionHandler.java` 216–245행).
- **AccessDeniedException**: 403, "접근 권한이 없습니다." 또는 예외 메시지.
- **Exception**: 500, "예상치 못한 오류가 발생했습니다.".
- **로그**: RuntimeException은 `log.error("Runtime error occurred: {}", e.getMessage(), e)` 로 **스택 트레이스** 출력.

### 로그에 남을 수 있는 메시지
- 목록: `"📨 전체 메시지 목록 조회 (관리자)"`, `"⚠️ 권한 없음 - 사용자 ID: ..., 역할: ..., 권한: MESSAGE_MANAGE"`, `"⚠️ 테넌트 정보 없음 - 사용자 ID: ..."`, `"전체 메시지 조회 실패 - 사용자 ID: ..., error: ..."` (스택 포함).
- 상세: `"📨 메시지 상세 조회 시작 - 메시지 ID: ..."`, `"❌ 메시지를 찾을 수 없음 - 메시지 ID: ..."`, `"Runtime error occurred: ..."`.

---

## 4. 가능 원인 정리

- **(a) 권한**: `role_permissions`에 현재 사용자 역할(예: ADMIN, STAFF)에 대한 `MESSAGE_MANAGE` 행이 없거나 `is_active` 비활성 → 403 "메시지 관리 권한이 필요합니다." DB/마이그레이션: `V20260227_002__ensure_admin_staff_notification_message_permissions.sql`, `V20260213_001__admin_staff_notification_message_permissions.sql` 등에서 ADMIN/STAFF에 MESSAGE_MANAGE 부여. 적용 여부 확인 필요.
- **(b) tenant_id**: 로그인 사용자 엔티티의 `tenant_id`가 null 또는 빈 문자열 → 403 "테넌트 정보가 없습니다." 세션에 담긴 User의 tenantId 설정 경로 확인.
- **(c) DB/쿼리 예외**: `getAllMessages()` 또는 `getUserName()` 등에서 NPE/DB 예외 → 컨트롤러 catch에서 **403** + "메시지 목록을 조회할 수 없습니다. " + 메시지. 서버 로그에 스택 트레이스.
- **(d) API·응답 불일치**: **프론트가 성공 응답을 실패로 해석**. `apiGet`이 `data`만 반환하는데 컴포넌트가 `response.success`/`response.data`를 보면 성공 시에도 빈 목록 + 실패 토스트.
- **(e) 기타 500**: 상세 API에서 메시지 없음 → RuntimeException → 500. 또는 기타 비검사 예외 → 로그 스택으로 특정.

---

## 5. 재현 절차

1. 관리자(또는 메시지 관리 권한 기대 역할)로 로그인.
2. **메시지 관리** 메뉴로 이동 (`/admin/messages`).
3. **목록 오류**: 페이지 로드 시 "메시지 목록을 불러오는데 실패했습니다" 또는 빈 목록만 보임 (API는 200일 수 있음).
4. **상세 오류**: 목록에서 메시지 카드 클릭 시 상세 모달이 안 뜨거나, "서버 오류가 발생했습니다" 등 500 메시지.
5. 브라우저 개발자 도구 **Network**: `consultation-messages/all`, `consultation-messages/{id}` 요청의 **상태 코드(403/500)** 와 **응답 body(message, errorCode)** 확인.
6. 서버 로그에서 `consultation-messages`, `MESSAGE_MANAGE`, `전체 메시지 조회 실패`, `Runtime error occurred` 등으로 위 경로·예외 확인.

---

## 6. 수정 제안(체크리스트) — core-coder 위임용

### 프론트엔드 (AdminMessages.js)
- [ ] **목록 응답 처리**: `apiGet`이 성공 시 **배열(data)**만 반환하므로, 목록은 `response`가 배열인지로 성공 판단. 예: `const list = Array.isArray(response) ? response : []; setMessages(list);` 로 설정하고, `response.success` / `response.data` 의존 제거. (또는 `apiGet`이 전체 `ApiResponse`를 반환하도록 옵션을 두고, 해당 API만 전체 응답을 쓰도록 변경.)
- [ ] **상세 응답 처리**: 상세도 `apiGet`이 `data`만 반환하므로, `setSelectedMessage(response)` 시 `response`가 이미 상세 객체임. `response.success` 체크 제거 또는 배열이 아닌 객체인지로 성공 판단.
- [ ] 에러 시 사용자 메시지: 403/500 시 서버 `message`가 오면 그대로 표시하는지는 이미 catch에서 `err.message`로 처리 중이므로 유지. 필요 시 `err.response?.data?.message` 등으로 서버 메시지 우선 사용 검토.

### 백엔드 (ConsultationMessageController)
- [ ] **GET /{messageId}**: 관리자 화면에서 호출되므로, **세션·권한·tenantId** 검사 추가 권장. 예: `HttpSession` 주입, `SessionUtils.getCurrentUser(session)` null 체크, `MESSAGE_MANAGE` 권한 및 `tenantId` 확인 후 `TenantContextHolder.setTenantId(tenantId)` 설정한 뒤 서비스 호출. 다른 tenant 메시지 노출 방지.
- [ ] **목록 API 예외 시 HTTP 상태**: 현재 try 내 예외 시 403 반환. 비즈니스/권한 오류는 403, DB/시스템 오류는 500으로 구분해 반환하도록 검토 (선택).
- [ ] 로그: 이미 "전체 메시지 조회 실패" 시 스택 출력됨. 유지.

### DB/권한
- [ ] `role_permissions`에 ADMIN/STAFF 등 해당 역할에 `MESSAGE_MANAGE` 존재·활성 여부 확인. 마이그레이션 미적용 시 `V20260227_002` 또는 동등 스크립트 실행.
- [ ] 로그인 사용자 `tenant_id`가 세션/엔티티에 설정되는지 확인 (로그인/세션 설정 코드).

### 체크리스트 (수정 후 확인)
- [ ] 메시지 관리 화면 접속 후 목록이 200 응답 시 정상 표시되는지.
- [ ] 403 시 "메시지 관리 권한이 필요합니다." 또는 "테넌트 정보가 없습니다." 등 서버 메시지가 토스트로 표시되는지.
- [ ] 메시지 카드 클릭 시 상세 모달이 뜨고, 500이 발생하지 않는지.
- [ ] 서버 로그에 불필요한 스택 트레이스가 남지 않는지(정상 200 시).

---

## 7. 서버 로그 확인용 명령·키워드

- **로그 파일** (프로젝트/서버 설정에 따라): `build/logs/application.log`, `logs/application.log`, 또는 `journalctl -u <서비스명>`.
- **명령 예시** (위치에 맞게 경로 수정):
  - `tail -n 300 build/logs/application.log`
  - `grep -E "consultation-messages|MESSAGE_MANAGE|전체 메시지|메시지 조회 실패|Runtime error occurred|ConsultationMessageController" build/logs/application.log`
  - `grep -E "403|500|Exception|테넌트 정보 없음|권한 없음" build/logs/application.log`
- **키워드**: `consultation-messages`, `MESSAGE_MANAGE`, `전체 메시지 조회`, `메시지 조회 실패`, `Runtime error occurred`, `ConsultationMessageController`, `테넌트 정보 없음`, `권한 없음`, `403`, `500`, `Exception`.

---

## 8. 메시지 테이블 tenant_id 없이 조회하는 경로

**확인 결과: 메시지 테이블을 tenant_id 없이 조회하는 경로가 있습니다.**

### 목록 조회 (GET /all) — ✅ tenant_id 사용
- 컨트롤러에서 `currentUser.getTenantId()` 검사 후 `TenantContextHolder.setTenantId(tenantId)` 설정.
- 서비스 `getAllMessages()` → `TenantContextHolder.getRequiredTenantId()` → `findAllByTenant(tenantId, null)` → `ConsultationMessageRepository.findByTenantId(tenantId)`.
- **모든 목록용 쿼리는 `WHERE m.tenantId = :tenantId` 조건 포함.**

### 단건 조회 (GET /{messageId}) — ❌ tenant_id 없이 조회
- **컨트롤러**: `ConsultationMessageController.getMessage(messageId)` — 세션·권한·tenantId 검사 없이 `consultationMessageService.getById(messageId)` 호출.
- **서비스**: `ConsultationMessageServiceImpl.getById(Long id)` → `consultationMessageRepository.findById(id).orElse(null)`.
- **Repository**: `findById(id)` 는 Spring Data JPA 기본 메서드로 **PK만 조건**, **tenant_id 조건 없음**.
- **결과**: 다른 테넌트 메시지도 id만 알면 조회 가능(다테넌트 데이터 유출 가능성).

### 메시지 읽음 처리 (markAsRead) — ❌ tenant_id 없이 조회
- **서비스**: `ConsultationMessageServiceImpl.markAsRead(Long messageId)` → `consultationMessageRepository.findById(messageId)` 로 조회 후 읽음 처리.
- **동일하게 tenant_id 필터 없음.**

### 기타 서비스 내 findById 사용처
- `findEntityById(id)` (BaseTenantEntityServiceImpl): `consultationMessageRepository.findById(id)` — tenant 없음.
- 부분 업데이트/삭제/복원 등 내부에서 `findById(id)` 사용하는 경로는 모두 tenant_id 없이 조회함. (단, `findActiveById` / `findByIdAndTenant` 를 쓰는 경로는 tenant 사용.)

### 수정 제안 (core-coder 위임)
- **GET /{messageId}**: 현재 사용자 tenantId 검사 후 `TenantContextHolder.setTenantId(tenantId)` 설정하고, `getById(messageId)` 대신 **tenant 기준 조회** 사용 (예: `findActiveById(messageId)` 또는 `findByIdAndTenant(tenantId, messageId).orElseThrow(...)`). 권한 MESSAGE_MANAGE 또는 본인 소유 메시지 여부 검사 추가 권장.
- **markAsRead**: tenant 설정 후 `findByIdAndTenant(tenantId, messageId)` 또는 `findActiveById(messageId)` 사용하도록 변경.
- **getById(Long id)** 를 컨트롤러에서 직접 호출하지 않고, **tenant 컨텍스트가 설정된 상태에서 findActiveById(id)** 사용하도록 API 경로 정리.

---

## 9. 참조

- 프론트: `frontend/src/components/admin/AdminMessages.js`, `frontend/src/utils/ajax.js`, `frontend/src/constants/api.js` (API_STATUS, API_ERROR_MESSAGES).
- 백엔드: `ConsultationMessageController.java`, `ConsultationMessageServiceImpl.java`, `GlobalExceptionHandler.java`, `BaseApiController.java`.
- 권한: `DynamicPermissionServiceImpl.java`, `V20260227_002__ensure_admin_staff_notification_message_permissions.sql`, `V20260213_001__admin_staff_notification_message_permissions.sql`.
- 표준: `docs/standards/ERROR_HANDLING_STANDARD.md`, `docs/standards/LOGGING_STANDARD.md`, `docs/standards/API_INTEGRATION_STANDARD.md`.
