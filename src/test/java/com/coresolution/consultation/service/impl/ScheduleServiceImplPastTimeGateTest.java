package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleServiceUserFacingMessages;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.exception.ScheduleMoveToPastException;
import com.coresolution.consultation.repository.NotificationBatchSendLogRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.ImmediateReservationSmsDeferralService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.util.ReservationSmsBusinessHours;
import com.coresolution.consultation.util.ScheduleMoveTargetGate;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * {@link ScheduleServiceImpl#updateSchedule} — 이동 후 시각만으로 과거 판정(KST 고정 시계).
 *
 * <p>현재 = 2026-10-06 14:00 KST. 10/7 11:00 → 10/6 11:00 이동은 거부, 이미 지난 10/6 11:00 일정은
 * 미래로 다시 옮길 수 있어야 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleServiceImpl updateSchedule 이동 후 시각 과거 판정")
class ScheduleServiceImplMoveTargetPastTest {

    private static final String TENANT_ID = "tenant-move-target";
    private static final String OTHER_TENANT_ID = "tenant-move-target-other";
    private static final Long SCHEDULE_ID = 1510L;
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 6);
    private static final LocalTime ELEVEN = LocalTime.of(11, 0);
    private static final LocalTime ELEVEN_FIFTY = LocalTime.of(11, 50);

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private TenantAccessControlService accessControlService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock
    private MobilePushDispatchService mobilePushDispatchService;
    @Mock
    private ScheduleCreatedNotificationHelper scheduleCreatedNotificationHelper;
    @Mock
    private ScheduleChangeNotificationDebounceService scheduleChangeNotificationDebounceService;
    @Mock
    private NotificationBatchSendLogRepository notificationBatchSendLogRepository;
    @Mock
    private ImmediateReservationSmsDeferralService immediateReservationSmsDeferralService;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        SecurityContextHolder.clearContext();
        useKstNow(TODAY.atTime(14, 0));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("10/7 11:00 → 10/6 11:00(현재 14:00 이전) 이동 → ScheduleMoveToPastException, 저장 없음")
    void moveToPast_rejected() {
        stubFind(schedule(ScheduleStatus.CONFIRMED, TODAY.plusDays(1), ELEVEN, ELEVEN_FIFTY));

        assertThatThrownBy(() -> scheduleService.updateSchedule(SCHEDULE_ID, slot(TODAY, ELEVEN, ELEVEN_FIFTY)))
                .isInstanceOf(ScheduleMoveToPastException.class)
                .hasMessage(ScheduleMoveTargetGate.MOVE_TO_PAST_MESSAGE)
                .extracting(e -> ((ScheduleMoveToPastException) e).getErrorCode())
                .isEqualTo(ScheduleMoveTargetGate.MOVE_TO_PAST_ERROR_CODE);
        verify(scheduleRepository, never()).save(any());
    }

    @Test
    @DisplayName("미래 → 미래 이동 → 저장")
    void moveToFuture_allowed() {
        stubFind(schedule(ScheduleStatus.CONFIRMED, TODAY.plusDays(1), ELEVEN, ELEVEN_FIFTY));

        Schedule saved = scheduleService.updateSchedule(SCHEDULE_ID, slot(TODAY.plusDays(2), ELEVEN, ELEVEN_FIFTY));

        assertThat(saved.getDate()).isEqualTo(TODAY.plusDays(2));
        verify(scheduleRepository).save(any(Schedule.class));
    }

    @Test
    @DisplayName("이미 지난 일정(10/6 11:00, 잘못 옮겨진 일정)을 미래로 재이동 → 저장")
    void pastScheduleMovedToFuture_allowed() {
        stubFind(schedule(ScheduleStatus.CONFIRMED, TODAY, ELEVEN, ELEVEN_FIFTY));

        Schedule saved = scheduleService.updateSchedule(SCHEDULE_ID, slot(TODAY.plusDays(1), ELEVEN, ELEVEN_FIFTY));

        assertThat(saved.getDate()).isEqualTo(TODAY.plusDays(1));
        assertThat(saved.getStartTime()).isEqualTo(ELEVEN);
        verify(scheduleRepository).save(any(Schedule.class));
    }

    @Test
    @DisplayName("지난 일정을 오늘 현재 이후 시각(15:00)으로 재이동 → 저장")
    void pastScheduleMovedToLaterToday_allowed() {
        stubFind(schedule(ScheduleStatus.BOOKED, TODAY.minusDays(2), ELEVEN, ELEVEN_FIFTY));

        Schedule saved = scheduleService.updateSchedule(
                SCHEDULE_ID, slot(TODAY, LocalTime.of(15, 0), LocalTime.of(15, 50)));

        assertThat(saved.getStartTime()).isEqualTo(LocalTime.of(15, 0));
    }

    @Test
    @DisplayName("지난 일정을 다른 과거 시각으로 이동 → 거부")
    void pastScheduleMovedToPast_rejected() {
        stubFind(schedule(ScheduleStatus.CONFIRMED, TODAY, ELEVEN, ELEVEN_FIFTY));

        assertThatThrownBy(() -> scheduleService.updateSchedule(
                SCHEDULE_ID, slot(TODAY, LocalTime.of(13, 0), LocalTime.of(13, 50))))
                .isInstanceOf(ScheduleMoveToPastException.class);
        verify(scheduleRepository, never()).save(any());
    }

    @Test
    @DisplayName("COMPLETED 일정은 미래로도 이동 불가 — 기존 문구 유지(과거 이동 예외 아님)")
    void completed_existingErrorUnchanged() {
        stubFind(schedule(ScheduleStatus.COMPLETED, TODAY.minusDays(1), ELEVEN, ELEVEN_FIFTY));

        assertThatThrownBy(() -> scheduleService.updateSchedule(
                SCHEDULE_ID, slot(TODAY.plusDays(1), ELEVEN, ELEVEN_FIFTY)))
                .isInstanceOf(IllegalStateException.class)
                .isNotInstanceOf(ScheduleMoveToPastException.class)
                .hasMessage(ScheduleServiceUserFacingMessages.MSG_COMPLETED_SLOT_CHANGE_DENIED);
        verify(scheduleRepository, never()).save(any());
    }

    @Test
    @DisplayName("CANCELLED 일정은 이동 불가 — 기존 문구 유지")
    void cancelled_existingErrorUnchanged() {
        stubFind(schedule(ScheduleStatus.CANCELLED, TODAY.plusDays(1), ELEVEN, ELEVEN_FIFTY));

        assertThatThrownBy(() -> scheduleService.updateSchedule(
                SCHEDULE_ID, slot(TODAY.plusDays(2), ELEVEN, ELEVEN_FIFTY)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(ScheduleServiceUserFacingMessages.MSG_CANCELLED_SLOT_CHANGE_DENIED);
    }

    @Test
    @DisplayName("KST 경계 — 현재 1분 전 거부, 현재 시각·1분 후 허용")
    void kstBoundary_aroundNow() {
        stubFind(schedule(ScheduleStatus.CONFIRMED, TODAY.plusDays(1), ELEVEN, ELEVEN_FIFTY));
        assertThatThrownBy(() -> scheduleService.updateSchedule(
                SCHEDULE_ID, slot(TODAY, LocalTime.of(13, 59), LocalTime.of(14, 49))))
                .isInstanceOf(ScheduleMoveToPastException.class);

        stubFind(schedule(ScheduleStatus.CONFIRMED, TODAY.plusDays(1), ELEVEN, ELEVEN_FIFTY));
        assertThat(scheduleService.updateSchedule(
                SCHEDULE_ID, slot(TODAY, LocalTime.of(14, 0), LocalTime.of(14, 50))).getStartTime())
                .isEqualTo(LocalTime.of(14, 0));

        stubFind(schedule(ScheduleStatus.CONFIRMED, TODAY.plusDays(1), ELEVEN, ELEVEN_FIFTY));
        assertThat(scheduleService.updateSchedule(
                SCHEDULE_ID, slot(TODAY, LocalTime.of(14, 1), LocalTime.of(14, 51))).getStartTime())
                .isEqualTo(LocalTime.of(14, 1));
    }

    @Test
    @DisplayName("자정 경계(23:59:30 KST) — 당일 23:30 거부, 다음날 00:00 허용")
    void kstBoundary_midnight() {
        useKstNow(TODAY.atTime(23, 59, 30));
        stubFind(schedule(ScheduleStatus.CONFIRMED, TODAY.plusDays(3), ELEVEN, ELEVEN_FIFTY));
        assertThatThrownBy(() -> scheduleService.updateSchedule(
                SCHEDULE_ID, slot(TODAY, LocalTime.of(23, 30), LocalTime.of(23, 59))))
                .isInstanceOf(ScheduleMoveToPastException.class);

        stubFind(schedule(ScheduleStatus.CONFIRMED, TODAY.plusDays(3), ELEVEN, ELEVEN_FIFTY));
        assertThat(scheduleService.updateSchedule(
                SCHEDULE_ID, slot(TODAY.plusDays(1), LocalTime.MIDNIGHT, LocalTime.of(0, 50))).getDate())
                .isEqualTo(TODAY.plusDays(1));
    }

    @Test
    @DisplayName("자정 직후(00:00:30 KST) — 전날 23:30 거부")
    void kstBoundary_justAfterMidnight() {
        useKstNow(TODAY.plusDays(1).atTime(0, 0, 30));
        stubFind(schedule(ScheduleStatus.CONFIRMED, TODAY.plusDays(3), ELEVEN, ELEVEN_FIFTY));

        assertThatThrownBy(() -> scheduleService.updateSchedule(
                SCHEDULE_ID, slot(TODAY, LocalTime.of(23, 30), LocalTime.of(23, 59))))
                .isInstanceOf(ScheduleMoveToPastException.class);
    }

    @Test
    @DisplayName("진행 중 일정 종료만 늘림(리사이즈, 새 종료 미래) → 허용 / 새 종료 과거 → 거부")
    void endOnlyResize_judgedByNewEnd() {
        stubFind(schedule(ScheduleStatus.CONFIRMED, TODAY, LocalTime.of(13, 30), LocalTime.of(14, 20)));
        assertThat(scheduleService.updateSchedule(SCHEDULE_ID, endOnly(LocalTime.of(14, 40))).getEndTime())
                .isEqualTo(LocalTime.of(14, 40));

        stubFind(schedule(ScheduleStatus.CONFIRMED, TODAY, LocalTime.of(13, 0), LocalTime.of(13, 50)));
        assertThatThrownBy(() -> scheduleService.updateSchedule(SCHEDULE_ID, endOnly(LocalTime.of(13, 40))))
                .isInstanceOf(ScheduleMoveToPastException.class);
    }

    @Test
    @DisplayName("슬롯 변경 없는 지난 일정 수정(제목만) → 과거 판정 생략")
    void pastSchedule_noSlotChange_notJudged() {
        stubFind(schedule(ScheduleStatus.CONFIRMED, TODAY.minusDays(1), ELEVEN, ELEVEN_FIFTY));
        Schedule patch = new Schedule();
        patch.setTitle("memo");

        assertThat(scheduleService.updateSchedule(SCHEDULE_ID, patch).getTitle()).isEqualTo("memo");
    }

    @Test
    @DisplayName("다른 테넌트 컨텍스트 → 일정 조회 불가(EntityNotFound), 저장 없음")
    void otherTenant_rejected() {
        stubFind(schedule(ScheduleStatus.CONFIRMED, TODAY.plusDays(1), ELEVEN, ELEVEN_FIFTY));
        TenantContextHolder.setTenantId(OTHER_TENANT_ID);

        assertThatThrownBy(() -> scheduleService.updateSchedule(
                SCHEDULE_ID, slot(TODAY.plusDays(2), ELEVEN, ELEVEN_FIFTY)))
                .isInstanceOf(EntityNotFoundException.class);
        verify(scheduleRepository, never()).save(any());
    }

    @Test
    @DisplayName("테넌트 접근 검증 실패(권한 없음) → AccessDenied, 과거 판정·저장 전에 차단")
    void tenantAccessDenied_rejectedBeforeMove() {
        stubFind(schedule(ScheduleStatus.CONFIRMED, TODAY.plusDays(1), ELEVEN, ELEVEN_FIFTY));
        doThrow(new AccessDeniedException("denied")).when(accessControlService).validateTenantAccess(TENANT_ID);

        assertThatThrownBy(() -> scheduleService.updateSchedule(SCHEDULE_ID, slot(TODAY, ELEVEN, ELEVEN_FIFTY)))
                .isInstanceOf(AccessDeniedException.class);
        verify(scheduleRepository, never()).save(any());
    }

    @Test
    @DisplayName("requireMoveTargetNotInPast — 과거 거부, null 대상 판정 생략")
    void requireMoveTargetNotInPast_direct() {
        assertThatThrownBy(() -> scheduleService.requireMoveTargetNotInPast(9L, TODAY.atTime(13, 0)))
                .isInstanceOf(ScheduleMoveToPastException.class);
        scheduleService.requireMoveTargetNotInPast(9L, TODAY.atTime(15, 0));
        scheduleService.requireMoveTargetNotInPast(9L, null);
    }

    private void useKstNow(LocalDateTime kstNow) {
        scheduleService.useSessionStartClock(Clock.fixed(
                kstNow.atZone(ReservationSmsBusinessHours.ZONE_SEOUL).toInstant(),
                ReservationSmsBusinessHours.ZONE_SEOUL));
    }

    private Schedule schedule(ScheduleStatus status, LocalDate date, LocalTime start, LocalTime end) {
        Schedule existing = new Schedule();
        existing.setId(SCHEDULE_ID);
        existing.setTenantId(TENANT_ID);
        existing.setClientId(10L);
        existing.setConsultantId(20L);
        existing.setStatus(status);
        existing.setDate(date);
        existing.setStartTime(start);
        existing.setEndTime(end);
        return existing;
    }

    private Schedule slot(LocalDate date, LocalTime start, LocalTime end) {
        Schedule patch = new Schedule();
        patch.setDate(date);
        patch.setStartTime(start);
        patch.setEndTime(end);
        return patch;
    }

    private Schedule endOnly(LocalTime end) {
        Schedule patch = new Schedule();
        patch.setEndTime(end);
        return patch;
    }

    private void stubFind(Schedule existing) {
        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(existing));
    }
}
