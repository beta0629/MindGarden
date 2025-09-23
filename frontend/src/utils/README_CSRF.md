# CSRF 토큰 공통 처리 가이드

## 개요
CSRF 토큰을 자동으로 관리하고 모든 API 요청에 포함하는 공통 시스템입니다.

## 사용법

### 1. 직접 사용 (권장)
```javascript
import csrfTokenManager from '../utils/csrfTokenManager';

// POST 요청
const response = await csrfTokenManager.post('/api/admin/users/123/role', { newRole: 'ADMIN' });

// PUT 요청
const response = await csrfTokenManager.put('/api/admin/users/123', { name: '새 이름' });

// DELETE 요청
const response = await csrfTokenManager.delete('/api/admin/users/123');

// GET 요청 (CSRF 토큰 불필요하지만 일관성을 위해)
const response = await csrfTokenManager.get('/api/admin/users');
```

### 2. 기존 ajax.js 사용 (자동 CSRF 포함)
```javascript
import { apiPost, apiPut, apiDelete } from '../utils/ajax';

// POST 요청 (자동으로 CSRF 토큰 포함)
const response = await apiPost('/api/admin/users/123/role', { newRole: 'ADMIN' });

// PUT 요청 (자동으로 CSRF 토큰 포함)
const response = await apiPost('/api/admin/users/123', { name: '새 이름' });

// DELETE 요청 (자동으로 CSRF 토큰 포함)
const response = await apiDelete('/api/admin/users/123');
```

## 특징

### 1. 자동 토큰 관리
- 토큰 캐싱: 30분간 유효한 토큰을 캐시
- 자동 갱신: 토큰이 만료되면 자동으로 새로 요청
- 중복 요청 방지: 동시에 여러 요청이 와도 토큰 요청은 한 번만

### 2. 자동 헤더 포함
- `X-XSRF-TOKEN`: CSRF 토큰
- `X-Requested-With`: XMLHttpRequest
- `Content-Type`: application/json
- `credentials`: include (세션 쿠키 포함)

### 3. 에러 처리
- 토큰 요청 실패 시에도 API 요청은 진행
- 콘솔에 경고 메시지 출력

## 마이그레이션 가이드

### 기존 코드
```javascript
// ❌ 기존 방식
const csrfToken = await getCsrfToken();
const response = await fetch('/api/admin/users/123/role', {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': csrfToken
    },
    credentials: 'include',
    body: JSON.stringify({ newRole: 'ADMIN' })
});
```

### 새로운 코드
```javascript
// ✅ 새로운 방식
const response = await csrfTokenManager.put('/api/admin/users/123/role', { newRole: 'ADMIN' });
```

## 주의사항

1. **GET 요청**: CSRF 토큰이 필요하지 않지만 일관성을 위해 사용 가능
2. **FormData**: `apiPostFormData`는 CSRF 토큰을 포함하지 않음 (필요시 수동 추가)
3. **토큰 만료**: 서버에서 토큰이 만료되면 403 오류가 발생할 수 있음

## 문제 해결

### 403 Forbidden 오류
```javascript
// 토큰 캐시 초기화 후 재시도
csrfTokenManager.clearToken();
const response = await csrfTokenManager.post('/api/endpoint', data);
```

### 토큰 갱신 확인
```javascript
// 토큰 상태 확인
console.log('현재 토큰:', await csrfTokenManager.getToken());
```
