package com.coresolution.core.config;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link FlywayErdAutoGenerationHook}의 메시지 판별 로직 검증.
 *
 * @author CoreSolution
 * @since 2026-03-29
 */
class FlywayErdAutoGenerationHookTest {

    @Test
    @DisplayName("containsFailedMigrationHint는 대소문자 무관하게 failed migration 문구를 감지한다")
    void containsFailedMigrationHint_detectsPhraseCaseInsensitive() {
        assertTrue(FlywayErdAutoGenerationHook.containsFailedMigrationHint(
                "Schema core_solution contains a failed migration to version 20260330.001 !"));
        assertTrue(FlywayErdAutoGenerationHook.containsFailedMigrationHint(
                "CONTAINS A FAILED MIGRATION to version 1"));
        assertTrue(FlywayErdAutoGenerationHook.containsFailedMigrationHint("Failed Migration recorded"));
    }

    @Test
    @DisplayName("containsFailedMigrationHint는 null·빈 문자열·무관 메시지에서 false")
    void containsFailedMigrationHint_negativeCases() {
        assertFalse(FlywayErdAutoGenerationHook.containsFailedMigrationHint(null));
        assertFalse(FlywayErdAutoGenerationHook.containsFailedMigrationHint(""));
        assertFalse(FlywayErdAutoGenerationHook.containsFailedMigrationHint("Validate failed: checksum mismatch"));
    }
}
