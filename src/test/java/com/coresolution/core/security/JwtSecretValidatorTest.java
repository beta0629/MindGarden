package com.coresolution.core.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * {@link JwtSecretValidator} 운영 회귀 방지 가드 단위 테스트.
 *
 * <p>B-3 JWT_SECRET 회귀 방지 PR — 운영 unit Environment= 평문 placeholder 가 다시 들어와도
 * 부트가 실패하도록 fail-fast 가드를 검증한다.
 *
 * @author CoreSolution
 * @since 2026-06-13
 */
@DisplayName("JwtSecretValidator 운영 회귀 방지 가드")
class JwtSecretValidatorTest {

    /** {@code openssl rand -hex 64} 출력 길이(128자) 와 동일한 강한 hex 키. */
    private static final String STRONG_HEX_KEY =
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
            + "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";

    /**
     * 64자 이상의 base64 문자(A-Z/a-z/0-9/+/) 만 사용 — 약 단어 없음 검증용 합성 키.
     * (실제 운영에선 {@code openssl rand -base64 48} 사용)
     */
    private static final String STRONG_BASE64_KEY =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ01"
            + "+/+/ABCDEFGHIJ";

    private JwtSecretValidator newValidator(String activeProfile, String secret) {
        MockEnvironment env = new MockEnvironment();
        if (activeProfile != null && !activeProfile.isEmpty()) {
            env.setActiveProfiles(activeProfile);
        }
        JwtSecretValidator validator = new JwtSecretValidator(env);
        ReflectionTestUtils.setField(validator, "jwtSecret", secret);
        return validator;
    }

    @Nested
    @DisplayName("운영 동치 프로파일 (prod / 기본)")
    class ProductionLikeProfile {

        @Test
        @DisplayName("64자 이상 강한 hex 키 — 부트 통과")
        void strongHexKey_passes() {
            JwtSecretValidator validator = newValidator("prod", STRONG_HEX_KEY);
            assertThatCode(validator::validateJwtSecret).doesNotThrowAnyException();

            JwtSecretValidator.ValidationResult result = validator.evaluate(STRONG_HEX_KEY);
            assertThat(result.isValid()).isTrue();
            assertThat(result.encoding()).isEqualTo("hex");
        }

        @Test
        @DisplayName("64자 이상 base64 키 — 부트 통과")
        void strongBase64Key_passes() {
            JwtSecretValidator validator = newValidator("prod", STRONG_BASE64_KEY);
            assertThatCode(validator::validateJwtSecret).doesNotThrowAnyException();

            JwtSecretValidator.ValidationResult result = validator.evaluate(STRONG_BASE64_KEY);
            assertThat(result.isValid()).isTrue();
            assertThat(result.encoding()).isEqualTo("base64");
        }

        @Test
        @DisplayName("길이 부족 (< 64자) — IllegalStateException 으로 부트 중단")
        void tooShortKey_failsFast() {
            String shortHex = "0123456789abcdef0123456789abcdef";
            JwtSecretValidator validator = newValidator("prod", shortHex);

            assertThatThrownBy(validator::validateJwtSecret)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("JWT_SECRET 부적합")
                    .hasMessageContaining("최소 길이 64자 미만");
        }

        @Test
        @DisplayName("약 단어 'changeme' 포함 — IllegalStateException 으로 부트 중단")
        void weakWordChangeme_failsFast() {
            String key = "changeme01234567890changeme01234567890changeme01234567890changeme";
            JwtSecretValidator validator = newValidator("prod", key);

            assertThatThrownBy(validator::validateJwtSecret)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("약 단어 'changeme'");
        }

        @Test
        @DisplayName("약 단어 'secret-key' 포함 (대소문자 혼합) — IllegalStateException")
        void weakWordSecretKeyMixedCase_failsFast() {
            String key = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
                    + "Secret-Key" + "AAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
            JwtSecretValidator validator = newValidator("prod", key);

            assertThatThrownBy(validator::validateJwtSecret)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("secret-key");
        }

        @Test
        @DisplayName("NULL/blank JWT_SECRET — IllegalStateException 으로 부트 중단")
        void blankKey_failsFast() {
            JwtSecretValidator validator = newValidator("prod", "");

            assertThatThrownBy(validator::validateJwtSecret)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("JWT_SECRET 미설정");
        }

        @Test
        @DisplayName("hex/base64 형태 아님 (특수문자 #) — IllegalStateException")
        void nonHexNonBase64_failsFast() {
            String key = "###################################################################";
            JwtSecretValidator validator = newValidator("prod", key);

            assertThatThrownBy(validator::validateJwtSecret)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("hex(^[0-9a-fA-F]+$) 또는 base64 형태 아님");
        }
    }

    @Nested
    @DisplayName("dev / local / test 프로파일 (비운영)")
    class NonProductionProfile {

        @Test
        @DisplayName("dev 프로파일에서 약 단어 placeholder — 부트 허용 (WARN 만)")
        void devProfile_weakKey_doesNotThrow() {
            String weak = "mindgarden-jwt-secret-key-2025-local-development-only";
            JwtSecretValidator validator = newValidator("dev", weak);

            assertThatCode(validator::validateJwtSecret).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("local 프로파일에서 NULL JWT_SECRET — 부트 허용 (WARN 만)")
        void localProfile_emptyKey_doesNotThrow() {
            JwtSecretValidator validator = newValidator("local", "");

            assertThatCode(validator::validateJwtSecret).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("test 프로파일 (통합 테스트) — 짧고 약한 키도 부트 허용 (WARN 만)")
        void testProfile_weakKey_doesNotThrow() {
            String weak = "test-jwt-secret-key-for-integration-test-only-minimum-32-characters-required";
            JwtSecretValidator validator = newValidator("test", weak);

            assertThatCode(validator::validateJwtSecret).doesNotThrowAnyException();
        }
    }
}
