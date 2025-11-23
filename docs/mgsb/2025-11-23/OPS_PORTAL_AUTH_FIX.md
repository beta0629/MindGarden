# Ops Portal 인증/권한 시스템 점검 및 수정

## 문제점 분석

### 1. 로그아웃 문제
- **증상**: 로그아웃 후 쿠키가 완전히 삭제되지 않음
- **원인**: 
  - `LogoutButton.tsx`에서 서버 API만 호출하고 클라이언트 쿠키를 직접 삭제하지 않음
  - `router.replace()`와 `router.refresh()`만으로는 쿠키가 즉시 반영되지 않음
- **해결**: 클라이언트에서 쿠키 직접 삭제 및 전체 페이지 리로드

### 2. 권한 문제
- **증상**: 최고 관리자인데 권한 없다고 나옴
- **원인**:
  - `DashboardOpsController`와 `TenantOpsController`에서 수동 권한 체크를 하고 있음
  - 다른 컨트롤러들은 `OpsPermissionUtils`를 사용함
  - 권한 체크 로직이 일관되지 않음
- **해결**: 모든 컨트롤러를 `OpsPermissionUtils`로 통일

### 3. 로그인 문제
- **증상**: 로그인 후 재로그인 시 문제 발생 가능
- **원인**: 로그아웃 시 쿠키가 완전히 삭제되지 않아 재로그인 시 충돌 가능
- **해결**: 로그아웃 시 쿠키 완전 삭제

## 수정 사항

### 1. LogoutButton.tsx 수정
- 클라이언트에서 쿠키 직접 삭제 추가
- 전체 페이지 리로드로 변경 (`window.location.href`)

### 2. DashboardOpsController.java 수정
- 수동 권한 체크 제거
- `OpsPermissionUtils.requireAdminOrOps()` 사용

### 3. TenantOpsController.java 수정
- 수동 권한 체크 제거
- `OpsPermissionUtils.requireAdminOrOps()` 사용
- 사용하지 않는 변수 경고 수정

## 권한 체크 시스템

### JWT 토큰 → Spring Security 권한 매핑
- `HQ_ADMIN` → `ROLE_ADMIN`, `ROLE_OPS`, `ROLE_HQ_ADMIN`
- `SUPER_HQ_ADMIN` → `ROLE_ADMIN`, `ROLE_OPS`, `ROLE_HQ_ADMIN`
- `ADMIN` → `ROLE_ADMIN`, `ROLE_OPS`
- `OPS` → `ROLE_OPS`

### OpsPermissionUtils 사용
- `requireAdminOrOps()`: ADMIN 또는 OPS 역할 필요
- `requireAdmin()`: ADMIN 역할 필요
- `requireOps()`: OPS 역할 필요

## 테스트 체크리스트

### 로그인 테스트
- [ ] 올바른 아이디/비밀번호로 로그인 성공
- [ ] 잘못된 아이디/비밀번호로 로그인 실패
- [ ] 로그인 후 쿠키 설정 확인 (`ops_token`, `ops_actor_id`, `ops_actor_role`)
- [ ] 로그인 후 대시보드 접근 가능
- [ ] 로그인 후 다른 메뉴 접근 가능

### 로그아웃 테스트
- [ ] 로그아웃 버튼 클릭 시 쿠키 삭제 확인
- [ ] 로그아웃 후 로그인 페이지로 리다이렉트
- [ ] 로그아웃 후 API 호출 시 401 에러
- [ ] 로그아웃 후 재로그인 가능

### 권한 테스트
- [ ] 대시보드 메트릭 조회 권한 확인
- [ ] 테넌트 목록 조회 권한 확인
- [ ] 테넌트 관리자 계정 조회 권한 확인
- [ ] 온보딩 요청 조회 권한 확인
- [ ] 요금제 관리 권한 확인
- [ ] Feature Flag 관리 권한 확인

## 추가 개선 사항

### 1. 로그인 페이지 개선
- 이미 로그인된 사용자 자동 리다이렉트 (이미 구현됨)
- 로그인 실패 시 상세한 에러 메시지 표시

### 2. 인증 상태 관리 개선
- `layout.tsx`에서 쿠키 읽기 로직 개선
- 인증 상태 변경 시 자동 업데이트

### 3. 에러 처리 개선
- 401 에러 시 자동 로그인 페이지 리다이렉트 (이미 구현됨)
- 403 에러 시 명확한 권한 부족 메시지 표시

## 참고 파일

- `frontend-ops/src/components/auth/LogoutButton.tsx`
- `frontend-ops/src/components/auth/LoginForm.tsx`
- `frontend-ops/src/services/clientApi.ts`
- `src/main/java/com/coresolution/core/controller/OpsAuthController.java`
- `src/main/java/com/coresolution/core/util/OpsPermissionUtils.java`
- `src/main/java/com/coresolution/consultation/config/filter/JwtAuthenticationFilter.java`
- `src/main/java/com/coresolution/core/controller/ops/DashboardOpsController.java`
- `src/main/java/com/coresolution/core/controller/ops/TenantOpsController.java`

