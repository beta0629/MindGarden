package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopLatePaymentConstants;
import com.coresolution.consultation.dto.shop.admin.ShopOrderReconcilePaymentResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.AdminShopOrderReconcileService;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.portone.PortOnePaymentWebhookService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentCancelService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import com.coresolution.core.constants.TenantPgSettingsJsonKeys;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.monitoring.SchedulerFailureNotifier;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
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
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * #1319 후속 — 포트원 V2 웹훅·정합의 트랜잭션 경계·멱등을 실제 JPA(H2) 로 검증한다. PortOne API 는 목(실 PG 호출 없음).
 * <ul>
 *   <li>첫 수신 정상 PAID 웹훅 → 200 + APPROVED/PAID (영속성 컨텍스트 옛 엔티티 저장으로 인한 500 회귀 방지)</li>
 *   <li>동시 중복 PAID 웹훅 → 승인·주문 PAID 반영 1회</li>
 *   <li>이중 결제(한 주문 두 결제) → 정상 결제 1건만 승인, 추가 결제는 PG 자동 취소 1회</li>
 *   <li>PortOne 조회·취소 호출은 트랜잭션 밖</li>
 *   <li>정합(reconcile) 응답은 커밋된 최신 상태 · H5 · H9</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("#1319 후속 — 웹훅 트랜잭션 경계·멱등 (H2 통합)")
class ShopPaymentWebhookTxBoundaryIntegrationTest {

    private static final String STORE_ID = "store-it-tx-boundary";
    private static final String WEBHOOK_SECRET = "whsec_it_tx_boundary";
    private static final String TIMESTAMP = "1700000000";
    private static final String WEBHOOK_URL = "/api/v1/payments/webhooks/portone/v2";
    private static final String EVENT_PAID = "Transaction.Paid";
    private static final String EVENT_CANCELLED = "Transaction.Cancelled";
    private static final long CASH_DUE = 9_000L;
    private static final long CLIENT_ID = 7_070L;
    private static final long AWAIT_SECONDS = 20L;

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private PortOnePaymentWebhookService webhookService;
    @Autowired
    private AdminShopOrderReconcileService reconcileService;
    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private ShopClientOrderRepository orderRepository;
    @Autowired
    private PlatformTransactionManager transactionManager;

    @MockBean
    private TenantPgConfigurationRepository tenantPgConfigurationRepository;
    @MockBean
    private PortOneV2PaymentCancelService portOneV2PaymentCancelService;
    @MockBean
    private PortOneV2PaymentVerifyService portOneV2PaymentVerifyService;
    @MockBean
    private ShopNotificationHelper shopNotificationHelper;
    @MockBean
    private SchedulerFailureNotifier schedulerFailureNotifier;

    private String tenantId;
    private String orderPublicId;
    private final List<Boolean> portOneCallInTransaction = new CopyOnWriteArrayList<>();

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID().toString();
        orderPublicId = UUID.randomUUID().toString();
        portOneCallInTransaction.clear();
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
            portOneCallInTransaction.add(TransactionSynchronizationManager.isActualTransactionActive());
            return true;
        });
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("1. 첫 수신 정상 PAID 웹훅 → 200, 결제 APPROVED·주문 PAID·웹훅 원문 기록")
    void firstReceipt_paidWebhook_returns200AndApproves() throws Exception {
        String paymentId = seedOrderWithPayment(ShopClientOrderStatus.PENDING_PAYMENT, Payment.PaymentStatus.PENDING);
        String body = webhookBody(EVENT_PAID, paymentId);

        mockMvc.perform(post(WEBHOOK_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("webhook-timestamp", TIMESTAMP)
                        .header("webhook-signature", sign(body))
                        .header("webhook-id", "whk-first-receipt")
                        .content(body.getBytes(StandardCharsets.UTF_8)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.paymentId").value(paymentId));

        Payment payment = loadPayment(paymentId);
        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.APPROVED);
        assertThat(payment.getWebhookData()).isEqualTo(body);
        assertThat(loadOrder().getStatus()).isEqualTo(ShopClientOrderStatus.PAID);
        verify(shopNotificationHelper, times(1)).notifyOrderPaid(eq(tenantId), any());
    }

    @Test
    @DisplayName("2. 동시 중복 PAID 웹훅(두 스레드, 같은 페이로드) → 둘 다 200, 승인·주문 PAID·포인트/알림 반영 1회")
    void concurrentDuplicatePaidWebhooks_appliedOnce() throws Exception {
        String paymentId = seedOrderWithPayment(ShopClientOrderStatus.PENDING_PAYMENT, Payment.PaymentStatus.PENDING);
        String body = webhookBody(EVENT_PAID, paymentId);
        CountDownLatch start = new CountDownLatch(1);

        List<ResponseEntity<Map<String, Object>>> responses = runConcurrently(2, () -> {
            start.await(AWAIT_SECONDS, TimeUnit.SECONDS);
            return sendWebhook(body, "whk-dup-" + UUID.randomUUID());
        }, start);

        assertThat(responses).allSatisfy(r -> assertThat(r.getStatusCode()).isEqualTo(HttpStatus.OK));
        assertThat(loadPayment(paymentId).getStatus()).isEqualTo(Payment.PaymentStatus.APPROVED);
        assertThat(loadOrder().getStatus()).isEqualTo(ShopClientOrderStatus.PAID);
        verify(shopNotificationHelper, times(1)).notifyOrderPaid(eq(tenantId), any());
        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any());
    }

    @Test
    @DisplayName("3. 이중 결제(한 주문 두 결제 PAID) → 첫 결제만 승인, 두 번째는 PG 자동 취소 1회 — 재전송·취소 이벤트도 주문 PAID 유지")
    void doublePayment_secondPaid_refundedOnce_orderStaysPaid() throws Exception {
        String first = seedOrderWithPayment(ShopClientOrderStatus.PENDING_PAYMENT, Payment.PaymentStatus.PENDING);
        String second = seedPayment(Payment.PaymentStatus.PENDING);

        assertThat(sendWebhook(webhookBody(EVENT_PAID, first), "whk-first").getStatusCode()).isEqualTo(HttpStatus.OK);
        ResponseEntity<Map<String, Object>> duplicate = sendWebhook(webhookBody(EVENT_PAID, second), "whk-second");
        ResponseEntity<Map<String, Object>> resent = sendWebhook(webhookBody(EVENT_PAID, second), "whk-second-resend");
        ResponseEntity<Map<String, Object>> pgCancelled =
                sendWebhook(webhookBody(EVENT_CANCELLED, second), "whk-second-cancelled");

        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(duplicate.getBody()).containsEntry("status",
                ShopLatePaymentConstants.WEBHOOK_STATUS_LATE_PAYMENT_REFUNDED);
        assertThat(resent.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resent.getBody()).containsEntry("deduplicated", Boolean.TRUE);
        assertThat(pgCancelled.getStatusCode()).isEqualTo(HttpStatus.OK);

        assertThat(loadPayment(first).getStatus()).isEqualTo(Payment.PaymentStatus.APPROVED);
        Payment refunded = loadPayment(second);
        assertThat(refunded.getStatus()).isEqualTo(Payment.PaymentStatus.REFUNDED);
        assertThat(refunded.getFailureReason())
                .isEqualTo(ShopLatePaymentConstants.FAILURE_REASON_DUPLICATE_PAYMENT_ON_PAID_ORDER);
        assertThat(loadOrder().getStatus()).isEqualTo(ShopClientOrderStatus.PAID);
        verify(portOneV2PaymentCancelService, times(1)).cancelPayment(eq(tenantId), eq(second),
                eq(ShopLatePaymentConstants.PORTONE_CANCEL_REASON_DUPLICATE));
        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), eq(first), any());
        verify(shopNotificationHelper, times(1)).notifyOrderPaid(eq(tenantId), any());
        assertThat(portOneCallInTransaction).containsOnly(Boolean.FALSE);
    }

    @Test
    @DisplayName("4. 이중 결제 PAID 가 동시에 두 번 → PG 취소 1회만(선점 중 수신은 409 재시도), 최종 REFUNDED")
    void doublePayment_concurrentDuplicateWebhooks_cancelCalledOnce() throws Exception {
        String first = seedOrderWithPayment(ShopClientOrderStatus.PENDING_PAYMENT, Payment.PaymentStatus.PENDING);
        String second = seedPayment(Payment.PaymentStatus.PENDING);
        assertThat(sendWebhook(webhookBody(EVENT_PAID, first), "whk-a").getStatusCode()).isEqualTo(HttpStatus.OK);

        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        doAnswer(inv -> {
            portOneCallInTransaction.add(TransactionSynchronizationManager.isActualTransactionActive());
            entered.countDown();
            release.await(AWAIT_SECONDS, TimeUnit.SECONDS);
            return true;
        }).when(portOneV2PaymentCancelService).cancelPayment(anyString(), anyString(), anyString());
        String body = webhookBody(EVENT_PAID, second);
        ExecutorService executor = Executors.newSingleThreadExecutor();
        try {
            Future<ResponseEntity<Map<String, Object>>> holder =
                    executor.submit(() -> sendWebhook(body, "whk-b-1"));
            assertThat(entered.await(AWAIT_SECONDS, TimeUnit.SECONDS)).isTrue();

            // 첫 요청이 PortOne 취소 호출 중(트랜잭션·DB 잠금 없음) — 두 번째 동시 수신은 막히지 않고 즉시 응답
            ResponseEntity<Map<String, Object>> concurrent = sendWebhook(body, "whk-b-2");
            release.countDown();
            ResponseEntity<Map<String, Object>> winner = holder.get(AWAIT_SECONDS, TimeUnit.SECONDS);

            assertThat(concurrent.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
            assertThat(concurrent.getBody()).containsEntry("message",
                    ShopLatePaymentConstants.WEBHOOK_MESSAGE_REFUND_IN_PROGRESS);
            assertThat(winner.getStatusCode()).isEqualTo(HttpStatus.OK);
        } finally {
            release.countDown();
            executor.shutdownNow();
        }

        ResponseEntity<Map<String, Object>> retried = sendWebhook(body, "whk-b-retry");
        assertThat(retried.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loadPayment(second).getStatus()).isEqualTo(Payment.PaymentStatus.REFUNDED);
        assertThat(loadPayment(first).getStatus()).isEqualTo(Payment.PaymentStatus.APPROVED);
        assertThat(loadOrder().getStatus()).isEqualTo(ShopClientOrderStatus.PAID);
        verify(portOneV2PaymentCancelService, times(1)).cancelPayment(any(), eq(second), any());
        assertThat(portOneCallInTransaction).containsExactly(Boolean.FALSE);
    }

    @Test
    @DisplayName("5. H9 닫힘: 주문 EXPIRED + 결제 EXPIRED 에 PAID → 승인 없이 PG 자동 취소(트랜잭션 밖), 주문 복구 없음")
    void h9_expiredOrder_latePaid_autoRefundedOutsideTransaction() throws Exception {
        String paymentId = seedOrderWithPayment(ShopClientOrderStatus.EXPIRED, Payment.PaymentStatus.EXPIRED);

        ResponseEntity<Map<String, Object>> response = sendWebhook(webhookBody(EVENT_PAID, paymentId), "whk-h9-closed");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loadPayment(paymentId).getStatus()).isEqualTo(Payment.PaymentStatus.REFUNDED);
        assertThat(loadPayment(paymentId).getFailureReason())
                .isEqualTo(ShopLatePaymentConstants.FAILURE_REASON_LATE_PAYMENT_ON_CLOSED_ORDER);
        assertThat(loadOrder().getStatus()).isEqualTo(ShopClientOrderStatus.EXPIRED);
        verify(portOneV2PaymentCancelService, times(1)).cancelPayment(eq(tenantId), eq(paymentId),
                eq(ShopLatePaymentConstants.PORTONE_CANCEL_REASON));
        assertThat(portOneCallInTransaction).containsExactly(Boolean.FALSE);
    }

    @Test
    @DisplayName("6. H9 열림: 주문 PENDING_PAYMENT + 결제 행만 EXPIRED 에 PAID(금액 일치) → 승인, PG 취소 없음")
    void h9_openOrderExpiredPaymentRow_approved() throws Exception {
        String paymentId = seedOrderWithPayment(ShopClientOrderStatus.PENDING_PAYMENT, Payment.PaymentStatus.EXPIRED);

        ResponseEntity<Map<String, Object>> response = sendWebhook(webhookBody(EVENT_PAID, paymentId), "whk-h9-open");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loadPayment(paymentId).getStatus()).isEqualTo(Payment.PaymentStatus.APPROVED);
        assertThat(loadOrder().getStatus()).isEqualTo(ShopClientOrderStatus.PAID);
        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any());
    }

    @Test
    @DisplayName("7. reconcile 은 승인 후 커밋된 최신 상태(PAID/APPROVED)를 반환, PortOne 검증은 트랜잭션 밖")
    void reconcilePayment_returnsLatestStateAfterApproval() {
        String paymentId = seedOrderWithPayment(ShopClientOrderStatus.PENDING_PAYMENT, Payment.PaymentStatus.PENDING);
        when(portOneV2PaymentVerifyService.verifyPaidAmountBody(eq(tenantId), eq(paymentId), any()))
                .thenAnswer(inv -> {
                    portOneCallInTransaction.add(TransactionSynchronizationManager.isActualTransactionActive());
                    return Optional.of("{}");
                });

        TenantContextHolder.setTenantId(tenantId);
        ShopOrderReconcilePaymentResponse response =
                reconcileService.reconcilePayment(tenantId, orderPublicId, paymentId, null);

        assertThat(response.getOrderStatus()).isEqualTo(ShopClientOrderStatus.PAID);
        assertThat(response.getPaymentStatus()).isEqualTo(Payment.PaymentStatus.APPROVED);
        assertThat(loadOrder().getStatus()).isEqualTo(ShopClientOrderStatus.PAID);
        assertThat(portOneCallInTransaction).isNotEmpty().containsOnly(Boolean.FALSE);
    }

    @Test
    @DisplayName("8. H5 reconcile: 검증 뒤 사용자 취소가 먼저 커밋 → 최신 상태로 닫힘 판정, 주문 복구 없이 자동 환불(최신 값 응답)")
    void h5_reconcile_userCancelCommittedAfterVerify_autoRefunded() {
        String paymentId = seedOrderWithPayment(ShopClientOrderStatus.PENDING_PAYMENT, Payment.PaymentStatus.PENDING);
        AtomicBoolean cancelledByUser = new AtomicBoolean(false);
        when(portOneV2PaymentVerifyService.verifyPaidAmountBody(eq(tenantId), eq(paymentId), any()))
                .thenAnswer(inv -> {
                    portOneCallInTransaction.add(TransactionSynchronizationManager.isActualTransactionActive());
                    if (cancelledByUser.compareAndSet(false, true)) {
                        commitUserCancel(paymentId);
                    }
                    return Optional.of("{}");
                });

        TenantContextHolder.setTenantId(tenantId);
        ShopOrderReconcilePaymentResponse response =
                reconcileService.reconcilePayment(tenantId, orderPublicId, paymentId, null);

        assertThat(response.getOrderStatus()).isEqualTo(ShopClientOrderStatus.CANCELLED);
        assertThat(response.getPaymentStatus()).isEqualTo(Payment.PaymentStatus.REFUNDED);
        assertThat(loadOrder().getStatus()).isEqualTo(ShopClientOrderStatus.CANCELLED);
        assertThat(loadPayment(paymentId).getStatus()).isEqualTo(Payment.PaymentStatus.REFUNDED);
        verify(portOneV2PaymentCancelService, times(1)).cancelPayment(eq(tenantId), eq(paymentId), any());
        assertThat(portOneCallInTransaction).isNotEmpty().containsOnly(Boolean.FALSE);
    }

    private void commitUserCancel(String paymentId) {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            ShopClientOrder order = orderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId).orElseThrow();
            order.setStatus(ShopClientOrderStatus.CANCELLED);
            orderRepository.save(order);
            Payment payment = paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId)
                    .orElseThrow();
            payment.setStatus(Payment.PaymentStatus.CANCELLED);
            paymentRepository.save(payment);
        });
    }

    private String seedOrderWithPayment(ShopClientOrderStatus orderStatus, Payment.PaymentStatus paymentStatus) {
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
            });
        } finally {
            TenantContextHolder.clear();
        }
        return seedPayment(paymentStatus);
    }

    private String seedPayment(Payment.PaymentStatus paymentStatus) {
        String paymentId = "pay-it-" + UUID.randomUUID();
        TenantContextHolder.setTenantId(tenantId);
        try {
            new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                Payment payment = Payment.builder()
                        .paymentId(paymentId)
                        .orderId(orderPublicId)
                        .amount(BigDecimal.valueOf(CASH_DUE))
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

    private ResponseEntity<Map<String, Object>> sendWebhook(String body, String webhookId) throws Exception {
        return webhookService.handleWebhook(body.getBytes(StandardCharsets.UTF_8), TIMESTAMP, sign(body), webhookId);
    }

    private static List<ResponseEntity<Map<String, Object>>> runConcurrently(
            int threads, Callable<ResponseEntity<Map<String, Object>>> task, CountDownLatch start) throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        try {
            List<Future<ResponseEntity<Map<String, Object>>>> futures = new ArrayList<>();
            for (int i = 0; i < threads; i++) {
                futures.add(executor.submit(task));
            }
            start.countDown();
            List<ResponseEntity<Map<String, Object>>> results = new ArrayList<>();
            for (Future<ResponseEntity<Map<String, Object>>> future : futures) {
                results.add(future.get(AWAIT_SECONDS, TimeUnit.SECONDS));
            }
            return results;
        } finally {
            executor.shutdownNow();
        }
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
}
