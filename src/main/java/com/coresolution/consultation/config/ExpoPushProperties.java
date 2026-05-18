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
     * Expo Push API 기본 엔드포인트 (application.yml 기본값·env 빈 문자열 보정과 동일).
     */
    public static final String DEFAULT_PUSH_API_URL = "https://exp.host/--/api/v2/push/send";

    /**
     * Expo access token (환경 변수 {@code EXPO_ACCESS_TOKEN} 등으로 주입).
     */
    private String accessToken = "";

    /**
     * Push send 엔드포인트 URL.
     */
    private String apiUrl = DEFAULT_PUSH_API_URL;

    /**
     * env에 빈 {@code EXPO_PUSH_API_URL=} 가 있으면 Spring placeholder 기본값이 적용되지 않으므로 보정 후 로깅.
     */
    @PostConstruct
    void normalizeConfiguration() {
        applyDefaults();
    }

    /**
     * 빈 apiUrl을 기본 URL로 치환. 단위 테스트에서도 호출.
     */
    void applyDefaults() {
        if (apiUrl == null || apiUrl.isBlank()) {
            apiUrl = DEFAULT_PUSH_API_URL;
            log.debug("Expo push apiUrl blank; using default endpoint");
        } else {
            apiUrl = apiUrl.trim();
        }
        if (accessToken == null) {
            accessToken = "";
        } else {
            accessToken = accessToken.trim();
        }
        boolean configured = !accessToken.isBlank();
        log.info("Expo push access token configured: {}", configured);
    }
}
