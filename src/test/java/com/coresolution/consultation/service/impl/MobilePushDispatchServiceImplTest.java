package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.ArgumentCaptor;
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
import com.coresolution.consultation.dto.MobilePushBroadcastResult;
import com.coresolution.consultation.entity.MobilePushSettings;
import com.coresolution.consultation.entity.MobilePushToken;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.MobilePushSettingsRepository;
import com.coresolution.consultation.repository.MobilePushTokenRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.MobilePushDispatchDedupService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
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

    @Mock
    private UserRepository userRepository;

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;

    @InjectMocks
    private MobilePushDispatchServiceImpl mobilePushDispatchService;

    @Test
    @DisplayName("Expo access token 미설정이면 토큰 조회·멱등·Expo POST를 하지 않는다")
    void skipsExpoWhenAccessTokenMissing() {
        when(expoPushProperties.getAccessToken()).thenReturn("");

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
    @DisplayName("schedule 카테고리 off면 Expo·멱등·토큰 조회를 하지 않는다")
    void skipsExpoWhenScheduleCategoryDisabled() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setScheduleEnabled(false);
        // 양쪽 fanout(Task 3) — 내담자·상담사 모두 카테고리 off 로 설정하여 차단 일관성 검증.
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(java.util.Optional.of(settings));
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(88L)))
                .thenReturn(java.util.Optional.of(settings));

        Schedule schedule = new Schedule();
        schedule.setId(50L);
        schedule.setTenantId("tenant-a");
        schedule.setClientId(77L);
        schedule.setConsultantId(88L);

        mobilePushDispatchService.dispatchBookingConfirmed("tenant-a", schedule, null);

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

        mobilePushDispatchService.dispatchBookingConfirmed("tenant-a", schedule, null);

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

        assertDoesNotThrow(() -> mobilePushDispatchService.dispatchBookingConfirmed("tenant-a", schedule, null));
    }

    @Test
    @DisplayName("dispatchMappingSettlement: PAYMENT_COMPLETED는 화이트리스트에 포함되어 내담자 fanout 수행")
    void dispatchMappingSettlement_clientOnlyFanout() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setPaymentEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(Optional.of(settings));

        MobilePushToken token = new MobilePushToken();
        token.setPushToken("ExponentPushToken[mapping-client]");
        token.setUserId(77L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(77L)))).thenReturn(List.of(token));

        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"), eq(MobilePushCanonicalTypes.PAYMENT_COMPLETED),
                eq("900"), eq("mapping-payment-confirmed"))).thenReturn(true);
        when(restTemplate.postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\"}]}");

        mobilePushDispatchService.dispatchMappingSettlement(
                "tenant-a",
                900L,
                77L,
                88L,
                false,
                MobilePushCanonicalTypes.PAYMENT_COMPLETED,
                "mapping-payment-confirmed",
                "결제 완료",
                "패키지 결제가 확인되었습니다.",
                null);

        verify(mobilePushTokenRepository).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(77L)));
        verify(mobilePushDispatchDedupService, times(1)).tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.PAYMENT_COMPLETED), eq("900"), eq("mapping-payment-confirmed"));
        verify(restTemplate, times(1)).postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class));
    }

    @Test
    @DisplayName("dispatchMappingSettlement: MAPPING_APPROVED 화이트리스트 통과 + includeConsultant=false → 내담자 단독 fanout (2026-05-23 정책)")
    void dispatchMappingSettlement_mappingApprovedAllowlistedClientOnly() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setSystemEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(Optional.of(settings));

        MobilePushToken token = new MobilePushToken();
        token.setPushToken("ExponentPushToken[mapping-approved-client]");
        token.setUserId(77L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(77L)))).thenReturn(List.of(token));

        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"), eq(MobilePushCanonicalTypes.MAPPING_APPROVED),
                eq("901"), eq("mapping-approved"))).thenReturn(true);
        when(restTemplate.postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\"}]}");

        // 시나리오 #1 — MappingSettlementNotificationHelperImpl 가 includeConsultant=false 로 호출.
        mobilePushDispatchService.dispatchMappingSettlement(
                "tenant-a",
                901L,
                77L,
                88L,
                false,
                MobilePushCanonicalTypes.MAPPING_APPROVED,
                "mapping-approved",
                "매칭 승인",
                "상담 매칭이 승인되었습니다.",
                "새 상담 매칭이 승인되었습니다.");

        // 내담자만 fanout — 상담사 token/dedupe 호출 0.
        verify(mobilePushTokenRepository, times(1)).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq("tenant-a"), eq(List.of(77L)));
        verify(mobilePushTokenRepository, never()).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq("tenant-a"), eq(List.of(88L)));
        verify(mobilePushDispatchDedupService, times(1)).tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.MAPPING_APPROVED), eq("901"), eq("mapping-approved"));
        verify(restTemplate, times(1)).postForObject(eq("https://exp.test/--/api/v2/push/send"), any(),
                eq(String.class));
    }

    @Test
    @DisplayName("dispatchBookingConfirmed: 본문에 일시·상담사명 포함")
    void dispatchBookingConfirmed_enrichedBody() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setScheduleEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(Optional.of(settings));

        User consultant = new User();
        when(userRepository.findByTenantIdAndId(eq("tenant-a"), eq(88L))).thenReturn(Optional.of(consultant));
        when(scheduleListUserFieldsResolver.resolveDisplayNameForScheduleList(consultant)).thenReturn("박상담");

        MobilePushToken token = new MobilePushToken();
        token.setPushToken("ExponentPushToken[enriched]");
        token.setUserId(77L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(77L)))).thenReturn(List.of(token));

        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"), eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED),
                eq("50"), eq("confirmed"))).thenReturn(true);

        ArgumentCaptor<org.springframework.http.HttpEntity<?>> entityCaptor =
                ArgumentCaptor.forClass(org.springframework.http.HttpEntity.class);
        when(restTemplate.postForObject(eq("https://exp.test/--/api/v2/push/send"), entityCaptor.capture(),
                eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\"}]}");

        Schedule schedule = new Schedule();
        schedule.setId(50L);
        schedule.setTenantId("tenant-a");
        schedule.setClientId(77L);
        schedule.setConsultantId(88L);
        schedule.setDate(LocalDate.of(2026, 5, 20));
        schedule.setStartTime(LocalTime.of(14, 0));
        schedule.setEndTime(LocalTime.of(15, 0));

        mobilePushDispatchService.dispatchBookingConfirmed("tenant-a", schedule, null);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> messages =
                (List<Map<String, Object>>) entityCaptor.getValue().getBody();
        assertThat(messages).isNotNull().hasSize(1);
        assertThat(messages.get(0).get("body").toString())
                .contains("2026-05-20 (수) 14:00–15:00")
                .contains("박상담");
    }

    @Test
    @DisplayName("dispatchBookingRescheduled: 내담자·상담사 각각 fanout")
    void dispatchBookingRescheduled_clientAndConsultantFanout() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setScheduleEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(Optional.of(settings));
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(88L)))
                .thenReturn(Optional.of(settings));

        User consultant = new User();
        User client = new User();
        when(userRepository.findByTenantIdAndId(eq("tenant-a"), eq(88L))).thenReturn(Optional.of(consultant));
        when(userRepository.findByTenantIdAndId(eq("tenant-a"), eq(77L))).thenReturn(Optional.of(client));
        when(scheduleListUserFieldsResolver.resolveDisplayNameForScheduleList(consultant)).thenReturn("박상담");
        when(scheduleListUserFieldsResolver.resolveDisplayNameForScheduleList(client)).thenReturn("이내담");

        MobilePushToken clientToken = new MobilePushToken();
        clientToken.setPushToken("ExponentPushToken[client]");
        clientToken.setUserId(77L);
        MobilePushToken consultantToken = new MobilePushToken();
        consultantToken.setPushToken("ExponentPushToken[consultant]");
        consultantToken.setUserId(88L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(77L)))).thenReturn(List.of(clientToken));
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(88L)))).thenReturn(List.of(consultantToken));

        when(mobilePushDispatchDedupService.tryClaim(
                eq("tenant-a"), eq(MobilePushCanonicalTypes.BOOKING_RESCHEDULED), eq("50"), anyString()))
                .thenReturn(true);
        when(restTemplate.postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\"}]}");

        Schedule schedule = new Schedule();
        schedule.setId(50L);
        schedule.setTenantId("tenant-a");
        schedule.setClientId(77L);
        schedule.setConsultantId(88L);
        schedule.setDate(LocalDate.of(2026, 5, 21));
        schedule.setStartTime(LocalTime.of(14, 0));
        schedule.setEndTime(LocalTime.of(15, 0));

        mobilePushDispatchService.dispatchBookingRescheduled(
                "tenant-a",
                schedule,
                LocalDate.of(2026, 5, 20),
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                null);

        verify(mobilePushDispatchDedupService, times(2)).tryClaim(
                eq("tenant-a"), eq(MobilePushCanonicalTypes.BOOKING_RESCHEDULED), eq("50"), anyString());
        verify(restTemplate, times(2)).postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class));
    }

    @Test
    @DisplayName("dispatchMappingSettlement: payment 카테고리 off면 내담자 fanout 생략")
    void dispatchMappingSettlement_skipsWhenPaymentCategoryDisabled() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setPaymentEnabled(false);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(Optional.of(settings));

        mobilePushDispatchService.dispatchMappingSettlement(
                "tenant-a",
                900L,
                77L,
                88L,
                false,
                MobilePushCanonicalTypes.PAYMENT_COMPLETED,
                "mapping-deposit-confirmed",
                "입금 확인",
                "입금이 확인되었습니다.",
                null);

        verify(mobilePushTokenRepository, never()).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(anyString(),
                anyList());
        verify(mobilePushDispatchDedupService, never()).tryClaim(anyString(), anyString(), anyString(), anyString());
        verify(restTemplate, never()).postForObject(anyString(), any(), eq(String.class));
    }

    @Test
    @DisplayName("dispatchShopOrderPaid: D-4 화이트리스트 미포함 — Expo·dedup·token 호출 0")
    void dispatchShopOrderPaid_filteredByAllowlist() {
        // D-4: SHOP_ORDER_PAID는 푸시 허용 set 밖이므로 dispatchFanout이 진입부에서 차단.
        mobilePushDispatchService.dispatchShopOrderPaid("tenant-a", 77L, "ord-1", 12_000L);

        verify(mobilePushTokenRepository, never()).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(anyString(),
                anyList());
        verify(mobilePushDispatchDedupService, never()).tryClaim(anyString(), anyString(), anyString(), anyString());
        verify(restTemplate, never()).postForObject(anyString(), any(), eq(String.class));
    }

    @Test
    @DisplayName("dispatchMoodJournalShared: D-4 화이트리스트 미포함 — Expo·dedup·token 호출 0")
    void dispatchMoodJournalShared_filteredByAllowlist() {
        // D-4: MOOD_JOURNAL_SHARED는 푸시 허용 set 밖이므로 dispatchFanout이 진입부에서 차단.
        mobilePushDispatchService.dispatchMoodJournalShared(
                "tenant-a", 77L, 88L, "이내담", "2026-05-20", "🙂", "메모");

        verify(mobilePushTokenRepository, never()).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(anyString(),
                anyList());
        verify(mobilePushDispatchDedupService, never()).tryClaim(anyString(), anyString(), anyString(), anyString());
        verify(restTemplate, never()).postForObject(anyString(), any(), eq(String.class));
    }

    // ===================== D-2/D-3 actor 가드 단위 검증 =====================

    @Test
    @DisplayName("D-2: dispatchBookingRescheduled — actorUserId가 내담자와 동일하면 내담자 수신 skip, 상담사만 fanout")
    void dispatchBookingRescheduled_whenActorIsClient_skipsClientRecipient() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setScheduleEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(88L)))
                .thenReturn(Optional.of(settings));

        User consultant = new User();
        User client = new User();
        when(userRepository.findByTenantIdAndId(eq("tenant-a"), eq(88L))).thenReturn(Optional.of(consultant));
        when(userRepository.findByTenantIdAndId(eq("tenant-a"), eq(77L))).thenReturn(Optional.of(client));
        when(scheduleListUserFieldsResolver.resolveDisplayNameForScheduleList(consultant)).thenReturn("박상담");
        when(scheduleListUserFieldsResolver.resolveDisplayNameForScheduleList(client)).thenReturn("이내담");

        MobilePushToken consultantToken = new MobilePushToken();
        consultantToken.setPushToken("ExponentPushToken[consultant]");
        consultantToken.setUserId(88L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(88L)))).thenReturn(List.of(consultantToken));

        when(mobilePushDispatchDedupService.tryClaim(
                eq("tenant-a"), eq(MobilePushCanonicalTypes.BOOKING_RESCHEDULED), eq("50"), anyString()))
                .thenReturn(true);
        when(restTemplate.postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\"}]}");

        Schedule schedule = new Schedule();
        schedule.setId(50L);
        schedule.setTenantId("tenant-a");
        schedule.setClientId(77L);
        schedule.setConsultantId(88L);
        schedule.setDate(LocalDate.of(2026, 5, 21));
        schedule.setStartTime(LocalTime.of(14, 0));
        schedule.setEndTime(LocalTime.of(15, 0));

        // actor = 내담자(77L) → 내담자 수신 skip, 상담사만 1회 fanout
        mobilePushDispatchService.dispatchBookingRescheduled(
                "tenant-a",
                schedule,
                LocalDate.of(2026, 5, 20),
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                77L);

        verify(mobilePushDispatchDedupService, times(1)).tryClaim(
                eq("tenant-a"), eq(MobilePushCanonicalTypes.BOOKING_RESCHEDULED), eq("50"), anyString());
        verify(restTemplate, times(1)).postForObject(eq("https://exp.test/--/api/v2/push/send"), any(),
                eq(String.class));
        verify(mobilePushTokenRepository, never()).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(77L)));
    }

    @Test
    @DisplayName("D-3: dispatchBookingCancelled — actorUserId가 상담사와 동일하면 상담사 수신 skip — BOOKING_CANCELLED는 화이트리스트 밖이므로 전체 차단")
    void dispatchBookingCancelled_whenActorIsConsultant_skipsConsultantRecipient() {
        // BOOKING_CANCELLED는 D-4 화이트리스트 밖이라 어느 수신자에도 Expo POST가 가지 않는 것이 정상이다.
        // 본 테스트는 actor가드가 dispatchFanout 호출 이전(상단)에서 동작하고, 화이트리스트가 그 뒤(dispatchFanout 진입부)에서
        // 동작함을 행위 차원에서 보장한다.
        Schedule schedule = new Schedule();
        schedule.setId(50L);
        schedule.setTenantId("tenant-a");
        schedule.setClientId(77L);
        schedule.setConsultantId(88L);
        schedule.setDate(LocalDate.of(2026, 5, 21));
        schedule.setStartTime(LocalTime.of(14, 0));
        schedule.setEndTime(LocalTime.of(15, 0));

        // actor = 상담사(88L)
        mobilePushDispatchService.dispatchBookingCancelled("tenant-a", schedule, 88L);

        verify(mobilePushTokenRepository, never()).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(anyString(),
                anyList());
        verify(mobilePushDispatchDedupService, never()).tryClaim(anyString(), anyString(), anyString(), anyString());
        verify(restTemplate, never()).postForObject(anyString(), any(), eq(String.class));
    }

    @Test
    @DisplayName("D-2: dispatchBookingConfirmed — actor=내담자면 내담자 수신 skip, 상담사만 fanout (Task 3 후속 상담)")
    void dispatchBookingConfirmed_whenActorIsClient_skipsClientOnlyConsultantFanout() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");

        // 후속 상담(count=5) — Task 4 첫상담 guard 미적용.
        when(scheduleRepository.countByClientId(eq("tenant-a"), eq(77L))).thenReturn(5L);

        MobilePushSettings settings = new MobilePushSettings();
        settings.setScheduleEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(88L)))
                .thenReturn(Optional.of(settings));

        User consultant = new User();
        when(userRepository.findByTenantIdAndId(eq("tenant-a"), eq(88L))).thenReturn(Optional.of(consultant));
        when(scheduleListUserFieldsResolver.resolveDisplayNameForScheduleList(consultant)).thenReturn("박상담");

        MobilePushToken consultantToken = new MobilePushToken();
        consultantToken.setPushToken("ExponentPushToken[consultant-actor-client]");
        consultantToken.setUserId(88L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(88L)))).thenReturn(List.of(consultantToken));

        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"), eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED),
                eq("50"), eq("confirmed|consultant"))).thenReturn(true);
        when(restTemplate.postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\"}]}");

        Schedule schedule = new Schedule();
        schedule.setId(50L);
        schedule.setTenantId("tenant-a");
        schedule.setClientId(77L);
        schedule.setConsultantId(88L);

        // actor = 내담자(77L) — 내담자 본인이 만든 변경 이벤트이므로 본인에게 푸시 skip, 상담사만 발화.
        mobilePushDispatchService.dispatchBookingConfirmed("tenant-a", schedule, 77L);

        // 내담자 측은 token 조회·dedupe·Expo POST 모두 0회.
        verify(mobilePushTokenRepository, never()).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(77L)));
        verify(mobilePushDispatchDedupService, never()).tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED), eq("50"), eq("confirmed"));
        // 상담사 측은 정상 fanout.
        verify(mobilePushDispatchDedupService, times(1)).tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED), eq("50"), eq("confirmed|consultant"));
        verify(restTemplate, times(1)).postForObject(eq("https://exp.test/--/api/v2/push/send"), any(),
                eq(String.class));
    }

    // ===================== Task 3·4 BOOKING_CONFIRMED 분기 단위 검증 =====================

    @Test
    @DisplayName("Task 4 — 첫 상담(count=1): 내담자 단독 fanout (상담사 token/dedupe 0)")
    void dispatchBookingConfirmed_firstBooking_clientOnly() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");

        // 첫 상담 가드 — 스케줄 저장 직후이므로 클라이언트 누적 카운트가 정확히 1.
        when(scheduleRepository.countByClientId(eq("tenant-a"), eq(77L))).thenReturn(1L);

        MobilePushSettings settings = new MobilePushSettings();
        settings.setScheduleEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(Optional.of(settings));

        MobilePushToken clientToken = new MobilePushToken();
        clientToken.setPushToken("ExponentPushToken[first-booking-client]");
        clientToken.setUserId(77L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(77L)))).thenReturn(List.of(clientToken));

        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED), eq("50"), eq("confirmed"))).thenReturn(true);
        when(restTemplate.postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\"}]}");

        Schedule schedule = new Schedule();
        schedule.setId(50L);
        schedule.setTenantId("tenant-a");
        schedule.setClientId(77L);
        schedule.setConsultantId(88L);

        mobilePushDispatchService.dispatchBookingConfirmed("tenant-a", schedule, null);

        // 내담자 fanout 1회.
        verify(mobilePushDispatchDedupService, times(1)).tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED), eq("50"), eq("confirmed"));
        verify(restTemplate, times(1)).postForObject(eq("https://exp.test/--/api/v2/push/send"), any(),
                eq(String.class));
        // 상담사 skip — token 조회·dedupe 모두 0.
        verify(mobilePushTokenRepository, never()).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(88L)));
        verify(mobilePushDispatchDedupService, never()).tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED), eq("50"), eq("confirmed|consultant"));
    }

    @Test
    @DisplayName("Task 3 — 후속 상담(count>1): 내담자·상담사 양쪽 fanout, 분리된 dedupe bucket(confirmed / confirmed|consultant)")
    void dispatchBookingConfirmed_subsequentBooking_clientAndConsultantFanout() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");

        // 후속 상담 — 카운트 2 이상.
        when(scheduleRepository.countByClientId(eq("tenant-a"), eq(77L))).thenReturn(3L);

        MobilePushSettings settings = new MobilePushSettings();
        settings.setScheduleEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(Optional.of(settings));
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(88L)))
                .thenReturn(Optional.of(settings));

        User consultant = new User();
        when(userRepository.findByTenantIdAndId(eq("tenant-a"), eq(88L))).thenReturn(Optional.of(consultant));
        when(scheduleListUserFieldsResolver.resolveDisplayNameForScheduleList(consultant)).thenReturn("박상담");

        MobilePushToken clientToken = new MobilePushToken();
        clientToken.setPushToken("ExponentPushToken[subseq-client]");
        clientToken.setUserId(77L);
        MobilePushToken consultantToken = new MobilePushToken();
        consultantToken.setPushToken("ExponentPushToken[subseq-consultant]");
        consultantToken.setUserId(88L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(77L)))).thenReturn(List.of(clientToken));
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(88L)))).thenReturn(List.of(consultantToken));

        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED), eq("50"), eq("confirmed"))).thenReturn(true);
        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED), eq("50"), eq("confirmed|consultant"))).thenReturn(true);
        when(restTemplate.postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\"}]}");

        Schedule schedule = new Schedule();
        schedule.setId(50L);
        schedule.setTenantId("tenant-a");
        schedule.setClientId(77L);
        schedule.setConsultantId(88L);

        mobilePushDispatchService.dispatchBookingConfirmed("tenant-a", schedule, null);

        // 분리된 dedupe bucket — 멱등 충돌 없이 양쪽 모두 발화.
        verify(mobilePushDispatchDedupService, times(1)).tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED), eq("50"), eq("confirmed"));
        verify(mobilePushDispatchDedupService, times(1)).tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED), eq("50"), eq("confirmed|consultant"));
        verify(restTemplate, times(2)).postForObject(eq("https://exp.test/--/api/v2/push/send"), any(),
                eq(String.class));
    }

    @Test
    @DisplayName("Task 5 — dispatchBookingReminder: BOOKING_REMINDER allowlist 통과 + 내담자·상담사 양쪽 fanout (D-2 슬롯 dedupe)")
    void dispatchBookingReminder_d2_clientAndConsultantFanout() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setScheduleEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(Optional.of(settings));
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(88L)))
                .thenReturn(Optional.of(settings));

        MobilePushToken clientToken = new MobilePushToken();
        clientToken.setPushToken("ExponentPushToken[d2-client]");
        clientToken.setUserId(77L);
        MobilePushToken consultantToken = new MobilePushToken();
        consultantToken.setPushToken("ExponentPushToken[d2-consultant]");
        consultantToken.setUserId(88L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                anyList())).thenReturn(List.of(clientToken, consultantToken));

        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.BOOKING_REMINDER), eq("60"), anyString())).thenReturn(true);
        when(restTemplate.postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\"}]}");

        Schedule schedule = new Schedule();
        schedule.setId(60L);
        schedule.setTenantId("tenant-a");
        schedule.setClientId(77L);
        schedule.setConsultantId(88L);
        schedule.setDate(LocalDate.of(2026, 5, 25));
        schedule.setStartTime(LocalTime.of(14, 0));
        schedule.setEndTime(LocalTime.of(15, 0));

        mobilePushDispatchService.dispatchBookingReminder("tenant-a", schedule, "내일 상담 예약이 있습니다.", "D2");

        // D-2 슬롯 dedupe 1회(양쪽 user 묶음) + Expo POST 1회.
        verify(mobilePushDispatchDedupService, times(1)).tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.BOOKING_REMINDER), eq("60"), anyString());
        verify(restTemplate, times(1)).postForObject(eq("https://exp.test/--/api/v2/push/send"), any(),
                eq(String.class));
    }

    // ===================== D-4 화이트리스트 단위 검증 =====================

    @Test
    @DisplayName("D-4 positive: dispatchBookingConfirmed(allowlist)는 actor 미식별 시 정상 fanout")
    void dispatchFanout_whenEventInAllowlist_dispatchesNormally() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setScheduleEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(Optional.of(settings));

        MobilePushToken token = new MobilePushToken();
        token.setPushToken("ExponentPushToken[allowlist-positive]");
        token.setUserId(77L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(77L)))).thenReturn(List.of(token));

        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED), eq("50"), eq("confirmed"))).thenReturn(true);
        when(restTemplate.postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\"}]}");

        Schedule schedule = new Schedule();
        schedule.setId(50L);
        schedule.setTenantId("tenant-a");
        schedule.setClientId(77L);

        mobilePushDispatchService.dispatchBookingConfirmed("tenant-a", schedule, null);

        verify(restTemplate, times(1)).postForObject(eq("https://exp.test/--/api/v2/push/send"), any(),
                eq(String.class));
    }

    @Test
    @DisplayName("D-4 negative: dispatchPaymentFailed(non-allowlist)는 dispatchFanout 진입부에서 전체 skip")
    void dispatchFanout_whenEventNotInAllowlist_skipsAllRecipients() {
        // PAYMENT_FAILED는 D-4 화이트리스트 밖. token 조회·dedupe·Expo POST 0.
        Payment payment = new Payment();
        payment.setTenantId("tenant-a");
        payment.setPayerId(77L);
        payment.setPaymentId("pay-fail-" + UUID.randomUUID());

        mobilePushDispatchService.dispatchPaymentFailed("tenant-a", payment);

        verify(mobilePushTokenRepository, never()).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(anyString(),
                anyList());
        verify(mobilePushDispatchDedupService, never()).tryClaim(anyString(), anyString(), anyString(), anyString());
        verify(restTemplate, never()).postForObject(anyString(), any(), eq(String.class));
    }

    // ===================== Task 3 + 4: BOOKING_CONFIRMED 양쪽 발화 + 첫상담 분기 =====================

    @Test
    @DisplayName("Task 4 — 첫 상담(countByClientId=1): 내담자만 fanout, 상담사 skip")
    void dispatchBookingConfirmed_whenFirstBooking_skipsConsultant() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");
        when(scheduleRepository.countByClientId(eq("tenant-a"), eq(77L))).thenReturn(1L);

        MobilePushSettings settings = new MobilePushSettings();
        settings.setScheduleEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(Optional.of(settings));

        User consultant = new User();
        when(userRepository.findByTenantIdAndId(eq("tenant-a"), eq(88L))).thenReturn(Optional.of(consultant));
        when(scheduleListUserFieldsResolver.resolveDisplayNameForScheduleList(consultant)).thenReturn("박상담");

        MobilePushToken clientToken = new MobilePushToken();
        clientToken.setPushToken("ExponentPushToken[first-booking-client]");
        clientToken.setUserId(77L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(77L)))).thenReturn(List.of(clientToken));

        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"), eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED),
                eq("50"), eq("confirmed"))).thenReturn(true);
        when(restTemplate.postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\"}]}");

        Schedule schedule = new Schedule();
        schedule.setId(50L);
        schedule.setTenantId("tenant-a");
        schedule.setClientId(77L);
        schedule.setConsultantId(88L);
        schedule.setDate(LocalDate.of(2026, 6, 1));
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));

        mobilePushDispatchService.dispatchBookingConfirmed("tenant-a", schedule, null);

        // 내담자 측만 fanout.
        verify(mobilePushTokenRepository, times(1)).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq("tenant-a"), eq(List.of(77L)));
        verify(mobilePushTokenRepository, never()).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq("tenant-a"), eq(List.of(88L)));
        verify(mobilePushDispatchDedupService, never()).tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED), eq("50"), eq("confirmed|consultant"));
        verify(restTemplate, times(1)).postForObject(eq("https://exp.test/--/api/v2/push/send"), any(),
                eq(String.class));
    }

    @Test
    @DisplayName("Task 3 — 후속 상담(countByClientId=2): 내담자·상담사 양쪽 fanout (dedupe 버킷 분리)")
    void dispatchBookingConfirmed_whenSubsequentBooking_dispatchesBoth() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");
        when(scheduleRepository.countByClientId(eq("tenant-a"), eq(77L))).thenReturn(2L);

        MobilePushSettings settings = new MobilePushSettings();
        settings.setScheduleEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(Optional.of(settings));
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(88L)))
                .thenReturn(Optional.of(settings));

        User consultant = new User();
        when(userRepository.findByTenantIdAndId(eq("tenant-a"), eq(88L))).thenReturn(Optional.of(consultant));
        when(scheduleListUserFieldsResolver.resolveDisplayNameForScheduleList(consultant)).thenReturn("박상담");

        MobilePushToken clientToken = new MobilePushToken();
        clientToken.setPushToken("ExponentPushToken[subseq-client]");
        clientToken.setUserId(77L);
        MobilePushToken consultantToken = new MobilePushToken();
        consultantToken.setPushToken("ExponentPushToken[subseq-consultant]");
        consultantToken.setUserId(88L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(77L)))).thenReturn(List.of(clientToken));
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(88L)))).thenReturn(List.of(consultantToken));

        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"), eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED),
                eq("50"), eq("confirmed"))).thenReturn(true);
        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"), eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED),
                eq("50"), eq("confirmed|consultant"))).thenReturn(true);
        when(restTemplate.postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\"}]}");

        Schedule schedule = new Schedule();
        schedule.setId(50L);
        schedule.setTenantId("tenant-a");
        schedule.setClientId(77L);
        schedule.setConsultantId(88L);
        schedule.setDate(LocalDate.of(2026, 6, 1));
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));

        mobilePushDispatchService.dispatchBookingConfirmed("tenant-a", schedule, null);

        // 내담자·상담사 dedupe 버킷이 분리되어 양쪽 모두 fanout.
        verify(mobilePushDispatchDedupService, times(1)).tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED), eq("50"), eq("confirmed"));
        verify(mobilePushDispatchDedupService, times(1)).tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.BOOKING_CONFIRMED), eq("50"), eq("confirmed|consultant"));
        verify(restTemplate, times(2)).postForObject(eq("https://exp.test/--/api/v2/push/send"), any(),
                eq(String.class));
    }

    // ===================== Task 5: BOOKING_REMINDER 화이트리스트 추가 =====================

    @Test
    @DisplayName("Task 5 — D-2 BOOKING_REMINDER 화이트리스트 통과 + 내담자·상담사 양쪽 fanout")
    void dispatchBookingReminder_whenAllowlisted_dispatchesBoth() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setScheduleEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(Optional.of(settings));
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(88L)))
                .thenReturn(Optional.of(settings));

        MobilePushToken clientToken = new MobilePushToken();
        clientToken.setPushToken("ExponentPushToken[reminder-client]");
        clientToken.setUserId(77L);
        MobilePushToken consultantToken = new MobilePushToken();
        consultantToken.setPushToken("ExponentPushToken[reminder-consultant]");
        consultantToken.setUserId(88L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(eq("tenant-a"),
                eq(List.of(77L, 88L)))).thenReturn(List.of(clientToken, consultantToken));

        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"), eq(MobilePushCanonicalTypes.BOOKING_REMINDER),
                eq("50"), anyString())).thenReturn(true);
        when(restTemplate.postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\"},{\"status\":\"ok\"}]}");

        Schedule schedule = new Schedule();
        schedule.setId(50L);
        schedule.setTenantId("tenant-a");
        schedule.setClientId(77L);
        schedule.setConsultantId(88L);
        schedule.setDate(LocalDate.of(2026, 6, 1));
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));

        mobilePushDispatchService.dispatchBookingReminder("tenant-a", schedule, "내일 상담 예약이 있습니다.", "D2");

        // 한번의 fanout 호출에 양쪽 사용자 ID 가 모두 들어간다(현 구현 — dispatchBookingReminder 는 단일 fanout).
        verify(mobilePushTokenRepository, times(1)).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq("tenant-a"), eq(List.of(77L, 88L)));
        verify(mobilePushDispatchDedupService, times(1)).tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.BOOKING_REMINDER), eq("50"), anyString());
        verify(restTemplate, times(1)).postForObject(eq("https://exp.test/--/api/v2/push/send"), any(),
                eq(String.class));
    }

    // ===================== 2026-05-25: dispatchAdminAnnouncement broadcast =====================

    @Test
    @DisplayName("dispatchAdminAnnouncement — 토큰 있고 SYSTEM 카테고리 ON + Expo ok → SENT 1행, ticket id 보존")
    void dispatchAdminAnnouncement_singleUser_returnsSent() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setSystemEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(77L)))
                .thenReturn(Optional.of(settings));

        MobilePushToken token = new MobilePushToken();
        token.setPushToken("ExponentPushToken[admin-broadcast]");
        token.setUserId(77L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq("tenant-a"), eq(List.of(77L)))).thenReturn(List.of(token));

        when(mobilePushDispatchDedupService.tryClaim(
                eq("tenant-a"), eq(MobilePushCanonicalTypes.ADMIN_ANNOUNCEMENT),
                eq("77"), eq("batch-bucket"))).thenReturn(true);

        when(restTemplate.postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\",\"id\":\"receipt-77\"}]}");

        List<MobilePushBroadcastResult> results = mobilePushDispatchService.dispatchAdminAnnouncement(
                "tenant-a", List.of(77L), "공지", "운영 점검 안내", "batch-bucket");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getStatus()).isEqualTo(MobilePushBroadcastResult.Status.SENT);
        assertThat(results.get(0).getUserId()).isEqualTo(77L);
        assertThat(results.get(0).getExpoReceiptId()).isEqualTo("receipt-77");
        assertThat(results.get(0).getErrorCode()).isNull();
    }

    @Test
    @DisplayName("dispatchAdminAnnouncement — 토큰 없는 사용자 → SKIPPED(PUSH_NO_TOKEN), Expo 호출 0")
    void dispatchAdminAnnouncement_noToken_returnsSkipped() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setSystemEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(78L)))
                .thenReturn(Optional.of(settings));

        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq("tenant-a"), eq(List.of(78L)))).thenReturn(List.of());

        List<MobilePushBroadcastResult> results = mobilePushDispatchService.dispatchAdminAnnouncement(
                "tenant-a", List.of(78L), "공지", "안내", "bucket-2");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getStatus()).isEqualTo(MobilePushBroadcastResult.Status.SKIPPED);
        assertThat(results.get(0).getErrorCode()).isEqualTo(MobilePushBroadcastResult.ERROR_CODE_NO_TOKEN);
        verify(mobilePushDispatchDedupService, never()).tryClaim(anyString(), anyString(), anyString(), anyString());
        verify(restTemplate, never()).postForObject(anyString(), any(), eq(String.class));
    }

    @Test
    @DisplayName("dispatchAdminAnnouncement — SYSTEM 카테고리 OFF 사용자 → SKIPPED(PUSH_OPTED_OUT)")
    void dispatchAdminAnnouncement_optedOut_returnsSkipped() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setSystemEnabled(false);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(79L)))
                .thenReturn(Optional.of(settings));

        List<MobilePushBroadcastResult> results = mobilePushDispatchService.dispatchAdminAnnouncement(
                "tenant-a", List.of(79L), "공지", "안내", "bucket-3");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getStatus()).isEqualTo(MobilePushBroadcastResult.Status.SKIPPED);
        assertThat(results.get(0).getErrorCode()).isEqualTo(MobilePushBroadcastResult.ERROR_CODE_OPTED_OUT);
        // SYSTEM OFF 사용자는 토큰 조회 자체 skip.
        verify(mobilePushTokenRepository, never()).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                anyString(), anyList());
        verify(restTemplate, never()).postForObject(anyString(), any(), eq(String.class));
    }

    @Test
    @DisplayName("dispatchAdminAnnouncement — 멱등 청구 실패 → SKIPPED(PUSH_DUPLICATE), Expo POST 0")
    void dispatchAdminAnnouncement_dedupConflict_returnsSkipped() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setSystemEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(80L)))
                .thenReturn(Optional.of(settings));

        MobilePushToken token = new MobilePushToken();
        token.setPushToken("ExponentPushToken[dup]");
        token.setUserId(80L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq("tenant-a"), eq(List.of(80L)))).thenReturn(List.of(token));

        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.ADMIN_ANNOUNCEMENT), eq("80"), eq("bucket-dup")))
                .thenReturn(false);

        List<MobilePushBroadcastResult> results = mobilePushDispatchService.dispatchAdminAnnouncement(
                "tenant-a", List.of(80L), "공지", "안내", "bucket-dup");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getStatus()).isEqualTo(MobilePushBroadcastResult.Status.SKIPPED);
        assertThat(results.get(0).getErrorCode()).isEqualTo(MobilePushBroadcastResult.ERROR_CODE_DUPLICATE);
        verify(restTemplate, never()).postForObject(anyString(), any(), eq(String.class));
    }

    @Test
    @DisplayName("dispatchAdminAnnouncement — Expo RestClientException → FAILED(PUSH_EXPO_FAILED), 예외 전파 없음")
    void dispatchAdminAnnouncement_expoHttpFail_returnsFailed() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");

        MobilePushSettings settings = new MobilePushSettings();
        settings.setSystemEnabled(true);
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(81L)))
                .thenReturn(Optional.of(settings));

        MobilePushToken token = new MobilePushToken();
        token.setPushToken("ExponentPushToken[fail]");
        token.setUserId(81L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq("tenant-a"), eq(List.of(81L)))).thenReturn(List.of(token));

        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.ADMIN_ANNOUNCEMENT), eq("81"), eq("bucket-fail")))
                .thenReturn(true);

        when(restTemplate.postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class)))
                .thenThrow(new RestClientException("expo-down"));

        List<MobilePushBroadcastResult> results = mobilePushDispatchService.dispatchAdminAnnouncement(
                "tenant-a", List.of(81L), "공지", "안내", "bucket-fail");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getStatus()).isEqualTo(MobilePushBroadcastResult.Status.FAILED);
        assertThat(results.get(0).getErrorCode()).isEqualTo(MobilePushBroadcastResult.ERROR_CODE_EXPO_FAILED);
    }

    @Test
    @DisplayName("dispatchAdminAnnouncement — 혼합 입력(SENT/SKIPPED/FAILED)이 입력 순서를 보존하여 행 단위 반환")
    void dispatchAdminAnnouncement_mixedRoster_preservesOrder() {
        when(expoPushProperties.getAccessToken()).thenReturn("expo-test-token");
        when(expoPushProperties.getApiUrl()).thenReturn("https://exp.test/--/api/v2/push/send");

        // 100 = SENT, 101 = SKIPPED(opt-out), 102 = SKIPPED(no token).
        MobilePushSettings on = new MobilePushSettings();
        on.setSystemEnabled(true);
        MobilePushSettings off = new MobilePushSettings();
        off.setSystemEnabled(false);

        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(100L)))
                .thenReturn(Optional.of(on));
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(101L)))
                .thenReturn(Optional.of(off));
        when(mobilePushSettingsRepository.findByTenantIdAndUserIdAndIsDeletedFalse(eq("tenant-a"), eq(102L)))
                .thenReturn(Optional.of(on));

        MobilePushToken token100 = new MobilePushToken();
        token100.setPushToken("ExponentPushToken[u100]");
        token100.setUserId(100L);
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq("tenant-a"), eq(List.of(100L)))).thenReturn(List.of(token100));
        when(mobilePushTokenRepository.findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                eq("tenant-a"), eq(List.of(102L)))).thenReturn(List.of());

        when(mobilePushDispatchDedupService.tryClaim(eq("tenant-a"),
                eq(MobilePushCanonicalTypes.ADMIN_ANNOUNCEMENT), eq("100"), eq("bucket-mix")))
                .thenReturn(true);
        when(restTemplate.postForObject(eq("https://exp.test/--/api/v2/push/send"), any(), eq(String.class)))
                .thenReturn("{\"data\":[{\"status\":\"ok\",\"id\":\"r-100\"}]}");

        List<MobilePushBroadcastResult> results = mobilePushDispatchService.dispatchAdminAnnouncement(
                "tenant-a", List.of(100L, 101L, 102L), "공지", "안내", "bucket-mix");

        assertThat(results).hasSize(3);
        assertThat(results.get(0).getUserId()).isEqualTo(100L);
        assertThat(results.get(0).getStatus()).isEqualTo(MobilePushBroadcastResult.Status.SENT);
        assertThat(results.get(1).getUserId()).isEqualTo(101L);
        assertThat(results.get(1).getStatus()).isEqualTo(MobilePushBroadcastResult.Status.SKIPPED);
        assertThat(results.get(1).getErrorCode()).isEqualTo(MobilePushBroadcastResult.ERROR_CODE_OPTED_OUT);
        assertThat(results.get(2).getUserId()).isEqualTo(102L);
        assertThat(results.get(2).getStatus()).isEqualTo(MobilePushBroadcastResult.Status.SKIPPED);
        assertThat(results.get(2).getErrorCode()).isEqualTo(MobilePushBroadcastResult.ERROR_CODE_NO_TOKEN);
    }

    @Test
    @DisplayName("dispatchAdminAnnouncement — Expo access token 미설정 시 모든 행 FAILED + Expo POST 0")
    void dispatchAdminAnnouncement_whenAccessTokenMissing_allFailed() {
        when(expoPushProperties.getAccessToken()).thenReturn("");

        List<MobilePushBroadcastResult> results = mobilePushDispatchService.dispatchAdminAnnouncement(
                "tenant-a", List.of(200L, 201L), "공지", "안내", "bucket-na");

        assertThat(results).hasSize(2);
        assertThat(results.get(0).getStatus()).isEqualTo(MobilePushBroadcastResult.Status.FAILED);
        assertThat(results.get(0).getErrorCode()).isEqualTo(MobilePushBroadcastResult.ERROR_CODE_EXPO_FAILED);
        assertThat(results.get(1).getStatus()).isEqualTo(MobilePushBroadcastResult.Status.FAILED);
        verify(mobilePushTokenRepository, never()).findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(
                anyString(), anyList());
        verify(restTemplate, never()).postForObject(anyString(), any(), eq(String.class));
    }
}
