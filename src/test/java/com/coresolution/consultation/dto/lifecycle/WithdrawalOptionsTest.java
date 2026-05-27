package com.coresolution.consultation.dto.lifecycle;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link WithdrawalOptions} 단위 테스트 — Q12-b JSON 직렬화/역직렬화 정합.
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@DisplayName("WithdrawalOptions — Q12-b 옵션 직렬화/역직렬화")
class WithdrawalOptionsTest {

    @Test
    @DisplayName("defaults(): deleteCommunityBody=false")
    void defaults_isFalse() {
        assertThat(WithdrawalOptions.defaults().isDeleteCommunityBody()).isFalse();
    }

    @Test
    @DisplayName("of(false) 는 defaults() 와 동일한 인스턴스")
    void of_false_returnsSameInstance() {
        assertThat(WithdrawalOptions.of(false)).isSameAs(WithdrawalOptions.defaults());
    }

    @Test
    @DisplayName("toJsonOrNull(): 기본 옵션은 null 반환 (storage 효율)")
    void toJson_defaults_isNull() {
        assertThat(WithdrawalOptions.defaults().toJsonOrNull()).isNull();
    }

    @Test
    @DisplayName("toJsonOrNull(): deleteCommunityBody=true → JSON 문자열")
    void toJson_true_serializes() {
        String json = WithdrawalOptions.of(true).toJsonOrNull();
        assertThat(json).isEqualTo("{\"deleteCommunityBody\":true}");
    }

    @Test
    @DisplayName("fromJsonOrDefaults(null) → defaults")
    void fromJson_null_isDefaults() {
        assertThat(WithdrawalOptions.fromJsonOrDefaults(null).isDeleteCommunityBody()).isFalse();
    }

    @Test
    @DisplayName("fromJsonOrDefaults(공백/'null') → defaults")
    void fromJson_blankOrNullLiteral_isDefaults() {
        assertThat(WithdrawalOptions.fromJsonOrDefaults("").isDeleteCommunityBody()).isFalse();
        assertThat(WithdrawalOptions.fromJsonOrDefaults("   ").isDeleteCommunityBody()).isFalse();
        assertThat(WithdrawalOptions.fromJsonOrDefaults("null").isDeleteCommunityBody()).isFalse();
        assertThat(WithdrawalOptions.fromJsonOrDefaults("NULL").isDeleteCommunityBody()).isFalse();
    }

    @Test
    @DisplayName("fromJsonOrDefaults: deleteCommunityBody=true JSON 정합 round-trip")
    void fromJson_roundTrip_true() {
        WithdrawalOptions options = WithdrawalOptions.of(true);
        String json = options.toJsonOrNull();
        assertThat(json).isNotNull();
        WithdrawalOptions restored = WithdrawalOptions.fromJsonOrDefaults(json);
        assertThat(restored.isDeleteCommunityBody()).isTrue();
    }

    @Test
    @DisplayName("fromJsonOrDefaults: 공백 포함 JSON 도 안전하게 파싱")
    void fromJson_whitespaceTolerant() {
        assertThat(WithdrawalOptions
                .fromJsonOrDefaults("{ \"deleteCommunityBody\" : true }")
                .isDeleteCommunityBody()).isTrue();
    }

    @Test
    @DisplayName("fromJsonOrDefaults: deleteCommunityBody=false JSON 은 defaults")
    void fromJson_explicitFalse_isDefaults() {
        assertThat(WithdrawalOptions
                .fromJsonOrDefaults("{\"deleteCommunityBody\":false}")
                .isDeleteCommunityBody()).isFalse();
    }

    @Test
    @DisplayName("fromJsonOrDefaults: 모르는 옵션이 섞여 있어도 defaults")
    void fromJson_unknownKeys_safe() {
        assertThat(WithdrawalOptions
                .fromJsonOrDefaults("{\"unknownKey\":true}")
                .isDeleteCommunityBody()).isFalse();
    }
}
