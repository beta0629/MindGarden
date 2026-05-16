package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import com.coresolution.consultation.constant.ConsultantSessionStatisticsConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionStatisticsGranularity;
import com.coresolution.consultation.dto.response.ConsultantSessionStatisticsResponse;
import com.coresolution.consultation.repository.ScheduleRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ConsultantCompletedSessionStatisticsServiceImpl} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-05-16
 */
@ExtendWith(MockitoExtension.class)
class ConsultantCompletedSessionStatisticsServiceImplTest {

    private static final String TENANT = "t1";
    private static final Long CONSULTANT = 10L;

    @Mock
    private ScheduleRepository scheduleRepository;

    @InjectMocks
    private ConsultantCompletedSessionStatisticsServiceImpl service;

    @Test
    @DisplayName("DAY: 일자별 버킷·총합·이전기간")
    void dayGranularity_sumsAndBuckets() {
        LocalDate start = LocalDate.of(2026, 5, 1);
        LocalDate end = LocalDate.of(2026, 5, 3);

        when(scheduleRepository.countByStatusAndDateBetweenAndConsultantId(
                TENANT, ScheduleStatus.COMPLETED, start, end, CONSULTANT)).thenReturn(5L);
        when(scheduleRepository.countByTenantConsultantStatusAndDateBetweenGroupedByDate(
                TENANT, CONSULTANT, ScheduleStatus.COMPLETED, start, end))
                .thenReturn(java.util.List.of(
                        new Object[] {LocalDate.of(2026, 5, 1), 2L},
                        new Object[] {LocalDate.of(2026, 5, 3), 3L}));
        when(scheduleRepository.countByStatusAndDateBetweenAndConsultantId(
                TENANT, ScheduleStatus.COMPLETED, LocalDate.of(2026, 4, 28), LocalDate.of(2026, 4, 30), CONSULTANT))
                .thenReturn(7L);

        ConsultantSessionStatisticsResponse r = service.aggregateCompletedSessions(
                TENANT, CONSULTANT, start, end, SessionStatisticsGranularity.DAY);

        assertThat(r.getTotalCompleted()).isEqualTo(5L);
        assertThat(r.getPreviousPeriodTotal()).isEqualTo(7L);
        assertThat(r.getBuckets()).hasSize(3);
        assertThat(r.getBuckets().get(0).getLabel()).isEqualTo("2026-05-01");
        assertThat(r.getBuckets().get(0).getCount()).isEqualTo(2L);
        assertThat(r.getBuckets().get(1).getLabel()).isEqualTo("2026-05-02");
        assertThat(r.getBuckets().get(1).getCount()).isZero();
        assertThat(r.getBuckets().get(2).getLabel()).isEqualTo("2026-05-03");
        assertThat(r.getBuckets().get(2).getCount()).isEqualTo(3L);
    }

    @Test
    @DisplayName("WEEK: ISO 주(월요일 라벨)로 합산")
    void weekGranularity_groupsByMonday() {
        LocalDate start = LocalDate.of(2026, 5, 6); // Wed
        LocalDate end = LocalDate.of(2026, 5, 12); // Tue next week

        when(scheduleRepository.countByStatusAndDateBetweenAndConsultantId(
                TENANT, ScheduleStatus.COMPLETED, start, end, CONSULTANT)).thenReturn(4L);
        when(scheduleRepository.countByTenantConsultantStatusAndDateBetweenGroupedByDate(
                TENANT, CONSULTANT, ScheduleStatus.COMPLETED, start, end))
                .thenReturn(java.util.List.of(
                        new Object[] {LocalDate.of(2026, 5, 6), 1L},
                        new Object[] {LocalDate.of(2026, 5, 11), 3L}));
        when(scheduleRepository.countByStatusAndDateBetweenAndConsultantId(
                TENANT, ScheduleStatus.COMPLETED, LocalDate.of(2026, 4, 29), LocalDate.of(2026, 5, 5), CONSULTANT))
                .thenReturn(2L);

        ConsultantSessionStatisticsResponse r = service.aggregateCompletedSessions(
                TENANT, CONSULTANT, start, end, SessionStatisticsGranularity.WEEK);

        assertThat(r.getBuckets()).hasSize(2);
        assertThat(r.getBuckets().get(0).getLabel()).isEqualTo("2026-05-04");
        assertThat(r.getBuckets().get(0).getCount()).isEqualTo(1L);
        assertThat(r.getBuckets().get(1).getLabel()).isEqualTo("2026-05-11");
        assertThat(r.getBuckets().get(1).getCount()).isEqualTo(3L);
    }

    @Test
    @DisplayName("기간 초과 시 IllegalArgumentException")
    void rangeTooLong_throws() {
        LocalDate start = LocalDate.of(2026, 1, 1);
        LocalDate end = start.plusDays(ConsultantSessionStatisticsConstants.MAX_QUERY_RANGE_DAYS_INCLUSIVE);

        assertThatThrownBy(() -> service.aggregateCompletedSessions(
                TENANT, CONSULTANT, start, end, SessionStatisticsGranularity.DAY))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("최대");

        verify(scheduleRepository, never()).countByStatusAndDateBetweenAndConsultantId(
                anyString(), any(), any(), any(), any());
    }
}
