package com.mindgarden.consultation.service;

import java.math.BigDecimal;
import java.util.List;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.PackageDiscount;

/**
 * 패키지 상품 할인 계산 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
public interface PackageDiscountService {
    
    /**
     * 매핑에 적용 가능한 할인 계산
     * 
     * @param mapping 상담사-내담자 매핑
     * @return 할인 정보 (할인 금액, 할인율, 최종 금액 등)
     */
    DiscountCalculationResult calculateDiscount(ConsultantClientMapping mapping);
    
    /**
     * 특정 할인 코드로 할인 계산
     * 
     * @param mapping 상담사-내담자 매핑
     * @param discountCode 할인 코드
     * @return 할인 정보
     */
    DiscountCalculationResult calculateDiscountWithCode(ConsultantClientMapping mapping, String discountCode);
    
    /**
     * 적용 가능한 모든 할인 옵션 조회
     * 
     * @param mapping 상담사-내담자 매핑
     * @return 적용 가능한 할인 목록
     */
    List<DiscountOption> getAvailableDiscounts(ConsultantClientMapping mapping);
    
    /**
     * 할인 적용 후 최종 금액 계산
     * 
     * @param originalAmount 원래 금액
     * @param discount 할인 정보
     * @return 최종 금액
     */
    BigDecimal calculateFinalAmount(BigDecimal originalAmount, PackageDiscount discount);
    
    /**
     * 할인 유효성 검증
     * 
     * @param mapping 상담사-내담자 매핑
     * @param discountCode 할인 코드
     * @return 검증 결과
     */
    DiscountValidationResult validateDiscount(ConsultantClientMapping mapping, String discountCode);
    
    /**
     * 할인 계산 결과 DTO
     */
    class DiscountCalculationResult {
        private BigDecimal originalAmount;      // 원래 금액
        private BigDecimal discountAmount;      // 할인 금액
        private BigDecimal finalAmount;         // 최종 금액
        private BigDecimal discountRate;        // 할인율
        private String discountType;            // 할인 타입 (PERCENTAGE, FIXED_AMOUNT)
        private String discountCode;            // 할인 코드
        private String discountName;            // 할인명
        private boolean isValid;                // 유효성
        private String message;                 // 메시지
        
        // 생성자
        public DiscountCalculationResult() {}
        
        // Getters and Setters
        public BigDecimal getOriginalAmount() { return originalAmount; }
        public void setOriginalAmount(BigDecimal originalAmount) { this.originalAmount = originalAmount; }
        
        public BigDecimal getDiscountAmount() { return discountAmount; }
        public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
        
        public BigDecimal getFinalAmount() { return finalAmount; }
        public void setFinalAmount(BigDecimal finalAmount) { this.finalAmount = finalAmount; }
        
        public BigDecimal getDiscountRate() { return discountRate; }
        public void setDiscountRate(BigDecimal discountRate) { this.discountRate = discountRate; }
        
        public String getDiscountType() { return discountType; }
        public void setDiscountType(String discountType) { this.discountType = discountType; }
        
        public String getDiscountCode() { return discountCode; }
        public void setDiscountCode(String discountCode) { this.discountCode = discountCode; }
        
        public String getDiscountName() { return discountName; }
        public void setDiscountName(String discountName) { this.discountName = discountName; }
        
        public boolean isValid() { return isValid; }
        public void setValid(boolean valid) { isValid = valid; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
    
    /**
     * 할인 옵션 DTO
     */
    class DiscountOption {
        private String code;                    // 할인 코드
        private String name;                    // 할인명
        private String description;             // 설명
        private BigDecimal discountAmount;      // 할인 금액
        private BigDecimal discountRate;        // 할인율
        private String type;                    // 할인 타입
        private boolean isApplicable;           // 적용 가능 여부
        private String reason;                  // 적용 불가 사유
        
        // 생성자
        public DiscountOption() {}
        
        // Getters and Setters
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public BigDecimal getDiscountAmount() { return discountAmount; }
        public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
        
        public BigDecimal getDiscountRate() { return discountRate; }
        public void setDiscountRate(BigDecimal discountRate) { this.discountRate = discountRate; }
        
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        
        public boolean isApplicable() { return isApplicable; }
        public void setApplicable(boolean applicable) { isApplicable = applicable; }
        
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
    
    /**
     * 할인 검증 결과 DTO
     */
    class DiscountValidationResult {
        private boolean isValid;                // 유효성
        private String message;                 // 메시지
        private PackageDiscount discount;       // 할인 정보
        private BigDecimal finalAmount;         // 최종 금액
        
        // 생성자
        public DiscountValidationResult() {}
        
        public DiscountValidationResult(boolean isValid, String message, PackageDiscount discount, BigDecimal finalAmount) {
            this.isValid = isValid;
            this.message = message;
            this.discount = discount;
            this.finalAmount = finalAmount;
        }
        
        // Getters and Setters
        public boolean isValid() { return isValid; }
        public void setValid(boolean valid) { isValid = valid; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public PackageDiscount getDiscount() { return discount; }
        public void setDiscount(PackageDiscount discount) { this.discount = discount; }
        
        public BigDecimal getFinalAmount() { return finalAmount; }
        public void setFinalAmount(BigDecimal finalAmount) { this.finalAmount = finalAmount; }
    }
}
