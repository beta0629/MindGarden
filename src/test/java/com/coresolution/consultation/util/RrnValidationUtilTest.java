package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * 주민번호 앞6+뒤1 검증·나이/성별 계산 유틸 단위 테스트
 * Phase 4: CONSULTANT_CLIENT_REGISTRATION_ADDITIONS_PLAN
 *
 * @author MindGarden
 * @since 2026-03-02
 */
@DisplayName("RrnValidationUtil 단위 테스트")
class RrnValidationUtilTest {

    @Nested
    @DisplayName("validateFormat")
    class ValidateFormat {

        @Test
        @DisplayName("유효: 앞6자리 숫자, 뒤1자리 1~4")
        void validFormat() {
            assertTrue(RrnValidationUtil.validateFormat("900101", "1"));
            assertTrue(RrnValidationUtil.validateFormat("000101", "2"));
            assertTrue(RrnValidationUtil.validateFormat("050531", "3"));
            assertTrue(RrnValidationUtil.validateFormat("991231", "4"));
        }

        @Test
        @DisplayName("유효: 앞뒤 공백 trim 후 검증")
        void validFormatWithTrim() {
            assertTrue(RrnValidationUtil.validateFormat("  900101  ", "  1  "));
        }

        @Test
        @DisplayName("무효: null 입력")
        void invalidNull() {
            assertFalse(RrnValidationUtil.validateFormat(null, "1"));
            assertFalse(RrnValidationUtil.validateFormat("900101", null));
            assertFalse(RrnValidationUtil.validateFormat(null, null));
        }

        @Test
        @DisplayName("무효: 앞6자리 길이 불일치")
        void invalidFirst6Length() {
            assertFalse(RrnValidationUtil.validateFormat("90010", "1"));
            assertFalse(RrnValidationUtil.validateFormat("9001012", "1"));
            assertFalse(RrnValidationUtil.validateFormat("", "1"));
        }

        @Test
        @DisplayName("무효: 뒤1자리 길이 불일치")
        void invalidLast1Length() {
            assertFalse(RrnValidationUtil.validateFormat("900101", ""));
            assertFalse(RrnValidationUtil.validateFormat("900101", "12"));
        }

        @Test
        @DisplayName("무효: 앞6자리 비숫자")
        void invalidFirst6NotNumeric() {
            assertFalse(RrnValidationUtil.validateFormat("90010a", "1"));
            assertFalse(RrnValidationUtil.validateFormat("90 101", "1"));
        }

        @Test
        @DisplayName("무효: 뒤1자리 1~4 이외")
        void invalidLast1OutOfRange() {
            assertFalse(RrnValidationUtil.validateFormat("900101", "0"));
            assertFalse(RrnValidationUtil.validateFormat("900101", "5"));
            assertFalse(RrnValidationUtil.validateFormat("900101", "9"));
        }

        @Test
        @DisplayName("무효: 월 경계(00, 13)")
        void invalidMonthBoundary() {
            assertFalse(RrnValidationUtil.validateFormat("900001", "1"));
            assertFalse(RrnValidationUtil.validateFormat("901301", "1"));
        }

        @Test
        @DisplayName("무효: 일 경계(00, 32)")
        void invalidDayBoundary() {
            assertFalse(RrnValidationUtil.validateFormat("900100", "1"));
            assertFalse(RrnValidationUtil.validateFormat("900132", "1"));
        }

        @Test
        @DisplayName("무효: 존재하지 않는 날짜(2월 30일)")
        void invalidDateNotExist() {
            assertFalse(RrnValidationUtil.validateFormat("900230", "1"));
        }

        @Test
        @DisplayName("경계: 1월 1일, 12월 31일")
        void boundaryValidDates() {
            assertTrue(RrnValidationUtil.validateFormat("000101", "1"));
            assertTrue(RrnValidationUtil.validateFormat("991231", "2"));
        }
    }

    @Nested
    @DisplayName("toBirthDate")
    class ToBirthDate {

        @Test
        @DisplayName("유효: 뒤1자리 1,2 → 1900년대")
        void valid1900s() {
            assertThat(RrnValidationUtil.toBirthDate("900101", "1")).isEqualTo(LocalDate.of(1990, 1, 1));
            assertThat(RrnValidationUtil.toBirthDate("991231", "2")).isEqualTo(LocalDate.of(1999, 12, 31));
        }

        @Test
        @DisplayName("유효: 뒤1자리 3,4 → 2000년대")
        void valid2000s() {
            assertThat(RrnValidationUtil.toBirthDate("000101", "3")).isEqualTo(LocalDate.of(2000, 1, 1));
            assertThat(RrnValidationUtil.toBirthDate("050531", "4")).isEqualTo(LocalDate.of(2005, 5, 31));
        }

        @Test
        @DisplayName("무효: 형식 오류 시 null")
        void invalidFormatReturnsNull() {
            assertNull(RrnValidationUtil.toBirthDate(null, "1"));
            assertNull(RrnValidationUtil.toBirthDate("900101", "0"));
            assertNull(RrnValidationUtil.toBirthDate("90010", "1"));
        }

        @Test
        @DisplayName("뒤1자리 1·2 + 1900 해석이 100세 초과·2000 해석이 합리적이면 2000년대(오입력 보정)")
        void prefer2000WhenPrimaryAgeOver99AndAltPlausible() {
            LocalDate asOf = LocalDate.of(2026, 4, 4);
            assertThat(RrnValidationUtil.resolveBirthDate(11, 7, 27, 2, asOf)).isEqualTo(LocalDate.of(2011, 7, 27));
        }

        @Test
        @DisplayName("뒤1자리 1·2: 1900 해석이 100세 초과여도 2000 해석 만 나이가 5 미만이면 1900 유지")
        void keep1900WhenAltWouldBeTooYoung() {
            LocalDate asOf = LocalDate.of(2026, 6, 1);
            assertThat(RrnValidationUtil.resolveBirthDate(24, 1, 1, 1, asOf)).isEqualTo(LocalDate.of(1924, 1, 1));
        }

        @Test
        @DisplayName("뒤1자리 1·2: 1900·2000 모두 유효하고 1900 만 나이가 100 이하면 1900 유지")
        void keep1900WhenAgeReasonable() {
            LocalDate asOf = LocalDate.of(2026, 1, 1);
            assertThat(RrnValidationUtil.resolveBirthDate(90, 1, 1, 1, asOf)).isEqualTo(LocalDate.of(1990, 1, 1));
        }

        @Test
        @DisplayName("뒤1자리 1·2: 1900 해석 불가 날짜는 2000 해석(윤년 2/29)")
        void leap2000When1900Invalid() {
            assertTrue(RrnValidationUtil.validateFormat("000229", "2"));
            assertThat(RrnValidationUtil.toBirthDate("000229", "2")).isEqualTo(LocalDate.of(2000, 2, 29));
        }
    }

    @Nested
    @DisplayName("toAge")
    class ToAge {

        @Test
        @DisplayName("만 나이 계산: 생일 지남")
        void ageAfterBirthday() {
            LocalDate birth = LocalDate.now().minusYears(30).minusDays(1);
            assertThat(RrnValidationUtil.toAge(birth)).isEqualTo(30);
        }

        @Test
        @DisplayName("만 나이 계산: 생일 당일")
        void ageOnBirthday() {
            LocalDate birth = LocalDate.now().minusYears(25);
            assertThat(RrnValidationUtil.toAge(birth)).isEqualTo(25);
        }

        @Test
        @DisplayName("만 나이 계산: 생일 미도래")
        void ageBeforeBirthday() {
            LocalDate birth = LocalDate.now().minusYears(20).plusDays(1);
            assertThat(RrnValidationUtil.toAge(birth)).isEqualTo(19);
        }

        @Test
        @DisplayName("null 입력 시 null 반환")
        void nullReturnsNull() {
            assertNull(RrnValidationUtil.toAge(null));
        }
    }

    @Nested
    @DisplayName("toGender")
    class ToGender {

        @Test
        @DisplayName("1,3 → MALE")
        void male() {
            assertThat(RrnValidationUtil.toGender("1")).isEqualTo("MALE");
            assertThat(RrnValidationUtil.toGender("3")).isEqualTo("MALE");
        }

        @Test
        @DisplayName("2,4 → FEMALE")
        void female() {
            assertThat(RrnValidationUtil.toGender("2")).isEqualTo("FEMALE");
            assertThat(RrnValidationUtil.toGender("4")).isEqualTo("FEMALE");
        }

        @Test
        @DisplayName("공백 trim 후 판별")
        void trimThenParse() {
            assertThat(RrnValidationUtil.toGender("  1  ")).isEqualTo("MALE");
        }

        @Test
        @DisplayName("무효: null 또는 길이 != 1 시 null")
        void invalidReturnsNull() {
            assertNull(RrnValidationUtil.toGender(null));
            assertNull(RrnValidationUtil.toGender(""));
            assertNull(RrnValidationUtil.toGender("12"));
        }

        @Test
        @DisplayName("5~9 → null (입력은 1~4만 허용, 유틸은 1~4만 처리)")
        void outOfRangeReturnsNull() {
            assertNull(RrnValidationUtil.toGender("5"));
            assertNull(RrnValidationUtil.toGender("0"));
        }
    }

    @Nested
    @DisplayName("toPlainRrnForStorage")
    class ToPlainRrnForStorage {

        @Test
        @DisplayName("앞6+뒤1 결합 문자열 반환")
        void concatenation() {
            assertThat(RrnValidationUtil.toPlainRrnForStorage("900101", "1")).isEqualTo("9001011");
        }

        @Test
        @DisplayName("null 입력 시 null")
        void nullReturnsNull() {
            assertNull(RrnValidationUtil.toPlainRrnForStorage(null, "1"));
            assertNull(RrnValidationUtil.toPlainRrnForStorage("900101", null));
        }

        @Test
        @DisplayName("길이 불일치 시 null")
        void invalidLengthReturnsNull() {
            assertNull(RrnValidationUtil.toPlainRrnForStorage("90010", "1"));
            assertNull(RrnValidationUtil.toPlainRrnForStorage("900101", ""));
        }
    }
}
