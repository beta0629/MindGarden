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
    /** 초대 표시명(랜딩용). 전화·이메일은 포함하지 않음. */
    private String recipientName;
    /** 테넌트 system_config 사무실 문의. */
    private String officePhone;
    /** 테넌트 system_config 공개 휴대폰. */
    private String mobilePhone;
    /** 제출 완료 시각(SUBMITTED 랜딩 카피용). */
    private LocalDateTime submittedAt;
}
