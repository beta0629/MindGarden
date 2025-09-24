package com.mindgarden.consultation.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
    private final ConsultationMessageService consultationMessageService;
    private final RealTimeStatisticsService realTimeStatisticsService;
    
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
                        schedule.setStatus(ScheduleStatus.COMPLETED);
                        schedule.setUpdatedAt(LocalDateTime.now());
                        scheduleRepository.save(schedule);
                        completedCount++;
                        
                        // 🚀 실시간 통계 업데이트 추가
                        realTimeStatisticsService.updateStatisticsOnScheduleCompletion(schedule);
                        
                        log.info("✅ 오늘 스케줄 자동 완료 및 통계 업데이트: ID={}, 제목={}, 시간={}", 
                            schedule.getId(), schedule.getTitle(), schedule.getStartTime());
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
            
            for (Schedule schedule : pastBookedSchedules) {
                try {
                    if (ScheduleStatus.BOOKED.equals(schedule.getStatus())) {
                        schedule.setStatus(ScheduleStatus.COMPLETED);
                        schedule.setUpdatedAt(LocalDateTime.now());
                        scheduleRepository.save(schedule);
                        completedCount++;
                        
                        // 🚀 실시간 통계 업데이트 추가
                        realTimeStatisticsService.updateStatisticsOnScheduleCompletion(schedule);
                        
                        log.info("✅ 지난 예약 스케줄 자동 완료 및 통계 업데이트: ID={}, 제목={}, 날짜={}", 
                            schedule.getId(), schedule.getTitle(), schedule.getDate());
                    }
                } catch (Exception e) {
                    log.error("❌ 지난 예약 스케줄 자동 완료 실패: ID={}, 오류={}", schedule.getId(), e.getMessage());
                }
            }
            
            for (Schedule schedule : pastConfirmedSchedules) {
                try {
                    if (ScheduleStatus.CONFIRMED.equals(schedule.getStatus())) {
                        schedule.setStatus(ScheduleStatus.COMPLETED);
                        schedule.setUpdatedAt(LocalDateTime.now());
                        scheduleRepository.save(schedule);
                        completedCount++;
                        
                        // 🚀 실시간 통계 업데이트 추가
                        realTimeStatisticsService.updateStatisticsOnScheduleCompletion(schedule);
                        
                        log.info("✅ 지난 확정 스케줄 자동 완료 및 통계 업데이트: ID={}, 제목={}, 날짜={}", 
                            schedule.getId(), schedule.getTitle(), schedule.getDate());
                    }
                } catch (Exception e) {
                    log.error("❌ 지난 확정 스케줄 자동 완료 실패: ID={}, 오류={}", schedule.getId(), e.getMessage());
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
    
    /**
     * 상담일지 작성 여부 확인
     */
    private boolean checkConsultationRecord(Schedule schedule) {
        try {
            // consultations 테이블에서 해당 스케줄과 관련된 상담 기록이 있는지 확인
            // 여기서는 간단히 스케줄 ID나 날짜/시간으로 매칭하는 로직을 구현
            // 실제로는 더 정확한 매칭 로직이 필요할 수 있음
            return false; // 임시로 항상 false 반환 (상담일지 미작성으로 간주)
        } catch (Exception e) {
            log.warn("상담일지 작성 여부 확인 실패: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * 상담일지 작성 독려 메시지 발송
     */
    private void sendConsultationReminderMessage(Schedule schedule) {
        try {
            if (schedule.getConsultantId() == null || schedule.getClientId() == null) {
                log.warn("스케줄 ID {} 상담사 또는 내담자 정보가 없어 메시지 발송을 건너뜁니다.", schedule.getId());
                return;
            }
            
            String title = "상담일지 작성 안내";
            String content = String.format(
                "안녕하세요. %s에 진행된 상담의 상담일지를 아직 작성하지 않으셨습니다.\n\n" +
                "상담일지는 상담의 질 향상과 내담자 관리에 매우 중요합니다.\n" +
                "빠른 시일 내에 상담일지를 작성해 주시기 바랍니다.\n\n" +
                "상담 정보:\n" +
                "- 상담일: %s\n" +
                "- 상담시간: %s ~ %s\n" +
                "- 내담자 ID: %s\n\n" +
                "감사합니다.",
                schedule.getDate(),
                schedule.getDate(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getClientId()
            );
            
            // 상담사에게 메시지 발송
            consultationMessageService.sendMessage(
                schedule.getConsultantId(),
                schedule.getClientId(),
                null, // consultationId는 null
                "ADMIN", // 발신자 타입
                title,
                content,
                "REMINDER", // 메시지 타입
                true, // 중요 메시지
                false // 긴급 메시지 아님
            );
            
            log.info("📨 상담일지 작성 독려 메시지 발송 완료: 상담사 ID={}, 스케줄 ID={}", 
                schedule.getConsultantId(), schedule.getId());
                
        } catch (Exception e) {
            log.error("❌ 상담일지 작성 독려 메시지 발송 실패: 스케줄 ID={}, error={}", 
                schedule.getId(), e.getMessage());
        }
    }
}
