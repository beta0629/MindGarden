package com.coresolution.consultation.sct.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 공개·관리용 동의 상태.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctConsentStatusView {
    private String signerBand;
    private boolean requiresGuardian;
    private boolean sensitiveRequired;
    private boolean guardianRequired;
    private boolean selfSignatureRequired;
    private boolean childNameOptional;
    private boolean satisfied;
    private boolean revoked;
    private String sensitiveConsentTitle;
    private String sensitiveConsentBody;
    private String sensitiveConsentVersion;
    private String guardianConsentTitle;
    private String guardianConsentBody;
    private String guardianConsentVersion;
    private String guardianVerifyMode;
}
