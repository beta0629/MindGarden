package com.coresolution.consultation.sct.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 공개 동의 요청.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctConsentRequest {
    @NotBlank
    private String verifySessionId;
    @NotBlank
    private String consentType;
    @NotNull
    private Boolean agreed;
    private String guardianName;
    private String guardianRelation;
}
