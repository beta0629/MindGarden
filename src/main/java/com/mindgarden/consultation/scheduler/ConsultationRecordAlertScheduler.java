package com.mindgarden.consultation.scheduler;

import java.time.LocalDate;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.mindgarden.consultation.service.PlSqlConsultationRecordAlertService;

import lombok.extern.slf4j.Slf4j;

/**
 * 상담일지 미작성 알림 스케줄러
 * - 매일 오전 9시에 전날 상담일지 미작성 확인
 * - 매주 월요일 오전 10시에 지난주 전체 확인
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Slf4j
@Component
public class ConsultationRecordAlertScheduler {
    
    @Autowired
    private PlSqlConsultationRecordAlertService consultationRecordAlertService;
    
    /**
     * 매일 오전 9시에 전날 상담일지 미작성 확인
     * cron: 초 분 시 일 월 요일
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void checkDailyMissingConsultationRecords() {
        log.info("🕘 일일 상담일지 미작성 확인 스케줄러 시작");
        
        try {
            LocalDate yesterday = LocalDate.now().minusDays(1);
            
            Map<String, Object> result = consultationRecordAlertService.checkMissingConsultationRecords(
                yesterday, null // 전체 지점
            );
            
            Boolean success = (Boolean) result.get("success");
            String message = (String) result.get("message");
            Integer missingCount = (Integer) result.get("missingCount");
            Integer alertsCreated = (Integer) result.get("alertsCreated");
            
            if (success) {
                log.info("✅ 일일 상담일지 미작성 확인 완료: {} - 미작성 {}건, 알림생성 {}건", 
                        message, missingCount, alertsCreated);
            } else {
                log.error("❌ 일일 상담일지 미작성 확인 실패: {}", message);
            }
            
        } catch (Exception e) {
            log.error("❌ 일일 상담일지 미작성 확인 스케줄러 오류: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 매주 월요일 오전 10시에 지난주 전체 상담일지 미작성 확인
     * cron: 초 분 시 일 월 요일 (1=월요일)
     */
    @Scheduled(cron = "0 0 10 * * 1")
    public void checkWeeklyMissingConsultationRecords() {
        log.info("🕙 주간 상담일지 미작성 확인 스케줄러 시작");
        
        try {
            Map<String, Object> result = consultationRecordAlertService.autoCreateMissingConsultationRecordAlerts(7);
            
            Boolean success = (Boolean) result.get("success");
            String message = (String) result.get("message");
            Integer processedDays = (Integer) result.get("processedDays");
            Integer totalAlertsCreated = (Integer) result.get("totalAlertsCreated");
            
            if (success) {
                log.info("✅ 주간 상담일지 미작성 확인 완료: {} - 처리일수 {}일, 생성알림 {}건", 
                        message, processedDays, totalAlertsCreated);
            } else {
                log.error("❌ 주간 상담일지 미작성 확인 실패: {}", message);
            }
            
        } catch (Exception e) {
            log.error("❌ 주간 상담일지 미작성 확인 스케줄러 오류: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 매월 1일 오전 11시에 지난달 전체 상담일지 미작성 확인
     * cron: 초 분 시 일 월 요일
     */
    @Scheduled(cron = "0 0 11 1 * *")
    public void checkMonthlyMissingConsultationRecords() {
        log.info("🕚 월간 상담일지 미작성 확인 스케줄러 시작");
        
        try {
            Map<String, Object> result = consultationRecordAlertService.autoCreateMissingConsultationRecordAlerts(30);
            
            Boolean success = (Boolean) result.get("success");
            String message = (String) result.get("message");
            Integer processedDays = (Integer) result.get("processedDays");
            Integer totalAlertsCreated = (Integer) result.get("totalAlertsCreated");
            
            if (success) {
                log.info("✅ 월간 상담일지 미작성 확인 완료: {} - 처리일수 {}일, 생성알림 {}건", 
                        message, processedDays, totalAlertsCreated);
            } else {
                log.error("❌ 월간 상담일지 미작성 확인 실패: {}", message);
            }
            
        } catch (Exception e) {
            log.error("❌ 월간 상담일지 미작성 확인 스케줄러 오류: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 수동으로 상담일지 미작성 확인 실행 (테스트용)
     * 
     * @param daysBack 며칠 전까지 확인할지
     * @return 실행 결과
     */
    public Map<String, Object> manualCheckMissingRecords(int daysBack) {
        log.info("🔧 수동 상담일지 미작성 확인 실행: {}일 전까지", daysBack);
        
        try {
            Map<String, Object> result = consultationRecordAlertService.autoCreateMissingConsultationRecordAlerts(daysBack);
            
            Boolean success = (Boolean) result.get("success");
            String message = (String) result.get("message");
            
            if (success) {
                log.info("✅ 수동 상담일지 미작성 확인 완료: {}", message);
            } else {
                log.error("❌ 수동 상담일지 미작성 확인 실패: {}", message);
            }
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ 수동 상담일지 미작성 확인 오류: {}", e.getMessage(), e);
            
            Map<String, Object> errorResult = Map.of(
                "success", false,
                "message", "수동 상담일지 미작성 확인 중 오류가 발생했습니다: " + e.getMessage(),
                "processedDays", 0,
                "totalAlertsCreated", 0
            );
            
            return errorResult;
        }
    }
}
