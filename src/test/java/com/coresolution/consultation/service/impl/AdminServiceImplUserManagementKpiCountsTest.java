package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * AdminServiceImpl#getUserManagementKpiCounts — DB count 경로·tenant 필수.
 *
 * @author CoreSolution
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl — user-management KPI counts")
class AdminServiceImplUserManagementKpiCountsTest {

    @Mock
    private ConsultantClientMappingRepository mappingRepository;

    @Mock
    private ScheduleRepository scheduleRepository;

    @InjectMocks
    private AdminServiceImpl adminService;

    @Test
    @DisplayName("blank tenantId 는 IllegalArgumentException")
    void rejectsBlankTenant() {
        assertThatThrownBy(() -> adminService.getUserManagementKpiCounts(" "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("tenantId");
    }

    @Test
    @DisplayName("세션 tenant 기준 DB COUNT 결과를 맵으로 반환한다")
    void returnsDbCounts() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        when(mappingRepository.countByTenantIdAndStatus(
                        eq("tenant-b"), eq(ConsultantClientMapping.MappingStatus.ACTIVE)))
                .thenReturn(4L);
        when(mappingRepository.countAllByTenantId("tenant-b")).thenReturn(9L);
        when(scheduleRepository.countActiveSchedulesByTenantId("tenant-b")).thenReturn(100L);
        when(scheduleRepository.countByTenantIdAndDate(eq("tenant-b"), eq(today))).thenReturn(7L);

        Map<String, Object> counts = adminService.getUserManagementKpiCounts("tenant-b");

        assertThat(counts)
                .containsEntry("activeMappings", 4L)
                .containsEntry("totalMappings", 9L)
                .containsEntry("totalSchedules", 100L)
                .containsEntry("todaySchedules", 7L);
        verify(mappingRepository).countByTenantIdAndStatus(
                "tenant-b", ConsultantClientMapping.MappingStatus.ACTIVE);
        verify(scheduleRepository).countActiveSchedulesByTenantId("tenant-b");
        verify(scheduleRepository).countByTenantIdAndDate("tenant-b", today);
    }
}
