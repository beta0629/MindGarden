package com.mindgarden.consultation.config;

import io.micrometer.core.aop.TimedAspect;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 메트릭 설정
 * Week 13 Day 2: 런타임 메트릭 수집 구현
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Configuration
public class MetricsConfig {
    
    /**
     * 메트릭 레지스트리 커스터마이저
     * 애플리케이션 이름 및 태그 설정
     */
    @Bean
    public MeterRegistryCustomizer<MeterRegistry> metricsCommonTags() {
        return registry -> registry.config()
                .commonTags("application", "mindgarden")
                .commonTags("environment", System.getProperty("spring.profiles.active", "local"));
    }
    
    /**
     * @Timed 어노테이션 지원
     */
    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }
}

