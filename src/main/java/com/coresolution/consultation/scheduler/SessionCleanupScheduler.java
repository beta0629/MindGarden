package com.coresolution.consultation.scheduler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import com.coresolution.consultation.service.UserSessionService;
import lombok.extern.slf4j.Slf4j;

/**
 * 세션 정리 스케줄러
 * 주기적으로 만료된 세션을 정리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-09
 */
@Slf4j
@Component
public class SessionCleanupScheduler {
    
    @Autowired
    private UserSessionService userSessionService;
    
    /**
     * 만료된 세션 정리 (5분마다 실행)
     */
    @Scheduled(fixedRate = 300000) // 5분 = 300,000ms
    public void cleanupExpiredSessions() {
        try {
            log.debug("🧹 만료된 세션 정리 시작");
            
            int cleanedCount = userSessionService.cleanupExpiredSessions();
            
            if (cleanedCount > 0) {
                log.info("✅ 만료된 세션 정리 완료: count={}", cleanedCount);
            } else {
                log.debug("✅ 정리할 만료된 세션 없음");
            }
            
        } catch (Exception e) {
            log.error("❌ 만료된 세션 정리 실패: error={}", e.getMessage(), e);
        }
    }
    
    /**
     * 세션 통계 로깅 (1시간마다 실행)
     */
    @Scheduled(fixedRate = 3600000) // 1시간 = 3,600,000ms
    public void logSessionStatistics() {
        try {
            log.debug("📊 세션 통계 조회 시작");
            
            var statistics = userSessionService.getSessionStatistics();
            
            if (!statistics.isEmpty()) {
                log.info("📊 활성 세션 통계:");
                for (Object[] stat : statistics) {
                    Long userId = (Long) stat[0];
                    Long sessionCount = (Long) stat[1];
                    log.info("  - 사용자 ID: {}, 활성 세션 수: {}", userId, sessionCount);
                }
            } else {
                log.debug("📊 활성 세션이 없습니다.");
            }
            
        } catch (Exception e) {
            log.error("❌ 세션 통계 조회 실패: error={}", e.getMessage(), e);
        }
    }
}
