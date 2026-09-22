package com.coresolution.consultation.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.session.SessionInformation;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.session.Session;
import org.springframework.session.SessionRepository;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

/**
 * sessionId(JSESSIONID) 기준으로 {@link HttpSession} 과 Spring {@link SessionRegistry} 를 무효화한다.
 *
 * <p>교차 JVM: Spring Session Redis 가 활성일 때 {@link SessionRepository#deleteById} 로
 * 공유 세션도 제거한다. Redis 미사용(local/test)에서는 optional 빈이 없어 no-op.</p>
 *
 * @author MindGarden
 * @since 2026-08-07
 */
@Slf4j
@Component
public class HttpSessionInvalidator {

    private final HttpSessionTracker httpSessionTracker;

    private final SessionRegistry sessionRegistry;

    private final SessionRepository<? extends Session> sessionRepository;

    /**
     * @param httpSessionTracker 로컬 HttpSession 인덱스
     * @param sessionRegistry    Spring Security SessionRegistry (nullable)
     * @param sessionRepository  Spring Session Redis repository (nullable — local/test)
     */
    @Autowired
    public HttpSessionInvalidator(
            HttpSessionTracker httpSessionTracker,
            @Autowired(required = false) SessionRegistry sessionRegistry,
            @Autowired(required = false) SessionRepository<? extends Session> sessionRepository) {
        this.httpSessionTracker = httpSessionTracker;
        this.sessionRegistry = sessionRegistry;
        this.sessionRepository = sessionRepository;
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
        boolean redisHit = deleteFromSpringSessionRepository(sessionId);
        if (!trackerHit && !registryHit && !redisHit) {
            log.debug("HttpSessionInvalidator: 추적/레지스트리/Redis에 세션 없음 — 필터 검증에 위임 sessionId={}",
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

    /**
     * Spring Session Redis 공유 저장소에서 세션 삭제 (교차 JVM 중복 로그인용).
     *
     * @param sessionId JSESSIONID
     * @return 삭제 시도 성공 여부
     */
    private boolean deleteFromSpringSessionRepository(String sessionId) {
        if (sessionRepository == null) {
            return false;
        }
        try {
            sessionRepository.deleteById(sessionId);
            log.info("🔓 Spring SessionRepository deleteById 완료 sessionId={}", sessionId);
            return true;
        } catch (Exception e) {
            log.warn("Spring SessionRepository delete 실패 sessionId={}, error={}",
                    sessionId, e.getMessage());
            return false;
        }
    }
}
