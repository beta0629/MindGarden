package com.mindgarden.consultation.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * RestTemplate 전역 설정
 *
 * dev / local / prod 모든 프로파일에서 사용 가능한 공용 RestTemplate Bean.
 */
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}


