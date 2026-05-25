package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.never;
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
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.service.SmsTemplateService;
import com.coresolution.consultation.service.TenantKakaoAlimtalkSettingsService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import java.util.List;
import java.util.UUID;
import org.assertj.core.api.Assertions;
import org.mockito.ArgumentCaptor;
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
    private SmsTemplateService smsTemplateService;
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
        // SmsTemplateService 가 SSOT — DB 시드 미존재 시 빈 Optional → buildSmsMessage null → SMS skip.
        when(smsTemplateService.renderForType(anyString(), nullable(String.class), any(), any()))
            .thenReturn(java.util.Optional.empty());
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("Task 8 — SMS_TEMPLATE row 부재 시 SMS 발송 skip (의미 없는 fallback 차단)")
    void sendPaymentCompleted_whenSmsTemplateMissing_skipsSms() {
        User user = userWithPhone();
        // setTenant 에서 SmsTemplateService.renderForType 가 Optional.empty 를 반환 — row 미시드 시나리오.

        notificationService.sendPaymentCompleted(user, 500_000L, "10회 패키지", "김상담");

        // 알림톡은 실패(setTenant에서 false 반환), SMS 는 buildSmsMessage=null → 발송 skip.
        verify(smsAuthService, never()).sendNotificationMessage(anyString(), anyString());
    }

    @Test
    @DisplayName("Task 8 회귀 — SMS_TEMPLATE row 존재 시 SMS 정상 발송 (named 변수 + positional 호환)")
    void sendPaymentCompleted_whenSmsTemplateExists_sendsSms() {
        User user = userWithPhone();
        when(smsTemplateService.renderForType(eq("PAYMENT_COMPLETED"), eq(TENANT_ID), any(), any()))
            .thenReturn(java.util.Optional.of("결제가 완료되었습니다. 금액 500,000원, 패키지 10회 패키지, 상담사 김상담"));

        notificationService.sendPaymentCompleted(user, 500_000L, "10회 패키지", "김상담");

        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
        verify(smsAuthService).sendNotificationMessage(eq("01000000000"), bodyCaptor.capture());
        Assertions.assertThat(bodyCaptor.getValue())
            .doesNotContain("[마인드가든]")
            .contains("결제가 완료되었습니다");
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
