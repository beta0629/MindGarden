# 표준화된 프로시저 테스트 계획

**작성일**: 2025-12-05  
**버전**: 1.0.0  
**상태**: 진행 중

---

## 📋 개요

표준화된 프로시저의 정확성과 안정성을 검증하기 위한 테스트 계획입니다.

---

## 🎯 테스트 목표

1. **표준화 준수 검증**: 모든 프로시저가 표준화 원칙을 준수하는지 확인
2. **테넌트 격리 검증**: 테넌트 간 데이터 격리가 올바르게 작동하는지 확인
3. **파라미터 검증**: 표준화된 파라미터 구조가 올바르게 적용되었는지 확인
4. **에러 처리 검증**: 표준화된 에러 핸들러가 올바르게 작동하는지 확인

---

## 📊 테스트 범위

### 1. 핵심 프로시저 테스트 (Phase 1)

#### UpdateMappingInfo
- ✅ `p_tenant_id` 파라미터 전달 확인
- ✅ `tenant_id` 조건 적용 확인
- ✅ `is_deleted = FALSE` 조건 적용 확인
- ✅ 표준화된 OUT 파라미터 (`p_success`, `p_message`) 확인

#### UpdateMappingStatistics
- ✅ `p_tenant_id` 파라미터 전달 확인
- ✅ `branch_code` 제거 확인
- ✅ Soft Delete 조건 적용 확인

#### CheckMappingUpdatePermission
- ✅ `p_tenant_id` 파라미터 전달 확인
- ✅ 입력값 검증 확인
- ✅ 에러 핸들러 확인

#### AddSessionsToMapping
- ✅ `p_tenant_id`, `p_created_by` 파라미터 전달 확인
- ✅ 표준화된 OUT 파라미터 확인

### 2. 재무/회계 프로시저 테스트 (Phase 2)

#### ProcessDiscountAccounting
- ✅ `p_tenant_id` 파라미터 전달 확인
- ✅ `branch_code` 제거 확인
- ✅ 트랜잭션 처리 확인

#### ProcessRefundWithSessionAdjustment
- ✅ `p_tenant_id`, `p_processed_by` 파라미터 전달 확인
- ✅ 환불 처리 로직 확인

#### ProcessIntegratedSalaryCalculation
- ✅ `p_tenant_id` 파라미터 전달 확인
- ✅ 급여 계산 로직 확인

#### ValidateIntegratedAmount
- ✅ `p_tenant_id` 파라미터 전달 확인
- ✅ 금액 검증 로직 확인

### 3. 통계/리포트 프로시저 테스트 (Phase 3)

#### GetConsolidatedFinancialData
- ✅ `p_tenant_id` 파라미터 전달 확인 (첫 번째 파라미터)
- ✅ `branchCodes` 제거 확인
- ✅ JSON 반환 형식 확인

#### GenerateFinancialReport
- ✅ `p_tenant_id` 파라미터 전달 확인
- ✅ 보고서 생성 로직 확인

#### GetRefundableSessions
- ✅ `p_tenant_id` 파라미터 전달 확인
- ✅ 환불 가능 회기 계산 확인

#### GetRefundStatistics
- ✅ `p_tenant_id` 파라미터 전달 확인 (첫 번째 파라미터)
- ✅ 통계 조회 로직 확인

### 4. 기타 프로시저 테스트 (Phase 4)

#### UseSessionForMapping
- ✅ `p_tenant_id`, `p_used_by` 파라미터 전달 확인
- ✅ 회기 사용 처리 확인

#### CheckTimeConflict
- ✅ `p_tenant_id` 파라미터 전달 확인
- ✅ 시간 충돌 검사 확인

#### ProcessScheduleAutoCompletion
- ✅ `p_tenant_id`, `p_processed_by` 파라미터 전달 확인
- ✅ 자동 완료 처리 확인

---

## 🧪 테스트 방법

### 1. 단위 테스트

**목적**: 개별 프로시저의 기능 검증

**방법**:
- JUnit 5를 사용한 통합 테스트
- `@SpringBootTest`를 사용한 실제 DB 연결
- `@Transactional`을 사용한 테스트 데이터 격리

**예시**:
```java
@Test
@DisplayName("UpdateMappingInfo 프로시저 - tenant_id 파라미터 검증")
void testUpdateMappingInfoWithTenantId() {
    // Given
    Long mappingId = 1L;
    String newPackageName = "테스트 패키지";
    Double newPackagePrice = 100000.0;
    Integer newTotalSessions = 10;
    String updatedBy = "test-user";

    // When
    Map<String, Object> result = storedProcedureService.updateMappingInfo(
        mappingId, newPackageName, newPackagePrice, newTotalSessions, updatedBy
    );

    // Then
    assertThat(result).isNotNull();
    assertThat(result.get("success")).isEqualTo(true);
    assertThat(result.get("message")).isNotNull();
}
```

### 2. 통합 테스트

**목적**: 여러 프로시저 간 상호작용 검증

**방법**:
- 실제 비즈니스 시나리오 시뮬레이션
- 여러 프로시저를 순차적으로 호출
- 트랜잭션 일관성 확인

### 3. 테넌트 격리 테스트

**목적**: 테넌트 간 데이터 격리 검증

**방법**:
- 여러 테넌트 컨텍스트로 동일한 프로시저 호출
- 각 테넌트의 데이터가 격리되어 있는지 확인
- 다른 테넌트의 데이터에 접근할 수 없는지 확인

**예시**:
```java
@Test
@DisplayName("테넌트 격리 검증")
void testTenantIsolation() {
    // Given - 테넌트 1
    TenantContextHolder.setTenantId("tenant-1");
    String result1 = plSqlStatisticsService.updateDailyStatistics(null, LocalDate.now());
    
    // Given - 테넌트 2
    TenantContextHolder.setTenantId("tenant-2");
    String result2 = plSqlStatisticsService.updateDailyStatistics(null, LocalDate.now());
    
    // Then - 각 테넌트의 결과가 독립적인지 확인
    assertThat(result1).contains("tenant-1");
    assertThat(result2).contains("tenant-2");
}
```

### 4. 에러 처리 테스트

**목적**: 표준화된 에러 핸들러 검증

**방법**:
- 잘못된 파라미터로 프로시저 호출
- 존재하지 않는 데이터로 프로시저 호출
- 표준화된 에러 메시지 확인

---

## 📝 테스트 체크리스트

### 필수 검증 항목

- [ ] 모든 프로시저에 `p_tenant_id` 파라미터가 전달되는지 확인
- [ ] `branch_code` 파라미터가 완전히 제거되었는지 확인
- [ ] 모든 WHERE 절에 `tenant_id` 조건이 적용되었는지 확인
- [ ] 모든 WHERE 절에 `is_deleted = FALSE` 조건이 적용되었는지 확인
- [ ] 표준화된 OUT 파라미터 (`p_success`, `p_message`)가 사용되는지 확인
- [ ] 표준화된 에러 핸들러가 작동하는지 확인
- [ ] 테넌트 격리가 올바르게 작동하는지 확인

### 선택 검증 항목

- [ ] 프로시저 성능 측정
- [ ] 동시성 테스트
- [ ] 트랜잭션 롤백 테스트
- [ ] 대용량 데이터 테스트

---

## 🚀 테스트 실행 방법

### 1. 단위 테스트 실행

```bash
# 전체 테스트 실행
./gradlew test

# 특정 테스트 클래스 실행
./gradlew test --tests StoredProcedureStandardizationIntegrationTest

# 특정 테스트 메서드 실행
./gradlew test --tests StoredProcedureStandardizationIntegrationTest.testCheckTimeConflictWithTenantId
```

### 2. 통합 테스트 실행

```bash
# 통합 테스트만 실행
./gradlew integrationTest
```

### 3. 테스트 커버리지 확인

```bash
# 테스트 커버리지 생성
./gradlew test jacocoTestReport

# 커버리지 리포트 확인
open build/reports/jacoco/test/html/index.html
```

---

## 📊 테스트 결과

### 성공 기준

- ✅ 모든 필수 검증 항목 통과
- ✅ 테스트 커버리지 80% 이상
- ✅ 테넌트 격리 100% 검증
- ✅ 에러 처리 100% 검증

### 실패 시 조치

1. **컴파일 오류**: Java 코드 수정 필요
2. **런타임 오류**: 프로시저 파라미터 또는 로직 수정 필요
3. **테넌트 격리 실패**: 프로시저 WHERE 절 수정 필요
4. **에러 처리 실패**: 에러 핸들러 수정 필요

---

## 📅 테스트 일정

- **Week 1**: 핵심 프로시저 테스트 (Phase 1)
- **Week 2**: 재무/회계 프로시저 테스트 (Phase 2)
- **Week 3**: 통계/리포트 프로시저 테스트 (Phase 3)
- **Week 4**: 기타 프로시저 테스트 (Phase 4)

---

## 🔗 참조 문서

- [프로시저 표준화 작업 보고서](./PROCEDURE_STANDARDIZATION_REPORT.md)
- [작업 로그](./WORK_LOG.md)
- [프로시저 표준화 실행 체크리스트](./PROCEDURE_STANDARDIZATION_CHECKLIST.md)
- [테스트 표준](../../standards/TESTING_STANDARD.md)
- [Stored Procedure 표준](../../standards/STORED_PROCEDURE_STANDARD.md)

---

**최종 업데이트**: 2025-12-05

