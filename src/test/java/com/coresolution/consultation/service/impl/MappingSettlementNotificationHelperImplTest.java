package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.MappingSettlementNotificationCopy;
import com.coresolution.consultation.constant.MobilePushCanonicalTypes;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MappingSettlementScenario;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 매칭 정산 알림 헬퍼 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-05-18
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MappingSettlementNotificationHelper")
class MappingSettlementNotificationHelperImplTest {

    private static final String TENANT_ID = "tenant-mapping-notify";
    private static final Long MAPPING_ID = 900L;
    private static final Long CONSULTANT_ID = 11L;
    private static final Long CLIENT_ID = 22L;

    @Mock
    private ConsultationMessageService consultationMessageService;
    @Mock
    private MobilePushDispatchService mobilePushDispatchService;
    @Mock
    private CommonCodeService commonCodeService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MappingSettlementNotificationHelperImpl helper;

    @Test
    @DisplayName("결제 확인: 시스템 발화·내담자 단독 수신(상담사 메시지함·푸시 미노출)")
    void notify_paymentConfirmed_clientOnly() {
        // P0 보안·역할 분리(2026-06-03): 결제 금액 노출 차단 회귀 가드.
        when(commonCodeService.getCodeValue("MESSAGE_TYPE", MappingSettlementNotificationCopy.MESSAGE_TYPE_PAYMENT))
                .thenReturn("PAYMENT_COMPLETION");
        stubClientAndConsultantUsers();

        ConsultantClientMapping mapping = buildMapping();

        helper.notifyAfterMappingSettlement(mapping, TENANT_ID, MappingSettlementScenario.PAYMENT_CONFIRMED);

        // 시스템 발화 헬퍼만 호출, receiverUserId 는 client.
        verify(consultationMessageService).sendSystemThreadMessage(
                eq(CONSULTANT_ID),
                eq(CLIENT_ID),
                eq(CLIENT_ID),
                eq(null),
                eq(MappingSettlementNotificationCopy.TITLE_PAYMENT_CONFIRMED),
                any(),
                eq("PAYMENT_COMPLETION"),
                eq(false),
                eq(false));
        // 상담사 발화(senderType=CONSULTANT) 로 저장되는 sendMessage 는 절대 호출되지 않아야 함.
        verify(consultationMessageService, never()).sendMessage(
                any(), any(), any(), any(), any(), any(), any(), any(), any());
        verify(mobilePushDispatchService).dispatchMappingSettlement(
                eq(TENANT_ID),
                eq(MAPPING_ID),
                eq(CLIENT_ID),
                eq(CONSULTANT_ID),
                eq(false),
                eq(MobilePushCanonicalTypes.PAYMENT_COMPLETED),
                eq("mapping-payment-confirmed"),
                any(),
                any(),
                eq(null));
        verify(notificationService).sendPaymentCompleted(
                eq(clientUser()), eq(500_000L), eq("10회 패키지"), eq("김상담"));
    }

    @Test
    @DisplayName("입금 확인: 시스템 발화·내담자 단독 수신(상담사 메시지함·푸시 미노출)")
    void notify_depositConfirmed_clientOnly() {
        // P0 보안·역할 분리(2026-06-03): 입금 금액 노출 차단 회귀 가드.
        when(commonCodeService.getCodeValue("MESSAGE_TYPE", MappingSettlementNotificationCopy.MESSAGE_TYPE_PAYMENT))
                .thenReturn("PAYMENT_COMPLETION");
        stubClientAndConsultantUsers();

        ConsultantClientMapping mapping = buildMapping();

        helper.notifyAfterMappingSettlement(mapping, TENANT_ID, MappingSettlementScenario.DEPOSIT_CONFIRMED);

        verify(consultationMessageService).sendSystemThreadMessage(
                eq(CONSULTANT_ID),
                eq(CLIENT_ID),
                eq(CLIENT_ID),
                eq(null),
                eq(MappingSettlementNotificationCopy.TITLE_DEPOSIT_CONFIRMED),
                any(),
                eq("PAYMENT_COMPLETION"),
                eq(false),
                eq(false));
        verify(consultationMessageService, never()).sendMessage(
                any(), any(), any(), any(), any(), any(), any(), any(), any());
        verify(mobilePushDispatchService).dispatchMappingSettlement(
                eq(TENANT_ID),
                eq(MAPPING_ID),
                eq(CLIENT_ID),
                eq(CONSULTANT_ID),
                eq(false),
                eq(MobilePushCanonicalTypes.PAYMENT_COMPLETED),
                eq("mapping-deposit-confirmed"),
                any(),
                any(),
                eq(null));
        verify(notificationService).sendPaymentCompleted(
                eq(clientUser()), eq(500_000L), eq("10회 패키지"), eq("김상담"));
    }

    @Test
    @DisplayName("승인: 내담자·상담사 인앱 및 mapping_approved 푸시(2026-05-23 라운드: 푸시는 내담자 단독)")
    void notify_mappingApproved_inAppBothPushClientOnly() {
        when(commonCodeService.getCodeValue("ROLE", UserRole.CONSULTANT.name())).thenReturn("CONSULTANT");
        when(commonCodeService.getCodeValue("ROLE", UserRole.CLIENT.name())).thenReturn("CLIENT");
        when(commonCodeService.getCodeValue("MESSAGE_TYPE", MappingSettlementNotificationCopy.MESSAGE_TYPE_PAYMENT))
                .thenReturn("PAYMENT_COMPLETION");

        ConsultantClientMapping mapping = buildMapping();

        helper.notifyAfterMappingSettlement(mapping, TENANT_ID, MappingSettlementScenario.MAPPING_APPROVED);

        // 인앱은 내담자·상담사 양쪽 발화 (보존).
        verify(consultationMessageService).sendMessage(
                eq(CONSULTANT_ID),
                eq(CLIENT_ID),
                eq(null),
                eq("CONSULTANT"),
                eq(MappingSettlementNotificationCopy.TITLE_MAPPING_APPROVED),
                any(),
                eq("PAYMENT_COMPLETION"),
                eq(false),
                eq(false));
        verify(consultationMessageService).sendMessage(
                eq(CONSULTANT_ID),
                eq(CLIENT_ID),
                eq(null),
                eq("CLIENT"),
                eq(MappingSettlementNotificationCopy.TITLE_MAPPING_APPROVED),
                any(),
                eq("PAYMENT_COMPLETION"),
                eq(false),
                eq(false));
        // 푸시는 내담자 단독(includeConsultant=false) — 시나리오 #1 정책 정정.
        verify(mobilePushDispatchService).dispatchMappingSettlement(
                eq(TENANT_ID),
                eq(MAPPING_ID),
                eq(CLIENT_ID),
                eq(CONSULTANT_ID),
                eq(false),
                eq(MobilePushCanonicalTypes.MAPPING_APPROVED),
                eq("mapping-approved"),
                any(),
                any(),
                any());
        verify(notificationService, never()).sendPaymentCompleted(any(), any(Long.class), any(), any());
    }

    @Test
    @DisplayName("consultant/client 없으면 발송 생략")
    void notify_skipsWhenParticipantsMissing() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setTenantId(TENANT_ID);

        helper.notifyAfterMappingSettlement(mapping, TENANT_ID, MappingSettlementScenario.PAYMENT_CONFIRMED);

        verify(consultationMessageService, never()).sendMessage(any(), any(), any(), any(), any(), any(), any(), any(),
                any());
        verify(consultationMessageService, never()).sendSystemThreadMessage(
                any(), any(), any(), any(), any(), any(), any(), any(), any());
        verify(mobilePushDispatchService, never()).dispatchMappingSettlement(
                any(), any(), any(), any(), any(Boolean.class), any(), any(), any(), any(), any());
        verify(notificationService, never()).sendPaymentCompleted(any(), any(Long.class), any(), any());
    }

    private void stubClientAndConsultantUsers() {
        when(userRepository.findByTenantIdAndId(TENANT_ID, CLIENT_ID)).thenReturn(Optional.of(clientUser()));
        when(userRepository.findByTenantIdAndId(TENANT_ID, CONSULTANT_ID)).thenReturn(Optional.of(consultantUser()));
    }

    private static User clientUser() {
        User client = new User();
        client.setId(CLIENT_ID);
        client.setName("내담자");
        return client;
    }

    private static User consultantUser() {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        consultant.setName("김상담");
        return consultant;
    }

    private static ConsultantClientMapping buildMapping() {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setTenantId(TENANT_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setPackageName("10회 패키지");
        mapping.setPackagePrice(500_000L);
        return mapping;
    }
}
