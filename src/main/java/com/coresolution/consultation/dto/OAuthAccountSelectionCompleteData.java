package com.coresolution.consultation.dto;

import lombok.Builder;
import lombok.Value;

/**
 * 계정 선택 완료 후 로그인 토큰·사용자 요약.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
@Value
@Builder
public class OAuthAccountSelectionCompleteData {

    String accessToken;
    String refreshToken;
    Long userId;
    String email;
    String name;
    String nickname;
    String role;
    String profileImageUrl;
    String tenantId;
    String providerUserId;
}
