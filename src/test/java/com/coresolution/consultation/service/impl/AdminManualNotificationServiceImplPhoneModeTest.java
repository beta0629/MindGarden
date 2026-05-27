package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import com.coresolution.consultation.dto.BulkAlimtalkManualRequest;
import com.coresolution.consultation.dto.BulkNotificationResponse;
import com.coresolution.consultation.dto.BulkPushManualRequest;
import com.coresolution.consultation.dto.BulkRecipientResult;
import com.coresolution.consultation.dto.BulkSmsManualRequest;
import com.coresolution.consultation.dto.TestNotificationAlimtalkTemplateSource;
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
 * {@link AdminManualNotificationServiceImpl} PHONE 모드 단위 검증(2026-05-27).
 *
 * <p>커버리지:
 * <ul>
 *   <li>SMS — phoneNumbers 단독 정상: 정규화·발송·감사로그·rate-limit 카운트 + recipientUserId=null,
 *       recipientMode=PHONE</li>
 *   <li>SMS — phoneNumbers 단독 일부 invalid: 정상 1건 발송 + 실패 행 PHONE_NUMBER_INVALID 기록, 다른 발송 계속</li>
 *   <li>SMS — userIds + phoneNumbers 혼합: 양쪽 모두 발송, 합산 totalCount 보존</li>
 *   <li>SMS — userIds·phoneNumbers 모두 비어 있음: RECIPIENTS_REQUIRED 배치 차단</li>
 *   <li>SMS — userIds 30 + phoneNumbers 21 합산 51: RECIPIENTS_LIMIT_EXCEEDED 배치 차단</li>
 *   <li>ALIMTALK — phoneNumbers 단독 정상: 알림톡 dispatchHelper.dispatchAlimtalk 호출 + recipientMode=PHONE</li>
 *   <li>PUSH — phoneNumbers 비어있지 않음: PHONE_NOT_SUPPORTED_FOR_PUSH 배치 차단, dispatch 호출 없음</li>
 *   <li>SMS — phoneNumbers null + userIds 만 있음: USER 모드 회귀 정상</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-27
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminManualNotificationServiceImpl — PHONE 모드")
class AdminManualNotificationServiceImplPhoneModeTest {

    private static final String TEST_TENANT = "tenant-phone";
    private static final Long TEST_ADMIN_ID = 7777L;
    private static final String TEST_ADMIN_LOGIN = "admin@phone";

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
    @DisplayName("SMS PHONE — phoneNumbers 2건 모두 정상 정규화/발송: success=2, recipientMode=PHONE, userId=null")
    void sendBulkSms_phoneOnly_validPhones_succeeds() {
        BulkSmsManualRequest request = BulkSmsManualRequest.builder()
            .phoneNumbers(Arrays.asList("010-1234-5678", "01098765432"))
            .content("긴급 공지")
            .reason("운영 결정 2026-05-27 — PHONE 모드 단위 테스트")
            .build();

        when(rateLimiter.tryAcquire(eq(TEST_TENANT), eq(TEST_ADMIN_ID)))
            .thenReturn(AdminTestNotificationRateLimiter.Decision.allowed(50, 100));

        AdminTestNotificationLog log1 = stubLog(3001L);
        AdminTestNotificationLog log2 = stubLog(3002L);
        when(logger.logAttempt(eq(TEST_TENANT), eq(TEST_ADMIN_ID), eq(TEST_ADMIN_LOGIN),
                eq(TestNotificationRecipientMode.PHONE), isNull(), anyString(),
                eq(TestNotificationChannel.SMS), isNull(), isNull(),
                anyString(), anyString(), anyString()))
            .thenReturn(log1, log2);

        when(dispatchHelper.dispatchSms(eq("01012345678"), anyString()))
            .thenReturn(stubSmsSuccess());
        when(dispatchHelper.dispatchSms(eq("01098765432"), anyString()))
            .thenReturn(stubSmsSuccess());

        BulkNotificationResponse response = service.sendBulkSms(TEST_TENANT, currentUser, request);

        assertThat(response.getChannel()).isEqualTo(TestNotificationChannel.SMS);
        assertThat(response.getTotalCount()).isEqualTo(2);
        assertThat(response.getSuccessCount()).isEqualTo(2);
        assertThat(response.getFailureCount()).isZero();
        assertThat(response.getBatchErrorCode()).isNull();
        assertThat(response.getResults()).hasSize(2);
        for (BulkRecipientResult row : response.getResults()) {
            assertThat(row.getUserId()).isNull();
            assertThat(row.isSuccess()).isTrue();
            assertThat(row.getPhoneMasked()).startsWith("010").contains("****");
        }
        verify(logger).updateResult(eq(3001L), eq(true), isNull(), isNull(), isNull(), isNull());
        verify(logger).updateResult(eq(3002L), eq(true), isNull(), isNull(), isNull(), isNull());
        verify(rateLimiter, times(2)).recordAttempt(eq(TEST_TENANT), eq(TEST_ADMIN_ID));
        // userIds 가 비어 있으므로 userRepository 조회는 발생하지 않아야 한다.
        verify(userRepository, never()).findByTenantIdAndIdInAndIsDeletedFalse(anyString(), any());
    }

    @Test
    @DisplayName("SMS PHONE — invalid 1건 + valid 1건: invalid 는 PHONE_NUMBER_INVALID 행만 기록, valid 발송 계속")
    void sendBulkSms_phoneOnly_invalidPhone_recordsErrorAndContinues() {
        BulkSmsManualRequest request = BulkSmsManualRequest.builder()
            .phoneNumbers(Arrays.asList("01012345678", "abc-not-a-phone"))
            .content("공지")
            .reason("invalid phone regression test 2026-05-27")
            .build();

        when(rateLimiter.tryAcquire(eq(TEST_TENANT), eq(TEST_ADMIN_ID)))
            .thenReturn(AdminTestNotificationRateLimiter.Decision.allowed(50, 100));

        AdminTestNotificationLog log1 = stubLog(4001L);
        when(logger.logAttempt(eq(TEST_TENANT), eq(TEST_ADMIN_ID), eq(TEST_ADMIN_LOGIN),
                eq(TestNotificationRecipientMode.PHONE), isNull(), anyString(),
                eq(TestNotificationChannel.SMS), isNull(), isNull(),
                anyString(), anyString(), anyString()))
            .thenReturn(log1);

        when(dispatchHelper.dispatchSms(eq("01012345678"), anyString()))
            .thenReturn(stubSmsSuccess());

        BulkNotificationResponse response = service.sendBulkSms(TEST_TENANT, currentUser, request);

        assertThat(response.getTotalCount()).isEqualTo(2);
        assertThat(response.getSuccessCount()).isEqualTo(1);
        assertThat(response.getFailureCount()).isEqualTo(1);
        assertThat(response.getResults()).hasSize(2);

        BulkRecipientResult okRow = response.getResults().get(0);
        assertThat(okRow.isSuccess()).isTrue();

        BulkRecipientResult badRow = response.getResults().get(1);
        assertThat(badRow.isSuccess()).isFalse();
        assertThat(badRow.getErrorCode())
            .isEqualTo(AdminManualNotificationServiceImpl.ERROR_CODE_PHONE_NUMBER_INVALID);
        assertThat(badRow.getUserId()).isNull();
        assertThat(badRow.getLogId()).isNull();

        // invalid 행은 logAttempt 호출 없음 — valid 1건만 호출.
        verify(logger, times(1)).logAttempt(anyString(), anyLong(), anyString(),
            any(), any(), anyString(), any(), any(), any(), any(), anyString(), anyString());
        verify(rateLimiter, times(1)).recordAttempt(eq(TEST_TENANT), eq(TEST_ADMIN_ID));
    }

    @Test
    @DisplayName("SMS PHONE — userIds 1명 + phoneNumbers 1건 혼합: total=2, 양쪽 모두 발송")
    void sendBulkSms_userIdsAndPhones_mixedSucceeds() {
        BulkSmsManualRequest request = BulkSmsManualRequest.builder()
            .userIds(Arrays.asList(501L))
            .phoneNumbers(Arrays.asList("01011112222"))
            .content("혼합 발송")
            .reason("혼합 발송 회귀 — 2026-05-27 단위 테스트")
            .build();

        when(rateLimiter.tryAcquire(eq(TEST_TENANT), eq(TEST_ADMIN_ID)))
            .thenReturn(AdminTestNotificationRateLimiter.Decision.allowed(50, 100));

        User user1 = new User();
        user1.setId(501L);
        user1.setPhone("encPhone501");
        user1.setName("encName501");
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(
                eq(TEST_TENANT), eq(Arrays.asList(501L))))
            .thenReturn(Arrays.asList(user1));
        when(encryptionUtil.decrypt(eq("encPhone501"))).thenReturn("01055556666");
        when(encryptionUtil.decrypt(eq("encName501"))).thenReturn("홍길동");

        AdminTestNotificationLog logUser = stubLog(5001L);
        AdminTestNotificationLog logPhone = stubLog(5002L);
        when(logger.logAttempt(eq(TEST_TENANT), eq(TEST_ADMIN_ID), eq(TEST_ADMIN_LOGIN),
                eq(TestNotificationRecipientMode.USER), eq(501L), anyString(),
                eq(TestNotificationChannel.SMS), isNull(), isNull(),
                anyString(), anyString(), anyString()))
            .thenReturn(logUser);
        when(logger.logAttempt(eq(TEST_TENANT), eq(TEST_ADMIN_ID), eq(TEST_ADMIN_LOGIN),
                eq(TestNotificationRecipientMode.PHONE), isNull(), anyString(),
                eq(TestNotificationChannel.SMS), isNull(), isNull(),
                anyString(), anyString(), anyString()))
            .thenReturn(logPhone);

        when(dispatchHelper.dispatchSms(eq("01055556666"), anyString()))
            .thenReturn(stubSmsSuccess());
        when(dispatchHelper.dispatchSms(eq("01011112222"), anyString()))
            .thenReturn(stubSmsSuccess());

        BulkNotificationResponse response = service.sendBulkSms(TEST_TENANT, currentUser, request);

        assertThat(response.getTotalCount()).isEqualTo(2);
        assertThat(response.getSuccessCount()).isEqualTo(2);
        assertThat(response.getFailureCount()).isZero();

        // USER 행 (index 0) 과 PHONE 행 (index 1) 의 메타데이터 검증.
        BulkRecipientResult userRow = response.getResults().get(0);
        assertThat(userRow.getUserId()).isEqualTo(501L);
        assertThat(userRow.getName()).isEqualTo("홍길동");

        BulkRecipientResult phoneRow = response.getResults().get(1);
        assertThat(phoneRow.getUserId()).isNull();

        verify(rateLimiter, times(2)).recordAttempt(eq(TEST_TENANT), eq(TEST_ADMIN_ID));
    }

    @Test
    @DisplayName("SMS — userIds·phoneNumbers 모두 비어 있음 → RECIPIENTS_REQUIRED 배치 차단")
    void sendBulkSms_bothEmpty_returnsRecipientsRequired() {
        BulkSmsManualRequest request = BulkSmsManualRequest.builder()
            .content("공지")
            .reason("empty recipients test")
            .build();

        BulkNotificationResponse response = service.sendBulkSms(TEST_TENANT, currentUser, request);

        assertThat(response.getBatchErrorCode())
            .isEqualTo(AdminManualNotificationServiceImpl.ERROR_CODE_RECIPIENTS_REQUIRED);
        assertThat(response.getTotalCount()).isZero();
        assertThat(response.getSuccessCount()).isZero();
        assertThat(response.getFailureCount()).isZero();
        assertThat(response.getResults()).isEqualTo(Collections.emptyList());

        verify(rateLimiter, never()).tryAcquire(anyString(), anyLong());
        verify(rateLimiter, never()).recordAttempt(anyString(), anyLong());
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
    }

    @Test
    @DisplayName("SMS — userIds 30 + phoneNumbers 21 = 51 합산 → RECIPIENTS_LIMIT_EXCEEDED 배치 차단")
    void sendBulkSms_overLimit_combined51_returnsLimitExceeded() {
        // 50명 상한은 합산. userIds 30 + phoneNumbers 21 = 51 → 차단.
        List<Long> userIds = new java.util.ArrayList<>();
        for (long i = 1L; i <= 30L; i++) {
            userIds.add(i);
        }
        List<String> phones = new java.util.ArrayList<>();
        for (int i = 0; i < 21; i++) {
            phones.add(String.format("010987%05d", i));
        }
        BulkSmsManualRequest request = BulkSmsManualRequest.builder()
            .userIds(userIds)
            .phoneNumbers(phones)
            .content("over 50")
            .reason("over-limit regression — 2026-05-27")
            .build();

        BulkNotificationResponse response = service.sendBulkSms(TEST_TENANT, currentUser, request);

        assertThat(response.getBatchErrorCode())
            .isEqualTo(AdminManualNotificationServiceImpl.ERROR_CODE_RECIPIENTS_LIMIT_EXCEEDED);
        assertThat(response.getTotalCount()).isEqualTo(51);
        assertThat(response.getResults()).isEqualTo(Collections.emptyList());

        verify(rateLimiter, never()).tryAcquire(anyString(), anyLong());
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
        verify(userRepository, never()).findByTenantIdAndIdInAndIsDeletedFalse(anyString(), any());
    }

    @Test
    @DisplayName("ALIMTALK PHONE — phoneNumbers 1건 정상: dispatchAlimtalk 호출 + recipientMode=PHONE")
    void sendBulkAlimtalk_phoneOnly_validPhone_succeeds() {
        BulkAlimtalkManualRequest request = BulkAlimtalkManualRequest.builder()
            .phoneNumbers(Arrays.asList("01012345678"))
            .templateCode("TEST_TPL_CODE")
            .templateSource(TestNotificationAlimtalkTemplateSource.COMMON_CODE)
            .templateParams(Collections.singletonMap("name", "홍길동"))
            .reason("PHONE 모드 알림톡 회귀 — 2026-05-27")
            .build();

        when(templateMappingResolver.resolveSolapiTemplateId(eq(TEST_TENANT), eq("TEST_TPL_CODE")))
            .thenReturn("SOLAPI-LIVE-TEMPLATE-ID");
        when(rateLimiter.tryAcquire(eq(TEST_TENANT), eq(TEST_ADMIN_ID)))
            .thenReturn(AdminTestNotificationRateLimiter.Decision.allowed(50, 100));

        AdminTestNotificationLog logEntry = stubLog(6001L);
        when(logger.logAttempt(eq(TEST_TENANT), eq(TEST_ADMIN_ID), eq(TEST_ADMIN_LOGIN),
                eq(TestNotificationRecipientMode.PHONE), isNull(), anyString(),
                eq(TestNotificationChannel.ALIMTALK), eq("TEST_TPL_CODE"), any(),
                isNull(), anyString(), anyString()))
            .thenReturn(logEntry);

        when(dispatchHelper.dispatchAlimtalk(eq("01012345678"),
                eq("SOLAPI-LIVE-TEMPLATE-ID"), any()))
            .thenReturn(stubAlimtalkSuccess());

        BulkNotificationResponse response = service.sendBulkAlimtalk(TEST_TENANT, currentUser, request);

        assertThat(response.getChannel()).isEqualTo(TestNotificationChannel.ALIMTALK);
        assertThat(response.getTotalCount()).isEqualTo(1);
        assertThat(response.getSuccessCount()).isEqualTo(1);
        assertThat(response.getResults()).hasSize(1);

        BulkRecipientResult row = response.getResults().get(0);
        assertThat(row.getUserId()).isNull();
        assertThat(row.isSuccess()).isTrue();
        assertThat(row.getPhoneMasked()).startsWith("010").contains("****");

        verify(rateLimiter).recordAttempt(eq(TEST_TENANT), eq(TEST_ADMIN_ID));
    }

    @Test
    @DisplayName("PUSH — phoneNumbers 1건 비어있지 않음 → PHONE_NOT_SUPPORTED_FOR_PUSH 배치 차단, dispatch 호출 없음")
    void sendBulkPush_withPhones_returnsPhoneNotSupportedForPush() {
        BulkPushManualRequest request = BulkPushManualRequest.builder()
            .userIds(Arrays.asList(101L))
            .phoneNumbers(Arrays.asList("01012345678"))
            .title("공지")
            .body("푸시 본문")
            .reason("PUSH PHONE 가드 회귀 — 2026-05-27")
            .build();

        BulkNotificationResponse response = service.sendBulkPush(TEST_TENANT, currentUser, request);

        assertThat(response.getChannel()).isEqualTo(TestNotificationChannel.PUSH);
        assertThat(response.getBatchErrorCode())
            .isEqualTo(AdminManualNotificationServiceImpl.ERROR_CODE_PHONE_NOT_SUPPORTED_FOR_PUSH);
        assertThat(response.getResults()).isEqualTo(Collections.emptyList());

        verify(mobilePushDispatchService, never()).dispatchAdminAnnouncement(
            anyString(), any(), anyString(), anyString(), anyString());
        verify(rateLimiter, never()).tryAcquire(anyString(), anyLong());
        verify(rateLimiter, never()).recordAttempt(anyString(), anyLong());
        verify(logger, never()).logAttempt(anyString(), anyLong(), anyString(),
            any(), any(), anyString(), any(), any(), any(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("SMS USER 회귀 — phoneNumbers null + userIds 1명: 기존 USER 모드 정상 동작")
    void sendBulkSms_userIdsOnly_stillSucceeds() {
        BulkSmsManualRequest request = BulkSmsManualRequest.builder()
            .userIds(Arrays.asList(901L))
            .content("USER 회귀")
            .reason("USER 모드 회귀 — 2026-05-27")
            .build();

        when(rateLimiter.tryAcquire(eq(TEST_TENANT), eq(TEST_ADMIN_ID)))
            .thenReturn(AdminTestNotificationRateLimiter.Decision.allowed(50, 100));

        User user1 = new User();
        user1.setId(901L);
        user1.setPhone("encPhone901");
        user1.setName("encName901");
        when(userRepository.findByTenantIdAndIdInAndIsDeletedFalse(
                eq(TEST_TENANT), eq(Arrays.asList(901L))))
            .thenReturn(Arrays.asList(user1));
        lenient().when(encryptionUtil.decrypt(eq("encPhone901"))).thenReturn("01099998888");
        lenient().when(encryptionUtil.decrypt(eq("encName901"))).thenReturn("이몽룡");

        AdminTestNotificationLog logEntry = stubLog(7001L);
        when(logger.logAttempt(eq(TEST_TENANT), eq(TEST_ADMIN_ID), eq(TEST_ADMIN_LOGIN),
                eq(TestNotificationRecipientMode.USER), eq(901L), anyString(),
                eq(TestNotificationChannel.SMS), isNull(), isNull(),
                anyString(), anyString(), anyString()))
            .thenReturn(logEntry);
        when(dispatchHelper.dispatchSms(eq("01099998888"), anyString()))
            .thenReturn(stubSmsSuccess());

        BulkNotificationResponse response = service.sendBulkSms(TEST_TENANT, currentUser, request);

        assertThat(response.getTotalCount()).isEqualTo(1);
        assertThat(response.getSuccessCount()).isEqualTo(1);
        BulkRecipientResult row = response.getResults().get(0);
        assertThat(row.getUserId()).isEqualTo(901L);
    }

    private AdminTestNotificationLog stubLog(Long id) {
        AdminTestNotificationLog log = AdminTestNotificationLog.builder().success(Boolean.FALSE).build();
        log.setId(id);
        return log;
    }

    private NotificationDispatchHelper.DispatchResult stubSmsSuccess() {
        return new NotificationDispatchHelper.DispatchResult(true, null, null, null, null);
    }

    private NotificationDispatchHelper.DispatchResult stubAlimtalkSuccess() {
        return new NotificationDispatchHelper.DispatchResult(true, null, null, "grp-id", "msg-id");
    }
}
