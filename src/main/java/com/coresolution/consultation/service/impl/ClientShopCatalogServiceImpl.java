package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.constant.ShopCatalogSkuConstants;
import com.coresolution.consultation.constant.ShopSessionCountConstants;
import com.coresolution.consultation.dto.shop.ShopCatalogOffer;
import com.coresolution.consultation.dto.shop.ShopCatalogSkuResponse;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import com.coresolution.consultation.service.ClientShopCatalogService;
import com.coresolution.consultation.service.ClientShopConsultantMappingService;
import com.coresolution.consultation.service.ShopCatalogPackageOfferResolver;
import com.coresolution.consultation.util.ShopCatalogClientVisibility;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private final ClientShopConsultantMappingService clientShopConsultantMappingService;
    private final CommonCodeRepository commonCodeRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ShopCatalogSkuResponse> listVisibleSkus(String tenantId) {
        return listVisible(tenantId, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShopCatalogSkuResponse> listVisibleSkus(String tenantId, Long clientUserId) {
        return listVisible(tenantId, clientUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public ShopCatalogSkuResponse getVisibleSkuByCode(String tenantId, String skuCode) {
        return requireVisible(tenantId, skuCode, null);
    }

    @Override
    @Transactional(readOnly = true)
    public ShopCatalogSkuResponse getVisibleSkuByCode(String tenantId, String skuCode, Long clientUserId) {
        return requireVisible(tenantId, skuCode, clientUserId);
    }

    private List<ShopCatalogSkuResponse> listVisible(String tenantId, Long clientUserId) {
        ClientCatalogScope scope = scopeFor(tenantId, clientUserId);
        List<ShopCatalogSkuResponse> out = new ArrayList<>();
        for (ShopCatalogSku sku : shopCatalogSkuRepository.findCatalogForTenant(tenantId)) {
            ShopCatalogSkuResponse response = toVisibleResponse(tenantId, sku, scope);
            if (response != null) {
                out.add(response);
            }
        }
        return out;
    }

    private ShopCatalogSkuResponse requireVisible(String tenantId, String skuCode, Long clientUserId) {
        if (!StringUtils.hasText(skuCode)) {
            throw new IllegalArgumentException("skuCode가 필요합니다.");
        }
        String code = skuCode.trim();
        ShopCatalogSku row = shopCatalogSkuRepository
                .findVisibleByTenantAndSkuCode(tenantId, code)
                .orElseThrow(() -> new EntityNotFoundException(ENTITY_NAME, code));
        ShopCatalogSkuResponse response = toVisibleResponse(tenantId, row, scopeFor(tenantId, clientUserId));
        if (response == null) {
            throw new EntityNotFoundException(ENTITY_NAME, code);
        }
        return response;
    }

    private ShopCatalogSkuResponse toVisibleResponse(
            String tenantId, ShopCatalogSku sku, ClientCatalogScope scope) {
        ShopCatalogOffer offer = resolveOffer(tenantId, sku);
        if (offer.linked() && !offer.sellable()) {
            return null;
        }
        if (scope != null && !scope.visible(sku, offer)) {
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
                .fieldCode(sku.getFieldCode())
                .build();
    }

    /**
     * 게스트 조회는 null. 로그인 내담자는 활성 매핑과 분야 표시명을 싣는다.
     *
     * @param tenantId 테넌트 ID
     * @param clientUserId 내담자 ID. null 이면 게스트
     * @return 필터 범위. 게스트면 null
     */
    private ClientCatalogScope scopeFor(String tenantId, Long clientUserId) {
        if (clientUserId == null) {
            return null;
        }
        List<ConsultantClientMapping> mappings =
                clientShopConsultantMappingService.listActiveMappings(tenantId, clientUserId);
        return new ClientCatalogScope(mappings, loadSpecialtyAliases(tenantId));
    }

    private Map<String, List<String>> loadSpecialtyAliases(String tenantId) {
        Map<String, List<String>> aliases = new HashMap<>();
        List<CommonCode> rows = commonCodeRepository.findTenantCodesByGroup(
                tenantId, ShopCatalogSkuConstants.FIELD_CODE_GROUP_CONSULTATION);
        if (rows == null) {
            return aliases;
        }
        for (CommonCode row : rows) {
            if (row == null || Boolean.TRUE.equals(row.getIsDeleted()) || !StringUtils.hasText(row.getCodeValue())) {
                continue;
            }
            List<String> names = new ArrayList<>();
            addAlias(names, row.getKoreanName());
            addAlias(names, row.getCodeLabel());
            aliases.put(row.getCodeValue().trim(), names);
        }
        return aliases;
    }

    private static void addAlias(List<String> names, String value) {
        if (StringUtils.hasText(value)) {
            names.add(value.trim());
        }
    }

    private static final class ClientCatalogScope {
        private final List<ConsultantClientMapping> mappings;
        private final Map<String, List<String>> specialtyAliases;

        private ClientCatalogScope(
                List<ConsultantClientMapping> mappings,
                Map<String, List<String>> specialtyAliases) {
            this.mappings = mappings;
            this.specialtyAliases = specialtyAliases;
        }

        private boolean visible(ShopCatalogSku sku, ShopCatalogOffer offer) {
            if (ShopCatalogCategory.ASSESSMENT.equals(resolveCatalogCategory(sku))) {
                return true;
            }
            String fieldCode = sku.getFieldCode();
            List<String> aliases = List.of();
            if (StringUtils.hasText(fieldCode)) {
                aliases = specialtyAliases.getOrDefault(fieldCode.trim(), List.of());
            }
            return ShopCatalogClientVisibility.isConsultationVisible(
                    fieldCode, packageCandidates(sku, offer), aliases, mappings);
        }
    }

    private static List<String> packageCandidates(ShopCatalogSku sku, ShopCatalogOffer offer) {
        List<String> candidates = new ArrayList<>();
        if (offer != null) {
            addAlias(candidates, offer.title());
        }
        addAlias(candidates, sku.getTitle());
        addAlias(candidates, sku.getSourcePackageCode());
        return candidates;
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
