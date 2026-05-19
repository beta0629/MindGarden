package com.coresolution.core.dto;

import java.util.List;
import lombok.Builder;
import lombok.Value;

/**
 * Shop·Reward 컴포넌트 번들 활성화 결과.
 *
 * @author CoreSolution
 * @since 2026-05-22
 */
@Value
@Builder
public class ShopRewardComponentActivationResponse {

    String tenantId;

    int activatedCount;

    List<String> activatedComponentCodes;
}
