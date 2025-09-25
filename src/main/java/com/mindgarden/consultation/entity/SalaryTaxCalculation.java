package com.mindgarden.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 급여 세금 계산 엔티티
 * 급여 계산에 따른 세금 계산 내역을 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Entity
@Table(name = "salary_tax_calculations", indexes = {
    @Index(name = "idx_salary_tax_calculation_id", columnList = "calculation_id"),
    @Index(name = "idx_salary_tax_type", columnList = "tax_type"),
    @Index(name = "idx_salary_tax_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalaryTaxCalculation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull(message = "급여 계산 ID는 필수입니다.")
    @Column(name = "calculation_id", nullable = false)
    private Long calculationId;
    
    @Size(max = 50, message = "세금 유형은 50자 이하여야 합니다.")
    @Column(name = "tax_type", length = 50, nullable = false)
    private String taxType; // WITHHOLDING_TAX, VAT, INCOME_TAX, ADDITIONAL_TAX
    
    @Size(max = 100, message = "세금명은 100자 이하여야 합니다.")
    @Column(name = "tax_name", length = 100, nullable = false)
    private String taxName; // 원천징수, 부가세, 소득세, 추가세금
    
    @DecimalMin(value = "0.0", message = "세율은 0 이상이어야 합니다.")
    @Column(name = "tax_rate", precision = 5, scale = 4, nullable = false)
    private BigDecimal taxRate; // 0.033, 0.10, 0.15 등
    
    @DecimalMin(value = "0.0", message = "기준금액은 0 이상이어야 합니다.")
    @Column(name = "base_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal baseAmount; // 세금 계산 기준 금액
    
    @DecimalMin(value = "0.0", message = "과세표준은 0 이상이어야 합니다.")
    @Column(name = "taxable_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal taxableAmount; // 과세표준 금액
    
    @DecimalMin(value = "0.0", message = "세금액은 0 이상이어야 합니다.")
    @Column(name = "tax_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal taxAmount; // 계산된 세금액
    
    @Size(max = 500, message = "세금 설명은 500자 이하여야 합니다.")
    @Column(name = "description", length = 500)
    private String description;
    
    @Size(max = 1000, message = "계산 상세는 1000자 이하여야 합니다.")
    @Column(name = "calculation_details", columnDefinition = "TEXT")
    private String calculationDetails; // 세금 계산 상세 내역
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    /**
     * 생성 전 실행
     */
    @jakarta.persistence.PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }
    
    /**
     * 수정 전 실행
     */
    @jakarta.persistence.PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * 세금 계산
     */
    public void calculateTax() {
        if (baseAmount != null && taxRate != null) {
            this.taxAmount = baseAmount.multiply(taxRate).setScale(0, java.math.RoundingMode.HALF_UP);
            this.taxableAmount = baseAmount; // 기준금액을 과세표준으로 설정
        }
    }
    
    /**
     * 세금 계산 (사용자 정의 세율)
     */
    public void calculateTax(BigDecimal customRate) {
        if (baseAmount != null && customRate != null) {
            this.taxAmount = baseAmount.multiply(customRate).setScale(0, java.math.RoundingMode.HALF_UP);
            this.taxableAmount = baseAmount; // 기준금액을 과세표준으로 설정
        }
    }
}
