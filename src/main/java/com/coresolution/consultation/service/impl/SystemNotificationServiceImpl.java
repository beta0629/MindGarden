package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import com.coresolution.consultation.entity.SystemNotification;
import com.coresolution.consultation.entity.SystemNotificationRead;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.SystemNotificationReadRepository;
import com.coresolution.consultation.repository.SystemNotificationRepository;
import com.coresolution.consultation.service.SystemNotificationService;
import com.coresolution.consultation.service.support.SystemNotificationAudience;
import com.coresolution.consultation.util.RichNoticeHtmlSanitizer;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
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
    
    @Override
    public Page<SystemNotification> getNotificationsForUser(Long userId, String userRole, Pageable pageable) {
        log.info("📢 사용자 공지 조회 - 사용자 ID: {}, 역할: {}", userId, userRole);
        
        String tenantId = TenantContextHolder.getTenantId();
        List<String> targetTypes = SystemNotificationAudience.getTargetTypesForUser(userRole);
        LocalDateTime now = LocalDateTime.now();
        
        Page<SystemNotification> notifications = systemNotificationRepository
            .findValidNotificationsByTenantIdAndTargetTypes(tenantId, targetTypes, now, pageable);
        
        // 각 공지에 대해 읽음 여부 체크 (현재는 클라이언트에서 별도로 조회)
        // TODO: 엔티티에 transient 필드 추가하여 읽음 여부를 직접 포함하도록 개선
        
        log.info("✅ 사용자 공지 조회 완료 - 총 {}개", notifications.getTotalElements());
        
        return notifications;
    }
    
    /**
     * 현재 테넌트·수신 대상의 공지 상세를 조회한다.
     * 없거나, 소프트 삭제되었거나, 다른 테넌트이거나, 수신 대상이 아니면 {@link EntityNotFoundException} 이다.
     *
     * @param notificationId 공지 ID
     * @param userId 조회 사용자 ID
     * @param userRole 조회 사용자 역할
     * @return 수신자에게 보이는 공지
     * @throws EntityNotFoundException 공지가 없거나 삭제·다른 테넌트·비대상일 때
     */
    @Override
    public SystemNotification getNotificationDetail(Long notificationId, Long userId, String userRole) {
        log.info("📢 공지 상세 조회 - 공지 ID: {}, 사용자 ID: {}, 역할: {}", notificationId, userId, userRole);

        SystemNotification notification = requireVisibleForRecipient(notificationId, userRole);

        // 조회수 증가는 대상 검사 이후 (버전 충돌 방지)
        incrementViewCount(notificationId);

        log.info("✅ 공지 상세 조회 완료 - 공지 ID: {}", notificationId);

        return notification;
    }

    /**
     * 테넌트·삭제·수신 대상이 모두 맞는 공지를 로드한다. 아니면 404.
     *
     * @param notificationId 공지 ID
     * @param userRole 조회 사용자 역할
     * @return 수신 대상 공지
     * @throws EntityNotFoundException 없거나 비노출일 때
     */
    private SystemNotification requireVisibleForRecipient(Long notificationId, String userRole) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return systemNotificationRepository
            .findByTenantIdAndId(tenantId, notificationId)
            .filter(found -> SystemNotificationAudience.isVisibleForRecipient(found, tenantId, userRole))
            .orElseThrow(() -> new EntityNotFoundException("SystemNotification", notificationId));
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
    
    /**
     * 공지를 읽음 처리한다. (notification_id, user_id) UK 동시 충돌은 멱등 성공으로 처리한다.
     *
     * @param notificationId 공지 ID
     * @param userId 사용자 ID
     * @param userRole 사용자 역할
     * @throws EntityNotFoundException 공지가 없거나 수신 대상이 아닐 때
     */
    @Override
    @Transactional(noRollbackFor = DataIntegrityViolationException.class)
    public void markAsRead(Long notificationId, Long userId, String userRole) {
        log.info("📢 공지 읽음 처리 - 공지 ID: {}, 사용자 ID: {}, 역할: {}", notificationId, userId, userRole);

        // 수신 대상이 아니면 읽음 기록을 남기지 않는다 (존재 여부 노출 금지 → 404)
        requireVisibleForRecipient(notificationId, userRole);

        String tenantId = TenantContextHolder.getRequiredTenantId();
        Optional<SystemNotificationRead> existingRead =
            systemNotificationReadRepository.findByTenantIdAndNotificationIdAndUserId(
                tenantId, notificationId, userId);

        if (existingRead.isPresent()) {
            SystemNotificationRead readStatus = existingRead.get();
            if (!readStatus.getIsRead()) {
                readStatus.markAsRead();
                systemNotificationReadRepository.save(readStatus);
                log.info("✅ 기존 읽음 상태 업데이트 완료");
            }
            return;
        }

        try {
            systemNotificationReadRepository.saveAndFlush(
                newMarkedRead(tenantId, notificationId, userId));
            log.info("✅ 새 읽음 상태 생성 완료");
        } catch (DataIntegrityViolationException ex) {
            Optional<SystemNotificationRead> raced =
                systemNotificationReadRepository.findByTenantIdAndNotificationIdAndUserId(
                    tenantId, notificationId, userId);
            if (raced.isPresent()) {
                log.info("📢 공지 읽음 동시성 충돌(멱등 성공) - 공지 ID: {}, 사용자 ID: {}",
                    notificationId, userId);
                return;
            }
            throw ex;
        }
    }

    /**
     * 신규 읽음 행을 생성한다. 단건·일괄 읽음이 공유한다.
     *
     * @param tenantId 테넌트 ID
     * @param notificationId 공지 ID
     * @param userId 사용자 ID
     * @return 읽음 표시된 신규 엔티티
     */
    private SystemNotificationRead newMarkedRead(String tenantId, Long notificationId, Long userId) {
        SystemNotificationRead r = new SystemNotificationRead();
        r.setTenantId(tenantId);
        r.setNotificationId(notificationId);
        r.setUserId(userId);
        r.markAsRead();
        return r;
    }
    
    @Override
    public boolean isNotificationRead(Long notificationId, Long userId) {
        Optional<SystemNotificationRead> readStatus = 
            systemNotificationReadRepository.findByNotificationIdAndUserId(notificationId, userId);
        
        return readStatus.isPresent() && readStatus.get().getIsRead();
    }

    @Override
    @Transactional(readOnly = true)
    public Set<Long> findReadNotificationIds(Long userId) {
        if (userId == null) {
            return Set.of();
        }
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            log.warn("공지 읽음 일괄 조회 스킵 - tenantId 없음 userId={}", userId);
            return Set.of();
        }
        List<Long> ids = systemNotificationReadRepository.findReadNotificationIdsByTenantIdAndUserId(
                tenantId.trim(), userId);
        if (ids == null || ids.isEmpty()) {
            return Set.of();
        }
        return new HashSet<>(ids);
    }

    @Override
    public void markAllAsRead(Long userId, String userRole) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.trim().isEmpty()) {
            log.warn("📢 일괄 읽음 처리 스킵 - tenantId 없음");
            return;
        }
        List<String> targetTypes = SystemNotificationAudience.getTargetTypesForUser(userRole);
        List<Long> unreadIds = systemNotificationRepository.findUnreadNotificationIdsByTenantIdAndUser(tenantId, userId, targetTypes);
        if (unreadIds == null || unreadIds.isEmpty()) {
            log.info("📢 일괄 읽음 - 읽지 않은 공지 없음");
            return;
        }
        log.info("📢 일괄 읽음 처리 시작 - 사용자 ID: {}, 대상 건수: {}", userId, unreadIds.size());
        final int batchSize = 500;
        List<SystemNotificationRead> toSave = new ArrayList<>();
        for (Long notificationId : unreadIds) {
            Optional<SystemNotificationRead> existing = systemNotificationReadRepository.findByTenantIdAndNotificationIdAndUserId(tenantId, notificationId, userId);
            if (existing.isPresent()) {
                SystemNotificationRead r = existing.get();
                if (!Boolean.TRUE.equals(r.getIsRead())) {
                    r.markAsRead();
                    toSave.add(r);
                }
            } else {
                toSave.add(newMarkedRead(tenantId, notificationId, userId));
            }
            if (toSave.size() >= batchSize) {
                systemNotificationReadRepository.saveAll(toSave);
                toSave.clear();
            }
        }
        if (!toSave.isEmpty()) {
            systemNotificationReadRepository.saveAll(toSave);
        }
        log.info("📢 일괄 읽음 처리 완료 - 처리 건수: {}", unreadIds.size());
    }
    
    @Override
    public Long getUnreadCount(Long userId, String userRole) {
        log.info("📢 읽지 않은 공지 수 조회 - 사용자 ID: {}, 역할: {}", userId, userRole);

        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            log.warn("📢 tenantId 없음 - 읽지 않은 공지 수 0 반환");
            return 0L;
        }

        List<String> targetTypes = SystemNotificationAudience.getTargetTypesForUser(userRole);
        Long count = systemNotificationReadRepository.countUnreadNotificationsByTenantIdAndUser(tenantId, userId, targetTypes);

        log.info("✅ 읽지 않은 공지 수: {} (tenantId: {})", count, tenantId);

        return count;
    }
    
    @Override
    public List<SystemNotification> getUrgentNotifications(Long userId, String userRole) {
        log.info("📢 긴급 공지 조회 - 사용자 ID: {}, 역할: {}", userId, userRole);
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        List<String> targetTypes = SystemNotificationAudience.getTargetTypesForUser(userRole);
        LocalDateTime now = LocalDateTime.now();
        
        List<SystemNotification> notifications = systemNotificationRepository
            .findUrgentNotificationsByTenantIdAndTargetTypes(tenantId, targetTypes, now);
        
        log.info("✅ 긴급 공지 조회 완료 - 총 {}개 (tenantId: {})", notifications.size(), tenantId);
        
        return notifications;
    }
    
    @Override
    public List<SystemNotification> getImportantNotifications(Long userId, String userRole) {
        log.info("📢 중요 공지 조회 - 사용자 ID: {}, 역할: {}", userId, userRole);
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        List<String> targetTypes = SystemNotificationAudience.getTargetTypesForUser(userRole);
        LocalDateTime now = LocalDateTime.now();
        
        List<SystemNotification> notifications = systemNotificationRepository
            .findImportantNotificationsByTenantIdAndTargetTypes(tenantId, targetTypes, now);
        
        log.info("✅ 중요 공지 조회 완료 - 총 {}개 (tenantId: {})", notifications.size(), tenantId);
        
        return notifications;
    }
    
    @Override
    public SystemNotification createNotification(SystemNotification notification) {
        log.info("📢 공지 생성 - 제목: {}, 대상: {}", notification.getTitle(), notification.getTargetType());
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        notification.setTenantId(tenantId);
        notification.setStatus("DRAFT");
        notification.setIsDeleted(false);
        notification.setViewCount(0);
        notification.setContent(RichNoticeHtmlSanitizer.sanitize(notification.getContent()));

        SystemNotification saved = systemNotificationRepository.save(notification);
        
        log.info("✅ 공지 생성 완료 - ID: {}", saved.getId());
        
        return saved;
    }
    
    @Override
    public SystemNotification updateNotification(Long notificationId, SystemNotification notification) {
        log.info("📢 공지 수정 - ID: {}", notificationId);
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Optional<SystemNotification> existingOpt =
            systemNotificationRepository.findByTenantIdAndId(tenantId, notificationId);
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("공지를 찾을 수 없습니다: " + notificationId);
        }
        
        SystemNotification existing = existingOpt.get();
        existing.setTitle(notification.getTitle());
        existing.setContent(RichNoticeHtmlSanitizer.sanitize(notification.getContent()));
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
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Optional<SystemNotification> notificationOpt =
            systemNotificationRepository.findByTenantIdAndId(tenantId, notificationId);
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
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Optional<SystemNotification> notificationOpt =
            systemNotificationRepository.findByTenantIdAndId(tenantId, notificationId);
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
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Optional<SystemNotification> notificationOpt =
            systemNotificationRepository.findByTenantIdAndId(tenantId, notificationId);
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
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("📢 관리자용 전체 공지 조회 - tenantId: {}, 대상: {}, 상태: {}", tenantId, targetType, status);
        
        Page<SystemNotification> notifications = systemNotificationRepository
            .findAllForAdminByTenantId(tenantId, targetType, status, pageable);
        
        log.info("✅ 관리자용 전체 공지 조회 완료 - tenantId: {}, 총 {}개", tenantId, notifications.getTotalElements());
        
        return notifications;
    }
}

