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
 * 감가상각 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Entity
@Table(name = "accumulated_depreciations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccumulatedDepreciation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "asset_name", nullable = false, length = 200)
    private String assetName;
    
    @Column(name = "asset_type", nullable = false, length = 50)
    private String assetType; // EQUIPMENT, FURNITURE, SOFTWARE, BUILDING, GOODWILL
    
    @Column(name = "acquisition_cost", precision = 15, scale = 2, nullable = false)
    private BigDecimal acquisitionCost;
    
    @Column(name = "acquisition_date", nullable = false)
    private LocalDate acquisitionDate;
    
    @Column(name = "useful_life_years", nullable = false)
    private Integer usefulLifeYears;
    
    @Column(name = "depreciation_method", length = 50, nullable = false)
    private String depreciationMethod; // STRAIGHT_LINE, DECLINING_BALANCE, SUM_OF_YEARS
    
    @Column(name = "depreciation_rate", precision = 5, scale = 4)
    private BigDecimal depreciationRate;
    
    @Column(name = "annual_depreciation", precision = 15, scale = 2)
    private BigDecimal annualDepreciation;
    
    @Column(name = "accumulated_depreciation", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal accumulatedDepreciation = BigDecimal.ZERO;
    
    @Column(name = "book_value", precision = 15, scale = 2)
    private BigDecimal bookValue;
    
    @Column(name = "salvage_value", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal salvageValue = BigDecimal.ZERO;
    
    @Column(name = "depreciation_start_date")
    private LocalDate depreciationStartDate;
    
    @Column(name = "depreciation_end_date")
    private LocalDate depreciationEndDate;
    
    @Column(name = "is_depreciating", nullable = false)
    @Builder.Default
    private Boolean isDepreciating = true;
    
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
        calculateBookValue();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        calculateBookValue();
    }
    
    /**
     * 장부가 계산
     */
    private void calculateBookValue() {
        if (acquisitionCost != null && accumulatedDepreciation != null) {
            this.bookValue = acquisitionCost.subtract(accumulatedDepreciation);
        }
    }
    
    /**
     * 자산 유형 열거형
     */
    public enum AssetType {
        EQUIPMENT("장비"),
        FURNITURE("가구"),
        SOFTWARE("소프트웨어"),
        BUILDING("건물"),
        GOODWILL("영업권"),
        VEHICLE("차량"),
        INTANGIBLE("무형자산");
        
        private final String description;
        
        AssetType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 감가상각 방법 열거형
     */
    public enum DepreciationMethod {
        STRAIGHT_LINE("정액법"),
        DECLINING_BALANCE("정률법"),
        SUM_OF_YEARS("연수합계법"),
        UNITS_OF_PRODUCTION("생산량비례법");
        
        private final String description;
        
        DepreciationMethod(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}
