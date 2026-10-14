package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.repository.ScheduleRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 상담사별 매칭 내담자 목록의 lastSessionDate 배치 조회 단위 검증.
 *
 * <p>{@code mapping.getClient()} 는 {@code User} 이므로 lastSessionDate 를 갖지 않는다.
 * SSOT 는 상담사·내담자 COMPLETED 일정 MAX(date) 이다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-07
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminController — mappings/.../clients lastSessionDate")
class AdminControllerClientsByConsultantLastSessionDateTest {

    private static final String TENANT_ID = "tenant-last-session-a";
    private static final Long CONSULTANT_ID = 301L;
    private static final Long CLIENT_ID = 401L;

    @Mock
    private ScheduleRepository scheduleRepository;

    @InjectMocks
    private AdminController controller;

    @Test
    @DisplayName("COMPLETED MAX(date) → clientId 맵으로 반환")
    void loadLastCompletedSessionDates_mapsMaxCompletedDate() {
        LocalDate lastCompleted = LocalDate.of(2026, 10, 1);
        when(scheduleRepository.findMaxCompletedSessionDateByConsultantAndClientIds(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(List.of(CLIENT_ID)),
                eq(ScheduleStatus.COMPLETED)))
                .thenReturn(List.<Object[]>of(new Object[] {CLIENT_ID, lastCompleted}));

        @SuppressWarnings("unchecked")
        Map<Long, LocalDate> result = (Map<Long, LocalDate>) ReflectionTestUtils.invokeMethod(
                controller,
                "loadLastCompletedSessionDatesByConsultantAndClients",
                TENANT_ID,
                CONSULTANT_ID,
                List.of(CLIENT_ID));

        assertThat(result).containsEntry(CLIENT_ID, lastCompleted);
        verify(scheduleRepository).findMaxCompletedSessionDateByConsultantAndClientIds(
                TENANT_ID, CONSULTANT_ID, List.of(CLIENT_ID), ScheduleStatus.COMPLETED);
    }

    @Test
    @DisplayName("clientIds 비어 있으면 스케줄 조회 없이 빈 맵")
    void loadLastCompletedSessionDates_emptyClientIds_returnsEmpty() {
        @SuppressWarnings("unchecked")
        Map<Long, LocalDate> result = (Map<Long, LocalDate>) ReflectionTestUtils.invokeMethod(
                controller,
                "loadLastCompletedSessionDatesByConsultantAndClients",
                TENANT_ID,
                CONSULTANT_ID,
                List.of());

        assertThat(result).isEmpty();
    }
}
