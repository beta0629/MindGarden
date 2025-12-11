package com.coresolution.core.config;

import com.coresolution.core.multitenancy.TenantIdentifierResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Hibernate MultiTenancy 설정
 * 
 * 주의: Hibernate 6.x는 DISCRIMINATOR 전략을 지원하지 않음
 * 대신 Repository 레벨에서 자동 필터링을 구현 (Week 0 Day 5)
 * 
 * 향후 SCHEMA 또는 DATABASE 전략이 필요한 경우 이 설정을 활성화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Configuration
@RequiredArgsConstructor
public class HibernateMultiTenancyConfig {
    
    private final TenantIdentifierResolver tenantIdentifierResolver;
    
    /**
     * Hibernate Properties Customizer
     * 
     * 현재는 비활성화 상태
     * Hibernate 6.x는 DISCRIMINATOR를 지원하지 않으므로,
     * Repository 레벨에서 tenant_id 자동 필터링을 구현
     * 
     * 향후 SCHEMA 또는 DATABASE 전략이 필요한 경우:
     * - SCHEMA: 테넌트별 스키마 분리
     * - DATABASE: 테넌트별 데이터베이스 분리
     */
    @Bean
    public HibernatePropertiesCustomizer hibernatePropertiesCustomizer() {
        return hibernateProperties -> {
            // Hibernate 6.x는 DISCRIMINATOR를 지원하지 않음
            // Repository 레벨 필터링 사용 (Week 0 Day 5에서 구현)
            
            // 향후 SCHEMA 전략 사용 시:
            // hibernateProperties.put("hibernate.multiTenancy", "SCHEMA");
            // hibernateProperties.put("hibernate.tenant_identifier_resolver", tenantIdentifierResolver);
            // hibernateProperties.put("hibernate.multi_tenant_connection_provider", multiTenantConnectionProvider);
        };
    }
}

