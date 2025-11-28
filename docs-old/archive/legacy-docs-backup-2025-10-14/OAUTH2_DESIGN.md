# 🔐 OAuth2 플로우 설계 문서

**최종 업데이트**: 2025년 8월 29일 12:15  
**문서 버전**: v1.0.0  
**상태**: ✅ **설계 완료**

---

## 🎯 **OAuth2 플로우 개요**

**MindGarden 상담 시스템**의 OAuth2 로그인 플로우 설계입니다.

### **아키텍처**
- **프론트엔드**: React 앱 (localhost:3000)
- **백엔드**: Spring Boot API 서버 (localhost:8080)
- **OAuth2 제공자**: Kakao, Naver

---

## 🔄 **OAuth2 플로우 순서**

### **1. 사용자 로그인 시도**
```
사용자 → React 앱 (localhost:3000) → Kakao/Naver 로그인 버튼 클릭
```

### **2. 백엔드 인증 URL 생성**
```
React 앱 → Spring Boot API (/api/auth/oauth2/kakao/authorize)
Spring Boot → Kakao OAuth2 인증 URL 생성
Spring Boot → React 앱에 인증 URL 반환
```

### **3. OAuth2 인증 페이지로 리다이렉트**
```
React 앱 → 사용자를 Kakao/Naver 인증 페이지로 리다이렉트
사용자 → Kakao/Naver에서 로그인 및 권한 승인
```

### **4. 콜백 처리**
```
Kakao/Naver → React 앱 (localhost:3000/oauth2/callback)로 리다이렉트
React 앱 → 백엔드 API (/api/auth/oauth2/callback)로 인증 코드 전달
백엔드 → 사용자 정보 조회 및 JWT 토큰 생성
백엔드 → React 앱으로 사용자 정보 및 토큰 반환
```

---

## 🔗 **URL 구조**

### **프론트엔드 (React)**
- **메인 앱**: `http://localhost:3000`
- **로그인 페이지**: `http://localhost:3000/login`
- **OAuth2 콜백**: `http://localhost:3000/oauth2/callback`

### **백엔드 (Spring Boot)**
- **API 서버**: `http://localhost:8080`
- **OAuth2 인증 URL 생성**: `/api/auth/oauth2/kakao/authorize`
- **OAuth2 콜백 처리**: `/api/auth/oauth2/callback`

---

## ⚙️ **설정값**

### **Kakao OAuth2**
```yaml
client-id: cbb457cfb5f9351fd495be4af2b11a34
client-secret: LH53SXuqZk7iEVeDkKfQuKxW0sdxYmEG
redirect-uri: http://localhost:3000/oauth2/callback
scope: profile_nickname,profile_image,account_email
```

### **Naver OAuth2**
```yaml
client-id: vTKNlxYKIfo1uCCXaDfk
client-secret: V_b3omW5pu
redirect-uri: http://localhost:3000/oauth2/callback
scope: profile_nickname,profile_image,account_email
```

---

## 🚨 **중요 설계 결정사항**

### **1. 콜백 URL 설계**
- **콜백은 프론트엔드로**: `localhost:3000/oauth2/callback`
- **백엔드는 내부 처리**: `/api/auth/oauth2/callback`
- **이유**: 프론트엔드에서 사용자 경험 제어

### **2. 데이터 흐름**
- **백엔드**: OAuth2 인증 URL 생성만 담당
- **프론트엔드**: 사용자 리다이렉트 및 콜백 처리
- **세션 관리**: JWT 토큰 기반

---

## 📋 **구현 체크리스트**

### **백엔드 (Spring Boot)**
- [x] OAuth2 인증 URL 생성 API
- [x] OAuth2 콜백 처리 API
- [x] JWT 토큰 생성
- [x] 사용자 정보 조회

### **프론트엔드 (React)**
- [x] OAuth2 로그인 버튼
- [x] 인증 URL 호출 로직
- [x] 콜백 경로 처리 (필요)
- [x] 사용자 정보 저장

---

## 🔧 **현재 구현 상태**

### **완료된 부분**
- ✅ 백엔드 OAuth2 인증 URL 생성
- ✅ 프론트엔드 OAuth2 로그인 버튼
- ✅ 설정값 수정 (콜백 URL)

### **필요한 부분**
- ⚠️ React 앱에서 `/oauth2/callback` 경로 처리
- ⚠️ 콜백 후 사용자 정보 처리
- ⚠️ 로그인 성공 후 리다이렉트

---

## 📝 **메모 및 참고사항**

### **중요한 설계 결정**
1. **콜백 URL을 프론트엔드로 설정**: 사용자 경험 제어
2. **백엔드는 API 서버 역할**: OAuth2 처리 및 JWT 생성
3. **프론트엔드에서 세션 관리**: React 상태 및 로컬 스토리지

### **최초 설계 시 고려사항**
1. **콜백 URL 설계 이유**:
   - 프론트엔드에서 사용자 경험 제어
   - 백엔드 API 서버와 분리
   - React Router를 통한 페이지 전환 제어

2. **프론트엔드-백엔드 연동 방식**:
   - 백엔드: OAuth2 인증 URL 생성만 담당
   - 프론트엔드: 사용자 리다이렉트 및 콜백 처리
   - JWT 토큰 기반 세션 관리

3. **설정값 관리**:
   - 환경별 설정 분리 (local, dev, prod)
   - OAuth2 제공자별 설정값 관리
   - 콜백 URL 환경별 동적 설정

### **문제 해결 이력**
1. **2025-08-29**: 콜백 URL 오류 발견
   - 문제: `localhost:8080`으로 콜백 설정
   - 원인: 백엔드 주소로 콜백 설정
   - 해결: `localhost:3000`으로 콜백 URL 수정

2. **설계 원칙**:
   - 콜백은 항상 프론트엔드로
   - 백엔드는 내부 API 처리만
   - 사용자 경험은 프론트엔드에서 제어

### **주의사항**
- Kakao/Naver 개발자 콘솔에서 콜백 URL 설정 필요
- CORS 설정 확인 필요
- 환경별 설정값 분리 필요
- 중요한 설계 결정사항은 반드시 문서화

---

*이 문서는 OAuth2 플로우 설계의 중요한 참고자료입니다.*
