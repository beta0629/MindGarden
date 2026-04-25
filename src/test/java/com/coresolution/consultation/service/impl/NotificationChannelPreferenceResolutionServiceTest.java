package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import com.coresolution.consultation.constant.NotificationChannelPreferenceCode;
import com.coresolution.consultation.constant.NotificationChannelTenantHintCode;
import com.coresolution.consultation.constant.NotificationPhysicalChannel;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.KakaoAlimTalkService;
import com.coresolution.consultation.service.NotificationService.NotificationPriority;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.service.TenantKakaoAlimtalkSettingsService;
import com.coresolution.consultation.service.TenantSmsSettingsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 알림 채널 선호·테넌트 인프라 게이트·발송 순서 결정 단위 테스트.
 * 매트릭스 C-05, N-01~N-03, 테넌트 힌트 조합에 대응.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationChannelPreferenceResolutionService")
class NotificationChannelPreferenceResolutionServiceTest {

    private static final String TENANT_ID = UUID.randomUUID().toString();

    @Mock
    private KakaoAlimTalkService kakaoAlimTalkService;
    @Mock
    private TenantKakaoAlimtalkSettingsService tenantKakaoAlimtalkSettingsService;
    @Mock
    private TenantSmsSettingsService tenantSmsSettingsService;
    @Mock
    private SmsAuthService smsAuthService;

    @InjectMocks
    private NotificationChannelPreferenceResolutionService service;

    @Test
    @DisplayName("resolveTenantInfrastructure: 테넌트별 알림톡·SMS 게이트가 AND로 결합된다")
    void resolveTenantInfrastructure_combinesGlobalAndTenantGates() {
        when(kakaoAlimTalkService.isServiceAvailable()).thenReturn(true);
        when(tenantKakaoAlimtalkSettingsService.isAlimTalkEnabledForTenant(TENANT_ID)).thenReturn(false);
        when(smsAuthService.isSmsAuthEnabled()).thenReturn(true);
        when(tenantSmsSettingsService.isSmsEnabledForTenant(TENANT_ID)).thenReturn(true);

        var gates = service.resolveTenantInfrastructure(TENANT_ID);

        assertThat(gates.kakaoInfrastructureUp()).isFalse();
        assertThat(gates.smsInfrastructureUp()).isTrue();
    }

    @Test
    @DisplayName("normalizeIncomingPreference: 알림톡 인프라 불가일 때 KAKAO 요청은 TENANT_DEFAULT로 보정 (C-05 계열)")
    void normalizeIncomingPreference_kakaoDown_mapsKakaoToTenantDefault() {
        when(kakaoAlimTalkService.isServiceAvailable()).thenReturn(false);
        when(smsAuthService.isSmsAuthEnabled()).thenReturn(true);
        when(tenantSmsSettingsService.isSmsEnabledForTenant(TENANT_ID)).thenReturn(true);

        String out = service.normalizeIncomingPreference("KAKAO", TENANT_ID);

        assertThat(out).isEqualTo(NotificationChannelPreferenceCode.TENANT_DEFAULT.name());
    }

    @Test
    @DisplayName("normalizeIncomingPreference: SMS 인프라 불가일 때 SMS 요청은 TENANT_DEFAULT로 보정")
    void normalizeIncomingPreference_smsDown_mapsSmsToTenantDefault() {
        when(kakaoAlimTalkService.isServiceAvailable()).thenReturn(true);
        when(tenantKakaoAlimtalkSettingsService.isAlimTalkEnabledForTenant(TENANT_ID)).thenReturn(true);
        when(smsAuthService.isSmsAuthEnabled()).thenReturn(false);

        String out = service.normalizeIncomingPreference("SMS", TENANT_ID);

        assertThat(out).isEqualTo(NotificationChannelPreferenceCode.TENANT_DEFAULT.name());
    }

    @Test
    @DisplayName("normalizeIncomingPreference: 둘 다 가능하면 요청 코드가 그대로 저장된다")
    void normalizeIncomingPreference_bothChannels_keepsRequestedCode() {
        stubBothChannelsUp(TENANT_ID);

        assertThat(service.normalizeIncomingPreference("SMS", TENANT_ID))
            .isEqualTo(NotificationChannelPreferenceCode.SMS.name());
        assertThat(service.normalizeIncomingPreference("KAKAO", TENANT_ID))
            .isEqualTo(NotificationChannelPreferenceCode.KAKAO.name());
    }

    @Test
    @DisplayName("buildProfileSnapshot: DB SMS 선호 + SMS 인프라 OFF면 uiAdjusted true")
    void buildProfileSnapshot_smsPreferredButInfraOff_setsUiAdjusted() {
        when(kakaoAlimTalkService.isServiceAvailable()).thenReturn(true);
        when(tenantKakaoAlimtalkSettingsService.isAlimTalkEnabledForTenant(TENANT_ID)).thenReturn(true);
        when(smsAuthService.isSmsAuthEnabled()).thenReturn(true);
        when(tenantSmsSettingsService.isSmsEnabledForTenant(TENANT_ID)).thenReturn(false);

        User user = new User();
        user.setTenantId(TENANT_ID);
        user.setNotificationChannelPreference("SMS");

        var snap = service.buildProfileSnapshot(user);

        assertThat(snap.notificationChannelPreference()).isEqualTo("SMS");
        assertThat(snap.tenantNotificationChannelSmsAvailable()).isFalse();
        assertThat(snap.notificationChannelPreferenceUiAdjusted()).isTrue();
        assertThat(snap.tenantDefaultNotificationChannelHint()).isEqualTo(NotificationChannelTenantHintCode.KAKAO.name());
    }

    @Test
    @DisplayName("buildProfileSnapshot: 둘 다 인프라 불가면 힌트 NONE")
    void buildProfileSnapshot_noChannel_hintNone() {
        when(kakaoAlimTalkService.isServiceAvailable()).thenReturn(false);
        when(smsAuthService.isSmsAuthEnabled()).thenReturn(false);

        User user = new User();
        user.setTenantId(TENANT_ID);
        user.setNotificationChannelPreference("TENANT_DEFAULT");

        var snap = service.buildProfileSnapshot(user);

        assertThat(snap.tenantDefaultNotificationChannelHint()).isEqualTo(NotificationChannelTenantHintCode.NONE.name());
        assertThat(snap.tenantNotificationChannelKakaoAvailable()).isFalse();
        assertThat(snap.tenantNotificationChannelSmsAvailable()).isFalse();
    }

    @Test
    @DisplayName("resolveDeliveryOrder: 선호 KAKAO + 양 채널 가능 시 알림톡 우선 (N-01)")
    void resolveDeliveryOrder_kakaoPreference_kakaoFirst() {
        stubBothChannelsUp(TENANT_ID);

        List<NotificationPhysicalChannel> order = service.resolveDeliveryOrder(
            NotificationChannelPreferenceCode.KAKAO,
            NotificationPriority.HIGH,
            true,
            true,
            TENANT_ID);

        assertThat(order).containsExactly(
            NotificationPhysicalChannel.KAKAO,
            NotificationPhysicalChannel.SMS);
    }

    @Test
    @DisplayName("resolveDeliveryOrder: 선호 SMS + 양 채널 가능 시 SMS 우선 (N-02)")
    void resolveDeliveryOrder_smsPreference_smsFirst() {
        stubBothChannelsUp(TENANT_ID);

        List<NotificationPhysicalChannel> order = service.resolveDeliveryOrder(
            NotificationChannelPreferenceCode.SMS,
            NotificationPriority.HIGH,
            true,
            true,
            TENANT_ID);

        assertThat(order).containsExactly(
            NotificationPhysicalChannel.SMS,
            NotificationPhysicalChannel.KAKAO);
    }

    @Test
    @DisplayName("resolveDeliveryOrder: TENANT_DEFAULT + HIGH는 알림톡 우선 (N-03 HIGH)")
    void resolveDeliveryOrder_tenantDefaultHigh_kakaoFirst() {
        stubBothChannelsUp(TENANT_ID);

        List<NotificationPhysicalChannel> order = service.resolveDeliveryOrder(
            NotificationChannelPreferenceCode.TENANT_DEFAULT,
            NotificationPriority.HIGH,
            true,
            true,
            TENANT_ID);

        assertThat(order).containsExactly(
            NotificationPhysicalChannel.KAKAO,
            NotificationPhysicalChannel.SMS);
    }

    @Test
    @DisplayName("resolveDeliveryOrder: TENANT_DEFAULT + MEDIUM은 SMS 우선 (N-03 MEDIUM)")
    void resolveDeliveryOrder_tenantDefaultMedium_smsFirst() {
        stubBothChannelsUp(TENANT_ID);

        List<NotificationPhysicalChannel> order = service.resolveDeliveryOrder(
            NotificationChannelPreferenceCode.TENANT_DEFAULT,
            NotificationPriority.MEDIUM,
            true,
            true,
            TENANT_ID);

        assertThat(order).containsExactly(
            NotificationPhysicalChannel.SMS,
            NotificationPhysicalChannel.KAKAO);
    }

    @Test
    @DisplayName("resolveDeliveryOrder: 알림톡만 가능·사용자 허용 시 KAKAO 단일")
    void resolveDeliveryOrder_kakaoOnlyInfrastructure_singleChannel() {
        when(kakaoAlimTalkService.isServiceAvailable()).thenReturn(true);
        when(tenantKakaoAlimtalkSettingsService.isAlimTalkEnabledForTenant(TENANT_ID)).thenReturn(true);
        when(smsAuthService.isSmsAuthEnabled()).thenReturn(true);
        when(tenantSmsSettingsService.isSmsEnabledForTenant(TENANT_ID)).thenReturn(false);

        List<NotificationPhysicalChannel> order = service.resolveDeliveryOrder(
            NotificationChannelPreferenceCode.KAKAO,
            NotificationPriority.HIGH,
            true,
            true,
            TENANT_ID);

        assertThat(order).containsExactly(NotificationPhysicalChannel.KAKAO);
    }

    @Test
    @DisplayName("resolveDeliveryOrder: 사용자 레거시로 알림톡 불가면 TENANT_DEFAULT 경로로 재계산")
    void resolveDeliveryOrder_userKakaoDisabled_fallsBackToTenantDefaultOrder() {
        stubBothChannelsUp(TENANT_ID);

        List<NotificationPhysicalChannel> order = service.resolveDeliveryOrder(
            NotificationChannelPreferenceCode.KAKAO,
            NotificationPriority.HIGH,
            false,
            true,
            TENANT_ID);

        assertThat(order).containsExactly(NotificationPhysicalChannel.SMS);
    }

    private void stubBothChannelsUp(String tenantId) {
        when(kakaoAlimTalkService.isServiceAvailable()).thenReturn(true);
        when(tenantKakaoAlimtalkSettingsService.isAlimTalkEnabledForTenant(eq(tenantId))).thenReturn(true);
        when(smsAuthService.isSmsAuthEnabled()).thenReturn(true);
        when(tenantSmsSettingsService.isSmsEnabledForTenant(eq(tenantId))).thenReturn(true);
    }
}
