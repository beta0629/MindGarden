package com.coresolution.core.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import com.coresolution.core.constant.TestDocumentationIps;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

/**
 * 신뢰 프록시 뒤에서만 설정된 헤더를 쓰고, 그 외에는 연결 주소를 쓴다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
class HttpRequestClientIpTest {

    private static final String REAL_IP_HEADER = "X-Real-IP";
    private static final String CONNECTING_IP_HEADER = "CF-Connecting-IP";
    private static final String FORWARDED_HEADER = "X-Forwarded-For";

    private final ClientIpTrust trust = ClientIpTrust.of(List.of(
            new ClientIpTrust.Rule(REAL_IP_HEADER, List.of("127.0.0.1/32", "::1/128")),
            new ClientIpTrust.Rule(CONNECTING_IP_HEADER, List.of(TestDocumentationIps.CLOUDFLARE_SAMPLE_CIDR))));

    private ClientIpTrust previousTrust;

    @BeforeEach
    void rememberProcessTrust() {
        previousTrust = HttpRequestClientIp.current();
    }

    @AfterEach
    void restoreProcessTrust() {
        HttpRequestClientIp.configure(previousTrust);
    }

    @Test
    @DisplayName("로컬 nginx 피어는 nginx가 덮어쓴 헤더를 쓰고 클라이언트가 넣은 전달 헤더는 무시한다")
    void trustedLoopbackUsesConfiguredHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(TestDocumentationIps.LOOPBACK_V4);
        request.addHeader(REAL_IP_HEADER, TestDocumentationIps.DOC_NET_2_EXAMPLE);
        request.addHeader(FORWARDED_HEADER, TestDocumentationIps.DOC_NET_3_EXAMPLE);
        request.addHeader(CONNECTING_IP_HEADER, TestDocumentationIps.DOC_NET_3_DEVICE_PRIMARY);

        assertThat(HttpRequestClientIp.resolve(request, trust)).isEqualTo(TestDocumentationIps.DOC_NET_2_EXAMPLE);
    }

    @Test
    @DisplayName("IPv6 루프백도 같은 nginx 헤더를 쓴다")
    void trustedIpv6LoopbackUsesConfiguredHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(TestDocumentationIps.LOOPBACK_V6);
        request.addHeader(REAL_IP_HEADER,
                TestDocumentationIps.DOC_NET_2_EXAMPLE + ", " + TestDocumentationIps.DOC_NET_3_EXAMPLE);

        assertThat(HttpRequestClientIp.resolve(request, trust)).isEqualTo(TestDocumentationIps.DOC_NET_2_EXAMPLE);
    }

    @Test
    @DisplayName("Cloudflare 피어는 그 대역에 묶인 헤더만 쓰고 다른 전달 헤더는 무시한다")
    void trustedCloudflarePeerUsesConnectingIpHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(TestDocumentationIps.CLOUDFLARE_RANGE_SAMPLE);
        request.addHeader(CONNECTING_IP_HEADER, TestDocumentationIps.DOC_NET_2_EXAMPLE);
        request.addHeader(REAL_IP_HEADER, TestDocumentationIps.DOC_NET_3_EXAMPLE);
        request.addHeader(FORWARDED_HEADER, TestDocumentationIps.DOC_NET_3_DEVICE_SECONDARY);

        assertThat(HttpRequestClientIp.resolve(request, trust)).isEqualTo(TestDocumentationIps.DOC_NET_2_EXAMPLE);
    }

    @Test
    @DisplayName("신뢰하지 않는 피어가 전달 헤더를 위조하면 연결 주소를 쓴다")
    void untrustedPeerIgnoresSpoofedForwardedHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(TestDocumentationIps.DOC_NET_3_EXAMPLE);
        request.addHeader(FORWARDED_HEADER, TestDocumentationIps.DOC_NET_2_EXAMPLE);
        request.addHeader(REAL_IP_HEADER, TestDocumentationIps.DOC_NET_2_PROXY_HOP);
        request.addHeader(CONNECTING_IP_HEADER, TestDocumentationIps.DOC_NET_3_DEVICE_PRIMARY);

        assertThat(HttpRequestClientIp.resolve(request, trust)).isEqualTo(TestDocumentationIps.DOC_NET_3_EXAMPLE);
    }

    @Test
    @DisplayName("헤더가 없으면 신뢰 피어여도 연결 주소를 쓴다")
    void noHeadersUsesRemoteAddress() {
        MockHttpServletRequest trusted = new MockHttpServletRequest();
        trusted.setRemoteAddr(TestDocumentationIps.LOOPBACK_V4);
        assertThat(HttpRequestClientIp.resolve(trusted, trust)).isEqualTo(TestDocumentationIps.LOOPBACK_V4);

        MockHttpServletRequest untrusted = new MockHttpServletRequest();
        untrusted.setRemoteAddr(TestDocumentationIps.DOC_NET_3_DEVICE_PRIMARY);
        assertThat(HttpRequestClientIp.resolve(untrusted, trust)).isEqualTo(TestDocumentationIps.DOC_NET_3_DEVICE_PRIMARY);
    }

    @Test
    @DisplayName("신뢰 헤더가 IP가 아니면 연결 주소로 떨어진다")
    void nonIpTrustedHeaderFallsBackToRemoteAddress() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(TestDocumentationIps.LOOPBACK_V4);
        request.addHeader(REAL_IP_HEADER, "unknown");
        request.addHeader(FORWARDED_HEADER, TestDocumentationIps.DOC_NET_2_EXAMPLE);

        assertThat(HttpRequestClientIp.resolve(request, trust)).isEqualTo(TestDocumentationIps.LOOPBACK_V4);
    }

    @Test
    @DisplayName("요청이 없으면 null")
    void nullRequestReturnsNull() {
        assertThat(HttpRequestClientIp.resolve(null, trust)).isNull();
    }

    @Test
    @DisplayName("프로세스 정책이 비어 있으면 전달 헤더를 믿지 않는다")
    void unconfiguredProcessIgnoresForwardedHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(TestDocumentationIps.LOOPBACK_V4);
        request.addHeader(FORWARDED_HEADER, TestDocumentationIps.DOC_NET_2_EXAMPLE);
        request.addHeader(REAL_IP_HEADER, TestDocumentationIps.DOC_NET_3_EXAMPLE);

        HttpRequestClientIp.configure(ClientIpTrust.none());
        assertThat(HttpRequestClientIp.resolve(request)).isEqualTo(TestDocumentationIps.LOOPBACK_V4);

        HttpRequestClientIp.configure(trust);
        assertThat(HttpRequestClientIp.resolve(request)).isEqualTo(TestDocumentationIps.DOC_NET_3_EXAMPLE);
    }
}
