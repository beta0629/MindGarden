package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.SystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, Long> {
    
    // ==================== tenantId 필터링 메서드 ====================
    
    @Query("SELECT sc FROM SystemConfig sc WHERE sc.tenantId = :tenantId AND sc.configKey = :configKey AND sc.isActive = true")
    Optional<SystemConfig> findByTenantIdAndConfigKeyAndIsActiveTrue(@Param("tenantId") String tenantId, @Param("configKey") String configKey);
    
    @Query("SELECT sc FROM SystemConfig sc WHERE sc.tenantId = :tenantId AND sc.category = :category AND sc.isActive = true")
    List<SystemConfig> findByTenantIdAndCategoryAndIsActiveTrue(@Param("tenantId") String tenantId, @Param("category") String category);
    
    // ==================== @Deprecated 메서드 (하위 호환성) ====================
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndConfigKeyAndIsActiveTrue 사용하세요.
     */
    @Deprecated
    Optional<SystemConfig> findByConfigKeyAndIsActiveTrue(String configKey);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndCategoryAndIsActiveTrue 사용하세요.
     */
    @Deprecated
    List<SystemConfig> findByCategoryAndIsActiveTrue(String category);
}
