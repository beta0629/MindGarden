package com.coresolution.consultation.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link ScheduleRepository#countSequenceUpToSchedule(String, Long, LocalDate, Long)} 가드 검증.
 *
 * <p>2026-06-05 P1 픽스: {@code session_sequence IS NOT NULL} 가드가 적용되어
 * 취소·환불·가예약(결제 전) 일정이 lifetime count 에서 제외되는지 확인한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-05
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@Transactional
@ActiveProfiles("test")
@DisplayName("ScheduleRepository.countSequenceUpToSchedule 가드 테스트")
class ScheduleRepositoryCountSequenceTest {

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Test
    @DisplayName("케이스 A (운영 신고): CANCELLED + sessionSequence=NULL 일정은 lifetime count 에서 제외된다")
    void countSequenceUpToSchedule_excludesCancelledWithNullSequence() {
        String tenantId = UUID.randomUUID().toString();
        Long clientId = randomId();
        LocalDate date = LocalDate.of(2026, 5, 16);

        Schedule cancelled = saveSchedule(
                tenantId, clientId, date, LocalTime.of(19, 0),
                ScheduleStatus.CANCELLED, null);

        long count = scheduleRepository.countSequenceUpToSchedule(
                tenantId, clientId, cancelled.getDate(), cancelled.getId());

        assertThat(count).isZero();
    }

    @Test
    @DisplayName("케이스 B: 정상 COMPLETED + sessionSequence=1 일정은 lifetime count 에 포함된다")
    void countSequenceUpToSchedule_includesCompletedWithSequence() {
        String tenantId = UUID.randomUUID().toString();
        Long clientId = randomId();
        LocalDate date = LocalDate.of(2026, 5, 10);

        Schedule completed = saveSchedule(
                tenantId, clientId, date, LocalTime.of(10, 0),
                ScheduleStatus.COMPLETED, 1);

        long count = scheduleRepository.countSequenceUpToSchedule(
                tenantId, clientId, completed.getDate(), completed.getId());

        assertThat(count).isEqualTo(1L);
    }

    @Test
    @DisplayName("케이스 C: 가예약(TENTATIVE_PENDING_PAYMENT) + sessionSequence=NULL 일정은 제외된다")
    void countSequenceUpToSchedule_excludesTentativePendingPayment() {
        String tenantId = UUID.randomUUID().toString();
        Long clientId = randomId();
        LocalDate date = LocalDate.of(2026, 5, 20);

        Schedule tentative = saveSchedule(
                tenantId, clientId, date, LocalTime.of(11, 0),
                ScheduleStatus.TENTATIVE_PENDING_PAYMENT, null);

        long count = scheduleRepository.countSequenceUpToSchedule(
                tenantId, clientId, tentative.getDate(), tentative.getId());

        assertThat(count).isZero();
    }

    @Test
    @DisplayName("케이스 D: COMPLETED 라도 sessionSequence=NULL (PR #128 이전 잔존 데이터)은 제외된다 (안전 옵션)")
    void countSequenceUpToSchedule_excludesCompletedWithNullSequence() {
        String tenantId = UUID.randomUUID().toString();
        Long clientId = randomId();
        LocalDate date = LocalDate.of(2026, 5, 12);

        Schedule legacy = saveSchedule(
                tenantId, clientId, date, LocalTime.of(14, 0),
                ScheduleStatus.COMPLETED, null);

        long count = scheduleRepository.countSequenceUpToSchedule(
                tenantId, clientId, legacy.getDate(), legacy.getId());

        assertThat(count).isZero();
    }

    @Test
    @DisplayName("케이스 E: 멀티테넌트 격리 — 다른 tenantId 의 일정은 카운트에 포함되지 않는다")
    void countSequenceUpToSchedule_isolatedByTenant() {
        String tenantId = UUID.randomUUID().toString();
        String otherTenantId = UUID.randomUUID().toString();
        Long clientId = randomId();
        LocalDate date = LocalDate.of(2026, 5, 15);

        Schedule mine = saveSchedule(
                tenantId, clientId, date, LocalTime.of(10, 0),
                ScheduleStatus.COMPLETED, 1);
        saveSchedule(
                otherTenantId, clientId, date.minusDays(1), LocalTime.of(10, 0),
                ScheduleStatus.COMPLETED, 1);

        long count = scheduleRepository.countSequenceUpToSchedule(
                tenantId, clientId, mine.getDate(), mine.getId());

        assertThat(count).isEqualTo(1L);
    }

    @Test
    @DisplayName("복합 시나리오: 정상 1건 + 취소 1건 + 가예약 1건 → 카운트 = 1")
    void countSequenceUpToSchedule_mixedScenario() {
        String tenantId = UUID.randomUUID().toString();
        Long clientId = randomId();

        saveSchedule(tenantId, clientId, LocalDate.of(2026, 5, 1), LocalTime.of(10, 0),
                ScheduleStatus.COMPLETED, 1);
        saveSchedule(tenantId, clientId, LocalDate.of(2026, 5, 8), LocalTime.of(10, 0),
                ScheduleStatus.CANCELLED, null);
        Schedule pivot = saveSchedule(
                tenantId, clientId, LocalDate.of(2026, 5, 16), LocalTime.of(19, 0),
                ScheduleStatus.TENTATIVE_PENDING_PAYMENT, null);

        long count = scheduleRepository.countSequenceUpToSchedule(
                tenantId, clientId, pivot.getDate(), pivot.getId());

        assertThat(count).isEqualTo(1L);
    }

    private Schedule saveSchedule(
            String tenantId,
            Long clientId,
            LocalDate date,
            LocalTime startTime,
            ScheduleStatus status,
            Integer sessionSequence) {
        Schedule schedule = new Schedule();
        schedule.setTenantId(tenantId);
        schedule.setClientId(clientId);
        schedule.setConsultantId(randomId());
        schedule.setDate(date);
        schedule.setStartTime(startTime);
        schedule.setEndTime(startTime.plusHours(1));
        schedule.setStatus(status);
        schedule.setSessionSequence(sessionSequence);
        schedule.setIsDeleted(false);
        return scheduleRepository.save(schedule);
    }

    private Long randomId() {
        return Math.abs(ThreadLocalRandom.current().nextLong(1, Long.MAX_VALUE));
    }
}
