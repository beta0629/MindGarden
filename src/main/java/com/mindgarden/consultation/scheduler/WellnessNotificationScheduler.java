package com.mindgarden.consultation.scheduler;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.List;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.entity.SystemNotification;
import com.mindgarden.consultation.entity.SystemNotificationRead;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.WellnessTemplate;
import com.mindgarden.consultation.repository.SystemNotificationReadRepository;
import com.mindgarden.consultation.repository.SystemNotificationRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.WellnessTemplateService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 웰니스 알림 자동 발송 스케줄러
 * - 매일 오전 9시에 웰니스 팁 자동 발송
 * - DB에서 템플릿 조회, 없으면 AI로 생성
 * - 생성된 컨텐츠는 DB에 저장하여 재사용
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-01-21
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WellnessNotificationScheduler {
    
    private final SystemNotificationRepository systemNotificationRepository;
    private final SystemNotificationReadRepository systemNotificationReadRepository;
    private final UserRepository userRepository;
    private final WellnessTemplateService wellnessTemplateService;
    
    /**
     * 매일 오전 9시에 웰니스 알림 자동 발송
     * cron: 초 분 시 일 월 요일
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void sendDailyWellnessTip() {
        try {
            log.info("💚 웰니스 알림 자동 발송 시작");
            
            LocalDate today = LocalDate.now();
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
            notification.setIsImportant(template.getIsImportant());
            notification.setIsUrgent(false);
            notification.setAuthorName("마인드가든");
            notification.setAuthorId(1L); // 시스템 관리자 ID 설정
            notification.setPublishedAt(LocalDateTime.now());
            notification.setExpiresAt(LocalDateTime.now().plusDays(7)); // 7일 후 만료
            notification.setCreatedAt(LocalDateTime.now());
            notification.setUpdatedAt(LocalDateTime.now());
            
            // 저장
            SystemNotification savedNotification = systemNotificationRepository.save(notification);
            
            // 모든 CLIENT와 CONSULTANT 사용자에 대해 읽음 상태 생성 (읽지 않은 상태로)
            createReadStatusForAllUsers(savedNotification.getId());
            
            log.info("✅ 웰니스 알림 자동 발송 완료!");
            log.info("   📝 제목: {}", template.getTitle());
            log.info("   🆔 알림 ID: {}", savedNotification.getId());
            log.info("   🎯 대상: ALL (CLIENT + CONSULTANT)");
            log.info("   📌 타입: WELLNESS");
            log.info("   ✨ 생성자: {} (사용 횟수: {})", template.getCreatedBy(), template.getUsageCount());
            log.info("   📅 발행일: {}", savedNotification.getPublishedAt());
            log.info("   ⏰ 만료일: {}", savedNotification.getExpiresAt());
            
            // 통계 로그
            long totalTemplates = wellnessTemplateService.getActiveTemplateCount();
            log.info("📊 현재 활성화된 템플릿 수: {}", totalTemplates);
            
        } catch (Exception e) {
            log.error("❌ 웰니스 알림 자동 발송 중 오류 발생", e);
        }
    }
    
    /**
     * 모든 CLIENT와 CONSULTANT 사용자에 대해 읽음 상태 생성 (읽지 않은 상태로)
     */
    private void createReadStatusForAllUsers(Long notificationId) {
        try {
            // CLIENT와 CONSULTANT 사용자 조회
            List<User> clientUsers = userRepository.findByRoleAndIsActiveTrue(UserRole.CLIENT);
            List<User> consultantUsers = userRepository.findByRoleAndIsActiveTrue(UserRole.CONSULTANT);
            
            log.info("👥 CLIENT 사용자 수: {}", clientUsers.size());
            log.info("👥 CONSULTANT 사용자 수: {}", consultantUsers.size());
            
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
            
            log.info("✅ 읽음 상태 생성 완료: {}개 사용자 (CLIENT + CONSULTANT)", createdCount);
            
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
