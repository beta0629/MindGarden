package com.coresolution.consultation.dto;

import lombok.Data;

/**
 * OAuth 전화 계정 선택 완료 요청.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
@Data
public class OAuthAccountSelectionCompleteRequest {

    private String selectionToken;
    private Long selectedUserId;
}
