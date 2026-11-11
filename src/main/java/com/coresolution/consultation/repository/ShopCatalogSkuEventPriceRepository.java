package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.ShopCatalogSkuEventPrice;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * SKU 이벤트 가격 기간 저장소(테넌트 격리).
 *
 * @author MindGarden
 * @since 2026-11-11
 */
@Repository
public interface ShopCatalogSkuEventPriceRepository extends BaseRepository<ShopCatalogSkuEventPrice, Long> {

    /**
     * SKU 의 미삭제 이벤트 기간 목록(시작일 오름차순).
     *
     * @param tenantId 테넌트 ID
     * @param skuId SKU ID
     * @return 기간 목록
     */
    List<ShopCatalogSkuEventPrice> findByTenantIdAndSkuIdAndIsDeletedFalseOrderByStartDateAsc(
            String tenantId,
            Long skuId);

    /**
     * 동일 SKU 에서 기간이 겹치는 미삭제 행(자기 자신 제외 가능).
     * <p>포함 구간: {@code startDate <= endDate AND endDate >= startDate}.</p>
     *
     * @param tenantId 테넌트 ID
     * @param skuId SKU ID
     * @param startDate 시작일
     * @param endDate 종료일
     * @param excludeId 제외할 행 id(생성 시 null)
     * @return 겹치는 행
     */
    @Query("""
            SELECT e FROM ShopCatalogSkuEventPrice e
            WHERE e.tenantId = :tenantId
              AND e.skuId = :skuId
              AND e.isDeleted = false
              AND e.startDate <= :endDate
              AND e.endDate >= :startDate
              AND (:excludeId IS NULL OR e.id <> :excludeId)
            """)
    List<ShopCatalogSkuEventPrice> findOverlappingPeriods(
            @Param("tenantId") String tenantId,
            @Param("skuId") Long skuId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeId") Long excludeId);

    /**
     * 여러 SKU 에서 특정일(포함)에 활성인 이벤트 가격.
     *
     * @param tenantId 테넌트 ID
     * @param skuIds SKU ID 목록
     * @param today 기준일(Asia/Seoul)
     * @return 활성 기간 행
     */
    @Query("""
            SELECT e FROM ShopCatalogSkuEventPrice e
            WHERE e.tenantId = :tenantId
              AND e.skuId IN :skuIds
              AND e.isDeleted = false
              AND e.startDate <= :today
              AND e.endDate >= :today
            """)
    List<ShopCatalogSkuEventPrice> findActiveOnDateForSkuIds(
            @Param("tenantId") String tenantId,
            @Param("skuIds") Collection<Long> skuIds,
            @Param("today") LocalDate today);

    /**
     * 테넌트·SKU 스코프의 미삭제 단건.
     *
     * @param id 이벤트 가격 ID
     * @param tenantId 테넌트 ID
     * @param skuId SKU ID
     * @return 행
     */
    Optional<ShopCatalogSkuEventPrice> findByIdAndTenantIdAndSkuIdAndIsDeletedFalse(
            Long id,
            String tenantId,
            Long skuId);
}
