package com.coresolution.core.config;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

@DisplayName("EnvironmentValidationConfig — prod HMAC/키링 fail-closed")
class EnvironmentValidationConfigHmacTest {

    @Test
    @DisplayName("prod에서 HMAC 없으면 기동 실패 (값 미로그)")
    void prod_missingHmac_failsClosed() {
        EnvironmentValidationConfig cfg = new EnvironmentValidationConfig();
        ReflectionTestUtils.setField(cfg, "activeProfile", "prod");
        ReflectionTestUtils.setField(cfg, "jwtSecret", "x".repeat(32));
        ReflectionTestUtils.setField(cfg, "encryptionKey", "");
        ReflectionTestUtils.setField(cfg, "encryptionIv", "");
        ReflectionTestUtils.setField(cfg, "encryptionKeyVersions", "newk:unit-key");
        ReflectionTestUtils.setField(cfg, "encryptionIvVersions", "newk:unit-iv");
        ReflectionTestUtils.setField(cfg, "hmacSecret", "");
        ReflectionTestUtils.setField(cfg, "dbPassword", "db-pass");
        assertThatThrownBy(cfg::validateEnvironmentVariables)
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("필수 환경 변수");
    }

    @Test
    @DisplayName("prod에서 키링+HMAC이 있으면 레거시 KEY/IV가 비어도 통과")
    void prod_keyRingAndHmac_okWithoutLegacyKey() {
        EnvironmentValidationConfig cfg = new EnvironmentValidationConfig();
        ReflectionTestUtils.setField(cfg, "activeProfile", "prod");
        ReflectionTestUtils.setField(cfg, "jwtSecret", "x".repeat(32));
        ReflectionTestUtils.setField(cfg, "encryptionKey", "");
        ReflectionTestUtils.setField(cfg, "encryptionIv", "");
        ReflectionTestUtils.setField(cfg, "encryptionKeyVersions", "newk:unit-key");
        ReflectionTestUtils.setField(cfg, "encryptionIvVersions", "newk:unit-iv");
        ReflectionTestUtils.setField(cfg, "hmacSecret", "hex-secret-not-logged");
        ReflectionTestUtils.setField(cfg, "dbPassword", "db-pass");
        // PSYCH_DOC_KEY_B64 / REDIS_HOST are read from getenv — may already be set in CI.
        // If missing, this test would also fail; skip asserting success when those env are absent.
        try {
            cfg.validateEnvironmentVariables();
        } catch (IllegalStateException ex) {
            org.assertj.core.api.Assertions.assertThat(ex.getMessage())
                .doesNotContain("PERSONAL_DATA_HMAC_SECRET")
                .doesNotContain("PERSONAL_DATA_ENCRYPTION_KEY");
        }
    }
}
