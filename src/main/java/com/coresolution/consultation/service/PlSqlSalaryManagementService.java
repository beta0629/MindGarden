package com.coresolution.consultation.service;

import java.time.LocalDate;
import java.util.Map;

/**
 * PL/SQL 급여관리 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-25
 */
public interface PlSqlSalaryManagementService {
    
    /**
     * 통합 급여 계산 및 ERP 동기화
     */
    Map<String, Object> processIntegratedSalaryCalculation(
            Long consultantId, 
            LocalDate periodStart, 
            LocalDate periodEnd, 
            String triggeredBy);
    
    /**
     * 급여 승인 및 ERP 동기화
     */
    Map<String, Object> approveSalaryWithErpSync(Long calculationId, String approvedBy);
    
    /**
     * 급여 지급 완료 및 ERP 동기화
     */
    Map<String, Object> processSalaryPaymentWithErpSync(Long calculationId, String paidBy);
    
    /**
     * 통합 급여 통계 조회
     */
    Map<String, Object> getIntegratedSalaryStatistics(
            String branchCode, 
            LocalDate startDate, 
            LocalDate endDate);
    
    /**
     * PL/SQL 프로시저 사용 가능 여부 확인
     */
    boolean isProcedureAvailable();
    
    /**
     * 급여 계산 미리보기 (저장하지 않음)
     */
    Map<String, Object> calculateSalaryPreview(Long consultantId, LocalDate periodStart, LocalDate periodEnd);
}
