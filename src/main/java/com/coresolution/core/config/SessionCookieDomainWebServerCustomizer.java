package com.coresolution.core.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.servlet.server.AbstractServletWebServerFactory;
import org.springframework.boot.web.servlet.server.ConfigurableServletWebServerFactory;
import org.springframework.stereotype.Component;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.util.StringUtils;

/**
 * OAuth 콜백(apex)과 테넌트 서브도메인(SPA)이 달라도 JSESSIONID를 공유하려면
 * {@code Set-Cookie}의 {@code Domain}을 apex에 맞춰야 한다.
 * <p>
 * {@code server.servlet.session.cookie.domain: ${SESSION_COOKIE_DOMAIN:}} 처럼 YAML에 빈 문자열을 두면
 * Spring Boot 3.x는 {@code alwaysApplyingWhenNonNull} 기준으로 빈 문자열도 적용해 {@code Domain=""} 로 이어질 수 있어,
 * 환경 변수가 비어 있을 때는 도메인을 건드리지 않는다(호스트 전용 쿠키, 로컬 기본).
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-09
 */
@Component
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@Order(Ordered.LOWEST_PRECEDENCE)
public class SessionCookieDomainWebServerCustomizer
    implements WebServerFactoryCustomizer<ConfigurableServletWebServerFactory> {

    private final Environment environment;

    public SessionCookieDomainWebServerCustomizer(Environment environment) {
        this.environment = environment;
    }

    /**
     * 세션 쿠키 도메인을 설정한다.
     *
     * <p>{@code SESSION_COOKIE_DOMAIN}에 공백만 있거나 미설정이면 아무 것도 하지 않는다.</p>
     */
    @Override
    public void customize(ConfigurableServletWebServerFactory factory) {
        String domain = environment.getProperty("SESSION_COOKIE_DOMAIN");
        if (!StringUtils.hasText(domain)) {
            return;
        }
        if (factory instanceof AbstractServletWebServerFactory servletFactory) {
            servletFactory.getSession().getCookie().setDomain(domain.trim());
        }
    }
}
