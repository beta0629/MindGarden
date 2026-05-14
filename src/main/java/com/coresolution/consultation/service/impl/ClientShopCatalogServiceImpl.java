package com.coresolution.consultation.service.impl;

import java.util.List;
import java.util.stream.Collectors;
import com.coresolution.consultation.dto.shop.ShopCatalogSkuResponse;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.service.ClientShopCatalogService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

/**
 * 카탈로그 조회 구현.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Service
@RequiredArgsConstructor
public class ClientShopCatalogServiceImpl implements ClientShopCatalogService {

    private final ShopCatalogSkuRepository shopCatalogSkuRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ShopCatalogSkuResponse> listVisibleSkus(String tenantId) {
        return shopCatalogSkuRepository.findCatalogForTenant(tenantId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private ShopCatalogSkuResponse toResponse(ShopCatalogSku s) {
        return ShopCatalogSkuResponse.builder()
                .skuCode(s.getSkuCode())
                .title(s.getTitle())
                .descriptionText(s.getDescriptionText())
                .unitPriceMinor(s.getUnitPriceMinor())
                .currency(s.getCurrency())
                .build();
    }
}
