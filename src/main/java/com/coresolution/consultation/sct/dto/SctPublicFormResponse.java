package com.coresolution.consultation.sct.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 공개 양식+임시답(필수 동의 충족 후).
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
    private String headerFieldsJson;
    private String status;
    private Boolean requiresGuardian;
    private String signerBand;
    private SctConsentStatusView consent;
    private List<SctAnswerView> items;
}
