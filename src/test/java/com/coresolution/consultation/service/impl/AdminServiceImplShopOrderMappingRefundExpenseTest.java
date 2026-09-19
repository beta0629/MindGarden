package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.dto.FinancialTransactionRequest;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AdminRequestIdempotencyService;
import com.coresolution.consultation.service.AmountManagementService;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MappingSettlementNotificationHelper;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PasswordResetService;
import com.coresolution.consultation.service.PaymentMethodSsotService;
import com.coresolution.consultation.service.ProfessionalProviderTypeService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.RefundAutoCancelNotificationService;
import com.coresolution.consultation.service.SalaryTaxRateLookupService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserIdGenerator;
import com.coresolution.consultation.service.UserLifecycleService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.core.security.PasswordService;
import com.coresolution.core.service.UserRoleQueryService;
import com.coresolution.core.util.StatusCodeHelper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

/**
 * Path B 쇼핑 환불 — {@link AdminServiceImpl#createShopOrderMappingRefundExpense} 단위 검증.
 *
 * @author MindGarden
 * @since 2026-09-19
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl createShopOrderMappingRefundExpense")
class AdminServiceImplShopOrderMappingRefundExpenseTest {

    private static final String TEST_TENANT_ID = "tenant-shop-refund-" + UUID.randomUUID();
    private static final Long MAPPING_ID = 501L;
    private static final BigDecimal VAT_RATE = new BigDecimal("0.10");

    @Mock private UserRepository userRepository;
    @Mock private ConsultantRepository consultantRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private ConsultantRatingRepository consultantRatingRepository;
    @Mock private ConsultantRatingService consultantRatingService;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private ConsultationRecordRepository consultationRecordRepository;
    @Mock private CommonCodeRepository commonCodeRepository;
    @Mock private CommonCodeService commonCodeService;
    @Mock private PasswordService passwordService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private ConsultantAvailabilityService consultantAvailabilityService;
    @Mock private ConsultationMessageService consultationMessageService;
    @Mock private BranchService branchService;
    @Mock private NotificationService notificationService;
    @Mock private FinancialTransactionService financialTransactionService;
    @Mock private CardMerchantFeeResolutionService cardMerchantFeeResolutionService;
    @Mock private PaymentMethodSsotService paymentMethodSsotService;
    @Mock private RealTimeStatisticsService realTimeStatisticsService;
    @Mock private FinancialTransactionRepository financialTransactionRepository;
    @Mock private AmountManagementService amountManagementService;
    @Mock private StoredProcedureService storedProcedureService;
    @Mock private UserRoleAssignmentRepository userRoleAssignmentRepository;
    @Mock private TenantRoleRepository tenantRoleRepository;
    @Mock private UserRoleQueryService userRoleQueryService;
    @Mock private StatusCodeHelper statusCodeHelper;
    @Mock private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock private ConsultantStatsService consultantStatsService;
    @Mock private ClientStatsService clientStatsService;
    @Mock private NotificationChannelPreferenceResolutionService notificationChannelPreferenceResolutionService;
    @Mock private PasswordResetService passwordResetService;
    @Mock private UserIdGenerator userIdGenerator;
    @Mock private UserService userService;
    @Mock private ConsultantSalaryProfileRepository consultantSalaryProfileRepository;
    @Mock private ScheduleService scheduleService;
    @Mock private ProfessionalProviderTypeService professionalProviderTypeService;
    @Mock private MappingSettlementNotificationHelper mappingSettlementNotificationHelper;
    @Mock private BatchNotificationDispatchService batchNotificationDispatchService;
    @Mock private RefundAutoCancelNotificationService refundAutoCancelNotificationService;
    @Mock private UserLifecycleService userLifecycleService;
    @Mock private AdminRequestIdempotencyService adminRequestIdempotencyService;
    @Mock private SalaryTaxRateLookupService salaryTaxRateLookupService;

    private final PlatformTransactionManager noopTransactionManager = new AbstractPlatformTransactionManager() {
        @Override
        protected Object doGetTransaction() {
            return new Object();
        }

        @Override
        protected void doBegin(Object transaction, TransactionDefinition definition) {
        }

        @Override
        protected void doCommit(DefaultTransactionStatus status) {
        }

        @Override
        protected void doRollback(DefaultTransactionStatus status) {
        }
    };

    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
        adminService = new AdminServiceImpl(
                userRepository,
                consultantRepository,
                clientRepository,
                mappingRepository,
                consultantRatingRepository,
                consultantRatingService,
                scheduleRepository,
                consultationRecordRepository,
                commonCodeRepository,
                commonCodeService,
                passwordService,
                encryptionUtil,
                consultantAvailabilityService,
                consultationMessageService,
                branchService,
                notificationService,
                financialTransactionService,
                cardMerchantFeeResolutionService,
                paymentMethodSsotService,
                realTimeStatisticsService,
                financialTransactionRepository,
                amountManagementService,
                storedProcedureService,
                userRoleAssignmentRepository,
                tenantRoleRepository,
                userRoleQueryService,
                statusCodeHelper,
                userPersonalDataCacheService,
                scheduleListUserFieldsResolver,
                consultantStatsService,
                clientStatsService,
                notificationChannelPreferenceResolutionService,
                passwordResetService,
                noopTransactionManager,
                userIdGenerator,
                userService,
                consultantSalaryProfileRepository,
                scheduleService,
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.service.SalaryLateSessionAutoSyncService.class),
                professionalProviderTypeService,
                mappingSettlementNotificationHelper,
                batchNotificationDispatchService,
                refundAutoCancelNotificationService,
                userLifecycleService,
                adminRequestIdempotencyService,
                salaryTaxRateLookupService,
                null,
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.repository.InstitutionLinkContractRepository.class));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("입금 INCOME 존재 시 EXPENSE CONSULTATION_REFUND 생성·동일 장부(상담료)·INCOME CANCEL 미호출")
    void createShopOrderMappingRefundExpense_withIncome_createsExpenseKeepsIncome() {
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, 100_000L);
        FinancialTransaction income = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal("100000"))
                .status(FinancialTransaction.TransactionStatus.APPROVED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .build();
        income.setTenantId(TEST_TENANT_ID);

        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenReturn(List.of(income));
        when(financialTransactionRepository
                        .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                                eq(TEST_TENANT_ID),
                                eq(MAPPING_ID),
                                eq("CONSULTANT_CLIENT_MAPPING_REFUND"),
                                eq(FinancialTransaction.TransactionType.EXPENSE)))
                .thenReturn(false);
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenReturn(null);

        adminService.createShopOrderMappingRefundExpense(
                TEST_TENANT_ID, MAPPING_ID, "Shop order full refund");

        ArgumentCaptor<FinancialTransactionRequest> captor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService).createTransaction(captor.capture(), isNull());
        FinancialTransactionRequest request = captor.getValue();
        assertThat(request.getTransactionType()).isEqualTo("EXPENSE");
        assertThat(request.getCategory())
                .isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        assertThat(request.getSubcategory()).isEqualTo("CONSULTATION_REFUND");
        assertThat(request.getRelatedEntityType())
                .isEqualTo(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_REFUND);
        assertThat(request.getRelatedEntityId()).isEqualTo(MAPPING_ID);
        assertThat(request.getAmount()).isEqualByComparingTo(new BigDecimal("100000"));
        assertThat(request.getTenantId()).isEqualTo(TEST_TENANT_ID);
        verify(financialTransactionService, never()).cancelRelatedPostedIncomeTransactions(any(), any());
    }

    /**
     * Live evidence regression (E2E-1125 Path B AS-IS gap):
     * order {@code 41945f66…}, paymentId {@code PAY_1789784160121_c64eff05},
     * deposit FT #274 ₩10,000,000 category=상담료 — refund must create same-ledger EXPENSE,
     * never cancel/overwrite deposit. Amount is read from posted INCOME (not hardcoded in prod).
     */
    @Test
    @DisplayName("E2E-1125 / 41945f66 deposit #274 10_000_000 → same-ledger EXPENSE")
    void createShopOrderMappingRefundExpense_liveEvidence_e2e1125_sameLedgerExpense() {
        // Live FT #274 amount — test fixture only; production reads from posted INCOME.
        final BigDecimal liveDepositAmount = new BigDecimal("10000000");
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, liveDepositAmount.longValue());
        FinancialTransaction income = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(liveDepositAmount)
                .status(FinancialTransaction.TransactionStatus.APPROVED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .build();
        income.setTenantId(TEST_TENANT_ID);

        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenReturn(List.of(income));
        when(financialTransactionRepository
                        .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                                eq(TEST_TENANT_ID),
                                eq(MAPPING_ID),
                                eq("CONSULTANT_CLIENT_MAPPING_REFUND"),
                                eq(FinancialTransaction.TransactionType.EXPENSE)))
                .thenReturn(false);
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenReturn(null);

        adminService.createShopOrderMappingRefundExpense(
                TEST_TENANT_ID, MAPPING_ID, "Shop order full refund");

        ArgumentCaptor<FinancialTransactionRequest> captor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService).createTransaction(captor.capture(), isNull());
        FinancialTransactionRequest request = captor.getValue();
        assertThat(request.getTransactionType()).isEqualTo("EXPENSE");
        assertThat(request.getAmount()).isEqualByComparingTo(liveDepositAmount);
        assertThat(request.getCategory())
                .isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        assertThat(request.getSubcategory()).isEqualTo("CONSULTATION_REFUND");
        assertThat(request.getRelatedEntityType())
                .isEqualTo(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_REFUND);
        verify(financialTransactionService, never()).cancelRelatedPostedIncomeTransactions(any(), any());
    }

    @Test
    @DisplayName("입금 INCOME 없으면 EXPENSE 미생성(스킵)·INCOME CANCEL 미호출")
    void createShopOrderMappingRefundExpense_noIncome_skipsExpense() {
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, 100_000L);
        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenReturn(Collections.emptyList());

        adminService.createShopOrderMappingRefundExpense(
                TEST_TENANT_ID, MAPPING_ID, "Shop order full refund");

        verify(financialTransactionService, never()).createTransaction(any(), any());
        verify(financialTransactionService, never()).cancelRelatedPostedIncomeTransactions(any(), any());
    }

    @Test
    @DisplayName("이미 MAPPING_REFUND EXPENSE 있으면 createTransaction 미호출(멱등)")
    void createShopOrderMappingRefundExpense_existingRefund_idempotent() {
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, 100_000L);
        FinancialTransaction income = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .amount(new BigDecimal("100000"))
                .status(FinancialTransaction.TransactionStatus.APPROVED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .build();

        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenReturn(List.of(income));
        when(financialTransactionRepository
                        .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                                eq(TEST_TENANT_ID),
                                eq(MAPPING_ID),
                                eq("CONSULTANT_CLIENT_MAPPING_REFUND"),
                                eq(FinancialTransaction.TransactionType.EXPENSE)))
                .thenReturn(true);

        adminService.createShopOrderMappingRefundExpense(
                TEST_TENANT_ID, MAPPING_ID, "Shop order full refund");

        verify(financialTransactionService, never()).createTransaction(any(), any());
        verify(financialTransactionService, never()).cancelRelatedPostedIncomeTransactions(any(), any());
    }

    @Test
    @DisplayName("tenantId blank 이면 IllegalArgumentException")
    void createShopOrderMappingRefundExpense_blankTenant_throws() {
        assertThatThrownBy(() ->
                        adminService.createShopOrderMappingRefundExpense("  ", MAPPING_ID, "reason"))
                .isInstanceOf(IllegalArgumentException.class);
        verify(mappingRepository, never()).findByTenantIdAndId(any(), any());
    }

    private static ConsultantClientMapping buildMapping(Long mappingId, int totalSessions, long paymentAmount) {
        User consultant = new User();
        consultant.setId(10L);
        consultant.setTenantId(TEST_TENANT_ID);
        User client = new User();
        client.setId(20L);
        client.setTenantId(TEST_TENANT_ID);
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .consultant(consultant)
                .client(client)
                .totalSessions(totalSessions)
                .remainingSessions(totalSessions)
                .usedSessions(0)
                .packageName("PathB Package")
                .packagePrice(paymentAmount)
                .paymentAmount(paymentAmount)
                .status(ConsultantClientMapping.MappingStatus.ACTIVE)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.CONFIRMED)
                .build();
        mapping.setId(mappingId);
        mapping.setTenantId(TEST_TENANT_ID);
        return mapping;
    }
}
