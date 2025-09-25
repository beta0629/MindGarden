package com.mindgarden.consultation.scheduler;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import com.mindgarden.consultation.service.SalaryBatchService;
import com.mindgarden.consultation.service.SalaryScheduleService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 급여 배치 스케줄러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-25
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "salary.batch.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class SalaryBatchScheduler {
    
    private final SalaryBatchService salaryBatchService;
    private final SalaryScheduleService salaryScheduleService;
    
    /**
     * 매월 기산일에 급여 배치 자동 실행
     * 매일 새벽 2시에 배치 실행 가능 여부 확인
     */
    @Scheduled(cron = "0 0 2 * * ?") // 매일 새벽 2시
    public void checkAndExecuteSalaryBatch() {
        log.info("🕐 급여 배치 스케줄러 실행: {}", LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE));
        
        try {
            LocalDate now = LocalDate.now();
            
            // 1. 배치 실행 가능 여부 확인
            if (!salaryBatchService.canExecuteBatch(now)) {
                log.info("⏳ 급여 배치 실행 시간이 아닙니다: {}", now);
                return;
            }
            
            // 2. 이미 처리되었는지 확인 (이전 달 기준)
            LocalDate previousMonth = now.minusMonths(1);
            SalaryBatchService.BatchStatus status = salaryBatchService.getBatchStatus(
                previousMonth.getYear(), 
                previousMonth.getMonthValue()
            );
            
            if ("COMPLETED".equals(status.getStatus())) {
                log.info("✅ 이전 달 급여 배치가 이미 완료되었습니다: {}-{}", 
                    previousMonth.getYear(), previousMonth.getMonthValue());
                return;
            }
            
            // 3. 이전 달 급여 배치 실행
            log.info("🚀 이전 달 급여 배치 실행 시작: {}-{}", 
                previousMonth.getYear(), previousMonth.getMonthValue());
            
            SalaryBatchService.BatchResult result = salaryBatchService.executeMonthlySalaryBatch(
                previousMonth.getYear(), 
                previousMonth.getMonthValue(), 
                null // 전체 지점
            );
            
            if (result.isSuccess()) {
                log.info("🎉 급여 배치 자동 실행 완료: {}", result.getMessage());
            } else {
                log.error("❌ 급여 배치 자동 실행 실패: {}", result.getMessage());
            }
            
        } catch (Exception e) {
            log.error("❌ 급여 배치 스케줄러 실행 중 오류 발생", e);
        }
    }
    
    /**
     * 급여 배치 상태 모니터링
     * 매시간마다 실행
     */
    @Scheduled(cron = "0 0 * * * ?") // 매시간 정각
    public void monitorBatchStatus() {
        try {
            LocalDate now = LocalDate.now();
            
            // 현재 달과 이전 달 배치 상태 확인
            SalaryBatchService.BatchStatus currentMonthStatus = salaryBatchService.getBatchStatus(
                now.getYear(), now.getMonthValue());
            
            SalaryBatchService.BatchStatus previousMonthStatus = salaryBatchService.getBatchStatus(
                now.minusMonths(1).getYear(), now.minusMonths(1).getMonthValue());
            
            log.debug("📊 급여 배치 상태 모니터링: 현재달={}, 이전달={}", 
                currentMonthStatus.getStatus(), previousMonthStatus.getStatus());
            
            // 배치 실행 가능한데 아직 실행되지 않은 경우 경고
            if (salaryBatchService.canExecuteBatch(now.minusMonths(1)) && 
                !"COMPLETED".equals(previousMonthStatus.getStatus())) {
                log.warn("⚠️ 급여 배치가 실행 가능한 상태이지만 아직 완료되지 않았습니다: {}-{}", 
                    now.minusMonths(1).getYear(), now.minusMonths(1).getMonthValue());
            }
            
        } catch (Exception e) {
            log.error("❌ 급여 배치 상태 모니터링 중 오류 발생", e);
        }
    }
}
