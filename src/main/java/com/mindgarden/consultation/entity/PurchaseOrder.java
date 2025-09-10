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
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ERP 구매 주문 엔티티
 * 승인된 구매 요청을 바탕으로 실제 주문을 생성
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "erp_purchase_orders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PurchaseOrder {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_id", nullable = false)
    private PurchaseRequest purchaseRequest;
    
    @Column(nullable = false, length = 50)
    private String orderNumber;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PurchaseOrderStatus status;
    
    @Column
    private LocalDateTime expectedDeliveryDate;
    
    @Column(length = 100)
    private String supplier;
    
    @Column(length = 200)
    private String supplierContact;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchaser_id")
    private User purchaser;
    
    @Column(length = 500)
    private String notes;
    
    @Column
    private LocalDateTime orderedAt;
    
    @Column
    private LocalDateTime deliveredAt;
    
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
            status = PurchaseOrderStatus.PENDING;
        }
        if (orderNumber == null) {
            orderNumber = generateOrderNumber();
        }
    }
    
    private String generateOrderNumber() {
        return "PO-" + System.currentTimeMillis();
    }
    
    /**
     * 구매 주문 상태 열거형
     */
    public enum PurchaseOrderStatus {
        PENDING("대기중"),
        ORDERED("주문완료"),
        IN_TRANSIT("배송중"),
        DELIVERED("배송완료"),
        CANCELLED("취소"),
        RETURNED("반품");
        
        private final String displayName;
        
        PurchaseOrderStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
}
