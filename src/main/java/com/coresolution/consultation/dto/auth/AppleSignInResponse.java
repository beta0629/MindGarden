package com.coresolution.consultation.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Sign in with Apple (SIWA) 로그인/가입 응답 본문.
 *
 * <p>기존 카카오·네이버 소셜 로그인과 동일하게 JWT(access/refresh)·사용자 요약을 반환한다.
 * 신규 사용자 가입 분기에서는 {@code requiresSignup=true} 와 함께 {@link AppleSocialUserInfo} 가 채워진다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppleSignInResponse {

    /** 인증 결과 (true = 로그인 성공 또는 가입 필요 신호 정상 반환, false = 검증 실패). */
    private boolean success;

    /** 신규 사용자 분기 (true 면 클라이언트가 social-signup 화면으로 이동). */
    private boolean requiresSignup;

    /** 사용자 알림용 메시지. */
    private String message;

    /** JWT access token (기존 로그인 흐름과 동일). */
    private String accessToken;

    /** JWT refresh token. */
    private String refreshToken;

    /** 로그인한 사용자 요약 (가입이 완료된 경우에만 채워짐). */
    private AppleUserSummary user;

    /** 신규 가입 분기에서 클라이언트가 사용할 social user 정보. */
    private AppleSocialUserInfo socialUserInfo;
}
