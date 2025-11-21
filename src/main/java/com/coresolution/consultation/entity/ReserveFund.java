package com.coresolution.consultation.entity;

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
 * 적립금 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Entity
@Table(name = "reserve_funds")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReserveFund {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "fund_name", nullable = false, length = 100)
    private String fundName;
    
    @Column(name = "fund_type", nullable = false, length = 50)
    private String fundType; // RESERVE_FUND, CONTINGENCY_RESERVE, EXPANSION_RESERVE, EMERGENCY_RESERVE
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "target_amount", precision = 15, scale = 2)
    private BigDecimal targetAmount;
    
    @Column(name = "current_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal currentAmount = BigDecimal.ZERO;
    
    @Column(name = "reserve_rate", precision = 5, scale = 4)
    private BigDecimal reserveRate; // 적립 비율 (예: 0.1 = 10%)
    
    @Column(name = "auto_deduct", nullable = false)
    @Builder.Default
    private Boolean autoDeduct = false;
    
    @Column(name = "deduct_from", length = 50)
    private String deductFrom; // INCOME, NET_PROFIT, GROSS_PROFIT
    
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
     * 적립금 유형 열거형
     */
    public enum ReserveFundType {
        RESERVE_FUND("일반적립금"),
        CONTINGENCY_RESERVE("충당금"),
        EXPANSION_RESERVE("확장적립금"),
        EMERGENCY_RESERVE("비상적립금"),
        TAX_RESERVE("세금적립금"),
        BONUS_RESERVE("상여금적립금"),
        EQUIPMENT_RESERVE("장비적립금");
        
        private final String description;
        
        ReserveFundType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 적립 출처 열거형
     */
    public enum DeductFrom {
        INCOME("수입"),
        NET_PROFIT("순이익"),
        GROSS_PROFIT("총이익"),
        MANUAL("수동");
        
        private final String description;
        
        DeductFrom(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}
