# API 설계 문서

## 1. API 개요

### 1.1 기본 정보
- **Base URL**: `http://localhost:8080/api` (인증: `/api/auth`, 일반: `/api/v1`, 사용자: `/api/users`)
- **Content-Type**: `application/json`
- **인증 방식**: JWT Token (Bearer) ✅
- **응답 형식**: JSON ✅
- **CORS**: 모든 출처 허용 (`@CrossOrigin(origins = "*")`) ✅

### 1.2 공통 응답 형식
```json
{
  "success": true,
  "message": "성공적으로 처리되었습니다.",
  "data": {},
  "timestamp": "2024-01-01T00:00:00",
  "status": 200
}
```

### 1.3 에러 응답 형식
```json
{
  "success": false,
  "message": "에러 메시지",
  "errorCode": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00",
  "status": 400
}
```

## 2. 인증 API

### 2.1 이메일 로그인 ✅
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": 1,
      "username": "user@example.com",
      "role": "CLIENT",
      "status": "ACTIVE",
      "loginType": "EMAIL",
      "profileImage": null
    }
  },
  "status": 200
}
```

### 2.2 소셜 로그인 (OAuth2) ✅

#### **2.2.1 카카오 OAuth2 로그인**
```
GET /api/auth/kakao/authorize
```

**Request Parameters:**
- `redirect_uri`: 콜백 URL (기본값: `http://localhost:8080/api/auth/kakao/callback`)

**Response:**
- 카카오 OAuth2 인증 페이지로 리다이렉트

```
GET /api/auth/kakao/callback
```

**Request Parameters:**
- `code`: 인증 코드
- `state`: 상태 토큰

**Response:**
```json
{
  "success": true,
  "message": "KAKAO 계정으로 로그인되었습니다.",
  "data": {
    "userInfo": {
      "id": 1,
      "email": "user@kakao.com",
      "name": "사용자명",
      "nickname": "닉네임",
      "role": "CLIENT",
      "profileImage": "https://...",
      "loginType": "KAKAO"
    },
    "requiresSignup": false,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "status": 200
}
```

#### **2.2.2 네이버 OAuth2 로그인**
```
GET /api/auth/naver/authorize
```

**Request Parameters:**
- `redirect_uri`: 콜백 URL (기본값: `http://localhost:8080/api/auth/naver/callback`)

**Response:**
- 네이버 OAuth2 인증 페이지로 리다이렉트

```
GET /api/auth/naver/callback
```

**Request Parameters:**
- `code`: 인증 코드
- `state`: 상태 토큰

**Response:**
```json
{
  "success": true,
  "message": "NAVER 계정으로 로그인되었습니다.",
  "data": {
    "userInfo": {
      "id": 1,
      "email": "user@naver.com",
      "name": "사용자명",
      "nickname": "닉네임",
      "role": "CLIENT",
      "profileImage": "https://...",
      "loginType": "NAVER"
    },
    "requiresSignup": false,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "status": 200
}
```

#### **2.2.3 소셜 회원가입**
```
POST /api/auth/social/signup
```

**Request Body:**
```json
{
  "provider": "KAKAO",
  "providerUserId": "123456789",
  "email": "user@example.com",
  "name": "사용자명",
  "nickname": "닉네임",
  "phone": "010-1234-5678",
  "gender": "MALE",
  "birthYear": "1990",
  "birthMonth": "01",
  "birthDay": "01"
}
```

**Response:**
```json
{
  "success": true,
  "message": "🎉 소셜 계정으로 간편 회원가입이 완료되었습니다! 이제 다시 로그인해주세요.",
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "name": "사용자명",
    "nickname": "닉네임",
    "redirectUrl": "/tablet/login?signup=success&email=user@example.com",
    "canApplyConsultant": true,
    "consultantApplicationMessage": "상담사 신청이 가능합니다.",
    "profileCompletionRate": 85
  },
  "status": 200
}
```

### 2.3 회원가입 ✅
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "사용자명",
  "role": "CLIENT",
  "phone": "010-1234-5678"
}
```

### 2.3 토큰 갱신 ✅
```
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

### 2.4 로그아웃 ✅
```
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer jwt_token_here
```

### 2.5 비밀번호 재설정 ✅
```
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### 2.6 SNS 로그인 (향후 구현)
#### 2.6.1 카카오 로그인
```
POST /api/auth/kakao
```

#### 2.6.2 네이버 로그인
```
POST /api/auth/naver
```

#### 2.6.3 페이스북 로그인
```
POST /api/auth/facebook
```

**Request Body:**
```json
{
  "accessToken": "facebook_access_token_here"
}
```

#### 2.2.4 인스타그램 로그인
```
POST /api/v1/auth/instagram
```

**Request Body:**
```json
{
  "accessToken": "instagram_access_token_here"
}
```

**SNS 로그인 Response:**
```json
{
  "success": true,
  "message": "SNS 로그인 성공",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": 1,
      "username": "홍길동",
      "email": "user@kakao.com",
      "role": "CLIENT",
      "status": "ACTIVE",
      "loginType": "KAKAO",
      "profileImage": "https://example.com/profile.jpg"
    },
    "isNewUser": false,
    "socialAccount": {
      "provider": "KAKAO",
      "providerUserId": "kakao_user_id_123"
    }
  },
  "status": 200
}
```

### 2.3 SNS 계정 연동
```
POST /api/v1/auth/social/link
```

**Request Body:**
```json
{
  "provider": "GOOGLE",
  "accessToken": "access_token_here"
}
```

### 2.4 SNS 계정 연동 해제
```
DELETE /api/v1/auth/social/unlink/{provider}
```

### 2.5 SNS 계정 목록 조회
```
GET /api/v1/auth/social/accounts
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "provider": "KAKAO",
      "providerUserId": "kakao_user_id_123",
      "email": "user@kakao.com",
      "profileImage": "https://example.com/profile.jpg",
      "linkedAt": "2024-01-01T00:00:00"
    },
    {
      "id": 2,
      "provider": "NAVER",
      "providerUserId": "naver_user_id_456",
      "email": "user@naver.com",
      "profileImage": "https://example.com/naver_profile.jpg",
      "linkedAt": "2024-01-02T00:00:00"
    },
    {
      "id": 3,
      "provider": "FACEBOOK",
      "providerUserId": "facebook_user_id_789",
      "email": "user@facebook.com",
      "profileImage": "https://example.com/facebook_profile.jpg",
      "linkedAt": "2024-01-03T00:00:00"
    },
    {
      "id": 4,
      "provider": "INSTAGRAM",
      "providerUserId": "instagram_user_id_012",
      "email": "user@instagram.com",
      "profileImage": "https://example.com/instagram_profile.jpg",
      "linkedAt": "2024-01-04T00:00:00"
    }
  ]
}
```

### 2.2 회원가입
```
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "username": "newuser@example.com",
  "password": "password123",
  "email": "newuser@example.com",
  "role": "CLIENT"
}
```

### 2.3 토큰 갱신
```
POST /api/v1/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

## OAuth2 API 설계

### 최근 업데이트 (2025-09-01)

#### 1. OAuth2 콜백 API 개선

##### 네이버 OAuth2 콜백
```http
GET /api/oauth2/naver/callback?code={authorization_code}&state={state}&mode={login|link}
```

**파라미터**:
- `code` (필수): 네이버에서 받은 인증 코드
- `state` (필수): CSRF 방지를 위한 상태값
- `mode` (선택): 
  - `login`: 일반 로그인 (기본값)
  - `link`: 기존 사용자에게 소셜 계정 연동

**응답**:
```json
// 로그인 모드 (기존과 동일)
{
  "success": true,
  "redirectUrl": "http://localhost:3000/dashboard"
}

// 연동 모드
{
  "success": true,
  "redirectUrl": "http://localhost:3000/mypage?success=연동완료&provider=NAVER"
}
```

##### 카카오 OAuth2 콜백
```http
GET /api/oauth2/kakao/callback?code={authorization_code}&state={state}&mode={login|link}
```

**파라미터**: 네이버와 동일

#### 2. 소셜 계정 연동 API

##### 기존 사용자에게 소셜 계정 연동
```http
POST /api/oauth2/link-social-account
```

**요청 본문**:
```json
{
  "userId": 123,
  "socialUserInfo": {
    "providerUserId": "123456789",
    "email": "user@example.com",
    "name": "홍길동",
    "nickname": "길동이",
    "profileImageUrl": "https://example.com/profile.jpg",
    "provider": "NAVER"
  }
}
```

**응답**:
```json
{
  "success": true,
  "message": "소셜 계정 연동 완료"
}
```

#### 3. 사용자 정보 API 개선

##### 현재 사용자 정보 조회
```http
GET /api/auth/current-user
```

**응답** (프로필 이미지 우선순위 정보 추가):
```json
{
  "id": 23,
  "username": "user123",
  "name": "이재학",
  "nickname": "반짝반짝",
  "email": "user@example.com",
  "role": "CLIENT",
  "profileImageUrl": "https://example.com/user-uploaded.jpg",  // 사용자 업로드 이미지 (최우선)
  "socialProfileImage": "https://example.com/social-image.jpg", // 소셜 이미지 (2순위)
  "socialProvider": "NAVER"                                     // 소셜 제공자
}
```

**프로필 이미지 우선순위**:
1. `profileImageUrl`: 사용자가 직접 업로드한 이미지
2. `socialProfileImage`: 소셜 계정에서 가져온 이미지
3. 기본 아이콘: 위 두 이미지가 모두 없는 경우

#### 4. 소셜 계정 정보 API

##### 사용자의 소셜 계정 목록 조회
```http
GET /api/client/social-accounts
```

**응답**:
```json
{
  "socialAccounts": [
    {
      "id": 1,
      "provider": "NAVER",
      "providerUserId": "123456789",
      "providerProfileImage": "https://example.com/naver-profile.jpg",
      "isPrimary": true,
      "createdAt": "2025-09-01T10:00:00Z"
    },
    {
      "id": 2,
      "provider": "KAKAO",
      "providerUserId": "987654321",
      "providerProfileImage": "https://example.com/kakao-profile.jpg",
      "isPrimary": false,
      "createdAt": "2025-09-01T11:00:00Z"
    }
  ]
}
```

### API 변경사항 요약

#### 추가된 기능
1. **OAuth2 콜백에 `mode` 파라미터 추가**
   - 기존 로그인 기능 유지
   - 새로운 계정 연동 기능 추가

2. **프로필 이미지 우선순위 시스템**
   - 백엔드에서 이미지 타입 구분
   - 프론트엔드에서 우선순위 적용

3. **소셜 계정 연동 API**
   - 기존 사용자에게 소셜 계정 추가 기능
   - 연동 상태 관리

#### 개선된 기능
1. **사용자 정보 API**
   - 프로필 이미지 관련 필드 추가
   - 소셜 계정 정보 포함

2. **에러 처리**
   - 타입 오류 수정 (`providerUserId` Long → String)
   - 연동 실패 시 적절한 에러 응답

### API 사용 예시

#### 1. 소셜 로그인 플로우
```javascript
// 1. 소셜 로그인 시작
window.location.href = '/api/oauth2/naver/authorize';

// 2. 콜백 처리 (로그인 모드)
// GET /api/oauth2/naver/callback?code=xxx&state=xxx&mode=login
// → 대시보드로 리다이렉트
```

#### 2. 소셜 계정 연동 플로우
```javascript
// 1. 기존 사용자 로그인 상태에서 연동 시작
window.location.href = '/api/oauth2/naver/authorize?mode=link';

// 2. 콜백 처리 (연동 모드)
// GET /api/oauth2/naver/callback?code=xxx&state=xxx&mode=link
// → 마이페이지로 리다이렉트 (연동 완료 메시지)
```

#### 3. 프로필 이미지 표시
```javascript
// 세션에서 사용자 정보 조회
const { user } = useSession();

// 이미지 우선순위 적용
const profileImage = user.profileImageUrl || user.socialProfileImage || null;

// 이미지 타입 배지 표시
const imageType = user.profileImageUrl ? '사용자' : 
                  user.socialProfileImage ? user.socialProvider : '기본';
```

### 에러 코드

#### OAuth2 관련 에러
- `OAUTH2_INVALID_CODE`: 유효하지 않은 인증 코드
- `OAUTH2_ACCOUNT_LINKING_FAILED`: 계정 연동 실패
- `OAUTH2_PROVIDER_ERROR`: 소셜 제공자 오류

#### 사용자 관련 에러
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `USER_ALREADY_LINKED`: 이미 연동된 소셜 계정
- `INVALID_SOCIAL_ACCOUNT`: 유효하지 않은 소셜 계정 정보

### 보안 고려사항

1. **CSRF 방지**: `state` 파라미터 사용
2. **세션 검증**: 연동 모드에서 기존 세션 확인
3. **권한 검증**: 사용자 본인의 계정만 연동 가능
4. **데이터 검증**: 소셜 계정 정보 유효성 검사

## 3. 사용자 관리 API

### 3.1 사용자 목록 조회
```
GET /api/v1/users?page=0&size=10&role=CLIENT&status=ACTIVE
```

**Query Parameters:**
- `page`: 페이지 번호 (기본값: 0)
- `size`: 페이지 크기 (기본값: 10)
- `role`: 사용자 역할 필터
- `status`: 사용자 상태 필터
- `search`: 검색어

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "username": "user1@example.com",
        "email": "user1@example.com",
        "role": "CLIENT",
        "status": "ACTIVE",
        "createdAt": "2024-01-01T00:00:00"
      }
    ],
    "totalElements": 100,
    "totalPages": 10,
    "size": 10,
    "number": 0
  }
}
```

### 3.2 사용자 상세 조회
```
GET /api/v1/users/{id}
```

### 3.3 사용자 정보 수정
```
PUT /api/v1/users/{id}
```

**Request Body:**
```json
{
  "email": "updated@example.com",
  "status": "ACTIVE"
}
```

### 3.4 사용자 삭제
```
DELETE /api/v1/users/{id}
```

## 4. 상담사 관리 API

### 4.1 상담사 목록 조회
```
GET /api/v1/consultants?specialty=PSYCHOLOGY&experience=5&rating=4.0
```

### 4.2 내담자 관리
```
GET /api/v1/consultants/{id}/clients?status=ACTIVE&page=0&size=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "user": {
          "id": 2,
          "username": "client1@example.com",
          "email": "client1@example.com"
        },
        "emergencyContact": "010-1234-5678",
        "emergencyRelationship": "배우자",
        "medicalHistory": "우울증 진단 이력",
        "occupation": "회사원",
        "status": "ACTIVE",
        "lastConsultationDate": "2024-01-10",
        "nextConsultationDate": "2024-01-17",
        "totalSessions": 5,
        "completedSessions": 3
      }
    ],
    "totalElements": 25,
    "totalPages": 3
  }
}
```

### 4.3 내담자 상세 정보
```
GET /api/v1/consultants/{consultantId}/clients/{clientId}
```

### 4.4 내담자 프로필 수정
```
PUT /api/v1/consultants/{consultantId}/clients/{clientId}
```

**Request Body:**
```json
{
  "emergencyContact": "010-9876-5432",
  "medicalHistory": "우울증, 불안장애 진단 이력",
  "familyBackground": "부모님과 함께 거주",
  "treatmentGoals": "일상생활 복귀 및 대인관계 개선"
}
```

**Query Parameters:**
- `specialty`: 전문 분야
- `experience`: 최소 경력 연차
- `rating`: 최소 평점
- `status`: 상담사 상태
- `available`: 상담 가능 여부

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user": {
        "id": 2,
        "username": "consultant1@example.com",
        "email": "consultant1@example.com"
      },
      "specialty": "PSYCHOLOGY",
      "experience": 5,
      "rating": 4.5,
      "status": "ACTIVE",
      "availableSlots": [
        {
          "date": "2024-01-15",
          "startTime": "09:00",
          "endTime": "10:00"
        }
      ]
    }
  ]
}
```

### 4.2 상담사 상세 정보
```
GET /api/v1/consultants/{id}
```

### 4.3 상담사 스케줄 조회
```
GET /api/v1/consultants/{id}/schedule?startDate=2024-01-01&endDate=2024-01-31
```

### 4.4 상담사 등록
```
POST /api/v1/consultants
```

**Request Body:**
```json
{
  "userId": 2,
  "specialty": "PSYCHOLOGY",
  "experience": 5,
  "certifications": ["PSYCHOLOGY_LICENSE"],
  "description": "심리 상담 전문가입니다."
}
```

## 5. 상담 관리 API

### 5.1 상담 신청
```
POST /api/v1/consultations
```

**Request Body:**
```json
{
  "clientId": 1,
  "consultantId": 2,
  "requestDate": "2024-01-15T10:00:00",
  "notes": "심리 상담이 필요합니다.",
  "preferredTime": "09:00-10:00"
}
```

### 5.2 상담 목록 조회
```
GET /api/v1/consultations?status=REQUESTED&clientId=1&consultantId=2
```

**Query Parameters:**
- `status`: 상담 상태
- `clientId`: 클라이언트 ID
- `consultantId`: 상담사 ID
- `startDate`: 시작 날짜
- `endDate`: 종료 날짜

### 5.3 상담 상태 변경
```
PATCH /api/v1/consultations/{id}/status
```

**Request Body:**
```json
{
  "status": "ASSIGNED",
  "consultDate": "2024-01-15T10:00:00",
  "notes": "상담사가 배정되었습니다."
}
```

### 5.4 상담 완료
```
POST /api/v1/consultations/{id}/complete
```

**Request Body:**
```json
{
  "rating": 5,
  "feedback": "매우 만족스러운 상담이었습니다.",
  "notes": "상담 내용 요약..."
}
```

## 6. 스케줄 관리 API

### 6.1 풀 캘린더 뷰
```
GET /api/v1/consultants/{id}/calendar?start=2024-01-01&end=2024-01-31&view=month
```

**Query Parameters:**
- `start`: 시작 날짜 (YYYY-MM-DD)
- `end`: 종료 날짜 (YYYY-MM-DD)
- `view`: 뷰 타입 (month, week, day)
- `clientId`: 특정 내담자 필터 (선택사항)

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 1,
        "title": "김철수 상담 (1회차)",
        "start": "2024-01-15T10:00:00",
        "end": "2024-01-15T11:00:00",
        "allDay": false,
        "type": "CONSULTATION",
        "clientId": 1,
        "clientName": "김철수",
        "sessionNumber": 1,
        "status": "SCHEDULED",
        "backgroundColor": "#0ea5e9",
        "borderColor": "#0284c7",
        "textColor": "#ffffff",
        "extendedProps": {
          "consultationId": 1,
          "duration": 60,
          "notes": "첫 상담 - 초기 평가"
        }
      },
      {
        "id": 2,
        "title": "이영희 상담 (3회차)",
        "start": "2024-01-15T14:00:00",
        "end": "2024-01-15T15:00:00",
        "allDay": false,
        "type": "CONSULTATION",
        "clientId": 2,
        "clientName": "이영희",
        "sessionNumber": 3,
        "status": "CONFIRMED",
        "backgroundColor": "#10b981",
        "borderColor": "#059669",
        "textColor": "#ffffff",
        "extendedProps": {
          "consultationId": 2,
          "duration": 60,
          "notes": "진행중인 상담"
        }
      },
      {
        "id": 3,
        "title": "업무 시간",
        "start": "2024-01-15T09:00:00",
        "end": "2024-01-15T18:00:00",
        "allDay": false,
        "type": "WORK_HOURS",
        "backgroundColor": "#f3f4f6",
        "borderColor": "#d1d5db",
        "textColor": "#374151",
        "extendedProps": {
          "notes": "정상 근무 시간"
        }
      }
    ],
    "businessHours": {
      "startTime": "09:00",
      "endTime": "18:00",
      "daysOfWeek": [1, 2, 3, 4, 5]
    },
    "availableSlots": [
      {
        "date": "2024-01-16",
        "slots": [
          {
            "startTime": "10:00",
            "endTime": "11:00",
            "available": true
          },
          {
            "startTime": "14:00",
            "endTime": "15:00",
            "available": false
          }
        ]
      }
    ]
  }
}
```

### 6.2 스케줄 등록
```
POST /api/v1/schedules
```

**Request Body:**
```json
{
  "consultantId": 2,
  "date": "2024-01-15",
  "startTime": "09:00",
  "endTime": "17:00",
  "status": "AVAILABLE",
  "notes": "정상 근무"
}
```

### 6.2 스케줄 조회
```
GET /api/v1/schedules?consultantId=2&date=2024-01-15&status=AVAILABLE
```

### 6.3 스케줄 수정
```
PUT /api/v1/schedules/{id}
```

### 6.4 스케줄 삭제
```
DELETE /api/v1/schedules/{id}
```

## 7. 상담일지 관리 API

### 7.1 상담일지 목록 조회
```
GET /api/v1/consultants/{consultantId}/consultation-records?clientId=1&startDate=2024-01-01&endDate=2024-01-31
```

**Query Parameters:**
- `clientId`: 내담자 ID (선택사항)
- `startDate`: 시작 날짜
- `endDate`: 종료 날짜
- `sessionNumber`: 상담 회차 (선택사항)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "consultationId": 1,
      "clientName": "김철수",
      "sessionDate": "2024-01-10",
      "sessionNumber": 1,
      "clientCondition": "긴장감과 불안감이 심함",
      "mainIssues": "직장에서의 스트레스와 대인관계 어려움",
      "interventionMethods": "인지행동치료 기법, 이완훈련",
      "clientResponse": "이완훈련에 적극적으로 참여, 호흡법 숙지",
      "nextSessionPlan": "스트레스 관리 기법 추가 학습",
      "homeworkAssigned": "매일 10분 이완훈련 실시",
      "riskAssessment": "LOW",
      "notes": "내담자가 치료에 적극적이며 호전 기미 보임"
    }
  ]
}
```

### 7.2 상담일지 상세 조회
```
GET /api/v1/consultants/{consultantId}/consultation-records/{recordId}
```

### 7.3 상담일지 작성
```
POST /api/v1/consultants/{consultantId}/consultation-records
```

**Request Body:**
```json
{
  "consultationId": 1,
  "sessionDate": "2024-01-10",
  "sessionNumber": 1,
  "clientCondition": "긴장감과 불안감이 심함",
  "mainIssues": "직장에서의 스트레스와 대인관계 어려움",
  "interventionMethods": "인지행동치료 기법, 이완훈련",
  "clientResponse": "이완훈련에 적극적으로 참여, 호흡법 숙지",
  "nextSessionPlan": "스트레스 관리 기법 추가 학습",
  "homeworkAssigned": "매일 10분 이완훈련 실시",
  "riskAssessment": "LOW",
  "notes": "내담자가 치료에 적극적이며 호전 기미 보임"
}
```

### 7.4 상담일지 수정
```
PUT /api/v1/consultants/{consultantId}/consultation-records/{recordId}
```

### 7.5 상담일지 삭제
```
DELETE /api/v1/consultants/{consultantId}/consultation-records/{recordId}
```

### 7.6 내담자별 상담일지 요약
```
GET /api/v1/consultants/{consultantId}/clients/{clientId}/consultation-summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientInfo": {
      "id": 1,
      "name": "김철수",
      "totalSessions": 5,
      "completedSessions": 3,
      "firstSessionDate": "2024-01-03",
      "lastSessionDate": "2024-01-17"
    },
    "progressSummary": {
      "initialCondition": "심한 우울감과 불안감",
      "currentCondition": "상당한 호전, 일상생활 가능",
      "mainProgress": "스트레스 관리 기법 습득, 대인관계 개선",
      "remainingGoals": "자기효능감 향상, 완전한 회복"
    },
    "recentRecords": [
      {
        "sessionNumber": 3,
        "sessionDate": "2024-01-17",
        "keyAchievements": "스트레스 상황에서 이완훈련 성공적으로 적용",
        "nextSteps": "자기효능감 향상 훈련 시작"
      }
    ],
    "riskAssessment": "LOW",
    "recommendations": "현재 진행상황 유지, 추가 회기 진행 권장"
  }
}
```

## 8. 상담 기록 API (기존)

**Request Body:**
```json
{
  "consultationId": 1,
  "content": "상담 내용 상세 기록...",
  "attachments": [
    {
      "fileName": "consultation_note.pdf",
      "fileUrl": "https://example.com/files/note.pdf"
    }
  ],
  "tags": ["심리상담", "스트레스관리"]
}
```

### 7.2 상담 기록 조회
```
GET /api/v1/consultation-records?consultationId=1&tags=심리상담
```

### 7.3 상담 기록 수정
```
PUT /api/v1/consultation-records/{id}
```

## 8. 통계 및 리포트 API

### 8.1 대시보드 통계
```
GET /api/v1/dashboard/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalConsultations": 150,
    "pendingConsultations": 25,
    "completedConsultations": 120,
    "cancelledConsultations": 5,
    "totalClients": 80,
    "totalConsultants": 15,
    "averageRating": 4.3,
    "monthlyStats": [
      {
        "month": "2024-01",
        "consultations": 45,
        "revenue": 4500000
      }
    ]
  }
}
```

### 8.2 상담사별 통계
```
GET /api/v1/consultants/{id}/stats?startDate=2024-01-01&endDate=2024-01-31
```

### 8.3 클라이언트별 통계
```
GET /api/v1/clients/{id}/stats?startDate=2024-01-01&endDate=2024-01-31
```

## 9. 대시보드 컴포넌트 API

### 9.1 사용자 대시보드 레이아웃 조회
```
GET /api/v1/dashboard/layout
```

**Response:**
```json
{
  "success": true,
  "data": {
    "layoutId": "layout_001",
    "layoutName": "내 대시보드",
    "layoutType": "GRID",
    "components": [
      {
        "componentId": "comp_001",
        "componentType": "STATS_CARD",
        "title": "오늘의 상담",
        "size": "MEDIUM",
        "position": "{\"x\": 0, \"y\": 0, \"w\": 2, \"h\": 1}",
        "config": {
          "theme": "primary",
          "showIcon": true
        },
        "data": {
          "value": 5,
          "change": "+2",
          "changeType": "increase"
        }
      },
      {
        "componentId": "comp_002",
        "componentType": "LINE_CHART",
        "title": "상담 통계",
        "size": "LARGE",
        "position": "{\"x\": 2, \"y\": 0, \"w\": 4, \"h\": 2}",
        "config": {
          "chartType": "line",
          "showLegend": true,
          "showGrid": true
        },
        "data": {
          "labels": ["1월", "2월", "3월", "4월"],
          "datasets": [
            {
              "label": "상담 건수",
              "data": [12, 19, 15, 25]
            }
          ]
        }
      }
    ],
    "gridConfig": {
      "columns": 12,
      "rowHeight": 60,
      "margin": [10, 10]
    }
  }
}
```

### 9.2 대시보드 컴포넌트 추가
```
POST /api/v1/dashboard/components
```

**Request Body:**
```json
{
  "componentType": "BAR_CHART",
  "title": "월별 상담 통계",
  "size": "MEDIUM",
  "position": {
    "x": 0,
    "y": 2,
    "w": 3,
    "h": 2
  },
  "config": {
    "chartType": "bar",
    "showLegend": true,
    "colors": ["#0ea5e9", "#10b981"]
  }
}
```

### 9.3 대시보드 컴포넌트 수정
```
PUT /api/v1/dashboard/components/{componentId}
```

**Request Body:**
```json
{
  "title": "수정된 제목",
  "config": {
    "chartType": "bar",
    "showLegend": false,
    "colors": ["#0ea5e9"]
  }
}
```

### 9.4 대시보드 컴포넌트 삭제
```
DELETE /api/v1/dashboard/components/{componentId}
```

### 9.5 대시보드 레이아웃 저장
```
PUT /api/v1/dashboard/layout
```

**Request Body:**
```json
{
  "layoutName": "업데이트된 레이아웃",
  "components": [
    {
      "componentId": "comp_001",
      "position": {
        "x": 1,
        "y": 1,
        "w": 2,
        "h": 1
      }
    }
  ]
}
```

### 9.6 사용 가능한 컴포넌트 목록 조회
```
GET /api/v1/dashboard/components/available
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "componentType": "STATS_CARD",
      "name": "통계 카드",
      "description": "주요 지표를 카드 형태로 표시",
      "icon": "chart-bar",
      "defaultSize": "MEDIUM",
      "configurable": true
    },
    {
      "componentType": "LINE_CHART",
      "name": "선 차트",
      "description": "시계열 데이터를 선 차트로 표시",
      "icon": "chart-line",
      "defaultSize": "LARGE",
      "configurable": true
    }
  ]
}
```

## 10. 파일 업로드 API

### 10.1 파일 업로드
```
POST /api/v1/files/upload
```

**Request:**
- `Content-Type`: `multipart/form-data`
- `file`: 업로드할 파일
- `category`: 파일 카테고리 (CONSULTATION_RECORD, PROFILE_IMAGE 등)

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "uuid_here",
    "fileName": "original_name.pdf",
    "fileUrl": "https://example.com/files/uuid_here.pdf",
    "fileSize": 1024000,
    "contentType": "application/pdf"
  }
}
```

### 9.2 파일 다운로드
```
GET /api/v1/files/{fileId}/download
```

### 9.3 파일 삭제
```
DELETE /api/v1/files/{fileId}
```

## 10. 검색 API

### 10.1 통합 검색
```
GET /api/v1/search?q=심리상담&type=ALL&page=0&size=10
```

**Query Parameters:**
- `q`: 검색어
- `type`: 검색 타입 (ALL, CONSULTATION, CONSULTANT, CLIENT)
- `page`: 페이지 번호
- `size`: 페이지 크기

**Response:**
```json
{
  "success": true,
  "data": {
    "consultations": [...],
    "consultants": [...],
    "clients": [...],
    "totalResults": 25
  }
}
```

## 11. 알림 API

### 11.1 알림 목록 조회
```
GET /api/v1/notifications?read=false&type=CONSULTATION_REQUEST
```

### 11.2 알림 읽음 처리
```
PATCH /api/v1/notifications/{id}/read
```

### 11.3 알림 설정
```
PUT /api/v1/notifications/settings
```

**Request Body:**
```json
{
  "emailNotification": true,
  "smsNotification": false,
  "pushNotification": true,
  "consultationRequest": true,
  "scheduleChange": true,
  "reminder": true
}
```

## 12. 현재 구현된 API 상태 (업데이트: 2025년 1월) ✅

### 12.1 구현 완료된 API 엔드포인트

#### **인증 API** ✅ (`/api/auth`)
- `POST /api/auth/login` - 이메일 로그인
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/refresh` - 토큰 갱신
- `POST /api/auth/logout` - 로그아웃
- `POST /api/auth/forgot-password` - 비밀번호 찾기
- `POST /api/auth/reset-password` - 비밀번호 재설정

#### **사용자 API** ✅ (`/api/users`)
- 기본 CRUD (BaseController 상속): GET, POST, PUT, PATCH, DELETE
- `GET /api/users/email/{email}` - 이메일로 조회
- `GET /api/users/nickname/{nickname}` - 닉네임으로 조회
- `GET /api/users/phone/{phone}` - 전화번호로 조회
- `GET /api/users/role/{role}` - 역할별 조회

#### **상담사 API** ✅ (`/api/v1/consultants`)
- `GET /api/v1/consultants` - 상담사 목록 (복합 조건 검색)
- `GET /api/v1/consultants/{id}` - 상담사 상세 정보
- `GET /api/v1/consultants/{id}/schedule` - 상담사 스케줄
- `GET /api/v1/consultants/{id}/clients` - 담당 내담자 목록
- `POST /api/v1/consultants/{id}/schedule` - 스케줄 등록
- `PUT /api/v1/consultants/{id}` - 프로필 업데이트

#### **상담 API** ✅ (`/api/v1/consultations`)
- `GET /api/v1/consultations` - 상담 목록 조회
- `GET /api/v1/consultations/{id}` - 상담 상세 정보
- `POST /api/v1/consultations` - 상담 예약 생성
- `POST /api/v1/consultations/{id}/confirm` - 상담 확정
- `POST /api/v1/consultations/{id}/cancel` - 상담 취소
- `POST /api/v1/consultations/{id}/start` - 상담 시작
- `POST /api/v1/consultations/{id}/complete` - 상담 완료
- `GET /api/v1/consultations/available-slots` - 가능한 시간 조회
- `POST /api/v1/consultations/emergency` - 긴급 상담 요청

#### **태블릿 API** ✅ (`/tablet`)
- `GET /tablet/` - 태블릿 홈
- `GET /tablet/consultation` - 상담 관리
- `GET /tablet/clients` - 내담자 관리
- `GET /tablet/consultants` - 상담사 관리
- `GET /tablet/reports` - 보고서
- `GET /tablet/settings` - 설정

### 12.2 API 보안 구현 상태 ✅

#### **인증 시스템**
- JWT 기반 토큰 인증 ✅
- 토큰 갱신 메커니즘 ✅
- 비밀번호 암호화 ✅
- CORS 설정 ✅

#### **인증 헤더**
```
Authorization: Bearer {jwt_token}
```

### 12.2 권한별 접근 제어
- **ADMIN**: 모든 API 접근 가능
- **CONSULTANT**: 상담 관련 API, 자신의 정보만 접근 가능
- **CLIENT**: 자신의 상담 정보만 접근 가능

### 12.3 Rate Limiting
- 일반 사용자: 100 requests/hour
- 상담사: 500 requests/hour
- 관리자: 1000 requests/hour

### 12.4 API 버전 관리
- URL 경로에 버전 포함: `/api/v1/`
- 헤더에 버전 정보 포함: `API-Version: 1.0`

## 13. 에러 코드

### 13.1 HTTP 상태 코드
- `200`: 성공
- `201`: 생성됨
- `400`: 잘못된 요청
- `401`: 인증 실패
- `403`: 권한 없음
- `404`: 리소스 없음
- `409`: 충돌
- `500`: 서버 오류

### 13.2 비즈니스 에러 코드
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `CONSULTATION_NOT_FOUND`: 상담을 찾을 수 없음
- `INVALID_STATUS_TRANSITION`: 잘못된 상태 변경
- `SCHEDULE_CONFLICT`: 스케줄 충돌
- `INSUFFICIENT_PERMISSION`: 권한 부족
