package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.CallableStatementCallback;
import org.springframework.jdbc.core.CallableStatementCreator;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * 운영 §M8 회귀 가드: PR-E hotfix
 * <p>
 * <b>회귀 방지 대상</b>:
 * <ul>
 *   <li>2026-05-21 ~ 2026-05-27 운영 로그: 매일 04:00 {@code PlSqlFinancialServiceImpl}
 *       지점별 재무 상세 조회 실패 — {@code Index 3 out of bounds for length 3}
 *       (5-25 까지는 {@code Parameter index of 4 is out of range (1, 2)}).</li>
 *   <li>근본 원인: {@code prepareCall("{CALL Proc(?, ?, ?, @p_success, @p_message, @p_breakdown_data)}")}
 *       와 {@code registerOutParameter(4, ...)} 혼합 사용. MySQL Connector/J 8.0.33 은
 *       {@code @session_variable} 을 JDBC 파라미터로 카운트하지 않으므로 내부 배열 길이가
 *       3 (= {@code ?} 개수) 이고, OUT 인덱스 4-6 등록 시 ArrayIndexOutOfBoundsException 발생.</li>
 * </ul>
 *
 * <p><b>가드 규칙</b>: {@code PlSqlFinancialServiceImpl} 의 5개 CallableStatement 호출이
 * 사용하는 {@code prepareCall} SQL 에 어떤 {@code @session_variable} 패턴도 포함되어서는 안 되며,
 * {@code ?} placeholder 개수는 SSOT 프로시저 시그니처(IN+OUT)와 정확히 일치해야 한다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PlSqlFinancialServiceImpl prepareCall 패턴 회귀 가드 — §M8 ArrayIndexOutOfBoundsException")
class PlSqlFinancialServicePrepareCallRegressionTest {

    private static final String UT_TENANT = "ut-tenant-plsql-fin-regression";
    private static final LocalDate START_DATE = LocalDate.of(2026, 5, 1);
    private static final LocalDate END_DATE = LocalDate.of(2026, 5, 31);

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private Connection connection;

    @Mock
    private CallableStatement callableStatement;

    private PlSqlFinancialServiceImpl service;

    private final List<String> capturedPrepareCallSqls = new ArrayList<>();

    @BeforeEach
    void setUp() {
        service = new PlSqlFinancialServiceImpl(jdbcTemplate);
        TenantContextHolder.setTenantId(UT_TENANT);
        capturedPrepareCallSqls.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @SuppressWarnings("unchecked")
    private void stubAndCapturePrepareCall() throws Exception {
        ArgumentCaptor<String> sqlCaptor = ArgumentCaptor.forClass(String.class);
        when(connection.prepareCall(sqlCaptor.capture())).thenAnswer(inv -> {
            capturedPrepareCallSqls.add(inv.getArgument(0, String.class));
            return callableStatement;
        });
        when(jdbcTemplate.execute(any(CallableStatementCreator.class), any(CallableStatementCallback.class)))
                .thenAnswer(invocation -> {
                    CallableStatementCreator creator = invocation.getArgument(0);
                    CallableStatementCallback<Object> callback = invocation.getArgument(1);
                    CallableStatement cs = creator.createCallableStatement(connection);
                    return callback.doInCallableStatement(cs);
                });
    }

    private void assertPrepareCallIsSsotCompliant(String sql, int expectedPlaceholderCount) {
        assertThat(sql)
                .as("prepareCall SQL 은 MySQL @session_variable 패턴을 포함하지 않아야 함 (§M8 ArrayIndex 회귀 방지)")
                .doesNotContain("@p_")
                .doesNotContain("@P_");
        long placeholderCount = sql.chars().filter(c -> c == '?').count();
        assertThat(placeholderCount)
                .as("prepareCall SQL 의 ? placeholder 개수는 IN+OUT 합과 일치해야 함 (SSOT 프로시저 시그니처)")
                .isEqualTo(expectedPlaceholderCount);
    }

    @Test
    @DisplayName("GetBranchFinancialBreakdown: 6 ? placeholder + @session_variable 0건 (3 IN + 3 OUT)")
    void getBranchFinancialBreakdown_prepareCallHasOnlyJdbcPlaceholders() throws Exception {
        stubAndCapturePrepareCall();
        when(callableStatement.getBoolean(4)).thenReturn(true);
        when(callableStatement.getString(5)).thenReturn("ok");
        when(callableStatement.getString(6)).thenReturn("{}");

        service.getBranchFinancialBreakdown(START_DATE, END_DATE);

        assertThat(capturedPrepareCallSqls).hasSize(1);
        assertPrepareCallIsSsotCompliant(capturedPrepareCallSqls.get(0), 6);
    }

    @Test
    @DisplayName("GetMonthlyFinancialTrend: 6 ? placeholder + @session_variable 0건 (3 IN + 3 OUT)")
    void getMonthlyFinancialTrend_prepareCallHasOnlyJdbcPlaceholders() throws Exception {
        stubAndCapturePrepareCall();
        when(callableStatement.getBoolean(4)).thenReturn(true);
        when(callableStatement.getString(5)).thenReturn("ok");
        when(callableStatement.getString(6)).thenReturn("[]");

        service.getMonthlyFinancialTrend(START_DATE, END_DATE);

        assertThat(capturedPrepareCallSqls).hasSize(1);
        assertPrepareCallIsSsotCompliant(capturedPrepareCallSqls.get(0), 6);
    }

    @Test
    @DisplayName("GetCategoryFinancialBreakdown: 6 ? placeholder + @session_variable 0건 (3 IN + 3 OUT)")
    void getCategoryFinancialBreakdown_prepareCallHasOnlyJdbcPlaceholders() throws Exception {
        stubAndCapturePrepareCall();
        when(callableStatement.getBoolean(4)).thenReturn(true);
        when(callableStatement.getString(5)).thenReturn("ok");
        when(callableStatement.getString(6)).thenReturn("[]");

        service.getCategoryFinancialBreakdown(START_DATE, END_DATE);

        assertThat(capturedPrepareCallSqls).hasSize(1);
        assertPrepareCallIsSsotCompliant(capturedPrepareCallSqls.get(0), 6);
    }

    @Test
    @DisplayName("GenerateQuarterlyFinancialReport: 6 ? placeholder + @session_variable 0건 (3 IN + 3 OUT)")
    void generateQuarterlyFinancialReport_prepareCallHasOnlyJdbcPlaceholders() throws Exception {
        stubAndCapturePrepareCall();
        when(callableStatement.getBoolean(4)).thenReturn(true);
        when(callableStatement.getString(5)).thenReturn("ok");
        when(callableStatement.getString(6)).thenReturn("{}");

        service.generateQuarterlyFinancialReport(2026, 2, null);

        assertThat(capturedPrepareCallSqls).hasSize(1);
        assertPrepareCallIsSsotCompliant(capturedPrepareCallSqls.get(0), 6);
    }

    @Test
    @DisplayName("CalculateFinancialKPIs: 11 ? placeholder + @session_variable 0건 (3 IN + 8 OUT)")
    void calculateFinancialKPIs_prepareCallHasOnlyJdbcPlaceholders() throws Exception {
        stubAndCapturePrepareCall();
        when(callableStatement.getBoolean(4)).thenReturn(true);
        when(callableStatement.getString(5)).thenReturn("ok");
        when(callableStatement.getBigDecimal(6)).thenReturn(BigDecimal.ZERO);
        when(callableStatement.getBigDecimal(7)).thenReturn(BigDecimal.ZERO);
        when(callableStatement.getBigDecimal(8)).thenReturn(BigDecimal.ZERO);
        when(callableStatement.getInt(9)).thenReturn(0);
        when(callableStatement.getBigDecimal(10)).thenReturn(BigDecimal.ZERO);
        when(callableStatement.getBigDecimal(11)).thenReturn(BigDecimal.ZERO);

        service.calculateFinancialKPIs(START_DATE, END_DATE, null);

        assertThat(capturedPrepareCallSqls).hasSize(1);
        assertPrepareCallIsSsotCompliant(capturedPrepareCallSqls.get(0), 11);
    }
}
