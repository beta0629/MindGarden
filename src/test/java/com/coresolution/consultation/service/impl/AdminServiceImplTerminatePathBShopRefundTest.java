package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopRefundConstants;
import com.coresolution.consultation.dto.shop.admin.ShopOrderRefundResponse;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AdminRequestIdempotencyService;
import com.coresolution.consultation.service.AdminShopOrderRefundService;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

/**
 * Path B PAID 매핑 terminate/payment-cancel → 쇼핑 환불 SSOT 위임 (unusedFullVoid/INCOME cancel 금지).
 *
 * @author MindGarden
 * @since 2026-09-19
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl terminateMapping — Path B shop refund SSOT")
class AdminServiceImplTerminatePathBShopRefundTest {

    private static final String TEST_TENANT_ID = "tenant-path-b-" + UUID.randomUUID();
    private static final String ORDER_PUBLIC_ID = "ord-path-b-refund-001";
    private static final Long MAPPING_ID = 901L;

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
    @Mock private ShopClientOrderLineRepository shopClientOrderLineRepository;
    @Mock private AdminShopOrderRefundService adminShopOrderRefundService;

    @SuppressWarnings("unchecked")
    private final ObjectProvider<AdminShopOrderRefundService> adminShopOrderRefundServiceProvider =
            mock(ObjectProvider.class);

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
        when(adminShopOrderRefundServiceProvider.getIfAvailable()).thenReturn(adminShopOrderRefundService);
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
                userLifecycleService,
                adminRequestIdempotencyService,
                org.mockito.Mockito.mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class),
                null,
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.InstitutionLinkContractRepository.class),
                shopClientOrderLineRepository,
                adminShopOrderRefundServiceProvider,
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("Path B PAID 주문 라인 → refundPaidOrder 위임, INCOME cancel/unusedFullVoid 미호출, CANCELLED 미전이")
    void terminateMapping_pathBPaidShopOrder_delegatesToRefundPaidOrder() {
        ConsultantClientMapping mapping = newActivePathBMapping();
        ShopClientOrder order = ShopClientOrder.builder()
                .publicId(ORDER_PUBLIC_ID)
                .status(ShopClientOrderStatus.PAID)
                .clientId(20L)
                .subtotalMinor(100_000L)
                .pointsRedeemMinor(0L)
                .cashDueMinor(100_000L)
                .checkoutIdempotencyKey("idem-path-b-001")
                .build();
        order.setTenantId(TEST_TENANT_ID);
        ShopClientOrderLine line = ShopClientOrderLine.builder()
                .clientOrder(order)
                .lineNo(1)
                .skuCodeSnapshot("SKU-CONSULT")
                .titleSnapshot("상담 패키지")
                .unitPriceMinor(100_000L)
                .quantity(1)
                .lineTotalMinor(100_000L)
                .consultantClientMappingId(MAPPING_ID)
                .build();
        line.setTenantId(TEST_TENANT_ID);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(mapping));
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("TERMINATED")))
                .thenReturn(MappingStatus.TERMINATED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("CANCELLED")))
                .thenReturn(MappingStatus.CANCELLED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("PENDING_PAYMENT")))
                .thenReturn(MappingStatus.PENDING_PAYMENT.name());
        when(shopClientOrderLineRepository
                .findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
                        eq(TEST_TENANT_ID), eq(List.of(MAPPING_ID))))
                .thenReturn(List.of(line));
        when(adminShopOrderRefundService.refundPaidOrder(
                eq(TEST_TENANT_ID), eq(ORDER_PUBLIC_ID), eq(ShopRefundConstants.REASON_CUSTOMER_REQUEST)))
                .thenReturn(ShopOrderRefundResponse.builder()
                        .orderPublicId(ORDER_PUBLIC_ID)
                        .status(ShopClientOrderStatus.REFUNDED)
                        .reasonCode(ShopRefundConstants.REASON_CUSTOMER_REQUEST)
                        .pointsRestoredMinor(0L)
                        .pointsClawedBackMinor(0L)
                        .pgRefundStatus(ShopRefundConstants.PG_REFUND_STATUS_COMPLETED)
                        .build());

        adminService.terminateMapping(MAPPING_ID, "리더 결제 취소");

        verify(adminShopOrderRefundService).refundPaidOrder(
                eq(TEST_TENANT_ID), eq(ORDER_PUBLIC_ID), eq(ShopRefundConstants.REASON_CUSTOMER_REQUEST));
        verify(financialTransactionService, never()).cancelRelatedPostedIncomeTransactions(anyLong(), anyString());
        verify(financialTransactionService, never()).createTransaction(any(), any());
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(mapping.getPaymentStatus()).isEqualTo(PaymentStatus.APPROVED);
    }

    private ConsultantClientMapping newActivePathBMapping() {
        User consultant = new User();
        consultant.setId(10L);
        consultant.setName("상담사");
        consultant.setTenantId(TEST_TENANT_ID);

        User client = new User();
        client.setId(20L);
        client.setName("내담자");
        client.setTenantId(TEST_TENANT_ID);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setTenantId(TEST_TENANT_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setPaymentStatus(PaymentStatus.APPROVED);
        mapping.setTotalSessions(10);
        mapping.setRemainingSessions(10);
        mapping.setUsedSessions(0);
        mapping.setPackagePrice(100_000L);
        mapping.setPackageName("쇼핑 10회권");
        return mapping;
    }
}
