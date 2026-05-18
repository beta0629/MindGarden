package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.ConsultantClientMapping;

/**
 * 매칭 결제 확인·입금 확인·승인 시 인앱 메시지·모바일 푸시 발화(비차단).
 *
 * @author MindGarden
 * @since 2026-05-18
 */
public interface MappingSettlementNotificationHelper {

    /**
     * 매칭 정산 시나리오 알림을 발송한다. 실패 시 로그만 남기고 호출 트랜잭션에는 영향 없음.
     *
     * @param mapping 저장된 매핑(consultant·client lazy 초기화 권장)
     * @param tenantId 테넌트 ID
     * @param scenario 시나리오
     */
    void notifyAfterMappingSettlement(
            ConsultantClientMapping mapping, String tenantId, MappingSettlementScenario scenario);
}
