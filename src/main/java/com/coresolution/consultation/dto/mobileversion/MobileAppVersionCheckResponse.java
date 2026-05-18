package com.coresolution.consultation.dto.mobileversion;

import lombok.Builder;
import lombok.Value;

/**
 * {@code GET /api/v1/mobile/app-version/check} 응답.
 *
 * @author MindGarden
 * @since 2026-05-18
 */
@Value
@Builder
public class MobileAppVersionCheckResponse {

    boolean updateRequired;

    boolean forceUpdate;

    String currentVersion;

    String minVersion;

    Integer minVersionCode;

    String storeUrl;

    String message;
}
