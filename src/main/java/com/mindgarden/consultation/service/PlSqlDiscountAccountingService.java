package com.mindgarden.consultation.service;

import java.math.BigDecimal;
import java.util.Map;

/**
 * PL/SQL 할인 회계 처리 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
public interface PlSqlDiscountAccountingService {
    
    /**
     * PL/SQL 할인 적용
     * 
     * @param mappingId 매핑 ID
     * @param discountCode 할인 코드
     * @param originalAmount 원래 금액
     * @param discountAmount 할인 금액
     * @param finalAmount 최종 금액
     * @param branchCode 지점 코드
     * @param appliedBy 적용자
     * @return 처리 결과
     */
    Map<String, Object> applyDiscountAccounting(
        Long mappingId, 
        String discountCode, 
        BigDecimal originalAmount, 
        BigDecimal discountAmount, 
        BigDecimal finalAmount, 
        String branchCode, 
        String appliedBy
    );
    
    /**
     * PL/SQL 할인 환불 처리
     * 
     * @param mappingId 매핑 ID
     * @param refundAmount 환불 금액
     * @param refundReason 환불 사유
     * @param processedBy 처리자
     * @return 처리 결과
     */
    Map<String, Object> processDiscountRefund(
        Long mappingId, 
        BigDecimal refundAmount, 
        String refundReason, 
        String processedBy
    );
    
    /**
     * PL/SQL 할인 상태 업데이트
     * 
     * @param mappingId 매핑 ID
     * @param newStatus 새로운 상태
     * @param updatedBy 업데이트자
     * @param reason 사유
     * @return 처리 결과
     */
    Map<String, Object> updateDiscountStatus(
        Long mappingId, 
        String newStatus, 
        String updatedBy, 
        String reason
    );
    
    /**
     * PL/SQL 할인 통계 조회
     * 
     * @param branchCode 지점 코드
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 통계 결과
     */
    Map<String, Object> getDiscountStatistics(
        String branchCode, 
        String startDate, 
        String endDate
    );
    
    /**
     * PL/SQL 할인 무결성 검증
     * 
     * @param branchCode 지점 코드
     * @return 검증 결과
     */
    Map<String, Object> validateDiscountIntegrity(String branchCode);
    
    /**
     * PL/SQL 프로시저 사용 가능 여부 확인
     * 
     * @return 사용 가능 여부
     */
    boolean isProcedureAvailable();
}
