package com.coresolution.consultation.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.Schedule;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link ScheduleRepository#findMissingConsultationLogScheduleRowsInDateRange} 검증.
 *
 * <p>2026-06-09 R4 신규 API ({@code GET /api/v1/schedules/monthly-missing-consultation-logs})
 * 의 Repository SSOT. 테스트 케이스 매트릭스 (M1~M6):</p>
 * <ul>
 *   <li>M1: tenantId 격리 — 다른 tenant 데이터는 결과에 포함되지 않음</li>
 *   <li>M2: ConsultationRecord 가 존재(consultationId = schedule.id) 하면 제외</li>
 *   <li>M3: ConsultationRecord 가 isDeleted=true 면 «미작성» 으로 포함</li>
 *   <li>M4: COMPLETED 가 아닌 일정은 제외 (BOOKED/CONFIRMED/CANCELLED 등)</li>
 *   <li>M5: isDeleted=true 일정·consultantId IS NULL 일정 제외</li>
 *   <li>M6: BETWEEN startDate AND endDate 양 끝 포함, 직전일/직후일 제외, 정렬</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-09
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@Transactional
@ActiveProfiles("test")
@DisplayName("ScheduleRepository.findMissingConsultationLogScheduleRowsInDateRange — 월별 상담일지 누락")
class ScheduleRepositoryMonthlyMissingConsultationLogsTest {

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private ConsultationRecordRepository consultationRecordRepository;

    private static final LocalDate START = LocalDate.of(2026, 4, 1);
    private static final LocalDate END = LocalDate.of(2026, 4, 30);

    // ─── M1 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("M1: 멀티테넌트 격리 — 다른 tenantId 의 COMPLETED 일정은 결과에 포함되지 않는다")
    void m1_tenantIsolation() {
        String tenantId = UUID.randomUUID().toString();
        String otherTenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();

        saveCompleted(tenantId, consultantA, LocalDate.of(2026, 4, 5));
        saveCompleted(tenantId, consultantA, LocalDate.of(2026, 4, 10));
        saveCompleted(otherTenantId, consultantA, LocalDate.of(2026, 4, 7));

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                tenantId, ScheduleStatus.COMPLETED, START, END);

        assertThat(rows).hasSize(2);
        assertThat(rows).extracting(r -> r[0], r -> r[1])
                .containsExactly(
                        tuple(consultantA, LocalDate.of(2026, 4, 5)),
                        tuple(consultantA, LocalDate.of(2026, 4, 10)));
    }

    // ─── M2 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("M2: ConsultationRecord 가 존재(consultationId = schedule.id) 하면 제외 — LEFT JOIN 키 SSOT")
    void m2_consultationRecordPresent_excluded() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();

        Schedule withRecord = saveCompleted(tenantId, consultantA, LocalDate.of(2026, 4, 5));
        Schedule missing = saveCompleted(tenantId, consultantA, LocalDate.of(2026, 4, 10));

        ConsultationRecord record = ConsultationRecord.builder()
                .consultationId(withRecord.getId())
                .clientId(withRecord.getClientId())
                .consultantId(consultantA)
                .sessionDate(withRecord.getDate())
                .build();
        record.setTenantId(tenantId);
        record.setIsDeleted(false);
        consultationRecordRepository.save(record);

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                tenantId, ScheduleStatus.COMPLETED, START, END);

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0)[0]).isEqualTo(consultantA);
        assertThat(rows.get(0)[1]).isEqualTo(missing.getDate());
    }

    // ─── M3 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("M3: ConsultationRecord 가 isDeleted=true 면 «미작성» 으로 다시 포함")
    void m3_softDeletedRecord_treatedAsMissing() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();

        Schedule schedule = saveCompleted(tenantId, consultantA, LocalDate.of(2026, 4, 5));
        ConsultationRecord deletedRecord = ConsultationRecord.builder()
                .consultationId(schedule.getId())
                .clientId(schedule.getClientId())
                .consultantId(consultantA)
                .sessionDate(schedule.getDate())
                .build();
        deletedRecord.setTenantId(tenantId);
        deletedRecord.setIsDeleted(true);
        consultationRecordRepository.save(deletedRecord);

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                tenantId, ScheduleStatus.COMPLETED, START, END);

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0)[0]).isEqualTo(consultantA);
        assertThat(rows.get(0)[1]).isEqualTo(schedule.getDate());
    }

    // ─── M4 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("M4: COMPLETED 가 아닌 일정은 제외 — BOOKED/CONFIRMED/CANCELLED/IN_PROGRESS/VACATION 모두 결과 0")
    void m4_nonCompletedStatuses_excluded() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();

        ScheduleStatus[] excluded = new ScheduleStatus[] {
                ScheduleStatus.BOOKED,
                ScheduleStatus.CONFIRMED,
                ScheduleStatus.CANCELLED,
                ScheduleStatus.IN_PROGRESS,
                ScheduleStatus.VACATION
        };
        int day = 1;
        for (ScheduleStatus s : excluded) {
            saveSchedule(tenantId, consultantA, LocalDate.of(2026, 4, day++), s, false);
        }

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                tenantId, ScheduleStatus.COMPLETED, START, END);

        assertThat(rows).isEmpty();
    }

    // ─── M5 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("M5: isDeleted=true 일정·consultantId IS NULL 일정 제외")
    void m5_deletedAndNullConsultant_excluded() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();

        saveSchedule(tenantId, consultantA, LocalDate.of(2026, 4, 5),
                ScheduleStatus.COMPLETED, true);
        saveSchedule(tenantId, null, LocalDate.of(2026, 4, 6),
                ScheduleStatus.COMPLETED, false);
        Schedule active = saveCompleted(tenantId, consultantA, LocalDate.of(2026, 4, 7));

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                tenantId, ScheduleStatus.COMPLETED, START, END);

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0)[0]).isEqualTo(consultantA);
        assertThat(rows.get(0)[1]).isEqualTo(active.getDate());
    }

    // ─── M6 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("M6: BETWEEN 경계 + 정렬 — 4/1·4/30 포함, 3/31·5/1 제외, consultantId ASC, date ASC")
    void m6_betweenBoundariesAndOrdering() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();
        Long consultantB = randomId();
        // 두 상담사가 결정적으로 정렬되도록 강제
        Long smaller = Math.min(consultantA, consultantB);
        Long larger = Math.max(consultantA, consultantB);

        saveCompleted(tenantId, smaller, LocalDate.of(2026, 3, 31));
        saveCompleted(tenantId, smaller, LocalDate.of(2026, 4, 1));
        saveCompleted(tenantId, smaller, LocalDate.of(2026, 4, 22));
        saveCompleted(tenantId, larger, LocalDate.of(2026, 4, 15));
        saveCompleted(tenantId, larger, LocalDate.of(2026, 4, 30));
        saveCompleted(tenantId, larger, LocalDate.of(2026, 5, 1));

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                tenantId, ScheduleStatus.COMPLETED, START, END);

        assertThat(rows).hasSize(4);
        assertThat(rows).extracting(r -> r[0], r -> r[1])
                .containsExactly(
                        tuple(smaller, LocalDate.of(2026, 4, 1)),
                        tuple(smaller, LocalDate.of(2026, 4, 22)),
                        tuple(larger, LocalDate.of(2026, 4, 15)),
                        tuple(larger, LocalDate.of(2026, 4, 30)));
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

    private Long randomId() {
        return Math.abs(ThreadLocalRandom.current().nextLong(1, Long.MAX_VALUE));
    }
}
