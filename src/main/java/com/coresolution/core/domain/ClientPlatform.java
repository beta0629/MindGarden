package com.coresolution.core.domain;

import org.springframework.util.StringUtils;

import java.util.Locale;

/**
 * LNB/메뉴 권한 필터용 클라이언트 플랫폼.
 *
 * <p>{@code X-Client-Platform} 헤더 값: {@code ios|android|web}. 미지정·알 수 없음 → {@link #WEB}.</p>
 *
 * @author CoreSolution
 * @since 2026-09-12
 */
public enum ClientPlatform {

    IOS,
    ANDROID,
    WEB;

    public static final String HEADER_NAME = "X-Client-Platform";

    /**
     * 헤더/쿼리 문자열을 플랫폼으로 파싱한다. blank·unknown → WEB.
     *
     * @param raw 헤더 또는 쿼리 값
     * @return 정규화된 플랫폼
     */
    public static ClientPlatform fromHeader(String raw) {
        if (!StringUtils.hasText(raw)) {
            return WEB;
        }
        String normalized = raw.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "ios", "iphone", "ipad" -> IOS;
            case "android", "aos" -> ANDROID;
            case "web", "browser" -> WEB;
            default -> WEB;
        };
    }
}
