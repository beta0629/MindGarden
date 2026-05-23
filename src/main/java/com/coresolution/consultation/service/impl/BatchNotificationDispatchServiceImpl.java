package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.config.BatchNotificationProperties;
import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
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
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.PhoneLogMasking;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 알림 배치/이벤트 발송 트랙 A·B 디스패치 서비스 구현.
 *
 * <p>발송 로직은 기존 {@link NotificationDispatchHelper#dispatchAlimtalk} /
 * {@link NotificationDispatchHelper#dispatchSms} 를 그대로 호출한다. 본 서비스는
 * 오케스트레이션·변수 추출·SMS 폴백·멱등 로그만 담당하며, 운영 호출부
 * ({@code NotificationServiceImpl}, {@code KakaoAlimTalkServiceImpl}, {@code SmsAuthService}) 는
 * 변경하지 않는다.
 *
 * <p>발송 흐름:
 * <pre>
 * 1. 멱등 가드 (notification_batch_send_log UNIQUE 5튜플 사전 조회)
 * 2. 대상 엔티티 + 수신자 로드 (User.name/phone 복호화)
 * 3. AlimtalkTemplateMappingResolver 로 codeValue → solapi templateId lookup
 * 4. 매핑이 있으면 알림톡 발송, 실패 시 SMS 폴백
 *    매핑이 없으면 알림톡 skip → SMS 폴백만 시도 (시드 추가 전까지 SMS-only 동작)
 * 5. 결과 INSERT/UPDATE (UNIQUE 충돌 = 멱등 skip)
 * </pre>
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class BatchNotificationDispatchServiceImpl implements BatchNotificationDispatchService {

    private static final DateTimeFormatter DATE_FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd", Locale.KOREA);
    private static final DateTimeFormatter TIME_FORMATTER =
        DateTimeFormatter.ofPattern("HH:mm", Locale.KOREA);
    private static final DateTimeFormatter LAST_SESSION_DATE_FORMATTER =
        DateTimeFormatter.ofPattern("yyyy년 M월 d일", Locale.KOREA);

    private final ScheduleRepository scheduleRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final UserRepository userRepository;
    private final UserPrivacyConsentRepository userPrivacyConsentRepository;
    private final NotificationBatchSendLogRepository sendLogRepository;
    private final NotificationBatchSendLogger sendLogger;
    private final NotificationDispatchHelper dispatchHelper;
    private final AlimtalkTemplateMappingResolver templateMappingResolver;
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final BatchNotificationProperties properties;

    @Override
    public DispatchOutcome dispatchReservationReminderD2(Long scheduleId) {
        return dispatchScheduleBased(scheduleId,
            BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2, true);
    }

    @Override
    public DispatchOutcome dispatchReservationImmediateSingle(Long scheduleId) {
        return dispatchScheduleBased(scheduleId,
            BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_SINGLE, false);
    }

    @Override
    public DispatchOutcome dispatchReservationImmediateLate(Long scheduleId) {
        return dispatchScheduleBased(scheduleId,
            BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_LATE, false);
    }

    @Override
    public DispatchOutcome dispatchSessionEndingSoon(Long mappingId) {
        String tenantId = resolveTenantId();
        if (tenantId == null) {
            return validationFailure("TENANT_CONTEXT_MISSING", "tenant context missing");
        }

        ConsultantClientMapping mapping = mappingRepository
            .findByTenantIdAndId(tenantId, mappingId).orElse(null);
        if (mapping == null || mapping.getConsultant() == null || mapping.getClient() == null) {
            return validationFailure(BatchNotificationTemplateCodes.ERROR_CODE_TARGET_NOT_FOUND,
                "mapping not found: id=" + mappingId);
        }

        User client = mapping.getClient();
        User consultant = mapping.getConsultant();
        String decryptedPhone = decryptSafely(client.getPhone());
        if (decryptedPhone == null || decryptedPhone.isBlank()) {
            return validationFailure(BatchNotificationTemplateCodes.ERROR_CODE_RECIPIENT_PHONE_MISSING,
                "client phone missing: clientId=" + client.getId());
        }

        Map<String, String> params = baseClientConsultantParams(client, consultant);
        params.put(BatchNotificationTemplateCodes.VAR_REMAINING_SESSIONS,
            String.valueOf(Math.max(1, mapping.getRemainingSessions())));

        return dispatchInternal(tenantId,
            BatchNotificationTemplateCodes.SESSION_ENDING_SOON,
            BatchNotificationTemplateCodes.TARGET_TYPE_MAPPING,
            mappingId, client.getId(), decryptedPhone, params,
            buildSmsBodySessionEndingSoon(params));
    }

    @Override
    public DispatchOutcome dispatchSessionRenewPrompt(Long mappingId) {
        String tenantId = resolveTenantId();
        if (tenantId == null) {
            return validationFailure("TENANT_CONTEXT_MISSING", "tenant context missing");
        }

        ConsultantClientMapping mapping = mappingRepository
            .findByTenantIdAndId(tenantId, mappingId).orElse(null);
        if (mapping == null || mapping.getConsultant() == null || mapping.getClient() == null) {
            return validationFailure(BatchNotificationTemplateCodes.ERROR_CODE_TARGET_NOT_FOUND,
                "mapping not found: id=" + mappingId);
        }

        // 첫 실행 cutoff 가드 — 마지막 회기 종료(endDate) 이전이면 skip.
        LocalDateTime cutoffStart = properties.getSessionRenewDeployCutoff().atStartOfDay();
        if (mapping.getEndDate() == null || mapping.getEndDate().isBefore(cutoffStart)) {
            log.info("SESSION_RENEW_PROMPT skip (cutoff): mappingId={}, endDate={}, cutoff={}",
                mappingId, mapping.getEndDate(), cutoffStart);
            return validationFailure(BatchNotificationTemplateCodes.ERROR_CODE_DEPLOY_CUTOFF_BEFORE,
                "mapping.endDate before deploy cutoff: " + mapping.getEndDate());
        }

        User client = mapping.getClient();
        User consultant = mapping.getConsultant();

        // 마케팅 동의 가드 — UserPrivacyConsent.marketingConsent 최신값 lookup.
        if (!hasMarketingConsent(tenantId, client.getId())) {
            log.info("SESSION_RENEW_PROMPT skip (marketing consent false): mappingId={}, clientId={}",
                mappingId, client.getId());
            return validationFailure(BatchNotificationTemplateCodes.ERROR_CODE_MARKETING_CONSENT_REQUIRED,
                "client marketing consent missing");
        }

        String decryptedPhone = decryptSafely(client.getPhone());
        if (decryptedPhone == null || decryptedPhone.isBlank()) {
            return validationFailure(BatchNotificationTemplateCodes.ERROR_CODE_RECIPIENT_PHONE_MISSING,
                "client phone missing: clientId=" + client.getId());
        }

        Map<String, String> params = baseClientConsultantParams(client, consultant);
        params.put(BatchNotificationTemplateCodes.VAR_LAST_SESSION_DATE,
            LAST_SESSION_DATE_FORMATTER.format(mapping.getEndDate().toLocalDate()));

        return dispatchInternal(tenantId,
            BatchNotificationTemplateCodes.SESSION_RENEW_PROMPT,
            BatchNotificationTemplateCodes.TARGET_TYPE_MAPPING,
            mappingId, client.getId(), decryptedPhone, params,
            buildSmsBodySessionRenew(params));
    }

    @Override
    public DispatchOutcome dispatchClientWelcomeFirst(Long mappingId) {
        String tenantId = resolveTenantId();
        if (tenantId == null) {
            return validationFailure("TENANT_CONTEXT_MISSING", "tenant context missing");
        }

        ConsultantClientMapping mapping = mappingRepository
            .findByTenantIdAndId(tenantId, mappingId).orElse(null);
        if (mapping == null || mapping.getConsultant() == null || mapping.getClient() == null) {
            return validationFailure(BatchNotificationTemplateCodes.ERROR_CODE_TARGET_NOT_FOUND,
                "mapping not found: id=" + mappingId);
        }

        User client = mapping.getClient();
        User consultant = mapping.getConsultant();
        String decryptedPhone = decryptSafely(client.getPhone());
        if (decryptedPhone == null || decryptedPhone.isBlank()) {
            return validationFailure(BatchNotificationTemplateCodes.ERROR_CODE_RECIPIENT_PHONE_MISSING,
                "client phone missing: clientId=" + client.getId());
        }

        Map<String, String> params = baseClientConsultantParams(client, consultant);
        params.put(BatchNotificationTemplateCodes.VAR_CONTACT_PHONE,
            orFallback(properties.getContactPhone(),
                BatchNotificationTemplateCodes.FALLBACK_CONTACT_PHONE));

        return dispatchInternal(tenantId,
            BatchNotificationTemplateCodes.CLIENT_WELCOME_FIRST,
            /* idempotencyTemplateCodes */ null,
            BatchNotificationTemplateCodes.TARGET_TYPE_USER,
            client.getId(), client.getId(), decryptedPhone, params,
            buildSmsBodyClientWelcome(params));
    }

    @Override
    public DispatchOutcome dispatchInitialGuide(Long scheduleId) {
        String tenantId = resolveTenantId();
        if (tenantId == null) {
            return validationFailure("TENANT_CONTEXT_MISSING", "tenant context missing");
        }

        Schedule schedule = scheduleRepository
            .findByTenantIdAndId(tenantId, scheduleId).orElse(null);
        if (schedule == null || schedule.getClientId() == null || schedule.getConsultantId() == null) {
            return validationFailure(BatchNotificationTemplateCodes.ERROR_CODE_TARGET_NOT_FOUND,
                "schedule not found or missing client/consultant: id=" + scheduleId);
        }

        // 첫 상담 여부 — 해당 client 의 누적 스케줄 카운트(현재 본인 포함) 가 정확히 1 인 경우만 발송.
        // 멱등성과 별도로 우선 가드한다(두 번째 이상 예약은 멱등 키와 무관하게 SKIPPED_VALIDATION).
        long totalSchedules = scheduleRepository.countByClientId(tenantId, schedule.getClientId());
        if (totalSchedules != 1L) {
            log.info("INITIAL_GUIDE skip (not first schedule): scheduleId={}, clientId={}, total={}",
                scheduleId, schedule.getClientId(), totalSchedules);
            return validationFailure(BatchNotificationTemplateCodes.ERROR_CODE_NOT_FIRST_SCHEDULE,
                "client total schedule count = " + totalSchedules);
        }

        User client = userRepository
            .findByTenantIdAndIdIgnoringDeleted(tenantId, schedule.getClientId())
            .orElse(null);
        User consultant = userRepository
            .findByTenantIdAndIdIgnoringDeleted(tenantId, schedule.getConsultantId())
            .orElse(null);
        if (client == null || consultant == null) {
            return validationFailure(BatchNotificationTemplateCodes.ERROR_CODE_TARGET_NOT_FOUND,
                "client or consultant not found for schedule id=" + scheduleId);
        }

        String decryptedPhone = decryptSafely(client.getPhone());
        if (decryptedPhone == null || decryptedPhone.isBlank()) {
            return validationFailure(BatchNotificationTemplateCodes.ERROR_CODE_RECIPIENT_PHONE_MISSING,
                "client phone missing: clientId=" + client.getId());
        }

        boolean isOnline = isOnlineConsultation(schedule);
        String templateCode = isOnline
            ? BatchNotificationTemplateCodes.INITIAL_GUIDE_ONLINE
            : BatchNotificationTemplateCodes.INITIAL_GUIDE_OFFLINE;

        Map<String, String> params = baseClientConsultantParams(client, consultant);
        params.put(BatchNotificationTemplateCodes.VAR_SCHEDULE_DATE,
            DATE_FORMATTER.format(schedule.getDate()));
        params.put(BatchNotificationTemplateCodes.VAR_SCHEDULE_TIME,
            TIME_FORMATTER.format(schedule.getStartTime()));
        if (isOnline) {
            String onlineLink = orFallback(schedule.getConsultationLocation(), "");
            if (onlineLink.isBlank()) {
                log.warn("INITIAL_GUIDE_ONLINE — onlineLink 누락 (consultation_location empty): scheduleId={}",
                    scheduleId);
            }
            params.put(BatchNotificationTemplateCodes.VAR_ONLINE_LINK, onlineLink);
        } else {
            params.put(BatchNotificationTemplateCodes.VAR_BRANCH_ADDRESS,
                resolveBranchAddress(consultant, schedule));
        }

        String smsBody = isOnline
            ? buildSmsBodyInitialGuideOnline(params)
            : buildSmsBodyInitialGuideOffline(params);

        return dispatchInternal(tenantId, templateCode,
            BatchNotificationTemplateCodes.INITIAL_GUIDE_CODES,
            BatchNotificationTemplateCodes.TARGET_TYPE_USER,
            client.getId(), client.getId(), decryptedPhone, params, smsBody);
    }

    /**
     * Schedule 기반 3종 템플릿 (D-2 / IMMEDIATE_SINGLE / IMMEDIATE_LATE) 공통 발송 흐름.
     *
     * @param scheduleId           {@code schedules.id}
     * @param templateCode         5종 중 1
     * @param includeRemainingSessions {@code true} — D-2 만 잔여 회기 변수 포함
     * @return 발송 결과
     */
    private DispatchOutcome dispatchScheduleBased(Long scheduleId, String templateCode,
            boolean includeRemainingSessions) {
        String tenantId = resolveTenantId();
        if (tenantId == null) {
            return validationFailure("TENANT_CONTEXT_MISSING", "tenant context missing");
        }

        Schedule schedule = scheduleRepository
            .findByTenantIdAndId(tenantId, scheduleId).orElse(null);
        if (schedule == null || schedule.getClientId() == null || schedule.getConsultantId() == null) {
            return validationFailure(BatchNotificationTemplateCodes.ERROR_CODE_TARGET_NOT_FOUND,
                "schedule not found or missing client/consultant: id=" + scheduleId);
        }

        User client = userRepository
            .findByTenantIdAndIdIgnoringDeleted(tenantId, schedule.getClientId())
            .orElse(null);
        User consultant = userRepository
            .findByTenantIdAndIdIgnoringDeleted(tenantId, schedule.getConsultantId())
            .orElse(null);
        if (client == null || consultant == null) {
            return validationFailure(BatchNotificationTemplateCodes.ERROR_CODE_TARGET_NOT_FOUND,
                "client or consultant not found for schedule id=" + scheduleId);
        }

        String decryptedPhone = decryptSafely(client.getPhone());
        if (decryptedPhone == null || decryptedPhone.isBlank()) {
            return validationFailure(BatchNotificationTemplateCodes.ERROR_CODE_RECIPIENT_PHONE_MISSING,
                "client phone missing: clientId=" + client.getId());
        }

        Map<String, String> params = baseClientConsultantParams(client, consultant);
        params.put(BatchNotificationTemplateCodes.VAR_SCHEDULE_DATE,
            DATE_FORMATTER.format(schedule.getDate()));
        params.put(BatchNotificationTemplateCodes.VAR_SCHEDULE_TIME,
            TIME_FORMATTER.format(schedule.getStartTime()));
        if (includeRemainingSessions) {
            int remaining = resolveRemainingSessionsForSchedule(tenantId, schedule);
            params.put(BatchNotificationTemplateCodes.VAR_REMAINING_SESSIONS,
                String.valueOf(Math.max(0, remaining)));
        }

        String smsBody = buildSmsBodyForReservation(templateCode, params);
        return dispatchInternal(tenantId, templateCode,
            BatchNotificationTemplateCodes.TARGET_TYPE_SCHEDULE,
            scheduleId, client.getId(), decryptedPhone, params, smsBody);
    }

    /**
     * 단일 템플릿 코드 멱등 가드를 사용하는 기존 시그니처 — 호환성 보존용 위임.
     */
    private DispatchOutcome dispatchInternal(String tenantId, String templateCode,
            String targetType, Long targetId, Long recipientUserId,
            String decryptedPhone, Map<String, String> alimtalkParams, String smsFallbackBody) {
        return dispatchInternal(tenantId, templateCode, /* idempotencyTemplateCodes */ null,
            targetType, targetId, recipientUserId, decryptedPhone, alimtalkParams, smsFallbackBody);
    }

    /**
     * 멱등 가드 + 알림톡 발송 + SMS 폴백 + 결과 기록 공통 흐름.
     *
     * @param tenantId                테넌트 ID
     * @param templateCode            실제 발송할 템플릿 codeValue (로그 INSERT 시 사용)
     * @param idempotencyTemplateCodes 멱등 검사에 사용할 템플릿 코드 묶음 — {@code null} 이면
     *                                 {@code templateCode} 단일 키 검사. 비어있지 않으면 묶음 중
     *                                 하나라도 동일 (target_type, target_id, recipient_user_id) 로
     *                                 발송된 적이 있으면 skip 한다 (INITIAL_GUIDE_OFFLINE/ONLINE 공유).
     * @param targetType              대상 타입 ({@code SCHEDULE}/{@code MAPPING}/{@code USER})
     * @param targetId                대상 엔티티 PK
     * @param recipientUserId         수신자 users.id
     * @param decryptedPhone          복호화된 수신자 전화번호 (메모리 한정)
     * @param alimtalkParams          알림톡 변수 매핑
     * @param smsFallbackBody         SMS 폴백 본문 (이미 변수 치환 완료)
     * @return 발송 결과
     */
    private DispatchOutcome dispatchInternal(String tenantId, String templateCode,
            Collection<String> idempotencyTemplateCodes,
            String targetType, Long targetId, Long recipientUserId,
            String decryptedPhone, Map<String, String> alimtalkParams, String smsFallbackBody) {

        // 드라이런 모드 — 발송하지 않고 카운트만 로그.
        if (properties.isDryRun()) {
            log.info("[DRY-RUN] 발송 시뮬레이션: tenantId={}, templateCode={}, targetType={}, targetId={}, recipientUserId={}, maskedPhone={}",
                tenantId, templateCode, targetType, targetId, recipientUserId,
                PhoneLogMasking.maskForLog(decryptedPhone));
            return new DispatchOutcome(DispatchOutcome.Status.DRY_RUN,
                null, false, null, null, null);
        }

        // 사전 멱등 가드 — 단일 키 또는 코드 묶음 OR 검사.
        boolean alreadySent = (idempotencyTemplateCodes != null && !idempotencyTemplateCodes.isEmpty())
            ? sendLogRepository.existsByIdempotencyKeyAnyTemplate(
                tenantId, idempotencyTemplateCodes, targetType, targetId, recipientUserId)
            : sendLogRepository.existsByIdempotencyKey(
                tenantId, templateCode, targetType, targetId, recipientUserId);
        if (alreadySent) {
            log.info("멱등성 검사 skip: tenantId={}, templateCode={} ({}), targetType={}, targetId={}, recipientUserId={}",
                tenantId, templateCode,
                idempotencyTemplateCodes != null ? idempotencyTemplateCodes : "single",
                targetType, targetId, recipientUserId);
            Long existingLogId = sendLogRepository
                .findByIdempotencyKey(tenantId, templateCode, targetType, targetId, recipientUserId)
                .map(NotificationBatchSendLog::getId)
                .orElse(null);
            return new DispatchOutcome(DispatchOutcome.Status.SKIPPED_DUPLICATE,
                null, false, null, null, existingLogId);
        }

        String maskedPhone = PhoneLogMasking.maskForLog(decryptedPhone);
        NotificationBatchSendLog logEntry = sendLogger.logAttempt(tenantId, templateCode,
            targetType, targetId, recipientUserId, maskedPhone);
        if (logEntry == null) {
            // INSERT UNIQUE 충돌 — 동시성 케이스에서 다른 스레드가 먼저 INSERT 한 경우.
            log.info("동시성 멱등 skip: tenantId={}, templateCode={}", tenantId, templateCode);
            return new DispatchOutcome(DispatchOutcome.Status.SKIPPED_DUPLICATE,
                null, false, null, null, null);
        }

        // ALIMTALK_BIZ_TEMPLATE_CODE 매핑 lookup — 시드 추가 전까지는 null 일 수 있다.
        String solapiTemplateId = templateMappingResolver
            .resolveSolapiTemplateId(tenantId, templateCode);

        boolean alimtalkAttempted = false;
        boolean alimtalkSuccess = false;
        NotificationDispatchHelper.DispatchResult alimtalkResult = null;

        if (solapiTemplateId != null) {
            alimtalkAttempted = true;
            alimtalkResult = dispatchHelper.dispatchAlimtalk(decryptedPhone, solapiTemplateId,
                alimtalkParams);
            alimtalkSuccess = alimtalkResult.success();
        } else {
            log.warn("알림톡 매핑 없음: tenantId={}, codeValue={}", tenantId, templateCode);
        }

        if (alimtalkSuccess) {
            sendLogger.updateResult(logEntry.getId(), true,
                BatchNotificationTemplateCodes.CHANNEL_ALIMTALK,
                false, null, null,
                alimtalkResult.solapiGroupId(), alimtalkResult.solapiMessageId());
            return new DispatchOutcome(DispatchOutcome.Status.ALIMTALK_SENT,
                BatchNotificationTemplateCodes.CHANNEL_ALIMTALK,
                false, null, null, logEntry.getId());
        }

        // F2 — 마케팅성 템플릿(SESSION_RENEW_PROMPT)은 알림톡 실패 시에도 SMS 폴백 미수행.
        // 마케팅 SMS 는 수신거부 안내 운영 부담이 커 본 트랙에서는 알림톡 전용으로 운영하며,
        // 알림톡 실패는 별도 FAILED 로 기록한다 (멱등 로그 정책 §11 — channel_used=ALIMTALK 보존).
        if (BatchNotificationTemplateCodes.isMarketingTemplate(templateCode)) {
            String alimtalkErrMsg = alimtalkAttempted && alimtalkResult != null
                ? alimtalkResult.errorMessage()
                : "alimtalk mapping not found";
            String marketingNote = NotificationDispatchHelper.truncate(
                "마케팅 템플릿 — 알림톡 실패 + SMS 폴백 정책상 미발송 | alimtalk=" + alimtalkErrMsg);
            sendLogger.updateResult(logEntry.getId(), false,
                BatchNotificationTemplateCodes.CHANNEL_ALIMTALK,
                false,
                BatchNotificationTemplateCodes.ERROR_CODE_MARKETING_NO_FALLBACK,
                marketingNote,
                alimtalkResult != null ? alimtalkResult.solapiGroupId() : null,
                alimtalkResult != null ? alimtalkResult.solapiMessageId() : null);
            log.info("마케팅 템플릿 알림톡 실패 — F2 정책 SMS 폴백 skip: tenantId={}, templateCode={}",
                tenantId, templateCode);
            return new DispatchOutcome(DispatchOutcome.Status.FAILED,
                BatchNotificationTemplateCodes.CHANNEL_ALIMTALK,
                false,
                BatchNotificationTemplateCodes.ERROR_CODE_MARKETING_NO_FALLBACK,
                marketingNote, logEntry.getId());
        }

        // F1+F3 — 정보성 템플릿: 모든 알림톡 실패(전송 실패/매핑 누락 포함) → 즉시 SMS 폴백.
        // fallbackToSms=true 는 "SMS 가 폴백 경로로 사용됨" 을 의미하며, 알림톡 시도 여부와 무관하게
        // 본 분기에 진입하면 항상 true. 알림톡을 시도조차 못한 경우의 구분은 채널 사용 이력
        // (alimtalkAttempted)·error_code(ERROR_CODE_TEMPLATE_NOT_MAPPED) 로 별도 기록한다.
        NotificationDispatchHelper.DispatchResult smsResult =
            dispatchHelper.dispatchSms(decryptedPhone, smsFallbackBody);
        boolean fallbackToSms = true;

        if (smsResult.success()) {
            DispatchOutcome.Status status = alimtalkAttempted
                ? DispatchOutcome.Status.SMS_FALLBACK_SENT
                : DispatchOutcome.Status.SMS_ONLY_SENT;
            String fallbackNote = alimtalkAttempted && alimtalkResult != null
                ? "alimtalk failed, sms fallback ok: " + alimtalkResult.errorMessage()
                : "alimtalk mapping absent, sms only ok";
            sendLogger.updateResult(logEntry.getId(), true,
                BatchNotificationTemplateCodes.CHANNEL_SMS,
                fallbackToSms,
                alimtalkAttempted
                    ? (alimtalkResult != null ? alimtalkResult.errorCode() : null)
                    : BatchNotificationTemplateCodes.ERROR_CODE_TEMPLATE_NOT_MAPPED,
                NotificationDispatchHelper.truncate(fallbackNote),
                alimtalkResult != null ? alimtalkResult.solapiGroupId() : null,
                alimtalkResult != null ? alimtalkResult.solapiMessageId() : null);
            return new DispatchOutcome(status,
                BatchNotificationTemplateCodes.CHANNEL_SMS,
                fallbackToSms, null, null, logEntry.getId());
        }

        // 알림톡(시도 시) + SMS 모두 실패 → channel_used 는 마지막 시도 채널(SMS)을 보존하지 않고,
        // 멱등 로그 정책 §11 에 따라 "최종 성공 채널 없음 = ALIMTALK 보존" 으로 기록한다.
        String errorCode = alimtalkAttempted
            ? BatchNotificationTemplateCodes.ERROR_CODE_SEND_FAILED
            : BatchNotificationTemplateCodes.ERROR_CODE_TEMPLATE_NOT_MAPPED;
        String errorMessage = buildAggregateErrorMessage(alimtalkResult, smsResult, alimtalkAttempted);
        sendLogger.updateResult(logEntry.getId(), false,
            BatchNotificationTemplateCodes.CHANNEL_ALIMTALK,
            fallbackToSms, errorCode, errorMessage,
            alimtalkResult != null ? alimtalkResult.solapiGroupId() : null,
            alimtalkResult != null ? alimtalkResult.solapiMessageId() : null);
        log.warn("발송 실패: tenantId={}, templateCode={}, targetType={}, targetId={}, errorCode={}, errorMessage={}",
            tenantId, templateCode, targetType, targetId, errorCode, errorMessage);
        return new DispatchOutcome(DispatchOutcome.Status.FAILED,
            BatchNotificationTemplateCodes.CHANNEL_ALIMTALK,
            fallbackToSms, errorCode, errorMessage, logEntry.getId());
    }

    /**
     * Schedule 의 잔여 회기 계산 — D-2 발송에서만 사용. ACTIVE/SESSIONS_EXHAUSTED 매핑 우선.
     *
     * @param tenantId 테넌트 ID
     * @param schedule 일정
     * @return 잔여 회기 (찾지 못하면 0)
     */
    private int resolveRemainingSessionsForSchedule(String tenantId, Schedule schedule) {
        Optional<ConsultantClientMapping> opt = mappingRepository
            .findActiveOrExhaustedByTenantIdAndConsultantIdAndClientId(
                tenantId, schedule.getConsultantId(), schedule.getClientId());
        if (opt.isPresent()) {
            Integer remaining = opt.get().getRemainingSessions();
            return remaining == null ? 0 : remaining;
        }
        // 폴백 — TERMINATED 포함 최근 매핑.
        List<ConsultantClientMapping> all = mappingRepository
            .findAllByTenantIdAndConsultantIdAndClientIdOrderByCreatedAtDesc(
                tenantId, schedule.getConsultantId(), schedule.getClientId());
        if (!all.isEmpty()) {
            Integer remaining = all.get(0).getRemainingSessions();
            return remaining == null ? 0 : remaining;
        }
        return 0;
    }

    /**
     * 마케팅 동의 최신값 lookup — {@link UserPrivacyConsentRepository}.
     *
     * @param tenantId 테넌트 ID
     * @param userId   사용자 PK
     * @return {@code true/false}, 동의 기록 없으면 {@code false}
     */
    private boolean hasMarketingConsent(String tenantId, Long userId) {
        try {
            return userPrivacyConsentRepository
                .findLatestMarketingConsentByTenantIdAndUserId(tenantId, userId)
                .map(Boolean::booleanValue)
                .orElse(false);
        } catch (Exception e) {
            log.warn("마케팅 동의 조회 실패 (default=false): tenantId={}, userId={}, error={}",
                tenantId, userId, e.getMessage());
            return false;
        }
    }

    /**
     * 변수 추출 공통 — clientName/consultantName. null/blank 시 fallback 적용.
     *
     * @param client     내담자
     * @param consultant 상담사
     * @return 가변 Map (호출자가 추가 변수 put)
     */
    private Map<String, String> baseClientConsultantParams(User client, User consultant) {
        Map<String, String> params = new HashMap<>();
        params.put(BatchNotificationTemplateCodes.VAR_CLIENT_NAME,
            orFallback(decryptSafely(client.getName()),
                BatchNotificationTemplateCodes.FALLBACK_CLIENT_NAME));
        params.put(BatchNotificationTemplateCodes.VAR_CONSULTANT_NAME,
            orFallback(decryptSafely(consultant.getName()),
                BatchNotificationTemplateCodes.FALLBACK_CONSULTANT_NAME));
        return params;
    }

    /**
     * SMS 폴백 본문 — 예약 안내 3종 (D-2/IMMEDIATE_SINGLE/IMMEDIATE_LATE).
     *
     * @param templateCode 템플릿 코드
     * @param params       변수 매핑
     * @return SMS 본문
     */
    private String buildSmsBodyForReservation(String templateCode, Map<String, String> params) {
        String consultantName = params.getOrDefault(BatchNotificationTemplateCodes.VAR_CONSULTANT_NAME,
            BatchNotificationTemplateCodes.FALLBACK_CONSULTANT_NAME);
        String scheduleDate = params.getOrDefault(BatchNotificationTemplateCodes.VAR_SCHEDULE_DATE, "");
        String scheduleTime = params.getOrDefault(BatchNotificationTemplateCodes.VAR_SCHEDULE_TIME, "");

        if (BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2.equals(templateCode)) {
            return String.format(
                "%s %s 상담 예약 안내입니다. (%s 상담사) 변경/취소 시 미리 연락 부탁드립니다.",
                scheduleDate, scheduleTime, consultantName);
        }
        if (BatchNotificationTemplateCodes.RESERVATION_IMMEDIATE_SINGLE.equals(templateCode)) {
            return String.format(
                "상담 예약 확정: %s %s (%s 상담사). 편안하게 오시기 바랍니다.",
                scheduleDate, scheduleTime, consultantName);
        }
        // RESERVATION_IMMEDIATE_LATE
        return String.format(
            "상담 예약 확정: %s %s (%s 상담사). 예약일이 임박하니 일정 확인 부탁드립니다.",
            scheduleDate, scheduleTime, consultantName);
    }

    /**
     * SMS 폴백 본문 — 잔여 1회기 진입 안내.
     *
     * @param params 변수 매핑
     * @return SMS 본문
     */
    private String buildSmsBodySessionEndingSoon(Map<String, String> params) {
        String consultantName = params.getOrDefault(BatchNotificationTemplateCodes.VAR_CONSULTANT_NAME,
            BatchNotificationTemplateCodes.FALLBACK_CONSULTANT_NAME);
        return String.format(
            "패키지 마지막 1회기가 남았습니다. (%s 상담사) 좋은 마무리 되시길 바랍니다.",
            consultantName);
    }

    /**
     * SMS 폴백 본문 — 마지막 회기 종료 직후 유도(마케팅성, 수신거부 안내 포함).
     *
     * @param params 변수 매핑
     * @return SMS 본문
     */
    private String buildSmsBodySessionRenew(Map<String, String> params) {
        return "그동안 상담 함께해 주셔서 감사합니다. 추가 상담이 필요하시면 언제든 연락 주세요. (수신거부:080-XXX-XXXX)";
    }

    /**
     * SMS 폴백 본문 — 신규 매칭 환영 안내.
     *
     * @param params 변수 매핑 (clientName, consultantName, contactPhone)
     * @return SMS 본문
     */
    private String buildSmsBodyClientWelcome(Map<String, String> params) {
        String clientName = params.getOrDefault(BatchNotificationTemplateCodes.VAR_CLIENT_NAME,
            BatchNotificationTemplateCodes.FALLBACK_CLIENT_NAME);
        String consultantName = params.getOrDefault(BatchNotificationTemplateCodes.VAR_CONSULTANT_NAME,
            BatchNotificationTemplateCodes.FALLBACK_CONSULTANT_NAME);
        String contactPhone = params.getOrDefault(BatchNotificationTemplateCodes.VAR_CONTACT_PHONE,
            BatchNotificationTemplateCodes.FALLBACK_CONTACT_PHONE);
        return String.format(
            "%s님, 마인드가든에 오신 것을 환영합니다. %s 상담사와 함께 시작합니다. 문의: %s",
            clientName, consultantName, contactPhone);
    }

    /**
     * SMS 폴백 본문 — 첫 상담 안내(오프라인).
     *
     * @param params 변수 매핑 (scheduleDate, scheduleTime, consultantName)
     * @return SMS 본문
     */
    private String buildSmsBodyInitialGuideOffline(Map<String, String> params) {
        String scheduleDate = params.getOrDefault(BatchNotificationTemplateCodes.VAR_SCHEDULE_DATE, "");
        String scheduleTime = params.getOrDefault(BatchNotificationTemplateCodes.VAR_SCHEDULE_TIME, "");
        String consultantName = params.getOrDefault(BatchNotificationTemplateCodes.VAR_CONSULTANT_NAME,
            BatchNotificationTemplateCodes.FALLBACK_CONSULTANT_NAME);
        return String.format(
            "첫 상담: %s %s (%s 상담사). 15분 전 도착 권장, 변경 시 24h 전 연락 부탁드립니다.",
            scheduleDate, scheduleTime, consultantName);
    }

    /**
     * SMS 폴백 본문 — 첫 상담 안내(온라인).
     *
     * @param params 변수 매핑 (scheduleDate, scheduleTime, consultantName)
     * @return SMS 본문
     */
    private String buildSmsBodyInitialGuideOnline(Map<String, String> params) {
        String scheduleDate = params.getOrDefault(BatchNotificationTemplateCodes.VAR_SCHEDULE_DATE, "");
        String scheduleTime = params.getOrDefault(BatchNotificationTemplateCodes.VAR_SCHEDULE_TIME, "");
        String consultantName = params.getOrDefault(BatchNotificationTemplateCodes.VAR_CONSULTANT_NAME,
            BatchNotificationTemplateCodes.FALLBACK_CONSULTANT_NAME);
        return String.format(
            "첫 상담: %s %s (%s 상담사). 10분 전 접속 권장, 화상 링크는 알림톡을 참고해 주세요.",
            scheduleDate, scheduleTime, consultantName);
    }

    /**
     * {@link Schedule#getConsultationMethod()} 가 {@code ONLINE} 이면 온라인 상담으로 판정.
     * 컬럼 값이 {@code null}/{@code FACE_TO_FACE}/{@code PHONE}/기타 모두 오프라인으로 fallback 한다.
     *
     * @param schedule 스케줄
     * @return 온라인이면 {@code true}
     */
    private boolean isOnlineConsultation(Schedule schedule) {
        return "ONLINE".equalsIgnoreCase(schedule.getConsultationMethod());
    }

    /**
     * INITIAL_GUIDE_OFFLINE 발송 시 지점 주소 변수 해결.
     * 우선순위: {@code Schedule.consultationLocation} → {@code Consultant.address}
     * → {@code properties.fallbackBranchAddress} → 기본 fallback 문구.
     *
     * @param consultant 상담사 (address 컬럼 사용)
     * @param schedule   스케줄 (consultation_location 사용)
     * @return 변수에 주입할 주소
     */
    private String resolveBranchAddress(User consultant, Schedule schedule) {
        String fromSchedule = schedule.getConsultationLocation();
        if (fromSchedule != null && !fromSchedule.isBlank()) {
            return fromSchedule;
        }
        String fromConsultant = decryptSafely(consultant.getAddress());
        if (fromConsultant != null && !fromConsultant.isBlank()) {
            return fromConsultant;
        }
        return orFallback(properties.getFallbackBranchAddress(),
            BatchNotificationTemplateCodes.FALLBACK_BRANCH_ADDRESS);
    }

    /**
     * 알림톡 시도 결과 + SMS 결과 통합 에러 메시지.
     *
     * @param alimtalkResult    알림톡 결과(null = 시도 안 함)
     * @param smsResult         SMS 폴백 결과
     * @param alimtalkAttempted 알림톡 시도 여부
     * @return 결합 에러 메시지
     */
    private String buildAggregateErrorMessage(
            NotificationDispatchHelper.DispatchResult alimtalkResult,
            NotificationDispatchHelper.DispatchResult smsResult, boolean alimtalkAttempted) {
        StringBuilder sb = new StringBuilder();
        if (alimtalkAttempted && alimtalkResult != null) {
            sb.append("alimtalk: ").append(alimtalkResult.errorMessage());
        } else {
            sb.append("alimtalk: mapping not found (skipped)");
        }
        sb.append(" | sms: ").append(smsResult.errorMessage());
        return NotificationDispatchHelper.truncate(sb.toString());
    }

    /**
     * SESSION_RENEW_PROMPT 발송 시점 외부 호출자 (ScheduleServiceImpl) 가 본 cutoff 헬퍼를
     * 직접 확인할 수 있도록 노출. 본 메서드는 멱등 가드와는 별개 — 호출자의 사전 분기 비용 절감용.
     *
     * <p>본 서비스 내부 dispatch 흐름에도 동일한 cutoff 검사가 적용되어 있어 중복 호출돼도
     * 결과는 일관된다.
     *
     * @param mappingEndDate {@code consultant_client_mappings.end_date}
     * @return cutoff 이후이면 {@code true}
     */
    public boolean isAfterSessionRenewCutoff(LocalDateTime mappingEndDate) {
        if (mappingEndDate == null) {
            return false;
        }
        LocalDateTime cutoff = properties.getSessionRenewDeployCutoff().atStartOfDay();
        return !mappingEndDate.isBefore(cutoff);
    }

    /**
     * 마케팅 동의 외부 노출 — 호출자(ScheduleServiceImpl) 가 사전 분기에 사용.
     *
     * @param tenantId 테넌트 ID
     * @param userId   사용자 PK
     * @return 동의 시 {@code true}
     */
    public boolean hasMarketingConsentExternal(String tenantId, Long userId) {
        return hasMarketingConsent(tenantId, userId);
    }

    /**
     * 사전 검증 실패 — 멱등 로그 없이 즉시 응답.
     *
     * @param errorCode    실패 코드
     * @param errorMessage 실패 메시지
     * @return 결과
     */
    private DispatchOutcome validationFailure(String errorCode, String errorMessage) {
        log.info("사전 검증 실패 skip: errorCode={}, errorMessage={}", errorCode, errorMessage);
        return new DispatchOutcome(DispatchOutcome.Status.SKIPPED_VALIDATION,
            null, false, errorCode, errorMessage, null);
    }

    private String decryptSafely(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        try {
            return encryptionUtil.decrypt(value);
        } catch (Exception e) {
            log.debug("개인정보 복호화 실패 (원본 반환 회피): {}", e.getMessage());
            return value;
        }
    }

    private static String orFallback(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }

    /**
     * 현재 테넌트 컨텍스트 조회. 컨텍스트 없으면 {@code null} — 호출자는 검증 실패로 처리.
     *
     * @return 테넌트 ID 또는 {@code null}
     */
    private String resolveTenantId() {
        String tenantId = TenantContextHolder.getTenantId();
        return (tenantId == null || tenantId.isBlank()) ? null : tenantId;
    }

}
