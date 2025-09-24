package com.mindgarden.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.mindgarden.consultation.enums.DiscountAccountingStatus;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 할인 회계 거래 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Entity
@Table(name = "discount_accounting_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscountAccountingTransaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "mapping_id", nullable = false)
    private Long mappingId;
    
    @Column(name = "discount_code")
    private String discountCode;
    
    @Column(name = "discount_name")
    private String discountName;
    
    @Column(name = "original_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal originalAmount;
    
    @Column(name = "discount_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountAmount;
    
    @Column(name = "final_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal finalAmount;
    
    @Column(name = "refunded_amount", precision = 10, scale = 2)
    private BigDecimal refundedAmount;
    
    @Column(name = "remaining_amount", precision = 10, scale = 2)
    private BigDecimal remainingAmount;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private DiscountAccountingStatus status;
    
    @Column(name = "revenue_transaction_id")
    private Long revenueTransactionId;
    
    @Column(name = "discount_transaction_id")
    private Long discountTransactionId;
    
    @Column(name = "refund_transaction_id")
    private Long refundTransactionId;
    
    @Column(name = "branch_code")
    private String branchCode;
    
    @Column(name = "applied_by")
    private String appliedBy;
    
    @Column(name = "applied_at")
    private LocalDateTime appliedAt;
    
    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;
    
    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;
    
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;
    
    @Column(name = "cancellation_reason")
    private String cancellationReason;
    
    @Column(name = "refund_reason")
    private String refundReason;
    
    @Column(name = "notes")
    private String notes;
    
    @Column(name = "created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    // 비즈니스 메서드
    public void applyDiscount(String appliedBy) {
        this.status = DiscountAccountingStatus.APPLIED;
        this.appliedBy = appliedBy;
        this.appliedAt = LocalDateTime.now();
        this.remainingAmount = this.finalAmount;
    }
    
    public void confirm() {
        this.status = DiscountAccountingStatus.CONFIRMED;
        this.confirmedAt = LocalDateTime.now();
    }
    
    public void processRefund(BigDecimal refundAmount, String refundReason, String processedBy) {
        if (this.refundedAmount == null) {
            this.refundedAmount = BigDecimal.ZERO;
        }
        
        this.refundedAmount = this.refundedAmount.add(refundAmount);
        this.remainingAmount = this.finalAmount.subtract(this.refundedAmount);
        this.refundReason = refundReason;
        this.refundedAt = LocalDateTime.now();
        
        if (this.remainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            this.status = DiscountAccountingStatus.FULL_REFUND;
        } else {
            this.status = DiscountAccountingStatus.PARTIAL_REFUND;
        }
    }
    
    public void cancel(String cancellationReason, String cancelledBy) {
        this.status = DiscountAccountingStatus.CANCELLED;
        this.cancellationReason = cancellationReason;
        this.cancelledAt = LocalDateTime.now();
    }
    
    public void modify(BigDecimal newFinalAmount, String modifiedBy) {
        this.finalAmount = newFinalAmount;
        this.remainingAmount = newFinalAmount.subtract(this.refundedAmount != null ? this.refundedAmount : BigDecimal.ZERO);
        this.status = DiscountAccountingStatus.MODIFIED;
        this.updatedAt = LocalDateTime.now();
    }
    
    public boolean isRefundable() {
        return this.status.isRefundable();
    }
    
    public boolean isModifiable() {
        return this.status.isModifiable();
    }
    
    public boolean isCancellable() {
        return this.status.isCancellable();
    }
    
    public BigDecimal getAvailableRefundAmount() {
        if (this.refundedAmount == null) {
            return this.finalAmount;
        }
        return this.finalAmount.subtract(this.refundedAmount);
    }
}
