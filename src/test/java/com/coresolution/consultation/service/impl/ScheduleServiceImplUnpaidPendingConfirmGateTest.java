package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.constant.ScheduleServiceUserFacingMessages;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import java.lang.reflect.Method;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 결제 대기 매핑은 일정 확정·다른 매핑으로의 회기 차감을 하지 않는다.
 * 사후 카드 가예약 생성 정책은 바꾸지 않는다.
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
    @DisplayName("선납 PENDING_PAYMENT 일정은 확정하지 않고 회기를 차감하지 않는다")
    void confirmSchedule_advancePending_rejectedWithoutConsume() {
        Schedule schedule = tentativeSchedule();
        ConsultantClientMapping pending = mapping(PENDING_MAPPING_ID, MappingStatus.PENDING_PAYMENT,
                PaymentTimingConstants.ADVANCE, 0, 0);
        stubScheduleAndMapping(schedule, pending);

        assertThatThrownBy(() -> scheduleService.confirmSchedule(SCHEDULE_ID, "입금 확인 완료"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(ScheduleServiceUserFacingMessages.MSG_UNPAID_PENDING_SCHEDULE_CONFIRM_DENIED);

        assertThat(schedule.getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertThat(pending.getUsedSessions()).isZero();
        verify(scheduleRepository, never()).save(any(Schedule.class));
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        verify(mappingRepository).findByTenantIdAndId(eq(TENANT_ID), eq(PENDING_MAPPING_ID));
        verify(mappingRepository, never()).findByTenantIdAndId(eq(OTHER_TENANT_ID), eq(PENDING_MAPPING_ID));
    }

    @Test
    @DisplayName("사후 카드 결제 대기도 확정 API는 거절한다")
    void confirmSchedule_sameDayCardPending_rejected() {
        Schedule schedule = tentativeSchedule();
        ConsultantClientMapping pending = mapping(PENDING_MAPPING_ID, MappingStatus.PENDING_PAYMENT,
                PaymentTimingConstants.SAME_DAY_CARD, 0, 0);
        stubScheduleAndMapping(schedule, pending);

        assertThatThrownBy(() -> scheduleService.confirmSchedule(SCHEDULE_ID, "확정"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(ScheduleServiceUserFacingMessages.MSG_UNPAID_PENDING_SCHEDULE_CONFIRM_DENIED);

        assertThat(pending.getUsedSessions()).isZero();
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("상태 변경으로 CONFIRMED 전환도 결제 대기 매핑이면 저장하지 않는다")
    void updateSchedule_toConfirmed_pendingMapping_rejected() {
        Schedule schedule = tentativeSchedule();
        ConsultantClientMapping pending = mapping(PENDING_MAPPING_ID, MappingStatus.PENDING_PAYMENT,
                PaymentTimingConstants.ADVANCE, 0, 5);
        stubScheduleAndMapping(schedule, pending);
        Schedule patch = new Schedule();
        patch.setStatus(ScheduleStatus.CONFIRMED);

        assertThatThrownBy(() -> scheduleService.updateSchedule(SCHEDULE_ID, patch))
                .isInstanceOf(IllegalStateException.class);

        assertThat(schedule.getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertThat(pending.getRemainingSessions()).isEqualTo(5);
        assertThat(pending.getUsedSessions()).isZero();
        verify(scheduleRepository, never()).save(any(Schedule.class));
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

    private static Schedule tentativeSchedule() {
        Schedule schedule = new Schedule();
        schedule.setId(SCHEDULE_ID);
        schedule.setTenantId(TENANT_ID);
        schedule.setStatus(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultantId(CONSULTANT_ID);
        schedule.setClientId(CLIENT_ID);
        schedule.setMappingId(PENDING_MAPPING_ID);
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
