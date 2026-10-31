package com.coresolution.consultation.config;

import java.time.Duration;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.utils.SessionUtils;

import lombok.extern.slf4j.Slf4j;

/**
 * HTTP 세션 비활성 타임아웃 SSOT (역할별 TTL + 컨테이너 기본).
 *
 * <p>컨테이너/폴백 키: {@code server.servlet.session.timeout} /
 * 환경변수 {@code HTTP_SESSION_MAX_INACTIVE} (application.yml 기본값 {@code 4h} = ADMIN).
 * 로그인·hydrate 시 {@link #getTimeoutSecondsForRole} 로 역할별
 * {@code setMaxInactiveInterval} 이 실제 TTL 이다.</p>
 *
 * <p>역할별 상수: {@link SessionConstants#SESSION_TIMEOUT_SECONDS_CLIENT}(1h) /
 * {@link SessionConstants#SESSION_TIMEOUT_SECONDS_CONSULTANT}(2h) /
 * {@link SessionConstants#SESSION_TIMEOUT_SECONDS_ADMIN}(4h) /
 * {@link SessionConstants#SESSION_TIMEOUT_SECONDS_STAFF}(=ADMIN).</p>
 *
 * <p>웹 HttpSession TTL 과 Access JWT({@code jwt.expiration}=1h)는 계층이 다르다.
 * 세션 TTL ≠ JWT 1h.</p>
 *
 * @author MindGarden
 * @since 2026-08-05
 */
@Slf4j
@Component
public class SessionTimeoutProperties {

    private final int timeoutSeconds;

    /**
     * .dev 만료 검증용 유휴 TTL 단축(초). 0=끔(기본). 운영 프로필(prod·production 등)이거나 dev/local/test 가 아니면 값과 무관하게 항상 끔.
     * 설정: {@code session.idle.test-override-seconds} / env {@code SESSION_IDLE_TEST_OVERRIDE_SECONDS}.
     * 켜지면 모든 역할 TTL·session-info maxInactiveInterval 이 이 값으로 대체된다(서버 시각 기준).
     */
    private int testOverrideSeconds;

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
        log.info("HttpSession timeout SSOT loaded: default={}s (ADMIN/container); "
                        + "CLIENT={}s CONSULTANT={}s ADMIN={}s STAFF={}s",
                this.timeoutSeconds,
                SessionConstants.SESSION_TIMEOUT_SECONDS_CLIENT,
                SessionConstants.SESSION_TIMEOUT_SECONDS_CONSULTANT,
                SessionConstants.SESSION_TIMEOUT_SECONDS_ADMIN,
                SessionConstants.SESSION_TIMEOUT_SECONDS_STAFF);
    }

    /**
     * HTTP 세션 비활성 타임아웃 (초) — 컨테이너 기본/ADMIN 폴백.
     *
     * @return 타임아웃 초
     */
    /**
     * .dev 만료 테스트 훅 주입. prod 프로필이면 무시(0 고정).
     */
    @Autowired(required = false)
    public void configureTestOverride(
            Environment environment,
            @Value("${session.idle.test-override-seconds:0}") int overrideSeconds) {
        if (overrideSeconds <= 0) {
            this.testOverrideSeconds = 0;
            return;
        }
        if (!isTestOverrideAllowed(environment)) {
            this.testOverrideSeconds = 0;
            log.warn("session.idle.test-override-seconds={} 무시 — 운영 프로필이거나 dev/local/test 프로필이 아님",
                    overrideSeconds);
            return;
        }
        this.testOverrideSeconds = overrideSeconds;
        log.warn("세션 유휴 TTL 테스트 오버라이드 활성: 모든 역할 {}s (비운영 전용)", overrideSeconds);
    }

    /** 운영 프로필 이름(레포 사용: prod, production). 하나라도 활성이면 오버라이드 금지. */
    static final String[] PRODUCTION_PROFILES = {"prod", "production", "prd", "live"};

    /** 오버라이드를 허용하는 비운영 프로필. 이 중 하나가 활성이어야 한다(기본·미지정 프로필은 금지). */
    static final String[] NON_PRODUCTION_PROFILES = {"dev", "local", "test"};

    /**
     * 테스트 오버라이드 허용 여부. 운영 프로필이 하나라도 있으면 false, 비운영 프로필이 없어도 false.
     *
     * @param environment Spring 환경 (null 이면 false)
     * @return 허용이면 true
     */
    static boolean isTestOverrideAllowed(Environment environment) {
        if (environment == null) {
            return false;
        }
        if (environment.acceptsProfiles(Profiles.of(PRODUCTION_PROFILES))) {
            return false;
        }
        for (String active : environment.getActiveProfiles()) {
            for (String allowed : NON_PRODUCTION_PROFILES) {
                if (allowed.equalsIgnoreCase(active.trim())) {
                    return true;
                }
            }
        }
        return false;
    }

    /** 테스트 오버라이드(초). 0이면 꺼짐. */
    public int getTestOverrideSeconds() {
        return testOverrideSeconds;
    }

    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    /**
     * HTTP 세션 비활성 타임아웃 (분). UserSession 등 분 단위 API용 (기본/ADMIN 폴백).
     *
     * @return 타임아웃 분
     */
    public int getTimeoutMinutes() {
        return timeoutSeconds / 60;
    }

    /**
     * 활성 역할 기준 HTTP 세션 유휴 TTL (초).
     *
     * <p>null 역할은 {@link #getTimeoutSeconds()} (ADMIN/컨테이너 폴백).
     * STAFF 는 ADMIN 과 동일(4h).</p>
     *
     * @param role 현재 활성 역할 ({@link User#getRole()} / SecurityContext)
     * @return 역할별 타임아웃 초
     */
    public int getTimeoutSecondsForRole(UserRole role) {
        if (testOverrideSeconds > 0) {
            return testOverrideSeconds;
        }
        if (role == null) {
            return timeoutSeconds;
        }
        switch (role) {
            case CLIENT:
                return SessionConstants.SESSION_TIMEOUT_SECONDS_CLIENT;
            case CONSULTANT:
                return SessionConstants.SESSION_TIMEOUT_SECONDS_CONSULTANT;
            case ADMIN:
                return SessionConstants.SESSION_TIMEOUT_SECONDS_ADMIN;
            case STAFF:
                return SessionConstants.SESSION_TIMEOUT_SECONDS_STAFF;
            default:
                return timeoutSeconds;
        }
    }

    /**
     * 역할 문자열 기준 HTTP 세션 유휴 TTL (초).
     * 레거시 역할명은 {@link UserRole#fromString(String)} 으로 4종에 매핑한다.
     *
     * @param role 역할 문자열 (nullable/blank → 기본 폴백)
     * @return 역할별 타임아웃 초
     */
    public int getTimeoutSecondsForRole(String role) {
        if (testOverrideSeconds > 0) {
            return testOverrideSeconds;
        }
        if (role == null || role.isBlank()) {
            return timeoutSeconds;
        }
        return getTimeoutSecondsForRole(UserRole.fromString(role));
    }

    /**
     * 활성 역할 기준 HTTP 세션 유휴 TTL (분).
     *
     * @param role 현재 활성 역할
     * @return 역할별 타임아웃 분
     */
    public int getTimeoutMinutesForRole(UserRole role) {
        return getTimeoutSecondsForRole(role) / 60;
    }

    /**
     * 세션에서 역할(또는 User)을 읽어 TTL(초)을 결정한다.
     * 역할을 알 수 없으면 기존 {@code maxInactiveInterval} 을 유지하고,
     * 그것도 없으면 컨테이너 기본({@link #getTimeoutSeconds()})을 쓴다.
     * 짧은/긴 TTL로 덮어쓰지 않는다.
     *
     * @param session HTTP 세션 (nullable)
     * @return 적용할 타임아웃 초
     */
    public int resolveTimeoutSeconds(HttpSession session) {
        if (testOverrideSeconds > 0) {
            return testOverrideSeconds;
        }
        if (session == null) {
            return timeoutSeconds;
        }
        UserRole role = resolveRoleFromSession(session);
        if (role != null) {
            return getTimeoutSecondsForRole(role);
        }
        int existing = session.getMaxInactiveInterval();
        if (existing > 0) {
            return existing;
        }
        return timeoutSeconds;
    }

    /**
     * 세션 User / LOGIN_SESSION ROLE 속성에서 활성 역할을 읽는다.
     *
     * @param session HTTP 세션
     * @return 역할 또는 null
     */
    public UserRole resolveRoleFromSession(HttpSession session) {
        if (session == null) {
            return null;
        }
        try {
            User user = SessionUtils.getCurrentUser(session);
            if (user != null && user.getRole() != null) {
                return user.getRole();
            }
            Object roleAttr = session.getAttribute(
                    SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.ROLE);
            if (roleAttr instanceof UserRole userRole) {
                return userRole;
            }
            if (roleAttr instanceof String roleString && !roleString.isBlank()) {
                return UserRole.fromString(roleString);
            }
            Object bareRole = session.getAttribute(SessionConstants.ROLE);
            if (bareRole instanceof UserRole userRole) {
                return userRole;
            }
            if (bareRole instanceof String roleString && !roleString.isBlank()) {
                return UserRole.fromString(roleString);
            }
        } catch (IllegalStateException ex) {
            log.debug("세션 역할 조회 실패(무효화됨): {}", ex.getMessage());
        }
        return null;
    }
}
