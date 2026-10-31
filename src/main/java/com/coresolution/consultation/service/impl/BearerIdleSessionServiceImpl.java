package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.config.SessionTimeoutProperties;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSession;
import com.coresolution.consultation.service.BearerIdleSessionService;
import com.coresolution.consultation.service.UserSessionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Bearer/JWT 서버 유휴 세션 강제 구현.
 *
 * <p>{@code user_sessions.last_activity_at} / {@code expires_at} 를 재사용하며
 * TTL SSOT 는 {@link SessionTimeoutProperties} 이다.
 * Access JWT sid 등록은 {@link com.coresolution.consultation.service.JwtService#generateToken} 훅이 담당한다.</p>
 *
 * @author MindGarden
 * @since 2026-10-31
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BearerIdleSessionServiceImpl implements BearerIdleSessionService {

    private final UserSessionService userSessionService;
    private final SessionTimeoutProperties sessionTimeoutProperties;

    @Override
    @Transactional
    public void ensureActiveSession(User user, String bearerSessionId, String clientIp, String userAgent) {
        if (user == null || !StringUtils.hasText(bearerSessionId)) {
            log.warn("Bearer 세션 바인딩 스킵: user 또는 sid 없음");
            return;
        }
        int timeoutSeconds = sessionTimeoutProperties.getTimeoutSecondsForRole(user.getRole());
        UserSession existing = userSessionService.getActiveSession(bearerSessionId);
        if (existing != null) {
            userSessionService.slideActiveSession(
                    bearerSessionId,
                    timeoutSeconds,
                    SessionConstants.BEARER_ACTIVITY_THROTTLE_SECONDS);
            log.debug("Bearer 세션 유지/슬라이드: sid={}, userId={}", bearerSessionId, user.getId());
            return;
        }
        // createSession 의 deleteBySessionId 레이스 완화 — create 직전 활성 세션 재확인
        existing = userSessionService.getActiveSession(bearerSessionId);
        if (existing != null) {
            userSessionService.slideActiveSession(
                    bearerSessionId,
                    timeoutSeconds,
                    SessionConstants.BEARER_ACTIVITY_THROTTLE_SECONDS);
            log.debug("Bearer 세션 재확인 후 슬라이드: sid={}, userId={}", bearerSessionId, user.getId());
            return;
        }
        // createSession 은 동일 sid 활성 세션이 있으면 upsert(삭제 없음) — 병렬 ensure 안전
        userSessionService.createSession(
                user,
                bearerSessionId,
                clientIp,
                userAgent,
                SessionManagementConstants.LOGIN_TYPE_NORMAL,
                null);
        log.info("Bearer 세션 바인딩 생성: sid={}, userId={}", bearerSessionId, user.getId());
    }

    @Override
    @Transactional
    public boolean isBearerSessionActive(String bearerSessionId, UserRole role) {
        if (!StringUtils.hasText(bearerSessionId)) {
            return false;
        }
        UserSession session = userSessionService.getActiveSession(bearerSessionId);
        if (session == null) {
            return false;
        }
        LocalDateTime lastActivityAt = session.getLastActivityAt();
        if (lastActivityAt == null) {
            userSessionService.deactivateSession(
                    bearerSessionId, SessionManagementConstants.END_REASON_EXPIRED);
            return false;
        }
        int ttlSeconds = sessionTimeoutProperties.getTimeoutSecondsForRole(role);
        if (ttlSeconds <= 0) {
            return false;
        }
        LocalDateTime idleDeadline = lastActivityAt.plusSeconds(ttlSeconds);
        if (idleDeadline.isBefore(LocalDateTime.now())) {
            log.info("Bearer 유휴 만료: sid={}, lastActivityAt={}, ttlSeconds={}",
                    bearerSessionId, lastActivityAt, ttlSeconds);
            userSessionService.deactivateSession(
                    bearerSessionId, SessionManagementConstants.END_REASON_EXPIRED);
            return false;
        }
        return true;
    }

    @Override
    @Transactional
    public boolean touchActivity(String bearerSessionId, UserRole role) {
        if (!StringUtils.hasText(bearerSessionId)) {
            return false;
        }
        int timeoutSeconds = sessionTimeoutProperties.getTimeoutSecondsForRole(role);
        return userSessionService.slideActiveSession(
                bearerSessionId,
                timeoutSeconds,
                SessionConstants.BEARER_ACTIVITY_THROTTLE_SECONDS);
    }

    @Override
    public void writeUnauthorizedIdle(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        if (response == null || response.isCommitted()) {
            return;
        }
        String requestPath = request != null ? request.getRequestURI() : null;
        String method = request != null ? request.getMethod() : null;

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("message", SessionManagementConstants.SESSION_EXPIRED_MESSAGE);
        errorResponse.put("redirectToLogin", true);
        errorResponse.put("path", requestPath);
        errorResponse.put("method", method);
        errorResponse.put("timestamp", System.currentTimeMillis());

        ObjectMapper mapper = new ObjectMapper();
        mapper.writeValue(response.getOutputStream(), errorResponse);
    }
}
