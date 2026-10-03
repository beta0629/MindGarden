package com.coresolution.core.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * {@link OnboardingAdminPasswordSupport} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
@DisplayName("OnboardingAdminPasswordSupport")
class OnboardingAdminPasswordSupportTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("BCrypt 해시만 해시로 판별")
    void isBcryptHash() {
        String hash = new BCryptPasswordEncoder().encode("Aa1!" + System.nanoTime());

        assertThat(OnboardingAdminPasswordSupport.isBcryptHash(hash)).isTrue();
        assertThat(OnboardingAdminPasswordSupport.isBcryptHash(null)).isFalse();
        assertThat(OnboardingAdminPasswordSupport.isBcryptHash("")).isFalse();
        assertThat(OnboardingAdminPasswordSupport.isBcryptHash("Plain123!")).isFalse();
        assertThat(OnboardingAdminPasswordSupport.isBcryptHash("$2a$10$short")).isFalse();
    }

    @Test
    @DisplayName("응답용 checklist 에서 adminPassword 키만 제거")
    void strip_removesOnlyPasswordKey() throws Exception {
        String json = "{\"adminPassword\":\"v\",\"brandName\":\"b\"}";

        String stripped = OnboardingAdminPasswordSupport.stripFromChecklistJson(json, objectMapper);

        assertThat(objectMapper.readTree(stripped).has("adminPassword")).isFalse();
        assertThat(objectMapper.readTree(stripped).path("brandName").asText()).isEqualTo("b");
    }

    @Test
    @DisplayName("파싱 불가 checklist 는 원문 대신 null (fail-closed)")
    void strip_corruptJson_returnsNull() {
        String corrupt = "{\"adminPassword\":\"leak\"";

        assertThat(OnboardingAdminPasswordSupport.stripFromChecklistJson(corrupt, objectMapper)).isNull();
    }
}
