package com.coresolution.consultation.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 부가세 계산 유틸리티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
public class TaxCalculationUtil {
    
    // 부가세율 10%
    private static final BigDecimal VAT_RATE = new BigDecimal("0.10");
    
    /**
     * 부가세 포함 금액에서 부가세 계산
     * 
     * @param amountIncludingTax 부가세 포함 금액
     * @return 부가세 금액
     */
    public static BigDecimal calculateVatFromAmountIncludingTax(BigDecimal amountIncludingTax) {
        if (amountIncludingTax == null || amountIncludingTax.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        
        // 부가세 = 부가세 포함 금액 * (부가세율 / (1 + 부가세율))
        // = 100,000 * (0.10 / 1.10) = 9,090원
        BigDecimal taxAmount = amountIncludingTax.multiply(VAT_RATE)
                .divide(BigDecimal.ONE.add(VAT_RATE), 0, RoundingMode.HALF_UP);
        
        return taxAmount;
    }
    
    /**
     * 부가세 포함 금액에서 부가세 제외 금액 계산
     * 
     * @param amountIncludingTax 부가세 포함 금액
     * @return 부가세 제외 금액
     */
    public static BigDecimal calculateAmountExcludingTax(BigDecimal amountIncludingTax) {
        if (amountIncludingTax == null || amountIncludingTax.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal taxAmount = calculateVatFromAmountIncludingTax(amountIncludingTax);
        return amountIncludingTax.subtract(taxAmount);
    }
    
    /**
     * 부가세 제외 금액에서 부가세 계산
     * 
     * @param amountExcludingTax 부가세 제외 금액
     * @return 부가세 금액
     */
    public static BigDecimal calculateVatFromAmountExcludingTax(BigDecimal amountExcludingTax) {
        if (amountExcludingTax == null || amountExcludingTax.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        
        return amountExcludingTax.multiply(VAT_RATE).setScale(0, RoundingMode.HALF_UP);
    }
    
    /**
     * 부가세 제외 금액에서 부가세 포함 금액 계산
     * 
     * @param amountExcludingTax 부가세 제외 금액
     * @return 부가세 포함 금액
     */
    public static BigDecimal calculateAmountIncludingTax(BigDecimal amountExcludingTax) {
        if (amountExcludingTax == null || amountExcludingTax.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal taxAmount = calculateVatFromAmountExcludingTax(amountExcludingTax);
        return amountExcludingTax.add(taxAmount);
    }
    
    /**
     * 결제 금액에서 부가세 분리 (내담자 결제용)
     * 
     * @param paymentAmount 결제 금액 (부가세 포함)
     * @return TaxCalculationResult
     */
    public static TaxCalculationResult calculateTaxFromPayment(BigDecimal paymentAmount) {
        if (paymentAmount == null || paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return new TaxCalculationResult(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        }
        
        BigDecimal vatAmount = calculateVatFromAmountIncludingTax(paymentAmount);
        BigDecimal amountExcludingTax = paymentAmount.subtract(vatAmount);
        
        return new TaxCalculationResult(paymentAmount, amountExcludingTax, vatAmount);
    }
    
    /**
     * 지출 금액에 부가세 추가 (사업자 지출용)
     * 
     * @param expenseAmount 지출 금액 (부가세 제외)
     * @return TaxCalculationResult
     */
    public static TaxCalculationResult calculateTaxForExpense(BigDecimal expenseAmount) {
        if (expenseAmount == null || expenseAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return new TaxCalculationResult(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        }
        
        BigDecimal vatAmount = calculateVatFromAmountExcludingTax(expenseAmount);
        BigDecimal amountIncludingTax = expenseAmount.add(vatAmount);
        
        return new TaxCalculationResult(amountIncludingTax, expenseAmount, vatAmount);
    }
    
    /**
     * 지출 항목별 부가세 적용 여부 확인
     * 
     * @param category 지출 카테고리
     * @return 부가세 적용 여부
     */
    public static boolean isVatApplicable(String category) {
        if (category == null) {
            return false;
        }
        
        // 급여는 부가세 없음
        if (category.contains("급여") || category.contains("월급") || category.contains("연봉")) {
            return false;
        }
        
        // 임대료, 관리비, 사무용품, 마케팅, 기타잡비 등은 부가세 적용
        return true;
    }
    
    /**
     * 부가세 계산 결과 클래스
     */
    public static class TaxCalculationResult {
        private final BigDecimal amountIncludingTax; // 부가세 포함 금액
        private final BigDecimal amountExcludingTax; // 부가세 제외 금액
        private final BigDecimal vatAmount; // 부가세 금액
        
        public TaxCalculationResult(BigDecimal amountIncludingTax, BigDecimal amountExcludingTax, BigDecimal vatAmount) {
            this.amountIncludingTax = amountIncludingTax;
            this.amountExcludingTax = amountExcludingTax;
            this.vatAmount = vatAmount;
        }
        
        public BigDecimal getAmountIncludingTax() {
            return amountIncludingTax;
        }
        
        public BigDecimal getAmountExcludingTax() {
            return amountExcludingTax;
        }
        
        public BigDecimal getVatAmount() {
            return vatAmount;
        }
        
        @Override
        public String toString() {
            return String.format("TaxCalculationResult{total=%s, amount=%s, vat=%s}", 
                amountIncludingTax, amountExcludingTax, vatAmount);
        }
    }
}
