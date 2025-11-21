package com.coresolution.core.domain;

import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * 테넌트-카테고리 매핑 엔티티
 * 테넌트와 카테고리의 다대다 관계
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "tenant_category_mappings", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"tenant_id", "category_item_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class TenantCategoryMapping extends BaseEntity {
    
    /**
     * 테넌트 UUID
     */
    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;
    
    /**
     * 카테고리 아이템 ID
     */
    @Column(name = "category_item_id", length = 36, nullable = false)
    private String categoryItemId;
    
    /**
     * 주 카테고리 여부 (테넌트는 여러 카테고리를 가질 수 있음)
     */
    @Column(name = "is_primary")
    @Builder.Default
    private Boolean isPrimary = false;
    
    /**
     * 테넌트 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", referencedColumnName = "tenant_id", insertable = false, updatable = false)
    private Tenant tenant;
    
    /**
     * 카테고리 아이템 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_item_id", referencedColumnName = "item_id", insertable = false, updatable = false)
    private BusinessCategoryItem categoryItem;
    
    // 비즈니스 메서드
    
    /**
     * 주 카테고리 확인
     */
    public boolean isPrimary() {
        return isPrimary != null && isPrimary;
    }
}

