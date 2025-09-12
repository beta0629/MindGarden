package com.mindgarden.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 충당금 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Entity
@Table(name = "provisions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Provision {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "provision_name", nullable = false, length = 100)
    private String provisionName;
    
    @Column(name = "provision_type", nullable = false, length = 50)
    private String provisionType; // BAD_DEBT, WARRANTY, RETIREMENT, LEGAL, ENVIRONMENTAL
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "estimated_amount", precision = 15, scale = 2)
    private BigDecimal estimatedAmount;
    
    @Column(name = "current_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal currentAmount = BigDecimal.ZERO;
    
    @Column(name = "used_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal usedAmount = BigDecimal.ZERO;
    
    @Column(name = "provision_rate", precision = 5, scale = 4)
    private BigDecimal provisionRate; // 충당금 비율
    
    @Column(name = "calculation_base", length = 50)
    private String calculationBase; // SALES, ACCOUNTS_RECEIVABLE, ASSETS
    
    @Column(name = "start_date")
    private LocalDate startDate;
    
    @Column(name = "end_date")
    private LocalDate endDate;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "created_by", length = 100)
    private String createdBy;
    
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    /**
     * 충당금 유형 열거형
     */
    public enum ProvisionType {
        BAD_DEBT("대손충당금"),
        WARRANTY("품질보증충당금"),
        RETIREMENT("퇴직급여충당금"),
        LEGAL("법적소송충당금"),
        ENVIRONMENTAL("환경보전충당금"),
        INSURANCE("보험충당금"),
        REPAIR("수리충당금");
        
        private final String description;
        
        ProvisionType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 계산 기준 열거형
     */
    public enum CalculationBase {
        SALES("매출액"),
        ACCOUNTS_RECEIVABLE("매출채권"),
        ASSETS("자산총액"),
        FIXED_AMOUNT("고정금액"),
        MANUAL("수동계산");
        
        private final String description;
        
        CalculationBase(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}
