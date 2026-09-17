package com.coresolution.consultation.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
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
     * 매핑 ID로 최신 주문 라인 1건 (삭제되지 않은 행만).
     *
     * @param mappingId consultant_client_mapping_id
     * @return 최신 주문 라인
     */
    Optional<ShopClientOrderLine> findFirstByConsultantClientMappingIdAndIsDeletedFalseOrderByIdDesc(
            Long mappingId);

    /**
     * 테넌트·매핑 ID 집합으로 주문 라인 일괄 조회 (id DESC — 호출측에서 매핑별 최신 1건 선택).
     *
     * @param tenantId 테넌트 ID
     * @param mappingIds consultant_client_mapping_id 목록
     * @return 주문 라인 (id 내림차순)
     */
    @Query("SELECT l FROM ShopClientOrderLine l "
            + "WHERE l.tenantId = :tenantId "
            + "AND l.consultantClientMappingId IN :mappingIds "
            + "AND l.isDeleted = false "
            + "ORDER BY l.id DESC")
    List<ShopClientOrderLine> findByTenantIdAndConsultantClientMappingIdInAndIsDeletedFalseOrderByIdDesc(
            @Param("tenantId") String tenantId,
            @Param("mappingIds") Collection<Long> mappingIds);
}
