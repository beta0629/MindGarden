package com.coresolution.consultation.service.shop;

import com.coresolution.consultation.dto.shop.ShopConsultationFulfillmentContext;

/**
 * 상담 패키지(CONSULTATION) SKU PAID 이행 시 ERP·매핑 연동 훅.
 * <p>
 * 후속 배치: {@code ConsultantClientMapping} 확보 후
 * {@code AdminService#confirmPayment} (confirm-payment) 패턴으로 INCOME/RECEIVABLES 연동.
 * </p>
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public interface ShopConsultationFulfillmentHook {

    /**
     * PAID 주문의 상담 SKU 라인 이행 처리.
     *
     * @param context 테넌트·주문·SKU·금액 컨텍스트
     */
    void onConsultationPackagePaid(ShopConsultationFulfillmentContext context);
}
