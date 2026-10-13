package com.coresolution.consultation.constant;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.coresolution.consultation.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

class ClientVisibilityPolicyTest {

    private static User client() {
        User u = new User();
        u.setRole(UserRole.CLIENT);
        return u;
    }

    @Test
    @DisplayName("기본(활성·ACTIVE·미삭제) 내담자는 노출")
    void defaultVisible() {
        assertTrue(ClientVisibilityPolicy.isVisible(client()));
    }

    @Test
    @DisplayName("isActive=false·isDeleted=true·null 은 제외, isActive·lifecycle null 은 노출")
    void activeAndDeletedFlags() {
        User inactive = client();
        inactive.setIsActive(false);
        assertFalse(ClientVisibilityPolicy.isVisible(inactive));

        User deleted = client();
        deleted.setIsDeleted(true);
        assertFalse(ClientVisibilityPolicy.isVisible(deleted));

        assertFalse(ClientVisibilityPolicy.isVisible(null));

        User legacy = client();
        legacy.setIsActive(null);
        legacy.setLifecycleState(null);
        assertTrue(ClientVisibilityPolicy.isVisible(legacy));
    }

    @ParameterizedTest
    @EnumSource(value = LifecycleState.class, names = {"DELETED_BY_ADMIN", "ANONYMIZED", "HARD_DELETED"})
    @DisplayName("삭제·익명화 lifecycle 은 제외")
    void excludedLifecycles(LifecycleState state) {
        User u = client();
        u.setLifecycleState(state);
        assertFalse(ClientVisibilityPolicy.isVisible(u));
    }

    @ParameterizedTest
    @EnumSource(value = LifecycleState.class, names = {"ACTIVE", "SUSPENDED", "WITHDRAWAL_PENDING", "DORMANT"})
    @DisplayName("그 밖의 lifecycle 은 노출 (with-mapping-info 와 동일)")
    void otherLifecyclesVisible(LifecycleState state) {
        User u = client();
        u.setLifecycleState(state);
        assertTrue(ClientVisibilityPolicy.isVisible(u));
    }
}
