package com.coresolution.core.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockingDetails;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import com.coresolution.core.security.TenantAdminUserIdAllocator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.invocation.Invocation;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

@DisplayName("관리자 user_id Java 폴백")
class OnboardingAdminUserIdFallbackTest {

    @Test
    @DisplayName("같은 테넌트에 삭제 행이 있어도 접미사를 붙여 INSERT 한다")
    void deletedRowInSameTenantUsesSuffix() {
        JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
        when(jdbcTemplate.queryForObject(contains("user_id = ?"), eq(Integer.class), anyString(), anyString()))
                .thenReturn(1, 0);
        OnboardingApprovalServiceImpl service = new OnboardingApprovalServiceImpl(
                jdbcTemplate, null, null, null, null, null, null, null, null);

        try {
            ReflectionTestUtils.invokeMethod(service, "createAdminAccountDirectly",
                    "tenant-mindcare", "beta0629@example.com", "k1::QUJDRA",
                    "마인드케어", "hash-placeholder", "ops", "CONSULTATION");
        } catch (RuntimeException ignored) {
            // 원장 역할 할당은 이 목에서 실패할 수 있다. user_id 는 INSERT 인자로 이미 정해진다.
        }

        String insertedUserId = null;
        for (Invocation invocation : mockingDetails(jdbcTemplate).getInvocations()) {
            Object[] args = invocation.getArguments();
            if ("update".equals(invocation.getMethod().getName()) && args.length > 2
                    && String.valueOf(args[0]).contains("INSERT INTO users")) {
                insertedUserId = (String) args[2];
            }
        }

        ArgumentCaptor<String> checked = ArgumentCaptor.forClass(String.class);
        verify(jdbcTemplate, atLeast(2)).queryForObject(
                contains("user_id = ?"), eq(Integer.class), anyString(), checked.capture());
        List<String> candidates = checked.getAllValues();

        assertThat(insertedUserId).isEqualTo(candidates.get(0) + "1");
        assertThat(insertedUserId).isEqualTo(candidates.get(1));
        assertThat(insertedUserId).startsWith(TenantAdminUserIdAllocator.PREFIX);
        assertThat(insertedUserId).isNotEqualTo("beta0629");
        assertThat(insertedUserId).doesNotContain("@");
        assertThat(candidates.get(0)).doesNotContain("beta0629");
    }
}
