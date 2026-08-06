package com.coresolution.consultation.util;

/**
 * 로그 출력용 토큰(리셋·액세스·리프레시 등) 마스킹 유틸.
 *
 * <p>{@link EmailLogMasking}·{@link PhoneLogMasking}와 동일 계열로, 단순 문자열 변환만 수행하며
 * 외부 의존성·설정 기반 규칙은 갖지 않는다. 토큰 원문이 로그에 남지 않도록 한다.</p>
 *
 * <p>마스킹 규칙:</p>
 * <ul>
 *     <li>{@code null} → {@code null}</li>
 *     <li>빈 문자열 → 빈 문자열</li>
 *     <li>길이가 {@link #MIN_MASKABLE_LENGTH} 미만 → {@code ***} (짧은 비밀도 원문 노출 금지)</li>
 *     <li>그 외 → 앞 {@link #PREFIX_LENGTH}자 + {@code ...} + 뒤 {@link #SUFFIX_LENGTH}자</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-08-05
 */
public final class TokenLogMasking {

    private static final String MASK_SHORT = "***";
    private static final String MASK_MIDDLE = "...";

    /** 앞·뒤를 모두 노출해도 될 최소 길이(미만이면 전체 마스킹). */
    static final int MIN_MASKABLE_LENGTH = 12;

    /** 마스킹 시 앞에 남길 글자 수. */
    static final int PREFIX_LENGTH = 4;

    /** 마스킹 시 뒤에 남길 글자 수. */
    static final int SUFFIX_LENGTH = 4;

    private TokenLogMasking() {
    }

    /**
     * 로그용 토큰 마스킹.
     *
     * @param token 원본 토큰(평문)
     * @return 마스킹된 문자열({@code null}/빈 문자열은 그대로)
     */
    public static String maskForLog(String token) {
        if (token == null || token.isEmpty()) {
            return token;
        }
        if (token.length() < MIN_MASKABLE_LENGTH) {
            return MASK_SHORT;
        }
        return token.substring(0, PREFIX_LENGTH)
                + MASK_MIDDLE
                + token.substring(token.length() - SUFFIX_LENGTH);
    }
}
