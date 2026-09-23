package com.coresolution.consultation.service.portone;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import com.coresolution.consultation.service.PaymentService;
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
    private static final String WEBHOOK_SECRET = "whsec_unit_test_secret";
    private static final String TIMESTAMP = "1700000000";
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
    private PaymentService paymentService;
    @Mock
    private ClientShopCheckoutService clientShopCheckoutService;

    private PortOnePaymentWebhookService service;

    @BeforeEach
    void setUp() {
        service = new PortOnePaymentWebhookService(
                new ObjectMapper(),
                encryptionService,
                tenantPgConfigurationRepository,
                paymentRepository,
                paymentService,
                clientShopCheckoutService);
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

        String signature = v1Signature(WEBHOOK_SECRET, TIMESTAMP, rawBody);

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

        String signature = v1Signature(WEBHOOK_SECRET, TIMESTAMP, rawBody);

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

        String signature = v1Signature(WEBHOOK_SECRET, TIMESTAMP, rawBody);

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

        String signature = v1Signature(WEBHOOK_SECRET, TIMESTAMP, rawBody);

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

        String signature = v1Signature(WEBHOOK_SECRET, TIMESTAMP, rawBody);

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

        String signature = v1Signature(WEBHOOK_SECRET, TIMESTAMP, rawBody);

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

    private static String v1Signature(String secret, String timestamp, String body) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] digest = mac.doFinal((timestamp + "." + body).getBytes(StandardCharsets.UTF_8));
        return "v1," + Base64.getEncoder().encodeToString(digest);
    }
}
