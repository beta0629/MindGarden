package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.MobilePushNotificationCategory;
import com.coresolution.consultation.constant.NotificationType;
import com.coresolution.consultation.service.NotificationLifecycleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Expo 푸시 발송 시 사용자 단위 알림 인박스({@code notifications}) 영속화 헬퍼.
 *
 * <p>{@link NotificationLifecycleService#send} 로 {@code recipient_user_id} 단위 row 를 적재하여
 * 동일 tenant·role 전원 노출(role-broadcast) 문제를 방지한다.</p>
 *
 * @author MindGarden
 * @since 2026-05-26
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MobilePushInboxPersister {

    /** 레거시 {@code system_notifications.author_id=0} system push row 식별용. */
    public static final Long SYSTEM_AUTHOR_ID = 0L;

    public static final String SYSTEM_AUTHOR_NAME = "system";

    private final NotificationLifecycleService notificationLifecycleService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void persistForRecipient(
            String tenantId,
            Long userId,
            String canonicalType,
            String title,
            String body) {
        doPersist(tenantId, userId, canonicalType, title, body, null);
    }

    /**
     * @param metadataJson 개인 알림 metadata. 비어 있으면 metadata 없는 send 와 같다
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void persistForRecipient(
            String tenantId,
            Long userId,
            String canonicalType,
            String title,
            String body,
            String metadataJson) {
        doPersist(tenantId, userId, canonicalType, title, body, metadataJson);
    }

    private void doPersist(
            String tenantId,
            Long userId,
            String canonicalType,
            String title,
            String body,
            String metadataJson) {
        if (tenantId == null || tenantId.isBlank()) {
            log.debug("알림 인박스 persist skip: tenantId 없음 type={} userId={}", canonicalType, userId);
            return;
        }
        if (userId == null) {
            log.debug("알림 인박스 persist skip: userId 없음 type={} tenantId={}", canonicalType, tenantId);
            return;
        }
        if (title == null || title.isBlank()) {
            log.debug("알림 인박스 persist skip: title 없음 type={} tenantId={} userId={}",
                    canonicalType, tenantId, userId);
            return;
        }
        try {
            String safeBody = body != null ? body : "";
            NotificationType type = resolveNotificationType(canonicalType);
            if (metadataJson == null || metadataJson.isBlank()) {
                notificationLifecycleService.send(tenantId, userId, null, type, title, safeBody);
            } else {
                notificationLifecycleService.send(tenantId, userId, null, type, title, safeBody, metadataJson);
            }
            log.debug("알림 인박스 persist 완료: tenantId={} userId={} type={}",
                    tenantId, userId, canonicalType);
        } catch (Exception e) {
            log.warn("알림 인박스 persist 실패(무시): tenantId={} userId={} type={} reason={}",
                    tenantId, userId, canonicalType, e.getMessage());
        }
    }

    private NotificationType resolveNotificationType(String canonicalType) {
        return switch (MobilePushNotificationCategory.forCanonicalType(canonicalType)) {
            case PAYMENT -> NotificationType.PAYMENT;
            case MESSAGE -> NotificationType.MESSAGE;
            case WELLNESS -> NotificationType.WELLNESS;
            case SCHEDULE -> NotificationType.SCHEDULE;
            case SYSTEM -> NotificationType.SYSTEM;
        };
    }
}
