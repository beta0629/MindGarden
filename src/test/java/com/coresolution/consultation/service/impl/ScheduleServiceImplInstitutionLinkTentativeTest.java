package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.constant.ScheduleServiceUserFacingMessages;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.BranchRepository;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.VacationRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.PlSqlScheduleValidationService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.DashboardIntegrationService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 타기관 연계(INSTITUTION_LINK) PENDING 가예약 저장. 일지 sessionSequence 는 이 슬라이스에 두지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleServiceImpl 타기관 연계 가예약")
class ScheduleServiceImplInstitutionLinkTentativeTest {

    private static final String TENANT_ID = "tenant-institution-link-tentative-1";
    private static final Long CONSULTANT_ID = 901L;
    private static final Long CLIENT_ID = 902L;
    private static final Long MAPPING_ID = 9901L;

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private TenantAccessControlService accessControlService;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private ConsultantRepository consultantRepository;
    @Mock
    private ClientRepository clientRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private VacationRepository vacationRepository;
    @Mock
    private BranchRepository branchRepository;
    @Mock
    private CommonCodeService commonCodeService;
    @Mock
    private ConsultantAvailabilityService consultantAvailabilityService;
    @Mock
    private SessionSyncService sessionSyncService;
    @Mock
    private StatisticsService statisticsService;
    @Mock
    private ConsultationMessageService consultationMessageService;
    @Mock
    private DashboardIntegrationService dashboardIntegrationService;
    @Mock
    private ConsultationRecordRepository consultationRecordRepository;
    @Mock
    private PlSqlScheduleValidationService plSqlScheduleValidationService;
    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private ScheduleCreatedNotificationHelper scheduleCreatedNotificationHelper;
    @Mock
    private ScheduleChangeNotificationDebounceService scheduleChangeNotificationDebounceService;
    @Mock
    private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(consultantAvailabilityService.isConsultantOnVacation(
                eq(CONSULTANT_ID), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class)))
                .thenReturn(false);
        when(scheduleRepository.findByTenantIdAndConsultantIdAndDate(
                eq(TENANT_ID), eq(CONSULTANT_ID), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.findExpiredConfirmedSchedules(
                anyString(), any(LocalDate.class), any(LocalTime.class)))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.findByDateBeforeAndStatus(anyString(), any(LocalDate.class), any()))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.CANCELLED))
                .thenReturn(Collections.emptyList());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private ConsultantClientMapping buildMapping(Long id, MappingStatus status, String paymentTiming,
            Integer remainingSessions) {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(id);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStatus(status);
        mapping.setPaymentTiming(paymentTiming);
        mapping.setRemainingSessions(remainingSessions);
        return mapping;
    }

    private void stubPending(ConsultantClientMapping mapping) {
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.PENDING_PAYMENT))
                .thenReturn(List.of(mapping));
        when(scheduleRepository.countOccupyingConsultationSchedulesForMapping(
                eq(TENANT_ID), any(), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(0L);
        when(scheduleRepository.countOccupyingConsultationSchedulesForConsultantClient(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(0L);
    }

    private void stubScheduleSave() {
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(invocation -> {
            Schedule s = invocation.getArgument(0);
            s.setId(777L);
            return s;
        });
    }

    private Schedule callCreate(boolean tentativeBeforeDeposit) {
        return scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID,
                LocalDate.of(2026, 9, 20),
                LocalTime.of(16, 0), LocalTime.of(17, 0),
                "제목", "설명", "VIDEO", null, tentativeBeforeDeposit);
    }

    @Test
    @DisplayName("PENDING + INSTITUTION_LINK + rem=0 + tentative=true → TENTATIVE 저장, 회기 차감 없음")
    void institutionLinkPending_tentativeTrue_savesTentative() {
        ConsultantClientMapping mapping = buildMapping(
                MAPPING_ID, MappingStatus.PENDING_PAYMENT,
                PaymentTimingConstants.INSTITUTION_LINK, 0);
        stubPending(mapping);
        stubScheduleSave();

        Schedule saved = callCreate(true);

        assertThat(saved.getId()).isEqualTo(777L);
        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertThat(captor.getValue().getMappingId()).isEqualTo(MAPPING_ID);
        assertThat(captor.getValue().getSessionSequence()).isNull();
        verify(sessionSyncService, never()).syncAfterSessionUsage(anyLong(), anyLong(), anyLong());
    }

    @Test
    @DisplayName("PENDING + INSTITUTION_LINK + tentative=false → 자동 가예약 fallback")
    void institutionLinkPending_tentativeFalse_autoFallback() {
        ConsultantClientMapping mapping = buildMapping(
                MAPPING_ID, MappingStatus.PENDING_PAYMENT,
                PaymentTimingConstants.INSTITUTION_LINK, 0);
        stubPending(mapping);
        stubScheduleSave();

        Schedule saved = callCreate(false);

        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertThat(saved.getSessionSequence()).isNull();
        verify(sessionSyncService, never()).syncAfterSessionUsage(anyLong(), anyLong(), anyLong());
    }

    @Test
    @DisplayName("PENDING + INSTITUTION_LINK + rem=0 + occupying → 재등록 차단")
    void institutionLinkPending_occupying_blocked() {
        ConsultantClientMapping mapping = buildMapping(
                MAPPING_ID, MappingStatus.PENDING_PAYMENT,
                PaymentTimingConstants.INSTITUTION_LINK, 0);
        stubPending(mapping);
        when(scheduleRepository.countOccupyingConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(1L);

        assertThatThrownBy(() -> callCreate(true))
                .isInstanceOf(RuntimeException.class)
                .hasMessage(ScheduleServiceUserFacingMessages.MSG_PROVISIONAL_ALREADY_HAS_SCHEDULE);

        verify(scheduleRepository, never()).save(any(Schedule.class));
    }

    @Test
    @DisplayName("ACTIVE 회기권 rem=0 + tentative=false 는 여전히 차단 (일지/CONFIRMED 우회 없음)")
    void sessionPackActiveRemZero_stillBlocked() {
        ConsultantClientMapping mapping = buildMapping(
                MAPPING_ID, MappingStatus.ACTIVE, PaymentTimingConstants.ADVANCE, 0);
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(List.of(mapping));
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.PENDING_PAYMENT))
                .thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> callCreate(false))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("사용 가능한 회기가 없습니다.");

        verify(scheduleRepository, never()).save(any(Schedule.class));
    }

    @Test
    @DisplayName("validateRemainingSessions: PENDING INSTITUTION_LINK rem=0 → true, ADVANCE pending → false")
    void validateRemainingSessions_institutionPendingTrue_advancePendingFalse() {
        ConsultantClientMapping institution = buildMapping(
                MAPPING_ID, MappingStatus.PENDING_PAYMENT,
                PaymentTimingConstants.INSTITUTION_LINK, 0);
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.PENDING_PAYMENT))
                .thenReturn(List.of(institution));
        assertThat(scheduleService.validateRemainingSessions(CONSULTANT_ID, CLIENT_ID)).isTrue();

        ConsultantClientMapping advance = buildMapping(
                MAPPING_ID, MappingStatus.PENDING_PAYMENT, PaymentTimingConstants.ADVANCE, 0);
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.PENDING_PAYMENT))
                .thenReturn(List.of(advance));
        assertThat(scheduleService.validateRemainingSessions(CONSULTANT_ID, CLIENT_ID)).isFalse();
    }
}
