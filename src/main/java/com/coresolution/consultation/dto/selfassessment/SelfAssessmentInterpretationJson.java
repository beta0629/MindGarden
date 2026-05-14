package com.coresolution.consultation.dto.selfassessment;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DB JSON 컬럼 매핑용 해석 객체.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SelfAssessmentInterpretationJson {

    private String level;
    private String severity;
    private String description;
}
