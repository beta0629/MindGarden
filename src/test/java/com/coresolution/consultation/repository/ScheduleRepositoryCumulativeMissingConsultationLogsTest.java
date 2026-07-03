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
 * {@link ScheduleRepository#findMissingConsultationLogScheduleRowsBeforeDate} 검증.
 *
 * <p>2026-07-03 — 어드민 대시보드 «상담일지 누락» 섹션이 현재 월만 조회하여 이전 달
 * 누락 건을 놓치던 버그 보정. 누적(전체 기간) 조회의 Repository SSOT. 월 범위(BETWEEN)
 * 를 제거하고 {@code s.date < :today} 컷만 적용하므로, 서로 다른 달의 누락이 한 번에
 * 반환되는지가 핵심 회귀 가드다.</p>
 *
 * <p>테스트 매트릭스 (C1~C5):</p>
 * <ul>
 *   <li>C1: 멀티테넌트 격리 — 다른 tenant 데이터 제외</li>
 *   <li>C2: 월 경계 무관 — 5월·6월·7월 누락이 모두 반환 (버그 회귀 가드 핵심)</li>
 *   <li>C3: ConsultationRecord 존재 시 제외 (LEFT JOIN 키 = schedule.id)</li>
 *   <li>C4: {@code date < today} 컷 — today 당일/미래 제외, 과거 포함</li>
 *   <li>C5: 비대상 상태(CANCELLED 등) 제외 + 정렬(consultantId ASC, date ASC)</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-07-03
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@Transactional
@ActiveProfiles("test")
@DisplayName("ScheduleRepository.findMissingConsultationLogScheduleRowsBeforeDate — 누적 상담일지 누락")
class ScheduleRepositoryCumulativeMissingConsultationLogsTest {

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private ConsultationRecordRepository consultationRecordRepository;

    // 5~7월 데이터가 모두 today 보다 과거이도록 충분히 미래의 today 사용.
    private static final LocalDate TODAY_FUTURE = LocalDate.of(2026, 8, 1);

    private static final Set<ScheduleStatus> TARGET_STATUSES =
            EnumSet.of(ScheduleStatus.COMPLETED, ScheduleStatus.CONFIRMED, ScheduleStatus.BOOKED);

    // ─── C1 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("C1: 멀티테넌트 격리 — 다른 tenantId 누락 일정은 결과에서 제외")
    void c1_tenantIsolation() {
        String tenantId = UUID.randomUUID().toString();
        String otherTenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();

        saveCompleted(tenantId, consultantA, LocalDate.of(2026, 6, 30));
        saveCompleted(otherTenantId, consultantA, LocalDate.of(2026, 6, 30));

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsBeforeDate(
                tenantId, TARGET_STATUSES, TODAY_FUTURE);

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0)[0]).isEqualTo(consultantA);
        assertThat(rows.get(0)[1]).isEqualTo(LocalDate.of(2026, 6, 30));
    }

    // ─── C2 (버그 회귀 가드 핵심) ─────────────────────────────────────────

    @Test
    @DisplayName("C2: 월 경계 무관 — 5월·6월·7월 누락이 한 번에 모두 반환 (7/3 접속 시 6/30 미집계 버그 회귀 가드)")
    void c2_crossMonth_allReturned() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();

        saveCompleted(tenantId, consultantA, LocalDate.of(2026, 5, 20));
        saveSchedule(tenantId, consultantA, LocalDate.of(2026, 6, 30),
                ScheduleStatus.CONFIRMED, false);
        saveCompleted(tenantId, consultantA, LocalDate.of(2026, 7, 1));

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsBeforeDate(
                tenantId, TARGET_STATUSES, TODAY_FUTURE);

        assertThat(rows).extracting(r -> r[0], r -> r[1])
                .containsExactly(
                        tuple(consultantA, LocalDate.of(2026, 5, 20)),
                        tuple(consultantA, LocalDate.of(2026, 6, 30)),
                        tuple(consultantA, LocalDate.of(2026, 7, 1)));
    }

    // ─── C3 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("C3: ConsultationRecord 존재 시 제외 (LEFT JOIN 키 = schedule.id)")
    void c3_consultationRecordPresent_excluded() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();

        Schedule withRecord = saveCompleted(tenantId, consultantA, LocalDate.of(2026, 6, 15));
        Schedule missing = saveCompleted(tenantId, consultantA, LocalDate.of(2026, 6, 30));

        ConsultationRecord record = ConsultationRecord.builder()
                .consultationId(withRecord.getId())
                .clientId(withRecord.getClientId())
                .consultantId(consultantA)
                .sessionDate(withRecord.getDate())
                .build();
        record.setTenantId(tenantId);
        record.setIsDeleted(false);
        consultationRecordRepository.save(record);

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsBeforeDate(
                tenantId, TARGET_STATUSES, TODAY_FUTURE);

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0)[0]).isEqualTo(consultantA);
        assertThat(rows.get(0)[1]).isEqualTo(missing.getDate());
    }

    // ─── C4 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("C4: date < today 컷 — today 당일/미래 제외, 과거(직전 달 포함) 포함")
    void c4_dateBeforeTodayCut() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();
        LocalDate today = LocalDate.of(2026, 7, 3);

        saveSchedule(tenantId, consultantA, LocalDate.of(2026, 6, 30),
                ScheduleStatus.CONFIRMED, false);
        saveSchedule(tenantId, consultantA, today, ScheduleStatus.CONFIRMED, false);
        saveSchedule(tenantId, consultantA, today.plusDays(1), ScheduleStatus.CONFIRMED, false);

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsBeforeDate(
                tenantId, TARGET_STATUSES, today);

        assertThat(rows).hasSize(1);
        assertThat(rows.get(0)[0]).isEqualTo(consultantA);
        assertThat(rows.get(0)[1]).isEqualTo(LocalDate.of(2026, 6, 30));
    }

    // ─── C5 ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("C5: 비대상 상태(CANCELLED) 제외 + 정렬(consultantId ASC, date ASC)")
    void c5_nonTargetExcludedAndOrdering() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantA = randomId();
        Long consultantB = randomId();
        Long smaller = Math.min(consultantA, consultantB);
        Long larger = Math.max(consultantA, consultantB);

        saveSchedule(tenantId, smaller, LocalDate.of(2026, 6, 10),
                ScheduleStatus.CANCELLED, false);
        saveCompleted(tenantId, smaller, LocalDate.of(2026, 6, 20));
        saveCompleted(tenantId, smaller, LocalDate.of(2026, 5, 5));
        saveCompleted(tenantId, larger, LocalDate.of(2026, 6, 30));

        List<Object[]> rows = scheduleRepository.findMissingConsultationLogScheduleRowsBeforeDate(
                tenantId, TARGET_STATUSES, TODAY_FUTURE);

        assertThat(rows).extracting(r -> r[0], r -> r[1])
                .containsExactly(
                        tuple(smaller, LocalDate.of(2026, 5, 5)),
                        tuple(smaller, LocalDate.of(2026, 6, 20)),
                        tuple(larger, LocalDate.of(2026, 6, 30)));
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
