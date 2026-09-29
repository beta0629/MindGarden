package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.ShopOrderExpiryExtension;
import java.util.Collection;
import java.util.List;
import org.springframework.stereotype.Repository;

/**
 * 쇼핑 주문 사용 기한 연장 이력 (INSERT·조회만).
 *
 * @author MindGarden
 * @since 2026-09-29
 */
@Repository
public interface ShopOrderExpiryExtensionRepository extends BaseRepository<ShopOrderExpiryExtension, Long> {

    /**
     * 주문 한 건의 연장 이력 (최신 먼저).
     *
     * @param tenantId      테넌트 ID
     * @param orderPublicId 주문 공개 ID
     * @return 연장 이력
     */
    List<ShopOrderExpiryExtension> findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderByCreatedAtDescIdDesc(
            String tenantId, String orderPublicId);

    /**
     * 여러 주문의 연장 이력 (목록 판정용 일괄 조회).
     *
     * @param tenantId       테넌트 ID
     * @param orderPublicIds 주문 공개 ID 목록
     * @return 연장 이력
     */
    List<ShopOrderExpiryExtension> findByTenantIdAndOrderPublicIdInAndIsDeletedFalse(
            String tenantId, Collection<String> orderPublicIds);
}
