package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 정원 성장 이벤트 적재 요청 본문.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Data
public class MindGardenEventRequest {

    /**
     * {@link com.coresolution.consultation.constant.GardenGrowthEventType} 이름과 동일한 문자열.
     */
    @NotBlank
    private String eventType;

    /**
     * 멱등 키 구성용 — 있으면 eventType 과 조합하여 중복 적용을 막는다.
     */
    private String sourceId;

    /**
     * 클라이언트 발생 시각(ISO-8601). MVP 에서는 감사 로그 미연계 시 무시 가능.
     */
    private String occurredAt;
}
