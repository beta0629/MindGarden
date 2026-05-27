package com.coresolution.consultation.dto.lifecycle;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link Actor} VO 회귀 — 자발/강제/자동 세 actor 경로 + equals/hashCode + system() 식별.
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@DisplayName("Actor VO 회귀 — Phase 2-α")
class ActorTest {

    @Test
    @DisplayName("user(id, role): 정상 생성 + isSystem=false")
    void user_factory() {
        Actor actor = Actor.user(99L, "ADMIN");
        assertThat(actor.getActorUserId()).isEqualTo(99L);
        assertThat(actor.getActorRole()).isEqualTo("ADMIN");
        assertThat(actor.isSystem()).isFalse();
    }

    @Test
    @DisplayName("system(): id=null + role=SYSTEM + isSystem=true")
    void system_factory() {
        Actor actor = Actor.system();
        assertThat(actor.getActorUserId()).isNull();
        assertThat(actor.getActorRole()).isEqualTo(Actor.SYSTEM_ROLE);
        assertThat(actor.isSystem()).isTrue();
    }

    @Test
    @DisplayName("user(): actorUserId null 입력 시 IllegalArgumentException")
    void user_nullId() {
        assertThatThrownBy(() -> Actor.user(null, "CLIENT"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("user(): actorRole null/blank 입력 시 IllegalArgumentException")
    void user_nullRole() {
        assertThatThrownBy(() -> Actor.user(1L, null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> Actor.user(1L, ""))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> Actor.user(1L, "  "))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("user(): role=SYSTEM 사용 시 IllegalArgumentException — Actor.system() 강제")
    void user_systemRole_forbidden() {
        assertThatThrownBy(() -> Actor.user(1L, "SYSTEM"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("equals/hashCode: 동일 id+role 이면 같다")
    void equals_hashCode() {
        Actor a = Actor.user(7L, "CLIENT");
        Actor b = Actor.user(7L, "CLIENT");
        assertThat(a).isEqualTo(b);
        assertThat(a.hashCode()).isEqualTo(b.hashCode());

        Actor c = Actor.user(7L, "CONSULTANT");
        assertThat(a).isNotEqualTo(c);

        Actor s1 = Actor.system();
        Actor s2 = Actor.system();
        assertThat(s1).isEqualTo(s2);
        assertThat(s1).isNotEqualTo(a);
    }

    @Test
    @DisplayName("toString 은 actorUserId + actorRole 을 포함")
    void toString_includes_fields() {
        assertThat(Actor.user(42L, "CLIENT").toString())
                .contains("42")
                .contains("CLIENT");
        assertThat(Actor.system().toString())
                .contains(Actor.SYSTEM_ROLE);
    }
}
