# OAuth2 운영 도메인 설정 가이드

## 🔧 카카오 개발자 콘솔 설정

### 1. 카카오 개발자 콘솔 접속
- URL: https://developers.kakao.com/
- 기존 앱: MindGarden (앱 키: cbb457cfb5f9351fd495be4af2b11a34)

### 2. 플랫폼 설정
**내 애플리케이션 > 앱 설정 > 플랫폼**
- **Web 플랫폼 추가**:
  - 사이트 도메인: `https://m-garden.co.kr`

### 3. 카카오 로그인 설정
**제품 설정 > 카카오 로그인**
- **Redirect URI 추가**:
  - 기존: `http://localhost:8080/api/auth/kakao/callback`
  - **운영 HTTP**: `http://m-garden.co.kr/api/auth/kakao/callback`
  - **운영 HTTPS**: `https://m-garden.co.kr/api/auth/kakao/callback` (권장)

### 4. 동의항목 확인
**제품 설정 > 카카오 로그인 > 동의항목**
- **필수 동의**: 닉네임, 카카오계정(이메일)
- **선택 동의**: 프로필 사진 (선택사항)

---

## 🔧 네이버 개발자 센터 설정

### 1. 네이버 개발자 센터 접속
- URL: https://developers.naver.com/
- 기존 앱: MindGarden (클라이언트 ID: vTKNlxYKIfo1uCCXaDfk)

### 2. 애플리케이션 설정
**내 애플리케이션 > 애플리케이션 정보**
- **서비스 URL 추가**: `https://m-garden.co.kr`

### 3. 네이버 로그인 설정
**API 설정 > 네이버 로그인**
- **Callback URL 추가**:
  - 기존: `http://localhost:8080/api/auth/naver/callback`
  - **운영 HTTP**: `http://m-garden.co.kr/api/auth/naver/callback`
  - **운영 HTTPS**: `https://m-garden.co.kr/api/auth/naver/callback` (권장)

### 4. 제공 정보 확인
**API 설정 > 네이버 로그인 > 제공 정보**
- **필수**: 이름, 이메일
- **선택**: 프로필 사진 (선택사항)

---

## 🔒 보안 설정 권고사항

### 1. **도메인 검증**
- 카카오/네이버 모두 HTTPS 도메인만 허용
- 서브도메인 와일드카드 사용 금지 권장

### 2. **환경별 분리**
- **개발**: localhost 도메인 유지
- **운영**: m-garden.co.kr 도메인 추가
- **스테이징**: 필요시 별도 도메인 추가

### 3. **보안 강화**
- Client Secret 환경변수로 관리
- 운영 환경에서만 실제 OAuth2 사용
- 개발 환경에서는 테스트 계정 사용

---

## ⚠️ 주의사항

### 1. **도메인 등록 순서**
1. SSL 인증서 설치 완료 후
2. HTTPS 접속 확인 후
3. OAuth2 Redirect URI 등록

### 2. **테스트 방법**
1. 로컬에서 기능 검증
2. 운영 도메인에서 OAuth2 로그인 테스트
3. 사용자 정보 수집 확인

### 3. **롤백 계획**
- 문제 발생 시 기존 localhost URI로 즉시 롤백 가능
- 양쪽 URI 모두 등록하여 점진적 전환
