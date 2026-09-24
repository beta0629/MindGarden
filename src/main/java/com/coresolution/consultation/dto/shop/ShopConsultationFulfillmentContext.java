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
    /**
     * 주문 라인 상품명 스냅샷({@code titleSnapshot}). Path B 매핑 packageName SSOT.
     */
    String titleSnapshot;
    long lineTotalMinor;
    /**
     * 주문 {@code cashDueMinor}. Path B INCOME/활성화 금액 SSOT (lineTotal 과 불일치 시 우선).
     */
    long cashDueMinor;
    /** ERP confirm-payment 대상 매핑 (없으면 SKIPPED) */
    Long mappingId;
    /** 매핑 total/remaining 가산 회기수(회기수×수량). */
    int sessionsToGrant;
}
