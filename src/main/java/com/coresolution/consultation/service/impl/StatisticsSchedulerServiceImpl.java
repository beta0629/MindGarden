package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.coresolution.consultation.entity.ErpSyncLog;
import com.coresolution.consultation.repository.ErpSyncLogRepository;
import com.coresolution.consultation.service.PlSqlStatisticsService;
import com.coresolution.consultation.service.StatisticsSchedulerService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

 * 통계 자동화 스케줄러 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StatisticsSchedulerServiceImpl implements StatisticsSchedulerService {
    
    private final PlSqlStatisticsService plSqlStatisticsService;
    private final ErpSyncLogRepository erpSyncLogRepository;
    
     * 일별 통계 자동 업데이트 스케줄러
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
    
     * 상담사 성과 자동 업데이트 스케줄러
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
    
     * 성과 모니터링 자동 실행 스케줄러
     * 매일 자정 5분 후 실행 (cron: 0 5 0 * * *)
     */
    @Override
    @Scheduled(cron = "0 5 0 * * *")
    public void schedulePerformanceMonitoring() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDateTime startTime = LocalDateTime.now();
        
        log.info("🔔 성과 모니터링 자동 실행 시작: targetDate={}", yesterday);
        
        try {
            int alertCount = plSqlStatisticsService.performDailyPerformanceMonitoring(yesterday);
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
            
            int alertCount = plSqlStatisticsService.performDailyPerformanceMonitoring(targetDate);
            
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
    
     * 특정 날짜의 지점 수 조회 (통계용)
     */
    private int getBranchCount(LocalDate date) {
        return 1;
    }
    
     * 특정 날짜의 상담사 수 조회 (통계용)
     */
    private int getConsultantCount(LocalDate date) {
        return 1;
    }
}
