package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.ShopClientOffer;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 내담자별 지정 상품 조회.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
public interface ShopClientOfferRepository extends JpaRepository<ShopClientOffer, Long> {

    List<ShopClientOffer> findByTenantIdAndClientIdAndIsDeletedFalseOrderByIdDesc(String tenantId, Long clientId);

    List<ShopClientOffer> findByTenantIdAndClientIdAndStatusAndIsDeletedFalseOrderByIdDesc(
            String tenantId, Long clientId, String status);

    Optional<ShopClientOffer> findByTenantIdAndIdAndIsDeletedFalse(String tenantId, Long id);

    boolean existsByTenantIdAndClientIdAndOfferSkuCodeAndStatusAndIsDeletedFalse(
            String tenantId, Long clientId, String offerSkuCode, String status);
}
