package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.coresolution.consultation.entity.ErpSyncLog;
import com.coresolution.consultation.repository.ErpSyncLogRepository;
import com.coresolution.consultation.service.PlSqlStatisticsService;
import com.coresolution.consultation.service.StatisticsSchedulerService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

 /**
 * 통계 자동화 스케줄러 서비스 구현체
 /**
 * 
 /**
 * @author MindGarden
 /**
 * @version 1.0.0
 /**
 * @since 2025-09-24
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StatisticsSchedulerServiceImpl implements StatisticsSchedulerService {
    
    private final PlSqlStatisticsService plSqlStatisticsService;
    private final ErpSyncLogRepository erpSyncLogRepository;
    private final TenantService tenantService;
    
     /**
     * 일별 통계 자동 업데이트 스케줄러
     /**
     * 매일 자정 1분 후 실행 (cron: 0 1 0 * * *)
     */
    @Override
    @Scheduled(cron = "0 1 0 * * *")
    public void scheduleDailyStatisticsUpdate() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDateTime startTime = LocalDateTime.now();
        
        log.info("📊 일별 통계 자동 업데이트 시작: targetDate={}", yesterday);
        
        try {
            String result = plSqlStatisticsService.updateAllBranchDailyStatistics(yesterday);
            LocalDateTime endTime = LocalDateTime.now();
            
            ErpSyncLog syncLog = ErpSyncLog.builder()
                .syncType(ErpSyncLog.SyncType.FINANCIAL)
                .syncDate(startTime)
                .recordsProcessed(getBranchCount(yesterday))
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .status(ErpSyncLog.SyncStatus.COMPLETED)
                .startedAt(startTime)
                .completedAt(endTime)
                .durationSeconds(java.time.Duration.between(startTime, endTime).getSeconds())
                .build();
            
            erpSyncLogRepository.save(syncLog);
            
            log.info("✅ 일별 통계 자동 업데이트 완료: targetDate={}, result={}", yesterday, result);
            
        } catch (Exception e) {
            LocalDateTime endTime = LocalDateTime.now();
            
            ErpSyncLog syncLog = ErpSyncLog.builder()
                .syncType(ErpSyncLog.SyncType.FINANCIAL)
                .syncDate(startTime)
                .recordsProcessed(0)
                .status(ErpSyncLog.SyncStatus.FAILED)
                .startedAt(startTime)
                .completedAt(endTime)
                .durationSeconds(java.time.Duration.between(startTime, endTime).getSeconds())
                .errorMessage(e.getMessage())
                .build();
            
            erpSyncLogRepository.save(syncLog);
            
            log.error("❌ 일별 통계 자동 업데이트 실패: targetDate={}, 오류={}", yesterday, e.getMessage(), e);
        }
    }
    
     /**
     * 상담사 성과 자동 업데이트 스케줄러
     /**
     * 매일 자정 3분 후 실행 (cron: 0 3 0 * * *)
     */
    @Override
    @Scheduled(cron = "0 3 0 * * *")
    public void scheduleConsultantPerformanceUpdate() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDateTime startTime = LocalDateTime.now();
        
        log.info("📈 상담사 성과 자동 업데이트 시작: targetDate={}", yesterday);
        
        try {
            String result = plSqlStatisticsService.updateAllConsultantPerformance(yesterday);
            LocalDateTime endTime = LocalDateTime.now();
            
            ErpSyncLog syncLog = ErpSyncLog.builder()
                .syncType(ErpSyncLog.SyncType.SALARY)
                .syncDate(startTime)
                .recordsProcessed(getConsultantCount(yesterday))
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .status(ErpSyncLog.SyncStatus.COMPLETED)
                .startedAt(startTime)
                .completedAt(endTime)
                .durationSeconds(java.time.Duration.between(startTime, endTime).getSeconds())
                .build();
            
            erpSyncLogRepository.save(syncLog);
            
            log.info("✅ 상담사 성과 자동 업데이트 완료: targetDate={}, result={}", yesterday, result);
            
        } catch (Exception e) {
            LocalDateTime endTime = LocalDateTime.now();
            
            ErpSyncLog syncLog = ErpSyncLog.builder()
                .syncType(ErpSyncLog.SyncType.SALARY)
                .syncDate(startTime)
                .recordsProcessed(0)
                .status(ErpSyncLog.SyncStatus.FAILED)
                .startedAt(startTime)
                .completedAt(endTime)
                .durationSeconds(java.time.Duration.between(startTime, endTime).getSeconds())
                .errorMessage(e.getMessage())
                .build();
            
            erpSyncLogRepository.save(syncLog);
            
            log.error("❌ 상담사 성과 자동 업데이트 실패: targetDate={}, 오류={}", yesterday, e.getMessage(), e);
        }
    }
    
     /**
     * 성과 모니터링 자동 실행 스케줄러
     /**
     * 매일 자정 5분 후 실행 (cron: 0 5 0 * * *)
     */
    @Override
    @Scheduled(cron = "0 5 0 * * *")
    public void schedulePerformanceMonitoring() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDateTime startTime = LocalDateTime.now();
        
        log.info("🔔 성과 모니터링 자동 실행 시작: targetDate={}", yesterday);
        
        try {
            int alertCount = runPerformanceMonitoringForAllActiveTenants(yesterday);
            LocalDateTime endTime = LocalDateTime.now();
            
            ErpSyncLog syncLog = ErpSyncLog.builder()
                .syncType(ErpSyncLog.SyncType.CUSTOMER)
                .syncDate(startTime)
                .recordsProcessed(alertCount)
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .status(ErpSyncLog.SyncStatus.COMPLETED)
                .startedAt(startTime)
                .completedAt(endTime)
                .durationSeconds(java.time.Duration.between(startTime, endTime).getSeconds())
                .build();
            
            erpSyncLogRepository.save(syncLog);
            
            log.info("✅ 성과 모니터링 자동 실행 완료: targetDate={}, 생성된알림={}개", yesterday, alertCount);
            
        } catch (Exception e) {
            LocalDateTime endTime = LocalDateTime.now();
            
            ErpSyncLog syncLog = ErpSyncLog.builder()
                .syncType(ErpSyncLog.SyncType.CUSTOMER)
                .syncDate(startTime)
                .recordsProcessed(0)
                .status(ErpSyncLog.SyncStatus.FAILED)
                .startedAt(startTime)
                .completedAt(endTime)
                .durationSeconds(java.time.Duration.between(startTime, endTime).getSeconds())
                .errorMessage(e.getMessage())
                .build();
            
            erpSyncLogRepository.save(syncLog);
            
            log.error("❌ 성과 모니터링 자동 실행 실패: targetDate={}, 오류={}", yesterday, e.getMessage(), e);
        }
    }
    
    @Override
    public String updateYesterdayStatistics() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        return updateStatisticsForDate(yesterday);
    }
    
    @Override
    public String updateStatisticsForDate(LocalDate targetDate) {
        log.info("📊 수동 통계 업데이트 실행: targetDate={}", targetDate);
        
        try {
            String dailyResult = plSqlStatisticsService.updateAllBranchDailyStatistics(targetDate);
            
            String performanceResult = plSqlStatisticsService.updateAllConsultantPerformance(targetDate);
            
            int alertCount = runPerformanceMonitoringForAllActiveTenants(targetDate);
            
            String result = String.format(
                "수동 통계 업데이트 완료 - 일별통계: %s, 성과업데이트: %s, 생성된알림: %d개",
                dailyResult, performanceResult, alertCount
            );
            
            log.info("✅ 수동 통계 업데이트 완료: targetDate={}, result={}", targetDate, result);
            return result;
            
        } catch (Exception e) {
            String errorResult = "수동 통계 업데이트 실패: " + e.getMessage();
            log.error("❌ 수동 통계 업데이트 실패: targetDate={}, 오류={}", targetDate, e.getMessage(), e);
            return errorResult;
        }
    }
    
    @Override
    public String getSchedulerStatus() {
        try {
            boolean plsqlAvailable = plSqlStatisticsService.isProcedureAvailable();
            
            LocalDate today = LocalDate.now();
            long todayLogs = erpSyncLogRepository.countBySyncDateAfter(today.atStartOfDay());
            
            return String.format(
                "스케줄러 상태 - PL/SQL사용가능: %s, 오늘실행로그: %d개, 마지막확인: %s",
                plsqlAvailable, todayLogs, LocalDateTime.now()
            );
            
        } catch (Exception e) {
            return "스케줄러 상태 확인 실패: " + e.getMessage();
        }
    }
    
     /**
     * 특정 날짜의 지점 수 조회 (통계용)
     */
    private int getBranchCount(LocalDate date) {
        return 1;
    }
    
     /**
     * 특정 날짜의 상담사 수 조회 (통계용)
     */
    private int getConsultantCount(LocalDate date) {
        return 1;
    }

    /**
     * 스케줄/수동 경로: 스레드에 테넌트 컨텍스트가 없을 수 있으므로
     * 활성 테넌트별로 {@link TenantContextHolder}를 설정한 뒤
     * {@link PlSqlStatisticsService#performDailyPerformanceMonitoring} 호출.
     *
     * @param targetDate 모니터링 기준일
     * @return 전 테넌트에서 생성·집계된 알림 수 합
     */
    private int runPerformanceMonitoringForAllActiveTenants(LocalDate targetDate) {
        List<String> tenantIds = tenantService.getAllActiveTenantIds();
        if (tenantIds.isEmpty()) {
            log.warn("활성 테넌트가 없어 일일 성과 모니터링을 생략합니다: targetDate={}", targetDate);
            return 0;
        }
        long startedMs = System.currentTimeMillis();
        int totalAlerts = 0;
        int failedTenants = 0;
        for (String tenantId : tenantIds) {
            try {
                TenantContextHolder.setTenantId(tenantId);
                totalAlerts += plSqlStatisticsService.performDailyPerformanceMonitoring(targetDate);
            } catch (Exception e) {
                failedTenants++;
                log.error("테넌트별 성과 모니터링 실패: tenantId={}, targetDate={}, error={}", tenantId,
                    targetDate, e.getMessage(), e);
            } finally {
                TenantContextHolder.clear();
            }
        }
        long elapsedMs = System.currentTimeMillis() - startedMs;
        log.info("일일 성과 모니터링(테넌트 루프) 요약: targetDate={}, tenantCount={}, failedTenants={}, totalAlerts={}, elapsedMs={}",
            targetDate, tenantIds.size(), failedTenants, totalAlerts, elapsedMs);
        return totalAlerts;
    }
}
