package com.coresolution.core.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.tenant.TenantAccessDecision;
import com.coresolution.core.tenant.TenantAccessEvaluator;
import com.coresolution.core.tenant.TenantAccessMessages;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

/**
 * 보호 API 에서 정지·종료 테넌트를 상수 코드로 막는지.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TenantContextFilter 접근 차단")
class TenantContextFilterAccessTest {

    private static final String TENANT_ID = "tenant-filter-access";

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private Environment environment;

    @Mock
    private TenantAccessEvaluator tenantAccessEvaluator;

    @Mock
    private FilterChain filterChain;

    @Test
    @DisplayName("SUSPENDED 보호 API 는 403 이고 체인을 타지 않음")
    void suspendedProtectedApiDenied() throws Exception {
        when(tenantAccessEvaluator.decide(TENANT_ID, "/api/v1/schedules"))
                .thenReturn(TenantAccessDecision.DENY_SUSPENDED);
        TenantContextFilter filter = new TenantContextFilter(
                tenantRepository, environment, tenantAccessEvaluator);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/schedules");
        request.addHeader("X-Tenant-Id", TENANT_ID);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, filterChain);

        assertThat(response.getStatus()).isEqualTo(TenantAccessMessages.DENY_HTTP_STATUS);
        assertThat(response.getContentAsString()).contains(TenantAccessMessages.DENY_CODE);
        assertThat(response.getContentAsString()).contains(TenantAccessMessages.DENY_MESSAGE);
        verify(filterChain, never()).doFilter(request, response);
    }
}
