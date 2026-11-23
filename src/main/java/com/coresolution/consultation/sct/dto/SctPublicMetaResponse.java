package com.coresolution.consultation.sct.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 공개 메타(verify 전).
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
    private String maskedPhoneHint;
    private String maskedEmailHint;
    private LocalDateTime tokenExpiresAt;
    private Boolean hasDraft;
    private Boolean requiresGuardian;
}
