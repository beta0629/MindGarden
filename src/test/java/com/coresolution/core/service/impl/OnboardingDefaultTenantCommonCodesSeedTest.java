package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.repository.billing.TenantSubscriptionRepository;
import com.coresolution.core.repository.onboarding.OnboardingRequestRepository;
import com.coresolution.core.security.PasswordService;
import com.coresolution.core.service.AutoApprovalService;
import com.coresolution.core.service.OnboardingApprovalService;
import com.coresolution.core.service.OnboardingErrorHandlingService;
import com.coresolution.core.service.OnboardingPreValidationService;
import com.coresolution.core.service.PermissionGroupService;
import com.coresolution.core.service.TenantDashboardService;
import com.coresolution.core.service.TenantIdGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * 온보딩 시 급여·ERP 공통코드 시드가 테넌트 행으로 적재되는지 검증한다.
 * <p>
 * 전체 {@code @SpringBootTest}는 테스트용 H2 스키마와 엔티티 전체가 맞지 않아 컨텍스트 기동이 불안정하므로,
 * {@code CommonCodeRepository}를 목으로 두고 비공개 {@code insertDefaultTenantCommonCodes}는
 * {@link ReflectionTestUtils}로 호출한다.
 * </p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("온보딩 기본 공통코드 시딩 단위 테스트")
class OnboardingDefaultTenantCommonCodesSeedTest {

    @Mock
    private OnboardingRequestRepository repository;
    @Mock
    private OnboardingApprovalService approvalService;
    @Mock
    private AutoApprovalService autoApprovalService;
    @Mock
    private TenantSubscriptionRepository subscriptionRepository;
    @Mock
    private TenantIdGenerator tenantIdGenerator;
    @Mock
    private TenantDashboardService tenantDashboardService;
    @Mock
    private TenantRepository tenantRepository;
    @Mock
    private PasswordService passwordService;
    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();
    @Mock
    private CommonCodeService commonCodeService;
    @Mock
    private CommonCodeRepository commonCodeRepository;
    @Mock
    private OnboardingPreValidationService preValidationService;
    @Mock
    private OnboardingErrorHandlingService errorHandlingService;
    @Mock
    private AccountingService accountingService;
    @Mock
    private PermissionGroupService permissionGroupService;
    @Mock
    private TenantRoleRepository tenantRoleRepository;
    @Mock
    private ApplicationContext applicationContext;
    @Mock
    private EmailService emailService;
    @Mock
    private JdbcTemplate jdbcTemplate;
    @Mock
    private PlatformTransactionManager transactionManager;
    @Mock(name = "onboardingPostApprovalExecutor")
    private Executor onboardingPostApprovalExecutor;
    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private OnboardingServiceImpl onboardingService;

    private final List<CommonCode> persistedTenantCodes = new ArrayList<>();

    @BeforeEach
    void setUp() {
        persistedTenantCodes.clear();
        lenient().when(commonCodeRepository.findByTenantId(anyString())).thenAnswer(invocation -> {
            String tenantId = invocation.getArgument(0);
            return persistedTenantCodes.stream().filter(c -> tenantId.equals(c.getTenantId()))
                    .collect(Collectors.toList());
        });
        lenient().when(commonCodeRepository.saveAll(anyList())).thenAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            List<CommonCode> toSave = invocation.getArgument(0);
            persistedTenantCodes.addAll(toSave);
            return toSave;
        });
        lenient().when(commonCodeRepository.findTenantCodesByGroup(anyString(), anyString()))
                .thenAnswer(invocation -> {
                    String tenantId = invocation.getArgument(0);
                    String codeGroup = invocation.getArgument(1);
                    return persistedTenantCodes.stream()
                            .filter(c -> tenantId.equals(c.getTenantId())
                                    && codeGroup.equals(c.getCodeGroup())
                                    && Boolean.TRUE.equals(c.getIsActive()))
                            .sorted(Comparator.comparing(CommonCode::getSortOrder,
                                    Comparator.nullsLast(Integer::compareTo)))
                            .collect(Collectors.toList());
                });
    }

    @Test
    @DisplayName("insertDefaultTenantCommonCodes 후 SALARY_TYPE·CONSULTANT_GRADE가 비어 있지 않다")
    void insertDefaultTenantCommonCodes_seedsSalaryTypeAndConsultantGrade() {
        String tenantId = "tenant-seed-" + UUID.randomUUID();

        ReflectionTestUtils.invokeMethod(onboardingService, "insertDefaultTenantCommonCodes", tenantId,
                "unit-test-user");

        List<CommonCode> salaryTypes =
                commonCodeRepository.findTenantCodesByGroup(tenantId, "SALARY_TYPE");
        List<CommonCode> grades =
                commonCodeRepository.findTenantCodesByGroup(tenantId, "CONSULTANT_GRADE");

        assertThat(salaryTypes).isNotEmpty();
        assertThat(grades).isNotEmpty();
    }

    @Test
    @DisplayName("insertDefaultTenantCommonCodesInNewTransaction 후 SALARY_TYPE·CONSULTANT_GRADE가 비어 있지 않다")
    void insertDefaultTenantCommonCodesInNewTransaction_seedsSalaryTypeAndConsultantGrade() {
        String tenantId = "tenant-seed-tx-" + UUID.randomUUID();

        onboardingService.insertDefaultTenantCommonCodesInNewTransaction(tenantId, "unit-test-user");

        List<CommonCode> salaryTypes =
                commonCodeRepository.findTenantCodesByGroup(tenantId, "SALARY_TYPE");
        List<CommonCode> grades =
                commonCodeRepository.findTenantCodesByGroup(tenantId, "CONSULTANT_GRADE");

        assertThat(salaryTypes).isNotEmpty();
        assertThat(grades).isNotEmpty();
    }

    @Test
    @DisplayName("addDefaultTenantCommonCodes 후 findTenantCodesByGroup으로 SALARY_TYPE·CONSULTANT_GRADE가 비어 있지 않다")
    void addDefaultTenantCommonCodes_seedsSalaryTypeAndConsultantGrade() {
        String tenantId = "tenant-seed-add-" + UUID.randomUUID();

        int added = onboardingService.addDefaultTenantCommonCodes(tenantId, "unit-test-user");

        assertThat(added).isPositive();
        assertThat(commonCodeRepository.findTenantCodesByGroup(tenantId, "SALARY_TYPE")).isNotEmpty();
        assertThat(commonCodeRepository.findTenantCodesByGroup(tenantId, "CONSULTANT_GRADE"))
                .isNotEmpty();
    }
}
