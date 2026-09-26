package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.session.DefaultCookieSerializerCustomizer;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.session.web.http.DefaultCookieSerializer;
import org.springframework.test.util.ReflectionTestUtils;

import com.coresolution.consultation.constant.SessionConstants;

/**
 * {@link SessionCookieSerializerConfig} — Spring Session CookieSerializer Domain 정합.
 *
 * <p>도메인 리터럴은 테스트 전용 env property 로만 주입 (소스 하드코딩 금지).</p>
 *
 * @author MindGarden
 * @since 2026-09-26
 */
@DisplayName("SessionCookieSerializerConfig — Spring Session Domain")
class SessionCookieSerializerConfigTest {

    /** 테스트 전용 Domain (env property 값). 운영 호스트 리터럴 아님. */
    private static final String TEST_COOKIE_DOMAIN = "serializer-domain.test";

    @Test
    @DisplayName("SESSION_COOKIE_DOMAIN env 있으면 CookieSerializer Domain·Base64·HttpOnly 적용")
    void customizer_appliesDomainFromEnvProperty() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("SESSION_COOKIE_DOMAIN", "  " + TEST_COOKIE_DOMAIN + "  ");
        env.setProperty("server.servlet.session.cookie.http-only", "true");
        env.setProperty("server.servlet.session.cookie.same-site", "Lax");
        SessionCookieSupport support = new SessionCookieSupport(env);
        SessionCookieSerializerConfig config = new SessionCookieSerializerConfig();

        DefaultCookieSerializerCustomizer customizer =
                config.sessionCookieDomainSerializerCustomizer(support);
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        customizer.customize(serializer);

        assertThat(ReflectionTestUtils.getField(serializer, "domainName")).isEqualTo(TEST_COOKIE_DOMAIN);
        assertThat(ReflectionTestUtils.getField(serializer, "useBase64Encoding")).isEqualTo(true);
        assertThat(ReflectionTestUtils.getField(serializer, "cookieName"))
                .isEqualTo(SessionConstants.SESSION_COOKIE_NAME);
        assertThat(ReflectionTestUtils.getField(serializer, "useHttpOnlyCookie")).isEqualTo(true);
        assertThat(ReflectionTestUtils.getField(serializer, "sameSite")).isEqualTo("Lax");
    }

    @Test
    @DisplayName("SESSION_COOKIE_DOMAIN 미설정이면 Domain null (호스트 전용)")
    void customizer_omitsDomainWhenEnvMissing() {
        SessionCookieSupport support = mock(SessionCookieSupport.class);
        when(support.resolveDomain()).thenReturn(null);
        when(support.resolveHttpOnly()).thenReturn(true);
        when(support.resolveSameSite()).thenReturn("Lax");

        DefaultCookieSerializerCustomizer customizer =
                new SessionCookieSerializerConfig().sessionCookieDomainSerializerCustomizer(support);
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        customizer.customize(serializer);

        assertThat(ReflectionTestUtils.getField(serializer, "domainName")).isNull();
        assertThat(ReflectionTestUtils.getField(serializer, "useBase64Encoding")).isEqualTo(true);
    }
}
