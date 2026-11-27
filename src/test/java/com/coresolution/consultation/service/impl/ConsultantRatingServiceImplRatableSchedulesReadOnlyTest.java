package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantRating;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 평가 가능 상담 목록은 자동 완료가 조회 경로에서 빠진 뒤에도 지난 완료 상담을 돌려주고, 쓰기를 하지 않는다.
 *
 * <p>평가 등록은 COMPLETED 일정만 허용하고, 완료 전환은 상담일지 작성 시점(즉시) 또는 자동 완료 배치에서만
 * 일어난다. 그래서 목록도 COMPLETED 만 대상으로 하며, 지난 BOOKED/CONFIRMED 를 평가 가능으로 보지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("평가 가능 상담 목록 — 지난 완료 상담 반환 · 쓰기 없음")
class ConsultantRatingServiceImplRatableSchedulesReadOnlyTest {

    private static final String TENANT_ID = "tenant-ratable";
    private static final Long CLIENT_ID = 20L;
    private static final Long CONSULTANT_ID = 30L;

    private ScheduleRepository scheduleRepository;
    private ConsultantRatingRepository ratingRepository;
    private UserRepository userRepository;
    private ConsultantRatingServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        scheduleRepository = mock(ScheduleRepository.class);
        ratingRepository = mock(ConsultantRatingRepository.class);
        userRepository = mock(UserRepository.class);
        service = new ConsultantRatingServiceImpl(ratingRepository, scheduleRepository, userRepository,
            new ObjectMapper(), mock(RealTimeStatisticsService.class), mock(BranchService.class),
            mock(UserPersonalDataCacheService.class), mock(PersonalDataEncryptionUtil.class));
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        consultant.setName("상담사");
        consultant.setIsActive(true);
        when(userRepository.findByTenantIdAndId(TENANT_ID, CONSULTANT_ID)).thenReturn(Optional.of(consultant));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("지난(어제) 완료 상담 중 미평가만 반환, 일정 저장 없음")
    void returnsPastCompletedUnrated_withoutWrites() {
        Schedule yesterday = completed(1L, LocalDate.now().minusDays(1));
        Schedule rated = completed(2L, LocalDate.now().minusDays(2));
        when(scheduleRepository.findByTenantIdAndClientIdAndStatus(TENANT_ID, CLIENT_ID, ScheduleStatus.COMPLETED))
            .thenReturn(List.of(yesterday, rated));
        when(ratingRepository.existsByTenantIdAndScheduleIdAndClientIdAndStatus(TENANT_ID, 1L, CLIENT_ID,
            ConsultantRating.RatingStatus.ACTIVE)).thenReturn(false);
        when(ratingRepository.existsByTenantIdAndScheduleIdAndClientIdAndStatus(TENANT_ID, 2L, CLIENT_ID,
            ConsultantRating.RatingStatus.ACTIVE)).thenReturn(true);

        List<Map<String, Object>> result = service.getRatableSchedules(CLIENT_ID);

        assertThat(result).hasSize(1);
        assertThat(result.get(0)).containsEntry("scheduleId", 1L).containsEntry("consultantId", CONSULTANT_ID);
        verify(scheduleRepository, never()).save(any());
        verify(scheduleRepository, never()).findByDateBeforeAndStatus(any(), any(), any());
        verify(scheduleRepository, never()).findExpiredConfirmedSchedules(any(), any(), any());
        verify(ratingRepository, never()).save(any());
    }

    private static Schedule completed(Long id, LocalDate date) {
        Schedule s = new Schedule();
        s.setId(id);
        s.setTenantId(TENANT_ID);
        s.setDate(date);
        s.setStartTime(LocalTime.of(10, 0));
        s.setEndTime(LocalTime.of(10, 50));
        s.setStatus(ScheduleStatus.COMPLETED);
        s.setConsultantId(CONSULTANT_ID);
        s.setClientId(CLIENT_ID);
        return s;
    }
}
