package com.coresolution.core.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.domain.onboarding.RiskLevel;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.repository.billing.TenantSubscriptionRepository;
import com.coresolution.core.repository.onboarding.OnboardingRequestRepository;
import com.coresolution.core.service.impl.OnboardingServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;
import com.coresolution.core.security.PasswordService;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * OnboardingService 단위 테스트
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OnboardingService 단위 테스트")
class OnboardingServiceTest {

    @Mock
    private OnboardingRequestRepository repository;

    @Mock
    private OnboardingApprovalService approvalService;

    @Mock
    private AutoApprovalService autoApprovalService;

    @Mock
    private TenantSubscriptionRepository subscriptionRepository;

    @Mock
    private OnboardingPreValidationService preValidationService;

    @Mock
    private OnboardingErrorHandlingService errorHandlingService;

    @Mock
    private ApplicationContext applicationContext;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private PasswordService passwordService;

    /** 워크플로에서 getBean으로 조회되는 온보딩 서비스(초기화 단계 스텁용) */
    @Mock
    private OnboardingServiceImpl onboardingWorkflowBean;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private OnboardingServiceImpl onboardingService;

    private OnboardingRequest testRequest;
    private String testTenantId;
    private String testTenantName;
    private String testBusinessType;
    private Long testId;

    @BeforeEach
    void setUp() {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.initSynchronization();
        }

        testTenantId = "test-tenant-123";
        testTenantName = "테스트 테넌트";
        testBusinessType = "ACADEMY";
        testId = 42L;

        testRequest = OnboardingRequest.builder().id(testId).tenantId(testTenantId)
                .tenantName(testTenantName).requestedBy("test-requester").riskLevel(RiskLevel.LOW)
                .checklistJson("{\"checklist\":[],\"adminPassword\":\"ValidPass123!\"}")
                .businessType(testBusinessType).status(OnboardingStatus.PENDING).isDeleted(false)
                .build();

        OnboardingPreValidationService.ValidationResult ok =
                new OnboardingPreValidationService.ValidationResult(true, Collections.emptyMap(),
                        Collections.emptyMap());
        lenient().when(autoApprovalService.canAutoApprove(any(OnboardingRequest.class)))
                .thenReturn(false);
        lenient().when(autoApprovalService.checkAutoApprovalConditions(any(OnboardingRequest.class)))
                .thenReturn(new AutoApprovalService.AutoApprovalResult(false, "unit-test",
                        RiskLevel.LOW, false, false, true));
        lenient().when(preValidationService.validateBeforeApproval(any(Long.class))).thenReturn(ok);
        lenient().when(preValidationService.validateSystemMetadata(anyString())).thenReturn(ok);
        lenient().when(tenantRepository.findDeletedByContactEmailIgnoreCase(anyString()))
                .thenReturn(Collections.emptyList());
        lenient().when(passwordService.encodePassword(anyString())).thenReturn("$2a$10$stubEncodedPassword");
        lenient().when(applicationContext.getBean(OnboardingServiceImpl.class))
                .thenReturn(onboardingWorkflowBean);
        lenient()
                .doReturn("{}")
                .when(onboardingWorkflowBean)
                .initializeTenantAfterOnboardingInNewTransaction(anyString(), anyString(), anyString(),
                        any(Long.class));
        lenient()
                .doNothing()
                .when(onboardingWorkflowBean)
                .saveInitializationStatusInNewTransaction(any(Long.class), anyString(), anyString());

        lenient().when(errorHandlingService.executeWithRetry(any(), anyInt(), anyLong()))
                .thenAnswer(invocation -> {
                    OnboardingErrorHandlingService.OnboardingProcess process =
                            invocation.getArgument(0);
                    try {
                        process.execute();
                        return OnboardingErrorHandlingService.ExecutionResult.success(1);
                    } catch (Exception e) {
                        return OnboardingErrorHandlingService.ExecutionResult.failure(1, e,
                                e.getMessage());
                    }
                });
    }

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    @DisplayName("대기 중인 온보딩 요청 목록 조회 - 성공")
    void testFindPending_Success() {
        List<OnboardingRequest> pendingRequests = List.of(testRequest);
        when(repository.findByStatusOrderByCreatedAtDesc(OnboardingStatus.PENDING))
                .thenReturn(pendingRequests);

        List<OnboardingRequest> result = onboardingService.findPending();

        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(OnboardingStatus.PENDING);
    }

    @Test
    @DisplayName("온보딩 요청 ID로 조회 - 성공")
    void testGetById_Success() {
        when(repository.findActiveById(testId)).thenReturn(Optional.of(testRequest));

        OnboardingRequest result = onboardingService.getById(testId);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(testId);
        assertThat(result.getTenantId()).isEqualTo(testTenantId);
    }

    @Test
    @DisplayName("온보딩 요청 ID로 조회 - 없음")
    void testGetById_NotFound() {
        Long nonExistentId = 999_999L;
        when(repository.findActiveById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> onboardingService.getById(nonExistentId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("온보딩 요청을 찾을 수 없습니다");
    }

    @Test
    @DisplayName("온보딩 요청 생성 - 성공")
    void testCreate_Success() {
        when(repository.save(any(OnboardingRequest.class))).thenReturn(testRequest);

        OnboardingRequest result = onboardingService.create(testTenantId, testTenantName,
                "test-requester", RiskLevel.LOW, "{\"checklist\": []}", testBusinessType);

        assertThat(result).isNotNull();
        assertThat(result.getTenantId()).isEqualTo(testTenantId);
        assertThat(result.getTenantName()).isEqualTo(testTenantName);
        assertThat(result.getStatus()).isEqualTo(OnboardingStatus.PENDING);
        verify(repository, times(1)).save(any(OnboardingRequest.class));
    }

    @Test
    @DisplayName("온보딩 요청 결정 - 승인")
    void testDecide_Approved() {
        when(repository.findActiveById(testId)).thenReturn(Optional.of(testRequest));
        when(repository.findByTenantIdAndIdAndIsDeletedFalse(testTenantId, testId))
                .thenReturn(Optional.of(testRequest));
        when(repository.save(any(OnboardingRequest.class))).thenAnswer(invocation -> {
            OnboardingRequest request = invocation.getArgument(0);
            return request;
        });

        java.util.Map<String, Object> approvalResult = new java.util.HashMap<>();
        approvalResult.put("success", true);
        approvalResult.put("message", "온보딩 승인 완료");
        when(approvalService.processOnboardingApproval(any(Long.class), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), anyString(), nullable(String.class)))
                        .thenReturn(approvalResult);

        OnboardingRequest result =
                onboardingService.decide(testId, OnboardingStatus.APPROVED, "test-admin", "테스트 승인");

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(OnboardingStatus.APPROVED);
        assertThat(result.getDecidedBy()).isEqualTo("test-admin");
        assertThat(result.getDecisionNote()).isEqualTo("테스트 승인");
        verify(repository, atLeastOnce()).save(any(OnboardingRequest.class));
        verify(approvalService, times(1)).processOnboardingApproval(any(Long.class), anyString(),
                anyString(), anyString(), anyString(), anyString(), anyString(), anyString(),
                nullable(String.class));
    }

    @Test
    @DisplayName("온보딩 승인 - 연락 이메일은 있으나 adminPassword 없으면 ON_HOLD")
    void testDecide_Approved_missingAdminPassword_onHold() {
        OnboardingRequest noPw = OnboardingRequest.builder().id(testId).tenantId(testTenantId)
                .tenantName(testTenantName).requestedBy("test-requester").riskLevel(RiskLevel.LOW)
                .checklistJson("{\"checklist\":[]}").businessType(testBusinessType)
                .status(OnboardingStatus.PENDING).isDeleted(false).build();

        when(repository.findActiveById(testId)).thenReturn(Optional.of(noPw));
        when(repository.save(any(OnboardingRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        OnboardingRequest result = onboardingService.decide(testId, OnboardingStatus.APPROVED,
                "test-admin", "승인 시도");

        assertThat(result.getStatus()).isEqualTo(OnboardingStatus.ON_HOLD);
        assertThat(result.getDecisionNote()).contains("승인 중단");
        verify(approvalService, times(0)).processOnboardingApproval(any(), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), anyString(), nullable(String.class));
    }

    @Test
    @DisplayName("온보딩 요청 결정 - 거부")
    void testDecide_Rejected() {
        when(repository.findActiveById(testId)).thenReturn(Optional.of(testRequest));
        when(repository.findByTenantIdAndIdAndIsDeletedFalse(testTenantId, testId))
                .thenReturn(Optional.of(testRequest));
        when(repository.save(any(OnboardingRequest.class))).thenReturn(testRequest);

        OnboardingRequest result =
                onboardingService.decide(testId, OnboardingStatus.REJECTED, "test-admin", "테스트 거부");

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(OnboardingStatus.REJECTED);
        assertThat(result.getDecidedBy()).isEqualTo("test-admin");
        assertThat(result.getDecisionNote()).isEqualTo("테스트 거부");
        verify(repository, times(1)).save(any(OnboardingRequest.class));
    }

    @Test
    @DisplayName("상태별 온보딩 요청 개수 조회 - 성공")
    void testCountByStatus_Success() {
        when(repository.countByStatus(OnboardingStatus.PENDING)).thenReturn(5L);

        long count = onboardingService.countByStatus(OnboardingStatus.PENDING);

        assertThat(count).isEqualTo(5L);
    }
}
