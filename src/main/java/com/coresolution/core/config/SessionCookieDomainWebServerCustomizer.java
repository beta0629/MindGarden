package com.coresolution.core.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.servlet.server.AbstractServletWebServerFactory;
import org.springframework.boot.web.servlet.server.ConfigurableServletWebServerFactory;
import org.springframework.stereotype.Component;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;

import com.coresolution.consultation.config.SessionCookieSupport;

import lombok.extern.slf4j.Slf4j;

/**
 * 운영에서 OAuth 콜백(apex)과 테넌트 서브도메인이 세션 쿠키를 나눌 때만
 * {@code Set-Cookie}의 {@code Domain}을 둔다.
 * {@code dev} 프로파일은 host-only 다. parent Domain 은 테넌트 Host 끼리 JSESSIONID 를 공유한다.
 * dev OAuth 는 {@code oauthExchangeCode} 로 apex 세션 없이 JWT 를 수령한다.
 * <p>
 * {@code server.servlet.session.cookie.domain: ${SESSION_COOKIE_DOMAIN:}} 처럼 YAML에 빈 문자열을 두면
 * Spring Boot 3.x는 {@code alwaysApplyingWhenNonNull} 기준으로 빈 문자열도 적용해 {@code Domain=""} 로 이어질 수 있어,
 * 환경 변수가 비어 있을 때는 도메인을 건드리지 않는다(호스트 전용 쿠키, 로컬 기본).
 * Domain 값은 {@link SessionCookieSupport#normalizeSessionCookieDomain} 으로 정규화한다(선행 점 제거).
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-09
 */
@Slf4j
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
        if (SessionCookieSupport.isDevHostOnlyProfile(environment)) {
            if (factory instanceof AbstractServletWebServerFactory servletFactory) {
                servletFactory.getSession().getCookie().setDomain(null);
            }
            log.info("dev 프로파일 — 세션 쿠키 Domain 미적용(host-only). OAuth 는 oauthExchangeCode");
            return;
        }
        String domain = SessionCookieSupport.normalizeSessionCookieDomain(
                environment.getProperty("SESSION_COOKIE_DOMAIN"));
        if (domain == null) {
            log.info("SESSION_COOKIE_DOMAIN 미설정 — 세션 쿠키는 호스트 전용(OAuth apex→테넌트 서브도메인 공유 안 됨)");
            return;
        }
        if (factory instanceof AbstractServletWebServerFactory servletFactory) {
            servletFactory.getSession().getCookie().setDomain(domain);
            log.info("세션 쿠키 Domain 적용(SESSION_COOKIE_DOMAIN): {}", domain);
        } else {
            log.warn("SESSION_COOKIE_DOMAIN={} 이지만 factory 타입이 AbstractServletWebServerFactory 가 아님 — Domain 미적용",
                    domain);
        }
    }
}
