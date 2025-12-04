# 프론트엔드 API 경로 현황 보고서

**작성일**: 2025-12-04  
**우선순위**: Priority 2.1 Day 5  
**상태**: 확인 완료

---

## 📌 개요

프론트엔드에서 사용하는 API 경로를 확인하고, `/api/v1/` 표준 경로로 마이그레이션하는 작업입니다.

---

## 🔍 현재 상태 분석

### 1. API 엔드포인트 정의 파일

#### `frontend/src/constants/apiEndpoints.js`

**현재 상태**:
- ✅ 일부 엔드포인트는 이미 `/api/v1/` 사용:
  - `/api/v1/tenant/dashboards`
  - `/api/v1/consultations/statistics/overall`
- ⚠️ 대부분의 엔드포인트는 `/api/`만 사용:
  - `/api/admin/consultants/with-stats`
  - `/api/common-codes`
  - `/api/system-notifications/active`

#### `frontend/src/constants/api.js`

**현재 상태**:
- ⚠️ 거의 모든 엔드포인트가 `/api/`만 사용:
  - `/api/auth/login`
  - `/api/users/profile`
  - `/api/consultation-messages`
  - `/api/common-codes`

---

## 📊 API 경로 분류

### 이미 `/api/v1/` 사용 중

1. `API_ENDPOINTS.DASHBOARD.GET_USER_DASHBOARD`: `/api/v1/tenant/dashboards`
2. `API_ENDPOINTS.DASHBOARD.GET_DASHBOARD_BY_ID`: `/api/v1/tenant/dashboards/{id}`
3. `API_ENDPOINTS.DASHBOARD.WIDGET_DATA.CONSULTATIONS_OVERALL`: `/api/v1/consultations/statistics/overall`

### `/api/`만 사용 중 (표준 경로로 변경 필요)

#### 인증 관련
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/current-user`
- `/api/auth/config/oauth2`
- `/api/auth/tenant/*`

#### 관리자 관련
- `/api/admin/*` (대부분)

#### 공통 코드
- `/api/common-codes`
- `/api/common-codes/group`

#### 기타
- `/api/system-notifications/*`
- `/api/consultation-messages/*`

---

## ✅ 백엔드 지원 현황

### 좋은 소식

대부분의 백엔드 컨트롤러가 **이미 `/api/v1/` + `/api/` 둘 다 지원**하고 있습니다:

1. ✅ `AuthController`: `/api/v1/auth` + `/api/auth`
2. ✅ `AdminController`: `/api/v1/admin` + `/api/admin`
3. ✅ `ConsultationMessageController`: `/api/v1/consultation-messages` + `/api/consultation-messages`
4. ✅ `CommonCodeController`: `/api/v1/common-codes` + `/api/common-codes` (추정)

**결론**: 프론트엔드에서 `/api/v1/` 경로로 변경해도 하위 호환성이 보장됩니다.

---

## 📋 마이그레이션 전략

### Phase 1: 주요 API 상수 파일 업데이트

#### 1. `frontend/src/constants/api.js`

**우선순위 높은 API들**:
- `AUTH_API` - 인증 관련
- `USER_API` - 사용자 관련
- `COMMON_CODE` - 공통 코드

**변경 예시**:
```javascript
// 변경 전
LOGIN: '/api/auth/login',

// 변경 후
LOGIN: '/api/v1/auth/login',
```

#### 2. `frontend/src/constants/apiEndpoints.js`

**변경 대상**:
- `ADMIN.*` - 관리자 관련 모든 엔드포인트
- `COMMON_CODE.*` - 공통 코드 엔드포인트
- `SYSTEM.*` - 시스템 관련 엔드포인트

---

## ⚠️ 주의 사항

### 1. 하위 호환성

백엔드가 레거시 경로(`/api/`)를 유지하고 있으므로, 프론트엔드 변경은 **점진적으로** 진행할 수 있습니다.

### 2. 테스트 필요

각 API 변경 후 다음 테스트 필요:
- 인증/인가 테스트
- 데이터 조회/수정 테스트
- 에러 처리 테스트

---

## 📋 작업 계획

### Step 1: 주요 상수 파일 업데이트 (예정)

1. `frontend/src/constants/api.js` - 인증, 사용자, 공통 코드 API
2. `frontend/src/constants/apiEndpoints.js` - 관리자, 시스템 API

### Step 2: 직접 사용하는 경로 확인 (예정)

프론트엔드 코드에서 하드코딩된 `/api/` 경로를 직접 사용하는 경우 확인 및 수정

### Step 3: 통합 테스트 (예정)

모든 페이지에서 API 호출 정상 동작 확인

---

## ✅ 체크리스트

- [x] 프론트엔드 API 경로 현황 확인
- [x] 백엔드 지원 현황 확인
- [ ] 주요 API 상수 파일 업데이트
- [ ] 직접 사용하는 경로 확인 및 수정
- [ ] 통합 테스트

---

**최종 업데이트**: 2025-12-04

