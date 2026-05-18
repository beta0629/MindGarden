package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.config.MobileAppVersionProperties;
import com.coresolution.consultation.dto.mobileversion.MobileAppVersionCheckResponse;
import com.coresolution.consultation.service.MobileAppVersionService;
import com.coresolution.consultation.util.MobileSemverUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 모바일 최소 버전 비교 — Android는 versionCode 우선, 없으면 semver; iOS는 semver.
 *
 * @author MindGarden
 * @since 2026-05-18
 */
@Service
@RequiredArgsConstructor
public class MobileAppVersionServiceImpl implements MobileAppVersionService {

    private static final String PLATFORM_ANDROID = "android";
    private static final String PLATFORM_IOS = "ios";

    private final MobileAppVersionProperties properties;

    @Override
    public MobileAppVersionCheckResponse check(String platform, String version, Integer versionCode) {
        String normalizedPlatform = platform == null ? "" : platform.trim().toLowerCase();
        String currentVersion = version == null ? "" : version.trim();

        boolean updateRequired = isUpdateRequired(normalizedPlatform, currentVersion, versionCode);
        boolean forceUpdate = properties.isForceUpdateEnabled() && updateRequired;

        String minVersion = resolveMinVersion(normalizedPlatform);
        Integer minVersionCode = PLATFORM_ANDROID.equals(normalizedPlatform)
                ? properties.getMinAndroidVersionCode()
                : null;

        return MobileAppVersionCheckResponse.builder()
                .updateRequired(updateRequired)
                .forceUpdate(forceUpdate)
                .currentVersion(currentVersion)
                .minVersion(minVersion)
                .minVersionCode(minVersionCode)
                .storeUrl(resolveStoreUrl(normalizedPlatform))
                .message(properties.getMessageKo())
                .build();
    }

    private boolean isUpdateRequired(String platform, String version, Integer versionCode) {
        if (!properties.isForceUpdateEnabled()) {
            return false;
        }
        if (PLATFORM_ANDROID.equals(platform)) {
            if (versionCode != null) {
                return versionCode < properties.getMinAndroidVersionCode();
            }
            if (version.isBlank()) {
                return true;
            }
            return MobileSemverUtils.isLessThan(version, properties.getMinAndroidVersion());
        }
        if (PLATFORM_IOS.equals(platform)) {
            if (version.isBlank()) {
                return true;
            }
            return MobileSemverUtils.isLessThan(version, properties.getMinIosVersion());
        }
        return false;
    }

    private String resolveMinVersion(String platform) {
        if (PLATFORM_IOS.equals(platform)) {
            return properties.getMinIosVersion();
        }
        return properties.getMinAndroidVersion();
    }

    private String resolveStoreUrl(String platform) {
        if (PLATFORM_IOS.equals(platform)) {
            return firstNonBlank(properties.getIosStoreUrl());
        }
        String store = firstNonBlank(properties.getAndroidStoreUrl());
        if (!store.isEmpty()) {
            return store;
        }
        return firstNonBlank(properties.getAndroidApkUrl());
    }

    private static String firstNonBlank(String value) {
        return value == null ? "" : value.trim();
    }
}
