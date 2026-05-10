package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.Map;
import javax.sql.DataSource;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * {@link PlSqlSalaryManagementServiceImpl}의 CalculateSalaryPreview / ProcessIntegratedSalaryCalculation
 * 파라미터 개수 분기 및 {@code specialSupportAmount} OUT 매핑 단위 검증(Mock JDBC).
 *
 * @author MindGarden
 * @since 2026-05-10
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PlSqlSalaryManagementServiceImpl 특별지원금 분기(Mock)")
class PlSqlSalaryManagementServiceImplSpecialSupportBranchTest {

    private static final String UT_TENANT = "ut-tenant-plsql-salary-special-support";

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private DataSource dataSource;

    @Mock
    private Connection connection;

    @Mock
    private CallableStatement callableStatement;

    @Mock
    private Statement utf8Statement;

    private PlSqlSalaryManagementServiceImpl service;

    @BeforeEach
    void setUp() throws Exception {
        TenantContextHolder.setTenantId(UT_TENANT);
        when(jdbcTemplate.getDataSource()).thenReturn(dataSource);
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareCall(anyString())).thenReturn(callableStatement);
        when(connection.createStatement()).thenReturn(utf8Statement);
        lenient().when(utf8Statement.execute(anyString())).thenReturn(false);
        service = new PlSqlSalaryManagementServiceImpl(jdbcTemplate);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("CalculateSalaryPreview 11파라미터: OUT(11)을 specialSupportAmount로 매핑")
    void calculateSalaryPreview_whenElevenParams_mapsOut11ToSpecialSupportAmount() throws Exception {
        when(jdbcTemplate.queryForObject(
                argThat((String sql) -> sql.contains("CalculateSalaryPreview") && sql.contains("COUNT")),
                eq(Integer.class)))
                .thenReturn(11);
        stubCalculateSalaryPreviewOut11();

        Map<String, Object> result = service.calculateSalaryPreview(42L,
                LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 31));

        assertThat(result)
                .containsEntry("success", true)
                .containsEntry("specialSupportAmount", new BigDecimal("12345.67"))
                .containsEntry("grossSalary", new BigDecimal("100000"));
    }

    @Test
    @DisplayName("CalculateSalaryPreview 10파라미터: specialSupportAmount는 0")
    void calculateSalaryPreview_whenTenParams_specialSupportAmountZero() throws Exception {
        when(jdbcTemplate.queryForObject(
                argThat((String sql) -> sql.contains("CalculateSalaryPreview") && sql.contains("COUNT")),
                eq(Integer.class)))
                .thenReturn(10);
        stubCalculateSalaryPreviewOut10();

        Map<String, Object> result = service.calculateSalaryPreview(7L,
                LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30));

        assertThat(result)
                .containsEntry("success", true)
                .containsEntry("specialSupportAmount", BigDecimal.ZERO);
    }

    @Test
    @DisplayName("ProcessIntegratedSalaryCalculation 13파라미터: OUT(13)을 specialSupportAmount로 매핑")
    void processIntegrated_whenThirteenParams_mapsOut13ToSpecialSupportAmount() throws Exception {
        when(jdbcTemplate.queryForObject(
                argThat((String sql) -> sql.contains("ProcessIntegratedSalaryCalculation") && sql.contains("COUNT")),
                eq(Integer.class)))
                .thenReturn(13);
        stubProcessIntegratedOut13();

        Map<String, Object> result = service.processIntegratedSalaryCalculation(99L,
                LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 31), "tester");

        assertThat(result)
                .containsEntry("success", true)
                .containsEntry("specialSupportAmount", new BigDecimal("88888.00"))
                .containsEntry("calculationId", 1001L);
    }

    @Test
    @DisplayName("ProcessIntegratedSalaryCalculation 12파라미터: specialSupportAmount는 0")
    void processIntegrated_whenTwelveParams_specialSupportAmountZero() throws Exception {
        when(jdbcTemplate.queryForObject(
                argThat((String sql) -> sql.contains("ProcessIntegratedSalaryCalculation") && sql.contains("COUNT")),
                eq(Integer.class)))
                .thenReturn(12);
        stubProcessIntegratedOut12();

        Map<String, Object> result = service.processIntegratedSalaryCalculation(3L,
                LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31), "batch");

        assertThat(result)
                .containsEntry("success", true)
                .containsEntry("specialSupportAmount", BigDecimal.ZERO)
                .containsEntry("netSalary", new BigDecimal("70000"));
    }

    private void stubCalculateSalaryPreviewOut11() throws Exception {
        when(callableStatement.getBoolean(5)).thenReturn(true);
        when(callableStatement.getString(6)).thenReturn("ok");
        when(callableStatement.getBigDecimal(7)).thenReturn(new BigDecimal("100000"));
        when(callableStatement.getBigDecimal(8)).thenReturn(new BigDecimal("90000"));
        when(callableStatement.getBigDecimal(9)).thenReturn(new BigDecimal("10000"));
        when(callableStatement.getInt(10)).thenReturn(3);
        when(callableStatement.getBigDecimal(11)).thenReturn(new BigDecimal("12345.67"));
    }

    private void stubCalculateSalaryPreviewOut10() throws Exception {
        when(callableStatement.getBoolean(5)).thenReturn(true);
        when(callableStatement.getString(6)).thenReturn("ok");
        when(callableStatement.getBigDecimal(7)).thenReturn(new BigDecimal("200000"));
        when(callableStatement.getBigDecimal(8)).thenReturn(new BigDecimal("180000"));
        when(callableStatement.getBigDecimal(9)).thenReturn(new BigDecimal("20000"));
        when(callableStatement.getInt(10)).thenReturn(5);
    }

    private void stubProcessIntegratedOut13() throws Exception {
        when(callableStatement.getLong(6)).thenReturn(1001L);
        when(callableStatement.getBigDecimal(7)).thenReturn(new BigDecimal("300000"));
        when(callableStatement.getBigDecimal(8)).thenReturn(new BigDecimal("250000"));
        when(callableStatement.getBigDecimal(9)).thenReturn(new BigDecimal("50000"));
        when(callableStatement.getLong(10)).thenReturn(2002L);
        when(callableStatement.getBoolean(11)).thenReturn(true);
        when(callableStatement.getString(12)).thenReturn("integrated-ok");
        when(callableStatement.getBigDecimal(13)).thenReturn(new BigDecimal("88888.00"));
    }

    private void stubProcessIntegratedOut12() throws Exception {
        when(callableStatement.getLong(6)).thenReturn(3003L);
        when(callableStatement.getBigDecimal(7)).thenReturn(new BigDecimal("80000"));
        when(callableStatement.getBigDecimal(8)).thenReturn(new BigDecimal("70000"));
        when(callableStatement.getBigDecimal(9)).thenReturn(new BigDecimal("10000"));
        when(callableStatement.getLong(10)).thenReturn(4004L);
        when(callableStatement.getBoolean(11)).thenReturn(true);
        when(callableStatement.getString(12)).thenReturn("twelve-out");
    }
}
