package com.coresolution.consultation.constant;

/**
 * Apple G1.2 UGC — EULA(이용약관) 버전 상수.
 *
 * <p>P2-C 시안 §E 약관 텍스트 초안(38줄)의 현재 시행 버전.
 * 약관 본문 변경 시 이 버전을 올리고 사용자의 재동의를 받는다 (FE 게이트와 동기).
 * 프론트엔드는 {@code expo-app/src/constants/eulaTerms.ts} 의
 * {@code EULA_CURRENT_VERSION} 과 동일 값을 유지한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
public final class EulaVersion {

    /** P2-C 시안 기준 최초 시행 버전. */
    public static final String CURRENT = "1.0.0";

    /** 시행일 (ISO-8601 date). */
    public static final String EFFECTIVE_DATE = "2026-06-11";

    private EulaVersion() {
    }
}
