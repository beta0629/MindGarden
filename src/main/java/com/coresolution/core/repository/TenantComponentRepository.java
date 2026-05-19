package com.coresolution.core.repository;

import com.coresolution.core.domain.TenantComponent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * TenantComponent Repository.
 *
 * @author CoreSolution
 * @since 2026-05-19
 */
@Repository
public interface TenantComponentRepository extends JpaRepository<TenantComponent, Long> {

    /**
     * 테넌트·컴포넌트 코드 기준 활성 여부.
     *
     * @param tenantId      테넌트 ID
     * @param componentCode component_catalog.component_code
     * @return 활성 레코드 존재 여부
     */
    @Query("""
            SELECT CASE WHEN COUNT(tc) > 0 THEN TRUE ELSE FALSE END
            FROM TenantComponent tc
            INNER JOIN ComponentCatalog cc ON tc.componentId = cc.componentId
            WHERE tc.tenantId = :tenantId
              AND cc.componentCode = :componentCode
              AND tc.status = com.coresolution.core.domain.TenantComponent.ComponentStatus.ACTIVE
              AND tc.isDeleted = FALSE
              AND cc.isDeleted = FALSE
              AND cc.isActive = TRUE
            """)
    boolean existsActiveByTenantIdAndComponentCode(
            @Param("tenantId") String tenantId,
            @Param("componentCode") String componentCode);

    /**
     * 테넌트의 활성 component_code 목록.
     *
     * @param tenantId 테넌트 ID
     * @return 활성 코드 목록
     */
    @Query("""
            SELECT cc.componentCode
            FROM TenantComponent tc
            INNER JOIN ComponentCatalog cc ON tc.componentId = cc.componentId
            WHERE tc.tenantId = :tenantId
              AND tc.status = com.coresolution.core.domain.TenantComponent.ComponentStatus.ACTIVE
              AND tc.isDeleted = FALSE
              AND cc.isDeleted = FALSE
              AND cc.isActive = TRUE
            """)
    List<String> findActiveComponentCodesByTenantId(@Param("tenantId") String tenantId);
}
