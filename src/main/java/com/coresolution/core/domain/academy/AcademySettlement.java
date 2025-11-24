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
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 학원 정산 엔티티
 * 학원 시스템의 수강료/강사/본사 정산 결과를 관리하는 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Entity
@Table(name = "academy_settlements", indexes = {
    @Index(name = "idx_settlement_id", columnList = "settlement_id"),
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_branch_id", columnList = "branch_id"),
    @Index(name = "idx_tenant_branch", columnList = "tenant_id,branch_id"),
    @Index(name = "idx_settlement_period", columnList = "settlement_period"),
    @Index(name = "idx_settlement_date", columnList = "settlement_date"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_is_deleted", columnList = "is_deleted")
})
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AcademySettlement extends BaseEntity {
    
    /**
     * 정산 상태 열거형
     */
    public enum SettlementStatus {
        DRAFT("초안"),
        CALCULATED("계산완료"),
        APPROVED("승인"),
        PAID("지급완료"),
        CANCELLED("취소");
        
        private final String description;
        
        SettlementStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    // === 기본 정보 ===
    
    /**
     * 정산 UUID (고유 식별자)
     */
    @NotBlank(message = "정산 ID는 필수입니다")
    @Size(max = 36, message = "정산 ID는 36자 이하여야 합니다")
    @Column(name = "settlement_id", nullable = false, unique = true, length = 36, updatable = false)
    private String settlementId;
    
    /**
     * 지점 ID
     */
    @Column(name = "branch_id")
    private Long branchId;
    
    // === 정산 기간 ===
    
    /**
     * 정산 기간 (YYYYMM)
     */
    @NotBlank(message = "정산 기간은 필수입니다")
    @Size(max = 10, message = "정산 기간은 10자 이하여야 합니다")
    @Column(name = "settlement_period", nullable = false, length = 10)
    private String settlementPeriod;
    
    /**
     * 정산일
     */
    @NotNull(message = "정산일은 필수입니다")
    @Column(name = "settlement_date", nullable = false)
    private LocalDate settlementDate;
    
    /**
     * 기간 시작일
     */
    @NotNull(message = "기간 시작일은 필수입니다")
    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;
    
    /**
     * 기간 종료일
     */
    @NotNull(message = "기간 종료일은 필수입니다")
    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;
    
    // === 매출 정보 ===
    
    /**
     * 총 매출 (수강료 수입)
     */
    @NotNull(message = "총 매출은 필수입니다")
    @Column(name = "total_revenue", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalRevenue;
    
    /**
     * 총 결제 금액
     */
    @NotNull(message = "총 결제 금액은 필수입니다")
    @Column(name = "total_payments", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalPayments;
    
    /**
     * 환불 금액
     */
    @Column(name = "refund_amount", precision = 15, scale = 2)
    private BigDecimal refundAmount;
    
    /**
     * 순 매출
     */
    @NotNull(message = "순 매출은 필수입니다")
    @Column(name = "net_revenue", nullable = false, precision = 15, scale = 2)
    private BigDecimal netRevenue;
    
    // === 정산 정보 ===
    
    /**
     * 강사 정산 금액
     */
    @NotNull(message = "강사 정산 금액은 필수입니다")
    @Column(name = "teacher_settlement", nullable = false, precision = 15, scale = 2)
    private BigDecimal teacherSettlement;
    
    /**
     * 본사 로열티
     */
    @NotNull(message = "본사 로열티는 필수입니다")
    @Column(name = "hq_royalty", nullable = false, precision = 15, scale = 2)
    private BigDecimal hqRoyalty;
    
    /**
     * 수수료율 (%)
     */
    @Column(name = "commission_rate", precision = 5, scale = 2)
    private BigDecimal commissionRate;
    
    /**
     * 로열티율 (%)
     */
    @Column(name = "royalty_rate", precision = 5, scale = 2)
    private BigDecimal royaltyRate;
    
    /**
     * 순 정산 금액
     */
    @NotNull(message = "순 정산 금액은 필수입니다")
    @Column(name = "net_settlement", nullable = false, precision = 15, scale = 2)
    private BigDecimal netSettlement;
    
    // === 상태 정보 ===
    
    /**
     * 상태
     */
    @NotNull(message = "상태는 필수입니다")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SettlementStatus status;
    
    /**
     * 계산 일시
     */
    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt;
    
    /**
     * 승인 일시
     */
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    /**
     * 지급 일시
     */
    @Column(name = "paid_at")
    private LocalDateTime paidAt;
    
    /**
     * 승인자
     */
    @Size(max = 100, message = "승인자는 100자 이하여야 합니다")
    @Column(name = "approved_by", length = 100)
    private String approvedBy;
    
    /**
     * 지급 처리자
     */
    @Size(max = 100, message = "지급 처리자는 100자 이하여야 합니다")
    @Column(name = "paid_by", length = 100)
    private String paidBy;
    
    // === 메모 ===
    
    /**
     * 비고
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    /**
     * 계산 상세 정보 (JSON)
     */
    @Column(name = "calculation_details_json", columnDefinition = "JSON")
    private String calculationDetailsJson;
    
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
    
    // === 비즈니스 메서드 ===
    
    /**
     * 승인 여부 확인
     */
    public boolean isApproved() {
        return SettlementStatus.APPROVED.equals(status) || SettlementStatus.PAID.equals(status);
    }
    
    /**
     * 지급 완료 여부 확인
     */
    public boolean isPaid() {
        return SettlementStatus.PAID.equals(status);
    }
}

