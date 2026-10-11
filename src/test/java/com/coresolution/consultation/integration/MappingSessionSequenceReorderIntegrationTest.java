package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.constant.ScheduleServiceUserFacingMessages;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.util.ReservationSmsBusinessHours;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * 매핑 회차 재정렬이 날짜순으로 번호를 맞추고 차감 횟수·다른 매핑·일지 번호를 지키는지.
 *
 * @author MindGarden
 * @since 2026-10-11
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("매핑 회차 날짜순 재정렬 통합")
class MappingSessionSequenceReorderIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private ConsultantClientMappingRepository mappingRepository;
    @Autowired private ScheduleRepository scheduleRepository;
    @Autowired private ConsultationRecordRepository consultationRecordRepository;
    @Autowired private ScheduleService scheduleService;

    private String tenantId;
    private User consultant;
    private User client;
    private LocalDate today;

    @BeforeEach
    void setUp() {
        tenantId = "seqord-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        TenantContextHolder.setTenantId(tenantId);
        consultant = saveUser(UserRole.CONSULTANT);
        client = saveUser(UserRole.CLIENT);
        today = LocalDate.now(ReservationSmsBusinessHours.ZONE_SEOUL);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("뒤집힌 회차 — 재정렬·취소·재예약은 날짜순이고 차감은 취소·재예약에서만 1회씩")
    void reorderCancelAndRebook_keepsDateOrderAndDeductionCounts() {
        ConsultantClientMapping mapping = saveMapping(
                MappingStatus.ACTIVE, PaymentStatus.APPROVED, null, 10, 2, 8);
        ConsultantClientMapping otherMapping = saveMapping(
                MappingStatus.ACTIVE, PaymentStatus.APPROVED, null, 10, 1, 9);
        Schedule completed = saveSchedule(
                mapping, ScheduleStatus.COMPLETED, 2, today.minusDays(2), LocalTime.of(10, 0));
        Schedule booked = saveSchedule(
                mapping, ScheduleStatus.BOOKED, 1, today.plusDays(1), LocalTime.of(19, 0));
        Schedule other = saveSchedule(
                otherMapping, ScheduleStatus.BOOKED, 9, today.plusDays(3), LocalTime.of(11, 0));
        ConsultationRecord record = saveRecord(completed, 2);

        scheduleService.reorderOccupyingSessionSequences(mapping, null);

        assertThat(reloadSchedule(completed).getSessionSequence()).isEqualTo(1);
        assertThat(reloadSchedule(booked).getSessionSequence()).isEqualTo(2);
        assertThat(reloadRecord(record).getSessionNumber()).isEqualTo(1);
        assertThat(reloadMapping(mapping).getUsedSessions()).isEqualTo(2);
        assertThat(reloadMapping(mapping).getRemainingSessions()).isEqualTo(8);
        assertThat(reloadSchedule(other).getSessionSequence()).isEqualTo(9);

        scheduleService.cancelSchedule(booked.getId(), "seqord-cancel");

        assertThat(reloadSchedule(booked).getSessionSequence()).isNull();
        assertThat(reloadSchedule(booked).getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
        assertThat(reloadSchedule(completed).getSessionSequence()).isEqualTo(1);
        assertThat(reloadRecord(record).getSessionNumber()).isEqualTo(1);
        assertThat(reloadMapping(mapping).getUsedSessions()).isEqualTo(1);
        assertThat(reloadMapping(mapping).getRemainingSessions()).isEqualTo(9);
        assertThat(reloadSchedule(other).getSessionSequence()).isEqualTo(9);

        Schedule rebooked = saveSchedule(
                mapping, ScheduleStatus.BOOKED, null, today.plusDays(4), LocalTime.of(15, 0));
        scheduleService.useSessionForSpecificMapping(
                tenantId, mapping.getId(), consultant.getId(), client.getId(), rebooked);

        assertThat(reloadSchedule(completed).getSessionSequence()).isEqualTo(1);
        assertThat(reloadSchedule(rebooked).getSessionSequence()).isEqualTo(2);
        assertThat(reloadMapping(mapping).getUsedSessions()).isEqualTo(2);
        assertThat(reloadMapping(mapping).getRemainingSessions()).isEqualTo(8);
        assertThat(reloadSchedule(other).getSessionSequence()).isEqualTo(9);
        assertThat(reloadRecord(record).getSessionNumber()).isEqualTo(1);
    }

    @Test
    @DisplayName("미래 일정 이동 — 더 이른 날짜가 앞 회차. 사용 회기는 그대로")
    void moveFutureSchedule_reordersWithoutDeduction() {
        ConsultantClientMapping mapping = saveMapping(
                MappingStatus.ACTIVE, PaymentStatus.APPROVED, null, 10, 2, 8);
        Schedule first = saveSchedule(
                mapping, ScheduleStatus.BOOKED, 1, today.plusDays(2), LocalTime.of(10, 0));
        Schedule second = saveSchedule(
                mapping, ScheduleStatus.BOOKED, 2, today.plusDays(5), LocalTime.of(19, 0));

        Schedule patch = new Schedule();
        patch.setDate(today.plusDays(1));
        patch.setStartTime(LocalTime.of(9, 0));
        patch.setEndTime(LocalTime.of(9, 50));
        patch.setStatus(ScheduleStatus.BOOKED);
        scheduleService.updateSchedule(second.getId(), patch);

        assertThat(reloadSchedule(second).getSessionSequence()).isEqualTo(1);
        assertThat(reloadSchedule(first).getSessionSequence()).isEqualTo(2);
        assertThat(reloadMapping(mapping).getUsedSessions()).isEqualTo(2);
        assertThat(reloadMapping(mapping).getRemainingSessions()).isEqualTo(8);
    }

    @Test
    @DisplayName("과거 일정 이동은 거부되고 회차는 유지된다")
    void movePastSchedule_rejected() {
        ConsultantClientMapping mapping = saveMapping(
                MappingStatus.ACTIVE, PaymentStatus.APPROVED, null, 10, 1, 9);
        Schedule past = saveSchedule(
                mapping, ScheduleStatus.BOOKED, 3, today.minusDays(1), LocalTime.of(10, 0));
        Schedule patch = new Schedule();
        patch.setDate(today.plusDays(2));
        patch.setStartTime(LocalTime.of(11, 0));
        patch.setEndTime(LocalTime.of(11, 50));

        assertThatThrownBy(() -> scheduleService.updateSchedule(past.getId(), patch))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(ScheduleServiceUserFacingMessages.MSG_PAST_SLOT_CHANGE_DENIED);
        assertThat(reloadSchedule(past).getSessionSequence()).isEqualTo(3);
        assertThat(reloadSchedule(past).getDate()).isEqualTo(today.minusDays(1));
    }

    @Test
    @DisplayName("가예약 — 이른 일정이 1, 늦은 일정이 2. 잔여·사용 회기는 그대로")
    void provisional_ordersByDateWithoutDeduction() {
        ConsultantClientMapping mapping = saveMapping(
                MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING, PaymentTimingConstants.SAME_DAY_CARD,
                4, 0, 0);
        Schedule later = saveSchedule(
                mapping, ScheduleStatus.TENTATIVE_PENDING_PAYMENT, null, today.plusDays(4), LocalTime.of(19, 0));
        Schedule earlier = saveSchedule(
                mapping, ScheduleStatus.TENTATIVE_PENDING_PAYMENT, null, today.plusDays(1), LocalTime.of(10, 0));

        assertThat(scheduleService.assignProvisionalSessionSequenceWithoutDeduction(later)).isTrue();
        assertThat(scheduleService.assignProvisionalSessionSequenceWithoutDeduction(earlier)).isTrue();

        assertThat(reloadSchedule(earlier).getSessionSequence()).isEqualTo(1);
        assertThat(reloadSchedule(later).getSessionSequence()).isEqualTo(2);
        ConsultantClientMapping after = reloadMapping(mapping);
        assertThat(after.getUsedSessions()).isZero();
        assertThat(after.getRemainingSessions()).isZero();
        assertThat(after.getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);
    }

    private ConsultantClientMapping reloadMapping(ConsultantClientMapping mapping) {
        return mappingRepository.findByTenantIdAndId(tenantId, mapping.getId()).orElseThrow();
    }

    private Schedule reloadSchedule(Schedule schedule) {
        return scheduleRepository.findByTenantIdAndId(tenantId, schedule.getId()).orElseThrow();
    }

    private ConsultationRecord reloadRecord(ConsultationRecord record) {
        return consultationRecordRepository.findByTenantIdAndId(tenantId, record.getId()).orElseThrow();
    }

    private ConsultantClientMapping saveMapping(MappingStatus status, PaymentStatus paymentStatus,
            String paymentTiming, int total, int used, int remaining) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setTenantId(tenantId);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStartDate(LocalDateTime.now());
        mapping.setStatus(status);
        mapping.setPaymentStatus(paymentStatus);
        mapping.setPaymentTiming(paymentTiming);
        mapping.setPaymentMethod("CARD");
        mapping.setTotalSessions(total);
        mapping.setUsedSessions(used);
        mapping.setRemainingSessions(remaining);
        mapping.setPackageName("seqord-it");
        mapping.setPackagePrice(1000L);
        mapping.setIsDeleted(false);
        return mappingRepository.saveAndFlush(mapping);
    }

    private Schedule saveSchedule(ConsultantClientMapping mapping, ScheduleStatus status, Integer sequence,
            LocalDate date, LocalTime start) {
        Schedule schedule = new Schedule();
        schedule.setTenantId(tenantId);
        schedule.setConsultantId(consultant.getId());
        schedule.setClientId(client.getId());
        schedule.setMappingId(mapping.getId());
        schedule.setDate(date);
        schedule.setStartTime(start);
        schedule.setEndTime(start.plusMinutes(50));
        schedule.setStatus(status);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultationType("INDIVIDUAL");
        schedule.setTitle("seqord-it");
        schedule.setSessionSequence(sequence);
        schedule.setIsDeleted(false);
        return scheduleRepository.saveAndFlush(schedule);
    }

    private ConsultationRecord saveRecord(Schedule schedule, int sessionNumber) {
        ConsultationRecord record = new ConsultationRecord();
        record.setTenantId(tenantId);
        record.setConsultationId(schedule.getId());
        record.setClientId(client.getId());
        record.setConsultantId(consultant.getId());
        record.setSessionDate(schedule.getDate());
        record.setSessionNumber(sessionNumber);
        record.setIsDeleted(false);
        return consultationRecordRepository.saveAndFlush(record);
    }

    private User saveUser(UserRole role) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenantId);
        user.setUserId("seqord-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("seqord-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(role.name());
        user.setRole(role);
        user.setIsDeleted(false);
        return userRepository.saveAndFlush(user);
    }
}
