# API 표준화 현황 보고서

**작성일**: 2025-12-04  
**우선순위**: Priority 2.1  
**상태**: 진행 중

---

## 📌 개요

모든 API를 `/api/v1/` 경로로 통일하는 작업입니다.

---

## 🔍 현재 상태 분석

### 이미 `/api/v1/` 경로를 지원하는 컨트롤러

#### 핵심 컨트롤러 (우선순위 계획에 포함된 5개)
1. ✅ **AuthController**: `/api/v1/auth` + `/api/auth` (레거시 유지)
2. ✅ **AdminController**: `/api/v1/admin` + `/api/admin` (레거시 유지)
3. ✅ **ConsultationMessageController**: `/api/v1/consultation-messages` + `/api/consultation-messages` (레거시 유지)
4. ✅ **CssThemeController**: `/api/v1/admin/css-themes` + `/api/admin/css-themes` (레거시 유지)
5. ⚠️ **OAuth2ConfigController**: `/api/auth/config`만 있음 → **표준 경로 추가 필요**

---

## ⚠️ 발견된 문제

### OAuth2ConfigController

**현재 경로**: `/api/auth/config`  
**표준 경로 필요**: `/api/v1/auth/config`

**문제점**:
- 표준 경로(`/api/v1/`)를 지원하지 않음
- 레거시 경로만 존재

**수정 필요**:
- `@RequestMapping({"/api/v1/auth/config", "/api/auth/config"})` 형태로 변경

---

## 📋 작업 계획

### Phase 1: OAuth2ConfigController 수정 (우선순위)

**작업 내용**:
1. `OAuth2ConfigController`에 `/api/v1/auth/config` 경로 추가
2. 레거시 경로 `/api/auth/config` 유지 (하위 호환성)
3. 프론트엔드 API 호출 확인 (필요시 업데이트)

---

## ✅ 완료 체크리스트

- [x] 핵심 컨트롤러 경로 확인
- [x] OAuth2ConfigController 표준 경로 추가 ✅
- [x] 주요 컨트롤러 표준 경로 추가 (6개) ✅
- [x] 프론트엔드 API 호출 확인 ✅
- [x] 프론트엔드 주요 API 상수 파일 업데이트 ✅
- [ ] 나머지 컨트롤러 확인 (대부분 이미 지원)
- [ ] API 문서화 업데이트

---

## ✅ 완료된 작업

### Phase 1: 핵심 컨트롤러 (5개)

#### 1. OAuth2ConfigController 표준 경로 추가

**변경 전**:
```java
@RequestMapping("/api/auth/config")
```

**변경 후**:
```java
@RequestMapping({"/api/v1/auth/config", "/api/auth/config"}) // v1 경로 추가, 레거시 경로 유지
```

**결과**:
- ✅ 표준 경로 `/api/v1/auth/config` 지원
- ✅ 레거시 경로 `/api/auth/config` 유지 (하위 호환성)

### Phase 2: 주요 컨트롤러 (6개)

#### 2. MultiTenantController
- ✅ `/api/v1/auth/tenant` 추가
- ✅ 레거시 경로 `/api/auth/tenant` 유지

#### 3. FileController
- ✅ `/api/v1/files` 추가
- ✅ 레거시 경로 `/api/files` 유지

#### 4. TenantRoleController
- ✅ `/api/v1/tenants/{tenantId}/roles` 추가
- ✅ 레거시 경로 `/api/tenants/{tenantId}/roles` 유지

#### 5. UserRoleAssignmentController
- ✅ `/api/v1/users/{userId}/roles` 추가
- ✅ 레거시 경로 `/api/users/{userId}/roles` 유지

#### 6. PasskeyController
- ✅ `/api/v1/auth/passkey` 추가
- ✅ 레거시 경로 `/api/auth/passkey` 유지

#### 7. BusinessCategoryController
- ✅ `/api/v1/business-categories` 추가
- ✅ 레거시 경로 `/api/business-categories` 유지

---

### Phase 3: 프론트엔드 API 상수 파일 업데이트

#### 1. `frontend/src/constants/api.js`

**업데이트된 API 그룹**:
- ✅ `AUTH_API` - 모든 경로를 `/api/v1/auth`로 변경
- ✅ `PERMISSIONS_API` - 모든 경로를 `/api/v1/admin/permissions`로 변경
- ✅ `USER_API` - 모든 경로를 `/api/v1/users`로 변경
- ✅ `MESSAGE_API` - 모든 경로를 `/api/v1/consultation-messages`로 변경
- ✅ `ADMIN_API` - 모든 경로를 `/api/v1/admin`로 변경
- ✅ `COMMON_CODE_API` - 모든 경로를 `/api/v1/common-codes`로 변경

#### 2. `frontend/src/constants/apiEndpoints.js`

**업데이트된 API 그룹**:
- ✅ `ADMIN.*` - 모든 경로를 `/api/v1/admin`로 변경
- ✅ `AUTH.*` - 모든 경로를 `/api/v1/auth`로 변경
- ✅ `COMMON_CODE.*` - 모든 경로를 `/api/v1/common-codes`로 변경

#### 3. `frontend/src/utils/ajax.js`

**수정된 하드코딩된 경로**:
- ✅ `/api/auth/current-user` → `/api/v1/auth/current-user`

---

## 📊 작업 통계

### 백엔드
- ✅ 표준 경로 추가된 컨트롤러: 7개
- ✅ 이미 표준 경로 지원하는 컨트롤러: 대부분

### 프론트엔드
- ✅ 업데이트된 상수 파일: 3개
- ✅ 업데이트된 API 그룹: 9개

---

**최종 업데이트**: 2025-12-04

