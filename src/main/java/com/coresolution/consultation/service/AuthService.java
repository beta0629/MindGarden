package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.AuthResponse;
import com.coresolution.consultation.entity.User;
import jakarta.servlet.http.HttpServletRequest;

/**
 * 인증 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface AuthService {
    
    /**
     * 사용자 인증 (로그인) — 기본 시그니처(HTTP 컨텍스트 없음).
     *
     * <p>refresh_token_store 메타데이터(device_id, ip_address, user_agent)는 NULL 로 저장된다.
     * 운영 컨트롤러 경로에서는 {@link #authenticate(String, String, HttpServletRequest)} 를 사용한다.</p>
     */
    default AuthResponse authenticate(String email, String password) {
        return authenticate(email, password, null);
    }

    /**
     * 사용자 인증 (로그인) — HTTP 요청 메타데이터를 refresh_token_store 에 함께 기록.
     *
     * @param email    로그인 식별자
     * @param password 비밀번호
     * @param request  HTTP 요청 (X-Forwarded-For, User-Agent, X-Device-Id 추출용; null 허용)
     * @return 인증 응답
     * @since 2026-06-13
     */
    AuthResponse authenticate(String email, String password, HttpServletRequest request);
    
    /**
     * 세션 기반 로그인 (중복로그인 방지 포함)
     */
    AuthResponse authenticateWithSession(String email, String password, String sessionId, String clientIp, String userAgent);

    /**
     * 일반 로그인(전화 + 비밀번호) 다중 매치 후 사용자가 선택한 계정으로 로그인 완료.
     *
     * <p>{@link #authenticateWithSession} 가 {@link AuthResponse#isMultipleAccounts()} {@code true}
     * 와 함께 발급한 {@code selectionToken} 을 검증하고, 요청 {@code userId} 가 토큰의
     * {@code allowedUserIds} 에 포함된 경우에만 정상 로그인 흐름(JWT/세션)을 진행한다.</p>
     *
     * <p>토큰 만료/위조/후보 외 userId/재사용은 모두 실패 응답으로 처리한다(P1 silent first 차단).</p>
     *
     * @param selectionToken {@link com.coresolution.consultation.service.JwtService#generatePasswordLoginAccountSelectionToken}
     *                       에서 발급된 5분 TTL 단기 JWT
     * @param selectedUserId 사용자가 선택한 계정 PK
     * @param sessionId      HTTP 세션 ID
     * @param clientIp       클라이언트 IP
     * @param userAgent      클라이언트 User-Agent
     * @return 정상 로그인 응답 또는 실패 응답
     * @since 2026-06-11
     */
    AuthResponse selectAccount(String selectionToken, Long selectedUserId, String sessionId,
            String clientIp, String userAgent);

    /**
     * 토큰 갱신 — 기본 시그니처(HTTP 컨텍스트 없음).
     *
     * <p>refresh_token_store 메타데이터(device_id, ip_address, user_agent)는 NULL 로 저장된다.
     * 운영 컨트롤러 경로에서는 {@link #refreshToken(String, HttpServletRequest)} 를 사용한다.</p>
     */
    default AuthResponse refreshToken(String refreshToken) {
        return refreshToken(refreshToken, null);
    }

    /**
     * 토큰 갱신 — HTTP 요청 메타데이터를 refresh_token_store 에 함께 기록.
     *
     * @param refreshToken 리프레시 토큰 JWT
     * @param request      HTTP 요청 (X-Forwarded-For, User-Agent, X-Device-Id 추출용; null 허용)
     * @return 인증 응답
     * @since 2026-06-13
     */
    AuthResponse refreshToken(String refreshToken, HttpServletRequest request);
    
    /**
     * 로그아웃
     */
    void logout(String token);
    
    /**
     * 세션 기반 로그아웃 (중복로그인 방지 포함)
     */
    void logoutSession(String sessionId);
    
    /**
     * 비밀번호 재설정 요청
     */
    void forgotPassword(String email);
    
    /**
     * 비밀번호 재설정
     */
    void resetPassword(String token, String newPassword);
    
    /**
     * 중복 로그인 체크
     */
    boolean checkDuplicateLogin(User user);
    
    /**
     * 사용자 세션 정리
     */
    void cleanupUserSessions(User user, String reason);
}
