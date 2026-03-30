# SSO 로그인 연계 및 동적 권한 관리 설계 확인 보고서

**작성일:** 2025-01-XX  
**목적:** SSO 로그인 연계와 동적 권한 관리가 설계 및 구현되어 있는지 확인

## 1. SSO 로그인 연계 현황

### 1.1 설계 상태 ✅

**설계 문서:** `docs/mgsb/IDENTITY_AND_SSO.md`

**설계된 내용:**
- 통합 Identity Hub 아키텍처
- OAuth2 기반 소셜 로그인 (Kakao/Naver)
- JWT/Session 기반 SSO 흐름
- AccessToken에 `tenantId`, `branchId`, `role`, `permissions` 포함 설계
- Refresh Token 로테이션
- 웹/모바일/파트너 API 통합 인증

**설계된 JWT Payload 구조:**
```json
{
  "sub": "auth_user_id",
  "tenantId": "uuid",
  "branchId": "uuid",
  "role": "HQ_ADMIN",
  "permissions": ["reservation:view", "settlement:download"],
  "iat": 1731392400,
  "exp": 1731396000
}
```

### 1.2 구현 상태 ⚠️

**구현된 내용:**
- ✅ OAuth2 소셜 로그인 (Kakao/Naver) 구현됨
  - `AbstractOAuth2Service`, `KakaoOAuth2ServiceImpl`, `NaverOAuth2ServiceImpl`
  - `OAuth2Controller`에서 콜백 처리
- ✅ JWT 토큰 생성 서비스 구현됨
  - `JwtService`, `JwtTokenUtil`
- ✅ 세션 기반 인증 구현됨
  - `SessionBasedAuthenticationFilter`
  - `AuthController`의 `/api/auth/login`, `/api/auth/current-user`

**미완성/개선 필요:**
- ⚠️ JWT 토큰에 `tenantId`, `branchId`, `permissions` 포함 미완성
  - 현재 `JwtService.generateToken()`은 기본적인 `userEmail`만 사용
  - 설계된 구조대로 `tenantId`, `branchId`, `permissions`를 포함하도록 확장 필요
- ⚠️ `auth_user` 테이블 미구현
  - 설계 문서에는 `auth_user`, `auth_user_social` 테이블이 있으나
  - 현재는 `users`, `user_social_accounts` 테이블 사용
  - 향후 `auth_user`로 통합 필요
- ⚠️ Refresh Token 저장소 미구현
  - 설계 문서의 `refresh_token_store` 테이블 미구현
  - 현재는 세션 기반으로만 동작
- ⚠️ OIDC Provider, SAML 연동 미구현
  - 로드맵에 있으나 아직 구현되지 않음 (Q2-Q4 계획)

### 1.3 데이터 중앙화 상태 ✅

**중앙화된 데이터:**
- ✅ `users` 테이블: 중앙화됨
- ✅ `user_social_accounts` 테이블: 중앙화됨
- ✅ `branches` 테이블: 중앙화됨
- ✅ `role_permissions` 테이블: 중앙화됨

**향후 중앙화 필요:**
- `tenants` 테이블: 설계만 되어 있고 아직 구현되지 않음
- `auth_user` 테이블: 설계만 되어 있고 아직 구현되지 않음

## 2. 동적 권한 관리 현황

### 2.1 설계 상태 ✅

**설계 문서:** `docs/mgsb/DATA_CORE_AND_PL_SQL.md` (섹션 1.5)

**설계된 구조:**
- `role_template`: 업종별 기본 역할 템플릿 (HQ가 정의)
- `role_template_permission`: 템플릿별 권한 목록
- `role_template_mapping`: 업종별 템플릿 자동 매핑
- `tenant_role`: 테넌트 커스텀 역할 (템플릿 기반 복제)
- `role_permission`: 테넌트 역할별 권한 (ABAC 정책 포함)
- `user_role_assignment`: 사용자-역할 배정 이력

**설계된 기능:**
- 업종별 역할 템플릿 자동 매핑
- 테넌트별 역할 커스터마이징
- 멀티롤 지원 (한 사용자가 여러 역할)
- ABAC 확장 (branch_id, tenant_id, business_type 기반 정책)
- 권한 변경 이력 및 감사 로그

### 2.2 구현 상태 ⚠️

**구현된 내용:**
- ✅ 기본 동적 권한 관리 시스템 구현됨
  - `DynamicPermissionService` 인터페이스 및 구현체
  - `RolePermission` 엔티티
  - `permissions`, `role_permissions` 테이블
  - `PermissionManagementController` API
- ✅ 역할별 권한 조회/부여/회수 기능
  - `hasPermission()`, `getUserPermissions()`, `grantPermission()`, `revokePermission()`
- ✅ 권한 캐싱 지원
  - `@Cacheable`, `@CacheEvict` 사용
- ✅ 데이터베이스 기반 권한 관리
  - SQL 스크립트: `sql/dynamic_permission_setup.sql`

**미완성/개선 필요:**
- ⚠️ `role_template` 엔티티 미구현
  - 설계 문서에는 있으나 Java 엔티티 없음
  - 데이터베이스 테이블도 아직 생성되지 않음
- ⚠️ `tenant_role` 엔티티 미구현
  - 설계 문서에는 있으나 Java 엔티티 없음
  - 데이터베이스 테이블도 아직 생성되지 않음
- ⚠️ 현재는 `UserRole` enum 기반으로만 동작
  - 하드코딩된 역할 (ADMIN, CONSULTANT, CLIENT 등)
  - 동적 역할 생성/관리 불가
- ⚠️ ABAC 정책 엔진 미구현
  - `policy_json` 필드 설계는 있으나 실제 정책 평가 로직 없음
- ⚠️ 멀티롤 지원 미구현
  - 현재는 사용자당 단일 역할만 지원
  - `user_role_assignment` 테이블 미구현

### 2.3 데이터 중앙화 상태 ✅

**중앙화된 데이터:**
- ✅ `permissions` 테이블: 중앙화됨
- ✅ `role_permissions` 테이블: 중앙화됨
- ✅ 권한 관리 API: 중앙화됨

**향후 중앙화 필요:**
- `role_template` 테이블: 설계만 되어 있고 아직 구현되지 않음
- `tenant_role` 테이블: 설계만 되어 있고 아직 구현되지 않음
- `user_role_assignment` 테이블: 설계만 되어 있고 아직 구현되지 않음

## 3. 종합 평가

### 3.1 SSO 로그인 연계

| 항목 | 설계 | 구현 | 상태 |
|------|------|------|------|
| 소셜 로그인 (Kakao/Naver) | ✅ | ✅ | 완료 |
| JWT 토큰 생성 | ✅ | ✅ | 완료 |
| JWT에 tenant/branch/permissions 포함 | ✅ | ⚠️ | 미완성 |
| Refresh Token 관리 | ✅ | ⚠️ | 미완성 |
| auth_user 통합 계정 | ✅ | ⚠️ | 미완성 |
| OIDC Provider | ✅ | ❌ | 계획 단계 |
| SAML 연동 | ✅ | ❌ | 계획 단계 |

**결론:** 기본 SSO 구조는 설계되어 있고 소셜 로그인은 구현되어 있으나, JWT에 tenant/branch/permissions 포함 및 고급 기능은 아직 미완성입니다.

### 3.2 동적 권한 관리

| 항목 | 설계 | 구현 | 상태 |
|------|------|------|------|
| 기본 동적 권한 관리 | ✅ | ✅ | 완료 |
| role_template 기반 구조 | ✅ | ❌ | 미구현 |
| tenant_role 커스터마이징 | ✅ | ❌ | 미구현 |
| 멀티롤 지원 | ✅ | ❌ | 미구현 |
| ABAC 정책 엔진 | ✅ | ❌ | 미구현 |
| 권한 변경 이력 | ✅ | ⚠️ | 부분 구현 |

**결론:** 기본 동적 권한 관리 시스템은 구현되어 있으나, 설계 문서의 고급 기능(role_template, tenant_role, 멀티롤, ABAC)은 아직 구현되지 않았습니다.

### 3.3 데이터 중앙화

**중앙화 완료:**
- ✅ 사용자 계정 데이터 (`users`, `user_social_accounts`)
- ✅ 지점 데이터 (`branches`)
- ✅ 기본 권한 데이터 (`permissions`, `role_permissions`)

**중앙화 필요 (설계만 완료):**
- ⚠️ 테넌트 데이터 (`tenants`)
- ⚠️ 통합 계정 데이터 (`auth_user`)
- ⚠️ 역할 템플릿 데이터 (`role_template`, `tenant_role`)

**결론:** 기본 데이터는 중앙화되어 있으나, Core-Solution 구조의 테넌트 및 역할 템플릿 데이터는 아직 구현되지 않았습니다.

## 4. 개선 권장사항

### 4.1 SSO 로그인 연계 개선

1. **JWT 토큰 확장 (우선순위: 높음)**
   - `JwtService.generateToken()`에 `tenantId`, `branchId`, `permissions` 포함
   - 로그인 시 사용자 정보에서 tenant/branch 조회하여 JWT에 포함
   - API Gateway/Filter에서 JWT 검증 시 `TenantContext` 주입

2. **Refresh Token 저장소 구현 (우선순위: 중간)**
   - `refresh_token_store` 테이블 생성
   - Refresh Token 로테이션 로직 구현
   - 기기별 토큰 관리 기능 추가

3. **auth_user 통합 (우선순위: 낮음, Core-Solution 전환 시)**
   - `auth_user` 테이블 생성
   - 기존 `users` 테이블과 마이그레이션
   - `staff_account`, `consumer_account`와 연계

### 4.2 동적 권한 관리 개선

1. **role_template 구조 구현 (우선순위: 높음)**
   - `role_template`, `role_template_permission`, `role_template_mapping` 테이블 생성
   - Java 엔티티 및 Repository 구현
   - 업종별 기본 역할 템플릿 데이터 초기화

2. **tenant_role 구조 구현 (우선순위: 높음)**
   - `tenant_role`, `role_permission` (테넌트별), `user_role_assignment` 테이블 생성
   - Java 엔티티 및 Repository 구현
   - 테넌트 온보딩 시 역할 템플릿 자동 복제 로직

3. **멀티롤 지원 (우선순위: 중간)**
   - 사용자 세션에서 `active_role` 선택 기능
   - 여러 역할을 가진 사용자의 권한 통합 로직

4. **ABAC 정책 엔진 (우선순위: 낮음)**
   - JSON 기반 정책 표현식 파서
   - 정책 평가 엔진 구현
   - Admin Portal에서 정책 편집 UI

## 5. 결론

**SSO 로그인 연계:**
- ✅ 기본 설계 완료, 소셜 로그인 구현 완료
- ⚠️ JWT 확장 및 고급 기능은 미완성
- ✅ 데이터 중앙화는 기본적으로 완료

**동적 권한 관리:**
- ✅ 기본 동적 권한 관리 구현 완료
- ❌ 설계 문서의 고급 구조(role_template, tenant_role)는 미구현
- ✅ 데이터 중앙화는 기본적으로 완료

**전체 평가:**
- 설계는 잘 되어 있으나, Core-Solution 구조의 고급 기능들은 아직 구현 단계에 있습니다.
- 현재는 기본적인 SSO와 동적 권한 관리가 동작하지만, 확장 가능한 구조로 전환하려면 추가 구현이 필요합니다.

