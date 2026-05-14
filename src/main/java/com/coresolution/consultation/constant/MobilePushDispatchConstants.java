package com.coresolution.consultation.constant;

/**
 * 모바일 푸시 배치·HTTP 발송 상한.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
public final class MobilePushDispatchConstants {

    private MobilePushDispatchConstants() {
    }

    /** Expo Push API 단일 요청당 메시지 상한(문서 권장). */
    public static final int EXPO_MESSAGES_PER_REQUEST_MAX = 100;

    /** data 맵 키·값 문자열 상한(과도한 페이로드 방지). */
    public static final int DATA_STRING_MAX_LENGTH = 256;

    /** 푸시 본문 상한. */
    public static final int BODY_MAX_LENGTH = 512;

    /** 제목 상한. */
    public static final int TITLE_MAX_LENGTH = 120;
}
