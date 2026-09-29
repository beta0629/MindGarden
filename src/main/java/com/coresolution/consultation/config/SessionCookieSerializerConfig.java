package com.coresolution.consultation.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.session.DefaultCookieSerializerCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.web.http.DefaultCookieSerializer;
import org.springframework.util.StringUtils;

import com.coresolution.consultation.constant.SessionConstants;

import lombok.extern.slf4j.Slf4j;

/**
 * Spring Session {@link DefaultCookieSerializer} 를 {@link SessionCookieSupport} 와 정합한다.
 *
 * <p>{@link com.coresolution.core.config.SessionCookieDomainWebServerCustomizer} 는 Tomcat
 * {@code SessionCookieConfig} 만 설정한다. {@code spring.session.store-type=redis} 일 때
 * JSESSIONID {@code Set-Cookie} 는 Spring Session 이 쓰므로, Domain/HttpOnly/SameSite/Base64 를
 * 여기서 {@code SESSION_COOKIE_DOMAIN} 등 env 기준으로 맞춘다.
 * (미적용 시 OAuth apex 콜백 쿠키가 호스트 전용이 되어 테넌트 SPA 에서 claim 401)</p>
 *
 * @author MindGarden
 * @since 2026-09-26
 * @see SessionCookieSupport
 * @see com.coresolution.core.config.SessionCookieDomainWebServerCustomizer
 */
@Slf4j
@Configuration
@ConditionalOnClass(DefaultCookieSerializer.class)
public class SessionCookieSerializerConfig {

    /**
     * Spring Boot Session 자동구성 {@code CookieSerializer} 에 Domain·Base64·속성을 주입한다.
     *
     * @param sessionCookieSupport Domain/HttpOnly/SameSite SSOT
     * @return customizer
     */
    @Bean
    public DefaultCookieSerializerCustomizer sessionCookieDomainSerializerCustomizer(
            SessionCookieSupport sessionCookieSupport) {
        return (DefaultCookieSerializer serializer) -> {
            serializer.setCookieName(SessionConstants.SESSION_COOKIE_NAME);
            serializer.setCookiePath("/");
            serializer.setUseBase64Encoding(true);
            serializer.setUseHttpOnlyCookie(sessionCookieSupport.resolveHttpOnly());

            String sameSite = sessionCookieSupport.resolveSameSite();
            if (StringUtils.hasText(sameSite)) {
                serializer.setSameSite(sameSite);
            }

            String domain = sessionCookieSupport.resolveDomain();
            if (domain != null) {
                serializer.setDomainName(domain);
                log.info("Spring Session CookieSerializer Domain 적용(SESSION_COOKIE_DOMAIN): {}", domain);
            } else {
                log.info(
                        "Spring Session CookieSerializer Domain 미설정 — 호스트 전용(OAuth apex→테넌트 서브도메인 공유 안 됨)");
            }
        };
    }
}
