package com.coresolution.consultation.sct.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    /** 단말 쿠키 이름 접미(초대·테넌트 해시). 응답 본문에는 싣지 않는다. */
    @JsonIgnore
    private String deviceCookieRef;
}
