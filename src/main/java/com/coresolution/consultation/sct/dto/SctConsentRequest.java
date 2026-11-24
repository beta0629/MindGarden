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
    /** 본인 서명 성명(성인·14세↑). */
    private String signerName;
    private String guardianName;
    private String guardianRelation;
    /** 아동 이름 확인(선택). */
    private String childNameConfirm;
}
