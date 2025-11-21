# 공통코드 표준화 계획

## 📋 개요

CoreSolution 플랫폼의 공통코드 시스템을 표준화하여 등록, 수정, 삭제, 조회가 체계적으로 관리될 수 있도록 합니다.

## 🎯 목표

1. **표준화된 CRUD API**: RESTful 패턴 기반 일관된 API 구조
2. **DTO 분리**: Request/Response DTO 명확히 분리
3. **검증 로직 표준화**: 필수 필드 및 비즈니스 규칙 검증
4. **에러 처리 표준화**: 일관된 에러 응답 형식
5. **권한 관리**: 코어/테넌트 코드별 권한 분리

## 🏗️ 표준화 구조

### 1. DTO 구조

#### 1.1 Request DTO
```java
// 공통코드 생성 요청
CommonCodeCreateRequest
- codeGroup (필수)
- codeValue (필수)
- codeLabel (필수)
- koreanName (필수) - 한국 사용 필수
- codeDescription (선택)
- sortOrder (선택)
- isActive (선택, 기본값: true)
- parentCodeGroup (선택)
- parentCodeValue (선택)
- extraData (선택)
- icon (선택)
- colorCode (선택)
- tenantId (선택, 테넌트 코드인 경우)

// 공통코드 수정 요청
CommonCodeUpdateRequest
- codeLabel (선택)
- koreanName (선택)
- codeDescription (선택)
- sortOrder (선택)
- isActive (선택)
- extraData (선택)
- icon (선택)
- colorCode (선택)
```

#### 1.2 Response DTO
```java
// 공통코드 응답
CommonCodeResponse
- id
- tenantId
- codeGroup
- codeValue
- codeLabel
- koreanName (필수)
- codeDescription
- sortOrder
- isActive
- parentCodeGroup
- parentCodeValue
- extraData
- icon
- colorCode
- createdAt
- updatedAt

// 공통코드 목록 응답
CommonCodeListResponse
- codes: List<CommonCodeResponse>
- totalCount: Long
- activeCount: Long
- inactiveCount: Long
```

### 2. Controller 표준화

#### 2.1 RESTful API 구조
```
GET    /api/v1/common-codes                    # 전체 조회 (페이징)
GET    /api/v1/common-codes/{id}               # 상세 조회
POST   /api/v1/common-codes                    # 생성
PUT    /api/v1/common-codes/{id}               # 전체 수정
PATCH  /api/v1/common-codes/{id}               # 부분 수정
DELETE /api/v1/common-codes/{id}               # 삭제 (소프트 삭제)

GET    /api/v1/common-codes/groups/{codeGroup} # 그룹별 조회
GET    /api/v1/common-codes/core/groups/{codeGroup}    # 코어 코드 조회
GET    /api/v1/common-codes/tenant/groups/{codeGroup}  # 테넌트 코드 조회

POST   /api/v1/common-codes/batch              # 일괄 생성
PUT    /api/v1/common-codes/{id}/toggle-status # 상태 토글
```

### 3. Service 표준화

#### 3.1 표준 메서드 시그니처
```java
// 생성
CommonCodeResponse create(CommonCodeCreateRequest request, String createdBy);

// 수정
CommonCodeResponse update(Long id, CommonCodeUpdateRequest request, String updatedBy);

// 삭제
void delete(Long id, String deletedBy);

// 조회
CommonCodeResponse findById(Long id);
List<CommonCodeResponse> findAll(String codeGroup, Pageable pageable);
```

### 4. 검증 규칙

#### 4.1 필수 필드 검증
- `codeGroup`: 필수, 50자 이하
- `codeValue`: 필수, 50자 이하
- `codeLabel`: 필수, 100자 이하
- `koreanName`: 필수, 100자 이하 (한국 사용 필수)

#### 4.2 비즈니스 규칙 검증
- 코드 그룹과 값의 중복 체크 (tenant_id 포함)
- 코어 코드 수정/삭제는 HQ 관리자만 가능
- 테넌트 코드 수정/삭제는 해당 테넌트 관리자만 가능
- 활성 코드는 삭제 불가 (비활성화 후 삭제)

### 5. 에러 처리 표준화

#### 5.1 표준 에러 응답
```json
{
  "success": false,
  "errorCode": "COMMON_CODE_NOT_FOUND",
  "message": "공통코드를 찾을 수 없습니다.",
  "details": {
    "codeGroup": "USER_STATUS",
    "codeValue": "ACTIVE"
  },
  "timestamp": "2025-01-XXT00:00:00"
}
```

#### 5.2 에러 코드 정의
- `COMMON_CODE_NOT_FOUND`: 공통코드를 찾을 수 없음
- `COMMON_CODE_DUPLICATE`: 중복된 코드
- `COMMON_CODE_INVALID`: 유효하지 않은 코드
- `COMMON_CODE_PERMISSION_DENIED`: 권한 없음
- `COMMON_CODE_VALIDATION_FAILED`: 검증 실패

## 📝 구현 계획

### Phase 1: DTO 표준화
- [ ] `CommonCodeCreateRequest` 생성
- [ ] `CommonCodeUpdateRequest` 생성
- [ ] `CommonCodeResponse` 생성
- [ ] `CommonCodeListResponse` 생성
- [ ] 검증 어노테이션 추가

### Phase 2: Service 표준화
- [ ] Service 인터페이스 표준화
- [ ] Service 구현체 표준화
- [ ] 검증 로직 추가
- [ ] 권한 검증 로직 추가

### Phase 3: Controller 표준화
- [ ] RESTful API 구조로 재구성
- [ ] 표준화된 에러 처리
- [ ] 권한 검증 추가
- [ ] API 문서화

### Phase 4: 테스트 및 문서화
- [ ] 단위 테스트
- [ ] 통합 테스트
- [ ] API 문서 작성
- [ ] 사용 가이드 작성

## 🔒 권한 관리

### 코어솔루션 코드
- **조회**: 모든 사용자 가능
- **생성**: HQ 관리자만 가능
- **수정**: HQ 관리자만 가능
- **삭제**: HQ 관리자만 가능 (비활성화 후)

### 테넌트별 코드
- **조회**: 해당 테넌트 사용자만 가능
- **생성**: 해당 테넌트 관리자만 가능
- **수정**: 해당 테넌트 관리자만 가능
- **삭제**: 해당 테넌트 관리자만 가능 (비활성화 후)

## 📊 API 명세

### 생성 API
```http
POST /api/v1/common-codes
Content-Type: application/json

{
  "codeGroup": "USER_STATUS",
  "codeValue": "ACTIVE",
  "codeLabel": "활성",
  "koreanName": "활성",
  "codeDescription": "사용자가 활성 상태",
  "sortOrder": 1,
  "isActive": true
}

Response 201:
{
  "success": true,
  "data": {
    "id": 1,
    "codeGroup": "USER_STATUS",
    "codeValue": "ACTIVE",
    "codeLabel": "활성",
    "koreanName": "활성",
    ...
  }
}
```

### 수정 API
```http
PUT /api/v1/common-codes/{id}
Content-Type: application/json

{
  "codeLabel": "활성 상태",
  "koreanName": "활성 상태",
  "codeDescription": "사용자가 활성 상태입니다"
}

Response 200:
{
  "success": true,
  "data": { ... }
}
```

### 삭제 API
```http
DELETE /api/v1/common-codes/{id}

Response 204: No Content
```

### 조회 API
```http
GET /api/v1/common-codes/groups/USER_STATUS

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codeGroup": "USER_STATUS",
      "codeValue": "ACTIVE",
      "codeLabel": "활성",
      "koreanName": "활성",
      ...
    }
  ],
  "totalCount": 1,
  "activeCount": 1
}
```

## ✅ 체크리스트

### Phase 1: DTO 표준화 ✅ 완료
- [x] Request DTO 생성 (`CommonCodeCreateRequest`, `CommonCodeUpdateRequest`)
- [x] Response DTO 생성 (`CommonCodeResponse`, `CommonCodeListResponse`)
- [x] 검증 어노테이션 추가 (`@NotBlank`, `@Size`)
- [x] DTO 변환 유틸리티 생성 (`CommonCodeResponse.fromEntity()`)

### Phase 2: Service 표준화 ✅ 완료
- [x] Service 인터페이스 재정의 (표준 메서드 시그니처 추가)
- [x] Service 구현체 재구성 (표준 메서드 구현)
- [x] 검증 로직 추가 (한글명 필수, 중복 체크)
- [x] 권한 검증 로직 추가 (`CommonCodePermissionService` 생성)

### Phase 3: Controller 표준화 ✅ 완료
- [x] RESTful API 구조 적용 (`/api/v1/common-codes`)
- [x] 표준화된 CRUD API 추가 (POST, PUT, PATCH, DELETE, GET)
- [x] 기존 API 하위 호환성 유지 (deprecated 처리)
- [x] 권한 검증 추가 (코어/테넌트 코드별 권한 분리)
- [x] API 문서화 (Swagger/OpenAPI 어노테이션 추가)

### Phase 4: 프론트엔드 연동 ✅ 완료
- [x] 표준화된 API 유틸리티 생성 (`commonCodeApi.js`)
- [x] CommonCodeManagement 컴포넌트 업데이트
- [x] commonCodeUtils.js 업데이트 (표준화된 API 사용)
- [x] PackageSelector 컴포넌트 업데이트
- [x] CommonCodeFilters 컴포넌트 업데이트
- [x] codeHelper.js 업데이트
- [x] 하위 호환성 유지 (기존 API fallback)

### Phase 5: 테스트
- [ ] 단위 테스트
- [ ] 통합 테스트
- [ ] 권한 테스트
- [ ] 프론트엔드 테스트

## 🚨 주의사항

1. **하위 호환성 유지**
   - 기존 API는 deprecated 처리하되 계속 동작
   - 점진적 마이그레이션

2. **한글명 필수**
   - 모든 공통코드는 한글명 필수
   - 검증 로직에서 확인

3. **권한 관리**
   - 코어/테넌트 코드별 권한 분리
   - HQ 관리자 권한 확인

4. **에러 처리**
   - 일관된 에러 응답 형식
   - 명확한 에러 메시지

