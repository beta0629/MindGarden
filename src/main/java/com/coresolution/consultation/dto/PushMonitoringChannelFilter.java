package com.coresolution.consultation.dto;

import com.fasterxml.jackson.annotation.JsonCreator;

/**
 * BW-1 「푸시 설정 모니터링」 채널 필터.
 *
 * <p>스냅샷 GET 엔드포인트({@code /api/v1/admin/notifications/monitoring/snapshot})
 * 의 {@code channel} 쿼리 파라미터 enum. 디자이너 핸드오프 §1 / §4.2 / §10
 * (PUSH 채널 = 어드민 수동 발송 한정 가드) 와 1:1 매핑된다.
 *
 * <p>{@link #ALL} 은 모집단 전체(알림톡 + SMS + PUSH).
 *
 * @author MindGarden
 * @since 2026-06-07
 */
public enum PushMonitoringChannelFilter {

    /** 전체 채널 (default). */
    ALL,
    /** 카카오 알림톡 채널. */
    ALIMTALK,
    /** SMS 채널. */
    SMS,
    /** PUSH 채널 — 어드민 수동 발송 한정(D4 가드). */
    PUSH;

    /**
     * Jackson 역직렬화 — 미지원 값은 {@code null} 로 반환해 컨트롤러가 400 처리하도록 한다.
     *
     * @param value JSON 문자열
     * @return enum 또는 {@code null}(미지원 값)
     */
    @JsonCreator
    public static PushMonitoringChannelFilter fromJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase();
        for (PushMonitoringChannelFilter c : values()) {
            if (c.name().equals(normalized)) {
                return c;
            }
        }
        return null;
    }
}
