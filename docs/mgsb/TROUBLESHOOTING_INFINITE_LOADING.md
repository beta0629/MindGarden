# 무한 로딩 문제 해결 가이드

## 1. 개요

이 문서는 MindGarden (현재 CoreSolution) 애플리케이션에서 로그인 후 또는 특정 대시보드 접근 시 발생하는 무한 로딩 문제를 진단하고 해결하기 위한 단계별 가이드라인을 제공합니다. 프론트엔드와 백엔드 양측에서 발생할 수 있는 잠재적 원인을 체계적으로 분석하고 해결하는 데 목적이 있습니다.

## 2. 문제 발생 시 초기 진단 (가장 중요)

무한 로딩이 발생하면 **가장 먼저 사용자 브라우저의 개발자 도구(Developer Tools)**를 열어 실시간으로 발생하는 오류를 확인해야 합니다.

### 2.1. 브라우저 콘솔 (Console) 탭 확인

*   **확인 사항**: 빨간색으로 표시된 `ERROR` 메시지 또는 `Uncaught Exception`이 있는지 확인합니다.
*   **주요 에러 유형**:
    *   `TypeError: Cannot read properties of undefined (reading 'xyz')`: 특정 객체의 속성에 접근할 수 없을 때 발생합니다. 이는 데이터가 예상대로 로드되지 않았거나, 컴포넌트 렌더링 로직에 문제가 있을 수 있음을 시사합니다.
    *   `ReferenceError: xyz is not defined`: 정의되지 않은 변수나 함수를 사용했을 때 발생합니다.
    *   `Failed to load resource: net::ERR_CONNECTION_REFUSED`: 백엔드 API 호출이 거부되었을 때 발생합니다. (프록시 설정 문제 또는 백엔드 서버 미실행)
    *   `Invariant Violation`: React Router 관련 오류일 가능성이 높습니다. (예: `useNavigate() may be used only in the context of a <Router> component.`)
*   **조치**: 발견된 에러 메시지와 스택 트레이스 전체를 기록합니다. 이는 문제의 원인이 되는 프론트엔드 코드의 위치를 알려주는 중요한 단서입니다.

### 2.2. 브라우저 네트워크 (Network) 탭 확인

*   **확인 사항**: 로그인 후 또는 대시보드 로딩 시 발생하는 모든 HTTP 요청 목록을 확인합니다.
*   **주요 확인 항목**:
    *   **상태 코드 (Status Code)**: `200 OK`가 아닌 `4xx` (클라이언트 오류) 또는 `5xx` (서버 오류) 상태 코드를 반환하는 요청이 있는지 확인합니다.
        *   `401 Unauthorized`, `403 Forbidden`: 인증/인가 관련 문제입니다. 사용자 세션 또는 역할/권한 설정이 잘못되었을 수 있습니다.
        *   `404 Not Found`: 요청한 API 엔드포인트가 존재하지 않거나 경로가 잘못되었을 수 있습니다.
        *   `500 Internal Server Error`: 백엔드 서버에서 처리되지 않은 예외가 발생했음을 의미합니다. 이는 백엔드 로그 확인이 필수적입니다.
    *   **API 경로**: 특히 `branding` 정보 (`/api/admin/branding` 또는 `/api/core/branding`), 대시보드 데이터 (`/api/v1/tenant/dashboards/*`), 위젯 데이터 관련 API 호출을 주의 깊게 확인합니다.
    *   **응답 (Response)**: 실패한 요청의 응답 내용을 확인하여 백엔드에서 반환된 구체적인 오류 메시지를 파악합니다. (예: `Tenant ID is not set in current context`)
*   **조치**: 실패한 네트워크 요청의 URL, 상태 코드, 그리고 응답 본문을 기록합니다.

### 2.3. 브라우저 애플리케이션 (Application) 탭 확인

*   **확인 사항**: `Session Storage`와 `Local Storage`에 저장된 사용자 정보(역할, 비즈니스 유형, 토큰 등)가 올바른지 확인합니다.
*   **조치**: `sessionManager`가 저장하는 `currentUser` 객체의 `role`, `businessType`, `tenantId` 등의 필드가 예상과 일치하는지 확인합니다.

## 3. 백엔드 서버 로그 진단

브라우저 네트워크 탭에서 `500 Internal Server Error`가 발생했거나, 백엔드 로직 오류가 의심되는 경우 백엔드 서버의 로그 파일을 확인해야 합니다.

### 3.1. 백엔드 로그 파일 위치 확인

*   일반적으로 `CoreSolution` 프로젝트의 경우 프로젝트 루트의 `backend.log` 파일 또는 `src/main/resources/log/` 디렉토리에 위치할 수 있습니다.
*   `glob_file_search` 도구를 사용하여 `**/*.log` 패턴으로 검색하여 로그 파일을 찾을 수 있습니다.

### 3.2. 백엔드 로그 내용 확인 및 검색

*   `read_file` 도구를 사용하여 로그 파일의 마지막 500~1000줄을 읽어 최근 로그를 확인합니다.
*   `grep` 도구를 사용하여 특정 키워드를 검색합니다.
    *   **일반적인 오류**: `ERROR`, `Exception`, `FATAL`
    *   **테넌트 관련**: `Tenant ID is not set`, `IllegalStateException`
    *   **브랜딩 관련**: `branding`, `BrandingController`
    *   **인증/인가 관련**: `Authentication`, `Authorization`, `AccessDenied`
*   **조치**: 발견된 오류 메시지, 스택 트레이스, 관련 로그 라인을 기록하고 분석합니다. 특히 `Tenant ID is not set in current context`와 같은 메시지는 이전에 발생했던 문제의 핵심 원인이었습니다.

## 4. 프론트엔드 코드베이스 검토

브라우저 콘솔 및 네트워크 탭에서 얻은 단서를 바탕으로 프론트엔드 코드의 관련 부분을 검토합니다.

### 4.1. 주요 파일 및 로직

*   **`App.js`**: `Router` 컴포넌트의 위치, 라우팅 정의, `useNavigate` 호출 위치.
    *   `useNavigate`는 `<Router>` 컴포넌트 내부에서 호출되어야 합니다.
*   **`frontend/src/utils/sessionManager.js`**:
    *   로그인 후 사용자 정보 저장 및 `navigate` 함수 설정 로직.
    *   `window.fetch` 오버라이드 로직 (`XMLHttpRequest` 사용으로 수정되었는지 확인).
    *   `normalizeUserRole`, `getCurrentUserRole`, `getCurrentUserBusinessType` 함수들이 정확한 값을 반환하는지 확인.
    *   `redirectToDashboard` 함수가 올바른 경로로 리다이렉션하는지 확인.
*   **`frontend/src/components/dashboard/DynamicDashboard.js`**:
    *   사용자 역할 또는 비즈니스 유형에 따라 대시보드 컴포넌트를 선택하는 로직.
    *   `filterWidgetsByBusinessType` 로직이 올바르게 작동하는지, 필터링 후 위젯 목록이 비어 있는지 여부.
    *   `isAdmin` 체크 로직 (`ADMIN_ROLES` 참조) 및 관리자 대시보드 렌더링 로직.
    *   기본 대시보드 생성 로직 (`createDefaultAdminDashboardConfig`, `createDefaultBusinessTypeDashboardConfig`).
*   **`frontend/src/utils/widgetVisibilityUtils.js`**:
    *   `isWidgetVisibleByBusinessType` (이전 `isWidgetVisibleByRole`) 함수 로직.
    *   `WIDGET_BUSINESS_TYPES` (이전 `WIDGET_ROLE_PERMISSIONS`) 정의 참조.
*   **`frontend/src/constants/roles.js`**:
    *   `USER_ROLES`, `ADMIN_ROLES` 등 역할 상수 정의가 올바른지 확인.
    *   특히 `TENANT_ADMIN`, `PRINCIPAL`, `OWNER` 역할이 `ADMIN_ROLES`에 포함되어 있는지 확인.
*   **`frontend/src/utils/dashboardUtils.js`**:
    *   `getDashboardComponentName` 및 `getDynamicDashboardPath` 함수가 역할/비즈니스 유형에 따라 올바른 컴포넌트 이름 및 경로를 반환하는지 확인.
    *   `TENANT_ADMIN`, `PRINCIPAL`, `OWNER` 역할이 `AdminDashboard` 및 `/admin/dashboard`로 매핑되는지 확인.
*   **`frontend/src/constants/session.js`**:
    *   `DASHBOARD_PATHS`에 역할별 대시보드 경로가 올바르게 정의되어 있는지 확인.

## 5. 백엔드 코드베이스 검토

프론트엔드에서 `500 Internal Server Error`가 발생했거나, 데이터 로딩 문제, 권한 관련 문제가 의심되는 경우 백엔드 코드를 검토합니다.

### 5.1. 주요 파일 및 로직

*   **`User.java` (엔티티)**: `tenantId` 필드가 `@Column` 어노테이션과 함께 정의되어 있는지, getter/setter가 있는지 확인.
*   **`JwtService.java`**: JWT 토큰 생성 시 `user.getTenantId()`가 올바르게 호출되어 `tenantId` 클레임이 포함되는지 확인.
*   **`JwtAuthenticationFilter.java`**: JWT에서 `tenantId`를 추출하여 `TenantContextHolder.setTenantId()`를 호출하는지 확인.
*   **`TenantContextHolder.java` / `TenantContext.java`**: `tenantId`가 `ThreadLocal`에 올바르게 설정되고 검색되는지 확인.
*   **`TenantContextFilter.java`**: HTTP 요청 헤더, 서브도메인, 사용자 세션에서 `tenantId`를 추출하여 `TenantContextHolder`에 설정하는 로직 확인.
*   **`BrandingController.java`**: `TenantContextHolder.getRequiredTenantId()` 호출 위치 및 예외 처리 로직 확인.
*   **`UserService.java` / `UserServiceImpl.java`**: 사용자 정보 조회 시 `tenantId`가 제대로 로드되는지 확인.

## 6. 문제 재현 및 디버깅 가이드

*   **단계별 재현**: 무한 로딩이 발생하는 정확한 시나리오(특정 계정, 특정 페이지, 특정 작업)를 기록합니다.
*   **콘솔 디버깅**: 프론트엔드 코드의 핵심 함수(예: `sessionManager`의 `redirectToDashboard`, `DynamicDashboard`의 렌더링 로직)에 `console.log`를 추가하여 변수 값을 추적합니다.
*   **백엔드 디버깅**: 백엔드 IDE에서 관련 컨트롤러 또는 서비스 메서드에 브레이크포인트를 설정하고 디버그 모드로 실행하여 `tenantId` 등의 값이 올바르게 전달되는지 확인합니다.

## 7. 관련 메모리 및 기존 문서 참조

이전 작업 및 사용자 요청과 관련된 중요한 메모리 및 문서는 문제 해결에 귀중한 단서가 될 수 있습니다.

*   **메모리 10245166**: MindGarden 디자인 시스템 v2.0 중앙화 작업에 대한 상세한 계획 및 안전장치. 특히 "쇼케이스 참조 필수" 강조.
*   **메모리 9887825**: MindGarden 디자인 시스템 v2.0 구현 작업 시 필수 참조 문서 목록 및 핵심 규칙.
*   **메모리 9853852**: 마스터 플랜 파일 `v0-pure-css-prompt.plan.md` 참조 필수.
*   **메모리 9849631**: 새로운 CSS 파일 생성 금지, 기존 가이드라인 문서 참조.
*   **메모리 8446264, 8163194, 8062380, 8059263, 8059260, 7894952, 7480811**: CSS 클래스, JavaScript 변수 등을 상수로 정의하고 컴포넌트화하는 규칙.
*   **메모리 11114470**: 모든 데이터 중앙화, SSO 로그인 로직 문서화.
*   **`docs/mgsb/BUSINESS_CATEGORY_ROLE_SYSTEM.md`**: 업종별 역할 시스템 디자인 문서. (위젯 필터링 로직에 영향)
*   **`frontend/src/styles/mindgarden-design-system.css`**: 메인 CSS 파일.
*   **`http://localhost:3000/design-system`**: 디자인 시스템 쇼케이스 (실제 컴포넌트 동작 확인).

이 가이드를 통해 무한 로딩 문제의 원인을 체계적으로 파악하고 해결하는 데 도움이 되기를 바랍니다.
