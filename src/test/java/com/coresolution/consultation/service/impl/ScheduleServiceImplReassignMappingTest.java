package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.MappingHistoryEventType;
import com.coresolution.consultation.constant.ScheduleServiceUserFacingMessages;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.dto.ScheduleReassignMappingCandidateResponse;
import com.coresolution.consultation.dto.ScheduleReassignMappingPreviewResponse;
import com.coresolution.consultation.dto.ScheduleReassignMappingResponse;
import com.coresolution.consultation.entity.ClientScheduleNote;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientScheduleNoteRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.ConsultantClientMappingHistoryService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 관리자 일정 배정 변경(회기 정정) 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl 배정 변경(회기 정정)")
class ScheduleServiceImplReassignMappingTest {

    private static final String TENANT_ID = "tenant-reassign-mapping";
    private static final Long SCHEDULE_ID = 501L;
    private static final Long ORIGIN_MAPPING_ID = 100L;
    private static final Long TARGET_MAPPING_ID = 200L;
    private static final Long CONSULTANT_ID = 31L;
    private static final Long CLIENT_ID = 42L;
    private static final Long ACTOR_ID = 7L;

    @Mock private ScheduleRepository scheduleRepository;
    @Mock private TenantAccessControlService accessControlService;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private com.coresolution.consultation.repository.UserRepository userRepository;
    @Mock private com.coresolution.consultation.repository.VacationRepository vacationRepository;
    @Mock private com.coresolution.consultation.repository.BranchRepository branchRepository;
    @Mock private com.coresolution.consultation.service.CommonCodeService commonCodeService;
    @Mock private com.coresolution.consultation.service.ConsultantAvailabilityService consultantAvailabilityService;
    @Mock private SessionSyncService sessionSyncService;
    @Mock private com.coresolution.consultation.service.StatisticsService statisticsService;
    @Mock private com.coresolution.consultation.service.ConsultationMessageService consultationMessageService;
    @Mock private com.coresolution.core.service.DashboardIntegrationService dashboardIntegrationService;
    @Mock private NotificationService notificationService;
    @Mock private MobilePushDispatchService mobilePushDispatchService;
    @Mock private ScheduleCreatedNotificationHelper scheduleCreatedNotificationHelper;
    @Mock private ScheduleChangeNotificationDebounceService scheduleChangeNotificationDebounceService;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock private ConsultantClientMappingHistoryService consultantClientMappingHistoryService;
    @Mock private ConsultationRecordRepository consultationRecordRepository;
    @Mock private ClientScheduleNoteRepository clientScheduleNoteRepository;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    private LocalDate today;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        today = LocalDate.now();
        ReflectionTestUtils.setField(scheduleService, "consultationRecordRepository", consultationRecordRepository);
        ReflectionTestUtils.setField(scheduleService, "clientScheduleNoteRepository", clientScheduleNoteRepository);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("happy path — 원 매핑 복원·대상 차감·양쪽 이력·ACTIVE는 cancelRecommended=false")
    void reassign_happyPath_restoresOriginDeductsTargetAndRecordsHistory() {
        Schedule schedule = consultationSchedule(SCHEDULE_ID, ORIGIN_MAPPING_ID, ScheduleStatus.BOOKED, 1,
                today.plusDays(1), LocalTime.of(10, 0));
        ConsultantClientMapping origin = activeMapping(ORIGIN_MAPPING_ID, 10, 1, 9);
        ConsultantClientMapping target = activeMapping(TARGET_MAPPING_ID, 10, 0, 10);

        stubScheduleLoad(schedule);
        stubMappingLoad(origin);
        stubMappingLoad(target);
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(ORIGIN_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(List.of());
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(TARGET_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(List.of());

        ScheduleReassignMappingResponse response = scheduleService.reassignScheduleMapping(
                SCHEDULE_ID, TARGET_MAPPING_ID, "잘못된 패키지 배정", ACTOR_ID);

        assertThat(schedule.getMappingId()).isEqualTo(TARGET_MAPPING_ID);
        assertThat(schedule.getSessionSequence()).isEqualTo(1);
        assertThat(origin.getUsedSessions()).isZero();
        assertThat(origin.getRemainingSessions()).isEqualTo(10);
        assertThat(target.getUsedSessions()).isEqualTo(1);
        assertThat(target.getRemainingSessions()).isEqualTo(9);
        // ACTIVE + 잔여만 남음 → 취소 권장 아님(결제대기+used=0 일 때만 true)
        assertThat(response.isCancelRecommended()).isFalse();
        assertThat(response.getOriginMappingId()).isEqualTo(ORIGIN_MAPPING_ID);
        assertThat(response.getTargetMappingId()).isEqualTo(TARGET_MAPPING_ID);
        assertThat(response.getSessionSequence()).isEqualTo(1);

        verify(consultantClientMappingHistoryService).record(
                eq(TENANT_ID), eq(ORIGIN_MAPPING_ID), eq(CLIENT_ID), eq(CONSULTANT_ID),
                eq(MappingHistoryEventType.SESSION_REASSIGN_OUT), any(), any(), eq(ACTOR_ID),
                eq("잘못된 패키지 배정"));
        verify(consultantClientMappingHistoryService).record(
                eq(TENANT_ID), eq(TARGET_MAPPING_ID), eq(CLIENT_ID), eq(CONSULTANT_ID),
                eq(MappingHistoryEventType.SESSION_REASSIGN_IN), any(), any(), eq(ACTOR_ID),
                eq("잘못된 패키지 배정"));
        verify(mobilePushDispatchService, never()).dispatchSessionLow(any(), any(), any(), org.mockito.ArgumentMatchers.anyInt());
    }

    @Test
    @DisplayName("미차감 일정 — 원 매핑 잔여 불변, 대상만 차감")
    void reassign_undeducted_doesNotRestoreOrigin() {
        Schedule schedule = consultationSchedule(SCHEDULE_ID, ORIGIN_MAPPING_ID, ScheduleStatus.BOOKED, 2,
                today.plusDays(2), LocalTime.of(11, 0));
        ConsultantClientMapping origin = activeMapping(ORIGIN_MAPPING_ID, 10, 0, 10);
        ConsultantClientMapping target = activeMapping(TARGET_MAPPING_ID, 20, 0, 20);

        stubScheduleLoad(schedule);
        stubMappingLoad(origin);
        stubMappingLoad(target);
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(ORIGIN_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(List.of());
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(TARGET_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(List.of());

        scheduleService.reassignScheduleMapping(SCHEDULE_ID, TARGET_MAPPING_ID, "미차감 정정", ACTOR_ID);

        assertThat(origin.getUsedSessions()).isZero();
        assertThat(origin.getRemainingSessions()).isEqualTo(10);
        assertThat(target.getUsedSessions()).isEqualTo(1);
        assertThat(target.getRemainingSessions()).isEqualTo(19);
        assertThat(schedule.getMappingId()).isEqualTo(TARGET_MAPPING_ID);
        assertThat(schedule.getSessionSequence()).isEqualTo(1);
    }

    @Test
    @DisplayName("검증 실패 — 사유 공백·잔여 부족·동일 매핑")
    void reassign_validationFailures() {
        Schedule schedule = consultationSchedule(SCHEDULE_ID, ORIGIN_MAPPING_ID, ScheduleStatus.BOOKED, 1,
                today.plusDays(1), LocalTime.of(10, 0));
        ConsultantClientMapping origin = activeMapping(ORIGIN_MAPPING_ID, 10, 1, 9);
        ConsultantClientMapping exhaustedTarget = activeMapping(TARGET_MAPPING_ID, 10, 10, 0);

        stubScheduleLoad(schedule);
        stubMappingLoad(origin);
        stubMappingLoad(exhaustedTarget);

        assertThatThrownBy(() -> scheduleService.reassignScheduleMapping(
                SCHEDULE_ID, TARGET_MAPPING_ID, "   ", ACTOR_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(ScheduleServiceUserFacingMessages.MSG_REASSIGN_MAPPING_REASON_REQUIRED);

        assertThatThrownBy(() -> scheduleService.reassignScheduleMapping(
                SCHEDULE_ID, ORIGIN_MAPPING_ID, "같은 매핑", ACTOR_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(ScheduleServiceUserFacingMessages.MSG_REASSIGN_MAPPING_SAME_TARGET);

        assertThatThrownBy(() -> scheduleService.reassignScheduleMapping(
                SCHEDULE_ID, TARGET_MAPPING_ID, "잔여 없음", ACTOR_ID))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(ScheduleServiceUserFacingMessages.MSG_REASSIGN_MAPPING_TARGET_INVALID);
    }

    @Test
    @DisplayName("특이사항 — reassign 후 노트의 mappingId가 대상 매핑으로 동기화")
    void reassign_syncsClientScheduleNoteMappingIdToTarget() {
        Schedule schedule = consultationSchedule(SCHEDULE_ID, ORIGIN_MAPPING_ID, ScheduleStatus.BOOKED, 1,
                today.plusDays(1), LocalTime.of(10, 0));
        ConsultantClientMapping origin = activeMapping(ORIGIN_MAPPING_ID, 10, 1, 9);
        ConsultantClientMapping target = activeMapping(TARGET_MAPPING_ID, 10, 0, 10);
        ClientScheduleNote note = new ClientScheduleNote();
        note.setId(77L);
        note.setTenantId(TENANT_ID);
        note.setScheduleId(SCHEDULE_ID);
        note.setMappingId(ORIGIN_MAPPING_ID);
        note.setIsDeleted(false);

        stubScheduleLoad(schedule);
        stubMappingLoad(origin);
        stubMappingLoad(target);
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(ORIGIN_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(List.of());
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(TARGET_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(List.of());
        when(clientScheduleNoteRepository.listBySchedule(eq(TENANT_ID), eq(SCHEDULE_ID), eq(false)))
                .thenReturn(List.of(note));
        when(clientScheduleNoteRepository.save(any(ClientScheduleNote.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.reassignScheduleMapping(SCHEDULE_ID, TARGET_MAPPING_ID, "메모 mapping 동기화", ACTOR_ID);

        assertThat(note.getMappingId()).isEqualTo(TARGET_MAPPING_ID);
        verify(clientScheduleNoteRepository).listBySchedule(TENANT_ID, SCHEDULE_ID, false);
        verify(clientScheduleNoteRepository).save(note);
    }

    @Test
    @DisplayName("과거(완료) 일정도 배정 변경 허용")
    void reassign_allowsCompletedPastSchedule() {
        Schedule schedule = consultationSchedule(SCHEDULE_ID, ORIGIN_MAPPING_ID, ScheduleStatus.COMPLETED, 1,
                today.minusDays(3), LocalTime.of(9, 0));
        ConsultantClientMapping origin = activeMapping(ORIGIN_MAPPING_ID, 10, 1, 9);
        ConsultantClientMapping target = activeMapping(TARGET_MAPPING_ID, 10, 0, 10);

        stubScheduleLoad(schedule);
        stubMappingLoad(origin);
        stubMappingLoad(target);
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(ORIGIN_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(List.of());
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(TARGET_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(List.of());

        ScheduleReassignMappingResponse response = scheduleService.reassignScheduleMapping(
                SCHEDULE_ID, TARGET_MAPPING_ID, "완료 일정 정정", ACTOR_ID);

        assertThat(response.getScheduleId()).isEqualTo(SCHEDULE_ID);
        assertThat(schedule.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
        assertThat(schedule.getMappingId()).isEqualTo(TARGET_MAPPING_ID);
        assertThat(response.isCancelRecommended()).isFalse();
    }

    @Test
    @DisplayName("cancelRecommended — PENDING_PAYMENT + used=0(비어 있음) 이면 true")
    void reassign_cancelRecommended_whenPendingOriginBecomesEmpty() {
        // 결제대기 매핑은 회기 차감 대상이 아니므로 used=0인 채 일정만 붙어 있던 원 배정
        Schedule schedule = consultationSchedule(SCHEDULE_ID, ORIGIN_MAPPING_ID, ScheduleStatus.BOOKED, 1,
                today.plusDays(1), LocalTime.of(10, 0));
        ConsultantClientMapping origin = activeMapping(ORIGIN_MAPPING_ID, 10, 0, 10);
        origin.setStatus(MappingStatus.PENDING_PAYMENT);
        ConsultantClientMapping target = activeMapping(TARGET_MAPPING_ID, 10, 0, 10);

        stubScheduleLoad(schedule);
        stubMappingLoad(origin);
        stubMappingLoad(target);
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(ORIGIN_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(List.of());
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(TARGET_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(List.of());

        ScheduleReassignMappingResponse response = scheduleService.reassignScheduleMapping(
                SCHEDULE_ID, TARGET_MAPPING_ID, "결제대기 원배정 비움", ACTOR_ID);

        assertThat(origin.getUsedSessions()).isZero();
        assertThat(origin.getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(response.isCancelRecommended()).isTrue();
    }

    @Test
    @DisplayName("cancelRecommended — PENDING_PAYMENT 라도 used>0 이면 false")
    void reassign_cancelRecommended_falseWhenPendingOriginStillUsed() {
        Schedule schedule = consultationSchedule(SCHEDULE_ID, ORIGIN_MAPPING_ID, ScheduleStatus.BOOKED, 1,
                today.plusDays(1), LocalTime.of(10, 0));
        // 결제대기는 복원 대상이 아니므로 used는 이동 후에도 유지
        ConsultantClientMapping origin = activeMapping(ORIGIN_MAPPING_ID, 10, 2, 8);
        origin.setStatus(MappingStatus.PENDING_PAYMENT);
        ConsultantClientMapping target = activeMapping(TARGET_MAPPING_ID, 10, 0, 10);

        stubScheduleLoad(schedule);
        stubMappingLoad(origin);
        stubMappingLoad(target);
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(ORIGIN_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(List.of());
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(TARGET_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(List.of());

        ScheduleReassignMappingResponse response = scheduleService.reassignScheduleMapping(
                SCHEDULE_ID, TARGET_MAPPING_ID, "결제대기지만 잔여 사용 있음", ACTOR_ID);

        assertThat(origin.getUsedSessions()).isEqualTo(2);
        assertThat(response.isCancelRecommended()).isFalse();
    }

    @Test
    @DisplayName("후보 — 적격·부적격·원 배정 모두 반환, selectable/blockReason/current")
    void candidates_includeEligibleIneligibleAndCurrentWithReasons() {
        Schedule schedule = consultationSchedule(SCHEDULE_ID, ORIGIN_MAPPING_ID, ScheduleStatus.BOOKED, 1,
                today.plusDays(1), LocalTime.of(10, 0));
        ConsultantClientMapping origin = activeMapping(ORIGIN_MAPPING_ID, 10, 1, 9);
        ConsultantClientMapping activeTarget = activeMapping(TARGET_MAPPING_ID, 20, 0, 20);
        ConsultantClientMapping initial = activeMapping(300L, 1, 0, 1);
        ConsultantClientMapping pending = activeMapping(400L, 10, 0, 10);
        pending.setStatus(MappingStatus.PENDING_PAYMENT);
        ConsultantClientMapping suspended = activeMapping(500L, 10, 0, 10);
        suspended.setStatus(MappingStatus.SUSPENDED);
        ConsultantClientMapping remZero = activeMapping(600L, 10, 10, 0);
        ConsultantClientMapping exhausted = activeMapping(700L, 10, 10, 0);
        exhausted.setStatus(MappingStatus.SESSIONS_EXHAUSTED);
        ConsultantClientMapping refunded = activeMapping(800L, 10, 10, 0);
        refunded.setStatus(MappingStatus.CANCELLED);
        refunded.setPaymentStatus(ConsultantClientMapping.PaymentStatus.REFUNDED);

        stubScheduleLoad(schedule);
        when(mappingRepository.findAllByTenantIdAndConsultantIdAndClientIdOrderByCreatedAtDesc(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID)))
                .thenReturn(List.of(
                        origin, activeTarget, initial, pending, suspended, remZero, exhausted, refunded));

        List<ScheduleReassignMappingCandidateResponse> candidates =
                scheduleService.findReassignMappingCandidates(SCHEDULE_ID);

        assertThat(candidates).extracting(ScheduleReassignMappingCandidateResponse::getMappingId)
                .containsExactlyInAnyOrder(
                        ORIGIN_MAPPING_ID, TARGET_MAPPING_ID, 300L, 400L, 500L, 600L, 700L, 800L);

        ScheduleReassignMappingCandidateResponse current = byMappingId(candidates, ORIGIN_MAPPING_ID);
        assertThat(current.isCurrent()).isTrue();
        assertThat(current.isSelectable()).isFalse();
        assertThat(current.getBlockReason())
                .isEqualTo(ScheduleServiceUserFacingMessages.MSG_REASSIGN_CANDIDATE_CURRENT);

        ScheduleReassignMappingCandidateResponse twenty = byMappingId(candidates, TARGET_MAPPING_ID);
        assertThat(twenty.isSelectable()).isTrue();
        assertThat(twenty.isCurrent()).isFalse();
        assertThat(twenty.getBlockReason()).isNull();
        assertThat(twenty.getTotalSessions()).isEqualTo(20);
        assertThat(twenty.getUsedSessions()).isZero();
        assertThat(twenty.getSessionSequence()).isEqualTo(1);

        ScheduleReassignMappingCandidateResponse initialCandidate = byMappingId(candidates, 300L);
        assertThat(initialCandidate.isSelectable()).isTrue();
        assertThat(initialCandidate.getBlockReason()).isNull();

        assertThat(byMappingId(candidates, 400L).getBlockReason())
                .isEqualTo(ScheduleServiceUserFacingMessages.MSG_REASSIGN_CANDIDATE_PENDING_PAYMENT);
        assertThat(byMappingId(candidates, 400L).isSelectable()).isFalse();

        assertThat(byMappingId(candidates, 500L).getBlockReason())
                .isEqualTo(ScheduleServiceUserFacingMessages.MSG_REASSIGN_CANDIDATE_SUSPENDED);
        assertThat(byMappingId(candidates, 500L).isSelectable()).isFalse();

        assertThat(byMappingId(candidates, 600L).getBlockReason())
                .isEqualTo(ScheduleServiceUserFacingMessages.MSG_REASSIGN_CANDIDATE_NO_REMAINING);
        assertThat(byMappingId(candidates, 600L).isSelectable()).isFalse();

        assertThat(byMappingId(candidates, 700L).getBlockReason())
                .isEqualTo(ScheduleServiceUserFacingMessages.MSG_REASSIGN_CANDIDATE_EXHAUSTED);
        assertThat(byMappingId(candidates, 700L).isSelectable()).isFalse();

        assertThat(byMappingId(candidates, 800L).getBlockReason())
                .isEqualTo(ScheduleServiceUserFacingMessages.MSG_REASSIGN_CANDIDATE_REFUNDED);
        assertThat(byMappingId(candidates, 800L).isSelectable()).isFalse();
    }

    @Test
    @DisplayName("preview — 복원·차감 후 수치, ACTIVE는 cancelRecommended=false, DB 미변경")
    void preview_computesAfterWithoutPersisting() {
        Schedule schedule = consultationSchedule(SCHEDULE_ID, ORIGIN_MAPPING_ID, ScheduleStatus.BOOKED, 1,
                today.plusDays(1), LocalTime.of(10, 0));
        ConsultantClientMapping origin = activeMapping(ORIGIN_MAPPING_ID, 10, 1, 9);
        ConsultantClientMapping target = activeMapping(TARGET_MAPPING_ID, 30, 0, 30);

        stubScheduleLoad(schedule);
        stubMappingLoad(origin);
        stubMappingLoad(target);
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(TARGET_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(List.of());

        ScheduleReassignMappingPreviewResponse preview =
                scheduleService.previewReassignMapping(SCHEDULE_ID, TARGET_MAPPING_ID);

        assertThat(preview.isSessionWouldRestoreOnOrigin()).isTrue();
        assertThat(preview.getOriginRemainingAfter()).isEqualTo(10);
        assertThat(preview.getOriginUsedAfter()).isZero();
        assertThat(preview.getTargetRemainingAfter()).isEqualTo(29);
        assertThat(preview.getTargetUsedAfter()).isEqualTo(1);
        assertThat(preview.getPlannedSessionSequence()).isEqualTo(1);
        assertThat(preview.isCancelRecommended()).isFalse();
        assertThat(schedule.getMappingId()).isEqualTo(ORIGIN_MAPPING_ID);
        assertThat(schedule.getSessionSequence()).isEqualTo(1);
        assertThat(origin.getRemainingSessions()).isEqualTo(9);
        assertThat(target.getRemainingSessions()).isEqualTo(30);
        verify(mappingRepository, never()).save(any());
        verify(scheduleRepository, never()).save(any());
    }

    @Test
    @DisplayName("preview — PENDING_PAYMENT + usedAfter=0 이면 cancelRecommended=true")
    void preview_cancelRecommended_whenPendingOriginWouldBeEmpty() {
        Schedule schedule = consultationSchedule(SCHEDULE_ID, ORIGIN_MAPPING_ID, ScheduleStatus.BOOKED, 1,
                today.plusDays(1), LocalTime.of(10, 0));
        ConsultantClientMapping origin = activeMapping(ORIGIN_MAPPING_ID, 10, 0, 10);
        origin.setStatus(MappingStatus.PENDING_PAYMENT);
        ConsultantClientMapping target = activeMapping(TARGET_MAPPING_ID, 30, 0, 30);

        stubScheduleLoad(schedule);
        stubMappingLoad(origin);
        stubMappingLoad(target);
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(TARGET_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(List.of());

        ScheduleReassignMappingPreviewResponse preview =
                scheduleService.previewReassignMapping(SCHEDULE_ID, TARGET_MAPPING_ID);

        assertThat(preview.isSessionWouldRestoreOnOrigin()).isFalse();
        assertThat(preview.getOriginUsedAfter()).isZero();
        assertThat(preview.isCancelRecommended()).isTrue();
        verify(mappingRepository, never()).save(any());
        verify(scheduleRepository, never()).save(any());
    }

    @Test
    @DisplayName("preview — PENDING_PAYMENT 라도 usedAfter>0 이면 cancelRecommended=false")
    void preview_cancelRecommended_falseWhenPendingOriginWouldRemainUsed() {
        Schedule schedule = consultationSchedule(SCHEDULE_ID, ORIGIN_MAPPING_ID, ScheduleStatus.BOOKED, 1,
                today.plusDays(1), LocalTime.of(10, 0));
        ConsultantClientMapping origin = activeMapping(ORIGIN_MAPPING_ID, 10, 2, 8);
        origin.setStatus(MappingStatus.PENDING_PAYMENT);
        ConsultantClientMapping target = activeMapping(TARGET_MAPPING_ID, 30, 0, 30);

        stubScheduleLoad(schedule);
        stubMappingLoad(origin);
        stubMappingLoad(target);
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(TARGET_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(List.of());

        ScheduleReassignMappingPreviewResponse preview =
                scheduleService.previewReassignMapping(SCHEDULE_ID, TARGET_MAPPING_ID);

        assertThat(preview.isSessionWouldRestoreOnOrigin()).isFalse();
        assertThat(preview.getOriginUsedAfter()).isEqualTo(2);
        assertThat(preview.isCancelRecommended()).isFalse();
    }

    @ParameterizedTest
    @ValueSource(ints = {10, 20, 30})
    @DisplayName("10·20·30회기 패키지 — 대상 매핑 회차 날짜순 재번호(빈 번호 없음)")
    void reassign_renumbersTargetWithoutGapsForPackageSizes(int totalSessions) {
        Schedule existingOnTarget = consultationSchedule(900L, TARGET_MAPPING_ID, ScheduleStatus.COMPLETED, 1,
                today.minusDays(2), LocalTime.of(9, 0));
        Schedule moving = consultationSchedule(SCHEDULE_ID, ORIGIN_MAPPING_ID, ScheduleStatus.BOOKED, 1,
                today.plusDays(1), LocalTime.of(14, 0));
        ConsultantClientMapping origin = activeMapping(ORIGIN_MAPPING_ID, totalSessions, 1, totalSessions - 1);
        ConsultantClientMapping target = activeMapping(TARGET_MAPPING_ID, totalSessions, 1, totalSessions - 1);

        stubScheduleLoad(moving);
        stubMappingLoad(origin);
        stubMappingLoad(target);
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(ORIGIN_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenReturn(List.of());
        when(scheduleRepository.findDeductedConsultationSchedulesForMapping(
                eq(TENANT_ID), eq(TARGET_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any()))
                .thenAnswer(inv -> {
                    if (TARGET_MAPPING_ID.equals(moving.getMappingId())) {
                        return List.of(existingOnTarget, moving);
                    }
                    return List.of(existingOnTarget);
                });

        ScheduleReassignMappingResponse response = scheduleService.reassignScheduleMapping(
                SCHEDULE_ID, TARGET_MAPPING_ID, "회차 재번호 " + totalSessions, ACTOR_ID);

        assertThat(existingOnTarget.getSessionSequence()).isEqualTo(1);
        assertThat(moving.getSessionSequence()).isEqualTo(2);
        assertThat(response.getSessionSequence()).isEqualTo(2);
        assertThat(target.getTotalSessions()).isEqualTo(totalSessions);
        assertThat(IntStream.of(1, 2).boxed()).containsExactly(1, 2);
        verify(scheduleRepository, atLeastOnce()).save(any(Schedule.class));
        verify(sessionSyncService, times(1)).syncAfterSessionUsage(
                eq(TARGET_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID));
    }

    private static ScheduleReassignMappingCandidateResponse byMappingId(
            List<ScheduleReassignMappingCandidateResponse> candidates, Long mappingId) {
        return candidates.stream()
                .filter(c -> mappingId.equals(c.getMappingId()))
                .findFirst()
                .orElseThrow();
    }

    private void stubScheduleLoad(Schedule schedule) {
        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(schedule.getId())))
                .thenReturn(Optional.of(schedule));
    }

    private void stubMappingLoad(ConsultantClientMapping mapping) {
        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(mapping.getId())))
                .thenReturn(Optional.of(mapping));
    }

    private ConsultantClientMapping activeMapping(Long id, int total, int used, int remaining) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(id);
        mapping.setTenantId(TENANT_ID);
        mapping.setConsultant(user(CONSULTANT_ID));
        mapping.setClient(user(CLIENT_ID));
        mapping.setTotalSessions(total);
        mapping.setUsedSessions(used);
        mapping.setRemainingSessions(remaining);
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setPackageName(total + "회기 패키지");
        return mapping;
    }

    private Schedule consultationSchedule(
            Long id, Long mappingId, ScheduleStatus status, Integer sequence, LocalDate date, LocalTime start) {
        Schedule schedule = new Schedule();
        schedule.setId(id);
        schedule.setTenantId(TENANT_ID);
        schedule.setStatus(status);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultantId(CONSULTANT_ID);
        schedule.setClientId(CLIENT_ID);
        schedule.setMappingId(mappingId);
        schedule.setSessionSequence(sequence);
        schedule.setDate(date);
        schedule.setStartTime(start);
        schedule.setEndTime(start.plusMinutes(50));
        schedule.setIsDeleted(false);
        return schedule;
    }

    private static User user(Long id) {
        User user = new User();
        user.setId(id);
        return user;
    }
}
