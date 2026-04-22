package com.coresolution.consultation.dto;

import java.util.List;
import lombok.Builder;
import lombok.Value;

/**
 * 계정 선택 미리보기 응답.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
@Value
@Builder
public class OAuthAccountSelectionPreviewResponse {

    String provider;
    List<OAuthAccountSelectionPreviewItem> candidates;
}
