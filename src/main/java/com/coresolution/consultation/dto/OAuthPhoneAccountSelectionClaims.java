package com.coresolution.consultation.dto;

import java.util.List;
import lombok.Builder;
import lombok.Value;

/**
 * 전화 계정 선택용 단기 JWT에서 복원한 클레임.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
@Value
@Builder
public class OAuthPhoneAccountSelectionClaims {

    String tenantId;
    String provider;
    String providerUserId;
    List<Long> allowedUserIds;
    String snsAccessToken;
    String snsEmail;
    String snsName;
    String snsNickname;
    String snsPhone;
    String snsProfileImageUrl;

    /**
     * 소셜 연동 저장에 사용할 {@link SocialUserInfo}.
     *
     * @return SNS 프로필 + 액세스 토큰
     */
    public SocialUserInfo toSocialUserInfo() {
        SocialUserInfo info = SocialUserInfo.builder()
            .provider(provider)
            .providerUserId(providerUserId)
            .email(snsEmail)
            .name(snsName)
            .nickname(snsNickname)
            .phone(snsPhone)
            .profileImageUrl(snsProfileImageUrl)
            .accessToken(snsAccessToken)
            .build();
        if (info.getProvider() != null) {
            info.normalizeData();
        }
        return info;
    }
}
