package com.coresolution.consultation.dto;

import java.time.Duration;
import com.fasterxml.jackson.annotation.JsonCreator;

/**
 * BW-1 「푸시 설정 모니터링」조회 범위.
 *
 * <p>스냅샷 GET 엔드포인트({@code /api/v1/admin/notifications/monitoring/snapshot})
 * 의 {@code range} 쿼리 파라미터 enum. 디자이너 핸드오프 §1 / §4.2 / §9.1 의 토글
 * (24시간 / 7일 / 30일) 과 1:1 매핑된다.
 *
 * @author MindGarden
 * @since 2026-06-07
 */
public enum PushMonitoringRange {

    /** 최근 24시간. */
    H24(Duration.ofHours(24)),
    /** 최근 7일 (기본). */
    D7(Duration.ofDays(7)),
    /** 최근 30일. */
    D30(Duration.ofDays(30));

    private final Duration window;

    PushMonitoringRange(Duration window) {
        this.window = window;
    }

    /**
     * @return 윈도우 길이(현재시각 기준 과거로 적용).
     */
    public Duration getWindow() {
        return window;
    }

    /**
     * Jackson 역직렬화 — 미지원 값은 {@code null} 로 반환해 컨트롤러가 400 처리하도록 한다.
     *
     * @param value JSON 문자열
     * @return enum 또는 {@code null}(미지원 값)
     */
    @JsonCreator
    public static PushMonitoringRange fromJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase();
        for (PushMonitoringRange r : values()) {
            if (r.name().equals(normalized)) {
                return r;
            }
        }
        return null;
    }
}
