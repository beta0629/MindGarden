package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.config.ExpoPushProperties;
import com.coresolution.consultation.constant.MobilePushCanonicalTypes;
import com.coresolution.consultation.dto.MobilePushBroadcastResult;
import com.coresolution.consultation.entity.MobilePushSettings;
import com.coresolution.consultation.entity.MobilePushToken;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.MobilePushSettingsRepository;
import com.coresolution.consultation.repository.MobilePushTokenRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.MobilePushDispatchDedupService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
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
 * Expo 푸시 발송 시 알림 센터({@code system_notifications}) 인박스 동기 적재 검증.
 *
 * <p>OS 푸시는 도착하지만 앱/웹 알림 센터가 비어 있는 갭(2026-05-26 운영 보고) 해소를 위해
 * {@link MobilePushDispatchServiceImpl} 가 {@link MobilePushInboxPersister} 를 호출하는지
 * 행위 차원에서 검증한다. persister 의 내부 매핑(targetType / notificationType) 검증은
 * {@code MobilePushInboxPersisterTest} 의 책임.
 *
 * @author MindGarden
 * @since 2026-05-26
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MobilePushDispatchServiceImpl 알림 인박스 persist")
class MobilePushDispatchServiceImplInboxPersistenceTest {

    private static final String TENANT_ID = "tenant-inbox";
    private static final String EXPO_URL = "https://exp.test/--/api/v2/push/send";

    @Mock private RestTemplate restTemplate;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();
    @Mock private ExpoPushProperties expoPushProperties;
    @Mock private MobilePushTokenRepository mobilePushTokenRepository;
    @Mock private MobilePushSettingsRepository mobilePushSettingsRepository;
    @Mock private MobilePushDispatchDedupService mobilePushDispatchDedupService;
    @Mock private UserRepository userRepository;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock private MobilePushInboxPersister mobilePushInboxPersister;

    @InjectMocks
    private MobilePushDispatchServiceImpl mobilePushDispatchService;

    // ===================== dispatchAdminAnnouncement =====================

    @Test
    @DisplayName("dispatchAdminAnnouncement SENT — persister.persistForRecipient 1회 (ADMIN_ANNOUNCEMENT, title/body 그대로)")
    void adminAnnouncement_sent_persistsInboxOnce() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn(EXPO_URL);

        MobilePushSettings settings = new MobilePushSettings();
        settings.setSystemEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq(TENANT_ID), eq(77L)))
                .thenReturn(Optional.of(settings));

        MobilePushToken token = new MobilePushToken();
        token.setPushToken("ExponentPushToken[inbox-sent]");
        token.setUserId(77L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq(TENANT_ID), eq(List.of(77L)))).thenReturn(List.of(token));

        when(mobilePushDispatchDedupService.tryClaim(
                eq(TENANT_ID), eq(MobilePushCanonicalTypes.ADMIN_ANNOUNCEMENT),
                eq("77"), eq("bucket-inbox"))).thenReturn(true);

        when(restTemplate.postForObject(eq(EXPO_URL), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\",\"id\":\"r-77\"}]}");

        List<MobilePushBroadcastResult> results = mobilePushDispatchService.dispatchAdminAnnouncement(
                TENANT_ID, List.of(77L), "운영 공지", "안내 본문", "bucket-inbox");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getStatus()).isEqualTo(MobilePushBroadcastResult.Status.SENT);

        verify(mobilePushInboxPersister, times(1)).persistForRecipient(
                eq(TENANT_ID), eq(77L),
                eq(MobilePushCanonicalTypes.ADMIN_ANNOUNCEMENT),
                eq("운영 공지"), eq("안내 본문"));
    }

    @Test
    @DisplayName("dispatchAdminAnnouncement SKIPPED(opt-out) — persistForRecipient 호출 0")
    void adminAnnouncement_optedOut_doesNotPersist() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setSystemEnabled(false);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq(TENANT_ID), eq(78L)))
                .thenReturn(Optional.of(settings));

        List<MobilePushBroadcastResult> results = mobilePushDispatchService.dispatchAdminAnnouncement(
                TENANT_ID, List.of(78L), "공지", "본문", "bucket-opted-out");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getStatus()).isEqualTo(MobilePushBroadcastResult.Status.SKIPPED);
        verify(mobilePushInboxPersister, never()).persistForRecipient(
                anyString(), anyLong(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("dispatchAdminAnnouncement FAILED(Expo HTTP 실패) — persistForRecipient 호출 0")
    void adminAnnouncement_failed_doesNotPersist() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn(EXPO_URL);

        MobilePushSettings settings = new MobilePushSettings();
        settings.setSystemEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq(TENANT_ID), eq(81L)))
                .thenReturn(Optional.of(settings));

        MobilePushToken token = new MobilePushToken();
        token.setPushToken("ExponentPushToken[inbox-fail]");
        token.setUserId(81L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq(TENANT_ID), eq(List.of(81L)))).thenReturn(List.of(token));

        when(mobilePushDispatchDedupService.tryClaim(eq(TENANT_ID),
                eq(MobilePushCanonicalTypes.ADMIN_ANNOUNCEMENT), eq("81"), eq("bucket-fail")))
                .thenReturn(true);

        when(restTemplate.postForObject(eq(EXPO_URL), any(), eq(String.class)))
                .thenThrow(new RestClientException("expo-down"));

        List<MobilePushBroadcastResult> results = mobilePushDispatchService.dispatchAdminAnnouncement(
                TENANT_ID, List.of(81L), "공지", "본문", "bucket-fail");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getStatus()).isEqualTo(MobilePushBroadcastResult.Status.FAILED);
        verify(mobilePushInboxPersister, never()).persistForRecipient(
                anyString(), anyLong(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("dispatchAdminAnnouncement 혼합(SENT/SKIPPED/SKIPPED) — SENT 사용자에만 persist 1회")
    void adminAnnouncement_mixedRoster_persistsOnlySentRows() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn(EXPO_URL);

        MobilePushSettings on = new MobilePushSettings();
        on.setSystemEnabled(true);
        MobilePushSettings off = new MobilePushSettings();
        off.setSystemEnabled(false);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq(TENANT_ID), eq(100L)))
                .thenReturn(Optional.of(on));
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq(TENANT_ID), eq(101L)))
                .thenReturn(Optional.of(off));
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq(TENANT_ID), eq(102L)))
                .thenReturn(Optional.of(on));

        MobilePushToken token100 = new MobilePushToken();
        token100.setPushToken("ExponentPushToken[u100]");
        token100.setUserId(100L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq(TENANT_ID), eq(List.of(100L)))).thenReturn(List.of(token100));
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq(TENANT_ID), eq(List.of(102L)))).thenReturn(List.of());

        when(mobilePushDispatchDedupService.tryClaim(eq(TENANT_ID),
                eq(MobilePushCanonicalTypes.ADMIN_ANNOUNCEMENT), eq("100"), eq("bucket-mix")))
                .thenReturn(true);
        when(restTemplate.postForObject(eq(EXPO_URL), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\",\"id\":\"r-100\"}]}");

        mobilePushDispatchService.dispatchAdminAnnouncement(
                TENANT_ID, List.of(100L, 101L, 102L), "공지", "안내", "bucket-mix");

        verify(mobilePushInboxPersister, times(1)).persistForRecipient(
                eq(TENANT_ID), eq(100L),
                eq(MobilePushCanonicalTypes.ADMIN_ANNOUNCEMENT),
                eq("공지"), eq("안내"));
        verify(mobilePushInboxPersister, never()).persistForRecipient(
                eq(TENANT_ID), eq(101L), anyString(), anyString(), anyString());
        verify(mobilePushInboxPersister, never()).persistForRecipient(
                eq(TENANT_ID), eq(102L), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("dispatchAdminAnnouncement — persistForRecipient 가 예외를 던져도 results 정상 반환(예외 전파 없음)")
    void adminAnnouncement_persistThrows_doesNotAffectResult() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn(EXPO_URL);

        MobilePushSettings settings = new MobilePushSettings();
        settings.setSystemEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq(TENANT_ID), eq(77L)))
                .thenReturn(Optional.of(settings));

        MobilePushToken token = new MobilePushToken();
        token.setPushToken("ExponentPushToken[inbox-throws]");
        token.setUserId(77L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq(TENANT_ID), eq(List.of(77L)))).thenReturn(List.of(token));

        when(mobilePushDispatchDedupService.tryClaim(eq(TENANT_ID),
                eq(MobilePushCanonicalTypes.ADMIN_ANNOUNCEMENT), eq("77"), eq("bucket-throws")))
                .thenReturn(true);
        when(restTemplate.postForObject(eq(EXPO_URL), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\",\"id\":\"r-77\"}]}");

        // persister 가 RuntimeException 을 throw 하도록 stub — 호출자에는 전파되면 안 됨.
        // 실제 운영에서는 MobilePushInboxPersister 가 try/catch 로 swallow 하지만, mock 이
        // 의도적으로 예외를 던지는 시나리오로 dispatcher 안전망을 검증한다.
        doThrow(new RuntimeException("db down"))
                .when(mobilePushInboxPersister).persistForRecipient(
                        anyString(), anyLong(), anyString(), anyString(), anyString());

        List<MobilePushBroadcastResult> results = assertDoesNotThrow(() ->
                mobilePushDispatchService.dispatchAdminAnnouncement(
                        TENANT_ID, List.of(77L), "공지", "본문", "bucket-throws"));

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getStatus()).isEqualTo(MobilePushBroadcastResult.Status.SENT);
    }

    // ===================== fanout(allowlist 통과) =====================

    @Test
    @DisplayName("dispatchPaymentCompleted(allowlist) — 활성 토큰 사용자에 persistForRecipient 1회")
    void paymentCompleted_persistsInboxForActiveTokenUser() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn(EXPO_URL);

        MobilePushSettings settings = new MobilePushSettings();
        settings.setPaymentEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq(TENANT_ID), eq(77L)))
                .thenReturn(Optional.of(settings));

        MobilePushToken token = new MobilePushToken();
        token.setPushToken("ExponentPushToken[pay-inbox]");
        token.setUserId(77L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq(TENANT_ID),
                eq(List.of(77L)))).thenReturn(List.of(token));

        when(mobilePushDispatchDedupService.tryClaim(eq(TENANT_ID),
                eq(MobilePushCanonicalTypes.PAYMENT_COMPLETED), anyString(), eq("approved"))).thenReturn(true);
        when(restTemplate.postForObject(eq(EXPO_URL), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\"}]}");

        Payment payment = new Payment();
        payment.setTenantId(TENANT_ID);
        payment.setPayerId(77L);
        payment.setPaymentId("pay-" + UUID.randomUUID());
        payment.setAmount(new BigDecimal("12000.00"));
        payment.setDescription("기본 패키지");

        mobilePushDispatchService.dispatchPaymentCompleted(TENANT_ID, payment);

        verify(mobilePushInboxPersister, times(1)).persistForRecipient(
                eq(TENANT_ID), eq(77L),
                eq(MobilePushCanonicalTypes.PAYMENT_COMPLETED),
                anyString(), anyString());
    }

    @Test
    @DisplayName("dispatchPaymentFailed(non-allowlist) — fanout 진입부 차단으로 persistForRecipient 호출 0")
    void paymentFailed_notAllowlisted_doesNotPersist() {
        Payment payment = new Payment();
        payment.setTenantId(TENANT_ID);
        payment.setPayerId(77L);
        payment.setPaymentId("pay-fail-" + UUID.randomUUID());

        mobilePushDispatchService.dispatchPaymentFailed(TENANT_ID, payment);

        verify(mobilePushInboxPersister, never()).persistForRecipient(
                anyString(), anyLong(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("dispatchBookingConfirmed(첫상담 — 내담자 단독) — 내담자에 persistForRecipient 1회, 상담사에는 호출 0")
    void bookingConfirmed_firstBooking_persistsClientOnly() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn(EXPO_URL);
        when(scheduleRepository.countByClientId(eq(TENANT_ID), eq(77L))).thenReturn(1L);

        MobilePushSettings settings = new MobilePushSettings();
        settings.setScheduleEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq(TENANT_ID), eq(77L)))
                .thenReturn(Optional.of(settings));

        MobilePushToken clientToken = new MobilePushToken();
        clientToken.setPushToken("ExponentPushToken[client-first]");
        clientToken.setUserId(77L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq(TENANT_ID),
                eq(List.of(77L)))).thenReturn(List.of(clientToken));

        when(mobilePushDispatchDedupService.tryClaim(eq(TENANT_ID),
                eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED), eq("50"), eq("confirmed"))).thenReturn(true);
        when(restTemplate.postForObject(eq(EXPO_URL), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\"}]}");

        Schedule schedule = new Schedule();
        schedule.setId(50L);
        schedule.setTenantId(TENANT_ID);
        schedule.setClientId(77L);
        schedule.setConsultantId(88L);

        mobilePushDispatchService.dispatchBookingConfirmed(TENANT_ID, schedule, null);

        verify(mobilePushInboxPersister, times(1)).persistForRecipient(
                eq(TENANT_ID), eq(77L),
                eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED),
                anyString(), anyString());
        verify(mobilePushInboxPersister, never()).persistForRecipient(
                eq(TENANT_ID), eq(88L), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("fanout — 한 사용자가 토큰 N개여도 persistForRecipient 는 사용자당 1회")
    void fanout_multipleTokensPerUser_persistsOnce() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn(EXPO_URL);

        MobilePushSettings settings = new MobilePushSettings();
        settings.setPaymentEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq(TENANT_ID), eq(77L)))
                .thenReturn(Optional.of(settings));

        MobilePushToken tokenA = new MobilePushToken();
        tokenA.setPushToken("ExponentPushToken[pay-A]");
        tokenA.setUserId(77L);
        MobilePushToken tokenB = new MobilePushToken();
        tokenB.setPushToken("ExponentPushToken[pay-B]");
        tokenB.setUserId(77L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq(TENANT_ID),
                eq(List.of(77L)))).thenReturn(List.of(tokenA, tokenB));

        when(mobilePushDispatchDedupService.tryClaim(eq(TENANT_ID),
                eq(MobilePushCanonicalTypes.PAYMENT_COMPLETED), anyString(), eq("approved"))).thenReturn(true);
        when(restTemplate.postForObject(eq(EXPO_URL), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\"},{\"status\":\"ok\"}]}");

        Payment payment = new Payment();
        payment.setTenantId(TENANT_ID);
        payment.setPayerId(77L);
        payment.setPaymentId("pay-" + UUID.randomUUID());
        payment.setAmount(new BigDecimal("9000.00"));

        mobilePushDispatchService.dispatchPaymentCompleted(TENANT_ID, payment);

        verify(mobilePushInboxPersister, times(1)).persistForRecipient(
                eq(TENANT_ID), eq(77L),
                eq(MobilePushCanonicalTypes.PAYMENT_COMPLETED),
                anyString(), anyString());
    }

    @Test
    @DisplayName("fanout — 멱등 claim 실패면 persistForRecipient 호출 0")
    void fanout_dedupConflict_doesNotPersist() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setPaymentEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq(TENANT_ID), eq(77L)))
                .thenReturn(Optional.of(settings));

        MobilePushToken token = new MobilePushToken();
        token.setPushToken("ExponentPushToken[dup-inbox]");
        token.setUserId(77L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq(TENANT_ID),
                eq(List.of(77L)))).thenReturn(List.of(token));

        when(mobilePushDispatchDedupService.tryClaim(eq(TENANT_ID),
                eq(MobilePushCanonicalTypes.PAYMENT_COMPLETED), anyString(), eq("approved"))).thenReturn(false);

        Payment payment = new Payment();
        payment.setTenantId(TENANT_ID);
        payment.setPayerId(77L);
        payment.setPaymentId("pay-dup-" + UUID.randomUUID());

        mobilePushDispatchService.dispatchPaymentCompleted(TENANT_ID, payment);

        verify(mobilePushInboxPersister, never()).persistForRecipient(
                anyString(), anyLong(), anyString(), anyString(), anyString());
    }
}
