package com.coresolution.consultation.service.impl;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.config.ImmediateReservationSmsProperties;
import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.constant.ImmediateReservationSmsPendingStatus;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ImmediateReservationSmsPending;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ImmediateReservationSmsPendingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.ImmediateReservationSmsDeferralService;
import com.coresolution.consultation.util.ReservationSmsBusinessHours;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import lombok.extern.slf4j.Slf4j;

/**
 * 예약 즉시 SMS 업무시간 외 지연 발송 구현.
 *
 * @author MindGarden
 * @since 2026-07-29
 */
@Slf4j
@Service
public class ImmediateReservationSmsDeferralServiceImpl
        implements ImmediateReservationSmsDeferralService {

    private final ImmediateReservationSmsPendingRepository pendingRepository;
    private final ScheduleRepository scheduleRepository;
    private final BatchNotificationDispatchService batchNotificationDispatchService;
    private final ImmediateReservationSmsProperties properties;
    private final Clock clock;

    /**
     * 운영용 생성자 (Asia/Seoul 시계).
     *
     * @param pendingRepository                pending 저장소
     * @param scheduleRepository               스케줄 저장소
     * @param batchNotificationDispatchService 배치/즉시 SMS 디스패치
     * @param properties                       업무시간·스케줄러 설정
     */
    @Autowired
    public ImmediateReservationSmsDeferralServiceImpl(
            ImmediateReservationSmsPendingRepository pendingRepository,
            ScheduleRepository scheduleRepository,
            BatchNotificationDispatchService batchNotificationDispatchService,
            ImmediateReservationSmsProperties properties) {
        this(
                pendingRepository,
                scheduleRepository,
                batchNotificationDispatchService,
                properties,
                Clock.system(ReservationSmsBusinessHours.ZONE_SEOUL));
    }

    /**
     * 테스트용 시계 주입 생성자.
     *
     * @param clock 고정·가변 시계
     */
    ImmediateReservationSmsDeferralServiceImpl(
            ImmediateReservationSmsPendingRepository pendingRepository,
            ScheduleRepository scheduleRepository,
            BatchNotificationDispatchService batchNotificationDispatchService,
            ImmediateReservationSmsProperties properties,
            Clock clock) {
        this.pendingRepository = pendingRepository;
        this.scheduleRepository = scheduleRepository;
        this.batchNotificationDispatchService = batchNotificationDispatchService;
        this.properties = properties;
        this.clock = clock;
    }

    @Override
    public Optional<LocalDateTime> resolveDeferredFireAt() {
        if (properties == null || !properties.isEnabled()) {
            return Optional.empty();
        }
        return ReservationSmsBusinessHours.resolveDeferredFireAt(
                clock, properties.getBusinessStart(), properties.getBusinessEnd());
    }

    @Override
    @Transactional
    public void enqueue(String tenantId, Long scheduleId, String templateCode, LocalDateTime fireAt) {
        if (!StringUtils.hasText(tenantId) || scheduleId == null || !StringUtils.hasText(templateCode)
                || fireAt == null) {
            log.warn(
                    "즉시 SMS 지연 enqueue 생략: tenantId={}, scheduleId={}, templateCode={}, fireAt={}",
                    tenantId,
                    scheduleId,
                    templateCode,
                    fireAt);
            return;
        }

        if (pendingRepository.existsByTenantIdAndScheduleIdAndTemplateCodeAndStatusAndIsDeletedFalse(
                tenantId, scheduleId, templateCode, ImmediateReservationSmsPendingStatus.SENT)) {
            log.info(
                    "즉시 SMS 지연 skip(이미 SENT): tenantId={}, scheduleId={}, templateCode={}",
                    tenantId,
                    scheduleId,
                    templateCode);
            return;
        }

        Optional<ImmediateReservationSmsPending> existingOpt =
                pendingRepository.findFirstByTenantIdAndScheduleIdAndTemplateCodeAndStatusAndIsDeletedFalse(
                        tenantId,
                        scheduleId,
                        templateCode,
                        ImmediateReservationSmsPendingStatus.PENDING);

        if (existingOpt.isPresent()) {
            ImmediateReservationSmsPending existing = existingOpt.get();
            existing.setFireAt(fireAt);
            pendingRepository.save(existing);
            log.info(
                    "즉시 SMS 지연 fire_at 갱신: scheduleId={}, templateCode={}, fireAt={}",
                    scheduleId,
                    templateCode,
                    fireAt);
            return;
        }

        ImmediateReservationSmsPending pending = ImmediateReservationSmsPending.builder()
                .tenantId(tenantId)
                .scheduleId(scheduleId)
                .templateCode(templateCode)
                .fireAt(fireAt)
                .status(ImmediateReservationSmsPendingStatus.PENDING)
                .build();
        pendingRepository.save(pending);
        log.info(
                "즉시 SMS 지연 pending 등록: scheduleId={}, templateCode={}, fireAt={}",
                scheduleId,
                templateCode,
                fireAt);
    }

    @Override
    @Transactional
    public int processDuePending() {
        LocalDateTime now = LocalDateTime.now(clock);
        List<ImmediateReservationSmsPending> due = pendingRepository.findDuePending(
                ImmediateReservationSmsPendingStatus.PENDING, now);
        int processed = 0;
        for (ImmediateReservationSmsPending pending : due) {
            try {
                if (processOne(pending)) {
                    processed++;
                }
            } catch (Exception e) {
                log.warn(
                        "즉시 SMS 지연 처리 실패(다음 폴링 재시도): pendingId={}, scheduleId={}, {}",
                        pending.getId(),
                        pending.getScheduleId(),
                        e.getMessage());
            }
        }
        return processed;
    }

    private boolean processOne(ImmediateReservationSmsPending pending) {
        String tenantId = pending.getTenantId();
        if (!StringUtils.hasText(tenantId)) {
            mark(pending, ImmediateReservationSmsPendingStatus.SKIPPED_CANCELLED);
            return true;
        }

        String previousTenant = TenantContextHolder.getTenantId();
        try {
            TenantContextHolder.setTenantId(tenantId);

            Optional<Schedule> scheduleOpt =
                    scheduleRepository.findByTenantIdAndId(tenantId, pending.getScheduleId());
            if (scheduleOpt.isEmpty()) {
                mark(pending, ImmediateReservationSmsPendingStatus.SKIPPED_CANCELLED);
                return true;
            }
            Schedule schedule = scheduleOpt.get();
            ScheduleStatus status = schedule.getStatus();
            if (status == ScheduleStatus.CANCELLED) {
                mark(pending, ImmediateReservationSmsPendingStatus.SKIPPED_CANCELLED);
                return true;
            }
            if (status != ScheduleStatus.BOOKED
                    && status != ScheduleStatus.CONFIRMED
                    && status != ScheduleStatus.TENTATIVE_PENDING_PAYMENT) {
                mark(pending, ImmediateReservationSmsPendingStatus.SKIPPED_CANCELLED);
                return true;
            }

            if (pendingRepository.existsByTenantIdAndScheduleIdAndTemplateCodeAndStatusAndIsDeletedFalse(
                    tenantId,
                    pending.getScheduleId(),
                    pending.getTemplateCode(),
                    ImmediateReservationSmsPendingStatus.SENT)) {
                mark(pending, ImmediateReservationSmsPendingStatus.SKIPPED_DUPLICATE);
                return true;
            }

            dispatchByTemplateCode(pending.getTemplateCode(), pending.getScheduleId());
            mark(pending, ImmediateReservationSmsPendingStatus.SENT);
            return true;
        } finally {
            if (StringUtils.hasText(previousTenant)) {
                TenantContextHolder.setTenantId(previousTenant);
            } else {
                TenantContextHolder.clear();
            }
        }
    }

    private void dispatchByTemplateCode(String templateCode, Long scheduleId) {
        if (BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_SINGLE.equals(templateCode)) {
            batchNotificationDispatchService.dispatchReservationImmediateSingle(scheduleId);
        } else if (BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2.equals(templateCode)) {
            batchNotificationDispatchService.dispatchReservationReminderD2(scheduleId);
        } else if (BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE.equals(templateCode)) {
            batchNotificationDispatchService.dispatchReservationImmediateLate(scheduleId);
        } else {
            log.warn(
                    "즉시 SMS 지연 알 수 없는 templateCode: templateCode={}, scheduleId={}",
                    templateCode,
                    scheduleId);
        }
    }

    private void mark(ImmediateReservationSmsPending pending, String status) {
        pending.setStatus(status);
        pending.setProcessedAt(LocalDateTime.now(clock));
        pendingRepository.save(pending);
    }
}
