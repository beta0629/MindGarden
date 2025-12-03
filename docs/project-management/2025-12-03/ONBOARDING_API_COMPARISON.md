# 온보딩 API 테스트 비교 분석

**작성일**: 2025-12-03  
**목적**: 어제(2025-12-02) 테스트 통과 vs 오늘(2025-12-03) 테스트 실패 비교 분석

---

## 📊 비교 결과

### 어제 테스트 (2025-12-02) ✅ **통과 (100%)**

**테스트 스크립트**: `scripts/test-widget-grouping-system.sh`

**온보딩 요청 생성 부분**:
```bash
REQUEST_PAYLOAD=$(cat <<EOF
{
  "tenantName": "위젯 테스트 상담소",
  "requestedBy": "${TENANT_EMAIL}",
  "riskLevel": "LOW",
  "businessType": "CONSULTATION",
  "checklistJson": "{\"adminPassword\": \"${ADMIN_PASSWORD}\", \"contactPhone\": \"010-1234-5678\", \"address\": \"서울특별시 강남구\"}"
}
EOF
)

REQUEST_RESPONSE=$(curl -s -X POST "${API_URL}/api/v1/onboarding/requests" \
    -H "Content-Type: application/json" \
    -d "$REQUEST_PAYLOAD")
```

**특징**:
- ✅ 엔드포인트: `/api/v1/onboarding/requests` (복수) - **올바름**
- ✅ 요청 필드: `tenantName`, `requestedBy`, `riskLevel`, `businessType`, `checklistJson` - **올바름**
- ✅ `requestedBy`: 이메일 형식 - **올바름**
- ✅ `riskLevel`: "LOW" - **올바름**

**결과**: ✅ **성공 (온보딩 요청 생성 완료)**

---

### 오늘 테스트 (2025-12-03) ❌ **실패**

**테스트 스크립트**: `scripts/test-phase1-4-integration.sh`

**온보딩 요청 생성 부분** (수정 전):
```bash
ONBOARDING_REQUEST=$(cat <<EOF
{
  "businessType": "CONSULTATION_CENTER",
  "companyName": "테스트 상담소 Phase1-4",
  "businessNumber": "123-45-67890",
  "representativeName": "김상담",
  "email": "consultant-phase1-4-${TIMESTAMP}@test.com",
  "phone": "010-1234-5678",
  "address": "서울시 강남구",
  "requestedBy": "김상담"
}
EOF
)

ONBOARDING_RESPONSE=$(api_call "POST" "/api/v1/onboarding/request" "$ONBOARDING_REQUEST")
```

**문제점**:
- ❌ 엔드포인트: `/api/v1/onboarding/request` (단수) - **잘못됨**
- ❌ 요청 필드: `companyName`, `businessNumber`, `email`, `phone` 등 - **DTO에 없음**
- ❌ `tenantName` 없음 (필수 필드)
- ❌ `riskLevel` 없음 (필수 필드)
- ❌ `requestedBy`: "김상담" (이메일이 아님)

**결과**: ❌ **실패 (404 Not Found 또는 400 Bad Request)**

---

## 🔍 차이점 분석

### 1. 엔드포인트 경로

| 항목 | 어제 (통과) | 오늘 (실패) |
|-----|-----------|-----------|
| 엔드포인트 | `/api/v1/onboarding/requests` (복수) | `/api/v1/onboarding/request` (단수) |
| 결과 | ✅ 200 OK | ❌ 404 Not Found |

### 2. 요청 필드

| 필드 | 어제 (통과) | 오늘 (실패) | DTO 필수 여부 |
|-----|-----------|-----------|-------------|
| `tenantName` | ✅ 있음 | ❌ 없음 (`companyName` 사용) | ✅ 필수 |
| `requestedBy` | ✅ 이메일 형식 | ❌ 이름 형식 | ✅ 필수 |
| `riskLevel` | ✅ "LOW" | ❌ 없음 | ✅ 필수 |
| `businessType` | ✅ "CONSULTATION" | ⚠️ "CONSULTATION_CENTER" | 선택 |
| `checklistJson` | ✅ 있음 | ❌ 없음 | 선택 |
| `companyName` | ❌ 없음 | ❌ 있음 (DTO에 없음) | - |
| `businessNumber` | ❌ 없음 | ❌ 있음 (DTO에 없음) | - |
| `email` | ❌ 없음 | ❌ 있음 (DTO에 없음) | - |

### 3. 테스트 스크립트 작성 방식

**어제**:
- 기존 테스트 스크립트 (`test-widget-grouping-system.sh`) 사용
- 이미 검증된 스크립트
- 실제 컨트롤러와 DTO를 확인한 후 작성

**오늘**:
- 새로운 테스트 스크립트 (`test-phase1-4-integration.sh`) 작성
- 문서(`TENANT_CREATION_TEST_PLAN.md`)의 예시를 참고
- **문서의 예시가 잘못되어 있음!**

---

## 📝 문제의 근본 원인

### 1. 잘못된 문서 예시

**`TENANT_CREATION_TEST_PLAN.md` (2025-12-03 작성)**:
```bash
curl -X POST http://localhost:8080/api/v1/onboarding/request \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "CONSULTATION_CENTER",
    "companyName": "테스트 상담소",
    "businessNumber": "123-45-67890",
    ...
  }'
```

**문제점**:
- 엔드포인트가 `/request` (단수)로 되어 있음
- 요청 필드가 실제 DTO와 다름
- 이 문서를 참고하여 테스트 스크립트를 작성했기 때문에 실패

### 2. 실제 컨트롤러 확인 누락

오늘 테스트 스크립트 작성 시:
- 문서의 예시를 그대로 사용
- 실제 컨트롤러와 DTO를 확인하지 않음
- 어제 통과한 테스트 스크립트를 참고하지 않음

---

## ✅ 해결 방안

### 1. 테스트 스크립트 수정 (완료)

**수정된 스크립트** (`test-phase1-4-integration.sh`):
```bash
ONBOARDING_REQUEST=$(cat <<EOF
{
  "tenantName": "테스트 상담소 Phase1-4",
  "requestedBy": "${TEST_EMAIL}",
  "businessType": "CONSULTATION_CENTER",
  "riskLevel": "LOW",
  "checklistJson": "{}",
  "adminPassword": "Test1234!@#"
}
EOF
)

ONBOARDING_RESPONSE=$(api_call "POST" "/api/v1/onboarding/requests" "$ONBOARDING_REQUEST")
```

**변경 사항**:
- ✅ 엔드포인트: `/request` → `/requests` (복수)
- ✅ 필드: `tenantName`, `requestedBy` (이메일), `riskLevel` 추가
- ✅ 잘못된 필드 제거: `companyName`, `businessNumber`, `email`, `phone` 등

### 2. 문서 수정 필요

**`TENANT_CREATION_TEST_PLAN.md` 수정**:
- 엔드포인트 경로 수정
- 요청 필드 형식 수정
- 어제 통과한 테스트 스크립트의 예시 사용

---

## 🎯 결론

### 왜 어제는 통과했는가?

1. ✅ **올바른 엔드포인트 사용**: `/api/v1/onboarding/requests` (복수)
2. ✅ **올바른 요청 필드 사용**: DTO가 기대하는 필드와 일치
3. ✅ **검증된 테스트 스크립트 사용**: 이미 작동하는 스크립트 재사용

### 왜 오늘은 실패했는가?

1. ❌ **잘못된 문서 참고**: `TENANT_CREATION_TEST_PLAN.md`의 잘못된 예시 사용
2. ❌ **실제 컨트롤러 미확인**: DTO와 컨트롤러를 확인하지 않음
3. ❌ **기존 테스트 스크립트 미참고**: 어제 통과한 스크립트를 참고하지 않음

### 교훈

**테스트 스크립트 작성 시**:
1. ✅ 실제 컨트롤러와 DTO를 먼저 확인
2. ✅ 기존 통과한 테스트 스크립트 참고
3. ✅ 문서의 예시는 참고용일 뿐, 실제 코드 확인 필수

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025-12-03

