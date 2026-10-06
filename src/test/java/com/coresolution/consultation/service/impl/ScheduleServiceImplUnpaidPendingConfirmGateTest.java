package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import java.lang.reflect.Method;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 결제 대기 가예약은 입금 전에 확정할 수 있고, 그 시점에는 회기를 차감하지 않는다.
 * 입금 확인 뒤 라벨 일정은 1회만 차감한다. 다른 ACTIVE 매핑으로 차감을 넘기지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleServiceImpl 결제 대기 확정·차감 게이트")
class ScheduleServiceImplUnpaidPendingConfirmGateTest {

    private static final String TENANT_ID = "tenant-pay-gate";
    private static final String OTHER_TENANT_ID = "tenant-other";
    private static final Long SCHEDULE_ID = 9101L;
    private static final Long PENDING_MAPPING_ID = 9102L;
    private static final Long SIBLING_MAPPING_ID = 9103L;
    private static final Long CONSULTANT_ID = 41L;
    private static final Long CLIENT_ID = 42L;

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private TenantAccessControlService accessControlService;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private SessionSyncService sessionSyncService;

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
    @DisplayName("선납 PENDING_PAYMENT 가예약은 확정되고 회기·매핑 저장은 없다")
    void confirmSchedule_advancePending_confirmsWithoutConsume() {
        Schedule schedule = tentativeSchedule();
        ConsultantClientMapping pending = mapping(PENDING_MAPPING_ID, MappingStatus.PENDING_PAYMENT,
                PaymentTimingConstants.ADVANCE, 0, 0);
        pending.setTotalSessions(1);
        stubScheduleAndMapping(schedule, pending);
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        Schedule confirmed = scheduleService.confirmSchedule(SCHEDULE_ID, "입금 전 확정");

        assertThat(confirmed.getStatus()).isEqualTo(ScheduleStatus.CONFIRMED);
        assertThat(confirmed.getSessionSequence()).isEqualTo(1);
        assertThat(pending.getUsedSessions()).isZero();
        assertThat(pending.getRemainingSessions()).isZero();
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        verify(sessionSyncService, never()).syncAfterSessionUsage(any(), any(), any());
        verify(mappingRepository, never()).findByTenantIdAndId(eq(OTHER_TENANT_ID), eq(PENDING_MAPPING_ID));
    }

    @Test
    @DisplayName("사후 카드 결제 대기 가예약도 확정되고 회기는 차감되지 않는다")
    void confirmSchedule_sameDayCardPending_confirmsWithoutConsume() {
        Schedule schedule = tentativeSchedule();
        ConsultantClientMapping pending = mapping(PENDING_MAPPING_ID, MappingStatus.PENDING_PAYMENT,
                PaymentTimingConstants.SAME_DAY_CARD, 0, 0);
        pending.setTotalSessions(1);
        stubScheduleAndMapping(schedule, pending);
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        Schedule confirmed = scheduleService.confirmSchedule(SCHEDULE_ID, "확정");

        assertThat(confirmed.getStatus()).isEqualTo(ScheduleStatus.CONFIRMED);
        assertThat(pending.getUsedSessions()).isZero();
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("상태 변경 경로도 결제 대기 매핑의 CONFIRMED 전이를 거절하지 않는다")
    void updateSchedule_toConfirmed_pendingMapping_gateAllows() throws Exception {
        Schedule schedule = tentativeSchedule();
        ConsultantClientMapping pending = mapping(PENDING_MAPPING_ID, MappingStatus.PENDING_PAYMENT,
                PaymentTimingConstants.ADVANCE, 0, 5);
        stubScheduleAndMapping(schedule, pending);

        Method reject = ScheduleServiceImpl.class.getDeclaredMethod(
                "rejectUnpaidPendingConfirmTransition",
                Schedule.class, ScheduleStatus.class, ScheduleStatus.class);
        reject.setAccessible(true);
        reject.invoke(scheduleService, schedule, schedule.getStatus(), ScheduleStatus.CONFIRMED);

        assertThat(schedule.getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertThat(pending.getRemainingSessions()).isEqualTo(5);
        assertThat(pending.getUsedSessions()).isZero();
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("확정 후 입금 확인 라벨 차감은 1회이고 재호출은 추가 차감이 없다")
    void confirmThenDeposit_deductsOnceAndSecondFinalizeAddsNothing() {
        Schedule schedule = tentativeSchedule();
        ConsultantClientMapping pending = mapping(PENDING_MAPPING_ID, MappingStatus.PENDING_PAYMENT,
                PaymentTimingConstants.ADVANCE, 0, 0);
        pending.setTotalSessions(1);
        pending.setTenantId(TENANT_ID);
        stubScheduleAndMapping(schedule, pending);
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.confirmSchedule(SCHEDULE_ID, "입금 전 확정");
        assertThat(pending.getUsedSessions()).isZero();
        assertThat(schedule.getStatus()).isEqualTo(ScheduleStatus.CONFIRMED);
        assertThat(schedule.getSessionSequence()).isEqualTo(1);

        pending.setStatus(MappingStatus.DEPOSIT_PENDING);
        pending.setRemainingSessions(1);
        stubLabeledDepositQueries(schedule);

        scheduleService.finalizeTentativeSchedulesAfterDepositConfirmed(pending);
        assertThat(pending.getUsedSessions()).isEqualTo(1);
        assertThat(pending.getRemainingSessions()).isZero();

        scheduleService.finalizeTentativeSchedulesAfterDepositConfirmed(pending);
        assertThat(pending.getUsedSessions()).isEqualTo(1);
        assertThat(pending.getRemainingSessions()).isZero();
        verify(mappingRepository, org.mockito.Mockito.times(1)).save(any(ConsultantClientMapping.class));
        verify(sessionSyncService, org.mockito.Mockito.times(1))
                .syncAfterSessionUsage(eq(PENDING_MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID));
    }

    @Test
    @DisplayName("입금 확인으로 이미 차감된 일정을 나중에 확정해도 회기를 다시 차감하지 않는다")
    void depositThenConfirm_doesNotDeductAgain() {
        Schedule schedule = tentativeSchedule();
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setSessionSequence(1);
        ConsultantClientMapping deposited = mapping(PENDING_MAPPING_ID, MappingStatus.ACTIVE,
                PaymentTimingConstants.ADVANCE, 1, 0);
        stubScheduleAndMapping(schedule, deposited);
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        Schedule confirmed = scheduleService.confirmSchedule(SCHEDULE_ID, "입금 후 확정");

        assertThat(confirmed.getStatus()).isEqualTo(ScheduleStatus.CONFIRMED);
        assertThat(deposited.getUsedSessions()).isEqualTo(1);
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("결제 대기 매핑의 회기 차감은 같은 쌍의 다른 ACTIVE 매핑으로 넘어가지 않는다")
    void deduct_pendingMapping_doesNotConsumeSiblingActive() throws Exception {
        Schedule schedule = tentativeSchedule();
        schedule.setStatus(ScheduleStatus.BOOKED);
        ConsultantClientMapping pending = mapping(PENDING_MAPPING_ID, MappingStatus.PENDING_PAYMENT,
                PaymentTimingConstants.ADVANCE, 0, 0);
        ConsultantClientMapping sibling = mapping(SIBLING_MAPPING_ID, MappingStatus.ACTIVE,
                PaymentTimingConstants.ADVANCE, 1, 4);
        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(PENDING_MAPPING_ID)))
                .thenReturn(Optional.of(pending));
        lenient().when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID)))
                .thenReturn(List.of(sibling));

        Method deduct = ScheduleServiceImpl.class.getDeclaredMethod(
                "deductSessionForScheduleIfNeeded", Schedule.class);
        deduct.setAccessible(true);
        deduct.invoke(scheduleService, schedule);

        assertThat(pending.getUsedSessions()).isZero();
        assertThat(sibling.getUsedSessions()).isEqualTo(1);
        assertThat(sibling.getRemainingSessions()).isEqualTo(4);
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        verify(mappingRepository, never()).findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID));
    }

    @Test
    @DisplayName("사후 카드 결제 대기 차감은 usedSessions 를 올리지 않는다")
    void deduct_sameDayCardPending_doesNotIncrementUsedSessions() throws Exception {
        Schedule schedule = tentativeSchedule();
        schedule.setStatus(ScheduleStatus.BOOKED);
        ConsultantClientMapping pending = mapping(PENDING_MAPPING_ID, MappingStatus.PENDING_PAYMENT,
                PaymentTimingConstants.SAME_DAY_CARD, 0, 0);
        ConsultantClientMapping sibling = mapping(SIBLING_MAPPING_ID, MappingStatus.ACTIVE,
                PaymentTimingConstants.ADVANCE, 2, 3);
        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(PENDING_MAPPING_ID)))
                .thenReturn(Optional.of(pending));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID)))
                .thenReturn(List.of(sibling));

        Method deduct = ScheduleServiceImpl.class.getDeclaredMethod(
                "deductSessionForScheduleIfNeeded", Schedule.class);
        deduct.setAccessible(true);
        deduct.invoke(scheduleService, schedule);

        assertThat(pending.getUsedSessions()).isZero();
        assertThat(sibling.getUsedSessions()).isEqualTo(2);
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
    }

    private void stubScheduleAndMapping(Schedule schedule, ConsultantClientMapping pending) {
        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(schedule));
        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(PENDING_MAPPING_ID)))
                .thenReturn(Optional.of(pending));
    }

    private void stubLabeledDepositQueries(Schedule schedule) {
        when(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndStatusAndIsDeletedFalse(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID),
                eq(ScheduleStatus.TENTATIVE_PENDING_PAYMENT)))
                .thenReturn(new ArrayList<>());
        when(scheduleRepository
                .findByTenantIdAndConsultantIdAndClientIdAndSessionSequenceIsNullAndStatusInAndIsDeletedFalse(
                        eq(TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any(Collection.class)))
                .thenReturn(new ArrayList<>());
        when(scheduleRepository
                .findByTenantIdAndConsultantIdAndClientIdAndSessionSequenceIsNotNullAndStatusInAndIsDeletedFalse(
                        eq(TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any(Collection.class)))
                .thenReturn(List.of(schedule));
    }

    private static Schedule tentativeSchedule() {
        Schedule schedule = new Schedule();
        schedule.setId(SCHEDULE_ID);
        schedule.setTenantId(TENANT_ID);
        schedule.setStatus(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultantId(CONSULTANT_ID);
        schedule.setClientId(CLIENT_ID);
        schedule.setMappingId(PENDING_MAPPING_ID);
        schedule.setDate(LocalDate.of(2026, 10, 6));
        schedule.setStartTime(LocalTime.of(10, 0));
        return schedule;
    }

    private static ConsultantClientMapping mapping(Long id, MappingStatus status, String paymentTiming,
            int used, int remaining) {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(id);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStatus(status);
        mapping.setPaymentTiming(paymentTiming);
        mapping.setTotalSessions(used + remaining);
        mapping.setUsedSessions(used);
        mapping.setRemainingSessions(remaining);
        return mapping;
    }
}
