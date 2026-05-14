package com.coresolution.consultation.dto.community;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 어드민 검수 승인·반려.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Data
public class CommunityModerationPatchRequest {

    public enum Decision {
        APPROVE,
        REJECT
    }

    @NotNull
    private Decision decision;

    @Size(max = 64)
    private String reasonCode;

    @Size(max = 500)
    private String note;
}
