# 표준화 작업 후 테스트 계획

**작성일**: 2025-12-05  
**최종 업데이트**: 2025-12-05  
**상태**: 계획 수립 완료

---

## 📋 개요

표준화 작업 완료 후 시스템 안정성 및 표준 준수 여부를 검증하기 위한 종합 테스트 계획입니다.

### 테스트 목표
1. ✅ 표준화 작업으로 인한 기능 회귀(Regression) 방지
2. ✅ 테넌트 격리 보안 검증
3. ✅ API 경로 표준화 검증
4. ✅ 프로시저 표준화 검증
5. ✅ 레거시 호환성 검증

---

## 🎯 테스트 범위

### 1. 프로시저 표준화 테스트 (최우선)

#### 1.1 테넌트 격리 검증
**목적**: 프로시저가 테넌트 간 데이터 격리를 보장하는지 확인

**테스트 케이스**:
- [ ] 테넌트 A의 데이터를 테넌트 B에서 조회 불가능한지 확인
- [ ] `p_tenant_id` 파라미터 없이 프로시저 호출 시 에러 발생 확인
- [ ] 잘못된 `tenant_id`로 프로시저 호출 시 빈 결과 반환 확인
- [ ] 모든 WHERE 절에 `tenant_id` 조건이 포함되어 있는지 확인

**대상 프로시저** (46개):
- 핵심 프로시저 (4개)
- 재무/회계 프로시저 (5개)
- 통계/리포트 프로시저 (5개)
- 기타 프로시저 (32개)

**테스트 방법**:
```sql
-- 테스트 케이스 예시
-- 1. 정상 케이스: 올바른 tenant_id로 조회
CALL GetConsolidatedFinancialData('tenant-001', @success, @message);
SELECT @success, @message;  -- 예상: success=1

-- 2. 격리 검증: 다른 tenant_id로 조회
CALL GetConsolidatedFinancialData('tenant-002', @success, @message);
SELECT @success, @message;  -- 예상: 빈 결과 또는 에러

-- 3. 잘못된 tenant_id
CALL GetConsolidatedFinancialData('invalid-tenant', @success, @message);
SELECT @success, @message;  -- 예상: success=0, 에러 메시지
```

#### 1.2 브랜치 코드 제거 검증
**목적**: 프로시저에서 `branch_code` 사용이 완전히 제거되었는지 확인

**테스트 케이스**:
- [ ] 프로시저 파라미터에 `branch_code` 없음 확인
- [ ] 프로시저 내부에서 `branch_code` 변수 사용 없음 확인
- [ ] WHERE 절에서 `branch_code` 조건 없음 확인

**테스트 방법**:
```sql
-- 프로시저 정의 확인
SHOW CREATE PROCEDURE GetConsolidatedFinancialData;

-- branch_code 사용 여부 확인
SELECT 
    ROUTINE_NAME,
    ROUTINE_DEFINITION
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_SCHEMA = 'mindgarden'
  AND ROUTINE_DEFINITION LIKE '%branch_code%';
-- 예상 결과: 빈 결과 (branch_code 사용 없음)
```

#### 1.3 Soft Delete 검증
**목적**: 삭제된 데이터가 조회되지 않는지 확인

**테스트 케이스**:
- [ ] `is_deleted = TRUE`인 데이터 조회 불가능 확인
- [ ] 모든 SELECT 쿼리에 `is_deleted = FALSE` 조건 포함 확인

**테스트 방법**:
```sql
-- 1. 데이터 삭제
UPDATE mappings SET is_deleted = TRUE WHERE id = 1 AND tenant_id = 'tenant-001';

-- 2. 프로시저로 조회 시도
CALL GetMappingInfo(1, 'tenant-001', @success, @message);
-- 예상: 빈 결과 또는 에러 (삭제된 데이터 조회 불가)
```

#### 1.4 에러 핸들러 검증
**목적**: 표준 에러 핸들러가 올바르게 작동하는지 확인

**테스트 케이스**:
- [ ] 필수 파라미터 누락 시 에러 메시지 반환 확인
- [ ] 잘못된 데이터 입력 시 에러 메시지 반환 확인
- [ ] OUT 파라미터 `p_success`, `p_message` 올바르게 설정 확인

---

### 2. Service 계층 테스트

#### 2.1 브랜치 코드 제거 검증
**목적**: Service 계층에서 `branchCode` 사용이 제거되었는지 확인

**테스트 케이스**:
- [ ] Service 메서드에서 `branchCode` 파라미터 없음 확인
- [ ] Repository 쿼리에서 `branchCode` 조건 없음 확인
- [ ] `tenantId` 기반으로만 데이터 조회 확인

**대상 서비스** (15개):
- FinancialTransactionServiceImpl
- ConsultantRatingServiceImpl
- UserServiceImpl
- RealTimeStatisticsServiceImpl
- StatisticsTestDataServiceImpl
- ConsultantStatsServiceImpl
- ClientStatsServiceImpl
- SalaryManagementServiceImpl
- SalaryBatchServiceImpl
- DiscountAccountingServiceImpl
- ErpServiceImpl
- ErpDiscountIntegrationServiceImpl
- 등

**테스트 방법**:
```java
@Test
@DisplayName("Service에서 branchCode 없이 tenantId로만 조회")
void testServiceWithoutBranchCode() {
    // Given
    String tenantId = "tenant-001";
    
    // When
    List<FinancialTransaction> transactions = 
        financialTransactionService.getTransactionsByTenant(tenantId);
    
    // Then
    assertThat(transactions).isNotEmpty();
    assertThat(transactions).allMatch(t -> tenantId.equals(t.getTenantId()));
}
```

#### 2.2 테넌트 격리 검증
**목적**: Service 계층에서 테넌트 격리가 올바르게 작동하는지 확인

**테스트 케이스**:
- [ ] 테넌트 A의 데이터를 테넌트 B에서 조회 불가능 확인
- [ ] `TenantContextHolder`를 통한 테넌트 ID 자동 추출 확인
- [ ] Repository 쿼리에 `tenant_id` 조건 포함 확인

---

### 3. API 경로 표준화 테스트

#### 3.1 API 경로 검증
**목적**: 모든 API가 `/api/v1/` 경로를 사용하는지 확인

**테스트 케이스**:
- [ ] 모든 Controller의 `@RequestMapping`이 `/api/v1/`로 시작하는지 확인
- [ ] 프론트엔드 API 호출 경로가 `/api/v1/`로 시작하는지 확인
- [ ] 레거시 경로(`/api/...`) 접근 시 리다이렉트 또는 에러 반환 확인

**테스트 방법**:
```java
@Test
@DisplayName("모든 API 경로가 /api/v1/로 시작하는지 확인")
void testApiPathStandardization() {
    // Given
    List<Controller> controllers = getAllControllers();
    
    // When & Then
    controllers.forEach(controller -> {
        RequestMapping mapping = controller.getClass()
            .getAnnotation(RequestMapping.class);
        if (mapping != null) {
            String[] paths = mapping.value();
            for (String path : paths) {
                assertThat(path).startsWith("/api/v1/");
            }
        }
    });
}
```

#### 3.2 API 호출 테스트
**목적**: 표준화된 API 경로로 실제 호출이 작동하는지 확인

**테스트 케이스**:
- [ ] GET 요청 정상 작동 확인
- [ ] POST 요청 정상 작동 확인
- [ ] PUT 요청 정상 작동 확인
- [ ] DELETE 요청 정상 작동 확인
- [ ] 인증/인가 정상 작동 확인

---

### 4. 역할 시스템 표준화 테스트

#### 4.1 역할 하드코딩 제거 검증
**목적**: 하드코딩된 역할 문자열이 제거되었는지 확인

**테스트 케이스**:
- [ ] `UserRole` enum 사용 확인
- [ ] `UserRole.isAdmin()` 메서드 사용 확인
- [ ] 하드코딩된 역할 문자열(`"ADMIN"`, `"CONSULTANT"` 등) 없음 확인

**테스트 방법**:
```java
@Test
@DisplayName("역할 하드코딩 제거 확인")
void testRoleHardcodingRemoved() {
    // Given
    String code = readJavaFile("UserServiceImpl.java");
    
    // Then
    assertThat(code).doesNotContain("\"ADMIN\"");
    assertThat(code).doesNotContain("\"CONSULTANT\"");
    assertThat(code).doesNotContain("\"CLIENT\"");
    assertThat(code).contains("UserRole.ADMIN");
    assertThat(code).contains("UserRole.isAdmin()");
}
```

#### 4.2 표준 역할 시스템 검증
**목적**: 표준 역할 시스템이 올바르게 작동하는지 확인

**테스트 케이스**:
- [ ] `UserRole.isAdmin()`이 표준 관리자 역할만 반환하는지 확인
- [ ] 레거시 역할이 더 이상 관리자로 인식되지 않는지 확인
- [ ] 권한 체크가 올바르게 작동하는지 확인

---

### 5. 프론트엔드 표준화 테스트

#### 5.1 브랜치 코드 제거 검증
**목적**: 프론트엔드에서 `branchCode` 사용이 제거되었는지 확인

**테스트 케이스**:
- [ ] API 호출에서 `branchCode` 파라미터 없음 확인
- [ ] 컴포넌트에서 `branchCode` prop 없음 확인
- [ ] 브랜치 유틸리티 함수 사용 없음 확인

#### 5.2 API 경로 표준화 검증
**목적**: 프론트엔드 API 호출 경로가 표준화되었는지 확인

**테스트 케이스**:
- [ ] 모든 API 호출이 `/api/v1/`로 시작하는지 확인
- [ ] `api.js` 상수 파일에 표준 경로 사용 확인

---

## 🧪 테스트 실행 계획

### Phase 1: 프로시저 테스트 (1주)

#### Day 1-2: 테넌트 격리 테스트
- [ ] 테스트 데이터 준비 (2개 이상의 테넌트)
- [ ] 핵심 프로시저 테스트 (4개)
- [ ] 재무/회계 프로시저 테스트 (5개)

#### Day 3-4: 통계/리포트 프로시저 테스트
- [ ] 통계/리포트 프로시저 테스트 (5개)
- [ ] 기타 프로시저 테스트 (32개)

#### Day 5: 통합 테스트
- [ ] 프로시저 간 연동 테스트
- [ ] 에러 핸들러 테스트
- [ ] 성능 테스트

---

### Phase 2: Service 계층 테스트 (1주)

#### Day 1-2: 브랜치 코드 제거 검증
- [ ] 15개 핵심 서비스 테스트
- [ ] Repository 쿼리 테스트

#### Day 3-4: 테넌트 격리 검증
- [ ] 테넌트 격리 테스트
- [ ] `TenantContextHolder` 테스트

#### Day 5: 통합 테스트
- [ ] Service 간 연동 테스트
- [ ] 프로시저 호출 테스트

---

### Phase 3: API 테스트 (3일)

#### Day 1: API 경로 검증
- [ ] Controller 경로 검증
- [ ] 프론트엔드 API 호출 검증

#### Day 2: API 기능 테스트
- [ ] CRUD API 테스트
- [ ] 인증/인가 테스트

#### Day 3: 통합 테스트
- [ ] E2E API 테스트
- [ ] 레거시 경로 호환성 테스트

---

### Phase 4: 역할 시스템 테스트 (2일)

#### Day 1: 역할 하드코딩 제거 검증
- [ ] 코드 스캔 테스트
- [ ] 역할 체크 로직 테스트

#### Day 2: 표준 역할 시스템 검증
- [ ] 권한 체크 테스트
- [ ] 역할 매핑 테스트

---

### Phase 5: 프론트엔드 테스트 (2일)

#### Day 1: 브랜치 코드 제거 검증
- [ ] 코드 스캔 테스트
- [ ] 컴포넌트 테스트

#### Day 2: API 경로 표준화 검증
- [ ] API 호출 테스트
- [ ] 통합 테스트

---

## 🔧 테스트 도구 및 환경

### Backend 테스트
- **프레임워크**: JUnit 5, Mockito
- **통합 테스트**: Spring Boot Test
- **DB 테스트**: Testcontainers 또는 H2 (개발 서버 사용 권장)
- **API 테스트**: MockMvc, RestAssured

### Frontend 테스트
- **프레임워크**: Jest, React Testing Library
- **E2E 테스트**: Cypress 또는 Playwright

### 프로시저 테스트
- **도구**: MySQL Workbench, MySQL CLI
- **환경**: 개발 서버 MySQL (절대 로컬 H2 사용 금지)

---

## 📝 테스트 스크립트

### 프로시저 테스트 스크립트

```sql
-- 프로시저 테스트 헬퍼 프로시저
DELIMITER $$

CREATE PROCEDURE TestProcedureStandardization()
BEGIN
    DECLARE test_count INT DEFAULT 0;
    DECLARE pass_count INT DEFAULT 0;
    DECLARE fail_count INT DEFAULT 0;
    
    -- 테스트 1: tenant_id 파라미터 존재 확인
    SELECT COUNT(*) INTO test_count
    FROM INFORMATION_SCHEMA.PARAMETERS
    WHERE ROUTINE_SCHEMA = 'mindgarden'
      AND PARAMETER_NAME = 'p_tenant_id';
    
    IF test_count > 0 THEN
        SET pass_count = pass_count + 1;
        SELECT 'PASS: p_tenant_id 파라미터 존재' AS result;
    ELSE
        SET fail_count = fail_count + 1;
        SELECT 'FAIL: p_tenant_id 파라미터 없음' AS result;
    END IF;
    
    -- 테스트 2: branch_code 파라미터 없음 확인
    SELECT COUNT(*) INTO test_count
    FROM INFORMATION_SCHEMA.PARAMETERS
    WHERE ROUTINE_SCHEMA = 'mindgarden'
      AND PARAMETER_NAME LIKE '%branch_code%';
    
    IF test_count = 0 THEN
        SET pass_count = pass_count + 1;
        SELECT 'PASS: branch_code 파라미터 없음' AS result;
    ELSE
        SET fail_count = fail_count + 1;
        SELECT CONCAT('FAIL: branch_code 파라미터 ', test_count, '개 발견') AS result;
    END IF;
    
    -- 결과 출력
    SELECT 
        pass_count AS '통과',
        fail_count AS '실패',
        (pass_count + fail_count) AS '전체';
END$$

DELIMITER ;
```

---

## 🚨 예상 오류 및 대응 방안

### 1. 프로시저 오류

#### 예상 오류
- `p_tenant_id` 파라미터 누락
- `branch_code` 파라미터 남아있음
- WHERE 절에 `tenant_id` 조건 누락
- Soft Delete 조건 누락

#### 대응 방안
- 프로시저 재표준화
- 테스트 케이스 추가
- 코드 리뷰 강화

---

### 2. Service 계층 오류

#### 예상 오류
- `branchCode` 파라미터 사용
- `TenantContextHolder` 미사용
- Repository 쿼리에 `tenant_id` 조건 누락

#### 대응 방안
- Service 메서드 재수정
- 테스트 케이스 추가
- 코드 리뷰 강화

---

### 3. API 경로 오류

#### 예상 오류
- 레거시 경로(`/api/...`) 사용
- 프론트엔드 API 호출 경로 불일치

#### 대응 방안
- Controller 경로 수정
- 프론트엔드 API 상수 수정
- 리다이렉트 설정

---

### 4. 역할 시스템 오류

#### 예상 오류
- 하드코딩된 역할 문자열 사용
- `UserRole.isAdmin()` 로직 오류
- 권한 체크 실패

#### 대응 방안
- 코드 수정
- 테스트 케이스 추가
- 권한 매트릭스 재검토

---

## 📊 테스트 결과 보고서 템플릿

### 테스트 실행 결과

| 카테고리 | 테스트 수 | 통과 | 실패 | 통과률 |
|---------|---------|------|------|--------|
| 프로시저 테스트 | 46 | - | - | - |
| Service 계층 테스트 | 15 | - | - | - |
| API 테스트 | 70+ | - | - | - |
| 역할 시스템 테스트 | 19 | - | - | - |
| 프론트엔드 테스트 | 250+ | - | - | - |
| **전체** | **400+** | **-** | **-** | **-** |

### 발견된 오류

#### Critical (즉시 수정 필요)
- [ ] 오류 1: ...
- [ ] 오류 2: ...

#### High (우선 수정)
- [ ] 오류 1: ...
- [ ] 오류 2: ...

#### Medium (점진적 수정)
- [ ] 오류 1: ...
- [ ] 오류 2: ...

#### Low (선택적 수정)
- [ ] 오류 1: ...
- [ ] 오류 2: ...

---

## ✅ 체크리스트

### 테스트 준비
- [ ] 테스트 환경 구축 (개발 서버)
- [ ] 테스트 데이터 준비
- [ ] 테스트 스크립트 작성
- [ ] 테스트 계획 승인

### 테스트 실행
- [ ] Phase 1: 프로시저 테스트
- [ ] Phase 2: Service 계층 테스트
- [ ] Phase 3: API 테스트
- [ ] Phase 4: 역할 시스템 테스트
- [ ] Phase 5: 프론트엔드 테스트

### 테스트 완료
- [ ] 테스트 결과 보고서 작성
- [ ] 발견된 오류 수정
- [ ] 재테스트 실행
- [ ] 최종 검증 완료

---

## 📚 참조 문서

- [테스트 표준](../../standards/TESTING_STANDARD.md)
- [프로시저 표준](../../standards/STORED_PROCEDURE_STANDARD.md)
- [API 설계 표준](../../standards/API_DESIGN_STANDARD.md)
- [표준화 작업 진행 상황](./STANDARDIZATION_PROGRESS.md)
- [표준화 재검토 보고서](./STANDARDIZATION_REVIEW_REPORT.md)

---

**최종 업데이트**: 2025-12-05

