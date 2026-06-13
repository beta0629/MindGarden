package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.RETURNS_SELF;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import javax.sql.DataSource;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.MockedConstruction;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 운영 P0 hotfix 2026-06-14 회귀 가드: {@link PlSqlStatisticsServiceImpl} 의 5개 SimpleJdbcCall
 * 호출이 모두 {@code .withCatalogName(dbSchemaName)} 만 명시하고
 * {@code .withSchemaName(...)} 은 호출하지 않는지 검증한다.
 *
 * <p><b>회귀 방지 대상</b>: 2026-06-11 ~ 2026-06-14 운영 매일 00:01·00:03·00:05 통계 배치 실패
 * (cron 3종: {@code UpdateAllBranchDailyStatistics}, {@code UpdateAllConsultantPerformance},
 * {@code DailyPerformanceMonitoring}). 06-11 PR #217 의 {@code .withCatalogName(dbSchemaName)}
 * 추가가 05-26 hotfix 의 {@code .withSchemaName(dbSchemaName)} 잔존과 결합해 Spring
 * {@code CallMetaDataContext.createCallString()} 이
 * {@code {call core_solution.core_solution.<PROC>(?)}} 3단계 prefix SQL 을 생성 → MySQL bad SQL
 * grammar.
 *
 * <p>본 회귀 가드는 hotfix 이후로도 어떤 PR 이든 {@code .withSchemaName(...)} 을 다시 추가하면
 * 즉시 빌드 실패하도록 보장한다.
 *
 * <p>Mockito {@code mockConstruction} 으로 {@code SimpleJdbcCall} 생성을 가로채고
 * 체인 호출({@code withCatalogName}, {@code withProcedureName}) 인자를 verify 하며,
 * {@code withSchemaName} 은 {@code never()} 로 호출되지 않음을 검증한다.
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PlSqlStatisticsServiceImpl SimpleJdbcCall.withCatalogName(dbSchemaName) 명시 + withSchemaName 미사용 회귀 가드")
class PlSqlStatisticsServiceImplCatalogTest {

    private static final String UT_TENANT = "ut-tenant-plsql-statistics-catalog";
    private static final String UT_SCHEMA = "core_solution";
    private static final LocalDate STAT_DATE = LocalDate.of(2026, 6, 11);

    private DataSource dataSource;
    private JdbcTemplate jdbcTemplate;
    private PlSqlStatisticsServiceImpl service;

    @BeforeEach
    void setUp() {
        dataSource = Mockito.mock(DataSource.class);
        jdbcTemplate = Mockito.mock(JdbcTemplate.class);
        service = new PlSqlStatisticsServiceImpl(dataSource, jdbcTemplate);
        ReflectionTestUtils.setField(service, "dbSchemaName", UT_SCHEMA);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    /**
     * 모든 chained method 가 자기 자신을 반환하도록 {@link Mockito#RETURNS_SELF} 를 사용하고,
     * {@code execute(Map)} 는 호출별로 별도 stubbing 한다.
     */
    private MockedConstruction<SimpleJdbcCall> mockSimpleJdbcCallConstruction(
            Map<String, Object> executeResult) {
        return Mockito.mockConstruction(
                SimpleJdbcCall.class,
                Mockito.withSettings().defaultAnswer(RETURNS_SELF),
                (mock, context) -> when(mock.execute(any(Map.class))).thenReturn(executeResult));
    }

    @Test
    @DisplayName("updateDailyStatistics: withCatalogName 명시 + withSchemaName 미호출 (3단계 prefix 회귀 차단)")
    void updateDailyStatistics_specifiesCatalogOnly() {
        TenantContextHolder.setTenantId(UT_TENANT);
        Map<String, Object> executeResult = new HashMap<>();
        executeResult.put("p_success", Boolean.TRUE);
        executeResult.put("p_message", "ok");

        try (MockedConstruction<SimpleJdbcCall> mocked = mockSimpleJdbcCallConstruction(executeResult)) {
            String result = service.updateDailyStatistics(null, STAT_DATE);

            assertThat(mocked.constructed()).hasSize(1);
            SimpleJdbcCall constructed = mocked.constructed().get(0);
            verify(constructed).withCatalogName(UT_SCHEMA);
            verify(constructed, never()).withSchemaName(any());
            verify(constructed).withProcedureName("UpdateDailyStatistics");
            assertThat(result).startsWith("SUCCESS");
        }
    }

    @Test
    @DisplayName("updateAllBranchDailyStatistics: withCatalogName 명시 + withSchemaName 미호출 ★ P0 핵심")
    void updateAllBranchDailyStatistics_specifiesCatalogOnly() {
        // isProcedureAvailable 는 별도 jdbcTemplate.queryForObject 호출 → mock true 반환
        when(jdbcTemplate.queryForObject(any(String.class), any(Class.class))).thenReturn(3);

        try (MockedConstruction<SimpleJdbcCall> mocked = mockSimpleJdbcCallConstruction(new HashMap<>())) {
            String result = service.updateAllBranchDailyStatistics(STAT_DATE);

            assertThat(mocked.constructed()).hasSize(1);
            SimpleJdbcCall constructed = mocked.constructed().get(0);
            verify(constructed).withCatalogName(UT_SCHEMA);
            verify(constructed, never()).withSchemaName(any());
            verify(constructed).withProcedureName("UpdateAllBranchDailyStatistics");
            assertThat(result).startsWith("SUCCESS");
        }
    }

    @Test
    @DisplayName("updateConsultantPerformance: withCatalogName 명시 + withSchemaName 미호출")
    void updateConsultantPerformance_specifiesCatalogOnly() {
        TenantContextHolder.setTenantId(UT_TENANT);
        Map<String, Object> executeResult = new HashMap<>();
        executeResult.put("p_success", Boolean.TRUE);
        executeResult.put("p_message", "ok");

        try (MockedConstruction<SimpleJdbcCall> mocked = mockSimpleJdbcCallConstruction(executeResult)) {
            String result = service.updateConsultantPerformance(123L, STAT_DATE);

            assertThat(mocked.constructed()).hasSize(1);
            SimpleJdbcCall constructed = mocked.constructed().get(0);
            verify(constructed).withCatalogName(UT_SCHEMA);
            verify(constructed, never()).withSchemaName(any());
            verify(constructed).withProcedureName("UpdateConsultantPerformance");
            assertThat(result).startsWith("SUCCESS");
        }
    }

    @Test
    @DisplayName("updateAllConsultantPerformance: withCatalogName 명시 + withSchemaName 미호출")
    void updateAllConsultantPerformance_specifiesCatalogOnly() {
        try (MockedConstruction<SimpleJdbcCall> mocked = mockSimpleJdbcCallConstruction(new HashMap<>())) {
            String result = service.updateAllConsultantPerformance(STAT_DATE);

            assertThat(mocked.constructed()).hasSize(1);
            SimpleJdbcCall constructed = mocked.constructed().get(0);
            verify(constructed).withCatalogName(UT_SCHEMA);
            verify(constructed, never()).withSchemaName(any());
            verify(constructed).withProcedureName("UpdateAllConsultantPerformance");
            assertThat(result).startsWith("SUCCESS");
        }
    }

    @Test
    @DisplayName("performDailyPerformanceMonitoring: withCatalogName 명시 + withSchemaName 미호출 ★ P0 핵심")
    void performDailyPerformanceMonitoring_specifiesCatalogOnly() {
        TenantContextHolder.setTenantId(UT_TENANT);
        Map<String, Object> executeResult = new HashMap<>();
        executeResult.put("p_alert_count", Integer.valueOf(7));
        executeResult.put("p_success", Boolean.TRUE);
        executeResult.put("p_message", "ok");

        try (MockedConstruction<SimpleJdbcCall> mocked = mockSimpleJdbcCallConstruction(executeResult)) {
            int alertCount = service.performDailyPerformanceMonitoring(STAT_DATE);

            assertThat(mocked.constructed()).hasSize(1);
            SimpleJdbcCall constructed = mocked.constructed().get(0);
            verify(constructed).withCatalogName(UT_SCHEMA);
            verify(constructed, never()).withSchemaName(any());
            verify(constructed).withProcedureName("DailyPerformanceMonitoring");
            assertThat(alertCount).isEqualTo(7);
        }
    }

    @Test
    @DisplayName("dbSchemaName 기본값(@Value 미주입) 도 core_solution — P0 회귀 차단")
    void dbSchemaName_defaultsToCoreSolution() {
        PlSqlStatisticsServiceImpl freshService =
                new PlSqlStatisticsServiceImpl(dataSource, jdbcTemplate);
        Object dbSchemaName = ReflectionTestUtils.getField(freshService, "dbSchemaName");
        assertThat(dbSchemaName).isEqualTo("core_solution");
    }
}
