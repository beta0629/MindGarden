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
 * B10 회귀 가드 (2026-06-14): {@link PlSqlScheduleValidationServiceImpl} 의 모든
 * {@link SimpleJdbcCall} 생성부가 {@code .withCatalogName(dbSchemaName)} 만 명시하고
 * {@code .withSchemaName(...)} 은 호출하지 않는지 검증한다.
 *
 * <p>다중 DB(core_solution + mind_garden) 환경에서 동명 프로시저로 인한 메타데이터 충돌
 * (Spring {@code CallMetaDataContext} 시그니처 모호) 을 차단한다. PR-A hotfix
 * ({@link PlSqlStatisticsServiceImplCatalogTest}) 와 동일한 패턴.</p>
 *
 * @author MindGarden
 * @since 2026-06-14
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PlSqlScheduleValidationServiceImpl SimpleJdbcCall.withCatalogName(dbSchemaName) 명시 + withSchemaName 미사용 회귀 가드")
class PlSqlScheduleValidationServiceImplCatalogTest {

    private static final String UT_TENANT = "ut-tenant-schedule-validation-catalog";
    private static final String UT_SCHEMA = "core_solution";
    private static final LocalDate SESSION_DATE = LocalDate.of(2026, 6, 14);

    private JdbcTemplate jdbcTemplate;
    private PlSqlScheduleValidationServiceImpl service;

    @BeforeEach
    void setUp() {
        jdbcTemplate = Mockito.mock(JdbcTemplate.class);
        service = new PlSqlScheduleValidationServiceImpl(jdbcTemplate);
        ReflectionTestUtils.setField(service, "dbSchemaName", UT_SCHEMA);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private MockedConstruction<SimpleJdbcCall> mockSimpleJdbcCallConstruction(
            Map<String, Object> executeResult) {
        return Mockito.mockConstruction(
                SimpleJdbcCall.class,
                Mockito.withSettings().defaultAnswer(RETURNS_SELF),
                (mock, context) -> when(mock.execute(any(Map.class))).thenReturn(executeResult));
    }

    @Test
    @DisplayName("validateConsultationRecordBeforeCompletion: withCatalogName 명시 + withSchemaName 미호출")
    void validateConsultationRecordBeforeCompletion_specifiesCatalogOnly() {
        TenantContextHolder.setTenantId(UT_TENANT);
        Map<String, Object> executeResult = new HashMap<>();
        executeResult.put("p_has_record", Boolean.TRUE);
        executeResult.put("p_message", "ok");

        try (MockedConstruction<SimpleJdbcCall> mocked = mockSimpleJdbcCallConstruction(executeResult)) {
            Map<String, Object> result = service.validateConsultationRecordBeforeCompletion(
                    1L, 2L, SESSION_DATE);

            assertThat(mocked.constructed()).hasSize(1);
            SimpleJdbcCall constructed = mocked.constructed().get(0);
            verify(constructed).withCatalogName(UT_SCHEMA);
            verify(constructed, never()).withSchemaName(any());
            verify(constructed).withProcedureName("ValidateConsultationRecordBeforeCompletion");
            assertThat(result.get("success")).isEqualTo(Boolean.TRUE);
        }
    }

    @Test
    @DisplayName("processScheduleAutoCompletion: withCatalogName 명시 + withSchemaName 미호출")
    void processScheduleAutoCompletion_specifiesCatalogOnly() {
        TenantContextHolder.setTenantId(UT_TENANT);
        Map<String, Object> executeResult = new HashMap<>();
        executeResult.put("p_completed", Boolean.TRUE);
        executeResult.put("p_message", "ok");

        try (MockedConstruction<SimpleJdbcCall> mocked = mockSimpleJdbcCallConstruction(executeResult)) {
            Map<String, Object> result = service.processScheduleAutoCompletion(
                    1L, 2L, SESSION_DATE, false);

            assertThat(mocked.constructed()).hasSize(1);
            SimpleJdbcCall constructed = mocked.constructed().get(0);
            verify(constructed).withCatalogName(UT_SCHEMA);
            verify(constructed, never()).withSchemaName(any());
            verify(constructed).withProcedureName("ProcessScheduleAutoCompletion");
            assertThat(result.get("success")).isEqualTo(Boolean.TRUE);
        }
    }

    @Test
    @DisplayName("processBatchScheduleCompletion: withCatalogName 명시 + withSchemaName 미호출 ★ cron 배치")
    void processBatchScheduleCompletion_specifiesCatalogOnly() {
        TenantContextHolder.setTenantId(UT_TENANT);
        Map<String, Object> executeResult = new HashMap<>();
        executeResult.put("p_processed_count", 0);
        executeResult.put("p_completed_count", 0);
        executeResult.put("p_reminder_count", 0);
        executeResult.put("p_message", "ok");

        try (MockedConstruction<SimpleJdbcCall> mocked = mockSimpleJdbcCallConstruction(executeResult)) {
            Map<String, Object> result = service.processBatchScheduleCompletion(null);

            assertThat(mocked.constructed()).hasSize(1);
            SimpleJdbcCall constructed = mocked.constructed().get(0);
            verify(constructed).withCatalogName(UT_SCHEMA);
            verify(constructed, never()).withSchemaName(any());
            verify(constructed).withProcedureName("ProcessBatchScheduleCompletion");
            assertThat(result.get("success")).isEqualTo(Boolean.TRUE);
        }
    }

    @Test
    @DisplayName("dbSchemaName 기본값(@Value 미주입)도 core_solution — P0 회귀 차단")
    void dbSchemaName_defaultsToCoreSolution() {
        PlSqlScheduleValidationServiceImpl freshService =
                new PlSqlScheduleValidationServiceImpl(jdbcTemplate);
        Object dbSchemaName = ReflectionTestUtils.getField(freshService, "dbSchemaName");
        assertThat(dbSchemaName).isEqualTo("core_solution");
    }
}
