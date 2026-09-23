package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.InstitutionLinkConsultationLogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 스케줄 단위 일지 존재 SSOT — 회기권 OR 타기관.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConsultationLogExistenceSsotImpl — classic OR IL")
class ConsultationLogExistenceSsotImplTest {

    private static final String TENANT_ID = "tenant-il-ssot-1";
    private static final Long SCHEDULE_ID = 436L;

    @Mock
    private ConsultationRecordRepository consultationRecordRepository;
    @Mock
    private InstitutionLinkConsultationLogRepository institutionLinkConsultationLogRepository;

    @InjectMocks
    private ConsultationLogExistenceSsotImpl ssot;

    @Test
    @DisplayName("회기권 일지만 있으면 true (IL 미조회)")
    void classicOnly_returnsTrue() {
        when(consultationRecordRepository.existsActiveForScheduleSsot(TENANT_ID, SCHEDULE_ID))
                .thenReturn(true);

        assertThat(ssot.existsActiveForSchedule(TENANT_ID, SCHEDULE_ID)).isTrue();
        verify(institutionLinkConsultationLogRepository, never())
                .existsActiveForScheduleSsot(TENANT_ID, SCHEDULE_ID);
    }

    @Test
    @DisplayName("회기권 없고 IL 일지만 있으면 true (잔여 회기 무관)")
    void ilOnly_returnsTrue() {
        when(consultationRecordRepository.existsActiveForScheduleSsot(TENANT_ID, SCHEDULE_ID))
                .thenReturn(false);
        when(institutionLinkConsultationLogRepository.existsActiveForScheduleSsot(TENANT_ID, SCHEDULE_ID))
                .thenReturn(true);

        assertThat(ssot.existsActiveForSchedule(TENANT_ID, SCHEDULE_ID)).isTrue();
    }

    @Test
    @DisplayName("둘 다 없으면 false")
    void neither_returnsFalse() {
        when(consultationRecordRepository.existsActiveForScheduleSsot(TENANT_ID, SCHEDULE_ID))
                .thenReturn(false);
        when(institutionLinkConsultationLogRepository.existsActiveForScheduleSsot(TENANT_ID, SCHEDULE_ID))
                .thenReturn(false);

        assertThat(ssot.existsActiveForSchedule(TENANT_ID, SCHEDULE_ID)).isFalse();
    }

    @Test
    @DisplayName("tenantId/scheduleId null → false")
    void nullArgs_returnsFalse() {
        assertThat(ssot.existsActiveForSchedule(null, SCHEDULE_ID)).isFalse();
        assertThat(ssot.existsActiveForSchedule(TENANT_ID, null)).isFalse();
        assertThat(ssot.existsActiveForSchedule("", SCHEDULE_ID)).isFalse();
    }
}
