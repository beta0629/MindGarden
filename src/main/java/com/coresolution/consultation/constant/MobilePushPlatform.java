package com.coresolution.consultation.constant;

import java.util.Locale;
import java.util.Optional;

/**
 * Expo {@code Platform.OS} 정규화 값 — 모바일 푸시 토큰 등록 API.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
public enum MobilePushPlatform {

    IOS("ios"),
    ANDROID("android");

    private final String code;

    MobilePushPlatform(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    /**
     * 클라이언트 문자열을 ios|android 로 파싱한다.
     *
     * @param raw 플랫폼 문자열
     * @return 매칭 시 enum, 없으면 empty
     */
    public static Optional<MobilePushPlatform> parse(String raw) {
        if (raw == null) {
            return Optional.empty();
        }
        String n = raw.trim().toLowerCase(Locale.ROOT);
        for (MobilePushPlatform p : values()) {
            if (p.code.equals(n)) {
                return Optional.of(p);
            }
        }
        return Optional.empty();
    }
}
