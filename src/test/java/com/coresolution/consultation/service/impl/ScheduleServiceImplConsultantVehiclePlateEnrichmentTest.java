package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

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

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.dto.ScheduleResponse;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.Consultant;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.core.context.TenantContextHolder;

/**
 * {@link ScheduleServiceImpl#getUpcomingSchedules} 상담사 차량번호 배치 enrichment 검증.
 * {@code buildVehiclePlateByConsultantId} → {@link ScheduleResponse#getConsultantVehiclePlate()}.
 *
 * @author CoreSolution
 * @since 2026-09-04
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleServiceImpl 상담사 vehiclePlate 배치 enrichment")
class ScheduleServiceImplConsultantVehiclePlateEnrichmentTest {

    private static final String TENANT_ID = "tenant-sched-cplate-" + UUID.randomUUID();
    private static final Long CONSULTANT_ID = 701L;
    private static final Long CLIENT_ID = 702L;
    private static final String CONSULTANT_PLATE = "12가 3456";
    private static final String CLIENT_PLATE = "34나 5678";

    @Mock private ScheduleRepository scheduleRepository;
    @Mock private UserRepository userRepository;
    @Mock private ConsultantRepository consultantRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private CommonCodeService commonCodeService;
    @Mock private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock private NotificationService notificationService;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock private ScheduleChangeNotificationDebounceService scheduleChangeNotificationDebounceService;

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

    @Test
    @DisplayName("다가오는 상담 조회 시 consultantId 배치 맵으로 consultantVehiclePlate를 채운다")
    void getUpcomingSchedules_enrichesConsultantVehiclePlateFromBatchMap() {
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(7);

        List<Schedule> schedules = new ArrayList<>();
        schedules.add(createSchedule(1L, startDate, LocalTime.of(10, 0), ScheduleStatus.BOOKED));
        schedules.add(createSchedule(2L, startDate.plusDays(1), LocalTime.of(14, 0), ScheduleStatus.CONFIRMED));

        when(scheduleRepository.findByTenantIdAndConsultantIdAndDateBetween(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(startDate), eq(endDate)))
                .thenReturn(schedules);

        Consultant consultant = new Consultant();
        consultant.setId(CONSULTANT_ID);
        consultant.setTenantId(TENANT_ID);
        consultant.setVehiclePlate(CONSULTANT_PLATE);

        Client client = new Client();
        client.setId(CLIENT_ID);
        client.setTenantId(TENANT_ID);
        client.setVehiclePlate(CLIENT_PLATE);

        when(consultantRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyCollection()))
                .thenReturn(List.of(consultant));
        when(clientRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyCollection()))
                .thenReturn(List.of(client));

        User mockConsultant = createMockUser(CONSULTANT_ID);
        User mockClient = createMockUser(CLIENT_ID);
        when(userRepository.findByTenantIdAndId(anyString(), anyLong())).thenAnswer(inv -> {
            long id = ((Number) inv.getArgument(1)).longValue();
            if (id == CONSULTANT_ID) {
                return Optional.of(mockConsultant);
            }
            if (id == CLIENT_ID) {
                return Optional.of(mockClient);
            }
            return Optional.empty();
        });
        when(userPersonalDataCacheService.getDecryptedUserData(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            Map<String, String> m = new HashMap<>();
            if (CONSULTANT_ID.equals(u.getId())) {
                m.put("name", "상담사A");
            } else if (CLIENT_ID.equals(u.getId())) {
                m.put("name", "내담자B");
            }
            return m;
        });
        when(commonCodeService.getCodeName(eq("CONSULTATION_TYPE"), anyString())).thenReturn("개인상담");

        List<ScheduleResponse> result = scheduleService.getUpcomingSchedules(
                CONSULTANT_ID, startDate, endDate, 10);

        assertThat(result).hasSize(2);
        assertThat(result).allSatisfy(r -> {
            assertThat(r.getConsultantVehiclePlate()).isEqualTo(CONSULTANT_PLATE);
            assertThat(r.getVehiclePlate()).isEqualTo(CLIENT_PLATE);
        });

        verify(consultantRepository, times(1))
                .findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyCollection());
        verify(clientRepository, times(1))
                .findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyCollection());
    }

    @Test
    @DisplayName("상담사 차량이 없으면 consultantVehiclePlate는 null이고 내담자 vehiclePlate는 유지된다")
    void getUpcomingSchedules_nullConsultantPlate_keepsClientPlateSeparate() {
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(7);

        List<Schedule> schedules = List.of(
                createSchedule(3L, startDate, LocalTime.of(11, 0), ScheduleStatus.BOOKED));

        when(scheduleRepository.findByTenantIdAndConsultantIdAndDateBetween(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(startDate), eq(endDate)))
                .thenReturn(schedules);

        Consultant consultant = new Consultant();
        consultant.setId(CONSULTANT_ID);
        consultant.setTenantId(TENANT_ID);
        consultant.setVehiclePlate(null);

        Client client = new Client();
        client.setId(CLIENT_ID);
        client.setTenantId(TENANT_ID);
        client.setVehiclePlate(CLIENT_PLATE);

        when(consultantRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyCollection()))
                .thenReturn(List.of(consultant));
        when(clientRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), anyCollection()))
                .thenReturn(List.of(client));
        when(userRepository.findByTenantIdAndId(anyString(), anyLong())).thenReturn(Optional.empty());
        when(commonCodeService.getCodeName(eq("CONSULTATION_TYPE"), anyString())).thenReturn("개인상담");

        List<ScheduleResponse> result = scheduleService.getUpcomingSchedules(
                CONSULTANT_ID, startDate, endDate, 5);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getConsultantVehiclePlate()).isNull();
        assertThat(result.get(0).getVehiclePlate()).isEqualTo(CLIENT_PLATE);
    }

    private Schedule createSchedule(Long id, LocalDate date, LocalTime startTime, ScheduleStatus status) {
        Schedule schedule = new Schedule();
        schedule.setId(id);
        schedule.setConsultantId(CONSULTANT_ID);
        schedule.setClientId(CLIENT_ID);
        schedule.setDate(date);
        schedule.setStartTime(startTime);
        schedule.setEndTime(startTime.plusHours(1));
        schedule.setStatus(status);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultationType("INDIVIDUAL");
        schedule.setTitle("상담 일정");
        return schedule;
    }

    private User createMockUser(Long id) {
        User user = new User();
        user.setId(id);
        user.setTenantId(TENANT_ID);
        return user;
    }
}
