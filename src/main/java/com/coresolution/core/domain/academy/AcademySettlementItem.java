package com.coresolution.core.domain.academy;

import com.coresolution.consultation.entity.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

/**
 * 학원 정산 항목 엔티티
 * 학원 시스템의 정산 항목 상세 정보를 관리하는 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Entity
@Table(name = "academy_settlement_items", indexes = {
    @Index(name = "idx_settlement_item_id", columnList = "settlement_item_id"),
    @Index(name = "idx_settlement_id", columnList = "settlement_id"),
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_branch_id", columnList = "branch_id"),
    @Index(name = "idx_item_type", columnList = "item_type"),
    @Index(name = "idx_item_id", columnList = "item_id"),
    @Index(name = "idx_tenant_branch", columnList = "tenant_id,branch_id"),
    @Index(name = "idx_is_deleted", columnList = "is_deleted")
})
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AcademySettlementItem extends BaseEntity {
    
    /**
     * 항목 유형 열거형
     */
    public enum ItemType {
        TEACHER("강사"),
        CLASS("반"),
        COURSE("강좌"),
        ENROLLMENT("수강 등록");
        
        private final String description;
        
        ItemType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // === 기본 정보 ===
    
    /**
     * 정산 항목 UUID (고유 식별자)
     */
    @NotBlank(message = "정산 항목 ID는 필수입니다")
    @Size(max = 36, message = "정산 항목 ID는 36자 이하여야 합니다")
    @Column(name = "settlement_item_id", nullable = false, unique = true, length = 36, updatable = false)
    private String settlementItemId;
    
    /**
     * 정산 ID
     */
    @NotBlank(message = "정산 ID는 필수입니다")
    @Size(max = 36, message = "정산 ID는 36자 이하여야 합니다")
    @Column(name = "settlement_id", nullable = false, length = 36)
    private String settlementId;
    
    /**
     * 지점 ID
     */
    @Column(name = "branch_id")
    private Long branchId;
    
    // === 정산 대상 ===
    
    /**
     * 항목 유형
     */
    @NotNull(message = "항목 유형은 필수입니다")
    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 50)
    private ItemType itemType;
    
    /**
     * 항목 ID
     */
    @Size(max = 36, message = "항목 ID는 36자 이하여야 합니다")
    @Column(name = "item_id", length = 36)
    private String itemId;
    
    /**
     * 항목명
     */
    @Size(max = 255, message = "항목명은 255자 이하여야 합니다")
    @Column(name = "item_name", length = 255)
    private String itemName;
    
    // === 정산 금액 ===
    
    /**
     * 매출 금액
     */
    @NotNull(message = "매출 금액은 필수입니다")
    @Column(name = "revenue_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal revenueAmount;
    
    /**
     * 정산 금액
     */
    @NotNull(message = "정산 금액은 필수입니다")
    @Column(name = "settlement_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal settlementAmount;
    
    /**
     * 수수료율 (%)
     */
    @Column(name = "commission_rate", precision = 5, scale = 2)
    private BigDecimal commissionRate;
    
    /**
     * 수수료 금액
     */
    @Column(name = "commission_amount", precision = 15, scale = 2)
    private BigDecimal commissionAmount;
    
    // === 통계 정보 ===
    
    /**
     * 수강 등록 수
     */
    @Column(name = "enrollment_count")
    private Integer enrollmentCount;
    
    /**
     * 결제 건수
     */
    @Column(name = "payment_count")
    private Integer paymentCount;
    
    /**
     * 총 수업 횟수
     */
    @Column(name = "total_sessions")
    private Integer totalSessions;
    
    /**
     * 완료된 수업 횟수
     */
    @Column(name = "completed_sessions")
    private Integer completedSessions;
    
    // === 상세 정보 ===
    
    /**
     * 상세 정보 (JSON)
     */
    @Column(name = "details_json", columnDefinition = "JSON")
    private String detailsJson;
    
    /**
     * 생성자
     */
    @Column(name = "created_by", length = 100)
    private String createdBy;
    
    /**
     * 수정자
     */
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
}

