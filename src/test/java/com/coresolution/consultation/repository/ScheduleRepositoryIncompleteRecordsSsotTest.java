package com.coresolution.consultation.repository;

import static org.assertj.core.api.Assertions.assertThat;

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
import java.util.stream.Collectors;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link ScheduleRepository#findIncompleteRecords} — monthly/cumulative missing 과 동일 A|B SSOT.
 *
 * <p>잠금 시나리오:</p>
 * <ul>
 *   <li>I1: COMPLETED + consultationId = schedule.id (A) → incomplete/missing 제외</li>
 *   <li>I2: COMPLETED + orphan consultationId + B매칭 → incomplete·cumulative missing 모두 제외</li>
 *   <li>I3: soft-deleted 로그만 → incomplete/missing 유지</li>
 *   <li>I4: isSessionCompleted=false 이지만 레코드 존재(A|B) → incomplete 제외</li>
 *   <li>I5: 같은 날 두 스케줄(다른 client) — 한쪽만 일지 → 미작성만</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-09-05
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@Transactional
@ActiveProfiles("test")
@DisplayName("ScheduleRepository.findIncompleteRecords — A|B SSOT (missing 정렬)")
class ScheduleRepositoryIncompleteRecordsSsotTest {

    private static final LocalDate SESSION_DATE = LocalDate.of(2026, 9, 1);
    private static final LocalDate TODAY = LocalDate.of(2026, 9, 5);

    private static final Set<ScheduleStatus> MISSING_STATUSES =
            EnumSet.of(ScheduleStatus.COMPLETED, ScheduleStatus.CONFIRMED, ScheduleStatus.BOOKED);

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private ConsultationRecordRepository consultationRecordRepository;

    @Test
    @DisplayName("I1: COMPLETED + consultationId=schedule.id(A) → incomplete·missing 제외")
    void i1_pathA_excludedFromIncompleteAndMissing() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantId = randomId();

        Schedule schedule = saveCompleted(tenantId, consultantId, SESSION_DATE);
        saveRecord(tenantId, schedule.getId(), consultantId, schedule.getClientId(), SESSION_DATE, true);

        List<Schedule> incomplete = findIncomplete(tenantId, consultantId);
        List<Object[]> missing = findCumulativeMissing(tenantId);

        assertThat(incomplete).isEmpty();
        assertThat(missing).isEmpty();
    }

    @Test
    @DisplayName("I2: COMPLETED + orphan consultationId + B매칭 → incomplete·cumulative missing 제외")
    void i2_pathB_orphanKey_excludedFromIncompleteAndCumulativeMissing() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantId = randomId();
        Long orphanConsultationId = randomId();

        Schedule schedule = saveCompleted(tenantId, consultantId, SESSION_DATE);
        saveRecord(tenantId, orphanConsultationId, consultantId, schedule.getClientId(), SESSION_DATE, true);

        List<Schedule> incomplete = findIncomplete(tenantId, consultantId);
        List<Object[]> missing = findCumulativeMissing(tenantId);

        assertThat(incomplete)
                .as("B 경로: incomplete 도 orphan 키여도 consultant+client+sessionDate 일치 시 제외")
                .isEmpty();
        assertThat(missing)
                .as("B 경로: cumulative missing 도 동일 SSOT 로 제외")
                .isEmpty();
    }

    @Test
    @DisplayName("I3: soft-deleted 로그만 → incomplete·missing 유지")
    void i3_softDeletedRecord_stillIncompleteAndMissing() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantId = randomId();

        Schedule schedule = saveCompleted(tenantId, consultantId, SESSION_DATE);
        ConsultationRecord deleted = ConsultationRecord.builder()
                .consultationId(schedule.getId())
                .clientId(schedule.getClientId())
                .consultantId(consultantId)
                .sessionDate(SESSION_DATE)
                .isSessionCompleted(true)
                .build();
        deleted.setTenantId(tenantId);
        deleted.setIsDeleted(true);
        consultationRecordRepository.save(deleted);

        List<Schedule> incomplete = findIncomplete(tenantId, consultantId);
        List<Object[]> missing = findCumulativeMissing(tenantId);

        assertThat(incomplete).extracting(Schedule::getId).containsExactly(schedule.getId());
        assertThat(missing).extracting(r -> r[2]).containsExactly(schedule.getId());
    }

    @Test
    @DisplayName("I4: isSessionCompleted=false + A|B 매칭 → incomplete 제외 (구 SSOT 회귀 방지)")
    void i4_isSessionCompletedFalse_stillExcludedFromIncomplete() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantId = randomId();
        Long orphanConsultationId = randomId();

        Schedule viaA = saveCompleted(tenantId, consultantId, LocalDate.of(2026, 8, 20));
        saveRecord(tenantId, viaA.getId(), consultantId, viaA.getClientId(), viaA.getDate(), false);

        Schedule viaB = saveCompleted(tenantId, consultantId, LocalDate.of(2026, 8, 21));
        saveRecord(tenantId, orphanConsultationId, consultantId, viaB.getClientId(), viaB.getDate(), false);

        List<Schedule> incomplete = findIncomplete(tenantId, consultantId);

        assertThat(incomplete)
                .as("isSessionCompleted=false 여도 레코드 존재(A|B)면 incomplete 제외")
                .isEmpty();
    }

    @Test
    @DisplayName("I5: 같은 날 두 스케줄(다른 client) — 한쪽만 일지 → 미작성만")
    void i5_sameDayDifferentClients_onlyUnwrittenRemains() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantId = randomId();
        Long clientS = randomId();
        Long clientT = randomId();
        Long orphanId = randomId();
        LocalDate sameDay = LocalDate.of(2026, 9, 1);

        Schedule scheduleS = saveCompletedWithClient(tenantId, consultantId, clientS, sameDay);
        Schedule scheduleT = saveCompletedWithClient(tenantId, consultantId, clientT, sameDay);
        saveRecord(tenantId, orphanId, consultantId, clientS, sameDay, true);

        List<Schedule> incomplete = findIncomplete(tenantId, consultantId);
        List<Object[]> missing = findCumulativeMissing(tenantId);

        assertThat(incomplete).extracting(Schedule::getId).containsExactly(scheduleT.getId());
        assertThat(missing).extracting(r -> r[2]).containsExactly(scheduleT.getId());
        assertThat(incomplete.stream().map(Schedule::getId).collect(Collectors.toList()))
                .doesNotContain(scheduleS.getId());
    }

    private List<Schedule> findIncomplete(String tenantId, Long consultantId) {
        return scheduleRepository.findIncompleteRecords(
                tenantId, consultantId, ScheduleStatus.COMPLETED, PageRequest.of(0, 50));
    }

    private List<Object[]> findCumulativeMissing(String tenantId) {
        return scheduleRepository.findMissingConsultationLogScheduleRowsBeforeDate(
                tenantId, MISSING_STATUSES, TODAY);
    }

    private void saveRecord(
            String tenantId,
            Long consultationId,
            Long consultantId,
            Long clientId,
            LocalDate sessionDate,
            boolean sessionCompleted) {
        ConsultationRecord record = ConsultationRecord.builder()
                .consultationId(consultationId)
                .clientId(clientId)
                .consultantId(consultantId)
                .sessionDate(sessionDate)
                .isSessionCompleted(sessionCompleted)
                .build();
        record.setTenantId(tenantId);
        record.setIsDeleted(false);
        consultationRecordRepository.save(record);
    }

    private Schedule saveCompleted(String tenantId, Long consultantId, LocalDate date) {
        return saveCompletedWithClient(tenantId, consultantId, randomId(), date);
    }

    private Schedule saveCompletedWithClient(
            String tenantId, Long consultantId, Long clientId, LocalDate date) {
        Schedule schedule = new Schedule();
        schedule.setTenantId(tenantId);
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setDate(date);
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));
        schedule.setStatus(ScheduleStatus.COMPLETED);
        schedule.setIsDeleted(false);
        return scheduleRepository.save(schedule);
    }

    private Long randomId() {
        return Math.abs(ThreadLocalRandom.current().nextLong(1, Long.MAX_VALUE));
    }
}
