package com.coresolution.consultation.config;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Expo Push API 연동 설정.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
@Slf4j
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

    /**
     * 기동 시 토큰 설정 여부만 로깅(값·길이 노출 금지).
     */
    @PostConstruct
    void logAccessTokenConfigured() {
        boolean configured = accessToken != null && !accessToken.isBlank();
        log.info("Expo push access token configured: {}", configured);
    }
}
