package com.coresolution.consultation.scheduler;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.coresolution.consultation.service.SalaryBatchService;
import com.coresolution.consultation.service.SalaryScheduleService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import com.coresolution.core.service.TenantService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 급여 배치 스케줄러 (표준화 적용)
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-12-02
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
    name = "scheduler.salary-batch.enabled", 
    havingValue = "true", 
    matchIfMissing = true
)
public class SalaryBatchScheduler {
    
    private final SalaryBatchService salaryBatchService;
    private final SalaryScheduleService salaryScheduleService;
    private final TenantService tenantService;
    private final SchedulerExecutionLogService logService;
    private final SchedulerAlertService alertService;
    
    /**
     * 매월 기산일에 급여 배치 자동 실행 (표준화 적용)
     * Cron: 매일 새벽 2시
     */
    @Scheduled(cron = "${scheduler.salary-batch.cron:0 0 2 * * ?}")
    public void checkAndExecuteSalaryBatch() {
        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();
        
        log.info("⏰ [SalaryBatch] 스케줄러 시작: executionId={}, startTime={}", 
            executionId, startTime);
        
        int successCount = 0;
        int failureCount = 0;
        
        try {
            LocalDate now = LocalDate.now();
            
            // 1. 배치 실행 가능 여부 확인
            if (!salaryBatchService.canExecuteBatch(now)) {
                log.info("⏳ [SalaryBatch] 급여 배치 실행 시간이 아닙니다: {}", now);
                return;
            }
            
            // 2. 이미 처리되었는지 확인 (이전 달 기준)
            LocalDate previousMonth = now.minusMonths(1);
            SalaryBatchService.BatchStatus status = salaryBatchService.getBatchStatus(
                previousMonth.getYear(), 
                previousMonth.getMonthValue()
            );
            
            if ("COMPLETED".equals(status.getStatus())) {
                log.info("✅ [SalaryBatch] 이전 달 급여 배치가 이미 완료되었습니다: {}-{}", 
                    previousMonth.getYear(), previousMonth.getMonthValue());
                return;
            }
            
            // 3. 활성 테넌트 목록 조회
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            log.info("📋 [SalaryBatch] 대상 테넌트 수: {}", activeTenantIds.size());
            
            // 4. 테넌트별 실행
            for (String tenantId : activeTenantIds) {
                try {
                    // 테넌트 컨텍스트 설정
                    TenantContextHolder.setTenantId(tenantId);
                    
                    log.debug("🔄 [SalaryBatch] 테넌트 실행 시작: tenantId={}", tenantId);
                    
                    // 급여 배치 실행
                    SalaryBatchService.BatchResult result = salaryBatchService.executeMonthlySalaryBatch(
                        previousMonth.getYear(), 
                        previousMonth.getMonthValue(), 
                        null // 전체 지점
                    );
                    
                    if (result.isSuccess()) {
                        log.info("✅ [SalaryBatch] 테넌트 실행 성공: tenantId={}, message={}", 
                            tenantId, result.getMessage());
                        
                        // 성공 로그 저장
                        logService.saveExecutionLog(
                            executionId, 
                            tenantId, 
                            "SalaryBatchScheduler", 
                            "SUCCESS", 
                            result.getMessage()
                        );
                        
                        successCount++;
                    } else {
                        log.error("❌ [SalaryBatch] 테넌트 실행 실패: tenantId={}, message={}", 
                            tenantId, result.getMessage());
                        
                        // 실패 로그 저장
                        logService.saveExecutionLog(
                            executionId, 
                            tenantId, 
                            "SalaryBatchScheduler", 
                            "FAILED", 
                            null,
                            result.getMessage()
                        );
                        
                        failureCount++;
                    }
                    
                } catch (Exception e) {
                    log.error("❌ [SalaryBatch] 테넌트 실행 실패: tenantId={}, error={}", 
                        tenantId, e.getMessage(), e);
                    
                    // 실패 로그 저장
                    logService.saveExecutionLog(
                        executionId, 
                        tenantId, 
                        "SalaryBatchScheduler", 
                        "FAILED", 
                        null,
                        e.getMessage()
                    );
                    
                    failureCount++;
                    
                } finally {
                    // 테넌트 컨텍스트 정리
                    TenantContextHolder.clear();
                }
            }
            
            // 5. 전체 실행 결과 로깅
            LocalDateTime endTime = LocalDateTime.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();
            
            log.info("✅ [SalaryBatch] 스케줄러 완료: executionId={}, duration={}ms, success={}, failure={}", 
                executionId, durationMs, successCount, failureCount);
            
            // 6. 실행 요약 저장
            logService.saveSummaryLog(
                executionId,
                "SalaryBatchScheduler",
                successCount,
                failureCount,
                durationMs
            );
            
            // 7. 실패 알림 발송
            if (failureCount > 0) {
                alertService.sendFailureAlert(
                    "SalaryBatchScheduler",
                    executionId,
                    failureCount,
                    "급여 배치 실행 중 일부 테넌트에서 실패가 발생했습니다."
                );
            }
            
        } catch (Exception e) {
            log.error("❌ [SalaryBatch] 스케줄러 실패: executionId={}, error={}", 
                executionId, e.getMessage(), e);
            
            // 완전 실패 알림
            alertService.sendCompleteFailureAlert(
                "SalaryBatchScheduler",
                executionId,
                0,
                e.getMessage()
            );
        }
    }
    
    /**
     * 급여 배치 상태 모니터링 (표준화 적용)
     * Cron: 매시간 정각
     */
    @Scheduled(cron = "${scheduler.salary-batch-monitor.cron:0 0 * * * ?}")
    public void monitorBatchStatus() {
        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();
        
        log.debug("⏰ [SalaryBatchMonitor] 모니터링 시작: executionId={}", executionId);
        
        try {
            LocalDate now = LocalDate.now();
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            
            int warningCount = 0;
            
            // 테넌트별 배치 상태 확인
            for (String tenantId : activeTenantIds) {
                try {
                    TenantContextHolder.setTenantId(tenantId);
                    
                    // 현재 달과 이전 달 배치 상태 확인
                    SalaryBatchService.BatchStatus currentMonthStatus = salaryBatchService.getBatchStatus(
                        now.getYear(), now.getMonthValue());
                    
                    SalaryBatchService.BatchStatus previousMonthStatus = salaryBatchService.getBatchStatus(
                        now.minusMonths(1).getYear(), now.minusMonths(1).getMonthValue());
                    
                    log.debug("📊 [SalaryBatchMonitor] 테넌트 상태: tenantId={}, 현재달={}, 이전달={}", 
                        tenantId, currentMonthStatus.getStatus(), previousMonthStatus.getStatus());
                    
                    // 배치 실행 가능한데 아직 실행되지 않은 경우 경고
                    if (salaryBatchService.canExecuteBatch(now.minusMonths(1)) && 
                        !"COMPLETED".equals(previousMonthStatus.getStatus())) {
                        log.warn("⚠️ [SalaryBatchMonitor] 급여 배치 미완료: tenantId={}, {}-{}", 
                            tenantId, now.minusMonths(1).getYear(), now.minusMonths(1).getMonthValue());
                        warningCount++;
                    }
                    
                } finally {
                    TenantContextHolder.clear();
                }
            }
            
            LocalDateTime endTime = LocalDateTime.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();
            
            log.debug("✅ [SalaryBatchMonitor] 모니터링 완료: executionId={}, duration={}ms, warnings={}", 
                executionId, durationMs, warningCount);
            
            // 경고가 많으면 알림 발송
            if (warningCount > 5) {
                alertService.sendFailureAlert(
                    "SalaryBatchMonitor",
                    executionId,
                    warningCount,
                    String.format("%d개 테넌트에서 급여 배치가 미완료 상태입니다.", warningCount)
                );
            }
            
        } catch (Exception e) {
            log.error("❌ [SalaryBatchMonitor] 모니터링 실패: executionId={}, error={}", 
                executionId, e.getMessage(), e);
        }
    }
}
