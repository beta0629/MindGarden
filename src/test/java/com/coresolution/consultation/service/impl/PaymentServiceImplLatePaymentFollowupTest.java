package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.PaymentConstants;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.dto.PaymentResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.exception.ShopOrderClosedForPaymentException;
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
import com.coresolution.consultation.service.ShopLatePaymentOutcome;
import com.coresolution.consultation.service.ShopLatePaymentRefundService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * #1311 후속 — 결제 서비스 늦은 결제 레이스 보강.
 * H9(주문 열림 + 결제 행만 EXPIRED), 주문 → 결제 잠금 순서, 관리자 API 승인 전이 거부,
 * PortOne 조회 트랜잭션 밖 실행.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("PaymentServiceImpl — 늦은 결제 레이스 후속 (H9 · 잠금 순서 · 승인 전이 거부)")
class PaymentServiceImplLatePaymentFollowupTest {

    private static final String TENANT_ID = "tenant-late-followup-svc";
    private static final String PAYMENT_PUBLIC_ID = "PAY-LATE-FOLLOWUP-0001";
    private static final String ORDER_PUBLIC_ID = "ORD-LATE-FOLLOWUP-0001";
    private static final Long PAYMENT_ROW_ID = 9101L;
    private static final long CASH_DUE = 15_000L;

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
    @Mock private ClientShopCheckoutService clientShopCheckoutService;
    @Mock private PortOneV2PaymentVerifyService portOneV2PaymentVerifyService;
    @Mock private ShopLatePaymentRefundService shopLatePaymentRefundService;
    @Mock private PlatformTransactionManager transactionManager;

    private PaymentServiceImpl service;
    private Payment payment;
    private ShopClientOrder order;

    @BeforeEach
    void setUp() {
        service = new PaymentServiceImpl(
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
                clientShopCheckoutService,
                shopLatePaymentRefundService,
                transactionManager);
        TenantContextHolder.setTenantId(TENANT_ID);

        payment = new Payment();
        payment.setId(PAYMENT_ROW_ID);
        payment.setTenantId(TENANT_ID);
        payment.setPaymentId(PAYMENT_PUBLIC_ID);
        payment.setOrderId(ORDER_PUBLIC_ID);
        payment.setAmount(BigDecimal.valueOf(CASH_DUE));
        payment.setStatus(Payment.PaymentStatus.PROCESSING);
        payment.setMethod(Payment.PaymentMethod.CARD);
        payment.setProvider(Payment.PaymentProvider.IAMPORT);
        payment.setDescription("Shop order payment");

        order = ShopClientOrder.builder()
                .publicId(ORDER_PUBLIC_ID)
                .clientId(5301L)
                .status(ShopClientOrderStatus.PENDING_PAYMENT)
                .subtotalMinor(CASH_DUE)
                .pointsRedeemMinor(0L)
                .cashDueMinor(CASH_DUE)
                .checkoutIdempotencyKey("idem-late-followup-svc")
                .checkoutSource(ShopCheckoutConstants.CHECKOUT_SOURCE_CART)
                .build();
        order.setTenantId(TENANT_ID);

        lenient().when(commonCodeService.getCodeValue(anyString(), anyString())).thenReturn(null);
        lenient().when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_PUBLIC_ID))
                .thenAnswer(inv -> Optional.of(payment));
        lenient().when(paymentRepository.findByTenantIdAndId(eq(TENANT_ID), eq(PAYMENT_ROW_ID)))
                .thenAnswer(inv -> Optional.of(payment));
        lenient().when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT_ID, ORDER_PUBLIC_ID))
                .thenAnswer(inv -> Optional.of(order));
        lenient().when(shopClientOrderRepository.lockByTenantIdAndPublicId(TENANT_ID, ORDER_PUBLIC_ID))
                .thenAnswer(inv -> Optional.of(order));
        lenient().when(clientShopCheckoutService.completeOrderOnPaymentApproved(TENANT_ID, ORDER_PUBLIC_ID))
                .thenReturn(true);
        lenient().when(portOneV2PaymentVerifyService.isIamportPayment(any(Payment.class))).thenReturn(true);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("H9: 주문 열림 + 결제 행만 EXPIRED + 금액 일치 → 500 없이 정상 승인, 주문 완료 동기화")
    void h9_openOrderExpiredPayment_amountMatches_approved() {
        payment.setStatus(Payment.PaymentStatus.EXPIRED);

        PaymentResponse response = service.approveShopOrderPayment(PAYMENT_PUBLIC_ID);

        assertThat(response.getStatus()).isEqualTo(Payment.PaymentStatus.APPROVED.name());
        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.APPROVED);
        verify(clientShopCheckoutService).completeOrderOnPaymentApproved(TENANT_ID, ORDER_PUBLIC_ID);
    }

    @Test
    @DisplayName("H9: 결제 행 EXPIRED + 금액 불일치 → 승인하지 않음(IllegalStateException), 상태 그대로")
    void h9_openOrderExpiredPayment_amountMismatch_rejected() {
        payment.setStatus(Payment.PaymentStatus.EXPIRED);
        payment.setAmount(BigDecimal.valueOf(CASH_DUE - 1));

        assertThatThrownBy(() -> service.approveShopOrderPayment(PAYMENT_PUBLIC_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(PAYMENT_PUBLIC_ID);

        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.EXPIRED);
        verify(clientShopCheckoutService, never()).completeOrderOnPaymentApproved(any(), any());
    }

    @Test
    @DisplayName("H9: 주문이 이미 EXPIRED/CANCELLED 면 승인 거부(늦은 PAID 경로) — 닫힌 주문 복구 없음")
    void h9_closedOrder_notApproved() {
        payment.setStatus(Payment.PaymentStatus.EXPIRED);
        order.setStatus(ShopClientOrderStatus.EXPIRED);

        assertThatThrownBy(() -> service.approveShopOrderPayment(PAYMENT_PUBLIC_ID))
                .isInstanceOf(ShopOrderClosedForPaymentException.class);

        assertThat(order.getStatus()).isEqualTo(ShopClientOrderStatus.EXPIRED);
        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.EXPIRED);
        verify(clientShopCheckoutService, never()).completeOrderOnPaymentApproved(any(), any());
    }

    @Test
    @DisplayName("잠금 순서: 승인은 주문 FOR UPDATE → 결제 행 잠금 재조회 순서")
    void approve_locksOrderBeforePaymentRow() {
        service.approveShopOrderPayment(PAYMENT_PUBLIC_ID);

        InOrder ordered = inOrder(shopClientOrderRepository, paymentRepository);
        ordered.verify(shopClientOrderRepository).lockByTenantIdAndPublicId(TENANT_ID, ORDER_PUBLIC_ID);
        ordered.verify(paymentRepository).refreshWithLock(payment);
    }

    @Test
    @DisplayName("관리자 결제 상태 API: CANCELLED → APPROVED 전이 거부, 저장 없음")
    void adminStatusApi_cancelledToApproved_rejected() {
        payment.setStatus(Payment.PaymentStatus.CANCELLED);

        assertThatThrownBy(() -> service.updatePaymentStatus(PAYMENT_PUBLIC_ID, Payment.PaymentStatus.APPROVED))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(String.format(
                        PaymentConstants.ERROR_APPROVE_FROM_CLOSED_STATUS_FMT, Payment.PaymentStatus.CANCELLED));

        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.CANCELLED);
        verify(paymentRepository, never()).save(any());
        verify(clientShopCheckoutService, never()).completeOrderOnPaymentApproved(any(), any());
    }

    @Test
    @DisplayName("관리자 결제 상태 API: EXPIRED → APPROVED 전이 거부, 저장 없음")
    void adminStatusApi_expiredToApproved_rejected() {
        payment.setStatus(Payment.PaymentStatus.EXPIRED);

        assertThatThrownBy(() -> service.updatePaymentStatus(PAYMENT_PUBLIC_ID, Payment.PaymentStatus.APPROVED))
                .isInstanceOf(IllegalStateException.class);

        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.EXPIRED);
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("verify: PortOne 조회가 DB 트랜잭션 시작보다 먼저(트랜잭션 밖) 실행")
    void verify_portOneLookupOutsideTransaction() {
        when(portOneV2PaymentVerifyService.verifyPaidAmountBody(TENANT_ID, PAYMENT_PUBLIC_ID, payment.getAmount()))
                .thenReturn(Optional.of("{\"status\":\"PAID\"}"));
        when(shopLatePaymentRefundService.refundIfOrderClosed(TENANT_ID, PAYMENT_PUBLIC_ID))
                .thenReturn(ShopLatePaymentOutcome.NOT_APPLICABLE);

        boolean verified = service.verifyPayment(PAYMENT_PUBLIC_ID, payment.getAmount());

        assertThat(verified).isTrue();
        InOrder ordered = inOrder(portOneV2PaymentVerifyService, transactionManager, shopClientOrderRepository);
        ordered.verify(portOneV2PaymentVerifyService)
                .verifyPaidAmountBody(TENANT_ID, PAYMENT_PUBLIC_ID, payment.getAmount());
        ordered.verify(transactionManager).getTransaction(any());
        ordered.verify(shopClientOrderRepository).lockByTenantIdAndPublicId(TENANT_ID, ORDER_PUBLIC_ID);
    }

    @Test
    @DisplayName("verify H5: 조회 뒤 사용자 취소가 먼저 커밋 → 잠금 재확인에서 닫힘 → 늦은 PAID 자동 환불, 500 아님")
    void verify_orderClosedDuringApproval_lateRefundNot500() {
        when(portOneV2PaymentVerifyService.verifyPaidAmountBody(TENANT_ID, PAYMENT_PUBLIC_ID, payment.getAmount()))
                .thenAnswer(inv -> {
                    order.setStatus(ShopClientOrderStatus.CANCELLED);
                    return Optional.of("{\"status\":\"PAID\"}");
                });
        when(shopLatePaymentRefundService.refundIfOrderClosed(TENANT_ID, PAYMENT_PUBLIC_ID))
                .thenReturn(ShopLatePaymentOutcome.NOT_APPLICABLE)
                .thenReturn(ShopLatePaymentOutcome.REFUNDED);

        boolean verified = service.verifyPayment(PAYMENT_PUBLIC_ID, payment.getAmount());

        assertThat(verified).isFalse();
        assertThat(order.getStatus()).isEqualTo(ShopClientOrderStatus.CANCELLED);
        verify(clientShopCheckoutService, never()).completeOrderOnPaymentApproved(any(), any());
    }

    @Test
    @DisplayName("트랜잭션 경계: verify 는 외부 트랜잭션 없이(NOT_SUPPORTED) 실행")
    void verify_runsWithoutOuterTransaction() throws Exception {
        Method verifyMethod = PaymentServiceImpl.class.getMethod("verifyPayment", String.class, BigDecimal.class);

        assertThat(verifyMethod.getAnnotation(Transactional.class).propagation())
                .isEqualTo(Propagation.NOT_SUPPORTED);
    }
}
