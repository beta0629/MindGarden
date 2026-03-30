package com.coresolution.core.config;

import com.coresolution.core.service.billing.SubscriptionExpirationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 구독 관련 스케줄러 설정
 * 만료된 구독 자동 처리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "subscription.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class SubscriptionSchedulerConfig {
    
    private final SubscriptionExpirationService expirationService;
    
    /**
     * 만료된 구독 자동 처리
     * 매일 오전 2시에 실행
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void processExpiredSubscriptions() {
        log.info("만료된 구독 자동 처리 시작");
        try {
            int processedCount = expirationService.processExpiredSubscriptions();
            log.info("만료된 구독 자동 처리 완료: {}개 처리", processedCount);
        } catch (Exception e) {
            log.error("만료된 구독 자동 처리 중 오류 발생", e);
        }
    }
}

