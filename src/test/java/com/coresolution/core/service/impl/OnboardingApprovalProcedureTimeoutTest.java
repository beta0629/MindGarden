package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Map;
import javax.sql.DataSource;
import com.coresolution.consultation.util.OAuth2DomainUtil;
import com.coresolution.core.repository.RoleTemplateRepository;
import com.coresolution.core.repository.onboarding.OnboardingRequestRepository;
import com.coresolution.consultation.converter.PersonalDataEncryptionContextHolder;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.service.TenantDashboardService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import jakarta.persistence.EntityManager;

/**
 * ProcessOnboardingApproval 이 결정 스레드에서 프록시 창보다 긴 statement 로 기다리지 않는지 확인한다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
@ExtendWith(MockitoExtension.class)
class OnboardingApprovalProcedureTimeoutTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private RoleTemplateRepository roleTemplateRepository;

    @Mock
    private EntityManager entityManager;

    @Mock
    private OnboardingRequestRepository onboardingRequestRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ApplicationContext applicationContext;

    @Mock
    private Environment environment;

    @Mock
    private PlatformTransactionManager transactionManager;

    @Mock
    private TenantDashboardService tenantDashboardService;

    @Mock
    private OAuth2DomainUtil oauth2DomainUtil;

    @InjectMocks
    private OnboardingApprovalServiceImpl approvalService;

    @Mock
    private DataSource dataSource;

    @Mock
    private Connection connection;

    @Mock
    private Statement statement;

    @Mock
    private CallableStatement callableStatement;

    @Mock
    private ResultSet resultSet;

    @AfterEach
    void tearDown() {
        OnboardingDecisionDeadline.close();
        ReflectionTestUtils.setField(PersonalDataEncryptionContextHolder.class, "instance", null);
    }

    @Test
    @DisplayName("프로시저 statement 가 타임아웃되면 Java fallback 없이 실패를 반환한다")
    void procedureTimeoutReturnsWithoutFallback() throws Exception {
        stubConnection();
        when(callableStatement.execute()).thenThrow(new SQLException(
                "Statement cancelled due to timeout or client request", "HY000", 0));

        Map<String, Object> result = approvalService.processOnboardingApproval(77L, "tenant-77",
                "검증 테넌트", "COUNSELING", "ops-actor", "승인", "admin@example.com",
                "$2a$10$stubEncodedPassword", "tenant-77");

        assertThat(result.get("success")).isEqualTo(false);
        assertThat(String.valueOf(result.get("message"))).contains("Statement cancelled due to timeout");
        assertThat(OnboardingDecisionDeadline.isHalted(result)).isTrue();
        verify(connection).prepareCall(contains("ProcessOnboardingApproval"));
        verify(callableStatement).setQueryTimeout(
                OnboardingDecisionDeadline.PROCEDURE_STATEMENT_TIMEOUT_SECONDS);
        verify(transactionManager, never()).getTransaction(any());
    }

    @Test
    @DisplayName("응답 예산이 지난 프로시저 실패는 긴 Java fallback 으로 넘어가지 않는다")
    void expiredBudgetReturnsProcedureFailure() throws Exception {
        OnboardingDecisionDeadline.bindDeadlineEpochMillis(System.currentTimeMillis() - 1_000L);
        stubConnection();
        when(callableStatement.execute()).thenReturn(false);
        when(callableStatement.getBoolean(12)).thenReturn(false);
        when(callableStatement.getString(13)).thenReturn("역할 템플릿 적용 실패");

        Map<String, Object> result = approvalService.processOnboardingApproval(78L, "tenant-78",
                "검증 테넌트", "COUNSELING", "ops-actor", "승인", "admin@example.com",
                "$2a$10$stubEncodedPassword", "tenant-78");

        assertThat(result.get("success")).isEqualTo(false);
        assertThat(String.valueOf(result.get("message"))).contains("역할 템플릿 적용 실패");
        verify(connection).prepareCall(
                eq("{CALL ProcessOnboardingApproval(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}"));
        verify(callableStatement).setString(10, ".dev.core-solution.co.kr");
        verify(callableStatement).setQueryTimeout(1);
        verify(transactionManager, never()).getTransaction(any());
    }

    private void stubConnection() throws SQLException {
        PersonalDataEncryptionUtil encryptionUtil = mock(PersonalDataEncryptionUtil.class);
        when(encryptionUtil.safeEncrypt(anyString())).thenReturn("k1::QUJDRA");
        ReflectionTestUtils.setField(PersonalDataEncryptionContextHolder.class, "instance", encryptionUtil);
        when(jdbcTemplate.getDataSource()).thenReturn(dataSource);
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.execute(anyString())).thenReturn(false);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        when(resultSet.next()).thenReturn(false);
        when(connection.prepareCall(anyString())).thenReturn(callableStatement);
        when(applicationContext.getEnvironment()).thenReturn(environment);
        when(environment.getActiveProfiles()).thenReturn(new String[] {"dev"});
        when(oauth2DomainUtil.resolveEnvironmentTenantDomainSuffix(any(String[].class)))
                .thenReturn(".dev.core-solution.co.kr");
    }
}
