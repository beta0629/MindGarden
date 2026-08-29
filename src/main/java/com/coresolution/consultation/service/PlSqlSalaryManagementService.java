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
     *
     * @param calculationId 급여 계산 ID
     * @param tenantId      테넌트 ID (프로시저 IN p_tenant_id)
     * @param approvedBy    승인자
     * @return success, message 등 결과 맵
     */
    Map<String, Object> approveSalaryWithErpSync(Long calculationId, String tenantId, String approvedBy);
    
    /**
     * 급여 지급 완료 및 ERP 동기화
     *
     * @param calculationId 급여 계산 ID
     * @param tenantId      테넌트 ID (프로시저 IN p_tenant_id)
     * @param paidBy        지급 처리자
     * @return success, message 등 결과 맵
     */
    Map<String, Object> processSalaryPaymentWithErpSync(Long calculationId, String tenantId, String paidBy);
    
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

    /**
     * 미지급 PRIMARY 급여 제자리 재계산 (늦은 COMPLETED 회기).
     *
     * @param calculationId PRIMARY salary_calculations.id
     * @param tenantId      테넌트 ID
     * @param triggeredBy   실행자
     * @return success, message, calculationId, completedConsultations, grossSalary, netSalary, taxAmount
     */
    Map<String, Object> recalcUnpaidSalaryCalculation(Long calculationId, String tenantId, String triggeredBy);

    /**
     * 지급완료 PRIMARY 기준 늦은 회기 ADJUSTMENT INSERT.
     *
     * @param calculationId PAID PRIMARY salary_calculations.id
     * @param tenantId      테넌트 ID
     * @param triggeredBy   실행자
     * @return success, message, calculationId, completedConsultations, grossSalary, netSalary, taxAmount
     */
    Map<String, Object> insertSalaryAdjustmentForLateSessions(
            Long calculationId, String tenantId, String triggeredBy);

    /**
     * 확정 전 경고 조회 (hard-block 아님 — 정보만).
     *
     * @param consultantId 상담사 ID
     * @param periodStart  기간 시작
     * @param periodEnd    기간 종료
     * @return success, counts, primaryCalculationId, primaryStatus 등
     */
    Map<String, Object> getSalaryPreConfirmWarning(
            Long consultantId, LocalDate periodStart, LocalDate periodEnd);
}
