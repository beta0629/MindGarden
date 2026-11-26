package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ClientEventSource;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.ReserveFundService;
import com.coresolution.consultation.service.ShopLatePaymentRefundService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import com.coresolution.consultation.service.portone.PortOneVerifyUnknownRetryTracker;
import com.coresolution.consultation.service.support.ClientEventWriteSupport;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

/**
 * PaymentServiceImpl client_event 결제 훅 단위 검증.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("PaymentServiceImpl client_event 훅")
class PaymentServiceImplClientEventHookTest {

    private static final String TENANT_ID = "tenant-ce-pay";
    private static final String PAYMENT_PUBLIC_ID = "PAY-CE-001";

    @Mock private PaymentRepository paymentRepository;
    @Mock private TenantAccessControlService accessControlService;
    @Mock private FinancialTransactionService financialTransactionService;
    @Mock private ReserveFundService reserveFundService;
    @Mock private AdminService adminService;
    @Mock private StatisticsService statisticsService;
    @Mock private ConsultationMessageService consultationMessageService;
    @Mock private CommonCodeService commonCodeService;
    @Mock private MobilePushDispatchService mobilePushDispatchService;
    @Mock private ShopClientOrderRepository shopClientOrderRepository;
    @Mock private NotificationService notificationService;
    @Mock private UserRepository userRepository;
    @Mock private PortOneV2PaymentVerifyService portOneV2PaymentVerifyService;
    @Mock private PortOneVerifyUnknownRetryTracker portOneVerifyUnknownRetryTracker;
    @Mock private ClientShopCheckoutService clientShopCheckoutService;
    @Mock private ShopLatePaymentRefundService shopLatePaymentRefundService;
    @Mock private ClientEventWriteSupport clientEventWriteSupport;

    private PaymentServiceImpl paymentService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        PlatformTransactionManager txManager = new AbstractPlatformTransactionManager() {
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
        paymentService = new PaymentServiceImpl(
                paymentRepository,
                accessControlService,
                financialTransactionService,
                reserveFundService,
                adminService,
                statisticsService,
                consultationMessageService,
                commonCodeService,
                mobilePushDispatchService,
                shopClientOrderRepository,
                notificationService,
                userRepository,
                portOneV2PaymentVerifyService,
                portOneVerifyUnknownRetryTracker,
                clientShopCheckoutService,
                shopLatePaymentRefundService,
                txManager);
        ReflectionTestUtils.setField(paymentService, "clientEventWriteSupport", clientEventWriteSupport);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("cancelPayment 성공 시 PAYMENT_CANCELLED 훅 호출")
    void cancelPayment_recordsPaymentCancelled() {
        Payment payment = pendingPayment();
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_PUBLIC_ID))
                .thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        paymentService.cancelPayment(PAYMENT_PUBLIC_ID, "사용자 취소");

        verify(clientEventWriteSupport).recordPaymentCancelled(
                any(Payment.class), eq(null), eq("사용자 취소"));
    }

    @Test
    @DisplayName("refundPayment 성공 시 PAYMENT_REFUNDED 훅 호출")
    void refundPayment_recordsPaymentRefunded() {
        Payment payment = approvedPayment();
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_PUBLIC_ID))
                .thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(portOneV2PaymentVerifyService.isIamportPayment(any())).thenReturn(false);

        paymentService.refundPayment(PAYMENT_PUBLIC_ID, payment.getAmount(), "환불", false);

        verify(clientEventWriteSupport).recordPaymentRefunded(
                any(Payment.class), eq(null), eq("환불"));
    }

    private Payment pendingPayment() {
        Payment payment = Payment.builder()
                .paymentId(PAYMENT_PUBLIC_ID)
                .orderId("ORD-CE-001")
                .amount(new BigDecimal("30000"))
                .status(Payment.PaymentStatus.PENDING)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.TOSS)
                .payerId(42L)
                .build();
        payment.setId(8001L);
        payment.setTenantId(TENANT_ID);
        return payment;
    }

    private Payment approvedPayment() {
        Payment payment = pendingPayment();
        payment.setStatus(Payment.PaymentStatus.APPROVED);
        return payment;
    }
}
