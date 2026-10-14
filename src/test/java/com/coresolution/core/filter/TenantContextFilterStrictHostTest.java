package com.coresolution.core.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.entity.User;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import jakarta.servlet.FilterChain;
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
 * 비로그인 STRICT 공개 데이터 경로에서 테넌트를 Host 로만 해석하는지 검증한다.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TenantContextFilter STRICT 호스트 경로")
class TenantContextFilterStrictHostTest {

    private static final String HOST_TENANT = "tenant-host-a";
    private static final String OTHER_TENANT = "tenant-other-b";
    private static final String HOST_SUBDOMAIN = "mindcare";
    private static final String HOST_A = "mindcare.dev.core-solution.co.kr";
    private static final String HOST_NO_SUBDOMAIN = "dev.core-solution.co.kr";
    private static final String CATALOG_URI = "/api/v1/shop/catalog";
    private static final String CODES_URI = "/api/v1/common-codes";
    private static final String AUTH_URI = "/api/v1/auth/login";
    private static final String EXTERNAL_PEER = "203.0.113.9";

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private Environment environment;

    private TenantContextFilter filter;

    @BeforeEach
    void setUp() {
        lenient().when(environment.getActiveProfiles()).thenReturn(new String[] {"dev"});
        filter = new TenantContextFilter(tenantRepository, environment);
        ReflectionTestUtils.setField(filter, "localDefaultTenantId", "");
        TenantContextHolder.clear();
        lenient().when(tenantRepository.findBySubdomainIgnoreCase(eq(HOST_SUBDOMAIN)))
                .thenReturn(Optional.of(Tenant.builder().tenantId(HOST_TENANT).subdomain(HOST_SUBDOMAIN).build()));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("STRICT: Host 테넌트와 X-Tenant-Id 가 다르면 Host 테넌트를 쓴다")
    void strict_headerIgnored_hostWins() throws Exception {
        String tenant = run("GET", CATALOG_URI, req -> {
            req.addHeader("Host", HOST_A);
            req.addHeader("X-Tenant-Id", OTHER_TENANT);
        });
        assertThat(tenant).isEqualTo(HOST_TENANT);
    }

    @Test
    @DisplayName("STRICT: 서브도메인 없는 Host 는 X-Tenant-Id 를 써도 테넌트가 없다")
    void strict_noSubdomainHost_headerIgnored() throws Exception {
        String tenant = run("GET", CODES_URI, req -> {
            req.addHeader("Host", HOST_NO_SUBDOMAIN);
            req.addHeader("X-Tenant-Id", OTHER_TENANT);
        });
        assertThat(tenant).isNull();
    }

    @Test
    @DisplayName("STRICT: X-Tenant-Subdomain 헤더는 무시한다")
    void strict_subdomainHeaderIgnored() throws Exception {
        String tenant = run("GET", CATALOG_URI, req -> {
            req.addHeader("Host", HOST_NO_SUBDOMAIN);
            req.addHeader("X-Tenant-Subdomain", HOST_SUBDOMAIN);
        });
        assertThat(tenant).isNull();
        verify(tenantRepository, never()).findBySubdomainIgnoreCase(eq(HOST_SUBDOMAIN));
    }

    @Test
    @DisplayName("STRICT: 루프백(nginx)이 아닌 직접 요청의 X-Forwarded-Host 는 무시한다")
    void strict_forwardedHostFromExternalPeer_ignored() throws Exception {
        String tenant = run("GET", CATALOG_URI, req -> {
            req.setRemoteAddr(EXTERNAL_PEER);
            req.addHeader("Host", "localhost:8080");
            req.addHeader("X-Forwarded-Host", HOST_A);
        });
        assertThat(tenant).isNull();
    }

    @Test
    @DisplayName("STRICT: nginx(루프백)가 넘긴 X-Forwarded-Host 는 신뢰한다")
    void strict_forwardedHostFromLoopback_trusted() throws Exception {
        String tenant = run("GET", CATALOG_URI, req -> {
            req.setRemoteAddr("127.0.0.1");
            req.addHeader("Host", "localhost:8080");
            req.addHeader("X-Forwarded-Host", HOST_A);
        });
        assertThat(tenant).isEqualTo(HOST_TENANT);
    }

    @Test
    @DisplayName("STRICT: 로그인 세션 사용자는 세션 테넌트를 쓴다(기존 동작 유지)")
    void strict_loggedInUser_sessionTenantWins() throws Exception {
        String tenant = run("GET", CATALOG_URI, req -> {
            req.addHeader("Host", HOST_A);
            req.addHeader("X-Tenant-Id", OTHER_TENANT);
            User user = new User();
            user.setId(1L);
            user.setTenantId(OTHER_TENANT);
            req.getSession(true).setAttribute(SessionConstants.USER_OBJECT, user);
        });
        assertThat(tenant).isEqualTo(OTHER_TENANT);
    }

    @Test
    @DisplayName("인증 흐름 경로(auth)는 X-Tenant-Id 헤더를 계속 사용한다")
    void authFlow_headerStillUsed() throws Exception {
        String tenant = run("POST", AUTH_URI, req -> {
            req.addHeader("Host", HOST_NO_SUBDOMAIN);
            req.addHeader("X-Tenant-Id", OTHER_TENANT);
        });
        assertThat(tenant).isEqualTo(OTHER_TENANT);
    }

    private String run(String method, String uri, RequestCustomizer customizer) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setRequestURI(uri);
        customizer.customize(request);
        AtomicReference<String> captured = new AtomicReference<>();
        FilterChain chain = (req, res) -> captured.set(TenantContextHolder.getTenantId());
        filter.doFilter(request, new MockHttpServletResponse(), chain);
        return captured.get();
    }

    @FunctionalInterface
    private interface RequestCustomizer {
        void customize(MockHttpServletRequest request);
    }
}
