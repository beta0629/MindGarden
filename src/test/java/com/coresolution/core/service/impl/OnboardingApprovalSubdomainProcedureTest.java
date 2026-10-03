package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import com.coresolution.consultation.config.PlSqlInitializer;
import com.coresolution.core.constant.OnboardingConstants;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

/**
 * 개발 서버가 기동 때 덮어쓰는 CreateOrActivateTenant 가 한글 센터명을 서브도메인으로 넣지 않는지 본다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
class OnboardingApprovalSubdomainProcedureTest {

    @Test
    @DisplayName("신규 테넌트 분기는 센터명을 공백 치환만 해서 subdomain 에 넣지 않는다")
    void newTenantBranchDoesNotStoreRawCenterNameAsSubdomain() throws Exception {
        String executable = stripLineComments(read(PlSqlInitializer.CREATE_OR_ACTIVATE_TENANT_PROCEDURE));

        assertThat(executable).doesNotContain(
                "LOWER(REPLACE(REPLACE(p_tenant_name, ' ', '-'), '_', '-'))");
        assertThat(executable).contains("v_generated_subdomain");
        assertThat(executable).contains("REGEXP_REPLACE(v_generated_subdomain, '[^a-z0-9-]', '')");
        assertThat(executable).contains(OnboardingConstants.ERROR_ONBOARDING_SUBDOMAIN_NOT_DNS_LABEL);
        assertThat(executable).contains(OnboardingConstants.ERROR_ONBOARDING_SUBDOMAIN_HOST_UNAVAILABLE);
        assertThat(executable).contains("v_existing_subdomain");
        assertThat(executable).contains("IN p_subdomain VARCHAR(100)");
        assertThat(executable).doesNotContain("CREATE FUNCTION");
        assertThat(executable).doesNotContain("CREATE TABLE");
        assertThat(executable).contains("INSERT INTO tenants (");
        assertThat(executable).contains(
                "tenant_id, name, business_type, status, subscription_status,");
        assertThat(executable).contains(
                "settings_json, subdomain, created_at, updated_at,");
        assertThat(executable).contains("user_id, tenant_id, email, password");
        assertThat(executable).contains("테넌트가 이미 활성화되어 있습니다");
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
