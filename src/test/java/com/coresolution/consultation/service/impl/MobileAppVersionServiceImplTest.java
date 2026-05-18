package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.coresolution.consultation.config.MobileAppVersionProperties;
import com.coresolution.consultation.dto.mobileversion.MobileAppVersionCheckResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 모바일 최소 버전 게이트 단위 검증.
 *
 * @author MindGarden
 * @since 2026-05-18
 */
@DisplayName("MobileAppVersionServiceImpl")
class MobileAppVersionServiceImplTest {

    private MobileAppVersionProperties properties;
    private MobileAppVersionServiceImpl service;

    @BeforeEach
    void setUp() {
        properties = new MobileAppVersionProperties();
        properties.setMinAndroidVersion("1.0.0");
        properties.setMinAndroidVersionCode(10);
        properties.setMinIosVersion("2.0.0");
        properties.setForceUpdateEnabled(true);
        properties.setMessageKo("업데이트가 필요합니다.");
        service = new MobileAppVersionServiceImpl(properties);
    }

    @Test
    @DisplayName("Android versionCode가 최소 미만이면 updateRequired true")
    void androidBelowMinVersionCode_requiresUpdate() {
        MobileAppVersionCheckResponse result = service.check("android", "9.9.9", 5);

        assertTrue(result.isUpdateRequired());
        assertTrue(result.isForceUpdate());
    }

    @Test
    @DisplayName("Android versionCode가 최소 이상이면 updateRequired false")
    void androidAtOrAboveMinVersionCode_noUpdate() {
        MobileAppVersionCheckResponse result = service.check("android", "0.0.1", 10);

        assertFalse(result.isUpdateRequired());
        assertFalse(result.isForceUpdate());
    }

    @Test
    @DisplayName("Android versionCode 없을 때 semver가 최소 미만이면 updateRequired true")
    void androidBelowMinSemver_requiresUpdate() {
        MobileAppVersionCheckResponse result = service.check("android", "0.9.0", null);

        assertTrue(result.isUpdateRequired());
    }

    @Test
    @DisplayName("iOS semver가 최소 미만이면 updateRequired true")
    void iosBelowMinSemver_requiresUpdate() {
        MobileAppVersionCheckResponse result = service.check("ios", "1.5.0", null);

        assertTrue(result.isUpdateRequired());
    }

    @Test
    @DisplayName("force-update-enabled false이면 항상 updateRequired false")
    void forceUpdateDisabled_neverRequiresUpdate() {
        properties.setForceUpdateEnabled(false);

        MobileAppVersionCheckResponse result = service.check("android", "0.0.1", 1);

        assertFalse(result.isUpdateRequired());
        assertFalse(result.isForceUpdate());
    }
}
