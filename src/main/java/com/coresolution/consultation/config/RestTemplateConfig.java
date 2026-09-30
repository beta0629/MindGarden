package com.coresolution.consultation.config;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.client.RestTemplate;

/**
 * RestTemplate 전역 설정
 *
 * dev / local / prod 모든 프로파일에서 사용 가능한 공용 RestTemplate Bean.
 * PortOne 결제 조회·취소 전용 빈은 {@link #PORTONE_REST_TEMPLATE} 로 분리해 타임아웃을 한정한다.
 */
@Configuration
public class RestTemplateConfig {

    /** PortOne V2 결제 조회·취소 전용 RestTemplate 빈 이름 */
    public static final String PORTONE_REST_TEMPLATE = "portOneRestTemplate";

    @Bean
    @Primary
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    /**
     * PortOne V2 결제 조회·취소 전용 RestTemplate (connect/read 타임아웃은 설정값).
     *
     * @param builder          Spring Boot RestTemplateBuilder
     * @param connectTimeoutMs 연결 타임아웃(ms) — {@code portone.http.connect-timeout-ms}
     * @param readTimeoutMs    읽기 타임아웃(ms) — {@code portone.http.read-timeout-ms}
     * @return 타임아웃이 적용된 RestTemplate
     */
    @Bean(PORTONE_REST_TEMPLATE)
    public RestTemplate portOneRestTemplate(
            RestTemplateBuilder builder,
            @Value("${portone.http.connect-timeout-ms}") long connectTimeoutMs,
            @Value("${portone.http.read-timeout-ms}") long readTimeoutMs) {
        return builder
                .setConnectTimeout(Duration.ofMillis(connectTimeoutMs))
                .setReadTimeout(Duration.ofMillis(readTimeoutMs))
                .build();
    }
}


