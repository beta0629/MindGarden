package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Types;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import javax.sql.DataSource;
import com.coresolution.consultation.service.impl.StandardProcedureSqlSignature.Param;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * 급여 프로시저 3종의 SQL 파일 시그니처(개수·순서·IN/OUT·타입)와 서비스의 실제 JDBC 바인딩을 비교한다.
 * CallableStatement 스텁은 SQL 파일이 OUT 으로 선언하지 않은 인덱스에 registerOutParameter 하면
 * MySQL Connector/J 와 같은 {@code Parameter number N is not an OUT parameter} 를 던진다.
 * 서비스 메서드를 thenReturn 으로 대체하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("급여 프로시저 3종 SQL 시그니처와 JDBC 바인딩")
class SalaryProcedureJdbcSignatureTest {

    private static final String PRE_CONFIRM = "GetSalaryPreConfirmWarning";
    private static final String RECALC = "RecalcUnpaidSalaryCalculation";
    private static final String ADJUSTMENT = "InsertSalaryAdjustmentForLateSessions";
    private static final String NOT_OUT = "is not an OUT parameter";
    private static final String TENANT = "tenant-signature-a";
    private static final long CONSULTANT_ID = 11L;
    private static final long CALCULATION_ID = 77L;
    private static final LocalDate PERIOD_START = LocalDate.of(2026, 9, 1);
    private static final LocalDate PERIOD_END = LocalDate.of(2026, 9, 30);

    @Mock
    private JdbcTemplate jdbcTemplate;
    @Mock
    private DataSource dataSource;
    @Mock
    private Connection connection;
    @Mock
    private CallableStatement stmt;
    @Mock
    private Statement utf8Statement;

    private PlSqlSalaryManagementServiceImpl service;
    private final Map<Integer, Param> byOrdinal = new HashMap<>();
    private final List<Integer> registeredOut = new ArrayList<>();
    private final List<Integer> boundIn = new ArrayList<>();
    private final List<String> preparedCalls = new ArrayList<>();

    @BeforeEach
    void setUp() throws Exception {
        TenantContextHolder.setTenantId(TENANT);
        lenient().when(jdbcTemplate.getDataSource()).thenReturn(dataSource);
        lenient().when(dataSource.getConnection()).thenReturn(connection);
        lenient().when(connection.createStatement()).thenReturn(utf8Statement);
        lenient().when(utf8Statement.execute(anyString())).thenReturn(false);
        lenient().when(jdbcTemplate.queryForList(anyString(), anyString())).thenReturn(List.of());
        service = new PlSqlSalaryManagementServiceImpl(jdbcTemplate);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @ParameterizedTest
    @ValueSource(strings = {PRE_CONFIRM, RECALC, ADJUSTMENT})
    @DisplayName("standardized 와 deployment twin 은 내용이 같고, 자기 이름만 DROP·CREATE 한다")
    void twinFilesIdentical_andOnlyOwnNameDroppedAndCreated(String procedure) throws Exception {
        assertThat(Files.mismatch(
                StandardProcedureSqlSignature.standardized(procedure),
                StandardProcedureSqlSignature.deploy(procedure))).isEqualTo(-1L);
        assertThat(StandardProcedureSqlSignature.dropTargets(StandardProcedureSqlSignature.deploy(procedure)))
                .containsExactly(procedure);
        assertThat(StandardProcedureSqlSignature.createTargets(StandardProcedureSqlSignature.deploy(procedure)))
                .containsExactly(procedure);
    }

    @Test
    @DisplayName("GetSalaryPreConfirmWarning: 13개, 1~4 IN, 5~13 OUT 이고 5번은 OUT p_success 다")
    void preConfirmWarning_sqlDeclaresParameter5AsOutSuccess() {
        List<Param> params = StandardProcedureSqlSignature.readDeployedDefinition(PRE_CONFIRM);

        assertThat(params).hasSize(13);
        assertThat(params.subList(0, 4)).allMatch(p -> "IN".equals(p.mode()));
        assertThat(params.subList(4, 13)).allMatch(p -> "OUT".equals(p.mode()));
        assertThat(params.get(4).name()).isEqualTo("p_success");
    }

    @Test
    @DisplayName("GetSalaryPreConfirmWarning: SQL 이 OUT 으로 선언한 인덱스만 등록하고 IN 만 바인딩한다")
    void preConfirmWarning_jdbcBindingMatchesSql() throws Exception {
        List<Param> params = StandardProcedureSqlSignature.readDeployedDefinition(PRE_CONFIRM);
        strictStatement(PRE_CONFIRM, params);

        Map<String, Object> result = service.getSalaryPreConfirmWarning(CONSULTANT_ID, PERIOD_START, PERIOD_END);

        assertThat(String.valueOf(result.get("message"))).doesNotContain(NOT_OUT);
        assertThat(result.get("success")).isEqualTo(Boolean.TRUE);
        assertExactBinding(params);
        assertThat(result.get("primaryCalculationId")).isEqualTo(CALCULATION_ID);
    }

    @Test
    @DisplayName("InsertSalaryAdjustmentForLateSessions: SQL 이 OUT 으로 선언한 인덱스만 등록하고 IN 만 바인딩한다")
    void adjustment_jdbcBindingMatchesSql() throws Exception {
        List<Param> params = StandardProcedureSqlSignature.readDeployedDefinition(ADJUSTMENT);
        strictStatement(ADJUSTMENT, params);

        Map<String, Object> result = service.insertSalaryAdjustmentForLateSessions(CALCULATION_ID, TENANT, "admin");

        assertThat(String.valueOf(result.get("message"))).doesNotContain(NOT_OUT);
        assertThat(result.get("success")).isEqualTo(Boolean.TRUE);
        assertExactBinding(params);
    }

    @Test
    @DisplayName("RecalcUnpaidSalaryCalculation: SQL 메타 기준으로 OUT 만 등록하고 IN 만 바인딩한다")
    void recalc_jdbcBindingMatchesSql() throws Exception {
        List<Param> params = StandardProcedureSqlSignature.readDeployedDefinition(RECALC);
        when(jdbcTemplate.queryForList(anyString(), eq(RECALC)))
                .thenReturn(StandardProcedureSqlSignature.informationSchemaRows(RECALC));
        strictStatement(RECALC, params);

        Map<String, Object> result = service.recalcUnpaidSalaryCalculation(CALCULATION_ID, TENANT, "admin");

        assertThat(String.valueOf(result.get("message"))).doesNotContain(NOT_OUT);
        assertThat(result.get("success")).isEqualTo(Boolean.TRUE);
        assertExactBinding(params);
        assertThat(params.get(3).name()).isEqualTo("p_success");
        assertThat(params.get(3).out()).isTrue();
    }

    @Test
    @DisplayName("반례: 5번이 IN 인 정의면 서비스는 실패하고 Parameter number 5 메시지를 낸다 (스텁이 모드를 검사함)")
    void counterexample_parameter5DeclaredIn_isDetected() throws Exception {
        List<Param> params = new ArrayList<>(StandardProcedureSqlSignature.readDeployedDefinition(PRE_CONFIRM));
        params.set(4, params.get(4).withMode("IN"));
        strictStatement(PRE_CONFIRM, params);

        Map<String, Object> result = service.getSalaryPreConfirmWarning(CONSULTANT_ID, PERIOD_START, PERIOD_END);

        assertThat(result.get("success")).isEqualTo(Boolean.FALSE);
        assertThat(String.valueOf(result.get("message"))).contains("Parameter number 5 " + NOT_OUT);
    }

    @Test
    @DisplayName("반례: SQL 파라미터 개수가 JDBC 자리표시자와 다르면 실패한다")
    void counterexample_parameterCountMismatch_isDetected() throws Exception {
        List<Param> params = new ArrayList<>(StandardProcedureSqlSignature.readDeployedDefinition(ADJUSTMENT));
        params.remove(params.size() - 1);
        strictStatement(ADJUSTMENT, params);

        Map<String, Object> result = service.insertSalaryAdjustmentForLateSessions(CALCULATION_ID, TENANT, "admin");

        assertThat(result.get("success")).isEqualTo(Boolean.FALSE);
        assertThat(String.valueOf(result.get("message"))).contains("parameter count");
    }

    @Test
    @DisplayName("반례: OUT 타입이 SQL 타입과 다르면(DECIMAL 자리에 VARCHAR) 실패한다")
    void counterexample_outTypeMismatch_isDetected() throws Exception {
        List<Param> params = new ArrayList<>(StandardProcedureSqlSignature.readDeployedDefinition(PRE_CONFIRM));
        Param counter = params.get(6);
        params.set(6, new Param(counter.ordinal(), counter.mode(), counter.name(), "DECIMAL"));
        strictStatement(PRE_CONFIRM, params);

        Map<String, Object> result = service.getSalaryPreConfirmWarning(CONSULTANT_ID, PERIOD_START, PERIOD_END);

        assertThat(result.get("success")).isEqualTo(Boolean.FALSE);
        assertThat(String.valueOf(result.get("message"))).contains("type mismatch at 7");
    }

    private void strictStatement(String procedure, List<Param> params) throws SQLException {
        byOrdinal.clear();
        registeredOut.clear();
        boundIn.clear();
        preparedCalls.clear();
        for (Param param : params) {
            byOrdinal.put(param.ordinal(), param);
        }
        lenient().when(connection.prepareCall(anyString())).thenAnswer(invocation -> {
            String sql = invocation.getArgument(0);
            preparedCalls.add(sql);
            assertThat(sql).contains("CALL " + procedure + "(");
            long placeholders = sql.chars().filter(c -> c == '?').count();
            if (placeholders != params.size()) {
                throw new SQLException("parameter count " + placeholders + " != " + params.size());
            }
            return stmt;
        });
        lenient().doAnswer(invocation -> {
            int index = invocation.getArgument(0);
            int jdbcType = invocation.getArgument(1);
            Param param = byOrdinal.get(index);
            if (param == null || !param.out()) {
                throw new SQLException("Parameter number " + index + " " + NOT_OUT);
            }
            if (!compatible(param.dataType(), jdbcType)) {
                throw new SQLException("type mismatch at " + index + ": " + param.dataType() + " vs " + jdbcType);
            }
            registeredOut.add(index);
            return null;
        }).when(stmt).registerOutParameter(anyInt(), anyInt());
        lenient().doAnswer(invocation -> bindIn(invocation.getArgument(0))).when(stmt).setLong(anyInt(), anyLong());
        lenient().doAnswer(invocation -> bindIn(invocation.getArgument(0))).when(stmt).setString(anyInt(), any());
        lenient().doAnswer(invocation -> bindIn(invocation.getArgument(0))).when(stmt).setDate(anyInt(), any());
        lenient().when(stmt.execute()).thenReturn(false);
        lenient().when(stmt.getObject(anyInt())).thenAnswer(invocation -> outValue(invocation.getArgument(0)));
        lenient().when(stmt.getString(anyInt())).thenAnswer(invocation -> {
            Object value = outValue(invocation.getArgument(0));
            return value == null ? null : String.valueOf(value);
        });
        lenient().when(stmt.getInt(anyInt())).thenAnswer(invocation -> {
            Object value = outValue(invocation.getArgument(0));
            return value instanceof Number number ? number.intValue() : 0;
        });
        lenient().when(stmt.getLong(anyInt())).thenAnswer(invocation -> {
            Object value = outValue(invocation.getArgument(0));
            return value instanceof Number number ? number.longValue() : 0L;
        });
        lenient().when(stmt.getBigDecimal(anyInt())).thenAnswer(invocation -> {
            Object value = outValue(invocation.getArgument(0));
            return value instanceof BigDecimal decimal ? decimal : null;
        });
        lenient().when(stmt.wasNull()).thenReturn(false);
    }

    private Object bindIn(int index) throws SQLException {
        Param param = byOrdinal.get(index);
        if (param == null) {
            throw new SQLException("Parameter index out of range (" + index + ")");
        }
        if (!param.in()) {
            throw new SQLException("Parameter number " + index + " is not an IN parameter");
        }
        boundIn.add(index);
        return null;
    }

    private Object outValue(int index) throws SQLException {
        Param param = byOrdinal.get(index);
        if (param == null || !param.out() || !registeredOut.contains(index)) {
            throw new SQLException("No output parameter registered for " + index);
        }
        if ("p_success".equals(param.name())) {
            return Boolean.TRUE;
        }
        return switch (param.dataType()) {
            case "BOOLEAN", "BOOL", "TINYINT" -> Boolean.TRUE;
            case "INT", "INTEGER" -> 1;
            case "BIGINT" -> CALCULATION_ID;
            case "DECIMAL", "NUMERIC" -> BigDecimal.ONE;
            default -> "ok";
        };
    }

    private void assertExactBinding(List<Param> params) {
        Set<Integer> outIndexes = params.stream().filter(Param::out).map(Param::ordinal)
                .collect(Collectors.toSet());
        Set<Integer> inIndexes = params.stream().filter(Param::in).map(Param::ordinal)
                .collect(Collectors.toSet());
        assertThat(preparedCalls).hasSize(1);
        assertThat(registeredOut).doesNotHaveDuplicates();
        assertThat(boundIn).doesNotHaveDuplicates();
        assertThat(Set.copyOf(registeredOut)).isEqualTo(outIndexes);
        assertThat(Set.copyOf(boundIn)).isEqualTo(inIndexes);
    }

    private static boolean compatible(String sqlType, int jdbcType) {
        return switch (sqlType) {
            case "BOOLEAN", "BOOL", "TINYINT", "BIT" ->
                    jdbcType == Types.BOOLEAN || jdbcType == Types.BIT || jdbcType == Types.TINYINT;
            case "INT", "INTEGER" -> jdbcType == Types.INTEGER;
            case "BIGINT" -> jdbcType == Types.BIGINT;
            case "DECIMAL", "NUMERIC" -> jdbcType == Types.DECIMAL || jdbcType == Types.NUMERIC;
            case "VARCHAR", "CHAR", "TEXT", "MEDIUMTEXT", "LONGTEXT" ->
                    jdbcType == Types.VARCHAR || jdbcType == Types.LONGVARCHAR
                            || jdbcType == Types.CHAR || jdbcType == Types.CLOB;
            case "DATE" -> jdbcType == Types.DATE;
            default -> false;
        };
    }
}
