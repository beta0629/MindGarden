package com.coresolution.consultation.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 포트원 V2 웹훅 서명 설정을 빈으로 등록한다.
 *
 * @author CoreSolution
 * @since 2026-10-15
 */
@Configuration
@EnableConfigurationProperties(PortOneWebhookProperties.class)
public class PortOneWebhookConfig {
}
