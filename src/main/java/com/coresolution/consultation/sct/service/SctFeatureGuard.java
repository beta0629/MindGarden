package com.coresolution.consultation.sct.service;

import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.sct.constant.SctFeatureFlagKeys;
import com.coresolution.consultation.sct.exception.SctFeatureDisabledException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * SCT feature.sct.enabled fail-closed 가드.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Component
@RequiredArgsConstructor
public class SctFeatureGuard {

    private final SystemConfigService systemConfigService;

    /**
     * 플래그 OFF면 404용 예외.
     *
     * @param tenantId 테넌트
     */
    public void requireEnabled(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new SctFeatureDisabledException("SCT 기능을 사용할 수 없습니다.");
        }
        boolean enabled = systemConfigService.getBooleanForTenant(
                tenantId, SctFeatureFlagKeys.FEATURE_SCT_ENABLED, false);
        if (!enabled) {
            throw new SctFeatureDisabledException("SCT 기능을 사용할 수 없습니다.");
        }
    }

    /**
     * @param tenantId 테넌트
     * @return 활성 여부
     */
    public boolean isEnabled(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return false;
        }
        return systemConfigService.getBooleanForTenant(
                tenantId, SctFeatureFlagKeys.FEATURE_SCT_ENABLED, false);
    }
}
