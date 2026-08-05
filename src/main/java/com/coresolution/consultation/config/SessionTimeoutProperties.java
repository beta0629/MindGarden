package com.coresolution.consultation.config;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.coresolution.consultation.constant.SessionConstants;

import lombok.extern.slf4j.Slf4j;

/**
 * HTTP 세션 비활성 타임아웃 SSOT.
 *
 * <p>키: {@code server.servlet.session.timeout} /
 * 환경변수 {@code HTTP_SESSION_MAX_INACTIVE} (application.yml 기본값 {@code 4h}).
 * cookie.max-age 도 동일 키를 사용한다.</p>
 *
 * <p>웹 HttpSession TTL(기본 4h)과 Access JWT({@code jwt.expiration}=1h)는 계층이 다르다.
 * 세션 4h ≠ JWT 1h.</p>
 *
 * @author MindGarden
 * @since 2026-08-05
 */
@Slf4j
@Component
public class SessionTimeoutProperties {

    private final int timeoutSeconds;

    /**
     * @param sessionTimeout {@code server.servlet.session.timeout} (Duration, 기본 4h)
     */
    public SessionTimeoutProperties(
            @Value("${server.servlet.session.timeout:4h}") Duration sessionTimeout) {
        long seconds = sessionTimeout != null ? sessionTimeout.getSeconds() : 0L;
        if (seconds <= 0L || seconds > Integer.MAX_VALUE) {
            this.timeoutSeconds = SessionConstants.SESSION_TIMEOUT_SECONDS;
            log.warn("Invalid server.servlet.session.timeout={}, using fallback {}s (HTTP_SESSION_MAX_INACTIVE)",
                    sessionTimeout, this.timeoutSeconds);
        } else {
            this.timeoutSeconds = (int) seconds;
        }
        log.info("HttpSession timeout SSOT loaded: {}s (HTTP_SESSION_MAX_INACTIVE / server.servlet.session.timeout)",
                this.timeoutSeconds);
    }

    /**
     * HTTP 세션 비활성 타임아웃 (초).
     *
     * @return 타임아웃 초
     */
    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    /**
     * HTTP 세션 비활성 타임아웃 (분). UserSession 등 분 단위 API용.
     *
     * @return 타임아웃 분
     */
    public int getTimeoutMinutes() {
        return timeoutSeconds / 60;
    }
}
