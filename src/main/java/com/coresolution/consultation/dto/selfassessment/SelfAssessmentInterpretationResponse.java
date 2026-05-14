package com.coresolution.consultation.dto.selfassessment;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

/**
 * Expo {@code AssessmentInterpretation}.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SelfAssessmentInterpretationResponse {

    String level;
    String severity;
    String description;
}
