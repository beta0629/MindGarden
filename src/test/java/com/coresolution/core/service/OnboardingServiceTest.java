package com.coresolution.core.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.core.constant.OnboardingConstants;
import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.domain.onboarding.RiskLevel;
import com.coresolution.core.service.impl.OnboardingApprovalBlockedException;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.repository.billing.TenantSubscriptionRepository;
import com.coresolution.core.repository.onboarding.OnboardingRequestRepository;
import com.coresolution.core.service.impl.OnboardingDecisionDeadline;
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
import org.springframework.test.util.ReflectionTestUtils;
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

    @Mock
    private EmailService emailService;

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
                .tenantName(testTenantName).requestedBy("01012345678").riskLevel(RiskLevel.LOW)
                .checklistJson("{\"checklist\":[],\"adminPassword\":\"ValidPass123!\","
                        + "\"contactEmail\":\"ops-admin@example.com\"}")
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
                .thenReturn(onboardingService);
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
                "test-requester", RiskLevel.LOW,
                "{\"checklist\":[],\"contactEmail\":\"owner@example.com\"}", testBusinessType);

        assertThat(result).isNotNull();
        assertThat(result.getTenantId()).isEqualTo(testTenantId);
        assertThat(result.getTenantName()).isEqualTo(testTenantName);
        assertThat(result.getStatus()).isEqualTo(OnboardingStatus.PENDING);
        verify(repository, times(1)).save(any(OnboardingRequest.class));
    }

    @Test
    @DisplayName("신청 생성: contactEmail 이 없으면 저장하지 않고 필수 상수 메시지로 거절한다")
    void testCreate_missingContactEmail_rejected() {
        assertThatThrownBy(() -> onboardingService.create(testTenantId, testTenantName,
                "01012345678", RiskLevel.LOW, "{\"checklist\":[]}", testBusinessType))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(OnboardingConstants.ERROR_ONBOARDING_CONTACT_EMAIL_REQUIRED_ON_CREATE);

        verify(repository, never()).save(any(OnboardingRequest.class));
    }

    @Test
    @DisplayName("신청 생성: contactEmail 형식이 아니면 저장하지 않고 형식 상수 메시지로 거절한다")
    void testCreate_invalidContactEmail_rejected() {
        assertThatThrownBy(() -> onboardingService.create(testTenantId, testTenantName,
                "01012345678", RiskLevel.LOW,
                "{\"contactEmail\":\"01012345678\"}", testBusinessType))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(OnboardingConstants.ERROR_ONBOARDING_CONTACT_EMAIL_INVALID_ON_CREATE);

        verify(repository, never()).save(any(OnboardingRequest.class));
    }

    @Test
    @DisplayName("신청 생성: 테넌트에 있는 서브도메인은 가용성 검사와 같은 문장으로 거절한다")
    void testCreate_duplicateTenantSubdomain_usesCheckMessage() {
        when(tenantRepository.existsBySubdomain("taken-center")).thenReturn(true);

        OnboardingService.SubdomainCheckResult check =
                onboardingService.checkSubdomainDuplicate("taken-center");

        assertThat(check.message())
                .isEqualTo(OnboardingConstants.ERROR_ONBOARDING_SUBDOMAIN_TAKEN_BY_TENANT);
        assertThat(check.isDuplicate()).isTrue();

        assertThatThrownBy(() -> onboardingService.create(testTenantId, testTenantName,
                "01012345678", RiskLevel.LOW,
                "{\"contactEmail\":\"owner@example.com\",\"subdomain\":\"taken-center\"}",
                testBusinessType))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(check.message());

        verify(repository, never()).save(any(OnboardingRequest.class));
    }

    @Test
    @DisplayName("신청 생성: 진행 중 신청과 서브도메인이 같으면 가용성 검사와 같은 문장으로 거절한다")
    void testCreate_duplicatePendingSubdomain_usesCheckMessage() {
        when(tenantRepository.existsBySubdomain("pending-center")).thenReturn(false);
        when(repository.existsBySubdomainAndPendingStatus("pending-center")).thenReturn(true);

        OnboardingService.SubdomainCheckResult check =
                onboardingService.checkSubdomainDuplicate("pending-center");

        assertThat(check.message())
                .isEqualTo(OnboardingConstants.ERROR_ONBOARDING_SUBDOMAIN_TAKEN_BY_REQUEST);

        assertThatThrownBy(() -> onboardingService.create(testTenantId, testTenantName,
                "01012345678", RiskLevel.LOW,
                "{\"contactEmail\":\"owner@example.com\",\"subdomain\":\"Pending-Center\"}",
                testBusinessType))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(check.message());

        verify(repository, never()).save(any(OnboardingRequest.class));
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
                anyString(), anyString(), anyString(), eq("ops-admin@example.com"), anyString(),
                nullable(String.class))).thenReturn(approvalResult);

        OnboardingRequest result =
                onboardingService.decide(testId, OnboardingStatus.APPROVED, "test-admin", "테스트 승인");

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(OnboardingStatus.APPROVED);
        assertThat(result.getDecidedBy()).isEqualTo("test-admin");
        assertThat(result.getDecisionNote()).isEqualTo("테스트 승인");
        assertThat(result.getChecklistJson()).doesNotContain("ValidPass123!");
        assertThat(result.getChecklistJson()).contains("$2a$10$stubEncodedPassword");
        verify(repository, atLeastOnce()).save(any(OnboardingRequest.class));
        verify(approvalService, times(1)).processOnboardingApproval(any(Long.class), anyString(),
                anyString(), anyString(), anyString(), anyString(), eq("ops-admin@example.com"),
                anyString(), nullable(String.class));
        verify(errorHandlingService).executeWithRetry(any(),
                eq(OnboardingDecisionDeadline.DECISION_MAX_ATTEMPTS),
                eq(OnboardingDecisionDeadline.DECISION_RETRY_DELAY_MS));
    }

    @Test
    @DisplayName("승인 프로시저가 실패하면 승인으로 저장하지 않고 그 사유를 던진다")
    void testDecide_procedureFailure_staysUnapprovedWithReason() {
        when(repository.findActiveById(testId)).thenReturn(Optional.of(testRequest));

        java.util.Map<String, Object> approvalResult = new java.util.HashMap<>();
        approvalResult.put("success", false);
        approvalResult.put("message", "역할 템플릿 적용 실패");
        when(approvalService.processOnboardingApproval(any(Long.class), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), anyString(), nullable(String.class)))
                        .thenReturn(approvalResult);

        assertThatThrownBy(() -> onboardingService.decide(testId, OnboardingStatus.APPROVED, "test-admin",
                "테스트 승인"))
                .isInstanceOf(com.coresolution.core.service.impl.OnboardingApprovalBlockedException.class)
                .hasMessageContaining("역할 템플릿 적용 실패");

        assertThat(testRequest.getStatus()).isEqualTo(OnboardingStatus.PENDING);
        verify(repository, never()).save(any(OnboardingRequest.class));
        verify(approvalService, times(1)).processOnboardingApproval(any(Long.class), anyString(),
                anyString(), anyString(), anyString(), anyString(), anyString(), anyString(),
                nullable(String.class));
        verify(errorHandlingService).executeWithRetry(any(),
                eq(OnboardingDecisionDeadline.DECISION_MAX_ATTEMPTS),
                eq(OnboardingDecisionDeadline.DECISION_RETRY_DELAY_MS));
    }

    @Test
    @DisplayName("온보딩 승인 - 연락 이메일은 있으나 adminPassword 없으면 사유와 함께 막힌다")
    void testDecide_Approved_missingAdminPassword_blocked() {
        OnboardingRequest noPw = OnboardingRequest.builder().id(testId).tenantId(testTenantId)
                .tenantName(testTenantName).requestedBy("01012345678").riskLevel(RiskLevel.LOW)
                .checklistJson("{\"checklist\":[],\"contactEmail\":\"ops-admin@example.com\"}")
                .businessType(testBusinessType)
                .status(OnboardingStatus.PENDING).isDeleted(false).build();

        when(repository.findActiveById(testId)).thenReturn(Optional.of(noPw));

        assertThatThrownBy(() -> onboardingService.decide(testId, OnboardingStatus.APPROVED,
                "test-admin", "승인 시도"))
                .isInstanceOf(com.coresolution.core.service.impl.OnboardingApprovalBlockedException.class)
                .hasMessageContaining("adminPassword");

        assertThat(noPw.getStatus()).isEqualTo(OnboardingStatus.PENDING);
        verify(approvalService, times(0)).processOnboardingApproval(any(), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), anyString(), nullable(String.class));
    }

    @Test
    @DisplayName("한글 신청 서브도메인은 승인 프로시저 없이 사유로 막힌다")
    void testDecide_koreanSubdomain_blockedBeforeProcedure() {
        testRequest.setSubdomain("검증-재검-202610032055");
        when(repository.findActiveById(testId)).thenReturn(Optional.of(testRequest));

        assertThatThrownBy(() -> onboardingService.decide(testId, OnboardingStatus.APPROVED,
                "test-admin", "승인 시도"))
                .isInstanceOf(OnboardingApprovalBlockedException.class)
                .hasMessage(OnboardingConstants.ERROR_ONBOARDING_SUBDOMAIN_NOT_DNS_LABEL);

        assertThat(testRequest.getStatus()).isEqualTo(OnboardingStatus.PENDING);
        verify(approvalService, never()).processOnboardingApproval(any(), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), anyString(), nullable(String.class));
    }

    @Test
    @DisplayName("유효한 영문 서브도메인은 소문자로 승인에 전달된다")
    void testDecide_englishSubdomain_passedLowercase() {
        testRequest.setSubdomain("MindGarden");
        when(repository.findActiveById(testId)).thenReturn(Optional.of(testRequest));
        when(repository.findByTenantIdAndIdAndIsDeletedFalse(testTenantId, testId))
                .thenReturn(Optional.of(testRequest));
        when(repository.save(any(OnboardingRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        java.util.Map<String, Object> approvalResult = new java.util.HashMap<>();
        approvalResult.put("success", true);
        approvalResult.put("message", "온보딩 승인 완료");
        when(approvalService.processOnboardingApproval(any(Long.class), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), anyString(), eq("mindgarden")))
                        .thenReturn(approvalResult);

        OnboardingRequest result =
                onboardingService.decide(testId, OnboardingStatus.APPROVED, "test-admin", "테스트 승인");

        assertThat(result.getStatus()).isEqualTo(OnboardingStatus.APPROVED);
        verify(approvalService).processOnboardingApproval(any(Long.class), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), anyString(), eq("mindgarden"));
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

    @Test
    @DisplayName("승인 시 관리자 이메일은 checklist contactEmail 이고 신청 휴대폰이 아니다")
    void testDecide_Approved_adminEmailFromContactEmail() {
        testRequest.setChecklistJson("{\"adminPassword\":\"ValidPass123!\","
                + "\"contactEmail\":\"  Ops-Admin@Example.COM \"}");
        when(repository.findActiveById(testId)).thenReturn(Optional.of(testRequest));
        when(repository.findByTenantIdAndIdAndIsDeletedFalse(testTenantId, testId))
                .thenReturn(Optional.of(testRequest));
        when(repository.save(any(OnboardingRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        java.util.Map<String, Object> approvalResult = new java.util.HashMap<>();
        approvalResult.put("success", true);
        approvalResult.put("message", "온보딩 승인 완료");
        when(approvalService.processOnboardingApproval(any(Long.class), anyString(), anyString(),
                anyString(), anyString(), anyString(), eq("ops-admin@example.com"), anyString(),
                nullable(String.class))).thenReturn(approvalResult);

        OnboardingRequest result =
                onboardingService.decide(testId, OnboardingStatus.APPROVED, "test-admin", "테스트 승인");

        assertThat(result.getStatus()).isEqualTo(OnboardingStatus.APPROVED);
        verify(approvalService).processOnboardingApproval(any(Long.class), anyString(), anyString(),
                anyString(), anyString(), anyString(), eq("ops-admin@example.com"), anyString(),
                nullable(String.class));
        verify(approvalService, never()).processOnboardingApproval(any(Long.class), anyString(),
                anyString(), anyString(), anyString(), anyString(), eq("01012345678"), anyString(),
                nullable(String.class));
    }

    @Test
    @DisplayName("관리자 이메일이 없으면 승인을 막고 테넌트·계정을 만들지 않는다")
    void testDecide_Approved_missingContactEmail_blockedWithoutPartialCommit() {
        OnboardingRequest pending = OnboardingRequest.builder().id(testId).tenantId(null)
                .tenantName(testTenantName).requestedBy("01012345678").riskLevel(RiskLevel.LOW)
                .checklistJson("{\"adminPassword\":\"ValidPass123!\"}").businessType(testBusinessType)
                .status(OnboardingStatus.PENDING).isDeleted(false).build();
        when(repository.findActiveById(testId)).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> onboardingService.decide(testId, OnboardingStatus.APPROVED,
                "test-admin", "승인 시도"))
                .isInstanceOf(OnboardingApprovalBlockedException.class)
                .hasMessage(OnboardingConstants.ERROR_ONBOARDING_ADMIN_CONTACT_EMAIL_REQUIRED_FOR_APPROVAL);

        assertThat(pending.getStatus()).isEqualTo(OnboardingStatus.PENDING);
        assertThat(pending.getTenantId()).isNull();
        verify(repository, never()).save(any(OnboardingRequest.class));
        verify(tenantRepository, never()).save(any());
        verify(approvalService, never()).processOnboardingApproval(any(), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), anyString(), nullable(String.class));
    }

    @Test
    @DisplayName("contactEmail 이 휴대폰이면 그 번호로 관리자 계정을 만들지 않고 승인을 막는다")
    void testDecide_Approved_phoneAsContactEmail_blockedWithoutPartialCommit() {
        OnboardingRequest pending = OnboardingRequest.builder().id(testId).tenantId(testTenantId)
                .tenantName(testTenantName).requestedBy("01012345678").riskLevel(RiskLevel.LOW)
                .checklistJson("{\"adminPassword\":\"ValidPass123!\",\"contactEmail\":\"01012345678\"}")
                .businessType(testBusinessType).status(OnboardingStatus.PENDING).isDeleted(false)
                .build();
        when(repository.findActiveById(testId)).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> onboardingService.decide(testId, OnboardingStatus.APPROVED,
                "test-admin", "승인 시도"))
                .isInstanceOf(OnboardingApprovalBlockedException.class)
                .hasMessage(OnboardingConstants.ERROR_ONBOARDING_ADMIN_CONTACT_EMAIL_REQUIRED_FOR_APPROVAL);

        assertThat(pending.getStatus()).isEqualTo(OnboardingStatus.PENDING);
        verify(repository, never()).save(any(OnboardingRequest.class));
        verify(approvalService, never()).processOnboardingApproval(any(), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), anyString(), nullable(String.class));
    }

    @Test
    @DisplayName("승인 완료 메일 수신자는 checklist contactEmail 이다")
    void sendOnboardingApprovalEmail_usesContactEmailNotRequestedBy() {
        testRequest.setStatus(OnboardingStatus.APPROVED);
        when(emailService.sendTemplateEmail(anyString(), anyString(), any(), any()))
                .thenReturn(EmailResponse.builder().success(true).build());

        ReflectionTestUtils.invokeMethod(onboardingService, "sendOnboardingApprovalEmail", testRequest,
                testTenantId);

        verify(emailService).sendTemplateEmail(anyString(), eq("ops-admin@example.com"), any(), any());
        verify(emailService, never()).sendTemplateEmail(anyString(), eq("01012345678"), any(), any());
    }
}
