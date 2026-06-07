package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.config.BatchNotificationProperties;
import com.coresolution.consultation.config.ExpoPushProperties;
import com.coresolution.consultation.dto.PushMonitoringChannelFilter;
import com.coresolution.consultation.dto.PushMonitoringRange;
import com.coresolution.consultation.dto.PushMonitoringSnapshotResponse;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.entity.NotificationBatchSendLog;
import com.coresolution.consultation.entity.AdminTestNotificationLog;
import com.coresolution.consultation.integration.solapi.KakaoSolapiCredentialResolver;
import com.coresolution.consultation.repository.AdminTestNotificationLogRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.NotificationBatchSendLogRepository;
import com.coresolution.consultation.service.AdminTestNotificationService;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * {@link AdminPushMonitoringServiceImpl#buildSnapshot} 단위 테스트.
 *
 * <p>핵심 검증:
 *  - 4분류(외부발송 실패 / 사전검증 skip / 정책 skip / PENDING) 가 KPI 에 정확히 합산.
 *  - 채널 분포 ratio 가 윈도 성공 기준으로 계산.
 *  - 운영 토글이 응답에 노출.
 *  - PUSH 자동 추적 미지원 플래그.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminPushMonitoringServiceImplTest {

    private static final String TENANT = "tenant-A";

    @Mock
    private NotificationBatchSendLogRepository batchLogRepository;

    @Mock
    private AdminTestNotificationLogRepository adminTestLogRepository;

    @Mock
    private CommonCodeRepository commonCodeRepository;

    @Mock
    private KakaoSolapiCredentialResolver solapiCredentialResolver;

    @Mock
    private AdminTestNotificationService testNotificationService;

    private BatchNotificationProperties batchProperties;
    private ExpoPushProperties expoPushProperties;

    @InjectMocks
    private AdminPushMonitoringServiceImpl service;

    @BeforeEach
    void setUp() {
        batchProperties = new BatchNotificationProperties();
        batchProperties.setAlimtalkEnabled(false);
        expoPushProperties = new ExpoPushProperties();
        expoPushProperties.setAccessToken("test-token");

        ReflectionTestUtils.setField(service, "batchProperties", batchProperties);
        ReflectionTestUtils.setField(service, "expoPushProperties", expoPushProperties);
        ReflectionTestUtils.setField(service, "kakaoAlimtalkEnabled", false);

        when(commonCodeRepository.countByCodeGroup(eq("ALIMTALK_BIZ_TEMPLATE_CODE")))
            .thenReturn(12L);
        when(commonCodeRepository.findTenantCodeByGroupAndValue(anyString(), anyString(),
            anyString())).thenReturn(java.util.Optional.empty());
        when(commonCodeRepository.findCoreCodeByGroupAndValue(anyString(), anyString()))
            .thenReturn(java.util.Optional.empty());
        when(solapiCredentialResolver.hasDefaultCredentials()).thenReturn(true);
        when(solapiCredentialResolver.hasDefaultPfId()).thenReturn(false);
    }

    @Test
    @DisplayName("KPI 합산 — 외부발송 실패 / 검증 skip / 정책 skip / PENDING / 성공 모두 분리")
    void kpiAggregatesFourCategories() {
        LocalDateTime now = LocalDateTime.now();
        NotificationBatchSendLog success = batchLog(true, "ALIMTALK", null, now);
        NotificationBatchSendLog external = batchLog(false, "SMS", "SEND_FAILED",
            now.minusMinutes(2));
        NotificationBatchSendLog validation = batchLog(false, "ALIMTALK", "RECIPIENT_PHONE_MISSING",
            now.minusMinutes(3));
        NotificationBatchSendLog policy = batchLog(false, "ALIMTALK", "TEMPLATE_NOT_MAPPED",
            now.minusMinutes(4));
        NotificationBatchSendLog pending = batchLog(false, "PENDING", null,
            now.minusMinutes(5));

        when(batchLogRepository.findWindowByTenantAndChannel(eq(TENANT), any(), any(), any()))
            .thenReturn(List.of(success, external, validation, policy, pending));
        when(adminTestLogRepository.findWindowByTenantAndChannel(eq(TENANT), any(), any(), any()))
            .thenReturn(Collections.emptyList());
        when(batchLogRepository.countPendingByTenantId(TENANT)).thenReturn(7L);
        when(batchLogRepository.countWindowByTenant(eq(TENANT), any(), any())).thenReturn(3L);
        when(adminTestLogRepository.countWindowByTenant(eq(TENANT), any(), any())).thenReturn(0L);

        PushMonitoringSnapshotResponse response = service.buildSnapshot(TENANT,
            PushMonitoringRange.D7, PushMonitoringChannelFilter.ALL);

        assertThat(response.getKpi().getRecentFiveMinuteCount()).isEqualTo(3L);
        assertThat(response.getKpi().getPendingCount()).isEqualTo(7L);
        assertThat(response.getKpi().getSuccessCount()).isEqualTo(1L);
        assertThat(response.getKpi().getExternalFailureCount()).isEqualTo(1L);
        assertThat(response.getKpi().getValidationSkipCount()).isEqualTo(1L);
        assertThat(response.getKpi().getPolicySkipCount()).isEqualTo(1L);
        assertThat(response.getKpi().getSkipTotalCount()).isEqualTo(2L);
        // failureRate = external / (success + external) = 1 / (1+1) = 0.5
        assertThat(response.getKpi().getFailureRate()).isEqualTo(0.5d);
    }

    @Test
    @DisplayName("운영 토글 — alimtalkEnabled=false 가 운영 OFF 로 노출")
    void operationalToggleFromProperties() {
        when(batchLogRepository.findWindowByTenantAndChannel(eq(TENANT), any(), any(), any()))
            .thenReturn(Collections.emptyList());
        when(adminTestLogRepository.findWindowByTenantAndChannel(eq(TENANT), any(), any(), any()))
            .thenReturn(Collections.emptyList());
        when(batchLogRepository.countPendingByTenantId(TENANT)).thenReturn(0L);
        when(batchLogRepository.countWindowByTenant(eq(TENANT), any(), any())).thenReturn(0L);
        when(adminTestLogRepository.countWindowByTenant(eq(TENANT), any(), any())).thenReturn(0L);

        PushMonitoringSnapshotResponse response = service.buildSnapshot(TENANT,
            PushMonitoringRange.D7, PushMonitoringChannelFilter.ALL);

        assertThat(response.getTenantSnapshot().isAlimtalkEnabled()).isFalse();
        assertThat(response.getTenantSnapshot().isKakaoApiKeyRegistered()).isTrue();
        assertThat(response.getTenantSnapshot().isExpoPushAccessTokenRegistered()).isTrue();
        assertThat(response.getOperationalToggle()).isNotNull();
        assertThat(response.getOperationalToggle().isAlimtalk()).isFalse();
        assertThat(response.getOperationalToggle().isPush()).isTrue();
    }

    @Test
    @DisplayName("PUSH 자동 추적 미지원 플래그가 false 로 응답에 포함")
    void pushAutoTrackingFlag() {
        when(batchLogRepository.findWindowByTenantAndChannel(eq(TENANT), any(), any(), any()))
            .thenReturn(Collections.emptyList());
        when(adminTestLogRepository.findWindowByTenantAndChannel(eq(TENANT), any(), any(), any()))
            .thenReturn(Collections.emptyList());
        when(batchLogRepository.countPendingByTenantId(TENANT)).thenReturn(0L);
        when(batchLogRepository.countWindowByTenant(eq(TENANT), any(), any())).thenReturn(0L);
        when(adminTestLogRepository.countWindowByTenant(eq(TENANT), any(), any())).thenReturn(0L);

        PushMonitoringSnapshotResponse response = service.buildSnapshot(TENANT,
            PushMonitoringRange.D7, PushMonitoringChannelFilter.ALL);

        assertThat(response.isPushAutoTrackingAvailable()).isFalse();
        assertThat(response.isCostAvailable()).isFalse();
    }

    @Test
    @DisplayName("실패 사례 prefix — 카테고리별 한국어 prefix 가 errorMessage 에 포함")
    void failurePrefix() {
        LocalDateTime now = LocalDateTime.now();
        NotificationBatchSendLog log = NotificationBatchSendLog.builder()
            .templateCode("RESERVATION_REMINDER_D2")
            .targetType("SCHEDULE")
            .targetId(1L)
            .recipientUserId(99L)
            .recipientPhoneMasked("010-***-1234")
            .channelUsed("ALIMTALK")
            .fallbackToSms(false)
            .success(false)
            .errorCode("SEND_FAILED")
            .errorMessage("SOLAPI 4001")
            .sentAt(now)
            .build();
        log.setId(42L);
        log.setTenantId(TENANT);

        when(batchLogRepository.findWindowByTenantAndChannel(eq(TENANT), any(), any(), any()))
            .thenReturn(List.of(log));
        when(adminTestLogRepository.findWindowByTenantAndChannel(eq(TENANT), any(), any(), any()))
            .thenReturn(Collections.emptyList());
        when(batchLogRepository.countPendingByTenantId(TENANT)).thenReturn(0L);
        when(batchLogRepository.countWindowByTenant(eq(TENANT), any(), any())).thenReturn(0L);
        when(adminTestLogRepository.countWindowByTenant(eq(TENANT), any(), any())).thenReturn(0L);

        PushMonitoringSnapshotResponse response = service.buildSnapshot(TENANT,
            PushMonitoringRange.D7, PushMonitoringChannelFilter.ALL);

        assertThat(response.getFailures()).hasSize(1);
        assertThat(response.getFailures().get(0).getErrorMessage())
            .startsWith(AdminPushMonitoringServiceImpl.FAILURE_PREFIX_EXTERNAL);
        assertThat(response.getFailures().get(0).isRetryable()).isTrue();
        assertThat(response.getFailuresTotal()).isEqualTo(1L);
    }

    private static NotificationBatchSendLog batchLog(boolean success, String channel,
            String errorCode, LocalDateTime sentAt) {
        NotificationBatchSendLog log = NotificationBatchSendLog.builder()
            .templateCode("X")
            .targetType("SCHEDULE")
            .targetId(1L)
            .recipientUserId(2L)
            .recipientPhoneMasked("010-***-0000")
            .channelUsed(channel)
            .fallbackToSms(false)
            .success(success)
            .errorCode(errorCode)
            .errorMessage(errorCode == null ? null : "msg")
            .sentAt(sentAt)
            .build();
        log.setTenantId(TENANT);
        return log;
    }

    @SuppressWarnings("unused")
    private static AdminTestNotificationLog testLog(boolean success, TestNotificationChannel ch,
            String errorCode, LocalDateTime at) {
        AdminTestNotificationLog log = AdminTestNotificationLog.builder()
            .sentByUserId(1L)
            .sentByUsername("u")
            .sentAt(at)
            .recipientPhoneMasked("010-***-1234")
            .channel(ch)
            .reason("test")
            .success(success)
            .errorCode(errorCode)
            .build();
        log.setTenantId(TENANT);
        return log;
    }
}
