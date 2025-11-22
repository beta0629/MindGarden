# MVP 테스트 가이드

**작성일**: 2025-11-23  
**목적**: 1월 심사/발표를 위한 MVP 기능 테스트 방법  
**상태**: 테스트 준비 완료

---

## 📋 테스트 개요

1월 심사/발표를 위한 최소 기능(MVP)을 테스트하는 방법을 정리합니다.

**테스트 범위**:
1. 온보딩 플로우 (요청 생성 → 승인 → 테넌트 생성)
2. 테넌트 초기화 메타데이터 (settings_json)
3. 기본 대시보드 표시
4. 기본 컴포넌트 활성화

---

## 🧪 테스트 방법

### 방법 1: 통합 테스트 코드 작성 (권장)

**장점**: 자동화, 반복 가능, CI/CD 통합 가능  
**단점**: 초기 작성 시간 필요

#### 1.1 온보딩 플로우 통합 테스트

**파일**: `OnboardingFlowIntegrationTest.java` (신규 생성)

```java
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class OnboardingFlowIntegrationTest {
    
    @Autowired
    private OnboardingService onboardingService;
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TenantDashboardRepository dashboardRepository;
    
    @Test
    @DisplayName("온보딩 전체 플로우 테스트 - CONSULTATION")
    void testOnboardingFlow_Consultation() {
        // 1. 온보딩 요청 생성
        String tenantId = "test-consultation-" + System.currentTimeMillis();
        OnboardingRequest request = onboardingService.create(
            tenantId,
            "테스트 상담소",
            "admin@consultation.com",
            RiskLevel.LOW,
            "{\"adminPassword\": \"test1234\"}",
            "CONSULTATION"
        );
        
        assertThat(request).isNotNull();
        assertThat(request.getStatus()).isEqualTo(OnboardingStatus.PENDING);
        
        // 2. 온보딩 승인
        OnboardingRequest approved = onboardingService.decide(
            request.getId(),
            OnboardingStatus.APPROVED,
            "system-admin",
            "테스트 승인"
        );
        
        assertThat(approved).isNotNull();
        assertThat(approved.getStatus()).isEqualTo(OnboardingStatus.APPROVED);
        
        // 3. 테넌트 생성 확인
        Tenant tenant = tenantRepository.findByTenantId(tenantId).orElse(null);
        assertThat(tenant).isNotNull();
        assertThat(tenant.getStatus()).isEqualTo(TenantStatus.ACTIVE);
        
        // 4. settings_json 확인
        String settingsJson = tenant.getSettingsJson();
        assertThat(settingsJson).isNotNull();
        
        // JSON 파싱하여 features 확인
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> settings = mapper.readValue(settingsJson, Map.class);
        Map<String, Object> features = (Map<String, Object>) settings.get("features");
        
        assertThat(features.get("consultation")).isEqualTo(true);
        assertThat(features.get("academy")).isEqualTo(false);
        
        // 5. 관리자 계정 생성 확인
        List<User> admins = userRepository.findAllByEmail("admin@consultation.com").stream()
            .filter(u -> tenantId.equals(u.getTenantId()))
            .filter(u -> u.getRole() == UserRole.ADMIN)
            .toList();
        
        assertThat(admins).hasSize(1);
        assertThat(admins.get(0).getIsActive()).isTrue();
        
        // 6. 기본 대시보드 생성 확인
        List<TenantDashboard> dashboards = dashboardRepository.findByTenantId(tenantId);
        assertThat(dashboards).isNotEmpty();
        
        // 7. 기본 컴포넌트 활성화 확인
        // (tenant_components 테이블 확인)
    }
}
```

---

### 방법 2: 수동 테스트 (Postman/API 테스트)

**장점**: 빠른 검증, 실제 환경 테스트  
**단점**: 반복 작업 필요, 자동화 어려움

#### 2.1 온보딩 요청 생성

**API**: `POST /api/v1/onboarding/requests`

**요청 본문**:
```json
{
  "tenantId": "test-consultation-001",
  "tenantName": "테스트 상담소",
  "requestedBy": "admin@consultation.com",
  "businessType": "CONSULTATION",
  "checklistJson": "{\"adminPassword\": \"test1234\"}"
}
```

**예상 응답**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tenantId": "test-consultation-001",
    "tenantName": "테스트 상담소",
    "status": "PENDING",
    "requestedBy": "admin@consultation.com"
  }
}
```

#### 2.2 온보딩 승인

**API**: `PUT /api/v1/onboarding/requests/{id}/decide`

**요청 본문**:
```json
{
  "status": "APPROVED",
  "decidedBy": "system-admin",
  "decisionNote": "테스트 승인"
}
```

**예상 응답**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "APPROVED",
    "decidedBy": "system-admin"
  }
}
```

#### 2.3 테넌트 확인

**API**: `GET /api/v1/tenants/{tenantId}`

**예상 응답**:
```json
{
  "success": true,
  "data": {
    "tenantId": "test-consultation-001",
    "name": "테스트 상담소",
    "status": "ACTIVE",
    "settingsJson": {
      "subdomain": "test-consultation",
      "domain": "test-consultation.dev.core-solution.co.kr",
      "features": {
        "consultation": true,
        "academy": false
      }
    }
  }
}
```

#### 2.4 관리자 계정 로그인

**API**: `POST /api/v1/auth/login`

**요청 본문**:
```json
{
  "email": "admin@consultation.com",
  "password": "test1234"
}
```

**예상 응답**:
```json
{
  "success": true,
  "data": {
    "token": "jwt-token...",
    "user": {
      "id": 1,
      "email": "admin@consultation.com",
      "role": "ADMIN",
      "tenantId": "test-consultation-001"
    },
    "dashboard": {
      "dashboardId": "dashboard-uuid",
      "dashboardType": "ADMIN",
      "dashboardName": "관리자 대시보드"
    }
  }
}
```

#### 2.5 대시보드 조회

**API**: `GET /api/v1/dashboards/{dashboardId}`

**예상 응답**:
```json
{
  "success": true,
  "data": {
    "dashboardId": "dashboard-uuid",
    "dashboardName": "관리자 대시보드",
    "dashboardConfig": {
      "version": "1.0",
      "layout": {
        "type": "grid",
        "columns": 12
      },
      "widgets": [
        {
          "id": "widget-1",
          "type": "welcome",
          "position": { "x": 0, "y": 0, "w": 12, "h": 2 }
        },
        {
          "id": "widget-2",
          "type": "summary-statistics",
          "position": { "x": 0, "y": 2, "w": 6, "h": 4 }
        }
      ]
    }
  }
}
```

---

### 방법 3: 데이터베이스 직접 확인

**장점**: 빠른 확인, 상세 데이터 확인 가능  
**단점**: SQL 지식 필요, 수동 작업

#### 3.1 테넌트 확인

```sql
-- 테넌트 생성 확인
SELECT 
    tenant_id,
    name,
    business_type,
    status,
    settings_json,
    created_at
FROM tenants
WHERE tenant_id = 'test-consultation-001';
```

#### 3.2 settings_json 확인

```sql
-- settings_json features 확인
SELECT 
    tenant_id,
    name,
    JSON_EXTRACT(settings_json, '$.features.consultation') as consultation_enabled,
    JSON_EXTRACT(settings_json, '$.features.academy') as academy_enabled,
    JSON_EXTRACT(settings_json, '$.subdomain') as subdomain,
    JSON_EXTRACT(settings_json, '$.domain') as domain
FROM tenants
WHERE tenant_id = 'test-consultation-001';
```

#### 3.3 관리자 계정 확인

```sql
-- 관리자 계정 확인
SELECT 
    id,
    tenant_id,
    email,
    username,
    name,
    role,
    is_active,
    is_email_verified,
    created_at
FROM users
WHERE tenant_id = 'test-consultation-001'
  AND role = 'ADMIN';
```

#### 3.4 대시보드 확인

```sql
-- 기본 대시보드 확인
SELECT 
    dashboard_id,
    tenant_id,
    dashboard_type,
    dashboard_name,
    role_code,
    is_default,
    JSON_EXTRACT(dashboard_config, '$.widgets') as widgets,
    JSON_LENGTH(JSON_EXTRACT(dashboard_config, '$.widgets')) as widget_count
FROM tenant_dashboards
WHERE tenant_id = 'test-consultation-001'
  AND is_default = TRUE
ORDER BY created_at;
```

#### 3.5 컴포넌트 활성화 확인

```sql
-- 활성화된 컴포넌트 확인
SELECT 
    tc.tenant_component_id,
    tc.tenant_id,
    tc.component_id,
    cc.component_name,
    cc.component_type,
    tc.status,
    tc.activated_at,
    tc.activated_by
FROM tenant_components tc
JOIN component_catalog cc ON tc.component_id = cc.component_id
WHERE tc.tenant_id = 'test-consultation-001'
  AND tc.status = 'ACTIVE'
ORDER BY tc.activated_at;
```

---

## 🎯 테스트 시나리오

### 시나리오 1: CONSULTATION 업종 온보딩 (완전 자동화)

1. **통합 테스트 실행**
   ```bash
   cd MindGarden
   ./mvnw test -Dtest=OnboardingFlowIntegrationTest#testOnboardingFlow_Consultation
   ```

2. **결과 확인**
   - 모든 assertion 통과
   - 테넌트 생성 확인
   - 관리자 계정 생성 확인
   - 대시보드 생성 확인

---

### 시나리오 2: 수동 API 테스트 (Postman)

1. **Postman Collection 생성**
   - `POST /api/v1/onboarding/requests` - 온보딩 요청 생성
   - `PUT /api/v1/onboarding/requests/{id}/decide` - 승인
   - `GET /api/v1/tenants/{tenantId}` - 테넌트 확인
   - `POST /api/v1/auth/login` - 로그인
   - `GET /api/v1/dashboards/{dashboardId}` - 대시보드 조회

2. **순차 실행**
   - 각 API를 순서대로 실행
   - 응답 확인
   - 다음 API에 필요한 데이터 추출 (예: requestId, tenantId)

---

### 시나리오 3: 데이터베이스 직접 확인

1. **온보딩 승인 후 즉시 확인**
   ```sql
   -- 최근 생성된 테넌트 확인
   SELECT * FROM tenants 
   WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
   ORDER BY created_at DESC;
   ```

2. **각 단계별 확인**
   - 테넌트 생성 확인
   - settings_json 확인
   - 관리자 계정 확인
   - 대시보드 확인
   - 컴포넌트 활성화 확인

---

## 🚀 빠른 테스트 스크립트

### 스크립트 1: 온보딩 플로우 자동 테스트 (Bash)

```bash
#!/bin/bash

# 환경 변수 설정
BASE_URL="http://localhost:8080/api/v1"
TENANT_ID="test-consultation-$(date +%s)"
TENANT_NAME="테스트 상담소"
EMAIL="admin@consultation.com"
PASSWORD="test1234"

echo "=== 온보딩 플로우 테스트 시작 ==="

# 1. 온보딩 요청 생성
echo "1. 온보딩 요청 생성..."
REQUEST_RESPONSE=$(curl -s -X POST "$BASE_URL/onboarding/requests" \
  -H "Content-Type: application/json" \
  -d "{
    \"tenantId\": \"$TENANT_ID\",
    \"tenantName\": \"$TENANT_NAME\",
    \"requestedBy\": \"$EMAIL\",
    \"businessType\": \"CONSULTATION\",
    \"checklistJson\": \"{\\\"adminPassword\\\": \\\"$PASSWORD\\\"}\"
  }")

REQUEST_ID=$(echo $REQUEST_RESPONSE | jq -r '.data.id')
echo "요청 ID: $REQUEST_ID"

# 2. 온보딩 승인
echo "2. 온보딩 승인..."
APPROVE_RESPONSE=$(curl -s -X PUT "$BASE_URL/onboarding/requests/$REQUEST_ID/decide" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"APPROVED\",
    \"decidedBy\": \"system-admin\",
    \"decisionNote\": \"테스트 승인\"
  }")

echo "승인 결과: $APPROVE_RESPONSE"

# 3. 테넌트 확인
echo "3. 테넌트 확인..."
TENANT_RESPONSE=$(curl -s "$BASE_URL/tenants/$TENANT_ID")
echo "테넌트 정보: $TENANT_RESPONSE"

# 4. 관리자 로그인
echo "4. 관리자 로그인..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
echo "로그인 성공: 토큰 발급됨"

# 5. 대시보드 조회
echo "5. 대시보드 조회..."
DASHBOARD_RESPONSE=$(curl -s "$BASE_URL/dashboards" \
  -H "Authorization: Bearer $TOKEN")
echo "대시보드 정보: $DASHBOARD_RESPONSE"

echo "=== 테스트 완료 ==="
```

---

## 📝 테스트 체크리스트

### 필수 테스트 항목

- [ ] 온보딩 요청 생성 성공
- [ ] 온보딩 승인 성공
- [ ] 테넌트 생성 확인
- [ ] `settings_json.features.consultation = true` 확인
- [ ] `settings_json.features.academy = false` 확인
- [ ] 관리자 계정 생성 확인
- [ ] 관리자 계정으로 로그인 성공
- [ ] 기본 대시보드 생성 확인
- [ ] 대시보드에 위젯 3개 이상 포함 확인
- [ ] 기본 컴포넌트 활성화 확인

### 선택 테스트 항목

- [ ] ACADEMY 업종 온보딩 테스트
- [ ] 멀티 테넌트 사용자 테스트
- [ ] 역할별 대시보드 라우팅 테스트

---

## 🐛 문제 해결

### 문제 1: 마이그레이션 실행 필요

**증상**: `settings_json`에 `features` 필드가 없음

**해결**:
```bash
# Flyway 마이그레이션 실행
cd MindGarden
./mvnw flyway:migrate
```

### 문제 2: 프로시저가 존재하지 않음

**증상**: `ProcessOnboardingApproval` 프로시저 호출 실패

**해결**:
```sql
-- 프로시저 존재 확인
SHOW PROCEDURE STATUS WHERE Name = 'ProcessOnboardingApproval';

-- 없으면 마이그레이션 실행
-- V15, V13 마이그레이션 파일 확인
```

### 문제 3: 기본 컴포넌트가 활성화되지 않음

**증상**: `tenant_components` 테이블에 데이터 없음

**해결**:
```sql
-- business_category_items에 default_components_json 설정 확인
SELECT * FROM business_category_items 
WHERE business_type = 'CONSULTATION' 
  AND is_active = TRUE;

-- 없으면 기본값 설정 필요
```

---

## 📊 테스트 결과 기록

테스트 결과를 기록하여 문서화하세요:

```markdown
## 테스트 결과 (2025-11-23)

### 테스트 환경
- 서버: localhost:8080
- 데이터베이스: MySQL 8.0
- 테스트 시간: 2025-11-23 16:00

### 테스트 결과
- ✅ 온보딩 요청 생성: 성공
- ✅ 온보딩 승인: 성공
- ✅ 테넌트 생성: 성공
- ✅ settings_json features: 확인됨
- ✅ 관리자 계정 생성: 성공
- ✅ 관리자 로그인: 성공
- ✅ 대시보드 생성: 성공
- ✅ 위젯 표시: 5개 위젯 확인
- ✅ 컴포넌트 활성화: 3개 컴포넌트 활성화 확인

### 발견된 이슈
- 없음
```

---

**마지막 업데이트**: 2025-11-23

