package com.coresolution.core.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.mock.env.MockEnvironment;

/**
 * {@link SessionCookieDomainWebServerCustomizer} 단위 검증.
 *
 * @author CoreSolution
 * @since 2026-04-09
 */
class SessionCookieDomainWebServerCustomizerTest {

    @Test
    void customizeWhenPropertyMissing_leavesDomainUnset() {
        MockEnvironment env = new MockEnvironment();
        SessionCookieDomainWebServerCustomizer customizer = new SessionCookieDomainWebServerCustomizer(env);
        TomcatServletWebServerFactory factory = new TomcatServletWebServerFactory();
        customizer.customize(factory);
        assertNull(factory.getSession().getCookie().getDomain());
    }

    @Test
    void customizeWhenPropertyBlank_leavesDomainUnset() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("SESSION_COOKIE_DOMAIN", "   ");
        SessionCookieDomainWebServerCustomizer customizer = new SessionCookieDomainWebServerCustomizer(env);
        TomcatServletWebServerFactory factory = new TomcatServletWebServerFactory();
        customizer.customize(factory);
        assertNull(factory.getSession().getCookie().getDomain());
    }

    @Test
    void customizeWhenPropertySet_trimsAndAppliesDomain() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("SESSION_COOKIE_DOMAIN", "  core-solution.co.kr  ");
        SessionCookieDomainWebServerCustomizer customizer = new SessionCookieDomainWebServerCustomizer(env);
        TomcatServletWebServerFactory factory = new TomcatServletWebServerFactory();
        customizer.customize(factory);
        assertEquals("core-solution.co.kr", factory.getSession().getCookie().getDomain());
    }
}
