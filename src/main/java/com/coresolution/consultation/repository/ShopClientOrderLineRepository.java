package com.coresolution.consultation.repository;

import java.util.Collection;
import java.util.List;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 주문 라인 저장소.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Repository
public interface ShopClientOrderLineRepository extends BaseRepository<ShopClientOrderLine, Long> {

    List<ShopClientOrderLine> findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(Long clientOrderId);

    /**
     * 테넌트·매핑 ID 집합으로 주문 라인 일괄 조회 (N+1 회피).
     *
     * @param tenantId 테넌트 ID
     * @param mappingIds consultant_client_mapping_id 목록
     * @return 주문 라인 (id 내림차순)
     */
    @Query("SELECT l FROM ShopClientOrderLine l "
            + "JOIN FETCH l.clientOrder o "
            + "WHERE l.tenantId = :tenantId "
            + "AND l.consultantClientMappingId IN :mappingIds "
            + "AND l.isDeleted = false "
            + "ORDER BY l.id DESC")
    List<ShopClientOrderLine> findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
            @Param("tenantId") String tenantId,
            @Param("mappingIds") Collection<Long> mappingIds);

    /**
     * 테넌트·주문 publicId 집합으로 주문 라인 일괄 조회 (mappingId 조인 미스 시 paymentReference 벨트).
     *
     * @param tenantId  테넌트 ID
     * @param publicIds 주문 publicId 목록
     * @return 주문 라인 (id 내림차순)
     */
    @Query("SELECT l FROM ShopClientOrderLine l "
            + "JOIN FETCH l.clientOrder o "
            + "WHERE l.tenantId = :tenantId "
            + "AND o.publicId IN :publicIds "
            + "AND l.isDeleted = false "
            + "ORDER BY l.id DESC")
    List<ShopClientOrderLine> findByTenantIdAndClientOrderPublicIdInAndIsDeletedFalseOrderByIdDesc(
            @Param("tenantId") String tenantId,
            @Param("publicIds") Collection<String> publicIds);
}
