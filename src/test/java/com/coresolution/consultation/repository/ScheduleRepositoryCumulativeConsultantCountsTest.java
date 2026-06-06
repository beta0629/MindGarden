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
 * {@link ScheduleRepository#countCompletedSchedulesByConsultantCumulative} 검증.
 *
 * <p>R6 (2026-06-06) 신규 API ({@code GET /api/v1/schedules/cumulative-consultant-counts})
 * 의 Repository SSOT. 어드민 대시보드 「상담사 별 통합데이터」 카드의 «누적 상담 건수»
 * 섹션 — 전체 기간(날짜 범위 무관) COMPLETED 만 GROUP BY consultantId.</p>
 *
 * <p>테스트 매트릭스 (F1~F5):</p>
 * <ul>
 *   <li>F1: 활성 상담사 다수 + COMPLETED 다수 → GROUP BY 정확</li>
 *   <li>F2: COMPLETED 가 0건인 상담사 → 결과 row 에 미등장 (Service 계층에서 머지)</li>
 *   <li>F3: 테넌트 격리 — 다른 테넌트의 COMPLETED 제외</li>
 *   <li>F4: isDeleted=true 일정 제외</li>
 *   <li>F5: consultantId IS NULL 가드 — 결과 row [0] 은 항상 not-null</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@Transactional
@ActiveProfiles("test")
@DisplayName("ScheduleRepository.countCompletedSchedulesByConsultantCumulative — 상담사별 누적 COMPLETED 집계")
class ScheduleRepositoryCumulativeConsultantCountsTest {

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Test
    @DisplayName("F1: 활성 상담사 다수 + COMPLETED 다수 → GROUP BY consultantId 정확, 전체 기간 누적")
    void f1_groupByConsultantId_correctCumulativeCounts() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();
        Long consultantB = randomId();
        Long consultantC = randomId();

        // 전체 기간 (과거 + 현재 + 미래) 모두 카운트되어야 함 — 날짜 무관.
        saveCompleted(tenantId, consultantA, LocalDate.of(2024, 1, 5));
        saveCompleted(tenantId, consultantA, LocalDate.of(2025, 6, 15));
        saveCompleted(tenantId, consultantA, LocalDate.of(2026, 6, 1));
        saveCompleted(tenantId, consultantA, LocalDate.of(2027, 12, 31));
        saveCompleted(tenantId, consultantB, LocalDate.of(2026, 6, 15));
        saveCompleted(tenantId, consultantC, LocalDate.of(2020, 1, 1));
        saveCompleted(tenantId, consultantC, LocalDate.of(2030, 12, 31));

        Map<Long, Long> result = toMap(scheduleRepository.countCompletedSchedulesByConsultantCumulative(
                tenantId, ScheduleStatus.COMPLETED));

        assertThat(result).hasSize(3);
        assertThat(result).containsEntry(consultantA, 4L);
        assertThat(result).containsEntry(consultantB, 1L);
        assertThat(result).containsEntry(consultantC, 2L);
    }

    @Test
    @DisplayName("F2: COMPLETED 가 0건인 상담사는 결과 row 에 등장하지 않는다 (Service 계층에서 머지 책임)")
    void f2_zeroCountConsultantsNotIncluded() {
        String tenantId = UUID.randomUUID().toString();
        Long busyConsultant = randomId();
        Long idleConsultant = randomId();

        saveCompleted(tenantId, busyConsultant, LocalDate.of(2026, 6, 5));
        // idleConsultant — COMPLETED 가 0건 (BOOKED 만 존재).
        saveSchedule(tenantId, idleConsultant, LocalDate.of(2026, 6, 6),
                ScheduleStatus.BOOKED, false);

        Map<Long, Long> result = toMap(scheduleRepository.countCompletedSchedulesByConsultantCumulative(
                tenantId, ScheduleStatus.COMPLETED));

        assertThat(result).hasSize(1);
        assertThat(result).containsEntry(busyConsultant, 1L);
        assertThat(result).doesNotContainKey(idleConsultant);
    }

    @Test
    @DisplayName("F3: 멀티테넌트 격리 — 다른 tenantId 의 COMPLETED 일정은 누적되지 않는다")
    void f3_tenantIsolation() {
        String tenantId = UUID.randomUUID().toString();
        String otherTenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();
        Long consultantB = randomId();

        saveCompleted(tenantId, consultantA, LocalDate.of(2025, 5, 5));
        saveCompleted(tenantId, consultantA, LocalDate.of(2026, 6, 10));
        // 다른 tenant 의 COMPLETED — 결과에 포함되면 안 됨.
        saveCompleted(otherTenantId, consultantA, LocalDate.of(2026, 6, 7));
        saveCompleted(otherTenantId, consultantA, LocalDate.of(2026, 6, 8));
        saveCompleted(otherTenantId, consultantB, LocalDate.of(2026, 6, 9));

        Map<Long, Long> result = toMap(scheduleRepository.countCompletedSchedulesByConsultantCumulative(
                tenantId, ScheduleStatus.COMPLETED));

        assertThat(result).hasSize(1);
        assertThat(result).containsEntry(consultantA, 2L);
        assertThat(result).doesNotContainKey(consultantB);
    }

    @Test
    @DisplayName("F4: isDeleted=true 일정은 누적에서 제외된다")
    void f4_excludesDeleted() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantId = randomId();

        // 활성 COMPLETED 2건.
        saveSchedule(tenantId, consultantId, LocalDate.of(2025, 6, 5),
                ScheduleStatus.COMPLETED, false);
        saveSchedule(tenantId, consultantId, LocalDate.of(2026, 6, 5),
                ScheduleStatus.COMPLETED, false);
        // 삭제된 COMPLETED 3건 — 결과에 포함되면 안 됨.
        saveSchedule(tenantId, consultantId, LocalDate.of(2026, 6, 6),
                ScheduleStatus.COMPLETED, true);
        saveSchedule(tenantId, consultantId, LocalDate.of(2026, 6, 7),
                ScheduleStatus.COMPLETED, true);
        saveSchedule(tenantId, consultantId, LocalDate.of(2026, 6, 8),
                ScheduleStatus.COMPLETED, true);

        Map<Long, Long> result = toMap(scheduleRepository.countCompletedSchedulesByConsultantCumulative(
                tenantId, ScheduleStatus.COMPLETED));

        assertThat(result).hasSize(1);
        assertThat(result).containsEntry(consultantId, 2L);
    }

    @Test
    @DisplayName("F5: 쿼리 IS NOT NULL 가드 — 결과 row 의 consultantId 는 항상 not-null 이다")
    void f5_resultRowsHaveNonNullConsultantId() {
        // Schedule.consultant_id 컬럼이 nullable=false 라 DB 레벨에서 NULL 저장이 거부되므로
        // 쿼리의 `s.consultantId IS NOT NULL` 가드는 이중 안전망 역할을 한다. 결과 row 의 [0]
        // 이 항상 not-null 임을 직접 검증해 가드가 무력화되어도 오염 row 가 노출되지 않음을 보장.
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();
        Long consultantB = randomId();

        saveCompleted(tenantId, consultantA, LocalDate.of(2025, 6, 5));
        saveCompleted(tenantId, consultantA, LocalDate.of(2026, 6, 6));
        saveCompleted(tenantId, consultantB, LocalDate.of(2026, 6, 7));

        List<Object[]> rows = scheduleRepository.countCompletedSchedulesByConsultantCumulative(
                tenantId, ScheduleStatus.COMPLETED);

        assertThat(rows).isNotEmpty();
        for (Object[] row : rows) {
            assertThat(row[0]).as("consultantId 컬럼은 절대 null 이면 안 된다").isNotNull();
        }
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
