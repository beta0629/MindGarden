# 개발 서버 배포 가이드

**작성일**: 2025-11-18  
**목적**: 개발 서버 도메인 설정 및 하드코딩 제거

## 1. 개발 서버 도메인 설정

### 1.1 환경 변수 설정

개발 서버 배포 시 다음 환경 변수를 설정해야 합니다:

```bash
# 서버 기본 URL
export SERVER_BASE_URL=https://dev.m-garden.co.kr

# WebAuthn/Passkey 설정
export WEBAUTHN_RP_ID=dev.m-garden.co.kr

# 프론트엔드 URL
export FRONTEND_BASE_URL=https://dev.m-garden.co.kr

# 데이터베이스 설정
export DB_HOST=your-dev-db-host
export DB_PORT=3306
export DB_NAME=core_solution
export DB_USERNAME=mindgarden_dev
export DB_PASSWORD=your-dev-db-password

# JWT 설정
export JWT_SECRET=your-dev-jwt-secret-key

# 암호화 설정
export PERSONAL_DATA_ENCRYPTION_KEY=your-32-char-encryption-key
export PERSONAL_DATA_ENCRYPTION_IV=your-16-char-iv

# OAuth2 설정
export KAKAO_CLIENT_ID=your-kakao-client-id
export KAKAO_CLIENT_SECRET=your-kakao-client-secret
export NAVER_CLIENT_ID=your-naver-client-id
export NAVER_CLIENT_SECRET=your-naver-client-secret
export GOOGLE_CLIENT_ID=your-google-client-id
export GOOGLE_CLIENT_SECRET=your-google-client-secret
export APPLE_CLIENT_ID=your-apple-client-id
export APPLE_CLIENT_SECRET=your-apple-client-secret

# 이메일 설정
export MAIL_HOST=smtp.gmail.com
export MAIL_PORT=587
export MAIL_USERNAME=your-email@gmail.com
export MAIL_PASSWORD=your-email-password

# 카카오 알림톡 설정
export KAKAO_ALIMTALK_API_KEY=your-api-key
export KAKAO_ALIMTALK_SENDER_KEY=your-sender-key

# CORS 설정
export CORS_ALLOWED_ORIGINS=https://dev.m-garden.co.kr,https://www.dev.m-garden.co.kr
```

### 1.2 application-dev.yml 사용

개발 서버에서는 `application-dev.yml` 프로파일을 사용합니다:

```bash
java -jar app.jar --spring.profiles.active=dev
```

또는 systemd 서비스 파일에서:

```ini
[Service]
Environment="SPRING_PROFILES_ACTIVE=dev"
Environment="SERVER_BASE_URL=https://dev.m-garden.co.kr"
# ... 기타 환경 변수
```

## 2. 하드코딩 제거 완료 사항

### 2.1 설정 파일

✅ **application-dev.yml 생성**
- 모든 하드코딩된 값을 환경 변수로 변경
- 도메인, URL, API 키 등 모두 환경 변수 사용

✅ **PasskeyServiceImpl 수정**
- `webauthn.rp.id` 기본값을 `localhost`로 변경 (환경 변수로 오버라이드 가능)

### 2.2 하드코딩된 API URL

다음 서비스들은 외부 API URL이 하드코딩되어 있지만, 이는 **의도된 설계**입니다:

- `StripeConnectionTestServiceImpl`: `https://api.stripe.com` (Stripe 공식 API)
- `KakaoConnectionTestServiceImpl`: `https://kapi.kakao.com` (카카오 공식 API)
- `NaverConnectionTestServiceImpl`: `https://openapi.naver.com` (네이버 공식 API)
- `PaypalConnectionTestServiceImpl`: `https://api.sandbox.paypal.com`, `https://api.paypal.com` (PayPal 공식 API)
- `TossPaymentServiceImpl`: `https://api.tosspayments.com` (토스페이먼츠 공식 API)

이러한 URL들은 **외부 서비스의 공식 엔드포인트**이므로 하드코딩이 적절합니다.  
만약 변경이 필요하다면 설정 파일로 이동할 수 있습니다.

### 2.3 OAuth2 Provider URL

OAuth2 Provider의 인증/토큰 URL도 공식 엔드포인트이므로 하드코딩이 적절합니다:
- Google: `https://accounts.google.com/o/oauth2/v2/auth`
- Apple: `https://appleid.apple.com/auth/authorize`
- Kakao: `https://kauth.kakao.com/oauth/authorize`
- Naver: `https://nid.naver.com/oauth2.0/authorize`

## 3. 개발 서버 배포 체크리스트

### 3.1 배포 전 확인 사항

- [ ] 환경 변수 파일 생성 및 설정 완료
- [ ] `application-dev.yml` 프로파일 확인
- [ ] 도메인 DNS 설정 완료
- [ ] SSL 인증서 설정 완료
- [ ] OAuth2 콜백 URL 등록 (카카오, 네이버, Google, Apple 개발자 센터)
- [ ] 데이터베이스 연결 테스트
- [ ] 환경 변수 보안 확인 (민감 정보 노출 방지)

### 3.2 OAuth2 콜백 URL 등록

각 OAuth2 제공자 개발자 센터에서 다음 콜백 URL을 등록해야 합니다:

- **카카오**: `https://dev.m-garden.co.kr/api/auth/kakao/callback`
- **네이버**: `https://dev.m-garden.co.kr/api/auth/naver/callback`
- **Google**: `https://dev.m-garden.co.kr/api/auth/google/callback`
- **Apple**: `https://dev.m-garden.co.kr/api/auth/apple/callback`

### 3.3 WebAuthn/Passkey 설정

WebAuthn은 **HTTPS 또는 localhost에서만 동작**합니다.  
개발 서버에서는 `WEBAUTHN_RP_ID`를 개발 서버 도메인으로 설정해야 합니다:

```bash
export WEBAUTHN_RP_ID=dev.m-garden.co.kr
```

## 4. systemd 서비스 파일 예시

```ini
[Unit]
Description=MindGarden Development Server
After=network.target

[Service]
Type=simple
User=mindgarden
WorkingDirectory=/opt/mindgarden
ExecStart=/usr/bin/java -jar /opt/mindgarden/mindgarden.jar
Environment="SPRING_PROFILES_ACTIVE=dev"
Environment="SERVER_BASE_URL=https://dev.m-garden.co.kr"
Environment="WEBAUTHN_RP_ID=dev.m-garden.co.kr"
Environment="FRONTEND_BASE_URL=https://dev.m-garden.co.kr"
# ... 기타 환경 변수
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## 5. 배포 후 검증

### 5.1 기본 동작 확인

```bash
# 서버 상태 확인
curl https://dev.m-garden.co.kr/actuator/health

# API 엔드포인트 확인
curl https://dev.m-garden.co.kr/api/health
```

### 5.2 OAuth2 콜백 테스트

각 OAuth2 제공자로 로그인 시도하여 콜백이 정상 동작하는지 확인합니다.

### 5.3 Passkey 테스트

WebAuthn API를 사용하여 Passkey 등록/인증이 정상 동작하는지 확인합니다.

## 6. 문제 해결

### 6.1 CORS 오류

CORS 설정이 올바른지 확인:
```yaml
cors:
  allowed-origins: https://dev.m-garden.co.kr,https://www.dev.m-garden.co.kr
```

### 6.2 OAuth2 콜백 실패

OAuth2 제공자 개발자 센터에서 콜백 URL이 정확히 등록되었는지 확인합니다.

### 6.3 WebAuthn 오류

- HTTPS 사용 확인
- `WEBAUTHN_RP_ID`가 도메인과 일치하는지 확인
- 브라우저 콘솔에서 상세 오류 확인

## 7. 보안 주의사항

⚠️ **중요**: 환경 변수 파일은 Git에 커밋하지 마세요!

- `.env.dev` 파일은 `.gitignore`에 추가
- systemd 서비스 파일에서 직접 환경 변수 설정
- 또는 환경 변수 관리 도구 사용 (예: AWS Secrets Manager, HashiCorp Vault)

