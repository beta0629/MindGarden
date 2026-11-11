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
 * 홈페이지 공개 문의 경로의 IP 분·일 레이트리밋 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
class RateLimitingFilterHomepageInquiryTest {

    @Test
    void homepageInquiryPostReturns429WhenPerMinuteExceeded() throws Exception {
        MindgardenSecurityProperties properties = new MindgardenSecurityProperties();
        properties.getRateLimit().setHomepageInquiryRequestsPerMinute(1);
        properties.getRateLimit().setHomepageInquiryRequestsPerDay(100);

        @SuppressWarnings("unchecked")
        ObjectProvider<MeterRegistry> meterRegistryProvider = mock(ObjectProvider.class);
        RateLimitingConfig.RateLimitingFilter filter =
                new RateLimitingConfig.RateLimitingFilter(properties, meterRegistryProvider);
        FilterChain chain = mock(FilterChain.class);
        String uri = "/api/v1/public/tenants/mindgarden/inquiries";
        String ip = DocumentationIpConstants.RFC5737_TEST_NET_1_EXAMPLE;

        MockHttpServletRequest first = new MockHttpServletRequest("POST", uri);
        first.setRemoteAddr(ip);
        MockHttpServletResponse firstResponse = new MockHttpServletResponse();
        filter.doFilterInternal(first, firstResponse, chain);
        verify(chain).doFilter(first, firstResponse);

        MockHttpServletRequest second = new MockHttpServletRequest("POST", uri);
        second.setRemoteAddr(ip);
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();
        filter.doFilterInternal(second, secondResponse, chain);

        verify(chain, times(1)).doFilter(first, firstResponse);
        assertThat(secondResponse.getStatus()).isEqualTo(429);
        assertThat(secondResponse.getContentAsString()).contains("문의 요청이 너무 많습니다");
    }

    @Test
    void homepageInquiryPostReturns429WhenPerDayExceeded() throws Exception {
        MindgardenSecurityProperties properties = new MindgardenSecurityProperties();
        properties.getRateLimit().setHomepageInquiryRequestsPerMinute(100);
        properties.getRateLimit().setHomepageInquiryRequestsPerDay(2);

        @SuppressWarnings("unchecked")
        ObjectProvider<MeterRegistry> meterRegistryProvider = mock(ObjectProvider.class);
        RateLimitingConfig.RateLimitingFilter filter =
                new RateLimitingConfig.RateLimitingFilter(properties, meterRegistryProvider);
        FilterChain chain = mock(FilterChain.class);
        String uri = "/api/v1/public/tenants/mindgarden/inquiries";
        String ip = "192.0.2.20";

        for (int i = 0; i < 2; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", uri);
            req.setRemoteAddr(ip);
            filter.doFilterInternal(req, new MockHttpServletResponse(), chain);
        }

        MockHttpServletRequest blocked = new MockHttpServletRequest("POST", uri);
        blocked.setRemoteAddr(ip);
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();
        filter.doFilterInternal(blocked, blockedResponse, chain);

        assertThat(blockedResponse.getStatus()).isEqualTo(429);
        assertThat(blockedResponse.getContentAsString()).contains("문의 요청이 너무 많습니다");
    }
}
