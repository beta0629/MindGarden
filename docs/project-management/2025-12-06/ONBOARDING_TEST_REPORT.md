# 온보딩 테스트 리포트

**테스트 일시**: 2025-12-06 13:24:15 (KST)  
**테스트 환경**: 로컬 개발 서버 (localhost:8080)  
**테스트 스크립트**: `scripts/development/testing/test-onboarding-local.sh`

---

## 1. 서버 상태 확인

### 1.1 서버 헬스체크
- **상태**: ✅ UP
- **응답**: `{"status":"UP","groups":["liveness","readiness"]}`
- **포트**: 8080
- **URL**: http://localhost:8080

### 1.2 백엔드 로그 확인
- **컴파일 상태**: ⚠️ 테스트 코드 컴파일 오류 (서버 실행에는 영향 없음)
  - `PasskeyControllerTest.java`: PasskeyController 클래스를 찾을 수 없음
  - `GoogleOAuth2ServiceTest.java`: GoogleOAuth2ServiceImpl 클래스를 찾을 수 없음
  - `PasskeyServiceTest.java`: PasskeyServiceImpl 클래스를 찾을 수 없음

---

## 2. 온보딩 테스트 실행

### 2.1 테스트 시나리오
1. 서버 연결 확인
2. 온보딩 요청 생성
3. 온보딩 승인
4. 테넌트 생성 확인

### 2.2 테스트 결과

#### ✅ 서버 연결 확인
- **결과**: 성공
- **응답 시간**: 즉시 응답
- **상태 코드**: 200 OK

#### ❌ 온보딩 요청 생성
- **결과**: 실패
- **상태 코드**: 401 Unauthorized
- **오류 메시지**: 인증이 필요합니다
- **원인 분석**:
  - `OnboardingController.create()` 메서드가 `validateOnboardingAccess(session)` 호출
  - Spring Security가 인증을 요구하고 있음
  - 개발 환경 설정(`SecurityConfig`)에서는 `.anyRequest().permitAll()`로 설정되어 있으나, 실제로는 인증이 필요함

### 2.3 상세 오류 정보

```http
POST /api/v1/onboarding/requests HTTP/1.1
Host: localhost:8080
Content-Type: application/json

Response:
HTTP/1.1 401
WWW-Authenticate: Bearer
Content-Length: 0
```

**요청 본문**:
```json
{
  "tenantId": "test-tenant-1764995049",
  "tenantName": "테스트테넌트1764995049",
  "requestedBy": "test1764995049@test.com",
  "businessType": "CONSULTATION",
  "checklistJson": "{\"adminPassword\": \"Test1234!@#\"}"
}
```

---

## 3. 문제점 분석

### 3.1 인증 문제
- **현상**: 온보딩 요청 생성 시 401 Unauthorized 오류
- **원인**: 
  1. `OnboardingController`의 `validateOnboardingAccess()` 메서드가 세션을 확인
  2. Spring Security 설정이 실제로는 인증을 요구하고 있음
  3. 개발 환경 설정이 제대로 적용되지 않았을 가능성

### 3.2 해결 방안

#### 옵션 1: SecurityConfig 수정
- 온보딩 API 엔드포인트를 명시적으로 `permitAll()`에 추가
- 예: `.requestMatchers("/api/v1/onboarding/**").permitAll()`

#### 옵션 2: validateOnboardingAccess 메서드 수정
- 세션이 없어도 접근 가능하도록 수정
- 온보딩은 새로운 테넌트 등록이므로 인증이 필요 없어야 함

#### 옵션 3: 테스트 스크립트에 인증 추가
- 테스트용 인증 토큰 또는 세션 생성
- 하지만 온보딩은 인증 없이 접근 가능해야 함

---

## 4. 마이그레이션 파일 확인

### 4.1 프로시저 정의 확인
- ✅ `CreateOrActivateTenant`: 정의 확인됨 (V20251202_017)
- ✅ `ApplyDefaultRoleTemplates`: 정의 확인됨 (V41)
- ✅ `CreateTenantAdminAccount`: 정의 확인됨 (V20251202_017)
- ✅ `ProcessOnboardingApproval`: 정의 확인됨 (V20251202_018)

### 4.2 branch_code 사용 확인
- ✅ 모든 온보딩 프로시저는 `tenant_id` 기반으로 작동
- ✅ `branch_code` 사용 없음
- ✅ 마이그레이션 오류 가능성 낮음

### 4.3 프로시저 파라미터 확인
- ✅ `ProcessOnboardingApproval` 프로시저 시그니처 확인
  - `p_request_id BINARY(16)` ✅
  - `p_tenant_id VARCHAR(64)` ✅
  - `p_tenant_name VARCHAR(255)` ✅
  - `p_business_type VARCHAR(50)` ✅
  - `p_approved_by VARCHAR(100)` ✅
  - `p_decision_note TEXT` ✅
  - `p_contact_email VARCHAR(100)` ✅
  - `p_admin_password_hash VARCHAR(100)` ✅
  - `OUT p_success BOOLEAN` ✅
  - `OUT p_message TEXT` ✅

---

## 5. 테스트 스크립트 수정 사항

### 5.1 test-onboarding-now.sh 수정
- **수정 내용**: REQUEST_ID 추출 로직을 UUID 형식으로 변경
- **변경 전**: `grep -o '"id":[0-9]*'` (숫자만 추출)
- **변경 후**: `grep -oE '"id":"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"'` (UUID 형식)

### 5.2 test-onboarding-local.sh
- ✅ 이미 UUID 형식으로 올바르게 설정됨
- ✅ 서버 연결 확인 로직 포함 (최대 60초 대기)

---

## 6. 다음 단계

### 6.1 즉시 해결 필요
1. ✅ **SecurityConfig 수정 완료**: 온보딩 API를 `permitAll()`에 명시적으로 추가
   - `.requestMatchers("/api/v1/onboarding/**").permitAll()` 추가
2. **validateOnboardingAccess 메서드**: 이미 세션이 없어도 접근 가능하도록 구현됨 (수정 불필요)

### 6.2 테스트 재실행
- SecurityConfig 수정 후 온보딩 테스트 재실행
- 전체 플로우 테스트 진행:
  1. 온보딩 요청 생성
  2. 온보딩 승인
  3. 테넌트 생성 확인
  4. 관리자 계정 확인
  5. 로그인 테스트

### 6.3 문서화
- 온보딩 API 접근 권한 정책 명확화
- 테스트 가이드 문서 업데이트

---

## 7. 결론

### 7.1 테스트 결과 요약
- ✅ 서버 실행 중
- ✅ 마이그레이션 파일 정상 (branch_code 사용 없음)
- ✅ 프로시저 정의 확인 완료
- ❌ 온보딩 요청 생성 실패 (인증 문제)

### 7.2 권장 사항
1. **우선순위 높음**: SecurityConfig 수정하여 온보딩 API 접근 허용
2. **우선순위 중간**: validateOnboardingAccess 메서드 로직 검토
3. **우선순위 낮음**: 테스트 코드 컴파일 오류 수정 (서버 실행에는 영향 없음)

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-06 13:24:34 (KST)

---

## 8. 수정 사항

### 8.1 SecurityConfig.java 수정
- **파일**: `src/main/java/com/coresolution/consultation/config/SecurityConfig.java`
- **수정 내용**: 온보딩 API를 명시적으로 `permitAll()`에 추가
- **변경 사항**:
  ```java
  // 추가됨
  .requestMatchers("/api/v1/onboarding/**").permitAll()
  ```
- **목적**: 온보딩 요청 생성 시 401 오류 방지

### 8.2 test-onboarding-now.sh 수정
- **파일**: `scripts/development/testing/test-onboarding-now.sh`
- **수정 내용**: REQUEST_ID 추출 로직을 UUID 형식으로 변경
- **변경 사항**:
  ```bash
  # 변경 전
  REQUEST_ID=$(echo "$REQUEST_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  
  # 변경 후
  REQUEST_ID=$(echo "$REQUEST_RESPONSE" | grep -oE '"id":"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"' | head -1 | cut -d'"' -f4)
  ```

---

## 9. 다음 테스트 계획

### 9.1 서버 재시작 후 테스트
1. 서버 재시작 (SecurityConfig 변경사항 적용)
2. 온보딩 테스트 재실행
3. 전체 플로우 확인

### 9.2 예상 결과
- ✅ 온보딩 요청 생성 성공 (401 오류 해결)
- ✅ 온보딩 승인 성공
- ✅ 테넌트 생성 확인
- ✅ 관리자 계정 생성 확인

