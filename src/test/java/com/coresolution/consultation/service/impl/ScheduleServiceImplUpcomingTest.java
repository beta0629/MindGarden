package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.dto.ScheduleResponse;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.core.context.TenantContextHolder;

/**
 * ScheduleService 다가오는 상담 조회 테스트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-03-09
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleService 다가오는 상담 조회 테스트")
class ScheduleServiceImplUpcomingTest {

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CommonCodeService commonCodeService;

    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    private static final String TEST_TENANT_ID = "test-tenant-uuid";
    private static final Long TEST_CONSULTANT_ID = 1L;
    private static final Long TEST_CLIENT_ID = 2L;

    /**
     * Mockito eq(Long)와 제네릭 Repository 메서드 조합 시 매칭이 어긋나는 환경 대비 — id로 분기한다.
     */
    private void stubUserFindByTenantAndId(User mockConsultant, User mockClient) {
        when(userRepository.findByTenantIdAndId(anyString(), anyLong())).thenAnswer(inv -> {
            long id = ((Number) inv.getArgument(1)).longValue();
            if (id == TEST_CONSULTANT_ID) {
                return Optional.of(mockConsultant);
            }
            if (id == TEST_CLIENT_ID) {
                return Optional.of(mockClient);
            }
            return Optional.<User>empty();
        });
    }

    /** User Mockito 매칭 이슈 회피: id 기준으로 복호화 이름 스텁 */
    private void stubDecryptedNamesByUserId() {
        when(userPersonalDataCacheService.getDecryptedUserData(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            Map<String, String> m = new HashMap<>();
            if (TEST_CONSULTANT_ID.equals(u.getId())) {
                m.put("name", "홍길동");
            } else if (TEST_CLIENT_ID.equals(u.getId())) {
                m.put("name", "김내담");
            }
            return m;
        });
    }

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @Test
    @DisplayName("다가오는 상담 조회 - 정상 케이스")
    void testGetUpcomingSchedules_Success() {
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(7);
        Integer limit = 5;

        List<Schedule> mockSchedules = createMockSchedules(startDate);
        when(scheduleRepository.findByTenantIdAndConsultantIdAndDateBetween(
                eq(TEST_TENANT_ID), eq(TEST_CONSULTANT_ID), eq(startDate), eq(endDate)))
                .thenReturn(mockSchedules);

        User mockConsultant = createMockUser(TEST_CONSULTANT_ID, "홍길동");
        User mockClient = createMockUser(TEST_CLIENT_ID, "김내담");
        stubUserFindByTenantAndId(mockConsultant, mockClient);
        stubDecryptedNamesByUserId();

        when(commonCodeService.getCodeName(eq("CONSULTATION_TYPE"), anyString())).thenReturn("개인상담");

        List<ScheduleResponse> result = scheduleService.getUpcomingSchedules(
                TEST_CONSULTANT_ID, startDate, endDate, limit);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("홍길동", result.get(0).getConsultantName());
        assertEquals("김내담", result.get(0).getClientName());
        assertEquals("개인상담", result.get(0).getConsultationType());
    }

    @Test
    @DisplayName("다가오는 상담 조회 - 기본값 적용")
    void testGetUpcomingSchedules_DefaultValues() {
        LocalDate today = LocalDate.now();
        LocalDate defaultEndDate = today.plusDays(7);

        List<Schedule> mockSchedules = createMockSchedules(today);
        when(scheduleRepository.findByTenantIdAndConsultantIdAndDateBetween(
                eq(TEST_TENANT_ID), eq(TEST_CONSULTANT_ID), eq(today), eq(defaultEndDate)))
                .thenReturn(mockSchedules);

        User mockConsultant = createMockUser(TEST_CONSULTANT_ID, "홍길동");
        User mockClient = createMockUser(TEST_CLIENT_ID, "김내담");
        stubUserFindByTenantAndId(mockConsultant, mockClient);
        stubDecryptedNamesByUserId();

        when(commonCodeService.getCodeName(eq("CONSULTATION_TYPE"), anyString())).thenReturn("개인상담");

        List<ScheduleResponse> result = scheduleService.getUpcomingSchedules(
                TEST_CONSULTANT_ID, null, null, null);

        assertNotNull(result);
        assertEquals(2, result.size());
    }

    @Test
    @DisplayName("다가오는 상담 조회 - 테넌트 정보 없음")
    void testGetUpcomingSchedules_NoTenant() {
        TenantContextHolder.clear();

        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(7);

        assertThrows(IllegalStateException.class, () -> {
            scheduleService.getUpcomingSchedules(TEST_CONSULTANT_ID, startDate, endDate, 5);
        });
    }

    @Test
    @DisplayName("다가오는 상담 조회 - 정렬 확인 (날짜/시간 오름차순)")
    void testGetUpcomingSchedules_Sorting() {
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(7);

        List<Schedule> mockSchedules = new ArrayList<>();
        mockSchedules.add(createSchedule(1L, startDate.plusDays(2), LocalTime.of(14, 0), ScheduleStatus.BOOKED));
        mockSchedules.add(createSchedule(2L, startDate, LocalTime.of(10, 0), ScheduleStatus.BOOKED));
        mockSchedules.add(createSchedule(3L, startDate.plusDays(1), LocalTime.of(9, 0), ScheduleStatus.CONFIRMED));

        when(scheduleRepository.findByTenantIdAndConsultantIdAndDateBetween(
                eq(TEST_TENANT_ID), eq(TEST_CONSULTANT_ID), eq(startDate), eq(endDate)))
                .thenReturn(mockSchedules);

        User mockConsultant = createMockUser(TEST_CONSULTANT_ID, "홍길동");
        User mockClient = createMockUser(TEST_CLIENT_ID, "김내담");
        stubUserFindByTenantAndId(mockConsultant, mockClient);
        stubDecryptedNamesByUserId();

        when(commonCodeService.getCodeName(eq("CONSULTATION_TYPE"), anyString())).thenReturn("개인상담");

        List<ScheduleResponse> result = scheduleService.getUpcomingSchedules(
                TEST_CONSULTANT_ID, startDate, endDate, 5);

        assertNotNull(result);
        assertEquals(3, result.size());
        assertEquals(2L, result.get(0).getId());
        assertEquals(3L, result.get(1).getId());
        assertEquals(1L, result.get(2).getId());
    }

    @Test
    @DisplayName("다가오는 상담 조회 - 상태 필터링 (BOOKED, CONFIRMED만)")
    void testGetUpcomingSchedules_StatusFiltering() {
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(7);

        List<Schedule> mockSchedules = new ArrayList<>();
        mockSchedules.add(createSchedule(1L, startDate, LocalTime.of(10, 0), ScheduleStatus.BOOKED));
        mockSchedules.add(createSchedule(2L, startDate.plusDays(1), LocalTime.of(11, 0), ScheduleStatus.AVAILABLE));
        mockSchedules.add(createSchedule(3L, startDate.plusDays(2), LocalTime.of(14, 0), ScheduleStatus.CONFIRMED));
        mockSchedules.add(createSchedule(4L, startDate.plusDays(3), LocalTime.of(15, 0), ScheduleStatus.CANCELLED));
        mockSchedules.add(createSchedule(5L, startDate.plusDays(4), LocalTime.of(16, 0), ScheduleStatus.COMPLETED));

        when(scheduleRepository.findByTenantIdAndConsultantIdAndDateBetween(
                eq(TEST_TENANT_ID), eq(TEST_CONSULTANT_ID), eq(startDate), eq(endDate)))
                .thenReturn(mockSchedules);

        User mockConsultant = createMockUser(TEST_CONSULTANT_ID, "홍길동");
        User mockClient = createMockUser(TEST_CLIENT_ID, "김내담");
        stubUserFindByTenantAndId(mockConsultant, mockClient);
        stubDecryptedNamesByUserId();

        when(commonCodeService.getCodeName(eq("CONSULTATION_TYPE"), anyString())).thenReturn("개인상담");

        List<ScheduleResponse> result = scheduleService.getUpcomingSchedules(
                TEST_CONSULTANT_ID, startDate, endDate, 10);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(s -> 
                "BOOKED".equals(s.getStatus()) || "CONFIRMED".equals(s.getStatus())));
    }

    @Test
    @DisplayName("다가오는 상담 조회 - limit 적용")
    void testGetUpcomingSchedules_LimitApplied() {
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(7);
        Integer limit = 2;

        List<Schedule> mockSchedules = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            mockSchedules.add(createSchedule((long) (i + 1), startDate.plusDays(i), 
                    LocalTime.of(10 + i, 0), ScheduleStatus.BOOKED));
        }

        when(scheduleRepository.findByTenantIdAndConsultantIdAndDateBetween(
                eq(TEST_TENANT_ID), eq(TEST_CONSULTANT_ID), eq(startDate), eq(endDate)))
                .thenReturn(mockSchedules);

        User mockConsultant = createMockUser(TEST_CONSULTANT_ID, "홍길동");
        User mockClient = createMockUser(TEST_CLIENT_ID, "김내담");
        stubUserFindByTenantAndId(mockConsultant, mockClient);
        stubDecryptedNamesByUserId();

        when(commonCodeService.getCodeName(eq("CONSULTATION_TYPE"), anyString())).thenReturn("개인상담");

        List<ScheduleResponse> result = scheduleService.getUpcomingSchedules(
                TEST_CONSULTANT_ID, startDate, endDate, limit);

        assertNotNull(result);
        assertEquals(2, result.size());
    }

    private List<Schedule> createMockSchedules(LocalDate startDate) {
        List<Schedule> schedules = new ArrayList<>();
        schedules.add(createSchedule(1L, startDate, LocalTime.of(10, 0), ScheduleStatus.BOOKED));
        schedules.add(createSchedule(2L, startDate.plusDays(1), LocalTime.of(14, 0), ScheduleStatus.CONFIRMED));
        return schedules;
    }

    private Schedule createSchedule(Long id, LocalDate date, LocalTime startTime, ScheduleStatus status) {
        Schedule schedule = new Schedule();
        schedule.setId(id);
        schedule.setConsultantId(TEST_CONSULTANT_ID);
        schedule.setClientId(TEST_CLIENT_ID);
        schedule.setDate(date);
        schedule.setStartTime(startTime);
        schedule.setEndTime(startTime.plusHours(1));
        schedule.setStatus(status);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultationType("INDIVIDUAL");
        schedule.setTitle("상담 일정");
        schedule.setDescription("테스트 상담");
        return schedule;
    }

    private User createMockUser(Long id, String name) {
        User user = new User();
        user.setId(id);
        user.setTenantId(TEST_TENANT_ID);
        return user;
    }
}
