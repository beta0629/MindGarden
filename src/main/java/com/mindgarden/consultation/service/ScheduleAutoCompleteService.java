package com.mindgarden.consultation.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 스케줄 자동 완료 처리 서비스
 * 정기적으로 시간이 지난 확정된 스케줄을 자동으로 완료 처리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleAutoCompleteService {
    
    private final ScheduleService scheduleService;
    
    /**
     * 매 10분마다 시간이 지난 스케줄을 자동 완료 처리
     * cron: 초 분 시 일 월 요일
     */
    @Scheduled(cron = "0 */10 * * * *")
    public void autoCompleteExpiredSchedules() {
        try {
            log.info("🔄 스케줄 자동 완료 처리 시작 (스케줄러)");
            scheduleService.autoCompleteExpiredSchedules();
        } catch (Exception e) {
            log.error("❌ 스케줄 자동 완료 처리 실패 (스케줄러): {}", e.getMessage(), e);
        }
    }
    
    /**
     * 매일 자정에 하루 종료된 스케줄들을 정리
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void cleanupDailySchedules() {
        try {
            log.info("🧹 일일 스케줄 정리 시작");
            scheduleService.autoCompleteExpiredSchedules();
            log.info("✅ 일일 스케줄 정리 완료");
        } catch (Exception e) {
            log.error("❌ 일일 스케줄 정리 실패: {}", e.getMessage(), e);
        }
    }
}
