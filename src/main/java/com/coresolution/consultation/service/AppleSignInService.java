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
 * <p>분기 책임:
 * <ul>
 *   <li>{@code apple_sub} 기존 사용자 → JWT 발급 + lifecycle 검사</li>
 *   <li>{@code apple_sub} 신규 + email 기존 사용자 → {@code apple_sub} 연결 후 JWT 발급</li>
 *   <li>{@code apple_sub} 신규 + email 신규 → 신규 사용자 생성 ({@code role=CLIENT}, {@code tenant_id=현재 컨텍스트})</li>
 * </ul>
 * </p>
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
}
