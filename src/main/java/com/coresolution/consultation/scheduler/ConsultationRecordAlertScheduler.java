package com.coresolution.consultation.scheduler;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.coresolution.consultation.service.PlSqlConsultationRecordAlertService;
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
 * 상담일지 미작성 알림 스케줄러 (표준화 적용)
 * - 매일 오전 9시에 전날 상담일지 미작성 확인
 * - 매주 월요일 오전 10시에 지난주 전체 확인
 * - 테넌트별 독립 실행
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-12-02
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
    name = "scheduler.consultation-record-alert.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class ConsultationRecordAlertScheduler {
    
    private final PlSqlConsultationRecordAlertService consultationRecordAlertService;
    private final TenantService tenantService;
    private final SchedulerExecutionLogService logService;
    private final SchedulerAlertService alertService;
    
    @Value("${scheduler.consultation-record-alert.cron:0 0 9 * * *}")
    private String cronExpression;
    
    /**
     * 매일 오전 9시에 전날 상담일지 미작성 확인 (테넌트별 독립 실행)
     * Cron: 매일 오전 9시
     */
    @Scheduled(cron = "${scheduler.consultation-record-alert.cron:0 0 9 * * *}")
    public void checkDailyMissingConsultationRecords() {
        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();
        
        log.info("⏰ [ConsultationRecordAlert] 일일 스케줄러 시작: executionId={}", executionId);
        
        LocalDate yesterday = LocalDate.now().minusDays(1);
        
        int successCount = 0;
        int failureCount = 0;
        int totalTenants = 0;
        
        try {
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            totalTenants = activeTenantIds.size();
            log.info("📋 [ConsultationRecordAlert] 대상 테넌트 수: {}", totalTenants);
            
            for (String tenantId : activeTenantIds) {
                try {
                    TenantContextHolder.setTenantId(tenantId);
                    
                    Map<String, Object> result = consultationRecordAlertService.checkMissingConsultationRecords(
                        yesterday, null // 전체 지점
                    );
                    
                    Boolean success = (Boolean) result.get("success");
                    String message = (String) result.get("message");
                    Integer missingCount = (Integer) result.get("missingCount");
                    Integer alertsCreated = (Integer) result.get("alertsCreated");
                    
                    if (success) {
                        log.info("✅ [ConsultationRecordAlert] 일일 확인 완료: tenantId={}, 미작성={}건, 알림={}건", 
                            tenantId, missingCount, alertsCreated);
                        logService.saveExecutionLog(
                            executionId, tenantId, "ConsultationRecordAlert", "SUCCESS", 
                            String.format("Missing: %d, Alerts: %d", missingCount, alertsCreated)
                        );
                        successCount++;
                    } else {
                        log.error("❌ [ConsultationRecordAlert] 일일 확인 실패: tenantId={}, message={}", 
                            tenantId, message);
                        logService.saveExecutionLog(
                            executionId, tenantId, "ConsultationRecordAlert", "FAILED", message
                        );
                        failureCount++;
                    }
                    
                } catch (Exception e) {
                    log.error("❌ [ConsultationRecordAlert] 일일 확인 오류: tenantId={}, error={}", 
                        tenantId, e.getMessage(), e);
                    logService.saveExecutionLog(
                        executionId, tenantId, "ConsultationRecordAlert", "FAILED", e.getMessage()
                    );
                    failureCount++;
                } finally {
                    TenantContextHolder.clear();
                }
            }
            
            LocalDateTime endTime = LocalDateTime.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();
            
            log.info("✅ [ConsultationRecordAlert] 일일 스케줄러 완료: executionId={}, duration={}ms, success={}, failure={}",
                executionId, durationMs, successCount, failureCount);
            
            logService.saveSummaryLog(
                executionId,
                "ConsultationRecordAlert-Daily",
                totalTenants,
                successCount,
                failureCount,
                durationMs,
                startTime,
                endTime
            );
            
        } catch (Exception e) {
            log.error("❌ [ConsultationRecordAlert] 일일 스케줄러 전체 실행 실패: executionId={}, error={}",
                executionId, e.getMessage(), e);
            alertService.sendFailureAlert(
                "ConsultationRecordAlert-Daily", executionId, failureCount, e.getMessage()
            );
        }
    }
    
    /**
     * 매주 월요일 오전 10시에 지난주 전체 상담일지 미작성 확인 (테넌트별 독립 실행)
     * Cron: 매주 월요일 오전 10시
     */
    @Scheduled(cron = "0 0 10 * * 1")
    public void checkWeeklyMissingConsultationRecords() {
        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();
        
        log.info("⏰ [ConsultationRecordAlert] 주간 스케줄러 시작: executionId={}", executionId);
        
        int successCount = 0;
        int failureCount = 0;
        int totalTenants = 0;
        
        try {
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            totalTenants = activeTenantIds.size();
            log.info("📋 [ConsultationRecordAlert] 대상 테넌트 수: {}", totalTenants);
            
            for (String tenantId : activeTenantIds) {
                try {
                    TenantContextHolder.setTenantId(tenantId);
                    
                    Map<String, Object> result = consultationRecordAlertService.autoCreateMissingConsultationRecordAlerts(7);
                    
                    Boolean success = (Boolean) result.get("success");
                    String message = (String) result.get("message");
                    Integer processedDays = (Integer) result.get("processedDays");
                    Integer totalAlertsCreated = (Integer) result.get("totalAlertsCreated");
                    
                    if (success) {
                        log.info("✅ [ConsultationRecordAlert] 주간 확인 완료: tenantId={}, 처리일수={}일, 알림={}건", 
                            tenantId, processedDays, totalAlertsCreated);
                        logService.saveExecutionLog(
                            executionId, tenantId, "ConsultationRecordAlert-Weekly", "SUCCESS", 
                            String.format("Days: %d, Alerts: %d", processedDays, totalAlertsCreated)
                        );
                        successCount++;
                    } else {
                        log.error("❌ [ConsultationRecordAlert] 주간 확인 실패: tenantId={}, message={}", 
                            tenantId, message);
                        logService.saveExecutionLog(
                            executionId, tenantId, "ConsultationRecordAlert-Weekly", "FAILED", message
                        );
                        failureCount++;
                    }
                    
                } catch (Exception e) {
                    log.error("❌ [ConsultationRecordAlert] 주간 확인 오류: tenantId={}, error={}", 
                        tenantId, e.getMessage(), e);
                    logService.saveExecutionLog(
                        executionId, tenantId, "ConsultationRecordAlert-Weekly", "FAILED", e.getMessage()
                    );
                    failureCount++;
                } finally {
                    TenantContextHolder.clear();
                }
            }
            
            LocalDateTime endTime = LocalDateTime.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();
            
            log.info("✅ [ConsultationRecordAlert] 주간 스케줄러 완료: executionId={}, duration={}ms, success={}, failure={}",
                executionId, durationMs, successCount, failureCount);
            
            logService.saveSummaryLog(
                executionId,
                "ConsultationRecordAlert-Weekly",
                totalTenants,
                successCount,
                failureCount,
                durationMs,
                startTime,
                endTime
            );
            
        } catch (Exception e) {
            log.error("❌ [ConsultationRecordAlert] 주간 스케줄러 전체 실행 실패: executionId={}, error={}",
                executionId, e.getMessage(), e);
            alertService.sendFailureAlert(
                "ConsultationRecordAlert-Weekly", executionId, failureCount, e.getMessage()
            );
        }
    }
    
    /**
     * 매월 1일 오전 11시에 지난달 전체 상담일지 미작성 확인 (테넌트별 독립 실행)
     * Cron: 매월 1일 오전 11시
     */
    @Scheduled(cron = "0 0 11 1 * ?")
    public void checkMonthlyMissingConsultationRecords() {
        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();
        
        log.info("⏰ [ConsultationRecordAlert] 월간 스케줄러 시작: executionId={}", executionId);
        
        int successCount = 0;
        int failureCount = 0;
        int totalTenants = 0;
        
        try {
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            totalTenants = activeTenantIds.size();
            log.info("📋 [ConsultationRecordAlert] 대상 테넌트 수: {}", totalTenants);
            
            for (String tenantId : activeTenantIds) {
                try {
                    TenantContextHolder.setTenantId(tenantId);
                    
                    Map<String, Object> result = consultationRecordAlertService.autoCreateMissingConsultationRecordAlerts(30);
                    
                    Boolean success = (Boolean) result.get("success");
                    String message = (String) result.get("message");
                    Integer processedDays = (Integer) result.get("processedDays");
                    Integer totalAlertsCreated = (Integer) result.get("totalAlertsCreated");
                    
                    if (success) {
                        log.info("✅ [ConsultationRecordAlert] 월간 확인 완료: tenantId={}, 처리일수={}일, 알림={}건", 
                            tenantId, processedDays, totalAlertsCreated);
                        logService.saveExecutionLog(
                            executionId, tenantId, "ConsultationRecordAlert-Monthly", "SUCCESS", 
                            String.format("Days: %d, Alerts: %d", processedDays, totalAlertsCreated)
                        );
                        successCount++;
                    } else {
                        log.error("❌ [ConsultationRecordAlert] 월간 확인 실패: tenantId={}, message={}", 
                            tenantId, message);
                        logService.saveExecutionLog(
                            executionId, tenantId, "ConsultationRecordAlert-Monthly", "FAILED", message
                        );
                        failureCount++;
                    }
                    
                } catch (Exception e) {
                    log.error("❌ [ConsultationRecordAlert] 월간 확인 오류: tenantId={}, error={}", 
                        tenantId, e.getMessage(), e);
                    logService.saveExecutionLog(
                        executionId, tenantId, "ConsultationRecordAlert-Monthly", "FAILED", e.getMessage()
                    );
                    failureCount++;
                } finally {
                    TenantContextHolder.clear();
                }
            }
            
            LocalDateTime endTime = LocalDateTime.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();
            
            log.info("✅ [ConsultationRecordAlert] 월간 스케줄러 완료: executionId={}, duration={}ms, success={}, failure={}",
                executionId, durationMs, successCount, failureCount);
            
            logService.saveSummaryLog(
                executionId,
                "ConsultationRecordAlert-Monthly",
                totalTenants,
                successCount,
                failureCount,
                durationMs,
                startTime,
                endTime
            );
            
        } catch (Exception e) {
            log.error("❌ [ConsultationRecordAlert] 월간 스케줄러 전체 실행 실패: executionId={}, error={}",
                executionId, e.getMessage(), e);
            alertService.sendFailureAlert(
                "ConsultationRecordAlert-Monthly", executionId, failureCount, e.getMessage()
            );
        }
    }
    
    /**
     * 수동 상담일지 미작성 확인 실행 (관리자용)
     * @param daysBack 확인할 과거 일수
     * @return 실행 결과
     */
    public Map<String, Object> manualCheckMissingRecords(int daysBack) {
        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();
        
        log.info("⏰ [ConsultationRecordAlert] 수동 실행 시작: executionId={}, daysBack={}", 
            executionId, daysBack);
        
        int successCount = 0;
        int failureCount = 0;
        int totalTenants = 0;
        int totalAlertsCreated = 0;
        
        try {
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            totalTenants = activeTenantIds.size();
            log.info("📋 [ConsultationRecordAlert] 대상 테넌트 수: {}", totalTenants);
            
            for (String tenantId : activeTenantIds) {
                try {
                    TenantContextHolder.setTenantId(tenantId);
                    
                    Map<String, Object> result = consultationRecordAlertService.autoCreateMissingConsultationRecordAlerts(daysBack);
                    
                    Boolean success = (Boolean) result.get("success");
                    Integer alertsCreated = (Integer) result.get("totalAlertsCreated");
                    
                    if (success) {
                        totalAlertsCreated += (alertsCreated != null ? alertsCreated : 0);
                        successCount++;
                    } else {
                        failureCount++;
                    }
                    
                } catch (Exception e) {
                    log.error("❌ [ConsultationRecordAlert] 수동 실행 오류: tenantId={}, error={}", 
                        tenantId, e.getMessage(), e);
                    failureCount++;
                } finally {
                    TenantContextHolder.clear();
                }
            }
            
            LocalDateTime endTime = LocalDateTime.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();
            
            log.info("✅ [ConsultationRecordAlert] 수동 실행 완료: executionId={}, duration={}ms, success={}, failure={}, totalAlerts={}",
                executionId, durationMs, successCount, failureCount, totalAlertsCreated);
            
            return Map.of(
                "success", true,
                "message", "수동 확인이 완료되었습니다.",
                "processedDays", daysBack,
                "totalTenants", totalTenants,
                "successCount", successCount,
                "failureCount", failureCount,
                "totalAlertsCreated", totalAlertsCreated,
                "executionTimeMs", durationMs
            );
            
        } catch (Exception e) {
            log.error("❌ [ConsultationRecordAlert] 수동 실행 전체 실패: executionId={}, error={}",
                executionId, e.getMessage(), e);
            
            return Map.of(
                "success", false,
                "message", "수동 확인 중 오류가 발생했습니다: " + e.getMessage(),
                "processedDays", daysBack,
                "totalAlertsCreated", 0
            );
        }
    }
}
