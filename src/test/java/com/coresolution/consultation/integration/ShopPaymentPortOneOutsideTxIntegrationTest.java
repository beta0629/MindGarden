package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.sql.DataSource;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopLatePaymentConstants;
import com.coresolution.consultation.dto.shop.admin.ShopOrderReconcilePaymentResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.AdminShopOrderReconcileService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.ShopLatePaymentOutcome;
import com.coresolution.consultation.service.ShopLatePaymentRefundService;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.portone.PortOnePaymentWebhookService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentCancelService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentLookupService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import com.coresolution.core.constants.TenantPgSettingsJsonKeys;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.monitoring.SchedulerFailureNotifier;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * #1328 검증 후속 — PortOne 호출 동안 DB 커넥션을 쥐지 않는지(항목 2)와 H9b(열린 주문 + 승인 불가 결제에 PAID)를
 * 실제 JPA(H2)·실제 진입점으로 검증한다. PortOne API 는 목(실 PG 호출 없음).
 * <p>목 PortOne 호출 안에서 실제 트랜잭션·트랜잭션 동기화·바인딩된 EntityManager·사용 중 커넥션이 모두 없어야 한다.
 * {@code @Transactional(NOT_SUPPORTED)} 는 실제 트랜잭션은 없지만 동기화를 켜서, 그 범위에서 조회한
 * EntityManager 가 PortOne 호출 동안 커넥션을 쥐고 있었다({@code isActualTransactionActive()} 만으로는 드러나지 않음).</p>
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("#1328 후속 — PortOne 호출 트랜잭션·커넥션 밖 + H9b (H2 통합)")
class ShopPaymentPortOneOutsideTxIntegrationTest {

    private static final String STORE_ID = "store-it-outside-tx";
    private static final String WEBHOOK_SECRET = "whsec_it_outside_tx";
    private static final String TIMESTAMP = "1700000000";
    private static final String WEBHOOK_URL = "/api/v1/payments/webhooks/portone/v2";
    private static final String EVENT_PAID = "Transaction.Paid";
    private static final String EVENT_CANCELLED = "Transaction.Cancelled";
    private static final long CASH_DUE = 9_000L;
    private static final long MISMATCHED_AMOUNT = 8_000L;
    private static final long CLIENT_ID = 7_171L;
    private static final String CARD_APPROVAL_NUMBER = "30001234";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private PortOnePaymentWebhookService webhookService;
    @Autowired
    private PaymentService paymentService;
    @Autowired
    private AdminShopOrderReconcileService reconcileService;
    @Autowired
    private ShopLatePaymentRefundService shopLatePaymentRefundService;
    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private ShopClientOrderRepository orderRepository;
    @Autowired
    private PlatformTransactionManager transactionManager;
    @Autowired
    private EntityManagerFactory entityManagerFactory;
    @Autowired
    private DataSource dataSource;

    @MockBean
    private TenantPgConfigurationRepository tenantPgConfigurationRepository;
    @MockBean
    private PortOneV2PaymentCancelService portOneV2PaymentCancelService;
    @MockBean
    private PortOneV2PaymentVerifyService portOneV2PaymentVerifyService;
    @MockBean
    private PortOneV2PaymentLookupService portOneV2PaymentLookupService;
    @MockBean
    private ShopNotificationHelper shopNotificationHelper;
    @MockBean
    private SchedulerFailureNotifier schedulerFailureNotifier;

    private String tenantId;
    private String orderPublicId;
    private final List<PortOneCallBoundary> boundaries = new CopyOnWriteArrayList<>();

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID().toString();
        orderPublicId = UUID.randomUUID().toString();
        boundaries.clear();
        TenantPgConfiguration configuration = new TenantPgConfiguration();
        configuration.setConfigId(UUID.randomUUID().toString());
        configuration.setTenantId(tenantId);
        configuration.setPgProvider(PgProvider.IAMPORT);
        configuration.setStoreId(STORE_ID);
        configuration.setStatus(PgConfigurationStatus.ACTIVE);
        configuration.setSettingsJson("{\"" + TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET + "\":\""
                + WEBHOOK_SECRET + "\"}");
        when(tenantPgConfigurationRepository.findAllByStoreIdAndPgProviderAndStatusAndIsDeletedFalse(
                eq(STORE_ID), eq(PgProvider.IAMPORT), eq(PgConfigurationStatus.ACTIVE)))
                .thenReturn(List.of(configuration));
        when(portOneV2PaymentCancelService.cancelPayment(anyString(), anyString(), anyString())).thenAnswer(inv -> {
            recordBoundary("cancelPayment");
            return true;
        });
        when(portOneV2PaymentVerifyService.isIamportPayment(any())).thenReturn(true);
        when(portOneV2PaymentVerifyService.verifyPaidAmountBody(anyString(), anyString(), any())).thenAnswer(inv -> {
            recordBoundary("verifyPaidAmountBody");
            return Optional.of("{}");
        });
        when(portOneV2PaymentVerifyService.isCancelledOrPartialCancelled(anyString(), anyString())).thenAnswer(inv -> {
            recordBoundary("isCancelledOrPartialCancelled");
            return true;
        });
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("1. 웹훅(MockMvc 실제 진입점) H9 닫힘 → PG 자동 취소가 트랜잭션·동기화·커넥션 밖")
    void webhookEndpoint_closedOrderLatePaid_cancelOutsideTransactionAndConnection() throws Exception {
        String paymentId = seedOrderWithPayment(ShopClientOrderStatus.EXPIRED, Payment.PaymentStatus.EXPIRED, CASH_DUE);

        postWebhook(webhookBody(EVENT_PAID, paymentId), "whk-endpoint-closed")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(ShopLatePaymentConstants.WEBHOOK_STATUS_LATE_PAYMENT_REFUNDED));

        assertThat(loadPayment(paymentId).getStatus()).isEqualTo(Payment.PaymentStatus.REFUNDED);
        assertThat(loadOrder().getStatus()).isEqualTo(ShopClientOrderStatus.EXPIRED);
        verify(portOneV2PaymentCancelService, times(1)).cancelPayment(eq(tenantId), eq(paymentId),
                eq(ShopLatePaymentConstants.PORTONE_CANCEL_REASON));
        assertPortOneCallsOutsideTransaction("cancelPayment");
    }

    @Test
    @DisplayName("2. 결제 검증(verifyPayment 빈 진입) 열린 주문 → PortOne 조회는 트랜잭션·커넥션 밖, 승인·주문 PAID")
    void verifyPayment_openOrder_lookupOutsideTransactionAndApproves() {
        String paymentId = seedOrderWithPayment(
                ShopClientOrderStatus.PENDING_PAYMENT, Payment.PaymentStatus.PENDING, CASH_DUE);

        TenantContextHolder.setTenantId(tenantId);
        boolean verified = paymentService.verifyPayment(paymentId, BigDecimal.valueOf(CASH_DUE));

        assertThat(verified).isTrue();
        assertThat(loadPayment(paymentId).getStatus()).isEqualTo(Payment.PaymentStatus.APPROVED);
        assertThat(loadOrder().getStatus()).isEqualTo(ShopClientOrderStatus.PAID);
        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any());
        assertPortOneCallsOutsideTransaction("verifyPaidAmountBody");
    }

    @Test
    @DisplayName("3. 결제 검증(verifyPayment) 닫힌 주문 → PortOne 조회·자동 취소 모두 트랜잭션·커넥션 밖, 주문 복구 없음")
    void verifyPayment_closedOrder_lookupAndCancelOutsideTransaction() {
        String paymentId = seedOrderWithPayment(
                ShopClientOrderStatus.CANCELLED, Payment.PaymentStatus.CANCELLED, CASH_DUE);

        TenantContextHolder.setTenantId(tenantId);
        boolean verified = paymentService.verifyPayment(paymentId, BigDecimal.valueOf(CASH_DUE));

        assertThat(verified).isFalse();
        assertThat(loadPayment(paymentId).getStatus()).isEqualTo(Payment.PaymentStatus.REFUNDED);
        assertThat(loadOrder().getStatus()).isEqualTo(ShopClientOrderStatus.CANCELLED);
        verify(portOneV2PaymentCancelService, times(1)).cancelPayment(eq(tenantId), eq(paymentId), any());
        assertPortOneCallsOutsideTransaction("verifyPaidAmountBody", "cancelPayment");
    }

    @Test
    @DisplayName("4. 정합(reconcilePayment) 카드 승인번호 → PortOne 승인번호 조회·검증 모두 트랜잭션·커넥션 밖")
    void reconcilePayment_byApprovalNumber_lookupsOutsideTransaction() {
        String paymentId = seedOrderWithPayment(
                ShopClientOrderStatus.PENDING_PAYMENT, Payment.PaymentStatus.PENDING, CASH_DUE);
        when(portOneV2PaymentLookupService.findPaidPaymentIdByCardApprovalNumber(
                eq(tenantId), eq(CARD_APPROVAL_NUMBER), any(), eq(orderPublicId))).thenAnswer(inv -> {
                    recordBoundary("findPaidPaymentIdByCardApprovalNumber");
                    return Optional.of(paymentId);
                });

        TenantContextHolder.setTenantId(tenantId);
        ShopOrderReconcilePaymentResponse response =
                reconcileService.reconcilePayment(tenantId, orderPublicId, null, CARD_APPROVAL_NUMBER);

        assertThat(response.getOrderStatus()).isEqualTo(ShopClientOrderStatus.PAID);
        assertThat(response.getPaymentStatus()).isEqualTo(Payment.PaymentStatus.APPROVED);
        assertPortOneCallsOutsideTransaction("findPaidPaymentIdByCardApprovalNumber", "verifyPaidAmountBody");
    }

    @Test
    @DisplayName("5. 환불 정합(reconcileRefund) → PortOne 취소 확인 1회·트랜잭션 밖, refundPayment 트랜잭션 안에서 재조회 없음")
    void reconcileRefund_cancelEvidenceCheckedOnceOutsideTransaction() {
        String paymentId = seedOrderWithPayment(ShopClientOrderStatus.PAID, Payment.PaymentStatus.APPROVED, CASH_DUE);

        TenantContextHolder.setTenantId(tenantId);
        ShopOrderReconcilePaymentResponse response = reconcileService.reconcileRefund(tenantId, orderPublicId, false);

        assertThat(response.getPaymentStatus()).isEqualTo(Payment.PaymentStatus.REFUNDED);
        Payment payment = loadPayment(paymentId);
        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.REFUNDED);
        assertThat(payment.getCancelledAt()).isNotNull();
        verify(portOneV2PaymentVerifyService, times(1)).isCancelledOrPartialCancelled(tenantId, paymentId);
        assertPortOneCallsOutsideTransaction("isCancelledOrPartialCancelled");
    }

    @Test
    @DisplayName("6. force 환불 정합 + PortOne 취소 증거 없음 → 결제 상태 그대로(가드와 같은 거부), 조회는 트랜잭션 밖")
    void reconcileRefund_forceWithoutPortOneCancel_rejectedWithoutStateChange() {
        String paymentId = seedOrderWithPayment(ShopClientOrderStatus.PAID, Payment.PaymentStatus.APPROVED, CASH_DUE);
        when(portOneV2PaymentVerifyService.isCancelledOrPartialCancelled(anyString(), anyString())).thenAnswer(inv -> {
            recordBoundary("isCancelledOrPartialCancelled");
            return false;
        });

        TenantContextHolder.setTenantId(tenantId);
        Throwable thrown = catchThrowable(() -> reconcileService.reconcileRefund(tenantId, orderPublicId, true));

        assertThat(thrown).isInstanceOf(IllegalStateException.class).hasMessageContaining(paymentId);
        assertThat(loadPayment(paymentId).getStatus()).isEqualTo(Payment.PaymentStatus.APPROVED);
        assertThat(loadPayment(paymentId).getCancelledAt()).isNull();
        assertPortOneCallsOutsideTransaction("isCancelledOrPartialCancelled");
    }

    @Test
    @DisplayName("7. 늦은 결제 자동 환불 서비스 직접 진입 → PG 취소가 트랜잭션·동기화·커넥션 밖")
    void lateRefundService_cancelOutsideTransactionAndConnection() {
        String paymentId = seedOrderWithPayment(ShopClientOrderStatus.EXPIRED, Payment.PaymentStatus.EXPIRED, CASH_DUE);

        ShopLatePaymentOutcome outcome = shopLatePaymentRefundService.refundIfOrderClosed(tenantId, paymentId);

        assertThat(outcome).isEqualTo(ShopLatePaymentOutcome.REFUNDED);
        assertPortOneCallsOutsideTransaction("cancelPayment");
    }

    @Test
    @DisplayName("8. H9b 재현: 주문 CREATED + 결제 CANCELLED 에 PAID 웹훅 → 500 아님, 200 자동 환불·알림 1회, 재전송·취소 이벤트 멱등")
    void h9b_openOrderCancelledPayment_paidWebhook_refundedAndNotifiedOnce() throws Exception {
        String paymentId = seedOrderWithPayment(
                ShopClientOrderStatus.CREATED, Payment.PaymentStatus.CANCELLED, CASH_DUE);

        postWebhook(webhookBody(EVENT_PAID, paymentId), "whk-h9b-cancelled")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(ShopLatePaymentConstants.WEBHOOK_STATUS_LATE_PAYMENT_REFUNDED))
                .andExpect(jsonPath("$.deduplicated").value(false));
        ResponseEntity<Map<String, Object>> resent = sendWebhook(webhookBody(EVENT_PAID, paymentId), "whk-h9b-resend");
        ResponseEntity<Map<String, Object>> pgCancelled =
                sendWebhook(webhookBody(EVENT_CANCELLED, paymentId), "whk-h9b-pg-cancelled");

        assertThat(resent.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resent.getBody()).containsEntry("deduplicated", Boolean.TRUE);
        assertThat(pgCancelled.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertH9bRefundedOnce(paymentId, ShopClientOrderStatus.CREATED, CASH_DUE);
    }

    @Test
    @DisplayName("9. H9b 재현: 주문 PENDING_PAYMENT + 결제 EXPIRED·금액 불일치에 PAID 웹훅 → 200 자동 환불·알림 1회, 주문 복구·승인 없음")
    void h9b_openOrderExpiredPaymentAmountMismatch_paidWebhook_refundedOnce() throws Exception {
        String paymentId = seedOrderWithPayment(
                ShopClientOrderStatus.PENDING_PAYMENT, Payment.PaymentStatus.EXPIRED, MISMATCHED_AMOUNT);

        ResponseEntity<Map<String, Object>> first = sendWebhook(webhookBody(EVENT_PAID, paymentId), "whk-h9b-mismatch");
        ResponseEntity<Map<String, Object>> resent =
                sendWebhook(webhookBody(EVENT_PAID, paymentId), "whk-h9b-mismatch-resend");

        assertThat(first.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(first.getBody()).containsEntry("status",
                ShopLatePaymentConstants.WEBHOOK_STATUS_LATE_PAYMENT_REFUNDED);
        assertThat(resent.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resent.getBody()).containsEntry("deduplicated", Boolean.TRUE);
        assertH9bRefundedOnce(paymentId, ShopClientOrderStatus.PENDING_PAYMENT, MISMATCHED_AMOUNT);
    }

    @Test
    @DisplayName("10. H9b + PG 취소 실패 → REFUND_REQUIRED·관리자 알림, 5xx 로 재시도 받음(내담자 알림 없음)")
    void h9b_pgCancelFails_refundRequiredAndRetried() throws Exception {
        String paymentId = seedOrderWithPayment(
                ShopClientOrderStatus.CREATED, Payment.PaymentStatus.CANCELLED, CASH_DUE);
        when(portOneV2PaymentCancelService.cancelPayment(anyString(), anyString(), anyString())).thenAnswer(inv -> {
            recordBoundary("cancelPayment");
            return false;
        });

        ResponseEntity<Map<String, Object>> response =
                sendWebhook(webhookBody(EVENT_PAID, paymentId), "whk-h9b-cancel-fail");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).containsEntry("message", ShopLatePaymentConstants.WEBHOOK_MESSAGE_REFUND_REQUIRED);
        Payment payment = loadPayment(paymentId);
        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.REFUND_REQUIRED);
        assertThat(payment.getFailureReason())
                .isEqualTo(ShopLatePaymentConstants.FAILURE_REASON_UNAPPROVABLE_PAYMENT_ON_OPEN_ORDER);
        assertThat(loadOrder().getStatus()).isEqualTo(ShopClientOrderStatus.CREATED);
        verify(schedulerFailureNotifier, times(1)).notifyFailure(
                eq(ShopLatePaymentConstants.ADMIN_ALERT_SOURCE),
                eq(ShopLatePaymentConstants.ADMIN_ALERT_STEP_REFUND_REQUIRED), eq(tenantId), any());
        verify(shopNotificationHelper, never()).notifyUnapprovablePaymentAutoCancelled(any(), any(), anyLong());
        assertPortOneCallsOutsideTransaction("cancelPayment");
    }

    @Test
    @DisplayName("11. H9b 정합(reconcilePayment) 주문 CREATED + 결제 CANCELLED → 예외 대신 자동 환불, 주문 열린 채")
    void h9b_reconcilePayment_openOrderCancelledPayment_autoRefunded() {
        String paymentId = seedOrderWithPayment(
                ShopClientOrderStatus.CREATED, Payment.PaymentStatus.CANCELLED, CASH_DUE);

        TenantContextHolder.setTenantId(tenantId);
        ShopOrderReconcilePaymentResponse response =
                reconcileService.reconcilePayment(tenantId, orderPublicId, paymentId, null);

        assertThat(response.getOrderStatus()).isEqualTo(ShopClientOrderStatus.CREATED);
        assertThat(response.getPaymentStatus()).isEqualTo(Payment.PaymentStatus.REFUNDED);
        assertH9bRefundedOnce(paymentId, ShopClientOrderStatus.CREATED, CASH_DUE);
        assertPortOneCallsOutsideTransaction("verifyPaidAmountBody", "cancelPayment");
    }

    @Test
    @DisplayName("12. H9 유지: 주문 PENDING_PAYMENT + 결제 EXPIRED·금액 일치에 PAID → 승인, PG 취소·H9b 알림 없음")
    void h9_openOrderExpiredPaymentAmountMatch_stillApproved() throws Exception {
        String paymentId = seedOrderWithPayment(
                ShopClientOrderStatus.PENDING_PAYMENT, Payment.PaymentStatus.EXPIRED, CASH_DUE);

        ResponseEntity<Map<String, Object>> response = sendWebhook(webhookBody(EVENT_PAID, paymentId), "whk-h9-match");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loadPayment(paymentId).getStatus()).isEqualTo(Payment.PaymentStatus.APPROVED);
        assertThat(loadOrder().getStatus()).isEqualTo(ShopClientOrderStatus.PAID);
        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any());
        verify(shopNotificationHelper, never()).notifyUnapprovablePaymentAutoCancelled(any(), any(), anyLong());
    }

    private void assertH9bRefundedOnce(String paymentId, ShopClientOrderStatus expectedOrderStatus, long amount) {
        Payment payment = loadPayment(paymentId);
        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.REFUNDED);
        assertThat(payment.getFailureReason())
                .isEqualTo(ShopLatePaymentConstants.FAILURE_REASON_UNAPPROVABLE_PAYMENT_ON_OPEN_ORDER);
        assertThat(loadOrder().getStatus()).isEqualTo(expectedOrderStatus);
        verify(portOneV2PaymentCancelService, times(1)).cancelPayment(eq(tenantId), eq(paymentId),
                eq(ShopLatePaymentConstants.PORTONE_CANCEL_REASON_UNAPPROVABLE));
        verify(shopNotificationHelper, times(1)).notifyUnapprovablePaymentAutoCancelled(
                eq(tenantId), any(ShopClientOrder.class), eq(amount));
        verify(shopNotificationHelper, never()).notifyLatePaymentAutoCancelled(any(), any());
        verify(shopNotificationHelper, never()).notifyOrderPaid(any(), any());
        verify(schedulerFailureNotifier, times(1)).notifyFailure(
                eq(ShopLatePaymentConstants.ADMIN_ALERT_SOURCE),
                eq(ShopLatePaymentConstants.ADMIN_ALERT_STEP_REFUNDED), eq(tenantId), any());
        assertThat(boundaries).extracting(PortOneCallBoundary::call).contains("cancelPayment");
        assertPortOneCallsOutsideTransaction();
    }

    private void recordBoundary(String call) {
        boundaries.add(new PortOneCallBoundary(
                call,
                TransactionSynchronizationManager.isActualTransactionActive(),
                TransactionSynchronizationManager.isSynchronizationActive(),
                TransactionSynchronizationManager.hasResource(entityManagerFactory),
                activeConnections()));
    }

    private void assertPortOneCallsOutsideTransaction(String... expectedCalls) {
        assertThat(boundaries).isNotEmpty();
        if (expectedCalls.length > 0) {
            assertThat(boundaries).extracting(PortOneCallBoundary::call).contains(expectedCalls);
        }
        assertThat(boundaries).allSatisfy(boundary -> {
            assertThat(boundary.actualTransaction()).as(boundary.call() + " actualTransaction").isFalse();
            assertThat(boundary.synchronization()).as(boundary.call() + " synchronization").isFalse();
            assertThat(boundary.entityManagerBound()).as(boundary.call() + " entityManagerBound").isFalse();
            assertThat(boundary.activeConnections()).as(boundary.call() + " activeConnections").isZero();
        });
    }

    private int activeConnections() {
        try {
            return dataSource.unwrap(HikariDataSource.class).getHikariPoolMXBean().getActiveConnections();
        } catch (SQLException e) {
            throw new IllegalStateException(e);
        }
    }

    private String seedOrderWithPayment(
            ShopClientOrderStatus orderStatus, Payment.PaymentStatus paymentStatus, long paymentAmount) {
        String paymentId = "pay-it-otx-" + UUID.randomUUID();
        TenantContextHolder.setTenantId(tenantId);
        try {
            new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                ShopClientOrder order = ShopClientOrder.builder()
                        .publicId(orderPublicId)
                        .clientId(CLIENT_ID)
                        .status(orderStatus)
                        .subtotalMinor(CASH_DUE)
                        .cashDueMinor(CASH_DUE)
                        .checkoutIdempotencyKey("idem-" + orderPublicId)
                        .build();
                order.setTenantId(tenantId);
                orderRepository.save(order);
                Payment payment = Payment.builder()
                        .paymentId(paymentId)
                        .orderId(orderPublicId)
                        .amount(BigDecimal.valueOf(paymentAmount))
                        .status(paymentStatus)
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
        return paymentId;
    }

    private Payment loadPayment(String paymentId) {
        return paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId).orElseThrow();
    }

    private ShopClientOrder loadOrder() {
        return orderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId).orElseThrow();
    }

    private ResultActions postWebhook(String body, String webhookId)
            throws Exception {
        return mockMvc.perform(post(WEBHOOK_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .header("webhook-timestamp", TIMESTAMP)
                .header("webhook-signature", sign(body))
                .header("webhook-id", webhookId)
                .content(body.getBytes(StandardCharsets.UTF_8)));
    }

    private ResponseEntity<Map<String, Object>> sendWebhook(String body, String webhookId) throws Exception {
        return webhookService.handleWebhook(body.getBytes(StandardCharsets.UTF_8), TIMESTAMP, sign(body), webhookId);
    }

    private static String webhookBody(String eventType, String paymentId) {
        return "{\"type\":\"" + eventType + "\",\"data\":{\"storeId\":\"" + STORE_ID
                + "\",\"paymentId\":\"" + paymentId + "\"}}";
    }

    private static String sign(String body) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(WEBHOOK_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] digest = mac.doFinal((TIMESTAMP + "." + body).getBytes(StandardCharsets.UTF_8));
        return "v1," + Base64.getEncoder().encodeToString(digest);
    }

    private record PortOneCallBoundary(
            String call,
            boolean actualTransaction,
            boolean synchronization,
            boolean entityManagerBound,
            int activeConnections) {
    }
}
