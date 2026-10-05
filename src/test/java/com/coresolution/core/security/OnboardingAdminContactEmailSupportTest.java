package com.coresolution.core.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 온보딩 관리자 연락 이메일 정규화.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@DisplayName("온보딩 관리자 연락 이메일")
class OnboardingAdminContactEmailSupportTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("contactEmail 은 trim·소문자로 읽는다")
    void readNormalized_trimsAndLowercases() throws Exception {
        String json = "{\"contactEmail\":\"  Admin@Example.COM \",\"contactPhone\":\"01012345678\"}";

        assertThat(OnboardingAdminContactEmailSupport.readNormalized(json, objectMapper))
                .isEqualTo("admin@example.com");
    }

    @Test
    @DisplayName("키가 없거나 휴대폰이면 null")
    void readNormalized_missingOrPhone_isNull() throws Exception {
        assertThat(OnboardingAdminContactEmailSupport.readNormalized("{\"adminPassword\":\"x\"}",
                objectMapper)).isNull();
        assertThat(OnboardingAdminContactEmailSupport.readNormalized(
                "{\"contactEmail\":\"01012345678\"}", objectMapper)).isNull();
        assertThat(OnboardingAdminContactEmailSupport.readNormalized(null, objectMapper)).isNull();
    }

    @Test
    @DisplayName("암호문 contactEmail 은 null 이고 원문을 돌려주지 않는다")
    void readNormalized_ciphertext_isNull() throws Exception {
        String cipher = "k1::QUJDREVGRw==";
        String json = "{\"contactEmail\":\"" + cipher + "\"}";

        assertThat(OnboardingAdminContactEmailSupport.readNormalized(json, objectMapper)).isNull();
        assertThat(OnboardingAdminContactEmailSupport.visible(cipher)).isNull();
        String omitted = OnboardingAdminContactEmailSupport.omitCipherContactEmail(json, objectMapper);
        assertThat(omitted).doesNotContain(cipher);
    }
}
