package com.coresolution.consultation.util;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import lombok.extern.slf4j.Slf4j;

/**
 * 쿼리 파라미터로 들어온 날짜·연월 문자열의 공통 검증기.
 *
 * <p>엔드포인트마다 {@code LocalDate.parse} / {@code Integer.parseInt} 를 흩어 두면 한쪽만 들어온
 * 경우가 검증을 빠져나가 잘못된 입력이 200 이나 raw 예외 문구가 섞인 400 으로 나간다. 날짜·연월
 * 파라미터는 모두 이 클래스를 거친다.</p>
 *
 * <p>형식 오류는 {@link DateTimeParseException}/{@link NumberFormatException} 으로 올리고,
 * {@code GlobalExceptionHandler} 가 사용자용 고정 문구({@code INVALID_DATE_FORMAT} ·
 * {@code INVALID_PARAMETER_TYPE})로 400 을 만든다. 입력 원문은 응답에 넣지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-10-04
 */
@Slf4j
public final class ApiRequestParams {

    private static final int MIN_MONTH = 1;
    private static final int MAX_MONTH = 12;
    private static final int MIN_YEAR = 1900;
    private static final int MAX_YEAR = 9999;

    private ApiRequestParams() {
        throw new UnsupportedOperationException("utility");
    }

    /**
     * 선택 날짜 파라미터를 {@link LocalDate} 로 바꾼다 (비어 있으면 {@code null}).
     *
     * @param rawValue  요청 값
     * @param paramName 로그용 파라미터 이름
     * @return 파싱한 날짜 또는 {@code null}
     * @throws DateTimeParseException 형식이 {@code yyyy-MM-dd} 가 아닐 때
     */
    public static LocalDate optionalDate(String rawValue, String paramName) {
        String trimmed = trimToNull(rawValue);
        if (trimmed == null) {
            return null;
        }
        try {
            return LocalDate.parse(trimmed);
        } catch (DateTimeParseException e) {
            log.warn("잘못된 날짜 파라미터: name={}, errorIndex={}", paramName, e.getErrorIndex());
            throw e;
        }
    }

    /**
     * 선택 날짜 파라미터를 검증만 하고 원래 문자열을 돌려준다 (문자열을 받는 서비스용).
     *
     * @param rawValue  요청 값
     * @param paramName 로그용 파라미터 이름
     * @return 공백을 제거한 날짜 문자열 또는 {@code null}
     * @throws DateTimeParseException 형식이 {@code yyyy-MM-dd} 가 아닐 때
     */
    public static String optionalDateText(String rawValue, String paramName) {
        LocalDate parsed = optionalDate(rawValue, paramName);
        return parsed != null ? parsed.toString() : null;
    }

    /**
     * 연도 파라미터를 검증한다. 비어 있으면 {@code defaultYear} 를 쓴다.
     *
     * @param rawValue    요청 값
     * @param paramName   로그용 파라미터 이름
     * @param defaultYear 값이 없을 때 쓸 연도
     * @return 검증한 연도 문자열
     * @throws NumberFormatException 숫자가 아니거나 범위를 벗어났을 때
     */
    public static String yearText(String rawValue, String paramName, int defaultYear) {
        String trimmed = trimToNull(rawValue);
        if (trimmed == null) {
            return String.valueOf(defaultYear);
        }
        int year = parseInt(trimmed, paramName);
        if (year < MIN_YEAR || year > MAX_YEAR) {
            log.warn("연도 파라미터 범위 초과: name={}", paramName);
            throw new NumberFormatException("year out of range");
        }
        return String.valueOf(year);
    }

    /**
     * 월 파라미터를 검증한다. 비어 있으면 {@code defaultMonth} 를 쓴다.
     *
     * @param rawValue     요청 값
     * @param paramName    로그용 파라미터 이름
     * @param defaultMonth 값이 없을 때 쓸 월
     * @return 검증한 월 문자열
     * @throws NumberFormatException 숫자가 아니거나 1~12 범위를 벗어났을 때
     */
    public static String monthText(String rawValue, String paramName, int defaultMonth) {
        String trimmed = trimToNull(rawValue);
        if (trimmed == null) {
            return String.valueOf(defaultMonth);
        }
        int month = parseInt(trimmed, paramName);
        if (month < MIN_MONTH || month > MAX_MONTH) {
            log.warn("월 파라미터 범위 초과: name={}", paramName);
            throw new NumberFormatException("month out of range");
        }
        return String.valueOf(month);
    }

    private static int parseInt(String trimmed, String paramName) {
        try {
            return Integer.parseInt(trimmed);
        } catch (NumberFormatException e) {
            log.warn("숫자가 아닌 파라미터: name={}", paramName);
            throw e;
        }
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
