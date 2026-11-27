package com.coresolution.consultation.sct.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 공개 메타(verify 전). 마스킹 전화/이메일 제거 — 채널 힌트만.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctPublicMetaResponse {
    private String formType;
    private String title;
    private String status;
    private int itemCount;
    /** PHONE / EMAIL — 마스킹 값 없음. */
    private String verifyChannelHint;
    private LocalDateTime tokenExpiresAt;
    private Boolean hasDraft;
    private Boolean requiresGuardian;
    private String signerBand;
    /** 본인확인용 연락처 동의 문구 제목. */
    private String identityConsentTitle;
    /** 본인확인용 연락처 동의 문구 본문. */
    private String identityConsentBody;
    /** 본인확인용 연락처 동의 템플릿 버전. */
    private String identityConsentVersion;
    /** 해당 초대에 활성 IDENTITY_CONTACT 동의 여부. */
    private Boolean identityConsentSatisfied;
}
