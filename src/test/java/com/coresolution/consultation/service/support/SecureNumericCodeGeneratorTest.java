package com.coresolution.consultation.service.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("SecureNumericCodeGenerator")
class SecureNumericCodeGeneratorTest {

    private final SecureNumericCodeGenerator generator = new SecureNumericCodeGenerator();

    @Test
    @DisplayName("이메일 코드는 항상 6자리 숫자")
    void emailCode_alwaysSixDigits() {
        for (int i = 0; i < 500; i++) {
            assertThat(generator.generateEmailCode()).matches("\\d{6}");
        }
    }

    @Test
    @DisplayName("자릿수가 1 미만이면 거부")
    void generate_rejectsNonPositiveLength() {
        assertThatThrownBy(() -> generator.generate(0)).isInstanceOf(IllegalArgumentException.class);
    }
}
