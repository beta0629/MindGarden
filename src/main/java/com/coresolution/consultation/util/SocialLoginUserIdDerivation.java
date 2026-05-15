package com.coresolution.consultation.util;

/**
 * SNS 정규화 이메일에서 {@code users.user_id} 생성 규칙을 공유한다.
 * {@link com.coresolution.consultation.service.impl.SocialAuthServiceImpl} 의 이메일 기반 userId 규칙과 동일해야 한다.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public final class SocialLoginUserIdDerivation {

    private SocialLoginUserIdDerivation() {
    }

    /**
     * 정규화된 이메일(소문자·trim)에서 로그인용 {@code user_id} 문자열을 파생한다.
     * <p>
     * {@code @} 앞 로컬파트에서 {@code [^a-zA-Z0-9_]} 제거, 3자 미만이면 {@code user_} 접두, 최대 50자.
     *
     * @param normalizedEmail {@link SocialProvider#normalizeEmail(String)} 결과 또는 동등 규격(null·공백 허용)
     * @return 파생 id, 입력이 null·blank이면 빈 문자열
     */
    public static String deriveLoginUserIdFromNormalizedEmail(String normalizedEmail) {
        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            return "";
        }
        String userId = normalizedEmail.split("@")[0];
        userId = userId.replaceAll("[^a-zA-Z0-9_]", "");
        if (userId.length() < 3) {
            userId = "user_" + userId;
        }
        if (userId.length() > 50) {
            userId = userId.substring(0, 50);
        }
        return userId;
    }
}
