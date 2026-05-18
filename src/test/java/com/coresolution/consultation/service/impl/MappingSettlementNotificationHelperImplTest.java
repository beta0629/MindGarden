package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.MappingSettlementNotificationCopy;
import com.coresolution.consultation.constant.MobilePushCanonicalTypes;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MappingSettlementScenario;
import com.coresolution.consultation.service.MobilePushDispatchService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

    @InjectMocks
    private MappingSettlementNotificationHelperImpl helper;

    @Test
    @DisplayName("입금 확인: 내담자 인앱·payment_completed 푸시(상담사 푸시 없음)")
    void notify_depositConfirmed_clientOnly() {
        when(commonCodeService.getCodeValue("ROLE", UserRole.CONSULTANT.name())).thenReturn("CONSULTANT");
        when(commonCodeService.getCodeValue("MESSAGE_TYPE", MappingSettlementNotificationCopy.MESSAGE_TYPE_PAYMENT))
                .thenReturn("PAYMENT_COMPLETION");

        ConsultantClientMapping mapping = buildMapping();

        helper.notifyAfterMappingSettlement(mapping, TENANT_ID, MappingSettlementScenario.DEPOSIT_CONFIRMED);

        verify(consultationMessageService).sendMessage(
                eq(CONSULTANT_ID),
                eq(CLIENT_ID),
                eq(null),
                eq("CONSULTANT"),
                eq(MappingSettlementNotificationCopy.TITLE_DEPOSIT_CONFIRMED),
                any(),
                eq("PAYMENT_COMPLETION"),
                eq(false),
                eq(false));
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
    }

    @Test
    @DisplayName("승인: 내담자·상담사 인앱 및 mapping_approved 푸시(상담사 포함)")
    void notify_mappingApproved_clientAndConsultant() {
        when(commonCodeService.getCodeValue("ROLE", UserRole.CONSULTANT.name())).thenReturn("CONSULTANT");
        when(commonCodeService.getCodeValue("ROLE", UserRole.CLIENT.name())).thenReturn("CLIENT");
        when(commonCodeService.getCodeValue("MESSAGE_TYPE", MappingSettlementNotificationCopy.MESSAGE_TYPE_PAYMENT))
                .thenReturn("PAYMENT_COMPLETION");

        ConsultantClientMapping mapping = buildMapping();

        helper.notifyAfterMappingSettlement(mapping, TENANT_ID, MappingSettlementScenario.MAPPING_APPROVED);

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
        verify(mobilePushDispatchService).dispatchMappingSettlement(
                eq(TENANT_ID),
                eq(MAPPING_ID),
                eq(CLIENT_ID),
                eq(CONSULTANT_ID),
                eq(true),
                eq(MobilePushCanonicalTypes.MAPPING_APPROVED),
                eq("mapping-approved"),
                any(),
                any(),
                any());
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
        verify(mobilePushDispatchService, never()).dispatchMappingSettlement(
                any(), any(), any(), any(), any(Boolean.class), any(), any(), any(), any(), any());
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
