package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * {@link SessionBasedAuthenticationFilter} TenantContextHolder finally 가드 회귀 테스트.
 *
 * <p>표준화 v2 §B1 (STANDARDIZATION_ROADMAP.md) / PR #226 hotfix-4 동행 —
 * 운영 thread-pool(Tomcat HTTP-NIO) 재사용 시 {@link TenantContextHolder}
 * ThreadLocal leak 차단을 보장하는 회귀 테스트.</p>
 *
 * <p>본 필터 내부의 {@code TenantContextHolder.setTenantId(...)} 호출이
 * normal flow / 예외 flow 와 무관하게 finally 에서 정리되는지 검증한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-12
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SessionBasedAuthenticationFilter TenantContextHolder finally 가드")
class SessionBasedAuthenticationFilterTenantClearTest {

    private static final String TENANT_ID = "tenant-sbaf-leak-guard";
    private static final String REQUEST_PATH = "/api/v1/test";

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private SessionBasedAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new SessionBasedAuthenticationFilter();
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("정상 flow: 필터 종료 후 TenantContextHolder 가 비어 있다")
    void normalFlow_clearsTenantContext() throws Exception {
        when(request.getRequestURI()).thenReturn(REQUEST_PATH);
        // 본 필터의 인증 로직은 setTenantId 를 호출할 수 있다.
        // 사전 leak 시나리오를 시뮬레이션해 finally clear 가 정상 동작하는지 검증.
        TenantContextHolder.setTenantId(TENANT_ID);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(TenantContextHolder.getTenantId())
            .as("필터 종료 후 TenantContextHolder 는 finally 가드에서 정리되어야 한다")
            .isNull();
    }

    @Test
    @DisplayName("chain.doFilter 도중 RuntimeException 발생 시에도 TenantContextHolder 가 비어 있다")
    void chainDoFilterThrowsRuntime_stillClearsTenantContext() throws Exception {
        when(request.getRequestURI()).thenReturn(REQUEST_PATH);
        TenantContextHolder.setTenantId(TENANT_ID);
        doThrow(new RuntimeException("downstream filter failure"))
            .when(filterChain).doFilter(any(), any());

        assertThatThrownBy(() -> filter.doFilterInternal(request, response, filterChain))
            .isInstanceOf(RuntimeException.class)
            .hasMessage("downstream filter failure");

        assertThat(TenantContextHolder.getTenantId())
            .as("chain.doFilter 도중 RuntimeException 이 발생해도 finally 가드는 동작해야 한다")
            .isNull();
    }

    @Test
    @DisplayName("chain.doFilter 도중 ServletException 발생 시에도 TenantContextHolder 가 비어 있다")
    void chainDoFilterThrowsServlet_stillClearsTenantContext() throws Exception {
        when(request.getRequestURI()).thenReturn(REQUEST_PATH);
        TenantContextHolder.setTenantId(TENANT_ID);
        doThrow(new ServletException("servlet failure"))
            .when(filterChain).doFilter(any(), any());

        assertThatThrownBy(() -> filter.doFilterInternal(request, response, filterChain))
            .isInstanceOf(ServletException.class)
            .hasMessage("servlet failure");

        assertThat(TenantContextHolder.getTenantId())
            .as("chain.doFilter 도중 ServletException 이 발생해도 finally 가드는 동작해야 한다")
            .isNull();
    }

    @Test
    @DisplayName("이전 요청이 남긴 TenantContextHolder 도 다음 요청의 finally 가드에서 정리된다")
    void leakedTenantContextFromPreviousRequest_isClearedByFinallyGuard() throws Exception {
        when(request.getRequestURI()).thenReturn(REQUEST_PATH);
        // thread-pool 재사용 시 이전 요청에서 남은 ThreadLocal 시뮬레이션
        TenantContextHolder.setTenantId("leaked-tenant-from-previous-request");

        filter.doFilterInternal(request, response, filterChain);

        assertThat(TenantContextHolder.getTenantId())
            .as("이전 요청이 leak 한 tenantId 도 본 필터 finally 가드에서 반드시 정리되어야 한다")
            .isNull();
    }
}
