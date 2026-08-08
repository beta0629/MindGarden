package com.coresolution.consultation.config;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpSessionEvent;
import jakarta.servlet.http.HttpSessionListener;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

/**
 * 활성 {@link HttpSession} 을 sessionId 로 조회·무효화하기 위한 인메모리 인덱스.
 *
 * <p>중복 로그인 확정 시 {@code user_sessions} 비활성화만으로는 기존 JSESSIONID 가
 * 살아 남아 {@code SessionBasedAuthenticationFilter} 가 User 를 복원하는 문제를 막는다.</p>
 *
 * @author MindGarden
 * @since 2026-08-07
 */
@Slf4j
@Component
public class HttpSessionTracker implements HttpSessionListener {

    private final ConcurrentMap<String, HttpSession> sessionsById = new ConcurrentHashMap<>();

    @Override
    public void sessionCreated(HttpSessionEvent event) {
        HttpSession session = event.getSession();
        if (session != null && session.getId() != null) {
            sessionsById.put(session.getId(), session);
            log.debug("HttpSessionTracker: sessionCreated id={}", session.getId());
        }
    }

    @Override
    public void sessionDestroyed(HttpSessionEvent event) {
        HttpSession session = event.getSession();
        if (session != null && session.getId() != null) {
            sessionsById.remove(session.getId());
            log.debug("HttpSessionTracker: sessionDestroyed id={}", session.getId());
        }
    }

    /**
     * @param sessionId HTTP 세션 ID (JSESSIONID)
     * @return 추적 중인 세션 또는 null
     */
    public HttpSession getSession(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return null;
        }
        return sessionsById.get(sessionId);
    }

    /**
     * 추적 맵에서 제거하고 세션을 invalidate 한다. 이미 만료된 경우 swallow.
     *
     * @param sessionId HTTP 세션 ID
     * @return invalidate 시도 여부 (세션이 맵에 있으면 true)
     */
    public boolean invalidate(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return false;
        }
        HttpSession session = sessionsById.remove(sessionId);
        if (session == null) {
            return false;
        }
        try {
            session.invalidate();
            log.info("🔓 HttpSessionTracker: invalidate 완료 sessionId={}", sessionId);
            return true;
        } catch (IllegalStateException e) {
            log.debug("HttpSessionTracker: 이미 무효화된 세션 sessionId={}", sessionId);
            return true;
        } catch (Exception e) {
            log.warn("HttpSessionTracker: invalidate 실패 sessionId={}, error={}",
                sessionId, e.getMessage());
            return false;
        }
    }
}
