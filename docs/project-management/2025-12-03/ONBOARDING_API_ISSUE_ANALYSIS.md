# 온보딩 API 테스트 실패 원인 분석

**작성일**: 2025-12-03  
**이슈**: Phase 5 테스트 중 "상담사 테넌트 온보딩 신청" 실패 (응답이 비어있음)

---

## 🔍 문제 분석

### 1. ❌ 엔드포인트 경로 불일치

**테스트 스크립트**:
```bash
/api/v1/onboarding/request  # 단수 (잘못됨)
```

**실제 컨트롤러**:
```java
@PostMapping("/requests")  // 복수
@RequestMapping("/api/v1/onboarding")
// → /api/v1/onboarding/requests
```

**결과**: 404 Not Found 에러 발생

---

### 2. ❌ 요청 필드 형식 불일치

**테스트 스크립트가 보내는 필드**:
```json
{
  "businessType": "CONSULTATION_CENTER",
  "companyName": "테스트 상담소 Phase1-4",      // ❌ tenantName이 아님
  "businessNumber": "123-45-67890",             // ❌ DTO에 없음
  "representativeName": "김상담",                // ❌ DTO에 없음
  "email": "consultant-phase1-4-${TIMESTAMP}@test.com",  // ❌ DTO에 없음
  "phone": "010-1234-5678",                     // ❌ DTO에 없음
  "address": "서울시 강남구",                    // ❌ DTO에 없음
  "requestedBy": "김상담"                        // ⚠️ 이메일이어야 함
}
```

**실제 DTO가 기대하는 필드** (`OnboardingCreateRequest`):
```java
public record OnboardingCreateRequest(
    String tenantId,              // nullable (신규 생성 시 null)
    String tenantName,            // @NotBlank 필수
    String requestedBy,           // @NotBlank 필수 (이메일 형식)
    RiskLevel riskLevel,          // @NotNull 필수
    String checklistJson,         // nullable
    String businessType,          // nullable
    String adminPassword          // nullable
)
```

**필수 필드 누락**:
- ❌ `tenantName` (테스트는 `companyName` 사용)
- ❌ `riskLevel` (필수인데 없음)

**잘못된 필드**:
- ❌ `companyName`, `businessNumber`, `representativeName`, `email`, `phone`, `address` (DTO에 존재하지 않음)

---

### 3. ❌ 세션 권한 확인 문제

**컨트롤러의 권한 확인 로직**:
```java
validateOnboardingAccess(session);
```

**`validateOnboardingAccess()` 메서드 동작**:
1. 세션에 사용자 정보가 있으면 이메일 추출
2. 해당 이메일로 사용자 조회
3. **이미 `tenant_id`가 있는 사용자는 접근 거부**

**문제점**:
- 테스트에서 로그인한 상태(`superadmin@mindgarden.com`)로 API를 호출
- `superadmin@mindgarden.com`은 이미 테넌트에 속해 있을 가능성
- 따라서 `AccessDeniedException` 발생 가능

**컨트롤러 코드**:
```java
if (hasTenantId) {
    log.warn("온보딩 접근 거부: 이미 테넌트에 속한 사용자 - email={}, tenantIds={}", 
        normalizedEmail, tenantIds);
    throw new AccessDeniedException("이미 테넌트에 속한 사용자는 온보딩에 접근할 수 없습니다...");
}
```

---

## 🔧 수정 방안

### 1. 엔드포인트 경로 수정

**변경 전**:
```bash
/api/v1/onboarding/request
```

**변경 후**:
```bash
/api/v1/onboarding/requests
```

---

### 2. 요청 필드 형식 수정

**변경 전**:
```json
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
```

**변경 후**:
```json
{
  "tenantName": "테스트 상담소 Phase1-4",
  "requestedBy": "test-onboarding-${TIMESTAMP}@test.com",
  "businessType": "CONSULTATION_CENTER",
  "riskLevel": "LOW",
  "checklistJson": "{}",
  "adminPassword": "Test1234!@#"
}
```

---

### 3. 세션 없이 API 호출

**문제**: 로그인한 상태로 호출하면 `validateOnboardingAccess()`에서 거부됨

**해결 방법**:
1. 온보딩 요청 생성 API는 **세션 없이** 호출 (로그인하지 않은 사용자)
2. 또는 테스트용으로 세션 체크를 우회하는 방법

**테스트 스크립트 수정**:
```bash
# 쿠키 파일 없이 API 호출 (세션 없음)
ONBOARDING_RESPONSE=$(api_call "POST" "/api/v1/onboarding/requests" "$ONBOARDING_REQUEST")
# COOKIE_FILE을 전달하지 않음
```

---

## 📋 수정된 테스트 스크립트 예시

```bash
# 5.1 상담사 테넌트 온보딩 신청
echo -e "${YELLOW}[5.1] 상담사 테넌트 온보딩 신청...${NC}"
TIMESTAMP=$(date +%s)
TEST_EMAIL="test-onboarding-${TIMESTAMP}@test.com"

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

# 세션 없이 API 호출 (로그인하지 않은 사용자)
ONBOARDING_RESPONSE=$(api_call "POST" "/api/v1/onboarding/requests" "$ONBOARDING_REQUEST")
```

---

## ✅ 검증 방법

1. **엔드포인트 확인**:
   ```bash
   curl -X POST http://localhost:8080/api/v1/onboarding/requests \
     -H "Content-Type: application/json" \
     -d '{"tenantName":"테스트","requestedBy":"test@test.com","riskLevel":"LOW"}'
   ```

2. **요청 필드 확인**:
   - `tenantName`: 필수
   - `requestedBy`: 필수 (이메일 형식)
   - `riskLevel`: 필수 (`LOW`, `MEDIUM`, `HIGH`)
   - `businessType`: 선택
   - `checklistJson`: 선택
   - `adminPassword`: 선택

3. **세션 확인**:
   - 세션 없이 호출하면 정상 작동
   - 이미 테넌트에 속한 사용자 세션으로 호출하면 거부

---

## 🎯 결론

**온보딩 API 테스트 실패의 주요 원인**:

1. ❌ **엔드포인트 경로 오류**: `/request` → `/requests`
2. ❌ **요청 필드 형식 오류**: DTO가 기대하는 필드와 다름
3. ❌ **세션 권한 문제**: 이미 테넌트에 속한 사용자는 접근 불가

**수정 후 예상 결과**: ✅ 테스트 통과

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025-12-03

