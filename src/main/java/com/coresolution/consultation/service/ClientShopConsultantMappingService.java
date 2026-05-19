package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.shop.ShopConsultantMappingOption;
import java.util.List;

/**
 * 내담자 쇼핑 체크아웃용 상담 매핑 조회.
 *
 * @author MindGarden
 * @since 2026-05-20
 */
public interface ClientShopConsultantMappingService {

    /**
     * 내담자 기준 ACTIVE {@code ConsultantClientMapping} 목록 (표시명·패키지 라벨만).
     *
     * @param tenantId     테넌트 ID
     * @param clientUserId 내담자 사용자 ID
     * @return 선택 옵션 목록
     */
    List<ShopConsultantMappingOption> listActiveMappingOptions(String tenantId, Long clientUserId);

    /**
     * 내담자 ACTIVE 매핑 ID 목록 (체크아웃 자동·검증용).
     *
     * @param tenantId     테넌트 ID
     * @param clientUserId 내담자 사용자 ID
     * @return 매핑 ID 목록 (시작일 최신 순)
     */
    List<Long> listActiveMappingIds(String tenantId, Long clientUserId);
}
