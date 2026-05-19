package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.ShopCatalogSkuConstants;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 테넌트 스코프 SKU 코드 자동 발급 ({@code SHOP-yyyyMMdd-NNN}).
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@Component
@RequiredArgsConstructor
public class ShopCatalogSkuCodeGenerator {

    private static final DateTimeFormatter DATE_PART = DateTimeFormatter.BASIC_ISO_DATE;

    private final ShopCatalogSkuRepository shopCatalogSkuRepository;

    /**
     * 당일 테넌트 내 다음 시퀀스 SKU 코드를 발급합니다.
     *
     * @param tenantId 테넌트 ID
     * @return 신규 skuCode
     */
    public String generateNextCode(String tenantId) {
        String datePart = LocalDate.now().format(DATE_PART);
        String prefix = ShopCatalogSkuConstants.SKU_CODE_PREFIX + "-" + datePart + "-";
        int nextSeq = resolveNextSequence(tenantId, prefix);
        return prefix + String.format("%0" + ShopCatalogSkuConstants.SKU_CODE_SEQ_WIDTH + "d", nextSeq);
    }

    private int resolveNextSequence(String tenantId, String prefix) {
        List<String> existing = shopCatalogSkuRepository
                .findSkuCodesByTenantIdAndSkuCodeStartingWithAndIsDeletedFalse(tenantId, prefix);
        int max = 0;
        for (String code : existing) {
            int seq = parseSequenceSuffix(code, prefix);
            if (seq > max) {
                max = seq;
            }
        }
        return max + 1;
    }

    private static int parseSequenceSuffix(String skuCode, String prefix) {
        if (!StringUtils.hasText(skuCode) || !skuCode.startsWith(prefix)) {
            return 0;
        }
        String suffix = skuCode.substring(prefix.length());
        if (!suffix.matches("\\d+")) {
            return 0;
        }
        try {
            return Integer.parseInt(suffix);
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}
