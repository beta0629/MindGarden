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
    /**
     * 본인확인 세션 ID.
     * IDENTITY_CONTACT 는 세션 없이 토큰 기준으로 기록하므로 null 허용.
     * 그 외 유형은 서비스에서 필수 검증.
     */
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
