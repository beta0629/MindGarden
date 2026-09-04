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
 * {@link ScheduleRepository#findIncompleteRecords} — missing A|B SSOT 정합.
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
    @DisplayName("B-only 레거시 행 → incomplete 아님")
    void bOnlyLegacyRecord_notIncomplete() {
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

        assertThat(incomplete).isEmpty();
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
    @DisplayName("existsActiveForScheduleSsot: B-only → true")
    void existsActiveForScheduleSsot_bOnly_true() {
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
                tenantId, schedule.getId(), consultantId, schedule.getClientId(), sessionDate);

        assertThat(exists).isTrue();
    }

    private Schedule saveCompleted(String tenantId, Long consultantId, LocalDate date) {
        Schedule schedule = new Schedule();
        schedule.setTenantId(tenantId);
        schedule.setConsultantId(consultantId);
        schedule.setClientId(randomId());
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
