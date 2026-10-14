package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.ShopPackageCompositionItem;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 상품 구성 항목 저장소.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
@Repository
public interface ShopPackageCompositionItemRepository extends JpaRepository<ShopPackageCompositionItem, Long> {

    List<ShopPackageCompositionItem> findByTenantIdAndPackageCodeOrderBySortOrderAscIdAsc(
            String tenantId, String packageCode);

    boolean existsByTenantIdAndPackageCode(String tenantId, String packageCode);

    @Query("SELECT DISTINCT c.packageCode FROM ShopPackageCompositionItem c "
            + "WHERE c.tenantId = :tenantId AND c.packageCode IN :packageCodes")
    List<String> findComposedPackageCodes(
            @Param("tenantId") String tenantId,
            @Param("packageCodes") Collection<String> packageCodes);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM ShopPackageCompositionItem c WHERE c.tenantId = :tenantId AND c.packageCode = :packageCode")
    int deleteByTenantAndPackageCode(
            @Param("tenantId") String tenantId,
            @Param("packageCode") String packageCode);
}
