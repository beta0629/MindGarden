package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.config.BatchNotificationProperties;
import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.NotificationBatchSendLog;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.NotificationBatchSendLogRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserPrivacyConsentRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BatchNotificationDispatchService.DispatchOutcome;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContext;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link BatchNotificationDispatchServiceImpl} 단위 테스트.
 *
 * <p>커버 영역:
 * <ul>
 *   <li>5종 템플릿 정상 발송 흐름 (D-2 / IMMEDIATE_SINGLE / IMMEDIATE_LATE / SESSION_ENDING_SOON / SESSION_RENEW_PROMPT).</li>
 *   <li>멱등성 — UNIQUE 키 사전 가드, INSERT 충돌 skip.</li>
 *   <li>마케팅 동의 가드 + 첫 실행 cutoff (SESSION_RENEW_PROMPT 한정).</li>
 *   <li>SMS 폴백 정책 F1/F2 — 정보성은 폴백, 마케팅(SESSION_RENEW_PROMPT)은 미폴백.</li>
 *   <li>알림톡 매핑 누락(TEMPLATE_NOT_MAPPED) — 정보성 SMS 폴백, 마케팅 미발송.</li>
 *   <li>드라이런 모드 — 외부 호출 없이 카운트만.</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("배치 알림 디스패치 — 5종 템플릿 + SMS 폴백 정책")
class BatchNotificationDispatchServiceImplTest {

    private static final String TENANT_ID = "tenant-incheon-counseling-001";
    private static final Long SCHEDULE_ID = 1001L;
    private static final Long MAPPING_ID = 2001L;
    private static final Long CLIENT_ID = 3001L;
    private static final Long CONSULTANT_ID = 4001L;
    private static final Long LOG_ID = 5001L;
    private static final String PHONE = "01012345678";
    private static final String ALIMTALK_TEMPLATE_ID = "KA01TP000000000000ABCDEFG";

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserPrivacyConsentRepository userPrivacyConsentRepository;
    @Mock
    private NotificationBatchSendLogRepository sendLogRepository;
    @Mock
    private NotificationBatchSendLogger sendLogger;
    @Mock
    private NotificationDispatchHelper dispatchHelper;
    @Mock
    private AlimtalkTemplateMappingResolver templateMappingResolver;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private com.coresolution.consultation.service.SmsTemplateService smsTemplateService;

    private BatchNotificationProperties properties;
    private BatchNotificationDispatchServiceImpl service;

    @BeforeEach
    void setUp() {
        properties = new BatchNotificationProperties();
        // 테스트 cutoff — 2024-01-01 ≤ endDate 이면 통과.
        properties.setSessionRenewDeployCutoff(LocalDate.of(2024, 1, 1));
        // 기본값(2026-05-26 P0 SMS 긴급 차단, V20260602_001) 은 false 이지만, 본 테스트군은
        // SMS_TEMPLATE 시드 적용 환경의 F1/F2/F3 분기를 검증하므로 코드 안전망을 켜서
        // SmsTemplateService.renderForType 미스텁 시 정적 본문으로 폴백하도록 한다.
        // 시드 비활성 회귀 시나리오는 별도 테스트에서 false 로 명시 override 한다.
        properties.setSmsStaticFallbackEnabled(true);
        service = new BatchNotificationDispatchServiceImpl(
            scheduleRepository, mappingRepository, userRepository,
            userPrivacyConsentRepository, sendLogRepository, sendLogger,
            dispatchHelper, templateMappingResolver, encryptionUtil, properties,
            smsTemplateService);

        // 2단계 게이트(글로벌 + 종목별, V20260603_002 + SmsDispatchFlagKeys) — 본 테스트군은 게이트 ON
        // 동작 시나리오를 검증하므로 setUp 에서 일괄 ON 으로 stub 한다. 게이트 OFF 회귀 시나리오는
        // 별도 테스트에서 명시 override 한다.
        when(smsTemplateService.isAutoDispatchEnabledFor(anyString(), anyString()))
            .thenReturn(true);
        when(smsTemplateService.isGlobalAutoDispatchEnabled()).thenReturn(true);

        TenantContext.setTenantId(TENANT_ID);

        // 복호화: 입력값을 그대로 반환 (테스트 단순화).
        when(encryptionUtil.decrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("D-2 발송: 알림톡 매핑 존재 + 발송 성공 → ALIMTALK_SENT")
    void dispatchReservationReminderD2_alimtalkSent() {
        givenScheduleAndUsers(SCHEDULE_ID, 3);
        givenMappingForSchedule(MAPPING_ID, 10, 7);
        givenIdempotencyNotExists();
        givenLoggerInsertSucceeds();
        givenAlimtalkMappingResolved();
        givenAlimtalkDispatchSuccess();

        DispatchOutcome outcome = service.dispatchReservationReminderD2(SCHEDULE_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.ALIMTALK_SENT);
        assertThat(outcome.channelUsed()).isEqualTo(BatchNotificationTemplateCodes.CHANNEL_ALIMTALK);
        assertThat(outcome.fallbackToSms()).isFalse();
        verify(sendLogger).updateResult(eq(LOG_ID), eq(true),
            eq(BatchNotificationTemplateCodes.CHANNEL_ALIMTALK),
            eq(false), eq(null), eq(null), anyString(), anyString());
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
    }

    @Test
    @DisplayName("F1 정보성 — 알림톡 실패 + SMS 폴백 성공 → SMS_FALLBACK_SENT, fallback_to_sms=true")
    void dispatch_whenAlimtalkFailsAndInfoTemplate_fallbacksToSms() {
        givenScheduleAndUsers(SCHEDULE_ID, 3);
        givenMappingForSchedule(MAPPING_ID, 10, 7);
        givenIdempotencyNotExists();
        givenLoggerInsertSucceeds();
        givenAlimtalkMappingResolved();
        givenAlimtalkDispatchFailure("HTTP_500", "solapi internal error");
        givenSmsDispatchSuccess();

        DispatchOutcome outcome = service.dispatchReservationReminderD2(SCHEDULE_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SMS_FALLBACK_SENT);
        assertThat(outcome.channelUsed()).isEqualTo(BatchNotificationTemplateCodes.CHANNEL_SMS);
        assertThat(outcome.fallbackToSms()).isTrue();
        verify(dispatchHelper).dispatchSms(eq(PHONE), anyString());
        verify(sendLogger).updateResult(eq(LOG_ID), eq(true),
            eq(BatchNotificationTemplateCodes.CHANNEL_SMS),
            eq(true), anyString(), anyString(), any(), any());
    }

    @Test
    @DisplayName("F2 마케팅 — SESSION_RENEW_PROMPT 알림톡 실패 → SMS 폴백 skip, fallback_to_sms=false")
    void dispatch_whenAlimtalkFailsAndMarketingTemplate_skipsFallback() {
        ConsultantClientMapping mapping = givenMapping(MAPPING_ID, 10, 0,
            MappingStatus.SESSIONS_EXHAUSTED, LocalDateTime.of(2026, 5, 30, 18, 0));
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
            .thenReturn(Optional.of(mapping));
        when(userPrivacyConsentRepository
            .findLatestMarketingConsentByTenantIdAndUserId(TENANT_ID, CLIENT_ID))
            .thenReturn(Optional.of(true));
        givenIdempotencyNotExists();
        givenLoggerInsertSucceeds();
        givenAlimtalkMappingResolved();
        givenAlimtalkDispatchFailure("RECEIVER_BLOCKED", "수신거부 사용자");

        DispatchOutcome outcome = service.dispatchSessionRenewPrompt(MAPPING_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.FAILED);
        assertThat(outcome.channelUsed()).isEqualTo(BatchNotificationTemplateCodes.CHANNEL_ALIMTALK);
        assertThat(outcome.fallbackToSms()).isFalse();
        assertThat(outcome.errorCode())
            .isEqualTo(BatchNotificationTemplateCodes.ERROR_CODE_MARKETING_NO_FALLBACK);
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
        verify(sendLogger).updateResult(eq(LOG_ID), eq(false),
            eq(BatchNotificationTemplateCodes.CHANNEL_ALIMTALK),
            eq(false),
            eq(BatchNotificationTemplateCodes.ERROR_CODE_MARKETING_NO_FALLBACK),
            anyString(), any(), any());
    }

    @Test
    @DisplayName("F1 정보성 — 알림톡 매핑 누락(TEMPLATE_NOT_MAPPED) → SMS 폴백 진행")
    void dispatch_whenAlimtalkTemplateNotMapped_fallbacksToSmsForInfo() {
        givenScheduleAndUsers(SCHEDULE_ID, 0);
        givenMappingForSchedule(MAPPING_ID, 1, 0);
        givenIdempotencyNotExists();
        givenLoggerInsertSucceeds();
        when(templateMappingResolver.resolveSolapiTemplateId(eq(TENANT_ID), anyString()))
            .thenReturn(null);
        givenSmsDispatchSuccess();

        DispatchOutcome outcome = service.dispatchReservationImmediateSingle(SCHEDULE_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SMS_ONLY_SENT);
        assertThat(outcome.channelUsed()).isEqualTo(BatchNotificationTemplateCodes.CHANNEL_SMS);
        assertThat(outcome.fallbackToSms()).isTrue();
        verify(dispatchHelper, never()).dispatchAlimtalk(anyString(), anyString(), anyMap());
        verify(dispatchHelper).dispatchSms(eq(PHONE), anyString());
    }

    @Test
    @DisplayName("F2 마케팅 — 매핑 누락 시에도 SMS 폴백 skip")
    void dispatch_whenMarketingTemplateNotMapped_skipsFallback() {
        ConsultantClientMapping mapping = givenMapping(MAPPING_ID, 10, 0,
            MappingStatus.SESSIONS_EXHAUSTED, LocalDateTime.of(2026, 5, 30, 18, 0));
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
            .thenReturn(Optional.of(mapping));
        when(userPrivacyConsentRepository
            .findLatestMarketingConsentByTenantIdAndUserId(TENANT_ID, CLIENT_ID))
            .thenReturn(Optional.of(true));
        givenIdempotencyNotExists();
        givenLoggerInsertSucceeds();
        when(templateMappingResolver.resolveSolapiTemplateId(eq(TENANT_ID), anyString()))
            .thenReturn(null);

        DispatchOutcome outcome = service.dispatchSessionRenewPrompt(MAPPING_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.FAILED);
        assertThat(outcome.fallbackToSms()).isFalse();
        assertThat(outcome.errorCode())
            .isEqualTo(BatchNotificationTemplateCodes.ERROR_CODE_MARKETING_NO_FALLBACK);
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
    }

    @Test
    @DisplayName("멱등성 — 동일 키 사전 가드 시 SKIPPED_DUPLICATE 반환, 외부 호출 없음")
    void dispatch_whenIdempotencyHits_skips() {
        givenScheduleAndUsers(SCHEDULE_ID, 3);
        when(sendLogRepository.existsByIdempotencyKey(
            eq(TENANT_ID),
            eq(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE),
            eq(BatchNotificationTemplateCodes.TARGET_TYPE_SCHEDULE),
            eq(SCHEDULE_ID), eq(CLIENT_ID))).thenReturn(true);
        when(sendLogRepository.findByIdempotencyKey(
            eq(TENANT_ID),
            eq(BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE),
            eq(BatchNotificationTemplateCodes.TARGET_TYPE_SCHEDULE),
            eq(SCHEDULE_ID), eq(CLIENT_ID)))
            .thenReturn(Optional.of(buildLog()));

        DispatchOutcome outcome = service.dispatchReservationImmediateLate(SCHEDULE_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_DUPLICATE);
        verify(dispatchHelper, never()).dispatchAlimtalk(anyString(), anyString(), anyMap());
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
    }

    @Test
    @DisplayName("동시성 멱등 — logger.logAttempt 가 UNIQUE 충돌로 null 반환 시 SKIPPED_DUPLICATE")
    void dispatch_whenConcurrentInsertConflict_skips() {
        givenScheduleAndUsers(SCHEDULE_ID, 3);
        givenIdempotencyNotExists();
        when(sendLogger.logAttempt(anyString(), anyString(), anyString(), anyLong(),
            anyLong(), anyString())).thenReturn(null);

        DispatchOutcome outcome = service.dispatchReservationImmediateSingle(SCHEDULE_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_DUPLICATE);
        verify(dispatchHelper, never()).dispatchAlimtalk(anyString(), anyString(), anyMap());
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
    }

    @Test
    @DisplayName("수신자 전화번호 누락 → SKIPPED_VALIDATION + RECIPIENT_PHONE_MISSING")
    void dispatch_whenRecipientPhoneMissing_skipsValidation() {
        Schedule schedule = buildSchedule(SCHEDULE_ID, LocalDate.now().plusDays(2));
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID))
            .thenReturn(Optional.of(schedule));
        User clientNoPhone = buildUser(CLIENT_ID, "클라이언트", null);
        when(userRepository.findByTenantIdAndIdIgnoringDeleted(TENANT_ID, CLIENT_ID))
            .thenReturn(Optional.of(clientNoPhone));
        when(userRepository.findByTenantIdAndIdIgnoringDeleted(TENANT_ID, CONSULTANT_ID))
            .thenReturn(Optional.of(buildUser(CONSULTANT_ID, "김상담", "01099998888")));

        DispatchOutcome outcome = service.dispatchReservationReminderD2(SCHEDULE_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_VALIDATION);
        assertThat(outcome.errorCode())
            .isEqualTo(BatchNotificationTemplateCodes.ERROR_CODE_RECIPIENT_PHONE_MISSING);
        verify(sendLogger, never()).logAttempt(anyString(), anyString(), anyString(),
            anyLong(), anyLong(), anyString());
    }

    @Test
    @DisplayName("SESSION_RENEW_PROMPT 마케팅 동의 false → SKIPPED_VALIDATION + MARKETING_CONSENT_REQUIRED")
    void dispatchSessionRenewPrompt_whenMarketingConsentFalse_skips() {
        ConsultantClientMapping mapping = givenMapping(MAPPING_ID, 10, 0,
            MappingStatus.SESSIONS_EXHAUSTED, LocalDateTime.of(2026, 5, 30, 18, 0));
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
            .thenReturn(Optional.of(mapping));
        when(userPrivacyConsentRepository
            .findLatestMarketingConsentByTenantIdAndUserId(TENANT_ID, CLIENT_ID))
            .thenReturn(Optional.of(false));

        DispatchOutcome outcome = service.dispatchSessionRenewPrompt(MAPPING_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_VALIDATION);
        assertThat(outcome.errorCode())
            .isEqualTo(BatchNotificationTemplateCodes.ERROR_CODE_MARKETING_CONSENT_REQUIRED);
        verify(dispatchHelper, never()).dispatchAlimtalk(anyString(), anyString(), anyMap());
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
    }

    @Test
    @DisplayName("SESSION_RENEW_PROMPT 첫 실행 cutoff 이전 → SKIPPED_VALIDATION + DEPLOY_CUTOFF_BEFORE")
    void dispatchSessionRenewPrompt_whenBeforeCutoff_skips() {
        properties.setSessionRenewDeployCutoff(LocalDate.of(2026, 12, 31));
        ConsultantClientMapping mapping = givenMapping(MAPPING_ID, 10, 0,
            MappingStatus.SESSIONS_EXHAUSTED, LocalDateTime.of(2026, 5, 30, 18, 0));
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
            .thenReturn(Optional.of(mapping));

        DispatchOutcome outcome = service.dispatchSessionRenewPrompt(MAPPING_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_VALIDATION);
        assertThat(outcome.errorCode())
            .isEqualTo(BatchNotificationTemplateCodes.ERROR_CODE_DEPLOY_CUTOFF_BEFORE);
        verify(userPrivacyConsentRepository, never())
            .findLatestMarketingConsentByTenantIdAndUserId(anyString(), anyLong());
    }

    @Test
    @DisplayName("SESSION_ENDING_SOON — 잔여 1회기 진입 + 알림톡 성공 → ALIMTALK_SENT")
    void dispatchSessionEndingSoon_alimtalkSent() {
        ConsultantClientMapping mapping = givenMapping(MAPPING_ID, 10, 1,
            MappingStatus.ACTIVE, null);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
            .thenReturn(Optional.of(mapping));
        givenIdempotencyNotExists();
        givenLoggerInsertSucceeds();
        givenAlimtalkMappingResolved();
        givenAlimtalkDispatchSuccess();

        DispatchOutcome outcome = service.dispatchSessionEndingSoon(MAPPING_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.ALIMTALK_SENT);
        ArgumentCaptor<String> templateIdCaptor = ArgumentCaptor.forClass(String.class);
        verify(dispatchHelper).dispatchAlimtalk(eq(PHONE), templateIdCaptor.capture(), anyMap());
        assertThat(templateIdCaptor.getValue()).isEqualTo(ALIMTALK_TEMPLATE_ID);
    }

    @Test
    @DisplayName("드라이런 — 알림톡/SMS 호출 없이 DRY_RUN 반환")
    void dispatch_whenDryRun_returnsDryRun() {
        properties.setDryRun(true);
        givenScheduleAndUsers(SCHEDULE_ID, 3);
        givenMappingForSchedule(MAPPING_ID, 10, 7);

        DispatchOutcome outcome = service.dispatchReservationReminderD2(SCHEDULE_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.DRY_RUN);
        verify(dispatchHelper, never()).dispatchAlimtalk(anyString(), anyString(), anyMap());
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
        verify(sendLogger, never()).logAttempt(anyString(), anyString(), anyString(),
            anyLong(), anyLong(), anyString());
    }

    @Test
    @DisplayName("CLIENT_WELCOME_FIRST — 신규 매칭 + 알림톡 성공 → ALIMTALK_SENT, target_type=USER")
    void dispatchClientWelcomeFirst_whenNewMapping_sendsWelcome() {
        ConsultantClientMapping mapping = givenMapping(MAPPING_ID, 10, 10,
            MappingStatus.ACTIVE, null);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
            .thenReturn(Optional.of(mapping));
        givenIdempotencyNotExists();
        givenLoggerInsertSucceeds();
        givenAlimtalkMappingResolved();
        givenAlimtalkDispatchSuccess();

        DispatchOutcome outcome = service.dispatchClientWelcomeFirst(MAPPING_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.ALIMTALK_SENT);
        // target_type=USER, target_id=client_id 로 INSERT 되었는지 확인.
        verify(sendLogger).logAttempt(eq(TENANT_ID),
            eq(BatchNotificationTemplateCodes.CLIENT_WELCOME_FIRST),
            eq(BatchNotificationTemplateCodes.TARGET_TYPE_USER),
            eq(CLIENT_ID), eq(CLIENT_ID), anyString());
        // 변수 매핑에 contactPhone 이 포함되었는지 확인.
        ArgumentCaptor<java.util.Map<String, String>> paramsCaptor =
            ArgumentCaptor.forClass(java.util.Map.class);
        verify(dispatchHelper).dispatchAlimtalk(eq(PHONE), anyString(), paramsCaptor.capture());
        assertThat(paramsCaptor.getValue())
            .containsKey(BatchNotificationTemplateCodes.VAR_CONTACT_PHONE);
    }

    @Test
    @DisplayName("CLIENT_WELCOME_FIRST — 동일 user 재호출 → 멱등 검사로 SKIPPED_DUPLICATE")
    void dispatchClientWelcomeFirst_whenAlreadySentForUser_skipsIdempotent() {
        ConsultantClientMapping mapping = givenMapping(MAPPING_ID, 10, 10,
            MappingStatus.ACTIVE, null);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
            .thenReturn(Optional.of(mapping));
        when(sendLogRepository.existsByIdempotencyKey(eq(TENANT_ID),
            eq(BatchNotificationTemplateCodes.CLIENT_WELCOME_FIRST),
            eq(BatchNotificationTemplateCodes.TARGET_TYPE_USER),
            eq(CLIENT_ID), eq(CLIENT_ID))).thenReturn(true);
        when(sendLogRepository.findByIdempotencyKey(eq(TENANT_ID),
            eq(BatchNotificationTemplateCodes.CLIENT_WELCOME_FIRST),
            eq(BatchNotificationTemplateCodes.TARGET_TYPE_USER),
            eq(CLIENT_ID), eq(CLIENT_ID)))
            .thenReturn(Optional.of(buildLog()));

        DispatchOutcome outcome = service.dispatchClientWelcomeFirst(MAPPING_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_DUPLICATE);
        verify(dispatchHelper, never()).dispatchAlimtalk(anyString(), anyString(), anyMap());
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
    }

    @Test
    @DisplayName("INITIAL_GUIDE — 첫 예약(count=1) + 오프라인(FACE_TO_FACE) → INITIAL_GUIDE_OFFLINE 발송")
    void dispatchInitialGuide_whenFirstScheduleAndOffline_sendsOfflineTemplate() {
        Schedule schedule = buildSchedule(SCHEDULE_ID, LocalDate.now().plusDays(3));
        schedule.setConsultationMethod("FACE_TO_FACE");
        schedule.setConsultationLocation("서울 강남구 테헤란로 123 마인드가든 강남점");
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID))
            .thenReturn(Optional.of(schedule));
        when(scheduleRepository.countByClientId(TENANT_ID, CLIENT_ID)).thenReturn(1L);
        when(userRepository.findByTenantIdAndIdIgnoringDeleted(TENANT_ID, CLIENT_ID))
            .thenReturn(Optional.of(buildUser(CLIENT_ID, "홍길동", PHONE)));
        when(userRepository.findByTenantIdAndIdIgnoringDeleted(TENANT_ID, CONSULTANT_ID))
            .thenReturn(Optional.of(buildUser(CONSULTANT_ID, "김상담", "01099998888")));
        when(sendLogRepository.existsByIdempotencyKeyAnyTemplate(eq(TENANT_ID),
            eq(BatchNotificationTemplateCodes.INITIAL_GUIDE_CODES),
            eq(BatchNotificationTemplateCodes.TARGET_TYPE_USER),
            eq(CLIENT_ID), eq(CLIENT_ID))).thenReturn(false);
        givenLoggerInsertSucceeds();
        givenAlimtalkMappingResolved();
        givenAlimtalkDispatchSuccess();

        DispatchOutcome outcome = service.dispatchInitialGuide(SCHEDULE_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.ALIMTALK_SENT);
        verify(sendLogger).logAttempt(eq(TENANT_ID),
            eq(BatchNotificationTemplateCodes.INITIAL_GUIDE_OFFLINE),
            eq(BatchNotificationTemplateCodes.TARGET_TYPE_USER),
            eq(CLIENT_ID), eq(CLIENT_ID), anyString());
    }

    @Test
    @DisplayName("INITIAL_GUIDE — 첫 예약 + 온라인(ONLINE) → INITIAL_GUIDE_ONLINE + 멱등키 OFFLINE/ONLINE 공유 검사")
    void dispatchInitialGuide_whenFirstScheduleAndOnline_sendsOnlineTemplate() {
        Schedule schedule = buildSchedule(SCHEDULE_ID, LocalDate.now().plusDays(3));
        schedule.setConsultationMethod("ONLINE");
        schedule.setConsultationLocation("https://meet.example.com/abc-defg");
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID))
            .thenReturn(Optional.of(schedule));
        when(scheduleRepository.countByClientId(TENANT_ID, CLIENT_ID)).thenReturn(1L);
        when(userRepository.findByTenantIdAndIdIgnoringDeleted(TENANT_ID, CLIENT_ID))
            .thenReturn(Optional.of(buildUser(CLIENT_ID, "홍길동", PHONE)));
        when(userRepository.findByTenantIdAndIdIgnoringDeleted(TENANT_ID, CONSULTANT_ID))
            .thenReturn(Optional.of(buildUser(CONSULTANT_ID, "김상담", "01099998888")));
        when(sendLogRepository.existsByIdempotencyKeyAnyTemplate(eq(TENANT_ID),
            eq(BatchNotificationTemplateCodes.INITIAL_GUIDE_CODES),
            eq(BatchNotificationTemplateCodes.TARGET_TYPE_USER),
            eq(CLIENT_ID), eq(CLIENT_ID))).thenReturn(false);
        givenLoggerInsertSucceeds();
        givenAlimtalkMappingResolved();
        givenAlimtalkDispatchSuccess();

        DispatchOutcome outcome = service.dispatchInitialGuide(SCHEDULE_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.ALIMTALK_SENT);
        verify(sendLogger).logAttempt(eq(TENANT_ID),
            eq(BatchNotificationTemplateCodes.INITIAL_GUIDE_ONLINE),
            eq(BatchNotificationTemplateCodes.TARGET_TYPE_USER),
            eq(CLIENT_ID), eq(CLIENT_ID), anyString());
        ArgumentCaptor<java.util.Map<String, String>> paramsCaptor =
            ArgumentCaptor.forClass(java.util.Map.class);
        verify(dispatchHelper).dispatchAlimtalk(eq(PHONE), anyString(), paramsCaptor.capture());
        assertThat(paramsCaptor.getValue())
            .containsEntry(BatchNotificationTemplateCodes.VAR_ONLINE_LINK,
                "https://meet.example.com/abc-defg");
    }

    @Test
    @DisplayName("INITIAL_GUIDE — 두 번째 이상 예약(count=2) → SKIPPED_VALIDATION + NOT_FIRST_SCHEDULE")
    void dispatchInitialGuide_whenSecondSchedule_skips() {
        Schedule schedule = buildSchedule(SCHEDULE_ID, LocalDate.now().plusDays(3));
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID))
            .thenReturn(Optional.of(schedule));
        when(scheduleRepository.countByClientId(TENANT_ID, CLIENT_ID)).thenReturn(2L);

        DispatchOutcome outcome = service.dispatchInitialGuide(SCHEDULE_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SKIPPED_VALIDATION);
        assertThat(outcome.errorCode())
            .isEqualTo(BatchNotificationTemplateCodes.ERROR_CODE_NOT_FIRST_SCHEDULE);
        verify(userRepository, never()).findByTenantIdAndIdIgnoringDeleted(anyString(), anyLong());
        verify(dispatchHelper, never()).dispatchAlimtalk(anyString(), anyString(), anyMap());
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
    }

    @Test
    @DisplayName("SMS 폴백 본문 — [마인드가든] prefix 미포함 (2026-05-23 라운드 정착)")
    void dispatch_smsFallbackBody_doesNotIncludeMindGardenPrefix() {
        givenScheduleAndUsers(SCHEDULE_ID, 3);
        givenMappingForSchedule(MAPPING_ID, 10, 7);
        givenIdempotencyNotExists();
        givenLoggerInsertSucceeds();
        givenAlimtalkMappingResolved();
        givenAlimtalkDispatchFailure("HTTP_500", "alimtalk down");
        givenSmsDispatchSuccess();

        DispatchOutcome outcome = service.dispatchReservationReminderD2(SCHEDULE_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SMS_FALLBACK_SENT);
        ArgumentCaptor<String> smsBodyCaptor = ArgumentCaptor.forClass(String.class);
        verify(dispatchHelper).dispatchSms(eq(PHONE), smsBodyCaptor.capture());
        // 발신 프로필명이 통신사 단에서 prefix 로 표시되므로 본문에는 [마인드가든] 미포함.
        assertThat(smsBodyCaptor.getValue())
            .doesNotContain("[마인드가든]")
            .contains("상담 예약 안내");
    }

    @Test
    @DisplayName("SMS 폴백 본문 — CLIENT_WELCOME_FIRST 도 prefix 미포함 + 내담자 이름 포함")
    void dispatchClientWelcomeFirst_smsFallbackBody_noPrefix() {
        ConsultantClientMapping mapping = givenMapping(MAPPING_ID, 10, 10,
            MappingStatus.ACTIVE, null);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
            .thenReturn(Optional.of(mapping));
        givenIdempotencyNotExists();
        givenLoggerInsertSucceeds();
        when(templateMappingResolver.resolveSolapiTemplateId(eq(TENANT_ID), anyString()))
            .thenReturn(null);
        givenSmsDispatchSuccess();

        DispatchOutcome outcome = service.dispatchClientWelcomeFirst(MAPPING_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SMS_ONLY_SENT);
        ArgumentCaptor<String> smsBodyCaptor = ArgumentCaptor.forClass(String.class);
        verify(dispatchHelper).dispatchSms(eq(PHONE), smsBodyCaptor.capture());
        assertThat(smsBodyCaptor.getValue())
            .doesNotContain("[마인드가든]")
            .contains("마인드가든에 오신 것을 환영합니다");
    }

    @Test
    @DisplayName("알림톡 + SMS 모두 실패(정보성) → FAILED, channel=ALIMTALK 보존, fallback_to_sms=true")
    void dispatch_whenBothChannelsFail_recordsFailure() {
        givenScheduleAndUsers(SCHEDULE_ID, 3);
        givenMappingForSchedule(MAPPING_ID, 10, 7);
        givenIdempotencyNotExists();
        givenLoggerInsertSucceeds();
        givenAlimtalkMappingResolved();
        givenAlimtalkDispatchFailure("HTTP_500", "alimtalk 5xx");
        when(dispatchHelper.dispatchSms(eq(PHONE), anyString()))
            .thenReturn(new NotificationDispatchHelper.DispatchResult(
                false, BatchNotificationTemplateCodes.ERROR_CODE_SEND_FAILED,
                "sms provider not configured", null, null));

        DispatchOutcome outcome = service.dispatchReservationReminderD2(SCHEDULE_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.FAILED);
        assertThat(outcome.fallbackToSms()).isTrue();
        assertThat(outcome.channelUsed())
            .isEqualTo(BatchNotificationTemplateCodes.CHANNEL_ALIMTALK);
        assertThat(outcome.errorCode())
            .isEqualTo(BatchNotificationTemplateCodes.ERROR_CODE_SEND_FAILED);
    }

    // ============================================================
    // V20260602_001 — Phase 2 P0 SMS 긴급 차단 회귀 테스트
    //
    // SMS_TEMPLATE 시드(V20260529_004) is_active=FALSE + 코드 안전망 비활성(기본 false)
    // 시나리오에서 BatchNotificationDispatchServiceImpl 가 SMS 발송을 skip 하고
    // FAILED + TEMPLATE_NOT_MAPPED 로 기록하는지 검증한다.
    // ============================================================

    @Test
    @DisplayName("V20260602_001 — SMS_TEMPLATE 시드 비활성 + 코드 안전망 비활성(기본) → SMS 폴백 skip + FAILED + TEMPLATE_NOT_MAPPED")
    void dispatch_whenSmsTemplateInactiveAndStaticFallbackDisabled_skipsSms() {
        // 기본 false 정책 명시 — 운영(V20260602_001) 과 동일.
        properties.setSmsStaticFallbackEnabled(false);
        givenScheduleAndUsers(SCHEDULE_ID, 3);
        givenMappingForSchedule(MAPPING_ID, 10, 7);
        givenIdempotencyNotExists();
        givenLoggerInsertSucceeds();
        givenAlimtalkMappingResolved();
        givenAlimtalkDispatchFailure("HTTP_500", "alimtalk 5xx");
        // SMS_TEMPLATE 시드 비활성 시뮬레이션 — SmsTemplateService 가 Optional.empty 반환.
        when(smsTemplateService.renderForType(anyString(), anyString(), anyMap(), any()))
            .thenReturn(Optional.empty());

        DispatchOutcome outcome = service.dispatchReservationReminderD2(SCHEDULE_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.FAILED);
        assertThat(outcome.fallbackToSms()).isFalse();
        assertThat(outcome.channelUsed())
            .isEqualTo(BatchNotificationTemplateCodes.CHANNEL_ALIMTALK);
        assertThat(outcome.errorCode())
            .isEqualTo(BatchNotificationTemplateCodes.ERROR_CODE_TEMPLATE_NOT_MAPPED);
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
        verify(sendLogger).updateResult(eq(LOG_ID), eq(false),
            eq(BatchNotificationTemplateCodes.CHANNEL_ALIMTALK),
            eq(false),
            eq(BatchNotificationTemplateCodes.ERROR_CODE_TEMPLATE_NOT_MAPPED),
            anyString(), any(), any());
    }

    @Test
    @DisplayName("V20260602_001 — 알림톡 매핑 누락 + SMS_TEMPLATE 시드 비활성 → 알림톡 미시도 + SMS skip")
    void dispatch_whenBothAlimtalkAndSmsSeedAbsent_skipsAllChannels() {
        properties.setSmsStaticFallbackEnabled(false);
        givenScheduleAndUsers(SCHEDULE_ID, 0);
        givenMappingForSchedule(MAPPING_ID, 1, 0);
        givenIdempotencyNotExists();
        givenLoggerInsertSucceeds();
        when(templateMappingResolver.resolveSolapiTemplateId(eq(TENANT_ID), anyString()))
            .thenReturn(null);
        when(smsTemplateService.renderForType(anyString(), anyString(), anyMap(), any()))
            .thenReturn(Optional.empty());

        DispatchOutcome outcome = service.dispatchReservationImmediateSingle(SCHEDULE_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.FAILED);
        assertThat(outcome.errorCode())
            .isEqualTo(BatchNotificationTemplateCodes.ERROR_CODE_TEMPLATE_NOT_MAPPED);
        verify(dispatchHelper, never()).dispatchAlimtalk(anyString(), anyString(), anyMap());
        verify(dispatchHelper, never()).dispatchSms(anyString(), anyString());
    }

    @Test
    @DisplayName("V20260602_001 — SMS_TEMPLATE 시드 활성 + 알림톡 실패 → SMS 폴백 정상 발송 (seed body, no static fallback)")
    void dispatch_whenSmsTemplateActiveAndStaticFallbackDisabled_sendsSeedBody() {
        properties.setSmsStaticFallbackEnabled(false);
        givenScheduleAndUsers(SCHEDULE_ID, 3);
        givenMappingForSchedule(MAPPING_ID, 10, 7);
        givenIdempotencyNotExists();
        givenLoggerInsertSucceeds();
        givenAlimtalkMappingResolved();
        givenAlimtalkDispatchFailure("HTTP_500", "alimtalk 5xx");
        when(smsTemplateService.renderForType(
                eq(BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2),
                anyString(), anyMap(), any()))
            .thenReturn(Optional.of("[테넌트 override] D-2 예약 안내 SMS 본문"));
        givenSmsDispatchSuccess();

        DispatchOutcome outcome = service.dispatchReservationReminderD2(SCHEDULE_ID);

        assertThat(outcome.status()).isEqualTo(DispatchOutcome.Status.SMS_FALLBACK_SENT);
        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
        verify(dispatchHelper).dispatchSms(eq(PHONE), bodyCaptor.capture());
        assertThat(bodyCaptor.getValue())
            .isEqualTo("[테넌트 override] D-2 예약 안내 SMS 본문");
    }

    // ---------------------------------------------------------------- fixtures

    private void givenScheduleAndUsers(Long scheduleId, int daysFromToday) {
        Schedule schedule = buildSchedule(scheduleId, LocalDate.now().plusDays(daysFromToday));
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, scheduleId))
            .thenReturn(Optional.of(schedule));
        when(userRepository.findByTenantIdAndIdIgnoringDeleted(TENANT_ID, CLIENT_ID))
            .thenReturn(Optional.of(buildUser(CLIENT_ID, "홍길동", PHONE)));
        when(userRepository.findByTenantIdAndIdIgnoringDeleted(TENANT_ID, CONSULTANT_ID))
            .thenReturn(Optional.of(buildUser(CONSULTANT_ID, "김상담", "01099998888")));
    }

    private void givenMappingForSchedule(Long mappingId, int total, int remaining) {
        ConsultantClientMapping mapping = givenMapping(mappingId, total, remaining,
            MappingStatus.ACTIVE, null);
        when(mappingRepository
            .findActiveOrExhaustedByTenantIdAndConsultantIdAndClientId(TENANT_ID, CONSULTANT_ID, CLIENT_ID))
            .thenReturn(Optional.of(mapping));
    }

    private ConsultantClientMapping givenMapping(Long mappingId, int total, int remaining,
            MappingStatus status, LocalDateTime endDate) {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
            .consultant(buildUser(CONSULTANT_ID, "김상담", "01099998888"))
            .client(buildUser(CLIENT_ID, "홍길동", PHONE))
            .totalSessions(total)
            .remainingSessions(remaining)
            .usedSessions(total - remaining)
            .status(status)
            .startDate(LocalDateTime.now().minusDays(30))
            .endDate(endDate)
            .build();
        mapping.setId(mappingId);
        mapping.setTenantId(TENANT_ID);
        return mapping;
    }

    private void givenIdempotencyNotExists() {
        when(sendLogRepository.existsByIdempotencyKey(
            anyString(), anyString(), anyString(), anyLong(), anyLong())).thenReturn(false);
    }

    private void givenLoggerInsertSucceeds() {
        NotificationBatchSendLog logEntry = buildLog();
        when(sendLogger.logAttempt(anyString(), anyString(), anyString(),
            anyLong(), anyLong(), anyString())).thenReturn(logEntry);
    }

    private void givenAlimtalkMappingResolved() {
        when(templateMappingResolver.resolveSolapiTemplateId(eq(TENANT_ID), anyString()))
            .thenReturn(ALIMTALK_TEMPLATE_ID);
    }

    private void givenAlimtalkDispatchSuccess() {
        when(dispatchHelper.dispatchAlimtalk(eq(PHONE), anyString(), anyMap()))
            .thenReturn(new NotificationDispatchHelper.DispatchResult(
                true, null, null, "GROUP-XYZ", "MSG-XYZ"));
    }

    private void givenAlimtalkDispatchFailure(String errorCode, String errorMessage) {
        when(dispatchHelper.dispatchAlimtalk(eq(PHONE), anyString(), anyMap()))
            .thenReturn(new NotificationDispatchHelper.DispatchResult(
                false, errorCode, errorMessage, null, null));
    }

    private void givenSmsDispatchSuccess() {
        when(dispatchHelper.dispatchSms(eq(PHONE), anyString()))
            .thenReturn(new NotificationDispatchHelper.DispatchResult(
                true, null, null, null, null));
    }

    private Schedule buildSchedule(Long id, LocalDate date) {
        Schedule schedule = new Schedule();
        schedule.setId(id);
        schedule.setTenantId(TENANT_ID);
        schedule.setConsultantId(CONSULTANT_ID);
        schedule.setClientId(CLIENT_ID);
        schedule.setDate(date);
        schedule.setStartTime(LocalTime.of(14, 30));
        schedule.setEndTime(LocalTime.of(15, 30));
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setIsDeleted(false);
        return schedule;
    }

    private User buildUser(Long id, String name, String phone) {
        User user = new User();
        user.setId(id);
        user.setUserId("user-" + id);
        user.setTenantId(TENANT_ID);
        user.setName(name);
        user.setPhone(phone);
        return user;
    }

    private NotificationBatchSendLog buildLog() {
        NotificationBatchSendLog log = NotificationBatchSendLog.builder()
            .templateCode("TEST")
            .targetType("SCHEDULE")
            .targetId(SCHEDULE_ID)
            .recipientUserId(CLIENT_ID)
            .recipientPhoneMasked("010****5678")
            .channelUsed("PENDING")
            .fallbackToSms(false)
            .success(false)
            .sentAt(LocalDateTime.now())
            .build();
        log.setId(LOG_ID);
        log.setTenantId(TENANT_ID);
        return log;
    }
}
