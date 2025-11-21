package com.coresolution.core.listener;

import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.consultation.entity.BaseEntity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Tenant Entity Listener
 * 엔티티 저장/수정 시 자동으로 tenant_id 설정
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Component
public class TenantEntityListener {
    
    /**
     * 엔티티 저장 전 tenant_id 자동 설정
     * 
     * @param entity 저장할 엔티티
     */
    @PrePersist
    public void prePersist(BaseEntity entity) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null && !tenantId.isEmpty() && entity.getTenantId() == null) {
            entity.setTenantId(tenantId);
            log.debug("Tenant ID automatically set on persist: {}", tenantId);
        }
    }
    
    /**
     * 엔티티 수정 전 tenant_id 자동 설정 (없는 경우에만)
     * 
     * @param entity 수정할 엔티티
     */
    @PreUpdate
    public void preUpdate(BaseEntity entity) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null && !tenantId.isEmpty() && entity.getTenantId() == null) {
            entity.setTenantId(tenantId);
            log.debug("Tenant ID automatically set on update: {}", tenantId);
        }
    }
}

