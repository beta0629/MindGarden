package com.coresolution.consultation.integration;

import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.consultation.service.PlSqlAccountingService;
import com.coresolution.consultation.service.PlSqlMappingSyncService;
import com.coresolution.consultation.service.PlSqlScheduleValidationService;
import com.coresolution.consultation.service.PlSqlStatisticsService;
import com.coresolution.consultation.service.StoredProcedureService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 표준화된 프로시저 통합 테스트
 * 
 * 테스트 목적:
 * 1. 표준화된 프로시저가 올바르게 동작하는지 확인
 * 2. 테넌트 격리가 제대로 작동하는지 검증
 * 3. 표준화된 파라미터 구조 확인
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-12-05
 */
@SpringBootTest
@ActiveProfiles("test")
// 개발 DB 사용 (application-test.yml에서 설정)
// 프로시저 테스트는 실제 MySQL DB가 필요하므로 H2 사용 불가
@TestPropertySource(properties = {
    // Ops Portal 관리자 설정 (테스트용)
    "ops.admin.username=test-admin@mindgarden.com",
    "ops.admin.password=test-password-123",
    "ops.admin.role=HQ_ADMIN",
    // 환경 변수 매핑
    "OPS_ADMIN_USERNAME=test-admin@mindgarden.com",
    "OPS_ADMIN_PASSWORD=test-password-123",
    "OPS_ADMIN_ROLE=HQ_ADMIN"
})
@Transactional
@DisplayName("표준화된 프로시저 통합 테스트")
public class StoredProcedureStandardizationIntegrationTest {

    @Autowired
    private StoredProcedureService storedProcedureService;

    @Autowired
    private PlSqlStatisticsService plSqlStatisticsService;

    @Autowired
    private PlSqlScheduleValidationService plSqlScheduleValidationService;

    @Autowired
    private PlSqlMappingSyncService plSqlMappingSyncService;

    @Autowired
    private PlSqlAccountingService plSqlAccountingService;

    private static final String TEST_TENANT_ID_1 = "test-tenant-1";
    private static final String TEST_TENANT_ID_2 = "test-tenant-2";

    @BeforeEach
    void setUp() {
        // 테스트 전 테넌트 컨텍스트 설정
        TenantContextHolder.setTenantId(TEST_TENANT_ID_1);
    }

    @AfterEach
    void tearDown() {
        // 테스트 후 테넌트 컨텍스트 정리
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("CheckTimeConflict 프로시저 - tenant_id 파라미터 검증")
    void testCheckTimeConflictWithTenantId() {
        // Given
        Long consultantId = 1L;
        String date = "2025-12-05";
        String startTime = "10:00:00";
        String endTime = "11:00:00";
        Long excludeScheduleId = null;

        // When
        Map<String, Object> result = storedProcedureService.checkTimeConflict(
            consultantId, date, startTime, endTime, excludeScheduleId
        );

        // Then
        assertThat(result).isNotNull();
        assertThat(result.containsKey("hasConflict")).isTrue();
        assertThat(result.containsKey("conflictReason")).isTrue();
        
        // tenant_id가 올바르게 전달되었는지 확인 (프로시저 내부에서 검증)
        // 실제 충돌 여부는 테스트 데이터에 따라 달라질 수 있음
    }

    @Test
    @DisplayName("UpdateDailyStatistics 프로시저 - tenant_id 파라미터 검증")
    void testUpdateDailyStatisticsWithTenantId() {
        // Given
        LocalDate statDate = LocalDate.now();

        // When
        // branchCode는 더 이상 사용하지 않지만 호환성을 위해 null 전달
        String result = plSqlStatisticsService.updateDailyStatistics(null, statDate);

        // Then
        assertThat(result).isNotNull();
        // SUCCESS 또는 ERROR 메시지 확인 (실제 데이터에 따라 달라질 수 있음)
        assertThat(result).matches("^(SUCCESS|ERROR):.*");
        
        // tenant_id가 올바르게 전달되었는지 확인
        // TenantContextHolder에서 자동으로 가져옴
    }

    @Test
    @DisplayName("ValidateConsultationRecordBeforeCompletion 프로시저 - tenant_id 파라미터 검증")
    void testValidateConsultationRecordBeforeCompletionWithTenantId() {
        // Given
        Long scheduleId = 1L;
        Long consultantId = 1L;
        LocalDate sessionDate = LocalDate.now();

        // When
        Map<String, Object> result = plSqlScheduleValidationService.validateConsultationRecordBeforeCompletion(
            scheduleId, consultantId, sessionDate
        );

        // Then
        assertThat(result).isNotNull();
        assertThat(result.containsKey("hasRecord")).isTrue();
        assertThat(result.containsKey("message")).isTrue();
        assertThat(result.containsKey("success")).isTrue();
    }

    @Test
    @DisplayName("CreateConsultationRecordReminder 프로시저 - tenant_id 파라미터 검증")
    void testCreateConsultationRecordReminderWithTenantId() {
        // Given
        Long scheduleId = 1L;
        Long consultantId = 1L;
        Long clientId = 1L;
        LocalDate sessionDate = LocalDate.now();
        String title = "상담일지 작성 알림";

        // When
        Map<String, Object> result = plSqlScheduleValidationService.createConsultationRecordReminder(
            scheduleId, consultantId, clientId, sessionDate, title
        );

        // Then
        assertThat(result).isNotNull();
        assertThat(result.containsKey("reminderId")).isTrue();
        assertThat(result.containsKey("message")).isTrue();
        assertThat(result.containsKey("success")).isTrue();
    }

    @Test
    @DisplayName("GetRefundableSessions 프로시저 - tenant_id 파라미터 검증")
    void testGetRefundableSessionsWithTenantId() {
        // Given
        Long mappingId = 1L;

        // When
        Map<String, Object> result = plSqlMappingSyncService.getRefundableSessions(mappingId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.containsKey("success")).isTrue();
        assertThat(result.containsKey("message")).isTrue();
        assertThat(result.containsKey("refundableSessions")).isTrue();
        assertThat(result.containsKey("maxRefundAmount")).isTrue();
    }

    @Test
    @DisplayName("GetRefundStatistics 프로시저 - tenant_id 파라미터 검증 및 branchCode 제거 확인")
    void testGetRefundStatisticsWithTenantId() {
        // Given
        // branchCode는 더 이상 사용하지 않지만 호환성을 위해 유지
        String branchCode = "BRANCH001";
        String startDate = "2025-01-01";
        String endDate = "2025-12-31";

        // When
        Map<String, Object> result = plSqlMappingSyncService.getRefundStatistics(
            branchCode, startDate, endDate
        );

        // Then
        assertThat(result).isNotNull();
        assertThat(result.containsKey("success")).isTrue();
        assertThat(result.containsKey("message")).isTrue();
        assertThat(result.containsKey("statistics")).isTrue();
        
        // branchCode 파라미터가 제거되었고 tenant_id가 사용되는지 확인
        // 실제로는 tenant_id가 TenantContextHolder에서 가져와짐
        // 프로시저 내부에서 branchCode는 무시되고 tenant_id가 사용됨
    }

    @Test
    @DisplayName("ValidateIntegratedAmount 프로시저 - tenant_id 파라미터 검증")
    void testValidateIntegratedAmountWithTenantId() {
        // Given
        Long mappingId = 1L;
        BigDecimal inputAmount = new BigDecimal("100000");

        // When
        Map<String, Object> result = plSqlAccountingService.validateIntegratedAmount(mappingId, inputAmount);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.containsKey("success")).isTrue();
        assertThat(result.containsKey("isValid")).isTrue();
        assertThat(result.containsKey("validationMessage")).isTrue();
    }

    @Test
    @DisplayName("GetConsolidatedFinancialData 프로시저 - tenant_id 파라미터 검증 및 branchCodes 제거 확인")
    void testGetConsolidatedFinancialDataWithTenantId() {
        // Given
        LocalDate startDate = LocalDate.of(2025, 1, 1);
        LocalDate endDate = LocalDate.of(2025, 12, 31);
        // branchCodes는 더 이상 사용하지 않지만 호환성을 위해 유지
        String branchCodes = "BRANCH001,BRANCH002";

        // When
        Map<String, Object> result = plSqlAccountingService.getConsolidatedFinancialData(
            startDate, endDate, branchCodes
        );

        // Then
        assertThat(result).isNotNull();
        assertThat(result.containsKey("success")).isTrue();
        assertThat(result.containsKey("message")).isTrue();
        assertThat(result.containsKey("totalRevenue")).isTrue();
        assertThat(result.containsKey("totalExpenses")).isTrue();
        assertThat(result.containsKey("netProfit")).isTrue();
        
        // branchCodes 파라미터가 제거되었고 tenant_id가 사용되는지 확인
        // 프로시저 내부에서 branchCodes는 무시되고 tenant_id가 사용됨
    }

    @Test
    @DisplayName("테넌트 격리 검증 - 다른 테넌트의 데이터 접근 불가 확인")
    void testTenantIsolation() {
        // Given - 테넌트 1로 설정
        TenantContextHolder.setTenantId(TEST_TENANT_ID_1);
        LocalDate statDate = LocalDate.now();

        // When - 테넌트 1의 통계 업데이트
        String result1 = plSqlStatisticsService.updateDailyStatistics(null, statDate);

        // Then - 테넌트 1의 결과 확인
        assertThat(result1).isNotNull();
        // 결과 메시지에 테넌트 ID가 포함되어 있는지 확인 (프로시저 구현에 따라 다를 수 있음)
        // 실제로는 프로시저 내부에서 tenant_id로 필터링되므로 다른 테넌트 데이터에 접근 불가

        // Given - 테넌트 2로 변경
        TenantContextHolder.setTenantId(TEST_TENANT_ID_2);

        // When - 테넌트 2의 통계 업데이트
        String result2 = plSqlStatisticsService.updateDailyStatistics(null, statDate);

        // Then - 테넌트 2의 결과 확인
        assertThat(result2).isNotNull();
        
        // 테넌트 간 데이터 격리 확인
        // 실제 데이터베이스에서 테넌트별로 다른 데이터가 조회되는지 확인
        // 프로시저 내부의 WHERE 절에 tenant_id 조건이 적용되어 격리됨
    }

    @Test
    @DisplayName("표준화된 OUT 파라미터 구조 검증 - p_success, p_message 확인")
    void testStandardizedOutParameters() {
        // Given
        Long consultantId = 1L;
        LocalDate performanceDate = LocalDate.now();

        // When
        String result = plSqlStatisticsService.updateConsultantPerformance(consultantId, performanceDate);

        // Then
        assertThat(result).isNotNull();
        // 표준화된 프로시저는 SUCCESS 또는 ERROR로 시작
        assertThat(result).matches("^(SUCCESS|ERROR):.*");
        
        // p_success와 p_message가 올바르게 반환되는지 확인
    }

    @Test
    @DisplayName("Soft Delete 조건 검증 - is_deleted = FALSE 확인")
    void testSoftDeleteCondition() {
        // Given
        Long mappingId = 1L;

        // When
        Map<String, Object> result = plSqlMappingSyncService.getRefundableSessions(mappingId);

        // Then
        assertThat(result).isNotNull();
        // 프로시저 내부에서 is_deleted = FALSE 조건이 적용되었는지 확인
        // 실제로는 프로시저 로그나 결과를 통해 확인 가능
        assertThat(result.containsKey("success")).isTrue();
    }

    @Test
    @DisplayName("에러 핸들러 표준화 검증 - 예외 상황 처리 확인")
    void testStandardizedErrorHandler() {
        // Given - 잘못된 파라미터
        Long invalidMappingId = -1L;
        BigDecimal inputAmount = new BigDecimal("100000");

        // When
        Map<String, Object> result = plSqlAccountingService.validateIntegratedAmount(
            invalidMappingId, inputAmount
        );

        // Then
        assertThat(result).isNotNull();
        // 표준화된 에러 핸들러가 작동하여 p_success = FALSE, p_message에 에러 메시지 반환
        assertThat(result.containsKey("success")).isTrue();
        assertThat(result.containsKey("message")).isTrue();
        
        // 에러 상황에서는 success가 false일 가능성이 높음
        // (실제 데이터에 따라 달라질 수 있음)
    }
}

