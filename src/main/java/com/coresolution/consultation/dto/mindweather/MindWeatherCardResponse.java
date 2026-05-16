package com.coresolution.consultation.dto.mindweather;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Value;

/**
 * Expo {@code MindWeatherCard} 정합 응답.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MindWeatherCardResponse {

    String id;
    @JsonAlias({"client_id"})
    Long clientId;
    @JsonProperty("clientName")
    @JsonAlias({"client_name"})
    String clientName;
    String source;
    String text;
    String summary;
    String tone;
    List<MindWeatherKeywordPayload> keywords;
    MindWeatherShareConsentResponse share;
    String createdAt;
}
