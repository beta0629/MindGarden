package com.coresolution.consultation.dto;

import lombok.Builder;
import lombok.Value;

/**
 * 계정 선택 라디오 한 줄.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
@Value
@Builder
public class OAuthAccountSelectionPreviewItem {

    long userId;
    String role;
    /** 짧은 역할 표시(예: 관리자, 상담사). */
    String roleDisplayLabel;
    /** 로그인 후 이동할 대시보드 안내. */
    String dashboardGuide;
    String optionLabel;
}
