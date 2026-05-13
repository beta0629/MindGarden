package com.coresolution.consultation.dto.mindweather;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DB JSON·API 응답 공용 키워드 페이로드 (Expo {@code MindWeatherKeyword} 정합).
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MindWeatherKeywordPayload {

    private String key;
    private String label;
    private double weight;
    private int polarity;
}
