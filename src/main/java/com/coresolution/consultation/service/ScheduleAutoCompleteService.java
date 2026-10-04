package com.coresolution.consultation.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.util.ReservationSmsBusinessHours;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantService;
import jakarta.annotation.PostConstruct;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.hibernate.StaleStateException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 스케줄 자동 완료 처리 서비스
 * 정기적으로 시간이 지난 확정된 스케줄을 자동으로 완료 처리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleAutoCompleteService {

    /** 수동 실행에 테넌트가 없을 때 문구 (내부 식별자 금지) */
    public static final String TENANT_REQUIRED = "기관 정보를 확인할 수 없습니다.";

    /** 배치·다른 수동 실행이 점유 중이라 대기 시간 안에 시작하지 못했을 때 문구 */
    public static final String ALREADY_RUNNING = "자동 완료 처리가 이미 실행 중입니다. 잠시 후 다시 시도해 주세요.";

    private final ScheduleService scheduleService;
    private final ScheduleRepository scheduleRepository;
    private final ConsultationLogExistenceSsot consultationLogExistenceSsot;
    private final RealTimeStatisticsService realTimeStatisticsService;
    private final PlSqlScheduleValidationService plSqlScheduleValidationService;
    private final SalaryLateSessionAutoSyncService salaryLateSessionAutoSyncService;
    private final TenantService tenantService;
    private final ConfigurableApplicationContext applicationContext;

    /**
     * 두 배치(주기 자동 완료·자정 정리)가 같은 JVM 에서 겹쳐 같은 일정을 동시에 완료·회기 차감하지 않도록 직렬화한다.
     * 슬롯 간 중복은 {@link SchedulerLock} 이 막는다.
     */
    private final ReentrantLock runLock = new ReentrantLock();

    @Value("${mindgarden.scheduler.schedule-auto-complete.zone:}")
    private String zoneId;

    @Value("${mindgarden.scheduler.schedule-auto-complete.cron:}")
    private String autoCompleteCron;

    @Value("${mindgarden.scheduler.schedule-auto-complete.daily-cron:}")
    private String dailyCleanupCron;

    /** 수동 실행이 배치 점유를 기다리는 최대 시간(초). 넘으면 실행하지 않고 거부한다. */
    @Value("${mindgarden.scheduler.schedule-auto-complete.manual-lock-wait-seconds:30}")
    private long manualLockWaitSeconds;

    private Clock clock;

    /**
     * 테넌트 1건 자동 완료 결과.
     *
     * @param tenantId          처리한 테넌트 ID
     * @param completedCount    COMPLETED 로 전환한 일정 수
     * @param reminderSentCount 상담일지 미작성 알림을 만든 수
     */
    public record TenantAutoCompleteResult(String tenantId, int completedCount, int reminderSentCount) {
    }

    /**
     * 배치 등록·다음 실행 시각을 남긴다 (배포 후 읽기 전용 확인용).
     */
    @PostConstruct
    void logRegistration() {
        log.info("🗓️ 스케줄 자동 완료 배치 등록: cron={}, next={}, dailyCron={}, dailyNext={}, zone={}",
            autoCompleteCron, nextRun(autoCompleteCron), dailyCleanupCron, nextRun(dailyCleanupCron),
            resolveZone());
    }

    /**
     * 시간이 지난 스케줄 자동 완료 처리 및 상담일지 미작성 알림 (모든 활성 테넌트).
     *
     * <p>조회 API 는 완료 처리를 하지 않는다. 완료 전환·회기 차감·급여 동기화·통계 반영은 이 배치와
     * {@link #cleanupDailySchedules()}, 관리자 수동 실행 API 에서만 일어난다.
     * 주기: {@code mindgarden.scheduler.schedule-auto-complete.cron}.</p>
     */
    @Scheduled(cron = "${mindgarden.scheduler.schedule-auto-complete.cron}",
        zone = "${mindgarden.scheduler.schedule-auto-complete.zone}")
    @SchedulerLock(name = "ScheduleAutoCompleteService_autoCompleteExpiredSchedules",
        lockAtMostFor = "${mindgarden.scheduler.schedule-auto-complete.lock-at-most-for}")
    public void autoCompleteExpiredSchedules() {
        if (!applicationContext.isActive()) {
            return;
        }
        runLock.lock();
        try {
            runAutoComplete();
        } finally {
            runLock.unlock();
        }
    }

    /**
     * 관리자 수동 실행 — 호출자 테넌트 1건만 배치와 같은 경로로 자동 완료 처리한다.
     *
     * <p>배치와 같은 {@code runLock} 을 쓰므로 같은 일정을 두 번 완료·차감하지 않는다.
     * 다른 테넌트의 일정은 건드리지 않는다. 호출자 역할 검증은 컨트롤러의
     * {@code ClientPathAccessGuard} 가 담당한다.</p>
     *
     * @param tenantId 호출자 테넌트 ID (TenantContext 기준)
     * @return 처리 결과
     * @throws IllegalArgumentException 테넌트 ID 가 비었을 때
     * @throws IllegalStateException    대기 시간 안에 배치 점유를 얻지 못했을 때
     */
    public TenantAutoCompleteResult autoCompleteExpiredSchedulesForTenant(String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            throw new IllegalArgumentException(TENANT_REQUIRED);
        }
        boolean acquired;
        try {
            acquired = runLock.tryLock(manualLockWaitSeconds, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(ALREADY_RUNNING);
        }
        if (!acquired) {
            log.warn("⚠️ 스케줄 자동 완료 수동 실행 거부(점유 중): tenantId={}", tenantId);
            throw new IllegalStateException(ALREADY_RUNNING);
        }
        try {
            return withTenantContext(tenantId, () -> runAutoCompleteForTenant(tenantId));
        } finally {
            runLock.unlock();
        }
    }

    /**
     * 자동 완료 계열 작업을 배치와 같은 {@code runLock} 으로 직렬화해 실행한다.
     *
     * <p>{@code auto-complete-with-reminder} 처럼 같은 일정을 완료·회기 차감하는 다른 수동 실행
     * 경로가 배치·자기 자신과 동시에 돌지 않도록 하기 위한 공용 진입점이다. 대기 시간 안에
     * 점유를 얻지 못하면 실행하지 않고 거부한다.</p>
     *
     * @param operationName 로그용 작업 이름
     * @param action        락 안에서 실행할 작업
     * @param <T>           작업 반환 타입
     * @return 작업 결과
     * @throws IllegalStateException 대기 시간 안에 점유를 얻지 못했을 때
     */
    public <T> T runExclusively(String operationName, java.util.function.Supplier<T> action) {
        boolean acquired;
        try {
            acquired = runLock.tryLock(manualLockWaitSeconds, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(ALREADY_RUNNING);
        }
        if (!acquired) {
            log.warn("⚠️ 자동 완료 계열 수동 실행 거부(점유 중): operation={}", operationName);
            throw new IllegalStateException(ALREADY_RUNNING);
        }
        try {
            return action.get();
        } finally {
            runLock.unlock();
        }
    }

    /**
     * 테넌트 컨텍스트를 바꿔 실행하고 이전 값으로 되돌린다 (HTTP 요청 스레드의 컨텍스트 보존).
     */
    private TenantAutoCompleteResult withTenantContext(String tenantId,
            java.util.function.Supplier<TenantAutoCompleteResult> action) {
        String previousTenantId = TenantContextHolder.getTenantId();
        try {
            TenantContextHolder.setTenantId(tenantId);
            return action.get();
        } finally {
            if (StringUtils.hasText(previousTenantId)) {
                TenantContextHolder.setTenantId(previousTenantId);
            } else {
                TenantContextHolder.clear();
            }
        }
    }

    private void runAutoComplete() {
        try {
            // 스케줄러는 HTTP 요청 컨텍스트가 없으므로 모든 활성 테넌트에 대해 실행
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            
            if (activeTenantIds.isEmpty()) {
                log.warn("⚠️ 활성 테넌트가 없습니다. 스케줄 자동 완료 처리를 건너뜁니다.");
                return;
            }
            
            log.info("🔄 스케줄 자동 완료 처리 시작: 활성 테넌트 수={}", activeTenantIds.size());
            
            int totalCompletedCount = 0;
            int totalReminderSentCount = 0;
            
            // 각 테넌트별로 처리
            for (String tenantId : activeTenantIds) {
                try {
                    // 테넌트 컨텍스트 설정
                    TenantContextHolder.setTenantId(tenantId);

                    TenantAutoCompleteResult result = runAutoCompleteForTenant(tenantId);
                    totalCompletedCount += result.completedCount();
                    totalReminderSentCount += result.reminderSentCount();
                } catch (Exception e) {
                    log.error("❌ 테넌트별 스케줄 자동 완료 처리 실패: tenantId={}, 오류={}", tenantId, e.getMessage(), e);
                } finally {
                    // 테넌트 컨텍스트 정리
                    TenantContextHolder.clear();
                }
            }
            
            log.info("✅ 전체 스케줄 자동 완료 처리 완료: 총 완료 {}개, 총 알림 발송 {}개", totalCompletedCount, totalReminderSentCount);
            
        } catch (Exception e) {
            log.error("❌ 스케줄 자동 완료 처리 실패 (스케줄러): {}", e.getMessage(), e);
        }
    }

    /**
     * 테넌트 1건 자동 완료 처리 (배치·관리자 수동 실행 공통 경로).
     *
     * <p>호출 전에 {@link TenantContextHolder} 가 이 테넌트로 설정돼 있어야 한다.</p>
     *
     * @param tenantId 처리할 테넌트 ID
     * @return 완료·알림 건수
     */
    private TenantAutoCompleteResult runAutoCompleteForTenant(String tenantId) {
        log.info("🔄 테넌트별 스케줄 자동 완료 처리 시작: tenantId={}", tenantId);
        
        LocalDateTime now = currentDateTime();
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();
        
        int tenantCompletedCount = 0;
        int tenantReminderSentCount = 0;
        
        // 오늘 만료된 스케줄 처리
        List<Schedule> todayExpiredSchedules = scheduleRepository.findExpiredConfirmedSchedules(tenantId, today, currentTime);
        for (Schedule schedule : todayExpiredSchedules) {
            try {
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                if (ScheduleStatus.BOOKED.equals(schedule.getStatus()) || ScheduleStatus.CONFIRMED.equals(schedule.getStatus())) {
                    var result = plSqlScheduleValidationService.processScheduleAutoCompletion(
                        schedule.getId(), 
                        schedule.getConsultantId(), 
                        schedule.getDate(), 
                        false // 강제 완료 아님
                    );
                    
                    if ((Boolean) result.get("completed")) {
                        tenantCompletedCount++;
                        // PL/SQL 완료 직후 Java 회기 차감 훅 — 지난 일정 completePastScheduleWithRetry 와 동일.
                        // ProcessBatchScheduleCompletion 등 PL/SQL-only 경로는 sessionSequence 미기입
                        // COMPLETED 를 SessionDeductionRecoveryBatch 가 보정한다.
                        Optional<Schedule> freshOpt = scheduleRepository.findByTenantIdAndId(
                                tenantId, schedule.getId());
                        if (freshOpt.isPresent()) {
                            Schedule fresh = freshOpt.get();
                            scheduleService.deductSessionAtCompletionIfNeeded(fresh);
                            realTimeStatisticsService.updateStatisticsOnScheduleCompletion(fresh);
                        } else {
                            realTimeStatisticsService.updateStatisticsOnScheduleCompletion(schedule);
                        }
                        
                        log.info("✅ PL/SQL 스케줄 자동 완료 및 통계 업데이트: tenantId={}, ID={}, 제목={}, 시간={}", 
                            tenantId, schedule.getId(), schedule.getTitle(), schedule.getStartTime());
                    } else {
                        log.warn("⚠️ PL/SQL 상담일지 미작성으로 스케줄 완료 처리 건너뜀: tenantId={}, ID={}, 제목={}, 시간={}, 메시지={}", 
                            tenantId, schedule.getId(), schedule.getTitle(), schedule.getStartTime(), result.get("message"));
                        
                        var reminderResult = plSqlScheduleValidationService.createConsultationRecordReminder(
                            schedule.getId(), 
                            schedule.getConsultantId(), 
                            schedule.getClientId(), 
                            schedule.getDate(), 
                            schedule.getTitle()
                        );
                        
                        if ((Boolean) reminderResult.get("success")) {
                            tenantReminderSentCount++;
                            log.info("📤 PL/SQL 상담일지 미작성 알림 생성 완료: tenantId={}, ID={}", tenantId, reminderResult.get("reminderId"));
                        }
                    }
                }
            } catch (Exception e) {
                log.error("❌ 오늘 스케줄 자동 완료 실패: tenantId={}, ID={}, 오류={}", tenantId, schedule.getId(), e.getMessage());
            }
        }
        
        // 지난 날짜의 스케줄 처리
        List<Schedule> pastBookedSchedules = scheduleRepository.findByDateBeforeAndStatus(
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            tenantId, today, ScheduleStatus.BOOKED);
        List<Schedule> pastConfirmedSchedules = scheduleRepository.findByDateBeforeAndStatus(
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            tenantId, today, ScheduleStatus.CONFIRMED);
        
        List<Schedule> allPastSchedules = new ArrayList<>();
        allPastSchedules.addAll(pastBookedSchedules);
        allPastSchedules.addAll(pastConfirmedSchedules);
        
        for (Schedule schedule : allPastSchedules) {
            try {
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                if (ScheduleStatus.BOOKED.equals(schedule.getStatus()) || ScheduleStatus.CONFIRMED.equals(schedule.getStatus())) {
                    // 지난 스케줄: 상담일지(회기권·타기관) 작성된 경우에만 COMPLETED 전환
                    boolean hasRecord = consultationLogExistenceSsot.existsActiveForSchedule(
                            tenantId,
                            schedule.getId());
                    if (hasRecord) {
                        if (completePastScheduleWithRetry(tenantId, schedule)) {
                            tenantCompletedCount++;
                        }
                    } else {
                        var reminderResult = plSqlScheduleValidationService.createConsultationRecordReminder(
                            schedule.getId(),
                            schedule.getConsultantId(),
                            schedule.getClientId(),
                            schedule.getDate(),
                            "상담일지 누락 안내"
                        );
                        if (Boolean.TRUE.equals(reminderResult.get("success"))) {
                            tenantReminderSentCount++;
                            log.info("📤 지난 스케줄 상담일지 미작성 알림 생성 완료(완료 처리 보류): tenantId={}, ID={}", tenantId, reminderResult.get("reminderId"));
                        }
                    }
                }
            } catch (Exception e) {
                log.error("❌ 지난 스케줄 자동 완료 실패: tenantId={}, ID={}, 오류={}", tenantId, schedule.getId(), e.getMessage());
            }
        }
        
        log.info("✅ 테넌트별 스케줄 자동 완료 처리 완료: tenantId={}, 완료 {}개, 알림 발송 {}개", 
            tenantId, tenantCompletedCount, tenantReminderSentCount);

        return new TenantAutoCompleteResult(tenantId, tenantCompletedCount, tenantReminderSentCount);
    }

    /**
     * 지난 스케줄 COMPLETED 전환 — 낙관적 락 충돌 시 1회 재시도.
     *
     * @return 완료 처리 성공 여부
     */
    private boolean completePastScheduleWithRetry(String tenantId, Schedule schedule) {
        for (int attempt = 0; attempt < 2; attempt++) {
            try {
                Optional<Schedule> freshOpt = scheduleRepository.findByTenantIdAndId(tenantId, schedule.getId());
                if (freshOpt.isEmpty()) {
                    return false;
                }
                Schedule fresh = freshOpt.get();
                if (!ScheduleStatus.BOOKED.equals(fresh.getStatus())
                        && !ScheduleStatus.CONFIRMED.equals(fresh.getStatus())) {
                    return false;
                }
                scheduleService.deductSessionAtCompletionIfNeeded(fresh);
                fresh.setStatus(ScheduleStatus.COMPLETED);
                scheduleRepository.save(fresh);
                realTimeStatisticsService.updateStatisticsOnScheduleCompletion(fresh);
                salaryLateSessionAutoSyncService.syncAfterScheduleCompleted(fresh);
                log.info("✅ 지난 스케줄 COMPLETED 전환 및 통계 업데이트: tenantId={}, ID={}, 제목={}, 날짜={}",
                    tenantId, fresh.getId(), fresh.getTitle(), fresh.getDate());
                return true;
            } catch (ObjectOptimisticLockingFailureException | StaleStateException lockError) {
                if (attempt == 0) {
                    log.warn("⚠️ 지난 스케줄 완료 낙관적 락 충돌 — 재시도: tenantId={}, scheduleId={}",
                        tenantId, schedule.getId());
                } else {
                    log.warn("⚠️ 지난 스케줄 완료 낙관적 락 재시도 실패 — skip: tenantId={}, scheduleId={}",
                        tenantId, schedule.getId(), lockError);
                }
            }
        }
        return false;
    }
    
    /**
     * 하루 종료된 스케줄 정리 (진행중 일정 포함, 테넌트별 컨텍스트 설정 후 처리).
     * 주기: {@code mindgarden.scheduler.schedule-auto-complete.daily-cron}.
     */
    @Scheduled(cron = "${mindgarden.scheduler.schedule-auto-complete.daily-cron}",
        zone = "${mindgarden.scheduler.schedule-auto-complete.zone}")
    @SchedulerLock(name = "ScheduleAutoCompleteService_cleanupDailySchedules",
        lockAtMostFor = "${mindgarden.scheduler.schedule-auto-complete.daily-lock-at-most-for}")
    public void cleanupDailySchedules() {
        if (!applicationContext.isActive()) {
            return;
        }
        runLock.lock();
        try {
            runDailyCleanup();
        } finally {
            runLock.unlock();
        }
    }

    /**
     * 테스트용 시계 주입.
     *
     * @param clock 기준 시계
     */
    void useClock(Clock clock) {
        this.clock = clock;
    }

    /**
     * 테스트용 수동 실행 대기 시간 주입.
     *
     * @param seconds 대기 시간(초)
     */
    void useManualLockWaitSeconds(long seconds) {
        this.manualLockWaitSeconds = seconds;
    }

    private LocalDateTime currentDateTime() {
        return LocalDateTime.now(clock != null ? clock : Clock.system(resolveZone()));
    }

    private LocalDateTime nextRun(String cron) {
        if (!StringUtils.hasText(cron) || !CronExpression.isValidExpression(cron)) {
            return null;
        }
        return CronExpression.parse(cron).next(currentDateTime());
    }

    private ZoneId resolveZone() {
        return StringUtils.hasText(zoneId) ? ZoneId.of(zoneId.trim()) : ReservationSmsBusinessHours.ZONE_SEOUL;
    }

    private void runDailyCleanup() {
        try {
            log.info("🧹 일일 스케줄 정리 시작");
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            if (activeTenantIds.isEmpty()) {
                log.warn("⚠️ 활성 테넌트가 없습니다. 일일 스케줄 정리를 건너뜁니다.");
                return;
            }
            for (String tenantId : activeTenantIds) {
                try {
                    TenantContextHolder.setTenantId(tenantId);
                    scheduleService.autoCompleteExpiredSchedules();
                } catch (Exception e) {
                    log.error("❌ 일일 스케줄 정리 실패: tenantId={}, 오류={}", tenantId, e.getMessage(), e);
                } finally {
                    TenantContextHolder.clear();
                }
            }
            log.info("✅ 일일 스케줄 정리 완료");
        } catch (Exception e) {
            log.error("❌ 일일 스케줄 정리 실패: {}", e.getMessage(), e);
        }
    }
    
}
