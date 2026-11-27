package com.coresolution.consultation.service.impl;

import java.util.Map;
import com.coresolution.consultation.entity.Alert;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.AlertRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.KakaoAlimTalkService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.RefundAutoCancelNotificationService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * {@link RefundAutoCancelNotificationServiceImpl} 단위 테스트.
 *
 * <p>회기관리 운영 정책 합의서 v2(Q3=3A·보조=C) 결정: 부분 환불·강제 종료 후 회기 소진으로 미래 예약이
 * 일괄 취소되었을 때 인앱·이메일·푸시·알림톡 4채널 의무 통지가 사용자 선호도와 무관하게 발송되는지,
 * 한 채널 실패가 다른 채널 발송을 막지 않는지(예외 격리) 검증한다.</p>
 *
 * @author MindGarden
 * @since 2026-05-26
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("RefundAutoCancelNotificationServiceImpl — 4채널 의무 통지")
class RefundAutoCancelNotificationServiceImplTest {

    private static final String TENANT_ID = "tenant-test-refund-cancel";
    private static final Long MAPPING_ID = 4242L;
    private static final Long CLIENT_ID = 7777L;
    private static final int CANCEL_COUNT = 3;
    private static final String MYPAGE_URL = "/mypage/sessions";
    private static final String DECRYPTED_PHONE = "01012345678";

    @Mock private AlertRepository alertRepository;
    @Mock private EmailService emailService;
    @Mock private MobilePushDispatchService mobilePushDispatchService;
    @Mock private KakaoAlimTalkService kakaoAlimTalkService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private CommonCodeService commonCodeService;

    @InjectMocks
    private RefundAutoCancelNotificationServiceImpl service;

    private User client;

    @BeforeEach
    void setUp() {
        client = new User();
        client.setId(CLIENT_ID);
        client.setName("내담자_의무통지");
        client.setEmail("client@example.com");
        client.setPhone("encrypted-phone");
        client.setTenantId(TENANT_ID);
        // notificationPreferences = "sms_disabled,email_disabled,kakao_disabled" — 의무 통지는 우회해야 한다.
        client.setNotificationPreferences("sms_disabled,email_disabled,kakao_disabled");
    }

    @Test
    @DisplayName("4채널 모두 성공: 인앱 Alert 저장 + 이메일·푸시·알림톡 호출 + 결과 OK")
    void allChannelsSuccess() throws Exception {
        when(encryptionUtil.decrypt("encrypted-phone")).thenReturn(DECRYPTED_PHONE);
        when(emailService.sendAutoCancelNotification(eq("client@example.com"), eq(CANCEL_COUNT), eq(MYPAGE_URL)))
                .thenReturn(true);
        when(kakaoAlimTalkService.sendAutoCancelRefund(eq(DECRYPTED_PHONE), eq(CANCEL_COUNT), eq(MYPAGE_URL)))
                .thenReturn(true);

        Map<String, String> results = service.dispatchRefundAutoCancelNotification(
                TENANT_ID, client, MAPPING_ID, CANCEL_COUNT, MYPAGE_URL);

        assertThat(results)
                .containsEntry(RefundAutoCancelNotificationService.CHANNEL_KEY_IN_APP,
                        RefundAutoCancelNotificationService.RESULT_OK)
                .containsEntry(RefundAutoCancelNotificationService.CHANNEL_KEY_EMAIL,
                        RefundAutoCancelNotificationService.RESULT_OK)
                .containsEntry(RefundAutoCancelNotificationService.CHANNEL_KEY_PUSH,
                        RefundAutoCancelNotificationService.RESULT_OK)
                .containsEntry(RefundAutoCancelNotificationService.CHANNEL_KEY_ALIMTALK,
                        RefundAutoCancelNotificationService.RESULT_OK);

        // 4채널 각각 한 번씩 호출되어야 한다 — 사용자 선호도(notificationPreferences)는 우회.
        ArgumentCaptor<Alert> alertCaptor = ArgumentCaptor.forClass(Alert.class);
        verify(alertRepository).save(alertCaptor.capture());
        Alert savedAlert = alertCaptor.getValue();
        assertThat(savedAlert.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(savedAlert.getUserId()).isEqualTo(CLIENT_ID);
        assertThat(savedAlert.getType()).isEqualTo("REFUND_AUTO_CANCEL");
        assertThat(savedAlert.getChannel()).isEqualTo("IN_APP");
        assertThat(savedAlert.getRelatedEntityId()).isEqualTo(MAPPING_ID);
        assertThat(savedAlert.getContent()).contains(String.valueOf(CANCEL_COUNT));

        verify(emailService).sendAutoCancelNotification("client@example.com", CANCEL_COUNT, MYPAGE_URL);
        verify(mobilePushDispatchService)
                .dispatchAutoCancellation(TENANT_ID, CLIENT_ID, MAPPING_ID, CANCEL_COUNT, MYPAGE_URL);
        verify(kakaoAlimTalkService).sendAutoCancelRefund(DECRYPTED_PHONE, CANCEL_COUNT, MYPAGE_URL);
    }

    @Test
    @DisplayName("알림톡만 실패해도 나머지 3채널은 OK로 발송되고 결과에 실패 사유 누적")
    void alimtalkFailureDoesNotBlockOtherChannels() throws Exception {
        when(encryptionUtil.decrypt("encrypted-phone")).thenReturn(DECRYPTED_PHONE);
        when(emailService.sendAutoCancelNotification(anyString(), anyInt(), anyString())).thenReturn(true);
        when(kakaoAlimTalkService.sendAutoCancelRefund(anyString(), anyInt(), anyString())).thenReturn(false);
        when(kakaoAlimTalkService.consumeLastErrorDetail()).thenReturn("Solapi ATA 1042");

        Map<String, String> results = service.dispatchRefundAutoCancelNotification(
                TENANT_ID, client, MAPPING_ID, CANCEL_COUNT, MYPAGE_URL);

        assertThat(results).containsEntry(RefundAutoCancelNotificationService.CHANNEL_KEY_IN_APP,
                RefundAutoCancelNotificationService.RESULT_OK);
        assertThat(results).containsEntry(RefundAutoCancelNotificationService.CHANNEL_KEY_EMAIL,
                RefundAutoCancelNotificationService.RESULT_OK);
        assertThat(results).containsEntry(RefundAutoCancelNotificationService.CHANNEL_KEY_PUSH,
                RefundAutoCancelNotificationService.RESULT_OK);
        assertThat(results.get(RefundAutoCancelNotificationService.CHANNEL_KEY_ALIMTALK))
                .startsWith(RefundAutoCancelNotificationService.RESULT_FAIL)
                .contains("Solapi ATA 1042");

        verify(alertRepository).save(any(Alert.class));
        verify(emailService).sendAutoCancelNotification(anyString(), anyInt(), anyString());
        verify(mobilePushDispatchService).dispatchAutoCancellation(anyString(), anyLong(), anyLong(), anyInt(), anyString());
        verify(kakaoAlimTalkService).sendAutoCancelRefund(anyString(), anyInt(), anyString());
    }

    @Test
    @DisplayName("푸시 예외도 격리되어 다른 채널 발송에는 영향이 없다")
    void pushExceptionIsolated() throws Exception {
        when(encryptionUtil.decrypt("encrypted-phone")).thenReturn(DECRYPTED_PHONE);
        when(emailService.sendAutoCancelNotification(anyString(), anyInt(), anyString())).thenReturn(true);
        when(kakaoAlimTalkService.sendAutoCancelRefund(anyString(), anyInt(), anyString())).thenReturn(true);
        doThrow(new RuntimeException("expo down"))
                .when(mobilePushDispatchService)
                .dispatchAutoCancellation(anyString(), anyLong(), anyLong(), anyInt(), anyString());

        Map<String, String> results = service.dispatchRefundAutoCancelNotification(
                TENANT_ID, client, MAPPING_ID, CANCEL_COUNT, MYPAGE_URL);

        assertThat(results.get(RefundAutoCancelNotificationService.CHANNEL_KEY_PUSH))
                .startsWith(RefundAutoCancelNotificationService.RESULT_FAIL)
                .contains("RuntimeException");
        // 인앱/이메일/알림톡은 OK
        assertThat(results.get(RefundAutoCancelNotificationService.CHANNEL_KEY_IN_APP))
                .isEqualTo(RefundAutoCancelNotificationService.RESULT_OK);
        assertThat(results.get(RefundAutoCancelNotificationService.CHANNEL_KEY_EMAIL))
                .isEqualTo(RefundAutoCancelNotificationService.RESULT_OK);
        assertThat(results.get(RefundAutoCancelNotificationService.CHANNEL_KEY_ALIMTALK))
                .isEqualTo(RefundAutoCancelNotificationService.RESULT_OK);
    }

    @Test
    @DisplayName("전화번호 없으면 알림톡은 SKIP(no-phone), 나머지 채널은 그대로 발송")
    void alimtalkSkippedWhenPhoneMissing() throws Exception {
        client.setPhone(null);
        when(emailService.sendAutoCancelNotification(anyString(), anyInt(), anyString())).thenReturn(true);

        Map<String, String> results = service.dispatchRefundAutoCancelNotification(
                TENANT_ID, client, MAPPING_ID, CANCEL_COUNT, MYPAGE_URL);

        assertThat(results.get(RefundAutoCancelNotificationService.CHANNEL_KEY_ALIMTALK))
                .startsWith(RefundAutoCancelNotificationService.RESULT_SKIP)
                .contains("no-phone");
        verify(kakaoAlimTalkService, never()).sendAutoCancelRefund(anyString(), anyInt(), anyString());
        verify(alertRepository).save(any(Alert.class));
        verify(emailService).sendAutoCancelNotification(anyString(), anyInt(), anyString());
        verify(mobilePushDispatchService).dispatchAutoCancellation(anyString(), anyLong(), anyLong(), anyInt(), anyString());
    }

    @Test
    @DisplayName("이메일 없으면 이메일 채널은 SKIP(no-email), 나머지 3채널은 발송")
    void emailSkippedWhenAddressMissing() throws Exception {
        client.setEmail("");
        when(encryptionUtil.decrypt("encrypted-phone")).thenReturn(DECRYPTED_PHONE);
        when(kakaoAlimTalkService.sendAutoCancelRefund(anyString(), anyInt(), anyString())).thenReturn(true);

        Map<String, String> results = service.dispatchRefundAutoCancelNotification(
                TENANT_ID, client, MAPPING_ID, CANCEL_COUNT, MYPAGE_URL);

        assertThat(results.get(RefundAutoCancelNotificationService.CHANNEL_KEY_EMAIL))
                .startsWith(RefundAutoCancelNotificationService.RESULT_SKIP)
                .contains("no-email");
        verify(emailService, never()).sendAutoCancelNotification(anyString(), anyInt(), anyString());
    }

    @Test
    @DisplayName("내담자(client) null 이면 4채널 모두 SKIP(no-client), 어떤 외부 서비스도 호출하지 않는다")
    void allSkippedWhenClientNull() {
        Map<String, String> results = service.dispatchRefundAutoCancelNotification(
                TENANT_ID, null, MAPPING_ID, CANCEL_COUNT, MYPAGE_URL);

        assertThat(results.values()).allSatisfy(v -> assertThat(v).contains("no-client"));
        verifyNoInteractions(alertRepository, emailService, mobilePushDispatchService, kakaoAlimTalkService);
    }

    @Test
    @DisplayName("tenantId 누락 시 4채널 모두 SKIP(no-tenant)")
    void allSkippedWhenTenantMissing() {
        Map<String, String> results = service.dispatchRefundAutoCancelNotification(
                "  ", client, MAPPING_ID, CANCEL_COUNT, MYPAGE_URL);

        assertThat(results.values()).allSatisfy(v -> assertThat(v).contains("no-tenant"));
        verifyNoInteractions(alertRepository, emailService, mobilePushDispatchService, kakaoAlimTalkService);
    }

    @Test
    @DisplayName("사용자 채널 선호도(notificationPreferences)가 모두 disabled 여도 4채널 발송이 시도된다 (의무 통지)")
    void preferenceBypass_mandatoryNotification() throws Exception {
        // setUp() 에서 client.notificationPreferences = "sms_disabled,email_disabled,kakao_disabled" 로 설정.
        when(encryptionUtil.decrypt("encrypted-phone")).thenReturn(DECRYPTED_PHONE);
        when(emailService.sendAutoCancelNotification(anyString(), anyInt(), anyString())).thenReturn(true);
        when(kakaoAlimTalkService.sendAutoCancelRefund(anyString(), anyInt(), anyString())).thenReturn(true);

        Map<String, String> results = service.dispatchRefundAutoCancelNotification(
                TENANT_ID, client, MAPPING_ID, CANCEL_COUNT, MYPAGE_URL);

        // 모든 채널이 disabled 선언되어 있더라도 의무 통지이므로 발송 시도가 수행되어야 한다.
        verify(alertRepository).save(any(Alert.class));
        verify(emailService).sendAutoCancelNotification(anyString(), anyInt(), anyString());
        verify(mobilePushDispatchService).dispatchAutoCancellation(anyString(), anyLong(), anyLong(), anyInt(), anyString());
        verify(kakaoAlimTalkService).sendAutoCancelRefund(anyString(), anyInt(), anyString());
        assertThat(results.values()).allSatisfy(v ->
                assertThat(v).isEqualTo(RefundAutoCancelNotificationService.RESULT_OK));
    }
}
