package com.coresolution.consultation.dto.moodjournal;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

/**
 * Expo {@code MoodStat} — {@code date}, {@code value}.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MoodStatRowResponse {

    String date;
    int value;
}
