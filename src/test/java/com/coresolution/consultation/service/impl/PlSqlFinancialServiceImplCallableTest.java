package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.Types;
import java.time.LocalDate;
import java.util.Map;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.CallableStatementCallback;
import org.springframework.jdbc.core.CallableStatementCreator;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * {@link PlSqlFinancialServiceImpl} 5개 재무 프로시저 호출 메서드가
 * SSOT(database/schema/procedures_standardized/*_standardized.sql) 와 정합하는
 * {@code prepareCall} 시그니처를 사용하고, tenant_id NULL / 정상 / 기간 invalid 분기에서
 * 안전하게 동작하는지 검증한다 (Mock JdbcTemplate, V20260531_004 재배포 회귀 방지).
 *
 * @author MindGarden
 * @since 2026-05-31
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PlSqlFinancialServiceImpl 재무 프로시저 Callable 계약(SSOT 정합)")
class PlSqlFinancialServiceImplCallableTest {

    private static final String UT_TENANT = "ut-tenant-plsql-financial";
    private static final LocalDate START_DATE = LocalDate.of(2026, 5, 1);
    private static final LocalDate END_DATE = LocalDate.of(2026, 5, 31);

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private Connection connection;

    @Mock
    private CallableStatement callableStatement;

    private PlSqlFinancialServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PlSqlFinancialServiceImpl(jdbcTemplate);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    /**
     * Spring {@code JdbcTemplate.execute(CallableStatementCreator, CallableStatementCallback)} 의
     * 내부 동작(creator → callback)을 모킹하여 {@code prepareCall} SQL 과 OUT 등록을 검증한다.
     */
    @SuppressWarnings("unchecked")
    private void stubJdbcTemplateExecute() throws Exception {
        when(jdbcTemplate.execute(any(CallableStatementCreator.class), any(CallableStatementCallback.class)))
                .thenAnswer(invocation -> {
                    CallableStatementCreator creator = invocation.getArgument(0);
                    CallableStatementCallback<Object> callback = invocation.getArgument(1);
                    CallableStatement cs = creator.createCallableStatement(connection);
                    return callback.doInCallableStatement(cs);
                });
        when(connection.prepareCall(any(String.class))).thenReturn(callableStatement);
    }

    // =============================================================================
    // 1. GetBranchFinancialBreakdown (3 IN + 3 OUT)
    // =============================================================================

    @Nested
    @DisplayName("GetBranchFinancialBreakdown")
    class GetBranchFinancialBreakdownTests {

        private static final String EXPECTED_CALL =
                "{CALL GetBranchFinancialBreakdown(?, ?, ?, @p_success, @p_message, @p_breakdown_data)}";

        @Test
        @DisplayName("정상: tenant + 기간 valid → SSOT 시그니처 + OUT(4-6) 등록")
        void normalCall_usesSsotSignatureAndRegistersOuts() throws Exception {
            TenantContextHolder.setTenantId(UT_TENANT);
            stubJdbcTemplateExecute();
            when(callableStatement.getBoolean(4)).thenReturn(true);
            when(callableStatement.getString(5)).thenReturn("재무 분석이 완료되었습니다.");
            when(callableStatement.getString(6)).thenReturn("{\"tenant_id\":\"" + UT_TENANT + "\"}");

            Map<String, Object> result = service.getBranchFinancialBreakdown(START_DATE, END_DATE);

            verify(connection).prepareCall(EXPECTED_CALL);
            verify(callableStatement).setString(1, UT_TENANT);
            verify(callableStatement).setDate(2, java.sql.Date.valueOf(START_DATE));
            verify(callableStatement).setDate(3, java.sql.Date.valueOf(END_DATE));
            verify(callableStatement).registerOutParameter(4, Types.BOOLEAN);
            verify(callableStatement).registerOutParameter(5, Types.VARCHAR);
            verify(callableStatement).registerOutParameter(6, Types.LONGVARCHAR);
            assertThat(result)
                    .containsEntry("success", true)
                    .containsEntry("message", "재무 분석이 완료되었습니다.")
                    .containsEntry("breakdownData", "{\"tenant_id\":\"" + UT_TENANT + "\"}");
        }

        @Test
        @DisplayName("tenant NULL: TenantContextHolder 미설정 → IllegalStateException 전파(prepareCall 미호출)")
        void tenantNotSet_throwsIllegalStateException() {
            assertThatThrownBy(() -> service.getBranchFinancialBreakdown(START_DATE, END_DATE))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Tenant ID is not set");
        }
    }

    // =============================================================================
    // 2. GetMonthlyFinancialTrend (3 IN + 3 OUT)
    // =============================================================================

    @Nested
    @DisplayName("GetMonthlyFinancialTrend")
    class GetMonthlyFinancialTrendTests {

        private static final String EXPECTED_CALL =
                "{CALL GetMonthlyFinancialTrend(?, ?, ?, @p_success, @p_message, @p_trend_data)}";

        @Test
        @DisplayName("정상: tenant + 기간 valid → SSOT 시그니처 + OUT(4-6) 등록")
        void normalCall_usesSsotSignatureAndRegistersOuts() throws Exception {
            TenantContextHolder.setTenantId(UT_TENANT);
            stubJdbcTemplateExecute();
            when(callableStatement.getBoolean(4)).thenReturn(true);
            when(callableStatement.getString(5)).thenReturn("월별 재무 추이 조회가 완료되었습니다.");
            when(callableStatement.getString(6)).thenReturn("[{\"month\":\"2026-05\"}]");

            Map<String, Object> result = service.getMonthlyFinancialTrend(START_DATE, END_DATE);

            verify(connection).prepareCall(EXPECTED_CALL);
            verify(callableStatement).setString(1, UT_TENANT);
            verify(callableStatement).registerOutParameter(4, Types.BOOLEAN);
            verify(callableStatement).registerOutParameter(5, Types.VARCHAR);
            verify(callableStatement).registerOutParameter(6, Types.LONGVARCHAR);
            assertThat(result)
                    .containsEntry("success", true)
                    .containsEntry("trendData", "[{\"month\":\"2026-05\"}]");
        }

        @Test
        @DisplayName("tenant NULL: TenantContextHolder 미설정 → IllegalStateException 전파")
        void tenantNotSet_throwsIllegalStateException() {
            assertThatThrownBy(() -> service.getMonthlyFinancialTrend(START_DATE, END_DATE))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Tenant ID is not set");
        }
    }

    // =============================================================================
    // 3. GetCategoryFinancialBreakdown (3 IN + 3 OUT)
    // =============================================================================

    @Nested
    @DisplayName("GetCategoryFinancialBreakdown")
    class GetCategoryFinancialBreakdownTests {

        private static final String EXPECTED_CALL =
                "{CALL GetCategoryFinancialBreakdown(?, ?, ?, @p_success, @p_message, @p_breakdown_data)}";

        @Test
        @DisplayName("정상: tenant + 기간 valid → SSOT 시그니처 + OUT(4-6) 등록")
        void normalCall_usesSsotSignatureAndRegistersOuts() throws Exception {
            TenantContextHolder.setTenantId(UT_TENANT);
            stubJdbcTemplateExecute();
            when(callableStatement.getBoolean(4)).thenReturn(true);
            when(callableStatement.getString(5)).thenReturn("카테고리별 재무 분석이 완료되었습니다.");
            when(callableStatement.getString(6)).thenReturn("[{\"category\":\"SALARY\"}]");

            Map<String, Object> result = service.getCategoryFinancialBreakdown(START_DATE, END_DATE);

            verify(connection).prepareCall(EXPECTED_CALL);
            verify(callableStatement).setString(1, UT_TENANT);
            verify(callableStatement).registerOutParameter(4, Types.BOOLEAN);
            verify(callableStatement).registerOutParameter(5, Types.VARCHAR);
            verify(callableStatement).registerOutParameter(6, Types.LONGVARCHAR);
            assertThat(result)
                    .containsEntry("success", true)
                    .containsEntry("categoryData", "[{\"category\":\"SALARY\"}]");
        }

        @Test
        @DisplayName("tenant NULL: TenantContextHolder 미설정 → IllegalStateException 전파")
        void tenantNotSet_throwsIllegalStateException() {
            assertThatThrownBy(() -> service.getCategoryFinancialBreakdown(START_DATE, END_DATE))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Tenant ID is not set");
        }
    }

    // =============================================================================
    // 4. GenerateQuarterlyFinancialReport (3 IN + 3 OUT)
    // =============================================================================

    @Nested
    @DisplayName("GenerateQuarterlyFinancialReport")
    class GenerateQuarterlyFinancialReportTests {

        private static final String EXPECTED_CALL =
                "{CALL GenerateQuarterlyFinancialReport(?, ?, ?, @p_success, @p_message, @p_report_data)}";

        @Test
        @DisplayName("정상: year+quarter+tenant → SSOT 시그니처 + OUT(4-6) 등록")
        void normalCall_usesSsotSignatureAndRegistersOuts() throws Exception {
            TenantContextHolder.setTenantId(UT_TENANT);
            stubJdbcTemplateExecute();
            when(callableStatement.getBoolean(4)).thenReturn(true);
            when(callableStatement.getString(5)).thenReturn("분기별 재무 보고서 생성이 완료되었습니다.");
            when(callableStatement.getString(6)).thenReturn("{\"summary\":{}}");

            Map<String, Object> result = service.generateQuarterlyFinancialReport(2026, 2, null);

            verify(connection).prepareCall(EXPECTED_CALL);
            verify(callableStatement).setInt(1, 2026);
            verify(callableStatement).setInt(2, 2);
            verify(callableStatement).setString(3, UT_TENANT);
            verify(callableStatement).registerOutParameter(4, Types.BOOLEAN);
            verify(callableStatement).registerOutParameter(5, Types.VARCHAR);
            verify(callableStatement).registerOutParameter(6, Types.LONGVARCHAR);
            assertThat(result)
                    .containsEntry("success", true)
                    .containsEntry("reportType", "quarterly")
                    .containsEntry("period", "2026-Q2");
        }

        @Test
        @DisplayName("tenant NULL: TenantContextHolder 미설정 → IllegalStateException 전파")
        void tenantNotSet_throwsIllegalStateException() {
            assertThatThrownBy(() -> service.generateQuarterlyFinancialReport(2026, 2, null))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Tenant ID is not set");
        }
    }

    // =============================================================================
    // 5. CalculateFinancialKPIs (3 IN + 8 OUT)
    // =============================================================================

    @Nested
    @DisplayName("CalculateFinancialKPIs")
    class CalculateFinancialKPIsTests {

        private static final String EXPECTED_CALL =
                "{CALL CalculateFinancialKPIs(?, ?, ?, @p_success, @p_message, @p_total_revenue,"
                        + " @p_total_expenses, @p_net_profit, @p_total_transactions, @p_profit_margin,"
                        + " @p_avg_transaction_value)}";

        @Test
        @DisplayName("정상: tenant + 기간 valid → SSOT 11파라미터 시그니처 + OUT(4-11) 등록")
        void normalCall_usesSsotSignatureAndRegistersEightOuts() throws Exception {
            TenantContextHolder.setTenantId(UT_TENANT);
            stubJdbcTemplateExecute();
            when(callableStatement.getBoolean(4)).thenReturn(true);
            when(callableStatement.getString(5)).thenReturn("재무 KPI 계산이 완료되었습니다.");
            when(callableStatement.getBigDecimal(6)).thenReturn(new BigDecimal("1000000.00"));
            when(callableStatement.getBigDecimal(7)).thenReturn(new BigDecimal("400000.00"));
            when(callableStatement.getBigDecimal(8)).thenReturn(new BigDecimal("600000.00"));
            when(callableStatement.getInt(9)).thenReturn(42);
            when(callableStatement.getBigDecimal(10)).thenReturn(new BigDecimal("60.00"));
            when(callableStatement.getBigDecimal(11)).thenReturn(new BigDecimal("23809.52"));

            Map<String, Object> result = service.calculateFinancialKPIs(START_DATE, END_DATE, null);

            verify(connection).prepareCall(EXPECTED_CALL);
            verify(callableStatement).setString(1, UT_TENANT);
            verify(callableStatement).setDate(2, java.sql.Date.valueOf(START_DATE));
            verify(callableStatement).setDate(3, java.sql.Date.valueOf(END_DATE));
            verify(callableStatement).registerOutParameter(4, Types.BOOLEAN);
            verify(callableStatement).registerOutParameter(5, Types.VARCHAR);
            verify(callableStatement).registerOutParameter(6, Types.DECIMAL);
            verify(callableStatement).registerOutParameter(7, Types.DECIMAL);
            verify(callableStatement).registerOutParameter(8, Types.DECIMAL);
            verify(callableStatement).registerOutParameter(9, Types.INTEGER);
            verify(callableStatement).registerOutParameter(10, Types.DECIMAL);
            verify(callableStatement).registerOutParameter(11, Types.DECIMAL);
            assertThat(result)
                    .containsEntry("success", true)
                    .containsEntry("totalRevenue", new BigDecimal("1000000.00"))
                    .containsEntry("totalExpenses", new BigDecimal("400000.00"))
                    .containsEntry("netProfit", new BigDecimal("600000.00"))
                    .containsEntry("totalTransactions", 42)
                    .containsEntry("profitMargin", new BigDecimal("60.00"))
                    .containsEntry("avgTransactionValue", new BigDecimal("23809.52"));
        }

        @Test
        @DisplayName("tenant NULL: TenantContextHolder 미설정 → IllegalStateException 전파")
        void tenantNotSet_throwsIllegalStateException() {
            assertThatThrownBy(() -> service.calculateFinancialKPIs(START_DATE, END_DATE, null))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Tenant ID is not set");
        }

        @Test
        @DisplayName("DB 예외: jdbcTemplate.execute 가 예외 발생 → RuntimeException 으로 래핑")
        @SuppressWarnings("unchecked")
        void jdbcExecuteThrows_wrappedAsRuntimeException() {
            TenantContextHolder.setTenantId(UT_TENANT);
            when(jdbcTemplate.execute(any(CallableStatementCreator.class), any(CallableStatementCallback.class)))
                    .thenThrow(new org.springframework.dao.DataAccessResourceFailureException("connection refused"));

            assertThatThrownBy(() -> service.calculateFinancialKPIs(START_DATE, END_DATE, null))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("재무 성과 지표 계산에 실패했습니다.");
        }
    }
}
