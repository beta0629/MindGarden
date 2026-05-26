package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.MobilePushCanonicalTypes;
import com.coresolution.consultation.constant.MobilePushNotificationCategory;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.SystemNotification;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.SystemNotificationRepository;
import com.coresolution.consultation.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link MobilePushInboxPersister} 단위 검증 — targetType·notificationType 매핑,
 * 가드(빈 입력) 및 swallow 동작.
 *
 * @author MindGarden
 * @since 2026-05-26
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MobilePushInboxPersister")
class MobilePushInboxPersisterTest {

    private static final String TENANT_ID = "tenant-persist";

    @Mock private SystemNotificationRepository systemNotificationRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private MobilePushInboxPersister mobilePushInboxPersister;

    @Test
    @DisplayName("CLIENT 사용자 + PAYMENT_COMPLETED → targetType=CLIENT, notificationType=PAYMENT, status=PUBLISHED")
    void persistsClientPaymentNotification() {
        User client = new User();
        client.setId(77L);
        client.setRole(UserRole.CLIENT);
        when(userRepository.findByTenantIdAndId(eq(TENANT_ID), eq(77L))).thenReturn(Optional.of(client));

        mobilePushInboxPersister.persistForRecipient(
                TENANT_ID, 77L, MobilePushCanonicalTypes.PAYMENT_COMPLETED, "결제 완료", "12,000원이 결제되었습니다.");

        ArgumentCaptor<SystemNotification> captor = ArgumentCaptor.forClass(SystemNotification.class);
        verify(systemNotificationRepository).save(captor.capture());

        SystemNotification saved = captor.getValue();
        assertThat(saved.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(saved.getTargetType()).isEqualTo(UserRole.CLIENT.name());
        assertThat(saved.getNotificationType()).isEqualTo(MobilePushNotificationCategory.PAYMENT.name());
        assertThat(saved.getTitle()).isEqualTo("결제 완료");
        assertThat(saved.getContent()).isEqualTo("12,000원이 결제되었습니다.");
        assertThat(saved.getStatus()).isEqualTo("PUBLISHED");
        assertThat(saved.getPublishedAt()).isNotNull();
        assertThat(saved.getAuthorId()).isEqualTo(MobilePushInboxPersister.SYSTEM_AUTHOR_ID);
        assertThat(saved.getAuthorName()).isEqualTo(MobilePushInboxPersister.SYSTEM_AUTHOR_NAME);
        assertThat(saved.getIsDeleted()).isFalse();
        assertThat(saved.getIsImportant()).isFalse();
        assertThat(saved.getIsUrgent()).isFalse();
    }

    @Test
    @DisplayName("CONSULTANT 사용자 + BOOKING_CONFIRMED → targetType=CONSULTANT, notificationType=SCHEDULE")
    void persistsConsultantScheduleNotification() {
        User consultant = new User();
        consultant.setId(88L);
        consultant.setRole(UserRole.CONSULTANT);
        when(userRepository.findByTenantIdAndId(eq(TENANT_ID), eq(88L))).thenReturn(Optional.of(consultant));

        mobilePushInboxPersister.persistForRecipient(
                TENANT_ID, 88L, MobilePushCanonicalTypes.BOOKING_CONFIRMED, "예약 확정", "5/20 14:00 박상담");

        ArgumentCaptor<SystemNotification> captor = ArgumentCaptor.forClass(SystemNotification.class);
        verify(systemNotificationRepository).save(captor.capture());
        assertThat(captor.getValue().getTargetType()).isEqualTo(UserRole.CONSULTANT.name());
        assertThat(captor.getValue().getNotificationType())
                .isEqualTo(MobilePushNotificationCategory.SCHEDULE.name());
    }

    @Test
    @DisplayName("전문가(놀이치료) 역할도 targetType=CONSULTANT (SystemNotificationServiceImpl 매핑 정합)")
    void playTherapistMapsToConsultantTarget() {
        User therapist = new User();
        therapist.setId(89L);
        therapist.setRole(UserRole.PLAY_THERAPIST);
        when(userRepository.findByTenantIdAndId(eq(TENANT_ID), eq(89L))).thenReturn(Optional.of(therapist));

        mobilePushInboxPersister.persistForRecipient(
                TENANT_ID, 89L, MobilePushCanonicalTypes.BOOKING_REMINDER, "리마인더", "내일 상담 예약");

        ArgumentCaptor<SystemNotification> captor = ArgumentCaptor.forClass(SystemNotification.class);
        verify(systemNotificationRepository).save(captor.capture());
        assertThat(captor.getValue().getTargetType()).isEqualTo(UserRole.CONSULTANT.name());
    }

    @Test
    @DisplayName("ADMIN 사용자 → targetType=ALL (알림센터는 ALL 공지만 노출되므로)")
    void adminUserMapsToAllTarget() {
        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);
        when(userRepository.findByTenantIdAndId(eq(TENANT_ID), eq(1L))).thenReturn(Optional.of(admin));

        mobilePushInboxPersister.persistForRecipient(
                TENANT_ID, 1L, MobilePushCanonicalTypes.ADMIN_ANNOUNCEMENT, "공지", "운영 점검");

        ArgumentCaptor<SystemNotification> captor = ArgumentCaptor.forClass(SystemNotification.class);
        verify(systemNotificationRepository).save(captor.capture());
        assertThat(captor.getValue().getTargetType()).isEqualTo(MobilePushInboxPersister.FALLBACK_TARGET_TYPE);
        assertThat(captor.getValue().getNotificationType())
                .isEqualTo(MobilePushNotificationCategory.SYSTEM.name());
    }

    @Test
    @DisplayName("사용자 미존재 → targetType=ALL fallback, save 는 정상 호출")
    void unknownUserFallsBackToAllTarget() {
        when(userRepository.findByTenantIdAndId(eq(TENANT_ID), eq(404L))).thenReturn(Optional.empty());

        mobilePushInboxPersister.persistForRecipient(
                TENANT_ID, 404L, MobilePushCanonicalTypes.PAYMENT_COMPLETED, "결제 완료", "본문");

        ArgumentCaptor<SystemNotification> captor = ArgumentCaptor.forClass(SystemNotification.class);
        verify(systemNotificationRepository).save(captor.capture());
        assertThat(captor.getValue().getTargetType()).isEqualTo(MobilePushInboxPersister.FALLBACK_TARGET_TYPE);
    }

    @Test
    @DisplayName("tenantId 빈 값 → save 호출 0")
    void blankTenantIdSkipsSave() {
        mobilePushInboxPersister.persistForRecipient(
                "", 77L, MobilePushCanonicalTypes.PAYMENT_COMPLETED, "결제 완료", "본문");

        verify(systemNotificationRepository, never()).save(any());
        verify(userRepository, never()).findByTenantIdAndId(anyString(), anyLong());
    }

    @Test
    @DisplayName("userId null → save 호출 0")
    void nullUserIdSkipsSave() {
        mobilePushInboxPersister.persistForRecipient(
                TENANT_ID, null, MobilePushCanonicalTypes.PAYMENT_COMPLETED, "결제 완료", "본문");

        verify(systemNotificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("title 빈 값 → save 호출 0")
    void blankTitleSkipsSave() {
        mobilePushInboxPersister.persistForRecipient(
                TENANT_ID, 77L, MobilePushCanonicalTypes.PAYMENT_COMPLETED, "  ", "본문");

        verify(systemNotificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("body null → content 는 빈 문자열로 저장(NOT NULL 컬럼 준수)")
    void nullBodyStoresEmptyContent() {
        User client = new User();
        client.setId(77L);
        client.setRole(UserRole.CLIENT);
        when(userRepository.findByTenantIdAndId(eq(TENANT_ID), eq(77L))).thenReturn(Optional.of(client));

        mobilePushInboxPersister.persistForRecipient(
                TENANT_ID, 77L, MobilePushCanonicalTypes.PAYMENT_COMPLETED, "결제 완료", null);

        ArgumentCaptor<SystemNotification> captor = ArgumentCaptor.forClass(SystemNotification.class);
        verify(systemNotificationRepository).save(captor.capture());
        assertThat(captor.getValue().getContent()).isEmpty();
    }

    @Test
    @DisplayName("save 가 예외를 던져도 호출자로 전파되지 않는다(swallow)")
    void saveExceptionIsSwallowed() {
        User client = new User();
        client.setId(77L);
        client.setRole(UserRole.CLIENT);
        when(userRepository.findByTenantIdAndId(eq(TENANT_ID), eq(77L))).thenReturn(Optional.of(client));
        when(systemNotificationRepository.save(any())).thenThrow(new RuntimeException("db down"));

        assertDoesNotThrow(() -> mobilePushInboxPersister.persistForRecipient(
                TENANT_ID, 77L, MobilePushCanonicalTypes.PAYMENT_COMPLETED, "결제 완료", "본문"));
    }
}
