package com.coresolution.core.util;

/**
 * 로그 인젝션 방어 유틸.
 *
 * <p>사용자 입력 문자열을 로그에 출력하기 전 CR/LF/탭 및 기타 제어 문자를 안전한
 * 문자(_)로 치환하여 CRLF Injection(가짜 로그 라인 삽입) 공격을 차단한다.
 * 또한 200자를 초과하는 입력은 잘라내어 로그 DoS 위험을 줄인다.</p>
 *
 * <p>CodeQL Log Injection 규칙(java/log-injection) 대응.</p>
 *
 * @author CoreSolution
 * @since 2026-06-12
 */
public final class LogSanitizer {

    /** 로그에 출력할 최대 길이. 초과 시 truncate + "..." 부가. */
    private static final int MAX_LENGTH = 200;

    /** 입력이 null 인 경우 출력할 문자열. */
    private static final String NULL_LITERAL = "null";

    /** truncate 시 부가할 접미사. */
    private static final String TRUNCATE_SUFFIX = "...";

    /** 제어 문자 매칭 패턴(0x00-0x1F, 0x7F 등 Unicode Cntrl). */
    private static final String CONTROL_CHAR_REGEX = "\\p{Cntrl}";

    /** 제어 문자를 치환할 안전 문자. */
    private static final String SAFE_REPLACEMENT = "_";

    private LogSanitizer() {
        // 유틸 클래스 — 인스턴스화 금지
    }

    /**
     * 로그 출력용 문자열 sanitize.
     *
     * <ul>
     *   <li>{@code null} → 문자열 "null" 반환</li>
     *   <li>{@link #MAX_LENGTH}(200)자 초과 → 잘라낸 뒤 "..." 부가</li>
     *   <li>CR/LF/TAB 및 기타 제어 문자(0x00-0x1F, 0x7F) → "_"로 치환</li>
     * </ul>
     *
     * @param input 사용자 입력 등 신뢰할 수 없는 문자열
     * @return 로그에 안전하게 출력할 수 있는 문자열
     */
    public static String forLog(String input) {
        if (input == null) {
            return NULL_LITERAL;
        }
        String truncated = input.length() > MAX_LENGTH
                ? input.substring(0, MAX_LENGTH) + TRUNCATE_SUFFIX
                : input;
        return truncated.replaceAll(CONTROL_CHAR_REGEX, SAFE_REPLACEMENT);
    }
}
