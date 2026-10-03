package com.coresolution.consultation.util;

import java.util.List;
import java.util.regex.Pattern;

/**
 * 응답 본문에 실리는 사용자 문구에서 내부 값(식별자·기술 원문)을 걷어낸다.
 *
 * <p>예외 메시지는 디버깅용으로 {@code tenantId=...}, {@code roleId=null}, {@code userId=12} 같은
 * 세션·DB 식별자를 덧붙이는 경우가 많다. 이 문구가 그대로 4xx 응답으로 나가면 화면에 내부 값이 보이고
 * 다른 테넌트·사용자 식별자가 노출된다. 식별자는 로그에만 남기고 응답에서는 제거한다.</p>
 *
 * @author MindGarden
 * @since 2026-10-04
 */
public final class ClientMessageSanitizer {

    /** {@code xxxId=값} 형태의 내부 식별자 (앞의 구분자 포함해 통째로 제거) */
    private static final Pattern INTERNAL_IDENTIFIER = Pattern.compile(
            "(?<![A-Za-z0-9_])[A-Za-z_][A-Za-z0-9_]*[Ii][Dd]\\s*[=:]\\s*[^,;)\\]\\s]*");

    /** 제거 후 문장 끝에 남는 구분자 */
    private static final Pattern TRAILING_SEPARATORS = Pattern.compile("[\\s,:;(\\[{/-]+$");

    /** 제거 후 생기는 빈 구분자 반복 */
    private static final Pattern REPEATED_SEPARATORS = Pattern.compile("(?:\\s*,\\s*){2,}");

    /** 응답에 나가면 안 되는 기술 메시지 조각 (예외 원문·입력 원문·클래스명·SQL) */
    private static final List<String> TECHNICAL_MARKERS = List.of(
            "For input string", "No enum constant", "Unknown column", "could not execute",
            "java.", "javax.", "jakarta.", "org.springframework", "com.coresolution",
            "Exception", "SQL", "Caused by", "\tat ");

    private ClientMessageSanitizer() {
        throw new UnsupportedOperationException("utility");
    }

    /**
     * 사용자에게 보여줄 문구를 만든다.
     *
     * <p>기술 문구(예외 원문·클래스명·SQL)면 {@code fallback} 으로 바꾸고, 그렇지 않으면 내부 식별자만
     * 제거한다. 제거 후 남는 내용이 없으면 {@code fallback} 을 쓴다.</p>
     *
     * @param message  원본 메시지 (null 허용)
     * @param fallback 쓸 수 없을 때의 사용자 문구
     * @return 응답에 실어도 되는 문구
     */
    public static String toClientMessage(String message, String fallback) {
        if (message == null || message.isBlank()) {
            return fallback;
        }
        String trimmed = message.trim();
        if (containsTechnicalText(trimmed)) {
            return fallback;
        }
        String cleaned = stripInternalIdentifiers(trimmed);
        return cleaned.isBlank() ? fallback : cleaned;
    }

    /**
     * 기술 문구 포함 여부.
     *
     * @param message 메시지
     * @return 예외 원문·클래스명·SQL 조각이 있으면 {@code true}
     */
    public static boolean containsTechnicalText(String message) {
        if (message == null) {
            return false;
        }
        for (String marker : TECHNICAL_MARKERS) {
            if (message.contains(marker)) {
                return true;
            }
        }
        return false;
    }

    /**
     * {@code xxxId=값} 형태의 내부 식별자를 제거하고 남은 구분자를 정리한다.
     *
     * @param message 메시지
     * @return 식별자를 걷어낸 문구
     */
    public static String stripInternalIdentifiers(String message) {
        if (message == null) {
            return null;
        }
        String cleaned = INTERNAL_IDENTIFIER.matcher(message).replaceAll("");
        cleaned = REPEATED_SEPARATORS.matcher(cleaned).replaceAll(", ");
        cleaned = TRAILING_SEPARATORS.matcher(cleaned).replaceAll("");
        return cleaned.trim();
    }
}
