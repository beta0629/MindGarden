package com.coresolution.consultation.service.portone;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.ShopLatePaymentRefundService;
import com.coresolution.consultation.service.PersonalDataEncryptionService;
import com.coresolution.core.constants.TenantPgSettingsJsonKeys;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@link PortOnePaymentWebhookService} 매칭·Paid 반영 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-17
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PortOnePaymentWebhookService")
class PortOnePaymentWebhookServiceTest {

    private static final String STORE_ID = "store-unit-portone";
    private static final String WEBHOOK_SECRET = PortOneWebhookTestSignatures.secretForLabel("unit-test-webhook");
    private static final String TIMESTAMP = PortOneWebhookTestSignatures.currentTimestamp();
    private static final String TENANT_ID = "tenant-unit-webhook";
    private static final String ORDER_PUBLIC_ID = "ord-public-unit-1";
    private static final String PAYMENT_ID = "pay-unit-1";

    @Mock
    private PersonalDataEncryptionService encryptionService;
    @Mock
    private TenantPgConfigurationRepository tenantPgConfigurationRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private ShopClientOrderRepository shopClientOrderRepository;
    @Mock
    private PaymentService paymentService;
    @Mock
    private ClientShopCheckoutService clientShopCheckoutService;
    @Mock
    private ShopLatePaymentRefundService shopLatePaymentRefundService;
    @Mock
    private PortOneV2PaymentVerifyService portOneV2PaymentVerifyService;

    @Mock
    private PortOneVerifyUnknownRetryTracker portOneVerifyUnknownRetryTracker;

    private PortOnePaymentWebhookService service;

    @BeforeEach
    void setUp() {
        service = new PortOnePaymentWebhookService(
                new ObjectMapper(),
                encryptionService,
                tenantPgConfigurationRepository,
                paymentRepository,
                shopClientOrderRepository,
                paymentService,
                clientShopCheckoutService,
                shopLatePaymentRefundService,
                portOneV2PaymentVerifyService,
                portOneVerifyUnknownRetryTracker,
                PortOneWebhookTestSignatures.properties());
        lenient().when(portOneVerifyUnknownRetryTracker.recordUnknownAndDecide(anyString(), anyString()))
                .thenReturn(PortOneVerifyUnknownRetryOutcome.RETRYABLE);
    }

    @Test
    @DisplayName("Transaction.Paid + customData.orderPublicId 로 결제 매칭 후 APPROVED")
    void handleWebhook_paidMatchesCustomDataOrderPublicId() throws Exception {
        String rawBody = "{"
                + "\"type\":\"Transaction.Paid\","
                + "\"data\":{"
                + "\"storeId\":\"" + STORE_ID + "\","
                + "\"customData\":{\"orderPublicId\":\"" + ORDER_PUBLIC_ID + "\"}"
                + "}}";

        TenantPgConfiguration configuration = new TenantPgConfiguration();
        configuration.setConfigId("cfg-unit-1");
        configuration.setTenantId(TENANT_ID);
        configuration.setPgProvider(PgProvider.IAMPORT);
        configuration.setStoreId(STORE_ID);
        configuration.setStatus(PgConfigurationStatus.ACTIVE);
        configuration.setSettingsJson("{\"" + TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET + "\":\""
                + WEBHOOK_SECRET + "\"}");

        when(tenantPgConfigurationRepository.findAllByStoreIdAndPgProviderAndStatusAndIsDeletedFalse(
                eq(STORE_ID), eq(PgProvider.IAMPORT), eq(PgConfigurationStatus.ACTIVE)))
                .thenReturn(List.of(configuration));

        Payment payment = Payment.builder()
                .paymentId(PAYMENT_ID)
                .orderId(ORDER_PUBLIC_ID)
                .status(Payment.PaymentStatus.PENDING)
                .build();
        payment.setTenantId(TENANT_ID);

        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT_ID, ORDER_PUBLIC_ID))
                .thenReturn(List.of(payment));
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_ID))
                .thenReturn(Optional.of(payment));

        String signature = PortOneWebhookTestSignatures.v1(WEBHOOK_SECRET, "whk-unit-1", TIMESTAMP, rawBody);

        ResponseEntity<Map<String, Object>> response = service.handleWebhook(
                rawBody.getBytes(StandardCharsets.UTF_8),
                TIMESTAMP,
                signature,
                "whk-unit-1");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("ok", response.getBody().get("status"));
        assertEquals(PAYMENT_ID, response.getBody().get("paymentId"));
        verify(paymentService).approveShopOrderPayment(PAYMENT_ID);
    }

    @Test
    @DisplayName("FAILED 동일상태 재전송 — release 실패 시 500(fail-closed, PG 재시도 가능)")
    void handleWebhook_failedSameStatus_releaseThrows_returns500() throws Exception {
        String rawBody = "{"
                + "\"type\":\"Transaction.Failed\","
                + "\"data\":{"
                + "\"storeId\":\"" + STORE_ID + "\","
                + "\"paymentId\":\"" + PAYMENT_ID + "\","
                + "\"customData\":{\"orderPublicId\":\"" + ORDER_PUBLIC_ID + "\"}"
                + "}}";

        TenantPgConfiguration configuration = new TenantPgConfiguration();
        configuration.setConfigId("cfg-unit-failed-1");
        configuration.setTenantId(TENANT_ID);
        configuration.setPgProvider(PgProvider.IAMPORT);
        configuration.setStoreId(STORE_ID);
        configuration.setStatus(PgConfigurationStatus.ACTIVE);
        configuration.setSettingsJson("{\"" + TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET + "\":\""
                + WEBHOOK_SECRET + "\"}");

        when(tenantPgConfigurationRepository.findAllByStoreIdAndPgProviderAndStatusAndIsDeletedFalse(
                eq(STORE_ID), eq(PgProvider.IAMPORT), eq(PgConfigurationStatus.ACTIVE)))
                .thenReturn(List.of(configuration));
        when(encryptionService.isEncrypted(WEBHOOK_SECRET)).thenReturn(false);

        Payment payment = Payment.builder()
                .paymentId(PAYMENT_ID)
                .orderId(ORDER_PUBLIC_ID)
                .status(Payment.PaymentStatus.FAILED)
                .build();
        payment.setTenantId(TENANT_ID);

        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_ID))
                .thenReturn(Optional.of(payment));
        when(clientShopCheckoutService.releaseOrderHoldOnPaymentFailure(TENANT_ID, ORDER_PUBLIC_ID))
                .thenThrow(new IllegalStateException("release failed for FAILED sync"));

        String signature = PortOneWebhookTestSignatures.v1(WEBHOOK_SECRET, "whk-unit-failed-1", TIMESTAMP, rawBody);

        ResponseEntity<Map<String, Object>> response = service.handleWebhook(
                rawBody.getBytes(StandardCharsets.UTF_8),
                TIMESTAMP,
                signature,
                "whk-unit-failed-1");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("결제 반영 실패", response.getBody().get("message"));
        verify(clientShopCheckoutService).releaseOrderHoldOnPaymentFailure(TENANT_ID, ORDER_PUBLIC_ID);
    }

    @Test
    @DisplayName("paymentId 직접 매칭이 있으면 customData 조회 전에 성공한다")
    void handleWebhook_paidMatchesPaymentIdFirst() throws Exception {
        String rawBody = "{"
                + "\"type\":\"Transaction.Paid\","
                + "\"data\":{"
                + "\"storeId\":\"" + STORE_ID + "\","
                + "\"paymentId\":\"" + PAYMENT_ID + "\","
                + "\"customData\":{\"orderPublicId\":\"" + ORDER_PUBLIC_ID + "\"}"
                + "}}";

        TenantPgConfiguration configuration = new TenantPgConfiguration();
        configuration.setConfigId("cfg-unit-2");
        configuration.setTenantId(TENANT_ID);
        configuration.setPgProvider(PgProvider.IAMPORT);
        configuration.setStoreId(STORE_ID);
        configuration.setStatus(PgConfigurationStatus.ACTIVE);
        configuration.setSettingsJson("{\"" + TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET + "\":\""
                + WEBHOOK_SECRET + "\"}");

        when(tenantPgConfigurationRepository.findAllByStoreIdAndPgProviderAndStatusAndIsDeletedFalse(
                eq(STORE_ID), eq(PgProvider.IAMPORT), eq(PgConfigurationStatus.ACTIVE)))
                .thenReturn(List.of(configuration));

        Payment payment = Payment.builder()
                .paymentId(PAYMENT_ID)
                .orderId(ORDER_PUBLIC_ID)
                .status(Payment.PaymentStatus.PENDING)
                .build();
        payment.setTenantId(TENANT_ID);

        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_ID))
                .thenReturn(Optional.of(payment));

        String signature = PortOneWebhookTestSignatures.v1(WEBHOOK_SECRET, "whk-unit-2", TIMESTAMP, rawBody);

        ResponseEntity<Map<String, Object>> response = service.handleWebhook(
                rawBody.getBytes(StandardCharsets.UTF_8),
                TIMESTAMP,
                signature,
                "whk-unit-2");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("ok", response.getBody().get("status"));
        verify(paymentService).approveShopOrderPayment(PAYMENT_ID);
        assertTrue(response.getBody().containsKey("paymentId"));
    }

    @Test
    @DisplayName("Transaction.Paid + customData JSON 문자열 orderPublicId 로 결제 매칭 후 APPROVED")
    void handleWebhook_paidMatchesCustomDataOrderPublicIdJsonString() throws Exception {
        String rawBody = "{"
                + "\"type\":\"Transaction.Paid\","
                + "\"data\":{"
                + "\"storeId\":\"" + STORE_ID + "\","
                + "\"customData\":\"{\\\"orderPublicId\\\":\\\"" + ORDER_PUBLIC_ID + "\\\"}\""
                + "}}";

        TenantPgConfiguration configuration = new TenantPgConfiguration();
        configuration.setConfigId("cfg-unit-3");
        configuration.setTenantId(TENANT_ID);
        configuration.setPgProvider(PgProvider.IAMPORT);
        configuration.setStoreId(STORE_ID);
        configuration.setStatus(PgConfigurationStatus.ACTIVE);
        configuration.setSettingsJson("{\"" + TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET + "\":\""
                + WEBHOOK_SECRET + "\"}");

        when(tenantPgConfigurationRepository.findAllByStoreIdAndPgProviderAndStatusAndIsDeletedFalse(
                eq(STORE_ID), eq(PgProvider.IAMPORT), eq(PgConfigurationStatus.ACTIVE)))
                .thenReturn(List.of(configuration));

        Payment payment = Payment.builder()
                .paymentId(PAYMENT_ID)
                .orderId(ORDER_PUBLIC_ID)
                .status(Payment.PaymentStatus.PENDING)
                .build();
        payment.setTenantId(TENANT_ID);

        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT_ID, ORDER_PUBLIC_ID))
                .thenReturn(List.of(payment));
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_ID))
                .thenReturn(Optional.of(payment));

        String signature = PortOneWebhookTestSignatures.v1(WEBHOOK_SECRET, "whk-unit-3", TIMESTAMP, rawBody);

        ResponseEntity<Map<String, Object>> response = service.handleWebhook(
                rawBody.getBytes(StandardCharsets.UTF_8),
                TIMESTAMP,
                signature,
                "whk-unit-3");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("ok", response.getBody().get("status"));
        assertEquals(PAYMENT_ID, response.getBody().get("paymentId"));
        verify(paymentService).approveShopOrderPayment(PAYMENT_ID);
    }

    @Test
    @DisplayName("Transaction.Cancelled — cancelledAt 선기록 후 updatePaymentStatus(CANCELLED) + reconcile")
    void handleWebhook_cancelled_updatesAndReconciles() throws Exception {
        String rawBody = "{"
                + "\"type\":\"Transaction.Cancelled\","
                + "\"data\":{"
                + "\"storeId\":\"" + STORE_ID + "\","
                + "\"paymentId\":\"" + PAYMENT_ID + "\","
                + "\"customData\":{\"orderPublicId\":\"" + ORDER_PUBLIC_ID + "\"}"
                + "}}";

        TenantPgConfiguration configuration = new TenantPgConfiguration();
        configuration.setConfigId("cfg-unit-cancelled");
        configuration.setTenantId(TENANT_ID);
        configuration.setPgProvider(PgProvider.IAMPORT);
        configuration.setStoreId(STORE_ID);
        configuration.setStatus(PgConfigurationStatus.ACTIVE);
        configuration.setSettingsJson("{\"" + TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET + "\":\""
                + WEBHOOK_SECRET + "\"}");

        when(tenantPgConfigurationRepository.findAllByStoreIdAndPgProviderAndStatusAndIsDeletedFalse(
                eq(STORE_ID), eq(PgProvider.IAMPORT), eq(PgConfigurationStatus.ACTIVE)))
                .thenReturn(List.of(configuration));
        when(encryptionService.isEncrypted(WEBHOOK_SECRET)).thenReturn(false);

        Payment payment = Payment.builder()
                .paymentId(PAYMENT_ID)
                .orderId(ORDER_PUBLIC_ID)
                .status(Payment.PaymentStatus.APPROVED)
                .build();
        payment.setTenantId(TENANT_ID);

        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_ID))
                .thenReturn(Optional.of(payment));
        when(clientShopCheckoutService.reconcileOrderOnPaymentCancelOrRefund(TENANT_ID, ORDER_PUBLIC_ID))
                .thenReturn(true);

        String signature = PortOneWebhookTestSignatures.v1(
                WEBHOOK_SECRET, "whk-unit-cancelled", TIMESTAMP, rawBody);

        ResponseEntity<Map<String, Object>> response = service.handleWebhook(
                rawBody.getBytes(StandardCharsets.UTF_8),
                TIMESTAMP,
                signature,
                "whk-unit-cancelled");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("ok", response.getBody().get("status"));
        assertNotNull(payment.getCancelledAt());
        InOrder inOrder = inOrder(paymentRepository, paymentService);
        inOrder.verify(paymentRepository).save(argThat(p -> p.getCancelledAt() != null));
        inOrder.verify(paymentService).updatePaymentStatus(PAYMENT_ID, Payment.PaymentStatus.CANCELLED);
        verify(clientShopCheckoutService).reconcileOrderOnPaymentCancelOrRefund(TENANT_ID, ORDER_PUBLIC_ID);
    }

    @Test
    @DisplayName("Transaction.PartialCancelled — 전액 reverse 금지: 무시(200 ignored), reconcile 미호출")
    void handleWebhook_partialCancelled_ignoredNoReconcile() throws Exception {
        String rawBody = "{"
                + "\"type\":\"Transaction.PartialCancelled\","
                + "\"data\":{"
                + "\"storeId\":\"" + STORE_ID + "\","
                + "\"paymentId\":\"" + PAYMENT_ID + "\""
                + "}}";

        TenantPgConfiguration configuration = new TenantPgConfiguration();
        configuration.setConfigId("cfg-unit-partial");
        configuration.setTenantId(TENANT_ID);
        configuration.setPgProvider(PgProvider.IAMPORT);
        configuration.setStoreId(STORE_ID);
        configuration.setStatus(PgConfigurationStatus.ACTIVE);
        configuration.setSettingsJson("{\"" + TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET + "\":\""
                + WEBHOOK_SECRET + "\"}");

        when(tenantPgConfigurationRepository.findAllByStoreIdAndPgProviderAndStatusAndIsDeletedFalse(
                eq(STORE_ID), eq(PgProvider.IAMPORT), eq(PgConfigurationStatus.ACTIVE)))
                .thenReturn(List.of(configuration));
        when(encryptionService.isEncrypted(WEBHOOK_SECRET)).thenReturn(false);

        String signature = PortOneWebhookTestSignatures.v1(
                WEBHOOK_SECRET, "whk-unit-partial", TIMESTAMP, rawBody);

        ResponseEntity<Map<String, Object>> response = service.handleWebhook(
                rawBody.getBytes(StandardCharsets.UTF_8),
                TIMESTAMP,
                signature,
                "whk-unit-partial");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("ignored", response.getBody().get("status"));
        verify(paymentService, never()).updatePaymentStatus(any(), any());
        verify(clientShopCheckoutService, never()).reconcileOrderOnPaymentCancelOrRefund(any(), any());
    }

    @Test
    @DisplayName("암호화된 portoneWebhookSecret 저장 시 decrypt 후 서명 검증 통과")
    void handleWebhook_encryptedWebhookSecret_verifiesSignature() throws Exception {
        String rawBody = "{"
                + "\"type\":\"Transaction.Paid\","
                + "\"data\":{"
                + "\"storeId\":\"" + STORE_ID + "\","
                + "\"paymentId\":\"" + PAYMENT_ID + "\","
                + "\"customData\":{\"orderPublicId\":\"" + ORDER_PUBLIC_ID + "\"}"
                + "}}";

        String encryptedSecret = "ENC(" + WEBHOOK_SECRET + ")";
        TenantPgConfiguration configuration = new TenantPgConfiguration();
        configuration.setConfigId("cfg-unit-encrypted-secret");
        configuration.setTenantId(TENANT_ID);
        configuration.setPgProvider(PgProvider.IAMPORT);
        configuration.setStoreId(STORE_ID);
        configuration.setStatus(PgConfigurationStatus.ACTIVE);
        configuration.setSettingsJson("{\"" + TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET + "\":\""
                + encryptedSecret + "\"}");

        when(tenantPgConfigurationRepository.findAllByStoreIdAndPgProviderAndStatusAndIsDeletedFalse(
                eq(STORE_ID), eq(PgProvider.IAMPORT), eq(PgConfigurationStatus.ACTIVE)))
                .thenReturn(List.of(configuration));
        when(encryptionService.isEncrypted(encryptedSecret)).thenReturn(true);
        when(encryptionService.decrypt(encryptedSecret)).thenReturn(WEBHOOK_SECRET);

        Payment payment = Payment.builder()
                .paymentId(PAYMENT_ID)
                .orderId(ORDER_PUBLIC_ID)
                .status(Payment.PaymentStatus.PENDING)
                .build();
        payment.setTenantId(TENANT_ID);

        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_ID))
                .thenReturn(Optional.of(payment));

        String signature = PortOneWebhookTestSignatures.v1(
                WEBHOOK_SECRET, "whk-unit-encrypted", TIMESTAMP, rawBody);

        ResponseEntity<Map<String, Object>> response = service.handleWebhook(
                rawBody.getBytes(StandardCharsets.UTF_8),
                TIMESTAMP,
                signature,
                "whk-unit-encrypted");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("ok", response.getBody().get("status"));
        assertEquals(PAYMENT_ID, response.getBody().get("paymentId"));
        verify(encryptionService).decrypt(encryptedSecret);
        verify(paymentService).approveShopOrderPayment(PAYMENT_ID);
    }

    @Test
    @DisplayName("쇼핑 주문 Transaction.Paid — PortOne underpay 이면 전액 취소·approve 없음")
    void handleWebhook_shopPaid_underpay_cancelsWithoutApprove() throws Exception {
        String rawBody = paidWebhookBodyWithPaymentId();
        stubActiveWebhookConfig("cfg-underpay");
        Payment payment = pendingShopPayment();
        ShopClientOrder order = shopOrder(10_000L);
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_ID))
                .thenReturn(Optional.of(payment));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT_ID, ORDER_PUBLIC_ID))
                .thenReturn(Optional.of(order));
        when(portOneV2PaymentVerifyService.verifyPaidMatchesShopOrder(TENANT_ID, PAYMENT_ID, order))
                .thenReturn(PortOneShopPaidMatch.mismatch(null, java.math.BigDecimal.valueOf(100)));
        when(clientShopCheckoutService.cancelMismatchedApprovedPaymentForOrder(
                        eq(TENANT_ID), eq(ORDER_PUBLIC_ID), eq(java.math.BigDecimal.valueOf(100))))
                .thenReturn(true);

        String signature = PortOneWebhookTestSignatures.v1(WEBHOOK_SECRET, "whk-underpay", TIMESTAMP, rawBody);
        ResponseEntity<Map<String, Object>> response = service.handleWebhook(
                rawBody.getBytes(StandardCharsets.UTF_8), TIMESTAMP, signature, "whk-underpay");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(PortOneV2WebhookConstants.STATUS_MISMATCH_CANCELLED, response.getBody().get("status"));
        verify(paymentService, never()).approveShopOrderPayment(any());
        verify(clientShopCheckoutService).cancelMismatchedApprovedPaymentForOrder(
                TENANT_ID, ORDER_PUBLIC_ID, java.math.BigDecimal.valueOf(100));
    }

    @Test
    @DisplayName("쇼핑 주문 Transaction.Paid — PortOne 검증 UNKNOWN 이면 5xx·취소·approve 없음")
    void handleWebhook_shopPaid_verifyUnknown_returns5xxNoCancel() throws Exception {
        String rawBody = paidWebhookBodyWithPaymentId();
        stubActiveWebhookConfig("cfg-unknown");
        Payment payment = pendingShopPayment();
        ShopClientOrder order = shopOrder(10_000L);
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_ID))
                .thenReturn(Optional.of(payment));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT_ID, ORDER_PUBLIC_ID))
                .thenReturn(Optional.of(order));
        when(portOneV2PaymentVerifyService.verifyPaidMatchesShopOrder(TENANT_ID, PAYMENT_ID, order))
                .thenReturn(PortOneShopPaidMatch.unknown());

        String signature = PortOneWebhookTestSignatures.v1(WEBHOOK_SECRET, "whk-unknown", TIMESTAMP, rawBody);
        ResponseEntity<Map<String, Object>> response = service.handleWebhook(
                rawBody.getBytes(StandardCharsets.UTF_8), TIMESTAMP, signature, "whk-unknown");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals(PortOneV2WebhookConstants.STATUS_VERIFY_UNKNOWN, response.getBody().get("status"));
        verify(portOneVerifyUnknownRetryTracker).recordUnknownAndDecide(TENANT_ID, PAYMENT_ID);
        verify(paymentService, never()).approveShopOrderPayment(any());
        verify(clientShopCheckoutService, never()).cancelMismatchedApprovedPaymentForOrder(any(), any());
        verify(clientShopCheckoutService, never()).cancelMismatchedApprovedPaymentForOrder(any(), any(), any());
    }

    @Test
    @DisplayName("쇼핑 주문 Transaction.Paid — UNKNOWN 재시도 소진이면 200 verify_unknown_exhausted·취소 없음")
    void handleWebhook_shopPaid_verifyUnknownExhausted_returns200() throws Exception {
        String rawBody = paidWebhookBodyWithPaymentId();
        stubActiveWebhookConfig("cfg-unknown-exhausted");
        Payment payment = pendingShopPayment();
        ShopClientOrder order = shopOrder(10_000L);
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_ID))
                .thenReturn(Optional.of(payment));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT_ID, ORDER_PUBLIC_ID))
                .thenReturn(Optional.of(order));
        when(portOneV2PaymentVerifyService.verifyPaidMatchesShopOrder(TENANT_ID, PAYMENT_ID, order))
                .thenReturn(PortOneShopPaidMatch.unknown());
        when(portOneVerifyUnknownRetryTracker.recordUnknownAndDecide(TENANT_ID, PAYMENT_ID))
                .thenReturn(PortOneVerifyUnknownRetryOutcome.EXHAUSTED);

        String signature = PortOneWebhookTestSignatures.v1(
                WEBHOOK_SECRET, "whk-unknown-exhausted", TIMESTAMP, rawBody);
        ResponseEntity<Map<String, Object>> response = service.handleWebhook(
                rawBody.getBytes(StandardCharsets.UTF_8), TIMESTAMP, signature, "whk-unknown-exhausted");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(
                PortOneV2WebhookConstants.STATUS_VERIFY_UNKNOWN_EXHAUSTED,
                response.getBody().get("status"));
        verify(paymentService, never()).approveShopOrderPayment(any());
        verify(clientShopCheckoutService, never()).cancelMismatchedApprovedPaymentForOrder(any(), any(), any());
    }

    @Test
    @DisplayName("쇼핑 주문 Transaction.Paid — PortOne 금액 일치면 approve")
    void handleWebhook_shopPaid_amountMatch_approves() throws Exception {
        String rawBody = paidWebhookBodyWithPaymentId();
        stubActiveWebhookConfig("cfg-match");
        Payment payment = pendingShopPayment();
        ShopClientOrder order = shopOrder(10_000L);
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_ID))
                .thenReturn(Optional.of(payment));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT_ID, ORDER_PUBLIC_ID))
                .thenReturn(Optional.of(order));
        when(portOneV2PaymentVerifyService.verifyPaidMatchesShopOrder(TENANT_ID, PAYMENT_ID, order))
                .thenReturn(PortOneShopPaidMatch.match(
                        "{\"status\":\"PAID\",\"amount\":{\"total\":10000,\"paid\":10000,\"currency\":\"KRW\"}}",
                        java.math.BigDecimal.valueOf(10_000L)));

        String signature = PortOneWebhookTestSignatures.v1(WEBHOOK_SECRET, "whk-match", TIMESTAMP, rawBody);
        ResponseEntity<Map<String, Object>> response = service.handleWebhook(
                rawBody.getBytes(StandardCharsets.UTF_8), TIMESTAMP, signature, "whk-match");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("ok", response.getBody().get("status"));
        verify(paymentService).approveShopOrderPayment(PAYMENT_ID);
        verify(clientShopCheckoutService, never()).cancelMismatchedApprovedPaymentForOrder(any(), any());
        verify(clientShopCheckoutService, never()).cancelMismatchedApprovedPaymentForOrder(any(), any(), any());
    }

    @Test
    @DisplayName("쇼핑 주문 underpay 취소 후 동일 Paid 재전송 — 이중 환불 없이 멱등")
    void handleWebhook_shopPaid_underpay_idempotentNoDoubleCancel() throws Exception {
        String rawBody = paidWebhookBodyWithPaymentId();
        stubActiveWebhookConfig("cfg-idem");
        Payment payment = pendingShopPayment();
        ShopClientOrder order = shopOrder(10_000L);
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_ID))
                .thenReturn(Optional.of(payment));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT_ID, ORDER_PUBLIC_ID))
                .thenReturn(Optional.of(order));
        when(portOneV2PaymentVerifyService.verifyPaidMatchesShopOrder(TENANT_ID, PAYMENT_ID, order))
                .thenReturn(PortOneShopPaidMatch.mismatch(null, java.math.BigDecimal.valueOf(100)));
        when(clientShopCheckoutService.cancelMismatchedApprovedPaymentForOrder(
                        eq(TENANT_ID), eq(ORDER_PUBLIC_ID), eq(java.math.BigDecimal.valueOf(100))))
                .thenReturn(true);

        String signature = PortOneWebhookTestSignatures.v1(WEBHOOK_SECRET, "whk-idem-1", TIMESTAMP, rawBody);
        assertEquals(HttpStatus.OK, service.handleWebhook(
                rawBody.getBytes(StandardCharsets.UTF_8), TIMESTAMP, signature, "whk-idem-1").getStatusCode());

        String signature2 = PortOneWebhookTestSignatures.v1(WEBHOOK_SECRET, "whk-idem-2", TIMESTAMP, rawBody);
        assertEquals(HttpStatus.OK, service.handleWebhook(
                rawBody.getBytes(StandardCharsets.UTF_8), TIMESTAMP, signature2, "whk-idem-2").getStatusCode());

        verify(clientShopCheckoutService, times(2))
                .cancelMismatchedApprovedPaymentForOrder(
                        TENANT_ID, ORDER_PUBLIC_ID, java.math.BigDecimal.valueOf(100));
        verify(paymentService, never()).approveShopOrderPayment(any());
    }

    private String paidWebhookBodyWithPaymentId() {
        return "{"
                + "\"type\":\"Transaction.Paid\","
                + "\"data\":{"
                + "\"storeId\":\"" + STORE_ID + "\","
                + "\"paymentId\":\"" + PAYMENT_ID + "\","
                + "\"customData\":{\"orderPublicId\":\"" + ORDER_PUBLIC_ID + "\"}"
                + "}}";
    }

    private void stubActiveWebhookConfig(String configId) {
        TenantPgConfiguration configuration = new TenantPgConfiguration();
        configuration.setConfigId(configId);
        configuration.setTenantId(TENANT_ID);
        configuration.setPgProvider(PgProvider.IAMPORT);
        configuration.setStoreId(STORE_ID);
        configuration.setStatus(PgConfigurationStatus.ACTIVE);
        configuration.setSettingsJson("{\"" + TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET + "\":\""
                + WEBHOOK_SECRET + "\"}");
        when(tenantPgConfigurationRepository.findAllByStoreIdAndPgProviderAndStatusAndIsDeletedFalse(
                eq(STORE_ID), eq(PgProvider.IAMPORT), eq(PgConfigurationStatus.ACTIVE)))
                .thenReturn(List.of(configuration));
        when(encryptionService.isEncrypted(WEBHOOK_SECRET)).thenReturn(false);
    }

    private Payment pendingShopPayment() {
        Payment payment = Payment.builder()
                .paymentId(PAYMENT_ID)
                .orderId(ORDER_PUBLIC_ID)
                .status(Payment.PaymentStatus.PENDING)
                .build();
        payment.setTenantId(TENANT_ID);
        return payment;
    }

    private static ShopClientOrder shopOrder(long cashDueMinor) {
        ShopClientOrder order = new ShopClientOrder();
        order.setPublicId(ORDER_PUBLIC_ID);
        order.setCashDueMinor(cashDueMinor);
        order.setTenantId(TENANT_ID);
        return order;
    }
}
