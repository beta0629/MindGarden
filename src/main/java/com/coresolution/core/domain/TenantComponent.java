package com.coresolution.core.domain;

import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 테넌트별 활성화된 컴포넌트 엔티티
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Entity
@Table(name = "tenant_components")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class TenantComponent extends BaseEntity {
    
    /**
     * 컴포넌트 상태 열거형
     */
    public enum ComponentStatus {
        INACTIVE("비활성"),
        ACTIVE("활성"),
        SUSPENDED("일시정지");
        
        private final String description;
        
        ComponentStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 테넌트 컴포넌트 UUID (고유 식별자)
     */
    @Column(name = "tenant_component_id", length = 36, unique = true, nullable = false)
    private String tenantComponentId;
    
    /**
     * 테넌트 ID
     */
    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;
    
    /**
     * 컴포넌트 ID
     */
    @Column(name = "component_id", length = 36, nullable = false)
    private String componentId;
    
    /**
     * 구독 ID
     */
    @Column(name = "subscription_id")
    private Long subscriptionId;
    
    /**
     * 상태 (INACTIVE, ACTIVE, SUSPENDED)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private ComponentStatus status = ComponentStatus.INACTIVE;
    
    /**
     * 활성화 일시
     */
    @Column(name = "activated_at")
    private LocalDateTime activatedAt;
    
    /**
     * 비활성화 일시
     */
    @Column(name = "deactivated_at")
    private LocalDateTime deactivatedAt;
    
    /**
     * 활성화한 사용자
     */
    @Column(name = "activated_by", length = 100)
    private String activatedBy;
    
    /**
     * 비활성화한 사용자
     */
    @Column(name = "deactivated_by", length = 100)
    private String deactivatedBy;
    
    /**
     * Feature Flag 설정 (JSON)
     */
    @Column(name = "feature_flags_json", columnDefinition = "JSON")
    private String featureFlagsJson;
    
    /**
     * 컴포넌트별 설정 (JSON)
     */
    @Column(name = "settings_json", columnDefinition = "JSON")
    private String settingsJson;
    
    /**
     * 테넌트 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", referencedColumnName = "tenant_id", insertable = false, updatable = false)
    private Tenant tenant;
    
    /**
     * 컴포넌트 (참조)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "component_id", referencedColumnName = "component_id", insertable = false, updatable = false)
    private ComponentCatalog component;
    
    // 비즈니스 메서드
    
    /**
     * 활성 상태 확인
     */
    public boolean isActive() {
        return status == ComponentStatus.ACTIVE && !isDeleted();
    }
    
    /**
     * 활성화 처리
     */
    public void activate(String activatedBy) {
        this.status = ComponentStatus.ACTIVE;
        this.activatedAt = LocalDateTime.now();
        this.activatedBy = activatedBy;
    }
    
    /**
     * 비활성화 처리
     */
    public void deactivate(String deactivatedBy) {
        this.status = ComponentStatus.INACTIVE;
        this.deactivatedAt = LocalDateTime.now();
        this.deactivatedBy = deactivatedBy;
    }
}

