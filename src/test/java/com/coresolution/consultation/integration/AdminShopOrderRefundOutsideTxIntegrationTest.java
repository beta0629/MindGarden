package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import javax.sql.DataSource;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopRefundConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.shop.admin.ShopOrderRefundResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.exception.RefundLedgerNotRecordedException;
import com.coresolution.consultation.exception.SalaryTaxRateNotConfiguredException;
import com.coresolution.consultation.exception.ShopRefundInProgressException;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AdminShopOrderRefundService;
import com.coresolution.consultation.service.SalaryTaxRateLookupService;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.ShopOrderFulfillmentService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentCancelService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantComponentActivationService;
import com.coresolution.integrationtest.support.WithMockAdminSecurityContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 쇼핑 주문 전액 환불 — PortOne 취소·환불 알림이 DB 트랜잭션·커넥션 밖에서 호출되는지, PG 실패·반영 실패 뒤
 * 재시도해도 PG 를 두 번 취소하지 않는지 H2 실제 트랜잭션으로 검증한다. PortOne 은 목(실 PG 호출 없음).
 * 검증 대상: {@link com.coresolution.consultation.service.impl.AdminShopOrderRefundServiceImpl}.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockAdminSecurityContext
@DisplayName("쇼핑 전액 환불 — PortOne·알림은 트랜잭션·커넥션 밖, 실패 시 재시도 가능·이중 취소 없음 (H2 통합)")
class AdminShopOrderRefundOutsideTxIntegrationTest {

    private static final long CASH_DUE = 9_000L;
    private static final long CLIENT_ID = 7_272L;
    private static final String REASON = "CUSTOMER_REQUEST";
    private static final long LINKED_MAPPING_ID = 7_373L;

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private AdminShopOrderRefundService refundService;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private ShopClientOrderRepository orderRepository;
    @Autowired private ShopClientOrderLineRepository orderLineRepository;
    @Autowired private ShopCatalogSkuRepository skuRepository;
    @Autowired private FinancialTransactionRepository financialTransactionRepository;
    @Autowired private PlatformTransactionManager transactionManager;
    @Autowired private EntityManagerFactory entityManagerFactory;
    @Autowired private DataSource dataSource;

    @MockBean private PortOneV2PaymentCancelService portOneV2PaymentCancelService;
    @MockBean private PortOneV2PaymentVerifyService portOneV2PaymentVerifyService;
    @MockBean private ShopNotificationHelper shopNotificationHelper;
    @MockBean private TenantComponentActivationService tenantComponentActivationService;
    @SpyBean private ShopOrderFulfillmentService shopOrderFulfillmentService;
    @SpyBean private SalaryTaxRateLookupService salaryTaxRateLookupService;

    private final List<CallBoundary> boundaries = new CopyOnWriteArrayList<>();
    private String tenantId;
    private String orderPublicId;
    private String paymentId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID().toString();
        orderPublicId = UUID.randomUUID().toString();
        boundaries.clear();
        when(tenantComponentActivationService.isComponentActive(anyString(), anyString())).thenReturn(true);
        when(portOneV2PaymentVerifyService.isIamportPayment(any())).thenReturn(true);
        when(portOneV2PaymentVerifyService.isCancelledOrPartialCancelled(anyString(), anyString())).thenAnswer(inv -> {
            assertOutsideTransactionAtCall("isCancelledOrPartialCancelled");
            return true;
        });
        stubPgCancelledAmount(0L);
        stubCancel(true);
        doAnswer(inv -> {
            assertOutsideTransactionAtCall("notifyOrderRefunded");
            return null;
        }).when(shopNotificationHelper).notifyOrderRefunded(anyString(), any());
        paymentId = seedPaidOrder(null);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("관리자 환불 API 정상 — 200 REFUNDED, PortOne 취소 1회·알림 1회, 모두 트랜잭션·동기화·EM·커넥션 0")
    void refundEndpoint_normal_portOneAndNotificationOutsideTransaction() throws Exception {
        postRefund()
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value(ShopClientOrderStatus.REFUNDED.name()));

        assertThat(loadOrder().getStatus()).isEqualTo(ShopClientOrderStatus.REFUNDED);
        assertThat(loadOrder().getRefundPgLeaseUntil()).isNull();
        Payment payment = loadPayment();
        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.REFUNDED);
        assertThat(payment.getCancelledAt()).isNotNull();
        verify(portOneV2PaymentCancelService, times(1)).cancelPayment(eq(tenantId), eq(paymentId), anyString(), any());
        verify(shopNotificationHelper, times(1)).notifyOrderRefunded(eq(tenantId), any());
        assertBoundariesOutsideTransaction("fetchCancelledAmount", "cancelPayment",
                "isCancelledOrPartialCancelled", "notifyOrderRefunded");
    }

    @Test
    @DisplayName("PortOne 취소 실패 — 주문 PAID·결제 APPROVED·cancelledAt 없음·환불 전표 0, lease 해제·시도 기록(재시도 가능), 알림 없음")
    void portOneFailure_noClinicRefund_stateRetriable() {
        stubCancel(false);

        Throwable thrown = catchThrowable(this::refundDirect);

        assertThat(thrown).isInstanceOf(IllegalStateException.class);
        assertUnrefundedRetriable(true);
        verify(shopNotificationHelper, never()).notifyOrderRefunded(any(), any());
        assertBoundariesOutsideTransaction("cancelPayment");

        stubCancel(true);
        ShopOrderRefundResponse retried = refundDirect();
        assertThat(retried.getStatus()).isEqualTo(ShopClientOrderStatus.REFUNDED);
        ArgumentCaptor<String> idempotencyKeys = ArgumentCaptor.forClass(String.class);
        verify(portOneV2PaymentCancelService, times(2))
                .cancelPayment(eq(tenantId), eq(paymentId), anyString(), idempotencyKeys.capture());
        assertThat(idempotencyKeys.getAllValues())
                .as("같은 PG 상태의 재시도는 같은 PortOne 멱등 키")
                .containsOnly(String.format(ShopRefundConstants.PORTONE_CANCEL_IDEMPOTENCY_KEY_FMT,
                        paymentId, 0L, CASH_DUE));
        verify(shopNotificationHelper, times(1)).notifyOrderRefunded(eq(tenantId), any());
    }

    @Test
    @DisplayName("PortOne 응답 유실(예외) 뒤 실제로는 취소됨 — 재시도는 누적 취소액으로 판단해 PG 재호출 없이 반영(이중 취소 없음)")
    void portOneTimeoutButCancelled_retryDoesNotCancelTwice() {
        when(portOneV2PaymentCancelService.cancelPayment(anyString(), anyString(), anyString(), any())).thenAnswer(inv -> {
            assertOutsideTransactionAtCall("cancelPayment");
            throw new IllegalStateException("simulated PortOne timeout");
        });

        assertThat(catchThrowable(this::refundDirect)).isInstanceOf(IllegalStateException.class);
        assertUnrefundedRetriable(true);

        stubPgCancelledAmount(CASH_DUE);
        ShopOrderRefundResponse retried = refundDirect();

        assertThat(retried.getStatus()).isEqualTo(ShopClientOrderStatus.REFUNDED);
        assertThat(loadPayment().getStatus()).isEqualTo(Payment.PaymentStatus.REFUNDED);
        verify(portOneV2PaymentCancelService, times(1)).cancelPayment(anyString(), anyString(), anyString(), any());
        verify(portOneV2PaymentCancelService, never()).cancelPaymentAmount(anyString(), anyString(), anyString(), any(), any());
        verify(shopNotificationHelper, times(1)).notifyOrderRefunded(eq(tenantId), any());
        assertBoundariesOutsideTransaction();
    }

    @Test
    @DisplayName("PortOne 취소 성공 뒤 Clinic 반영 실패 — 롤백(PAID·APPROVED·전표 0), 재시도는 PG 재호출 없이 반영 1회")
    void clinicFinalizeFails_retryFinalizesWithoutSecondCancel() {
        doThrow(new IllegalStateException("simulated finalize failure"))
                .doCallRealMethod()
                .when(shopOrderFulfillmentService).reversePaidOrderFulfillment(anyString(), any());

        Throwable thrown = catchThrowable(this::refundDirect);

        assertThat(thrown).isInstanceOf(IllegalStateException.class);
        assertUnrefundedRetriable(true);
        verify(shopNotificationHelper, never()).notifyOrderRefunded(any(), any());

        stubPgCancelledAmount(CASH_DUE);
        ShopOrderRefundResponse retried = refundDirect();
        ShopOrderRefundResponse again = refundDirect();

        assertThat(retried.getStatus()).isEqualTo(ShopClientOrderStatus.REFUNDED);
        assertThat(again.getStatus()).isEqualTo(ShopClientOrderStatus.REFUNDED);
        assertThat(loadPayment().getStatus()).isEqualTo(Payment.PaymentStatus.REFUNDED);
        verify(portOneV2PaymentCancelService, times(1)).cancelPayment(anyString(), anyString(), anyString(), any());
        verify(portOneV2PaymentCancelService, never()).cancelPaymentAmount(anyString(), anyString(), anyString(), any(), any());
        verify(shopNotificationHelper, times(1)).notifyOrderRefunded(eq(tenantId), any());
        assertBoundariesOutsideTransaction();
    }

    @Test
    @DisplayName("다른 요청이 환불 진행 중(lease 유효) — 409 SHOP_REFUND_IN_PROGRESS, PortOne 미호출·상태 그대로")
    void activeLease_conflictWithoutPortOne() throws Exception {
        orderPublicId = UUID.randomUUID().toString();
        paymentId = seedPaidOrder(LocalDateTime.now().plusMinutes(5));

        postRefund()
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value(ShopRefundConstants.ERROR_CODE_REFUND_IN_PROGRESS));

        assertThat(loadOrder().getStatus()).isEqualTo(ShopClientOrderStatus.PAID);
        assertThat(loadPayment().getStatus()).isEqualTo(Payment.PaymentStatus.APPROVED);
        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any(), any());
        verify(portOneV2PaymentCancelService, never()).cancelPaymentAmount(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("기관 VAT 세율 미설정 — 422 REFUND_LEDGER_NOT_RECORDED(세율 안내), PortOne 미호출, 주문·결제·lease·전표 그대로")
    void taxRateMissing_unprocessableWithoutPortOne() throws Exception {
        linkConsultationLine();
        doThrow(new SalaryTaxRateNotConfiguredException("SALARY_TAX_RATE", "VAT", null))
                .when(salaryTaxRateLookupService).getVatRate(anyString());

        postRefund()
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value(RefundLedgerNotRecordedException.ERROR_CODE))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("SALARY_TAX_RATE")));

        ShopClientOrder order = loadOrder();
        assertThat(order.getStatus()).isEqualTo(ShopClientOrderStatus.PAID);
        assertThat(order.getRefundPgLeaseUntil()).isNull();
        assertThat(order.getRefundPgAttemptedAt()).isNull();
        assertThat(loadPayment().getStatus()).isEqualTo(Payment.PaymentStatus.APPROVED);
        assertThat(loadPayment().getCancelledAt()).isNull();
        assertThat(refundExpenseRows()).isEmpty();
        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any(), any());
        verify(portOneV2PaymentCancelService, never()).cancelPaymentAmount(any(), any(), any(), any(), any());
        verify(shopNotificationHelper, never()).notifyOrderRefunded(any(), any());
    }

    @Test
    @DisplayName("DB 트랜잭션 안에서 호출 — 거부, PortOne 미호출·상태 그대로")
    void insideTransaction_rejectedBeforePortOne() {
        Throwable thrown = catchThrowable(() -> new TransactionTemplate(transactionManager)
                .executeWithoutResult(status -> refundDirect()));

        assertThat(thrown).isInstanceOf(IllegalStateException.class)
                .isNotInstanceOf(ShopRefundInProgressException.class);
        assertThat(loadOrder().getStatus()).isEqualTo(ShopClientOrderStatus.PAID);
        assertThat(loadOrder().getRefundPgAttemptedAt()).isNull();
        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any(), any());
    }

    private ShopOrderRefundResponse refundDirect() {
        TenantContextHolder.setTenantId(tenantId);
        try {
            return refundService.refundPaidOrder(tenantId, orderPublicId, REASON);
        } finally {
            TenantContextHolder.clear();
        }
    }

    private ResultActions postRefund() throws Exception {
        TenantContextHolder.setTenantId(tenantId);
        return mockMvc.perform(post("/api/v1/admin/shop/orders/{orderPublicId}/refund", orderPublicId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("reasonCode", REASON)))
                .sessionAttr(SessionConstants.USER_OBJECT, caller())
                .sessionAttr(SessionConstants.TENANT_ID, tenantId));
    }

    private void assertUnrefundedRetriable(boolean attempted) {
        ShopClientOrder order = loadOrder();
        assertThat(order.getStatus()).isEqualTo(ShopClientOrderStatus.PAID);
        assertThat(order.getRefundPgLeaseUntil()).as("lease released").isNull();
        if (attempted) {
            assertThat(order.getRefundPgAttemptedAt()).as("attempt kept for retry decision").isNotNull();
        }
        Payment payment = loadPayment();
        assertThat(payment.getStatus()).isEqualTo(Payment.PaymentStatus.APPROVED);
        assertThat(payment.getCancelledAt()).isNull();
        assertThat(refundExpenseRows()).isEmpty();
    }

    private List<FinancialTransaction> refundExpenseRows() {
        TenantContextHolder.setTenantId(tenantId);
        try {
            return financialTransactionRepository.findByTenantId(tenantId).stream()
                    .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
                    .toList();
        } finally {
            TenantContextHolder.clear();
        }
    }

    private void stubCancel(boolean result) {
        when(portOneV2PaymentCancelService.cancelPayment(anyString(), anyString(), anyString(), any())).thenAnswer(inv -> {
            assertOutsideTransactionAtCall("cancelPayment");
            return result;
        });
        when(portOneV2PaymentCancelService.cancelPaymentAmount(anyString(), anyString(), anyString(), any(), any()))
                .thenAnswer(inv -> {
                    assertOutsideTransactionAtCall("cancelPaymentAmount");
                    return result;
                });
    }

    private void stubPgCancelledAmount(long amount) {
        when(portOneV2PaymentCancelService.fetchCancelledAmount(anyString(), anyString())).thenAnswer(inv -> {
            assertOutsideTransactionAtCall("fetchCancelledAmount");
            return Optional.of(BigDecimal.valueOf(amount));
        });
    }

    /**
     * 외부 호출 시점의 트랜잭션·커넥션 상태를 기록하고 그 자리에서 단언한다. AssertionError 는 환불 코드의
     * RuntimeException 처리에 잡히지 않고 테스트까지 올라온다.
     */
    private void assertOutsideTransactionAtCall(String call) throws SQLException {
        boolean actualTransaction = TransactionSynchronizationManager.isActualTransactionActive();
        boolean synchronization = TransactionSynchronizationManager.isSynchronizationActive();
        Object entityManagerHolder = TransactionSynchronizationManager.getResource(entityManagerFactory);
        Object connectionHolder = TransactionSynchronizationManager.getResource(dataSource);
        int active = dataSource.unwrap(HikariDataSource.class).getHikariPoolMXBean().getActiveConnections();
        boundaries.add(new CallBoundary(call, actualTransaction, synchronization, entityManagerHolder != null, active));
        assertFalse(actualTransaction, call + " actualTransaction");
        assertFalse(synchronization, call + " synchronization");
        assertNull(entityManagerHolder, call + " EntityManager bound");
        assertNull(connectionHolder, call + " connection bound");
        assertEquals(0, active, call + " Hikari active connections");
    }

    private void assertBoundariesOutsideTransaction(String... expectedCalls) {
        assertThat(boundaries).isNotEmpty();
        if (expectedCalls.length > 0) {
            assertThat(boundaries).extracting(CallBoundary::call).contains(expectedCalls);
        }
        assertThat(boundaries).allSatisfy(b -> {
            assertThat(b.actualTransaction()).as(b.call() + " actualTransaction").isFalse();
            assertThat(b.synchronization()).as(b.call() + " synchronization").isFalse();
            assertThat(b.entityManagerBound()).as(b.call() + " entityManagerBound").isFalse();
            assertThat(b.activeConnections()).as(b.call() + " activeConnections").isZero();
        });
    }

    private String seedPaidOrder(LocalDateTime leaseUntil) {
        String newPaymentId = "pay-it-refund-otx-" + UUID.randomUUID();
        TenantContextHolder.setTenantId(tenantId);
        try {
            new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                ShopClientOrder order = ShopClientOrder.builder()
                        .publicId(orderPublicId)
                        .clientId(CLIENT_ID)
                        .status(ShopClientOrderStatus.PAID)
                        .subtotalMinor(CASH_DUE)
                        .cashDueMinor(CASH_DUE)
                        .checkoutIdempotencyKey("idem-" + orderPublicId)
                        .build();
                order.setTenantId(tenantId);
                order.setRefundPgLeaseUntil(leaseUntil);
                orderRepository.save(order);
                Payment payment = Payment.builder()
                        .paymentId(newPaymentId)
                        .orderId(orderPublicId)
                        .amount(BigDecimal.valueOf(CASH_DUE))
                        .status(Payment.PaymentStatus.APPROVED)
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

    /** 매칭에 연결된 상담 라인 — 환불 시 전표(EXPENSE)를 기록하는 주문으로 만든다. */
    private void linkConsultationLine() {
        TenantContextHolder.setTenantId(tenantId);
        try {
            new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                ShopCatalogSku sku = ShopCatalogSku.builder()
                        .skuCode("it-refund-otx-" + UUID.randomUUID().toString().substring(0, 8))
                        .title("it-refund-otx")
                        .unitPriceMinor(CASH_DUE)
                        .build();
                sku.setTenantId(tenantId);
                skuRepository.save(sku);
                ShopClientOrderLine line = ShopClientOrderLine.builder()
                        .clientOrder(loadOrder())
                        .lineNo(1)
                        .sku(sku)
                        .skuCodeSnapshot(sku.getSkuCode())
                        .titleSnapshot(sku.getTitle())
                        .unitPriceMinor(CASH_DUE)
                        .quantity(1)
                        .lineTotalMinor(CASH_DUE)
                        .consultantClientMappingId(LINKED_MAPPING_ID)
                        .build();
                line.setTenantId(tenantId);
                orderLineRepository.save(line);
            });
        } finally {
            TenantContextHolder.clear();
        }
    }

    private Payment loadPayment() {
        return paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(tenantId, paymentId).orElseThrow();
    }

    private ShopClientOrder loadOrder() {
        return orderRepository.findByTenantIdAndPublicId(tenantId, orderPublicId).orElseThrow();
    }

    private User caller() {
        User user = new User();
        user.setId(1L);
        user.setUserId("refund-otx-caller-admin");
        user.setRole(UserRole.ADMIN);
        user.setTenantId(tenantId);
        return user;
    }

    private record CallBoundary(String call, boolean actualTransaction, boolean synchronization,
            boolean entityManagerBound, int activeConnections) {
    }
}
