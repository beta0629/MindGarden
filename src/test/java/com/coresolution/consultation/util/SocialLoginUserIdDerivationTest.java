package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link SocialLoginUserIdDerivation} 단위 테스트
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@DisplayName("SocialLoginUserIdDerivation")
class SocialLoginUserIdDerivationTest {

    @Test
    @DisplayName("로컬파트 특수문자 제거 후 영문숫자_만 남긴다")
    void stripsNonAlphanumericFromLocalPart() {
        assertThat(SocialLoginUserIdDerivation.deriveLoginUserIdFromNormalizedEmail("a.b+c@example.com"))
            .isEqualTo("abc");
    }

    @Test
    @DisplayName("로컬파트가 3자 미만이면 user_ 접두")
    void prefixesUserWhenLocalPartShorterThanThree() {
        assertThat(SocialLoginUserIdDerivation.deriveLoginUserIdFromNormalizedEmail("ab@example.com"))
            .isEqualTo("user_ab");
    }

    @Test
    @DisplayName("최대 50자로 자른다")
    void truncatesToFiftyCharacters() {
        String longLocal = "a".repeat(60);
        assertThat(SocialLoginUserIdDerivation.deriveLoginUserIdFromNormalizedEmail(longLocal + "@x.com"))
            .hasSize(50)
            .isEqualTo("a".repeat(50));
    }

    @Test
    @DisplayName("null·blank 입력은 빈 문자열")
    void blankInputReturnsEmpty() {
        assertThat(SocialLoginUserIdDerivation.deriveLoginUserIdFromNormalizedEmail(null)).isEmpty();
        assertThat(SocialLoginUserIdDerivation.deriveLoginUserIdFromNormalizedEmail("")).isEmpty();
        assertThat(SocialLoginUserIdDerivation.deriveLoginUserIdFromNormalizedEmail("   ")).isEmpty();
    }
}
