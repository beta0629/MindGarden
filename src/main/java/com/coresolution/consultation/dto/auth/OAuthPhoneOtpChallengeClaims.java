package com.coresolution.consultation.dto.auth;

import com.coresolution.consultation.entity.auth.OAuthProvider;
import lombok.Builder;
import lombok.Value;

/**
 * provider-agnostic OAuth 휴대폰 매칭 흐름 2단계 토큰({@code challengeToken}) 의 클레임.
 *
 * <p>발급 조건: {@code POST /api/v1/oauth/phone/send} 호출 성공 시 응답 본문에 포함.
 * 클라이언트는 이 토큰을 verify 호출 시 함께 보내야 한다 — phoneVerificationToken 만으로는
 * 어떤 phone 으로 OTP 가 발송됐는지 모르기 때문에, 본 토큰이 (phone_hash, otp_id) 를 묶어
 * 다른 phone 으로의 verify 우회를 차단한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@Value
@Builder
public class OAuthPhoneOtpChallengeClaims {

    /** 멀티테넌트 격리. */
    String tenantId;

    /** OAuth provider 식별 — phoneVerificationToken 과 일치 검증용. */
    OAuthProvider oauthProvider;

    /** provider sub — phoneVerificationToken 과 일치 검증용. */
    String providerUserId;

    /** 정규화 phone 의 SHA-256 hex (소문자) — 다른 phone 으로의 verify 차단. */
    String phoneHash;

    /**
     * 정규화 phone (digits only). 서버 서명된 단기 JWT 안에만 머무르고 클라이언트에 노출되지 않는다.
     * verify 단계에서 user 후보 조회용으로 사용 — DB row 에는 hash 만 저장하므로 본 클레임이 SSOT.
     */
    String normalizedPhone;

    /** {@code phone_otp_attempts.id} — DB row 단건 조회 용. */
    Long otpId;
}
