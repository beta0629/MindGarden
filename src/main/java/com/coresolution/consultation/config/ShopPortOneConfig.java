package com.coresolution.consultation.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 쇼핑 PortOne 설정 바인딩.
 *
 * @author MindGarden
 * @since 2026-10-16
 */
@Configuration
@EnableConfigurationProperties(ShopPortOneProperties.class)
public class ShopPortOneConfig {
}
