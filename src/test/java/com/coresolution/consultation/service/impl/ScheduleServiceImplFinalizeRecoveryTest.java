package com.coresolution.consultation.service.impl;

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
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PlSqlScheduleValidationService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.DashboardIntegrationService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 패치 7.1 검증: {@code finalizeTentativeSchedulesAfterDepositConfirmed} 가 가예약 처리 후
 * {@code session_sequence IS NULL} 인 BOOKED/CONFIRMED/COMPLETED 일정을 보정 차감하는지 확인.
 *
 * <p>또한 어드민 단건 트리거({@code recoverMissedSessionDeductionsForMapping}) 의 차감 처리를 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl — 패치 7.1 (입금 확정 후 누락 일정 보정 차감)")
class ScheduleServiceImplFinalizeRecoveryTest {

    private static final String TENANT_ID = "tenant-recovery-1";
    private static final Long MAPPING_ID = 93L;
    private static final Long CONSULTANT_USER_ID = 11L;
    private static final Long CLIENT_USER_ID = 22L;

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
    private MobilePushDispatchService mobilePushDispatchService;
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
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private User user(Long id) {
        User u = new User();
        u.setId(id);
        return u;
    }

    private Schedule buildSchedule(Long id, ScheduleStatus status, LocalDate date, LocalTime startTime) {
        Schedule s = new Schedule();
        s.setId(id);
        s.setTenantId(TENANT_ID);
        s.setConsultantId(CONSULTANT_USER_ID);
        s.setClientId(CLIENT_USER_ID);
        s.setDate(date);
        s.setStartTime(startTime);
        s.setEndTime(startTime.plusMinutes(50));
        s.setStatus(status);
        s.setIsDeleted(false);
        return s;
    }

    private ConsultantClientMapping buildFreshMapping(int total, int remaining) {
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setId(MAPPING_ID);
        m.setTenantId(TENANT_ID);
        m.setConsultant(user(CONSULTANT_USER_ID));
        m.setClient(user(CLIENT_USER_ID));
        m.setStatus(MappingStatus.ACTIVE);
        m.setTotalSessions(total);
        m.setRemainingSessions(remaining);
        m.setUsedSessions(total - remaining);
        return m;
    }

    @Test
    @DisplayName("finalizeTentativeSchedulesAfterDepositConfirmed: 가예약 없음 + 미차감 COMPLETED 1건 → 보정 차감 (#93)")
    void finalize_noTentative_recoversCompletedSchedule() {
        ConsultantClientMapping inputMapping = new ConsultantClientMapping();
        inputMapping.setId(MAPPING_ID);
        inputMapping.setTenantId(TENANT_ID);
        inputMapping.setConsultant(user(CONSULTANT_USER_ID));
        inputMapping.setClient(user(CLIENT_USER_ID));

        Schedule completed = buildSchedule(
                107L, ScheduleStatus.COMPLETED, LocalDate.of(2026, 6, 2), LocalTime.of(10, 0));

        // 가예약 없음
        when(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndStatusAndIsDeletedFalse(
                eq(TENANT_ID), eq(CONSULTANT_USER_ID), eq(CLIENT_USER_ID),
                eq(ScheduleStatus.TENTATIVE_PENDING_PAYMENT)))
                .thenReturn(new ArrayList<>());

        // 미차감 COMPLETED 1건
        when(scheduleRepository
                .findByTenantIdAndConsultantIdAndClientIdAndSessionSequenceIsNullAndStatusInAndIsDeletedFalse(
                        eq(TENANT_ID), eq(CONSULTANT_USER_ID), eq(CLIENT_USER_ID),
                        any(Collection.class)))
                .thenReturn(List.of(completed));

        ConsultantClientMapping fresh = buildFreshMapping(1, 1);
        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(fresh));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.finalizeTentativeSchedulesAfterDepositConfirmed(inputMapping);

        // sessionSequence 채워졌는지
        assertThat(completed.getSessionSequence()).isEqualTo(1);
        assertThat(completed.getMappingId()).isEqualTo(MAPPING_ID);
        // 차감 후 매핑 상태
        assertThat(fresh.getUsedSessions()).isEqualTo(1);
        assertThat(fresh.getRemainingSessions()).isZero();
        // status 는 COMPLETED 그대로 유지 (보정은 sequence + mapping_id 만 채움)
        assertThat(completed.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
        verify(sessionSyncService, times(1)).syncAfterSessionUsage(
                eq(MAPPING_ID), eq(CONSULTANT_USER_ID), eq(CLIENT_USER_ID));
    }

    @Test
    @DisplayName("recoverMissedSessionDeductionsForMapping: 어드민 단건 트리거 — 누락 BOOKED 1건 차감")
    void recoverMissedSessionDeductionsForMapping_adminTrigger_deductsOne() {
        ConsultantClientMapping inputMapping = new ConsultantClientMapping();
        inputMapping.setId(MAPPING_ID);
        inputMapping.setTenantId(TENANT_ID);
        inputMapping.setConsultant(user(CONSULTANT_USER_ID));
        inputMapping.setClient(user(CLIENT_USER_ID));

        Schedule booked = buildSchedule(
                250L, ScheduleStatus.BOOKED, LocalDate.of(2026, 6, 3), LocalTime.of(14, 0));

        when(scheduleRepository
                .findByTenantIdAndConsultantIdAndClientIdAndSessionSequenceIsNullAndStatusInAndIsDeletedFalse(
                        eq(TENANT_ID), eq(CONSULTANT_USER_ID), eq(CLIENT_USER_ID),
                        any(Collection.class)))
                .thenReturn(List.of(booked));

        ConsultantClientMapping fresh = buildFreshMapping(5, 5);
        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(fresh));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        int recovered = scheduleService.recoverMissedSessionDeductionsForMapping(inputMapping);

        assertThat(recovered).isEqualTo(1);
        assertThat(booked.getSessionSequence()).isEqualTo(1);
        assertThat(booked.getMappingId()).isEqualTo(MAPPING_ID);
        assertThat(fresh.getRemainingSessions()).isEqualTo(4);
        assertThat(fresh.getUsedSessions()).isEqualTo(1);
    }

    @Test
    @DisplayName("recoverMissedSessionDeductionsForMapping: 잔여 회기 부족 → 보정 실패 (recovered=0)")
    void recoverMissedSessionDeductionsForMapping_insufficientSessions_skips() {
        ConsultantClientMapping inputMapping = new ConsultantClientMapping();
        inputMapping.setId(MAPPING_ID);
        inputMapping.setTenantId(TENANT_ID);
        inputMapping.setConsultant(user(CONSULTANT_USER_ID));
        inputMapping.setClient(user(CLIENT_USER_ID));

        Schedule completed = buildSchedule(
                300L, ScheduleStatus.COMPLETED, LocalDate.of(2026, 6, 4), LocalTime.of(11, 0));

        when(scheduleRepository
                .findByTenantIdAndConsultantIdAndClientIdAndSessionSequenceIsNullAndStatusInAndIsDeletedFalse(
                        eq(TENANT_ID), eq(CONSULTANT_USER_ID), eq(CLIENT_USER_ID),
                        any(Collection.class)))
                .thenReturn(List.of(completed));

        // 잔여 회기 0 → useSessionForSpecificMapping 가 IllegalStateException
        ConsultantClientMapping exhausted = buildFreshMapping(10, 0);
        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(exhausted));

        int recovered = scheduleService.recoverMissedSessionDeductionsForMapping(inputMapping);

        assertThat(recovered).isZero();
        // sessionSequence 미설정
        assertThat(completed.getSessionSequence()).isNull();
        // 매핑 save 호출 없음 (예외로 우회)
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("finalizeTentativeSchedulesAfterDepositConfirmed: 가예약 1건 + 누락 COMPLETED 1건 → 가예약 BOOKED 전환 후 보정 차감")
    void finalize_withTentativeAndMissed_processesBothInOrder() {
        ConsultantClientMapping inputMapping = new ConsultantClientMapping();
        inputMapping.setId(MAPPING_ID);
        inputMapping.setTenantId(TENANT_ID);
        inputMapping.setConsultant(user(CONSULTANT_USER_ID));
        inputMapping.setClient(user(CLIENT_USER_ID));

        Schedule tentative = buildSchedule(
                10L, ScheduleStatus.TENTATIVE_PENDING_PAYMENT,
                LocalDate.of(2026, 6, 10), LocalTime.of(10, 0));
        Schedule missedCompleted = buildSchedule(
                20L, ScheduleStatus.COMPLETED,
                LocalDate.of(2026, 6, 2), LocalTime.of(10, 0));

        when(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndStatusAndIsDeletedFalse(
                eq(TENANT_ID), eq(CONSULTANT_USER_ID), eq(CLIENT_USER_ID),
                eq(ScheduleStatus.TENTATIVE_PENDING_PAYMENT)))
                .thenReturn(List.of(tentative));
        when(scheduleRepository
                .findByTenantIdAndConsultantIdAndClientIdAndSessionSequenceIsNullAndStatusInAndIsDeletedFalse(
                        eq(TENANT_ID), eq(CONSULTANT_USER_ID), eq(CLIENT_USER_ID),
                        any(Collection.class)))
                .thenReturn(List.of(missedCompleted));

        ConsultantClientMapping fresh = buildFreshMapping(5, 3);
        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(fresh));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.finalizeTentativeSchedulesAfterDepositConfirmed(inputMapping);

        // 가예약은 BOOKED 로 전환 + 차감
        assertThat(tentative.getStatus()).isEqualTo(ScheduleStatus.BOOKED);
        assertThat(tentative.getSessionSequence()).isNotNull();
        assertThat(tentative.getMappingId()).isEqualTo(MAPPING_ID);
        // 누락 COMPLETED 는 status 유지 + 차감 보정
        assertThat(missedCompleted.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
        assertThat(missedCompleted.getSessionSequence()).isNotNull();
        assertThat(missedCompleted.getMappingId()).isEqualTo(MAPPING_ID);
        // 총 2회 차감 (가예약 1 + 누락 1)
        assertThat(fresh.getUsedSessions()).isEqualTo(4);
        assertThat(fresh.getRemainingSessions()).isEqualTo(1);
    }
}
