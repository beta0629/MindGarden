package com.coresolution.consultation.dto.selfassessment;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

/**
 * Expo {@code AssessmentResult}.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SelfAssessmentResultResponse {

    String id;
    String type;
    List<Integer> answers;
    int totalScore;
    SelfAssessmentInterpretationResponse interpretation;
    boolean sharedWithConsultant;
    String createdAt;
}
