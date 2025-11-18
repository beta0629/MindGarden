# Week 14: Google/Apple OAuth2 추가

## 개요

Week 14에서는 기존 OAuth2 시스템(Kakao, Naver)에 Google과 Apple OAuth2를 추가하여 사용자 인증 옵션을 확장했습니다.

## 구현 내용

### 1. Google OAuth2 구현

#### 1.1 서비스 구현

**파일**: `src/main/java/com/mindgarden/consultation/service/impl/GoogleOAuth2ServiceImpl.java`

**주요 기능**:
- Google OAuth2 인증 코드로 액세스 토큰 획득
- 액세스 토큰으로 사용자 정보 조회
- Google API 응답을 표준화된 `SocialUserInfo`로 변환

**Google API 엔드포인트**:
- 인증: `https://accounts.google.com/o/oauth2/v2/auth`
- 토큰: `https://oauth2.googleapis.com/token`
- 사용자 정보: `https://www.googleapis.com/oauth2/v2/userinfo`

#### 1.2 설정

**파일**: `src/main/resources/application-local.yml`

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID:your-google-client-id}
            client-secret: ${GOOGLE_CLIENT_SECRET:your-google-client-secret}
            scope: openid,profile,email
            redirect-uri: "${server.base-url}/api/auth/google/callback"
            client-authentication-method: post
            authorization-grant-type: authorization_code
            client-name: Google
        provider:
          google:
            authorization-uri: https://accounts.google.com/o/oauth2/v2/auth
            token-uri: https://oauth2.googleapis.com/token
            user-info-uri: https://www.googleapis.com/oauth2/v2/userinfo
            user-name-attribute: id
```

#### 1.3 환경 변수

다음 환경 변수를 설정해야 합니다:
- `GOOGLE_CLIENT_ID`: Google OAuth2 클라이언트 ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth2 클라이언트 시크릿
- `GOOGLE_REDIRECT_URI`: Google OAuth2 리다이렉트 URI (선택 사항)

### 2. Apple OAuth2 구현

#### 2.1 서비스 구현

**파일**: `src/main/java/com/mindgarden/consultation/service/impl/AppleOAuth2ServiceImpl.java`

**주요 기능**:
- Apple OAuth2 인증 코드로 액세스 토큰 획득
- Apple ID 토큰에서 사용자 정보 추출 (향후 구현 필요)
- Apple API 응답을 표준화된 `SocialUserInfo`로 변환

**Apple API 엔드포인트**:
- 인증: `https://appleid.apple.com/auth/authorize`
- 토큰: `https://appleid.apple.com/auth/token`
- 사용자 정보: `https://appleid.apple.com/auth/userinfo`

**참고**: Apple Sign in with Apple은 Google과 다른 점:
1. `client_secret`은 JWT로 생성해야 함 (향후 구현 필요)
2. 사용자 정보는 첫 로그인 시에만 제공됨
3. 이후 로그인에서는 ID 토큰에서 사용자 정보를 추출해야 함

#### 2.2 설정

**파일**: `src/main/resources/application-local.yml`

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          apple:
            client-id: ${APPLE_CLIENT_ID:your-apple-client-id}
            client-secret: ${APPLE_CLIENT_SECRET:your-apple-client-secret}
            scope: name,email
            redirect-uri: "${server.base-url}/api/auth/apple/callback"
            client-authentication-method: post
            authorization-grant-type: authorization_code
            client-name: Apple
        provider:
          apple:
            authorization-uri: https://appleid.apple.com/auth/authorize
            token-uri: https://appleid.apple.com/auth/token
            user-info-uri: https://appleid.apple.com/auth/userinfo
            user-name-attribute: sub
```

#### 2.3 환경 변수

다음 환경 변수를 설정해야 합니다:
- `APPLE_CLIENT_ID`: Apple OAuth2 클라이언트 ID (Service ID)
- `APPLE_CLIENT_SECRET`: Apple OAuth2 클라이언트 시크릿 (JWT 형식, 향후 구현 필요)
- `APPLE_REDIRECT_URI`: Apple OAuth2 리다이렉트 URI (선택 사항)

### 3. OAuth2FactoryService 통합

**파일**: `src/main/java/com/mindgarden/consultation/service/OAuth2FactoryService.java`

Google과 Apple OAuth2 서비스가 자동으로 등록되도록 `OAuth2FactoryService`에 추가되었습니다.

```java
@Autowired(required = false)
private GoogleOAuth2ServiceImpl googleOAuth2Service;

@Autowired(required = false)
private AppleOAuth2ServiceImpl appleOAuth2Service;
```

## 사용 방법

### API 엔드포인트

기존 OAuth2Controller의 통합 엔드포인트를 통해 사용할 수 있습니다:

#### Google OAuth2
```
POST /api/auth/oauth2/google
Content-Type: application/json

{
  "code": "google-authorization-code"
}
```

#### Apple OAuth2
```
POST /api/auth/oauth2/apple
Content-Type: application/json

{
  "code": "apple-authorization-code"
}
```

### 프론트엔드 연동

프론트엔드에서는 기존 OAuth2 통합 엔드포인트를 사용할 수 있습니다:

```javascript
// Google OAuth2
const response = await fetch('/api/auth/oauth2/google', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    code: googleAuthorizationCode
  })
});

// Apple OAuth2
const response = await fetch('/api/auth/oauth2/apple', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    code: appleAuthorizationCode
  })
});
```

## 테스트

### 단위 테스트

**파일들**:
- `src/test/java/com/mindgarden/consultation/service/impl/GoogleOAuth2ServiceTest.java`
- `src/test/java/com/mindgarden/consultation/service/impl/AppleOAuth2ServiceTest.java`

### 테스트 실행

```bash
# Google OAuth2 테스트
mvn test -Dtest=GoogleOAuth2ServiceTest

# Apple OAuth2 테스트
mvn test -Dtest=AppleOAuth2ServiceTest
```

## 향후 개선 사항

### Apple OAuth2 개선

1. **JWT 기반 client_secret 생성**
   - Apple은 JWT 형식의 client_secret을 요구합니다
   - Apple Developer 인증서를 사용하여 JWT를 생성해야 합니다

2. **ID 토큰 파싱**
   - Apple은 첫 로그인 시에만 사용자 정보를 제공합니다
   - 이후 로그인에서는 ID 토큰에서 사용자 정보를 추출해야 합니다
   - JWT 파싱 라이브러리 사용 필요

3. **Refresh Token 관리**
   - Apple은 refresh_token을 제공합니다
   - 토큰 갱신 로직 구현 필요

## 지원하는 OAuth2 제공자

현재 지원하는 OAuth2 제공자:
- ✅ Kakao
- ✅ Naver
- ✅ Google (Week 14 추가)
- ✅ Apple (Week 14 추가)

## 참고 문서

- [Google OAuth2 문서](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign in with Apple 문서](https://developer.apple.com/sign-in-with-apple/)
- 기존 OAuth2 구현: `docs/mgsb/OAUTH2_DESIGN.md` (참고)

## 문제 해결

### Google OAuth2 오류

1. **"redirect_uri_mismatch" 오류**
   - Google Cloud Console에서 리다이렉트 URI를 등록했는지 확인
   - `application-local.yml`의 `redirect-uri` 설정 확인

2. **"invalid_client" 오류**
   - `GOOGLE_CLIENT_ID`와 `GOOGLE_CLIENT_SECRET` 환경 변수 확인
   - Google Cloud Console에서 클라이언트 ID/시크릿 확인

### Apple OAuth2 오류

1. **"invalid_client" 오류**
   - Apple Developer Console에서 Service ID 확인
   - `APPLE_CLIENT_ID` 환경 변수 확인

2. **"invalid_client_secret" 오류**
   - Apple은 JWT 형식의 client_secret을 요구합니다
   - 향후 JWT 생성 로직 구현 필요

## Week 14 완료 체크리스트

- [x] Google OAuth2 서비스 구현
- [x] Apple OAuth2 서비스 구현
- [x] OAuth2FactoryService 통합
- [x] application-local.yml 설정 추가
- [x] 단위 테스트 작성
- [x] 문서화

## 다음 단계

Week 15-16에서는 Passkey 인증 설계 및 준비를 진행합니다.

