package com.coresolution.consultation.constant;

/**
 * 모바일 푸시 API 공통 상수(길이·알고리즘명 등).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
public final class MobilePushConstants {

    private MobilePushConstants() {
    }

    /** push_token 원문 최대 길이 (바이트 단위 검증은 생략, 문자 길이 상한) */
    public static final int PUSH_TOKEN_MAX_CHARS = 8192;

    /** token_sha256 컬럼 길이와 동일 */
    public static final int TOKEN_SHA256_HEX_LENGTH = 64;

    public static final String SHA256 = "SHA-256";
}
