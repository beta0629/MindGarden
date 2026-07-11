package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;

import com.coresolution.consultation.constant.NotificationType;
import com.coresolution.consultation.entity.Notification;
import com.coresolution.consultation.repository.NotificationRepository;
import com.coresolution.consultation.service.NotificationLifecycleService;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link NotificationLifecycleService} 스켈레톤 구현체.
 *
 * <p>본 위임 범위는 컴파일 가능한 기본 CRUD·상태 전이까지. 채널 라우팅·중복 억제·테넌트
 * 권한 가드는 후속 위임에서 보강된다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationLifecycleServiceImpl implements NotificationLifecycleService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public Notification save(Notification notification) {
        return notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public Notification send(
            String tenantId,
            Long recipientUserId,
            Long senderUserId,
            NotificationType type,
            String title,
            String body) {
        // TODO: 후속 위임에서 비즈니스 로직 작성 — 발송 채널 라우팅·중복 억제·배치 큐 등
        Notification entry = Notification.builder()
                .tenantId(tenantId)
                .recipientUserId(recipientUserId)
                .senderUserId(senderUserId)
                .notificationType(type)
                .title(title)
                .body(body)
                .status(Notification.STATUS_SENT)
                .build();
        return notificationRepository.save(entry);
    }

    @Override
    @Transactional
    public Notification markRead(Long notificationId) {
        // TODO: 후속 위임에서 권한 검증·테넌트 가드 작성
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Notification not found: " + notificationId));
        notification.setStatus(Notification.STATUS_READ);
        notification.setReadAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public Notification cancel(Long notificationId, String reason) {
        // TODO: 후속 위임에서 권한 검증·테넌트 가드 작성
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Notification not found: " + notificationId));
        notification.setStatus(Notification.STATUS_CANCELLED);
        notification.setCancelledAt(LocalDateTime.now());
        notification.setCancelReason(reason);
        return notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void softDelete(Long notificationId) {
        // TODO: 후속 위임에서 권한 검증·테넌트 가드 작성
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.softDelete();
            notificationRepository.save(n);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Notification> findActiveByTenantIdAndRecipient(
            String tenantId, Long recipientUserId, Pageable pageable) {
        return notificationRepository.findActiveByTenantIdAndRecipient(tenantId, recipientUserId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnread(String tenantId, Long recipientUserId) {
        return notificationRepository.countUnreadByTenantIdAndRecipient(tenantId, recipientUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public Notification findForRecipient(String tenantId, Long recipientUserId, Long notificationId) {
        return notificationRepository
                .findByTenantIdAndIdAndRecipientUserIdAndIsDeletedFalse(tenantId, notificationId, recipientUserId)
                .orElseThrow(() -> new EntityNotFoundException("Notification not found: " + notificationId));
    }

    @Override
    @Transactional
    public Notification markReadForRecipient(String tenantId, Long recipientUserId, Long notificationId) {
        Notification notification = findForRecipient(tenantId, recipientUserId, notificationId);
        if (!Notification.STATUS_READ.equals(notification.getStatus())) {
            notification.setStatus(Notification.STATUS_READ);
            notification.setReadAt(LocalDateTime.now());
            return notificationRepository.save(notification);
        }
        return notification;
    }

    @Override
    @Transactional
    public void markAllReadForRecipient(String tenantId, Long recipientUserId) {
        notificationRepository.markAllUnreadAsReadForRecipient(
                tenantId, recipientUserId, LocalDateTime.now());
    }
}
