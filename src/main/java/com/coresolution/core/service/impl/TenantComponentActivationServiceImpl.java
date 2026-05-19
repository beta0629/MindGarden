package com.coresolution.core.service.impl;

import com.coresolution.core.constant.PlatformComponentCodes;
import com.coresolution.core.domain.ComponentCatalog;
import com.coresolution.core.domain.TenantComponent;
import com.coresolution.core.dto.ShopRewardComponentActivationResponse;
import com.coresolution.core.repository.ComponentCatalogRepository;
import com.coresolution.core.repository.TenantComponentRepository;
import com.coresolution.core.service.TenantComponentActivationService;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link TenantComponentActivationService} 구현.
 *
 * @author CoreSolution
 * @since 2026-05-19
 */
@Service
@RequiredArgsConstructor
public class TenantComponentActivationServiceImpl implements TenantComponentActivationService {

    private final TenantComponentRepository tenantComponentRepository;
    private final ComponentCatalogRepository componentCatalogRepository;

    @Override
    @Transactional(readOnly = true)
    public boolean isComponentActive(String tenantId, String componentCode) {
        if (tenantId == null || tenantId.isBlank() || componentCode == null || componentCode.isBlank()) {
            return false;
        }
        return tenantComponentRepository.existsActiveByTenantIdAndComponentCode(
                tenantId.trim(), componentCode.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> listActiveComponentCodes(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return Collections.emptyList();
        }
        return tenantComponentRepository.findActiveComponentCodesByTenantId(tenantId.trim());
    }

    @Override
    @Transactional
    public ShopRewardComponentActivationResponse activateShopRewardBundle(String tenantId, String activatedBy) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("tenantId는 필수입니다.");
        }
        String normalizedTenantId = tenantId.trim();
        String actor = (activatedBy == null || activatedBy.isBlank()) ? "system" : activatedBy.trim();

        List<String> activatedCodes = new ArrayList<>();
        for (String componentCode : PlatformComponentCodes.SHOP_REWARD_BUNDLE) {
            componentCatalogRepository.findByComponentCodeAndIsDeletedFalse(componentCode)
                    .filter(ComponentCatalog::isActive)
                    .ifPresent(catalog -> {
                        if (tenantComponentRepository.existsNonDeletedByTenantIdAndComponentId(
                                normalizedTenantId, catalog.getComponentId())) {
                            return;
                        }
                        TenantComponent row = TenantComponent.builder()
                                .tenantComponentId(UUID.randomUUID().toString())
                                .tenantId(normalizedTenantId)
                                .componentId(catalog.getComponentId())
                                .build();
                        row.activate(actor);
                        tenantComponentRepository.save(row);
                        activatedCodes.add(componentCode);
                    });
        }

        return ShopRewardComponentActivationResponse.builder()
                .tenantId(normalizedTenantId)
                .activatedCount(activatedCodes.size())
                .activatedComponentCodes(List.copyOf(activatedCodes))
                .build();
    }
}
