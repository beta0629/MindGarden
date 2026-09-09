package com.coresolution.core.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link BusinessRegistrationNumberValidator} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-09
 */
@DisplayName("사업자등록번호 검증")
class BusinessRegistrationNumberValidatorTest {

    @Test
    @DisplayName("유효한 번호(체크섬 통과)는 true")
    void validNumber() {
        assertThat(BusinessRegistrationNumberValidator.isValidRequired("120-81-47521")).isTrue();
        assertThat(BusinessRegistrationNumberValidator.formatForDisplay("1208147521"))
                .isEqualTo("120-81-47521");
    }

    @Test
    @DisplayName("체크섬 실패·자릿수 오류는 false")
    void invalidNumber() {
        assertThat(BusinessRegistrationNumberValidator.isValidRequired("120-81-47522")).isFalse();
        assertThat(BusinessRegistrationNumberValidator.isValidRequired("123")).isFalse();
        assertThat(BusinessRegistrationNumberValidator.isValidRequired("")).isFalse();
    }

    @Test
    @DisplayName("빈 값은 isValidOrEmpty true (선택 필드)")
    void emptyAllowed() {
        assertThat(BusinessRegistrationNumberValidator.isValidOrEmpty("")).isTrue();
        assertThat(BusinessRegistrationNumberValidator.isValidOrEmpty(null)).isTrue();
        assertThat(BusinessRegistrationNumberValidator.isValidOrEmpty("120-81-47522")).isFalse();
    }
}
