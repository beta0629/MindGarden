package com.mindgarden.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.SystemNotification;
import com.mindgarden.consultation.entity.SystemNotificationRead;
import com.mindgarden.consultation.repository.SystemNotificationReadRepository;
import com.mindgarden.consultation.repository.SystemNotificationRepository;
import com.mindgarden.consultation.service.SystemNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

/**
 * 시스템 공지 서비스 구현체
 */
@Slf4j
@Service
@Transactional
public class SystemNotificationServiceImpl implements SystemNotificationService {
    
    @Autowired
    private SystemNotificationRepository systemNotificationRepository;
    
    @Autowired
    private SystemNotificationReadRepository systemNotificationReadRepository;
    
    /**
     * 사용자 역할에 따른 대상 타입 목록 반환
     */
    private List<String> getTargetTypesForUser(String userRole) {
        List<String> targetTypes = new ArrayList<>();
        targetTypes.add("ALL"); // 전체 공지는 모두 포함
        
        if ("CONSULTANT".equals(userRole) || "ROLE_CONSULTANT".equals(userRole)) {
            targetTypes.add("CONSULTANT");
        } else if ("CLIENT".equals(userRole) || "ROLE_CLIENT".equals(userRole)) {
            targetTypes.add("CLIENT");
        }
        
        return targetTypes;
    }
    
    @Override
    public Page<SystemNotification> getNotificationsForUser(Long userId, String userRole, Pageable pageable) {
        log.info("📢 사용자 공지 조회 - 사용자 ID: {}, 역할: {}", userId, userRole);
        
        List<String> targetTypes = getTargetTypesForUser(userRole);
        LocalDateTime now = LocalDateTime.now();
        
        Page<SystemNotification> notifications = systemNotificationRepository
            .findValidNotificationsByTargetTypes(targetTypes, now, pageable);
        
        // 각 공지에 대해 읽음 여부 체크 (현재는 클라이언트에서 별도로 조회)
        // TODO: 엔티티에 transient 필드 추가하여 읽음 여부를 직접 포함하도록 개선
        
        log.info("✅ 사용자 공지 조회 완료 - 총 {}개", notifications.getTotalElements());
        
        return notifications;
    }
    
    @Override
    public SystemNotification getNotificationDetail(Long notificationId, Long userId) {
        log.info("📢 공지 상세 조회 - 공지 ID: {}, 사용자 ID: {}", notificationId, userId);
        
        Optional<SystemNotification> notificationOpt = systemNotificationRepository.findById(notificationId);
        if (notificationOpt.isEmpty()) {
            throw new RuntimeException("공지를 찾을 수 없습니다: " + notificationId);
        }
        
        SystemNotification notification = notificationOpt.get();
        
        // 조회수 증가는 별도 메서드로 처리 (버전 충돌 방지)
        incrementViewCount(notificationId);
        
        log.info("✅ 공지 상세 조회 완료 - 공지 ID: {}", notificationId);
        
        return notification;
    }
    
    /**
     * 조회수 증가 (버전 충돌 방지를 위해 별도 처리)
     */
    @Transactional
    public void incrementViewCount(Long notificationId) {
        try {
            systemNotificationRepository.incrementViewCount(notificationId);
            log.debug("📊 조회수 증가 완료 - 공지 ID: {}", notificationId);
        } catch (Exception e) {
            log.warn("⚠️ 조회수 증가 실패 (무시): 공지 ID: {}, 오류: {}", notificationId, e.getMessage());
        }
    }
    
    @Override
    public void markAsRead(Long notificationId, Long userId) {
        log.info("📢 공지 읽음 처리 - 공지 ID: {}, 사용자 ID: {}", notificationId, userId);
        
        Optional<SystemNotificationRead> existingRead = 
            systemNotificationReadRepository.findByNotificationIdAndUserId(notificationId, userId);
        
        SystemNotificationRead readStatus;
        if (existingRead.isPresent()) {
            readStatus = existingRead.get();
            if (!readStatus.getIsRead()) {
                readStatus.markAsRead();
                systemNotificationReadRepository.save(readStatus);
                log.info("✅ 기존 읽음 상태 업데이트 완료");
            }
        } else {
            readStatus = new SystemNotificationRead();
            readStatus.setNotificationId(notificationId);
            readStatus.setUserId(userId);
            readStatus.markAsRead();
            systemNotificationReadRepository.save(readStatus);
            log.info("✅ 새 읽음 상태 생성 완료");
        }
    }
    
    @Override
    public boolean isNotificationRead(Long notificationId, Long userId) {
        Optional<SystemNotificationRead> readStatus = 
            systemNotificationReadRepository.findByNotificationIdAndUserId(notificationId, userId);
        
        return readStatus.isPresent() && readStatus.get().getIsRead();
    }
    
    @Override
    public Long getUnreadCount(Long userId, String userRole) {
        log.info("📢 읽지 않은 공지 수 조회 - 사용자 ID: {}, 역할: {}", userId, userRole);
        
        List<String> targetTypes = getTargetTypesForUser(userRole);
        Long count = systemNotificationReadRepository.countUnreadNotificationsByUser(userId, targetTypes);
        
        log.info("✅ 읽지 않은 공지 수: {}", count);
        
        return count;
    }
    
    @Override
    public List<SystemNotification> getUrgentNotifications(Long userId, String userRole) {
        log.info("📢 긴급 공지 조회 - 사용자 ID: {}, 역할: {}", userId, userRole);
        
        List<String> targetTypes = getTargetTypesForUser(userRole);
        LocalDateTime now = LocalDateTime.now();
        
        List<SystemNotification> notifications = systemNotificationRepository
            .findUrgentNotificationsByTargetTypes(targetTypes, now);
        
        log.info("✅ 긴급 공지 조회 완료 - 총 {}개", notifications.size());
        
        return notifications;
    }
    
    @Override
    public List<SystemNotification> getImportantNotifications(Long userId, String userRole) {
        log.info("📢 중요 공지 조회 - 사용자 ID: {}, 역할: {}", userId, userRole);
        
        List<String> targetTypes = getTargetTypesForUser(userRole);
        LocalDateTime now = LocalDateTime.now();
        
        List<SystemNotification> notifications = systemNotificationRepository
            .findImportantNotificationsByTargetTypes(targetTypes, now);
        
        log.info("✅ 중요 공지 조회 완료 - 총 {}개", notifications.size());
        
        return notifications;
    }
    
    @Override
    public SystemNotification createNotification(SystemNotification notification) {
        log.info("📢 공지 생성 - 제목: {}, 대상: {}", notification.getTitle(), notification.getTargetType());
        
        notification.setStatus("DRAFT");
        notification.setIsDeleted(false);
        notification.setViewCount(0);
        
        SystemNotification saved = systemNotificationRepository.save(notification);
        
        log.info("✅ 공지 생성 완료 - ID: {}", saved.getId());
        
        return saved;
    }
    
    @Override
    public SystemNotification updateNotification(Long notificationId, SystemNotification notification) {
        log.info("📢 공지 수정 - ID: {}", notificationId);
        
        Optional<SystemNotification> existingOpt = systemNotificationRepository.findById(notificationId);
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("공지를 찾을 수 없습니다: " + notificationId);
        }
        
        SystemNotification existing = existingOpt.get();
        existing.setTitle(notification.getTitle());
        existing.setContent(notification.getContent());
        existing.setTargetType(notification.getTargetType());
        existing.setNotificationType(notification.getNotificationType());
        existing.setIsImportant(notification.getIsImportant());
        existing.setIsUrgent(notification.getIsUrgent());
        existing.setExpiresAt(notification.getExpiresAt());
        
        SystemNotification updated = systemNotificationRepository.save(existing);
        
        log.info("✅ 공지 수정 완료 - ID: {}", notificationId);
        
        return updated;
    }
    
    @Override
    public void deleteNotification(Long notificationId) {
        log.info("📢 공지 삭제 - ID: {}", notificationId);
        
        Optional<SystemNotification> notificationOpt = systemNotificationRepository.findById(notificationId);
        if (notificationOpt.isEmpty()) {
            throw new RuntimeException("공지를 찾을 수 없습니다: " + notificationId);
        }
        
        SystemNotification notification = notificationOpt.get();
        notification.delete();
        systemNotificationRepository.save(notification);
        
        log.info("✅ 공지 삭제 완료 - ID: {}", notificationId);
    }
    
    @Override
    public SystemNotification publishNotification(Long notificationId) {
        log.info("📢 공지 게시 - ID: {}", notificationId);
        
        Optional<SystemNotification> notificationOpt = systemNotificationRepository.findById(notificationId);
        if (notificationOpt.isEmpty()) {
            throw new RuntimeException("공지를 찾을 수 없습니다: " + notificationId);
        }
        
        SystemNotification notification = notificationOpt.get();
        notification.publish();
        SystemNotification published = systemNotificationRepository.save(notification);
        
        log.info("✅ 공지 게시 완료 - ID: {}", notificationId);
        
        return published;
    }
    
    @Override
    public SystemNotification archiveNotification(Long notificationId) {
        log.info("📢 공지 보관 - ID: {}", notificationId);
        
        Optional<SystemNotification> notificationOpt = systemNotificationRepository.findById(notificationId);
        if (notificationOpt.isEmpty()) {
            throw new RuntimeException("공지를 찾을 수 없습니다: " + notificationId);
        }
        
        SystemNotification notification = notificationOpt.get();
        notification.archive();
        SystemNotification archived = systemNotificationRepository.save(notification);
        
        log.info("✅ 공지 보관 완료 - ID: {}", notificationId);
        
        return archived;
    }
    
    @Override
    public Page<SystemNotification> getAllNotificationsForAdmin(String targetType, String status, Pageable pageable) {
        log.info("📢 관리자용 전체 공지 조회 - 대상: {}, 상태: {}", targetType, status);
        
        Page<SystemNotification> notifications = systemNotificationRepository
            .findAllForAdmin(targetType, status, pageable);
        
        log.info("✅ 관리자용 전체 공지 조회 완료 - 총 {}개", notifications.getTotalElements());
        
        return notifications;
    }
}

