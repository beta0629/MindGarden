package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * 차량번호 정규화·검증 유틸 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-03-28
 */
@DisplayName("VehiclePlateText 단위 테스트")
class VehiclePlateTextTest {

    @Nested
    @DisplayName("normalizeOrNull")
    class NormalizeOrNull {

        @Test
        @DisplayName("null은 null")
        void nullInput() {
            assertNull(VehiclePlateText.normalizeOrNull(null));
        }

        @Test
        @DisplayName("빈 문자열·공백만은 null")
        void blankToNull() {
            assertNull(VehiclePlateText.normalizeOrNull(""));
            assertNull(VehiclePlateText.normalizeOrNull("   "));
        }

        @Test
        @DisplayName("trim 및 연속 공백 축소")
        void trimAndCollapseSpaces() {
            assertThat(VehiclePlateText.normalizeOrNull("  12가  3456  ")).isEqualTo("12가 3456");
        }

        @Test
        @DisplayName("영문 소문자는 대문자로")
        void uppercasesAscii() {
            assertThat(VehiclePlateText.normalizeOrNull("ab12-cd")).isEqualTo("AB12-CD");
        }
    }

    @Nested
    @DisplayName("isValidNormalized")
    class IsValidNormalized {

        @Test
        @DisplayName("null·빈 문자열은 유효(선택 필드)")
        void nullOrEmptyOk() {
            assertTrue(VehiclePlateText.isValidNormalized(null));
            assertTrue(VehiclePlateText.isValidNormalized(""));
        }

        @Test
        @DisplayName("숫자·한글·하이픈·공백 조합 유효")
        void koreanPlateOk() {
            assertTrue(VehiclePlateText.isValidNormalized("12가 3456"));
            assertTrue(VehiclePlateText.isValidNormalized("서울12AB34"));
        }

        @Test
        @DisplayName("최대 32자까지 유효")
        void maxLength32Ok() {
            String thirtyTwo = "1".repeat(32);
            assertTrue(VehiclePlateText.isValidNormalized(thirtyTwo));
        }

        @Test
        @DisplayName("33자 초과 무효")
        void over32Invalid() {
            assertFalse(VehiclePlateText.isValidNormalized("1".repeat(33)));
        }

        @Test
        @DisplayName("@ 등 허용 외 문자 무효")
        void illegalCharInvalid() {
            assertFalse(VehiclePlateText.isValidNormalized("12@34"));
            assertFalse(VehiclePlateText.isValidNormalized("12.34"));
        }
    }
}
