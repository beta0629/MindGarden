# OAuth2 설정 가이드

## 📋 개요
MindGarden 프로젝트의 소셜 로그인(OAuth2) 설정 방법을 안내합니다.

## 🔑 필요한 환경 변수

프로젝트 루트에 `.env` 파일을 생성하고 다음 변수들을 설정하세요:

```bash
# OAuth2 설정
# 카카오
REACT_APP_KAKAO_CLIENT_ID=your_kakao_client_id_here
REACT_APP_KAKAO_REDIRECT_URI=http://localhost:3000/login

# 네이버
REACT_APP_NAVER_CLIENT_ID=your_naver_client_id_here
REACT_APP_NAVER_CLIENT_SECRET=your_naver_client_secret_here
REACT_APP_NAVER_REDIRECT_URI=http://localhost:3000/login

# 구글
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3000/login

# 페이스북
REACT_APP_FACEBOOK_CLIENT_ID=your_facebook_client_id_here
REACT_APP_FACEBOOK_REDIRECT_URI=http://localhost:3000/login

# API 기본 URL
REACT_APP_API_BASE_URL=http://localhost:8080
```

## 🚀 OAuth2 앱 등록 방법

### 1. 카카오 개발자 센터
1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 애플리케이션 생성
3. 플랫폼 설정 (웹 플랫폼 추가)
4. 카카오 로그인 활성화
5. Redirect URI 설정: `http://localhost:3000/login`
6. 동의항목 설정 (닉네임, 프로필 사진, 이메일)

### 2. 네이버 개발자 센터
1. [Naver Developers](https://developers.naver.com/) 접속
2. 애플리케이션 생성
3. 서비스 환경 설정 (웹 서비스 URL)
4. 로그인 오픈 API 서비스 추가
5. Callback URL 설정: `http://localhost:3000/login`
6. 동의항목 설정 (이름, 이메일, 프로필 이미지)

### 3. 구글 클라우드 콘솔
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. OAuth 2.0 클라이언트 ID 생성
4. 승인된 리디렉션 URI 추가: `http://localhost:3000/login`
5. 동의 화면 설정

### 4. 페이스북 개발자 센터
1. [Facebook Developers](https://developers.facebook.com/) 접속
2. 앱 생성
3. Facebook 로그인 제품 추가
4. 유효한 OAuth 리디렉션 URI 추가: `http://localhost:3000/login`
5. 앱 검토 요청 (필요시)

## 🔧 백엔드 설정

### 1. OAuth2 콜백 엔드포인트
```java
@PostMapping("/api/auth/oauth2/callback")
public ResponseEntity<OAuth2CallbackResponse> handleOAuth2Callback(
    @RequestBody OAuth2CallbackRequest request) {
    // OAuth2 인증 코드 처리
    // 액세스 토큰 발급
    // 사용자 정보 조회
    // 로그인 또는 회원가입 처리
}
```

### 2. 소셜 로그인 서비스
```java
@Service
public class OAuth2Service {
    
    public OAuth2UserInfo getUserInfo(String provider, String code) {
        // OAuth2 제공자별 사용자 정보 조회
        switch (provider) {
            case "KAKAO":
                return getKakaoUserInfo(code);
            case "NAVER":
                return getNaverUserInfo(code);
            // ... 기타 제공자
        }
    }
}
```

## 📱 프론트엔드 사용법

### 1. 소셜 로그인 버튼 클릭
```javascript
import { kakaoLogin, naverLogin } from '../utils/socialLogin';

// 카카오 로그인
const handleKakaoLogin = () => {
  kakaoLogin();
};

// 네이버 로그인
const handleNaverLogin = () => {
  naverLogin();
};
```

### 2. OAuth2 콜백 처리
```javascript
import { handleOAuthCallback } from '../utils/socialLogin';

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const provider = urlParams.get('provider');
  
  if (code && state && provider) {
    handleOAuthCallback(provider, code, state);
  }
}, []);
```

## 🛡️ 보안 고려사항

### 1. State 검증
- CSRF 공격 방지를 위한 state 파라미터 사용
- 세션별 고유한 state 값 생성 및 검증

### 2. PKCE (Proof Key for Code Exchange)
- 구글, 카카오 등에서 지원하는 PKCE 사용
- Authorization Code Flow의 보안 강화

### 3. 리디렉션 URI 검증
- 허용된 리디렉션 URI만 사용
- 환경별로 다른 URI 설정 (개발/스테이징/프로덕션)

## 🧪 테스트 방법

### 1. 로컬 테스트
```bash
# 프론트엔드 서버 시작
npm start

# 백엔드 서버 시작
./gradlew bootRun
```

### 2. OAuth2 플로우 테스트
1. 로그인 페이지에서 소셜 로그인 버튼 클릭
2. OAuth2 제공자 페이지로 리디렉션
3. 로그인 및 권한 승인
4. 콜백 URL로 리디렉션
5. 백엔드에서 토큰 처리
6. 로그인 성공 또는 회원가입 모달 표시

## 📚 참고 자료

- [OAuth 2.0 공식 문서](https://oauth.net/2/)
- [카카오 로그인 가이드](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [네이버 로그인 가이드](https://developers.naver.com/docs/login/api/api.md)
- [구글 OAuth 2.0 가이드](https://developers.google.com/identity/protocols/oauth2)
- [페이스북 로그인 가이드](https://developers.facebook.com/docs/facebook-login/)

## 🚨 문제 해결

### 1. 일반적인 오류
- **Invalid redirect_uri**: 리디렉션 URI가 OAuth2 앱에 등록되지 않음
- **Invalid client_id**: 클라이언트 ID가 잘못됨
- **Invalid scope**: 요청한 권한이 OAuth2 앱에 설정되지 않음

### 2. 디버깅 방법
```javascript
// 콘솔에서 OAuth2 설정 확인
console.log('OAuth2 Config:', getOAuth2Config());

// 네트워크 탭에서 요청/응답 확인
// 브라우저 개발자 도구 활용
```

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 환경 변수 설정
2. OAuth2 앱 설정
3. 백엔드 API 상태
4. 네트워크 요청/응답
5. 브라우저 콘솔 오류
