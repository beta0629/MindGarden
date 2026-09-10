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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link ScheduleRepository#findIncompleteRecords} — schedule id only SSOT 정합.
 *
 * <p>일자 B 제거: consultant+client+sessionDate 일치만으로는 incomplete 제외 안 됨.
 * B 제거 사유는 create-gate 가 아니라 모달 find→edit→UPDATE collapse 방지.</p>
 *
 * @author CoreSolution
 * @since 2026-09-04
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@Transactional
@ActiveProfiles("test")
@DisplayName("ScheduleRepository.findIncompleteRecords — incomplete KPI SSOT")
class ScheduleRepositoryFindIncompleteRecordsSsotTest {

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private ConsultationRecordRepository consultationRecordRepository;

    private static final Set<ScheduleStatus> TARGET_STATUSES =
            EnumSet.of(ScheduleStatus.COMPLETED, ScheduleStatus.CONFIRMED, ScheduleStatus.BOOKED);

    private static final LocalDate TODAY = LocalDate.of(2026, 5, 15);

    @Test
    @DisplayName("B-only 레거시 행 → incomplete 유지 (schedule id only)")
    void bOnlyLegacyRecord_stillIncomplete() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantId = randomId();
        LocalDate sessionDate = LocalDate.of(2026, 4, 12);

        Schedule schedule = saveCompleted(tenantId, consultantId, sessionDate);

        ConsultationRecord record = ConsultationRecord.builder()
                .consultationId(randomId())
                .clientId(schedule.getClientId())
                .consultantId(consultantId)
                .sessionDate(sessionDate)
                .isSessionCompleted(false)
                .build();
        record.setTenantId(tenantId);
        record.setIsDeleted(false);
        consultationRecordRepository.save(record);

        List<Schedule> incomplete = scheduleRepository.findIncompleteRecords(
                tenantId, consultantId, TARGET_STATUSES, TODAY, PageRequest.of(0, 10));

        assertThat(incomplete).extracting(Schedule::getId).containsExactly(schedule.getId());
    }

    @Test
    @DisplayName("일지 없음 → incomplete 포함")
    void noRecord_includedInIncomplete() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantId = randomId();
        Schedule schedule = saveCompleted(tenantId, consultantId, LocalDate.of(2026, 4, 10));

        List<Schedule> incomplete = scheduleRepository.findIncompleteRecords(
                tenantId, consultantId, TARGET_STATUSES, TODAY, PageRequest.of(0, 10));

        assertThat(incomplete).extracting(Schedule::getId).containsExactly(schedule.getId());
    }

    @Test
    @DisplayName("existsActiveForScheduleSsot: B-only → false (schedule id only)")
    void existsActiveForScheduleSsot_bOnly_false() {
        String tenantId = UUID.randomUUID().toString();
        Long consultantId = randomId();
        LocalDate sessionDate = LocalDate.of(2026, 4, 12);
        Schedule schedule = saveCompleted(tenantId, consultantId, sessionDate);

        ConsultationRecord record = ConsultationRecord.builder()
                .consultationId(randomId())
                .clientId(schedule.getClientId())
                .consultantId(consultantId)
                .sessionDate(sessionDate)
                .build();
        record.setTenantId(tenantId);
        record.setIsDeleted(false);
        consultationRecordRepository.save(record);

        boolean exists = consultationRecordRepository.existsActiveForScheduleSsot(
                tenantId, schedule.getId());

        assertThat(exists).isFalse();
    }

    @Test
    @DisplayName("같은 날 A·B: find(B)는 A 일지 미반환 → FE는 PUT이 아니라 POST create")
    void sameDay_aHasRecord_bStillIncomplete() {
        // 회귀: 구 A|B 의 B-match 로 모달이 A 일지를 로드→edit→UPDATE 하면 collapse.
        // schedule id only 이면 B find 가 비어 FE 가 POST create 한다 (create-gate 아님).
        String tenantId = UUID.randomUUID().toString();
        Long consultantId = randomId();
        Long clientId = randomId();
        LocalDate sameDay = LocalDate.of(2026, 4, 12);

        Schedule scheduleA = saveCompletedWithClient(tenantId, consultantId, clientId, sameDay);
        Schedule scheduleB = saveCompletedWithClient(tenantId, consultantId, clientId, sameDay);

        ConsultationRecord recordA = ConsultationRecord.builder()
                .consultationId(scheduleA.getId())
                .clientId(clientId)
                .consultantId(consultantId)
                .sessionDate(sameDay)
                .build();
        recordA.setTenantId(tenantId);
        recordA.setIsDeleted(false);
        consultationRecordRepository.save(recordA);

        List<Schedule> incomplete = scheduleRepository.findIncompleteRecords(
                tenantId, consultantId, TARGET_STATUSES, TODAY, PageRequest.of(0, 10));

        assertThat(incomplete).extracting(Schedule::getId).containsExactly(scheduleB.getId());
        assertThat(consultationRecordRepository.existsActiveForScheduleSsot(tenantId, scheduleB.getId()))
                .isFalse();
        assertThat(consultationRecordRepository.existsActiveForScheduleSsot(tenantId, scheduleA.getId()))
                .isTrue();
        assertThat(consultationRecordRepository.findActiveForScheduleSsot(tenantId, scheduleB.getId()))
                .as("find(B) must not return A's same-day record — FE POST create, not PUT update")
                .isEmpty();
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
