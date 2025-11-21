package com.coresolution.consultation.service;

import java.util.Map;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.FinancialTransaction;

/**
 * 금액 관리 중앙화 서비스
 * 모든 금액 관련 로직을 통합하여 정확성과 일관성을 보장
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-19
 */
public interface AmountManagementService {
    
    /**
     * 매핑의 정확한 거래 금액을 결정
     * @param mapping 상담사-내담자 매핑
     * @return 정확한 거래 금액
     */
    Long getAccurateTransactionAmount(ConsultantClientMapping mapping);
    
    /**
     * 금액 검증 및 불일치 감지
     * @param mapping 매핑 정보
     * @param inputAmount 입력된 금액
     * @return 검증 결과
     */
    AmountValidationResult validateAmount(ConsultantClientMapping mapping, Long inputAmount);
    
    /**
     * 중복 거래 존재 여부 확인
     * @param mappingId 매핑 ID
     * @param transactionType 거래 유형
     * @return 중복 거래 존재 여부
     */
    boolean isDuplicateTransaction(Long mappingId, FinancialTransaction.TransactionType transactionType);
    
    /**
     * 매핑 금액 정보 통합 조회
     * @param mappingId 매핑 ID
     * @return 통합 금액 정보
     */
    Map<String, Object> getIntegratedAmountInfo(Long mappingId);
    
    /**
     * 금액 변경 이력 기록
     * @param mappingId 매핑 ID
     * @param oldAmount 기존 금액
     * @param newAmount 새 금액
     * @param changeReason 변경 사유
     * @param changedBy 변경자
     */
    void recordAmountChange(Long mappingId, Long oldAmount, Long newAmount, String changeReason, String changedBy);
    
    /**
     * 금액 일관성 검사
     * @param mappingId 매핑 ID
     * @return 일관성 검사 결과
     */
    AmountConsistencyResult checkAmountConsistency(Long mappingId);
    
    /**
     * 금액 검증 결과 클래스
     */
    class AmountValidationResult {
        private final boolean isValid;
        private final String message;
        private final Long recommendedAmount;
        private final Map<String, Long> detectedAmounts;
        
        public AmountValidationResult(boolean isValid, String message, Long recommendedAmount, Map<String, Long> detectedAmounts) {
            this.isValid = isValid;
            this.message = message;
            this.recommendedAmount = recommendedAmount;
            this.detectedAmounts = detectedAmounts;
        }
        
        // Getters
        public boolean isValid() { return isValid; }
        public String getMessage() { return message; }
        public Long getRecommendedAmount() { return recommendedAmount; }
        public Map<String, Long> getDetectedAmounts() { return detectedAmounts; }
    }
    
    /**
     * 금액 일관성 검사 결과 클래스
     */
    class AmountConsistencyResult {
        private final boolean isConsistent;
        private final String inconsistencyReason;
        private final Map<String, Long> amountBreakdown;
        private final String recommendation;
        
        public AmountConsistencyResult(boolean isConsistent, String inconsistencyReason, 
                                     Map<String, Long> amountBreakdown, String recommendation) {
            this.isConsistent = isConsistent;
            this.inconsistencyReason = inconsistencyReason;
            this.amountBreakdown = amountBreakdown;
            this.recommendation = recommendation;
        }
        
        // Getters
        public boolean isConsistent() { return isConsistent; }
        public String getInconsistencyReason() { return inconsistencyReason; }
        public Map<String, Long> getAmountBreakdown() { return amountBreakdown; }
        public String getRecommendation() { return recommendation; }
    }
}
