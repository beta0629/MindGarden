package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopRefundConstants;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentCancelService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * finishMismatchCancel × 쇼핑 부분환불 가드 — underpay actualPaid 환불이 가드를 통과하고
 * requested_amount 감사 컬럼을 유지하는지 H2 통합 검증.
 *
 * @author MindGarden
 * @since 2026-10-16
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@DisplayName("쇼핑 불일치 취소 — actualPaid 환불 × 부분환불 가드 (H2 통합)")
class ShopPaymentMismatchActualPaidRefundIntegrationTest {

    private static final long PREPARED_AMOUNT = 1_000L;
    private static final long ACTUAL_PAID = 100L;
    private static final long CLIENT_ID = 7_161L;

    @Autowired
    private ClientShopCheckoutService clientShopCheckoutService;
    @Autowired
    private PaymentService paymentService;
    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private ShopClientOrderRepository orderRepository;
    @Autowired
    private PlatformTransactionManager transactionManager;

    @MockBean
    private PortOneV2PaymentCancelService portOneV2PaymentCancelService;
    @MockBean
    private PortOneV2PaymentVerifyService portOneV2PaymentVerifyService;

    private String tenantId;
    private String orderPublicId;
    private String paymentId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID().toString();
        orderPublicId = UUID.randomUUID().toString();
        when(portOneV2PaymentVerifyService.isIamportPayment(any())).thenReturn(true);
        when(portOneV2PaymentVerifyService.transientStatusMaxAttempts()).thenReturn(3);
        AtomicBoolean pgCancelled = new AtomicBoolean(false);
        when(portOneV2PaymentCancelService.cancelPayment(anyString(), anyString(), anyString()))
                .thenAnswer(inv -> {
                    pgCancelled.set(true);
                    return true;
                });
        when(portOneV2PaymentVerifyService.isCancelledOrPartialCancelled(anyString(), anyString()))
                .thenAnswer(inv -> pgCancelled.get());
        paymentId = seedPendingOrderWithPreparedPayment();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("underpay mismatch 전액 취소 — actualPaid 100 환불·requested 1000 유지·재호출 이중 환불 없음")
    void finishMismatchCancel_underpay_refundsActualPaid_keepsRequested_noDoubleRefund() {
        TenantContextHolder.setTenantId(tenantId);
        BigDecimal actualPaid = BigDecimal.valueOf(ACTUAL_PAID);

        boolean first = clientShopCheckoutService.cancelMismatchedApprovedPaymentForOrder(
                tenantId, orderPublicId, actualPaid);
        assertThat(first).isTrue();

        Payment payment = loadPayment();
        ShopClientOrder order = loadOrder();
        assertThat(order.getStatus()).isEqualTo(ShopClientOrderStatus.CANCELLED);
        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.REFUNDED);
        assertThat(payment.getAmount()).isEqualByComparingTo(actualPaid);
        assertThat(payment.getRequestedAmount()).isEqualByComparingTo(BigDecimal.valueOf(PREPARED_AMOUNT));
        assertThat(payment.getPortonePaidAmount()).isEqualByComparingTo(actualPaid);

        verify(portOneV2PaymentCancelService, times(1)).cancelPayment(
                eq(tenantId), eq(paymentId), eq(ShopCheckoutConstants.PAYMENT_MISMATCH_CANCEL_REASON));

        boolean second = clientShopCheckoutService.cancelMismatchedApprovedPaymentForOrder(
                tenantId, orderPublicId, actualPaid);
        assertThat(second).isTrue();
        verify(portOneV2PaymentCancelService, times(1)).cancelPayment(anyString(), anyString(), anyString());
        Payment afterSecond = loadPayment();
        assertThat(afterSecond.getStatus()).isEqualTo(Payment.PaymentStatus.REFUNDED);
        assertThat(afterSecond.getRequestedAmount()).isEqualByComparingTo(BigDecimal.valueOf(PREPARED_AMOUNT));
    }

    @Test
    @DisplayName("finishMismatchCancel 없이 부분 금액 refundPayment 는 쇼핑 가드가 거부한다")
    void refundPayment_partialWithoutAmountSync_stillRejected() {
        TenantContextHolder.setTenantId(tenantId);
        Payment payment = loadPayment();
        payment.setStatus(Payment.PaymentStatus.APPROVED);
        payment.setApprovedAt(LocalDateTime.now());
        payment.setCancelledAt(LocalDateTime.now());
        paymentRepository.save(payment);

        assertThatThrownBy(() -> paymentService.refundPayment(
                        paymentId,
                        BigDecimal.valueOf(ACTUAL_PAID),
                        "partial without mismatch sync"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(
                        String.format(
                                ShopRefundConstants.MSG_SHOP_PARTIAL_REFUND_NOT_ALLOWED_FMT,
                                BigDecimal.valueOf(ACTUAL_PAID),
                                BigDecimal.valueOf(PREPARED_AMOUNT)));

        Payment unchanged = loadPayment();
        assertThat(unchanged.getStatus()).isEqualTo(Payment.PaymentStatus.APPROVED);
        assertThat(unchanged.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(PREPARED_AMOUNT));
    }

    private String seedPendingOrderWithPreparedPayment() {
        String newPaymentId = "pay-it-mismatch-" + UUID.randomUUID();
        TenantContextHolder.setTenantId(tenantId);
        try {
            new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                ShopClientOrder order = ShopClientOrder.builder()
                        .publicId(orderPublicId)
                        .clientId(CLIENT_ID)
                        .status(ShopClientOrderStatus.PENDING_PAYMENT)
                        .subtotalMinor(PREPARED_AMOUNT)
                        .cashDueMinor(PREPARED_AMOUNT)
                        .checkoutIdempotencyKey("idem-" + orderPublicId)
                        .build();
                order.setTenantId(tenantId);
                orderRepository.save(order);
                Payment payment = Payment.builder()
                        .paymentId(newPaymentId)
                        .orderId(orderPublicId)
                        .amount(BigDecimal.valueOf(PREPARED_AMOUNT))
                        .requestedAmount(BigDecimal.valueOf(PREPARED_AMOUNT))
                        .status(Payment.PaymentStatus.PENDING)
                        .method(Payment.PaymentMethod.CARD)
                        .provider(Payment.PaymentProvider.IAMPORT)
                        .payerId(CLIENT_ID)
                        .build();
                payment.setTenantId(tenantId);
                paymentRepository.save(payment);
            });
        } finally {
            TenantContextHolder.clear();
        }
        return newPaymentId;
    }

    private Payment loadPayment() {
        return paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId).orElseThrow();
    }

    private ShopClientOrder loadOrder() {
        return orderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId).orElseThrow();
    }
}
