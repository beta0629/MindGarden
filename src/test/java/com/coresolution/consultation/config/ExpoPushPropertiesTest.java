package com.coresolution.consultation.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Expo Push 설정 빈 기동 로깅 검증.
 *
 * @author MindGarden
 * @since 2026-05-18
 */
@DisplayName("ExpoPushProperties")
class ExpoPushPropertiesTest {

    @Test
    @DisplayName("logAccessTokenConfigured 는 토큰 값 없이 기동 가능하다")
    void logAccessTokenConfiguredDoesNotThrowWhenEmpty() {
        ExpoPushProperties props = new ExpoPushProperties();
        assertDoesNotThrow(props::logAccessTokenConfigured);
    }

    @Test
    @DisplayName("logAccessTokenConfigured 는 토큰 설정 시에도 기동 가능하다")
    void logAccessTokenConfiguredDoesNotThrowWhenSet() {
        ExpoPushProperties props = new ExpoPushProperties();
        props.setAccessToken("test-token-not-logged");
        assertDoesNotThrow(props::logAccessTokenConfigured);
    }
}
