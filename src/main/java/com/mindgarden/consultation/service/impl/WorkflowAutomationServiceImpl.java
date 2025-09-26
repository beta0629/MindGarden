package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.constant.ScheduleStatus;
import com.mindgarden.consultation.entity.ConsultantPerformance;
import com.mindgarden.consultation.entity.Schedule;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.ScheduleRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.ConsultationMessageService;
import com.mindgarden.consultation.service.StatisticsService;
import com.mindgarden.consultation.service.WorkflowAutomationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 워크플로우 자동화 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-15
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class WorkflowAutomationServiceImpl implements WorkflowAutomationService {
    
    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final ConsultationMessageService consultationMessageService;
    private final StatisticsService statisticsService;
    
    // 워크플로우 실행 로그 저장용 (실제 환경에서는 별도 테이블 사용 권장)
    private final List<Map<String, Object>> workflowLogs = new ArrayList<>();
    
    /**
     * 예약 리마인더 자동 발송 (매 10분마다 실행)
     */
    @Override
    @Scheduled(fixedRate = 600000) // 10분마다 실행
    public void sendScheduleReminders() {
        log.info("🔔 예약 리마인더 자동 발송 시작");
        
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDate today = now.toLocalDate();
            LocalTime currentTime = now.toLocalTime();
            
            // 오늘 예정된 상담 조회
            List<Schedule> todaySchedules = scheduleRepository.findByDateAndStatusIn(
                today, 
                List.of(ScheduleStatus.BOOKED, ScheduleStatus.CONFIRMED)
            );
            
            for (Schedule schedule : todaySchedules) {
                LocalTime startTime = schedule.getStartTime();
                LocalTime reminderTime1Hour = startTime.minusHours(1);
                LocalTime reminderTime30Min = startTime.minusMinutes(30);
                
                // 1시간 전 리마인더
                if (isTimeInRange(currentTime, reminderTime1Hour, 5)) {
                    sendReminderMessage(schedule, "1시간 전 리마인더", 
                        "상담이 1시간 후에 시작됩니다. 준비해주세요.");
                }
                
                // 30분 전 리마인더
                if (isTimeInRange(currentTime, reminderTime30Min, 5)) {
                    sendReminderMessage(schedule, "30분 전 리마인더", 
                        "상담이 30분 후에 시작됩니다. 곧 시작됩니다!");
                }
            }
            
            logWorkflowExecution("sendScheduleReminders", "SUCCESS", 
                String.format("오늘 %d건의 예약에 대해 리마인더 확인 완료", todaySchedules.size()));
            
        } catch (Exception e) {
            log.error("❌ 예약 리마인더 자동 발송 실패", e);
            logWorkflowExecution("sendScheduleReminders", "FAILED", e.getMessage());
        }
    }
    
    /**
     * 미완료 상담 알림 (매 시간마다 실행)
     */
    @Override
    @Scheduled(cron = "0 0 * * * *") // 매 시간 정각에 실행
    public void sendIncompleteConsultationAlerts() {
        log.info("⚠️ 미완료 상담 알림 시작");
        
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDate today = now.toLocalDate();
            LocalTime currentTime = now.toLocalTime();
            
            // 시간이 지났지만 완료되지 않은 상담 조회
            List<Schedule> incompleteSchedules = scheduleRepository.findByDateAndStatusIn(
                today, 
                List.of(ScheduleStatus.BOOKED, ScheduleStatus.CONFIRMED)
            ).stream()
            .filter(schedule -> schedule.getEndTime().isBefore(currentTime))
            .collect(Collectors.toList());
            
            for (Schedule schedule : incompleteSchedules) {
                // 상담사에게 미완료 알림
                String alertMessage = String.format("상담 시간이 지났지만 완료 처리되지 않았습니다.\n" +
                    "📅 일시: %s %s-%s\n" +
                    "👤 내담자: %s", 
                    schedule.getDate(), 
                    schedule.getStartTime(), 
                    schedule.getEndTime(),
                    "내담자"
                );
                
                consultationMessageService.sendMessage(
                    schedule.getConsultantId(), 
                    schedule.getClientId(), 
                    null, // consultationId
                    "CONSULTANT", 
                    "미완료 상담 알림", 
                    alertMessage,
                    "INCOMPLETE_CONSULTATION",
                    true, // isImportant
                    false  // isUrgent
                );
                
                log.info("⚠️ 미완료 상담 알림 발송: scheduleId={}, consultantId={}", 
                    schedule.getId(), schedule.getConsultantId());
            }
            
            logWorkflowExecution("sendIncompleteConsultationAlerts", "SUCCESS", 
                String.format("%d건의 미완료 상담에 대해 알림 발송", incompleteSchedules.size()));
            
        } catch (Exception e) {
            log.error("❌ 미완료 상담 알림 실패", e);
            logWorkflowExecution("sendIncompleteConsultationAlerts", "FAILED", e.getMessage());
        }
    }
    
    /**
     * 일일 성과 요약 알림 (매일 오후 6시 실행)
     */
    @Override
    @Scheduled(cron = "0 0 18 * * *") // 매일 오후 6시
    public void sendDailyPerformanceSummary() {
        log.info("📊 일일 성과 요약 알림 시작");
        
        try {
            LocalDate today = LocalDate.now();
            
            // 상담사 조회
            List<User> consultants = userRepository.findByRoleAndIsDeletedFalse("CONSULTANT");
            
            for (User consultant : consultants) {
                try {
                    // 상담사별 오늘 성과 조회
                    ConsultantPerformance consultantPerformance = statisticsService.getConsultantPerformance(
                        consultant.getId(), today);
                    
                    String summaryMessage = String.format("오늘의 상담 성과 요약\n" +
                        "📅 날짜: %s\n" +
                        "✅ 완료된 상담: %d건\n" +
                        "⭐ 평균 평점: %.1f점\n" +
                        "💰 총 수익: %s원", 
                        today,
                        consultantPerformance.getCompletedSchedules(),
                        consultantPerformance.getAvgRating() != null ? consultantPerformance.getAvgRating().doubleValue() : 0.0,
                        consultantPerformance.getTotalRevenue()
                    );
                    
                    consultationMessageService.sendMessage(
                        consultant.getId(), 
                        null, 
                        null, // consultationId
                        "CONSULTANT", 
                        "일일 성과 요약", 
                        summaryMessage,
                        "DAILY_SUMMARY",
                        false, // isImportant
                        false  // isUrgent
                    );
                    
                } catch (Exception e) {
                    log.error("상담사 {} 일일 성과 요약 발송 실패", consultant.getId(), e);
                }
            }
            
            logWorkflowExecution("sendDailyPerformanceSummary", "SUCCESS", 
                String.format("%d명의 상담사에게 일일 성과 요약 발송", consultants.size()));
            
        } catch (Exception e) {
            log.error("❌ 일일 성과 요약 알림 실패", e);
            logWorkflowExecution("sendDailyPerformanceSummary", "FAILED", e.getMessage());
        }
    }
    
    /**
     * 월간 성과 리포트 자동 생성 (매월 1일 오전 9시 실행)
     */
    @Override
    @Scheduled(cron = "0 0 9 1 * *") // 매월 1일 오전 9시
    public void generateMonthlyPerformanceReport() {
        log.info("📈 월간 성과 리포트 생성 시작");
        
        try {
            LocalDate lastMonth = LocalDate.now().minusMonths(1);
            LocalDate firstDayOfLastMonth = lastMonth.withDayOfMonth(1);
            LocalDate lastDayOfLastMonth = lastMonth.withDayOfMonth(lastMonth.lengthOfMonth());
            
            // 전체 지점 통계
            Map<String, Object> monthlyStats = statisticsService.getMonthlyStatistics(
                firstDayOfLastMonth, lastDayOfLastMonth, null);
            
            String reportMessage = String.format("월간 성과 리포트 (%s)\n" +
                "📅 기간: %s ~ %s\n" +
                "✅ 총 상담 건수: %d건\n" +
                "💰 총 수익: %s원\n" +
                "⭐ 평균 평점: %.1f점", 
                lastMonth.format(java.time.format.DateTimeFormatter.ofPattern("yyyy년 MM월")),
                firstDayOfLastMonth,
                lastDayOfLastMonth,
                (Integer) monthlyStats.getOrDefault("totalConsultations", 0),
                monthlyStats.getOrDefault("totalRevenue", "0"),
                ((Number) monthlyStats.getOrDefault("avgRating", 0)).doubleValue()
            );
            
            // 관리자들에게 월간 리포트 발송
            List<User> admins = userRepository.findByRoleInAndIsDeletedFalse(
                List.of("ADMIN", "BRANCH_SUPER_ADMIN", "HQ_MASTER"));
            
            for (User admin : admins) {
                consultationMessageService.sendMessage(
                    admin.getId(), 
                    null, 
                    null, // consultationId
                    "ADMIN", 
                    "월간 성과 리포트", 
                    reportMessage,
                    "MONTHLY_REPORT",
                    true, // isImportant
                    false  // isUrgent
                );
            }
            
            logWorkflowExecution("generateMonthlyPerformanceReport", "SUCCESS", 
                String.format("%d명의 관리자에게 월간 리포트 발송", admins.size()));
            
        } catch (Exception e) {
            log.error("❌ 월간 성과 리포트 생성 실패", e);
            logWorkflowExecution("generateMonthlyPerformanceReport", "FAILED", e.getMessage());
        }
    }
    
    @Override
    public Map<String, Object> getWorkflowStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("totalExecutions", workflowLogs.size());
        status.put("lastExecution", workflowLogs.isEmpty() ? null : workflowLogs.get(workflowLogs.size() - 1));
        status.put("successCount", workflowLogs.stream().mapToLong(log -> "SUCCESS".equals(log.get("status")) ? 1 : 0).sum());
        status.put("failureCount", workflowLogs.stream().mapToLong(log -> "FAILED".equals(log.get("status")) ? 1 : 0).sum());
        status.put("timestamp", LocalDateTime.now());
        return status;
    }
    
    @Override
    public List<Map<String, Object>> getWorkflowExecutionLogs(LocalDateTime startDate, LocalDateTime endDate) {
        return workflowLogs.stream()
            .filter(log -> {
                LocalDateTime logTime = (LocalDateTime) log.get("timestamp");
                return logTime.isAfter(startDate) && logTime.isBefore(endDate);
            })
            .collect(Collectors.toList());
    }
    
    // ==================== Private Helper Methods ====================
    
    private boolean isTimeInRange(LocalTime currentTime, LocalTime targetTime, int toleranceMinutes) {
        LocalTime lowerBound = targetTime.minusMinutes(toleranceMinutes);
        LocalTime upperBound = targetTime.plusMinutes(toleranceMinutes);
        return !currentTime.isBefore(lowerBound) && !currentTime.isAfter(upperBound);
    }
    
    private void sendReminderMessage(Schedule schedule, String title, String message) {
        try {
            // 내담자에게 리마인더 발송
            consultationMessageService.sendMessage(
                schedule.getClientId(), 
                schedule.getConsultantId(), 
                null, // consultationId
                "CLIENT", 
                title, 
                message + String.format("\n📅 일시: %s %s-%s", 
                    schedule.getDate(), schedule.getStartTime(), schedule.getEndTime()),
                "REMINDER",
                false, // isImportant
                false  // isUrgent
            );
            
            // 상담사에게도 리마인더 발송
            consultationMessageService.sendMessage(
                schedule.getConsultantId(), 
                schedule.getClientId(), 
                null, // consultationId
                "CONSULTANT", 
                title, 
                message + String.format("\n📅 일시: %s %s-%s", 
                    schedule.getDate(), schedule.getStartTime(), schedule.getEndTime()),
                "REMINDER",
                false, // isImportant
                false  // isUrgent
            );
            
            log.info("🔔 리마인더 발송: scheduleId={}, title={}", schedule.getId(), title);
            
        } catch (Exception e) {
            log.error("리마인더 발송 실패: scheduleId={}, title={}", schedule.getId(), title, e);
        }
    }
    
    private void logWorkflowExecution(String workflowName, String status, String message) {
        Map<String, Object> logEntry = new HashMap<>();
        logEntry.put("workflowName", workflowName);
        logEntry.put("status", status);
        logEntry.put("message", message);
        logEntry.put("timestamp", LocalDateTime.now());
        workflowLogs.add(logEntry);
        
        // 로그 개수 제한 (메모리 절약)
        if (workflowLogs.size() > 1000) {
            workflowLogs.remove(0);
        }
    }
}
