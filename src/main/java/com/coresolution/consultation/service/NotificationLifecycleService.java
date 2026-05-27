package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.NotificationType;
import com.coresolution.consultation.entity.Notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 사용자별 in-app 알림 lifecycle Service.
 *
 * <p>USER_LIFECYCLE_TERMINATION_POLICY §4 (Q9·Q11) — broadcast {@code system_notifications}
 * 와 분리된 수신자 단일-행 {@code notifications} 테이블의 적재·조회·읽음·취소·소프트 삭제
 * 책임을 담당. 본 위임 범위는 인터페이스 + 스켈레톤 ServiceImpl. 발송 채널 라우팅·중복
 * 억제·배치 큐 등 비즈니스 로직은 후속 위임에서 작성한다.</p>
 *
 * <p>기존 broadcast/SMS·Kakao 통합 service {@link NotificationService} 와의 이름 충돌
 * 회피를 위해 {@code NotificationLifecycleService} 로 명명한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
public interface NotificationLifecycleService {

    Notification save(Notification notification);

    /**
     * 알림 1행 작성 헬퍼.
     *
     * @param tenantId        테넌트 ID
     * @param recipientUserId 수신자 users.id
     * @param senderUserId    발신자 users.id — SYSTEM 발송이면 null
     * @param type            {@link NotificationType}
     * @param title           제목 (필수)
     * @param body            본문 (선택)
     * @return 저장된 알림
     */
    Notification send(
            String tenantId,
            Long recipientUserId,
            Long senderUserId,
            NotificationType type,
            String title,
            String body);

    /**
     * 알림을 READ 상태로 전이.
     */
    Notification markRead(Long notificationId);

    /**
     * 알림을 CANCELLED 상태로 전이.
     */
    Notification cancel(Long notificationId, String reason);

    /**
     * 알림 소프트 삭제 (is_deleted=true).
     */
    void softDelete(Long notificationId);

    /**
     * 테넌트 + 수신자 + 미삭제 알림 페이지 조회.
     */
    Page<Notification> findActiveByTenantIdAndRecipient(
            String tenantId, Long recipientUserId, Pageable pageable);

    /**
     * 테넌트 + 수신자 + 미읽음 알림 카운트.
     */
    long countUnread(String tenantId, Long recipientUserId);
}
