package com.coresolution.consultation.scheduler;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.coresolution.consultation.config.BatchNotificationProperties;
import com.coresolution.consultation.constant.BookingReminderPushConstants;
import com.coresolution.consultation.constant.NotificationSchedulerFlagKeys;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.service.ScheduleMappingContextResolver;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.BatchNotificationDispatchService.DispatchOutcome;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.util.MobilePushMessageFormatter;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import com.coresolution.core.service.TenantService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 예약 D-2 / D-1 / D-0 안내 일괄 발송 스케줄러.
 *
 * <p>매일 09:00 KST 에 활성 테넌트를 순회하며 다음 SMS 배치를 수행한다.
 * <ul>
 *   <li>D-2: {@code today + N일} ({@code N=2} 기본) BOOKED/CONFIRMED/TENTATIVE_PENDING_PAYMENT
 *       → {@code RESERVATION_REMINDER_D2}</li>
 *   <li>D-1: {@code today + 1일} 동일 status → {@code RESERVATION_IMMEDIATE_LATE}
 *       (등록 시점에 미발송·실패분 백업; 이미 LATE면 멱등 로그로 중복 차단)</li>
 *   <li>D-0: {@code today} 동일 status → {@code RESERVATION_IMMEDIATE_LATE}
 *       (인앱/푸시 없음; 등록 당일 이미 LATE 발송분이면 멱등 로그로 중복 차단)</li>
 * </ul>
 * 단발성({@code totalSessions == 1}) 도 고객이므로 D-2/D-1/D-0 배치에서 제외하지 않는다.
 * 등록 시 {@code RESERVATION_IMMEDIATE_SINGLE} / LATE / D2 가 이미 발송된 건은 멱등 키로
 * {@code SKIPPED_DUPLICATE} 처리된다.
 * 매핑 lookup 은 SMS 전용으로 ACTIVE/SESSIONS_EXHAUSTED/PENDING_PAYMENT(SAME_DAY) 를 포함하며,
 * 회기 차감용 ACTIVE-only 조회와는 분리되어 있다.
 *
 * <p>회기 차감 정책 SSOT 는 (A) 예약(BOOKED) 시점 차감이므로 미래 BOOKED schedule 의 회기는
 * 이미 {@code used_sessions} 에 카운트되어 있어, D-2/D-1/D-0 발송 자격은 BOOKED 자체로 충족된다.
 * 따라서 {@code remaining < 1} 잔여 가드는 적용하지 않으며 SESSIONS_EXHAUSTED 매핑의
 * 미래 BOOKED schedule 도 정상 안내한다.
 *
 * <p>2026-06-17 푸시 정책: D-2 푸시는 발송하지 않으며, 동일 09:00 KST 배치에서 D-1(내일) 일정에 대해
 * {@link BookingReminderPushConstants#REMINDER_D1_DAYS_AHEAD} 푸시만 내담자·상담사 양쪽 fanout 한다.
 * D-1 SMS 배치는 동일 대상일에 병행 가능하며, D-0 은 SMS만 발송하며 푸시/인앱을 추가하지 않는다.
 *
 * <p>ShedLock 미적용 — 운영 단일 호스트 가정.
 * 멱등성은 {@link BatchNotificationDispatchService} 가 멱등 로그 테이블로 보장한다.
 *
 * <p>참고 패턴: {@link com.coresolution.consultation.scheduler.WellnessNotificationScheduler}
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
    name = "notification.batch.reservation-reminder-enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class ReservationReminderScheduler {

    private final TenantService tenantService;
    private final ScheduleRepository scheduleRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final BatchNotificationDispatchService dispatchService;
    private final MobilePushDispatchService mobilePushDispatchService;
    private final BatchNotificationProperties properties;
    private final SchedulerExecutionLogService logService;
    private final SchedulerAlertService alertService;
    private final SystemConfigService systemConfigService;

    /** 디버그·관측용. 외부 cron 변경은 {@code notification.batch.reservation-reminder-cron} 키. */
    @Value("${notification.batch.reservation-reminder-cron:0 0 9 * * *}")
    private String cronExpression;

    /**
     * 매일 09:00 KST 일괄 발송 (테넌트별 독립 실행).
     *
     * <p>Cron 은 {@code notification.batch.reservation-reminder-cron} 으로 외부화.
     * 본 어노테이션의 표현식은 컴파일 타임 상수만 허용되므로 동일한 기본값을 명시한다.
     */
    @Scheduled(
        cron = "${notification.batch.reservation-reminder-cron:0 0 9 * * *}",
        zone = "Asia/Seoul"
    )
    public void runDailyReminder() {
        // 런타임 가드 (2026-05-25): DB SSOT 플래그가 OFF 면 즉시 return.
        // ENV `NOTIFICATION_BATCH_RESERVATION_REMINDER_ENABLED` 와 이중 가드 — 어드민/SQL 토글 즉시 반영용.
        if (!systemConfigService.getGlobalBoolean(
                NotificationSchedulerFlagKeys.RESERVATION_REMINDER_ENABLED,
                NotificationSchedulerFlagKeys.DEFAULT_ENABLED)) {
            log.info("⏸️ [ReservationReminder] 스케줄러 비활성 - DB 플래그 OFF: key={}",
                NotificationSchedulerFlagKeys.RESERVATION_REMINDER_ENABLED);
            return;
        }
        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();
        int totalTenants = 0;
        int totalDispatched = 0;
        int totalSkipped = 0;
        int totalFailed = 0;
        int totalD1Dispatched = 0;
        int totalD1Skipped = 0;
        int totalD1Failed = 0;
        int totalD0Dispatched = 0;
        int totalD0Skipped = 0;
        int totalD0Failed = 0;
        int failureTenantCount = 0;

        log.info("⏰ [ReservationReminder] 스케줄러 시작: executionId={}, startTime={}, dryRun={}",
            executionId, startTime, properties.isDryRun());

        try {
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            totalTenants = activeTenantIds.size();
            log.info("📋 [ReservationReminder] 대상 테넌트 수: {}", totalTenants);

            LocalDate d2TargetDate = LocalDate.now().plusDays(properties.getReservationReminderDaysAhead());
            LocalDate d1TargetDate = LocalDate.now().plusDays(BookingReminderPushConstants.REMINDER_D1_DAYS_AHEAD);
            LocalDate d0TargetDate = LocalDate.now();

            for (String tenantId : activeTenantIds) {
                try {
                    TenantContextHolder.setTenantId(tenantId);
                    TenantSummary d2Summary = processTenantReminderD2(tenantId, d2TargetDate);
                    totalDispatched += d2Summary.dispatched();
                    totalSkipped += d2Summary.skipped();
                    totalFailed += d2Summary.failed();
                    logService.saveExecutionLog(executionId, tenantId,
                        "ReservationReminderD2", "SUCCESS",
                        String.format("dispatched=%d, skipped=%d, failed=%d",
                            d2Summary.dispatched(), d2Summary.skipped(), d2Summary.failed()));

                    TenantSummary d1Summary = processTenantDayBeforeSms(tenantId, d1TargetDate);
                    totalD1Dispatched += d1Summary.dispatched();
                    totalD1Skipped += d1Summary.skipped();
                    totalD1Failed += d1Summary.failed();
                    logService.saveExecutionLog(executionId, tenantId,
                        "ReservationReminderD1", "SUCCESS",
                        String.format("dispatched=%d, skipped=%d, failed=%d",
                            d1Summary.dispatched(), d1Summary.skipped(), d1Summary.failed()));

                    TenantSummary d0Summary = processTenantDayOfSms(tenantId, d0TargetDate);
                    totalD0Dispatched += d0Summary.dispatched();
                    totalD0Skipped += d0Summary.skipped();
                    totalD0Failed += d0Summary.failed();
                    logService.saveExecutionLog(executionId, tenantId,
                        "ReservationReminderD0", "SUCCESS",
                        String.format("dispatched=%d, skipped=%d, failed=%d",
                            d0Summary.dispatched(), d0Summary.skipped(), d0Summary.failed()));
                } catch (Exception tenantError) {
                    failureTenantCount++;
                    log.error("❌ [ReservationReminder] 테넌트 실행 실패: tenantId={}, error={}",
                        tenantId, tenantError.getMessage(), tenantError);
                    logService.saveExecutionLog(executionId, tenantId,
                        "ReservationReminderD2", "FAILED", tenantError.getMessage());
                } finally {
                    TenantContextHolder.clear();
                }
            }

            int totalD1PushAttempted = dispatchD1PushForAllTenants(activeTenantIds);

            LocalDateTime endTime = LocalDateTime.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();
            log.info("✅ [ReservationReminder] 스케줄러 완료: executionId={}, duration={}ms, tenants={}, "
                    + "d2Dispatched={}, d2Skipped={}, d2Failed={}, "
                    + "d1Dispatched={}, d1Skipped={}, d1Failed={}, "
                    + "d0Dispatched={}, d0Skipped={}, d0Failed={}, d1PushAttempted={}",
                executionId, durationMs, totalTenants,
                totalDispatched, totalSkipped, totalFailed,
                totalD1Dispatched, totalD1Skipped, totalD1Failed,
                totalD0Dispatched, totalD0Skipped, totalD0Failed,
                totalD1PushAttempted);
            logService.saveSummaryLog(executionId, "ReservationReminderD2",
                totalTenants, totalTenants - failureTenantCount, failureTenantCount,
                durationMs, startTime, endTime);
            logService.saveSummaryLog(executionId, "ReservationReminderD1",
                totalTenants, totalTenants - failureTenantCount, failureTenantCount,
                durationMs, startTime, endTime);
            logService.saveSummaryLog(executionId, "ReservationReminderD0",
                totalTenants, totalTenants - failureTenantCount, failureTenantCount,
                durationMs, startTime, endTime);
        } catch (Exception fatal) {
            log.error("❌ [ReservationReminder] 스케줄러 전체 실행 실패: executionId={}, error={}",
                executionId, fatal.getMessage(), fatal);
            alertService.sendFailureAlert("ReservationReminderD2", executionId,
                failureTenantCount, fatal.getMessage());
        }
    }

    /**
     * 단일 테넌트의 D-2 일자 스케줄을 순회하며 {@code RESERVATION_REMINDER_D2} 디스패치한다.
     *
     * @param tenantId   테넌트 ID
     * @param targetDate D-2 대상 일자 ({@code today + N})
     * @return 처리 요약
     */
    private TenantSummary processTenantReminderD2(String tenantId, LocalDate targetDate) {
        return processTenantSmsBatch(tenantId, targetDate, ReminderSmsKind.D2);
    }

    /**
     * 단일 테넌트의 D-1(내일) 스케줄을 순회하며 {@code RESERVATION_IMMEDIATE_LATE} 디스패치한다.
     *
     * <p>등록 시점에 LATE 를 이미 보낸 건·즉시 실패 후 백업 대상 모두 멱등 로그로 중복/재시도가 정리된다.
     * D-1 푸시와 동일 대상일에 병행 가능하다.
     *
     * @param tenantId   테넌트 ID
     * @param targetDate D-1 대상 일자 ({@code today + 1})
     * @return 처리 요약
     */
    private TenantSummary processTenantDayBeforeSms(String tenantId, LocalDate targetDate) {
        return processTenantSmsBatch(tenantId, targetDate, ReminderSmsKind.D1);
    }

    /**
     * 단일 테넌트의 상담 당일(D-0) 스케줄을 순회하며 {@code RESERVATION_IMMEDIATE_LATE} 디스패치한다.
     *
     * <p>등록 당일 이미 LATE 를 보낸 건은 멱등 로그로 {@code SKIPPED_DUPLICATE}.
     * 인앱/푸시는 발송하지 않는다 (TENTATIVE·BOOKED 공통, SMS only).
     *
     * @param tenantId   테넌트 ID
     * @param targetDate 당일 ({@code LocalDate.now()})
     * @return 처리 요약
     */
    private TenantSummary processTenantDayOfSms(String tenantId, LocalDate targetDate) {
        return processTenantSmsBatch(tenantId, targetDate, ReminderSmsKind.D0);
    }

    /**
     * D-2 / D-1 / D-0 SMS 공통 순회. status IN BOOKED/CONFIRMED/TENTATIVE_PENDING_PAYMENT.
     *
     * @param tenantId   테넌트 ID
     * @param targetDate 대상 일자
     * @param kind       D-2 / D-1 / D-0
     * @return 처리 요약
     */
    private TenantSummary processTenantSmsBatch(String tenantId, LocalDate targetDate,
            ReminderSmsKind kind) {
        // TENTATIVE_PENDING_PAYMENT: 현장결제 가예약도 09:00 D-2/D-1/D-0 SMS 에 포함.
        // D-1 푸시(processTenantD1Push)는 BOOKED/CONFIRMED 만 유지(정책: TENTATIVE 는 SMS만).
        List<Schedule> schedules = scheduleRepository.findByTenantIdAndDateAndStatusIn(
            tenantId, targetDate,
            List.of(ScheduleStatus.BOOKED, ScheduleStatus.CONFIRMED,
                ScheduleStatus.TENTATIVE_PENDING_PAYMENT));
        String logTag = kind.logTag();
        log.info("🔄 [{}] 테넌트 처리: tenantId={}, targetDate={}, candidates={}",
            logTag, tenantId, targetDate, schedules.size());

        int dispatched = 0;
        int skipped = 0;
        int failed = 0;
        for (Schedule schedule : schedules) {
            try {
                if (schedule.getClientId() == null || schedule.getConsultantId() == null) {
                    skipped++;
                    continue;
                }
                if (Boolean.TRUE.equals(schedule.getIsDeleted())) {
                    skipped++;
                    continue;
                }
                if (!shouldSendForSchedule(tenantId, schedule)) {
                    skipped++;
                    continue;
                }
                DispatchOutcome outcome = kind == ReminderSmsKind.D2
                    ? dispatchService.dispatchReservationReminderD2(schedule.getId())
                    : dispatchService.dispatchReservationImmediateLate(schedule.getId());
                switch (outcome.status()) {
                    case ALIMTALK_SENT:
                    case SMS_FALLBACK_SENT:
                    case SMS_ONLY_SENT:
                    case DRY_RUN:
                        dispatched++;
                        break;
                    case SKIPPED_DUPLICATE:
                    case SKIPPED_VALIDATION:
                        skipped++;
                        break;
                    case FAILED:
                    default:
                        failed++;
                        break;
                }
                // SMS만 발송. D-2/D-1/D-0 푸시·인앱은 정책상 미발송(D-1 푸시는 별도 경로).
            } catch (Exception perScheduleError) {
                failed++;
                log.warn("⚠️ [{}] 스케줄 처리 예외: tenantId={}, scheduleId={}",
                    logTag, tenantId, schedule.getId(), perScheduleError);
            }
        }
        return new TenantSummary(dispatched, skipped, failed);
    }

    /**
     * 09:00 SMS 배치 종류 (D-2 / D-1 / D-0).
     */
    private enum ReminderSmsKind {
        D2("ReservationReminderD2"),
        D1("ReservationReminderD1"),
        D0("ReservationReminderD0");

        private final String logTag;

        ReminderSmsKind(String logTag) {
            this.logTag = logTag;
        }

        String logTag() {
            return logTag;
        }
    }

    /**
     * D-2 / D-1 / D-0 SMS 발송 대상 여부 판정.
     *
     * <p>회기 차감 정책 SSOT 는 (A) 예약(BOOKED) 시점 차감 — 미래 BOOKED schedule 의 회기는
     * 이미 {@code used_sessions} 에 카운트되어 있으므로 발송 자격은 BOOKED 자체로 충족된다.
     * 따라서 {@code remaining < 1} 가드는 (C) 완료 시점 차감 정책을 가정한 모순 가드이며,
     * SESSIONS_EXHAUSTED 매핑의 미래 BOOKED schedule 안내가 잘못 누락되는 원인이었다.
     *
     * <p>단발성({@code total == 1})도 배치 안내 대상이다. 등록 시 SINGLE/LATE/D2 가 이미 나갔다면
     * 멱등 키로 중복이 차단된다. 매핑 미존재(이상 데이터)만 차단한다.
     *
     * <p>관련 SSOT (참조 — 본 메서드에서 변경하지 않음):
     * <ul>
     *   <li>{@code ScheduleServiceImpl.createConsultantSchedule} — BOOKED 진입 시 {@code useSessionForMapping} 즉시 호출</li>
     *   <li>{@code ConsultantClientMapping.useSession} — remaining-- / used++ / remaining=0 시 {@code SESSIONS_EXHAUSTED} 자동 전환</li>
     *   <li>{@code cancelSchedule} — 취소 시 {@code restoreSession} 으로 복원</li>
     * </ul>
     *
     * @param tenantId 테넌트 ID
     * @param schedule 일정
     * @return 발송 대상이면 {@code true}
     */
    private boolean shouldSendForSchedule(String tenantId, Schedule schedule) {
        // SMS 전용 lookup: PENDING_PAYMENT(SAME_DAY) 포함 — 회기 차감용 ACTIVE-only 와 분리.
        List<ConsultantClientMapping> candidates = mappingRepository
            .findActiveExhaustedOrPendingPaymentListByTenantIdAndConsultantIdAndClientId(
                tenantId, schedule.getConsultantId(), schedule.getClientId());
        boolean preferPendingPayment =
            schedule.getStatus() == ScheduleStatus.TENTATIVE_PENDING_PAYMENT;
        Optional<ConsultantClientMapping> opt =
            ScheduleMappingContextResolver.selectLatestMappingForReservationSms(
                candidates, preferPendingPayment);
        if (opt.isEmpty()) {
            log.debug("Reminder SMS skip — 매핑 없음: scheduleId={}", schedule.getId());
            return false;
        }
        return true;
    }

    /**
     * 활성 테넌트 전체에 D-1 푸시(내담자·상담사 양쪽)를 시도한다.
     *
     * @param activeTenantIds 활성 테넌트 ID 목록
     * @return 푸시 시도 건수(대상 schedule 수)
     */
    private int dispatchD1PushForAllTenants(List<String> activeTenantIds) {
        LocalDate d1TargetDate = LocalDate.now().plusDays(BookingReminderPushConstants.REMINDER_D1_DAYS_AHEAD);
        int attempted = 0;
        log.info("🔔 [ReservationReminderD1Push] D-1 푸시 배치 시작: targetDate={}", d1TargetDate);
        for (String tenantId : activeTenantIds) {
            try {
                TenantContextHolder.setTenantId(tenantId);
                attempted += processTenantD1Push(tenantId, d1TargetDate);
            } catch (Exception tenantError) {
                log.warn("⚠️ [ReservationReminderD1Push] 테넌트 D-1 푸시 실패(비차단): tenantId={}, error={}",
                    tenantId, tenantError.getMessage(), tenantError);
            } finally {
                TenantContextHolder.clear();
            }
        }
        log.info("🔔 [ReservationReminderD1Push] D-1 푸시 배치 완료: targetDate={}, attempted={}",
            d1TargetDate, attempted);
        return attempted;
    }

    /**
     * 단일 테넌트 D-1 푸시 대상 schedule 순회.
     *
     * @param tenantId   테넌트 ID
     * @param targetDate D-1 대상 일자(내일)
     * @return 푸시 시도 건수
     */
    private int processTenantD1Push(String tenantId, LocalDate targetDate) {
        List<Schedule> schedules = scheduleRepository.findByTenantIdAndDateAndStatusIn(
            tenantId, targetDate,
            List.of(ScheduleStatus.BOOKED, ScheduleStatus.CONFIRMED));
        int attempted = 0;
        for (Schedule schedule : schedules) {
            if (schedule.getClientId() == null || schedule.getConsultantId() == null) {
                continue;
            }
            if (Boolean.TRUE.equals(schedule.getIsDeleted())) {
                continue;
            }
            if (!shouldSendForSchedule(tenantId, schedule)) {
                continue;
            }
            tryDispatchD1Push(tenantId, schedule);
            attempted++;
        }
        return attempted;
    }

    /**
     * D-1 푸시 발화(비차단). dedupe 는 {@link MobilePushDispatchService} 내부에서
     * {@code D1|{scheduleDate}} 슬롯 키로 보장.
     *
     * @param tenantId 테넌트 ID
     * @param schedule 일정
     */
    private void tryDispatchD1Push(String tenantId, Schedule schedule) {
        try {
            String body = MobilePushMessageFormatter.buildBookingReminderLead(
                BookingReminderPushConstants.REMINDER_D1_BODY_LEAD, schedule);
            mobilePushDispatchService.dispatchBookingReminder(
                tenantId, schedule, body, BookingReminderPushConstants.REMINDER_D1_SLOT_CODE);
        } catch (Exception pushError) {
            log.warn("⚠️ [ReservationReminderD1Push] D-1 푸시 실패(비차단): tenantId={}, scheduleId={}",
                tenantId, schedule.getId(), pushError);
        }
    }

    /**
     * 테넌트별 디스패치 결과 카운트.
     *
     * @param dispatched 발송(드라이런 포함)
     * @param skipped    멱등/사전검증 skip
     * @param failed     실패
     */
    private record TenantSummary(int dispatched, int skipped, int failed) {
    }
}
