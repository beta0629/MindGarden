package com.coresolution.consultation.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

/**
 * PL/SQL 통합회계 관리 서비스 인터페이스
 * 복잡한 회계 로직을 PL/SQL로 처리하여 성능 향상 및 데이터 일관성 보장
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-25
 */
public interface PlSqlAccountingService {
    
    /**
     * 통합 금액 검증 및 일관성 검사
     * 
     * @param mappingId 매핑 ID
     * @param inputAmount 입력 금액
     * @return 검증 결과
     */
    Map<String, Object> validateIntegratedAmount(Long mappingId, BigDecimal inputAmount);
    
    /**
     * 전사 통합 재무 현황 조회
     * 
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @param branchCodes 지점 코드 배열 (JSON)
     * @return 통합 재무 현황
     */
    Map<String, Object> getConsolidatedFinancialData(LocalDate startDate, LocalDate endDate, String branchCodes);
    
    /**
     * 할인 회계 통합 처리
     * 
     * @param mappingId 매핑 ID
     * @param discountCode 할인 코드
     * @param originalAmount 원래 금액
     * @param discountAmount 할인 금액
     * @param finalAmount 최종 금액
     * @param discountType 할인 유형
     * @return 할인 회계 처리 결과
     */
    Map<String, Object> processDiscountAccounting(
        Long mappingId, 
        String discountCode, 
        BigDecimal originalAmount, 
        BigDecimal discountAmount, 
        BigDecimal finalAmount, 
        String discountType
    );
    
    /**
     * 재무 보고서 자동 생성
     * 
     * @param reportType 보고서 유형 (monthly, quarterly, yearly)
     * @param periodStart 기간 시작일
     * @param periodEnd 기간 종료일
     * @param branchCode 지점 코드
     * @return 재무 보고서 데이터
     */
    Map<String, Object> generateFinancialReport(
        String reportType, 
        LocalDate periodStart, 
        LocalDate periodEnd, 
        String branchCode
    );
    
    /**
     * PL/SQL 프로시저 상태 확인
     * 
     * @return 프로시저 상태 정보
     */
    Map<String, Object> checkPlSqlStatus();
}
