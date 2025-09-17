package com.mindgarden.consultation.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * ERP 연동 설정
 */
@Configuration
public class ErpConfig {

    @Value("${erp.timeout:30000}")
    private int erpTimeout;

    @Bean
    public RestTemplate restTemplate() {
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
        factory.setConnectTimeout(erpTimeout);
        factory.setConnectionRequestTimeout(erpTimeout);
        
        RestTemplate restTemplate = new RestTemplate(factory);
        
        // 에러 핸들러 추가 (선택사항)
        // restTemplate.setErrorHandler(new ErpErrorHandler());
        
        return restTemplate;
    }
}
