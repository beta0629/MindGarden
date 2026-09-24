package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.constant.ShopSessionCountConstants;
import com.coresolution.consultation.dto.shop.ShopCatalogOffer;
import com.coresolution.consultation.dto.shop.ShopCatalogSkuResponse;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.service.ClientShopCatalogService;
import com.coresolution.consultation.service.ShopCatalogPackageOfferResolver;
import java.util.List;
import java.util.Objects;
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
    private final ShopCatalogPackageOfferResolver shopCatalogPackageOfferResolver;

    @Override
    @Transactional(readOnly = true)
    public List<ShopCatalogSkuResponse> listVisibleSkus(String tenantId) {
        return shopCatalogSkuRepository.findCatalogForTenant(tenantId).stream()
                .map(sku -> toResponse(tenantId, sku))
                .filter(Objects::nonNull)
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
        ShopCatalogSkuResponse response = toResponse(tenantId, row);
        if (response == null) {
            throw new EntityNotFoundException(ENTITY_NAME, skuCode.trim());
        }
        return response;
    }

    private ShopCatalogSkuResponse toResponse(String tenantId, ShopCatalogSku sku) {
        ShopCatalogOffer offer = resolveOffer(tenantId, sku);
        if (offer.linked() && !offer.sellable()) {
            return null;
        }
        int sessionCount = offer.sessionCount();
        return ShopCatalogSkuResponse.builder()
                .skuCode(sku.getSkuCode())
                .title(offer.title())
                .descriptionText(sku.getDescriptionText())
                .unitPriceMinor(offer.unitPriceMinor())
                .currency(sku.getCurrency())
                .catalogCategory(resolveCatalogCategory(sku))
                .thumbnailUrl(sku.getThumbnailUrl())
                .sessionCount(sessionCount)
                .packageType(ShopSessionCountConstants.resolvePackageType(sessionCount))
                .build();
    }

    private ShopCatalogOffer resolveOffer(String tenantId, ShopCatalogSku sku) {
        if (sku == null || !StringUtils.hasText(sku.getSourcePackageCode())) {
            return ShopCatalogOffer.unlinked(sku);
        }
        return shopCatalogPackageOfferResolver.resolveLinked(tenantId, sku);
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
