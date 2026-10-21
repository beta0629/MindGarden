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
        return send(tenantId, recipientUserId, senderUserId, type, title, body, null);
    }

    @Override
    @Transactional
    public Notification send(
            String tenantId,
            Long recipientUserId,
            Long senderUserId,
            NotificationType type,
            String title,
            String body,
            String metadataJson) {
        Notification entry = Notification.builder()
                .tenantId(tenantId)
                .recipientUserId(recipientUserId)
                .senderUserId(senderUserId)
                .notificationType(type)
                .title(title)
                .body(body)
                .metadataJson(metadataJson)
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

    /**
     * 수신자 본인·현재 테넌트의 미삭제 알림만 반환한다.
     * 웰니스({@code WELLNESS})를 포함한 개인 알림 상세가 이 경로를 탄다.
     *
     * @param tenantId 테넌트 ID
     * @param recipientUserId 수신자 ID
     * @param notificationId 알림 ID
     * @return 보이는 알림
     * @throws com.coresolution.consultation.exception.EntityNotFoundException 없거나 삭제되었거나 다른 테넌트·수신자일 때
     */
    @Override
    @Transactional(readOnly = true)
    public Notification findForRecipient(String tenantId, Long recipientUserId, Long notificationId) {
        return notificationRepository
                .findByTenantIdAndIdAndRecipientUserIdAndIsDeletedFalse(tenantId, notificationId, recipientUserId)
                .filter(found -> isVisibleToRecipient(found, tenantId, recipientUserId))
                .orElseThrow(() -> new com.coresolution.consultation.exception.EntityNotFoundException(
                        "Notification", notificationId));
    }

    /**
     * 소프트 삭제·테넌트·수신자가 어긋나면 상세에 노출하지 않는다.
     *
     * @param found 조회된 알림
     * @param tenantId 요청 테넌트 ID
     * @param recipientUserId 요청 수신자 ID
     * @return 노출 가능하면 true
     */
    private boolean isVisibleToRecipient(Notification found, String tenantId, Long recipientUserId) {
        if (found == null || Boolean.TRUE.equals(found.getIsDeleted())) {
            return false;
        }
        return tenantId != null
                && tenantId.equals(found.getTenantId())
                && recipientUserId != null
                && recipientUserId.equals(found.getRecipientUserId());
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
