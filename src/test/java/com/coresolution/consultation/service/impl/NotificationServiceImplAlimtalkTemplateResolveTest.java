package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import com.coresolution.consultation.entity.CommonCode;
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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link NotificationServiceImpl} 알림톡 비즈 템플릿 코드 resolve 우선순위
 * (테넌트 DB → 테넌트 공통코드 → 코어 공통코드 → {@link NotificationType#name()}) 검증.
 * 실제 resolve 메서드는 private이므로 HIGH 우선순위 알림톡 성공 경로에서
 * {@link KakaoAlimTalkService#sendAlimTalk} 두 번째 인자로 간접 검증한다.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationServiceImpl 알림톡 템플릿 코드 resolve")
class NotificationServiceImplAlimtalkTemplateResolveTest {

    private static final String TENANT_ID = UUID.randomUUID().toString();
    private static final String GROUP = "ALIMTALK_BIZ_TEMPLATE_CODE";
    private static final NotificationType TYPE = NotificationType.CONSULTATION_CONFIRMED;

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

    @InjectMocks
    private NotificationServiceImpl notificationService;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("우선순위 1: tenant_kakao_alimtalk_settings DB 오버라이드가 공통코드보다 우선")
    void sendKakaoAlimTalk_prefersDbOverrideOverCommonCodes() {
        stubAlimTalkChannelAndSendOk();
        User user = kakaoUserWithPhone();
        when(tenantKakaoAlimtalkSettingsService.findBizTemplateCodeOverride(TENANT_ID, TYPE))
            .thenReturn(Optional.of("tpl_from_db"));

        notificationService.sendNotification(user, TYPE, NotificationPriority.HIGH, "c", "2026-05-01", "10:00");

        verify(kakaoAlimTalkService).sendAlimTalk(eq("01000000000"), eq("tpl_from_db"), eq(TYPE.name()), any());
    }

    @Test
    @DisplayName("우선순위 2: DB 없으면 테넌트 행 ALIMTALK_BIZ_TEMPLATE_CODE codeLabel")
    void sendKakaoAlimTalk_usesTenantCommonCodeWhenDbOverrideEmpty() {
        stubAlimTalkChannelAndSendOk();
        User user = kakaoUserWithPhone();
        when(tenantKakaoAlimtalkSettingsService.findBizTemplateCodeOverride(TENANT_ID, TYPE))
            .thenReturn(Optional.empty());
        CommonCode tenantCode = codeWithLabel("  tpl_tenant  ");
        when(commonCodeRepository.findTenantCodeByGroupAndValue(TENANT_ID, GROUP, TYPE.name()))
            .thenReturn(Optional.of(tenantCode));

        notificationService.sendNotification(user, TYPE, NotificationPriority.HIGH, "c", "2026-05-01", "10:00");

        verify(kakaoAlimTalkService).sendAlimTalk(eq("01000000000"), eq("tpl_tenant"), eq(TYPE.name()), any());
    }

    @Test
    @DisplayName("테넌트 공통코드 라벨이 비어 있으면 코어 행 codeLabel로 폴백")
    void sendKakaoAlimTalk_fallsBackToCoreWhenTenantLabelBlank() {
        stubAlimTalkChannelAndSendOk();
        User user = kakaoUserWithPhone();
        when(tenantKakaoAlimtalkSettingsService.findBizTemplateCodeOverride(TENANT_ID, TYPE))
            .thenReturn(Optional.empty());
        CommonCode tenantBlank = new CommonCode();
        tenantBlank.setCodeLabel("   ");
        when(commonCodeRepository.findTenantCodeByGroupAndValue(TENANT_ID, GROUP, TYPE.name()))
            .thenReturn(Optional.of(tenantBlank));
        when(commonCodeRepository.findCoreCodeByGroupAndValue(GROUP, TYPE.name()))
            .thenReturn(Optional.of(codeWithLabel("tpl_core_only")));

        notificationService.sendNotification(user, TYPE, NotificationPriority.HIGH, "c", "2026-05-01", "10:00");

        verify(kakaoAlimTalkService).sendAlimTalk(eq("01000000000"), eq("tpl_core_only"), eq(TYPE.name()), any());
    }

    @Test
    @DisplayName("tenantId 없을 때는 코어 공통코드만 조회 후 라벨 사용")
    void sendKakaoAlimTalk_withNoTenantContext_usesCoreCommonCode() {
        TenantContextHolder.clear();
        stubAlimTalkChannelAndSendOkNoTenantGate();
        User user = kakaoUserWithPhone();
        when(commonCodeRepository.findCoreCodeByGroupAndValue(GROUP, TYPE.name()))
            .thenReturn(Optional.of(codeWithLabel("core_no_tenant_ctx")));

        notificationService.sendNotification(user, TYPE, NotificationPriority.HIGH, "c", "2026-05-01", "10:00");

        verify(kakaoAlimTalkService).sendAlimTalk(
            eq("01000000000"), eq("core_no_tenant_ctx"), eq(TYPE.name()), any());
    }

    @Test
    @DisplayName("우선순위 3: DB·공통코드 모두 없으면 NotificationType.name() 폴백")
    void sendKakaoAlimTalk_fallsBackToEnumNameWhenNoOverrides() {
        stubAlimTalkChannelAndSendOk();
        User user = kakaoUserWithPhone();
        when(tenantKakaoAlimtalkSettingsService.findBizTemplateCodeOverride(TENANT_ID, TYPE))
            .thenReturn(Optional.empty());
        when(commonCodeRepository.findTenantCodeByGroupAndValue(TENANT_ID, GROUP, TYPE.name()))
            .thenReturn(Optional.empty());
        when(commonCodeRepository.findCoreCodeByGroupAndValue(GROUP, TYPE.name()))
            .thenReturn(Optional.empty());

        notificationService.sendNotification(user, TYPE, NotificationPriority.HIGH, "c", "2026-05-01", "10:00");

        verify(kakaoAlimTalkService).sendAlimTalk(
            eq("01000000000"), eq(TYPE.name()), eq(TYPE.name()), any());
    }

    private void stubAlimTalkChannelAndSendOk() {
        when(kakaoAlimTalkService.isServiceAvailable()).thenReturn(true);
        when(tenantKakaoAlimtalkSettingsService.isAlimTalkEnabledForTenant(TENANT_ID)).thenReturn(true);
        when(kakaoAlimTalkService.sendAlimTalk(anyString(), anyString(), anyString(), any())).thenReturn(true);
    }

    private void stubAlimTalkChannelAndSendOkNoTenantGate() {
        when(kakaoAlimTalkService.isServiceAvailable()).thenReturn(true);
        when(kakaoAlimTalkService.sendAlimTalk(anyString(), anyString(), anyString(), any())).thenReturn(true);
    }

    private static CommonCode codeWithLabel(String label) {
        CommonCode c = new CommonCode();
        c.setCodeLabel(label);
        return c;
    }

    private User kakaoUserWithPhone() {
        User user = new User();
        user.setId(42L);
        user.setName("client");
        user.setSocialProvider("kakao");
        user.setPhone("cipher-phone");
        when(encryptionUtil.decrypt("cipher-phone")).thenReturn("01000000000");
        return user;
    }
}
