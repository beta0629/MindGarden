package com.coresolution.consultation.entity;

import java.math.BigDecimal;
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
 * 정산 결과 엔티티
 * 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-18
 */
@Entity
@Table(name = "erp_settlements",
    indexes = {
        @Index(name = "idx_erp_settlements_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_erp_settlements_settlement_number", columnList = "settlement_number"),
        @Index(name = "idx_erp_settlements_settlement_period", columnList = "settlement_period"),
        @Index(name = "idx_erp_settlements_status", columnList = "status"),
        @Index(name = "idx_erp_settlements_is_deleted", columnList = "is_deleted")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_erp_settlements_number", columnNames = {"settlement_number"})
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Settlement {
    
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
     * 정산 번호 (테넌트별 독립 채번)
     * 형식: ST-{tenantId}-{YYYYMM}-{sequence}
     */
    @NotNull(message = "정산 번호는 필수입니다.")
    @Size(max = 50, message = "정산 번호는 50자 이하여야 합니다.")
    @Column(name = "settlement_number", nullable = false, unique = true, length = 50)
    private String settlementNumber;
    
    /**
     * 정산 기간 (YYYYMM)
     */
    @NotNull(message = "정산 기간은 필수입니다.")
    @Size(max = 10, message = "정산 기간은 10자 이하여야 합니다.")
    @Column(name = "settlement_period", nullable = false, length = 10)
    private String settlementPeriod;
    
    /**
     * 총 매출
     */
    @NotNull(message = "총 매출은 필수입니다.")
    @Column(name = "total_revenue", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalRevenue;
    
    /**
     * 수수료
     */
    @Column(name = "commission_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal commissionAmount = BigDecimal.ZERO;
    
    /**
     * 로열티
     */
    @Column(name = "royalty_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal royaltyAmount = BigDecimal.ZERO;
    
    /**
     * 순 정산 금액 (총 매출 - 수수료 - 로열티)
     */
    @NotNull(message = "순 정산 금액은 필수입니다.")
    @Column(name = "net_settlement_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal netSettlementAmount;
    
    /**
     * 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SettlementStatus status = SettlementStatus.PENDING;
    
    /**
     * 승인자 ID
     */
    @Column(name = "approved_by")
    private Long approvedBy;
    
    /**
     * 승인 시간
     */
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    /**
     * 지급 시간
     */
    @Column(name = "paid_at")
    private LocalDateTime paidAt;
    
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
     * 정산 상태 열거형
     */
    public enum SettlementStatus {
        PENDING("대기중"),
        APPROVED("승인됨"),
        PAID("지급완료");
        
        private final String displayName;
        
        SettlementStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    /**
     * 순 정산 금액 계산
     */
    public void calculateNetAmount() {
        this.netSettlementAmount = totalRevenue
            .subtract(commissionAmount != null ? commissionAmount : BigDecimal.ZERO)
            .subtract(royaltyAmount != null ? royaltyAmount : BigDecimal.ZERO);
    }
}

