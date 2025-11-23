# 와일드카드 도메인 없이 테넌트 테스트 방법

**작성일**: 2025-11-23  
**목적**: DNS/SSL 설정 없이 테넌트 기능 테스트 방법  
**상태**: 테스트 가능 ✅

---

## 📋 개요

와일드카드 도메인(`*.dev.core-solution.co.kr`) DNS/SSL 설정 없이도 테넌트 기능을 완전히 테스트할 수 있습니다.

**테넌트 구분 방법 (우선순위 순)**:
1. **HTTP 헤더 `X-Tenant-Id`** (가장 높은 우선순위) ✅
2. Host 헤더에서 서브도메인 추출
3. 세션의 User 정보에서 Branch의 tenant_id
4. 세션에 저장된 tenant_id

---

## 🧪 테스트 방법

### 방법 1: HTTP 헤더 사용 (권장) ⭐⭐⭐

**가장 간단하고 확실한 방법**

#### 1.1 Postman/API 클라이언트 사용

**헤더 설정**:
```
X-Tenant-Id: test-tenant-001
```

**예시 요청**:
```bash
# 온보딩 승인 후 테넌트 정보 조회
curl -X GET "https://dev.core-solution.co.kr/api/v1/tenants/test-tenant-001" \
  -H "X-Tenant-Id: test-tenant-001" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json"
```

#### 1.2 브라우저 개발자 도구 사용

**Fetch API 예시**:
```javascript
// 브라우저 콘솔에서 실행
fetch('https://dev.core-solution.co.kr/api/v1/tenants/test-tenant-001', {
  method: 'GET',
  headers: {
    'X-Tenant-Id': 'test-tenant-001',
    'Authorization': 'Bearer {JWT_TOKEN}',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

---

### 방법 2: 로그인 후 세션 기반 (자동) ⭐⭐

**로그인하면 자동으로 테넌트가 설정됩니다**

#### 2.1 로그인 플로우

1. **로그인**:
   ```bash
   POST https://dev.core-solution.co.kr/api/v1/auth/login
   {
     "email": "admin@test-tenant.com",
     "password": "password123"
   }
   ```

2. **세션에 tenant_id 자동 저장**:
   - 로그인한 사용자의 `Branch` 정보에서 `tenant_id` 추출
   - 세션에 `tenantId` 저장
   - 이후 모든 요청에서 자동으로 사용됨

3. **테넌트별 API 호출**:
   ```bash
   # 헤더 없이도 자동으로 테넌트 구분됨
   GET https://dev.core-solution.co.kr/api/v1/dashboard
   # 세션의 tenant_id 자동 사용
   ```

#### 2.2 테넌트 전환 API 사용

**여러 테넌트에 접근 권한이 있는 경우**:
```bash
# 1. 테넌트 전환
POST https://dev.core-solution.co.kr/api/v1/auth/tenant/switch
{
  "tenantId": "test-tenant-002"
}

# 2. 이후 요청은 자동으로 전환된 테넌트 사용
GET https://dev.core-solution.co.kr/api/v1/dashboard
```

---

### 방법 3: 통합 테스트 코드 (자동화) ⭐⭐⭐

**가장 권장되는 방법 - CI/CD 통합 가능**

#### 3.1 Java 통합 테스트

```java
@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc
class TenantApiTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    @DisplayName("X-Tenant-Id 헤더로 테넌트 구분 테스트")
    void testTenantIdentificationByHeader() throws Exception {
        String tenantId = "test-tenant-001";
        
        mockMvc.perform(get("/api/v1/tenants/{tenantId}", tenantId)
                .header("X-Tenant-Id", tenantId)
                .header("Authorization", "Bearer {token}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.tenantId").value(tenantId));
    }
    
    @Test
    @DisplayName("세션 기반 테넌트 구분 테스트")
    void testTenantIdentificationBySession() throws Exception {
        // 1. 로그인하여 세션 생성
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"admin@test.com\",\"password\":\"pass123\"}"))
            .andExpect(status().isOk())
            .andReturn();
        
        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession();
        session.setAttribute("tenantId", "test-tenant-001");
        
        // 2. 세션을 사용하여 API 호출
        mockMvc.perform(get("/api/v1/dashboard")
                .session(session))
            .andExpect(status().isOk());
    }
}
```

#### 3.2 API 테스트 스크립트

**Bash 스크립트**:
```bash
#!/bin/bash

BASE_URL="https://dev.core-solution.co.kr/api/v1"
TENANT_ID="test-tenant-001"
JWT_TOKEN="your-jwt-token"

# X-Tenant-Id 헤더 사용
curl -X GET "${BASE_URL}/tenants/${TENANT_ID}" \
  -H "X-Tenant-Id: ${TENANT_ID}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json"
```

**PowerShell 스크립트**:
```powershell
$baseUrl = "https://dev.core-solution.co.kr/api/v1"
$tenantId = "test-tenant-001"
$jwtToken = "your-jwt-token"

$headers = @{
    "X-Tenant-Id" = $tenantId
    "Authorization" = "Bearer $jwtToken"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "$baseUrl/tenants/$tenantId" -Method Get -Headers $headers
```

---

## 🔍 테넌트 구분 우선순위 확인

**코드 위치**: `TenantContextFilter.java`

```java
private String extractTenantId(HttpServletRequest request, HttpSession session) {
    // 1. HTTP 헤더에서 추출 (우선순위 1) ✅ 가장 높음
    String tenantId = request.getHeader("X-Tenant-Id");
    if (tenantId != null && !tenantId.isEmpty()) {
        return tenantId;
    }
    
    // 1-1. Host 헤더에서 서브도메인 추출 (우선순위 1-1)
    // 와일드카드 도메인 필요
    String host = request.getHeader("Host");
    if (host != null) {
        String subdomain = extractTenantSubdomain(host);
        if (subdomain != null) {
            return subdomain;
        }
    }
    
    // 2. 세션의 User 정보에서 Branch의 tenant_id (우선순위 2) ✅
    // 로그인 후 자동 설정
    User user = SessionUtils.getCurrentUser(session);
    if (user != null && user.getBranchCode() != null) {
        Branch branch = branchRepository.findByBranchCode(user.getBranchCode());
        if (branch != null) {
            return branch.getTenantId();
        }
    }
    
    // 3. 세션에 저장된 tenant_id (우선순위 3) ✅
    Object sessionTenantId = session.getAttribute("tenantId");
    if (sessionTenantId != null) {
        return sessionTenantId.toString();
    }
    
    return null;
}
```

---

## ✅ 테스트 시나리오

### 시나리오 1: 온보딩 플로우 테스트

**1단계: 온보딩 요청 생성**
```bash
POST https://dev.core-solution.co.kr/api/v1/onboarding/requests
# 헤더 불필요 (온보딩은 테넌트 생성 전)
{
  "tenantId": "test-tenant-001",
  "tenantName": "테스트 테넌트",
  "businessType": "CONSULTATION"
}
```

**2단계: 온보딩 승인**
```bash
PUT https://dev.core-solution.co.kr/api/v1/onboarding/requests/{id}/decide
# 헤더 불필요 (관리자 권한만 필요)
{
  "status": "APPROVED"
}
```

**3단계: 테넌트 정보 확인**
```bash
GET https://dev.core-solution.co.kr/api/v1/tenants/test-tenant-001
# 방법 1: X-Tenant-Id 헤더 사용
Headers: {
  "X-Tenant-Id": "test-tenant-001"
}

# 방법 2: 로그인 후 세션 사용 (자동)
# 관리자 계정으로 로그인하면 자동으로 tenant_id 설정됨
```

### 시나리오 2: 대시보드 접근 테스트

**1단계: 관리자 로그인**
```bash
POST https://dev.core-solution.co.kr/api/v1/auth/login
{
  "email": "admin@test-tenant.com",
  "password": "password123"
}
# 응답: JWT 토큰 + 세션에 tenant_id 자동 저장
```

**2단계: 대시보드 조회**
```bash
GET https://dev.core-solution.co.kr/api/v1/dashboard
# 방법 1: 세션 사용 (자동) - 헤더 불필요
# 방법 2: X-Tenant-Id 헤더 사용
Headers: {
  "X-Tenant-Id": "test-tenant-001",
  "Authorization": "Bearer {JWT_TOKEN}"
}
```

### 시나리오 3: 멀티 테넌트 테스트

**여러 테넌트를 동시에 테스트**:
```bash
# 테넌트 1
curl -H "X-Tenant-Id: test-tenant-001" \
     https://dev.core-solution.co.kr/api/v1/dashboard

# 테넌트 2
curl -H "X-Tenant-Id: test-tenant-002" \
     https://dev.core-solution.co.kr/api/v1/dashboard

# 같은 API, 다른 테넌트 데이터 반환 ✅
```

---

## 🎯 결론

### 와일드카드 도메인 없이도 테스트 가능 ✅

1. **HTTP 헤더 `X-Tenant-Id` 사용** (가장 간단)
2. **로그인 후 세션 기반** (자동)
3. **통합 테스트 코드** (자동화)

### 와일드카드 도메인이 필요한 경우

- **실제 사용자 경험 테스트**: 브라우저에서 `tenant1.dev.core-solution.co.kr`로 직접 접근
- **SEO/브랜딩**: 각 테넌트가 독립 도메인을 가지는 경우
- **프로덕션 환경**: 실제 서비스 운영 시

### 1월 심사/발표용 데모

**와일드카드 도메인 없이도 충분히 테스트 가능**:
- API 테스트: `X-Tenant-Id` 헤더 사용
- 프론트엔드 테스트: 로그인 후 세션 기반 자동 구분
- 통합 테스트: 테스트 코드로 자동화

**우선순위**: P2 (심사 후 설정 가능)

---

## 📚 참고 문서

- `ONBOARDING_FLOW_VERIFICATION.md`: 온보딩 플로우 검증
- `MVP_TEST_GUIDE.md`: MVP 테스트 가이드
- `WILDCARD_SSL_DNS_SETUP.md`: 와일드카드 도메인 설정 (향후)

