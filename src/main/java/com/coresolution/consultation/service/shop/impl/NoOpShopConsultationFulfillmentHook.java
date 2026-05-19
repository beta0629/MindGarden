package com.coresolution.consultation.service.shop.impl;

import com.coresolution.consultation.dto.shop.ShopConsultationFulfillmentContext;
import com.coresolution.consultation.service.shop.ShopConsultationFulfillmentHook;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담 패키지 ERP/매핑 연동 전 no-op 훅 (테스트·폴백용, Spring 빈 아님).
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Slf4j
public class NoOpShopConsultationFulfillmentHook implements ShopConsultationFulfillmentHook {

    @Override
    public void onConsultationPackagePaid(ShopConsultationFulfillmentContext context) {
        log.debug(
                "Consultation fulfillment hook (no-op): tenantId={}, orderPublicId={}, skuCode={}",
                context.getTenantId(),
                context.getOrderPublicId(),
                context.getSkuCode());
    }
}
