package com.coresolution.consultation.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.Schedule;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
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
 * 의 Repository SSOT.</p>
 *
 * <p><b>R5 (2026-06-06) — 도메인 SSOT 정합</b>: 기존 {@code status = COMPLETED}
 * 단일 필터는 누락이었음. {@code ScheduleAutoCompleteService} 가 「지난 일정 + 일지
 * 미작성」 케이스의 COMPLETED 승격을 보류하고 CONFIRMED/BOOKED 를 유지하므로,
 * 본 쿼리는 status ∈ {COMPLETED, CONFIRMED, BOOKED} + {@code s.date < today}
 * 필터를 적용한다.</p>
 *
 * <p>테스트 케이스 매트릭스 (M1~M6, F1~F5):</p>
 * <ul>
 *   <li>M1: tenantId 격리 — 다른 tenant 데이터는 결과에 포함되지 않음</li>
 *   <li>M2: ConsultationRecord 가 존재(consultationId = schedule.id) 하면 제외</li>
 *   <li>M3: ConsultationRecord 가 isDeleted=true 면 «미작성» 으로 포함</li>
 *   <li>M4: 비대상 상태 일정 제외 (CANCELLED, IN_PROGRESS, VACATION)</li>
 *   <li>M5: isDeleted=true 일정 제외 (consultantId IS NULL 은 DB NOT NULL +
 *       Bean Validation 으로 운영·테스트 모두 영속 불가 — JPQL 의
 *       {@code s.consultantId IS NOT NULL} 는 방어적 filter)</li>
 *   <li>M6: BETWEEN startDate AND endDate 양 끝 포함, 직전일/직후일 제외, 정렬</li>
 *   <li>F1: 「과거 + CONFIRMED + 일지 미작성」 → 응답 포함 (R5 회귀 가드)</li>
 *   <li>F2: 「과거 + BOOKED + 일지 미작성」 → 응답 포함 (R5 회귀 가드)</li>
 *   <li>F3: 「오늘 또는 미래 + CONFIRMED」 → 응답 제외 (date &lt; today 컷)</li>
 *   <li>F4: 「과거 + COMPLETED + 일지 미작성」 → 응답 포함 (기존 회귀 0)</li>
 *   <li>F5: 「과거 + COMPLETED + 일지 있음」 → 응답 제외</li>
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
    // 4월 전체가 today 보다 이전이도록 충분히 미래의 today 사용.
    // (R5 컷 s.date < today 가 4월 전체 일정에 대해 영향이 없도록).
    private static final LocalDate TODAY_FUTURE = LocalDate.of(2026, 5, 15);

    private static final Set<ScheduleStatus> TARGET_STATUSES =
            EnumSet.of(ScheduleStatus.COMPLETED, ScheduleStatus.CONFIRMED, ScheduleStatus.BOOKED);

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
                tenantId, TARGET_STATUSES, START, END, TODAY_FUTURE);

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
                tenantId, TARGET_STATUSES, START, END, TODAY_FUTURE);

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
                tenantId, TARGET_STATUSES, START, END, TODAY_FUTURE);

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0)[0]).isEqualTo(consultantA);
        assertThat(rows.get(0)[1]).isEqualTo(schedule.getDate());
    }

    // ─── M4 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("M4: 비대상 상태 일정 제외 — CANCELLED/IN_PROGRESS/VACATION 결과 0 (BOOKED/CONFIRMED 는 F1·F2 에서 포함 검증)")
    void m4_nonTargetStatuses_excluded() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();

        ScheduleStatus[] excluded = new ScheduleStatus[] {
                ScheduleStatus.CANCELLED,
                ScheduleStatus.IN_PROGRESS,
                ScheduleStatus.VACATION
        };
        int day = 1;
        for (ScheduleStatus s : excluded) {
            saveSchedule(tenantId, consultantA, LocalDate.of(2026, 4, day++), s, false);
        }

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                tenantId, TARGET_STATUSES, START, END, TODAY_FUTURE);

        assertThat(rows).isEmpty();
    }

    // ─── M5 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("M5: isDeleted=true 일정 제외 (consultantId IS NULL 은 schema NOT NULL 로 영속 불가 — JPQL filter 는 방어적)")
    void m5_deletedSchedule_excluded() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();

        // isDeleted=true: 결과 제외 대상.
        saveSchedule(tenantId, consultantA, LocalDate.of(2026, 4, 5),
                ScheduleStatus.COMPLETED, true);
        // consultantId IS NULL 케이스는 영속 불가 (Schedule.consultantId @NotNull +
        // schedules.consultant_id NOT NULL). JPQL 의 {@code s.consultantId IS NOT NULL}
        // 은 historical/마이그레이션 데이터에 대한 방어적 filter — 운영·테스트 환경
        // 모두 schema 가 NULL 을 차단하므로 본 테스트에서 직접 케이스를 만들 수 없다.
        Schedule active = saveCompleted(tenantId, consultantA, LocalDate.of(2026, 4, 7));

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                tenantId, TARGET_STATUSES, START, END, TODAY_FUTURE);

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
        Long smaller = Math.min(consultantA, consultantB);
        Long larger = Math.max(consultantA, consultantB);

        saveCompleted(tenantId, smaller, LocalDate.of(2026, 3, 31));
        saveCompleted(tenantId, smaller, LocalDate.of(2026, 4, 1));
        saveCompleted(tenantId, smaller, LocalDate.of(2026, 4, 22));
        saveCompleted(tenantId, larger, LocalDate.of(2026, 4, 15));
        saveCompleted(tenantId, larger, LocalDate.of(2026, 4, 30));
        saveCompleted(tenantId, larger, LocalDate.of(2026, 5, 1));

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                tenantId, TARGET_STATUSES, START, END, TODAY_FUTURE);

        assertThat(rows).hasSize(4);
        assertThat(rows).extracting(r -> r[0], r -> r[1])
                .containsExactly(
                        tuple(smaller, LocalDate.of(2026, 4, 1)),
                        tuple(smaller, LocalDate.of(2026, 4, 22)),
                        tuple(larger, LocalDate.of(2026, 4, 15)),
                        tuple(larger, LocalDate.of(2026, 4, 30)));
    }

    // ─── F1 (R5) ────────────────────────────────────────────────────────

    @Test
    @DisplayName("F1: 「과거 + CONFIRMED + 일지 미작성」 → 응답 포함 (R5 도메인 SSOT 회귀 가드)")
    void f1_pastConfirmedMissingLog_included() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();
        LocalDate confirmedDate = LocalDate.of(2026, 4, 12);

        saveSchedule(tenantId, consultantA, confirmedDate,
                ScheduleStatus.CONFIRMED, false);

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                tenantId, TARGET_STATUSES, START, END, TODAY_FUTURE);

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0)[0]).isEqualTo(consultantA);
        assertThat(rows.get(0)[1]).isEqualTo(confirmedDate);
    }

    // ─── F2 (R5) ────────────────────────────────────────────────────────

    @Test
    @DisplayName("F2: 「과거 + BOOKED + 일지 미작성」 → 응답 포함 (R5 도메인 SSOT 회귀 가드)")
    void f2_pastBookedMissingLog_included() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();
        LocalDate bookedDate = LocalDate.of(2026, 4, 18);

        saveSchedule(tenantId, consultantA, bookedDate,
                ScheduleStatus.BOOKED, false);

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                tenantId, TARGET_STATUSES, START, END, TODAY_FUTURE);

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0)[0]).isEqualTo(consultantA);
        assertThat(rows.get(0)[1]).isEqualTo(bookedDate);
    }

    // ─── F3 (R5) ────────────────────────────────────────────────────────

    @Test
    @DisplayName("F3: 「오늘 또는 미래 + CONFIRMED」 → 응답 제외 (date < today 컷)")
    void f3_todayOrFutureConfirmed_excluded() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();
        // today = 2026-04-15 로 고정. today 그 자체와 +1 일을 모두 제외해야 함.
        LocalDate today = LocalDate.of(2026, 4, 15);
        LocalDate past = LocalDate.of(2026, 4, 14);

        saveSchedule(tenantId, consultantA, today,
                ScheduleStatus.CONFIRMED, false);
        saveSchedule(tenantId, consultantA, today.plusDays(1),
                ScheduleStatus.CONFIRMED, false);
        saveSchedule(tenantId, consultantA, past,
                ScheduleStatus.CONFIRMED, false);

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                tenantId, TARGET_STATUSES, START, END, today);

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0)[0]).isEqualTo(consultantA);
        assertThat(rows.get(0)[1]).isEqualTo(past);
    }

    // ─── F4 (R5) ────────────────────────────────────────────────────────

    @Test
    @DisplayName("F4: 「과거 + COMPLETED + 일지 미작성」 → 응답 포함 (기존 회귀 0)")
    void f4_pastCompletedMissingLog_included() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();
        LocalDate completedDate = LocalDate.of(2026, 4, 8);

        saveCompleted(tenantId, consultantA, completedDate);

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                tenantId, TARGET_STATUSES, START, END, TODAY_FUTURE);

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0)[0]).isEqualTo(consultantA);
        assertThat(rows.get(0)[1]).isEqualTo(completedDate);
    }

    // ─── F5 (R5) ────────────────────────────────────────────────────────

    @Test
    @DisplayName("F5: 「과거 + COMPLETED + 일지 있음」 → 응답 제외")
    void f5_pastCompletedWithLog_excluded() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();

        Schedule schedule = saveCompleted(tenantId, consultantA, LocalDate.of(2026, 4, 9));
        ConsultationRecord record = ConsultationRecord.builder()
                .consultationId(schedule.getId())
                .clientId(schedule.getClientId())
                .consultantId(consultantA)
                .sessionDate(schedule.getDate())
                .build();
        record.setTenantId(tenantId);
        record.setIsDeleted(false);
        consultationRecordRepository.save(record);

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsInDateRange(
                tenantId, TARGET_STATUSES, START, END, TODAY_FUTURE);

        assertThat(rows).isEmpty();
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
