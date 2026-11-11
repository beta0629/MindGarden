package com.coresolution.consultation.service.impl;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.constant.BookingReminderPushConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.ImmediateReservationSmsDeferralService;
import com.coresolution.consultation.service.ReservationReminderRescheduleService;
import com.coresolution.consultation.util.ReservationSmsBusinessHours;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import lombok.extern.slf4j.Slf4j;

/**
 * {@link ReservationReminderRescheduleService} 구현.
 *
 * <p>새 날짜까지 남은 일수가 {@link BookingReminderPushConstants#REMINDER_D1_DAYS_AHEAD} 이하
 * (내일·오늘)이고 시작 전이면 {@link BatchNotificationTemplateCodes#RESERVATION_IMMEDIATE_LATE}
 * (D-1·D-0 배치와 같은 종목·슬롯 멱등)로 발송한다. 업무시간 외면 지연 PENDING 으로 넘기고,
 * 그 PENDING 이 있는 날은 09:00 배치가 같은 일정을 건너뛰므로 한 번만 나간다.
 * 그 외(D+2 이상)는 아무것도 하지 않는다 — 다음 09:00 배치가 새 슬롯으로 보낸다.
 *
 * @author MindGarden
 * @since 2026-11-11
 */
@Slf4j
@Service
public class ReservationReminderRescheduleServiceImpl implements ReservationReminderRescheduleService {

    private final BatchNotificationDispatchService batchNotificationDispatchService;
    private final ImmediateReservationSmsDeferralService immediateReservationSmsDeferralService;
    private final TransactionTemplate requiresNewTransaction;
    private final Clock clock;

    /**
     * 운영 생성자 (Asia/Seoul 시계).
     *
     * @param batchNotificationDispatchService       예약 SMS 디스패치 (슬롯 멱등)
     * @param immediateReservationSmsDeferralService 업무시간 외 지연 PENDING
     * @param transactionManager                     커밋 후 실행분을 새 트랜잭션으로 묶기 위한 매니저
     */
    @Autowired
    public ReservationReminderRescheduleServiceImpl(
            BatchNotificationDispatchService batchNotificationDispatchService,
            ImmediateReservationSmsDeferralService immediateReservationSmsDeferralService,
            PlatformTransactionManager transactionManager) {
        this(batchNotificationDispatchService, immediateReservationSmsDeferralService,
            requiresNew(transactionManager), Clock.system(ReservationSmsBusinessHours.ZONE_SEOUL));
    }

    /**
     * 테스트용 시계 주입 생성자.
     *
     * @param batchNotificationDispatchService       예약 SMS 디스패치
     * @param immediateReservationSmsDeferralService 지연 PENDING
     * @param requiresNewTransaction                 새 트랜잭션 템플릿 ({@code null} 이면 그대로 실행)
     * @param clock                                  기준 시계
     */
    ReservationReminderRescheduleServiceImpl(
            BatchNotificationDispatchService batchNotificationDispatchService,
            ImmediateReservationSmsDeferralService immediateReservationSmsDeferralService,
            TransactionTemplate requiresNewTransaction,
            Clock clock) {
        this.batchNotificationDispatchService = batchNotificationDispatchService;
        this.immediateReservationSmsDeferralService = immediateReservationSmsDeferralService;
        this.requiresNewTransaction = requiresNewTransaction;
        this.clock = clock;
    }

    private static TransactionTemplate requiresNew(PlatformTransactionManager transactionManager) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return template;
    }

    @Override
    public void onSlotChanged(String tenantId, Schedule schedule) {
        if (tenantId == null || tenantId.isBlank() || !isCatchUpTarget(schedule)) {
            return;
        }
        Long scheduleId = schedule.getId();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    dispatchOrDefer(tenantId, scheduleId);
                }
            });
            return;
        }
        dispatchOrDefer(tenantId, scheduleId);
    }

    /**
     * 새 슬롯이 내일·오늘이고 아직 시작 전인 예약 상태 일정인지.
     *
     * @param schedule 일정
     * @return 대상이면 {@code true}
     */
    boolean isCatchUpTarget(Schedule schedule) {
        if (schedule == null || schedule.getId() == null || schedule.getClientId() == null
                || schedule.getDate() == null || schedule.getStartTime() == null) {
            return false;
        }
        ScheduleStatus status = schedule.getStatus();
        if (status == null || !status.isReservationReminderSmsEligible()) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now(clock);
        if (!LocalDateTime.of(schedule.getDate(), schedule.getStartTime()).isAfter(now)) {
            return false;
        }
        long daysUntil = ChronoUnit.DAYS.between(now.toLocalDate(), schedule.getDate());
        return daysUntil >= 0 && daysUntil <= BookingReminderPushConstants.REMINDER_D1_DAYS_AHEAD;
    }

    /**
     * 커밋 후 콜백 안에서는 원래 트랜잭션 자원이 남아 있어 REQUIRED 쓰기가 반영되지 않을 수 있다 —
     * 지연 PENDING 등록·발송 로그는 새 트랜잭션으로 실행한다.
     */
    private void dispatchOrDefer(String tenantId, Long scheduleId) {
        if (requiresNewTransaction == null) {
            dispatchOrDeferInCurrentTransaction(tenantId, scheduleId);
            return;
        }
        try {
            requiresNewTransaction.executeWithoutResult(
                status -> dispatchOrDeferInCurrentTransaction(tenantId, scheduleId));
        } catch (Exception e) {
            log.warn("새 슬롯 D-1 리마인드 트랜잭션 실패(본 처리 롤백 없음): tenantId={}, scheduleId={}, {}",
                tenantId, scheduleId, e.getMessage());
        }
    }

    private void dispatchOrDeferInCurrentTransaction(String tenantId, Long scheduleId) {
        String previousTenantId = TenantContextHolder.getTenantId();
        boolean switchTenant = !tenantId.equals(previousTenantId);
        if (switchTenant) {
            TenantContextHolder.setTenantId(tenantId);
        }
        try {
            dispatchOrDeferForTenant(tenantId, scheduleId);
        } finally {
            if (switchTenant) {
                if (previousTenantId == null) {
                    TenantContextHolder.clear();
                } else {
                    TenantContextHolder.setTenantId(previousTenantId);
                }
            }
        }
    }

    /** 디스패치는 {@link TenantContextHolder} 테넌트로 일정을 찾으므로 호출 전 테넌트를 고정한다. */
    private void dispatchOrDeferForTenant(String tenantId, Long scheduleId) {
        String templateCode = BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE;
        try {
            Optional<LocalDateTime> deferredFireAt = immediateReservationSmsDeferralService.resolveDeferredFireAt();
            if (deferredFireAt.isPresent()) {
                immediateReservationSmsDeferralService.enqueue(
                    tenantId, scheduleId, templateCode, deferredFireAt.get());
                log.info("새 슬롯 D-1 리마인드 업무시간 외 지연: tenantId={}, scheduleId={}, fireAt={}",
                    tenantId, scheduleId, deferredFireAt.get());
                return;
            }
            BatchNotificationDispatchService.DispatchOutcome outcome =
                batchNotificationDispatchService.dispatchReservationImmediateLate(scheduleId);
            log.info("새 슬롯 D-1 리마인드 발송 시도: tenantId={}, scheduleId={}, status={}",
                tenantId, scheduleId, outcome != null ? outcome.status() : null);
        } catch (Exception e) {
            log.warn("새 슬롯 D-1 리마인드 실패(본 처리 롤백 없음): tenantId={}, scheduleId={}, {}",
                tenantId, scheduleId, e.getMessage());
        }
    }
}
