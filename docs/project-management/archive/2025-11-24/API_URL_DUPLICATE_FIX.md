# API URL 중복 도메인 오류 수정

**작성일**: 2025-11-24  
**문제**: `GET https://dev.core-solution.co.krhttps//dev.core-solution.co.kr/api/v1/tenant/dashboards`  
**원인**: `API_BASE_URL`이 도메인을 포함하고 있는데, 프로덕션 환경에서 Nginx 프록시를 사용하므로 상대 경로를 사용해야 함

---

## 🔍 발견된 문제

### 오류 메시지
```
GET https://dev.core-solution.co.krhttps//dev.core-solution.co.kr/api/v1/tenant/dashboards
net::ERR_NAME_NOT_RESOLVED
```

**도메인이 중복되어 있습니다!**

---

## 🔧 수정 사항

### 1. environment.js 수정

**파일**: `frontend/src/constants/environment.js`

**변경 전**:
```javascript
// 운영 환경에서는 현재 도메인 사용
if (process.env.NODE_ENV === 'production') {
  return window.location.origin; // ❌ 도메인 포함
}
```

**변경 후**:
```javascript
// 운영 환경에서는 Nginx 프록시를 사용하므로 상대 경로 사용
// Nginx가 /api 경로를 백엔드로 프록시하므로 빈 문자열 반환
if (process.env.NODE_ENV === 'production') {
  console.log('🔧 프로덕션 환경: Nginx 프록시 사용 (상대 경로)');
  return ''; // ✅ 상대 경로 사용
}
```

**추가 개선**:
- 환경변수가 빈 문자열인 경우 처리 추가
- 빈 문자열, `""`, `''` 모두 처리

---

### 2. MappingManagement.js 수정

**파일**: `frontend/src/components/admin/MappingManagement.js`

**변경 전**:
```javascript
const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || window.location.origin}/api/admin/mappings`, {
```

**변경 후**:
```javascript
import { API_BASE_URL } from '../../constants/api';
const response = await fetch(`${API_BASE_URL}/api/admin/mappings`, {
```

**이유**:
- `window.location.origin` 직접 사용 시 도메인 중복 가능
- `API_BASE_URL` 상수 사용으로 일관성 유지

---

## 📋 조사 결과

### ✅ 정상인 경우

1. **billingService.js - generateCallbackUrl()**
   - 프론트엔드 콜백 URL 생성
   - `window.location.origin` 사용이 정상 (API URL이 아님)

2. **ajax.js - apiGet(), apiPost() 등**
   - `API_BASE_URL` 상수 사용
   - `isFullUrl` 체크로 전체 URL 처리
   - 정상 동작

3. **csrfTokenManager.js - fetchWithCsrf()**
   - `API_BASE_URL` 상수 사용
   - `url.startsWith('http')` 체크로 전체 URL 처리
   - 정상 동작

### ⚠️ 수정된 경우

1. **environment.js - getBaseUrl()**
   - 프로덕션 환경에서 빈 문자열 반환하도록 수정
   - 환경변수 빈 문자열 처리 추가

2. **MappingManagement.js**
   - `window.location.origin` 직접 사용 제거
   - `API_BASE_URL` 상수 사용으로 변경

---

## 🎯 동작 원리

### Nginx 프록시 환경

```
브라우저 → https://dev.core-solution.co.kr/api/v1/tenant/dashboards
         ↓
Nginx → http://localhost:8080/api/v1/tenant/dashboards
         ↓
Spring Boot
```

**따라서**:
- 프론트엔드에서는 상대 경로(`/api/...`) 사용
- Nginx가 자동으로 백엔드로 프록시
- `API_BASE_URL`은 빈 문자열이어야 함

---

## ✅ 수정 완료 체크리스트

- [x] `environment.js` - 프로덕션 환경에서 빈 문자열 반환
- [x] `environment.js` - 환경변수 빈 문자열 처리
- [x] `MappingManagement.js` - `API_BASE_URL` 상수 사용
- [x] `billingService.js` - 콜백 URL은 `window.location.origin` 유지 (정상)

---

## 🧪 테스트 방법

### 1. 브라우저 콘솔 확인

```javascript
// API_BASE_URL 확인
console.log('API_BASE_URL:', API_BASE_URL);
// 예상 결과: "" (빈 문자열)
```

### 2. 네트워크 탭 확인

**정상 요청**:
```
GET /api/v1/tenant/dashboards
```

**오류 요청** (수정 전):
```
GET https://dev.core-solution.co.krhttps//dev.core-solution.co.kr/api/v1/tenant/dashboards
```

### 3. 대시보드 관리 페이지 테스트

1. 로그인: `https://dev.core-solution.co.kr/login`
2. 대시보드 관리: `https://dev.core-solution.co.kr/admin/dashboards`
3. 브라우저 콘솔에서 오류 확인
4. 네트워크 탭에서 API 요청 확인

---

## 📝 참고 사항

### 환경변수 설정

**프로덕션 환경**:
```bash
# .env.production
REACT_APP_API_BASE_URL=""  # 빈 문자열 또는 설정 안 함
```

**개발 환경**:
```bash
# .env.development
REACT_APP_API_BASE_URL=""  # 프록시 사용 시 빈 문자열
# 또는
REACT_APP_API_BASE_URL="http://localhost:8080"  # 직접 연결 시
```

---

## 🔗 관련 파일

- `frontend/src/constants/environment.js` - API_BASE_URL 설정
- `frontend/src/components/admin/MappingManagement.js` - window.location.origin 사용 제거
- `frontend/src/utils/ajax.js` - apiGet, apiPost 등 (정상)
- `frontend/src/utils/csrfTokenManager.js` - fetchWithCsrf (정상)

---

**최종 업데이트**: 2025-11-24

