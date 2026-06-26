package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.NotificationSchedulerFlagKeys;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.WorkflowAutomationCopy;
import com.coresolution.consultation.entity.ConsultantPerformance;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.service.WorkflowAutomationService;
import com.coresolution.consultation.util.MobilePushMessageFormatter;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
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
public class WorkflowAutomationServiceImpl implements WorkflowAutomationService {
    
    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final ConsultationMessageService consultationMessageService;
    private final StatisticsService statisticsService;
    private final CommonCodeService commonCodeService;
    private final MobilePushDispatchService mobilePushDispatchService;
    private final SystemConfigService systemConfigService;
    private final TenantService tenantService;
    
    // 워크플로우 실행 로그 저장용 (실제 환경에서는 별도 테이블 사용 권장)
    private final List<Map<String, Object>> workflowLogs = new ArrayList<>();

    /**
     * 런타임 DB 플래그 가드 — false 면 본문 진입 차단.
     *
     * <p>{@code @ConditionalOnProperty}/{@code scheduler.workflow-automation.enabled} ENV 와 별개로
     * 어드민/SQL 토글 즉시 반영용. 4 개 @Scheduled 진입점에서 공통 호출한다.
     *
     * @param scope 비활성 로그 출처 식별자
     * @return DB 플래그가 OFF 면 {@code true}
     */
    private boolean isDisabledByDbFlag(String scope) {
        boolean enabled = systemConfigService.getGlobalBoolean(
                NotificationSchedulerFlagKeys.WORKFLOW_AUTOMATION_ENABLED,
                NotificationSchedulerFlagKeys.DEFAULT_ENABLED);
        if (!enabled) {
            log.info("⏸️ [WorkflowAutomation-{}] 스케줄러 비활성 - DB 플래그 OFF: key={}",
                scope, NotificationSchedulerFlagKeys.WORKFLOW_AUTOMATION_ENABLED);
        }
        return !enabled;
    }
    
    /**
     * 예약 리마인더 자동 발송 (매 10분마다 실행)
     */
    @Override
    @Scheduled(fixedRate = 600000) // 10분마다 실행
    public void sendScheduleReminders() {
        if (isDisabledByDbFlag("ScheduleReminders")) {
            return;
        }
        log.info("🔔 예약 리마인더 자동 발송 시작");

        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDate today = now.toLocalDate();
            LocalTime currentTime = now.toLocalTime();

            List<String> activeStatusNames = List.of("BOOKED", "CONFIRMED");
            List<ScheduleStatus> activeStatuses = getScheduleStatusCodesFromCommonCode(activeStatusNames).stream()
                .map(ScheduleStatus::valueOf)
                .collect(Collectors.toList());

            int totalSchedules = 0;
            for (String tenantId : tenantService.getAllActiveTenantIds()) {
                try {
                    TenantContextHolder.setTenantId(tenantId);
                    List<Schedule> todaySchedules = scheduleRepository.findByTenantIdAndDateAndStatusIn(
                        tenantId, today, activeStatuses);
                    totalSchedules += todaySchedules.size();

                    for (Schedule schedule : todaySchedules) {
                        LocalTime startTime = schedule.getStartTime();
                        LocalTime reminderTime1Hour = startTime.minusHours(1);
                        LocalTime reminderTime30Min = startTime.minusMinutes(30);

                        if (isTimeInRange(currentTime, reminderTime1Hour, 5)) {
                            sendReminderMessage(schedule, "1시간 전 리마인더",
                                "상담이 1시간 후에 시작됩니다. 준비해주세요.", "T60");
                        }

                        if (isTimeInRange(currentTime, reminderTime30Min, 5)) {
                            sendReminderMessage(schedule, "30분 전 리마인더",
                                "상담이 30분 후에 시작됩니다. 곧 시작됩니다!", "T30");
                        }
                    }
                } catch (Exception tenantError) {
                    log.error("❌ 예약 리마인더 테넌트 처리 실패: tenantId={}, error={}",
                        tenantId, tenantError.getMessage(), tenantError);
                } finally {
                    TenantContextHolder.clear();
                }
            }

            logWorkflowExecution("sendScheduleReminders", "SUCCESS",
                String.format("오늘 %d건의 예약에 대해 리마인더 확인 완료", totalSchedules));

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
        if (isDisabledByDbFlag("IncompleteAlerts")) {
            return;
        }
        log.info("⚠️ 미완료 상담 알림 시작");

        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDate today = now.toLocalDate();
            LocalTime currentTime = now.toLocalTime();

            List<String> incompleteStatusNames = List.of("BOOKED", "CONFIRMED");
            List<ScheduleStatus> incompleteStatuses = getScheduleStatusCodesFromCommonCode(incompleteStatusNames).stream()
                .map(ScheduleStatus::valueOf)
                .collect(Collectors.toList());

            int totalIncomplete = 0;
            for (String tenantId : tenantService.getAllActiveTenantIds()) {
                try {
                    TenantContextHolder.setTenantId(tenantId);
                    List<Schedule> incompleteSchedules = scheduleRepository.findByTenantIdAndDateAndStatusIn(
                        tenantId, today, incompleteStatuses).stream()
                        .filter(schedule -> schedule.getEndTime().isBefore(currentTime))
                        .collect(Collectors.toList());
                    totalIncomplete += incompleteSchedules.size();

                    for (Schedule schedule : incompleteSchedules) {
                        String alertMessage = String.format(
                            WorkflowAutomationCopy.INCOMPLETE_CONSULTATION_BODY_FMT,
                            schedule.getDate(),
                            schedule.getStartTime(),
                            schedule.getEndTime(),
                            WorkflowAutomationCopy.INCOMPLETE_CONSULTATION_CLIENT_LABEL
                        );

                        consultationMessageService.sendSystemThreadMessage(
                            schedule.getConsultantId(),
                            schedule.getClientId(),
                            schedule.getConsultantId(),
                            null,
                            WorkflowAutomationCopy.INCOMPLETE_CONSULTATION_TITLE,
                            alertMessage,
                            getMessageTypeFromCommonCode("INCOMPLETE_CONSULTATION"),
                            true,
                            false);

                        log.info("⚠️ 미완료 상담 알림 발송: scheduleId={}, consultantId={}",
                            schedule.getId(), schedule.getConsultantId());
                    }
                } catch (Exception tenantError) {
                    log.error("❌ 미완료 상담 알림 테넌트 처리 실패: tenantId={}, error={}",
                        tenantId, tenantError.getMessage(), tenantError);
                } finally {
                    TenantContextHolder.clear();
                }
            }

            logWorkflowExecution("sendIncompleteConsultationAlerts", "SUCCESS",
                String.format("%d건의 미완료 상담에 대해 알림 발송", totalIncomplete));

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
    @SchedulerLock(
        name = "workflow-automation-daily-summary",
        lockAtMostFor = "PT30M",
        lockAtLeastFor = "PT5M"
    )
    public void sendDailyPerformanceSummary() {
        if (isDisabledByDbFlag("DailySummary")) {
            return;
        }
        log.info("📊 일일 성과 요약 알림 시작");

        try {
            LocalDate today = LocalDate.now();
            String consultantRoleCode = getRoleCodeFromCommonCode(UserRole.CONSULTANT.name());
            int totalConsultants = 0;

            for (String tenantId : tenantService.getAllActiveTenantIds()) {
                try {
                    TenantContextHolder.setTenantId(tenantId);
                    List<User> consultants = userRepository.findByRoleAndIsDeletedFalse(tenantId, consultantRoleCode);
                    totalConsultants += consultants.size();

                    for (User consultant : consultants) {
                        try {
                            ConsultantPerformance consultantPerformance = statisticsService.getConsultantPerformance(
                                consultant.getId(), today);

                            String summaryMessage = String.format(
                                WorkflowAutomationCopy.DAILY_SUMMARY_BODY_FMT,
                                today,
                                consultantPerformance.getCompletedSchedules(),
                                consultantPerformance.getAvgRating() != null
                                    ? consultantPerformance.getAvgRating().doubleValue()
                                    : 0.0
                            );

                            consultationMessageService.sendMessage(
                                consultant.getId(),
                                null,
                                null,
                                getRoleCodeFromCommonCode(UserRole.CONSULTANT.name()),
                                WorkflowAutomationCopy.DAILY_SUMMARY_TITLE,
                                summaryMessage,
                                getMessageTypeFromCommonCode("DAILY_SUMMARY"),
                                false,
                                false
                            );

                        } catch (Exception e) {
                            log.error("상담사 {} 일일 성과 요약 발송 실패", consultant.getId(), e);
                        }
                    }
                } catch (Exception tenantError) {
                    log.error("❌ 일일 성과 요약 테넌트 처리 실패: tenantId={}, error={}",
                        tenantId, tenantError.getMessage(), tenantError);
                } finally {
                    TenantContextHolder.clear();
                }
            }

            logWorkflowExecution("sendDailyPerformanceSummary", "SUCCESS",
                String.format("%d명의 상담사에게 일일 성과 요약 발송", totalConsultants));

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
    @SchedulerLock(
        name = "workflow-automation-monthly-report",
        lockAtMostFor = "PT30M",
        lockAtLeastFor = "PT5M"
    )
    public void generateMonthlyPerformanceReport() {
        if (isDisabledByDbFlag("MonthlyReport")) {
            return;
        }
        log.info("📈 월간 성과 리포트 생성 시작");

        try {
            LocalDate lastMonth = LocalDate.now().minusMonths(1);
            LocalDate firstDayOfLastMonth = lastMonth.withDayOfMonth(1);
            LocalDate lastDayOfLastMonth = lastMonth.withDayOfMonth(lastMonth.lengthOfMonth());
            String adminRoleCode = getRoleCodeFromCommonCode(UserRole.ADMIN.name());
            List<String> roleList = List.of(adminRoleCode);
            int totalAdmins = 0;

            for (String tenantId : tenantService.getAllActiveTenantIds()) {
                try {
                    TenantContextHolder.setTenantId(tenantId);

                    Map<String, Object> monthlyStats = statisticsService.getMonthlyStatistics(
                        firstDayOfLastMonth, lastDayOfLastMonth, null);

                    String reportMessage = String.format(
                        WorkflowAutomationCopy.MONTHLY_REPORT_BODY_FMT,
                        lastMonth.format(java.time.format.DateTimeFormatter.ofPattern("yyyy년 MM월")),
                        firstDayOfLastMonth,
                        lastDayOfLastMonth,
                        (Integer) monthlyStats.getOrDefault("totalConsultations", 0),
                        monthlyStats.getOrDefault("totalRevenue", "0"),
                        ((Number) monthlyStats.getOrDefault("avgRating", 0)).doubleValue()
                    );

                    List<User> admins = userRepository.findByRoleInAndIsDeletedFalse(tenantId, roleList);
                    totalAdmins += admins.size();

                    for (User admin : admins) {
                        consultationMessageService.sendMessage(
                            admin.getId(),
                            null,
                            null,
                            getRoleCodeFromCommonCode(UserRole.ADMIN.name()),
                            WorkflowAutomationCopy.MONTHLY_REPORT_TITLE,
                            reportMessage,
                            getMessageTypeFromCommonCode("MONTHLY_REPORT"),
                            true,
                            false
                        );
                    }
                } catch (Exception tenantError) {
                    log.error("❌ 월간 성과 리포트 테넌트 처리 실패: tenantId={}, error={}",
                        tenantId, tenantError.getMessage(), tenantError);
                } finally {
                    TenantContextHolder.clear();
                }
            }

            logWorkflowExecution("generateMonthlyPerformanceReport", "SUCCESS",
                String.format("%d명의 관리자에게 월간 리포트 발송", totalAdmins));

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
    
    /**
     * 공통코드에서 역할 코드 조회
     */
    /**
     * 공통코드에서 역할 코드 조회
     * 표준화 2025-12-05: 하드코딩된 상수 클래스 제거, 공통코드 시스템 직접 사용
     */
    private String getRoleCodeFromCommonCode(String roleName) {
        try {
            // 표준화 2025-12-05: 하드코딩된 상수 대신 공통코드 그룹명 직접 사용
            String codeValue = commonCodeService.getCodeValue("ROLE", roleName);
            return codeValue != null ? codeValue : roleName; // 공통코드에 없으면 원본 반환
        } catch (Exception e) {
            log.warn("공통코드에서 역할 코드 조회 실패: {}, 기본값 사용", roleName, e);
            return roleName;
        }
    }
    
    /**
     * 공통코드에서 메시지 타입 코드 조회
     * 표준화 2025-12-05: 하드코딩된 상수 클래스 제거
     */
    private String getMessageTypeFromCommonCode(String messageTypeName) {
        try {
            // 표준화 2025-12-05: 하드코딩된 상수 대신 공통코드 그룹명 직접 사용
            String codeValue = commonCodeService.getCodeValue("MESSAGE_TYPE", messageTypeName);
            if (codeValue != null) {
                return codeValue;
            }
            
            // 공통코드에 없으면 기본값 매핑
            switch (messageTypeName) {
                case "INCOMPLETE_CONSULTATION":
                    return "GENERAL"; // 20자 제한에 맞춰 기본값 사용
                case "DAILY_SUMMARY":
                    return "GENERAL";
                case "MONTHLY_REPORT":
                    return "GENERAL";
                case "REMINDER":
                    return "APPOINTMENT"; // 약속 안내로 매핑
                default:
                    return "GENERAL"; // 기본값
            }
        } catch (Exception e) {
            log.warn("공통코드에서 메시지 타입 코드 조회 실패: {}, 기본값 사용", messageTypeName, e);
            return "GENERAL"; // 기본값
        }
    }
    
    /**
     * 공통코드에서 스케줄 상태 코드 조회
     */
    private List<String> getScheduleStatusCodesFromCommonCode(List<String> statusNames) {
        List<String> statusCodes = new ArrayList<>();
        for (String statusName : statusNames) {
            try {
                // 표준화 2025-12-05: 하드코딩된 상수 대신 공통코드 그룹명 직접 사용
                String statusCode = commonCodeService.getCodeValue("CONSULTATION_STATUS", statusName);
                if (statusCode == null) statusCode = statusName;
                statusCodes.add(statusCode);
            } catch (Exception e) {
                log.warn("공통코드에서 스케줄 상태 코드 조회 실패: {}, 기본값 사용", statusName, e);
                statusCodes.add(statusName);
            }
        }
        return statusCodes;
    }
    
    private boolean isTimeInRange(LocalTime currentTime, LocalTime targetTime, int toleranceMinutes) {
        LocalTime lowerBound = targetTime.minusMinutes(toleranceMinutes);
        LocalTime upperBound = targetTime.plusMinutes(toleranceMinutes);
        return !currentTime.isBefore(lowerBound) && !currentTime.isAfter(upperBound);
    }
    
    private void sendReminderMessage(Schedule schedule, String title, String message, String reminderSlotCode) {
        try {
            String reminderBody = MobilePushMessageFormatter.buildBookingReminderLead(message, schedule);
            try {
                TenantContextHolder.setTenantId(schedule.getTenantId());
                consultationMessageService.sendSystemThreadMessage(
                    schedule.getConsultantId(),
                    schedule.getClientId(),
                    schedule.getClientId(),
                    null,
                    title,
                    reminderBody,
                    "REMINDER",
                    false,
                    false);
                consultationMessageService.sendSystemThreadMessage(
                    schedule.getConsultantId(),
                    schedule.getClientId(),
                    schedule.getConsultantId(),
                    null,
                    title,
                    reminderBody,
                    "REMINDER",
                    false,
                    false);
                mobilePushDispatchService.dispatchBookingReminder(schedule.getTenantId(), schedule, reminderBody,
                        reminderSlotCode);
            } finally {
                TenantContextHolder.clear();
            }
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
