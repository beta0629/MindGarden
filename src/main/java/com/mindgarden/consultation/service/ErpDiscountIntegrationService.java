package com.mindgarden.consultation.service;

import java.math.BigDecimal;
import java.util.Map;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.PackageDiscount;

/**
 * ERP 할인 통합 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
public interface ErpDiscountIntegrationService {
    
    /**
     * 할인 결제 처리 (회계 + ERP 통합)
     * 
     * @param mapping 상담사-내담자 매핑
     * @param discount 할인 정보
     * @param originalAmount 원래 금액
     * @param finalAmount 최종 금액
     * @return 처리 결과
     */
    Map<String, Object> processDiscountPayment(
        ConsultantClientMapping mapping, 
        PackageDiscount discount, 
        BigDecimal originalAmount, 
        BigDecimal finalAmount
    );
    
    /**
     * 할인 회계 요약 조회
     * 
     * @param branchCode 지점 코드
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 할인 회계 요약
     */
    Map<String, Object> getDiscountAccountingSummary(String branchCode, String startDate, String endDate);
    
    /**
     * 할인 회계 무결성 검증
     * 
     * @param branchCode 지점 코드
     * @return 무결성 검증 결과
     */
    Map<String, Object> validateDiscountAccountingIntegrity(String branchCode);
}
