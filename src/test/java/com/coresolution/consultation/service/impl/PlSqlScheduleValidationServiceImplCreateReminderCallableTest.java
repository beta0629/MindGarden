package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.Statement;
import java.sql.Types;
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
 * {@link PlSqlScheduleValidationServiceImpl#createConsultationRecordReminder} 가
 * MySQL 표준 시그니처(8 IN + 3 OUT, 총 11자리)로 {@link CallableStatement}를 준비하는지 검증한다.
 *
 * @author CoreSolution
 * @since 2026-05-13
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PlSqlScheduleValidationServiceImpl 상담일지 리마인더 Callable 계약")
class PlSqlScheduleValidationServiceImplCreateReminderCallableTest {

    private static final String UT_TENANT = "ut-tenant-plsql-reminder";

    private static final String EXPECTED_CALL =
            "{CALL CreateConsultationRecordReminder(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}";

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

    private PlSqlScheduleValidationServiceImpl service;

    @BeforeEach
    void setUp() throws Exception {
        TenantContextHolder.setTenantId(UT_TENANT);
        when(jdbcTemplate.getDataSource()).thenReturn(dataSource);
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareCall(EXPECTED_CALL)).thenReturn(callableStatement);
        when(connection.createStatement()).thenReturn(utf8Statement);
        lenient().when(utf8Statement.execute(anyString())).thenReturn(false);
        when(jdbcTemplate.queryForObject(
                contains("information_schema.routines"),
                eq(Integer.class),
                eq("CreateConsultationRecordReminder")))
                .thenReturn(1);
        service = new PlSqlScheduleValidationServiceImpl(jdbcTemplate);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("CreateConsultationRecordReminder: 11 placeholders 및 OUT 9–11 등록")
    void createConsultationRecordReminder_usesElevenParameterCallableSignature() throws Exception {
        when(callableStatement.getObject(9)).thenReturn(Boolean.TRUE);
        when(callableStatement.getString(10)).thenReturn("상담일지 미작성 알림이 생성되었습니다.");
        when(callableStatement.getLong(11)).thenReturn(99L);
        when(callableStatement.wasNull()).thenReturn(false);

        Map<String, Object> result = service.createConsultationRecordReminder(
                1L, 2L, 3L, LocalDate.of(2026, 5, 13), "테스트 제목");

        verify(connection).prepareCall(EXPECTED_CALL);
        assertThat(countPlaceholders(EXPECTED_CALL)).isEqualTo(11);

        verify(callableStatement).registerOutParameter(9, Types.BOOLEAN);
        verify(callableStatement).registerOutParameter(10, Types.VARCHAR);
        verify(callableStatement).registerOutParameter(11, Types.BIGINT);

        assertThat(result)
                .containsEntry("success", true)
                .containsEntry("reminderId", 99L)
                .containsEntry("message", "상담일지 미작성 알림이 생성되었습니다.");
    }

    private static int countPlaceholders(String sql) {
        int n = 0;
        for (int i = 0; i < sql.length(); i++) {
            if (sql.charAt(i) == '?') {
                n++;
            }
        }
        return n;
    }
}
