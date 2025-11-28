# Week 6 Day 4: 연결 테스트 API 구현 및 통합 테스트

**작성일:** 2025-01-XX  
**목적:** 연결 테스트 API 구현 및 통합 테스트 작성

## 1. 구현 개요

PG 연결 테스트 API를 테넌트 포털과 운영 포털에 구현하고, 통합 테스트를 작성했습니다.

## 2. API 구현

### 2.1 테넌트 포털 API

**엔드포인트:** `POST /api/v1/tenants/{tenantId}/pg-configurations/{configId}/test-connection`

**파일:** `src/main/java/com/coresolution/core/controller/TenantPgConfigurationController.java`

**기능:**
- 테넌트 소유의 PG 설정에 대한 연결 테스트 수행
- 테넌트 권한 확인 후 테스트 진행
- 연결 테스트 결과 반환

**요청 예시:**
```http
POST /api/v1/tenants/test-tenant-id/pg-configurations/test-config-id/test-connection
Authorization: Bearer {token}
```

**응답 예시:**
```json
{
  "success": true,
  "result": "SUCCESS",
  "message": "토스페이먼츠 API 연결 성공",
  "testedAt": "2025-01-XXT10:00:00",
  "details": "{\"keyType\":\"test\",\"billingKey\":\"test-key\"}"
}
```

### 2.2 운영 포털 API

**엔드포인트:** `POST /api/v1/ops/pg-configurations/{configId}/test-connection`

**파일:** `src/main/java/com/coresolution/core/controller/ops/TenantPgConfigurationOpsController.java`

**기능:**
- 모든 테넌트의 PG 설정에 대한 연결 테스트 수행
- ADMIN 또는 OPS 역할 필요
- 승인 전 연결 테스트 지원

**요청 예시:**
```http
POST /api/v1/ops/pg-configurations/test-config-id/test-connection
Authorization: Bearer {admin-token}
```

**응답 예시:**
```json
{
  "success": true,
  "result": "SUCCESS",
  "message": "연결 성공",
  "testedAt": "2025-01-XXT10:00:00",
  "details": "{\"status\":\"ok\"}"
}
```

## 3. 통합 테스트

### 3.1 컨트롤러 통합 테스트

**파일:** 
- `src/test/java/com/coresolution/core/controller/TenantPgConfigurationControllerIntegrationTest.java`
- `src/test/java/com/coresolution/core/controller/ops/TenantPgConfigurationOpsControllerIntegrationTest.java`

**테스트 케이스:**

#### 테넌트 포털
1. **연결 테스트 성공**
   - 정상적인 연결 테스트 요청
   - 성공 응답 검증
   - 상세 정보 포함 확인

2. **연결 테스트 실패**
   - 실패한 연결 테스트 응답 검증
   - 에러 메시지 확인

3. **PG 설정 없음**
   - 존재하지 않는 PG 설정에 대한 테스트
   - 400 Bad Request 응답 확인

#### 운영 포털
1. **연결 테스트 성공 (운영 포털)**
   - ADMIN 권한으로 연결 테스트 수행
   - 성공 응답 검증

2. **연결 테스트 실패 (운영 포털)**
   - 실패 응답 검증
   - 에러 메시지 확인

3. **권한 없음**
   - 일반 사용자가 운영 포털 API 접근 시도
   - 403 Forbidden 응답 확인

### 3.2 서비스 통합 테스트

**파일:** `src/test/java/com/coresolution/core/service/ConnectionTestServiceIntegrationTest.java`

**테스트 케이스:**

1. **PG Provider별 supports 확인**
   - 각 PG Provider별 연결 테스트 서비스가 올바른 Provider를 지원하는지 확인
   - TOSS, IAMPORT, KAKAO, NAVER, PAYPAL, STRIPE

2. **API Key 누락**
   - API Key가 없는 경우 실패 응답 확인

3. **Secret Key 누락**
   - Secret Key가 없는 경우 실패 응답 확인

4. **잘못된 키 형식**
   - 유효하지 않은 키 형식에 대한 처리 확인

## 4. API 문서화

### 4.1 Swagger/OpenAPI

모든 연결 테스트 API는 Swagger UI에서 확인 가능합니다:

- **테넌트 포털:** `/swagger-ui.html` → "테넌트 PG 설정" 태그
- **운영 포털:** `/swagger-ui.html` → "운영 포털 PG 설정" 태그

### 4.2 API 응답 스키마

**ConnectionTestResponse:**
```json
{
  "success": "boolean",
  "result": "string (SUCCESS, FAILED)",
  "message": "string",
  "testedAt": "datetime",
  "details": "string (JSON)"
}
```

## 5. 보안

### 5.1 인증 및 권한

- **테넌트 포털:** 인증된 사용자만 접근 가능, 자신의 테넌트만 테스트 가능
- **운영 포털:** ADMIN 또는 OPS 역할 필요

### 5.2 데이터 보호

- API Key와 Secret Key는 암호화되어 저장
- 연결 테스트 시에만 복호화하여 사용
- 테스트 결과에 민감한 정보는 포함하지 않음

## 6. 에러 처리

### 6.1 일반 에러

- **404 Not Found:** PG 설정을 찾을 수 없음
- **403 Forbidden:** 권한 없음
- **400 Bad Request:** 잘못된 요청

### 6.2 연결 테스트 에러

- **API Key/Secret Key 누락:** 실패 응답 반환
- **PG 서버 연결 실패:** 실패 응답 반환
- **지원하지 않는 PG Provider:** 실패 응답 반환

## 7. 사용 예시

### 7.1 테넌트 포털에서 연결 테스트

```javascript
// JavaScript 예시
const response = await fetch(
  `/api/v1/tenants/${tenantId}/pg-configurations/${configId}/test-connection`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);

const result = await response.json();
if (result.success) {
  console.log('연결 테스트 성공:', result.message);
} else {
  console.error('연결 테스트 실패:', result.message);
}
```

### 7.2 운영 포털에서 연결 테스트

```javascript
// JavaScript 예시
const response = await fetch(
  `/api/v1/ops/pg-configurations/${configId}/test-connection`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }
);

const result = await response.json();
console.log('연결 테스트 결과:', result);
```

## 8. 참고 문서

- `src/main/java/com/coresolution/core/controller/TenantPgConfigurationController.java` - 테넌트 포털 API
- `src/main/java/com/coresolution/core/controller/ops/TenantPgConfigurationOpsController.java` - 운영 포털 API
- `src/test/java/com/coresolution/core/controller/TenantPgConfigurationControllerIntegrationTest.java` - 테넌트 포털 통합 테스트
- `src/test/java/com/coresolution/core/controller/ops/TenantPgConfigurationOpsControllerIntegrationTest.java` - 운영 포털 통합 테스트
- `src/test/java/com/coresolution/core/service/ConnectionTestServiceIntegrationTest.java` - 서비스 통합 테스트

