package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.CardMerchantFeeConstants;
import com.coresolution.consultation.dto.CardMerchantFeeSettingsRequest;
import com.coresolution.consultation.dto.CardMerchantFeeSettingsResponse;
import com.coresolution.consultation.entity.erp.financial.CardMerchantFeeIssuerRate;
import com.coresolution.consultation.entity.erp.financial.CardMerchantFeeSettings;
import com.coresolution.consultation.repository.erp.financial.CardMerchantFeeIssuerRateRepository;
import com.coresolution.consultation.repository.erp.financial.CardMerchantFeeSettingsRepository;
import com.coresolution.consultation.service.erp.financial.CardMerchantFeeSettingsService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.impl.BaseTenantAwareService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 카드 가맹점 수수료 설정 서비스 구현.
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CardMerchantFeeSettingsServiceImpl extends BaseTenantAwareService
        implements CardMerchantFeeSettingsService {

    private final CardMerchantFeeSettingsRepository settingsRepository;
    private final CardMerchantFeeIssuerRateRepository issuerRateRepository;

    @Override
    @Transactional(readOnly = true)
    public CardMerchantFeeSettingsResponse getSettings() {
        String tenantId = getRequiredTenantId();
        return settingsRepository.findByTenantIdAndIsDeletedFalse(tenantId)
                .map(this::toResponse)
                .orElseGet(this::buildDefaultResponse);
    }

    @Override
    public CardMerchantFeeSettingsResponse saveSettings(CardMerchantFeeSettingsRequest request) {
        String tenantId = getRequiredTenantId();
        CardMerchantFeeSettings settings = settingsRepository.findByTenantIdAndIsDeletedFalse(tenantId)
                .orElseGet(() -> {
                    CardMerchantFeeSettings created = CardMerchantFeeSettings.builder()
                            .averageRatePercent(null)
                            .build();
                    created.setTenantId(tenantId);
                    return settingsRepository.save(created);
                });

        settings.setAverageRatePercent(request.getAverageRatePercent());
        CardMerchantFeeSettings savedSettings = settingsRepository.save(settings);

        syncIssuerRates(tenantId, savedSettings, request.getIssuerRates());

        log.info("카드 수수료 설정 저장: tenantId={}, settingsId={}", tenantId, savedSettings.getId());
        return toResponse(savedSettings);
    }

    private void syncIssuerRates(String tenantId, CardMerchantFeeSettings settings,
            List<CardMerchantFeeSettingsRequest.IssuerRateItem> incoming) {
        List<CardMerchantFeeIssuerRate> existing = issuerRateRepository
                .findByTenantIdAndSettingsIdAndIsDeletedFalseOrderBySortOrderAsc(tenantId, settings.getId());
        existing.forEach(row -> {
            row.setIsDeleted(true);
            issuerRateRepository.save(row);
        });

        if (incoming == null || incoming.isEmpty()) {
            return;
        }

        int sortOrder = 0;
        for (CardMerchantFeeSettingsRequest.IssuerRateItem item : incoming) {
            if (item == null) {
                continue;
            }
            String label = item.getIssuerLabel() != null ? item.getIssuerLabel().trim() : "";
            if (label.isEmpty()) {
                continue;
            }
            BigDecimal rate = item.getRatePercent();
            if (rate == null) {
                continue;
            }
            CardMerchantFeeIssuerRate row = CardMerchantFeeIssuerRate.builder()
                    .settings(settings)
                    .issuerLabel(label)
                    .ratePercent(rate)
                    .sortOrder(sortOrder++)
                    .build();
            row.setTenantId(tenantId);
            issuerRateRepository.save(row);
        }
    }

    private CardMerchantFeeSettingsResponse toResponse(CardMerchantFeeSettings settings) {
        String tenantId = settings.getTenantId();
        List<CardMerchantFeeIssuerRate> issuerRates = issuerRateRepository
                .findByTenantIdAndSettingsIdAndIsDeletedFalseOrderBySortOrderAsc(tenantId, settings.getId());

        List<CardMerchantFeeSettingsResponse.IssuerRateItem> items;
        if (issuerRates.isEmpty()) {
            items = buildDefaultIssuerItems();
        } else {
            items = issuerRates.stream()
                    .map(rate -> CardMerchantFeeSettingsResponse.IssuerRateItem.builder()
                            .id(rate.getId())
                            .issuerLabel(rate.getIssuerLabel())
                            .ratePercent(rate.getRatePercent())
                            .sortOrder(rate.getSortOrder())
                            .build())
                    .collect(Collectors.toList());
        }

        return CardMerchantFeeSettingsResponse.builder()
                .id(settings.getId())
                .averageRatePercent(settings.getAverageRatePercent())
                .issuerRates(items)
                .build();
    }

    private CardMerchantFeeSettingsResponse buildDefaultResponse() {
        return CardMerchantFeeSettingsResponse.builder()
                .averageRatePercent(null)
                .issuerRates(buildDefaultIssuerItems())
                .build();
    }

    private List<CardMerchantFeeSettingsResponse.IssuerRateItem> buildDefaultIssuerItems() {
        List<CardMerchantFeeSettingsResponse.IssuerRateItem> items = new ArrayList<>();
        int sortOrder = 0;
        for (String label : CardMerchantFeeConstants.DEFAULT_ISSUER_LABELS) {
            items.add(CardMerchantFeeSettingsResponse.IssuerRateItem.builder()
                    .issuerLabel(label)
                    .ratePercent(null)
                    .sortOrder(sortOrder++)
                    .build());
        }
        return items;
    }

    private String getRequiredTenantId() {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = getTenantIdOrNull();
        }
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("tenantId가 설정되지 않았습니다.");
        }
        return tenantId;
    }
}
