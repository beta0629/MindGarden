package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.Date;
import java.sql.SQLException;
import java.sql.Types;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import javax.sql.DataSource;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.consultation.service.impl.StandardProcedureSqlSignature.Param;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.CallableStatementCallback;
import org.springframework.jdbc.core.CallableStatementCreator;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * 모든 Java 프로시저 호출 지점의 파라미터 개수·순서·IN/OUT/INOUT 을 표준 SQL 과 비교한다.
 * OUT 이 아닌 인덱스에 registerOutParameter 하면 Connector/J 와 같이 실패한다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
@DisplayName("Java 프로시저 호출과 표준 SQL 시그니처")
class ProcedureJdbcSignatureCatalogTest {

    private static final Pattern CALL = Pattern.compile(
            "CALL\\s*(?:\"[^\"]*\"\\s*\\+\\s*[A-Za-z0-9_]+\\s*\\+\\s*\")?\\.?([A-Z][A-Za-z0-9_]*)\\s*\\(([^)]*)\\)");
    private static final Pattern ROUTINE_CONST = Pattern.compile("=\\s*\"([A-Z][A-Za-z0-9_]*)\"");
    private static final Pattern PROC_NAME = Pattern.compile(
            "withProcedureName\\(\\s*(?:\"([A-Z][A-Za-z0-9_]*)\"|([A-Za-z_][A-Za-z0-9_]*))\\s*\\)");
    private static final Pattern OUT_REG = Pattern.compile("registerOutParameter\\(\\s*(\\d+)\\s*,");
    private static final Pattern DECLARED = Pattern.compile(
            "new\\s+(SqlOutParameter|SqlInOutParameter|SqlParameter)\\(");
    private static final Pattern ADD_VALUE = Pattern.compile("(?:addValue|put)\\(\\s*\"(p_[A-Za-z0-9_]+)\"");
    private static final String NOT_OUT = "is not an OUT parameter";
    private static final Set<String> FIXED = Set.of(
            "GetIntegratedSalaryStatistics",
            "ProcessDiscountAccounting",
            "GetBusinessTimeSettings",
            "UpdateBusinessTimeSetting",
            "UpdateAllBranchDailyStatistics",
            "UpdateAllConsultantPerformance",
            // 운영/개발에서 "Parameter number 4 is not an OUT parameter" 로 500 을 낸 적이 있는 호출
            "GetConsolidatedFinancialData");

    private final Map<Integer, Param> byOrdinal = new HashMap<>();
    private final List<Integer> registeredOut = new ArrayList<>();
    private final List<Integer> boundIn = new ArrayList<>();

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId("tenant-signature-catalog");
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("표준 SQL 이 있는 모든 호출 지점은 개수·모드·순서가 맞고, 고친 6종이 포함된다")
    void everyCallSiteMatchesStandardSql() throws Exception {
        List<Site> sites = readSites();
        List<String> problems = new ArrayList<>();
        Map<String, List<Site>> byName = new HashMap<>();
        for (Site site : sites) {
            byName.computeIfAbsent(site.procedure, key -> new ArrayList<>()).add(site);
        }
        for (Map.Entry<String, List<Site>> entry : byName.entrySet()) {
            String procedure = entry.getKey();
            if (!Files.isRegularFile(StandardProcedureSqlSignature.standardized(procedure))) {
                continue;
            }
            List<Param> sql = StandardProcedureSqlSignature.readDeployedDefinition(procedure);
            boolean anyMatch = false;
            for (Site site : entry.getValue()) {
                String problem = mismatch(procedure, site, sql);
                if (problem == null) {
                    anyMatch = true;
                    continue;
                }
                if (site.slots.size() == sql.size()) {
                    problems.add(problem);
                }
            }
            if (!anyMatch) {
                problems.add(procedure + " 호출이 표준 SQL 과 맞는 시그니처가 없습니다");
            }
        }
        assertThat(problems).as(String.join("\n", problems)).isEmpty();
        for (String fixed : FIXED) {
            assertThat(byName).containsKey(fixed);
            assertThat(mismatch(fixed, matchingSite(byName.get(fixed), fixed), 
                    StandardProcedureSqlSignature.readDeployedDefinition(fixed))).isNull();
        }
        assertThat(byName).containsKeys(
                "GetSalaryPreConfirmWarning",
                "RecalcUnpaidSalaryCalculation",
                "InsertSalaryAdjustmentForLateSessions");
    }

    @Test
    @DisplayName("GetIntegratedSalaryStatistics: 11개 중 4~11이 OUT 이고 JDBC 가 그 인덱스만 등록한다")
    void integratedSalaryStatistics_bindingMatchesSql() throws Exception {
        List<Param> params = StandardProcedureSqlSignature.readDeployedDefinition("GetIntegratedSalaryStatistics");
        PlSqlSalaryManagementServiceImpl service = salaryService(params, "GetIntegratedSalaryStatistics");

        Map<String, Object> result = service.getIntegratedSalaryStatistics(
                null, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30));

        assertThat(result.get("success")).isEqualTo(Boolean.TRUE);
        assertThat(String.valueOf(result.get("message"))).doesNotContain(NOT_OUT);
        assertOutIndexes(params);
    }

    @Test
    @DisplayName("반례: 4번을 IN 으로 두면 Parameter number 4 is not an OUT parameter")
    void counterexample_statisticsParameter4In_isRejected() throws Exception {
        List<Param> params = new ArrayList<>(
                StandardProcedureSqlSignature.readDeployedDefinition("GetIntegratedSalaryStatistics"));
        params.set(3, params.get(3).withMode("IN"));
        PlSqlSalaryManagementServiceImpl service = salaryService(params, "GetIntegratedSalaryStatistics");

        Map<String, Object> result = service.getIntegratedSalaryStatistics(
                null, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30));

        assertThat(result.get("success")).isEqualTo(Boolean.FALSE);
        assertThat(String.valueOf(result.get("message"))).contains("Parameter number 4 " + NOT_OUT);
    }

    @Test
    @DisplayName("반례: SQL 개수와 자리표시자 개수가 다르면 parameter count 로 실패한다")
    void counterexample_statisticsCountMismatch_isRejected() throws Exception {
        List<Param> params = new ArrayList<>(
                StandardProcedureSqlSignature.readDeployedDefinition("GetIntegratedSalaryStatistics"));
        params.remove(params.size() - 1);
        PlSqlSalaryManagementServiceImpl service = salaryService(params, "GetIntegratedSalaryStatistics");

        Map<String, Object> result = service.getIntegratedSalaryStatistics(
                null, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30));

        assertThat(result.get("success")).isEqualTo(Boolean.FALSE);
        assertThat(String.valueOf(result.get("message"))).contains("parameter count");
    }

    @Test
    @DisplayName("반례: OUT 타입이 다르면 type mismatch 로 실패한다")
    void counterexample_statisticsOutType_isRejected() throws Exception {
        List<Param> params = new ArrayList<>(
                StandardProcedureSqlSignature.readDeployedDefinition("GetIntegratedSalaryStatistics"));
        Param gross = params.get(6);
        params.set(6, new Param(gross.ordinal(), gross.mode(), gross.name(), "DATE"));
        PlSqlSalaryManagementServiceImpl service = salaryService(params, "GetIntegratedSalaryStatistics");

        Map<String, Object> result = service.getIntegratedSalaryStatistics(
                null, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30));

        assertThat(result.get("success")).isEqualTo(Boolean.FALSE);
        assertThat(String.valueOf(result.get("message"))).contains("type mismatch at 7");
    }

    @Test
    @DisplayName("ProcessDiscountAccounting: 13개, 9~13 OUT 이고 13번은 JSON OUT 이다")
    void processDiscountAccounting_bindingMatchesSql() throws Exception {
        List<Param> params = StandardProcedureSqlSignature.readDeployedDefinition("ProcessDiscountAccounting");
        assertThat(params).hasSize(13);
        assertThat(params.get(12).mode()).isEqualTo("OUT");
        assertThat(params.get(12).dataType()).isEqualTo("JSON");
        PlSqlAccountingServiceImpl service = accountingService(params);

        Map<String, Object> result = service.processDiscountAccounting(
                1L, "CODE", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.TEN, "RATE");

        assertThat(result.get("success")).isEqualTo(Boolean.TRUE);
        assertThat(String.valueOf(result.get("message"))).doesNotContain(NOT_OUT);
        assertOutIndexes(params);
    }

    @Test
    @DisplayName("GetBusinessTimeSettings 와 UpdateBusinessTimeSetting 은 SQL OUT 인덱스만 등록한다")
    void businessTime_bindingMatchesSql() throws Exception {
        List<Param> readParams = StandardProcedureSqlSignature.readDeployedDefinition("GetBusinessTimeSettings");
        StoredProcedureServiceImpl service = storedProcedureService(readParams, "GetBusinessTimeSettings");
        Map<String, Object> read = service.getBusinessTimeSettings();
        assertThat(read.get("businessHours")).isInstanceOf(List.class);
        assertOutIndexes(readParams);

        List<Param> writeParams = StandardProcedureSqlSignature.readDeployedDefinition("UpdateBusinessTimeSetting");
        StoredProcedureServiceImpl writer = storedProcedureService(writeParams, "UpdateBusinessTimeSetting");
        assertThat(writer.updateBusinessTimeSetting("BUSINESS_HOURS", "START_TIME", "09:00")).isTrue();
        assertOutIndexes(writeParams);
    }

    private void assertOutIndexes(List<Param> params) {
        List<Integer> expected = params.stream().filter(Param::out).map(Param::ordinal).toList();
        assertThat(registeredOut).containsExactlyElementsOf(expected);
        List<Integer> expectedIn = params.stream().filter(Param::in).map(Param::ordinal).toList();
        assertThat(boundIn).containsExactlyInAnyOrderElementsOf(expectedIn);
    }

    private PlSqlSalaryManagementServiceImpl salaryService(List<Param> params, String procedure) throws Exception {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        DataSource dataSource = mock(DataSource.class);
        Connection connection = mock(Connection.class);
        java.sql.Statement utf8 = mock(java.sql.Statement.class);
        lenient().when(jdbcTemplate.getDataSource()).thenReturn(dataSource);
        lenient().when(dataSource.getConnection()).thenReturn(connection);
        lenient().when(connection.createStatement()).thenReturn(utf8);
        lenient().when(utf8.execute(any())).thenReturn(false);
        strictPrepare(connection, procedure, params);
        return new PlSqlSalaryManagementServiceImpl(jdbcTemplate);
    }

    private PlSqlAccountingServiceImpl accountingService(List<Param> params) throws Exception {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        DataSource dataSource = mock(DataSource.class);
        Connection connection = mock(Connection.class);
        java.sql.Statement utf8 = mock(java.sql.Statement.class);
        lenient().when(jdbcTemplate.getDataSource()).thenReturn(dataSource);
        lenient().when(dataSource.getConnection()).thenReturn(connection);
        lenient().when(connection.createStatement()).thenReturn(utf8);
        lenient().when(utf8.execute(any())).thenReturn(false);
        strictPrepare(connection, "ProcessDiscountAccounting", params);
        return new PlSqlAccountingServiceImpl(jdbcTemplate, mock(AccountingService.class));
    }

    private StoredProcedureServiceImpl storedProcedureService(List<Param> params, String procedure) throws Exception {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        Connection connection = mock(Connection.class);
        strictPrepare(connection, procedure, params);
        lenient().when(jdbcTemplate.execute(any(CallableStatementCreator.class), any(CallableStatementCallback.class)))
                .thenAnswer(invocation -> {
                    CallableStatementCreator creator = invocation.getArgument(0);
                    CallableStatementCallback<?> action = invocation.getArgument(1);
                    CallableStatement statement = creator.createCallableStatement(connection);
                    return action.doInCallableStatement(statement);
                });
        return new StoredProcedureServiceImpl(jdbcTemplate);
    }

    private void strictPrepare(Connection connection, String procedure, List<Param> params) throws SQLException {
        byOrdinal.clear();
        registeredOut.clear();
        boundIn.clear();
        for (Param param : params) {
            byOrdinal.put(param.ordinal(), param);
        }
        CallableStatement stmt = mock(CallableStatement.class);
        lenient().when(connection.prepareCall(any())).thenAnswer(invocation -> {
            String sql = invocation.getArgument(0);
            assertThat(sql).contains("CALL " + procedure + "(");
            long placeholders = sql.chars().filter(ch -> ch == '?').count();
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
        lenient().doAnswer(invocation -> bindIn(invocation.getArgument(0))).when(stmt).setDate(anyInt(), any(Date.class));
        lenient().doAnswer(invocation -> bindIn(invocation.getArgument(0))).when(stmt).setBigDecimal(anyInt(), any());
        lenient().when(stmt.execute()).thenReturn(false);
        lenient().when(stmt.getBoolean(anyInt())).thenAnswer(invocation -> Boolean.TRUE.equals(outValue(invocation.getArgument(0))));
        lenient().when(stmt.getObject(anyInt())).thenAnswer(invocation -> outValue(invocation.getArgument(0)));
        lenient().when(stmt.getString(anyInt())).thenAnswer(invocation -> {
            Object value = outValue(invocation.getArgument(0));
            return value == null ? null : String.valueOf(value);
        });
        lenient().when(stmt.getInt(anyInt())).thenReturn(1);
        lenient().when(stmt.getLong(anyInt())).thenReturn(1L);
        lenient().when(stmt.getBigDecimal(anyInt())).thenReturn(BigDecimal.ONE);
    }

    private Object bindIn(int index) throws SQLException {
        Param param = byOrdinal.get(index);
        if (param == null || !param.in()) {
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
        if ("p_settings_data".equals(param.name())) {
            return "{\"business_hours\":[],\"cancellation_policy\":[]}";
        }
        if ("BOOLEAN".equals(param.dataType()) || "BOOL".equals(param.dataType()) || "TINYINT".equals(param.dataType())) {
            return Boolean.TRUE;
        }
        return "ok";
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
            case "JSON" -> jdbcType == Types.LONGVARCHAR || jdbcType == Types.VARCHAR || jdbcType == Types.OTHER;
            case "DATE" -> jdbcType == Types.DATE;
            default -> false;
        };
    }

    private static Site matchingSite(List<Site> sites, String procedure) {
        List<Param> sql = StandardProcedureSqlSignature.readDeployedDefinition(procedure);
        for (Site site : sites) {
            if (mismatch(procedure, site, sql) == null) {
                return site;
            }
        }
        throw new IllegalStateException(procedure);
    }

    private static String mismatch(String procedure, Site site, List<Param> sql) {
        if (site.slots.size() != sql.size()) {
            return procedure + " count java=" + site.slots.size() + " sql=" + sql.size() + " @" + site.where;
        }
        for (int i = 0; i < sql.size(); i++) {
            String mode = site.slots.get(i);
            if (!sql.get(i).mode().equals(mode)) {
                return procedure + " mode @" + (i + 1) + " java=" + mode + " sql=" + sql.get(i).mode()
                        + " " + site.where;
            }
        }
        return null;
    }

    private static List<Site> readSites() throws Exception {
        List<Site> sites = new ArrayList<>();
        Path root = Path.of("src/main/java");
        try (Stream<Path> files = Files.walk(root)) {
            for (Path file : files.filter(path -> path.toString().endsWith(".java")).toList()) {
                String text = Files.readString(file);
                String[] lines = text.split("\n", -1);
                collectCalls(file, lines, sites);
                collectDeclared(file, text, sites);
            }
        }
        return sites;
    }

    private static void collectCalls(Path file, String[] lines, List<Site> sites) {
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            String trimmed = line.strip();
            if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
                continue;
            }
            Matcher matcher = CALL.matcher(line);
            if (!matcher.find()) {
                continue;
            }
            String procedure = matcher.group(1);
            List<String> slots = new ArrayList<>();
            boolean literalArgs = true;
            for (String arg : matcher.group(2).split(",")) {
                String token = arg.trim();
                if (token.isEmpty()) {
                    continue;
                }
                if ("?".equals(token)) {
                    slots.add("IN");
                } else if (token.startsWith("@") && token.length() > 1) {
                    slots.add("OUT");
                } else {
                    literalArgs = false;
                    break;
                }
            }
            if (!literalArgs) {
                continue;
            }
            List<Integer> outs = new ArrayList<>();
            for (int j = i; j < Math.min(lines.length, i + 40); j++) {
                if (j > i && CALL.matcher(lines[j]).find() && !lines[j].strip().startsWith("*")) {
                    break;
                }
                Matcher out = OUT_REG.matcher(lines[j]);
                while (out.find()) {
                    outs.add(Integer.parseInt(out.group(1)));
                }
            }
            for (int index : outs) {
                if (index >= 1 && index <= slots.size() && "IN".equals(slots.get(index - 1))) {
                    slots.set(index - 1, "OUT");
                }
            }
            sites.add(new Site(procedure, slots, file.getFileName() + ":" + (i + 1)));
        }
        if (!textOf(lines).contains("isOutMode")) {
            return;
        }
        Matcher constants = ROUTINE_CONST.matcher(textOf(lines));
        while (constants.find()) {
            String procedure = constants.group(1);
            if (!Files.isRegularFile(StandardProcedureSqlSignature.standardized(procedure))) {
                continue;
            }
            boolean already = false;
            for (Site site : sites) {
                if (procedure.equals(site.procedure) && file.getFileName().toString().equals(site.where.split(":")[0])) {
                    already = true;
                    break;
                }
            }
            if (already) {
                continue;
            }
            List<Param> sql = StandardProcedureSqlSignature.readDeployedDefinition(procedure);
            List<String> slots = new ArrayList<>();
            for (Param param : sql) {
                slots.add(param.mode());
            }
            sites.add(new Site(procedure, slots, file.getFileName() + ":metadata-const"));
        }
    }

    private static String textOf(String[] lines) {
        return String.join("\n", lines);
    }

    private static void collectDeclared(Path file, String text, List<Site> sites) {
        Matcher names = PROC_NAME.matcher(text);
        while (names.find()) {
            String procedure = names.group(1);
            if (procedure == null) {
                String variable = names.group(2);
                String before = text.substring(Math.max(0, names.start() - 600), names.start());
                Matcher assigned = Pattern.compile(
                        variable + "\\s*=\\s*\"([A-Z][A-Za-z0-9_]*)\"").matcher(before);
                String resolved = null;
                while (assigned.find()) {
                    resolved = assigned.group(1);
                }
                if (resolved == null) {
                    continue;
                }
                procedure = resolved;
            }
            int from = names.end();
            int next = text.indexOf("withProcedureName(", from);
            String window = text.substring(from, next < 0 ? text.length() : next);
            int decl = window.indexOf("declareParameters");
            if (decl < 0) {
                List<String> inputs = new ArrayList<>();
                Matcher values = ADD_VALUE.matcher(window);
                while (values.find()) {
                    inputs.add(values.group(1));
                }
                if (!Files.isRegularFile(StandardProcedureSqlSignature.standardized(procedure))) {
                    continue;
                }
                List<Param> sql = StandardProcedureSqlSignature.readDeployedDefinition(procedure);
                List<String> slots = new ArrayList<>();
                int inputCursor = 0;
                for (Param param : sql) {
                    if (param.in() && !param.out()) {
                        if (inputCursor < inputs.size() && inputs.get(inputCursor).equalsIgnoreCase(param.name())) {
                            slots.add("IN");
                            inputCursor++;
                        } else {
                            slots.add("MISSING");
                        }
                    } else {
                        slots.add(param.mode());
                    }
                }
                if (inputCursor != inputs.size()) {
                    slots.add("EXTRA");
                }
                sites.add(new Site(procedure, slots, file.getFileName() + ":metadata"));
                continue;
            }
            String body = window.substring(decl);
            int semi = body.indexOf(';');
            if (semi > 0) {
                body = body.substring(0, semi);
            }
            List<String> slots = new ArrayList<>();
            Matcher declared = DECLARED.matcher(body);
            while (declared.find()) {
                String kind = declared.group(1);
                if ("SqlOutParameter".equals(kind)) {
                    slots.add("OUT");
                } else if ("SqlInOutParameter".equals(kind)) {
                    slots.add("INOUT");
                } else {
                    slots.add("IN");
                }
            }
            sites.add(new Site(procedure, slots, file.getFileName() + ":declare"));
        }
    }

    private record Site(String procedure, List<String> slots, String where) {
    }
}
