package com.coresolution.consultation.dto.mindweather;

import lombok.Data;

/**
 * {@code POST /api/v1/mind-weather/{id}/share} 요청 바디 (Expo {@code shareSummary}/{@code shareOriginal}).
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Data
public class MindWeatherShareRequest {

    private boolean shareSummary;

    private boolean shareOriginal;

    private Long consultantId;
}
