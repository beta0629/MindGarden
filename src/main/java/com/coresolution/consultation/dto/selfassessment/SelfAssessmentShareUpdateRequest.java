package com.coresolution.consultation.dto.selfassessment;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 상담사 공유 여부 변경 PUT 본문.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Data
public class SelfAssessmentShareUpdateRequest {

    @NotNull
    private Boolean sharedWithConsultant;
}
