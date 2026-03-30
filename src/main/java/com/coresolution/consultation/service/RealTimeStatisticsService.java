package com.coresolution.consultation.service;

import java.time.LocalDate;
import com.coresolution.consultation.entity.Schedule;

/**
 * 실시간 통계 업데이트 서비스
 * 스케줄 완료, 매핑 변경 등 실시간 이벤트 발생시 통계를 즉시 업데이트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
public interface RealTimeStatisticsService {
    
    /**
     * 스케줄 완료시 실시간 통계 업데이트
     * 
     * @param schedule 완료된 스케줄
     */
    void updateStatisticsOnScheduleCompletion(Schedule schedule);
    
    /**
     * 상담사별 성과 실시간 업데이트
     * 
     * @param consultantId 상담사 ID
     * @param date 성과 계산 대상 날짜
     */
    void updateConsultantPerformance(Long consultantId, LocalDate date);
    
    /**
     * 지점별 일별 통계 실시간 업데이트
     * 
     * @param branchCode 지점 코드
     * @param date 통계 대상 날짜
     */
    void updateDailyStatistics(String branchCode, LocalDate date);
    
    /**
     * 매핑 상태 변경시 통계 업데이트
     * 
     * @param consultantId 상담사 ID
     * @param clientId 내담자 ID
     * @param branchCode 지점 코드
     */
    void updateStatisticsOnMappingChange(Long consultantId, Long clientId, String branchCode);
    
    /**
     * 결제 완료시 재무 통계 업데이트
     * 
     * @param branchCode 지점 코드
     * @param amount 결제 금액
     * @param date 결제 날짜
     */
    void updateFinancialStatisticsOnPayment(String branchCode, Long amount, LocalDate date);
    
    /**
     * 환불 발생시 통계 업데이트
     * 
     * @param consultantId 상담사 ID
     * @param branchCode 지점 코드
     * @param refundAmount 환불 금액
     * @param date 환불 날짜
     */
    void updateStatisticsOnRefund(Long consultantId, String branchCode, Long refundAmount, LocalDate date);
}
