package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import javax.sql.DataSource;
import com.coresolution.consultation.entity.ConsultantSalaryProfile;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
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

    @Mock
    private ConsultantSalaryProfileRepository consultantSalaryProfileRepository;

    private PlSqlSalaryManagementServiceImpl service;

    @BeforeEach
    void setUp() throws Exception {
        TenantContextHolder.setTenantId(UT_TENANT);
        when(jdbcTemplate.getDataSource()).thenReturn(dataSource);
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareCall(anyString())).thenReturn(callableStatement);
        when(connection.createStatement()).thenReturn(utf8Statement);
        lenient().when(utf8Statement.execute(anyString())).thenReturn(false);
        lenient().when(jdbcTemplate.queryForList(anyString(), anyString())).thenReturn(Collections.emptyList());
        lenient().when(consultantSalaryProfileRepository
                .findFirstByTenantIdAndConsultantIdAndIsActiveTrueOrderByUpdatedAtDescIdDesc(eq(UT_TENANT), anyLong()))
                .thenReturn(Optional.empty());
        service = new PlSqlSalaryManagementServiceImpl(jdbcTemplate, consultantSalaryProfileRepository);
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
    @DisplayName("프리랜서+특별지원: 세전(상담료+특별지원) 기준 원천 3.3%·실지급 재산출")
    void calculateSalaryPreview_freelanceWithSpecialSupport_rewritesTaxAndNetFromTaxableGross() throws Exception {
        when(jdbcTemplate.queryForObject(
                argThat((String sql) -> sql.contains("CalculateSalaryPreview") && sql.contains("COUNT")),
                eq(Integer.class)))
                .thenReturn(11);
        when(callableStatement.getObject(5)).thenReturn(Boolean.TRUE);
        when(callableStatement.getString(6)).thenReturn("ok");
        when(callableStatement.getBigDecimal(7)).thenReturn(new BigDecimal("120000"));
        when(callableStatement.getBigDecimal(8)).thenReturn(new BigDecimal("116040"));
        when(callableStatement.getBigDecimal(9)).thenReturn(new BigDecimal("3960"));
        when(callableStatement.getInt(10)).thenReturn(3);
        when(callableStatement.getBigDecimal(11)).thenReturn(new BigDecimal("10000"));

        ConsultantSalaryProfile profile = new ConsultantSalaryProfile();
        profile.setSalaryType("FREELANCE");
        profile.setIsBusinessRegistered(false);
        when(consultantSalaryProfileRepository
                .findFirstByTenantIdAndConsultantIdAndIsActiveTrueOrderByUpdatedAtDescIdDesc(eq(UT_TENANT), eq(99L)))
                .thenReturn(Optional.of(profile));

        Map<String, Object> result = service.calculateSalaryPreview(99L,
                LocalDate.of(2024, 4, 1), LocalDate.of(2024, 4, 30));

        assertThat(result)
                .containsEntry("success", true)
                .containsEntry("consultationGrossSalary", new BigDecimal("120000"))
                .containsEntry("taxableGrossSalary", new BigDecimal("130000"))
                .containsEntry("taxAmount", new BigDecimal("4290"))
                .containsEntry("netSalary", new BigDecimal("125710"));
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
    @DisplayName("ProcessIntegrated: information_schema 메타 사용 시 OUT 순서가 달라도 이름으로 message·success 매핑")
    void processIntegrated_whenMetadataOutTailOrderDiffers_mapsByParameterName() throws Exception {
        when(jdbcTemplate.queryForList(
                argThat((String sql) -> sql.contains("information_schema.PARAMETERS")
                        && sql.contains("ORDINAL_POSITION")
                        && sql.contains("SPECIFIC_NAME")),
                eq("ProcessIntegratedSalaryCalculation")))
                .thenReturn(processIntegratedMetadataRowsWithSwappedTailOuts());
        when(callableStatement.getLong(6)).thenReturn(1001L);
        when(callableStatement.getBigDecimal(7)).thenReturn(new BigDecimal("300000"));
        when(callableStatement.getBigDecimal(8)).thenReturn(new BigDecimal("250000"));
        when(callableStatement.getBigDecimal(9)).thenReturn(new BigDecimal("50000"));
        when(callableStatement.getLong(10)).thenReturn(2002L);
        when(callableStatement.getBigDecimal(11)).thenReturn(new BigDecimal("88888.00"));
        when(callableStatement.getObject(12)).thenReturn(Boolean.TRUE);
        when(callableStatement.getString(13)).thenReturn("meta-path-ok");

        Map<String, Object> result = service.processIntegratedSalaryCalculation(99L,
                LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 31), "tester");

        assertThat(result)
                .containsEntry("success", true)
                .containsEntry("message", "meta-path-ok")
                .containsEntry("specialSupportAmount", new BigDecimal("88888.00"));
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
    @DisplayName("ProcessIntegrated: success=false·p_message=null이면 기본 실패 문구로 채움")
    void processIntegrated_whenFailureWithNullMessage_fillsDefaultUserMessage() throws Exception {
        when(jdbcTemplate.queryForObject(
                argThat((String sql) -> sql.contains("ProcessIntegratedSalaryCalculation") && sql.contains("COUNT")),
                eq(Integer.class)))
                .thenReturn(13);
        when(callableStatement.getLong(6)).thenReturn(0L);
        when(callableStatement.getBigDecimal(7)).thenReturn(BigDecimal.ZERO);
        when(callableStatement.getBigDecimal(8)).thenReturn(BigDecimal.ZERO);
        when(callableStatement.getBigDecimal(9)).thenReturn(BigDecimal.ZERO);
        when(callableStatement.getLong(10)).thenReturn(0L);
        when(callableStatement.getObject(11)).thenReturn(Boolean.FALSE);
        when(callableStatement.getString(12)).thenReturn(null);
        when(callableStatement.getBigDecimal(13)).thenReturn(BigDecimal.ZERO);

        Map<String, Object> result = service.processIntegratedSalaryCalculation(5L,
                LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 31), "tester");

        assertThat(result.get("success")).isEqualTo(false);
        assertThat(result.get("message")).isInstanceOf(String.class);
        assertThat((String) result.get("message")).isNotBlank();
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
        when(callableStatement.getObject(5)).thenReturn(Boolean.TRUE);
        when(callableStatement.getString(6)).thenReturn("ok");
        when(callableStatement.getBigDecimal(7)).thenReturn(new BigDecimal("100000"));
        when(callableStatement.getBigDecimal(8)).thenReturn(new BigDecimal("90000"));
        when(callableStatement.getBigDecimal(9)).thenReturn(new BigDecimal("10000"));
        when(callableStatement.getInt(10)).thenReturn(3);
        when(callableStatement.getBigDecimal(11)).thenReturn(new BigDecimal("12345.67"));
    }

    private void stubCalculateSalaryPreviewOut10() throws Exception {
        when(callableStatement.getObject(5)).thenReturn(Boolean.TRUE);
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
        when(callableStatement.getObject(11)).thenReturn(Boolean.TRUE);
        when(callableStatement.getString(12)).thenReturn("integrated-ok");
        when(callableStatement.getBigDecimal(13)).thenReturn(new BigDecimal("88888.00"));
    }

    /**
     * 표준 이름을 유지하되 OUT 꼬리만 순서 변경: 11=특별지원, 12=성공, 13=메시지(고정 인덱스 가정이 틀어진 DB를 시뮬레이션).
     */
    private static List<Map<String, Object>> processIntegratedMetadataRowsWithSwappedTailOuts() {
        List<Map<String, Object>> rows = new ArrayList<>();
        rows.add(metaRow(1, "IN", "p_consultant_id", "bigint"));
        rows.add(metaRow(2, "IN", "p_period_start", "date"));
        rows.add(metaRow(3, "IN", "p_period_end", "date"));
        rows.add(metaRow(4, "IN", "p_tenant_id", "varchar"));
        rows.add(metaRow(5, "IN", "p_triggered_by", "varchar"));
        rows.add(metaRow(6, "OUT", "p_calculation_id", "bigint"));
        rows.add(metaRow(7, "OUT", "p_gross_salary", "decimal"));
        rows.add(metaRow(8, "OUT", "p_net_salary", "decimal"));
        rows.add(metaRow(9, "OUT", "p_tax_amount", "decimal"));
        rows.add(metaRow(10, "OUT", "p_erp_sync_id", "bigint"));
        rows.add(metaRow(11, "OUT", "p_special_support_amount", "decimal"));
        rows.add(metaRow(12, "OUT", "p_success", "tinyint"));
        rows.add(metaRow(13, "OUT", "p_message", "varchar"));
        return rows;
    }

    private static Map<String, Object> metaRow(int ord, String mode, String name, String dataType) {
        Map<String, Object> m = new HashMap<>();
        m.put("ORDINAL_POSITION", ord);
        m.put("PARAMETER_MODE", mode);
        m.put("PARAMETER_NAME", name);
        m.put("DATA_TYPE", dataType);
        return m;
    }

    private void stubProcessIntegratedOut12() throws Exception {
        when(callableStatement.getLong(6)).thenReturn(3003L);
        when(callableStatement.getBigDecimal(7)).thenReturn(new BigDecimal("80000"));
        when(callableStatement.getBigDecimal(8)).thenReturn(new BigDecimal("70000"));
        when(callableStatement.getBigDecimal(9)).thenReturn(new BigDecimal("10000"));
        when(callableStatement.getLong(10)).thenReturn(4004L);
        when(callableStatement.getObject(11)).thenReturn(Boolean.TRUE);
        when(callableStatement.getString(12)).thenReturn("twelve-out");
    }
}
