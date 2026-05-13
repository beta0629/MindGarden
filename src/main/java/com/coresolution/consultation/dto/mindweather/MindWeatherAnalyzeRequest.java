package com.coresolution.consultation.dto.mindweather;

import com.coresolution.consultation.constant.MindWeatherConstants;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * {@code POST /api/v1/mind-weather/analyze} 요청 바디.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Data
public class MindWeatherAnalyzeRequest {

    @NotBlank
    @Size(min = MindWeatherConstants.TEXT_MIN_LENGTH, max = MindWeatherConstants.TEXT_MAX_LENGTH)
    private String text;

    @NotBlank
    private String source;

    private String sourceRefId;
}
