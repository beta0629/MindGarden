package com.coresolution.consultation.service.shop.impl;

import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.dto.shop.ShopConsultationFulfillmentContext;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.shop.ShopConsultationFulfillmentHook;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담 패키지 PAID 이행 시 {@link AdminService#confirmPayment} (4arg) → INCOME ERP 연동.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ErpShopConsultationFulfillmentHook implements ShopConsultationFulfillmentHook {

    private final AdminService adminService;

    @Override
    public void onConsultationPackagePaid(ShopConsultationFulfillmentContext context) {
        Long mappingId = context.getMappingId();
        if (mappingId == null) {
            log.debug(
                    "Consultation ERP hook skipped — no mappingId: tenantId={}, orderPublicId={}",
                    context.getTenantId(),
                    context.getOrderPublicId());
            return;
        }

        String tenantId = context.getTenantId();
        String previousTenant = TenantContextHolder.getTenantId();
        try {
            TenantContextHolder.setTenantId(tenantId);
            adminService.confirmPayment(
                    mappingId,
                    ShopCheckoutConstants.CONSULTATION_FULFILLMENT_PAYMENT_METHOD,
                    ShopCheckoutConstants.consultationPaymentReference(context.getOrderPublicId()),
                    context.getLineTotalMinor());
            log.info(
                    "Consultation ERP confirm-payment completed: tenantId={}, mappingId={}, orderPublicId={},"
                            + " amount={}",
                    tenantId,
                    mappingId,
                    context.getOrderPublicId(),
                    context.getLineTotalMinor());
        } finally {
            if (previousTenant != null) {
                TenantContextHolder.setTenantId(previousTenant);
            } else {
                TenantContextHolder.clear();
            }
        }
    }
}
