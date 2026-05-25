package com.coresolution.core.scheduler;

import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import com.coresolution.core.service.statistics.StatisticsMetadataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 통계 자동 생성 스케줄러 (표준화 적용)
 * 매일 자정에 전날 통계를 자동으로 생성
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-12-02
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
    name = "scheduler.statistics-generation.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class StatisticsGenerationScheduler {
    
    private final StatisticsMetadataService statisticsMetadataService;
    private final TenantRepository tenantRepository;
    private final SchedulerExecutionLogService logService;
    private final SchedulerAlertService alertService;
    
    @Value("${scheduler.statistics-generation.cron:0 1 0 * * *}")
    private String cronExpression;
    
    /**
     * 매일 새벽 1시에 전날 통계 자동 생성 (테넌트별 독립 실행)
     * Cron: 매일 자정 1분 후
     *
     * <p>핫픽스 (2026-05-25, N1): blue/green 양 슬롯이 동일 통계 행을 동시에 갱신해
     * {@code @Version} 낙관적 락 충돌({@code StaleStateException})을 일으키는 문제를
     * 차단하기 위해 ShedLock 분산 락 적용. 한 슬롯만 실행되고 다른 슬롯은 skip 된다.</p>
     */
    @Scheduled(cron = "${scheduler.statistics-generation.cron:0 1 0 * * *}")
    @SchedulerLock(
        name = "statistics-generation-daily",
        lockAtMostFor = "PT30M",
        lockAtLeastFor = "PT5M"
    )
    public void generateDailyStatistics() {
        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();
        
        log.info("⏰ [StatisticsGeneration] 스케줄러 시작: executionId={}, startTime={}",
            executionId, startTime);
        
        LocalDate yesterday = LocalDate.now().minusDays(1);
        
        int successCount = 0;
        int failureCount = 0;
        int totalTenants = 0;
        
        try {
            // 활성 테넌트 목록 조회
            List<String> tenantIds = tenantRepository.findAllActive()
                .stream()
                .map(tenant -> tenant.getTenantId())
                .collect(Collectors.toList());
            
            totalTenants = tenantIds.size();
            log.info("📋 [StatisticsGeneration] 대상 테넌트 수: {}", totalTenants);
            
            for (String tenantId : tenantIds) {
                try {
                    TenantContextHolder.setTenantId(tenantId);
                    
                    statisticsMetadataService.generateDailyStatistics(tenantId, yesterday);
                    
                    log.debug("✅ [StatisticsGeneration] 통계 생성 완료: tenantId={}, date={}", 
                        tenantId, yesterday);
                    logService.saveExecutionLog(
                        executionId, tenantId, "StatisticsGeneration", "SUCCESS", 
                        "Daily statistics generated for " + yesterday
                    );
                    successCount++;
                    
                } catch (Exception e) {
                    log.error("❌ [StatisticsGeneration] 통계 생성 실패: tenantId={}, date={}", 
                        tenantId, yesterday, e);
                    logService.saveExecutionLog(
                        executionId, tenantId, "StatisticsGeneration", "FAILED", e.getMessage()
                    );
                    failureCount++;
                } finally {
                    TenantContextHolder.clear();
                }
            }
            
            LocalDateTime endTime = LocalDateTime.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();
            
            log.info("✅ [StatisticsGeneration] 스케줄러 완료: executionId={}, duration={}ms, success={}, failure={}",
                executionId, durationMs, successCount, failureCount);
            
            logService.saveSummaryLog(
                executionId,
                "StatisticsGeneration",
                totalTenants,
                successCount,
                failureCount,
                durationMs,
                startTime,
                endTime
            );
            
        } catch (Exception e) {
            log.error("❌ [StatisticsGeneration] 스케줄러 전체 실행 실패: executionId={}, error={}",
                executionId, e.getMessage(), e);
            alertService.sendFailureAlert(
                "StatisticsGeneration", executionId, failureCount, e.getMessage()
            );
        }
    }
    
    /**
     * 매시간 정각에 실시간 통계 캐시 갱신 (선택적)
     * Cron: 매시간 정각
     *
     * <p>핫픽스 (2026-05-25, N1): blue/green 양 슬롯에서 매 시각 정시(HH:00)에 동시 실행되어
     * {@code statistics_values} 동일 행 UPDATE 시 {@code StaleStateException}이 발생하던 문제를
     * ShedLock 분산 락으로 차단한다. 한 슬롯만 실행되고 다른 슬롯은 skip 된다.
     * (운영 진단: 2026-05-25 07:00·12:00 {@code StaleStateException} 다수 관측)</p>
     */
    @Scheduled(cron = "0 0 * * * ?")
    @SchedulerLock(
        name = "statistics-generation-hourly",
        lockAtMostFor = "PT10M",
        lockAtLeastFor = "PT2M"
    )
    public void refreshRealtimeStatistics() {
        log.debug("🔄 [StatisticsGeneration] 실시간 통계 캐시 갱신 시작");
        
        LocalDate today = LocalDate.now();
        
        // 활성 테넌트 목록 조회
        List<String> tenantIds = tenantRepository.findAllActive()
            .stream()
            .map(tenant -> tenant.getTenantId())
            .collect(Collectors.toList());
        
            for (String tenantId : tenantIds) {
                try {
                    TenantContextHolder.setTenantId(tenantId);
                // 실시간 통계만 갱신 (aggregationPeriod = REALTIME)
                statisticsMetadataService.generateDailyStatistics(tenantId, today);
            } catch (Exception e) {
                log.warn("실시간 통계 캐시 갱신 실패: tenantId={}", tenantId, e);
                } finally {
                    TenantContextHolder.clear();
                }
        }
        
        log.debug("🔄 [StatisticsGeneration] 실시간 통계 캐시 갱신 완료");
    }
}
