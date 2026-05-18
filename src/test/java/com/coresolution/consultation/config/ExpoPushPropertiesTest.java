package com.coresolution.consultation.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Expo Push 설정 빈 기동 로깅·기본 URL 보정 검증.
 *
 * @author MindGarden
 * @since 2026-05-18
 */
@DisplayName("ExpoPushProperties")
class ExpoPushPropertiesTest {

    @Test
    @DisplayName("applyDefaults 는 토큰 값 없이 기동 가능하다")
    void applyDefaultsDoesNotThrowWhenEmpty() {
        ExpoPushProperties props = new ExpoPushProperties();
        assertDoesNotThrow(props::applyDefaults);
    }

    @Test
    @DisplayName("applyDefaults 는 토큰 설정 시에도 기동 가능하다")
    void applyDefaultsDoesNotThrowWhenSet() {
        ExpoPushProperties props = new ExpoPushProperties();
        props.setAccessToken("test-token-not-logged");
        assertDoesNotThrow(props::applyDefaults);
    }

    @Test
    @DisplayName("빈 apiUrl 은 기본 Expo Push URL 로 보정된다")
    void blankApiUrlUsesDefault() {
        ExpoPushProperties props = new ExpoPushProperties();
        props.setApiUrl("");
        props.applyDefaults();
        assertEquals(ExpoPushProperties.DEFAULT_PUSH_API_URL, props.getApiUrl());
    }

    @Test
    @DisplayName("공백만 있는 apiUrl 은 기본 Expo Push URL 로 보정된다")
    void whitespaceApiUrlUsesDefault() {
        ExpoPushProperties props = new ExpoPushProperties();
        props.setApiUrl("   ");
        props.applyDefaults();
        assertEquals(ExpoPushProperties.DEFAULT_PUSH_API_URL, props.getApiUrl());
    }

    @Test
    @DisplayName("명시적 apiUrl 은 보정 후에도 유지된다")
    void explicitApiUrlIsPreserved() {
        String custom = "https://custom.example/push/send";
        ExpoPushProperties props = new ExpoPushProperties();
        props.setApiUrl("  " + custom + "  ");
        props.applyDefaults();
        assertEquals(custom, props.getApiUrl());
    }
}
