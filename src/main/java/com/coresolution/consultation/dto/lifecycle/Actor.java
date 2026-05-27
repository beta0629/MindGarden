package com.coresolution.consultation.dto.lifecycle;

import java.util.Objects;

/**
 * lifecycle 전이 행위자 VO — USER_LIFECYCLE_TERMINATION_POLICY §8 audit_logs.actor_user_id /
 * actor_role 의 SSOT 표현.
 *
 * <p>자발/강제/자동 세 경로에서 동일 형태로 사용된다:</p>
 * <ul>
 *   <li>자발 — {@code Actor(currentUserId, "CLIENT")} 등</li>
 *   <li>어드민 강제 — {@code Actor(adminUserId, "ADMIN")}</li>
 *   <li>자동 (cron) — {@link #system()} (id=null, role="SYSTEM")</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
public final class Actor {

    /** SYSTEM cron 식별 role. */
    public static final String SYSTEM_ROLE = "SYSTEM";

    private final Long actorUserId;
    private final String actorRole;

    private Actor(Long actorUserId, String actorRole) {
        this.actorUserId = actorUserId;
        this.actorRole = actorRole;
    }

    /**
     * 사람 행위자 (자발 본인 또는 어드민) 생성.
     *
     * @param actorUserId 행위자 users.id (필수)
     * @param actorRole   행위자 역할 코드 (예: CLIENT / CONSULTANT / ADMIN / HQ_ADMIN). null/blank 금지
     * @return Actor
     */
    public static Actor user(Long actorUserId, String actorRole) {
        if (actorUserId == null) {
            throw new IllegalArgumentException("actorUserId must not be null for user actor");
        }
        if (actorRole == null || actorRole.isBlank()) {
            throw new IllegalArgumentException("actorRole must not be blank for user actor");
        }
        if (SYSTEM_ROLE.equals(actorRole)) {
            throw new IllegalArgumentException("Use Actor.system() for SYSTEM role");
        }
        return new Actor(actorUserId, actorRole);
    }

    /**
     * SYSTEM cron 행위자.
     *
     * @return Actor (id=null, role={@link #SYSTEM_ROLE})
     */
    public static Actor system() {
        return new Actor(null, SYSTEM_ROLE);
    }

    public Long getActorUserId() {
        return actorUserId;
    }

    public String getActorRole() {
        return actorRole;
    }

    /** SYSTEM cron 여부. */
    public boolean isSystem() {
        return actorUserId == null && SYSTEM_ROLE.equals(actorRole);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Actor)) {
            return false;
        }
        Actor other = (Actor) o;
        return Objects.equals(actorUserId, other.actorUserId)
                && Objects.equals(actorRole, other.actorRole);
    }

    @Override
    public int hashCode() {
        return Objects.hash(actorUserId, actorRole);
    }

    @Override
    public String toString() {
        return "Actor{actorUserId=" + actorUserId + ", actorRole='" + actorRole + "'}";
    }
}
