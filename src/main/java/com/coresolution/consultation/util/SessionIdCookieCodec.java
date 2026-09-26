package com.coresolution.consultation.util;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import com.coresolution.consultation.constant.SessionManagementConstants;

/**
 * Spring Session Redis {@code DefaultCookieSerializer(useBase64Encoding=true)} 쿠키 값과
 * {@code HttpSession.getId()} / {@code user_sessions.session_id}(raw) 사이의 인코딩 차이를 정규화한다.
 *
 * <p>쿠키 JSESSIONID 는 Base64(UTF-8 sessionId) 이고 DB·세션 ID 는 raw 인 경우가 많다.
 * 조회 키 불일치로 잠깐 200→401·복원 실패가 나는 레이스를 줄이기 위한 SSOT.</p>
 *
 * @author MindGarden
 * @since 2026-09-26
 */
public final class SessionIdCookieCodec {

    private SessionIdCookieCodec() {
    }

    /**
     * 쿠키·힌트 값을 {@code user_sessions} / {@code HttpSession.getId()} 에 쓰는 raw 세션 ID 로 정규화한다.
     * Base64 디코드가 가능하고 결과가 세션 ID로 보이면 디코드 값을, 아니면 원본을 반환한다.
     *
     * @param cookieOrSessionId 쿠키 JSESSIONID 또는 raw 세션 ID (nullable)
     * @return 정규화된 세션 ID, 입력이 null/blank 이면 그대로
     */
    public static String toCanonicalSessionId(String cookieOrSessionId) {
        if (cookieOrSessionId == null || cookieOrSessionId.isBlank()) {
            return cookieOrSessionId;
        }
        String trimmed = cookieOrSessionId.trim();
        String decoded = tryDecodeBase64Utf8(trimmed);
        if (decoded != null && isPlausibleSessionId(decoded) && !decoded.equals(trimmed)) {
            return decoded;
        }
        return trimmed;
    }

    /**
     * 쿠키(또는 Base64) 값과 raw HttpSession ID 가 동일 세션인지 비교한다.
     *
     * @param cookieOrEncoded 쿠키 JSESSIONID (Base64 가능)
     * @param rawSessionId    {@link jakarta.servlet.http.HttpSession#getId()}
     * @return 동일 세션이면 true
     */
    public static boolean matches(String cookieOrEncoded, String rawSessionId) {
        if (cookieOrEncoded == null || rawSessionId == null) {
            return false;
        }
        if (cookieOrEncoded.equals(rawSessionId)) {
            return true;
        }
        if (toCanonicalSessionId(cookieOrEncoded).equals(rawSessionId)) {
            return true;
        }
        return encodeBase64Utf8(rawSessionId).equals(cookieOrEncoded.trim());
    }

    /**
     * DB {@code getActiveSession} 조회용 후보 키(원본 → canonical → Base64(canonical)).
     * 중복은 제거한다.
     *
     * @param hint 쿠키 또는 raw 세션 ID
     * @return 조회 후보 목록 (빈 입력이면 empty)
     */
    public static List<String> lookupCandidates(String hint) {
        if (hint == null || hint.isBlank()) {
            return List.of();
        }
        String trimmed = hint.trim();
        Set<String> ordered = new LinkedHashSet<>();
        ordered.add(trimmed);
        String canonical = toCanonicalSessionId(trimmed);
        ordered.add(canonical);
        ordered.add(encodeBase64Utf8(canonical));
        return new ArrayList<>(ordered);
    }

    /**
     * Spring Session DefaultCookieSerializer 와 동일한 UTF-8 → Base64 인코딩.
     *
     * @param rawSessionId raw 세션 ID
     * @return Base64 문자열
     */
    public static String encodeBase64Utf8(String rawSessionId) {
        if (rawSessionId == null) {
            return null;
        }
        return Base64.getEncoder().encodeToString(rawSessionId.getBytes(StandardCharsets.UTF_8));
    }

    private static String tryDecodeBase64Utf8(String value) {
        try {
            byte[] decoded = Base64.getDecoder().decode(value);
            return new String(decoded, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static boolean isPlausibleSessionId(String value) {
        int length = value.length();
        if (length < SessionManagementConstants.MIN_SESSION_ID_LENGTH
                || length > SessionManagementConstants.MAX_SESSION_ID_LENGTH) {
            return false;
        }
        for (int i = 0; i < length; i++) {
            char c = value.charAt(i);
            if (c < 0x20 || c > 0x7e) {
                return false;
            }
        }
        return true;
    }
}
