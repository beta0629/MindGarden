package com.coresolution.consultation.service.impl;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import com.coresolution.consultation.config.BatchNotificationProperties;
import com.coresolution.consultation.config.ExpoPushProperties;
import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.constant.PushMonitoringErrorCodes;
import com.coresolution.consultation.dto.PushMonitoringChannelBreakdown;
import com.coresolution.consultation.dto.PushMonitoringChannelFilter;
import com.coresolution.consultation.dto.PushMonitoringFailureItem;
import com.coresolution.consultation.dto.PushMonitoringKpiSummary;
import com.coresolution.consultation.dto.PushMonitoringRange;
import com.coresolution.consultation.dto.PushMonitoringResendResponse;
import com.coresolution.consultation.dto.PushMonitoringSnapshotResponse;
import com.coresolution.consultation.dto.PushMonitoringTenantSnapshot;
import com.coresolution.consultation.dto.SmsLogItem;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.dto.TestNotificationRecipientMode;
import com.coresolution.consultation.entity.AdminTestNotificationLog;
import com.coresolution.consultation.entity.NotificationBatchSendLog;
import com.coresolution.consultation.entity.TenantKakaoAlimtalkSettings;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.AdminTestNotificationLogRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.NotificationBatchSendLogRepository;
import com.coresolution.consultation.repository.TenantKakaoAlimtalkSettingsRepository;
import com.coresolution.consultation.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.ArgumentCaptor;

/**
 * {@link AdminPushMonitoringServiceImpl} 단위 테스트.
 *
 * <p>BW-1 「푸시 설정 모니터링」 KPI 4분류 / 채널 분포 / 추이 / 스냅샷 / 실패 사례 / 재발송
 * 가드를 검증한다. 의존성은 모두 Mockito mock — 실 DB 의존성 없이 분류 로직 SSOT 만 검증.
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminPushMonitoringServiceImpl 단위 테스트")
class AdminPushMonitoringServiceImplTest {

    private static final String TENANT_ID = "tenant-bw1";

    @Mock
    private NotificationBatchSendLogRepository batchLogRepository;
    @Mock
    private AdminTestNotificationLogRepository adminTestLogRepository;
    @Mock
    private TenantKakaoAlimtalkSettingsRepository alimtalkSettingsRepository;
    @Mock
    private CommonCodeRepository commonCodeRepository;
    @Mock
    private AdminTestNotificationRateLimiter rateLimiter;
    @Mock
    private UserRepository userRepository;

    private BatchNotificationProperties batchNotificationProperties;
    private ExpoPushProperties expoPushProperties;

    @InjectMocks
    private AdminPushMonitoringServiceImpl service;

    @BeforeEach
    void setUp() {
        batchNotificationProperties = new BatchNotificationProperties();
        expoPushProperties = new ExpoPushProperties();
        ReflectionTestUtils.setField(service, "batchNotificationProperties", batchNotificationProperties);
        ReflectionTestUtils.setField(service, "expoPushProperties", expoPushProperties);
        ReflectionTestUtils.setField(service, "kakaoAlimtalkEnabledGlobal", true);
        ReflectionTestUtils.setField(service, "notificationEnabledGlobal", true);

        lenient().when(alimtalkSettingsRepository.findByTenantIdAndIsDeletedFalse(anyString()))
            .thenReturn(java.util.Optional.empty());
        lenient().when(commonCodeRepository
            .findByTenantIdAndCodeGroupAndIsActiveTrueOrderBySortOrderAsc(anyString(), anyString()))
            .thenReturn(Collections.emptyList());
        lenient().when(batchLogRepository.countWindowByTenant(anyString(), any(), any()))
            .thenReturn(0L);
        lenient().when(batchLogRepository.countPendingByTenantId(anyString())).thenReturn(0L);
        lenient().when(batchLogRepository.findWindowByTenantAndChannel(
            anyString(), any(), any(), any())).thenReturn(Collections.emptyList());
        lenient().when(adminTestLogRepository.findWindowByTenantAndChannel(
            anyString(), any(), any(), any())).thenReturn(Collections.emptyList());
    }

    @Test
    @DisplayName("KPI — 외부 실패 / 검증 skip / 정책 skip / 성공 분류 정확도")
    void kpiCategorizesAllFourBuckets() {
        LocalDateTime now = LocalDateTime.now();
        List<NotificationBatchSendLog> batchRows = Arrays.asList(
            batch(now, true, null, "ALIMTALK"),
            batch(now, false, BatchNotificationTemplateCodes.ERROR_CODE_SEND_FAILED, "SMS"),
            batch(now, false, BatchNotificationTemplateCodes.ERROR_CODE_RECIPIENT_PHONE_MISSING, "ALIMTALK"),
            batch(now, false, BatchNotificationTemplateCodes.ERROR_CODE_TEMPLATE_NOT_MAPPED, "ALIMTALK"),
            batch(now, false, "PARSE_ERROR", "SMS"),
            batch(now, false, BatchNotificationTemplateCodes.ERROR_CODE_MARKETING_NO_FALLBACK, "ALIMTALK")
        );
        when(batchLogRepository.findWindowByTenantAndChannel(eq(TENANT_ID), any(), any(), any()))
            .thenReturn(batchRows);
        when(batchLogRepository.countWindowByTenant(eq(TENANT_ID), any(), any())).thenReturn(2L);
        when(batchLogRepository.countPendingByTenantId(TENANT_ID)).thenReturn(3L);

        PushMonitoringSnapshotResponse response = service.loadSnapshot(
            TENANT_ID, PushMonitoringRange.D7, PushMonitoringChannelFilter.ALL, 20);

        PushMonitoringKpiSummary kpi = response.getKpi();
        assertThat(kpi.getRecentFiveMinuteCount()).isEqualTo(2L);
        assertThat(kpi.getPendingCount()).isEqualTo(3L);
        assertThat(kpi.getSuccessCount()).isEqualTo(1L);
        assertThat(kpi.getExternalFailureCount()).isEqualTo(2L);
        assertThat(kpi.getValidationSkipCount()).isEqualTo(1L);
        assertThat(kpi.getPolicySkipCount()).isEqualTo(2L);
        assertThat(kpi.getSkipTotalCount()).isEqualTo(3L);
        assertThat(kpi.getFailureRate()).isCloseTo(2.0d / 3.0d, within(0.0005d));
    }

    @Test
    @DisplayName("PUSH 채널 필터 — batch 조회는 skip 되고 admin-test PUSH 만 모집단으로 산정")
    void pushChannelFilterSkipsBatchQuery() {
        LocalDateTime now = LocalDateTime.now();
        when(adminTestLogRepository.findWindowByTenantAndChannel(eq(TENANT_ID), any(), any(),
            eq(TestNotificationChannel.PUSH)))
            .thenReturn(List.of(adminTest(now, true, null, TestNotificationChannel.PUSH)));

        PushMonitoringSnapshotResponse response = service.loadSnapshot(
            TENANT_ID, PushMonitoringRange.H24, PushMonitoringChannelFilter.PUSH, 20);

        verify(batchLogRepository, never()).findWindowByTenantAndChannel(
            anyString(), any(), any(), any());
        assertThat(response.getKpi().getSuccessCount()).isEqualTo(1L);
        PushMonitoringChannelBreakdown push = response.getChannelBreakdown().stream()
            .filter(c -> "PUSH".equals(c.getChannel())).findFirst().orElseThrow();
        assertThat(push.getSuccessCount()).isEqualTo(1L);
    }

    @Test
    @DisplayName("스냅샷 — TenantKakaoAlimtalkSettings 미존재 + 운영 토글 OFF 시 모두 false 응답")
    void tenantSnapshotDefaultsWhenSettingsMissing() {
        ReflectionTestUtils.setField(service, "kakaoAlimtalkEnabledGlobal", false);
        batchNotificationProperties.setAlimtalkEnabled(false);
        ReflectionTestUtils.setField(service, "notificationEnabledGlobal", false);
        expoPushProperties.setAccessToken("");

        PushMonitoringSnapshotResponse response = service.loadSnapshot(
            TENANT_ID, PushMonitoringRange.D7, PushMonitoringChannelFilter.ALL, 20);

        PushMonitoringTenantSnapshot snapshot = response.getTenantSnapshot();
        assertThat(snapshot.isAlimtalkEnabled()).isFalse();
        assertThat(snapshot.isKakaoApiKeyRegistered()).isFalse();
        assertThat(snapshot.isExpoPushAccessTokenRegistered()).isFalse();
        assertThat(snapshot.getOperationalToggle().isAlimtalk()).isFalse();
        assertThat(snapshot.getOperationalToggle().isSms()).isFalse();
        assertThat(snapshot.getOperationalToggle().isPush()).isFalse();
    }

    @Test
    @DisplayName("스냅샷 — 알림톡 설정·Expo 토큰 등록 시 운영 토글 ON")
    void tenantSnapshotReflectsActiveSettings() {
        TenantKakaoAlimtalkSettings settings = new TenantKakaoAlimtalkSettings();
        settings.setAlimtalkEnabled(true);
        settings.setKakaoApiKeyRef("key-ref");
        settings.setKakaoSenderKeyRef("sender-ref");
        settings.setTemplateConsultationConfirmed("T1");
        settings.setTemplateConsultationReminder("T2");
        settings.setTemplateConsultationCancelled("T3");
        when(alimtalkSettingsRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
            .thenReturn(java.util.Optional.of(settings));
        expoPushProperties.setAccessToken("expo-access");
        batchNotificationProperties.setAlimtalkEnabled(true);

        PushMonitoringSnapshotResponse response = service.loadSnapshot(
            TENANT_ID, PushMonitoringRange.D7, PushMonitoringChannelFilter.ALL, 20);

        PushMonitoringTenantSnapshot snap = response.getTenantSnapshot();
        assertThat(snap.isAlimtalkEnabled()).isTrue();
        assertThat(snap.isKakaoApiKeyRegistered()).isTrue();
        assertThat(snap.isKakaoSenderKeyRegistered()).isTrue();
        assertThat(snap.getTemplateMapping().getFilled()).isEqualTo(3);
        assertThat(snap.getTemplateMapping().getTotal())
            .isEqualTo(AdminPushMonitoringServiceImpl.TEMPLATE_MAPPING_TOTAL_SLOTS);
        assertThat(snap.isExpoPushAccessTokenRegistered()).isTrue();
        assertThat(snap.getOperationalToggle().isAlimtalk()).isTrue();
        assertThat(snap.getOperationalToggle().isPush()).isTrue();
    }

    @Test
    @DisplayName("실패 사례 — BATCH source 는 retryable=false 고정, ADMIN_TEST 외부실패만 retryable=true")
    void failureRetryableMatrix() {
        LocalDateTime now = LocalDateTime.now();
        when(batchLogRepository.findWindowByTenantAndChannel(eq(TENANT_ID), any(), any(), any()))
            .thenReturn(List.of(batch(now, false,
                BatchNotificationTemplateCodes.ERROR_CODE_SEND_FAILED, "SMS")));
        when(adminTestLogRepository.findWindowByTenantAndChannel(eq(TENANT_ID), any(), any(), any()))
            .thenReturn(List.of(
                adminTest(now, false, BatchNotificationTemplateCodes.ERROR_CODE_SEND_FAILED,
                    TestNotificationChannel.SMS),
                adminTest(now, false, BatchNotificationTemplateCodes.ERROR_CODE_RECIPIENT_PHONE_MISSING,
                    TestNotificationChannel.ALIMTALK)
            ));

        PushMonitoringSnapshotResponse response = service.loadSnapshot(
            TENANT_ID, PushMonitoringRange.D7, PushMonitoringChannelFilter.ALL, 20);

        List<PushMonitoringFailureItem> failures = response.getFailures();
        assertThat(failures).hasSize(3);
        PushMonitoringFailureItem batch = failures.stream()
            .filter(f -> "BATCH".equals(f.getSource())).findFirst().orElseThrow();
        assertThat(batch.isRetryable()).isFalse();
        assertThat(batch.getErrorCategory())
            .isEqualTo(PushMonitoringErrorCodes.CATEGORY_EXTERNAL_FAILURE);
        PushMonitoringFailureItem retryable = failures.stream()
            .filter(f -> "ADMIN_TEST".equals(f.getSource())
                && PushMonitoringErrorCodes.CATEGORY_EXTERNAL_FAILURE
                    .equals(f.getErrorCategory()))
            .findFirst().orElseThrow();
        assertThat(retryable.isRetryable()).isTrue();
        PushMonitoringFailureItem skip = failures.stream()
            .filter(f -> "ADMIN_TEST".equals(f.getSource())
                && PushMonitoringErrorCodes.CATEGORY_VALIDATION_SKIP
                    .equals(f.getErrorCategory()))
            .findFirst().orElseThrow();
        assertThat(skip.isRetryable()).isFalse();
    }

    @Test
    @DisplayName("재발송 — BATCH source 는 후속 PR 안내로 차단")
    void resendBatchSourceBlocked() {
        PushMonitoringResendResponse response = service.resendFailure(
            TENANT_ID, dummyUser(), 1L, "BATCH", null);
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getErrorCode())
            .isEqualTo(AdminPushMonitoringServiceImpl.ERROR_CODE_BATCH_RESEND_NOT_SUPPORTED);
        verify(rateLimiter, never()).tryAcquire(anyString(), anyLong());
    }

    @Test
    @DisplayName("재발송 — 잘못된 source 는 RESEND_SOURCE_INVALID")
    void resendInvalidSource() {
        PushMonitoringResendResponse response = service.resendFailure(
            TENANT_ID, dummyUser(), 1L, "BOGUS", null);
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getErrorCode())
            .isEqualTo(AdminPushMonitoringServiceImpl.ERROR_CODE_RESEND_SOURCE_INVALID);
    }

    @Test
    @DisplayName("재발송 — ADMIN_TEST + EXTERNAL_FAILURE + rate-limit 통과 시 성공")
    void resendAdminTestSuccess() {
        AdminTestNotificationLog row = adminTest(LocalDateTime.now(), false,
            BatchNotificationTemplateCodes.ERROR_CODE_SEND_FAILED, TestNotificationChannel.SMS);
        ReflectionTestUtils.setField(row, "id", 9001L);
        when(adminTestLogRepository.findByIdAndTenantId(9001L, TENANT_ID))
            .thenReturn(java.util.Optional.of(row));
        when(rateLimiter.tryAcquire(eq(TENANT_ID), anyLong()))
            .thenReturn(AdminTestNotificationRateLimiter.Decision.allowed(9, 99));

        PushMonitoringResendResponse response = service.resendFailure(
            TENANT_ID, dummyUser(), 9001L, "ADMIN_TEST", "수동 재시도");

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getResentLogId()).isEqualTo(9001L);
        verify(rateLimiter, times(1)).recordAttempt(eq(TENANT_ID), anyLong());
    }

    @Test
    @DisplayName("재발송 — ADMIN_TEST + 검증 skip 행은 RESEND_NOT_RETRYABLE")
    void resendNotRetryable() {
        AdminTestNotificationLog row = adminTest(LocalDateTime.now(), false,
            BatchNotificationTemplateCodes.ERROR_CODE_RECIPIENT_PHONE_MISSING,
            TestNotificationChannel.SMS);
        ReflectionTestUtils.setField(row, "id", 9002L);
        when(adminTestLogRepository.findByIdAndTenantId(9002L, TENANT_ID))
            .thenReturn(java.util.Optional.of(row));

        PushMonitoringResendResponse response = service.resendFailure(
            TENANT_ID, dummyUser(), 9002L, "ADMIN_TEST", null);
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getErrorCode())
            .isEqualTo(AdminPushMonitoringServiceImpl.ERROR_CODE_RESEND_NOT_RETRYABLE);
    }

    @Test
    @DisplayName("재발송 — rate-limit 초과 시 RESEND_RATE_LIMITED")
    void resendRateLimited() {
        AdminTestNotificationLog row = adminTest(LocalDateTime.now(), false,
            BatchNotificationTemplateCodes.ERROR_CODE_SEND_FAILED, TestNotificationChannel.SMS);
        ReflectionTestUtils.setField(row, "id", 9003L);
        when(adminTestLogRepository.findByIdAndTenantId(9003L, TENANT_ID))
            .thenReturn(java.util.Optional.of(row));
        when(rateLimiter.tryAcquire(eq(TENANT_ID), anyLong()))
            .thenReturn(AdminTestNotificationRateLimiter.Decision
                .exceeded("PER_MINUTE", 0, 50, 60L));

        PushMonitoringResendResponse response = service.resendFailure(
            TENANT_ID, dummyUser(), 9003L, "ADMIN_TEST", null);
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getErrorCode())
            .isEqualTo(AdminPushMonitoringServiceImpl.ERROR_CODE_RESEND_RATE_LIMITED);
        verify(rateLimiter, never()).recordAttempt(anyString(), anyLong());
    }

    @Test
    @DisplayName("일별 추이 — 윈도 범위의 모든 일자가 0 카운트로라도 list 에 포함된다")
    void trendIncludesAllWindowDays() {
        LocalDateTime now = LocalDateTime.now().withHour(12).withMinute(0).withSecond(0).withNano(0);
        when(batchLogRepository.findWindowByTenantAndChannel(eq(TENANT_ID), any(), any(), any()))
            .thenReturn(List.of(batch(now.minusDays(1L), true, null, "ALIMTALK")));

        PushMonitoringSnapshotResponse response = service.loadSnapshot(
            TENANT_ID, PushMonitoringRange.D7, PushMonitoringChannelFilter.ALL, 20);

        assertThat(response.getTrendPoints()).hasSizeGreaterThanOrEqualTo(7);
        long alimtalkSum = response.getTrendPoints().stream()
            .mapToLong(p -> p.getAlimtalkCount()).sum();
        assertThat(alimtalkSum).isEqualTo(1L);
    }

    @Test
    @DisplayName("RECENT_QUEUE_WINDOW 노출 — 5분 윈도")
    void recentQueueWindowExposes5Minutes() {
        assertThat(AdminPushMonitoringServiceImpl.getRecentQueueWindow())
            .isEqualTo(Duration.ofMinutes(5L));
    }

    @Test
    @DisplayName("loadRecentSmsLogs — 채널 IN(SMS, ALIMTALK) + createdAt DESC + limit 적용")
    void recentSmsLogsAppliesChannelAndSort() {
        NotificationBatchSendLog row = batch(LocalDateTime.now(), true, null, "SMS");
        ReflectionTestUtils.setField(row, "id", 4001L);
        ReflectionTestUtils.setField(row, "createdAt", LocalDateTime.now());
        when(batchLogRepository.findRecentByTenantAndChannels(eq(TENANT_ID), any(), any()))
            .thenReturn(List.of(row));
        when(userRepository.findAllById(any())).thenReturn(List.of());

        List<SmsLogItem> items = service.loadRecentSmsLogs(TENANT_ID, 20);

        ArgumentCaptor<java.util.Collection<String>> channels =
            ArgumentCaptor.forClass(java.util.Collection.class);
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(batchLogRepository).findRecentByTenantAndChannels(
            eq(TENANT_ID), channels.capture(), pageableCaptor.capture());
        assertThat(channels.getValue())
            .containsExactlyInAnyOrder(
                BatchNotificationTemplateCodes.CHANNEL_SMS,
                BatchNotificationTemplateCodes.CHANNEL_ALIMTALK);
        Pageable captured = pageableCaptor.getValue();
        assertThat(captured.getPageSize()).isEqualTo(20);
        Sort.Order order = captured.getSort().getOrderFor("createdAt");
        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.DESC);
        assertThat(items).hasSize(1);
        assertThat(items.get(0).getChannelUsed()).isEqualTo("SMS");
        assertThat(items.get(0).getRecipientPhone()).isEqualTo("010-***-1234");
    }

    @Test
    @DisplayName("loadRecentSmsLogs — limit 0/음수는 기본 20, 100 초과는 100 으로 clamp")
    void recentSmsLogsClampsLimit() {
        when(batchLogRepository.findRecentByTenantAndChannels(eq(TENANT_ID), any(), any()))
            .thenReturn(List.of());

        service.loadRecentSmsLogs(TENANT_ID, 0);
        service.loadRecentSmsLogs(TENANT_ID, -5);
        service.loadRecentSmsLogs(TENANT_ID, 999);
        service.loadRecentSmsLogs(TENANT_ID, 50);

        ArgumentCaptor<Pageable> pageables = ArgumentCaptor.forClass(Pageable.class);
        verify(batchLogRepository, times(4)).findRecentByTenantAndChannels(
            eq(TENANT_ID), any(), pageables.capture());
        List<Pageable> captured = pageables.getAllValues();
        assertThat(captured.get(0).getPageSize())
            .isEqualTo(AdminPushMonitoringServiceImpl.RECENT_SMS_LOGS_DEFAULT_LIMIT);
        assertThat(captured.get(1).getPageSize())
            .isEqualTo(AdminPushMonitoringServiceImpl.RECENT_SMS_LOGS_DEFAULT_LIMIT);
        assertThat(captured.get(2).getPageSize())
            .isEqualTo(AdminPushMonitoringServiceImpl.RECENT_SMS_LOGS_MAX_LIMIT);
        assertThat(captured.get(3).getPageSize()).isEqualTo(50);
    }

    @Test
    @DisplayName("loadRecentSmsLogs — recipientName 매핑(테넌트 격리: 다른 테넌트 사용자 무시)")
    void recentSmsLogsMapsRecipientNameWithTenantGuard() {
        NotificationBatchSendLog selfTenantRow = batch(LocalDateTime.now(), true, null, "SMS");
        ReflectionTestUtils.setField(selfTenantRow, "id", 4101L);
        ReflectionTestUtils.setField(selfTenantRow, "recipientUserId", 100L);
        NotificationBatchSendLog foreignRow = batch(LocalDateTime.now(), true, null, "ALIMTALK");
        ReflectionTestUtils.setField(foreignRow, "id", 4102L);
        ReflectionTestUtils.setField(foreignRow, "recipientUserId", 200L);
        when(batchLogRepository.findRecentByTenantAndChannels(eq(TENANT_ID), any(), any()))
            .thenReturn(List.of(selfTenantRow, foreignRow));
        User self = new User();
        ReflectionTestUtils.setField(self, "id", 100L);
        ReflectionTestUtils.setField(self, "tenantId", TENANT_ID);
        ReflectionTestUtils.setField(self, "name", "홍길동");
        User foreign = new User();
        ReflectionTestUtils.setField(foreign, "id", 200L);
        ReflectionTestUtils.setField(foreign, "tenantId", "other-tenant");
        ReflectionTestUtils.setField(foreign, "name", "타테넌트사용자");
        when(userRepository.findAllById(any())).thenReturn(List.of(self, foreign));

        List<SmsLogItem> items = service.loadRecentSmsLogs(TENANT_ID, 20);

        assertThat(items).hasSize(2);
        SmsLogItem selfItem = items.stream()
            .filter(i -> Long.valueOf(100L).equals(i.getRecipientUserId()))
            .findFirst().orElseThrow();
        SmsLogItem foreignItem = items.stream()
            .filter(i -> Long.valueOf(200L).equals(i.getRecipientUserId()))
            .findFirst().orElseThrow();
        assertThat(selfItem.getRecipientName()).isEqualTo("홍길동");
        assertThat(foreignItem.getRecipientName()).isNull();
    }

    @Test
    @DisplayName("loadRecentSmsLogs — 결과 0건이면 users 조회 skip + 빈 list")
    void recentSmsLogsEmptyShortCircuits() {
        when(batchLogRepository.findRecentByTenantAndChannels(eq(TENANT_ID), any(), any()))
            .thenReturn(List.of());

        List<SmsLogItem> items = service.loadRecentSmsLogs(TENANT_ID, 20);

        assertThat(items).isEmpty();
        verify(userRepository, never()).findAllById(any());
    }

    private NotificationBatchSendLog batch(LocalDateTime sentAt, boolean success,
            String errorCode, String channelUsed) {
        NotificationBatchSendLog row = NotificationBatchSendLog.builder()
            .templateCode("RESERVATION_REMINDER_D2")
            .targetType(BatchNotificationTemplateCodes.TARGET_TYPE_SCHEDULE)
            .targetId(1L)
            .recipientUserId(2L)
            .recipientPhoneMasked("010-***-1234")
            .channelUsed(channelUsed)
            .fallbackToSms(false)
            .success(success)
            .errorCode(errorCode)
            .errorMessage(success ? null : "발송 실패: " + errorCode)
            .sentAt(sentAt)
            .build();
        ReflectionTestUtils.setField(row, "tenantId", TENANT_ID);
        return row;
    }

    private AdminTestNotificationLog adminTest(LocalDateTime sentAt, boolean success,
            String errorCode, TestNotificationChannel channel) {
        AdminTestNotificationLog row = AdminTestNotificationLog.builder()
            .sentByUserId(7L)
            .sentByUsername("admin")
            .sentAt(sentAt)
            .recipientMode(TestNotificationRecipientMode.USER)
            .recipientUserId(8L)
            .recipientPhoneMasked("010-***-5678")
            .channel(channel)
            .templateCode(channel == TestNotificationChannel.ALIMTALK ? "ALIMTALK_T1" : null)
            .reason("재시도 테스트")
            .success(success)
            .errorCode(errorCode)
            .errorMessage(success ? null : "발송 실패: " + errorCode)
            .build();
        ReflectionTestUtils.setField(row, "tenantId", TENANT_ID);
        return row;
    }

    private User dummyUser() {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", 7L);
        return user;
    }
}
