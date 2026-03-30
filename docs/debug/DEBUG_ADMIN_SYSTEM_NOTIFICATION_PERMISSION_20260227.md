# 관리자 공지 화면 "권한이 필요하다" 문제 — 원인 분석

**작성일**: 2026-02-27  
**담당**: core-debugger  
**상태**: 분석 완료, 수정은 core-coder 위임

---

## 목차

1. [원인 분석 요약](#1-원인-분석-요약)
2. [프론트엔드 — 공지 화면 접근 시 호출 API 및 403 처리](#2-프론트엔드--공지-화면-접근-시-호출-api-및-403-처리)
3. [백엔드 — 시스템 공지 목록 API 권한 검사](#3-백엔드--시스템-공지-목록-api-권한-검사)
4. [DB 확인용 SQL 및 확인 방법](#4-db-확인용-sql-및-확인-방법)
5. [가능 원인 정리](#5-가능-원인-정리)
6. [재현 절차](#6-재현-절차)
7. [수정 제안 (체크리스트) — core-coder 위임용](#7-수정-제안-체크리스트--core-coder-위임용)
8. [core-coder용 태스크 설명 초안](#8-core-coder용-태스크-설명-초안)
9. [참조](#9-참조)

---

## 1. 원인 분석 요약

### 증상
- 관리자(admin) 계정으로 로그인했는데 **공지 화면**(`/admin/system-notifications`)에서 **"접근 권한이 없습니다. 시스템 공지 관리 권한이 필요합니다."** 메시지가 표시됨.

### 추적 경로
1. **프론트**: `SystemNotificationManagement.js` 마운트 시 `loadPermissions()` → `fetchUserPermissions()` → `GET /api/v1/permissions/my-permissions` 호출. 응답의 `permissions` 배열로 `userPermissions` 상태 설정. 이후 `hasManagePermission()` = `checkPermission(userPermissions, 'SYSTEM_NOTIFICATION_MANAGE')` 로 판단. **이 값이 false이면** "접근 권한이 없습니다" 블록을 렌더링함.
2. **백엔드**: 공지 목록 API `GET /api/v1/system-notifications/admin/all` 은 `hasAdminPermission(session)` → `DynamicPermissionServiceImpl.hasPermission(currentUser, "SYSTEM_NOTIFICATION_MANAGE")` 로 검사. `currentUser` 는 `SessionUtils.getCurrentUser(session)` 에서, 권한은 **role_permissions 테이블만** 참조 (`findByRoleNameAndPermissionCodeAndIsActiveTrue(roleName, permissionCode)`). 기본 권한 폴백 없음.
3. **결론**: "권한이 필요하다" 메시지는 **프론트엔드의 클라이언트 권한 체크**에서만 나옴. 즉, `GET /api/v1/permissions/my-permissions` 가 200을 반환하더라도 **반환된 `permissions` 배열에 `SYSTEM_NOTIFICATION_MANAGE`가 없으면** 해당 메시지가 뜸. 또는 my-permissions 호출이 실패(403/에러)해 `userPermissions` 가 빈 배열이면 동일.

### 근본 원인 후보 (가설)
- **(a)** `role_permissions` 에 `role_name = 'ADMIN'` 이고 `permission_code = 'SYSTEM_NOTIFICATION_MANAGE'` 인 행이 **없거나** `is_active = 0` (또는 false).
- **(b)** 로그인 사용자의 **role** 이 `ADMIN` 이 아님 (다른 값 저장 또는 세션/엔티티 불일치).
- **(c)** 백엔드 **캐시** (`userPermissions`, key: `roleName + '_' + permissionCode`): 이전에 false 로 캐시된 값이 남아 있음.
- **(d)** **권한 코드 불일치**: 프론트/백엔드 모두 `SYSTEM_NOTIFICATION_MANAGE` 를 사용하고 있어 코드 상 불일치는 없음. DB에만 해당 코드 행이 없을 가능성.

---

## 2. 프론트엔드 — 공지 화면 접근 시 호출 API 및 403 처리

### 호출 순서
1. **권한 로드** (마운트 시 1회)  
   - **API**: `GET /api/v1/permissions/my-permissions`  
   - **코드 경로**: `SystemNotificationManagement.js` → `useEffect` 내 `loadPermissions()` → `fetchUserPermissions(setUserPermissions)` → `permissionUtils.js` 의 `apiGet('/api/v1/permissions/my-permissions')`  
   - **응답 사용**: `response.permissions` (문자열 배열) → `setUserPermissions(permissions)`.  
   - **403 시**: `ajax.js` 의 `apiGet` 이 403이면 `jsonData.message` 또는 "접근 권한이 없습니다." 로 `Error` 를 throw. `fetchUserPermissions` 의 catch에서 `setUserPermissions([])` 호출 → **권한 없음으로 간주되어 "접근 권한이 없습니다" 표시.**

2. **공지 목록 로드** (권한 있을 때만)  
   - **API**: `GET /api/v1/system-notifications/admin/all?targetType=...&status=...&page=0&size=50`  
   - **코드 경로**: `SystemNotificationManagement.js` → `loadNotifications()` → `apiGet(\`/api/v1/system-notifications/admin/all?${params}\`)`  
   - **403 시**: 동일하게 `ajax.js` 에서 `Error` throw (message = 서버 `message` 또는 "접근 권한이 없습니다."), `loadNotifications` 의 catch에서 `notificationManager.show(message, 'error')` 로 토스트 표시.

### 403 확인이 가능한 코드 경로
- **URL**: `frontend/src/utils/ajax.js` — `apiGet()` 내부, `if (response.status === 403)` (약 216–223행).  
- **응답 코드**: `response.status`  
- **응답 body**: `jsonData` (이미 파싱된 JSON). `Error` 객체에 `error.response = { data: jsonData }` 로 보관됨.  
- **실제 403 발생 위치**: 백엔드 `SystemNotificationController.hasAdminPermission()` 이 false일 때 `AccessDeniedException` → `GlobalExceptionHandler.handleAccessDenied()` → HTTP 403 + body에 `message`, `errorCode: "ACCESS_DENIED"` 등.

---

## 3. 백엔드 — 시스템 공지 목록 API 권한 검사

### API
- **경로**: `GET /api/v1/system-notifications/admin/all`  
- **컨트롤러**: `SystemNotificationController.java`  
- **메서드**: `getAllNotificationsForAdmin()` (약 320–363행).

### 권한 검사 흐름
1. `getAllNotificationsForAdmin()` 진입 시 `hasAdminPermission(session)` 호출 (328행).  
2. `hasAdminPermission(session)` (49–58행):  
   - `User currentUser = SessionUtils.getCurrentUser(session);`  
   - `return dynamicPermissionService.hasPermission(currentUser, "SYSTEM_NOTIFICATION_MANAGE");`  
3. **Permission code**: `"SYSTEM_NOTIFICATION_MANAGE"` (고정).  
4. **현재 사용자 role**: `currentUser.getRole().name()` (예: `"ADMIN"`). `DynamicPermissionServiceImpl.hasPermission(User, String)` (39–46행)에서 `user.getRole().name()` 으로 role 이름 전달.

### DynamicPermissionServiceImpl.hasPermission(String roleName, String permissionCode)
- **파일**: `DynamicPermissionServiceImpl.java` (50–85행).  
- **역할/권한 출처**:  
  - **roleName**: 호출부에서 전달된 `user.getRole().name()` (세션 사용자 엔티티의 `User.role`).  
  - **permissionCode**: `"SYSTEM_NOTIFICATION_MANAGE"`.  
- **검사 방식**: `LegacyRolePermissionRepository.findByRoleNameAndPermissionCodeAndIsActiveTrue(roleName, permissionCode)` 로 **role_permissions 테이블만** 조회. 존재하면 true, 없으면 false.  
- **캐시**: `@Cacheable(value = "userPermissions", key = "#roleName + '_' + #permissionCode")` — 한 번 false가 캐시되면 캐시 제거 전까지 계속 false.

---

## 4. DB 확인용 SQL 및 확인 방법

### 확인 SQL
```sql
-- ADMIN 역할에 SYSTEM_NOTIFICATION_MANAGE 권한이 is_active = 1(TRUE)로 존재하는지
SELECT id, role_name, permission_code, is_active, granted_by, created_at, updated_at
FROM role_permissions
WHERE role_name = 'ADMIN'
  AND permission_code = 'SYSTEM_NOTIFICATION_MANAGE'
  AND (is_active = 1 OR is_active = TRUE);

-- 행이 0건이면 원인 (a) 가능성 높음.
-- is_active가 0/false인 행만 있으면, 해당 행이 비활성화된 상태.
```

### 마이그레이션
- **V20260213_001**: `role_permissions` 에 `ADMIN` / `STAFF` 에 대해 `SYSTEM_NOTIFICATION_MANAGE`, `MESSAGE_MANAGE`, `MESSAGE_VIEW` 없을 때만 INSERT (`is_active = TRUE`).  
- **V20260214_001**: `role_name NOT IN ('ADMIN','STAFF','CONSULTANT','CLIENT')` 인 행만 DELETE. ADMIN 행은 삭제하지 않음.  
- **V20260227_002** (보정용): permissions 없으면 등록, role_permissions에 ADMIN/STAFF 해당 3권한 없으면 INSERT, `is_active=0` 이면 활성화. idempotent.  
- 따라서 V20260213 적용 후 V20260214 적용되면, 위 SELECT 로 **최소 1건** 나와야 함. 누락 시 V20260227_002 적용으로 보정.

### 실제 존재 여부 확인
- 프로젝트 내에서 DB를 직접 쿼리하는 스크립트는 확인하지 않았음.  
- **shell 서브에이전트** 또는 운영 DB 접속 도구로 위 SQL 실행 권장.  
- Flyway 이력: `flyway_schema_history` 에서 `V20260213_001`, `V20260214_001` 적용 여부 확인 가능.

---

## 5. 가능 원인 정리

| 원인 | 설명 | 확인 방법 |
|------|------|-----------|
| **(a) DB에 해당 행 없음** | 마이그레이션 미적용 또는 삭제로 `role_permissions` 에 ADMIN + SYSTEM_NOTIFICATION_MANAGE + is_active=1 행 없음 | 위 4번 SQL 실행, Flyway 이력 확인 |
| **(b) 로그인 사용자 role이 'ADMIN'이 아님** | 세션/User 엔티티의 role이 다른 값(예: STAFF, null)으로 저장·로드됨 | 백엔드 로그 "권한 체크 시작: 역할=..., 권한=SYSTEM_NOTIFICATION_MANAGE", my-permissions 응답의 userRole 확인 |
| **(c) 캐시(userPermissions)에 이전 false 유지** | 이전에 권한이 없을 때 false가 캐시된 뒤, DB/마이그레이션으로 권한 추가해도 캐시 미갱신 | 서버 재기동 또는 `DynamicPermissionService.clearPermissionCache()` 호출 후 재현 |
| **(d) permission code 불일치** | 코드 상으로는 프론트·백엔드 모두 `SYSTEM_NOTIFICATION_MANAGE` 사용. DB에만 코드가 다르게 들어간 경우는 드묾 | permissions 테이블에 `permission_code = 'SYSTEM_NOTIFICATION_MANAGE'` 존재 여부 확인 |

---

## 6. 재현 절차

1. 관리자 계정으로 로그인.  
2. `/admin/system-notifications` 로 이동 (시스템 공지 관리 메뉴 클릭).  
3. **확인**: "권한을 확인하는 중..." 다음에 "접근 권한이 없습니다. 시스템 공지 관리 권한이 필요합니다." 가 나오는지.  
4. (선택) 브라우저 개발자 도구 Network 탭에서:  
   - `my-permissions` 요청: 상태 코드 200/403, 응답 body 의 `permissions` 배열에 `SYSTEM_NOTIFICATION_MANAGE` 포함 여부.  
   - `system-notifications/admin/all` 요청: 403 여부 및 응답 body.

---

## 7. 수정 제안 (체크리스트) — core-coder 위임용

코드 수정은 하지 않고, core-coder가 적용할 수 있도록 제안만 정리.

### DB/환경
- [ ] 위 **4번 SQL** 실행하여 `role_permissions` 에 `ADMIN` + `SYSTEM_NOTIFICATION_MANAGE` + `is_active = 1` 행 존재 여부 확인.  
- [ ] 없으면: V20260213 적용 여부 확인 후, 필요 시 동일 내용의 INSERT 수행 또는 Flyway 재실행/수동 보정.  
- [ ] Flyway 이력에서 V20260213, V20260214 적용 여부 확인.

### 백엔드
- [ ] **캐시**: 권한 추가/변경 후 캐시 초기화가 필요하면, 관리자용 API 또는 배포 후 재기동으로 `userPermissions` 캐시 제거. (이미 `grantPermission`/`revokePermission`/`setRolePermissions` 등에서 `@CacheEvict` 사용 중이면, DB 보정 후 재기동으로 충분할 수 있음.)  
- [ ] **로깅**: `DynamicPermissionServiceImpl.hasPermission()` 의 "권한 체크 시작/결과" 로그로 실제 요청 시 `roleName`/`permissionCode`/결과 확인 가능. 문제 재현 시 해당 로그 수집.

### 프론트엔드
- [ ] **동작 변경 없이** 디버깅용: `SystemNotificationManagement.js` 또는 `permissionUtils.js` 에서 `my-permissions` 응답과 `userPermissions` 상태를 일시적으로 콘솔에 출력해, 403 여부 및 `permissions` 배열 내용 확인.  
- [ ] 403이 my-permissions에서 발생하면: 백엔드 원인(세션 사용자 없음, role_permissions 없음, 캐시) 우선 해결.  
- [ ] 200이지만 `permissions`에 `SYSTEM_NOTIFICATION_MANAGE`가 없으면: 백엔드 `getUserPermissionsAsStringList`/`getRolePermissions` 및 DB 데이터 확인.

### 권한 캐시 초기화 (DB 보정 후)
- **서버 재기동**: Flyway 적용 후 재기동하면 `userPermissions` / `userPermissionsList` / `rolePermissions` 캐시가 비워짐.
- **관리자 API**: `SystemToolsController.clearPermissionCache()` → `DynamicPermissionService.clearPermissionCache()` 호출로 캐시 초기화 가능 (엔드포인트는 프로젝트 내 SystemToolsController 참고).
- **자동 evict**: `grantPermission` / `revokePermission` / `setRolePermissions` 호출 시 `@CacheEvict`로 자동 클리어됨. 마이그레이션으로만 INSERT한 경우에는 해당 메서드가 호출되지 않으므로 **재기동** 또는 **clearPermissionCache API** 사용 권장.

### 수정 후 검증
- [ ] 관리자로 로그인 후 `/admin/system-notifications` 접속 시 "접근 권한이 없습니다" 미표시.  
- [ ] `GET /api/v1/permissions/my-permissions` 응답의 `permissions` 배열에 `SYSTEM_NOTIFICATION_MANAGE` 포함.  
- [ ] `GET /api/v1/system-notifications/admin/all` 200 응답으로 공지 목록 정상 로드.

---

## 8. core-coder용 태스크 설명 초안

```
관리자 공지 화면에서 "권한이 필요하다"가 나오는 문제 수정.

- 원인: docs/debug/DEBUG_ADMIN_SYSTEM_NOTIFICATION_PERMISSION_20260227.md 참고.
- 우선 DB에서 role_permissions에 ADMIN + SYSTEM_NOTIFICATION_MANAGE + is_active=1 행 존재 여부 확인.
- 없으면 V20260213 내용에 맞게 INSERT 또는 마이그레이션 적용.
- 백엔드 권한 캐시(userPermissions)가 원인일 수 있으므로, DB 보정 후 서버 재기동 또는 clearPermissionCache 호출로 검증.
- 프론트는 권한/403 디버깅용 로그 추가만 필요 시 적용하고, 실제 동작 변경은 하지 않아도 됨.
```

---

## 9. 참조

- **문서 인덱스**: [docs/README.md](../README.md)
- **디버깅 문서 목록**: [docs/debug/README.md](./README.md)
- **서브에이전트(디버그·문서 전담)**: [docs/standards/SUBAGENT_USAGE.md](../standards/SUBAGENT_USAGE.md)
- **장애 대응·체크리스트**: [docs/troubleshooting/](../troubleshooting/)
