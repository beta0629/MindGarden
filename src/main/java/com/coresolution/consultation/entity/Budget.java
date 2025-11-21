package com.coresolution.consultation.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
 * ERP 예산 엔티티
 * 부서별, 카테고리별 예산을 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "erp_budgets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Budget {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(length = 500)
    private String description;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalBudget;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal usedBudget;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal remainingBudget;
    
    @Column(nullable = false, length = 50)
    private String category;
    
    @Column(nullable = false, length = 20)
    private String year;
    
    @Column(nullable = false, length = 20)
    private String month;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BudgetStatus status;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        if (status == null) {
            status = BudgetStatus.ACTIVE;
        }
        if (usedBudget == null) {
            usedBudget = BigDecimal.ZERO;
        }
        if (remainingBudget == null && totalBudget != null) {
            remainingBudget = totalBudget.subtract(usedBudget);
        }
    }
    
    public enum BudgetStatus {
        ACTIVE, INACTIVE, EXHAUSTED, EXPIRED
    }
    
    @PreUpdate
    protected void onUpdate() {
        if (remainingBudget == null && totalBudget != null && usedBudget != null) {
            remainingBudget = totalBudget.subtract(usedBudget);
        }
    }
}
