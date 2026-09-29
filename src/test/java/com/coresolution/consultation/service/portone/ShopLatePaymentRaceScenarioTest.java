package com.coresolution.consultation.service.portone;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopLatePaymentConstants;
import com.coresolution.consultation.constant.ShopUserPaymentCancelConstants;
import com.coresolution.consultation.dto.shop.ShopUserCancelPaymentResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.ClientPointWalletService;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.PersonalDataEncryptionService;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * 취소 후 늦은 결제 레이스 시나리오 — 실제 웹훅·늦은 결제 가드·사용자 취소 서비스를 묶고
 * 주문·결제는 메모리 상태, PortOne 조회·취소 API 는 목으로 둔다.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("늦은 결제 레이스 시나리오 (웹훅 + 가드 + 사용자 취소)")
class ShopLatePaymentRaceScenarioTest {

    private static final String STORE_ID = "store-late-scenario";
    private static final String WEBHOOK_SECRET = "whsec_late_scenario_secret";
    private static final String TIMESTAMP = "1700000000";
    private static final String TENANT_ID = "tenant-late-scenario";
    private static final String ORDER_PUBLIC_ID = "ord-late-scenario-1";
    private static final String PAYMENT_ID = "pay-late-scenario-1";
    private static final Long CLIENT_ID = 4242L;
    private static final long CASH_DUE = 12_000L;

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

    private PortOnePaymentWebhookService webhookService;
    private ClientShopPaymentCancelServiceImpl cancelService;

    private ShopClientOrder order;
    private Payment payment;

    @BeforeEach
    void setUp() {
        ShopLatePaymentRefundServiceImpl guard = new ShopLatePaymentRefundServiceImpl(
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
                transactionManager);

        order = ShopClientOrder.builder()
                .publicId(ORDER_PUBLIC_ID)
                .clientId(CLIENT_ID)
                .status(ShopClientOrderStatus.PENDING_PAYMENT)
                .subtotalMinor(CASH_DUE)
                .pointsRedeemMinor(0L)
                .cashDueMinor(CASH_DUE)
                .checkoutIdempotencyKey("idem-late-scenario")
                .checkoutSource(ShopCheckoutConstants.CHECKOUT_SOURCE_CART)
                .build();
        order.setTenantId(TENANT_ID);
        payment = Payment.builder()
                .paymentId(PAYMENT_ID)
                .orderId(ORDER_PUBLIC_ID)
                .status(Payment.PaymentStatus.PENDING)
                .provider(Payment.PaymentProvider.IAMPORT)
                .build();
        payment.setId(1L);
        payment.setTenantId(TENANT_ID);

        TenantPgConfiguration configuration = new TenantPgConfiguration();
        configuration.setConfigId("cfg-late-scenario");
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
        // 열린 주문의 정상 승인: 결제 APPROVED·주문 PAID (PaymentServiceImpl.approveShopOrderPayment 대역)
        lenient().when(paymentService.approveShopOrderPayment(PAYMENT_ID)).thenAnswer(inv -> {
            payment.setStatus(Payment.PaymentStatus.APPROVED);
            order.setStatus(ShopClientOrderStatus.PAID);
            return null;
        });
    }

    @Test
    @DisplayName("취소된 주문 + PAID 웹훅 → 승인 안 함, PortOne 취소 1회, 결제 REFUNDED, 관리자 알림·내담자 안내")
    void cancelledOrder_paidWebhook_autoRefunded() throws Exception {
        order.setStatus(ShopClientOrderStatus.CANCELLED);
        payment.setStatus(Payment.PaymentStatus.CANCELLED);
        when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT_ID), eq(PAYMENT_ID), anyString()))
                .thenReturn(true);

        ResponseEntity<Map<String, Object>> response = sendWebhook("Transaction.Paid", "whk-late-1");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(ShopLatePaymentConstants.WEBHOOK_STATUS_LATE_PAYMENT_REFUNDED, response.getBody().get("status"));
        assertEquals(Payment.PaymentStatus.REFUNDED, payment.getStatus());
        assertEquals(ShopLatePaymentConstants.FAILURE_REASON_LATE_PAYMENT_ON_CLOSED_ORDER, payment.getFailureReason());
        assertNotNull(payment.getRefundedAt());
        assertEquals(ShopClientOrderStatus.CANCELLED, order.getStatus());
        verify(paymentService, never()).approveShopOrderPayment(any());
        verify(paymentService, never()).updatePaymentStatus(any(), any());
        verify(portOneV2PaymentCancelService, times(1))
                .cancelPayment(TENANT_ID, PAYMENT_ID, ShopLatePaymentConstants.PORTONE_CANCEL_REASON);
        verify(schedulerFailureNotifier, times(1)).notifyFailure(
                eq(ShopLatePaymentConstants.ADMIN_ALERT_SOURCE),
                eq(ShopLatePaymentConstants.ADMIN_ALERT_STEP_REFUNDED),
                eq(TENANT_ID),
                any());
        verify(shopNotificationHelper, times(1)).notifyLatePaymentAutoCancelled(TENANT_ID, order);
    }

    @Test
    @DisplayName("같은 PAID 웹훅 2회 → PortOne 취소 API 는 1회, 두 번째는 멱등 200")
    void samePaidWebhookTwice_refundApiOnce() throws Exception {
        order.setStatus(ShopClientOrderStatus.CANCELLED);
        payment.setStatus(Payment.PaymentStatus.CANCELLED);
        when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT_ID), eq(PAYMENT_ID), anyString()))
                .thenReturn(true);

        ResponseEntity<Map<String, Object>> first = sendWebhook("Transaction.Paid", "whk-late-dup");
        ResponseEntity<Map<String, Object>> second = sendWebhook("Transaction.Paid", "whk-late-dup");

        assertEquals(HttpStatus.OK, first.getStatusCode());
        assertEquals(HttpStatus.OK, second.getStatusCode());
        assertEquals(Boolean.TRUE, second.getBody().get("deduplicated"));
        assertEquals(Payment.PaymentStatus.REFUNDED, payment.getStatus());
        verify(portOneV2PaymentCancelService, times(1)).cancelPayment(any(), any(), any());
        verify(shopNotificationHelper, times(1)).notifyLatePaymentAutoCancelled(any(), any());
        verify(paymentService, never()).approveShopOrderPayment(any());
    }

    @Test
    @DisplayName("PortOne 취소 API 실패 → 결제 REFUND_REQUIRED, 관리자 알림, 웹훅 500(재시도) — 재시도 성공 시 REFUNDED")
    void refundApiFails_refundRequired_webhookFails_thenRetrySucceeds() throws Exception {
        order.setStatus(ShopClientOrderStatus.CANCELLED);
        payment.setStatus(Payment.PaymentStatus.CANCELLED);
        when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT_ID), eq(PAYMENT_ID), anyString()))
                .thenReturn(false)
                .thenReturn(true);

        ResponseEntity<Map<String, Object>> failed = sendWebhook("Transaction.Paid", "whk-late-fail");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, failed.getStatusCode());
        assertEquals(Payment.PaymentStatus.REFUND_REQUIRED, payment.getStatus());
        assertEquals(ShopLatePaymentConstants.FAILURE_REASON_LATE_PAYMENT_ON_CLOSED_ORDER, payment.getFailureReason());
        verify(schedulerFailureNotifier, times(1)).notifyFailure(
                eq(ShopLatePaymentConstants.ADMIN_ALERT_SOURCE),
                eq(ShopLatePaymentConstants.ADMIN_ALERT_STEP_REFUND_REQUIRED),
                eq(TENANT_ID),
                any());
        verify(shopNotificationHelper, never()).notifyLatePaymentAutoCancelled(any(), any());

        ResponseEntity<Map<String, Object>> retried = sendWebhook("Transaction.Paid", "whk-late-fail");

        assertEquals(HttpStatus.OK, retried.getStatusCode());
        assertEquals(Payment.PaymentStatus.REFUNDED, payment.getStatus());
        assertEquals(ShopClientOrderStatus.CANCELLED, order.getStatus());
        verify(portOneV2PaymentCancelService, times(2)).cancelPayment(any(), any(), any());
        verify(paymentService, never()).approveShopOrderPayment(any());
    }

    @Test
    @DisplayName("만료(EXPIRED) 주문 + PAID 웹훅 → 동일하게 PAID 복구 없이 PortOne 취소·REFUNDED")
    void expiredOrder_paidWebhook_autoRefunded() throws Exception {
        order.setStatus(ShopClientOrderStatus.EXPIRED);
        payment.setStatus(Payment.PaymentStatus.EXPIRED);
        when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT_ID), eq(PAYMENT_ID), anyString()))
                .thenReturn(true);

        ResponseEntity<Map<String, Object>> response = sendWebhook("Transaction.Paid", "whk-late-expired");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(Payment.PaymentStatus.REFUNDED, payment.getStatus());
        assertEquals(ShopClientOrderStatus.EXPIRED, order.getStatus());
        verify(paymentService, never()).approveShopOrderPayment(any());
        verify(portOneV2PaymentCancelService, times(1)).cancelPayment(any(), any(), any());
        verify(shopNotificationHelper, times(1)).notifyLatePaymentAutoCancelled(TENANT_ID, order);
    }

    @Test
    @DisplayName("자동 취소 후 PortOne Cancelled 웹훅 → REFUNDED 유지, 상태 변경 호출 없음")
    void afterAutoRefund_cancelledWebhook_keepsRefunded() throws Exception {
        order.setStatus(ShopClientOrderStatus.CANCELLED);
        payment.setStatus(Payment.PaymentStatus.CANCELLED);
        when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT_ID), eq(PAYMENT_ID), anyString()))
                .thenReturn(true);
        sendWebhook("Transaction.Paid", "whk-late-paid");

        ResponseEntity<Map<String, Object>> cancelled = sendWebhook("Transaction.Cancelled", "whk-late-cancelled");

        assertEquals(HttpStatus.OK, cancelled.getStatusCode());
        assertEquals(Payment.PaymentStatus.REFUNDED, payment.getStatus());
        verify(paymentService, never()).updatePaymentStatus(any(), any());
        verify(portOneV2PaymentCancelService, times(1)).cancelPayment(any(), any(), any());
    }

    @Test
    @DisplayName("재현: 탭 A 결제 인증 중(PortOne READY) → 탭 B 결제창 닫기 → 주문 PENDING 유지 → A 승인 → 정상 PAID, 환불 없음")
    void probe_tabAAuthenticating_tabBCancels_thenAApproves_orderPaid() throws Exception {
        when(portOneV2PaymentVerifyService.resolvePaidState(TENANT_ID, PAYMENT_ID))
                .thenReturn(PortOnePaymentPaidState.IN_PROGRESS);

        ShopUserCancelPaymentResponse tabB = cancelService.cancelByUser(TENANT_ID, CLIENT_ID, ORDER_PUBLIC_ID);

        assertEquals(ShopUserPaymentCancelConstants.OUTCOME_NOT_CANCELLABLE_IN_PROGRESS, tabB.getOutcome());
        assertEquals(ShopClientOrderStatus.PENDING_PAYMENT, order.getStatus());
        assertEquals(Payment.PaymentStatus.PENDING, payment.getStatus());
        verify(clientPointWalletService, never()).releaseHold(any(), any(), any(), anyLong(), any());

        ResponseEntity<Map<String, Object>> tabAPaid = sendWebhook("Transaction.Paid", "whk-probe-a");

        assertEquals(HttpStatus.OK, tabAPaid.getStatusCode());
        assertEquals("ok", tabAPaid.getBody().get("status"));
        verify(paymentService, times(1)).approveShopOrderPayment(PAYMENT_ID);
        assertEquals(ShopClientOrderStatus.PAID, order.getStatus());
        assertEquals(Payment.PaymentStatus.APPROVED, payment.getStatus());
        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any());
    }

    @Test
    @DisplayName("재현(대조): PortOne 이 확실히 미승인일 때만 닫힘 → 그 뒤 늦은 PAID 는 PortOne 자동 취소, 주문 CANCELLED 유지")
    void probe_sureUnpaidCancelled_thenLatePaid_autoRefunded() throws Exception {
        when(portOneV2PaymentVerifyService.resolvePaidState(TENANT_ID, PAYMENT_ID))
                .thenReturn(PortOnePaymentPaidState.NOT_PAID);
        when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT_ID), eq(PAYMENT_ID), anyString()))
                .thenReturn(true);

        ShopUserCancelPaymentResponse tabB = cancelService.cancelByUser(TENANT_ID, CLIENT_ID, ORDER_PUBLIC_ID);

        assertEquals(ShopUserPaymentCancelConstants.OUTCOME_CANCELLED, tabB.getOutcome());
        assertEquals(ShopClientOrderStatus.CANCELLED, order.getStatus());
        assertEquals(Payment.PaymentStatus.CANCELLED, payment.getStatus());

        ResponseEntity<Map<String, Object>> latePaid = sendWebhook("Transaction.Paid", "whk-probe-late");

        assertEquals(HttpStatus.OK, latePaid.getStatusCode());
        assertEquals(ShopClientOrderStatus.CANCELLED, order.getStatus());
        assertEquals(Payment.PaymentStatus.REFUNDED, payment.getStatus());
        verify(paymentService, never()).approveShopOrderPayment(any());
        verify(portOneV2PaymentCancelService, times(1)).cancelPayment(any(), any(), any());
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
