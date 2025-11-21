package com.coresolution.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
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
 * 패키지 상품 할인 엔티티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Entity
@Table(name = "package_discounts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PackageDiscount {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "code", nullable = false, unique = true)
    private String code;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "description")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false)
    private DiscountType discountType;
    
    @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;
    
    @Column(name = "minimum_amount", precision = 10, scale = 2)
    private BigDecimal minimumAmount;
    
    @Column(name = "usage_limit")
    private Integer usageLimit;
    
    @Column(name = "start_date")
    private LocalDate startDate;
    
    @Column(name = "end_date")
    private LocalDate endDate;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "is_auto_applicable")
    private Boolean isAutoApplicable = false;
    
    @ElementCollection
    @Column(name = "applicable_user_types")
    private List<String> applicableUserTypes;
    
    @Column(name = "created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    // 할인 타입 열거형
    public enum DiscountType {
        PERCENTAGE,     // 퍼센트 할인
        FIXED_AMOUNT    // 고정 금액 할인
    }
    
    // 비즈니스 메서드
    public boolean isExpired() {
        return endDate != null && LocalDate.now().isAfter(endDate);
    }
    
    public boolean isNotStarted() {
        return startDate != null && LocalDate.now().isBefore(startDate);
    }
    
    public boolean isValid() {
        return isActive && !isExpired() && !isNotStarted();
    }
}
