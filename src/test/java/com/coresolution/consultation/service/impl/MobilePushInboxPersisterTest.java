package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.coresolution.consultation.constant.MobilePushCanonicalTypes;
import com.coresolution.consultation.constant.NotificationType;
import com.coresolution.consultation.service.NotificationLifecycleService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("MobilePushInboxPersister")
class MobilePushInboxPersisterTest {

    private static final String TENANT_ID = "tenant-persist";

    @Mock private NotificationLifecycleService notificationLifecycleService;

    @InjectMocks
    private MobilePushInboxPersister mobilePushInboxPersister;

    @Test
    @DisplayName("CLIENT + PAYMENT_COMPLETED → send(PAYMENT)")
    void persistsClientPaymentNotification() {
        mobilePushInboxPersister.persistForRecipient(
                TENANT_ID, 77L, MobilePushCanonicalTypes.PAYMENT_COMPLETED, "결제 완료", "12,000원");

        verify(notificationLifecycleService).send(
                eq(TENANT_ID), eq(77L), isNull(), eq(NotificationType.PAYMENT),
                eq("결제 완료"), eq("12,000원"));
    }

    @Test
    @DisplayName("tenantId 빈 값 → send 호출 0")
    void blankTenantIdSkipsSave() {
        mobilePushInboxPersister.persistForRecipient(
                "", 77L, MobilePushCanonicalTypes.PAYMENT_COMPLETED, "결제 완료", "본문");

        verify(notificationLifecycleService, never()).send(
                anyString(), anyLong(), any(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("send 예외는 swallow")
    void saveExceptionIsSwallowed() {
        doThrow(new RuntimeException("db down"))
                .when(notificationLifecycleService)
                .send(anyString(), anyLong(), any(), any(), anyString(), anyString());

        assertDoesNotThrow(() -> mobilePushInboxPersister.persistForRecipient(
                TENANT_ID, 77L, MobilePushCanonicalTypes.PAYMENT_COMPLETED, "결제 완료", "본문"));
    }
}
