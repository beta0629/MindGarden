# 통합 로그인 시스템 구축 계획

## 1. 개요

### 1.1 목적
- **SSO 기반 통합 로그인 시스템 구축** (모든 업종 통합)
- 한 번의 로그인으로 모든 서비스 접근
- 테넌트별 자동 라우팅
- 사용자 경험 향상

### 1.2 현재 상태

**구현된 내용:**
- ✅ OAuth2 소셜 로그인 (Kakao/Naver)
- ✅ JWT 토큰 생성 서비스
- ✅ 세션 기반 인증
- ✅ Passkey 인증 (기본 구현)

**미완성/개선 필요:**
- ⚠️ JWT 토큰에 `tenantId`, `branchId`, `permissions` 포함 미완성
- ⚠️ `auth_user` 테이블 미구현 (현재 `users` 테이블 사용)
- ⚠️ Refresh Token 저장소 미구현
- ⚠️ 통합 로그인 플로우 미완성
- ⚠️ 테넌트별 자동 라우팅 미구현

## 2. 통합 로그인 아키텍처

### 2.1 SSO 플로우

```
사용자
  ↓
[통합 로그인 페이지]
  ↓ (ID/PW 또는 소셜 로그인)
[Auth Server]
  ↓ (JWT 토큰 발급)
[Tenant Context 설정]
  ↓
[자동 라우팅]
  ↓
[테넌트별 대시보드]
```

### 2.2 JWT 토큰 구조

**현재 구조 (미완성):**
```json
{
  "sub": "user@example.com",
  "iat": 1731392400,
  "exp": 1731396000
}
```

**목표 구조 (완성):**
```json
{
  "sub": "auth_user_id",
  "tenantId": "uuid",
  "branchId": "uuid",
  "role": "HQ_ADMIN",
  "permissions": ["reservation:view", "settlement:download"],
  "businessType": "ACADEMY",
  "iat": 1731392400,
  "exp": 1731396000
}
```

## 3. 구현 계획

### 3.1 Phase 1: JWT 토큰 확장 (3일)

**Day 1: JWT 서비스 확장**
- [ ] `JwtService.generateToken()` 확장
  - `tenantId`, `branchId`, `permissions` 포함
  - 사용자 정보에서 자동 추출
- [ ] JWT Payload 구조 확장
- [ ] JWT 검증 로직 확장

**Day 2: 사용자 정보 조회 로직**
- [ ] 사용자 → 테넌트 매핑 조회
- [ ] 사용자 → 지점 매핑 조회
- [ ] 사용자 권한 조회
- [ ] JWT 생성 시 자동 포함

**Day 3: 테스트**
- [ ] JWT 토큰 생성 테스트
- [ ] JWT 토큰 검증 테스트
- [ ] 테넌트 컨텍스트 자동 설정 테스트

### 3.2 Phase 2: 통합 로그인 플로우 (3일)

**Day 1: 통합 로그인 페이지**
- [ ] 통합 로그인 UI 구현
- [ ] 소셜 로그인 버튼 통합
- [ ] 테넌트 선택 (선택적)

**Day 2: 로그인 후 처리**
- [ ] 테넌트 자동 감지
- [ ] 테넌트별 대시보드 라우팅
- [ ] 세션/JWT 토큰 저장

**Day 3: 통합 테스트**
- [ ] ID/PW 로그인 테스트
- [ ] 소셜 로그인 테스트
- [ ] 테넌트별 라우팅 테스트

### 3.3 Phase 3: Refresh Token 구현 (2일)

**Day 1: Refresh Token 저장소**
- [ ] `refresh_token_store` 테이블 생성
- [ ] Refresh Token 저장/조회 로직
- [ ] Refresh Token 로테이션

**Day 2: Refresh Token API**
- [ ] Refresh Token 발급 API
- [ ] Refresh Token 갱신 API
- [ ] Refresh Token 무효화 API

## 4. 데이터베이스 스키마

### 4.1 auth_user 테이블 (향후 통합)

**현재:**
- `users` 테이블 사용

**향후:**
- `auth_user` 테이블로 통합
- 모든 인증 정보 중앙화

### 4.2 refresh_token_store 테이블

```sql
CREATE TABLE refresh_token_store (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token_id VARCHAR(36) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    tenant_id VARCHAR(36),
    branch_id BIGINT,
    device_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_token_id (token_id),
    INDEX idx_expires_at (expires_at)
);
```

## 5. 통합 로그인 플로우 상세

### 5.1 로그인 시나리오

**시나리오 1: ID/PW 로그인**
1. 사용자가 통합 로그인 페이지 접근
2. ID/PW 입력
3. Auth Server 인증
4. JWT 토큰 발급 (tenantId, branchId, permissions 포함)
5. 테넌트 컨텍스트 자동 설정
6. 테넌트별 대시보드로 자동 라우팅

**시나리오 2: 소셜 로그인**
1. 사용자가 소셜 로그인 버튼 클릭 (Kakao/Naver/Google)
2. OAuth2 인증 플로우
3. 소셜 계정 매핑 확인
4. JWT 토큰 발급
5. 테넌트 컨텍스트 자동 설정
6. 테넌트별 대시보드로 자동 라우팅

**시나리오 3: 멀티 테넌트 사용자**
1. 사용자가 여러 테넌트에 소속된 경우
2. 테넌트 선택 화면 표시
3. 선택한 테넌트로 JWT 토큰 발급
4. 해당 테넌트 대시보드로 라우팅

## 6. 테넌트별 자동 라우팅

### 6.1 라우팅 로직

```java
public String determineDashboardUrl(String tenantId, String businessType, String role) {
    // 테넌트별 대시보드 URL 결정
    if ("ACADEMY".equals(businessType)) {
        return "/academy/dashboard";
    } else if ("CONSULTATION".equals(businessType)) {
        return "/consultation/dashboard";
    } else if ("FOOD_SERVICE".equals(businessType)) {
        return "/foodservice/dashboard";
    }
    
    // 기본 대시보드
    return "/dashboard";
}
```

### 6.2 테넌트 컨텍스트 자동 설정

```java
// JWT 토큰에서 테넌트 정보 추출
String tenantId = jwtToken.getTenantId();
String branchId = jwtToken.getBranchId();

// TenantContext에 자동 설정
TenantContextHolder.setTenantId(tenantId);
TenantContextHolder.setBranchId(branchId);
```

## 7. 보안 고려사항

### 7.1 토큰 보안
- JWT Secret Key 강화
- 토큰 만료 시간 적절히 설정
- Refresh Token 로테이션

### 7.2 세션 관리
- 세션 타임아웃 설정
- 동시 로그인 제한 (선택적)
- 로그아웃 시 토큰 무효화

### 7.3 접근 제어
- 테넌트별 데이터 격리
- 권한 기반 접근 제어
- ABAC 정책 적용

## 8. 사용성 고려사항

### 8.1 간편한 로그인
- 소셜 로그인 원클릭
- 자동 로그인 (선택적)
- 비밀번호 찾기 간편화

### 8.2 자동 라우팅
- 테넌트 자동 감지
- 대시보드 자동 이동
- 추가 설정 불필요

## 9. 구현 우선순위

### Phase 1: 핵심 기능 (1주)
- [ ] JWT 토큰 확장 (tenantId, branchId, permissions)
- [ ] 통합 로그인 플로우
- [ ] 테넌트별 자동 라우팅

### Phase 2: 고급 기능 (1주)
- [ ] Refresh Token 구현
- [ ] 멀티 테넌트 사용자 지원
- [ ] 세션 관리 강화

### Phase 3: 통합 및 테스트 (1주)
- [ ] 모든 인증 방식 통합
- [ ] 통합 테스트
- [ ] 보안 검증

