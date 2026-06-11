package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.auth.AppleSignInRequest;
import com.coresolution.consultation.dto.auth.AppleSignInResponse;

/**
 * Sign in with Apple (SIWA) 전용 로그인/가입 서비스.
 *
 * <p>Apple App Store 4.8 (Login Services) 대응 — T1 트랙. 기존 카카오·네이버 흐름
 * ({@link OAuth2Service})과 별도 파이프라인으로, identityToken 우선 검증 (native iOS)
 * 또는 authorization_code 콜백 (웹) 양쪽을 지원한다.</p>
 *
 * <p>분기 책임 (2026-06-08 재정렬):
 * <ul>
 *   <li>{@code apple_sub} 일치 사용자 → JWT 발급 (기존 로그인)</li>
 *   <li>매칭 없음 → {@code requiresPhoneVerification=true} + {@code phoneVerificationToken} 응답</li>
 * </ul>
 * </p>
 *
 * <p>휴대폰 매칭으로 통일 — 카카오·네이버로 가입된 user 라도 휴대폰이 일치할 때만 자동 매칭한다.
 * 기존 (b) email 매칭 분기는 제거됐다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
public interface AppleSignInService {

    /**
     * Apple identityToken 을 검증하고 신규/기존 사용자 분기를 수행한 뒤 JWT 를 발급한다.
     *
     * @param request Apple SIWA 요청 본문 (identityToken 필수, nonce/name/email 선택)
     * @return 로그인 결과 (success=true 시 accessToken+refreshToken+user, 검증 실패 시 success=false+message)
     */
    AppleSignInResponse signIn(AppleSignInRequest request);

    /**
     * Apple 웹 콜백(authorization_code) 흐름 — {@code authorization_code} 로
     * Apple `/auth/token` 을 호출해 identityToken 을 받은 뒤 {@link #signIn(AppleSignInRequest)}
     * 와 동일한 분기 로직을 수행한다.
     *
     * @param request Apple SIWA 요청 본문 (authorizationCode 필수)
     * @return 로그인 결과
     */
    AppleSignInResponse callback(AppleSignInRequest request);

    /**
     * Apple 웹 server-side auth-code 흐름 — {@link #callback(AppleSignInRequest)} 와 동일하나
     * 호출자가 동적으로 결정한 {@code redirect_uri} 를 Apple {@code /auth/token} 호출에 전달한다.
     *
     * <p>멀티테넌트 와일드카드 환경에서 Apple authorize 단계와 token 교환 단계의 redirect_uri 가
     * 정확히 일치해야 한다. Google PR #204 server-side 패턴과 정합. {@code redirectUriOverride}
     * 가 null/blank 면 {@link com.coresolution.consultation.config.AppleOAuth2Properties} 의
     * 설정값으로 폴백한다.</p>
     *
     * @param request              Apple SIWA 요청 본문 (authorizationCode 필수)
     * @param redirectUriOverride  authorize 단계와 동일한 redirect_uri (apex 호스트, 동적 추론)
     * @return 로그인 결과
     */
    AppleSignInResponse callback(AppleSignInRequest request, String redirectUriOverride);
}
