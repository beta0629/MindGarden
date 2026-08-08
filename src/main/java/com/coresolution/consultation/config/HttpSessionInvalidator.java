package com.coresolution.consultation.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.session.SessionInformation;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

/**
 * sessionId(JSESSIONID) 기준으로 {@link HttpSession} 과 Spring {@link SessionRegistry} 를 무효화한다.
 *
 * @author MindGarden
 * @since 2026-08-07
 */
@Slf4j
@Component
public class HttpSessionInvalidator {

    private final HttpSessionTracker httpSessionTracker;

    private final SessionRegistry sessionRegistry;

    @Autowired
    public HttpSessionInvalidator(
            HttpSessionTracker httpSessionTracker,
            @Autowired(required = false) SessionRegistry sessionRegistry) {
        this.httpSessionTracker = httpSessionTracker;
        this.sessionRegistry = sessionRegistry;
    }

    /**
     * DB {@code user_sessions.session_id} (= JSESSIONID) 에 대응하는 HTTP 세션을 종료한다.
     *
     * @param sessionId 세션 ID
     */
    public void invalidateBySessionId(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return;
        }
        boolean trackerHit = httpSessionTracker.invalidate(sessionId);
        boolean registryHit = expireInSessionRegistry(sessionId);
        if (!trackerHit && !registryHit) {
            log.debug("HttpSessionInvalidator: 추적/레지스트리에 세션 없음 — 필터 검증에 위임 sessionId={}",
                sessionId);
        }
    }

    private boolean expireInSessionRegistry(String sessionId) {
        if (sessionRegistry == null) {
            return false;
        }
        try {
            SessionInformation info = sessionRegistry.getSessionInformation(sessionId);
            if (info == null || info.isExpired()) {
                return false;
            }
            info.expireNow();
            log.info("🔓 SessionRegistry expireNow 완료 sessionId={}", sessionId);
            return true;
        } catch (Exception e) {
            log.warn("SessionRegistry expire 실패 sessionId={}, error={}", sessionId, e.getMessage());
            return false;
        }
    }
}
