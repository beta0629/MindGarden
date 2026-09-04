package com.coresolution.core.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import jakarta.servlet.FilterChain;
import java.lang.reflect.Method;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * {@link TenantContextFilter} 테넌트 추출 — local 전용 폴백·Host/X-Forwarded-Host 서브도메인.
 *
 * @author CoreSolution
 * @since 2026-09-04
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TenantContextFilter 테넌트 추출")
class TenantContextFilterExtractTenantTest {

    private static final String FIXTURE_TENANT_ID = "tenant-test-counseling-001";
    private static final String FIXTURE_SUBDOMAIN = "mindgarden";
    private static final String FIXTURE_DEV_HOST = "mindgarden.dev.core-solution.co.kr";
    private static final String AUTH_LOGIN_URI = "/api/v1/auth/login";

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private Environment environment;

    private TenantContextFilter filter;

    @BeforeEach
    void setUp() {
        filter = new TenantContextFilter(tenantRepository, environment);
        ReflectionTestUtils.setField(filter, "localDefaultTenantId", "");
        TenantContextHolder.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("isLocalProfile: activeProfiles=dev 이면 false (local 폴백 경로 비활성)")
    void isLocalProfile_dev_isFalse() throws Exception {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"dev"});

        assertThat(invokeIsLocalProfile()).isFalse();
    }

    @Test
    @DisplayName("isLocalProfile: activeProfiles=local 이면 true")
    void isLocalProfile_local_isTrue() throws Exception {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"local"});

        assertThat(invokeIsLocalProfile()).isTrue();
    }

    @Test
    @DisplayName("Host=mindgarden.dev.core-solution.co.kr → subdomain 조회")
    void extract_hostDevSubdomain_resolvesTenant() throws Exception {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"dev"});
        stubTenantBySubdomain(FIXTURE_SUBDOMAIN, FIXTURE_TENANT_ID);

        String captured = runPublicAuthAndCaptureTenant(req -> {
            req.addHeader("Host", FIXTURE_DEV_HOST);
        });

        assertThat(captured).isEqualTo(FIXTURE_TENANT_ID);
        verify(tenantRepository).findBySubdomainIgnoreCase(eq(FIXTURE_SUBDOMAIN));
    }

    @Test
    @DisplayName("Host=localhost + X-Forwarded-Host=mindgarden.dev... → 동일 subdomain 조회")
    void extract_localhostWithForwardedHost_resolvesTenant() throws Exception {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"dev"});
        stubTenantBySubdomain(FIXTURE_SUBDOMAIN, FIXTURE_TENANT_ID);

        String captured = runPublicAuthAndCaptureTenant(req -> {
            req.addHeader("Host", "localhost:8080");
            req.addHeader("X-Forwarded-Host", FIXTURE_DEV_HOST);
        });

        assertThat(captured).isEqualTo(FIXTURE_TENANT_ID);
        verify(tenantRepository).findBySubdomainIgnoreCase(eq(FIXTURE_SUBDOMAIN));
    }

    @Test
    @DisplayName("Host=localhost + profile=dev + LOCAL_DEFAULT 없음 → tenant null, subdomain 조회 없음")
    void extract_localhostDevWithoutDefault_returnsNull() throws Exception {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"dev"});

        String captured = runPublicAuthAndCaptureTenant(req -> {
            req.addHeader("Host", "localhost:8080");
        });

        assertThat(captured).isNull();
        verify(tenantRepository, never()).findBySubdomainIgnoreCase(org.mockito.ArgumentMatchers.anyString());
        assertThat(invokeIsLocalProfile()).isFalse();
    }

    @Test
    @DisplayName("Host=localhost + profile=local + LOCAL_DEFAULT 설정 → 기본 테넌트")
    void extract_localhostLocalWithDefault_usesLocalDefault() throws Exception {
        when(environment.getActiveProfiles()).thenReturn(new String[] {"local"});
        ReflectionTestUtils.setField(filter, "localDefaultTenantId", FIXTURE_TENANT_ID);

        String captured = runPublicAuthAndCaptureTenant(req -> {
            req.addHeader("Host", "127.0.0.1:8080");
        });

        assertThat(captured).isEqualTo(FIXTURE_TENANT_ID);
        verify(tenantRepository, never()).findBySubdomainIgnoreCase(org.mockito.ArgumentMatchers.anyString());
    }

    private boolean invokeIsLocalProfile() throws Exception {
        Method method = TenantContextFilter.class.getDeclaredMethod("isLocalProfile");
        method.setAccessible(true);
        return (Boolean) method.invoke(filter);
    }

    private void stubTenantBySubdomain(String subdomain, String tenantId) {
        Tenant tenant = Tenant.builder()
                .tenantId(tenantId)
                .subdomain(subdomain)
                .build();
        when(tenantRepository.findBySubdomainIgnoreCase(eq(subdomain)))
                .thenReturn(Optional.of(tenant));
    }

    private String runPublicAuthAndCaptureTenant(RequestCustomizer customizer) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", AUTH_LOGIN_URI);
        request.setRequestURI(AUTH_LOGIN_URI);
        customizer.customize(request);

        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicReference<String> captured = new AtomicReference<>();
        FilterChain chain = (req, res) -> captured.set(TenantContextHolder.getTenantId());

        filter.doFilter(request, response, chain);
        return captured.get();
    }

    @FunctionalInterface
    private interface RequestCustomizer {
        void customize(MockHttpServletRequest request);
    }
}
