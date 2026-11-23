package com.coresolution.consultation.sct.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 공개 양식+임시답.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctPublicFormResponse {
    private String formType;
    private String title;
    private String instructionText;
    private String status;
    private Boolean requiresGuardian;
    private Boolean sensitiveConsentRequired;
    private Boolean guardianConsentRequired;
    private String sensitiveConsentTitle;
    private String sensitiveConsentBody;
    private String guardianConsentTitle;
    private String guardianConsentBody;
    private List<SctAnswerView> items;
}
