package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.config.ExpoPushProperties;
import com.coresolution.consultation.constant.MobilePushCanonicalTypes;
import com.coresolution.consultation.entity.MobilePushSettings;
import com.coresolution.consultation.entity.MobilePushToken;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.MobilePushSettingsRepository;
import com.coresolution.consultation.repository.MobilePushTokenRepository;
import com.coresolution.consultation.service.MobilePushDispatchDedupService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * 모바일 푸시 발송 게이트·멱등 단위 검증.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MobilePushDispatchServiceImpl")
class MobilePushDispatchServiceImplTest {

    @Mock
    private RestTemplate restTemplate;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ExpoPushProperties expoPushProperties;

    @Mock
    private MobilePushTokenRepository mobilePushTokenRepository;

    @Mock
    private MobilePushSettingsRepository mobilePushSettingsRepository;

    @Mock
    private MobilePushDispatchDedupService mobilePushDispatchDedupService;

    @InjectMocks
    private MobilePushDispatchServiceImpl mobilePushDispatchService;

    @Test
    @DisplayName("schedule 카테고리 off면 Expo·멱등·토큰 조회를 하지 않는다")
    void skipsExpoWhenScheduleCategoryDisabled() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setScheduleEnabled(false);

        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(java.util.Optional.of(settings));

        Schedule schedule = new Schedule();
        schedule.setId(50L);
        schedule.setTenantId("tenant-a");
        schedule.setClientId(77L);
        schedule.setConsultantId(88L);

        mobilePushDispatchService.dispatchBookingConfirmed("tenant-a", schedule);

        verify(mobilePushTokenRepository, never()).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(anyString(),
                anyList());
        verify(mobilePushDispatchDedupService, never()).tryClaim(anyString(), anyString(), anyString(), anyString());
        verify(restTemplate, never()).postForObject(anyString(), any(), eq(String.class));
    }

    @Test
    @DisplayName("payment 카테고리 off면 토큰 조회·멱등 claim·Expo POST를 하지 않는다")
    void skipsTokenLookupDedupAndExpoWhenPaymentCategoryDisabled() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setPaymentEnabled(false);

        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(Optional.of(settings));

        Payment payment = new Payment();
        payment.setTenantId("tenant-a");
        payment.setPayerId(77L);
        payment.setPaymentId("pay-" + UUID.randomUUID());

        mobilePushDispatchService.dispatchPaymentCompleted("tenant-a", payment);

        verify(mobilePushTokenRepository, never()).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(anyString(),
                anyList());
        verify(mobilePushDispatchDedupService, never()).tryClaim(anyString(), anyString(), anyString(), anyString());
        verify(restTemplate, never()).postForObject(anyString(), any(), eq(String.class));
    }

    @Test
    @DisplayName("멱등 claim 실패 시 Expo POST를 하지 않는다")
    void skipsExpoWhenDedupClaimReturnsFalse() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setScheduleEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(Optional.of(settings));

        MobilePushToken token = new MobilePushToken();
        token.setPushToken("ExponentPushToken[dedup-test]");
        token.setUserId(77L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(77L)))).thenReturn(List.of(token));

        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"), eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED),
                eq("50"), eq("confirmed"))).thenReturn(false);

        Schedule schedule = new Schedule();
        schedule.setId(50L);
        schedule.setTenantId("tenant-a");
        schedule.setClientId(77L);

        mobilePushDispatchService.dispatchBookingConfirmed("tenant-a", schedule);

        verify(mobilePushDispatchDedupService, times(1)).tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED), eq("50"), eq("confirmed"));
        verify(restTemplate, never()).postForObject(anyString(), any(), eq(String.class));
    }

    @Test
    @DisplayName("Expo DeviceNotRegistered 티켓이면 해당 토큰을 비활성화 저장한다")
    void deactivatesTokenWhenExpoReturnsDeviceNotRegistered() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setPaymentEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(Optional.of(settings));

        String pushToken = "ExponentPushToken[device-not-registered]";
        MobilePushToken token = new MobilePushToken();
        token.setPushToken(pushToken);
        token.setUserId(77L);
        token.setActive(true);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(77L)))).thenReturn(List.of(token));

        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"), eq(MobilePushCanonicalTypes.PAYMENT_COMPLETED),
                anyString(), eq("approved"))).thenReturn(true);

        String expoBody = "{\"data\":[{\"status\":\"error\",\"message\":\"\",\"details\":{\"error\":\"DeviceNotRegistered\"}}]}";
        when(restTemplate.postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class)))
                .thenReturn(expoBody);

        when(mobilePushTokenRepository.findByTenantIdAndPushTokenAndIsDeletedFalse(eq("tenant-a"), eq(pushToken)))
                .thenReturn(Optional.of(token));

        Payment payment = new Payment();
        payment.setTenantId("tenant-a");
        payment.setPayerId(77L);
        String paymentId = "pay-" + UUID.randomUUID();
        payment.setPaymentId(paymentId);
        payment.setAmount(new BigDecimal("1000.00"));

        mobilePushDispatchService.dispatchPaymentCompleted("tenant-a", payment);

        verify(mobilePushTokenRepository).save(argThat(t -> !t.isActive() && pushToken.equals(t.getPushToken())));
    }

    @Test
    @DisplayName("Expo HTTP 실패(RestClientException)는 호출부로 전파되지 않는다")
    void swallowsRestClientExceptionFromExpoPost() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setScheduleEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(Optional.of(settings));

        MobilePushToken token = new MobilePushToken();
        token.setPushToken("ExponentPushToken[http-fail]");
        token.setUserId(77L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(77L)))).thenReturn(List.of(token));

        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"), eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED),
                eq("50"), eq("confirmed"))).thenReturn(true);

        when(restTemplate.postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class)))
                .thenThrow(new RestClientException("expo-down"));

        Schedule schedule = new Schedule();
        schedule.setId(50L);
        schedule.setTenantId("tenant-a");
        schedule.setClientId(77L);

        assertDoesNotThrow(() -> mobilePushDispatchService.dispatchBookingConfirmed("tenant-a", schedule));
    }
}
