package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.dto.FinancialTransactionRequest;
import com.coresolution.consultation.dto.FinancialTransactionResponse;
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
        lenient().when(amountManagementService.checkAmountConsistency(any()))
                .thenReturn(new AmountManagementService.AmountConsistencyResult(true, null, null, null));
        lenient().when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        eq(TEST_TENANT_ID),
                        eq(MAPPING_ID),
                        eq(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL)))
                .thenReturn(Collections.emptyList());
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
                        com.coresolution.consultation.repository.InstitutionLinkContractRepository.class),
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.ShopClientOrderLineRepository.class),
                org.mockito.Mockito.mock(org.springframework.beans.factory.ObjectProvider.class),
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class));
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
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());
        lenient().when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        "CONSULTANT_CLIENT_MAPPING_REFUND"))
                .thenReturn(Collections.emptyList());
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenReturn(null);

        adminService.createShopOrderMappingRefundExpense(
                TEST_TENANT_ID, MAPPING_ID, "Shop order full refund", "PathB Package", 10);

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
        assertThat(request.getCardMerchantFeeAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(request.getTenantId()).isEqualTo(TEST_TENANT_ID);
        verify(financialTransactionService, never()).cancelRelatedPostedIncomeTransactions(any(), any());
    }

    @Test
    @DisplayName("ONLINE INCOME fee 합 → EXPENSE amount=gross·cardMerchantFeeAmount=feeSum 정렬")
    void createShopOrderMappingRefundExpense_onlineIncomeFee_alignsExpenseFee() {
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, 100_000L);
        FinancialTransaction income = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal("100000"))
                .cardMerchantFeeAmount(new BigDecimal("2500"))
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
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());
        lenient().when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        "CONSULTANT_CLIENT_MAPPING_REFUND"))
                .thenReturn(Collections.emptyList());
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenReturn(null);

        adminService.createShopOrderMappingRefundExpense(
                TEST_TENANT_ID, MAPPING_ID, "Shop order full refund with fee", "PathB Package", 10);

        ArgumentCaptor<FinancialTransactionRequest> captor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService).createTransaction(captor.capture(), isNull());
        FinancialTransactionRequest request = captor.getValue();
        assertThat(request.getTransactionType()).isEqualTo("EXPENSE");
        assertThat(request.getAmount()).isEqualByComparingTo(new BigDecimal("100000"));
        assertThat(request.getCardMerchantFeeAmount()).isEqualByComparingTo(new BigDecimal("2500"));
        assertThat(request.getCategory())
                .isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
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
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());
        lenient().when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        "CONSULTANT_CLIENT_MAPPING_REFUND"))
                .thenReturn(Collections.emptyList());
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenReturn(null);

        adminService.createShopOrderMappingRefundExpense(
                TEST_TENANT_ID, MAPPING_ID, "Shop order full refund", "PathB Package", 10);

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
    @DisplayName("입금 INCOME 없으면 상담료 INCOME 수리 후 EXPENSE 생성·INCOME CANCEL 미호출")
    void createShopOrderMappingRefundExpense_noIncome_repairsIncomeThenCreatesExpense() {
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, 100_000L);
        FinancialTransaction repairedIncome = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal("100000"))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .build();
        repairedIncome.setTenantId(TEST_TENANT_ID);
        repairedIncome.setId(8801L);

        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        java.util.concurrent.atomic.AtomicBoolean incomeCreated =
                new java.util.concurrent.atomic.AtomicBoolean(false);
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenAnswer(inv -> incomeCreated.get()
                        ? List.of(repairedIncome)
                        : Collections.emptyList());
        when(amountManagementService.getAccurateTransactionAmount(mapping)).thenReturn(100_000L);
        when(amountManagementService.checkAmountConsistency(MAPPING_ID))
                .thenReturn(new AmountManagementService.AmountConsistencyResult(true, null, null, null));
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenAnswer(inv -> {
                    FinancialTransactionRequest req = inv.getArgument(0);
                    if ("INCOME".equals(req.getTransactionType())) {
                        incomeCreated.set(true);
                        return FinancialTransactionResponse.builder().id(8801L).build();
                    }
                    return FinancialTransactionResponse.builder().id(8802L).build();
                });
        when(financialTransactionRepository.findByTenantIdAndId(TEST_TENANT_ID, 8801L))
                .thenReturn(Optional.of(repairedIncome));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());
        lenient().when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        "CONSULTANT_CLIENT_MAPPING_REFUND"))
                .thenReturn(Collections.emptyList());

        adminService.createShopOrderMappingRefundExpense(
                TEST_TENANT_ID, MAPPING_ID, "Shop order full refund", "PathB Package", 10);

        ArgumentCaptor<FinancialTransactionRequest> captor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService, times(2)).createTransaction(captor.capture(), isNull());
        List<FinancialTransactionRequest> requests = captor.getAllValues();
        assertThat(requests.get(0).getTransactionType()).isEqualTo("INCOME");
        assertThat(requests.get(0).getCategory())
                .isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        assertThat(requests.get(0).getAmount()).isEqualByComparingTo(new BigDecimal("100000"));
        assertThat(requests.get(1).getTransactionType()).isEqualTo("EXPENSE");
        assertThat(requests.get(1).getCategory())
                .isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        assertThat(requests.get(1).getSubcategory()).isEqualTo("CONSULTATION_REFUND");
        assertThat(requests.get(1).getAmount()).isEqualByComparingTo(new BigDecimal("100000"));
        verify(financialTransactionService, never()).cancelRelatedPostedIncomeTransactions(any(), any());
    }

    /**
     * Live evidence regression (f490227e / PAY_1789789927189_7c2da718):
     * Clinic REFUNDED + fulfillment REVERSED but ERP had no ₩1000 INCOME+EXPENSE pair.
     * Missing deposit INCOME must be repaired then EXPENSE created; never cancel income.
     */
    @Test
    @DisplayName("f490227e / PAY_1789789927189 ₩1000 — INCOME 수리 후 동일액 EXPENSE·상담료·CANCEL 금지")
    void createShopOrderMappingRefundExpense_liveEvidence_f490227e_repairsIncomeExpensePair() {
        // Live payment amount — test fixture only; production reads mapping/posted FT.
        final BigDecimal liveRefundAmount = new BigDecimal("1000");
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 1, liveRefundAmount.longValue());
        FinancialTransaction repairedIncome = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(liveRefundAmount)
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .build();
        repairedIncome.setTenantId(TEST_TENANT_ID);
        repairedIncome.setId(9901L);

        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        java.util.concurrent.atomic.AtomicBoolean incomeCreated =
                new java.util.concurrent.atomic.AtomicBoolean(false);
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenAnswer(inv -> incomeCreated.get()
                        ? List.of(repairedIncome)
                        : Collections.emptyList());
        when(amountManagementService.getAccurateTransactionAmount(mapping))
                .thenReturn(liveRefundAmount.longValue());
        when(amountManagementService.checkAmountConsistency(MAPPING_ID))
                .thenReturn(new AmountManagementService.AmountConsistencyResult(true, null, null, null));
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenAnswer(inv -> {
                    FinancialTransactionRequest req = inv.getArgument(0);
                    if ("INCOME".equals(req.getTransactionType())) {
                        incomeCreated.set(true);
                        return FinancialTransactionResponse.builder().id(9901L).build();
                    }
                    return FinancialTransactionResponse.builder().id(9902L).build();
                });
        when(financialTransactionRepository.findByTenantIdAndId(TEST_TENANT_ID, 9901L))
                .thenReturn(Optional.of(repairedIncome));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());
        lenient().when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        "CONSULTANT_CLIENT_MAPPING_REFUND"))
                .thenReturn(Collections.emptyList());

        adminService.createShopOrderMappingRefundExpense(
                TEST_TENANT_ID, MAPPING_ID, "Shop order full refund", "PathB Package", 10);

        ArgumentCaptor<FinancialTransactionRequest> captor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService, times(2)).createTransaction(captor.capture(), isNull());
        List<FinancialTransactionRequest> requests = captor.getAllValues();
        assertThat(requests.get(0).getTransactionType()).isEqualTo("INCOME");
        assertThat(requests.get(0).getCategory())
                .isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        assertThat(requests.get(0).getAmount()).isEqualByComparingTo(liveRefundAmount);
        assertThat(requests.get(1).getTransactionType()).isEqualTo("EXPENSE");
        assertThat(requests.get(1).getCategory())
                .isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        assertThat(requests.get(1).getSubcategory()).isEqualTo("CONSULTATION_REFUND");
        assertThat(requests.get(1).getAmount()).isEqualByComparingTo(liveRefundAmount);
        verify(financialTransactionService, never()).cancelRelatedPostedIncomeTransactions(any(), any());
    }

    @Test
    @DisplayName("이미 MAPPING_REFUND EXPENSE 있고 적요 SSOT 일치면 createTransaction 미호출(멱등)")
    void createShopOrderMappingRefundExpense_existingRefund_idempotent() {
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, 100_000L);
        FinancialTransaction income = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .amount(new BigDecimal("100000"))
                .status(FinancialTransaction.TransactionStatus.APPROVED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .build();
        FinancialTransaction existingExpense = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.EXPENSE)
                .amount(new BigDecimal("100000"))
                .status(FinancialTransaction.TransactionStatus.APPROVED)
                .description("상담료 환불 - PathB Package (10회기 환불, 사유: Shop order full refund)")
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType("CONSULTANT_CLIENT_MAPPING_REFUND")
                .build();
        existingExpense.setId(9001L);

        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenReturn(List.of(income));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());
        lenient().when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        "CONSULTANT_CLIENT_MAPPING_REFUND"))
                .thenReturn(List.of(existingExpense));

        adminService.createShopOrderMappingRefundExpense(
                TEST_TENANT_ID, MAPPING_ID, "Shop order full refund", "PathB Package", 10);

        verify(financialTransactionService, never()).createTransaction(any(), any());
        verify(financialTransactionService, never()).cancelRelatedPostedIncomeTransactions(any(), any());
        verify(financialTransactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("tenantId blank 이면 IllegalArgumentException")
    void createShopOrderMappingRefundExpense_blankTenant_throws() {
        assertThatThrownBy(() ->
                        adminService.createShopOrderMappingRefundExpense("  ", MAPPING_ID, "reason"))
                .isInstanceOf(IllegalArgumentException.class);
        verify(mappingRepository, never()).findByTenantIdAndId(any(), any());
    }

    @Test
    @DisplayName("환불 금액 없음(INCOME·매핑 금액 0) — fail-closed IllegalStateException")
    void createShopOrderMappingRefundExpense_zeroAmount_throws() {
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, 0L);
        mapping.setPackagePrice(0L);
        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenReturn(Collections.emptyList());
        when(amountManagementService.getAccurateTransactionAmount(mapping)).thenReturn(0L);

        assertThatThrownBy(() ->
                        adminService.createShopOrderMappingRefundExpense(
                                TEST_TENANT_ID, MAPPING_ID, "Shop order full refund", "PathB Package", 10))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("MappingID=" + MAPPING_ID);
        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    @Test
    @DisplayName("ensureConsultationDepositIncome — 동기 createTransaction INCOME")
    void ensureConsultationDepositIncome_missingIncome_createsIncomeSynchronously() {
        final BigDecimal depositAmount = new BigDecimal("1000");
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 1, depositAmount.longValue());
        FinancialTransaction repairedIncome = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(depositAmount)
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .build();
        repairedIncome.setTenantId(TEST_TENANT_ID);
        repairedIncome.setId(7701L);

        java.util.concurrent.atomic.AtomicBoolean incomeCreated =
                new java.util.concurrent.atomic.AtomicBoolean(false);
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenAnswer(inv -> incomeCreated.get()
                        ? List.of(repairedIncome)
                        : Collections.emptyList());
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());
        when(amountManagementService.getAccurateTransactionAmount(mapping))
                .thenReturn(depositAmount.longValue());
        when(amountManagementService.checkAmountConsistency(MAPPING_ID))
                .thenReturn(new AmountManagementService.AmountConsistencyResult(true, null, null, null));
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenAnswer(inv -> {
                    incomeCreated.set(true);
                    return FinancialTransactionResponse.builder().id(7701L).build();
                });
        when(financialTransactionRepository.findByTenantIdAndId(TEST_TENANT_ID, 7701L))
                .thenReturn(Optional.of(repairedIncome));
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        adminService.ensureConsultationDepositIncome(mapping);

        ArgumentCaptor<FinancialTransactionRequest> captor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService).createTransaction(captor.capture(), isNull());
        FinancialTransactionRequest request = captor.getValue();
        assertThat(request.getTransactionType()).isEqualTo("INCOME");
        assertThat(request.getCategory()).isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        assertThat(request.getAmount()).isEqualByComparingTo(depositAmount);
        assertThat(request.getRelatedEntityId()).isEqualTo(MAPPING_ID);
        assertThat(request.getRelatedEntityType())
                .isEqualTo(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING);
    }

    @Test
    @DisplayName("ensureConsultationDepositIncome — 동기 생성 예외는 삼키지 않고 재전파")
    void ensureConsultationDepositIncome_createFails_rethrows() {
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 1, 1000L);
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        eq(TEST_TENANT_ID),
                        eq(MAPPING_ID),
                        eq(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)))
                .thenReturn(Collections.emptyList());
        when(amountManagementService.getAccurateTransactionAmount(mapping)).thenReturn(1000L);
        when(amountManagementService.checkAmountConsistency(MAPPING_ID))
                .thenReturn(new AmountManagementService.AmountConsistencyResult(true, null, null, null));
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenThrow(new IllegalStateException("ft down"));

        assertThatThrownBy(() -> adminService.ensureConsultationDepositIncome(mapping))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ft down");
    }

    @Test
    @DisplayName("ensureConsultationDepositIncome — 금액 미결정 시 IllegalStateException")
    void ensureConsultationDepositIncome_amountMissing_throws() {
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 1, 1000L);
        lenient().when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        eq(TEST_TENANT_ID),
                        eq(MAPPING_ID),
                        eq(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)))
                .thenReturn(Collections.emptyList());
        when(amountManagementService.getAccurateTransactionAmount(mapping)).thenReturn(null);

        assertThatThrownBy(() -> adminService.ensureConsultationDepositIncome(mapping))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("유효한 거래 금액을 결정할 수 없습니다");
        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    @Test
    @DisplayName("ensureConsultationDepositIncome — 부모 TX 스냅샷이 커밋 INCOME을 못 봐도 FAILED 하지 않음")
    void ensureConsultationDepositIncome_parentSnapshotMiss_doesNotFalseFail() {
        final BigDecimal depositAmount = new BigDecimal("1000");
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 1, depositAmount.longValue());
        FinancialTransaction repairedIncome = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(depositAmount)
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .build();
        repairedIncome.setTenantId(TEST_TENANT_ID);
        repairedIncome.setId(7702L);

        java.util.concurrent.atomic.AtomicBoolean incomeCreated =
                new java.util.concurrent.atomic.AtomicBoolean(false);
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenAnswer(inv -> incomeCreated.get()
                        ? List.of(repairedIncome)
                        : Collections.emptyList());
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());
        when(amountManagementService.getAccurateTransactionAmount(mapping))
                .thenReturn(depositAmount.longValue());
        when(amountManagementService.checkAmountConsistency(MAPPING_ID))
                .thenReturn(new AmountManagementService.AmountConsistencyResult(true, null, null, null));
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenAnswer(inv -> {
                    incomeCreated.set(true);
                    return FinancialTransactionResponse.builder().id(7702L).build();
                });
        when(financialTransactionRepository.findByTenantIdAndId(TEST_TENANT_ID, 7702L))
                .thenReturn(Optional.of(repairedIncome));
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        adminService.ensureConsultationDepositIncome(mapping);

        verify(financialTransactionService).createTransaction(any(FinancialTransactionRequest.class), isNull());
        assertThat(incomeCreated.get()).isTrue();
    }

    @Test
    @DisplayName("ensureConsultationDepositIncome — posted INCOME 금액 불일치 시 update-in-place(이중 생성 없음)")
    void ensureConsultationDepositIncome_staleAmount_healsInPlaceNoSecondIncome() {
        final long staleAmount = 1_000L;
        final long paidAmount = 10_000L;
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, paidAmount);
        mapping.setPackagePrice(staleAmount);

        FinancialTransaction staleIncome = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(BigDecimal.valueOf(staleAmount))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .build();
        staleIncome.setTenantId(TEST_TENANT_ID);
        staleIncome.setId(274L);

        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenReturn(List.of(staleIncome));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());
        lenient().when(amountManagementService.getAccurateTransactionAmount(mapping)).thenReturn(paidAmount);
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(consultantSalaryProfileRepository
                        .findFirstByTenantIdAndConsultantIdAndIsActiveTrueOrderByUpdatedAtDescIdDesc(
                                eq(TEST_TENANT_ID), any()))
                .thenReturn(Optional.empty());
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        adminService.ensureConsultationDepositIncome(mapping);

        verify(financialTransactionService, never()).createTransaction(any(), any());
        verify(financialTransactionRepository, times(1)).save(staleIncome);
        assertThat(staleIncome.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(paidAmount));
    }

    @Test
    @DisplayName("ensureConsultationDepositIncome — posted 금액=accurate·shop 링크 없으면 멱등(저장·생성 없음)")
    void ensureConsultationDepositIncome_matchingAmount_idempotent() {
        final long paidAmount = 10_000L;
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, paidAmount);
        FinancialTransaction income = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(BigDecimal.valueOf(paidAmount))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .build();
        income.setTenantId(TEST_TENANT_ID);
        income.setId(275L);

        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenReturn(List.of(income));
        when(amountManagementService.getAccurateTransactionAmount(mapping)).thenReturn(paidAmount);

        adminService.ensureConsultationDepositIncome(mapping);

        verify(financialTransactionService, never()).createTransaction(any(), any());
        verify(financialTransactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("ensureConsultationDepositIncome — 금액일치·stale「무료1회」적요 → create 없이 remarks/description heal")
    void ensureConsultationDepositIncome_matchingAmount_staleFreeTitle_healsAttributionInPlace() {
        final long paidAmount = 10_000L;
        final String orderPublicId = "21c00712-344e-4713-b25c-60aaceb85729";
        final String paymentId = "PAY_1789818725351_bc1211bf";
        final String titleSnapshot = "상담 1회 패키지";

        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 1, paidAmount);
        mapping.setPackageName("무료1회");
        mapping.setPackagePrice(paidAmount);
        mapping.setPaymentAmount(paidAmount);
        mapping.setPaymentMethod(com.coresolution.consultation.constant.PaymentConstants.METHOD_CARD);
        mapping.setPaymentReference(orderPublicId);

        com.coresolution.consultation.entity.ShopClientOrder order =
                com.coresolution.consultation.entity.ShopClientOrder.builder()
                        .publicId(orderPublicId)
                        .cashDueMinor(paidAmount)
                        .build();
        com.coresolution.consultation.entity.ShopClientOrderLine line =
                com.coresolution.consultation.entity.ShopClientOrderLine.builder()
                        .clientOrder(order)
                        .titleSnapshot(titleSnapshot)
                        .sessionCountSnapshot(1)
                        .quantity(1)
                        .lineTotalMinor(paidAmount)
                        .consultantClientMappingId(MAPPING_ID)
                        .build();

        com.coresolution.consultation.repository.ShopClientOrderLineRepository shopLineRepo =
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.repository.ShopClientOrderLineRepository.class);
        com.coresolution.consultation.repository.PaymentRepository paymentRepo =
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class);
        adminService = rebuildAdminService(shopLineRepo, paymentRepo);

        FinancialTransaction staleIncome = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(BigDecimal.valueOf(paidAmount))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .description("상담료 입금 확인 - 무료1회 (현금) [정확한금액: 10,000원]")
                .remarks("orderPublicId=SHOP-OLD-FREE; paymentId=-")
                .build();
        staleIncome.setTenantId(TEST_TENANT_ID);
        staleIncome.setId(269L);

        com.coresolution.consultation.entity.Payment approvedPayment =
                com.coresolution.consultation.entity.Payment.builder()
                        .orderId(orderPublicId)
                        .paymentId(paymentId)
                        .status(com.coresolution.consultation.entity.Payment.PaymentStatus.APPROVED)
                        .amount(BigDecimal.valueOf(paidAmount))
                        .build();
        approvedPayment.setTenantId(TEST_TENANT_ID);

        when(shopLineRepo.findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TEST_TENANT_ID), eq(List.of(MAPPING_ID))))
                .thenReturn(List.of(line));
        when(paymentRepo.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        eq(TEST_TENANT_ID),
                        eq(orderPublicId),
                        eq(com.coresolution.consultation.entity.Payment.PaymentStatus.APPROVED)))
                .thenReturn(Optional.of(approvedPayment));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenReturn(List.of(staleIncome));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(consultantSalaryProfileRepository
                        .findFirstByTenantIdAndConsultantIdAndIsActiveTrueOrderByUpdatedAtDescIdDesc(
                                eq(TEST_TENANT_ID), any()))
                .thenReturn(Optional.empty());
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        adminService.ensureConsultationDepositIncome(mapping);

        verify(financialTransactionService, never()).createTransaction(any(), any());
        verify(financialTransactionRepository, times(1)).save(staleIncome);
        assertThat(staleIncome.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(paidAmount));
        assertThat(staleIncome.getRemarks()).contains(orderPublicId);
        assertThat(staleIncome.getRemarks()).contains(paymentId);
        assertThat(staleIncome.getDescription()).contains(titleSnapshot);
        assertThat(staleIncome.getDescription()).doesNotContain("무료1회");
        verify(amountManagementService, never()).getAccurateTransactionAmount(any());
    }

    @Test
    @DisplayName("Path B fixture: packageName=무료1회·packagePrice≠10000 → INCOME amount=주문 lineTotal 10000")
    void ensureConsultationDepositIncome_staleFreePackage_usesOrderLineTotal() {
        final long orderPaid = 10_000L;
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 1, 0L);
        mapping.setPackageName("무료1회");
        mapping.setPackagePrice(0L);
        mapping.setPaymentAmount(0L);
        mapping.setPaymentMethod(com.coresolution.consultation.constant.PaymentConstants.METHOD_CARD);
        mapping.setPaymentReference("SHOP-20260917-003");

        com.coresolution.consultation.entity.ShopClientOrder order =
                com.coresolution.consultation.entity.ShopClientOrder.builder()
                        .publicId("SHOP-20260917-003")
                        .cashDueMinor(orderPaid)
                        .build();
        com.coresolution.consultation.entity.ShopClientOrderLine line =
                com.coresolution.consultation.entity.ShopClientOrderLine.builder()
                        .clientOrder(order)
                        .titleSnapshot("상담 패키지")
                        .sessionCountSnapshot(1)
                        .quantity(1)
                        .lineTotalMinor(orderPaid)
                        .consultantClientMappingId(MAPPING_ID)
                        .build();

        com.coresolution.consultation.repository.ShopClientOrderLineRepository shopLineRepo =
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.repository.ShopClientOrderLineRepository.class);
        com.coresolution.consultation.repository.PaymentRepository paymentRepo =
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class);
        adminService = rebuildAdminService(shopLineRepo, paymentRepo);

        when(shopLineRepo.findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TEST_TENANT_ID), eq(List.of(MAPPING_ID))))
                .thenReturn(List.of(line));
        when(amountManagementService.checkAmountConsistency(MAPPING_ID))
                .thenReturn(new AmountManagementService.AmountConsistencyResult(true, null, null, null));
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        FinancialTransaction created = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal(orderPaid))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .build();
        created.setId(9901L);
        created.setTenantId(TEST_TENANT_ID);
        java.util.concurrent.atomic.AtomicBoolean incomeCreated =
                new java.util.concurrent.atomic.AtomicBoolean(false);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenAnswer(inv -> {
                    FinancialTransactionRequest req = inv.getArgument(0);
                    created.setDescription(req.getDescription());
                    created.setRemarks(req.getRemarks());
                    created.setAmount(req.getAmount());
                    incomeCreated.set(true);
                    return FinancialTransactionResponse.builder().id(9901L).build();
                });
        when(financialTransactionRepository.findByTenantIdAndId(TEST_TENANT_ID, 9901L))
                .thenReturn(Optional.of(created));
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenAnswer(inv -> incomeCreated.get()
                        ? List.of(created)
                        : Collections.emptyList());
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());

        adminService.ensureConsultationDepositIncome(mapping);

        ArgumentCaptor<FinancialTransactionRequest> captor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService).createTransaction(captor.capture(), isNull());
        FinancialTransactionRequest request = captor.getValue();
        assertThat(request.getAmount()).isEqualByComparingTo(new BigDecimal(orderPaid));
        assertThat(request.getDescription()).contains("상담 패키지");
        assertThat(request.getDescription()).contains("온라인(카드)");
        assertThat(request.getDescription()).doesNotContain("현금");
        assertThat(request.getRemarks()).contains("SHOP-20260917-003");
        assertThat(request.getPaymentMethod())
                .isEqualTo(com.coresolution.consultation.constant.PaymentMethodSsotConstants.CODE_CREDIT_CARD);
        verify(amountManagementService, never()).getAccurateTransactionAmount(any());
    }

    @Test
    @DisplayName("Path B: packagePrice=1000·cashDue=10000·lineTotal=10000 → INCOME 10000")
    void ensureConsultationDepositIncome_stalePackagePrice_usesCashDueAndLineTotal() {
        final long stalePackage = 1_000L;
        final long orderPaid = 10_000L;
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, stalePackage);
        mapping.setPackagePrice(stalePackage);
        mapping.setPaymentAmount(stalePackage);
        mapping.setPaymentMethod(com.coresolution.consultation.constant.PaymentConstants.METHOD_CARD);
        mapping.setPaymentReference("SHOP-20260917-003");

        com.coresolution.consultation.entity.ShopClientOrder order =
                com.coresolution.consultation.entity.ShopClientOrder.builder()
                        .publicId("SHOP-20260917-003")
                        .cashDueMinor(orderPaid)
                        .build();
        com.coresolution.consultation.entity.ShopClientOrderLine line =
                com.coresolution.consultation.entity.ShopClientOrderLine.builder()
                        .clientOrder(order)
                        .titleSnapshot("상담 10회")
                        .sessionCountSnapshot(10)
                        .quantity(1)
                        .lineTotalMinor(orderPaid)
                        .consultantClientMappingId(MAPPING_ID)
                        .build();

        com.coresolution.consultation.repository.ShopClientOrderLineRepository shopLineRepo =
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.repository.ShopClientOrderLineRepository.class);
        com.coresolution.consultation.repository.PaymentRepository paymentRepo =
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class);
        adminService = rebuildAdminService(shopLineRepo, paymentRepo);

        when(shopLineRepo.findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TEST_TENANT_ID), eq(List.of(MAPPING_ID))))
                .thenReturn(List.of(line));
        when(amountManagementService.checkAmountConsistency(MAPPING_ID))
                .thenReturn(new AmountManagementService.AmountConsistencyResult(true, null, null, null));
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        FinancialTransaction created = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal(orderPaid))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .build();
        created.setId(9910L);
        created.setTenantId(TEST_TENANT_ID);
        java.util.concurrent.atomic.AtomicBoolean incomeCreated =
                new java.util.concurrent.atomic.AtomicBoolean(false);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenAnswer(inv -> {
                    FinancialTransactionRequest req = inv.getArgument(0);
                    created.setDescription(req.getDescription());
                    created.setRemarks(req.getRemarks());
                    created.setAmount(req.getAmount());
                    incomeCreated.set(true);
                    return FinancialTransactionResponse.builder().id(9910L).build();
                });
        when(financialTransactionRepository.findByTenantIdAndId(TEST_TENANT_ID, 9910L))
                .thenReturn(Optional.of(created));
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenAnswer(inv -> incomeCreated.get()
                        ? List.of(created)
                        : Collections.emptyList());
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());

        adminService.ensureConsultationDepositIncome(mapping);

        ArgumentCaptor<FinancialTransactionRequest> captor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService).createTransaction(captor.capture(), isNull());
        assertThat(captor.getValue().getAmount()).isEqualByComparingTo(new BigDecimal(orderPaid));
        verify(amountManagementService, never()).getAccurateTransactionAmount(any());
    }

    @Test
    @DisplayName("Path B: lineTotal=1000 & cashDue=10000 → INCOME 10000 (cashDue 우선)")
    void ensureConsultationDepositIncome_staleLineTotal_prefersCashDue() {
        final long staleLine = 1_000L;
        final long cashDue = 10_000L;
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, staleLine);
        mapping.setPackagePrice(staleLine);
        mapping.setPaymentAmount(staleLine);

        com.coresolution.consultation.entity.ShopClientOrder order =
                com.coresolution.consultation.entity.ShopClientOrder.builder()
                        .publicId("SHOP-20260917-003")
                        .cashDueMinor(cashDue)
                        .build();
        com.coresolution.consultation.entity.ShopClientOrderLine line =
                com.coresolution.consultation.entity.ShopClientOrderLine.builder()
                        .clientOrder(order)
                        .titleSnapshot("상담 10회")
                        .sessionCountSnapshot(10)
                        .quantity(1)
                        .lineTotalMinor(staleLine)
                        .consultantClientMappingId(MAPPING_ID)
                        .build();

        com.coresolution.consultation.repository.ShopClientOrderLineRepository shopLineRepo =
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.repository.ShopClientOrderLineRepository.class);
        com.coresolution.consultation.repository.PaymentRepository paymentRepo =
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class);
        adminService = rebuildAdminService(shopLineRepo, paymentRepo);

        when(shopLineRepo.findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TEST_TENANT_ID), eq(List.of(MAPPING_ID))))
                .thenReturn(List.of(line));
        when(amountManagementService.checkAmountConsistency(MAPPING_ID))
                .thenReturn(new AmountManagementService.AmountConsistencyResult(true, null, null, null));
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        FinancialTransaction created = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal(cashDue))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .build();
        created.setId(9911L);
        created.setTenantId(TEST_TENANT_ID);
        java.util.concurrent.atomic.AtomicBoolean incomeCreated =
                new java.util.concurrent.atomic.AtomicBoolean(false);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenAnswer(inv -> {
                    FinancialTransactionRequest req = inv.getArgument(0);
                    created.setDescription(req.getDescription());
                    created.setRemarks(req.getRemarks());
                    created.setAmount(req.getAmount());
                    incomeCreated.set(true);
                    return FinancialTransactionResponse.builder().id(9911L).build();
                });
        when(financialTransactionRepository.findByTenantIdAndId(TEST_TENANT_ID, 9911L))
                .thenReturn(Optional.of(created));
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenAnswer(inv -> incomeCreated.get()
                        ? List.of(created)
                        : Collections.emptyList());
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());

        adminService.ensureConsultationDepositIncome(mapping);

        ArgumentCaptor<FinancialTransactionRequest> captor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService).createTransaction(captor.capture(), isNull());
        assertThat(captor.getValue().getAmount()).isEqualByComparingTo(new BigDecimal(cashDue));
        verify(amountManagementService, never()).getAccurateTransactionAmount(any());
    }

    @Test
    @DisplayName("Path B: posted INCOME 1000 + cashDue=10000 → update-in-place로 최종 10000(이중 생성 없음)")
    void ensureConsultationDepositIncome_stalePostedIncome_healsInPlaceFromCashDue() {
        final long staleIncome = 1_000L;
        final long orderPaid = 10_000L;
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, staleIncome);
        mapping.setPackagePrice(staleIncome);
        mapping.setPaymentAmount(staleIncome);

        com.coresolution.consultation.entity.ShopClientOrder order =
                com.coresolution.consultation.entity.ShopClientOrder.builder()
                        .publicId("SHOP-20260917-003")
                        .cashDueMinor(orderPaid)
                        .build();
        com.coresolution.consultation.entity.ShopClientOrderLine line =
                com.coresolution.consultation.entity.ShopClientOrderLine.builder()
                        .clientOrder(order)
                        .titleSnapshot("상담 10회")
                        .sessionCountSnapshot(10)
                        .quantity(1)
                        .lineTotalMinor(orderPaid)
                        .consultantClientMappingId(MAPPING_ID)
                        .build();

        com.coresolution.consultation.repository.ShopClientOrderLineRepository shopLineRepo =
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.repository.ShopClientOrderLineRepository.class);
        com.coresolution.consultation.repository.PaymentRepository paymentRepo =
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class);
        adminService = rebuildAdminService(shopLineRepo, paymentRepo);

        FinancialTransaction stalePosted = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal(staleIncome))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .build();
        stalePosted.setId(1001L);
        stalePosted.setTenantId(TEST_TENANT_ID);

        when(shopLineRepo.findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TEST_TENANT_ID), eq(List.of(MAPPING_ID))))
                .thenReturn(List.of(line));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenReturn(List.of(stalePosted));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(consultantSalaryProfileRepository
                        .findFirstByTenantIdAndConsultantIdAndIsActiveTrueOrderByUpdatedAtDescIdDesc(
                                eq(TEST_TENANT_ID), any()))
                .thenReturn(Optional.empty());
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        adminService.ensureConsultationDepositIncome(mapping);

        verify(financialTransactionService, never()).createTransaction(any(), any());
        verify(financialTransactionService, never()).cancelRelatedPostedIncomeTransactions(any(), any());
        verify(financialTransactionRepository, times(1)).save(stalePosted);
        assertThat(stalePosted.getAmount()).isEqualByComparingTo(new BigDecimal(orderPaid));
        verify(amountManagementService, never()).getAccurateTransactionAmount(any());
    }

    @Test
    @DisplayName("shop confirmPayment — INCOME 미생성(ensure 전용 writer)")
    void confirmPayment_shopLinked_doesNotCreateIncome() {
        final long cashDue = 10_000L;
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, cashDue);
        mapping.setPaymentMethod(com.coresolution.consultation.constant.PaymentMethodSsotConstants.CODE_CASH);

        com.coresolution.consultation.entity.ShopClientOrder order =
                com.coresolution.consultation.entity.ShopClientOrder.builder()
                        .publicId("SHOP-20260917-003")
                        .cashDueMinor(cashDue)
                        .build();
        com.coresolution.consultation.entity.ShopClientOrderLine line =
                com.coresolution.consultation.entity.ShopClientOrderLine.builder()
                        .clientOrder(order)
                        .titleSnapshot("상담 10회")
                        .sessionCountSnapshot(10)
                        .quantity(1)
                        .lineTotalMinor(cashDue)
                        .consultantClientMappingId(MAPPING_ID)
                        .build();
        com.coresolution.consultation.repository.ShopClientOrderLineRepository shopLineRepo =
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.repository.ShopClientOrderLineRepository.class);
        com.coresolution.consultation.repository.PaymentRepository paymentRepo =
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class);
        when(shopLineRepo.findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TEST_TENANT_ID), eq(List.of(MAPPING_ID))))
                .thenReturn(List.of(line));
        adminService = rebuildAdminService(shopLineRepo, paymentRepo);

        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(paymentMethodSsotService.normalizeToCanonicalCodeValue(
                        eq(TEST_TENANT_ID),
                        eq(com.coresolution.consultation.constant.PaymentMethodSsotConstants.CODE_CREDIT_CARD)))
                .thenReturn(com.coresolution.consultation.constant.PaymentMethodSsotConstants.CODE_CREDIT_CARD);

        adminService.confirmPayment(
                MAPPING_ID,
                com.coresolution.consultation.constant.PaymentMethodSsotConstants.CODE_CREDIT_CARD,
                "SHOP-20260917-003",
                cashDue);

        verify(financialTransactionService, never()).createTransaction(any(), any());
        assertThat(mapping.getPaymentMethod())
                .isEqualTo(com.coresolution.consultation.constant.PaymentMethodSsotConstants.CODE_CREDIT_CARD);
    }

    @Test
    @DisplayName("ensureConsultationDepositIncome — cashDue 10000 INCOME 생성 + CASH→CREDIT_CARD")
    void ensureConsultationDepositIncome_cashDue10000_createsIncomeAndForcesCreditCard() {
        final long cashDue = 10_000L;
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, 0L);
        mapping.setPackagePrice(0L);
        mapping.setPaymentAmount(0L);
        mapping.setPaymentMethod(com.coresolution.consultation.constant.PaymentMethodSsotConstants.CODE_CASH);
        mapping.setPaymentReference("SHOP-20260917-003");

        com.coresolution.consultation.entity.ShopClientOrder order =
                com.coresolution.consultation.entity.ShopClientOrder.builder()
                        .publicId("SHOP-20260917-003")
                        .cashDueMinor(cashDue)
                        .build();
        com.coresolution.consultation.entity.ShopClientOrderLine line =
                com.coresolution.consultation.entity.ShopClientOrderLine.builder()
                        .clientOrder(order)
                        .titleSnapshot("상담 10회")
                        .sessionCountSnapshot(10)
                        .quantity(1)
                        .lineTotalMinor(cashDue)
                        .consultantClientMappingId(MAPPING_ID)
                        .build();
        com.coresolution.consultation.repository.ShopClientOrderLineRepository shopLineRepo =
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.repository.ShopClientOrderLineRepository.class);
        com.coresolution.consultation.repository.PaymentRepository paymentRepo =
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class);
        adminService = rebuildAdminService(shopLineRepo, paymentRepo);

        FinancialTransaction repairedIncome = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal(cashDue))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .build();
        repairedIncome.setTenantId(TEST_TENANT_ID);
        repairedIncome.setId(8801L);

        when(shopLineRepo.findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TEST_TENANT_ID), eq(List.of(MAPPING_ID))))
                .thenReturn(List.of(line));
        when(amountManagementService.checkAmountConsistency(MAPPING_ID))
                .thenReturn(new AmountManagementService.AmountConsistencyResult(true, null, null, null));
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        java.util.concurrent.atomic.AtomicBoolean incomeCreated =
                new java.util.concurrent.atomic.AtomicBoolean(false);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenAnswer(inv -> {
                    FinancialTransactionRequest req = inv.getArgument(0);
                    repairedIncome.setDescription(req.getDescription());
                    repairedIncome.setRemarks(req.getRemarks());
                    repairedIncome.setAmount(req.getAmount());
                    incomeCreated.set(true);
                    return FinancialTransactionResponse.builder().id(8801L).build();
                });
        when(financialTransactionRepository.findByTenantIdAndId(TEST_TENANT_ID, 8801L))
                .thenReturn(Optional.of(repairedIncome));
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenAnswer(inv -> incomeCreated.get()
                        ? List.of(repairedIncome)
                        : Collections.emptyList());
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());

        adminService.ensureConsultationDepositIncome(mapping);

        ArgumentCaptor<FinancialTransactionRequest> captor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService).createTransaction(captor.capture(), isNull());
        assertThat(captor.getValue().getAmount()).isEqualByComparingTo(new BigDecimal(cashDue));
        assertThat(captor.getValue().getTransactionType()).isEqualTo("INCOME");
        assertThat(mapping.getPaymentMethod())
                .isEqualTo(com.coresolution.consultation.constant.PaymentMethodSsotConstants.CODE_CREDIT_CARD);
        assertThat(mapping.getPaymentAmount()).isEqualTo(cashDue);
    }

    @Test
    @DisplayName("Path B 환불: 타주문 stale INCOME은 가로채지 않고 현재 주문 INCOME 생성 후 EXPENSE")
    void createShopOrderMappingRefundExpense_staleIncome_createsCurrentOrderIncomeThenExpense() {
        final long staleIncome = 1_000L;
        final long orderPaid = 10_000L;
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, staleIncome);
        mapping.setPackagePrice(staleIncome);
        mapping.setPaymentAmount(staleIncome);

        com.coresolution.consultation.entity.ShopClientOrder order =
                com.coresolution.consultation.entity.ShopClientOrder.builder()
                        .publicId("SHOP-20260917-003")
                        .cashDueMinor(orderPaid)
                        .build();
        com.coresolution.consultation.entity.ShopClientOrderLine line =
                com.coresolution.consultation.entity.ShopClientOrderLine.builder()
                        .clientOrder(order)
                        .titleSnapshot("상담 10회")
                        .sessionCountSnapshot(10)
                        .quantity(1)
                        .lineTotalMinor(orderPaid)
                        .consultantClientMappingId(MAPPING_ID)
                        .build();
        com.coresolution.consultation.repository.ShopClientOrderLineRepository shopLineRepo =
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.repository.ShopClientOrderLineRepository.class);
        com.coresolution.consultation.repository.PaymentRepository paymentRepo =
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class);
        when(shopLineRepo.findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TEST_TENANT_ID), eq(List.of(MAPPING_ID))))
                .thenReturn(List.of(line));
        adminService = rebuildAdminService(shopLineRepo, paymentRepo);

        FinancialTransaction stalePosted = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal(staleIncome))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .description("상담료 입금 확인 - 무료1회 (현금) [정확한금액: 1,000원]")
                .remarks("orderPublicId=SHOP-OLD; paymentId=-")
                .build();
        stalePosted.setId(2001L);
        stalePosted.setTenantId(TEST_TENANT_ID);

        FinancialTransaction createdIncome = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal(orderPaid))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .description("상담료 입금 확인 - 상담 10회")
                .remarks("orderPublicId=SHOP-20260917-003; paymentId=-")
                .build();
        createdIncome.setId(3001L);
        createdIncome.setTenantId(TEST_TENANT_ID);

        java.util.concurrent.atomic.AtomicBoolean incomeCreated =
                new java.util.concurrent.atomic.AtomicBoolean(false);
        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenAnswer(inv -> incomeCreated.get()
                        ? List.of(stalePosted, createdIncome)
                        : List.of(stalePosted));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(consultantSalaryProfileRepository
                        .findFirstByTenantIdAndConsultantIdAndIsActiveTrueOrderByUpdatedAtDescIdDesc(
                                eq(TEST_TENANT_ID), any()))
                .thenReturn(Optional.empty());
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenAnswer(inv -> {
                    FinancialTransactionRequest req = inv.getArgument(0);
                    if ("INCOME".equals(req.getTransactionType())) {
                        incomeCreated.set(true);
                        return FinancialTransactionResponse.builder().id(3001L).build();
                    }
                    return FinancialTransactionResponse.builder().id(3002L).build();
                });
        when(financialTransactionRepository.findByTenantIdAndId(TEST_TENANT_ID, 3001L))
                .thenReturn(Optional.of(createdIncome));
        lenient().when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        "CONSULTANT_CLIENT_MAPPING_REFUND"))
                .thenReturn(Collections.emptyList());

        adminService.createShopOrderMappingRefundExpense(
                TEST_TENANT_ID, MAPPING_ID, "Shop order full refund", "상담 10회", 10);

        ArgumentCaptor<FinancialTransactionRequest> captor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService, times(2)).createTransaction(captor.capture(), isNull());
        List<FinancialTransactionRequest> reqs = captor.getAllValues();
        assertThat(reqs.get(0).getTransactionType()).isEqualTo("INCOME");
        assertThat(reqs.get(0).getAmount()).isEqualByComparingTo(new BigDecimal(orderPaid));
        assertThat(reqs.get(0).getRemarks()).contains("SHOP-20260917-003");
        assertThat(reqs.get(1).getTransactionType()).isEqualTo("EXPENSE");
        assertThat(reqs.get(1).getAmount()).isEqualByComparingTo(new BigDecimal(orderPaid));
        // 타주문 stale INCOME 유지
        assertThat(stalePosted.getAmount()).isEqualByComparingTo(new BigDecimal(staleIncome));
        assertThat(stalePosted.getRemarks()).contains("SHOP-OLD");
        verify(financialTransactionService, never()).cancelRelatedPostedIncomeTransactions(any(), any());
    }

    @Test
    @DisplayName("reverse 후 packageName=무료1회·0회기여도 EXPENSE는 titleSnapshot·10회기 (리더 SHOP-003)")
    void createShopOrderMappingRefundExpense_afterReverseZeroSessions_usesLineSnapshot() {
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 0, 10_000L);
        mapping.setPackageName("무료1회");
        mapping.setRemainingSessions(0);
        mapping.setUsedSessions(0);

        com.coresolution.consultation.entity.ShopClientOrder order =
                com.coresolution.consultation.entity.ShopClientOrder.builder()
                        .publicId("SHOP-20260917-003")
                        .cashDueMinor(10_000L)
                        .build();
        com.coresolution.consultation.entity.ShopClientOrderLine line =
                com.coresolution.consultation.entity.ShopClientOrderLine.builder()
                        .clientOrder(order)
                        .titleSnapshot("테스트 10,000원")
                        .sessionCountSnapshot(10)
                        .quantity(1)
                        .lineTotalMinor(10_000L)
                        .consultantClientMappingId(MAPPING_ID)
                        .build();
        com.coresolution.consultation.repository.ShopClientOrderLineRepository shopLineRepo =
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.repository.ShopClientOrderLineRepository.class);
        com.coresolution.consultation.repository.PaymentRepository paymentRepo =
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class);
        when(shopLineRepo.findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TEST_TENANT_ID), eq(List.of(MAPPING_ID))))
                .thenReturn(List.of(line));
        com.coresolution.consultation.entity.Payment payment =
                com.coresolution.consultation.entity.Payment.builder()
                        .paymentId("PAY_TEST_003")
                        .orderId("SHOP-20260917-003")
                        .status(com.coresolution.consultation.entity.Payment.PaymentStatus.APPROVED)
                        .build();
        when(paymentRepo.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        eq(TEST_TENANT_ID),
                        eq("SHOP-20260917-003"),
                        eq(com.coresolution.consultation.entity.Payment.PaymentStatus.APPROVED)))
                .thenReturn(Optional.of(payment));
        adminService = rebuildAdminService(shopLineRepo, paymentRepo);

        FinancialTransaction income = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal("10000"))
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
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());
        lenient().when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        "CONSULTANT_CLIENT_MAPPING_REFUND"))
                .thenReturn(Collections.emptyList());
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenReturn(null);

        adminService.createShopOrderMappingRefundExpense(
                TEST_TENANT_ID, MAPPING_ID, "Shop order full refund", "테스트 10,000원", 10);

        ArgumentCaptor<FinancialTransactionRequest> captor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService).createTransaction(captor.capture(), isNull());
        FinancialTransactionRequest request = captor.getValue();
        assertThat(request.getAmount()).isEqualByComparingTo(new BigDecimal("10000"));
        assertThat(request.getDescription()).contains("테스트 10,000원");
        assertThat(request.getDescription()).contains("10회기 환불");
        assertThat(request.getDescription()).doesNotContain("무료1회");
        assertThat(request.getDescription()).doesNotContain("(0회기");
        assertThat(request.getRemarks()).contains("SHOP-20260917-003");
        assertThat(request.getRemarks()).contains("PAY_TEST_003");
    }

    @Test
    @DisplayName("INCOME 수리 실패(금액 없음) — EXPENSE 생성 금지 throw")
    void createShopOrderMappingRefundExpense_noIncomeAndNoAmount_throwsWithoutExpense() {
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 0, 0L);
        mapping.setPackagePrice(0L);
        mapping.setPaymentAmount(0L);
        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenReturn(Collections.emptyList());
        when(amountManagementService.getAccurateTransactionAmount(mapping)).thenReturn(null);

        assertThatThrownBy(() ->
                        adminService.createShopOrderMappingRefundExpense(
                                TEST_TENANT_ID, MAPPING_ID, "Shop order full refund", "PathB Package", 10))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("MappingID=" + MAPPING_ID);
        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    @Test
    @DisplayName("라인 스냅샷·캡처 없으면 fail-closed (packageName fallback 금지)")
    void createShopOrderMappingRefundExpense_missingLineSnapshot_throws() {
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, 10_000L);
        mapping.setPackageName("무료1회");
        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));

        assertThatThrownBy(() ->
                        adminService.createShopOrderMappingRefundExpense(
                                TEST_TENANT_ID, MAPPING_ID, "Shop order full refund"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("titleSnapshot");
        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    @Test
    @DisplayName("잘못된 EXPENSE 적요(무료1회·0회기) — CANCEL+재생성으로 title·회기 SSOT heal")
    void createShopOrderMappingRefundExpense_staleExpenseDescription_heals() {
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 0, 10_000L);
        mapping.setPackageName("무료1회");
        mapping.setRemainingSessions(0);
        mapping.setUsedSessions(0);

        FinancialTransaction income = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal("10000"))
                .status(FinancialTransaction.TransactionStatus.APPROVED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .build();
        income.setTenantId(TEST_TENANT_ID);

        FinancialTransaction staleExpense = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.EXPENSE)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal("10000"))
                .status(FinancialTransaction.TransactionStatus.APPROVED)
                .description("상담료 환불 - 무료1회 (0회기 환불, 사유: Shop order full refund)")
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType("CONSULTANT_CLIENT_MAPPING_REFUND")
                .build();
        staleExpense.setId(8801L);
        staleExpense.setTenantId(TEST_TENANT_ID);

        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenReturn(List.of(income));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());
        lenient().when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        "CONSULTANT_CLIENT_MAPPING_REFUND"))
                .thenReturn(List.of(staleExpense));
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenReturn(null);
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        adminService.createShopOrderMappingRefundExpense(
                TEST_TENANT_ID, MAPPING_ID, "Shop order full refund", "테스트 10,000원", 10);

        assertThat(staleExpense.getStatus()).isEqualTo(FinancialTransaction.TransactionStatus.CANCELLED);
        verify(financialTransactionRepository).save(staleExpense);
        ArgumentCaptor<FinancialTransactionRequest> captor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService).createTransaction(captor.capture(), isNull());
        FinancialTransactionRequest request = captor.getValue();
        assertThat(request.getDescription()).contains("테스트 10,000원");
        assertThat(request.getDescription()).contains("10회기 환불");
        assertThat(request.getDescription()).doesNotContain("무료1회");
        assertThat(request.getDescription()).doesNotContain("(0회기");
    }

    @Test
    @DisplayName("claim SSOT: 타주문 posted INCOME 있으면 가로채지 않고 현재 주문 INCOME 신규 생성")
    void ensureConsultationDepositIncome_claimSsot_createsNewIncomeWithoutStealingForeignOrder() {
        final long stalePrice = 1_000L;
        final long cashDue = 10_000L;
        final String orderPublicId = "SHOP-CLAIM-10000";
        final String paymentId = "PAY_CLAIM_10000";
        final String titleSnapshot = "테스트 10,000원";

        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, stalePrice);
        mapping.setPackageName("테스트 1,000원");
        mapping.setPackagePrice(stalePrice);
        mapping.setPaymentAmount(stalePrice);
        mapping.setPaymentMethod(com.coresolution.consultation.constant.PaymentConstants.METHOD_CARD);

        com.coresolution.consultation.entity.ShopClientOrder newerOrder =
                com.coresolution.consultation.entity.ShopClientOrder.builder()
                        .publicId("SHOP-NEWER-HIJACK")
                        .cashDueMinor(stalePrice)
                        .build();
        com.coresolution.consultation.entity.ShopClientOrderLine newerLine =
                com.coresolution.consultation.entity.ShopClientOrderLine.builder()
                        .clientOrder(newerOrder)
                        .titleSnapshot("테스트 1,000원")
                        .sessionCountSnapshot(1)
                        .quantity(1)
                        .lineTotalMinor(stalePrice)
                        .consultantClientMappingId(MAPPING_ID)
                        .build();
        com.coresolution.consultation.entity.ShopClientOrder targetOrder =
                com.coresolution.consultation.entity.ShopClientOrder.builder()
                        .publicId(orderPublicId)
                        .cashDueMinor(cashDue)
                        .build();
        com.coresolution.consultation.entity.ShopClientOrderLine targetLine =
                com.coresolution.consultation.entity.ShopClientOrderLine.builder()
                        .clientOrder(targetOrder)
                        .titleSnapshot(titleSnapshot)
                        .sessionCountSnapshot(10)
                        .quantity(1)
                        .lineTotalMinor(cashDue)
                        .consultantClientMappingId(MAPPING_ID)
                        .build();

        com.coresolution.consultation.repository.ShopClientOrderLineRepository shopLineRepo =
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.repository.ShopClientOrderLineRepository.class);
        com.coresolution.consultation.repository.PaymentRepository paymentRepo =
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class);
        // id DESC: 최신(가로채기 후보)이 먼저 — claim.orderPublicId 매칭만 사용
        when(shopLineRepo.findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TEST_TENANT_ID), eq(List.of(MAPPING_ID))))
                .thenReturn(List.of(newerLine, targetLine));
        adminService = rebuildAdminService(shopLineRepo, paymentRepo);

        FinancialTransaction foreignPosted = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal(stalePrice))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .description("상담료 입금 확인 - 테스트 1,000원 (현금) [정확한금액: 1,000원]")
                .remarks("orderPublicId=SHOP-OTHER; paymentId=PAY_OTHER")
                .build();
        foreignPosted.setId(9101L);
        foreignPosted.setTenantId(TEST_TENANT_ID);

        FinancialTransaction createdIncome = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal(cashDue))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .description("상담료 입금 확인 - " + titleSnapshot)
                .remarks(String.format(
                        com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages
                                .REMARKS_SHOP_ORDER_INCOME_FMT,
                        orderPublicId,
                        paymentId))
                .build();
        createdIncome.setId(9202L);
        createdIncome.setTenantId(TEST_TENANT_ID);

        java.util.concurrent.atomic.AtomicBoolean incomeCreated = new java.util.concurrent.atomic.AtomicBoolean(false);
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenAnswer(inv -> incomeCreated.get()
                        ? List.of(foreignPosted, createdIncome)
                        : List.of(foreignPosted));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(amountManagementService.checkAmountConsistency(MAPPING_ID))
                .thenReturn(new AmountManagementService.AmountConsistencyResult(true, null, null, null));
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenAnswer(inv -> {
                    incomeCreated.set(true);
                    return FinancialTransactionResponse.builder().id(9202L).build();
                });
        when(financialTransactionRepository.findByTenantIdAndId(TEST_TENANT_ID, 9202L))
                .thenReturn(Optional.of(createdIncome));
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        com.coresolution.consultation.dto.shop.ShopOrderIncomeClaim claim =
                com.coresolution.consultation.dto.shop.ShopOrderIncomeClaim.builder()
                        .orderPublicId(orderPublicId)
                        .paymentId(paymentId)
                        .titleSnapshot(titleSnapshot)
                        .cashDueMinor(cashDue)
                        .sessionCount(10)
                        .build();

        adminService.ensureConsultationDepositIncome(mapping, claim);

        ArgumentCaptor<FinancialTransactionRequest> reqCaptor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService).createTransaction(reqCaptor.capture(), isNull());
        FinancialTransactionRequest created = reqCaptor.getValue();
        assertThat(created.getAmount()).isEqualByComparingTo(new BigDecimal(cashDue));
        assertThat(created.getDescription()).contains(titleSnapshot);
        assertThat(created.getRemarks()).isEqualTo(
                String.format(
                        com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages
                                .REMARKS_SHOP_ORDER_INCOME_FMT,
                        orderPublicId,
                        paymentId));
        // 타주문 INCOME 은 금액·비고 유지 (가로채기 금지)
        assertThat(foreignPosted.getAmount()).isEqualByComparingTo(new BigDecimal(stalePrice));
        assertThat(foreignPosted.getRemarks()).contains("SHOP-OTHER");
        assertThat(mapping.getPackageName()).isEqualTo(titleSnapshot);
        assertThat(mapping.getPackagePrice()).isEqualTo(cashDue);
        assertThat(mapping.getPaymentAmount()).isEqualTo(cashDue);
    }

    @Test
    @DisplayName("환불: 타주문 INCOME만 있으면 현재 주문 INCOME 생성 후 EXPENSE (EXPENSE-only 금지)")
    void createShopOrderMappingRefundExpense_foreignIncomeOnly_createsCurrentOrderIncomeThenExpense() {
        final long cashDue = 10_000L;
        final String orderPublicId = "SHOP-REFUND-CURRENT";
        final String titleSnapshot = "테스트 10,000원";

        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 1, cashDue);
        mapping.setPackageName(titleSnapshot);
        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));

        com.coresolution.consultation.entity.ShopClientOrder order =
                com.coresolution.consultation.entity.ShopClientOrder.builder()
                        .publicId(orderPublicId)
                        .cashDueMinor(cashDue)
                        .build();
        com.coresolution.consultation.entity.ShopClientOrderLine line =
                com.coresolution.consultation.entity.ShopClientOrderLine.builder()
                        .clientOrder(order)
                        .titleSnapshot(titleSnapshot)
                        .sessionCountSnapshot(1)
                        .quantity(1)
                        .lineTotalMinor(cashDue)
                        .consultantClientMappingId(MAPPING_ID)
                        .build();
        com.coresolution.consultation.repository.ShopClientOrderLineRepository shopLineRepo =
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.repository.ShopClientOrderLineRepository.class);
        com.coresolution.consultation.repository.PaymentRepository paymentRepo =
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class);
        when(shopLineRepo.findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TEST_TENANT_ID), eq(List.of(MAPPING_ID))))
                .thenReturn(List.of(line));
        when(paymentRepo.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        eq(TEST_TENANT_ID), eq(orderPublicId), any()))
                .thenReturn(Optional.empty());
        when(paymentRepo.findByTenantIdAndOrderIdAndIsDeletedFalse(TEST_TENANT_ID, orderPublicId))
                .thenReturn(Collections.emptyList());
        adminService = rebuildAdminService(shopLineRepo, paymentRepo);

        FinancialTransaction foreignIncome = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal(cashDue))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .description("상담료 입금 확인 - 테스트 10,000원")
                .remarks("orderPublicId=SHOP-OLD-PRIOR; paymentId=PAY_OLD")
                .build();
        foreignIncome.setId(269L);
        foreignIncome.setTenantId(TEST_TENANT_ID);

        FinancialTransaction newIncome = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal(cashDue))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .description("상담료 입금 확인 - " + titleSnapshot)
                .remarks("orderPublicId=" + orderPublicId + "; paymentId=-")
                .build();
        newIncome.setId(280L);
        newIncome.setTenantId(TEST_TENANT_ID);

        java.util.concurrent.atomic.AtomicBoolean incomeCreated = new java.util.concurrent.atomic.AtomicBoolean(false);
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenAnswer(inv -> incomeCreated.get()
                        ? List.of(foreignIncome, newIncome)
                        : List.of(foreignIncome));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_REFUND))
                .thenReturn(Collections.emptyList());
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(amountManagementService.checkAmountConsistency(MAPPING_ID))
                .thenReturn(new AmountManagementService.AmountConsistencyResult(true, null, null, null));
        lenient().when(amountManagementService.getAccurateTransactionAmount(mapping)).thenReturn(cashDue);
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenAnswer(inv -> {
                    FinancialTransactionRequest req = inv.getArgument(0);
                    if ("INCOME".equals(req.getTransactionType())) {
                        incomeCreated.set(true);
                        return FinancialTransactionResponse.builder().id(280L).build();
                    }
                    return FinancialTransactionResponse.builder().id(281L).build();
                });
        when(financialTransactionRepository.findByTenantIdAndId(TEST_TENANT_ID, 280L))
                .thenReturn(Optional.of(newIncome));
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        adminService.createShopOrderMappingRefundExpense(
                TEST_TENANT_ID,
                MAPPING_ID,
                "Shop order full refund",
                titleSnapshot,
                1,
                orderPublicId,
                cashDue);

        ArgumentCaptor<FinancialTransactionRequest> captor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService, times(2)).createTransaction(captor.capture(), isNull());
        List<FinancialTransactionRequest> reqs = captor.getAllValues();
        assertThat(reqs.get(0).getTransactionType()).isEqualTo("INCOME");
        assertThat(reqs.get(0).getAmount()).isEqualByComparingTo(new BigDecimal(cashDue));
        assertThat(reqs.get(0).getRemarks()).contains(orderPublicId);
        assertThat(reqs.get(1).getTransactionType()).isEqualTo("EXPENSE");
        assertThat(reqs.get(1).getAmount()).isEqualByComparingTo(new BigDecimal(cashDue));
        assertThat(reqs.get(1).getRelatedEntityType())
                .isEqualTo(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_REFUND);
        assertThat(foreignIncome.getRemarks()).contains("SHOP-OLD-PRIOR");
    }

    @Test
    @DisplayName("live 92c500fa: 동일금액 타주문 INCOME만 있어도 현재 주문 INCOME 신규+require(COMPLETED 위장 금지)")
    void ensureConsultationDepositIncome_liveEvidence_92c500fa_sameAmountForeignIncome_createsAttributed() {
        // Given: mapping 에 과거 주문 INCOME(동일 ₩10000)만 있고, 신규 PAID 주문 claim
        final long cashDue = 10_000L;
        final String priorOrderPublicId = "SHOP-PRIOR-2FD279FB";
        final String orderPublicId = "SHOP-20260917-003";
        final String paymentId = "PAY_92C500FA";
        final String titleSnapshot = "Consultation package";

        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, cashDue);
        mapping.setPackageName(titleSnapshot);
        mapping.setPackagePrice(cashDue);
        mapping.setPaymentAmount(cashDue);

        com.coresolution.consultation.entity.ShopClientOrder order =
                com.coresolution.consultation.entity.ShopClientOrder.builder()
                        .publicId(orderPublicId)
                        .cashDueMinor(cashDue)
                        .build();
        com.coresolution.consultation.entity.ShopClientOrderLine line =
                com.coresolution.consultation.entity.ShopClientOrderLine.builder()
                        .clientOrder(order)
                        .titleSnapshot(titleSnapshot)
                        .sessionCountSnapshot(10)
                        .quantity(1)
                        .lineTotalMinor(cashDue)
                        .consultantClientMappingId(MAPPING_ID)
                        .build();
        com.coresolution.consultation.repository.ShopClientOrderLineRepository shopLineRepo =
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.repository.ShopClientOrderLineRepository.class);
        com.coresolution.consultation.repository.PaymentRepository paymentRepo =
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class);
        when(shopLineRepo.findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TEST_TENANT_ID), eq(List.of(MAPPING_ID))))
                .thenReturn(List.of(line));
        adminService = rebuildAdminService(shopLineRepo, paymentRepo);

        FinancialTransaction foreignPosted = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal(cashDue))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .description("상담료 입금 확인 - prior")
                .remarks("orderPublicId=" + priorOrderPublicId + "; paymentId=PAY_OLD_269")
                .build();
        foreignPosted.setId(269L);
        foreignPosted.setTenantId(TEST_TENANT_ID);

        String expectedRemarks = String.format(
                com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages
                        .REMARKS_SHOP_ORDER_INCOME_FMT,
                orderPublicId,
                paymentId);
        FinancialTransaction createdIncome = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal(cashDue))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .description("상담료 입금 확인 - " + titleSnapshot)
                .remarks(expectedRemarks)
                .build();
        createdIncome.setId(280L);
        createdIncome.setTenantId(TEST_TENANT_ID);

        java.util.concurrent.atomic.AtomicBoolean incomeCreated =
                new java.util.concurrent.atomic.AtomicBoolean(false);
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenAnswer(inv -> incomeCreated.get()
                        ? List.of(foreignPosted, createdIncome)
                        : List.of(foreignPosted));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(amountManagementService.checkAmountConsistency(MAPPING_ID))
                .thenReturn(new AmountManagementService.AmountConsistencyResult(true, null, null, null));
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenAnswer(inv -> {
                    incomeCreated.set(true);
                    return FinancialTransactionResponse.builder().id(280L).build();
                });
        when(financialTransactionRepository.findByTenantIdAndId(TEST_TENANT_ID, 280L))
                .thenReturn(Optional.of(createdIncome));
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        com.coresolution.consultation.dto.shop.ShopOrderIncomeClaim claim =
                com.coresolution.consultation.dto.shop.ShopOrderIncomeClaim.builder()
                        .orderPublicId(orderPublicId)
                        .paymentId(paymentId)
                        .titleSnapshot(titleSnapshot)
                        .cashDueMinor(cashDue)
                        .sessionCount(10)
                        .build();

        // When
        adminService.ensureConsultationDepositIncome(mapping, claim);

        // Then: 타주문 INCOME(동일 금액)으로 early-success 금지 — 현재 주문 행 신규 생성
        ArgumentCaptor<FinancialTransactionRequest> reqCaptor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService).createTransaction(reqCaptor.capture(), isNull());
        assertThat(reqCaptor.getValue().getAmount()).isEqualByComparingTo(new BigDecimal(cashDue));
        assertThat(reqCaptor.getValue().getRemarks()).isEqualTo(expectedRemarks);
        assertThat(foreignPosted.getRemarks()).contains(priorOrderPublicId);
        assertThat(foreignPosted.getAmount()).isEqualByComparingTo(new BigDecimal(cashDue));
    }

    @Test
    @DisplayName("ensure: create 후에도 주문귀속 INCOME 없으면 fail-closed(COMPLETED 금지)")
    void ensureConsultationDepositIncome_createWithoutAttributedRow_throwsFailClosed() {
        final long cashDue = 10_000L;
        final String orderPublicId = "SHOP-FAIL-CLOSED-001";
        final String paymentId = "PAY_FAIL_CLOSED";
        final String titleSnapshot = "Fail closed package";

        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 1, cashDue);
        mapping.setPackageName(titleSnapshot);
        mapping.setPackagePrice(cashDue);
        mapping.setPaymentAmount(cashDue);

        com.coresolution.consultation.entity.ShopClientOrder order =
                com.coresolution.consultation.entity.ShopClientOrder.builder()
                        .publicId(orderPublicId)
                        .cashDueMinor(cashDue)
                        .build();
        com.coresolution.consultation.entity.ShopClientOrderLine line =
                com.coresolution.consultation.entity.ShopClientOrderLine.builder()
                        .clientOrder(order)
                        .titleSnapshot(titleSnapshot)
                        .sessionCountSnapshot(1)
                        .quantity(1)
                        .lineTotalMinor(cashDue)
                        .consultantClientMappingId(MAPPING_ID)
                        .build();
        com.coresolution.consultation.repository.ShopClientOrderLineRepository shopLineRepo =
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.repository.ShopClientOrderLineRepository.class);
        com.coresolution.consultation.repository.PaymentRepository paymentRepo =
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class);
        when(shopLineRepo.findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TEST_TENANT_ID), eq(List.of(MAPPING_ID))))
                .thenReturn(List.of(line));
        adminService = rebuildAdminService(shopLineRepo, paymentRepo);

        // createTransaction 은 성공처럼 보이지만 related-entity 조회에는 계속 빈 목록 → require fail-closed
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .thenReturn(Collections.emptyList());
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TEST_TENANT_ID,
                        MAPPING_ID,
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL))
                .thenReturn(Collections.emptyList());
        when(salaryTaxRateLookupService.getVatRate(TEST_TENANT_ID)).thenReturn(VAT_RATE);
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(amountManagementService.checkAmountConsistency(MAPPING_ID))
                .thenReturn(new AmountManagementService.AmountConsistencyResult(true, null, null, null));
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), isNull()))
                .thenReturn(FinancialTransactionResponse.builder().id(999L).build());
        FinancialTransaction ghost = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal(cashDue))
                .status(FinancialTransaction.TransactionStatus.PENDING)
                .relatedEntityId(MAPPING_ID)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .description("ghost")
                .remarks("orderPublicId=OTHER; paymentId=OTHER")
                .build();
        ghost.setId(999L);
        ghost.setTenantId(TEST_TENANT_ID);
        when(financialTransactionRepository.findByTenantIdAndId(TEST_TENANT_ID, 999L))
                .thenReturn(Optional.of(ghost));
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        com.coresolution.consultation.dto.shop.ShopOrderIncomeClaim claim =
                com.coresolution.consultation.dto.shop.ShopOrderIncomeClaim.builder()
                        .orderPublicId(orderPublicId)
                        .paymentId(paymentId)
                        .titleSnapshot(titleSnapshot)
                        .cashDueMinor(cashDue)
                        .sessionCount(1)
                        .build();

        assertThatThrownBy(() -> adminService.ensureConsultationDepositIncome(mapping, claim))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("COMPLETED 금지");
        verify(financialTransactionService).createTransaction(any(FinancialTransactionRequest.class), isNull());
    }

    @Test
    @DisplayName("Path B claim 없음·shop line empty → early return 성공 금지(금액 미결정)")
    void ensureConsultationDepositIncome_pathBEmptyLinesWithoutClaim_doesNotEarlySucceed() {
        ConsultantClientMapping mapping = buildMapping(MAPPING_ID, 10, 10_000L);
        mapping.setPackageName("테스트 1,000원");
        mapping.setPackagePrice(1_000L);
        mapping.setPaymentAmount(1_000L);

        com.coresolution.consultation.repository.ShopClientOrderLineRepository shopLineRepo =
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.repository.ShopClientOrderLineRepository.class);
        com.coresolution.consultation.repository.PaymentRepository paymentRepo =
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class);
        when(shopLineRepo.findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TEST_TENANT_ID), eq(List.of(MAPPING_ID))))
                .thenReturn(Collections.emptyList());
        adminService = rebuildAdminService(shopLineRepo, paymentRepo);

        // claim 은 Path B 신호이지만 identity/금액 없음 → resolve 실패 fail-closed
        com.coresolution.consultation.dto.shop.ShopOrderIncomeClaim emptyClaim =
                com.coresolution.consultation.dto.shop.ShopOrderIncomeClaim.builder().build();

        assertThatThrownBy(() -> adminService.ensureConsultationDepositIncome(mapping, emptyClaim))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("유효한 거래 금액을 결정할 수 없습니다");
        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    private AdminServiceImpl rebuildAdminService(
            com.coresolution.consultation.repository.ShopClientOrderLineRepository shopLineRepo,
            com.coresolution.consultation.repository.PaymentRepository paymentRepo) {
        return new AdminServiceImpl(
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
                        com.coresolution.consultation.repository.InstitutionLinkContractRepository.class),
                shopLineRepo,
                org.mockito.Mockito.mock(org.springframework.beans.factory.ObjectProvider.class),
                paymentRepo);
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
