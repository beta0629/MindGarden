package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import com.coresolution.consultation.config.PlSqlInitializer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

/**
 * 개발 서버가 기동 때 덮어쓰는 승인 프로시저를, 그 프로시저가 쓰는 테이블 정의와 비교한다.
 *
 * <p>라이브 information_schema 덤프는 저장소에 없다. 비교 기준은 개발 서버
 * {@link PlSqlInitializer} 가 강제 적용하는 스크립트와, 그 스크립트가 어긋난 Flyway 정의다.
 * CreateOrActivateTenant 기존 강제본은 V20251222_001, CreateDefaultTenantUsers 는 V57,
 * users.username → user_id 는 V20251208_002, CopyDefaultTenantCodes 의 COMMIT 은 V20260831_002,
 * 관리자 INSERT 는 V20251223_001 이다.
 */
class OnboardingApprovalProcedureSchemaTest {

    @Test
    @DisplayName("승인 트랜잭션 본문은 삭제된 username 과 중간 COMMIT 을 호출하지 않는다")
    void approvalProcedureMatchesUsersTableAndDoesNotSplitTheTransaction() throws Exception {
        String forcedTenantProcedure = read(PlSqlInitializer.CREATE_OR_ACTIVATE_TENANT_PROCEDURE);
        String forcedSampleUsers = read(PlSqlInitializer.CREATE_DEFAULT_TENANT_USERS_PROCEDURE);
        String previousTenantProcedure = read(
                "db/migration/V20251222_001__create_create_or_activate_tenant_procedure.sql");
        String sampleUsersV57 = read("db/migration/V57__update_tenant_creation_with_default_users.sql");
        String usernameRenamed = read("db/migration/V20251208_002__rename_username_to_user_id.sql");
        String codeCopy = read("db/migration/V20260831_002__expense_income_ssot_tenant_backfill.sql");
        String adminAccount = read(PlSqlInitializer.CREATE_TENANT_ADMIN_ACCOUNT_PROCEDURE);
        String approvalProcedure = read(PlSqlInitializer.PROCESS_ONBOARDING_APPROVAL_PROCEDURE);
        String emailColumn = read("db/migration/V20260614_002__normalize_pii_columns_to_512.sql");

        assertThat(previousTenantProcedure).contains("CALL CopyDefaultTenantCodes");
        assertThat(previousTenantProcedure).contains("CALL CreateDefaultTenantUsers");
        assertThat(sampleUsersV57).contains("username");
        assertThat(sampleUsersV57).contains("ROLLBACK");
        assertThat(sampleUsersV57).contains("START TRANSACTION");
        assertThat(usernameRenamed).contains("CHANGE COLUMN username user_id VARCHAR(50) NOT NULL");
        assertThat(codeCopy).contains("START TRANSACTION");
        assertThat(codeCopy).contains("COMMIT");
        assertThat(adminAccount).contains("user_id, tenant_id, email, password");
        assertThat(adminAccount).doesNotContain("username");
        assertThat(PlSqlInitializer.CREATE_TENANT_ADMIN_ACCOUNT_PROCEDURE)
                .isEqualTo("sql/procedures/create_tenant_admin_account.sql");
        assertThat(emailColumn).contains("MODIFY COLUMN email VARCHAR(512) NOT NULL");
        assertThat(adminAccount).contains(
                "IN p_contact_email VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        assertThat(adminAccount).contains(
                "IN p_admin_user_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        assertThat(adminAccount).doesNotContain("SUBSTRING_INDEX(p_contact_email");
        assertThat(approvalProcedure).contains(
                "IN p_contact_email VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        assertThat(approvalProcedure).contains(
                "IN p_admin_user_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        String executableTenantProcedure = stripLineComments(forcedTenantProcedure);
        assertThat(PlSqlInitializer.CREATE_OR_ACTIVATE_TENANT_PROCEDURE)
                .doesNotContain("V20251222_001");
        assertThat(executableTenantProcedure).doesNotContain("CALL CopyDefaultTenantCodes");
        assertThat(executableTenantProcedure).doesNotContain("CALL CreateDefaultTenantUsers");
        assertThat(executableTenantProcedure).doesNotContain("ROLLBACK;");
        assertThat(executableTenantProcedure).doesNotContain("START TRANSACTION");
        assertThat(executableTenantProcedure).doesNotContain("COMMIT;");
        assertThat(executableTenantProcedure).contains("INSERT INTO tenants");
        assertThat(executableTenantProcedure).contains("user_id, tenant_id, email, password");

        String executableSampleUsers = stripLineComments(forcedSampleUsers);
        assertThat(executableSampleUsers).doesNotContain("username");
        assertThat(executableSampleUsers).doesNotContain("ROLLBACK");
        assertThat(executableSampleUsers).doesNotContain("START TRANSACTION");
        assertThat(executableSampleUsers).doesNotContain("COMMIT");
        assertThat(executableSampleUsers).contains("CREATE PROCEDURE CreateDefaultTenantUsers");
    }

    private static String stripLineComments(String sql) {
        return sql.replaceAll("(?m)^\\s*--.*(?:\\r?\\n|$)", "");
    }

    private static String read(String classpathLocation) throws Exception {
        ClassPathResource resource = new ClassPathResource(classpathLocation);
        assertThat(resource.exists()).as(classpathLocation).isTrue();
        return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
    }
}
