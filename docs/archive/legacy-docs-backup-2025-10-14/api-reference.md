# MindGarden API 참조 문서

## 📋 목차

1. [개요](#개요)
2. [인증](#인증)
3. [사용자 관리](#사용자-관리)
4. [OAuth2](#oauth2)
5. [세션 관리](#세션-관리)
6. [에러 코드](#에러-코드)

## 🌐 개요

MindGarden API는 RESTful 원칙을 따르며, JSON 형식으로 데이터를 주고받습니다.

### 기본 정보
- **Base URL**: `http://localhost:8080`
- **Content-Type**: `application/json`
- **인증 방식**: 세션 기반 (JSESSIONID 쿠키)

### 공통 헤더
```http
Content-Type: application/json
Accept: application/json
```

## 🔐 인증

### 로그인 상태 확인

#### GET /api/auth/current-user
현재 로그인된 사용자 정보를 반환합니다.

**응답 (200 OK)**
```json
{
  "id": 1,
  "username": "이재학",
  "email": "beta74@live.co.kr",
  "role": "CLIENT",
  "nickname": "학"
}
```

**응답 (401 Unauthorized)**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "status": 401
}
```

#### GET /api/auth/session-info
현재 세션 정보와 사용자 정보를 반환합니다.

**응답 (200 OK)**
```json
{
  "sessionId": "28334FCEF0D80F83287A1EC43A582B58",
  "creationTime": "2025-08-28T09:08:05.725",
  "lastAccessedTime": "2025-08-28T09:26:19.779",
  "maxInactiveInterval": 1800,
  "userInfo": {
    "id": 1,
    "username": "이재학",
    "email": "beta74@live.co.kr",
    "role": "CLIENT",
    "nickname": "학"
  }
}
```

#### POST /api/auth/logout
사용자 로그아웃을 처리합니다.

**응답 (200 OK)**
```json
{}
```

## 👥 사용자 관리

### 사용자 역할
- **CLIENT**: 내담자
- **CONSULTANT**: 상담사
- **ADMIN**: 관리자
- **SUPER_ADMIN**: 최고 관리자

### 사용자 정보 구조
```json
{
  "id": "사용자 고유 ID",
  "username": "복호화된 사용자명",
  "email": "이메일 주소",
  "role": "사용자 역할",
  "nickname": "복호화된 닉네임"
}
```

## 🔑 OAuth2

### OAuth2 설정 정보

#### GET /api/auth/oauth2/config
OAuth2 제공자별 설정 정보를 반환합니다.

**응답 (200 OK)**
```json
{
  "kakao": {
    "clientId": "cbb457cfb5f9351fd495be4af2b11a34",
    "redirectUri": "http://localhost:8080/api/auth/oauth2/callback",
    "scope": "profile_nickname,profile_image,account_email"
  },
  "naver": {
    "clientId": "your_naver_client_id",
    "redirectUri": "http://localhost:8080/api/auth/oauth2/callback",
    "scope": "profile,email"
  }
}
```

### OAuth2 로그인

#### GET /api/auth/oauth2/kakao/login
카카오 OAuth2 로그인 URL을 생성합니다.

**응답 (200 OK)**
```
https://kauth.kakao.com/oauth/authorize?client_id=...&redirect_uri=...&response_type=code&state=...&scope=...
```

#### GET /api/auth/oauth2/naver/login
네이버 OAuth2 로그인 URL을 생성합니다.

**응답 (200 OK)**
```
https://nid.naver.com/oauth2.0/authorize?client_id=...&redirect_uri=...&response_type=code&state=...
```

### OAuth2 콜백

#### GET /api/auth/oauth2/callback
OAuth2 인증 후 콜백을 처리합니다.

**쿼리 파라미터**
- `provider`: OAuth2 제공자 (kakao, naver)
- `code`: 인증 코드
- `state`: 상태 토큰

**응답 (302 Redirect)**
```
Location: http://localhost:3000/client/dashboard?login=success&message=KAKAO+계정으로+로그인되었습니다.
```

## 📱 세션 관리

### 세션 정보
- **세션 ID**: 고유 세션 식별자
- **생성 시간**: 세션 생성 시점
- **마지막 접근 시간**: 세션 마지막 사용 시점
- **최대 비활성 시간**: 1800초 (30분)

### 세션 생명주기
1. **로그인**: OAuth2 인증 성공 후 세션 생성
2. **활성화**: API 요청 시 세션 갱신
3. **만료**: 30분 비활성 후 자동 만료
4. **로그아웃**: 세션 무효화

### 세션 보안
- **HttpOnly 쿠키**: XSS 공격 방지
- **세션 고정 공격 방지**: 로그인 후 세션 ID 변경
- **자동 만료**: 비활성 세션 자동 정리

## ❌ 에러 코드

### HTTP 상태 코드
- **200 OK**: 요청 성공
- **401 Unauthorized**: 인증 필요
- **403 Forbidden**: 권한 부족
- **404 Not Found**: 리소스 없음
- **500 Internal Server Error**: 서버 오류

### 에러 응답 형식
```json
{
  "error": "에러 타입",
  "message": "에러 메시지",
  "status": 401
}
```

### 일반적인 에러
1. **인증 실패**: 401 Unauthorized
2. **세션 만료**: 401 Unauthorized
3. **권한 부족**: 403 Forbidden
4. **잘못된 요청**: 400 Bad Request

## 🔧 API 테스트

### cURL 예시

#### 사용자 정보 조회
```bash
curl -v -H "Content-Type: application/json" \
  -b "JSESSIONID=your_session_id" \
  http://localhost:8080/api/auth/current-user
```

#### 세션 정보 조회
```bash
curl -v -H "Content-Type: application/json" \
  -b "JSESSIONID=your_session_id" \
  http://localhost:8080/api/auth/session-info
```

#### OAuth2 설정 조회
```bash
curl -v -H "Content-Type: application/json" \
  http://localhost:8080/api/auth/oauth2/config
```

### Postman 설정
1. **Base URL**: `http://localhost:8080`
2. **Headers**: `Content-Type: application/json`
3. **Cookies**: `JSESSIONID=your_session_id`

## 📊 응답 예시

### 성공적인 로그인 플로우
```json
// 1. OAuth2 설정 조회
GET /api/auth/oauth2/config
{
  "kakao": { ... },
  "naver": { ... }
}

// 2. 카카오 로그인 URL 생성
GET /api/auth/oauth2/kakao/login
"https://kauth.kakao.com/oauth/authorize?..."

// 3. OAuth2 콜백 처리
GET /api/auth/oauth2/callback?provider=kakao&code=...&state=...
302 Redirect to: /client/dashboard?login=success&message=...

// 4. 사용자 정보 조회
GET /api/auth/current-user
{
  "id": 1,
  "username": "이재학",
  "email": "beta74@live.co.kr",
  "role": "CLIENT",
  "nickname": "학"
}
```

### 세션 만료 시나리오
```json
// 세션 만료 후 API 호출
GET /api/auth/current-user
401 Unauthorized

// 로그인 페이지로 리다이렉트 필요
```

## 🚀 개발 팁

### 프론트엔드에서 API 호출
```javascript
// 세션 정보 조회
const response = await fetch('http://localhost:8080/api/auth/current-user', {
  credentials: 'include'  // 쿠키 포함
});

if (response.ok) {
  const user = await response.json();
  console.log('사용자 정보:', user);
} else {
  console.log('인증 필요');
}
```

### 에러 처리
```javascript
try {
  const response = await fetch('/api/auth/current-user', {
    credentials: 'include'
  });
  
  if (response.status === 401) {
    // 로그인 페이지로 리다이렉트
    window.location.href = '/login';
  } else if (response.ok) {
    const data = await response.json();
    // 데이터 처리
  }
} catch (error) {
  console.error('API 호출 실패:', error);
}
```

### 세션 상태 모니터링
```javascript
// 주기적으로 세션 상태 확인
setInterval(async () => {
  try {
    const response = await fetch('/api/auth/current-user', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      // 세션 만료 처리
      handleSessionExpired();
    }
  } catch (error) {
    console.error('세션 확인 실패:', error);
  }
}, 5 * 60 * 1000); // 5분마다
```

---

**마지막 업데이트**: 2025년 8월 28일  
**버전**: 1.0.0  
**작성자**: AI Assistant
