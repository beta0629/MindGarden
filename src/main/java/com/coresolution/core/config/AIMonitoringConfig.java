package com.coresolution.core.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * AI 모니터링 하이브리드 설정
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Configuration
@ConfigurationProperties(prefix = "ai.monitoring")
@Data
public class AIMonitoringConfig {
    
    private boolean enabled = false;
    private HybridConfig hybrid = new HybridConfig();
    private CostControlConfig costControl = new CostControlConfig();
    
    @Data
    public static class HybridConfig {
        private boolean enabled = true;
        private StatisticalThreshold statisticalThreshold = new StatisticalThreshold();
        private AITrigger aiTrigger = new AITrigger();
    }
    
    @Data
    public static class StatisticalThreshold {
        private double cpu = 70.0;
        private double memory = 75.0;
        private double jvm = 80.0;
    }
    
    @Data
    public static class AITrigger {
        private int consecutiveViolations = 3;
        private String severityThreshold = "MEDIUM";
        private int cooldownMinutes = 30;
    }
    
    @Data
    public static class CostControlConfig {
        private int dailyLimit = 100;
        private double monthlyBudget = 50.0;
        private int alertThreshold = 80;
    }
}

