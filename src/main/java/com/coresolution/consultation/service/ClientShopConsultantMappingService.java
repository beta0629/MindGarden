package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.dto.shop.ShopConsultantMappingOption;
import com.coresolution.consultation.entity.ConsultantClientMapping;

/**
 * 내담자 쇼핑 체크아웃용 상담 매핑 조회.
 *
 * @author MindGarden
 * @since 2026-05-20
 */
public interface ClientShopConsultantMappingService {

    /**
     * 내담자 기준 쇼핑 체크아웃 eligible {@code ConsultantClientMapping} 옵션
     * (표시명·패키지 라벨·unique assigned {@code preselected}).
     *
     * @param tenantId     테넌트 ID
     * @param clientUserId 내담자 사용자 ID
     * @return 선택 옵션 목록
     */
    List<ShopConsultantMappingOption> listActiveMappingOptions(String tenantId, Long clientUserId);

    /**
     * 내담자 쇼핑 체크아웃 eligible 매핑 엔티티 (상태 판정·자동 선택용).
     *
     * <p>tenantId fail-closed. {@link com.coresolution.consultation.util.MappingAssignmentStatus#isShopCheckoutEligible}
     * 필터만 적용한다.</p>
     *
     * @param tenantId     테넌트 ID
     * @param clientUserId 내담자 사용자 ID
     * @return eligible 매핑 목록
     */
    List<ConsultantClientMapping> listActiveMappings(String tenantId, Long clientUserId);

    /**
     * 내담자 eligible 매핑 ID 목록 (체크아웃 자동·검증용).
     *
     * @param tenantId     테넌트 ID
     * @param clientUserId 내담자 사용자 ID
     * @return 매핑 ID 목록
     */
    List<Long> listActiveMappingIds(String tenantId, Long clientUserId);
}
