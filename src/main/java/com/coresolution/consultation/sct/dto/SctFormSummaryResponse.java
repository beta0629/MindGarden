package com.coresolution.consultation.sct.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SCT 양식 요약.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctFormSummaryResponse {
    private Long formTemplateId;
    private String formType;
    private String formVersion;
    private String title;
    private String targetDesc;
    private int itemCount;
}
