package com.coresolution.consultation.dto.shop;

import lombok.Builder;
import lombok.Value;

/**
 * 상담 패키지 이행 훅 컨텍스트.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Value
@Builder
public class ShopConsultationFulfillmentContext {

    String tenantId;
    String orderPublicId;
    Long clientUserId;
    String skuCode;
    long lineTotalMinor;
    /** ERP confirm-payment 대상 매핑 (없으면 SKIPPED) */
    Long mappingId;
}
