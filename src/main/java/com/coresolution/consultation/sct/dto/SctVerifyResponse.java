package com.coresolution.consultation.sct.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 본인확인 성공 응답. 동의 문구는 form 403 전에 여기서 전달.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctVerifyResponse {
    private String verifySessionId;
    private int expiresInSeconds;
    private SctConsentStatusView consent;
}
