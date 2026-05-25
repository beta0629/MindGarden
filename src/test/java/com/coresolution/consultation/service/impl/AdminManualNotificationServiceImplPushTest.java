package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;
import com.coresolution.consultation.dto.BulkNotificationResponse;
import com.coresolution.consultation.dto.BulkPushManualRequest;
import com.coresolution.consultation.dto.BulkRecipientResult;
import com.coresolution.consultation.dto.MobilePushBroadcastResult;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.dto.TestNotificationRecipientMode;
import com.coresolution.consultation.entity.AdminTestNotificationLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.AdminTestNotificationLogRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link AdminManualNotificationServiceImpl#sendBulkPush sendBulkPush} 단위 검증(2026-05-25).
 *
 * <p>커버리지:
 * <ul>
 *   <li>모두 SENT 케이스 — successCount/failureCount 와 logger.updateResult success=true 호출 확인</li>
 *   <li>혼합 SENT/SKIPPED — SKIPPED 는 실패로 카운트되지만 errorCode 로 사유 보존</li>
 *   <li>RECIPIENT_NOT_FOUND — 사용자 미존재 시 dispatch 결과 무관하게 실패 행 1건 + 발송 로그 INSERT 없음</li>
 *   <li>rate-limit 잔여 < 요청 → 전체 차단(0건 발송, batchErrorCode=RATE_LIMIT_EXCEEDED_BULK)</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-25
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminManualNotificationServiceImpl.sendBulkPush")
class AdminManualNotificationServiceImplPushTest {

    private static final String TEST_TENANT = "tenant-push";
    private static final Long TEST_ADMIN_ID = 9999L;
    private static final String TEST_ADMIN_LOGIN = "admin@push";

    @Mock
    private UserRepository userRepository;
    @Mock
    private AdminTestNotificationLogRepository logRepository;
    @Mock
    private AdminTestNotificationLogger logger;
    @Mock
    private AdminTestNotificationRateLimiter rateLimiter;
    @Mock
    private NotificationDispatchHelper dispatchHelper;
    @Mock
    private AlimtalkTemplateMappingResolver templateMappingResolver;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private MobilePushDispatchService mobilePushDispatchService;

    @InjectMocks
    private AdminManualNotificationServiceImpl service;

    private User currentUser;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(TEST_ADMIN_ID);
        currentUser.setUserId(TEST_ADMIN_LOGIN);
        currentUser.setTenantId(TEST_TENANT);
    }

    @Test
    @DisplayName("정상: 2명 모두 SENT — successCount=2, batchErrorCode 없음, logger.updateResult success=true 2회")
    void sendBulkPush_allSent_buildsResponseWithSuccessCounts() {
        BulkPushManualRequest request = BulkPushManualRequest.builder()
            .userIds(Arrays.asList(101L, 102L))
            .title("운영 공지")
            .body("내일 점검 안내입니다.")
            .reason("운영팀 결정")
            .build();

        when(rateLimiter.tryAcquire(eq(TEST_TENANT), eq(TEST_ADMIN_ID)))
            .thenReturn(AdminTestNotificationRateLimiter.Decision.allowed(50, 100));

        User user1 = new User();
        user1.setId(101L);
        user1.setName("encName1");
        User user2 = new User();
        user2.setId(102L);
        user2.setName("encName2");
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TEST_TENANT), eq(Arrays.asList(101L, 102L))))
            .thenReturn(Arrays.asList(user1, user2));
        when(encryptionUtil.decrypt(eq("encName1"))).thenReturn("홍길동");
        when(encryptionUtil.decrypt(eq("encName2"))).thenReturn("김철수");

        when(mobilePushDispatchService.dispatchAdminAnnouncement(
                eq(TEST_TENANT), eq(Arrays.asList(101L, 102L)), eq("운영 공지"),
                eq("내일 점검 안내입니다."), anyString()))
            .thenReturn(Arrays.asList(
                MobilePushBroadcastResult.builder()
                    .userId(101L)
                    .status(MobilePushBroadcastResult.Status.SENT)
                    .expoReceiptId("rcpt-101")
                    .build(),
                MobilePushBroadcastResult.builder()
                    .userId(102L)
                    .status(MobilePushBroadcastResult.Status.SENT)
                    .expoReceiptId("rcpt-102")
                    .build()));

        AdminTestNotificationLog log1 = stubLog(1001L);
        AdminTestNotificationLog log2 = stubLog(1002L);
        when(logger.logAttempt(eq(TEST_TENANT), eq(TEST_ADMIN_ID), eq(TEST_ADMIN_LOGIN),
                eq(TestNotificationRecipientMode.USER), eq(101L),
                eq(AdminManualNotificationServiceImpl.PUSH_PHONE_PLACEHOLDER),
                eq(TestNotificationChannel.PUSH), isNull(), isNull(),
                anyString(), eq("운영팀 결정"), anyString()))
            .thenReturn(log1);
        when(logger.logAttempt(eq(TEST_TENANT), eq(TEST_ADMIN_ID), eq(TEST_ADMIN_LOGIN),
                eq(TestNotificationRecipientMode.USER), eq(102L),
                eq(AdminManualNotificationServiceImpl.PUSH_PHONE_PLACEHOLDER),
                eq(TestNotificationChannel.PUSH), isNull(), isNull(),
                anyString(), eq("운영팀 결정"), anyString()))
            .thenReturn(log2);

        BulkNotificationResponse response = service.sendBulkPush(TEST_TENANT, currentUser, request);

        assertThat(response.getChannel()).isEqualTo(TestNotificationChannel.PUSH);
        assertThat(response.getTotalCount()).isEqualTo(2);
        assertThat(response.getSuccessCount()).isEqualTo(2);
        assertThat(response.getFailureCount()).isZero();
        assertThat(response.getBatchErrorCode()).isNull();
        assertThat(response.getBatchId()).isNotBlank();
        assertThat(response.getResults()).hasSize(2);
        assertThat(response.getResults().get(0).getSolapiMessageId()).isEqualTo("rcpt-101");
        assertThat(response.getResults().get(0).getName()).isEqualTo("홍길동");
        assertThat(response.getResults().get(1).getName()).isEqualTo("김철수");

        verify(logger).updateResult(eq(1001L), eq(true), isNull(), isNull(), isNull(), isNull());
        verify(logger).updateResult(eq(1002L), eq(true), isNull(), isNull(), isNull(), isNull());
        verify(rateLimiter, times(2)).recordAttempt(eq(TEST_TENANT), eq(TEST_ADMIN_ID));
    }

    @Test
    @DisplayName("혼합: 1 SENT + 1 SKIPPED(PUSH_NO_TOKEN) — successCount=1, SKIPPED 사유 보존, logger.updateResult success=false 1회")
    void sendBulkPush_mixedSentSkipped_preservesReasonAndCounts() {
        BulkPushManualRequest request = BulkPushManualRequest.builder()
            .userIds(Arrays.asList(201L, 202L))
            .title("공지")
            .body("본문")
            .reason("revival check")
            .build();

        when(rateLimiter.tryAcquire(eq(TEST_TENANT), eq(TEST_ADMIN_ID)))
            .thenReturn(AdminTestNotificationRateLimiter.Decision.allowed(50, 100));

        User user1 = new User();
        user1.setId(201L);
        User user2 = new User();
        user2.setId(202L);
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TEST_TENANT), eq(Arrays.asList(201L, 202L))))
            .thenReturn(Arrays.asList(user1, user2));

        when(mobilePushDispatchService.dispatchAdminAnnouncement(
                eq(TEST_TENANT), eq(Arrays.asList(201L, 202L)), eq("공지"), eq("본문"), anyString()))
            .thenReturn(Arrays.asList(
                MobilePushBroadcastResult.builder()
                    .userId(201L)
                    .status(MobilePushBroadcastResult.Status.SENT)
                    .expoReceiptId("rcpt-201")
                    .build(),
                MobilePushBroadcastResult.builder()
                    .userId(202L)
                    .status(MobilePushBroadcastResult.Status.SKIPPED)
                    .errorCode(MobilePushBroadcastResult.ERROR_CODE_NO_TOKEN)
                    .errorMessage("푸시 토큰이 없는 사용자")
                    .build()));

        AdminTestNotificationLog logA = stubLog(2001L);
        AdminTestNotificationLog logB = stubLog(2002L);
        when(logger.logAttempt(eq(TEST_TENANT), eq(TEST_ADMIN_ID), eq(TEST_ADMIN_LOGIN),
                eq(TestNotificationRecipientMode.USER), eq(201L), anyString(),
                eq(TestNotificationChannel.PUSH), isNull(), isNull(), anyString(), anyString(), anyString()))
            .thenReturn(logA);
        when(logger.logAttempt(eq(TEST_TENANT), eq(TEST_ADMIN_ID), eq(TEST_ADMIN_LOGIN),
                eq(TestNotificationRecipientMode.USER), eq(202L), anyString(),
                eq(TestNotificationChannel.PUSH), isNull(), isNull(), anyString(), anyString(), anyString()))
            .thenReturn(logB);

        BulkNotificationResponse response = service.sendBulkPush(TEST_TENANT, currentUser, request);

        assertThat(response.getSuccessCount()).isEqualTo(1);
        assertThat(response.getFailureCount()).isEqualTo(1);
        assertThat(response.getResults()).hasSize(2);

        BulkRecipientResult skippedRow = response.getResults().get(1);
        assertThat(skippedRow.isSuccess()).isFalse();
        assertThat(skippedRow.getErrorCode()).isEqualTo(MobilePushBroadcastResult.ERROR_CODE_NO_TOKEN);
        assertThat(skippedRow.getErrorMessage()).isEqualTo("푸시 토큰이 없는 사용자");

        verify(logger).updateResult(eq(2001L), eq(true), isNull(), isNull(), isNull(), isNull());
        verify(logger).updateResult(eq(2002L), eq(false), isNull(), isNull(),
                eq(MobilePushBroadcastResult.ERROR_CODE_NO_TOKEN), eq("푸시 토큰이 없는 사용자"));
    }

    @Test
    @DisplayName("rate-limit 잔여 < 요청 수신자 수 → 전체 차단(0건 발송, batchErrorCode=RATE_LIMIT_EXCEEDED_BULK)")
    void sendBulkPush_whenRateLimitInsufficient_blocksEntireBatch() {
        BulkPushManualRequest request = BulkPushManualRequest.builder()
            .userIds(Arrays.asList(301L, 302L, 303L, 304L, 305L))
            .title("공지")
            .body("본문")
            .reason("blocked")
            .build();

        when(rateLimiter.tryAcquire(eq(TEST_TENANT), eq(TEST_ADMIN_ID)))
            .thenReturn(AdminTestNotificationRateLimiter.Decision.allowed(2, 100));

        BulkNotificationResponse response = service.sendBulkPush(TEST_TENANT, currentUser, request);

        assertThat(response.getChannel()).isEqualTo(TestNotificationChannel.PUSH);
        assertThat(response.getTotalCount()).isEqualTo(5);
        assertThat(response.getSuccessCount()).isZero();
        assertThat(response.getFailureCount()).isEqualTo(5);
        assertThat(response.getBatchErrorCode())
            .isEqualTo(AdminManualNotificationServiceImpl.ERROR_CODE_RATE_LIMIT_EXCEEDED_BULK);
        assertThat(response.getResults()).isEqualTo(Collections.emptyList());

        // 차단 시 dispatch · logger · recordAttempt 모두 0회.
        verify(mobilePushDispatchService, never()).dispatchAdminAnnouncement(
            anyString(), any(), anyString(), anyString(), anyString());
        verify(logger, never()).logAttempt(anyString(), anyLong(), anyString(),
            any(), anyLong(), anyString(), any(), any(), any(), any(), anyString(), anyString());
        verify(rateLimiter, never()).recordAttempt(anyString(), anyLong());
    }

    @Test
    @DisplayName("사용자 미존재(다른 tenant) → 행에 RECIPIENT_NOT_FOUND 표기, 감사로그 INSERT 없음")
    void sendBulkPush_whenUserNotFound_buildsUnresolvedRow() {
        BulkPushManualRequest request = BulkPushManualRequest.builder()
            .userIds(Arrays.asList(401L))
            .title("공지")
            .body("본문")
            .reason("recipient not found")
            .build();

        when(rateLimiter.tryAcquire(eq(TEST_TENANT), eq(TEST_ADMIN_ID)))
            .thenReturn(AdminTestNotificationRateLimiter.Decision.allowed(50, 100));

        // 사용자 누락(다른 tenant) — userRepository 가 빈 리스트 반환.
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TEST_TENANT), eq(Arrays.asList(401L))))
            .thenReturn(Collections.emptyList());

        // dispatch 는 호출되지만 결과에 매핑되지 않은 사용자도 미존재 행에서 FAILED 처리.
        when(mobilePushDispatchService.dispatchAdminAnnouncement(
                eq(TEST_TENANT), eq(Arrays.asList(401L)), anyString(), anyString(), anyString()))
            .thenReturn(Arrays.asList(
                MobilePushBroadcastResult.builder()
                    .userId(401L)
                    .status(MobilePushBroadcastResult.Status.SKIPPED)
                    .errorCode(MobilePushBroadcastResult.ERROR_CODE_NO_TOKEN)
                    .errorMessage("푸시 토큰이 없는 사용자")
                    .build()));

        BulkNotificationResponse response = service.sendBulkPush(TEST_TENANT, currentUser, request);

        assertThat(response.getResults()).hasSize(1);
        BulkRecipientResult row = response.getResults().get(0);
        assertThat(row.isSuccess()).isFalse();
        assertThat(row.getErrorCode())
            .isEqualTo(AdminManualNotificationServiceImpl.ERROR_CODE_RECIPIENT_NOT_FOUND);
        assertThat(row.getLogId()).isNull();

        verify(logger, never()).logAttempt(anyString(), anyLong(), anyString(), any(),
            anyLong(), anyString(), any(), any(), any(), any(), anyString(), anyString());
        verify(logger, never()).updateResult(anyLong(), anyBoolean(), any(), any(), any(), any());
    }

    private AdminTestNotificationLog stubLog(Long id) {
        AdminTestNotificationLog log = AdminTestNotificationLog.builder().success(Boolean.FALSE).build();
        log.setId(id);
        return log;
    }
}
