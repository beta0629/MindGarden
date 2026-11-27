package com.coresolution.consultation.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * {@code client_event} 백필 CLI 프로퍼티 등록.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@Configuration
@EnableConfigurationProperties(ClientEventBackfillProperties.class)
public class ClientEventBackfillConfiguration {
}
