package com.coresolution.consultation.dto.mindweather;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

/**
 * Expo {@code MindWeatherShareConsent} 정합 응답.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MindWeatherShareConsentResponse {

    boolean summary;
    boolean original;
    Long consultantId;
    String updatedAt;
}
