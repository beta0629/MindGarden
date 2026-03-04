# 스태프(STAFF) 계정 생성 갭 분석

**작성일**: 2026-03-05  
**작성자**: core-debugger  
**목적**: 온보딩 계정과 스태프 계정 생성 경로 분석 및 갭 정리. 코드 수정 없이 원인·제안만 문서화.

---

## 1. 온보딩 흐름에서의 역할 설정

### 1.1 백엔드·DB

| 구분 | 위치 | 역할 |
|------|------|------|
| **프로시저** | `database/schema/create_tenant_admin_account_procedure.sql` | `CreateTenantAdminAccount`: `users.role = 'ADMIN'` 으로 **관리자 1명만** 생성 |
| **마이그레이션** | `V20251202_018__simplify_onboarding_approval_procedure.sql` 등 | 승인 시 `CreateTenantAdminAccount` 호출 → 동일하게 **ADMIN 1명** 생성 |
| **Java** | `OnboardingServiceImpl` | 테넌트 초기화 시 **역할 코드(ROLE)** 에만 ADMIN/CONSULTANT/CLIENT/**STAFF** 공통코드 삽입. **실제 사용자 생성은 프로시저에서만** 이루어짐 |

**결론**: 온보딩(회원가입/테넌트 등록·승인) 시 **생성되는 계정은 ADMIN 1개뿐**이다. STAFF/CONSULTANT/CLIENT는 해당 흐름에서 생성되지 않는다.

### 1.2 프론트엔드

- 온보딩 UI는 테넌트·연락처·비밀번호 등만 입력하고, **역할을 선택하는 필드는 없음**.
- 역할은 백엔드/프로시저에서 고정값 `ADMIN`으로 설정됨.

---

## 2. 스태프(STAFF) 계정 생성·역할 변경 경로 조사

### 2.1 백엔드 API

| API | 역할 | STAFF 지원 |
|-----|------|------------|
| `PUT /api/v1/admin/user-management/{userId}/role?newRole=STAFF` | 관리자 전용 역할 변경 | **지원** (Controller에서 `UserRole.fromString(newRole)` 후 `user.setRole(role)` 저장. `UserProfileService` 경유 없음) |
| `GET /api/v1/admin/user-management/roles` | 사용 가능 역할 목록 | **지원** (`UserRole.getAllRoles()` → ADMIN, CONSULTANT, CLIENT, **STAFF** 포함) |
| `GET /api/v1/admin/user-management` | 전체 사용자 목록 | **지원** (응답에 `role` 포함. STAFF 사용자도 조회 가능) |

**참고**: `UserProfileService.changeUserRole()` 내부의 `isValidRoleTransition()`에는 **STAFF로의 전환이 정의되어 있지 않다** (CLIENT→CONSULTANT/ADMIN, CONSULTANT→ADMIN, ADMIN→ADMIN만 허용).  
하지만 **현재 노출된 역할 변경 API**인 `AdminUserController.changeUserRole`은 `UserProfileService`를 타지 않고 직접 `user.setRole()` 후 저장하므로, **API로는 STAFF로 변경 가능**하다.

### 2.2 사용자 관리 페이지 (`/admin/user-management`)

- **라우트**: `App.js` → `/admin/user-management` → **`UserManagementPage`** 렌더링.
- **UI 구성**:  
  - **Pill 탭 2개**: 「상담사」「내담자」만 존재.  
  - 상담사 탭 → `ConsultantComprehensiveManagement` (상담사 목록·등록·수정 등).  
  - 내담자 탭 → `ClientComprehensiveManagement` (내담자 목록·등록·수정 등).
- **역할 변경/스태프 관련**  
  - 두 컴포넌트 모두 **역할을 “스태프”로 설정·변경하는 UI 없음**.  
  - 「스태프」전용 탭·필터·등록 폼 없음.

**결론**: **현재 사용자 관리 페이지에서는 스태프를 “생성”하거나 “역할을 스태프로 변경”하는 진입점이 없다.**

### 2.3 `UserManagement.js` (역할 변경 UI 포함)

- **역할 옵션**: `USER_ROLES.ADMIN`, `USER_ROLES.STAFF`, `USER_ROLES.CONSULTANT`, `USER_ROLES.CLIENT` 포함.  
  역할 변경 모달에서 **사무원(STAFF)** 선택 가능한 구조.
- **실제 사용 여부**:  
  - **어디에서도 import되지 않음** (`App.js`는 `UserManagementPage`만 사용).  
  - 따라서 **현재 라우팅으로는 이 화면에 접근할 수 없음**.
- **API 경로 불일치**  
  - 사용자 목록: `fetch('/api/admin/users?includeInactive=...')`  
  - 역할 목록: `fetch('/api/v1/admin/users/roles')`  
  - 역할 변경: `csrfTokenManager.put('/api/admin/users/${id}/role?newRole=...')`  
  - 표준 경로는 ` /api/v1/admin/user-management` 및 ` /api/v1/admin/user-management/roles`,  
    `PUT .../user-management/{userId}/role?newRole=...` 이므로, **이 컴포넌트를 쓰더라도 API 경로 수정 필요**.

### 2.4 그 외 어드민 메뉴

- **공통코드**: ROLE 그룹에 STAFF 코드가 있음 (Onboarding 시 초기화). “스태프 계정 생성” 기능은 없음.
- **권한/메뉴 권한 관리**: STAFF 역할에 대한 권한 설정은 있으나, **“스태프 사용자 추가”** 기능은 사용자 관리와 별도로 존재하지 않음.

---

## 3. 갭 분석 요약

| 구분 | 내용 |
|------|------|
| **온보딩** | ADMIN 1명만 생성. STAFF 생성 경로 없음. |
| **사용자 관리 페이지** | 상담사/내담자만 탭으로 노출. 스태프 탭·스태프로 역할 변경·스태프 신규 등록 UI 없음. |
| **역할 변경 API** | 백엔드는 `PUT .../user-management/{userId}/role?newRole=STAFF` 로 STAFF 변경 가능. |
| **전체 사용자 목록** | API로는 STAFF 포함 조회 가능하나, 현재 페이지는 상담사/내담자 필터만 있어 스태프를 목적별로 다루기 어려움. |
| **실질적 갭** | **“온보딩으로 등록된 계정(ADMIN)”과 “스태프 계정을 만들거나 기존 사용자를 스태프로 바꾸는 UI”가 연결되어 있지 않음.** 어드민이 할 수 있는 것은 상담사/내담자 관리뿐이고, 스태프 생성·역할 변경은 UI가 없음. |

---

## 4. 수정 제안 (core-coder용)

아래는 구현 담당(core-coder)이 수정 시 참고할 제안·체크리스트이다. 코드 수정은 core-coder에 위임.

### 4.1 옵션 A: 사용자 관리 페이지에 “스태프” 경로 추가

- **대상**: `frontend/src/components/admin/UserManagementPage.js`, 필요 시 공통 레이아웃/메뉴.
- **제안**  
  - Pill 탭에 **「스태프」(또는 「사무원」)** 추가.  
  - 스태프 탭에서:  
    - 스태프 목록 조회 (기존 `GET /api/v1/admin/user-management` + role=STAFF 필터 또는 백엔드 필터 파라미터).  
    - 기존 사용자 역할을 STAFF로 변경 (호출: `PUT /api/v1/admin/user-management/{userId}/role?newRole=STAFF`).  
  - “스태프 신규 등록”이 필요하면:  
    - 내담자/상담사와 유사한 “사무원 등록” 폼 추가 검토 (백엔드에 STAFF 생성 API 필요 여부 확인).
- **체크리스트**  
  - [ ] Pill에 스태프 탭 추가.  
  - [ ] 스태프 목록 표시 (API·필터 연동).  
  - [ ] 역할 변경 버튼/모달에서 STAFF 선택 시 `PUT .../role?newRole=STAFF` 호출.  
  - [ ] 필요 시 스태프 전용 등록 폼 및 API 연동.

### 4.2 옵션 B: 기존 “전체 사용자+역할 변경” 화면 재사용

- **대상**: `frontend/src/components/admin/UserManagement.js`.
- **제안**  
  - `UserManagement.js`를 라우트에 노출 (예: `/admin/user-management?view=all` 또는 별도 경로 `/admin/users`).  
  - API 경로를 표준으로 통일:  
    - 사용자 목록: `GET /api/v1/admin/user-management?includeInactive=...`  
    - 역할 목록: `GET /api/v1/admin/user-management/roles`  
    - 역할 변경: `PUT /api/v1/admin/user-management/{userId}/role?newRole=...`  
  - 이미 STAFF가 roleOptions에 있으므로, 경로만 맞추면 “역할 변경”으로 STAFF 지정 가능.
- **체크리스트**  
  - [ ] `UserManagement.js`를 노출할 라우트 결정 및 `App.js` 반영.  
  - [ ] 위 세 API 경로를 표준 경로로 수정.  
  - [ ] 역할 필터에 STAFF 포함 여부 확인.  
  - [ ] LNB/메뉴에서 “사용자 관리(전체/역할 변경)” 진입점 확인.

### 4.3 백엔드·정책 (선택)

- **UserRoleAssignment(tenant_roles) 동기화**  
  - `AdminUserController.changeUserRole`은 `users.role`만 변경하고, `user_role_assignments` 갱신은 하지 않음.  
  - 역할 기반 메뉴/권한이 `user_role_assignments`를 사용한다면, 역할 변경 시 해당 테이블도 갱신하도록 서비스 레이어 확장 검토 (파일: `AdminUserController`, `AdminServiceImpl` 또는 전용 서비스).  
- **UserProfileServiceImpl.isValidRoleTransition**  
  - 현재 STAFF로의 전환이 없어, 다른 진입점에서 `UserProfileService.changeUserRole`을 호출하면 STAFF 변경이 거부됨.  
  - 정책상 “관리자만 역할 변경”으로 통일한다면 유지해도 되고, “일부 역할이 STAFF로 변경 가능”해야 하면 STAFF 전환 규칙 추가 검토.

---

## 5. 재현 절차 (갭 확인용)

1. 어드민으로 로그인.
2. 사용자 관리(`/admin/user-management`) 이동.
3. 확인: 상담사/내담자 탭만 있고, **스태프 목록·스태프로 역할 변경·스태프 등록** 버튼/탭이 없음.
4. (참고) API로 직접 `PUT /api/v1/admin/user-management/{userId}/role?newRole=STAFF` 호출 시 `users.role`은 STAFF로 변경됨 → 백엔드는 지원, UI만 없음.

---

## 6. 참조

- 역할 enum: `src/main/java/com/coresolution/consultation/constant/UserRole.java` (ADMIN, STAFF, CONSULTANT, CLIENT).
- 사용자 관리 API: `src/main/java/com/coresolution/consultation/controller/AdminUserController.java`.
- 사용자 관리 페이지: `frontend/src/components/admin/UserManagementPage.js`, `ConsultantComprehensiveManagement.js`, `ClientComprehensiveManagement.js`.
- 역할 변경(미노출) UI: `frontend/src/components/admin/UserManagement.js`.
- 온보딩 관리자 생성: `database/schema/create_tenant_admin_account_procedure.sql`, `OnboardingServiceImpl`.
