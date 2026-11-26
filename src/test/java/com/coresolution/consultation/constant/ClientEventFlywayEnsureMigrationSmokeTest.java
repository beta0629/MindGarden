package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * D-1 후 client_event 재생성용 Flyway 파일 존재 스모크.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@DisplayName("client_event ensure Flyway")
class ClientEventFlywayEnsureMigrationSmokeTest {

    @Test
    @DisplayName("V20261127_001__ensure_client_event.sql 존재 · CREATE TABLE IF NOT EXISTS")
    void ensureMigrationPresent() throws Exception {
        Path path = Path.of("src/main/resources/db/migration/V20261127_001__ensure_client_event.sql");
        assertThat(Files.exists(path)).isTrue();
        String sql = Files.readString(path);
        assertThat(sql).containsIgnoringCase("CREATE TABLE IF NOT EXISTS client_event");
        assertThat(sql).contains("uk_client_event_tenant_idempotency");
        assertThat(sql).contains("기존 V20261126_002 수정 금지");
        Path original = Path.of("src/main/resources/db/migration/V20261126_002__create_client_event.sql");
        assertThat(Files.exists(original)).isTrue();
    }
}
