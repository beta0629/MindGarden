package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.ConsultationPackageCodeConstants;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.exception.CommonCodeInUseException;
import com.coresolution.consultation.repository.ConsultationPackageUsageRepository;
import com.coresolution.consultation.repository.ShopClientOfferRepository;
import com.coresolution.consultation.repository.ShopCatalogSkuRepository;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 공통코드 삭제 전 공통 검사. 상품(CONSULTATION_PACKAGE)은 주문·결제·회기 이력이 있으면 409.
 * 공통코드를 지우거나 soft-delete 하는 모든 경로는 이 가드를 거친다.
 * 내담자 지정(OFFER_) SKU 로 들어온 주문·회기도 지정 테이블의 원본 SKU 를 따라 원본 상품의 이력으로 본다.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */
@Component
@RequiredArgsConstructor
public class CommonCodeDeletionGuard {

    private final ShopCatalogSkuRepository skuRepository;
    private final ConsultationPackageUsageRepository usageRepository;
    private final ShopClientOfferRepository clientOfferRepository;

    /**
     * 코드 자신의 테넌트 기준으로 검사한다.
     *
     * @param code 삭제하려는 코드
     * @throws CommonCodeInUseException 이력이 있을 때
     */
    public void assertDeletable(CommonCode code) {
        if (code == null) {
            return;
        }
        assertDeletable(code.getTenantId(), code);
    }

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
        addClientOfferSkus(tenantId, skuCodes, names);
        if (!skuCodes.isEmpty() && usageRepository.countOrderLinesBySkuCodes(tenantId, skuCodes) > 0) {
            throw new CommonCodeInUseException(ConsultationPackageCodeConstants.MSG_DELETE_BLOCKED_BY_ORDERS);
        }
        if (usageRepository.countMappingsByPackageNames(tenantId, names) > 0) {
            throw new CommonCodeInUseException(ConsultationPackageCodeConstants.MSG_DELETE_BLOCKED_BY_SESSIONS);
        }
    }

    /** 지정 테이블(shop_client_offers)의 원본 SKU 를 따라 지정 SKU 코드·제목을 이력 검사 대상에 더한다. */
    private void addClientOfferSkus(String tenantId, Set<String> skuCodes, Set<String> names) {
        if (skuCodes.isEmpty()) {
            return;
        }
        List<String> offerSkuCodes = clientOfferRepository.findOfferSkuCodesBySourceSkuCodes(tenantId, skuCodes);
        if (offerSkuCodes.isEmpty()) {
            return;
        }
        for (String offerSkuCode : offerSkuCodes) {
            addIfText(skuCodes, offerSkuCode);
            addIfText(names, offerSkuCode);
        }
        for (ShopCatalogSku offerSku : skuRepository.findByTenantIdAndSkuCodeIn(tenantId, offerSkuCodes)) {
            addIfText(names, offerSku.getTitle());
        }
    }

    private static void addIfText(Set<String> out, String value) {
        if (StringUtils.hasText(value)) {
            out.add(value.trim());
        }
    }
}
