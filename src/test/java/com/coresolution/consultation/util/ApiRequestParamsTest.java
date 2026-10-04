package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * 날짜·연월 파라미터 공통 검증기 — 한쪽만 와도 형식을 검증하는지 확인한다.
 *
 * @author MindGarden
 * @since 2026-10-04
 */
@DisplayName("ApiRequestParams — 날짜·연월 파라미터 공통 검증")
class ApiRequestParamsTest {

    @Test
    @DisplayName("비어 있는 날짜는 null (선택 파라미터)")
    void blankDateIsNull() {
        assertThat(ApiRequestParams.optionalDate(null, "startDate")).isNull();
        assertThat(ApiRequestParams.optionalDate("  ", "startDate")).isNull();
        assertThat(ApiRequestParams.optionalDateText(null, "startDate")).isNull();
    }

    @Test
    @DisplayName("정상 날짜는 파싱 — 상대 파라미터가 없어도 검증한다")
    void parsesDate() {
        assertThat(ApiRequestParams.optionalDate("2026-01-31", "startDate"))
            .isEqualTo(LocalDate.of(2026, 1, 31));
        assertThat(ApiRequestParams.optionalDateText(" 2026-01-31 ", "startDate")).isEqualTo("2026-01-31");
    }

    @ParameterizedTest(name = "[{index}] startDate={0} → DateTimeParseException")
    @ValueSource(strings = {"bad", "2026-13-45", "2026/01/31", "20260131"})
    @DisplayName("한쪽 날짜만 들어와도 형식이 틀리면 거부한다 (200 으로 빠져나가지 않음)")
    void rejectsBadDate(String raw) {
        assertThatThrownBy(() -> ApiRequestParams.optionalDate(raw, "startDate"))
            .isInstanceOf(DateTimeParseException.class);
    }

    @Test
    @DisplayName("연·월은 비면 기본값, 값이 있으면 숫자·범위 검증")
    void yearAndMonthDefaults() {
        assertThat(ApiRequestParams.yearText(null, "year", 2026)).isEqualTo("2026");
        assertThat(ApiRequestParams.yearText(" 2025 ", "year", 2026)).isEqualTo("2025");
        assertThat(ApiRequestParams.monthText(null, "month", 3)).isEqualTo("3");
        assertThat(ApiRequestParams.monthText("12", "month", 3)).isEqualTo("12");
    }

    @ParameterizedTest(name = "[{index}] year={0} → NumberFormatException")
    @ValueSource(strings = {"abc", "20x6", "1899", "10000", "-1"})
    @DisplayName("숫자가 아니거나 범위를 벗어난 연도는 거부한다")
    void rejectsBadYear(String raw) {
        assertThatThrownBy(() -> ApiRequestParams.yearText(raw, "year", 2026))
            .isInstanceOf(NumberFormatException.class);
    }

    @ParameterizedTest(name = "[{index}] month={0} → NumberFormatException")
    @ValueSource(strings = {"abc", "0", "13", "99"})
    @DisplayName("숫자가 아니거나 1~12 가 아닌 월은 거부한다")
    void rejectsBadMonth(String raw) {
        assertThatThrownBy(() -> ApiRequestParams.monthText(raw, "month", 3))
            .isInstanceOf(NumberFormatException.class);
    }
}
