package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ScheduleCreatedNotificationCopy;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.util.ConsultationMessageTypeCodes;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link ScheduleCreatedNotificationHelper} 구현. 스케줄 저장 트랜잭션과 분리(REQUIRES_NEW).
 *
 * @author MindGarden
 * @since 2026-05-18
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleCreatedNotificationHelperImpl implements ScheduleCreatedNotificationHelper {

    private final ConsultationMessageService consultationMessageService;
    private final MobilePushDispatchService mobilePushDispatchService;
    private final CommonCodeService commonCodeService;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyScheduleCreated(Schedule schedule, boolean includeMobilePush) {
        if (schedule == null || schedule.getConsultantId() == null || schedule.getClientId() == null) {
            return;
        }
        if (schedule.getStatus() != ScheduleStatus.BOOKED && schedule.getStatus() != ScheduleStatus.CONFIRMED) {
            return;
        }

        try {
            log.info("예약 생성 알림 발송: scheduleId={}", schedule.getId());

            String clientMessageType = ConsultationMessageTypeCodes.resolve(
                    commonCodeService,
                    ScheduleCreatedNotificationCopy.COMMON_CODE_KEY_CLIENT,
                    ScheduleCreatedNotificationCopy.MESSAGE_TYPE_CLIENT);
            String consultantMessageType = ConsultationMessageTypeCodes.resolve(
                    commonCodeService,
                    ScheduleCreatedNotificationCopy.COMMON_CODE_KEY_CONSULTANT,
                    ScheduleCreatedNotificationCopy.MESSAGE_TYPE_CONSULTANT);

            String clientMessage = String.format(
                    "상담 예약이 완료되었습니다.\n📅 날짜: %s\n⏰ 시간: %s - %s",
                    schedule.getDate(),
                    schedule.getStartTime(),
                    schedule.getEndTime());

            consultationMessageService.sendMessage(
                    schedule.getConsultantId(),
                    schedule.getClientId(),
                    null,
                    getRoleCode(UserRole.CONSULTANT.name()),
                    ScheduleCreatedNotificationCopy.TITLE_CLIENT,
                    clientMessage,
                    clientMessageType,
                    false,
                    false);

            String consultantMessage = String.format(
                    "새로운 상담 예약이 있습니다.\n📅 날짜: %s\n⏰ 시간: %s - %s",
                    schedule.getDate(),
                    schedule.getStartTime(),
                    schedule.getEndTime());

            consultationMessageService.sendMessage(
                    schedule.getConsultantId(),
                    schedule.getClientId(),
                    null,
                    getRoleCode(UserRole.CLIENT.name()),
                    ScheduleCreatedNotificationCopy.TITLE_CONSULTANT,
                    consultantMessage,
                    consultantMessageType,
                    false,
                    false);

            String tid = schedule.getTenantId();
            if (tid == null || tid.isBlank()) {
                tid = TenantContextHolder.getTenantId();
            }
            if (includeMobilePush && tid != null && !tid.isBlank()) {
                mobilePushDispatchService.dispatchBookingConfirmed(tid, schedule);
            }

            log.info("예약 생성 알림 완료: scheduleId={}", schedule.getId());
        } catch (Exception e) {
            log.error("예약 생성 알림 실패: scheduleId={}", schedule.getId(), e);
        }
    }

    private String getRoleCode(String roleName) {
        try {
            String codeValue = commonCodeService.getCodeValue("ROLE", roleName);
            return codeValue != null ? codeValue : roleName;
        } catch (Exception e) {
            return roleName;
        }
    }
}
