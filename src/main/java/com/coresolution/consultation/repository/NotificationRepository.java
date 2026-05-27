package com.coresolution.consultation.repository;

import java.util.List;

import com.coresolution.consultation.constant.NotificationType;
import com.coresolution.consultation.entity.Notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * {@link Notification} 리포지토리 — 사용자별 in-app 알림.
 *
 * <p>모든 조회 메서드는 {@code tenantId} 필터링 필수. {@code isDeleted=false} 가드 메서드도
 * 함께 제공한다. {@link com.coresolution.consultation.service.NotificationService} 스켈레톤
 * 이 의존하는 캐스트 메서드 ({@code findActiveByTenantIdAndRecipient}/
 * {@code countUnreadByTenantIdAndRecipient}) 는 JPQL 로 별도 정의한다. 알림 lifecycle Service
 * 는 {@link com.coresolution.consultation.service.NotificationLifecycleService} 를 참조한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n "
            + "WHERE n.tenantId = :tenantId "
            + "  AND n.recipientUserId = :recipientUserId "
            + "  AND n.isDeleted = false "
            + "ORDER BY n.createdAt DESC")
    Page<Notification> findActiveByTenantIdAndRecipient(
            @Param("tenantId") String tenantId,
            @Param("recipientUserId") Long recipientUserId,
            Pageable pageable);

    @Query("SELECT COUNT(n) FROM Notification n "
            + "WHERE n.tenantId = :tenantId "
            + "  AND n.recipientUserId = :recipientUserId "
            + "  AND n.isDeleted = false "
            + "  AND n.status <> 'READ' "
            + "  AND n.status <> 'CANCELLED'")
    long countUnreadByTenantIdAndRecipient(
            @Param("tenantId") String tenantId,
            @Param("recipientUserId") Long recipientUserId);

    Page<Notification> findByTenantIdAndRecipientUserIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(
            String tenantId, Long recipientUserId, String status, Pageable pageable);

    long countByTenantIdAndRecipientUserIdAndStatusAndIsDeletedFalse(
            String tenantId, Long recipientUserId, String status);

    List<Notification> findByTenantIdAndNotificationTypeAndIsDeletedFalseOrderByCreatedAtDesc(
            String tenantId, NotificationType notificationType);
}
