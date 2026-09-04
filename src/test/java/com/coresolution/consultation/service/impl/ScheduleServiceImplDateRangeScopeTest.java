package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.context.TenantContextHolder;
import java.time.LocalDate;
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

/**
 * 상담사 date-range 조회가 전체 consultant fetch 가 아닌 dateBetween 스코프만 타는지 검증.
 *
 * @author CoreSolution
 * @since 2026-09-04
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl — dateBetween 본인 스코프")
class ScheduleServiceImplDateRangeScopeTest {

    private static final String TENANT_ID = "tenant-date-range-scope-1";
    private static final Long CONSULTANT_ID = 42L;

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private UserRepository userRepository;

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
    @DisplayName("CONSULTANT: findByTenantIdAndConsultantIdAndDateBetween 만 호출 (전체 fetch 금지)")
    void consultant_usesDateBetween_notFullConsultantFetch() {
        LocalDate start = LocalDate.of(2026, 9, 3);
        LocalDate end = LocalDate.of(2026, 9, 4);
        when(scheduleRepository.findByTenantIdAndConsultantIdAndDateBetween(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(start), eq(end)))
                .thenReturn(Collections.emptyList());

        List<Schedule> result = scheduleService.findSchedulesByUserRoleAndDateBetween(
                CONSULTANT_ID, "CONSULTANT", start, end);

        assertThat(result).isEmpty();
        verify(scheduleRepository).findByTenantIdAndConsultantIdAndDateBetween(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(start), eq(end));
        verify(scheduleRepository, never()).findByTenantIdAndConsultantId(anyString(), anyLong());
        verify(scheduleRepository, never()).findByTenantId(anyString());
        verify(scheduleRepository, never()).findExpiredConfirmedSchedules(any(), any(), any());
    }
}
