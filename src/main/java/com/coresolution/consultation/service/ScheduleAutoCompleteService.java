package com.coresolution.consultation.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantService;
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
    private final TenantService tenantService;
    
    /**
     * 매 10분마다 시간이 지난 스케줄을 자동 완료 처리 및 상담일지 미작성 알림
     * cron: 초 분 시 일 월 요일
     * 모든 활성 테넌트에 대해 실행
     */
    @Scheduled(cron = "0 */10 * * * *") // 10분마다 실행 (운영용)
    public void autoCompleteExpiredSchedules() {
        try {
            // 스케줄러는 HTTP 요청 컨텍스트가 없으므로 모든 활성 테넌트에 대해 실행
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            
            if (activeTenantIds.isEmpty()) {
                log.warn("⚠️ 활성 테넌트가 없습니다. 스케줄 자동 완료 처리를 건너뜁니다.");
                return;
            }
            
            log.info("🔄 스케줄 자동 완료 처리 시작: 활성 테넌트 수={}", activeTenantIds.size());
            
            int totalCompletedCount = 0;
            int totalReminderSentCount = 0;
            
            // 각 테넌트별로 처리
            for (String tenantId : activeTenantIds) {
                try {
                    // 테넌트 컨텍스트 설정
                    TenantContextHolder.setTenantId(tenantId);
                    
                    log.info("🔄 테넌트별 스케줄 자동 완료 처리 시작: tenantId={}", tenantId);
                    
                    LocalDateTime now = LocalDateTime.now();
                    LocalDate today = now.toLocalDate();
                    LocalTime currentTime = now.toLocalTime();
                    
                    int tenantCompletedCount = 0;
                    int tenantReminderSentCount = 0;
                    
                    // 오늘 만료된 스케줄 처리
                    List<Schedule> todayExpiredSchedules = scheduleRepository.findExpiredConfirmedSchedules(tenantId, today, currentTime);
                    for (Schedule schedule : todayExpiredSchedules) {
                        try {
                            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                            if (ScheduleStatus.BOOKED.equals(schedule.getStatus()) || ScheduleStatus.CONFIRMED.equals(schedule.getStatus())) {
                                var result = plSqlScheduleValidationService.processScheduleAutoCompletion(
                                    schedule.getId(), 
                                    schedule.getConsultantId(), 
                                    schedule.getDate(), 
                                    false // 강제 완료 아님
                                );
                                
                                if ((Boolean) result.get("completed")) {
                                    tenantCompletedCount++;
                                    
                                    realTimeStatisticsService.updateStatisticsOnScheduleCompletion(schedule);
                                    
                                    log.info("✅ PL/SQL 스케줄 자동 완료 및 통계 업데이트: tenantId={}, ID={}, 제목={}, 시간={}", 
                                        tenantId, schedule.getId(), schedule.getTitle(), schedule.getStartTime());
                                } else {
                                    log.warn("⚠️ PL/SQL 상담일지 미작성으로 스케줄 완료 처리 건너뜀: tenantId={}, ID={}, 제목={}, 시간={}, 메시지={}", 
                                        tenantId, schedule.getId(), schedule.getTitle(), schedule.getStartTime(), result.get("message"));
                                    
                                    var reminderResult = plSqlScheduleValidationService.createConsultationRecordReminder(
                                        schedule.getId(), 
                                        schedule.getConsultantId(), 
                                        schedule.getClientId(), 
                                        schedule.getDate(), 
                                        schedule.getTitle()
                                    );
                                    
                                    if ((Boolean) reminderResult.get("success")) {
                                        tenantReminderSentCount++;
                                        log.info("📤 PL/SQL 상담일지 미작성 알림 생성 완료: tenantId={}, ID={}", tenantId, reminderResult.get("reminderId"));
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.error("❌ 오늘 스케줄 자동 완료 실패: tenantId={}, ID={}, 오류={}", tenantId, schedule.getId(), e.getMessage());
                        }
                    }
                    
                    // 지난 날짜의 스케줄 처리
                    List<Schedule> pastBookedSchedules = scheduleRepository.findByDateBeforeAndStatus(
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                        tenantId, today, ScheduleStatus.BOOKED);
                    List<Schedule> pastConfirmedSchedules = scheduleRepository.findByDateBeforeAndStatus(
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                        tenantId, today, ScheduleStatus.CONFIRMED);
                    
                    List<Schedule> allPastSchedules = new ArrayList<>();
                    allPastSchedules.addAll(pastBookedSchedules);
                    allPastSchedules.addAll(pastConfirmedSchedules);
                    
                    for (Schedule schedule : allPastSchedules) {
                        try {
                            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                            if (ScheduleStatus.BOOKED.equals(schedule.getStatus()) || ScheduleStatus.CONFIRMED.equals(schedule.getStatus())) {
                                var result = plSqlScheduleValidationService.processScheduleAutoCompletion(
                                    schedule.getId(), 
                                    schedule.getConsultantId(), 
                                    schedule.getDate(), 
                                    false // 강제 완료 아님
                                );
                                
                                if ((Boolean) result.get("completed")) {
                                    tenantCompletedCount++;
                                    
                                    realTimeStatisticsService.updateStatisticsOnScheduleCompletion(schedule);
                                    
                                    log.info("✅ PL/SQL 지난 스케줄 자동 완료 및 통계 업데이트: tenantId={}, ID={}, 제목={}, 날짜={}", 
                                        tenantId, schedule.getId(), schedule.getTitle(), schedule.getDate());
                                } else {
                                    log.warn("⚠️ PL/SQL 지난 스케줄 상담일지 미작성으로 완료 처리 건너뜀: tenantId={}, ID={}, 제목={}, 날짜={}, 메시지={}", 
                                        tenantId, schedule.getId(), schedule.getTitle(), schedule.getDate(), result.get("message"));
                                    
                                    var reminderResult = plSqlScheduleValidationService.createConsultationRecordReminder(
                                        schedule.getId(), 
                                        schedule.getConsultantId(), 
                                        schedule.getClientId(), 
                                        schedule.getDate(), 
                                        schedule.getTitle()
                                    );
                                    
                                    if ((Boolean) reminderResult.get("success")) {
                                        tenantReminderSentCount++;
                                        log.info("📤 PL/SQL 지난 스케줄 상담일지 미작성 알림 생성 완료: tenantId={}, ID={}", tenantId, reminderResult.get("reminderId"));
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.error("❌ 지난 스케줄 자동 완료 실패: tenantId={}, ID={}, 오류={}", tenantId, schedule.getId(), e.getMessage());
                        }
                    }
                    
                    totalCompletedCount += tenantCompletedCount;
                    totalReminderSentCount += tenantReminderSentCount;
                    
                    log.info("✅ 테넌트별 스케줄 자동 완료 처리 완료: tenantId={}, 완료 {}개, 알림 발송 {}개", 
                        tenantId, tenantCompletedCount, tenantReminderSentCount);
                    
                } catch (Exception e) {
                    log.error("❌ 테넌트별 스케줄 자동 완료 처리 실패: tenantId={}, 오류={}", tenantId, e.getMessage(), e);
                } finally {
                    // 테넌트 컨텍스트 정리
                    TenantContextHolder.clear();
                }
            }
            
            log.info("✅ 전체 스케줄 자동 완료 처리 완료: 총 완료 {}개, 총 알림 발송 {}개", totalCompletedCount, totalReminderSentCount);
            
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
