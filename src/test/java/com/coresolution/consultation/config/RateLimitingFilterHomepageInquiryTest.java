package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.coresolution.consultation.constant.DocumentationIpConstants;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.FilterChain;
import java.lang.reflect.Field;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
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
    void homepageInquiryPostWithMatrixParamStillRateLimited() throws Exception {
        MindgardenSecurityProperties properties = new MindgardenSecurityProperties();
        properties.getRateLimit().setHomepageInquiryRequestsPerMinute(1);
        properties.getRateLimit().setHomepageInquiryRequestsPerDay(100);

        @SuppressWarnings("unchecked")
        ObjectProvider<MeterRegistry> meterRegistryProvider = mock(ObjectProvider.class);
        RateLimitingConfig.RateLimitingFilter filter =
                new RateLimitingConfig.RateLimitingFilter(properties, meterRegistryProvider);
        FilterChain chain = mock(FilterChain.class);
        String uri = "/api/v1/public/tenants/x/inquiries;bypass=1";
        String ip = "192.0.2.40";

        MockHttpServletRequest first = new MockHttpServletRequest("POST", uri);
        first.setRemoteAddr(ip);
        MockHttpServletResponse firstResponse = new MockHttpServletResponse();
        filter.doFilterInternal(first, firstResponse, chain);
        assertThat(firstResponse.getStatus()).isNotEqualTo(429);
        verify(chain).doFilter(first, firstResponse);

        MockHttpServletRequest second = new MockHttpServletRequest("POST", uri);
        second.setRemoteAddr(ip);
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();
        filter.doFilterInternal(second, secondResponse, chain);

        assertThat(secondResponse.getStatus()).isEqualTo(429);
        assertThat(secondResponse.getContentAsString()).contains("문의 요청이 너무 많습니다");
    }

    @Test
    void normalizeRequestPath_stripsMatrixAndQuery() {
        assertThat(RateLimitingConfig.RateLimitingFilter.normalizeRequestPath(
                "/api/v1/public/tenants/x/inquiries;bypass=1"))
                .isEqualTo("/api/v1/public/tenants/x/inquiries");
        // segment 단위 ; 제거: x;evil= → x 이므로 뒤 /inquiries 는 남음 (우회가 아니라 rate-limit 대상)
        assertThat(RateLimitingConfig.RateLimitingFilter.normalizeRequestPath(
                "/api/v1/public/tenants/x;evil=/inquiries"))
                .isEqualTo("/api/v1/public/tenants/x/inquiries");
        assertThat(RateLimitingConfig.RateLimitingFilter.normalizeRequestPath(
                "/api/v1/public/tenants/x/inquiries;jsessionid=ABC?foo=1"))
                .isEqualTo("/api/v1/public/tenants/x/inquiries");
    }

    @Test
    void cleanupOldRequestsIsThrottledAcrossNonMatchingRequests() throws Exception {
        MindgardenSecurityProperties properties = new MindgardenSecurityProperties();
        @SuppressWarnings("unchecked")
        ObjectProvider<MeterRegistry> meterRegistryProvider = mock(ObjectProvider.class);
        RateLimitingConfig.RateLimitingFilter filter =
                new RateLimitingConfig.RateLimitingFilter(properties, meterRegistryProvider);
        FilterChain chain = mock(FilterChain.class);

        String uri = "/api/v1/public/tenants/mindgarden/inquiries";
        String ip = "192.0.2.50";
        MockHttpServletRequest seed = new MockHttpServletRequest("POST", uri);
        seed.setRemoteAddr(ip);
        filter.doFilterInternal(seed, new MockHttpServletResponse(), chain);

        @SuppressWarnings("unchecked")
        Map<String, Object> requestCounts = (Map<String, Object>) readableField(filter, "requestCounts");
        assertThat(requestCounts).isNotEmpty();
        // day 버킷(24h)까지 만료되도록 충분히 과거로 설정
        long expiredAt = System.currentTimeMillis() - (25L * 60L * 60L * 1000L);
        for (Object info : requestCounts.values()) {
            Field lastRequestTime = info.getClass().getDeclaredField("lastRequestTime");
            lastRequestTime.setAccessible(true);
            lastRequestTime.setLong(info, expiredAt);
        }

        AtomicLong lastCleanup = (AtomicLong) readableField(filter, "lastCleanupEpochMs");
        lastCleanup.set(System.currentTimeMillis());

        MockHttpServletRequest other = new MockHttpServletRequest("GET", "/api/v1/health");
        other.setRemoteAddr(ip);
        filter.doFilterInternal(other, new MockHttpServletResponse(), chain);
        assertThat(requestCounts).isNotEmpty();

        lastCleanup.set(0L);
        filter.doFilterInternal(other, new MockHttpServletResponse(), chain);
        assertThat(requestCounts).isEmpty();
    }

    private static Object readableField(Object target, String name) throws Exception {
        Field field = target.getClass().getDeclaredField(name);
        field.setAccessible(true);
        return field.get(target);
    }

    @Test
    void homepageInquiryPostPassesWhenWithinMinuteAndDayLimits() throws Exception {
        MindgardenSecurityProperties properties = new MindgardenSecurityProperties();
        properties.getRateLimit().setHomepageInquiryRequestsPerMinute(5);
        properties.getRateLimit().setHomepageInquiryRequestsPerDay(30);

        @SuppressWarnings("unchecked")
        ObjectProvider<MeterRegistry> meterRegistryProvider = mock(ObjectProvider.class);
        RateLimitingConfig.RateLimitingFilter filter =
                new RateLimitingConfig.RateLimitingFilter(properties, meterRegistryProvider);
        FilterChain chain = mock(FilterChain.class);
        String uri = "/api/v1/public/tenants/mindgarden/inquiries";
        String ip = "192.0.2.30";

        for (int i = 0; i < 3; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", uri);
            req.setRemoteAddr(ip);
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilterInternal(req, response, chain);
            assertThat(response.getStatus()).isNotEqualTo(429);
        }
        verify(chain, times(3)).doFilter(org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any());
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
