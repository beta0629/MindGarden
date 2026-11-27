package com.coresolution.consultation.sct.unit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import com.coresolution.consultation.config.MindgardenSecurityProperties;
import com.coresolution.consultation.config.RateLimitingConfig;
import com.coresolution.consultation.config.SecurityHeaderFilter;
import com.coresolution.consultation.constant.DocumentationIpConstants;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.dto.SctVerifyRequest;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.exception.SctVerifyLockedException;
import com.coresolution.consultation.sct.repository.SctFormItemRepository;
import com.coresolution.consultation.sct.repository.SctFormTemplateRepository;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.repository.SctInviteAccessAttemptRepository;
import com.coresolution.consultation.sct.repository.SctResponseAnswerRepository;
import com.coresolution.consultation.sct.repository.SctRotatedTokenHashRepository;
import com.coresolution.consultation.sct.service.SctConsentService;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import com.coresolution.consultation.sct.service.SctVerifySessionStore;
import com.coresolution.consultation.sct.service.impl.SctPublicServiceImpl;
import com.coresolution.consultation.sct.util.SctTokenHasher;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.util.PhoneHashUtils;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

/**
 * PR 보안 HIGH — no-store, rate limit, verify fail 원자성.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
class SctSecurityHighTest {

    @Test
    void securityHeaderFilter_appliesNoStoreToAuthenticatedSct() throws Exception {
        SecurityHeaderFilter filter = new SecurityHeaderFilter();
        MockHttpServletRequest request = new MockHttpServletRequest(
                "GET", "/api/v1/sct/session-view");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        filter.doFilter(request, response, chain);
        assertThat(response.getHeader("Cache-Control")).contains("no-store");
        verify(chain).doFilter(request, response);
    }

    @Test
    void securityHeaderFilter_appliesNoStoreToPublicSct() throws Exception {
        SecurityHeaderFilter filter = new SecurityHeaderFilter();
        MockHttpServletRequest request = new MockHttpServletRequest(
                "GET", "/api/v1/public/sct/abc/meta");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        filter.doFilter(request, response, chain);
        assertThat(response.getHeader("Cache-Control")).contains("no-store");
        verify(chain).doFilter(request, response);
    }

    @Test
    void rateLimit_appliesToPublicSctPrefix() throws Exception {
        MindgardenSecurityProperties properties = new MindgardenSecurityProperties();
        properties.getRateLimit().setSctPublicRequestsPerMinute(1);
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        @SuppressWarnings("unchecked")
        ObjectProvider<MeterRegistry> meterRegistryProvider = mock(ObjectProvider.class);
        when(meterRegistryProvider.getIfAvailable()).thenReturn(registry);

        RateLimitingConfig.RateLimitingFilter filter =
                new RateLimitingConfig.RateLimitingFilter(properties, meterRegistryProvider);
        FilterChain chain = mock(FilterChain.class);
        String ip = DocumentationIpConstants.RFC5737_TEST_NET_1_EXAMPLE;
        String uri = "/api/v1/public/sct/tok/meta";

        MockHttpServletRequest first = new MockHttpServletRequest("GET", uri);
        first.setRemoteAddr(ip);
        MockHttpServletResponse firstResponse = new MockHttpServletResponse();
        filter.doFilter(first, firstResponse, chain);
        verify(chain).doFilter(first, firstResponse);

        MockHttpServletRequest second = new MockHttpServletRequest("GET", uri);
        second.setRemoteAddr(ip);
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();
        filter.doFilter(second, secondResponse, chain);

        verify(chain, times(1)).doFilter(first, firstResponse);
        assertThat(secondResponse.getStatus()).isEqualTo(429);
        assertThat(secondResponse.getContentAsString()).contains("SCT 공개 API");
        assertThat(registry.counter("mindgarden.rate_limit.blocked", "reason", "sct_public").count())
                .isEqualTo(1.0);
    }

    @Test
    void verifyFailCount_parallelCannotBypassLock() throws Exception {
        String raw = "parallel-verify-token-32bytes!!!!";
        String phone = "01011112222";
        SctInvitation invitation = SctInvitation.builder()
                .formTemplateId(1L)
                .targetPhone(phone)
                .targetPhoneHash(PhoneHashUtils.sha256Hex(phone))
                .tokenHash(SctTokenHasher.sha256Hex(raw))
                .tokenExpiresAt(java.time.LocalDateTime.now().plusDays(1))
                .status("SENT")
                .sentByUserId(1L)
                .verifyFailCount(0)
                .requiresGuardian(false)
                .build();
        invitation.setId(1L);
        invitation.setTenantId("t1");

        SctInvitationRepository invitationRepository = mock(SctInvitationRepository.class);
        when(invitationRepository.findByTokenHashAndIsDeletedFalseForUpdate(
                ArgumentMatchers.anyString()))
                .thenReturn(java.util.Optional.of(invitation));
        when(invitationRepository.save(ArgumentMatchers.any())).thenAnswer(inv -> inv.getArgument(0));

        SctInviteAccessAttemptRepository attemptRepository = mock(SctInviteAccessAttemptRepository.class);
        when(attemptRepository.save(ArgumentMatchers.any())).thenAnswer(inv -> inv.getArgument(0));

        SctPublicServiceImpl service = new SctPublicServiceImpl(
                invitationRepository,
                mock(SctFormTemplateRepository.class),
                mock(SctFormItemRepository.class),
                mock(SctResponseAnswerRepository.class),
                attemptRepository,
                mock(SctRotatedTokenHashRepository.class),
                new SctVerifySessionStore(SctVerifySessionRedisTestSupport.memoryRedis().provider()),
                mock(SctFeatureGuard.class),
                mock(SctConsentService.class),
                mock(AuditLogService.class));

        int threads = SctConstants.VERIFY_MAX_FAILURES + 3;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threads);
        AtomicInteger locked = new AtomicInteger();
        AtomicInteger mismatch = new AtomicInteger();
        SctVerifyRequest bad = SctVerifyRequest.builder().phone("01099998888").build();

        for (int i = 0; i < threads; i++) {
            pool.submit(() -> {
                try {
                    start.await();
                    // 직렬화 시뮬레이션: 동일 행 잠금 하에서 순차 증가
                    synchronized (invitation) {
                        try {
                            service.verify(raw, bad, "127.0.0.1");
                        } catch (SctVerifyLockedException e) {
                            locked.incrementAndGet();
                        } catch (IllegalArgumentException e) {
                            mismatch.incrementAndGet();
                        }
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    done.countDown();
                }
            });
        }
        start.countDown();
        assertThat(done.await(10, TimeUnit.SECONDS)).isTrue();
        pool.shutdownNow();

        assertThat(invitation.getVerifyFailCount()).isEqualTo(SctConstants.VERIFY_MAX_FAILURES);
        assertThat(invitation.getVerifyLockedUntil()).isNotNull();
        assertThat(locked.get()).isGreaterThanOrEqualTo(1);
        assertThat(mismatch.get() + locked.get()).isEqualTo(threads);
    }
}
