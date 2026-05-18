package com.coresolution.consultation.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 모바일 앱 최소 버전·강제 업데이트 정책 (테넌트 무관).
 *
 * @author MindGarden
 * @since 2026-05-18
 */
@Data
@ConfigurationProperties(prefix = "mindgarden.mobile.app-version")
public class MobileAppVersionProperties {

    private String minAndroidVersion = "1.0.0";

    private int minAndroidVersionCode = 1;

    private String minIosVersion = "1.0.0";

    private boolean forceUpdateEnabled = true;

    private String messageKo = "새 버전이 필요합니다. 업데이트 후 이용해 주세요.";

    private String androidStoreUrl = "";

    private String androidApkUrl = "";

    private String iosStoreUrl = "";
}
