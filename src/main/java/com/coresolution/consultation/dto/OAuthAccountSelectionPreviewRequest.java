package com.coresolution.consultation.dto;

import lombok.Data;

/**
 * OAuth 전화 계정 선택 미리보기 요청.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
@Data
public class OAuthAccountSelectionPreviewRequest {

    private String selectionToken;
}
