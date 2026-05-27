package com.coresolution.consultation.service.impl;

import java.util.HashMap;
import com.coresolution.consultation.dto.TestAlimtalkRequest;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.dto.TestNotificationRecipientMode;
import com.coresolution.consultation.dto.TestNotificationResponse;
import com.coresolution.consultation.dto.TestSmsRequest;
import com.coresolution.consultation.entity.AdminTestNotificationLog;
import com.coresolution.consultation.integration.solapi.KakaoSolapiCredentialResolver;
import com.coresolution.consultation.integration.solapi.SolapiKakaoTemplateClient;
import com.coresolution.consultation.repository.AdminTestNotificationLogRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.TenantKakaoAlimtalkSettingsRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.KakaoAlimTalkService;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link AdminTestNotificationServiceImpl} PHONE 모드 단위 테스트 (2026-05-27 신설).
 *
 * <p>커버리지:
 * <ul>
 *   <li>{@code sendSms} PHONE 모드 — 정상 / 누락(PHONE_NUMBER_REQUIRED) / 형식 오류(PHONE_NUMBER_INVALID)</li>
 *   <li>{@code sendAlimtalk} PHONE 모드 — 정상 / 누락</li>
 *   <li>SELF 모드 회귀 — 기존 동작 유지</li>
 * </ul>
 *
 * <p>PHONE 모드는 {@code recipientUserId=null} 로 감사로그가 INSERT 되어야 하며,
 * 정규화된 한국 휴대폰 11자리로 디스패치 호출이 발생해야 한다.
 *
 * @author MindGarden
 * @since 2026-05-27
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("어드민 테스트 발송 — PHONE 모드")
class AdminTestNotificationServiceImplPhoneModeTest {

    private static final String TENANT_ID = "tenant-incheon-counseling-001";
    private static final Long SENDER_USER_ID = 999L;
    private static final String SENDER_LOGIN = "admin_tester";
    private static final String SENDER_PHONE_PLAIN = "01098765432";
    private static final String PHONE_INPUT_FORMATTED = "010-1234-5678";
    private static final String PHONE_NORMALIZED = "01012345678";

    @Mock private UserRepository userRepository;
    @Mock private CommonCodeRepository commonCodeRepository;
    @Mock private AdminTestNotificationLogRepository logRepository;
    @Mock private AdminTestNotificationLogger logger;
    @Mock private AdminTestNotificationRateLimiter rateLimiter;
    @Mock private SmsAuthService smsAuthService;
    @Mock private KakaoAlimTalkService kakaoAlimTalkService;
    @Mock private NotificationDispatchHelper dispatchHelper;
    @Mock private AlimtalkTemplateMappingResolver templateMappingResolver;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private KakaoSolapiCredentialResolver solapiCredentialResolver;
    @Mock private SolapiKakaoTemplateClient solapiKakaoTemplateClient;
    @Mock private TenantKakaoAlimtalkSettingsRepository tenantKakaoAlimtalkSettingsRepository;

    private AdminTestNotificationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminTestNotificationServiceImpl(
            userRepository,
            commonCodeRepository,
            logRepository,
            logger,
            rateLimiter,
            smsAuthService,
            kakaoAlimTalkService,
            dispatchHelper,
            templateMappingResolver,
            encryptionUtil,
            new ObjectMapper(),
            solapiCredentialResolver,
            solapiKakaoTemplateClient,
            tenantKakaoAlimtalkSettingsRepository);
    }

    @Test
    @DisplayName("sendSms — PHONE 모드 + 유효 번호: 정규화된 번호로 디스패치, recipientUserId=null 로 감사로그")
    void sendSms_phoneMode_validPhone_succeeds() {
        AdminTestNotificationLog savedLog = newLog(101L, TestNotificationChannel.SMS,
            TestNotificationRecipientMode.PHONE);
        when(logger.logAttempt(eq(TENANT_ID), eq(SENDER_USER_ID), eq(SENDER_LOGIN),
                eq(TestNotificationRecipientMode.PHONE), isNull(), anyString(),
                eq(TestNotificationChannel.SMS), isNull(), isNull(), anyString(), anyString()))
            .thenReturn(savedLog);
        when(dispatchHelper.dispatchSms(eq(PHONE_NORMALIZED), anyString()))
            .thenReturn(new NotificationDispatchHelper.DispatchResult(true, null, null, null, null));

        TestSmsRequest request = TestSmsRequest.builder()
            .recipientMode(TestNotificationRecipientMode.PHONE)
            .phoneNumber(PHONE_INPUT_FORMATTED)
            .message("[테스트] PHONE 모드 검증")
            .reason("PHONE 모드 정상 발송")
            .build();

        TestNotificationResponse response = service.sendSms(TENANT_ID, buildSender(), request);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getErrorCode()).isNull();
        assertThat(response.getLogId()).isEqualTo(101L);

        verify(dispatchHelper).dispatchSms(eq(PHONE_NORMALIZED), eq("[테스트] PHONE 모드 검증"));
        verify(logger).logAttempt(eq(TENANT_ID), eq(SENDER_USER_ID), eq(SENDER_LOGIN),
            eq(TestNotificationRecipientMode.PHONE), isNull(), anyString(),
            eq(TestNotificationChannel.SMS), isNull(), isNull(),
            eq("[테스트] PHONE 모드 검증"), eq("PHONE 모드 정상 발송"));
    }

    @Test
    @DisplayName("sendSms — PHONE 모드 + 번호 누락: PHONE_NUMBER_REQUIRED, 디스패치 0회")
    void sendSms_phoneMode_missingPhone_returnsPhoneNumberRequired() {
        TestSmsRequest request = TestSmsRequest.builder()
            .recipientMode(TestNotificationRecipientMode.PHONE)
            .phoneNumber("")
            .message("denied")
            .reason("PHONE 모드 — 빈 phoneNumber 검증")
            .build();

        TestNotificationResponse response = service.sendSms(TENANT_ID, buildSender(), request);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getErrorCode())
            .isEqualTo(AdminTestNotificationServiceImpl.ERROR_CODE_PHONE_NUMBER_REQUIRED);
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
        verify(logger, never()).logAttempt(anyString(), any(), anyString(), any(), any(),
            anyString(), any(), any(), any(), anyString(), anyString());
    }

    @Test
    @DisplayName("sendSms — PHONE 모드 + 형식 오류: PHONE_NUMBER_INVALID, 응답 메시지에 원본 미노출")
    void sendSms_phoneMode_invalidPhone_returnsPhoneNumberInvalid() {
        TestSmsRequest request = TestSmsRequest.builder()
            .recipientMode(TestNotificationRecipientMode.PHONE)
            .phoneNumber("0212345678")
            .message("denied")
            .reason("PHONE 모드 — 유선번호 거부 검증")
            .build();

        TestNotificationResponse response = service.sendSms(TENANT_ID, buildSender(), request);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getErrorCode())
            .isEqualTo(AdminTestNotificationServiceImpl.ERROR_CODE_PHONE_NUMBER_INVALID);
        assertThat(response.getErrorMessage()).doesNotContain("0212345678");
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
    }

    @Test
    @DisplayName("sendAlimtalk — PHONE 모드 + 라이브 templateId: 정규화 번호로 디스패치")
    void sendAlimtalk_phoneMode_validPhone_succeeds() {
        AdminTestNotificationLog savedLog = newLog(202L, TestNotificationChannel.ALIMTALK,
            TestNotificationRecipientMode.PHONE);
        when(logger.logAttempt(eq(TENANT_ID), eq(SENDER_USER_ID), eq(SENDER_LOGIN),
                eq(TestNotificationRecipientMode.PHONE), isNull(), anyString(),
                eq(TestNotificationChannel.ALIMTALK), anyString(), anyMap(),
                isNull(), anyString()))
            .thenReturn(savedLog);
        when(dispatchHelper.dispatchAlimtalk(eq(PHONE_NORMALIZED),
                eq("KA01TP250101000000000000000099"), anyMap()))
            .thenReturn(new NotificationDispatchHelper.DispatchResult(true, null, null,
                "GROUP-OK", "MSG-OK"));

        TestAlimtalkRequest request = TestAlimtalkRequest.builder()
            .recipientMode(TestNotificationRecipientMode.PHONE)
            .phoneNumber(PHONE_INPUT_FORMATTED)
            .templateCode("KA01TP250101000000000000000099")
            .templateParams(new HashMap<>())
            .reason("PHONE 모드 알림톡 라이브 검증")
            .templateSource("SOLAPI")
            .build();

        TestNotificationResponse response = service.sendAlimtalk(TENANT_ID, buildSender(), request);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getLogId()).isEqualTo(202L);
        verify(dispatchHelper).dispatchAlimtalk(eq(PHONE_NORMALIZED),
            eq("KA01TP250101000000000000000099"), anyMap());
        verify(templateMappingResolver, never())
            .resolveSolapiTemplateId(anyString(), anyString());
    }

    @Test
    @DisplayName("sendAlimtalk — PHONE 모드 + 번호 누락: PHONE_NUMBER_REQUIRED, kakao 호출 0회")
    void sendAlimtalk_phoneMode_missingPhone_returnsPhoneNumberRequired() {
        TestAlimtalkRequest request = TestAlimtalkRequest.builder()
            .recipientMode(TestNotificationRecipientMode.PHONE)
            .phoneNumber(null)
            .templateCode("KA01TP250101000000000000000099")
            .templateParams(new HashMap<>())
            .reason("PHONE 모드 알림톡 — 빈 phoneNumber 검증")
            .templateSource("SOLAPI")
            .build();

        TestNotificationResponse response = service.sendAlimtalk(TENANT_ID, buildSender(), request);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getErrorCode())
            .isEqualTo(AdminTestNotificationServiceImpl.ERROR_CODE_PHONE_NUMBER_REQUIRED);
        verify(dispatchHelper, never())
            .dispatchAlimtalk(anyString(), anyString(), anyMap());
    }

    @Test
    @DisplayName("회귀 — SELF 모드 SMS: 본인 전화번호 복호화 후 디스패치(PHONE 추가 영향 없음)")
    void sendSms_selfMode_stillSucceeds() {
        AdminTestNotificationLog savedLog = newLog(303L, TestNotificationChannel.SMS,
            TestNotificationRecipientMode.SELF);
        when(logger.logAttempt(eq(TENANT_ID), eq(SENDER_USER_ID), eq(SENDER_LOGIN),
                eq(TestNotificationRecipientMode.SELF), eq(SENDER_USER_ID), anyString(),
                eq(TestNotificationChannel.SMS), isNull(), isNull(), anyString(), anyString()))
            .thenReturn(savedLog);
        when(encryptionUtil.decrypt(eq(SENDER_PHONE_PLAIN))).thenReturn(SENDER_PHONE_PLAIN);
        when(dispatchHelper.dispatchSms(eq(SENDER_PHONE_PLAIN), anyString()))
            .thenReturn(new NotificationDispatchHelper.DispatchResult(true, null, null, null, null));

        TestSmsRequest request = TestSmsRequest.builder()
            .recipientMode(TestNotificationRecipientMode.SELF)
            .message("[회귀] SELF 모드 정상")
            .reason("SELF 회귀")
            .build();

        TestNotificationResponse response = service.sendSms(TENANT_ID, buildSender(), request);

        assertThat(response.isSuccess()).isTrue();
        verify(dispatchHelper).dispatchSms(eq(SENDER_PHONE_PLAIN), eq("[회귀] SELF 모드 정상"));
    }

    private static User buildSender() {
        User user = new User();
        user.setId(SENDER_USER_ID);
        user.setUserId(SENDER_LOGIN);
        user.setTenantId(TENANT_ID);
        user.setPhone(SENDER_PHONE_PLAIN);
        return user;
    }

    private static AdminTestNotificationLog newLog(Long id, TestNotificationChannel channel,
            TestNotificationRecipientMode mode) {
        AdminTestNotificationLog log = AdminTestNotificationLog.builder()
            .sentByUserId(SENDER_USER_ID)
            .sentByUsername(SENDER_LOGIN)
            .sentAt(java.time.LocalDateTime.now())
            .recipientMode(mode)
            .recipientPhoneMasked("010****5678")
            .channel(channel)
            .reason("test")
            .success(Boolean.FALSE)
            .build();
        log.setId(id);
        return log;
    }
}
