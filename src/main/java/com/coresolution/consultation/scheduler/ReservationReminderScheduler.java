package com.coresolution.consultation.scheduler;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.coresolution.consultation.config.BatchNotificationProperties;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.BatchNotificationDispatchService.DispatchOutcome;
import com.coresolution.consultation.service.MobilePushDispatchService;
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
 * 예약 D-2 안내 일괄 발송 스케줄러.
 *
 * <p>매일 09:00 KST 에 활성 테넌트를 순회하며 {@code today + N일} ({@code N=2} 기본) 에 예약된
 * BOOKED/CONFIRMED 일정 중 client 잔여 회기가 1회 이상이고 단발성 결제(=총 1회기 패키지) 가
 * 아닌 schedule 을 D-2 안내({@code RESERVATION_REMINDER_D2}) 대상으로 위임한다.
 *
 * <p>단발성 결제(={@code totalSessions == 1})는 스케줄 등록 즉시 발송 경로
 * ({@code RESERVATION_IMMEDIATE_SINGLE}) 에서 처리하므로 D-2 배치에서는 제외한다.
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

    /** D-2 푸시 본문(임시) — 디자이너 카피 확정 시 교체. */
    // TODO(D10): 디자이너 카피 확정 후 MobilePushMessageFormatter 에 상수화·표시 양식 통일.
    private static final String D2_REMINDER_BODY = "내일 상담 예약이 있습니다.";
    /** D-2 푸시 dedupe 슬롯 코드 — buildScheduleData / dedupe 버킷 prefix. */
    private static final String D2_REMINDER_SLOT_CODE = "D2";

    private final TenantService tenantService;
    private final ScheduleRepository scheduleRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final BatchNotificationDispatchService dispatchService;
    private final MobilePushDispatchService mobilePushDispatchService;
    private final BatchNotificationProperties properties;
    private final SchedulerExecutionLogService logService;
    private final SchedulerAlertService alertService;

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
        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();
        int totalTenants = 0;
        int totalDispatched = 0;
        int totalSkipped = 0;
        int totalFailed = 0;
        int failureTenantCount = 0;

        log.info("⏰ [ReservationReminderD2] 스케줄러 시작: executionId={}, startTime={}, dryRun={}",
            executionId, startTime, properties.isDryRun());

        try {
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            totalTenants = activeTenantIds.size();
            log.info("📋 [ReservationReminderD2] 대상 테넌트 수: {}", totalTenants);

            LocalDate targetDate = LocalDate.now().plusDays(properties.getReservationReminderDaysAhead());

            for (String tenantId : activeTenantIds) {
                try {
                    TenantContextHolder.setTenantId(tenantId);
                    TenantSummary summary = processTenant(tenantId, targetDate);
                    totalDispatched += summary.dispatched();
                    totalSkipped += summary.skipped();
                    totalFailed += summary.failed();
                    logService.saveExecutionLog(executionId, tenantId,
                        "ReservationReminderD2", "SUCCESS",
                        String.format("dispatched=%d, skipped=%d, failed=%d",
                            summary.dispatched(), summary.skipped(), summary.failed()));
                } catch (Exception tenantError) {
                    failureTenantCount++;
                    log.error("❌ [ReservationReminderD2] 테넌트 실행 실패: tenantId={}, error={}",
                        tenantId, tenantError.getMessage(), tenantError);
                    logService.saveExecutionLog(executionId, tenantId,
                        "ReservationReminderD2", "FAILED", tenantError.getMessage());
                } finally {
                    TenantContextHolder.clear();
                }
            }

            LocalDateTime endTime = LocalDateTime.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();
            log.info("✅ [ReservationReminderD2] 스케줄러 완료: executionId={}, duration={}ms, tenants={}, dispatched={}, skipped={}, failed={}",
                executionId, durationMs, totalTenants, totalDispatched, totalSkipped, totalFailed);
            logService.saveSummaryLog(executionId, "ReservationReminderD2",
                totalTenants, totalTenants - failureTenantCount, failureTenantCount,
                durationMs, startTime, endTime);
        } catch (Exception fatal) {
            log.error("❌ [ReservationReminderD2] 스케줄러 전체 실행 실패: executionId={}, error={}",
                executionId, fatal.getMessage(), fatal);
            alertService.sendFailureAlert("ReservationReminderD2", executionId,
                failureTenantCount, fatal.getMessage());
        }
    }

    /**
     * 단일 테넌트의 D+N 일자 스케줄을 순회하며 디스패치한다.
     *
     * @param tenantId   테넌트 ID
     * @param targetDate D-N 대상 일자
     * @return 처리 요약
     */
    private TenantSummary processTenant(String tenantId, LocalDate targetDate) {
        List<Schedule> schedules = scheduleRepository.findByTenantIdAndDateAndStatusIn(
            tenantId, targetDate,
            List.of(ScheduleStatus.BOOKED, ScheduleStatus.CONFIRMED));
        log.info("🔄 [ReservationReminderD2] 테넌트 처리: tenantId={}, targetDate={}, candidates={}",
            tenantId, targetDate, schedules.size());

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
                DispatchOutcome outcome = dispatchService
                    .dispatchReservationReminderD2(schedule.getId());
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
                // 시나리오 #2 — 알림톡 발화 직후 D-2 푸시(내담자·상담사 양쪽) 트리거.
                // 스케줄러 = 시스템 actor 이므로 actor-skip 미적용. dedupe 는 MobilePushDispatchService 내부 슬롯 키로 보장.
                // 알림톡 결과(SKIPPED/FAILED 포함)와 무관하게 푸시는 시도하며, 푸시 실패는 본 배치 카운트에 영향 주지 않는다.
                tryDispatchD2Push(tenantId, schedule);
            } catch (Exception perScheduleError) {
                failed++;
                log.warn("⚠️ [ReservationReminderD2] 스케줄 처리 예외: tenantId={}, scheduleId={}",
                    tenantId, schedule.getId(), perScheduleError);
            }
        }
        return new TenantSummary(dispatched, skipped, failed);
    }

    /**
     * D-2 발송 대상 여부 판정 — 매핑 잔여 1회기 이상 + 단발성(=총 1회기) 제외.
     *
     * @param tenantId 테넌트 ID
     * @param schedule 일정
     * @return 발송 대상이면 {@code true}
     */
    private boolean shouldSendForSchedule(String tenantId, Schedule schedule) {
        Optional<ConsultantClientMapping> opt = mappingRepository
            .findActiveOrExhaustedByTenantIdAndConsultantIdAndClientId(
                tenantId, schedule.getConsultantId(), schedule.getClientId());
        if (opt.isEmpty()) {
            log.debug("D-2 skip — 매핑 없음: scheduleId={}", schedule.getId());
            return false;
        }
        ConsultantClientMapping mapping = opt.get();
        Integer total = mapping.getTotalSessions();
        Integer remaining = mapping.getRemainingSessions();
        if (total != null && total == 1) {
            log.debug("D-2 skip — 단발성 결제(총 1회기): scheduleId={}, mappingId={}",
                schedule.getId(), mapping.getId());
            return false;
        }
        if (remaining == null || remaining < 1) {
            log.debug("D-2 skip — 잔여 회기 부족: scheduleId={}, remaining={}",
                schedule.getId(), remaining);
            return false;
        }
        return true;
    }

    /**
     * D-2 푸시 발화(비차단). dedupe 는 {@link MobilePushDispatchService} 내부에서
     * {@code D2|{scheduleDate}} 슬롯 키로 보장하므로 본 배치가 재실행돼도 중복 발송 없음.
     *
     * <p>본 배치 흐름의 카운트(dispatched/skipped/failed) 는 알림톡 결과 기준이며
     * 푸시 결과는 별도 로그로만 기록한다.
     *
     * @param tenantId 테넌트 ID
     * @param schedule 일정
     */
    private void tryDispatchD2Push(String tenantId, Schedule schedule) {
        try {
            String body = MobilePushMessageFormatter.buildBookingReminderLead(D2_REMINDER_BODY, schedule);
            mobilePushDispatchService.dispatchBookingReminder(tenantId, schedule, body, D2_REMINDER_SLOT_CODE);
        } catch (Exception pushError) {
            log.warn("⚠️ [ReservationReminderD2] D-2 푸시 실패(비차단): tenantId={}, scheduleId={}",
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
