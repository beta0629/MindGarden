package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Bearer/JWT Access 토큰의 서버 유휴 세션 강제 SSOT.
 *
 * <p>JWT {@code sid} 를 {@code user_sessions.session_id} 로 키잉하고,
 * {@link com.coresolution.consultation.config.SessionTimeoutProperties} 역할별 TTL 로
 * 유휴 만료를 판정한다. 필터·refresh 가 동일 구현을 공유한다.</p>
 *
 * @author MindGarden
 * @since 2026-10-31
 */
public interface BearerIdleSessionService {

    /**
     * JWT 발급 직후 Bearer 세션을 {@code user_sessions} 에 바인딩한다.
     * 이미 활성이면 역할 TTL 로 슬라이드/유지하고, 없으면 생성한다.
     *
     * @param user            로그인 사용자
     * @param bearerSessionId Access JWT {@code sid}
     * @param clientIp        클라이언트 IP
     * @param userAgent       User-Agent
     */
    void ensureActiveSession(User user, String bearerSessionId, String clientIp, String userAgent);

    /**
     * Bearer 세션이 역할별 유휴 TTL 내 활성인지 판정한다.
     *
     * <p>{@code sid} 가 비어 있거나 활성 세션이 없거나 {@code lastActivityAt} 기준 TTL 을 초과하면 false.</p>
     *
     * @param bearerSessionId Access JWT {@code sid} (Refresh 의 {@code tokenId} 와 동일)
     * @param role            사용자 역할
     * @return 활성(유휴 미초과)이면 true
     */
    boolean isBearerSessionActive(String bearerSessionId, UserRole role);

    /**
     * 유효 요청의 last activity 를 스로틀 하에 갱신한다.
     *
     * @param bearerSessionId Access JWT {@code sid}
     * @param role            사용자 역할
     * @return 활성 세션이면 true(스로틀 스킵 포함)
     */
    boolean touchActivity(String bearerSessionId, UserRole role);

    /**
     * 유휴 만료 401 JSON 작성.
     * {@link com.coresolution.consultation.config.CustomAuthenticationEntryPoint} 와 동일 shape,
     * message 는 {@link com.coresolution.consultation.constant.SessionManagementConstants#SESSION_EXPIRED_MESSAGE}.
     *
     * @param request  HTTP 요청
     * @param response HTTP 응답
     * @throws IOException 응답 기록 실패
     */
    void writeUnauthorizedIdle(HttpServletRequest request, HttpServletResponse response) throws IOException;
}
