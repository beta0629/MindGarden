package com.coresolution.consultation.scheduler;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.List;
import java.util.UUID;
import com.coresolution.consultation.constant.NotificationSchedulerFlagKeys;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.SystemNotification;
import com.coresolution.consultation.entity.SystemNotificationRead;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.WellnessTemplate;
import com.coresolution.consultation.repository.SystemNotificationReadRepository;
import com.coresolution.consultation.repository.SystemNotificationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.DailyHealingContentGenerator;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.service.WellnessTemplateService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.SchedulerAlertService;
import com.coresolution.core.service.SchedulerExecutionLogService;
import com.coresolution.core.service.TenantService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 웰니스 알림 자동 발송 스케줄러 (표준화 적용)
 * - 매일 오전 9시에 웰니스 팁 자동 발송
 * - DB에서 템플릿 조회, 없으면 AI로 생성
 * - 생성된 컨텐츠는 DB에 저장하여 재사용
 * - 테넌트별 독립 실행
 * 
 * @author CoreSolution
 * @version 3.0.0
 * @since 2025-12-02
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
    name = "scheduler.wellness-notification.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class WellnessNotificationScheduler {
    
    private final SystemNotificationRepository systemNotificationRepository;
    private final SystemNotificationReadRepository systemNotificationReadRepository;
    private final UserRepository userRepository;
    private final WellnessTemplateService wellnessTemplateService;
    private final DailyHealingContentGenerator dailyHealingContentGenerator;
    private final TenantService tenantService;
    private final SchedulerExecutionLogService logService;
    private final SchedulerAlertService alertService;
    private final SystemConfigService systemConfigService;
    
    @Value("${scheduler.wellness-notification.cron:0 0 9 * * ?}")
    private String cronExpression;
    
    /**
     * 매일 오전 9시에 웰니스 알림 자동 발송 (테넌트별 독립 실행)
     * Cron: 매일 오전 9시
     */
    @Scheduled(cron = "${scheduler.wellness-notification.cron:0 0 9 * * ?}")
    @SchedulerLock(
        name = "wellness-notification",
        lockAtMostFor = "PT15M",
        lockAtLeastFor = "PT5M"
    )
    public void sendDailyWellnessTip() {
        // 런타임 가드 (2026-05-25): DB SSOT 플래그가 OFF 면 즉시 return.
        // ENV `SCHEDULER_WELLNESS_NOTIFICATION_ENABLED` 와 이중 가드 — 어드민/SQL 토글 즉시 반영용.
        if (!systemConfigService.getGlobalBoolean(
                NotificationSchedulerFlagKeys.WELLNESS_TIP_ENABLED,
                NotificationSchedulerFlagKeys.DEFAULT_ENABLED)) {
            log.info("⏸️ [WellnessNotification] 스케줄러 비활성 - DB 플래그 OFF: key={}",
                NotificationSchedulerFlagKeys.WELLNESS_TIP_ENABLED);
            return;
        }
        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();
        
        log.info("⏰ [WellnessNotification] 스케줄러 시작: executionId={}, startTime={}",
            executionId, startTime);
        
        int successCount = 0;
        int failureCount = 0;
        int totalTenants = 0;
        
        try {
            // 1. 활성 테넌트 목록 조회
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            totalTenants = activeTenantIds.size();
            log.info("📋 [WellnessNotification] 대상 테넌트 수: {}", totalTenants);
            
            // 2. 테넌트별 실행
            for (String tenantId : activeTenantIds) {
                try {
                    // 테넌트 컨텍스트 설정
                    TenantContextHolder.setTenantId(tenantId);
                    
                    log.debug("🔄 [WellnessNotification] 테넌트 실행 시작: tenantId={}", tenantId);
                    
                    // 웰니스 알림 발송
                    sendWellnessTipForTenant(tenantId);
                    
                    log.info("✅ [WellnessNotification] 테넌트 실행 완료: tenantId={}", tenantId);
                    logService.saveExecutionLog(
                        executionId, tenantId, "WellnessNotification", "SUCCESS", "Wellness notification sent"
                    );
                    successCount++;
                    
                } catch (Exception e) {
                    log.error("❌ [WellnessNotification] 테넌트 실행 실패: tenantId={}, error={}",
                        tenantId, e.getMessage(), e);
                    logService.saveExecutionLog(
                        executionId, tenantId, "WellnessNotification", "FAILED", e.getMessage()
                    );
                    failureCount++;
                } finally {
                    // 테넌트 컨텍스트 정리
                    TenantContextHolder.clear();
                }
            }
            
            // 3. 전체 실행 결과 로깅
            LocalDateTime endTime = LocalDateTime.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();
            
            log.info("✅ [WellnessNotification] 스케줄러 완료: executionId={}, duration={}ms, success={}, failure={}",
                executionId, durationMs, successCount, failureCount);
            
            // 4. 실행 요약 저장
            logService.saveSummaryLog(
                executionId,
                "WellnessNotification",
                totalTenants,
                successCount,
                failureCount,
                durationMs,
                startTime,
                endTime
            );
            
        } catch (Exception e) {
            log.error("❌ [WellnessNotification] 스케줄러 전체 실행 실패: executionId={}, error={}",
                executionId, e.getMessage(), e);
            alertService.sendFailureAlert(
                "WellnessNotification", executionId, failureCount, e.getMessage()
            );
        }
    }
    
    /**
     * 시스템 부팅 직후 catch-up 발송 (트랙 A 핫픽스, 2026-05-23).
     *
     * <p>blue/green 컷오버 시점이 09:00 ± 1~2 분과 겹쳐 신규 슬롯이 첫 cron 을 놓친 경우를
     * 대비한 보정. {@link ApplicationReadyEvent} 시점에 현재 시각이 09:00 이후 ~ 23:59 사이이면
     * 활성 테넌트별 당일 WELLNESS 공지 존재 여부를 검증하고, 누락된 테넌트에 한해 1 회 발송한다.
     * {@code @SchedulerLock} 과 {@code existsByTenantIdAndNotificationTypeAndCreatedAtBetween}
     * idempotency 가드로 중복 발송은 차단된다.</p>
     */
    @EventListener(ApplicationReadyEvent.class)
    public void catchUpMissedDispatchOnStartup() {
        // 런타임 가드 (2026-05-25): DB SSOT 플래그가 OFF 면 catch-up 도 차단.
        if (!systemConfigService.getGlobalBoolean(
                NotificationSchedulerFlagKeys.WELLNESS_TIP_ENABLED,
                NotificationSchedulerFlagKeys.DEFAULT_ENABLED)) {
            log.info("⏸️ [WellnessNotification] catch-up skip - DB 플래그 OFF: key={}",
                NotificationSchedulerFlagKeys.WELLNESS_TIP_ENABLED);
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.getHour() < 9) {
            log.info("⏸️ [WellnessNotification] catch-up skip — 09:00 이전 부팅 (now={})", now);
            return;
        }
        log.info("🔁 [WellnessNotification] 부팅 직후 catch-up 검증 시작 (now={})", now);
        String catchUpExecutionId = "catchup-" + UUID.randomUUID();
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();
        int caughtUp = 0;
        try {
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            for (String tenantId : activeTenantIds) {
                try {
                    if (systemNotificationRepository.existsByTenantIdAndNotificationTypeAndCreatedAtBetween(
                            tenantId, "WELLNESS", startOfDay, endOfDay)) {
                        continue;
                    }
                    TenantContextHolder.setTenantId(tenantId);
                    log.warn("⚠️ [WellnessNotification] 당일 발송 누락 감지 — catch-up 실행: tenantId={}", tenantId);
                    sendWellnessTipForTenant(tenantId);
                    logService.saveExecutionLog(
                        catchUpExecutionId, tenantId, "WellnessNotification", "SUCCESS",
                        "Catch-up dispatch on application startup"
                    );
                    caughtUp++;
                } catch (Exception e) {
                    log.error("❌ [WellnessNotification] catch-up 실패: tenantId={}, error={}",
                        tenantId, e.getMessage(), e);
                    logService.saveExecutionLog(
                        catchUpExecutionId, tenantId, "WellnessNotification", "FAILED",
                        "Catch-up failed: " + e.getMessage()
                    );
                } finally {
                    TenantContextHolder.clear();
                }
            }
            log.info("✅ [WellnessNotification] 부팅 catch-up 종료 — 보정 발송 {}건", caughtUp);
        } catch (Exception e) {
            log.error("❌ [WellnessNotification] 부팅 catch-up 전체 실패: {}", e.getMessage(), e);
        }
    }
    
    /**
     * 특정 테넌트에 대한 웰니스 알림 발송
     */
    private void sendWellnessTipForTenant(String tenantId) {
        LocalDate today = LocalDate.now();
        
        // 당일 웰니스 공지가 이미 존재하는지 방어 로직 (Idempotency)
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay(); // 다음날 자정 전까지
        
        if (systemNotificationRepository.existsByTenantIdAndNotificationTypeAndCreatedAtBetween(
                tenantId, "WELLNESS", startOfDay, endOfDay)) {
            log.info("ℹ️ [WellnessNotification] 오늘({})의 웰니스 공지가 이미 존재하여 발송을 건너뜁니다. tenantId={}", today, tenantId);
            return;
        }
        
        DayOfWeek dayOfWeek = today.getDayOfWeek();
        String season = getCurrentSeason(today);
        
        // DB에서 템플릿 조회 (없으면 AI로 생성)
        WellnessTemplate template = wellnessTemplateService.getTodayTemplate(
            dayOfWeek.getValue(), 
            season
        );
        
        // SystemNotification 생성
        SystemNotification notification = new SystemNotification();
        notification.setTitle(template.getTitle());
        notification.setContent(template.getContent());
        notification.setNotificationType("WELLNESS");
        notification.setTargetType("ALL");
        notification.setStatus("PUBLISHED");
        // 핫픽스 (2026-05-23): fallback transient template 의 isImportant 가 null 일 수 있어 NPE 가드.
        notification.setIsImportant(Boolean.TRUE.equals(template.getIsImportant()));
        notification.setIsUrgent(false);
        notification.setAuthorName("코어솔루션");
        notification.setAuthorId(1L); // 시스템 관리자 ID 설정
        notification.setPublishedAt(LocalDateTime.now());
        notification.setExpiresAt(LocalDateTime.now().plusDays(7)); // 7일 후 만료
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUpdatedAt(LocalDateTime.now());
        
        // 저장
        SystemNotification savedNotification = systemNotificationRepository.save(notification);
        
        // 모든 CLIENT와 CONSULTANT 사용자에 대해 읽음 상태 생성 (읽지 않은 상태로)
        createReadStatusForAllUsers(savedNotification.getId(), tenantId);
        
        // 오늘의 힐링 컨텐츠 생성 및 저장 (알림 ON 경로 — 모니터링 스케줄러와 idempotent 공유)
        dailyHealingContentGenerator.generateForTenant(today, tenantId);
        
        log.info("💚 [WellnessNotification] 테넌트 알림 발송 완료: tenantId={}, notificationId={}, title={}",
            tenantId, savedNotification.getId(), template.getTitle());
    }
    
    /**
     * 모든 CLIENT와 CONSULTANT 사용자에 대해 읽음 상태 생성 (읽지 않은 상태로)
     */
    private void createReadStatusForAllUsers(Long notificationId, String tenantId) {
        try {
            // CLIENT와 CONSULTANT 사용자 조회
            List<User> clientUsers = userRepository.findByRoleAndIsActiveTrue(tenantId, UserRole.CLIENT);
            List<User> consultantUsers = userRepository.findByTenantIdAndRolesInAndIsActiveTrueAndIsDeletedFalse(tenantId,
                    UserRole.getProfessionalProviderRoles());
            
            log.debug("👥 CLIENT 사용자 수: {}", clientUsers.size());
            log.debug("👥 전문가(상담·치료) 사용자 수: {}", consultantUsers.size());
            
            int createdCount = 0;
            
            // CLIENT 사용자 처리
            for (User user : clientUsers) {
                if (createReadStatusForUser(notificationId, user)) {
                    createdCount++;
                }
            }
            
            // CONSULTANT 사용자 처리
            for (User user : consultantUsers) {
                if (createReadStatusForUser(notificationId, user)) {
                    createdCount++;
                }
            }
            
            log.debug("✅ 읽음 상태 생성 완료: {}개 사용자 (CLIENT + 전문가)", createdCount);
            
        } catch (Exception e) {
            log.error("❌ 읽음 상태 생성 중 오류 발생", e);
        }
    }
    
    /**
     * 개별 사용자에 대해 읽음 상태 생성
     */
    private boolean createReadStatusForUser(Long notificationId, User user) {
        try {
            // 이미 읽음 상태가 있는지 확인
            if (!systemNotificationReadRepository.findByNotificationIdAndUserId(notificationId, user.getId()).isPresent()) {
                SystemNotificationRead readStatus = new SystemNotificationRead();
                readStatus.setNotificationId(notificationId);
                readStatus.setUserId(user.getId());
                readStatus.setIsRead(false); // 읽지 않은 상태로 생성
                readStatus.setReadAt(null);
                
                systemNotificationReadRepository.save(readStatus);
                return true;
            }
            return false;
        } catch (Exception e) {
            log.error("❌ 사용자 {} 읽음 상태 생성 실패: {}", user.getId(), e.getMessage());
            return false;
        }
    }
    
    /**
     * 현재 계절 반환
     */
    private String getCurrentSeason(LocalDate date) {
        Month month = date.getMonth();
        switch (month) {
            case MARCH:
            case APRIL:
            case MAY:
                return "SPRING";
            case JUNE:
            case JULY:
            case AUGUST:
                return "SUMMER";
            case SEPTEMBER:
            case OCTOBER:
            case NOVEMBER:
                return "FALL";
            case DECEMBER:
            case JANUARY:
            case FEBRUARY:
                return "WINTER";
            default:
                return "ALL";
        }
    }
}
