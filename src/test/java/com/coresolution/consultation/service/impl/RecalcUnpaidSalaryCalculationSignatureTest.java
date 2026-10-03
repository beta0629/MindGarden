package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import javax.sql.DataSource;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.SalaryCalculation.CalculationKind;
import com.coresolution.consultation.entity.SalaryCalculation.SalaryStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.salary.PayrollConfirmGrace;
import com.coresolution.consultation.service.impl.StandardProcedureSqlSignature.Param;
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
 * {@code RecalcUnpaidSalaryCalculation} SQL 파일의 파라미터와 JDBC OUT 등록을 비교한다.
 * 서비스 메서드 전체를 Mockito 로 대체하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-02
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("RecalcUnpaidSalaryCalculation SQL 시그니처와 JDBC OUT 등록")
class RecalcUnpaidSalaryCalculationSignatureTest {

    private static final String NOT_AN_OUT_PARAMETER = "Parameter number 4 is not an OUT parameter";
    private static final String TENANT = "tenant-grace-a";
    private static final long CALCULATION_ID = 77L;
    private static final int PROCEDURE_SESSIONS = 9;
    private static final BigDecimal PROCEDURE_GROSS = new BigDecimal("360000");
    private static final BigDecimal PROCEDURE_TAX = new BigDecimal("11880");
    private static final BigDecimal PROCEDURE_NET = new BigDecimal("348120");
    private static final BigDecimal STORED_NET = new BigDecimal("212740");
    private static final Path DEPLOY_SCRIPT = Path.of(
            "scripts/automation/deployment/deploy-standardized-procedures.sh");

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
    private SalaryCalculationRepository salaryCalculationRepository;

    private PlSqlSalaryManagementServiceImpl service;
    private final Map<Integer, Param> byOrdinal = new HashMap<>();

    @BeforeEach
    void setUp() throws Exception {
        TenantContextHolder.setTenantId(TENANT);
        lenient().when(jdbcTemplate.getDataSource()).thenReturn(dataSource);
        lenient().when(dataSource.getConnection()).thenReturn(connection);
        lenient().when(connection.prepareCall(anyString())).thenReturn(callableStatement);
        lenient().when(connection.createStatement()).thenReturn(utf8Statement);
        lenient().when(utf8Statement.execute(anyString())).thenReturn(false);
        lenient().when(jdbcTemplate.queryForList(anyString(), anyString())).thenReturn(List.of());
        service = new PlSqlSalaryManagementServiceImpl(jdbcTemplate);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("SQL 이 OUT 으로 선언한 인덱스만 registerOutParameter 하고, 그 외는 Parameter number 4 예외가 나지 않는다")
    void recalcUnpaidSalaryCalculation_registersOutOnlyWhenProcedureSqlDeclaresOut() throws Exception {
        List<Param> params = RecalcUnpaidProcedureSignature.readDeployedDefinition();
        assertThat(Files.readString(DEPLOY_SCRIPT)).doesNotContain("\"RecalcUnpaidSalaryCalculation\"");
        assertThat(StandardProcedureSqlSignature.dropTargets(RecalcUnpaidProcedureSignature.DEPLOY))
                .containsExactly(RecalcUnpaidProcedureSignature.PROCEDURE);
        assertThat(params).anyMatch(param -> param.ordinal() == 4 && param.out());
        stubProcedureReturns(params);

        Map<String, Object> result = service.recalcUnpaidSalaryCalculation(CALCULATION_ID, TENANT, "admin");

        assertThat(String.valueOf(result.get("message"))).doesNotContain(NOT_AN_OUT_PARAMETER);
        assertThat(result.get("success")).isEqualTo(Boolean.TRUE);
        assertThat(result.get("completedConsultations")).isEqualTo(PROCEDURE_SESSIONS);
        assertThat(new BigDecimal(result.get("netSalary").toString())).isEqualByComparingTo(PROCEDURE_NET);
        assertThat(new BigDecimal(result.get("grossSalary").toString())).isEqualByComparingTo(PROCEDURE_GROSS);
        assertThat(new BigDecimal(result.get("taxAmount").toString())).isEqualByComparingTo(PROCEDURE_TAX);
        for (Param param : params) {
            if (param.out()) {
                verify(callableStatement).registerOutParameter(eq(param.ordinal()), anyInt());
            } else {
                verify(callableStatement, never()).registerOutParameter(eq(param.ordinal()), anyInt());
            }
        }
    }

    @Test
    @DisplayName("서버 메타에 파라미터가 없으면 4번을 OUT 으로 등록하지 않고 그 SQLException 문구가 나오지 않는다")
    void recalcUnpaid_whenDeployedParametersMissing_doesNotRegisterParameter4AsOut() throws Exception {
        Map<String, Object> result = service.recalcUnpaidSalaryCalculation(CALCULATION_ID, TENANT, "admin");

        verify(callableStatement, never()).registerOutParameter(anyInt(), anyInt());
        verify(connection, never()).prepareCall(anyString());
        assertThat(result.get("success")).isEqualTo(Boolean.FALSE);
        assertThat(String.valueOf(result.get("message"))).doesNotContain(NOT_AN_OUT_PARAMETER);
        assertThat(String.valueOf(result.get("message"))).contains("parameters=0");
    }

    @Test
    @DisplayName("보정 기간 확정은 프로시저 OUT 의 회기·실지급으로 같은 PRIMARY 를 덮어쓴다")
    void confirmDuringGrace_storesProcedureOutSessionCountAndNetOnSamePrimary() throws Exception {
        List<Param> params = RecalcUnpaidProcedureSignature.readDeployedDefinition();
        stubProcedureReturns(params);
        Map<String, SalaryCalculation> rows = new HashMap<>();
        SalaryCalculation stored = earlySeptember();
        rows.put(TENANT + ":1:2026-09", stored);
        when(salaryCalculationRepository
                .findByTenantIdAndConsultant_IdAndCalculationPeriodAndCalculationKindAndIsDeletedFalse(
                        anyString(), org.mockito.ArgumentMatchers.anyLong(), anyString(), eq(CalculationKind.PRIMARY)))
                .thenAnswer(invocation -> Optional.ofNullable(rows.get(
                        invocation.getArgument(0) + ":" + invocation.getArgument(1) + ":"
                                + invocation.getArgument(2))));
        when(salaryCalculationRepository.updateRecalculatedPrimary(
                org.mockito.ArgumentMatchers.anyLong(), anyString(), eq(CalculationKind.PRIMARY),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenAnswer(invocation -> {
                    stored.setCompletedConsultations(invocation.getArgument(3));
                    stored.setGrossSalary(invocation.getArgument(4));
                    stored.setNetSalary(invocation.getArgument(5));
                    stored.setDeductions(invocation.getArgument(6));
                    stored.setTotalSalary(invocation.getArgument(4));
                    return 1;
                });
        PayrollPeriodConfirmGate gate = new PayrollPeriodConfirmGate(salaryCalculationRepository);
        gate.useClock(Clock.fixed(
                ZonedDateTime.of(2026, 10, 2, 13, 50, 21, 0, PayrollConfirmGrace.ZONE).toInstant(),
                ZoneId.of("Asia/Seoul")));
        PayrollPeriodConfirmCoordinator coordinator = new PayrollPeriodConfirmCoordinator(
                gate, service, salaryCalculationRepository);

        Map<String, Object> result = coordinator.confirm(
                1L, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), "admin");

        assertThat(String.valueOf(result.get("message"))).doesNotContain(NOT_AN_OUT_PARAMETER);
        assertThat(result.get("success")).isEqualTo(Boolean.TRUE);
        assertThat(stored.getId()).isEqualTo(CALCULATION_ID);
        assertThat(stored.getCompletedConsultations()).isEqualTo(PROCEDURE_SESSIONS);
        assertThat(stored.getNetSalary()).isEqualByComparingTo(PROCEDURE_NET);
        assertThat(stored.getNetSalary()).isNotEqualByComparingTo(STORED_NET);
        assertThat(stored.getGrossSalary()).isEqualByComparingTo(PROCEDURE_GROSS);
        assertThat(stored.getDeductions()).isEqualByComparingTo(PROCEDURE_TAX);
        assertThat(rows).hasSize(1);
        verify(salaryCalculationRepository).updateRecalculatedPrimary(
                eq(CALCULATION_ID), eq(TENANT), eq(CalculationKind.PRIMARY),
                eq(PROCEDURE_SESSIONS), eq(PROCEDURE_GROSS), eq(PROCEDURE_NET), eq(PROCEDURE_TAX));
    }

    private void stubProcedureReturns(List<Param> params) throws SQLException {
        byOrdinal.clear();
        for (Param param : params) {
            byOrdinal.put(param.ordinal(), param);
        }
        when(jdbcTemplate.queryForList(anyString(), eq("RecalcUnpaidSalaryCalculation")))
                .thenReturn(RecalcUnpaidProcedureSignature.informationSchemaRows());
        doAnswer(invocation -> {
            int index = invocation.getArgument(0);
            Param param = byOrdinal.get(index);
            if (param == null || !param.out()) {
                throw new SQLException("Parameter number " + index + " is not an OUT parameter");
            }
            return null;
        }).when(callableStatement).registerOutParameter(anyInt(), anyInt());
        when(callableStatement.getObject(anyInt())).thenAnswer(invocation ->
                valueFor(invocation.getArgument(0)));
        when(callableStatement.getString(anyInt())).thenAnswer(invocation ->
                (String) valueFor(invocation.getArgument(0)));
        when(callableStatement.getLong(anyInt())).thenAnswer(invocation -> {
            Object value = valueFor(invocation.getArgument(0));
            return value instanceof Number number ? number.longValue() : 0L;
        });
        when(callableStatement.getInt(anyInt())).thenAnswer(invocation -> {
            Object value = valueFor(invocation.getArgument(0));
            return value instanceof Number number ? number.intValue() : 0;
        });
        when(callableStatement.getBigDecimal(anyInt())).thenAnswer(invocation ->
                (BigDecimal) valueFor(invocation.getArgument(0)));
        when(callableStatement.wasNull()).thenReturn(false);
    }

    private Object valueFor(int ordinal) {
        Param param = byOrdinal.get(ordinal);
        if (param == null) {
            return null;
        }
        return switch (param.name()) {
            case "p_success" -> Boolean.TRUE;
            case "p_message" -> "미지급 급여 재계산이 완료되었습니다.";
            case "p_out_calculation_id" -> CALCULATION_ID;
            case "p_completed_consultations" -> PROCEDURE_SESSIONS;
            case "p_gross_salary" -> PROCEDURE_GROSS;
            case "p_net_salary" -> PROCEDURE_NET;
            case "p_tax_amount" -> PROCEDURE_TAX;
            default -> null;
        };
    }

    private static SalaryCalculation earlySeptember() {
        User consultant = new User();
        consultant.setId(1L);
        SalaryCalculation row = SalaryCalculation.builder()
                .consultant(consultant)
                .calculationPeriod("2026-09")
                .calculationPeriodStart(LocalDate.of(2026, 9, 1))
                .calculationPeriodEnd(LocalDate.of(2026, 9, 30))
                .totalConsultations(5)
                .completedConsultations(5)
                .grossSalary(STORED_NET)
                .netSalary(STORED_NET)
                .deductions(BigDecimal.ZERO)
                .totalSalary(STORED_NET)
                .status(SalaryStatus.CALCULATED)
                .calculationKind(CalculationKind.PRIMARY)
                .build();
        row.setId(CALCULATION_ID);
        row.setTenantId(TENANT);
        return row;
    }
}
