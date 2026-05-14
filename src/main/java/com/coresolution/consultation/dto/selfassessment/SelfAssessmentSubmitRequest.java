package com.coresolution.consultation.dto.selfassessment;

import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 자가검사 제출 POST 본문.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Data
public class SelfAssessmentSubmitRequest {

    @NotBlank
    private String type;

    @NotNull
    private List<Integer> answers;

    @NotNull
    private Boolean sharedWithConsultant;
}
