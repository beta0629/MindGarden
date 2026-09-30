package com.coresolution.consultation.service.portone;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopLatePaymentConstants;
import com.coresolution.consultation.constant.ShopUserPaymentCancelConstants;
import com.coresolution.consultation.dto.shop.ShopUserCancelPaymentResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.exception.ShopOrderClosedForPaymentException;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.ClientPointWalletService;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.PersonalDataEncryptionService;
import com.coresolution.consultation.service.ShopLatePaymentOutcome;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.impl.ClientShopPaymentCancelServiceImpl;
import com.coresolution.consultation.service.impl.ShopLatePaymentRefundServiceImpl;
import com.coresolution.core.constants.TenantPgSettingsJsonKeys;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.monitoring.SchedulerFailureNotifier;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * #1311 후속 — 늦은 결제 레이스 검증 FAIL 보강 (잠금 순서·H5·낙관적 락·H9·트랜잭션 경계).
 * 실제 웹훅·늦은 결제 가드·사용자 취소 서비스를 묶고 주문·결제는 메모리 상태, PortOne API 는 목.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("늦은 결제 레이스 후속 (잠금 순서 · H5 · 낙관적 락 · H9)")
class ShopLatePaymentFollowupRaceTest {

    private static final String STORE_ID = "store-late-followup";
    private static final String WEBHOOK_SECRET = "whsec_late_followup_secret";
    private static final String TIMESTAMP = "1700000000";
    private static final String TENANT_ID = "tenant-late-followup";
    private static final String ORDER_PUBLIC_ID = "ord-late-followup-1";
    private static final String PAYMENT_ID = "pay-late-followup-1";
    private static final Long CLIENT_ID = 5252L;
    private static final long CASH_DUE = 9_000L;

    @Mock
    private PersonalDataEncryptionService encryptionService;
    @Mock
    private TenantPgConfigurationRepository tenantPgConfigurationRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private ShopClientOrderRepository shopClientOrderRepository;
    @Mock
    private ShopClientOrderLineRepository shopClientOrderLineRepository;
    @Mock
    private PaymentService paymentService;
    @Mock
    private ClientShopCheckoutService clientShopCheckoutService;
    @Mock
    private ClientPointWalletService clientPointWalletService;
    @Mock
    private PortOneV2PaymentVerifyService portOneV2PaymentVerifyService;
    @Mock
    private PortOneV2PaymentCancelService portOneV2PaymentCancelService;
    @Mock
    private ShopNotificationHelper shopNotificationHelper;
    @Mock
    private ObjectProvider<SchedulerFailureNotifier> failureNotifierProvider;
    @Mock
    private SchedulerFailureNotifier schedulerFailureNotifier;
    @Mock
    private PlatformTransactionManager transactionManager;

    private ShopLatePaymentRefundServiceImpl guard;
    private PortOnePaymentWebhookService webhookService;
    private ClientShopPaymentCancelServiceImpl cancelService;

    private ShopClientOrder order;
    private Payment payment;

    @BeforeEach
    void setUp() {
        guard = new ShopLatePaymentRefundServiceImpl(
                paymentRepository,
                shopClientOrderRepository,
                portOneV2PaymentCancelService,
                shopNotificationHelper,
                failureNotifierProvider,
                transactionManager);
        webhookService = new PortOnePaymentWebhookService(
                new ObjectMapper(),
                encryptionService,
                tenantPgConfigurationRepository,
                paymentRepository,
                paymentService,
                clientShopCheckoutService,
                guard);
        cancelService = new ClientShopPaymentCancelServiceImpl(
                shopClientOrderRepository,
                shopClientOrderLineRepository,
                paymentRepository,
                clientPointWalletService,
                portOneV2PaymentVerifyService,
                transactionManager,
                guard);

        order = ShopClientOrder.builder()
                .publicId(ORDER_PUBLIC_ID)
                .clientId(CLIENT_ID)
                .status(ShopClientOrderStatus.PENDING_PAYMENT)
                .subtotalMinor(CASH_DUE)
                .pointsRedeemMinor(0L)
                .cashDueMinor(CASH_DUE)
                .checkoutIdempotencyKey("idem-late-followup")
                .checkoutSource(ShopCheckoutConstants.CHECKOUT_SOURCE_CART)
                .build();
        order.setTenantId(TENANT_ID);
        payment = Payment.builder()
                .paymentId(PAYMENT_ID)
                .orderId(ORDER_PUBLIC_ID)
                .status(Payment.PaymentStatus.PENDING)
                .provider(Payment.PaymentProvider.IAMPORT)
                .build();
        payment.setId(11L);
        payment.setTenantId(TENANT_ID);

        TenantPgConfiguration configuration = new TenantPgConfiguration();
        configuration.setConfigId("cfg-late-followup");
        configuration.setTenantId(TENANT_ID);
        configuration.setPgProvider(PgProvider.IAMPORT);
        configuration.setStoreId(STORE_ID);
        configuration.setStatus(PgConfigurationStatus.ACTIVE);
        configuration.setSettingsJson("{\"" + TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET + "\":\""
                + WEBHOOK_SECRET + "\"}");
        lenient().when(tenantPgConfigurationRepository.findAllByStoreIdAndPgProviderAndStatusAndIsDeletedFalse(
                        eq(STORE_ID), eq(PgProvider.IAMPORT), eq(PgConfigurationStatus.ACTIVE)))
                .thenReturn(List.of(configuration));
        lenient().when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_ID))
                .thenAnswer(inv -> Optional.of(payment));
        lenient().when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT_ID, ORDER_PUBLIC_ID))
                .thenAnswer(inv -> List.of(payment));
        lenient().when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT_ID, ORDER_PUBLIC_ID))
                .thenAnswer(inv -> Optional.of(order));
        lenient().when(shopClientOrderRepository.lockByTenantIdAndPublicId(TENANT_ID, ORDER_PUBLIC_ID))
                .thenAnswer(inv -> Optional.of(order));
        lenient().when(failureNotifierProvider.getIfAvailable()).thenReturn(schedulerFailureNotifier);
        lenient().when(portOneV2PaymentVerifyService.isIamportPayment(any(Payment.class))).thenReturn(true);
    }

    @Test
    @DisplayName("잠금 순서: 가드는 주문 FOR UPDATE 뒤에 결제 행을 읽고, 잠금 전 읽은 결제 상태로 판정하지 않는다")
    void guard_locksOrderBeforeReadingPayment_usesPostLockPaymentState() {
        order.setStatus(ShopClientOrderStatus.CANCELLED);
        payment.setStatus(Payment.PaymentStatus.REFUNDED);
        Payment staleSnapshot = Payment.builder()
                .paymentId(PAYMENT_ID)
                .orderId(ORDER_PUBLIC_ID)
                .status(Payment.PaymentStatus.PENDING)
                .provider(Payment.PaymentProvider.IAMPORT)
                .build();
        AtomicInteger reads = new AtomicInteger();
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_ID))
                .thenAnswer(inv -> Optional.of(reads.getAndIncrement() == 0 ? staleSnapshot : payment));

        ShopLatePaymentOutcome outcome = guard.refundIfOrderClosed(TENANT_ID, PAYMENT_ID);

        assertEquals(ShopLatePaymentOutcome.ALREADY_REFUNDED, outcome);
        InOrder ordered = inOrder(shopClientOrderRepository, paymentRepository);
        ordered.verify(shopClientOrderRepository).lockByTenantIdAndPublicId(TENANT_ID, ORDER_PUBLIC_ID);
        ordered.verify(paymentRepository).findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_ID);
        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("잠금 순서: 늦은 결제 확정(settle) 단계도 주문 잠금 → 결제 조회 순서")
    void guard_settleAlsoLocksOrderFirst() {
        order.setStatus(ShopClientOrderStatus.CANCELLED);
        payment.setStatus(Payment.PaymentStatus.CANCELLED);
        when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT_ID), eq(PAYMENT_ID), anyString()))
                .thenReturn(true);

        assertEquals(ShopLatePaymentOutcome.REFUNDED, guard.refundIfOrderClosed(TENANT_ID, PAYMENT_ID));

        InOrder ordered = inOrder(shopClientOrderRepository, paymentRepository, portOneV2PaymentCancelService);
        ordered.verify(shopClientOrderRepository).lockByTenantIdAndPublicId(TENANT_ID, ORDER_PUBLIC_ID);
        ordered.verify(paymentRepository).findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_ID);
        ordered.verify(portOneV2PaymentCancelService).cancelPayment(any(), any(), any());
        ordered.verify(shopClientOrderRepository).lockByTenantIdAndPublicId(TENANT_ID, ORDER_PUBLIC_ID);
        ordered.verify(paymentRepository).findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_ID);
        assertEquals(Payment.PaymentStatus.REFUNDED, payment.getStatus());
    }

    @Test
    @DisplayName("H5: 웹훅이 열린 주문으로 판정한 뒤 사용자 취소가 먼저 커밋 → 잠금 재확인에서 닫힘 감지, 500 아닌 늦은 PAID 자동 환불")
    void h5_openJudged_thenUserCancelCommitted_autoRefundedNot500() throws Exception {
        when(paymentService.approveShopOrderPayment(PAYMENT_ID)).thenAnswer(inv -> {
            order.setStatus(ShopClientOrderStatus.CANCELLED);
            payment.setStatus(Payment.PaymentStatus.CANCELLED);
            throw new ShopOrderClosedForPaymentException(ORDER_PUBLIC_ID, ShopClientOrderStatus.CANCELLED);
        });
        when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT_ID), eq(PAYMENT_ID), anyString()))
                .thenReturn(true);

        ResponseEntity<Map<String, Object>> response = sendWebhook("Transaction.Paid", "whk-h5");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(ShopLatePaymentConstants.WEBHOOK_STATUS_LATE_PAYMENT_REFUNDED, response.getBody().get("status"));
        assertEquals(Payment.PaymentStatus.REFUNDED, payment.getStatus());
        assertEquals(ShopClientOrderStatus.CANCELLED, order.getStatus());
        verify(portOneV2PaymentCancelService, times(1))
                .cancelPayment(TENANT_ID, PAYMENT_ID, ShopLatePaymentConstants.PORTONE_CANCEL_REASON);
        verify(shopNotificationHelper, times(1)).notifyLatePaymentAutoCancelled(TENANT_ID, order);
    }

    @Test
    @DisplayName("user-cancel × PAID 웹훅 낙관적 락 충돌 → 재조회 닫힌 주문, PG 취소 실패 시 REFUND_REQUIRED + 관리자 알림 (일반 500 아님)")
    void webhookOptimisticLock_closedOrder_refundApiFails_refundRequired() throws Exception {
        when(paymentService.approveShopOrderPayment(PAYMENT_ID)).thenAnswer(inv -> {
            order.setStatus(ShopClientOrderStatus.CANCELLED);
            payment.setStatus(Payment.PaymentStatus.CANCELLED);
            throw new ObjectOptimisticLockingFailureException(Payment.class, payment.getId());
        });
        when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT_ID), eq(PAYMENT_ID), anyString()))
                .thenReturn(false);

        ResponseEntity<Map<String, Object>> response = sendWebhook("Transaction.Paid", "whk-optimistic");

        assertEquals(Payment.PaymentStatus.REFUND_REQUIRED, payment.getStatus());
        assertEquals(ShopLatePaymentConstants.FAILURE_REASON_LATE_PAYMENT_ON_CLOSED_ORDER, payment.getFailureReason());
        assertEquals(ShopLatePaymentConstants.WEBHOOK_MESSAGE_REFUND_REQUIRED, response.getBody().get("message"));
        assertEquals(ShopClientOrderStatus.CANCELLED, order.getStatus());
        verify(schedulerFailureNotifier, times(1)).notifyFailure(
                eq(ShopLatePaymentConstants.ADMIN_ALERT_SOURCE),
                eq(ShopLatePaymentConstants.ADMIN_ALERT_STEP_REFUND_REQUIRED),
                eq(TENANT_ID),
                any());
    }

    @Test
    @DisplayName("낙관적 락 충돌이어도 주문이 열려 있으면 늦은 결제로 보지 않음(PG 취소 없음, 재시도용 오류)")
    void webhookOptimisticLock_orderStillOpen_noRefund() throws Exception {
        when(paymentService.approveShopOrderPayment(PAYMENT_ID))
                .thenThrow(new ObjectOptimisticLockingFailureException(Payment.class, 11L));

        ResponseEntity<Map<String, Object>> response = sendWebhook("Transaction.Paid", "whk-optimistic-open");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals(ShopClientOrderStatus.PENDING_PAYMENT, order.getStatus());
        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any());
    }

    @Test
    @DisplayName("user-cancel 쪽 낙관적 락 충돌 → 재조회에서 닫힌 주문 + 승인된 결제 → PG 취소 실패 시 REFUND_REQUIRED + 관리자 알림")
    void userCancelOptimisticLock_closedOrderApprovedPayment_refundRequired() {
        when(portOneV2PaymentVerifyService.resolvePaidState(TENANT_ID, PAYMENT_ID))
                .thenReturn(PortOnePaymentPaidState.NOT_PAID);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> {
            Payment saving = inv.getArgument(0);
            if (saving.getStatus() == Payment.PaymentStatus.CANCELLED
                    && ShopUserPaymentCancelConstants.PAYMENT_FAILURE_REASON_USER_CANCELLED
                            .equals(saving.getFailureReason())) {
                // 동시에 늦은 PAID 가 결제 행을 APPROVED 로 커밋 → 사용자 취소 flush 가 낙관적 락 충돌
                payment.setStatus(Payment.PaymentStatus.APPROVED);
                payment.setFailureReason(null);
                throw new ObjectOptimisticLockingFailureException(Payment.class, payment.getId());
            }
            return saving;
        });
        when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT_ID), eq(PAYMENT_ID), anyString()))
                .thenReturn(false);

        ShopUserCancelPaymentResponse response = cancelService.cancelByUser(TENANT_ID, CLIENT_ID, ORDER_PUBLIC_ID);

        assertEquals(ShopUserPaymentCancelConstants.OUTCOME_CANCELLED, response.getOutcome());
        assertEquals(ShopClientOrderStatus.CANCELLED, order.getStatus());
        assertEquals(Payment.PaymentStatus.REFUND_REQUIRED, payment.getStatus());
        verify(portOneV2PaymentCancelService, times(1)).cancelPayment(any(), any(), any());
        verify(schedulerFailureNotifier, times(1)).notifyFailure(
                eq(ShopLatePaymentConstants.ADMIN_ALERT_SOURCE),
                eq(ShopLatePaymentConstants.ADMIN_ALERT_STEP_REFUND_REQUIRED),
                eq(TENANT_ID),
                any());
    }

    @Test
    @DisplayName("H9: 주문 열림 + 결제 행만 EXPIRED 에 PAID → 500 반복 없이 정상 승인 경로, PG 취소 없음")
    void h9_openOrderExpiredPaymentRow_paidWebhook_approved() throws Exception {
        payment.setStatus(Payment.PaymentStatus.EXPIRED);
        when(paymentService.approveShopOrderPayment(PAYMENT_ID)).thenAnswer(inv -> {
            payment.setStatus(Payment.PaymentStatus.APPROVED);
            order.setStatus(ShopClientOrderStatus.PAID);
            return null;
        });

        ResponseEntity<Map<String, Object>> first = sendWebhook("Transaction.Paid", "whk-h9");

        assertEquals(HttpStatus.OK, first.getStatusCode());
        assertEquals("ok", first.getBody().get("status"));
        assertEquals(ShopClientOrderStatus.PAID, order.getStatus());
        assertEquals(Payment.PaymentStatus.APPROVED, payment.getStatus());
        verify(paymentService, times(1)).approveShopOrderPayment(PAYMENT_ID);
        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any());
    }

    @Test
    @DisplayName("H9: 주문이 이미 CANCELLED/EXPIRED 면 승인하지 않고 늦은 PAID 자동 환불 — 닫힌 주문 복구 없음")
    void h9_closedOrderExpiredPayment_notApproved_autoRefunded() throws Exception {
        order.setStatus(ShopClientOrderStatus.EXPIRED);
        payment.setStatus(Payment.PaymentStatus.EXPIRED);
        when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT_ID), eq(PAYMENT_ID), anyString()))
                .thenReturn(true);

        ResponseEntity<Map<String, Object>> response = sendWebhook("Transaction.Paid", "whk-h9-closed");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(ShopClientOrderStatus.EXPIRED, order.getStatus());
        assertEquals(Payment.PaymentStatus.REFUNDED, payment.getStatus());
        verify(paymentService, never()).approveShopOrderPayment(any());
    }

    @Test
    @DisplayName("트랜잭션 경계: 웹훅 처리 진입점은 외부 트랜잭션 없이(NOT_SUPPORTED) 실행 — PG 취소 동안 커넥션 미보유")
    void webhookEntry_runsWithoutOuterTransaction() throws Exception {
        Method handle = PortOnePaymentWebhookService.class.getMethod(
                "handleWebhook", byte[].class, String.class, String.class, String.class);
        Transactional tx = handle.getAnnotation(Transactional.class);

        assertEquals(Propagation.NOT_SUPPORTED, tx.propagation());
        assertEquals(Propagation.NOT_SUPPORTED,
                ShopLatePaymentRefundServiceImpl.class.getAnnotation(Transactional.class).propagation());
    }

    private ResponseEntity<Map<String, Object>> sendWebhook(String eventType, String webhookId) throws Exception {
        String rawBody = "{"
                + "\"type\":\"" + eventType + "\","
                + "\"data\":{"
                + "\"storeId\":\"" + STORE_ID + "\","
                + "\"paymentId\":\"" + PAYMENT_ID + "\""
                + "}}";
        return webhookService.handleWebhook(
                rawBody.getBytes(StandardCharsets.UTF_8),
                TIMESTAMP,
                v1Signature(WEBHOOK_SECRET, TIMESTAMP, rawBody),
                webhookId);
    }

    private static String v1Signature(String secret, String timestamp, String body) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] digest = mac.doFinal((timestamp + "." + body).getBytes(StandardCharsets.UTF_8));
        return "v1," + Base64.getEncoder().encodeToString(digest);
    }
}
