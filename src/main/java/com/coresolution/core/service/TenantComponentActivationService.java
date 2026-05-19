package com.coresolution.core.service;

import com.coresolution.core.dto.ShopRewardComponentActivationResponse;
import java.util.List;

/**
 * 테넌트별 컴포넌트 활성화 조회.
 *
 * @author CoreSolution
 * @since 2026-05-19
 */
public interface TenantComponentActivationService {

    /**
     * 테넌트에 해당 컴포넌트가 ACTIVE인지 확인.
     *
     * @param tenantId      테넌트 ID
     * @param componentCode {@link com.coresolution.core.constant.PlatformComponentCodes}
     * @return 활성 여부
     */
    boolean isComponentActive(String tenantId, String componentCode);

    /**
     * 테넌트의 활성 component_code 목록.
     *
     * @param tenantId 테넌트 ID
     * @return 활성 코드 (없으면 빈 목록)
     */
    List<String> listActiveComponentCodes(String tenantId);

    /**
     * Shop·Reward 3종 컴포넌트를 테넌트에 멱등 활성화.
     *
     * @param tenantId     테넌트 ID
     * @param activatedBy  활성화 주체 (감사)
     * @return 신규 활성화된 component_code 목록·건수
     */
    ShopRewardComponentActivationResponse activateShopRewardBundle(String tenantId, String activatedBy);
}
