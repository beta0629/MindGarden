package com.coresolution.consultation.service.impl;

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
import com.coresolution.consultation.service.PlSqlScheduleValidationService;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * createConsultantSchedule(상담유형·branchCode) 저장 전 매칭·회기 검증 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-05-06
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl createConsultantSchedule 사전 검증")
class ScheduleServiceImplCreateConsultantSchedulePreValidationTest {

    private static final String TENANT_ID = "tenant-preval-1";
    private static final Long CONSULTANT_ID = 101L;
    private static final Long CLIENT_ID = 202L;

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

    private void stubConflictCheckAndAutoComplete() {
        when(consultantAvailabilityService.isConsultantOnVacation(
                eq(CONSULTANT_ID), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class)))
                .thenReturn(false);
        when(scheduleRepository.findByTenantIdAndConsultantIdAndDate(
                eq(TENANT_ID), eq(CONSULTANT_ID), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.findExpiredConfirmedSchedules(anyString(), any(LocalDate.class), any(LocalTime.class)))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.findByDateBeforeAndStatus(anyString(), any(LocalDate.class), any()))
                .thenReturn(Collections.emptyList());
    }

    @Test
    @DisplayName("매칭 없음 시 createConsultantSchedule은 저장하지 않고 WithType과 동일 메시지로 실패")
    void createConsultantSchedule_noMapping_doesNotSave() {
        stubConflictCheckAndAutoComplete();
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(Collections.emptyList());

        LocalDate date = LocalDate.of(2026, 6, 10);
        LocalTime start = LocalTime.of(9, 0);
        LocalTime end = LocalTime.of(10, 0);

        assertThatThrownBy(() -> scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID, date, start, end, "제목", "설명", "VIDEO", null))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("상담사와 내담자 간의 유효한 매칭이 없거나 승인되지 않았습니다.");

        verify(scheduleRepository, never()).save(any(Schedule.class));
    }

    @Test
    @DisplayName("남은 회기 없음 시 저장하지 않고 WithType과 동일 메시지로 실패")
    void createConsultantSchedule_noRemainingSessions_doesNotSave() {
        stubConflictCheckAndAutoComplete();

        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setRemainingSessions(0);
        mapping.setStatus(MappingStatus.ACTIVE);

        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(List.of(mapping));

        LocalDate date = LocalDate.of(2026, 6, 11);
        LocalTime start = LocalTime.of(14, 0);
        LocalTime end = LocalTime.of(15, 0);

        assertThatThrownBy(() -> scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID, date, start, end, "제목", "설명", "PHONE", "ignored-branch"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("사용 가능한 회기가 없습니다.");

        verify(scheduleRepository, never()).save(any(Schedule.class));
    }

    @Test
    @DisplayName("7인자 오버로드: 매칭 없음 시 저장하지 않고 유효한 매칭 메시지로 실패")
    void createConsultantSchedule_sevenArgs_noMapping_doesNotSave() {
        stubConflictCheckAndAutoComplete();
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(Collections.emptyList());

        LocalDate date = LocalDate.of(2026, 6, 12);
        LocalTime start = LocalTime.of(10, 0);
        LocalTime end = LocalTime.of(11, 0);

        assertThatThrownBy(() -> scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID, date, start, end, "제목", "설명"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("유효한 매칭");

        verify(scheduleRepository, never()).save(any(Schedule.class));
    }

    @Test
    @DisplayName("7인자 오버로드: ACTIVE이나 남은 회기 0이면 저장하지 않고 사용 가능한 회기 메시지로 실패")
    void createConsultantSchedule_sevenArgs_noRemainingSessions_doesNotSave() {
        stubConflictCheckAndAutoComplete();

        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setRemainingSessions(0);
        mapping.setStatus(MappingStatus.ACTIVE);

        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(List.of(mapping));

        LocalDate date = LocalDate.of(2026, 6, 13);
        LocalTime start = LocalTime.of(15, 0);
        LocalTime end = LocalTime.of(16, 0);

        assertThatThrownBy(() -> scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID, date, start, end, "제목", "설명"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("사용 가능한 회기");

        verify(scheduleRepository, never()).save(any(Schedule.class));
    }
}
