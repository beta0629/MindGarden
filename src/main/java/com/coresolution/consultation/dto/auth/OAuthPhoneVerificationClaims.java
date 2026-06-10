package com.coresolution.consultation.dto.auth;

import com.coresolution.consultation.entity.auth.OAuthProvider;
import lombok.Builder;
import lombok.Value;

/**
 * provider-agnostic OAuth 휴대폰 매칭 흐름 1단계 토큰({@code phoneVerificationToken}) 의 클레임.
 *
 * <p>발급 조건: 각 OAuth provider 가 native/콜백 흐름에서 provider sub 매칭 사용자가 없을 때 발급.
 * 클라이언트는 이 토큰을 가지고 휴대폰 입력 화면으로 이동하고, OTP send/verify 호출 시 함께 전송한다.</p>
 *
 * <p>Apple Private Relay 이메일·이름 등 provider 가 첫 로그인에만 제공하는 정보를 본 토큰에 박아둬,
 * verify 단계에서 신규 가입 분기에서 prefill 로 사용한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@Value
@Builder
public class OAuthPhoneVerificationClaims {

    /** 멀티테넌트 격리 — 발급 시점의 테넌트 ID. */
    String tenantId;

    /** OAuth provider 식별. */
    OAuthProvider oauthProvider;

    /** provider 별 sub (Apple identityToken.sub / Google sub / Kakao id / Naver id 등). */
    String providerUserId;

    /** provider 가 첫 로그인에 제공한 이메일(정규화 전 — 저장은 verify 단계에서 정규화). */
    String email;

    /** provider 가 첫 로그인에 제공한 이름. */
    String name;

    /** 표시용 닉네임(없으면 name 과 동일). */
    String nickname;

    /**
     * provider 가 첫 로그인에 제공한 프로필 이미지 URL.
     *
     * <p>2026-06-10 P1: Google/Kakao/Naver/Apple 4종 모두 신규 가입 시 users.profile_image_url 백필
     * 가능하도록 prefill 클레임으로 토큰에 박는다. 누락 허용(null).</p>
     */
    String profileImageUrl;
}
