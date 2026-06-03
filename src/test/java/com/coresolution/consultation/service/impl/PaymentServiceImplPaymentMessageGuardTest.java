package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.PaymentNotificationCopy;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Payment;
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
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
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
 * PG 결제 APPROVED 워크플로의 인앱 메시지 발화 회귀 가드.
 *
 * <p>P0 보안·역할 분리(2026-06-03): 마인드가든 1.0 안드로이드 내부 테스트에서
 * 상담사(CONSULTANT) 메시지함에 결제 금액이 노출되던 결함을 차단한다.
 * 본 테스트는 {@code consultationMessageService.sendMessage(.., senderType=CONSULTANT, ..)} 호출이
 * 영영 발생하지 않고, 시스템 발화 헬퍼 {@code sendSystemThreadMessage} 가 결제자(client) 단독 수신으로
 * 호출되는지 검증한다.
 *
 * @author MindGarden
 * @since 2026-06-03
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("PaymentServiceImpl — PG 결제 APPROVED 인앱 메시지 가드")
class PaymentServiceImplPaymentMessageGuardTest {

    private static final String TENANT_ID = "tenant-payment-msg-guard";
    private static final String PAYMENT_PUBLIC_ID = "PAY-20260603-0001";
    private static final String ORDER_PUBLIC_ID = "ORD-20260603-0001";
    private static final Long PAYMENT_ROW_ID = 7001L;
    private static final Long CLIENT_USER_ID = 5001L;
    private static final Long CONSULTANT_USER_ID = 6001L;
    private static final Long BRANCH_ID = 1L;

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
                clientShopCheckoutService);
        TenantContextHolder.setTenantId(TENANT_ID);
        lenient().when(commonCodeService.getCodeValue(anyString(), anyString())).thenReturn(null);
        lenient().when(shopClientOrderRepository.findByTenantIdAndPublicId(eq(TENANT_ID), anyString()))
                .thenReturn(Optional.empty());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("APPROVED → 시스템 발화로만 발송, CONSULTANT 발화는 절대 호출되지 않음")
    void approved_paymentMessage_doesNotLeakToConsultant() {
        Payment payment = buildProcessingPayment();
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_PUBLIC_ID))
                .thenReturn(Optional.of(payment));
        when(paymentRepository.findByTenantIdAndId(eq(TENANT_ID), eq(PAYMENT_ROW_ID))).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.updatePaymentStatus(PAYMENT_PUBLIC_ID, Payment.PaymentStatus.APPROVED);

        verify(consultationMessageService).sendSystemThreadMessage(
                eq(CONSULTANT_USER_ID),
                eq(CLIENT_USER_ID),
                eq(CLIENT_USER_ID),
                eq(null),
                eq(PaymentNotificationCopy.INAPP_TITLE_PAYMENT_COMPLETED),
                any(String.class),
                any(String.class),
                eq(false),
                eq(false));
        verify(consultationMessageService, never()).sendMessage(
                any(), any(), any(), eq(UserRole.CONSULTANT.name()), any(), any(), any(), any(), any());
        verify(consultationMessageService, never()).sendMessage(
                any(), any(), any(), eq("CONSULTANT"), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("APPROVED → 메시지 본문은 PaymentNotificationCopy 템플릿 사용(금액·결제일시·내용 포함)")
    void approved_paymentMessage_usesTemplateFromConstants() {
        Payment payment = buildProcessingPayment();
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_PUBLIC_ID))
                .thenReturn(Optional.of(payment));
        when(paymentRepository.findByTenantIdAndId(eq(TENANT_ID), eq(PAYMENT_ROW_ID))).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.updatePaymentStatus(PAYMENT_PUBLIC_ID, Payment.PaymentStatus.APPROVED);

        org.mockito.ArgumentCaptor<String> bodyCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(consultationMessageService).sendSystemThreadMessage(
                anyLong(), anyLong(), anyLong(), eq(null), anyString(),
                bodyCaptor.capture(), anyString(), eq(false), eq(false));
        org.assertj.core.api.Assertions.assertThat(bodyCaptor.getValue())
                .startsWith("결제가 완료되었습니다.")
                .contains("💰 금액: 150000원")
                .contains("📅 결제일시: ")
                .contains("📝 내용: 상담 패키지 결제");
    }

    @Test
    @DisplayName("APPROVED → 쇼핑 주문 PG 인 경우 generic 결제 메시지·푸시·알림톡 모두 스킵")
    void approved_skipMessageWhenShopOrderPayment() {
        Payment payment = buildProcessingPayment();
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT_ID, PAYMENT_PUBLIC_ID))
                .thenReturn(Optional.of(payment));
        when(paymentRepository.findByTenantIdAndId(eq(TENANT_ID), eq(PAYMENT_ROW_ID))).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        // 쇼핑 주문 PG 로 인식되도록 stub
        when(shopClientOrderRepository.findByTenantIdAndPublicId(eq(TENANT_ID), eq(ORDER_PUBLIC_ID)))
                .thenReturn(Optional.of(new com.coresolution.consultation.entity.ShopClientOrder()));

        service.updatePaymentStatus(PAYMENT_PUBLIC_ID, Payment.PaymentStatus.APPROVED);

        verify(consultationMessageService, never()).sendSystemThreadMessage(
                any(), any(), any(), any(), any(), any(), any(), any(), any());
        verify(consultationMessageService, never()).sendMessage(
                any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    private Payment buildProcessingPayment() {
        Payment payment = new Payment();
        payment.setId(PAYMENT_ROW_ID);
        payment.setTenantId(TENANT_ID);
        payment.setPaymentId(PAYMENT_PUBLIC_ID);
        payment.setOrderId(ORDER_PUBLIC_ID);
        payment.setAmount(new BigDecimal("150000"));
        payment.setStatus(Payment.PaymentStatus.PROCESSING);
        payment.setMethod(Payment.PaymentMethod.CARD);
        payment.setProvider(Payment.PaymentProvider.TOSS);
        payment.setPayerId(CLIENT_USER_ID);
        payment.setRecipientId(CONSULTANT_USER_ID);
        payment.setBranchId(BRANCH_ID);
        payment.setDescription("상담 패키지 결제");
        return payment;
    }
}
