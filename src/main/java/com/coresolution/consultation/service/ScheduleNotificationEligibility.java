package com.coresolution.consultation.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Objects;
import java.util.Optional;

import com.coresolution.consultation.constant.ScheduleNotificationEligibilityCodes;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Consultation;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ConsultationRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * 예약 알림 발송 직전, 일정과 연결 상담을 테넌트 범위로 다시 읽어 보낼 수 있는지 판정한다.
 *
 * <p>목록 조회 뒤 취소·완료·휴가·삭제·일시 이동이 있거나, 연결 상담이 취소되면 보내지 않는다.
 * 조회는 {@code findByTenantIdAndId} 만 사용한다.
 *
 * @author MindGarden
 * @since 2026-10-23
 */
@Component
@RequiredArgsConstructor
public class ScheduleNotificationEligibility {

    private final ScheduleRepository scheduleRepository;
    private final ConsultationRepository consultationRepository;

    /**
     * 저장된 일정이 기대 슬롯과 같고 차단 상태가 아니면 발송한다.
     *
     * @param tenantId 테넌트 ID
     * @param scheduleId 일정 ID
     * @param expectedDate 발송 시점에 기대한 상담일
     * @param expectedStart 발송 시점에 기대한 시작 시각
     * @return 인앱·푸시를 보내도 되면 true
     */
    @Transactional(readOnly = true)
    public boolean isSendable(String tenantId, Long scheduleId, LocalDate expectedDate, LocalTime expectedStart) {
        if (tenantId == null || tenantId.isBlank() || scheduleId == null
                || expectedDate == null || expectedStart == null) {
            return false;
        }
        Optional<Schedule> found = scheduleRepository.findByTenantIdAndId(tenantId, scheduleId);
        if (found.isEmpty()) {
            return false;
        }
        Schedule schedule = found.get();
        if (schedule.isDeleted()) {
            return false;
        }
        ScheduleStatus status = schedule.getStatus();
        if (status == null
                || ScheduleNotificationEligibilityCodes.BLOCKED_SCHEDULE_STATUSES.contains(status)) {
            return false;
        }
        if (!Objects.equals(schedule.getDate(), expectedDate)
                || !Objects.equals(schedule.getStartTime(), expectedStart)) {
            return false;
        }
        Long consultationId = schedule.getConsultationId();
        if (consultationId == null) {
            return true;
        }
        Optional<Consultation> consultation = consultationRepository.findByTenantIdAndId(tenantId, consultationId);
        if (consultation.isEmpty()) {
            return false;
        }
        return !ScheduleNotificationEligibilityCodes.BLOCKED_CONSULTATION_STATUS.equals(
                consultation.get().getStatus());
    }
}
