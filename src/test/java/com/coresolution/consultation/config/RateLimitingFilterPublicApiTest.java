package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.coresolution.consultation.constant.DocumentationIpConstants;

import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

/**
 * {@link RateLimitingConfig.RateLimitingFilter} 가 공개 계정 연동 접두에 대해 429 시 명시적 메시지를 반환하는지 검증.
 *
 * @author CoreSolution
 * @since 2026-05-06
 */
class RateLimitingFilterPublicApiTest {

    @Test
    void integrationPathReturnsDedicated429JsonWhenPerMinuteLimitExceeded() throws Exception {
        MindgardenSecurityProperties properties = new MindgardenSecurityProperties();
        properties.getRateLimit().setIntegrationRequestsPerMinute(1);

        @SuppressWarnings("unchecked")
        ObjectProvider<MeterRegistry> meterRegistryProvider = mock(ObjectProvider.class);

        RateLimitingConfig.RateLimitingFilter filter =
            new RateLimitingConfig.RateLimitingFilter(properties, meterRegistryProvider);

        FilterChain chain = mock(FilterChain.class);

        MockHttpServletRequest first = new MockHttpServletRequest("POST",
            "/api/v1/accounts/integration/send-verification-code");
        first.setRemoteAddr(DocumentationIpConstants.RFC5737_TEST_NET_1_EXAMPLE);
        MockHttpServletResponse firstResponse = new MockHttpServletResponse();
        filter.doFilterInternal(first, firstResponse, chain);
        verify(chain).doFilter(first, firstResponse);
        assertThat(firstResponse.getStatus()).isNotEqualTo(429);

        MockHttpServletRequest second = new MockHttpServletRequest("POST",
            "/api/v1/accounts/integration/send-verification-code");
        second.setRemoteAddr(DocumentationIpConstants.RFC5737_TEST_NET_1_EXAMPLE);
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();
        filter.doFilterInternal(second, secondResponse, chain);

        verify(chain, times(1)).doFilter(first, firstResponse);
        assertThat(secondResponse.getStatus()).isEqualTo(429);
        assertThat(secondResponse.getContentAsString())
            .contains("계정 연동·이메일 인증 API 요청이 너무 많습니다");
    }
}
