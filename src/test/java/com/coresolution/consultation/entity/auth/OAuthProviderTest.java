package com.coresolution.consultation.entity.auth;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * {@link OAuthProvider} enum 정규화·검증 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@DisplayName("OAuthProvider — 정규화·검증")
class OAuthProviderTest {

    @Test
    @DisplayName("4 종 provider 가 모두 정의돼 있다")
    void hasAllFourProviders() {
        assertThat(OAuthProvider.values()).containsExactlyInAnyOrder(
            OAuthProvider.APPLE, OAuthProvider.GOOGLE, OAuthProvider.KAKAO, OAuthProvider.NAVER);
    }

    @Test
    @DisplayName("fromString — 대소문자·공백 무관 정규화")
    void fromString_normalizesCase() {
        assertThat(OAuthProvider.fromString("apple")).isEqualTo(OAuthProvider.APPLE);
        assertThat(OAuthProvider.fromString(" KaKaO ")).isEqualTo(OAuthProvider.KAKAO);
        assertThat(OAuthProvider.fromString("NAVER")).isEqualTo(OAuthProvider.NAVER);
        assertThat(OAuthProvider.fromString("google")).isEqualTo(OAuthProvider.GOOGLE);
    }

    @Test
    @DisplayName("fromString — null/공백/미지원 값 거부")
    void fromString_rejectsInvalid() {
        assertThatThrownBy(() -> OAuthProvider.fromString(null))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> OAuthProvider.fromString(""))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> OAuthProvider.fromString("   "))
            .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> OAuthProvider.fromString("FACEBOOK"))
            .isInstanceOf(IllegalArgumentException.class);
    }
}
