package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.dto.shop.ShopCatalogSkuResponse;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.service.ClientShopCatalogService;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 카탈로그 조회 구현.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Service
@RequiredArgsConstructor
public class ClientShopCatalogServiceImpl implements ClientShopCatalogService {

    private static final String ENTITY_NAME = "ShopCatalogSku";

    private final ShopCatalogSkuRepository shopCatalogSkuRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ShopCatalogSkuResponse> listVisibleSkus(String tenantId) {
        return shopCatalogSkuRepository.findCatalogForTenant(tenantId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ShopCatalogSkuResponse getVisibleSkuByCode(String tenantId, String skuCode) {
        if (!StringUtils.hasText(skuCode)) {
            throw new IllegalArgumentException("skuCode가 필요합니다.");
        }
        ShopCatalogSku row = shopCatalogSkuRepository
                .findVisibleByTenantAndSkuCode(tenantId, skuCode.trim())
                .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, skuCode.trim()));
        return toResponse(row);
    }

    private ShopCatalogSkuResponse toResponse(ShopCatalogSku s) {
        return ShopCatalogSkuResponse.builder()
                .skuCode(s.getSkuCode())
                .title(s.getTitle())
                .descriptionText(s.getDescriptionText())
                .unitPriceMinor(s.getUnitPriceMinor())
                .currency(s.getCurrency())
                .catalogCategory(resolveCatalogCategory(s))
                .thumbnailUrl(s.getThumbnailUrl())
                .build();
    }

    private static String resolveCatalogCategory(ShopCatalogSku s) {
        if (s.getCatalogCategory() != null && !s.getCatalogCategory().isBlank()) {
            String normalized = s.getCatalogCategory().trim().toUpperCase();
            if (ShopCatalogCategory.ASSESSMENT.equals(normalized)) {
                return ShopCatalogCategory.ASSESSMENT;
            }
            return ShopCatalogCategory.CONSULTATION;
        }
        String code = s.getSkuCode();
        if (code != null) {
            String upper = code.toUpperCase();
            if (upper.startsWith("ASSESS_") || upper.startsWith("TEST_") || upper.contains("_ASSESS")) {
                return ShopCatalogCategory.ASSESSMENT;
            }
        }
        return ShopCatalogCategory.CONSULTATION;
    }
}
