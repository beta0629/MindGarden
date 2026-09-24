package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.PaymentConstants;
import com.coresolution.consultation.dto.PaymentResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
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
import com.coresolution.consultation.service.ShopOrderFulfillmentService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
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

/**
 * 쇼핑 주문 PG APPROVED 경로 — rollback-only 은폐 방지·shop-safe 사이드이펙트 스킵.
 *
 * <p>과거 {@code syncShopOrderOnPaymentStatus} 가 RuntimeException 을 삼키면 동일 TX 가
 * rollback-only 로 남은 채 커밋되어 {@code UnexpectedRollbackException}(opaque 500) 이 발생했다.
 * 본 테스트는 예외 재전파와 ERP/매핑/적립 스킵을 계약으로 고정한다.
 *
 * @author MindGarden
 * @since 2026-09-17
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("PaymentServiceImpl — 쇼핑 주문 APPROVED shop-safe / rethrow")
class PaymentServiceImplShopOrderApproveTest {

    private static final String TENANT_ID = "tenant-shop-approve";
    private static final String PAYMENT_PUBLIC_ID = "PAY-SHOP-20260917-0001";
    private static final String ORDER_PUBLIC_ID = "ORD-SHOP-20260917-0001";
    private static final Long PAYMENT_ROW_ID = 8001L;
    private static final Long CLIENT_USER_ID = 5101L;

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
    @Mock private ShopOrderFulfillmentService shopOrderFulfillmentService;

    private PaymentServiceImpl service;

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
                shopOrderFulfillmentService);
        TenantContextHolder.setTenantId(TENANT_ID);
        lenient().when(commonCodeService.getCodeValue(anyString(), anyString())).thenReturn(null);
        lenient().when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(paymentRepository.findByTenantIdAndId(eq(TENANT_ID), eq(PAYMENT_ROW_ID)))
                .thenAnswer(inv -> Optional.of(buildShopProcessingPayment()));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("APPROVED 동기화 RuntimeException 재전파 — swallow 시 UnexpectedRollback 유발 계약 가드")
    void updatePaymentStatus_shopApproved_completeThrows_propagates() {
        Payment payment = buildShopProcessingPayment();
        stubShopPaymentLookup(payment);
        when(clientShopCheckoutService.completeOrderOnPaymentApproved(TENANT_ID, ORDER_PUBLIC_ID))
                .thenThrow(new RuntimeException("shop complete failed for UnexpectedRollback contract"));

        assertThatThrownBy(() -> service.updatePaymentStatus(PAYMENT_PUBLIC_ID, Payment.PaymentStatus.APPROVED))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("shop complete failed");

        verify(financialTransactionService, never()).createPaymentTransaction(any(), anyString(), anyString(), anyString());
        verify(adminService, never()).createMapping(any());
        verify(reserveFundService, never()).autoReserveFromIncome(any(), anyString());
        verify(statisticsService, never()).updateDailyStatistics(any(), anyString());
    }

    @Test
    @DisplayName("쇼핑 APPROVED — ERP createPaymentTransaction / 매핑 / reserveFund 미호출")
    void updatePaymentStatus_shopApproved_skipsErpMappingReserve() {
        Payment payment = buildShopProcessingPayment();
        stubShopPaymentLookup(payment);
        when(clientShopCheckoutService.completeOrderOnPaymentApproved(TENANT_ID, ORDER_PUBLIC_ID))
                .thenReturn(true);

        PaymentResponse response = service.updatePaymentStatus(PAYMENT_PUBLIC_ID, Payment.PaymentStatus.APPROVED);

        assertThat(response.getStatus()).isEqualTo(Payment.PaymentStatus.APPROVED.name());
        verify(clientShopCheckoutService).completeOrderOnPaymentApproved(TENANT_ID, ORDER_PUBLIC_ID);
        verify(financialTransactionService, never()).createPaymentTransaction(any(), anyString(), anyString(), anyString());
        verify(adminService, never()).createMapping(any());
        verify(reserveFundService, never()).autoReserveFromIncome(any(), anyString());
        verify(statisticsService, never()).updateDailyStatistics(any(), anyString());
        verify(consultationMessageService, never()).sendSystemThreadMessage(
                any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("approveShopOrderPayment — APPROVED + completeOrder 호출, ERP 사이드이펙트 없음")
    void approveShopOrderPayment_happyPath_skipsSideEffects() {
        Payment payment = buildShopProcessingPayment();
        stubShopPaymentLookup(payment);
        when(clientShopCheckoutService.completeOrderOnPaymentApproved(TENANT_ID, ORDER_PUBLIC_ID))
                .thenReturn(true);

        PaymentResponse response = service.approveShopOrderPayment(PAYMENT_PUBLIC_ID);

        assertThat(response.getStatus()).isEqualTo(Payment.PaymentStatus.APPROVED.name());
        verify(clientShopCheckoutService).completeOrderOnPaymentApproved(TENANT_ID, ORDER_PUBLIC_ID);
        verify(financialTransactionService, never()).createPaymentTransaction(any(), anyString(), anyString(), anyString());
        verify(adminService, never()).createMapping(any());
        verify(reserveFundService, never()).autoReserveFromIncome(any(), anyString());
    }

    @Test
    @DisplayName("approveShopOrderPayment — 비쇼핑 결제면 IllegalArgumentException")
    void approveShopOrderPayment_nonShop_throws() {
        Payment payment = buildShopProcessingPayment();
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_PUBLIC_ID))
                .thenReturn(Optional.of(payment));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(eq(TENANT_ID), eq(ORDER_PUBLIC_ID)))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.approveShopOrderPayment(PAYMENT_PUBLIC_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(PaymentConstants.ERROR_NOT_SHOP_ORDER_PAYMENT);

        verify(clientShopCheckoutService, never()).completeOrderOnPaymentApproved(any(), any());
    }

    @Test
    @DisplayName("approveShopOrderPayment — complete 실패 시 예외 전파")
    void approveShopOrderPayment_completeThrows_propagates() {
        Payment payment = buildShopProcessingPayment();
        stubShopPaymentLookup(payment);
        when(clientShopCheckoutService.completeOrderOnPaymentApproved(TENANT_ID, ORDER_PUBLIC_ID))
                .thenThrow(new IllegalStateException("complete failed"));

        assertThatThrownBy(() -> service.approveShopOrderPayment(PAYMENT_PUBLIC_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("complete failed");
    }

    private void stubShopPaymentLookup(Payment payment) {
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_PUBLIC_ID))
                .thenReturn(Optional.of(payment));
        when(paymentRepository.findByTenantIdAndId(eq(TENANT_ID), eq(PAYMENT_ROW_ID)))
                .thenReturn(Optional.of(payment));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(eq(TENANT_ID), eq(ORDER_PUBLIC_ID)))
                .thenReturn(Optional.of(new ShopClientOrder()));
    }

    private Payment buildShopProcessingPayment() {
        Payment payment = new Payment();
        payment.setId(PAYMENT_ROW_ID);
        payment.setTenantId(TENANT_ID);
        payment.setPaymentId(PAYMENT_PUBLIC_ID);
        payment.setOrderId(ORDER_PUBLIC_ID);
        payment.setAmount(new BigDecimal("15000"));
        payment.setStatus(Payment.PaymentStatus.PROCESSING);
        payment.setMethod(Payment.PaymentMethod.CARD);
        payment.setProvider(Payment.PaymentProvider.IAMPORT);
        payment.setPayerId(CLIENT_USER_ID);
        payment.setBranchId(null);
        payment.setDescription("Shop order payment");
        return payment;
    }
}
