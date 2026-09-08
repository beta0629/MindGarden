package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.core.context.TenantContextHolder;

/**
 * 취소된 스케줄이 가용 슬롯·충돌 검사를 막지 않는지 검증.
 *
 * @author MindGarden
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl — 취소 슬롯 비점유")
class ScheduleServiceImplCancelledSlotNotOccupiedTest {

    private static final String TENANT_ID = "tenant-cancelled-slot-test";
    private static final Long CONSULTANT_ID = 101L;
    private static final Long BRANCH_ID = 7L;
    private static final LocalDate DATE = LocalDate.of(2099, 6, 15);
    private static final LocalTime START = LocalTime.of(10, 0);
    private static final LocalTime END = LocalTime.of(11, 0);

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ConsultantAvailabilityService consultantAvailabilityService;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        // findByConsultantIdAndDate → autoCompleteExpiredSchedules 읽기 경로 스텁
        when(scheduleRepository.findExpiredConfirmedSchedules(anyString(), any(LocalDate.class), any(LocalTime.class)))
                .thenReturn(List.of());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("hasTimeConflict: CANCELLED만 있으면 동일 슬롯 충돌 없음")
    void hasTimeConflict_cancelledDoesNotBlock() {
        when(consultantAvailabilityService.isConsultantOnVacation(
                        eq(CONSULTANT_ID), eq(DATE), eq(START), eq(END)))
                .thenReturn(false);
        when(scheduleRepository.findByTenantIdAndConsultantIdAndDate(TENANT_ID, CONSULTANT_ID, DATE))
                .thenReturn(List.of(schedule(1L, ScheduleStatus.CANCELLED, START, END)));

        assertThat(scheduleService.hasTimeConflict(CONSULTANT_ID, DATE, START, END, null))
                .isFalse();
    }

    @Test
    @DisplayName("hasTimeConflict: BOOKED가 있으면 동일 슬롯 충돌")
    void hasTimeConflict_bookedStillBlocks() {
        when(consultantAvailabilityService.isConsultantOnVacation(
                        eq(CONSULTANT_ID), eq(DATE), eq(START), eq(END)))
                .thenReturn(false);
        when(scheduleRepository.findByTenantIdAndConsultantIdAndDate(TENANT_ID, CONSULTANT_ID, DATE))
                .thenReturn(List.of(schedule(2L, ScheduleStatus.BOOKED, START, END)));

        assertThat(scheduleService.hasTimeConflict(CONSULTANT_ID, DATE, START, END, null))
                .isTrue();
    }

    @Test
    @DisplayName("isScheduleConflict: CANCELLED는 지점 중복 검사에서 제외")
    void isScheduleConflict_cancelledDoesNotBlock() {
        stubConsultantOnBranch();
        when(scheduleRepository.findByTenantIdAndConsultantIdAndDate(TENANT_ID, CONSULTANT_ID, DATE))
                .thenReturn(List.of(schedule(3L, ScheduleStatus.CANCELLED, START, END)));

        LocalDateTime start = DATE.atTime(START);
        LocalDateTime end = DATE.atTime(END);
        assertThat(scheduleService.isScheduleConflict(BRANCH_ID, CONSULTANT_ID, start, end))
                .isFalse();
    }

    @Test
    @DisplayName("isScheduleConflict: CONFIRMED는 지점 중복 검사에서 충돌")
    void isScheduleConflict_confirmedStillBlocks() {
        stubConsultantOnBranch();
        when(scheduleRepository.findByTenantIdAndConsultantIdAndDate(TENANT_ID, CONSULTANT_ID, DATE))
                .thenReturn(List.of(schedule(4L, ScheduleStatus.CONFIRMED, START, END)));

        LocalDateTime start = DATE.atTime(START);
        LocalDateTime end = DATE.atTime(END);
        assertThat(scheduleService.isScheduleConflict(BRANCH_ID, CONSULTANT_ID, start, end))
                .isTrue();
    }

    @Test
    @DisplayName("getAvailableTimeSlots: CANCELLED 슬롯은 가용으로 반환")
    void getAvailableTimeSlots_cancelledSlotAvailable() {
        stubConsultantOnBranch();
        when(scheduleRepository.findByTenantIdAndConsultantIdAndDate(TENANT_ID, CONSULTANT_ID, DATE))
                .thenReturn(List.of(schedule(5L, ScheduleStatus.CANCELLED, START, END)));

        List<Map<String, Object>> slots =
                scheduleService.getAvailableTimeSlots(BRANCH_ID, CONSULTANT_ID, DATE);

        assertThat(slots).anySatisfy(slot -> {
            assertThat(slot.get("startTime")).isEqualTo("10:00");
            assertThat(slot.get("available")).isEqualTo(true);
        });
    }

    @Test
    @DisplayName("getAvailableTimeSlots: BOOKED 슬롯은 가용 목록에서 제외")
    void getAvailableTimeSlots_bookedSlotExcluded() {
        stubConsultantOnBranch();
        when(scheduleRepository.findByTenantIdAndConsultantIdAndDate(TENANT_ID, CONSULTANT_ID, DATE))
                .thenReturn(List.of(schedule(6L, ScheduleStatus.BOOKED, START, END)));

        List<Map<String, Object>> slots =
                scheduleService.getAvailableTimeSlots(BRANCH_ID, CONSULTANT_ID, DATE);

        assertThat(slots)
                .noneMatch(slot -> "10:00".equals(String.valueOf(slot.get("startTime"))));
    }

    private void stubConsultantOnBranch() {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        consultant.setBranchId(BRANCH_ID);
        when(userRepository.findByTenantIdAndId(anyString(), anyLong()))
                .thenReturn(Optional.of(consultant));
    }

    private static Schedule schedule(Long id, ScheduleStatus status, LocalTime start, LocalTime end) {
        Schedule s = new Schedule();
        s.setId(id);
        s.setTenantId(TENANT_ID);
        s.setConsultantId(CONSULTANT_ID);
        s.setDate(DATE);
        s.setStartTime(start);
        s.setEndTime(end);
        s.setStatus(status);
        return s;
    }
}
