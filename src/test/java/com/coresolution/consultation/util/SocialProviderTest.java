package com.coresolution.consultation.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("SocialProvider 정규화")
class SocialProviderTest {

    @Test
    @DisplayName("provider는 trim 후 대문자, 공백·null은 null")
    void normalizeProvider() {
        assertThat(SocialProvider.normalize(" naver ")).isEqualTo("NAVER");
        assertThat(SocialProvider.normalize("KaKaO")).isEqualTo("KAKAO");
        assertThat(SocialProvider.normalize(null)).isNull();
        assertThat(SocialProvider.normalize("   ")).isNull();
        assertThat(SocialProvider.normalize("")).isNull();
    }

    @Test
    @DisplayName("이메일은 trim 후 소문자, 공백·null은 null")
    void normalizeEmail() {
        assertThat(SocialProvider.normalizeEmail(" User@Test.COM ")).isEqualTo("user@test.com");
        assertThat(SocialProvider.normalizeEmail(null)).isNull();
        assertThat(SocialProvider.normalizeEmail("   ")).isNull();
    }
}
