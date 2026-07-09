package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.NotificationType;
import com.coresolution.consultation.entity.Notification;
import com.coresolution.consultation.repository.NotificationRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link NotificationLifecycleServiceImpl} 수신자 격리(recipient_user_id) 검증.
 *
 * @author CoreSolution
 * @since 2026-07-09
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationLifecycleServiceImpl — recipient 격리")
class NotificationLifecycleServiceImplRecipientIsolationTest {

    private static final String TENANT_A = "tenant-a";
    private static final String TENANT_B = "tenant-b";
    private static final Long USER_A = 10L;
    private static final Long USER_B = 20L;
    private static final Long NOTIFICATION_ID = 99L;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationLifecycleServiceImpl notificationLifecycleService;

    @Test
    @DisplayName("send: recipientUserId 가 notifications row 에 저장된다")
    void send_persistsRecipientUserId() {
        when(notificationRepository.save(org.mockito.ArgumentMatchers.any(Notification.class)))
                .thenAnswer(invocation -> {
                    Notification saved = invocation.getArgument(0);
                    saved.setId(NOTIFICATION_ID);
                    return saved;
                });

        Notification result = notificationLifecycleService.send(
                TENANT_A, USER_A, null, NotificationType.PAYMENT, "결제 완료", "본문");

        assertThat(result.getRecipientUserId()).isEqualTo(USER_A);
        assertThat(result.getTenantId()).isEqualTo(TENANT_A);
        assertThat(result.getStatus()).isEqualTo(Notification.STATUS_SENT);
    }

    @Test
    @DisplayName("findForRecipient: 다른 수신자 row 는 EntityNotFoundException")
    void findForRecipient_rejectsOtherRecipient() {
        when(notificationRepository.findByTenantIdAndIdAndRecipientUserIdAndIsDeletedFalse(
                eq(TENANT_A), eq(NOTIFICATION_ID), eq(USER_B)))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                notificationLifecycleService.findForRecipient(TENANT_A, USER_B, NOTIFICATION_ID))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    @DisplayName("markReadForRecipient: 본인 row 만 READ 전이")
    void markReadForRecipient_updatesOwnRowOnly() {
        Notification row = Notification.builder()
                .id(NOTIFICATION_ID)
                .tenantId(TENANT_A)
                .recipientUserId(USER_A)
                .notificationType(NotificationType.MESSAGE)
                .title("새 메시지")
                .status(Notification.STATUS_SENT)
                .build();

        when(notificationRepository.findByTenantIdAndIdAndRecipientUserIdAndIsDeletedFalse(
                eq(TENANT_A), eq(NOTIFICATION_ID), eq(USER_A)))
                .thenReturn(Optional.of(row));
        when(notificationRepository.save(row)).thenReturn(row);

        Notification updated = notificationLifecycleService.markReadForRecipient(
                TENANT_A, USER_A, NOTIFICATION_ID);

        assertThat(updated.getStatus()).isEqualTo(Notification.STATUS_READ);
        assertThat(updated.getReadAt()).isNotNull();
    }

    @Test
    @DisplayName("markAllReadForRecipient: tenant+recipient 범위 bulk update 호출")
    void markAllReadForRecipient_delegatesToRepository() {
        notificationLifecycleService.markAllReadForRecipient(TENANT_A, USER_A);

        verify(notificationRepository).markAllUnreadAsReadForRecipient(
                eq(TENANT_A), eq(USER_A), org.mockito.ArgumentMatchers.any(LocalDateTime.class));
    }

    @Test
    @DisplayName("countUnread: tenant+recipient 파라미터로 repository 위임")
    void countUnread_scopedByTenantAndRecipient() {
        when(notificationRepository.countUnreadByTenantIdAndRecipient(TENANT_B, USER_B)).thenReturn(3L);

        long count = notificationLifecycleService.countUnread(TENANT_B, USER_B);

        assertThat(count).isEqualTo(3L);
        verify(notificationRepository).countUnreadByTenantIdAndRecipient(TENANT_B, USER_B);
    }
}
