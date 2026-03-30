# API 경로 마이그레이션 가이드

**작성일**: 2025-11-20  
**버전**: 1.0.0  
**상태**: 완료

---

## 📋 개요

CoreSolution 플랫폼의 모든 API 경로가 `/api/v1/`로 표준화되었습니다. 이 문서는 프론트엔드 개발자와 API 클라이언트 개발자를 위한 마이그레이션 가이드입니다.

---

## 🔄 마이그레이션 완료 현황

### 완료된 Phase

- ✅ **Phase 4.1**: 핵심 API (13개 컨트롤러)
- ✅ **Phase 4.2**: 관리자 API (16개 컨트롤러)
- ✅ **Phase 4.3**: ERP/회계 API (10개 컨트롤러)
- ✅ **Phase 4.4**: 클라이언트/상담사 API (4개 컨트롤러)
- ✅ **Phase 4.5**: 기타 기능 API (11개 컨트롤러)

**총 54개 컨트롤러 경로 업데이트 완료**

---

## 📝 API 경로 매핑표

### 인증 관련

| 기존 경로 | 새 경로 | 상태 |
|---------|--------|------|
| `/api/auth/*` | `/api/v1/auth/*` | ✅ 완료 |
| `/api/sms-auth/*` | `/api/v1/auth/sms/*` | ✅ 완료 |
| `/api/password-reset/*` | `/api/v1/auth/password-reset/*` | ✅ 완료 |
| `/api/password/*` | `/api/v1/auth/password/*` | ✅ 완료 |

### 사용자 관련

| 기존 경로 | 새 경로 | 상태 |
|---------|--------|------|
| `/api/users/*` | `/api/v1/users/*` | ✅ 완료 |
| `/api/user/profile/*` | `/api/v1/users/profile/*` | ✅ 완료 |
| `/api/client/addresses/*` | `/api/v1/users/addresses/*` | ✅ 완료 |

### 메뉴/권한

| 기존 경로 | 새 경로 | 상태 |
|---------|--------|------|
| `/api/menu/*` | `/api/v1/menu/*` | ✅ 완료 |
| `/api/permissions/*` | `/api/v1/permissions/*` | ✅ 완료 |

### 상담 관련

| 기존 경로 | 새 경로 | 상태 |
|---------|--------|------|
| `/api/v1/consultations/*` | `/api/v1/consultations/*` | ✅ (이미 완료) |
| `/api/v1/consultants/*` | `/api/v1/consultants/*` | ✅ (이미 완료) |
| `/api/consultation-messages/*` | `/api/v1/consultation-messages/*` | ✅ 완료 |
| `/api/ratings/*` | `/api/v1/ratings/*` | ✅ 완료 |
| `/api/consultant/*` | `/api/v1/consultants/availability/*` | ✅ 완료 |

### 일정 관련

| 기존 경로 | 새 경로 | 상태 |
|---------|--------|------|
| `/api/schedules/*` | `/api/v1/schedules/*` | ✅ 완료 |

### 지점 관련

| 기존 경로 | 새 경로 | 상태 |
|---------|--------|------|
| `/api/branches/*` | `/api/v1/branches/*` | ✅ 완료 |
| `/api/hq/branch-management/*` | `/api/v1/hq/branch-management/*` | ✅ 완료 |

### 관리자 관련

| 기존 경로 | 새 경로 | 상태 |
|---------|--------|------|
| `/api/admin/*` | `/api/v1/admin/*` | ✅ 완료 |
| `/api/admin/statistics/*` | `/api/v1/admin/statistics/*` | ✅ 완료 |
| `/api/admin/statistics-management/*` | `/api/v1/admin/statistics-management/*` | ✅ 완료 |
| `/api/admin/amount-management/*` | `/api/v1/admin/amount-management/*` | ✅ 완료 |
| `/api/admin/system-config/*` | `/api/v1/admin/system-config/*` | ✅ 완료 |
| `/api/admin/*` (SystemTools) | `/api/v1/admin/system-tools/*` | ✅ 완료 |
| `/api/admin/monitoring/*` | `/api/v1/admin/monitoring/*` | ✅ 완료 |
| `/api/admin/salary/*` | `/api/v1/admin/salary/*` | ✅ 완료 |
| `/api/admin/salary-batch/*` | `/api/v1/admin/salary-batch/*` | ✅ 완료 |
| `/api/admin/salary-config/*` | `/api/v1/admin/salary-config/*` | ✅ 완료 |
| `/api/admin/css-themes/*` | `/api/v1/admin/css-themes/*` | ✅ 완료 |
| `/api/admin/session-extensions/*` | `/api/v1/admin/session-extensions/*` | ✅ 완료 |
| `/api/admin/consultation-record-alerts/*` | `/api/v1/admin/consultation-record-alerts/*` | ✅ 완료 |
| `/api/admin/database/*` | `/api/v1/admin/database/*` | ✅ 완료 |
| `/api/admin/personal-data-destruction/*` | `/api/v1/admin/personal-data-destruction/*` | ✅ 완료 |
| `/api/admin/workflow/*` | `/api/v1/admin/workflow/*` | ✅ 완료 |
| `/api/admin/consultant-records/*` | `/api/v1/admin/consultant-records/*` | ✅ 완료 |
| `/api/admin/discounts/*` | `/api/v1/admin/discounts/*` | ✅ 완료 |

### ERP/회계 관련

| 기존 경로 | 새 경로 | 상태 |
|---------|--------|------|
| `/api/erp/*` | `/api/v1/erp/*` | ✅ 완료 |
| `/api/hq/erp/*` | `/api/v1/hq/erp/*` | ✅ 완료 |
| `/api/accounts/*` | `/api/v1/accounts/*` | ✅ 완료 |
| `/api/account-integration/*` | `/api/v1/accounts/integration/*` | ✅ 완료 |
| `/api/payments/*` | `/api/v1/payments/*` | ✅ 완료 |
| `/api/admin/plsql-accounting/*` | `/api/v1/admin/plsql-accounting/*` | ✅ 완료 |
| `/api/admin/plsql-discount-accounting/*` | `/api/v1/admin/plsql-discount-accounting/*` | ✅ 완료 |
| `/api/admin/plsql-mapping-sync/*` | `/api/v1/admin/plsql-mapping-sync/*` | ✅ 완료 |
| `/api/admin/discount-accounting/*` | `/api/v1/admin/discount-accounting/*` | ✅ 완료 |

### 클라이언트 관련

| 기존 경로 | 새 경로 | 상태 |
|---------|--------|------|
| `/api/client/*` | `/api/v1/clients/*` | ✅ 완료 |
| `/api/client/profile/*` | `/api/v1/clients/profile/*` | ✅ 완료 |
| `/api/client/*` (SocialAccount) | `/api/v1/clients/social-accounts/*` | ✅ 완료 |

### 기타 기능

| 기존 경로 | 새 경로 | 상태 |
|---------|--------|------|
| `/api/motivation/*` | `/api/v1/motivation/*` | ✅ 완료 |
| `/api/privacy-consent/*` | `/api/v1/privacy-consent/*` | ✅ 완료 |
| `/api/healing/*` | `/api/v1/healing/*` | ✅ 완료 |
| `/api/activities/*` | `/api/v1/activities/*` | ✅ 완료 |
| `/api/system-notifications/*` | `/api/v1/system-notifications/*` | ✅ 완료 |
| `/api/hq/*` | `/api/v1/hq/*` | ✅ 완료 |
| `/api/local-test/*` | `/api/v1/test/local/*` | ✅ 완료 (개발 환경만) |
| `/api/test/payment/*` | `/api/v1/test/payment/*` | ✅ 완료 (개발 환경만) |

---

## 🔄 하위 호환성

### 현재 상태

모든 컨트롤러는 **하위 호환성을 유지**하고 있습니다. Spring의 `@RequestMapping` 배열 기능을 사용하여:

```java
@RequestMapping({"/api/v1/users", "/api/users"}) // 새 경로와 레거시 경로 모두 지원
```

**기존 경로도 계속 동작**하므로, 프론트엔드 코드를 즉시 변경할 필요는 없습니다.

### 마이그레이션 권장 사항

1. **점진적 마이그레이션**: 새로운 기능 개발 시 `/api/v1/` 경로 사용
2. **기존 코드 유지**: 레거시 경로는 최소 6개월간 유지 예정
3. **우선순위**: 자주 사용되는 API부터 우선적으로 마이그레이션

---

## 📝 프론트엔드 마이그레이션 가이드

### 1. API 호출 경로 업데이트

**기존 코드:**
```javascript
// 기존 경로
fetch('/api/users')
fetch('/api/admin/statistics')
fetch('/api/schedules')
```

**새 코드:**
```javascript
// 새 경로 (권장)
fetch('/api/v1/users')
fetch('/api/v1/admin/statistics')
fetch('/api/v1/schedules')
```

### 2. API 유틸리티 함수 업데이트

**기존 코드:**
```javascript
// utils/api.js
const API_BASE_URL = '/api';

export function apiGet(endpoint) {
  return fetch(`${API_BASE_URL}${endpoint}`);
}
```

**새 코드:**
```javascript
// utils/api.js
const API_BASE_URL = '/api/v1'; // v1으로 업데이트

export function apiGet(endpoint) {
  return fetch(`${API_BASE_URL}${endpoint}`);
}
```

### 3. 점진적 마이그레이션 전략

**옵션 1: 환경 변수 사용**
```javascript
// config/api.js
const API_VERSION = process.env.REACT_APP_API_VERSION || 'v1';
const API_BASE_URL = `/api/${API_VERSION}`;

export function apiGet(endpoint) {
  return fetch(`${API_BASE_URL}${endpoint}`);
}
```

**옵션 2: 하위 호환성 레이어**
```javascript
// utils/api.js
const API_BASE_URL = '/api/v1';

// 레거시 경로 매핑 (필요시)
const LEGACY_PATH_MAP = {
  '/api/users': '/api/v1/users',
  '/api/admin/statistics': '/api/v1/admin/statistics',
  // ...
};

export function apiGet(endpoint) {
  const normalizedEndpoint = LEGACY_PATH_MAP[endpoint] || endpoint;
  return fetch(`${API_BASE_URL}${normalizedEndpoint}`);
}
```

---

## 📋 마이그레이션 체크리스트

### 프론트엔드

- [ ] API 호출 경로 업데이트 (`/api/` → `/api/v1/`)
- [ ] API 유틸리티 함수 업데이트
- [ ] 환경 변수 설정 (API 버전)
- [ ] 통합 테스트 실행
- [ ] 레거시 경로 제거 (선택적, 6개월 후)

### 모바일 앱

- [ ] API 엔드포인트 업데이트
- [ ] API 클라이언트 라이브러리 업데이트
- [ ] 통합 테스트 실행
- [ ] 앱 버전별 하위 호환성 확인

### 문서화

- [ ] API 문서 업데이트 (Swagger/OpenAPI)
- [ ] 개발자 가이드 업데이트
- [ ] 마이그레이션 가이드 배포

---

## ⚠️ 주의사항

### 1. 하위 호환성 유지

- 레거시 경로는 최소 6개월간 유지됩니다
- 기존 코드는 즉시 변경할 필요가 없습니다
- 점진적으로 새 경로로 마이그레이션하세요

### 2. 테스트

- 모든 API 호출 경로 변경 후 통합 테스트 필수
- 레거시 경로와 새 경로 모두 테스트 권장

### 3. 버전 관리

- `/api/v1/`은 첫 번째 버전입니다
- 향후 `/api/v2/`, `/api/v3/` 등으로 확장 가능
- 버전별 하위 호환성 정책 준수

---

## 🔗 관련 문서

- [API 경로 표준화 계획](./API_PATH_STANDARDIZATION_PLAN.md)
- [CoreSolution 표준화 계획](./CORESOLUTION_STANDARDIZATION_PLAN.md)

---

**마지막 업데이트**: 2025-11-20

