package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.ShopCatalogSku;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 카탈로그 SKU 저장소.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Repository
public interface ShopCatalogSkuRepository extends BaseRepository<ShopCatalogSku, Long> {

    @Query("SELECT s FROM ShopCatalogSku s WHERE s.tenantId = :tenantId AND s.isDeleted = false "
            + "AND s.catalogVisible = true AND s.active = true ORDER BY s.sortOrder ASC, s.id ASC")
    List<ShopCatalogSku> findCatalogForTenant(@Param("tenantId") String tenantId);

    @Query("SELECT s FROM ShopCatalogSku s WHERE s.tenantId = :tenantId AND s.skuCode = :skuCode "
            + "AND s.isDeleted = false AND s.active = true")
    Optional<ShopCatalogSku> findActiveByTenantAndSkuCode(
            @Param("tenantId") String tenantId,
            @Param("skuCode") String skuCode);

    @Query("SELECT s FROM ShopCatalogSku s WHERE s.tenantId = :tenantId AND s.id IN :ids "
            + "AND s.isDeleted = false AND s.active = true")
    List<ShopCatalogSku> findActiveByTenantAndIds(
            @Param("tenantId") String tenantId,
            @Param("ids") List<Long> ids);

    List<ShopCatalogSku> findByTenantIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(String tenantId);

    Optional<ShopCatalogSku> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId);

    boolean existsByTenantIdAndSkuCodeAndIsDeletedFalse(String tenantId, String skuCode);

    boolean existsByTenantIdAndSkuCodeAndIsDeletedFalseAndIdNot(String tenantId, String skuCode, Long id);

    @Query("SELECT s.skuCode FROM ShopCatalogSku s "
            + "WHERE s.tenantId = :tenantId "
            + "AND s.skuCode LIKE CONCAT(:prefix, '%') "
            + "AND s.isDeleted = false")
    List<String> findSkuCodesByTenantIdAndSkuCodeStartingWithAndIsDeletedFalse(
            @Param("tenantId") String tenantId,
            @Param("prefix") String prefix);

    @Query("SELECT s FROM ShopCatalogSku s WHERE s.tenantId = :tenantId AND s.skuCode = :skuCode "
            + "AND s.isDeleted = false AND s.catalogVisible = true AND s.active = true")
    Optional<ShopCatalogSku> findVisibleByTenantAndSkuCode(
            @Param("tenantId") String tenantId,
            @Param("skuCode") String skuCode);
}
