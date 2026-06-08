package com.coresolution.consultation.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Sign in with Apple (SIWA) OAuth2 도메인 설정.
 *
 * <p>{@link AppleOAuth2Properties} 를 빈으로 등록한다. 메인 Application 클래스의
 * 글로벌 {@code @EnableConfigurationProperties} 와 분리해 Apple OAuth2 도메인을
 * 격리하고, 향후 OAuth2 통합(카카오·네이버·구글)을 같은 위치에 확장하기 위한 진입점이다.</p>
 *
 * <p>본 클래스는 Apple T1 P1 hotfix 의 일부로 도입되었다. 기존 {@code @Component +
 * @ConfigurationProperties} 병용 패턴은 Spring Boot 2.2+ 부터 deprecated 이며 일부
 * 환경에서 binding 체인이 끊겨 {@code AppleIdTokenVerifier} 등 생성자 주입이 fallback
 * default constructor 를 찾다가 {@code NoSuchMethodException} 으로 실패했다. 본 설정으로
 * 표준 {@code @ConfigurationProperties + @EnableConfigurationProperties} 패턴으로 정렬한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-08
 */
@Configuration
@EnableConfigurationProperties(AppleOAuth2Properties.class)
public class AppleOAuth2Config {
}
