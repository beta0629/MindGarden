package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.ConsultationPackageCodeConstants;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.exception.CommonCodeInUseException;
import com.coresolution.consultation.repository.ConsultationPackageUsageRepository;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 공통코드 삭제 전 공통 검사. 상품(CONSULTATION_PACKAGE)은 주문·결제·회기 이력이 있으면 409.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */
@Component
@RequiredArgsConstructor
public class CommonCodeDeletionGuard {

    private final ShopCatalogSkuRepository skuRepository;
    private final ConsultationPackageUsageRepository usageRepository;

    /**
     * @param tenantId 테넌트 ID
     * @param code 삭제하려는 코드
     * @throws CommonCodeInUseException 이력이 있을 때
     */
    public void assertDeletable(String tenantId, CommonCode code) {
        if (code == null || !ConsultationPackageCodeConstants.CODE_GROUP.equals(code.getCodeGroup())) {
            return;
        }
        List<ShopCatalogSku> skus = skuRepository
                .findByTenantIdAndSourcePackageCodeAndIsDeletedFalseOrderByIdAsc(tenantId, code.getCodeValue());
        Set<String> skuCodes = new LinkedHashSet<>();
        Set<String> names = new LinkedHashSet<>();
        addIfText(names, code.getCodeValue());
        addIfText(names, code.getCodeLabel());
        addIfText(names, code.getKoreanName());
        for (ShopCatalogSku sku : skus) {
            addIfText(skuCodes, sku.getSkuCode());
            addIfText(names, sku.getSkuCode());
            addIfText(names, sku.getTitle());
        }
        if (!skuCodes.isEmpty() && usageRepository.countOrderLinesBySkuCodes(tenantId, skuCodes) > 0) {
            throw new CommonCodeInUseException(ConsultationPackageCodeConstants.MSG_DELETE_BLOCKED_BY_ORDERS);
        }
        if (usageRepository.countMappingsByPackageNames(tenantId, names) > 0) {
            throw new CommonCodeInUseException(ConsultationPackageCodeConstants.MSG_DELETE_BLOCKED_BY_SESSIONS);
        }
    }

    private static void addIfText(Set<String> out, String value) {
        if (StringUtils.hasText(value)) {
            out.add(value.trim());
        }
    }
}
