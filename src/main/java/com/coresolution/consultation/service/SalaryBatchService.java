package com.coresolution.consultation.service;

import java.time.LocalDate;

/**
 * 급여 배치 처리 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-25
 */
public interface SalaryBatchService {
    
    /**
     * 월별 급여 배치 실행
     * @param targetYear 대상 년도
     * @param targetMonth 대상 월
     * @param branchCode 지점 코드 (null이면 전체)
     * @return 배치 처리 결과
     */
    BatchResult executeMonthlySalaryBatch(int targetYear, int targetMonth, String branchCode);
    
    /**
     * 현재 월의 급여 배치 실행
     * @return 배치 처리 결과
     */
    BatchResult executeCurrentMonthBatch();
    
    /**
     * 급여 배치 실행 가능 여부 확인
     * @param targetDate 대상 날짜
     * @return 실행 가능 여부
     */
    boolean canExecuteBatch(LocalDate targetDate);
    
    /**
     * 급여 배치 상태 조회
     * @param targetYear 대상 년도
     * @param targetMonth 대상 월
     * @return 배치 상태
     */
    BatchStatus getBatchStatus(int targetYear, int targetMonth);
    
    /**
     * 배치 결과 클래스
     */
    class BatchResult {
        private boolean success;
        private String message;
        private int processedCount;
        private int successCount;
        private int errorCount;
        private LocalDate executedAt;
        
        // 생성자, getter, setter
        public BatchResult(boolean success, String message) {
            this.success = success;
            this.message = message;
            this.executedAt = LocalDate.now();
        }
        
        public BatchResult(boolean success, String message, int processedCount, int successCount, int errorCount) {
            this.success = success;
            this.message = message;
            this.processedCount = processedCount;
            this.successCount = successCount;
            this.errorCount = errorCount;
            this.executedAt = LocalDate.now();
        }
        
        // getter, setter
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public int getProcessedCount() { return processedCount; }
        public void setProcessedCount(int processedCount) { this.processedCount = processedCount; }
        
        public int getSuccessCount() { return successCount; }
        public void setSuccessCount(int successCount) { this.successCount = successCount; }
        
        public int getErrorCount() { return errorCount; }
        public void setErrorCount(int errorCount) { this.errorCount = errorCount; }
        
        public LocalDate getExecutedAt() { return executedAt; }
        public void setExecutedAt(LocalDate executedAt) { this.executedAt = executedAt; }
    }
    
    /**
     * 배치 상태 클래스
     */
    class BatchStatus {
        private String status; // PENDING, RUNNING, COMPLETED, FAILED
        private LocalDate lastExecuted;
        private int totalConsultants;
        private int processedConsultants;
        private String message;
        
        // 생성자, getter, setter
        public BatchStatus(String status) {
            this.status = status;
        }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public LocalDate getLastExecuted() { return lastExecuted; }
        public void setLastExecuted(LocalDate lastExecuted) { this.lastExecuted = lastExecuted; }
        
        public int getTotalConsultants() { return totalConsultants; }
        public void setTotalConsultants(int totalConsultants) { this.totalConsultants = totalConsultants; }
        
        public int getProcessedConsultants() { return processedConsultants; }
        public void setProcessedConsultants(int processedConsultants) { this.processedConsultants = processedConsultants; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
