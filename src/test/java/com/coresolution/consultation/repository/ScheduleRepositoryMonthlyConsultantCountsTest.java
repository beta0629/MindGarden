package com.coresolution.consultation.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link ScheduleRepository#countCompletedSchedulesByConsultantInDateRange} 검증.
 *
 * <p>2026-06-09 신규 API ({@code GET /api/v1/schedules/monthly-consultant-counts}) 의
 * Repository SSOT. 테스트 케이스 매트릭스 (T1~T7):</p>
 * <ul>
 *   <li>T1: tenantId 격리 — 다른 tenant 데이터는 카운트되지 않음</li>
 *   <li>T2: 상태 필터 — COMPLETED 만 카운트, 그 외 모든 상태(BOOKED/CONFIRMED/CANCELLED/
 *       IN_PROGRESS/TENTATIVE_PENDING_PAYMENT/VACATION/AVAILABLE) 제외</li>
 *   <li>T3: isDeleted=true 일정 제외</li>
 *   <li>T4: consultantId IS NULL 일정 제외</li>
 *   <li>T5: BETWEEN startDate AND endDate 양 끝 포함, 직전일/직후일 제외</li>
 *   <li>T6: 0건 상담사는 결과 row 미등장 (Service 계층에서 폴백)</li>
 *   <li>T7: 그룹 키와 카운트 정합 — consultant A 3건, B 1건 → 결과 2 row</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-09
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@Transactional
@ActiveProfiles("test")
@DisplayName("ScheduleRepository.countCompletedSchedulesByConsultantInDateRange — 월별 상담사 COMPLETED 집계")
class ScheduleRepositoryMonthlyConsultantCountsTest {

    @Autowired
    private ScheduleRepository scheduleRepository;

    private static final LocalDate START = LocalDate.of(2026, 6, 1);
    private static final LocalDate END = LocalDate.of(2026, 6, 30);

    @Test
    @DisplayName("T1: 멀티테넌트 격리 — 다른 tenantId 의 COMPLETED 일정은 카운트되지 않는다")
    void t1_tenantIsolation() {
        String tenantId = UUID.randomUUID().toString();
        String otherTenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();
        Long consultantB = randomId();

        saveCompleted(tenantId, consultantA, LocalDate.of(2026, 6, 5));
        saveCompleted(tenantId, consultantA, LocalDate.of(2026, 6, 10));
        // 다른 tenant 의 COMPLETED 는 결과에 포함되면 안 됨
        saveCompleted(otherTenantId, consultantA, LocalDate.of(2026, 6, 7));
        saveCompleted(otherTenantId, consultantB, LocalDate.of(2026, 6, 8));

        Map<Long, Long> result = toMap(scheduleRepository.countCompletedSchedulesByConsultantInDateRange(
                tenantId, ScheduleStatus.COMPLETED, START, END));

        assertThat(result).hasSize(1);
        assertThat(result).containsEntry(consultantA, 2L);
        assertThat(result).doesNotContainKey(consultantB);
    }

    @Test
    @DisplayName("T2: 상태 필터 — COMPLETED 만 카운트, BOOKED/CONFIRMED/CANCELLED/IN_PROGRESS/TENTATIVE_PENDING_PAYMENT/VACATION/AVAILABLE 모두 제외")
    void t2_statusFilter() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantId = randomId();

        // COMPLETED 1건만 카운트되어야 한다
        saveSchedule(tenantId, consultantId, LocalDate.of(2026, 6, 5),
                ScheduleStatus.COMPLETED, false);
        // 그 외 상태는 모두 제외
        saveSchedule(tenantId, consultantId, LocalDate.of(2026, 6, 6),
                ScheduleStatus.BOOKED, false);
        saveSchedule(tenantId, consultantId, LocalDate.of(2026, 6, 7),
                ScheduleStatus.CONFIRMED, false);
        saveSchedule(tenantId, consultantId, LocalDate.of(2026, 6, 8),
                ScheduleStatus.CANCELLED, false);
        saveSchedule(tenantId, consultantId, LocalDate.of(2026, 6, 9),
                ScheduleStatus.IN_PROGRESS, false);
        saveSchedule(tenantId, consultantId, LocalDate.of(2026, 6, 10),
                ScheduleStatus.TENTATIVE_PENDING_PAYMENT, false);
        saveSchedule(tenantId, consultantId, LocalDate.of(2026, 6, 11),
                ScheduleStatus.VACATION, false);
        saveSchedule(tenantId, consultantId, LocalDate.of(2026, 6, 12),
                ScheduleStatus.AVAILABLE, false);

        Map<Long, Long> result = toMap(scheduleRepository.countCompletedSchedulesByConsultantInDateRange(
                tenantId, ScheduleStatus.COMPLETED, START, END));

        assertThat(result).hasSize(1);
        assertThat(result).containsEntry(consultantId, 1L);
    }

    @Test
    @DisplayName("T3: isDeleted=true 일정은 카운트에서 제외된다")
    void t3_excludesDeleted() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantId = randomId();

        saveSchedule(tenantId, consultantId, LocalDate.of(2026, 6, 5),
                ScheduleStatus.COMPLETED, false);
        // 삭제된 COMPLETED 일정 — 결과에 포함되면 안 됨
        saveSchedule(tenantId, consultantId, LocalDate.of(2026, 6, 6),
                ScheduleStatus.COMPLETED, true);
        saveSchedule(tenantId, consultantId, LocalDate.of(2026, 6, 7),
                ScheduleStatus.COMPLETED, true);

        Map<Long, Long> result = toMap(scheduleRepository.countCompletedSchedulesByConsultantInDateRange(
                tenantId, ScheduleStatus.COMPLETED, START, END));

        assertThat(result).hasSize(1);
        assertThat(result).containsEntry(consultantId, 1L);
    }

    @Test
    @DisplayName("T4: 쿼리 IS NOT NULL 가드 — 결과 row 의 consultantId 는 항상 not-null 이다")
    void t4_resultRowsHaveNonNullConsultantId() {
        // Schedule.consultant_id 컬럼이 nullable=false 라 DB 레벨에서 NULL 저장이 거부되므로
        // 쿼리의 `s.consultantId IS NOT NULL` 가드는 이중 안전망 역할을 한다. 결과 row 의 [0]
        // 이 항상 not-null 임을 직접 검증해 가드가 무력화되어도 오염 row 가 노출되지 않음을 보장.
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();
        Long consultantB = randomId();

        saveCompleted(tenantId, consultantA, LocalDate.of(2026, 6, 5));
        saveCompleted(tenantId, consultantA, LocalDate.of(2026, 6, 6));
        saveCompleted(tenantId, consultantB, LocalDate.of(2026, 6, 7));

        List<Object[]> rows = scheduleRepository.countCompletedSchedulesByConsultantInDateRange(
                tenantId, ScheduleStatus.COMPLETED, START, END);

        assertThat(rows).isNotEmpty();
        for (Object[] row : rows) {
            assertThat(row[0]).as("consultantId 컬럼은 절대 null 이면 안 된다").isNotNull();
        }
    }

    @Test
    @DisplayName("T5: BETWEEN startDate AND endDate 양 끝 포함, 직전일/직후일 제외")
    void t5_boundaryInclusiveBetween() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantId = randomId();

        // 직전일 (5/31) — 제외
        saveCompleted(tenantId, consultantId, LocalDate.of(2026, 5, 31));
        // 시작일 (6/1) — 포함
        saveCompleted(tenantId, consultantId, LocalDate.of(2026, 6, 1));
        // 중간 (6/15) — 포함
        saveCompleted(tenantId, consultantId, LocalDate.of(2026, 6, 15));
        // 종료일 (6/30) — 포함
        saveCompleted(tenantId, consultantId, LocalDate.of(2026, 6, 30));
        // 직후일 (7/1) — 제외
        saveCompleted(tenantId, consultantId, LocalDate.of(2026, 7, 1));

        Map<Long, Long> result = toMap(scheduleRepository.countCompletedSchedulesByConsultantInDateRange(
                tenantId, ScheduleStatus.COMPLETED, START, END));

        assertThat(result).hasSize(1);
        assertThat(result).containsEntry(consultantId, 3L);
    }

    @Test
    @DisplayName("T6: 0건 상담사는 결과 row 에 등장하지 않는다 (Service 계층에서 폴백 책임)")
    void t6_zeroCountConsultantsNotIncluded() {
        String tenantId = UUID.randomUUID().toString();
        Long busyConsultant = randomId();
        Long idleConsultant = randomId();

        saveCompleted(tenantId, busyConsultant, LocalDate.of(2026, 6, 5));
        // idleConsultant 는 같은 월에 일정 없음 (또는 BOOKED 만 있어 COMPLETED 가 0)
        saveSchedule(tenantId, idleConsultant, LocalDate.of(2026, 6, 6),
                ScheduleStatus.BOOKED, false);

        Map<Long, Long> result = toMap(scheduleRepository.countCompletedSchedulesByConsultantInDateRange(
                tenantId, ScheduleStatus.COMPLETED, START, END));

        assertThat(result).hasSize(1);
        assertThat(result).containsEntry(busyConsultant, 1L);
        assertThat(result).doesNotContainKey(idleConsultant);
    }

    @Test
    @DisplayName("T7: 그룹 키 및 카운트 정합 — consultant A 3건, B 1건 → 결과 2 row")
    void t7_groupByConsultantId_correctCounts() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();
        Long consultantB = randomId();
        Long consultantC = randomId();

        saveCompleted(tenantId, consultantA, LocalDate.of(2026, 6, 1));
        saveCompleted(tenantId, consultantA, LocalDate.of(2026, 6, 10));
        saveCompleted(tenantId, consultantA, LocalDate.of(2026, 6, 20));
        saveCompleted(tenantId, consultantB, LocalDate.of(2026, 6, 15));
        // consultantC: COMPLETED 가 아닌 상태 — 결과에 등장하지 않음
        saveSchedule(tenantId, consultantC, LocalDate.of(2026, 6, 12),
                ScheduleStatus.BOOKED, false);

        Map<Long, Long> result = toMap(scheduleRepository.countCompletedSchedulesByConsultantInDateRange(
                tenantId, ScheduleStatus.COMPLETED, START, END));

        assertThat(result).hasSize(2);
        assertThat(result).containsEntry(consultantA, 3L);
        assertThat(result).containsEntry(consultantB, 1L);
        assertThat(result).doesNotContainKey(consultantC);
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    private Schedule saveCompleted(String tenantId, Long consultantId, LocalDate date) {
        return saveSchedule(tenantId, consultantId, date, ScheduleStatus.COMPLETED, false);
    }

    private Schedule saveSchedule(
            String tenantId,
            Long consultantId,
            LocalDate date,
            ScheduleStatus status,
            boolean deleted) {
        Schedule schedule = new Schedule();
        schedule.setTenantId(tenantId);
        schedule.setConsultantId(consultantId);
        schedule.setClientId(randomId());
        schedule.setDate(date);
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));
        schedule.setStatus(status);
        schedule.setIsDeleted(deleted);
        return scheduleRepository.save(schedule);
    }

    private Map<Long, Long> toMap(List<Object[]> rows) {
        return rows.stream().collect(Collectors.toMap(
                row -> ((Number) row[0]).longValue(),
                row -> ((Number) row[1]).longValue()));
    }

    private Long randomId() {
        return Math.abs(ThreadLocalRandom.current().nextLong(1, Long.MAX_VALUE));
    }
}
