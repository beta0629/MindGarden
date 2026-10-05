package com.coresolution.consultation.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

@DisplayName("users (tenant_id, user_id) UNIQUE 마이그레이션")
class UsersTenantUserIdUniqueMigrationTest {

    @Test
    @DisplayName("전역 UK 를 내리고 복합 UK 를 올리며 행을 고치지 않는다")
    void migrationDropsGlobalUniqueWithoutTouchingRows() throws Exception {
        String sql = new String(new ClassPathResource(
                "db/migration/V20261011_001__users_tenant_user_id_unique.sql")
                .getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        String executable = sql.replaceAll("(?m)^\\s*--.*(?:\\r?\\n|$)", "");

        assertThat(sql).contains("UK_r43af9ap4edm43mmtq01oddj6");
        assertThat(sql).contains("UK_users_user_id");
        assertThat(sql).contains("UK_users_tenant_user_id UNIQUE (tenant_id, user_id)");
        assertThat(sql).contains("GROUP BY tenant_id, user_id");
        assertThat(sql).contains("tenant_id IS NOT NULL");
        assertThat(executable).doesNotContain("UPDATE users");
        assertThat(executable).doesNotContain("DELETE FROM users");
        assertThat(executable).contains("SIGNAL SQLSTATE");
    }
}
