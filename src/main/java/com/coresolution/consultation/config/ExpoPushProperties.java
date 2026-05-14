package com.coresolution.consultation.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Expo Push API 연동 설정.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
@Data
@ConfigurationProperties(prefix = "mindgarden.mobile.push.expo")
public class ExpoPushProperties {

    /**
     * Expo access token (환경 변수 {@code EXPO_ACCESS_TOKEN} 등으로 주입).
     */
    private String accessToken = "";

    /**
     * Push send 엔드포인트 URL.
     */
    private String apiUrl = "https://exp.host/--/api/v2/push/send";
}
