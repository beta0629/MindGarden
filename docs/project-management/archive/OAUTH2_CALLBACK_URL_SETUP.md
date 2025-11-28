# OAuth2 콜백 URL 등록 가이드

**작성일**: 2025-11-18  
**목적**: 개발 서버 및 운영 서버 OAuth2 콜백 URL 등록 안내

## 1. 개발 서버 OAuth2 콜백 URL

### 1.1 카카오 개발자 센터

**URL**: https://developers.kakao.com/

**등록할 콜백 URL:**
```
https://dev.core-solution.co.kr/api/auth/kakao/callback
https://dev.m-garden.co.kr/api/auth/kakao/callback (기존 유지)
```

**설정 위치:**
1. 내 애플리케이션 → 앱 설정 → 플랫폼
2. Web 플랫폼 등록 (이미 등록되어 있으면 수정)
3. 사이트 도메인: `dev.core-solution.co.kr`, `dev.m-garden.co.kr`
4. Redirect URI: 위 콜백 URL 추가

### 1.2 네이버 개발자 센터

**URL**: https://developers.naver.com/

**등록할 콜백 URL:**
```
https://dev.core-solution.co.kr/api/auth/naver/callback
https://dev.m-garden.co.kr/api/auth/naver/callback (기존 유지)
```

**설정 위치:**
1. 내 애플리케이션 → API 설정 → 서비스 URL
2. 서비스 URL: `https://dev.core-solution.co.kr`
3. Callback URL: 위 콜백 URL 추가

### 1.3 구글 클라우드 콘솔

**URL**: https://console.cloud.google.com/

**등록할 콜백 URL:**
```
https://dev.core-solution.co.kr/api/auth/google/callback
https://dev.m-garden.co.kr/api/auth/google/callback (기존 유지)
```

**설정 위치:**
1. APIs & Services → Credentials
2. OAuth 2.0 Client IDs 선택
3. Authorized redirect URIs에 위 콜백 URL 추가

### 1.4 애플 개발자 센터

**URL**: https://developer.apple.com/

**등록할 콜백 URL:**
```
https://dev.core-solution.co.kr/api/auth/apple/callback
https://dev.m-garden.co.kr/api/auth/apple/callback (기존 유지)
```

**설정 위치:**
1. Certificates, Identifiers & Profiles → Identifiers
2. Services IDs 선택
3. Configure → Return URLs에 위 콜백 URL 추가

## 2. 운영 서버 OAuth2 콜백 URL

### 2.1 카카오 개발자 센터

**등록할 콜백 URL:**
```
https://app.core-solution.co.kr/api/auth/kakao/callback
https://m-garden.co.kr/api/auth/kakao/callback (기존 유지)
```

### 2.2 네이버 개발자 센터

**등록할 콜백 URL:**
```
https://app.core-solution.co.kr/api/auth/naver/callback
https://m-garden.co.kr/api/auth/naver/callback (기존 유지)
```

### 2.3 구글 클라우드 콘솔

**등록할 콜백 URL:**
```
https://app.core-solution.co.kr/api/auth/google/callback
https://m-garden.co.kr/api/auth/google/callback (기존 유지)
```

### 2.4 애플 개발자 센터

**등록할 콜백 URL:**
```
https://app.core-solution.co.kr/api/auth/apple/callback
https://m-garden.co.kr/api/auth/apple/callback (기존 유지)
```

## 3. 환경 변수 설정

### 3.1 개발 서버

**파일**: `/etc/mindgarden/dev.env` 또는 Systemd 서비스 파일

```bash
# OAuth2 Redirect URI (환경 변수로 설정)
KAKAO_REDIRECT_URI=https://dev.core-solution.co.kr/api/auth/kakao/callback
NAVER_REDIRECT_URI=https://dev.core-solution.co.kr/api/auth/naver/callback
GOOGLE_REDIRECT_URI=https://dev.core-solution.co.kr/api/auth/google/callback
APPLE_REDIRECT_URI=https://dev.core-solution.co.kr/api/auth/apple/callback
```

### 3.2 운영 서버

**파일**: `/etc/mindgarden/prod.env` 또는 Systemd 서비스 파일

```bash
# OAuth2 Redirect URI (환경 변수로 설정)
KAKAO_REDIRECT_URI=https://app.core-solution.co.kr/api/auth/kakao/callback
NAVER_REDIRECT_URI=https://app.core-solution.co.kr/api/auth/naver/callback
GOOGLE_REDIRECT_URI=https://app.core-solution.co.kr/api/auth/google/callback
APPLE_REDIRECT_URI=https://app.core-solution.co.kr/api/auth/apple/callback
```

## 4. 확인 사항

### 4.1 개발 서버

- [ ] 카카오 개발자 센터 콜백 URL 등록
- [ ] 네이버 개발자 센터 콜백 URL 등록
- [ ] 구글 클라우드 콘솔 콜백 URL 등록
- [ ] 애플 개발자 센터 콜백 URL 등록
- [ ] 환경 변수 설정 확인
- [ ] OAuth2 로그인 테스트

### 4.2 운영 서버 (운영 적용 시)

- [ ] 카카오 개발자 센터 콜백 URL 등록
- [ ] 네이버 개발자 센터 콜백 URL 등록
- [ ] 구글 클라우드 콘솔 콜백 URL 등록
- [ ] 애플 개발자 센터 콜백 URL 등록
- [ ] 환경 변수 설정 확인
- [ ] OAuth2 로그인 테스트

## 5. 주의사항

1. **기존 도메인 유지**: `m-garden.co.kr` 도메인도 함께 등록하여 하위 호환성 유지
2. **환경 변수 사용**: 하드코딩 금지, 모든 URL은 환경 변수로 관리
3. **테스트 필수**: 각 OAuth2 Provider별로 로그인 테스트 진행
4. **보안**: 콜백 URL은 정확히 일치해야 하므로 오타 주의

## 6. 참고

- `application-dev.yml`: 개발 서버 OAuth2 설정
- `application-prod.yml`: 운영 서버 OAuth2 설정 (환경 변수 사용)
- `DEV_SERVER_DOMAIN_CONFIGURATION.md`: 도메인 설정 가이드

