package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.NotificationChannelPreferenceCode;
import com.coresolution.consultation.constant.NotificationPhysicalChannel;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.AlertRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.KakaoAlimTalkService;
import com.coresolution.consultation.service.NotificationService.NotificationPriority;
import com.coresolution.consultation.service.NotificationService.NotificationType;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.service.TenantKakaoAlimtalkSettingsService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * 알림톡 실패 시 {@link SmsAuthService#sendNotificationMessage} SMS 폴백 경로 검증.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("NotificationServiceImpl SMS 폴백")
class NotificationServiceImplSmsFallbackTest {

    private static final String TENANT_ID = UUID.randomUUID().toString();

    @Mock
    private KakaoAlimTalkService kakaoAlimTalkService;
    @Mock
    private CommonCodeRepository commonCodeRepository;
    @Mock
    private CommonCodeService commonCodeService;
    @Mock
    private SmsAuthService smsAuthService;
    @Mock
    private EmailService emailService;
    @Mock
    private AlertRepository alertRepository;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private TenantKakaoAlimtalkSettingsService tenantKakaoAlimtalkSettingsService;
    @Mock
    private NotificationChannelPreferenceResolutionService channelPreferenceResolutionService;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(channelPreferenceResolutionService.resolveDeliveryOrder(
                any(NotificationChannelPreferenceCode.class),
                any(NotificationPriority.class),
                anyBoolean(),
                anyBoolean(),
                nullable(String.class)))
            .thenReturn(List.of(NotificationPhysicalChannel.KAKAO, NotificationPhysicalChannel.SMS));
        when(kakaoAlimTalkService.sendAlimTalk(anyString(), anyString(), anyString(), any())).thenReturn(false);
        when(smsAuthService.sendNotificationMessage(anyString(), anyString())).thenReturn(true);
        when(commonCodeRepository.findByTenantIdAndCodeGroupOrderBySortOrderAsc(eq(TENANT_ID), eq("SMS_TEMPLATE")))
            .thenReturn(List.of());
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("PAYMENT_COMPLETED: 알림톡 실패 후 sendNotificationMessage 호출")
    void sendPaymentCompleted_fallsBackToSms() {
        User user = userWithPhone();

        notificationService.sendPaymentCompleted(user, 500_000L, "10회 패키지", "김상담");

        verify(smsAuthService).sendNotificationMessage(eq("01000000000"), anyString());
    }

    private User userWithPhone() {
        User user = new User();
        user.setId(42L);
        user.setName("client");
        user.setSocialProvider("kakao");
        user.setPhone("cipher-phone");
        when(encryptionUtil.decrypt("cipher-phone")).thenReturn("01000000000");
        return user;
    }
}
