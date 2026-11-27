package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopRefundConstants;
import com.coresolution.consultation.dto.FinancialTransactionRequest;
import com.coresolution.consultation.dto.shop.EffectivePointTenantPolicies;
import com.coresolution.consultation.dto.shop.admin.ShopOrderRefundResponse;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AmountManagementService;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.ClientPointWalletService;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MappingSettlementNotificationHelper;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PasswordResetService;
import com.coresolution.consultation.service.PaymentGatewayService;
import com.coresolution.consultation.service.PaymentMethodSsotService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.PointTenantPolicyService;
import com.coresolution.consultation.service.ProfessionalProviderTypeService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.RefundAutoCancelNotificationService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.ShopOrderFulfillmentService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserIdGenerator;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentCancelService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import com.coresolution.consultation.service.shop.ShopOrderRefundableAmountResolver;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * #1318 후속 — 누적 환불(매핑 측 부분 환불 + PG 환불) ≤ 결제액 통합 검증.
 *
 * <p>실제 {@link AdminServiceImpl#partialRefundMapping} 이 만든 부분 환불 EXPENSE(in-memory 원장)를
 * 실제 {@link AdminShopOrderRefundServiceImpl} + {@link ShopOrderRefundableAmountResolver} 가 읽는다.
 * PortOne 은 모킹 (실 PG 호출 없음).</p>
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("#1318 후속 누적 환불 상한 통합 (매핑 부분환불 → PG 환불 / 패키지 원회기 단가)")
class RefundCumulativeCapIntegrationTest {

    private static final String TENANT = "tenant-refund-cap-1318";
    private static final String ORDER_ID = "order-refund-cap-1";
    private static final String PAYMENT_ID = "pay-refund-cap-1";
    private static final long PAID = 100_000L;

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

    @Mock private ShopClientOrderRepository shopClientOrderRepository;
    @Mock private ShopClientOrderLineRepository shopClientOrderLineRepository;
    @Mock private ClientPointWalletService clientPointWalletService;
    @Mock private PointTenantPolicyService pointTenantPolicyService;
    @Mock private PaymentRepository paymentRepository;
    @Mock private PaymentService paymentService;
    @Mock private PaymentGatewayService paymentGatewayService;
    @Mock private ShopNotificationHelper shopNotificationHelper;
    @Mock private ShopOrderFulfillmentService shopOrderFulfillmentService;
    @Mock private PortOneV2PaymentCancelService portOneV2PaymentCancelService;
    @Mock private PortOneV2PaymentVerifyService portOneV2PaymentVerifyService;

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

    private final List<FinancialTransaction> ledger = new ArrayList<>();

    private AdminServiceImpl adminService;
    private AdminShopOrderRefundServiceImpl shopRefundService;

    @BeforeEach
    void setUp() {
        lenient().when(mappingRepository.findByTenantIdAndIdForUpdate(anyString(), anyLong()))
                .thenAnswer(inv -> mappingRepository.findByTenantIdAndId(inv.getArgument(0), inv.getArgument(1)));
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
                org.mockito.Mockito.mock(com.coresolution.consultation.service.SalaryLateSessionAutoSyncService.class),
                professionalProviderTypeService,
                mappingSettlementNotificationHelper,
                batchNotificationDispatchService,
                refundAutoCancelNotificationService,
                org.mockito.Mockito.mock(com.coresolution.consultation.service.UserLifecycleService.class),
                org.mockito.Mockito.mock(com.coresolution.consultation.service.AdminRequestIdempotencyService.class),
                org.mockito.Mockito.mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class),
                null,
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.repository.InstitutionLinkContractRepository.class),
                shopClientOrderLineRepository,
                paymentRepository);
        shopRefundService = new AdminShopOrderRefundServiceImpl(
                shopClientOrderRepository,
                clientPointWalletService,
                pointTenantPolicyService,
                paymentRepository,
                paymentService,
                shopNotificationHelper,
                shopOrderFulfillmentService,
                portOneV2PaymentCancelService,
                portOneV2PaymentVerifyService,
                new ShopOrderRefundableAmountResolver(
                        shopClientOrderLineRepository,
                        financialTransactionRepository,
                        portOneV2PaymentCancelService,
                        portOneV2PaymentVerifyService),
                org.mockito.Mockito.mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class),
                shopClientOrderLineRepository,
                noopTransactionManager,
                ShopRefundConstants.DEFAULT_ADMIN_REFUND_PG_LEASE_MS,
                paymentGatewayService);
        TenantContextHolder.setTenantId(TENANT);
        when(statusCodeHelper.getStatusCodeValue(anyString(), anyString()))
                .thenAnswer(inv -> inv.getArgument(1));
        stubLedger();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    // ── (a) 매핑 측 부분 환불 → PG 환불 ──

    @Test
    @DisplayName("(a) 매핑 부분환불 20,000 → PG 전액환불은 잔액 80,000 만 부분 취소, 누적 = 결제액")
    void mappingPartialRefundThenPgFullRefund_pgRefundsOnlyRemainder() {
        ConsultantClientMapping mapping = mapping(701L, 10, 100_000L);
        stubMapping(mapping);
        ShopClientOrder order = paidOrder(mapping.getId());
        Payment payment = iamportPayment();
        stubShopRefund(order, payment);

        adminService.partialRefundMapping(mapping.getId(), 2, "매핑 부분 환불");
        long mappingSideRefunded = sumLedgerRefunds();
        assertThat(mappingSideRefunded).isEqualTo(20_000L);

        ShopOrderRefundResponse response = shopRefundService.refundPaidOrder(
                TENANT, ORDER_ID, ShopRefundConstants.REASON_CUSTOMER_REQUEST);

        ArgumentCaptor<BigDecimal> pgAmount = ArgumentCaptor.forClass(BigDecimal.class);
        verify(portOneV2PaymentCancelService).cancelPaymentAmount(
                eq(TENANT), eq(PAYMENT_ID), anyString(), pgAmount.capture(), any());
        verify(portOneV2PaymentCancelService, never()).cancelPayment(anyString(), anyString(), anyString(), any());
        assertThat(pgAmount.getValue()).isEqualByComparingTo(BigDecimal.valueOf(80_000L));
        assertThat(mappingSideRefunded + pgAmount.getValue().longValue())
                .as("누적 환불(매핑 + PG) == 결제액")
                .isEqualTo(PAID);
        assertThat(response.getStatus()).isEqualTo(ShopClientOrderStatus.REFUNDED);
        assertThat(response.getPgRefundStatus()).isEqualTo(ShopRefundConstants.PG_REFUND_STATUS_COMPLETED);
    }

    @Test
    @DisplayName("(a) 잔액 환불 후 전액환불 재요청 → PG 추가 취소 0 (누적 == 결제액 유지)")
    void pgFullRefundRepeated_noAdditionalPgCancel() {
        ConsultantClientMapping mapping = mapping(702L, 10, 100_000L);
        stubMapping(mapping);
        ShopClientOrder order = paidOrder(mapping.getId());
        Payment payment = iamportPayment();
        stubShopRefund(order, payment);
        when(paymentService.refundPayment(eq(PAYMENT_ID), any(), anyString(), eq(false)))
                .thenAnswer(inv -> {
                    payment.setStatus(Payment.PaymentStatus.REFUNDED);
                    return null;
                });
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.REFUNDED))
                .thenAnswer(inv -> payment.getStatus() == Payment.PaymentStatus.REFUNDED
                        ? Optional.of(payment) : Optional.empty());

        adminService.partialRefundMapping(mapping.getId(), 2, "매핑 부분 환불");
        shopRefundService.refundPaidOrder(TENANT, ORDER_ID, ShopRefundConstants.REASON_CUSTOMER_REQUEST);
        ShopOrderRefundResponse second = shopRefundService.refundPaidOrder(
                TENANT, ORDER_ID, ShopRefundConstants.REASON_CUSTOMER_REQUEST);

        ArgumentCaptor<BigDecimal> pgAmount = ArgumentCaptor.forClass(BigDecimal.class);
        verify(portOneV2PaymentCancelService, times(1)).cancelPaymentAmount(
                eq(TENANT), eq(PAYMENT_ID), anyString(), pgAmount.capture(), any());
        verify(portOneV2PaymentCancelService, never()).cancelPayment(anyString(), anyString(), anyString(), any());
        long pgTotal = pgAmount.getAllValues().stream().mapToLong(BigDecimal::longValue).sum();
        assertThat(sumLedgerRefunds() + pgTotal).isEqualTo(PAID);
        assertThat(second.getPgRefundStatus()).isEqualTo(ShopRefundConstants.PG_REFUND_STATUS_COMPLETED);
    }

    @Test
    @DisplayName("(a) 매핑 측에서 결제액 전액 환불됨 → PG 호출 없이 거부 (명확한 오류)")
    void mappingFullyRefunded_pgRefundRejectedWithoutPgCall() {
        ConsultantClientMapping mapping = mapping(703L, 10, 100_000L);
        stubMapping(mapping);
        ShopClientOrder order = paidOrder(mapping.getId());
        Payment payment = iamportPayment();
        stubShopRefund(order, payment);

        adminService.partialRefundMapping(mapping.getId(), 10, "매핑 전 회기 부분 환불");
        assertThat(sumLedgerRefunds()).isEqualTo(PAID);

        assertThatThrownBy(() -> shopRefundService.refundPaidOrder(
                        TENANT, ORDER_ID, ShopRefundConstants.REASON_CUSTOMER_REQUEST))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("환불 가능 금액이 없습니다")
                .hasMessageContaining(ORDER_ID);
        verify(portOneV2PaymentCancelService, never()).cancelPayment(anyString(), anyString(), anyString(), any());
        verify(portOneV2PaymentCancelService, never()).cancelPaymentAmount(anyString(), anyString(), anyString(), any(), any());
        verify(paymentService, never()).refundPayment(anyString(), any(), anyString(), org.mockito.ArgumentMatchers.anyBoolean());
        verify(shopOrderFulfillmentService, never()).reversePaidOrderFulfillment(anyString(), any());
        assertThat(order.getStatus()).isEqualTo(ShopClientOrderStatus.PAID);
    }

    @Test
    @DisplayName("(a) PG 기취소 30,000 + 매핑 부분환불 20,000 → PG 는 50,000 만 취소")
    void pgAlreadyPartiallyCancelled_refundsOnlyRemainder() {
        ConsultantClientMapping mapping = mapping(704L, 10, 100_000L);
        stubMapping(mapping);
        ShopClientOrder order = paidOrder(mapping.getId());
        Payment payment = iamportPayment();
        stubShopRefund(order, payment);
        when(portOneV2PaymentCancelService.fetchCancelledAmount(TENANT, PAYMENT_ID))
                .thenReturn(Optional.of(BigDecimal.valueOf(30_000L)));

        adminService.partialRefundMapping(mapping.getId(), 2, "매핑 부분 환불");
        shopRefundService.refundPaidOrder(TENANT, ORDER_ID, ShopRefundConstants.REASON_CUSTOMER_REQUEST);

        ArgumentCaptor<BigDecimal> pgAmount = ArgumentCaptor.forClass(BigDecimal.class);
        verify(portOneV2PaymentCancelService).cancelPaymentAmount(
                eq(TENANT), eq(PAYMENT_ID), anyString(), pgAmount.capture(), any());
        assertThat(pgAmount.getValue()).isEqualByComparingTo(BigDecimal.valueOf(50_000L));
        assertThat(sumLedgerRefunds() + 30_000L + pgAmount.getValue().longValue()).isEqualTo(PAID);
    }

    @Test
    @DisplayName("(a) 비-IAMPORT PG 도 잔액만 환불 (80,000)")
    void nonIamportGateway_refundsOnlyRemainder() {
        ConsultantClientMapping mapping = mapping(705L, 10, 100_000L);
        stubMapping(mapping);
        ShopClientOrder order = paidOrder(mapping.getId());
        Payment payment = iamportPayment();
        payment.setProvider(Payment.PaymentProvider.TOSS);
        stubShopRefund(order, payment);
        when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(false);
        when(paymentGatewayService.refundPayment(eq(PAYMENT_ID), any(), anyString())).thenReturn(true);

        adminService.partialRefundMapping(mapping.getId(), 2, "매핑 부분 환불");
        shopRefundService.refundPaidOrder(TENANT, ORDER_ID, ShopRefundConstants.REASON_CUSTOMER_REQUEST);

        verify(paymentGatewayService).refundPayment(eq(PAYMENT_ID), eq(BigDecimal.valueOf(80_000L)), anyString());
        verify(portOneV2PaymentCancelService, never()).cancelPaymentAmount(anyString(), anyString(), anyString(), any(), any());
    }

    @Test
    @DisplayName("(a) 기환불 없음 → 기존 전액 취소 경로 유지 (cancelPayment, 금액 지정 없음)")
    void noPriorRefund_keepsFullCancelPath() {
        ConsultantClientMapping mapping = mapping(706L, 10, 100_000L);
        stubMapping(mapping);
        ShopClientOrder order = paidOrder(mapping.getId());
        Payment payment = iamportPayment();
        stubShopRefund(order, payment);

        shopRefundService.refundPaidOrder(TENANT, ORDER_ID, ShopRefundConstants.REASON_CUSTOMER_REQUEST);

        verify(portOneV2PaymentCancelService).cancelPayment(eq(TENANT), eq(PAYMENT_ID), anyString(), any());
        verify(portOneV2PaymentCancelService, never()).cancelPaymentAmount(anyString(), anyString(), anyString(), any(), any());
    }

    // ── (b) 패키지 추정 단가 — 원래 총 회기 기준 ──

    @Test
    @DisplayName("(b) 20회 200,000 패키지 5회씩 4번 부분환불 → 회당 10,000 유지, 누적 == 결제액 (차감 회기 단가 부풀림 금지)")
    void packageEstimatedBranch_usesOriginalTotalSessions() {
        ConsultantClientMapping mapping = mapping(801L, 20, 200_000L);
        stubMapping(mapping);

        adminService.partialRefundMapping(mapping.getId(), 5, "1차");
        adminService.partialRefundMapping(mapping.getId(), 5, "2차");
        adminService.partialRefundMapping(mapping.getId(), 5, "3차");
        adminService.partialRefundMapping(mapping.getId(), 5, "4차");

        List<Long> amounts = capturedRefundAmounts();
        assertThat(amounts)
                .as("차감된 totalSessions(15) 로 나누면 2차가 66,666 으로 부풀던 버그")
                .containsExactly(50_000L, 50_000L, 50_000L, 50_000L);
        assertThat(amounts.stream().mapToLong(Long::longValue).sum())
                .as("누적 환불 ≤ 결제액")
                .isLessThanOrEqualTo(200_000L);
        assertThat(mapping.getTotalSessions()).isZero();
        assertThat(AdminServiceImpl.resolveOriginalTotalSessions(mapping)).isEqualTo(20);
    }

    @Test
    @DisplayName("(b) 부분환불 후 전액환불(terminate) 도 원래 회기 단가 기준 — 누적 == 결제액")
    void packagePartialThenTerminate_cumulativeEqualsPaid() {
        ConsultantClientMapping mapping = mapping(802L, 20, 200_000L);
        stubMapping(mapping);

        adminService.partialRefundMapping(mapping.getId(), 5, "부분");
        adminService.terminateMapping(mapping.getId(), "잔여 전액");

        List<Long> amounts = capturedRefundAmounts();
        assertThat(amounts).containsExactly(50_000L, 150_000L);
        assertThat(amounts.stream().mapToLong(Long::longValue).sum()).isEqualTo(200_000L);
    }

    @Test
    @DisplayName("(b) 결제액 전액 기환불 매핑의 추가 부분환불 → 명확한 오류로 거부")
    void partialRefundAfterPaidExhausted_rejected() {
        ConsultantClientMapping mapping = mapping(803L, 10, 100_000L);
        stubMapping(mapping);
        FinancialTransaction prior = new FinancialTransaction();
        prior.setTenantId(TENANT);
        prior.setTransactionType(FinancialTransaction.TransactionType.EXPENSE);
        prior.setAmount(BigDecimal.valueOf(PAID));
        prior.setRelatedEntityId(mapping.getId());
        prior.setRelatedEntityType(
                com.coresolution.consultation.constant.FinancialTransactionConstants
                        .RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_PARTIAL_REFUND);
        prior.setIsDeleted(false);
        ledger.add(prior);

        assertThatThrownBy(() -> adminService.partialRefundMapping(mapping.getId(), 1, "초과"))
                .hasMessageContaining("환불 가능 금액이 없습니다");
        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    // ── helpers ──

    private void stubLedger() {
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), any()))
                .thenAnswer(inv -> {
                    FinancialTransactionRequest req = inv.getArgument(0);
                    FinancialTransaction row = new FinancialTransaction();
                    row.setId((long) (ledger.size() + 1));
                    row.setTenantId(req.getTenantId());
                    row.setTransactionType(FinancialTransaction.TransactionType.valueOf(req.getTransactionType()));
                    row.setSubcategory(req.getSubcategory());
                    row.setAmount(req.getAmount());
                    row.setDescription(req.getDescription());
                    row.setRelatedEntityId(req.getRelatedEntityId());
                    row.setRelatedEntityType(req.getRelatedEntityType());
                    row.setIsDeleted(false);
                    ledger.add(row);
                    return com.coresolution.consultation.dto.FinancialTransactionResponse.builder()
                            .id(row.getId()).build();
                });
        when(financialTransactionRepository
                .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                        anyString(), anyLong(), anyString(), any(FinancialTransaction.TransactionType.class)))
                .thenAnswer(inv -> ledger.stream().anyMatch(ft -> ft.getTenantId().equals(inv.getArgument(0))
                        && ft.getRelatedEntityId().equals(inv.getArgument(1))
                        && ft.getRelatedEntityType().equals(inv.getArgument(2))
                        && ft.getTransactionType() == inv.getArgument(3)));
        when(financialTransactionRepository
                .findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeStartingWithAndIsDeletedFalse(
                        anyString(), anyLong(), anyString()))
                .thenAnswer(inv -> ledger.stream()
                        .filter(ft -> ft.getTenantId().equals(inv.getArgument(0)))
                        .filter(ft -> ft.getRelatedEntityId().equals(inv.getArgument(1)))
                        .filter(ft -> ft.getRelatedEntityType().startsWith(inv.getArgument(2)))
                        .collect(Collectors.toList()));
        when(financialTransactionRepository
                .findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        anyString(), anyLong(), anyString()))
                .thenAnswer(inv -> ledger.stream()
                        .filter(ft -> ft.getTenantId().equals(inv.getArgument(0)))
                        .filter(ft -> ft.getRelatedEntityId().equals(inv.getArgument(1)))
                        .filter(ft -> ft.getRelatedEntityType().equals(inv.getArgument(2)))
                        .collect(Collectors.toList()));
    }

    private void stubMapping(ConsultantClientMapping mapping) {
        when(mappingRepository.findByTenantIdAndId(eq(TENANT), eq(mapping.getId())))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(amountManagementService.checkAmountConsistency(eq(mapping.getId())))
                .thenReturn(new AmountManagementService.AmountConsistencyResult(true, null, Map.of(), null));
        when(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndDateGreaterThanEqual(
                        anyString(), anyLong(), anyLong(), any()))
                .thenReturn(List.of());
    }

    private void stubShopRefund(ShopClientOrder order, Payment payment) {
        when(shopClientOrderRepository.lockByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        ShopClientOrderLine line = ShopClientOrderLine.builder()
                .clientOrder(order)
                .lineNo(1)
                .consultantClientMappingId(order.getId())
                .build();
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(order.getId()))
                .thenReturn(List.of(line));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenAnswer(inv -> payment.getStatus() == Payment.PaymentStatus.APPROVED
                        ? Optional.of(payment) : Optional.empty());
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PAYMENT_ID))
                .thenReturn(Optional.of(payment));
        when(paymentRepository.save(payment)).thenReturn(payment);
        when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(true);
        when(portOneV2PaymentVerifyService.isCancelledOrPartialCancelled(TENANT, PAYMENT_ID)).thenReturn(true);
        when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT), eq(PAYMENT_ID), anyString(), any())).thenReturn(true);
        when(portOneV2PaymentCancelService.cancelPaymentAmount(eq(TENANT), eq(PAYMENT_ID), anyString(), any(), any()))
                .thenReturn(true);
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(new EffectivePointTenantPolicies(0L, 0L, false, false, 0, 0L, 30));
    }

    private long sumLedgerRefunds() {
        return ledger.stream()
                .filter(ft -> ft.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
                .mapToLong(ft -> ft.getAmount().longValue())
                .sum();
    }

    private List<Long> capturedRefundAmounts() {
        ArgumentCaptor<FinancialTransactionRequest> captor = ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService, org.mockito.Mockito.atLeastOnce()).createTransaction(captor.capture(), any());
        return captor.getAllValues().stream()
                .map(r -> r.getAmount().longValue())
                .collect(Collectors.toList());
    }

    /**
     * 주문 PK 를 매핑 ID 와 같게 두어 라인 → 매핑 연결을 단순화한다.
     */
    private static ShopClientOrder paidOrder(Long mappingId) {
        ShopClientOrder order = ShopClientOrder.builder()
                .publicId(ORDER_ID).clientId(42L).status(ShopClientOrderStatus.PAID)
                .subtotalMinor(PAID).pointsRedeemMinor(0L).cashDueMinor(PAID)
                .checkoutIdempotencyKey("checkout-key-refund-cap").build();
        order.setId(mappingId);
        order.setTenantId(TENANT);
        return order;
    }

    private static Payment iamportPayment() {
        Payment p = Payment.builder()
                .paymentId(PAYMENT_ID).orderId(ORDER_ID).amount(BigDecimal.valueOf(PAID))
                .status(Payment.PaymentStatus.APPROVED).method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.IAMPORT).payerId(42L).build();
        p.setTenantId(TENANT);
        return p;
    }

    private static ConsultantClientMapping mapping(Long mappingId, int totalSessions, long packagePrice) {
        User consultant = new User();
        consultant.setId(mappingId + 10_000L);
        consultant.setTenantId(TENANT);
        consultant.setName("상담사_환불상한");
        User client = new User();
        client.setId(mappingId + 20_000L);
        client.setTenantId(TENANT);
        client.setName("내담자_환불상한");

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(mappingId);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setTotalSessions(totalSessions);
        mapping.setUsedSessions(0);
        mapping.setRemainingSessions(totalSessions);
        mapping.setPackageName("환불상한패키지");
        mapping.setPackagePrice(packagePrice);
        mapping.setPaymentDate(LocalDateTime.now().minusDays(3));
        mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        mapping.setTenantId(TENANT);
        return mapping;
    }
}
