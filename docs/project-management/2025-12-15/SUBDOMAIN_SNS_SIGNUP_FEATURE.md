# 서브도메인 기반 SNS 간편 가입 기능

## 개요

서브도메인으로 접근한 사용자가 SNS 로그인을 통해 간편 가입할 때, 해당 서브도메인에 연결된 테넌트에 자동으로 가입되도록 하는 기능입니다.

**작성일**: 2025-12-15  
**버전**: 1.0.0

## 기능 설명

### 목적
- 서브도메인(`mindgarden.dev.core-solution.co.kr`)으로 접근한 사용자가 SNS 로그인 시
- 해당 서브도메인에 연결된 테넌트(`tenant-incheon-counseling-001`)에 자동으로 가입
- 사용자가 별도로 테넌트를 선택할 필요 없이 자동으로 올바른 테넌트에 연결

### 주요 기능
1. **서브도메인 자동 감지**: 로그인 페이지 접근 시 서브도메인에서 tenant_id 자동 조회
2. **SNS 로그인 시 tenant_id 전달**: OAuth authorize 단계에서 tenant_id를 세션에 저장
3. **간편 가입 시 자동 연결**: 회원가입 시 해당 테넌트에 자동으로 가입

## 아키텍처

### 전체 흐름

```
1. 사용자 접근
   https://mindgarden.dev.core-solution.co.kr/login
   ↓
2. 프론트엔드: 서브도메인 감지 및 tenant_id 조회
   UnifiedLogin 컴포넌트 → /api/v1/auth/tenant/by-subdomain
   ↓
3. sessionStorage에 tenant_id 저장
   subdomain_tenant_id = "tenant-incheon-counseling-001"
   ↓
4. 사용자가 SNS 로그인 버튼 클릭
   ↓
5. 백엔드: OAuth authorize 엔드포인트
   서브도메인에서 tenant_id 추출 → 세션에 저장
   ↓
6. SNS 인증 완료 후 콜백
   세션의 tenant_id를 URL 파라미터로 전달
   ↓
7. 프론트엔드: OAuth2Callback
   tenantId 파라미터 또는 sessionStorage에서 tenant_id 확인
   ↓
8. SocialSignupModal에 tenantId 전달
   ↓
9. 회원가입 API 호출
   /api/v1/auth/social/signup?tenantId=xxx
   ↓
10. 해당 테넌트에 사용자 자동 가입 완료
```

## 구현 상세

### 1. 백엔드 API

#### 1.1 서브도메인으로 테넌트 조회 API
**엔드포인트**: `GET /api/v1/auth/tenant/by-subdomain`

**파라미터**:
- `subdomain` (required): 서브도메인 (예: `mindgarden`)

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "tenant": {
      "tenantId": "tenant-incheon-counseling-001",
      "name": "인천 상담센터",
      "businessType": "COUNSELING",
      "status": "ACTIVE",
      "subdomain": "mindgarden"
    },
    "found": true
  }
}
```

**구현 위치**: `MultiTenantController.getTenantBySubdomain()`

**특징**:
- 로그인 전에도 사용 가능 (인증 불필요)
- 공개 API로 서브도메인 정보만으로 테넌트 조회 가능

#### 1.2 OAuth Authorize 엔드포인트 수정
**엔드포인트**: 
- `GET /api/v1/auth/oauth2/kakao/authorize`
- `GET /api/v1/auth/oauth2/naver/authorize`

**변경 사항**:
- 서브도메인에서 tenant_id 추출
- 세션에 `oauth2_tenant_id` 저장

**구현 위치**: `OAuth2Controller.kakaoAuthorize()`, `OAuth2Controller.naverAuthorize()`

**추가된 메서드**: `extractTenantIdFromSubdomain()`

#### 1.3 OAuth Callback 엔드포인트 수정
**엔드포인트**:
- `GET /api/auth/naver/callback`
- `GET /api/auth/kakao/callback`

**변경 사항**:
- 세션에서 `oauth2_tenant_id` 확인
- 회원가입 필요 시 URL 파라미터에 `tenantId` 포함

**구현 위치**: `OAuth2Controller.naverCallback()`, `OAuth2Controller.kakaoCallback()`

#### 1.4 소셜 회원가입 API 수정
**엔드포인트**: `POST /api/v1/auth/social/signup`

**변경 사항**:
- `tenantId` 쿼리 파라미터 추가
- `TenantContextHolder`에 tenant_id 설정

**구현 위치**: `SocialAuthController.socialSignup()`

### 2. 프론트엔드 구현

#### 2.1 UnifiedLogin 컴포넌트
**파일**: `frontend/src/components/auth/UnifiedLogin.js`

**추가된 기능**:
- 컴포넌트 마운트 시 서브도메인 자동 감지
- 백엔드 API로 tenant_id 조회
- `sessionStorage`에 `subdomain_tenant_id` 저장

**서브도메인 패턴**:
```javascript
const patterns = [
  /^([^.]+)\.dev\.core-solution\.co\.kr$/,
  /^([^.]+)\.core-solution\.co\.kr$/,
  /^([^.]+)\.dev\.m-garden\.co\.kr$/,
  /^([^.]+)\.m-garden\.co\.kr$/
];
```

**제외되는 기본 서브도메인**: `dev`, `app`, `api`, `staging`, `www`

#### 2.2 OAuth2Callback 컴포넌트
**파일**: `frontend/src/components/auth/OAuth2Callback.js`

**변경 사항**:
- URL 파라미터에서 `tenantId` 추출
- `sessionStorage`의 `subdomain_tenant_id`도 확인
- `SocialSignupModal`에 `tenantId` 전달

**우선순위**:
1. URL 파라미터의 `tenantId` (OAuth 콜백에서 전달)
2. `sessionStorage`의 `subdomain_tenant_id` (로그인 페이지에서 감지)

#### 2.3 SocialSignupModal 컴포넌트
**파일**: `frontend/src/components/auth/SocialSignupModal.js`

**변경 사항**:
- `tenantId`가 있으면 테넌트별 회원가입 API 호출
- `/api/v1/auth/social/signup?tenantId=xxx` 사용

**조건부 API 호출**:
```javascript
if (socialUser.isAcademySignup && socialUser.tenantId) {
  // 학원 시스템 회원가입
  /api/v1/academy/registration/social-signup?tenantId=xxx
} else if (socialUser.tenantId) {
  // 서브도메인 기반 일반 회원가입
  /api/v1/auth/social/signup?tenantId=xxx
} else {
  // 일반 회원가입 (tenantId 없음)
  /api/v1/auth/social/signup
}
```

## 데이터 흐름

### 세션/스토리지 관리

1. **sessionStorage** (프론트엔드)
   - `subdomain_tenant_id`: 로그인 페이지에서 감지한 tenant_id
   - `subdomain`: 감지한 서브도메인

2. **HTTP Session** (백엔드)
   - `oauth2_tenant_id`: OAuth authorize 단계에서 저장
   - OAuth 콜백에서 사용 후 제거

3. **URL 파라미터**
   - `tenantId`: OAuth 콜백에서 프론트엔드로 전달

## 사용 예시

### 시나리오: mindgarden 서브도메인으로 SNS 가입

1. **사용자 접근**
   ```
   https://mindgarden.dev.core-solution.co.kr/login
   ```

2. **자동 감지**
   - 프론트엔드가 `mindgarden` 서브도메인 감지
   - `/api/v1/auth/tenant/by-subdomain?subdomain=mindgarden` 호출
   - `tenant-incheon-counseling-001` 조회
   - `sessionStorage.setItem('subdomain_tenant_id', 'tenant-incheon-counseling-001')`

3. **SNS 로그인 클릭**
   - 카카오/네이버 로그인 버튼 클릭
   - 백엔드 authorize 엔드포인트 호출
   - 서브도메인에서 tenant_id 추출하여 세션에 저장

4. **SNS 인증 완료**
   - SNS 인증 완료 후 콜백 URL로 리다이렉트
   - URL에 `tenantId=tenant-incheon-counseling-001` 포함

5. **회원가입 모달 표시**
   - `OAuth2Callback`에서 `tenantId` 확인
   - `SocialSignupModal`에 `tenantId` 전달

6. **회원가입 완료**
   - `/api/v1/auth/social/signup?tenantId=tenant-incheon-counseling-001` 호출
   - 해당 테넌트에 사용자 자동 가입

## API 명세

### GET /api/v1/auth/tenant/by-subdomain

서브도메인으로 테넌트 정보를 조회합니다.

**요청**:
```
GET /api/v1/auth/tenant/by-subdomain?subdomain=mindgarden
```

**응답** (성공):
```json
{
  "success": true,
  "data": {
    "tenant": {
      "tenantId": "tenant-incheon-counseling-001",
      "name": "인천 상담센터",
      "businessType": "COUNSELING",
      "status": "ACTIVE",
      "subdomain": "mindgarden"
    },
    "found": true
  }
}
```

**응답** (실패 - 테넌트 없음):
```json
{
  "success": true,
  "data": {
    "tenant": null,
    "found": false,
    "message": "서브도메인에 해당하는 테넌트를 찾을 수 없습니다."
  }
}
```

### POST /api/v1/auth/social/signup

소셜 회원가입을 처리합니다. `tenantId` 파라미터가 있으면 해당 테넌트에 가입합니다.

**요청**:
```
POST /api/v1/auth/social/signup?tenantId=tenant-incheon-counseling-001
Content-Type: application/json

{
  "provider": "KAKAO",
  "providerUserId": "123456789",
  "email": "user@example.com",
  "name": "홍길동",
  "nickname": "길동이",
  "password": "password123",
  "phone": "010-1234-5678",
  "privacyConsent": true,
  "termsConsent": true,
  "marketingConsent": false
}
```

**응답** (성공):
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다.",
  "data": {
    "userId": 123,
    "tenantId": "tenant-incheon-counseling-001"
  }
}
```

## 파일 변경 내역

### 백엔드
1. `src/main/java/com/coresolution/consultation/controller/MultiTenantController.java`
   - `getTenantBySubdomain()` 메서드 추가
   - `TenantRepository` 의존성 주입 추가

2. `src/main/java/com/coresolution/consultation/controller/OAuth2Controller.java`
   - `extractTenantIdFromSubdomain()` 메서드 추가
   - `kakaoAuthorize()`, `naverAuthorize()`에서 tenant_id 세션 저장
   - `naverCallback()`, `kakaoCallback()`에서 tenant_id URL 파라미터 전달
   - `TenantRepository` 의존성 주입 추가

3. `src/main/java/com/coresolution/consultation/controller/SocialAuthController.java`
   - `socialSignup()` 메서드에 `tenantId` 파라미터 추가
   - `TenantContextHolder`에 tenant_id 설정

### 프론트엔드
1. `frontend/src/components/auth/UnifiedLogin.js`
   - 서브도메인 자동 감지 로직 추가
   - `sessionStorage`에 tenant_id 저장

2. `frontend/src/components/auth/OAuth2Callback.js`
   - `tenantId` 파라미터 추출
   - `sessionStorage`의 `subdomain_tenant_id` 확인
   - `SocialSignupModal`에 `tenantId` 전달

3. `frontend/src/components/auth/SocialSignupModal.js`
   - `tenantId`가 있으면 테넌트별 회원가입 API 호출

## 주의사항

1. **서브도메인 패턴**: 현재 지원하는 도메인 패턴
   - `*.dev.core-solution.co.kr`
   - `*.core-solution.co.kr`
   - `*.dev.m-garden.co.kr`
   - `*.m-garden.co.kr`

2. **기본 서브도메인 제외**: 다음 서브도메인은 테넌트로 인식하지 않음
   - `dev`, `app`, `api`, `staging`, `www`

3. **세션 관리**: 
   - OAuth authorize 단계에서 세션에 저장된 `oauth2_tenant_id`는 콜백에서 사용 후 제거
   - 프론트엔드의 `sessionStorage`는 브라우저 세션 동안 유지

4. **우선순위**:
   - OAuth 콜백 URL 파라미터의 `tenantId`가 최우선
   - 그 다음 `sessionStorage`의 `subdomain_tenant_id`
   - 학원 시스템 회원가입 모드(`isAcademySignup`)가 있으면 별도 처리

## 테스트 시나리오

### 테스트 1: 서브도메인으로 접근하여 SNS 가입
1. `https://mindgarden.dev.core-solution.co.kr/login` 접근
2. 콘솔에서 `subdomain_tenant_id` 저장 확인
3. 카카오/네이버 로그인 클릭
4. SNS 인증 완료
5. 회원가입 모달에서 tenant_id 확인
6. 회원가입 완료 후 해당 테넌트에 가입 확인

### 테스트 2: 일반 도메인으로 접근
1. `https://dev.core-solution.co.kr/login` 접근
2. 서브도메인 감지 안 됨 확인
3. SNS 로그인 시 tenant_id 없이 진행 확인

### 테스트 3: 잘못된 서브도메인
1. `https://nonexistent.dev.core-solution.co.kr/login` 접근
2. API 호출 시 `found: false` 응답 확인
3. SNS 로그인 시 일반 회원가입으로 진행 확인

## 향후 개선 사항

1. **캐싱**: 서브도메인 → tenant_id 매핑을 프론트엔드에 캐싱
2. **에러 처리**: 서브도메인 조회 실패 시 사용자에게 안내
3. **로깅**: 서브도메인 감지 및 tenant_id 사용 로그 강화
4. **테스트**: 자동화된 테스트 케이스 추가

## 관련 문서

- [와일드카드 도메인 설정 가이드](../2025-12-12/WILDCARD_DNS_SETUP_REQUIRED.md)
- [서브도메인 라우팅 설정](../2025-12-12/WILDCARD_DOMAIN_TEST_REPORT.md)
- [OAuth2 인증 플로우](../2025-12-12/WILDCARD_DNS_SUCCESS.md)

