package com.mindgarden.consultation.service;

import java.math.BigDecimal;
import java.util.Map;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.PackageDiscount;

/**
 * 할인 회계 처리 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
public interface DiscountAccountingService {
    
    /**
     * 할인 적용 회계 거래 생성
     * 
     * @param mapping 상담사-내담자 매핑
     * @param discount 할인 정보
     * @param originalAmount 원래 금액
     * @param finalAmount 최종 금액
     * @return 생성된 회계 거래 정보
     */
    DiscountAccountingResult createDiscountAccounting(
        ConsultantClientMapping mapping, 
        PackageDiscount discount, 
        BigDecimal originalAmount, 
        BigDecimal finalAmount
    );
    
    /**
     * 할인 회계 거래 취소
     * 
     * @param mappingId 매핑 ID
     * @param reason 취소 사유
     * @return 취소 결과
     */
    Map<String, Object> cancelDiscountAccounting(Long mappingId, String reason);
    
    /**
     * 할인 회계 거래 수정
     * 
     * @param mappingId 매핑 ID
     * @param newDiscount 새로운 할인 정보
     * @param newFinalAmount 새로운 최종 금액
     * @return 수정 결과
     */
    Map<String, Object> updateDiscountAccounting(
        Long mappingId, 
        PackageDiscount newDiscount, 
        BigDecimal newFinalAmount
    );
    
    /**
     * 할인 회계 거래 조회
     * 
     * @param mappingId 매핑 ID
     * @return 할인 회계 거래 정보
     */
    DiscountAccountingResult getDiscountAccounting(Long mappingId);
    
    /**
     * 할인 회계 거래 검증
     * 
     * @param mappingId 매핑 ID
     * @return 검증 결과
     */
    Map<String, Object> validateDiscountAccounting(Long mappingId);
    
    /**
     * 할인 환불 처리
     * 
     * @param mappingId 매핑 ID
     * @param refundAmount 환불 금액
     * @param refundReason 환불 사유
     * @param processedBy 처리자
     * @return 환불 처리 결과
     */
    Map<String, Object> processDiscountRefund(
        Long mappingId, 
        BigDecimal refundAmount, 
        String refundReason, 
        String processedBy
    );
    
    /**
     * 할인 부분 환불 처리
     * 
     * @param mappingId 매핑 ID
     * @param partialRefundAmount 부분 환불 금액
     * @param refundReason 환불 사유
     * @param processedBy 처리자
     * @return 부분 환불 처리 결과
     */
    Map<String, Object> processPartialRefund(
        Long mappingId, 
        BigDecimal partialRefundAmount, 
        String refundReason, 
        String processedBy
    );
    
    /**
     * 할인 전체 환불 처리
     * 
     * @param mappingId 매핑 ID
     * @param refundReason 환불 사유
     * @param processedBy 처리자
     * @return 전체 환불 처리 결과
     */
    Map<String, Object> processFullRefund(
        Long mappingId, 
        String refundReason, 
        String processedBy
    );
    
    /**
     * 환불 가능한 할인 거래 조회
     * 
     * @param branchCode 지점 코드
     * @return 환불 가능한 거래 목록
     */
    Map<String, Object> getRefundableDiscounts(String branchCode);
    
    /**
     * 할인 환불 통계 조회
     * 
     * @param branchCode 지점 코드
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 환불 통계
     */
    Map<String, Object> getDiscountRefundStatistics(String branchCode, String startDate, String endDate);
    
    /**
     * 할인 회계 거래 결과 DTO
     */
    class DiscountAccountingResult {
        private Long mappingId;                    // 매핑 ID
        private BigDecimal originalAmount;         // 원래 금액
        private BigDecimal discountAmount;         // 할인 금액
        private BigDecimal finalAmount;            // 최종 금액
        private BigDecimal refundedAmount;         // 환불 금액
        private BigDecimal remainingAmount;        // 잔여 금액
        private String discountCode;               // 할인 코드
        private String discountName;               // 할인명
        private Long revenueTransactionId;         // 매출 거래 ID
        private Long discountTransactionId;        // 할인 거래 ID
        private Long refundTransactionId;          // 환불 거래 ID
        private String accountingStatus;           // 회계 상태
        private String message;                    // 메시지
        private boolean success;                   // 성공 여부
        private boolean refundable;                // 환불 가능 여부
        private boolean modifiable;                // 수정 가능 여부
        private boolean cancellable;               // 취소 가능 여부
        
        // 생성자
        public DiscountAccountingResult() {}
        
        // Getters and Setters
        public Long getMappingId() { return mappingId; }
        public void setMappingId(Long mappingId) { this.mappingId = mappingId; }
        
        public BigDecimal getOriginalAmount() { return originalAmount; }
        public void setOriginalAmount(BigDecimal originalAmount) { this.originalAmount = originalAmount; }
        
        public BigDecimal getDiscountAmount() { return discountAmount; }
        public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
        
        public BigDecimal getFinalAmount() { return finalAmount; }
        public void setFinalAmount(BigDecimal finalAmount) { this.finalAmount = finalAmount; }
        
        public BigDecimal getRefundedAmount() { return refundedAmount; }
        public void setRefundedAmount(BigDecimal refundedAmount) { this.refundedAmount = refundedAmount; }
        
        public BigDecimal getRemainingAmount() { return remainingAmount; }
        public void setRemainingAmount(BigDecimal remainingAmount) { this.remainingAmount = remainingAmount; }
        
        public String getDiscountCode() { return discountCode; }
        public void setDiscountCode(String discountCode) { this.discountCode = discountCode; }
        
        public String getDiscountName() { return discountName; }
        public void setDiscountName(String discountName) { this.discountName = discountName; }
        
        public Long getRevenueTransactionId() { return revenueTransactionId; }
        public void setRevenueTransactionId(Long revenueTransactionId) { this.revenueTransactionId = revenueTransactionId; }
        
        public Long getDiscountTransactionId() { return discountTransactionId; }
        public void setDiscountTransactionId(Long discountTransactionId) { this.discountTransactionId = discountTransactionId; }
        
        public Long getRefundTransactionId() { return refundTransactionId; }
        public void setRefundTransactionId(Long refundTransactionId) { this.refundTransactionId = refundTransactionId; }
        
        public String getAccountingStatus() { return accountingStatus; }
        public void setAccountingStatus(String accountingStatus) { this.accountingStatus = accountingStatus; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public boolean isRefundable() { return refundable; }
        public void setRefundable(boolean refundable) { this.refundable = refundable; }
        
        public boolean isModifiable() { return modifiable; }
        public void setModifiable(boolean modifiable) { this.modifiable = modifiable; }
        
        public boolean isCancellable() { return cancellable; }
        public void setCancellable(boolean cancellable) { this.cancellable = cancellable; }
    }
}
