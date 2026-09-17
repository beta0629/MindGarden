package com.coresolution.consultation.service.shop.impl;

import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopSessionCountConstants;
import com.coresolution.consultation.dto.shop.ShopConsultationFulfillmentContext;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.shop.ShopConsultationFulfillmentHook;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담 패키지 PAID 이행 시 상품 {@code sessionCount} 기반 ACTIVE 매핑 회기 가산
 * 및 {@link AdminService#confirmPayment} (4arg) → INCOME ERP 연동.
 *
 * <p>회기 가산을 confirm-payment 보다 먼저 수행한다.
 * {@code confirmPayment} 가 매핑 상태를 {@code PAYMENT_CONFIRMED} 로 바꿀 수 있기 때문이다.</p>
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ErpShopConsultationFulfillmentHook implements ShopConsultationFulfillmentHook {

    private final AdminService adminService;
    private final ConsultantClientMappingRepository consultantClientMappingRepository;

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
            grantSessionsToMapping(tenantId, mappingId, context);
            adminService.confirmPayment(
                    mappingId,
                    ShopCheckoutConstants.CONSULTATION_FULFILLMENT_PAYMENT_METHOD,
                    ShopCheckoutConstants.consultationPaymentReference(context.getOrderPublicId()),
                    context.getLineTotalMinor());
            log.info(
                    "Consultation ERP confirm-payment completed: tenantId={}, mappingId={}, orderPublicId={},"
                            + " amount={}, sessionsToGrant={}",
                    tenantId,
                    mappingId,
                    context.getOrderPublicId(),
                    context.getLineTotalMinor(),
                    context.getSessionsToGrant());
        } finally {
            if (previousTenant != null) {
                TenantContextHolder.setTenantId(previousTenant);
            } else {
                TenantContextHolder.clear();
            }
        }
    }

    /**
     * ACTIVE(또는 회기소진) 매핑에 상품 회기수(×수량)를 가산한다.
     *
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID
     * @param context 이행 컨텍스트
     */
    private void grantSessionsToMapping(
            String tenantId, Long mappingId, ShopConsultationFulfillmentContext context) {
        int sessionsToGrant = context.getSessionsToGrant();
        if (sessionsToGrant < ShopSessionCountConstants.MIN_SESSION_COUNT) {
            log.warn(
                    "Shop session grant skipped — invalid sessionsToGrant: tenantId={}, mappingId={}, value={}",
                    tenantId,
                    mappingId,
                    sessionsToGrant);
            return;
        }
        ConsultantClientMapping mapping = consultantClientMappingRepository
                .findByTenantIdAndId(tenantId, mappingId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "매핑을 찾을 수 없습니다: mappingId=" + mappingId));
        MappingStatus status = mapping.getStatus();
        if (status != MappingStatus.ACTIVE && status != MappingStatus.SESSIONS_EXHAUSTED) {
            throw new IllegalStateException(
                    ShopCheckoutConstants.MSG_SESSION_GRANT_MAPPING_NOT_ACTIVE
                            + " mappingId="
                            + mappingId
                            + ", status="
                            + status);
        }
        mapping.addSessions(sessionsToGrant);
        consultantClientMappingRepository.save(mapping);
        log.info(
                "Shop session grant applied: tenantId={}, mappingId={}, sessionsAdded={}, total={}, remaining={}, status={}",
                tenantId,
                mappingId,
                sessionsToGrant,
                mapping.getTotalSessions(),
                mapping.getRemainingSessions(),
                mapping.getStatus());
    }
}
