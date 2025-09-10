package com.mindgarden.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ERP 구매 요청 엔티티
 * 상담사가 비품 구매를 요청할 때 사용
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "erp_purchase_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PurchaseRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;
    
    @Column(length = 500)
    private String reason;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PurchaseRequestStatus status;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_approver_id")
    private User adminApprover;
    
    @Column
    private LocalDateTime adminApprovedAt;
    
    @Column(length = 500)
    private String adminComment;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "super_admin_approver_id")
    private User superAdminApprover;
    
    @Column
    private LocalDateTime superAdminApprovedAt;
    
    @Column(length = 500)
    private String superAdminComment;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @PrePersist
    protected void onCreate() {
        if (status == null) {
            status = PurchaseRequestStatus.PENDING;
        }
        if (totalAmount == null && unitPrice != null && quantity != null) {
            totalAmount = unitPrice.multiply(BigDecimal.valueOf(quantity));
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        if (totalAmount == null && unitPrice != null && quantity != null) {
            totalAmount = unitPrice.multiply(BigDecimal.valueOf(quantity));
        }
    }
    
    /**
     * 구매 요청 상태 열거형
     */
    public enum PurchaseRequestStatus {
        PENDING("대기중"),
        ADMIN_APPROVED("관리자 승인"),
        ADMIN_REJECTED("관리자 거부"),
        SUPER_ADMIN_APPROVED("수퍼 관리자 승인"),
        SUPER_ADMIN_REJECTED("수퍼 관리자 거부"),
        COMPLETED("완료"),
        CANCELLED("취소");
        
        private final String displayName;
        
        PurchaseRequestStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
}
