package com.coresolution.consultation.entity;

import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 정산 규칙 엔티티
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-18
 */
@Entity
@Table(name = "erp_settlement_rules",
    indexes = {
        @Index(name = "idx_erp_settlement_rules_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_erp_settlement_rules_business_type", columnList = "business_type"),
        @Index(name = "idx_erp_settlement_rules_settlement_type", columnList = "settlement_type"),
        @Index(name = "idx_erp_settlement_rules_is_active", columnList = "is_active"),
        @Index(name = "idx_erp_settlement_rules_is_deleted", columnList = "is_deleted")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementRule {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 테넌트 ID (ERP 독립성 보장)
     */
    @NotNull(message = "테넌트 ID는 필수입니다.")
    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;
    
    /**
     * 규칙명
     */
    @NotNull(message = "규칙명은 필수입니다.")
    @Size(max = 100, message = "규칙명은 100자 이하여야 합니다.")
    @Column(name = "rule_name", nullable = false, length = 100)
    private String ruleName;
    
    /**
     * 업종
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "business_type", length = 20)
    private BusinessType businessType;
    
    /**
     * 정산 유형
     */
    @NotNull(message = "정산 유형은 필수입니다.")
    @Enumerated(EnumType.STRING)
    @Column(name = "settlement_type", nullable = false, length = 20)
    private SettlementType settlementType;
    
    /**
     * 계산 방법
     */
    @NotNull(message = "계산 방법은 필수입니다.")
    @Enumerated(EnumType.STRING)
    @Column(name = "calculation_method", nullable = false, length = 20)
    private CalculationMethod calculationMethod;
    
    /**
     * 계산 파라미터 (JSON)
     * PERCENTAGE: {"percentage": 10.0}
     * FIXED: {"amount": 10000}
     * TIERED: {"tiers": [{"min": 0, "max": 1000000, "percentage": 5}, ...]}
     */
    @Column(name = "calculation_params", columnDefinition = "JSON")
    private String calculationParams;
    
    /**
     * 활성 여부
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    /**
     * 생성자 ID
     */
    @Column(name = "created_by")
    private Long createdBy;
    
    /**
     * 생성 시간
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * 수정자 ID
     */
    @Column(name = "updated_by")
    private Long updatedBy;
    
    /**
     * 수정 시간
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    /**
     * 삭제 여부
     */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;
    
    /**
     * 삭제 시간
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    /**
     * 삭제자 ID
     */
    @Column(name = "deleted_by")
    private Long deletedBy;
    
    /**
     * 업종 열거형
     */
    public enum BusinessType {
        ACADEMY("학원"),
        CONSULTATION("상담소"),
        CAFE("카페"),
        FOOD_SERVICE("요식업");
        
        private final String displayName;
        
        BusinessType(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    /**
     * 정산 유형 열거형
     */
    public enum SettlementType {
        REVENUE("수익 정산"),
        COMMISSION("수수료 정산"),
        ROYALTY("로열티 정산");
        
        private final String displayName;
        
        SettlementType(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    /**
     * 계산 방법 열거형
     */
    public enum CalculationMethod {
        PERCENTAGE("비율 계산"),
        FIXED("고정 금액"),
        TIERED("단계별 계산");
        
        private final String displayName;
        
        CalculationMethod(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
}

