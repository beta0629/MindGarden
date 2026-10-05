package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.sql.Connection;
import java.util.Collections;
import java.util.Optional;
import java.util.concurrent.Executor;
import javax.sql.DataSource;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.domain.onboarding.RiskLevel;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.billing.TenantSubscriptionRepository;
import com.coresolution.core.repository.onboarding.OnboardingRequestRepository;
import com.coresolution.core.security.PasswordService;
import com.coresolution.core.service.AutoApprovalService;
import com.coresolution.core.service.BrandingService;
import com.coresolution.core.service.OnboardingApprovalService;
import com.coresolution.core.service.OnboardingErrorHandlingService;
import com.coresolution.core.service.OnboardingPreValidationService;
import com.coresolution.core.service.PermissionGroupService;
import com.coresolution.core.service.TenantDashboardService;
import com.coresolution.core.service.TenantIdGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 유효한 승인은 한 트랜잭션에서 커밋되고, 실제 실패는 승인으로 남지 않으며 사유를 돌려준다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
class OnboardingDecisionRollbackOnlyTest {

    private static final Long REQUEST_ID = 88L;
    private static final String TENANT_ID = "tenant-rollback";

    private final OnboardingRequestRepository repository = mock(OnboardingRequestRepository.class);
    private final OnboardingApprovalService approvalService = mock(OnboardingApprovalService.class);
    private final OnboardingErrorHandlingService errorHandlingService =
            mock(OnboardingErrorHandlingService.class);
    private final ApplicationContext applicationContext = mock(ApplicationContext.class);
    private final DataSource dataSource = mock(DataSource.class);
    private final Connection connection = mock(Connection.class);

    private OnboardingServiceImpl decideProxy;

    @BeforeEach
    void setUp() throws Exception {
        lenient().when(connection.getAutoCommit()).thenReturn(true);
        lenient().when(dataSource.getConnection()).thenReturn(connection);
        PlatformTransactionManager transactionManager =
                new org.springframework.jdbc.datasource.DataSourceTransactionManager(dataSource);

        OnboardingPreValidationService preValidationService = mock(OnboardingPreValidationService.class);
        OnboardingPreValidationService.ValidationResult ok =
                new OnboardingPreValidationService.ValidationResult(true, Collections.emptyMap(),
                        Collections.emptyMap());
        lenient().when(preValidationService.validateBeforeApproval(any(Long.class))).thenReturn(ok);
        lenient().when(preValidationService.validateSystemMetadata(anyString())).thenReturn(ok);

        AutoApprovalService autoApprovalService = mock(AutoApprovalService.class);
        lenient().when(autoApprovalService.canAutoApprove(any(OnboardingRequest.class))).thenReturn(false);
        lenient().when(autoApprovalService.checkAutoApprovalConditions(any(OnboardingRequest.class)))
                .thenReturn(new AutoApprovalService.AutoApprovalResult(false, "unit-test",
                        RiskLevel.LOW, false, false, true));

        TenantRepository tenantRepository = mock(TenantRepository.class);
        lenient().when(tenantRepository.findDeletedByContactEmailIgnoreCase(anyString()))
                .thenReturn(Collections.emptyList());

        PasswordService passwordService = mock(PasswordService.class);
        lenient().when(passwordService.encodePassword(anyString())).thenReturn("$2a$10$stubEncodedPassword");

        lenient().when(errorHandlingService.executeWithRetry(any(), anyInt(), anyLong()))
                .thenAnswer(invocation -> {
                    OnboardingErrorHandlingService.OnboardingProcess process = invocation.getArgument(0);
                    try {
                        process.execute();
                        return OnboardingErrorHandlingService.ExecutionResult.success(1);
                    } catch (Exception exception) {
                        return OnboardingErrorHandlingService.ExecutionResult.failure(1, exception,
                                exception.getMessage());
                    }
                });

        OnboardingServiceImpl target = new OnboardingServiceImpl(repository, approvalService,
                autoApprovalService, mock(TenantSubscriptionRepository.class), mock(TenantIdGenerator.class),
                mock(TenantDashboardService.class), tenantRepository, mock(BrandingService.class),
                passwordService, new ObjectMapper(), mock(CommonCodeService.class),
                mock(CommonCodeRepository.class), preValidationService, errorHandlingService,
                mock(AccountingService.class), mock(PermissionGroupService.class),
                mock(TenantRoleRepository.class), applicationContext, mock(EmailService.class),
                mock(JdbcTemplate.class), transactionManager, mock(Executor.class));

        ProxyFactory proxyFactory = new ProxyFactory(target);
        proxyFactory.setProxyTargetClass(true);
        proxyFactory.addAdvice(new TransactionInterceptor(transactionManager,
                new AnnotationTransactionAttributeSource()));
        decideProxy = (OnboardingServiceImpl) proxyFactory.getProxy();
        lenient().when(applicationContext.getBean(OnboardingServiceImpl.class)).thenReturn(decideProxy);
    }

    @Test
    @DisplayName("rollback-only 인 승인 실패는 사유를 던지고 테넌트·결정을 커밋하지 않는다")
    void rollbackOnlyFailureStaysUnapprovedWithReason() throws Exception {
        OnboardingRequest request = pendingRequest();
        when(repository.findActiveById(REQUEST_ID)).thenReturn(Optional.of(request));
        when(approvalService.processOnboardingApproval(any(Long.class), anyString(), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), nullable(String.class)))
                        .thenAnswer(invocation -> {
                            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
                            throw new RuntimeException("역할 템플릿 적용 실패");
                        });

        assertThatThrownBy(() -> decideProxy.decide(REQUEST_ID, OnboardingStatus.APPROVED, "ops-actor", "승인"))
                .isInstanceOf(OnboardingApprovalBlockedException.class)
                .hasMessageContaining("역할 템플릿 적용 실패");

        assertThat(request.getStatus()).isEqualTo(OnboardingStatus.PENDING);
        verify(repository, never()).save(any(OnboardingRequest.class));
        verify(connection, atLeastOnce()).rollback();
        verify(connection, never()).commit();
        verify(dataSource, times(1)).getConnection();
        assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
    }

    @Test
    @DisplayName("프로시저가 실패를 반환하면 승인으로 커밋하지 않고 그 사유를 돌려준다")
    void procedureFailureRollsBackWithoutPartialCommit() throws Exception {
        OnboardingRequest request = pendingRequest();
        when(repository.findActiveById(REQUEST_ID)).thenReturn(Optional.of(request));
        java.util.Map<String, Object> approvalResult = new java.util.HashMap<>();
        approvalResult.put("success", false);
        approvalResult.put("message", "Unknown column 'username' in 'field list'");
        when(approvalService.processOnboardingApproval(any(Long.class), anyString(), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), nullable(String.class)))
                        .thenReturn(approvalResult);

        assertThatThrownBy(() -> decideProxy.decide(REQUEST_ID, OnboardingStatus.APPROVED, "ops-actor", "승인"))
                .isInstanceOf(OnboardingApprovalBlockedException.class)
                .hasMessageContaining("username");

        assertThat(request.getStatus()).isEqualTo(OnboardingStatus.PENDING);
        verify(repository, never()).save(any(OnboardingRequest.class));
        verify(connection).rollback();
        verify(connection, never()).commit();
        verify(dataSource, times(1)).getConnection();
    }

    @Test
    @DisplayName("성공한 결정은 같은 트랜잭션에서 승인으로 커밋되고 보류 재저장을 열지 않는다")
    void successfulDecisionCommitsWithoutHoldRecovery() throws Exception {
        OnboardingRequest request = pendingRequest();
        when(repository.findActiveById(REQUEST_ID)).thenReturn(Optional.of(request));
        when(repository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_ID, REQUEST_ID))
                .thenReturn(Optional.of(request));
        when(repository.save(any(OnboardingRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        java.util.Map<String, Object> approvalResult = new java.util.HashMap<>();
        approvalResult.put("success", true);
        approvalResult.put("message", "온보딩 승인 완료");
        when(approvalService.processOnboardingApproval(any(Long.class), anyString(), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), nullable(String.class)))
                        .thenReturn(approvalResult);

        OnboardingRequest result =
                decideProxy.decide(REQUEST_ID, OnboardingStatus.APPROVED, "ops-actor", "승인");

        assertThat(result.getStatus()).isEqualTo(OnboardingStatus.APPROVED);
        verify(approvalService, times(1)).processOnboardingApproval(any(Long.class), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), anyString(), nullable(String.class));
        verify(connection).commit();
        verify(connection, never()).rollback();
        verify(dataSource, times(1)).getConnection();
    }

    private static OnboardingRequest pendingRequest() {
        return OnboardingRequest.builder().id(REQUEST_ID).tenantId(TENANT_ID).tenantName("검증 테넌트")
                .requestedBy("applicant@example.com").riskLevel(RiskLevel.LOW)
                .checklistJson("{\"checklist\":[],\"adminPassword\":\"ValidPass123!\",\"contactEmail\":\"applicant@example.com\"}")
                .businessType("CONSULTATION").status(OnboardingStatus.PENDING).isDeleted(false).build();
    }
}
