package com.mindgarden.consultation.config;

import java.util.Collections;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;

/**
 * 개발 환경용 OAuth2 Client 설정 우회 구성.
 *
 * <p>Spring Boot의 기본 OAuth2 Client 자동 설정이
 * redirect-uri 누락으로 애플리케이션 기동을 막는 문제를 피하기 위해,
 * dev 프로파일에서만 빈을 직접 등록하여 자동 설정을 우회한다.</p>
 *
 * <p>실제 카카오/네이버 로그인 플로우는 커스텀 컨트롤러/서비스를 사용하므로
 * 이 빈은 dev 환경에서만 사용되는 안전한 최소 구성이다.</p>
 */
@Configuration
@Profile("dev")
public class DevOAuth2ClientConfig {

    /**
     * 개발 환경에서는 Spring Boot의 OAuth2Client 자동 설정 대신
     * 비어 있는 ClientRegistrationRepository를 제공한다.
     */
    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        return new InMemoryClientRegistrationRepository(Collections.emptyList());
    }
}


