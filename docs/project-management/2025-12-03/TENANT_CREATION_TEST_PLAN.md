# 테넌트 생성 테스트 계획

**작성일:** 2025-12-03  
**목적:** 상담사 및 내담자 테넌트 생성 프로세스 검증  
**우선순위:** 🔥 최우선

---

## 📌 테스트 목표

### 1. 온보딩 프로세스 검증
- 상담사 온보딩 신청 → 승인 → 테넌트 생성
- 내담자 온보딩 신청 → 승인 → 테넌트 생성

### 2. 대시보드 자동 생성 확인
- 역할별 대시보드 자동 생성 확인
- 대시보드 접근 권한 확인
- 위젯 그룹 및 위젯 자동 생성 확인

### 3. 데이터 무결성 검증
- 테넌트 데이터 격리 확인
- 역할 및 권한 정상 할당 확인
- 관리자 계정 자동 생성 확인

---

## 🧪 테스트 시나리오

### 시나리오 1: 상담사 테넌트 생성

#### 1.1 온보딩 신청
```bash
# API 호출
curl -X POST http://localhost:8080/api/v1/onboarding/request \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "CONSULTATION_CENTER",
    "companyName": "테스트 상담소",
    "businessNumber": "123-45-67890",
    "representativeName": "김상담",
    "email": "consultant@test.com",
    "phone": "010-1234-5678",
    "address": "서울시 강남구",
    "requestedBy": "김상담"
  }'
```

**예상 결과:**
- ✅ HTTP 200 OK
- ✅ `onboardingRequestId` 반환
- ✅ DB에 `onboarding_requests` 레코드 생성
- ✅ 상태: `PENDING`

#### 1.2 온보딩 승인
```bash
# API 호출
curl -X POST http://localhost:8080/api/v1/onboarding/approve/{requestId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -d '{
    "approvedBy": "admin@mindgarden.com",
    "notes": "승인 완료"
  }'
```

**예상 결과:**
- ✅ HTTP 200 OK
- ✅ 테넌트 생성 (`tenants` 테이블)
- ✅ 관리자 계정 생성 (`users` 테이블)
- ✅ 역할 생성 (`tenant_roles` 테이블)
- ✅ 대시보드 생성 (`dashboards` 테이블)
- ✅ 위젯 그룹 생성 (`widget_groups` 테이블)
- ✅ 위젯 정의 생성 (`widget_definitions` 테이블)

#### 1.3 테넌트 확인
```sql
-- 테넌트 확인
SELECT * FROM tenants WHERE business_type = 'CONSULTATION_CENTER' ORDER BY created_at DESC LIMIT 1;

-- 관리자 계정 확인
SELECT * FROM users WHERE email = 'consultant@test.com';

-- 역할 확인
SELECT tr.*, rt.name_ko 
FROM tenant_roles tr 
JOIN role_templates rt ON tr.role_template_id = rt.role_template_id 
WHERE tr.tenant_id = '{TENANT_ID}';

-- 대시보드 확인
SELECT * FROM dashboards WHERE tenant_id = '{TENANT_ID}';

-- 위젯 그룹 확인
SELECT * FROM widget_groups WHERE tenant_id = '{TENANT_ID}';

-- 위젯 정의 확인
SELECT wd.* 
FROM widget_definitions wd
JOIN widget_groups wg ON wd.widget_group_id = wg.widget_group_id
WHERE wg.tenant_id = '{TENANT_ID}';
```

**예상 결과:**
- ✅ 테넌트 1개 생성
- ✅ 관리자 계정 1개 생성
- ✅ 역할 4-5개 생성 (ADMIN, CONSULTANT, CLIENT 등)
- ✅ 대시보드 4-5개 생성
- ✅ 위젯 그룹 10-15개 생성
- ✅ 위젯 정의 20-30개 생성

#### 1.4 로그인 테스트
```bash
# 로그인 API 호출
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "consultant@test.com",
    "password": "임시비밀번호"
  }'
```

**예상 결과:**
- ✅ HTTP 200 OK
- ✅ JWT 토큰 반환
- ✅ 사용자 정보 반환 (tenantId, role 포함)

#### 1.5 대시보드 접근 테스트
```bash
# 대시보드 목록 조회
curl -X GET http://localhost:8080/api/v1/tenant/dashboards \
  -H "Authorization: Bearer {TOKEN}"

# 특정 대시보드 조회
curl -X GET http://localhost:8080/api/v1/tenant/dashboards/{dashboardId} \
  -H "Authorization: Bearer {TOKEN}"

# 위젯 그룹 조회
curl -X GET http://localhost:8080/api/v1/widgets/groups?dashboardId={dashboardId} \
  -H "Authorization: Bearer {TOKEN}"
```

**예상 결과:**
- ✅ 대시보드 목록 반환 (4-5개)
- ✅ 각 대시보드의 위젯 그룹 반환
- ✅ 각 위젯 그룹의 위젯 정의 반환
- ✅ 다른 테넌트 데이터 접근 불가

---

### 시나리오 2: 내담자 테넌트 생성

#### 2.1 온보딩 신청
```bash
# API 호출
curl -X POST http://localhost:8080/api/v1/onboarding/request \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "INDIVIDUAL_CLIENT",
    "companyName": "개인 내담자",
    "representativeName": "이내담",
    "email": "client@test.com",
    "phone": "010-9876-5432",
    "requestedBy": "이내담"
  }'
```

**예상 결과:**
- ✅ HTTP 200 OK
- ✅ `onboardingRequestId` 반환
- ✅ DB에 `onboarding_requests` 레코드 생성

#### 2.2 온보딩 승인
```bash
# API 호출
curl -X POST http://localhost:8080/api/v1/onboarding/approve/{requestId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -d '{
    "approvedBy": "admin@mindgarden.com",
    "notes": "승인 완료"
  }'
```

**예상 결과:**
- ✅ HTTP 200 OK
- ✅ 테넌트 생성 (business_type = 'INDIVIDUAL_CLIENT')
- ✅ 관리자 계정 생성
- ✅ 역할 생성 (CLIENT 역할 포함)
- ✅ 대시보드 생성 (Client Dashboard)
- ✅ 위젯 그룹 및 위젯 생성

#### 2.3 테넌트 확인
```sql
-- 테넌트 확인
SELECT * FROM tenants WHERE business_type = 'INDIVIDUAL_CLIENT' ORDER BY created_at DESC LIMIT 1;

-- 관리자 계정 확인
SELECT * FROM users WHERE email = 'client@test.com';

-- 역할 확인 (CLIENT 역할이 있어야 함)
SELECT tr.*, rt.name_ko 
FROM tenant_roles tr 
JOIN role_templates rt ON tr.role_template_id = rt.role_template_id 
WHERE tr.tenant_id = '{TENANT_ID}' AND rt.role_code = 'CLIENT';

-- 대시보드 확인 (Client Dashboard가 있어야 함)
SELECT * FROM dashboards WHERE tenant_id = '{TENANT_ID}' AND role_code = 'CLIENT';
```

**예상 결과:**
- ✅ 테넌트 1개 생성 (INDIVIDUAL_CLIENT)
- ✅ CLIENT 역할 생성
- ✅ Client Dashboard 생성
- ✅ 내담자용 위젯 그룹 생성

#### 2.4 로그인 및 대시보드 접근 테스트
```bash
# 로그인
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@test.com",
    "password": "임시비밀번호"
  }'

# 대시보드 조회
curl -X GET http://localhost:8080/api/v1/tenant/dashboards \
  -H "Authorization: Bearer {TOKEN}"
```

**예상 결과:**
- ✅ 로그인 성공
- ✅ Client Dashboard 접근 가능
- ✅ 내담자용 위젯 표시
- ✅ 다른 역할의 대시보드 접근 불가

---

### 시나리오 3: 멱등성 테스트

#### 3.1 중복 온보딩 신청
```bash
# 동일한 이메일로 재신청
curl -X POST http://localhost:8080/api/v1/onboarding/request \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "CONSULTATION_CENTER",
    "companyName": "테스트 상담소",
    "email": "consultant@test.com",
    ...
  }'
```

**예상 결과:**
- ✅ HTTP 400 Bad Request
- ✅ 에러 메시지: "이미 존재하는 이메일입니다"

#### 3.2 중복 승인 시도
```bash
# 이미 승인된 요청을 재승인
curl -X POST http://localhost:8080/api/v1/onboarding/approve/{requestId} \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

**예상 결과:**
- ✅ HTTP 400 Bad Request
- ✅ 에러 메시지: "이미 승인된 요청입니다"
- ✅ 중복 테넌트 생성 안됨

#### 3.3 10회 반복 테스트
```bash
# 스크립트 실행
./scripts/test-onboarding-idempotency.sh
```

**예상 결과:**
- ✅ 모든 테스트 통과
- ✅ 데이터 일관성 유지
- ✅ 중복 생성 없음

---

### 시나리오 4: 데이터 격리 테스트

#### 4.1 테넌트 A 생성
```bash
# 상담사 테넌트 A 생성
# (시나리오 1 반복)
```

#### 4.2 테넌트 B 생성
```bash
# 상담사 테넌트 B 생성
# 다른 이메일로 신청
```

#### 4.3 데이터 격리 확인
```sql
-- 테넌트 A의 대시보드
SELECT * FROM dashboards WHERE tenant_id = '{TENANT_A_ID}';

-- 테넌트 B의 대시보드
SELECT * FROM dashboards WHERE tenant_id = '{TENANT_B_ID}';

-- 테넌트 A로 로그인 후 테넌트 B 데이터 접근 시도
-- (API 테스트)
```

**예상 결과:**
- ✅ 각 테넌트의 데이터 완전 격리
- ✅ 테넌트 A는 테넌트 B 데이터 접근 불가
- ✅ 테넌트 B는 테넌트 A 데이터 접근 불가

---

## 🔍 검증 포인트

### 1. 데이터베이스 검증
- [ ] `tenants` 테이블에 레코드 생성
- [ ] `users` 테이블에 관리자 계정 생성
- [ ] `tenant_roles` 테이블에 역할 생성
- [ ] `dashboards` 테이블에 대시보드 생성
- [ ] `widget_groups` 테이블에 위젯 그룹 생성
- [ ] `widget_definitions` 테이블에 위젯 정의 생성
- [ ] 모든 레코드에 `tenant_id` 정상 할당

### 2. 비즈니스 로직 검증
- [ ] 온보딩 상태 변화 (PENDING → APPROVED)
- [ ] 이메일 중복 체크
- [ ] 비즈니스 타입별 역할 할당
- [ ] 비즈니스 타입별 대시보드 생성
- [ ] 비즈니스 타입별 위젯 할당

### 3. 보안 검증
- [ ] 테넌트 데이터 격리
- [ ] 권한 기반 접근 제어
- [ ] JWT 토큰 검증
- [ ] CSRF 토큰 검증
- [ ] SQL Injection 방지

### 4. 성능 검증
- [ ] 온보딩 승인 처리 시간 (< 5초)
- [ ] 대시보드 조회 시간 (< 1초)
- [ ] 위젯 조회 시간 (< 1초)
- [ ] 동시 온보딩 처리 (10건)

---

## 📝 테스트 스크립트

### 자동화 스크립트 작성
**파일:** `scripts/test-tenant-creation.sh`

```bash
#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE_URL="http://localhost:8080"
ADMIN_TOKEN=""

echo "=========================================="
echo "테넌트 생성 테스트 시작"
echo "=========================================="

# 1. 관리자 로그인
echo -e "\n${YELLOW}[1/10] 관리자 로그인...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@mindgarden.com",
    "password": "admin123"
  }')

ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
    echo -e "${RED}✗ 관리자 로그인 실패${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 관리자 로그인 성공${NC}"

# 2. 상담사 온보딩 신청
echo -e "\n${YELLOW}[2/10] 상담사 온보딩 신청...${NC}"
CONSULTANT_REQUEST=$(curl -s -X POST "${API_BASE_URL}/api/v1/onboarding/request" \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "CONSULTATION_CENTER",
    "companyName": "테스트 상담소",
    "businessNumber": "123-45-67890",
    "representativeName": "김상담",
    "email": "consultant_'$(date +%s)'@test.com",
    "phone": "010-1234-5678",
    "address": "서울시 강남구",
    "requestedBy": "김상담"
  }')

CONSULTANT_REQUEST_ID=$(echo $CONSULTANT_REQUEST | jq -r '.data.onboardingRequestId')

if [ -z "$CONSULTANT_REQUEST_ID" ] || [ "$CONSULTANT_REQUEST_ID" = "null" ]; then
    echo -e "${RED}✗ 상담사 온보딩 신청 실패${NC}"
    echo $CONSULTANT_REQUEST | jq '.'
    exit 1
fi
echo -e "${GREEN}✓ 상담사 온보딩 신청 성공 (ID: $CONSULTANT_REQUEST_ID)${NC}"

# 3. 상담사 온보딩 승인
echo -e "\n${YELLOW}[3/10] 상담사 온보딩 승인...${NC}"
CONSULTANT_APPROVAL=$(curl -s -X POST "${API_BASE_URL}/api/v1/onboarding/approve/${CONSULTANT_REQUEST_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{
    "approvedBy": "superadmin@mindgarden.com",
    "notes": "자동 테스트 승인"
  }')

CONSULTANT_TENANT_ID=$(echo $CONSULTANT_APPROVAL | jq -r '.data.tenantId')

if [ -z "$CONSULTANT_TENANT_ID" ] || [ "$CONSULTANT_TENANT_ID" = "null" ]; then
    echo -e "${RED}✗ 상담사 온보딩 승인 실패${NC}"
    echo $CONSULTANT_APPROVAL | jq '.'
    exit 1
fi
echo -e "${GREEN}✓ 상담사 온보딩 승인 성공 (Tenant ID: $CONSULTANT_TENANT_ID)${NC}"

# 4. 상담사 대시보드 확인
echo -e "\n${YELLOW}[4/10] 상담사 대시보드 확인...${NC}"
sleep 2 # 데이터 생성 대기

CONSULTANT_EMAIL=$(echo $CONSULTANT_REQUEST | jq -r '.data.email')
CONSULTANT_LOGIN=$(curl -s -X POST "${API_BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${CONSULTANT_EMAIL}\",
    \"password\": \"임시비밀번호\"
  }")

CONSULTANT_TOKEN=$(echo $CONSULTANT_LOGIN | jq -r '.data.token')

if [ -z "$CONSULTANT_TOKEN" ] || [ "$CONSULTANT_TOKEN" = "null" ]; then
    echo -e "${RED}✗ 상담사 로그인 실패${NC}"
    exit 1
fi

CONSULTANT_DASHBOARDS=$(curl -s -X GET "${API_BASE_URL}/api/v1/tenant/dashboards" \
  -H "Authorization: Bearer ${CONSULTANT_TOKEN}")

DASHBOARD_COUNT=$(echo $CONSULTANT_DASHBOARDS | jq '.data | length')

if [ "$DASHBOARD_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ 상담사 대시보드 확인 성공 (${DASHBOARD_COUNT}개)${NC}"
else
    echo -e "${RED}✗ 상담사 대시보드 없음${NC}"
    exit 1
fi

# 5. 내담자 온보딩 신청
echo -e "\n${YELLOW}[5/10] 내담자 온보딩 신청...${NC}"
CLIENT_REQUEST=$(curl -s -X POST "${API_BASE_URL}/api/v1/onboarding/request" \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "INDIVIDUAL_CLIENT",
    "companyName": "개인 내담자",
    "representativeName": "이내담",
    "email": "client_'$(date +%s)'@test.com",
    "phone": "010-9876-5432",
    "requestedBy": "이내담"
  }')

CLIENT_REQUEST_ID=$(echo $CLIENT_REQUEST | jq -r '.data.onboardingRequestId')

if [ -z "$CLIENT_REQUEST_ID" ] || [ "$CLIENT_REQUEST_ID" = "null" ]; then
    echo -e "${RED}✗ 내담자 온보딩 신청 실패${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 내담자 온보딩 신청 성공 (ID: $CLIENT_REQUEST_ID)${NC}"

# 6. 내담자 온보딩 승인
echo -e "\n${YELLOW}[6/10] 내담자 온보딩 승인...${NC}"
CLIENT_APPROVAL=$(curl -s -X POST "${API_BASE_URL}/api/v1/onboarding/approve/${CLIENT_REQUEST_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{
    "approvedBy": "superadmin@mindgarden.com",
    "notes": "자동 테스트 승인"
  }')

CLIENT_TENANT_ID=$(echo $CLIENT_APPROVAL | jq -r '.data.tenantId')

if [ -z "$CLIENT_TENANT_ID" ] || [ "$CLIENT_TENANT_ID" = "null" ]; then
    echo -e "${RED}✗ 내담자 온보딩 승인 실패${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 내담자 온보딩 승인 성공 (Tenant ID: $CLIENT_TENANT_ID)${NC}"

# 7. 내담자 대시보드 확인
echo -e "\n${YELLOW}[7/10] 내담자 대시보드 확인...${NC}"
sleep 2

CLIENT_EMAIL=$(echo $CLIENT_REQUEST | jq -r '.data.email')
CLIENT_LOGIN=$(curl -s -X POST "${API_BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${CLIENT_EMAIL}\",
    \"password\": \"임시비밀번호\"
  }")

CLIENT_TOKEN=$(echo $CLIENT_LOGIN | jq -r '.data.token')

if [ -z "$CLIENT_TOKEN" ] || [ "$CLIENT_TOKEN" = "null" ]; then
    echo -e "${RED}✗ 내담자 로그인 실패${NC}"
    exit 1
fi

CLIENT_DASHBOARDS=$(curl -s -X GET "${API_BASE_URL}/api/v1/tenant/dashboards" \
  -H "Authorization: Bearer ${CLIENT_TOKEN}")

CLIENT_DASHBOARD_COUNT=$(echo $CLIENT_DASHBOARDS | jq '.data | length')

if [ "$CLIENT_DASHBOARD_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ 내담자 대시보드 확인 성공 (${CLIENT_DASHBOARD_COUNT}개)${NC}"
else
    echo -e "${RED}✗ 내담자 대시보드 없음${NC}"
    exit 1
fi

# 8. 데이터 격리 확인
echo -e "\n${YELLOW}[8/10] 데이터 격리 확인...${NC}"

# 상담사 토큰으로 내담자 테넌트 데이터 접근 시도
ISOLATION_TEST=$(curl -s -X GET "${API_BASE_URL}/api/v1/tenant/dashboards?tenantId=${CLIENT_TENANT_ID}" \
  -H "Authorization: Bearer ${CONSULTANT_TOKEN}")

# 접근 거부되어야 함
if echo $ISOLATION_TEST | grep -q "error\|unauthorized\|forbidden"; then
    echo -e "${GREEN}✓ 데이터 격리 확인 성공 (접근 거부됨)${NC}"
else
    echo -e "${RED}✗ 데이터 격리 실패 (접근 허용됨)${NC}"
    exit 1
fi

# 9. 위젯 확인
echo -e "\n${YELLOW}[9/10] 위젯 확인...${NC}"

CONSULTANT_DASHBOARD_ID=$(echo $CONSULTANT_DASHBOARDS | jq -r '.data[0].dashboardId')
CONSULTANT_WIDGETS=$(curl -s -X GET "${API_BASE_URL}/api/v1/widgets/groups?dashboardId=${CONSULTANT_DASHBOARD_ID}" \
  -H "Authorization: Bearer ${CONSULTANT_TOKEN}")

WIDGET_GROUP_COUNT=$(echo $CONSULTANT_WIDGETS | jq '.data | length')

if [ "$WIDGET_GROUP_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ 위젯 확인 성공 (${WIDGET_GROUP_COUNT}개 그룹)${NC}"
else
    echo -e "${RED}✗ 위젯 없음${NC}"
    exit 1
fi

# 10. 최종 요약
echo -e "\n=========================================="
echo -e "${GREEN}테스트 완료!${NC}"
echo "=========================================="
echo "상담사 테넌트 ID: $CONSULTANT_TENANT_ID"
echo "상담사 대시보드: ${DASHBOARD_COUNT}개"
echo "내담자 테넌트 ID: $CLIENT_TENANT_ID"
echo "내담자 대시보드: ${CLIENT_DASHBOARD_COUNT}개"
echo "위젯 그룹: ${WIDGET_GROUP_COUNT}개"
echo "=========================================="
```

---

## 📊 예상 결과

### 성공 시나리오
```
✓ 상담사 온보딩 신청 성공
✓ 상담사 온보딩 승인 성공
✓ 상담사 테넌트 생성 (ID: xxx)
✓ 상담사 관리자 계정 생성
✓ 상담사 역할 4개 생성
✓ 상담사 대시보드 4개 생성
✓ 상담사 위젯 그룹 12개 생성
✓ 상담사 위젯 정의 25개 생성

✓ 내담자 온보딩 신청 성공
✓ 내담자 온보딩 승인 성공
✓ 내담자 테넌트 생성 (ID: yyy)
✓ 내담자 관리자 계정 생성
✓ 내담자 역할 2개 생성
✓ 내담자 대시보드 1개 생성
✓ 내담자 위젯 그룹 5개 생성
✓ 내담자 위젯 정의 10개 생성

✓ 데이터 격리 확인
✓ 권한 확인
✓ 모든 테스트 통과
```

### 실패 시나리오 대응
```
✗ 온보딩 승인 실패
  → 로그 확인: logs/coresolution.log
  → 프로시저 확인: ProcessOnboardingApproval
  → Collation 설정 확인

✗ 대시보드 생성 실패
  → widget_groups 테이블 확인
  → default_widget_groups 데이터 확인
  → 비즈니스 타입 매핑 확인

✗ 로그인 실패
  → 비밀번호 해시 확인
  → 사용자 계정 활성화 확인
  → 이메일 중복 확인
```

---

## 🔧 트러블슈팅

### 문제 1: 온보딩 승인 시 프로시저 실패
**증상:** `ProcessOnboardingApproval` 프로시저 실패

**해결:**
```sql
-- 프로시저 로그 확인
SELECT * FROM onboarding_requests WHERE onboarding_request_id = '{REQUEST_ID}';

-- 프로시저 재실행
CALL ProcessOnboardingApproval('{REQUEST_ID}', 'admin@mindgarden.com', '승인');
```

### 문제 2: 대시보드 생성 안됨
**증상:** 테넌트는 생성되었으나 대시보드 없음

**해결:**
```sql
-- default_widget_groups 확인
SELECT * FROM default_widget_groups WHERE business_type = 'CONSULTATION_CENTER';

-- 수동 대시보드 생성
INSERT INTO dashboards (dashboard_id, tenant_id, role_code, name_ko, name_en, description, is_active)
VALUES (UUID(), '{TENANT_ID}', 'ADMIN', '관리자 대시보드', 'Admin Dashboard', '관리자용 대시보드', true);
```

### 문제 3: 위젯 그룹 생성 안됨
**증상:** 대시보드는 있으나 위젯 그룹 없음

**해결:**
```sql
-- default_widget_groups에서 복사
INSERT INTO widget_groups (widget_group_id, tenant_id, dashboard_id, group_name, display_order, is_active)
SELECT UUID(), '{TENANT_ID}', '{DASHBOARD_ID}', group_name, display_order, is_active
FROM default_widget_groups
WHERE business_type = 'CONSULTATION_CENTER' AND role_code = 'ADMIN';
```

---

## 📅 실행 일정

### 즉시 실행 (오늘)
1. ✅ 테스트 스크립트 작성
2. ✅ 상담사 온보딩 테스트
3. ✅ 내담자 온보딩 테스트
4. ✅ 데이터 격리 테스트
5. ✅ 테스트 결과 문서화

### 예상 시간
- 스크립트 작성: 1시간
- 테스트 실행: 1시간
- 문제 해결: 1시간 (발생 시)
- 문서화: 0.5시간

**총 예상 시간:** 2.5-3.5시간

---

**작성자:** AI Assistant  
**최종 수정:** 2025-12-03  
**다음 단계:** 테스트 스크립트 실행 및 결과 확인

