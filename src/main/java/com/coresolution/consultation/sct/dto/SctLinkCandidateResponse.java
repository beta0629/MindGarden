package com.coresolution.consultation.sct.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 배정 후보(자동 연결 금지, 후보만).
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SctLinkCandidateResponse {
    private Long clientId;
    private String maskedName;
    private String matchChannel;
}
