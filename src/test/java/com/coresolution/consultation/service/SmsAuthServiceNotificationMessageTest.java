package com.coresolution.consultation.service;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.config.SmsProperties;
import com.coresolution.consultation.dto.TenantSmsEffectiveCredentials;
import com.coresolution.consultation.service.sms.SmsProvider;
import com.coresolution.consultation.service.sms.impl.SolapiSmsProvider;
import com.coresolution.core.context.TenantContextHolder;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * {@link SmsAuthService#sendNotificationMessage} — SolapiSmsProvider 선택·발송 검증.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SmsAuthService 알림 SMS")
class SmsAuthServiceNotificationMessageTest {

    private static final String TENANT_ID = "tenant-sms-notify";
    private static final String PHONE = "01012345678";
    private static final String MESSAGE = "[마인드가든] 결제가 완료되었습니다.";

    @Mock
    private TenantSmsSettingsService tenantSmsSettingsService;
    @Mock
    private SmsProvider solapiSmsProvider;

    private SmsProperties smsProperties;
    private SmsAuthService smsAuthService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        smsProperties = new SmsProperties();
        smsProperties.setEnabled(true);
        smsProperties.setTestMode(false);

        when(solapiSmsProvider.getProviderName()).thenReturn(SolapiSmsProvider.PROVIDER_NAME);
        when(solapiSmsProvider.isConfigured()).thenReturn(true);
        when(tenantSmsSettingsService.isSmsEnabledForTenant(TENANT_ID)).thenReturn(true);
        when(tenantSmsSettingsService.getEffectiveCredentials(TENANT_ID))
                .thenReturn(new TenantSmsEffectiveCredentials(SolapiSmsProvider.PROVIDER_NAME, null, null, "01000000000"));

        smsAuthService = new SmsAuthService(smsProperties, tenantSmsSettingsService, List.of(solapiSmsProvider));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("프로덕션 모드: SolapiSmsProvider로 일반 알림 본문 발송")
    void sendNotificationMessage_usesSolapiProvider() {
        when(solapiSmsProvider.sendSms(PHONE, MESSAGE)).thenReturn(true);

        boolean ok = smsAuthService.sendNotificationMessage(PHONE, MESSAGE);

        assertTrue(ok);
        verify(solapiSmsProvider).sendSms(eq(PHONE), eq(MESSAGE));
    }

    @Test
    @DisplayName("테스트 모드: Solapi 호출 없이 성공")
    void sendNotificationMessage_testMode_skipsProvider() {
        smsProperties.setTestMode(true);

        boolean ok = smsAuthService.sendNotificationMessage(PHONE, MESSAGE);

        assertTrue(ok);
        verify(solapiSmsProvider, org.mockito.Mockito.never()).sendSms(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }
}
