package com.mindgarden.consultation.scheduler;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import com.mindgarden.consultation.entity.SystemNotification;
import com.mindgarden.consultation.entity.WellnessTemplate;
import com.mindgarden.consultation.repository.SystemNotificationRepository;
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
            notification.setTargetType("CLIENT");
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
            
            log.info("✅ 웰니스 알림 자동 발송 완료!");
            log.info("   📝 제목: {}", template.getTitle());
            log.info("   🆔 알림 ID: {}", savedNotification.getId());
            log.info("   🎯 대상: CLIENT");
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
