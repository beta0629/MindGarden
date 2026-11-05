package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.ClientEngagementTypeConstants;
import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.InstitutionLinkContract;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.InstitutionLinkContractRepository;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 타기관 일지 실패가 회기 일지 저장을 호출하지 않고, 회기 일지 실패가 타기관 경로를 호출하지 않는지 검증.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("InstitutionLinkConsultationLogWriteRouter 경로 격리")
class InstitutionLinkConsultationLogWriteRouterIsolationTest {

    private static final String TENANT_ID = "tenant-institution-link-log-1";

    @Mock
    private InstitutionLinkConsultationLogService institutionLinkConsultationLogService;

    @Mock
    private ConsultationRecordService consultationRecordService;

    @Mock
    private ConsultantClientMappingRepository consultantClientMappingRepository;

    @Mock
    private InstitutionLinkContractRepository institutionLinkContractRepository;

    @Mock
    private ClientRepository clientRepository;

    @InjectMocks
    private InstitutionLinkConsultationLogWriteRouter router;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("타기관 경로 실패 시 회기 ConsultationRecordService 를 호출하지 않는다")
    void institutionFailure_doesNotCallSessionRecordService() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("engagementType", PaymentTimingConstants.INSTITUTION_LINK);
        payload.put("mappingId", 8801L);
        when(institutionLinkConsultationLogService.createFromSchedulePayload(payload))
                .thenThrow(new ValidationException("sessionDate", null, "세션 일자는 필수입니다."));

        assertThatThrownBy(() -> router.create(payload))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("세션 일자는 필수입니다.");

        verify(institutionLinkConsultationLogService).createFromSchedulePayload(payload);
        verifyNoInteractions(consultationRecordService);
    }

    @Test
    @DisplayName("회기 일지 실패 시 타기관 일지 서비스를 호출하지 않는다")
    void sessionFailure_doesNotCallInstitutionLogService() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("paymentTiming", PaymentTimingConstants.ADVANCE);
        payload.put("remainingSessions", 0);
        when(consultationRecordService.createConsultationRecord(payload))
                .thenThrow(new ValidationException("sessionNumber", null, "회기수(sessionNumber)는 필수입니다."));

        assertThatThrownBy(() -> router.create(payload))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("회기수(sessionNumber)는 필수입니다.");

        verify(consultationRecordService).createConsultationRecord(payload);
        verify(institutionLinkConsultationLogService, never()).createFromSchedulePayload(any());
        verifyNoInteractions(consultantClientMappingRepository);
        verifyNoInteractions(institutionLinkContractRepository);
        verifyNoInteractions(clientRepository);
    }

    @Test
    @DisplayName("rem=0 만으로는 타기관 경로로 분기하지 않는다")
    void remainingZero_doesNotRouteToInstitution() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("remainingSessions", 0);
        payload.put("sessionNumber", null);
        when(consultationRecordService.createConsultationRecord(payload))
                .thenReturn(new ConsultationRecord());

        router.create(payload);

        verify(consultationRecordService).createConsultationRecord(payload);
        verify(institutionLinkConsultationLogService, never()).createFromSchedulePayload(any());
    }

    @Test
    @DisplayName("내담자 engagementType=INSTITUTION_LINK 이면 매핑 SAME_DAY 여도 타기관 경로")
    void institutionClient_routesEvenIfMappingSameDay() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("clientId", 78L);
        payload.put("mappingId", 265L);
        payload.put("paymentTiming", PaymentTimingConstants.SAME_DAY_CARD);
        payload.put("sessionNumber", null);
        Client client = new Client();
        client.setId(78L);
        client.setEngagementType(ClientEngagementTypeConstants.INSTITUTION_LINK);
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(TENANT_ID, 78L))
                .thenReturn(Optional.of(client));

        router.create(payload);

        verify(institutionLinkConsultationLogService).createFromSchedulePayload(payload);
        verifyNoInteractions(consultationRecordService);
    }

    @Test
    @DisplayName("매핑 paymentTiming=INSTITUTION_LINK 이면 타기관 서비스만 호출한다")
    void institutionMapping_routesToInstitutionServiceOnly() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("mappingId", 8801L);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(8801L);
        mapping.setPaymentTiming(PaymentTimingConstants.INSTITUTION_LINK);
        mapping.setRemainingSessions(0);
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT_ID, 8801L))
                .thenReturn(Optional.of(mapping));

        router.create(payload);

        verify(institutionLinkConsultationLogService).createFromSchedulePayload(payload);
        verifyNoInteractions(consultationRecordService);
    }

    @Test
    @DisplayName("매핑이 계약 sourceMappingId 이면 타기관 서비스만 호출한다")
    void contractLinkedMapping_routesToInstitutionServiceOnly() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("mappingId", 9901L);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(9901L);
        mapping.setPaymentTiming(PaymentTimingConstants.ADVANCE);
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT_ID, 9901L))
                .thenReturn(Optional.of(mapping));
        InstitutionLinkContract contract = InstitutionLinkContract.builder().build();
        contract.setId(41L);
        when(institutionLinkContractRepository.findByTenantIdAndSourceMappingId(TENANT_ID, 9901L))
                .thenReturn(Optional.of(contract));

        router.create(payload);

        verify(institutionLinkConsultationLogService).createFromSchedulePayload(payload);
        verifyNoInteractions(consultationRecordService);
    }
}
