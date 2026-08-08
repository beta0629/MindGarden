package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link DuplicateLoginAccessBlockRegistry} 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-08-07
 */
@DisplayName("DuplicateLoginAccessBlockRegistry")
class DuplicateLoginAccessBlockRegistryTest {

    @Test
    @DisplayName("blockUser 후 isBlocked true, clearBlock 후 false")
    void blockAndClear() {
        DuplicateLoginAccessBlockRegistry registry = new DuplicateLoginAccessBlockRegistry(3_600_000L);
        Long userId = 99L;

        assertThat(registry.isBlocked(userId)).isFalse();
        registry.blockUser(userId);
        assertThat(registry.isBlocked(userId)).isTrue();
        registry.clearBlock(userId);
        assertThat(registry.isBlocked(userId)).isFalse();
    }

    @Test
    @DisplayName("만료된 차단은 isBlocked false")
    void expiredBlockIsNotActive() throws InterruptedException {
        DuplicateLoginAccessBlockRegistry registry = new DuplicateLoginAccessBlockRegistry(3_600_000L);
        Long userId = 7L;
        registry.blockUser(userId, 1L);
        Thread.sleep(5L);
        assertThat(registry.isBlocked(userId)).isFalse();
    }
}
