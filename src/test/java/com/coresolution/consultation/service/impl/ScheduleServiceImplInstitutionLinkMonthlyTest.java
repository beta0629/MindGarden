package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.PaymentTimingConstants;
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
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
 * 타기관 연계는 rem=0이어도 일정 저장. 일반 회기권 rem=0 / SESSIONS_EXHAUSTED 는 차단.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleServiceImpl 타기관 연계 월 단위 — 회기 잔여 게이트 분리")
class ScheduleServiceImplInstitutionLinkMonthlyTest {

    private static final String TENANT_ID = "tenant-institution-link-1";
    private static final Long CONSULTANT_ID = 801L;
    private static final Long CLIENT_ID = 802L;
    private static final Long MAPPING_ID = 8801L;

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
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.PENDING_PAYMENT))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.CANCELLED))
                .thenReturn(Collections.emptyList());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("타기관 연계 ACTIVE rem=0 → 일정 BOOKED 저장, 회기 차감 없음, 방문 회차 스탬프")
    void institutionLink_activeRemZero_savesBookedWithoutSessionDeduction() {
        ConsultantClientMapping mapping = buildMapping(
                MappingStatus.ACTIVE, PaymentTimingConstants.INSTITUTION_LINK, 0);
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(List.of(mapping));
        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
                TENANT_ID, CONSULTANT_ID, CLIENT_ID))
                .thenReturn(List.of(mapping));
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(scheduleRepository.countOccupyingConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(1L);
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(invocation -> {
            Schedule s = invocation.getArgument(0);
            if (s.getId() == null) {
                s.setId(999L);
            }
            return s;
        });

        Schedule saved = scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID,
                LocalDate.of(2026, 9, 20),
                LocalTime.of(10, 0), LocalTime.of(11, 0),
                "제목", "설명", "VIDEO", null, false);

        assertThat(saved.getId()).isEqualTo(999L);
        assertThat(saved.getStatus()).isEqualTo(ScheduleStatus.BOOKED);
        assertThat(saved.getSessionSequence()).isEqualTo(1);
        assertThat(saved.getMappingId()).isEqualTo(MAPPING_ID);
        verify(sessionSyncService, never()).syncAfterSessionUsage(anyLong(), anyLong(), anyLong());
        assertThat(mapping.getRemainingSessions()).isEqualTo(0);
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.ACTIVE);
    }

    @Test
    @DisplayName("일반 회기권 ADVANCE ACTIVE rem=0 → 저장하지 않고 사용 가능한 회기 메시지")
    void sessionPack_advanceRemZero_stillBlocked() {
        ConsultantClientMapping mapping = buildMapping(
                MappingStatus.ACTIVE, PaymentTimingConstants.ADVANCE, 0);
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(List.of(mapping));

        assertThatThrownBy(() -> scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID,
                LocalDate.of(2026, 9, 21),
                LocalTime.of(14, 0), LocalTime.of(15, 0),
                "제목", "설명", "VIDEO", null, false))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("사용 가능한 회기가 없습니다.");

        verify(scheduleRepository, never()).save(any(Schedule.class));
    }

    @Test
    @DisplayName("일반 회기 SESSIONS_EXHAUSTED → 저장하지 않고 유효한 매칭 없음")
    void sessionPack_sessionsExhausted_stillBlocked() {
        ConsultantClientMapping mapping = buildMapping(
                MappingStatus.SESSIONS_EXHAUSTED, PaymentTimingConstants.ADVANCE, 0);
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.SESSIONS_EXHAUSTED))
                .thenReturn(List.of(mapping));

        assertThatThrownBy(() -> scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID,
                LocalDate.of(2026, 9, 22),
                LocalTime.of(11, 0), LocalTime.of(12, 0),
                "제목", "설명"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("유효한 매칭");

        verify(scheduleRepository, never()).save(any(Schedule.class));
    }

    @Test
    @DisplayName("validateRemainingSessions: 타기관 연계 rem=0 true, 회기권 rem=0 false")
    void validateRemainingSessions_institutionLinkTrue_sessionPackFalse() {
        ConsultantClientMapping institution = buildMapping(
                MappingStatus.ACTIVE, PaymentTimingConstants.INSTITUTION_LINK, 0);
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(List.of(institution));
        assertThat(scheduleService.validateRemainingSessions(CONSULTANT_ID, CLIENT_ID)).isTrue();

        ConsultantClientMapping pack = buildMapping(
                MappingStatus.ACTIVE, PaymentTimingConstants.ADVANCE, 0);
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(List.of(pack));
        assertThat(scheduleService.validateRemainingSessions(CONSULTANT_ID, CLIENT_ID)).isFalse();
    }

    private ConsultantClientMapping buildMapping(MappingStatus status, String paymentTiming,
            Integer remainingSessions) {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStatus(status);
        mapping.setPaymentTiming(paymentTiming);
        mapping.setRemainingSessions(remainingSessions);
        mapping.setTotalSessions(0);
        mapping.setUsedSessions(0);
        return mapping;
    }
}
