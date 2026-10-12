package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.util.ShopClientOfferSkuPolicy;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 내담자가 주문(장바구니·바로구매)할 수 있는 SKU 조회의 단일 진입점.
 * 몰 노출 SKU 이거나, 내담자 전용 SKU 이면서 해당 내담자에게 활성 지정된 경우에만 허용한다.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
@Service
@RequiredArgsConstructor
public class ShopOrderableSkuService {

    private final ShopCatalogSkuRepository skuRepository;
    private final ShopClientOfferService clientOfferService;

    /**
     * 주문 가능한 SKU 를 조회한다.
     *
     * @param tenantId 테넌트 ID
     * @param skuCode  SKU 코드
     * @param clientId 주문하는 내담자 users.id
     * @return 주문 가능하면 SKU, 아니면 빈 값
     */
    @Transactional(readOnly = true)
    public Optional<ShopCatalogSku> findOrderableForClient(String tenantId, String skuCode, Long clientId) {
        return skuRepository.findActiveByTenantAndSkuCode(tenantId, skuCode)
                .filter(sku -> isOrderable(tenantId, sku, clientId));
    }

    private boolean isOrderable(String tenantId, ShopCatalogSku sku, Long clientId) {
        if (Boolean.TRUE.equals(sku.getCatalogVisible())) {
            return true;
        }
        return ShopClientOfferSkuPolicy.isClientOfferSku(sku)
                && clientOfferService.isActiveOfferForClient(tenantId, clientId, sku.getSkuCode());
    }
}
