package com.coresolution.consultation.dto;

import com.fasterxml.jackson.annotation.JsonCreator;

/**
 * BW-1 「푸시 설정 모니터링」채널 필터.
 *
 * <p>{@link #ALL} 은 전체, 그 외는 {@link TestNotificationChannel} 과 1:1 매핑한다.
 * 디자이너 핸드오프 §4.2 의 채널 SegmentedTabs 와 1:1 매핑.
 *
 * @author MindGarden
 * @since 2026-06-07
 */
public enum PushMonitoringChannelFilter {
    /** 전체 채널 (기본). */
    ALL,
    /** 카카오 알림톡. */
    ALIMTALK,
    /** SMS. */
    SMS,
    /** 모바일 PUSH (어드민 수동 한정 — Phase 1 explore 결론). */
    PUSH;

    /**
     * Jackson 역직렬화 — 미지원 값은 {@code null} 반환.
     *
     * @param value JSON 문자열
     * @return enum 또는 {@code null}
     */
    @JsonCreator
    public static PushMonitoringChannelFilter fromJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase();
        for (PushMonitoringChannelFilter f : values()) {
            if (f.name().equals(normalized)) {
                return f;
            }
        }
        return null;
    }

    /**
     * @return ALL 이면 {@code null}, 그 외 매핑되는 {@link TestNotificationChannel}
     */
    public TestNotificationChannel toTestChannel() {
        if (this == ALL) {
            return null;
        }
        return TestNotificationChannel.valueOf(this.name());
    }
}
