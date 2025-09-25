package com.mindgarden.consultation.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import com.mindgarden.consultation.constant.ScheduleStatus;
import com.mindgarden.consultation.entity.Schedule;
import com.mindgarden.consultation.repository.ScheduleRepository;
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
    private final ScheduleRepository scheduleRepository;
    private final RealTimeStatisticsService realTimeStatisticsService;
    private final PlSqlScheduleValidationService plSqlScheduleValidationService;
    
    /**
     * 매 10분마다 시간이 지난 스케줄을 자동 완료 처리 및 상담일지 미작성 알림
     * cron: 초 분 시 일 월 요일
     */
    @Scheduled(cron = "0 */1 * * * *") // 1분마다 실행 (테스트용)
    public void autoCompleteExpiredSchedules() {
        try {
            log.info("🔄 스케줄 자동 완료 처리 및 상담일지 미작성 알림 시작 (스케줄러)");
            
            LocalDateTime now = LocalDateTime.now();
            LocalDate today = now.toLocalDate();
            LocalTime currentTime = now.toLocalTime();
            
            int completedCount = 0;
            int reminderSentCount = 0;
            
            // 1. 오늘 날짜의 시간이 지난 스케줄 조회
            List<Schedule> todayExpiredSchedules = scheduleRepository.findExpiredConfirmedSchedules(today, currentTime);
            for (Schedule schedule : todayExpiredSchedules) {
                try {
                    if (ScheduleStatus.BOOKED.equals(schedule.getStatus()) || ScheduleStatus.CONFIRMED.equals(schedule.getStatus())) {
                        // PL/SQL을 통한 스케줄 자동 완료 처리 (상담일지 검증 포함)
                        var result = plSqlScheduleValidationService.processScheduleAutoCompletion(
                            schedule.getId(), 
                            schedule.getConsultantId(), 
                            schedule.getDate(), 
                            false // 강제 완료 아님
                        );
                        
                        if ((Boolean) result.get("completed")) {
                            completedCount++;
                            
                            // 🚀 실시간 통계 업데이트 추가
                            realTimeStatisticsService.updateStatisticsOnScheduleCompletion(schedule);
                            
                            log.info("✅ PL/SQL 스케줄 자동 완료 및 통계 업데이트: ID={}, 제목={}, 시간={}", 
                                schedule.getId(), schedule.getTitle(), schedule.getStartTime());
                        } else {
                            log.warn("⚠️ PL/SQL 상담일지 미작성으로 스케줄 완료 처리 건너뜀: ID={}, 제목={}, 시간={}, 메시지={}", 
                                schedule.getId(), schedule.getTitle(), schedule.getStartTime(), result.get("message"));
                            
                            // PL/SQL을 통한 상담일지 미작성 알림 생성
                            var reminderResult = plSqlScheduleValidationService.createConsultationRecordReminder(
                                schedule.getId(), 
                                schedule.getConsultantId(), 
                                schedule.getClientId(), 
                                schedule.getDate(), 
                                schedule.getTitle()
                            );
                            
                            if ((Boolean) reminderResult.get("success")) {
                                reminderSentCount++;
                                log.info("📤 PL/SQL 상담일지 미작성 알림 생성 완료: ID={}", reminderResult.get("reminderId"));
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("❌ 오늘 스케줄 자동 완료 실패: ID={}, 오류={}", schedule.getId(), e.getMessage());
                }
            }
            
            // 2. 지난 날짜의 예약된/확정된 스케줄 조회
            List<Schedule> pastBookedSchedules = scheduleRepository.findByDateBeforeAndStatus(
                today, ScheduleStatus.BOOKED);
            List<Schedule> pastConfirmedSchedules = scheduleRepository.findByDateBeforeAndStatus(
                today, ScheduleStatus.CONFIRMED);
            
            // 지난 날짜의 스케줄들도 PL/SQL 기반으로 처리
            List<Schedule> allPastSchedules = new ArrayList<>();
            allPastSchedules.addAll(pastBookedSchedules);
            allPastSchedules.addAll(pastConfirmedSchedules);
            
            for (Schedule schedule : allPastSchedules) {
                try {
                    if (ScheduleStatus.BOOKED.equals(schedule.getStatus()) || ScheduleStatus.CONFIRMED.equals(schedule.getStatus())) {
                        // PL/SQL을 통한 스케줄 자동 완료 처리 (상담일지 검증 포함)
                        var result = plSqlScheduleValidationService.processScheduleAutoCompletion(
                            schedule.getId(), 
                            schedule.getConsultantId(), 
                            schedule.getDate(), 
                            false // 강제 완료 아님
                        );
                        
                        if ((Boolean) result.get("completed")) {
                            completedCount++;
                            
                            // 🚀 실시간 통계 업데이트 추가
                            realTimeStatisticsService.updateStatisticsOnScheduleCompletion(schedule);
                            
                            log.info("✅ PL/SQL 지난 스케줄 자동 완료 및 통계 업데이트: ID={}, 제목={}, 날짜={}", 
                                schedule.getId(), schedule.getTitle(), schedule.getDate());
                        } else {
                            log.warn("⚠️ PL/SQL 지난 스케줄 상담일지 미작성으로 완료 처리 건너뜀: ID={}, 제목={}, 날짜={}, 메시지={}", 
                                schedule.getId(), schedule.getTitle(), schedule.getDate(), result.get("message"));
                            
                            // PL/SQL을 통한 상담일지 미작성 알림 생성
                            var reminderResult = plSqlScheduleValidationService.createConsultationRecordReminder(
                                schedule.getId(), 
                                schedule.getConsultantId(), 
                                schedule.getClientId(), 
                                schedule.getDate(), 
                                schedule.getTitle()
                            );
                            
                            if ((Boolean) reminderResult.get("success")) {
                                reminderSentCount++;
                                log.info("📤 PL/SQL 지난 스케줄 상담일지 미작성 알림 생성 완료: ID={}", reminderResult.get("reminderId"));
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("❌ 지난 스케줄 자동 완료 실패: ID={}, 오류={}", schedule.getId(), e.getMessage());
                }
            }
            
            log.info("✅ 스케줄 자동 완료 처리 완료: 완료 {}개, 알림 발송 {}개", completedCount, reminderSentCount);
            
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
