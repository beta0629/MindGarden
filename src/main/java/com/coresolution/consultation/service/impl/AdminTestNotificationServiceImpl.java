package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.TestAlimtalkRequest;
import com.coresolution.consultation.dto.TestNotificationAlimtalkTemplate;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.dto.TestNotificationHistoryItem;
import com.coresolution.consultation.dto.TestNotificationRecipient;
import com.coresolution.consultation.dto.TestNotificationRecipientMode;
import com.coresolution.consultation.dto.TestNotificationResponse;
import com.coresolution.consultation.dto.TestSmsRequest;
import com.coresolution.consultation.entity.AdminTestNotificationLog;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.TenantKakaoAlimtalkSettings;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.AlimtalkTemplateFetchException;
import com.coresolution.consultation.integration.solapi.KakaoSolapiCredentialResolver;
import com.coresolution.consultation.integration.solapi.SolapiCredentials;
import com.coresolution.consultation.integration.solapi.SolapiKakaoTemplateClient;
import com.coresolution.consultation.integration.solapi.SolapiSendIds;
import com.coresolution.consultation.repository.AdminTestNotificationLogRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.TenantKakaoAlimtalkSettingsRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminTestNotificationService;
import com.coresolution.consultation.service.KakaoAlimTalkService;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.PhoneLogMasking;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 어드민 SMS·카카오 알림톡 테스트 발송 서비스 구현.
 *
 * <p>발송 로직은 기존 {@link SmsAuthService#sendNotificationMessage(String, String)} /
 * {@link KakaoAlimTalkService#sendAlimTalk(String, String, java.util.Map)}를 그대로 호출한다.
 * 신규 발송 로직은 작성하지 않으며(어제 디버그 사고 재현 회피), 본 서비스는 오케스트레이션·검증·감사로그만 담당한다.
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AdminTestNotificationServiceImpl implements AdminTestNotificationService {

    static final String ERROR_CODE_PHONE_MODE_UNSUPPORTED = "RECIPIENT_PHONE_MODE_UNSUPPORTED";
    static final String ERROR_CODE_RECIPIENT_NOT_FOUND = "RECIPIENT_NOT_FOUND";
    static final String ERROR_CODE_RECIPIENT_PHONE_MISSING = "RECIPIENT_PHONE_MISSING";
    static final String ERROR_CODE_USER_ID_REQUIRED = "USER_ID_REQUIRED";
    static final String ERROR_CODE_SEND_FAILED = "SEND_FAILED";
    static final String ERROR_CODE_ALIMTALK_DISABLED = "ALIMTALK_SERVICE_UNAVAILABLE";
    /** 라이브 템플릿 조회 사전 검증 — 솔라피 자격증명(테넌트 settings + ENV) 모두 미설정. */
    static final String ERROR_CODE_ALIMTALK_CREDENTIALS_MISSING = "ALIMTALK_CREDENTIALS_MISSING";
    /** 라이브 템플릿 조회 사전 검증 — 솔라피 발신 프로필(pfId)이 테넌트 settings·ENV 모두 미설정. */
    static final String ERROR_CODE_ALIMTALK_PFID_MISSING = "ALIMTALK_PFID_MISSING";

    static final String SOURCE_COMMON_CODE = "COMMON_CODE";
    static final String SOURCE_SOLAPI = "SOLAPI";

    static final String COMMON_CODE_GROUP_ALIMTALK_TEMPLATE = "ALIMTALK_TEMPLATE";

    private static final int MAX_RECIPIENT_RESULTS = 100;
    /** {@code admin_test_notification_logs.error_message} VARCHAR(1000) — 안전을 위해 900자에서 절단. */
    private static final int ERROR_MESSAGE_LOG_LIMIT = 900;

    private final UserRepository userRepository;
    private final CommonCodeRepository commonCodeRepository;
    private final AdminTestNotificationLogRepository logRepository;
    private final AdminTestNotificationLogger logger;
    private final AdminTestNotificationRateLimiter rateLimiter;
    private final SmsAuthService smsAuthService;
    private final KakaoAlimTalkService kakaoAlimTalkService;
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper;
    private final KakaoSolapiCredentialResolver solapiCredentialResolver;
    private final SolapiKakaoTemplateClient solapiKakaoTemplateClient;
    private final TenantKakaoAlimtalkSettingsRepository tenantKakaoAlimtalkSettingsRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TestNotificationRecipient> searchRecipients(String tenantId, String search,
            String role, boolean hasPhone) {
        Objects.requireNonNull(tenantId, "tenantId");

        List<User> users;
        if (role != null && !role.isBlank()) {
            UserRole parsedRole = parseRoleSafely(role);
            if (parsedRole == null) {
                return Collections.emptyList();
            }
            users = userRepository.findByRole(tenantId, parsedRole);
        } else {
            users = userRepository.findByTenantId(tenantId);
        }

        String normalizedSearch = (search == null || search.isBlank())
            ? null
            : search.trim().toLowerCase(Locale.ROOT);

        List<TestNotificationRecipient> results = new ArrayList<>();
        for (User user : users) {
            String decryptedPhone = decryptSafely(user.getPhone());
            boolean userHasPhone = decryptedPhone != null && !decryptedPhone.isBlank();
            if (hasPhone && !userHasPhone) {
                continue;
            }
            String decryptedName = decryptSafely(user.getName());
            String decryptedEmail = decryptSafely(user.getEmail());

            if (normalizedSearch != null
                && !containsIgnoreCase(decryptedName, normalizedSearch)
                && !containsIgnoreCase(decryptedEmail, normalizedSearch)) {
                continue;
            }

            results.add(TestNotificationRecipient.builder()
                .userId(user.getId())
                .name(decryptedName)
                .email(decryptedEmail)
                .role(user.getRole() != null ? user.getRole().name() : null)
                .phoneMasked(userHasPhone ? PhoneLogMasking.maskForLog(decryptedPhone) : null)
                .hasPhone(userHasPhone)
                .build());

            if (results.size() >= MAX_RECIPIENT_RESULTS) {
                break;
            }
        }

        results.sort(Comparator.comparing(
            r -> r.getName() == null ? "" : r.getName(),
            Comparator.naturalOrder()));
        return results;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TestNotificationAlimtalkTemplate> listCommonCodeTemplates(String tenantId) {
        Objects.requireNonNull(tenantId, "tenantId");
        // 테넌트 매칭 row가 있으면 그것을 우선 노출, 없으면 코어(tenant_id IS NULL) 공통 코드를 폴백.
        // 같은 codeValue가 양쪽에 모두 있을 때 테넌트 row만 유지(쿼리 정렬상 먼저 등장하므로 dedup으로 충분).
        List<CommonCode> codes = commonCodeRepository
            .findActiveByCodeGroupForTenantWithFallback(
                COMMON_CODE_GROUP_ALIMTALK_TEMPLATE, tenantId);
        List<TestNotificationAlimtalkTemplate> templates = new ArrayList<>(codes.size());
        Set<String> seenCodeValues = new HashSet<>();
        for (CommonCode code : codes) {
            if (Boolean.FALSE.equals(code.getIsActive())) {
                continue;
            }
            String codeValue = code.getCodeValue();
            if (codeValue == null || !seenCodeValues.add(codeValue)) {
                continue;
            }
            templates.add(TestNotificationAlimtalkTemplate.builder()
                .templateCode(codeValue)
                .title(code.getCodeLabel())
                .status(null)
                .variables(extractVariables(code.getExtraData()))
                .source(SOURCE_COMMON_CODE)
                .build());
        }
        return templates;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TestNotificationAlimtalkTemplate> listLiveAlimtalkTemplates(String tenantId) {
        Objects.requireNonNull(tenantId, "tenantId");

        TenantKakaoAlimtalkSettings settings = tenantKakaoAlimtalkSettingsRepository
            .findByTenantIdAndIsDeletedFalse(tenantId)
            .orElse(null);
        String apiKeyRef = settings != null ? settings.getKakaoApiKeyRef() : null;
        String senderKeyRef = settings != null ? settings.getKakaoSenderKeyRef() : null;

        // 자격증명 폴백 체인: tenant settings ref → ENV(kakao.alimtalk.solapi.api-key/secret 또는 sms.auth.api-key/secret).
        // {@link KakaoSolapiCredentialResolver#resolveCredentials(String)} 가 이 체인을 일괄 처리한다.
        SolapiCredentials credentials = solapiCredentialResolver.resolveCredentials(apiKeyRef);
        if (!credentials.isComplete()) {
            // 어드민 테스트 도구는 사용자가 즉시 원인 파악할 수 있도록 빈 리스트 대신 명시적 errorCode를 노출한다.
            String message = formatLocalConfigFailureMessage(
                ERROR_CODE_ALIMTALK_CREDENTIALS_MISSING,
                "tenant_settings(refPresent=" + isPresentRef(apiKeyRef) + ")"
                    + " + ENV(kakao.alimtalk.solapi.api-key/api-secret, sms.auth.api-key/api-secret)"
                    + " 모두 비어 있습니다.");
            log.warn("어드민 테스트 발송 — 솔라피 자격증명 폴백 실패 (tenantId={}, refPresent={})",
                tenantId, isPresentRef(apiKeyRef));
            throw new AlimtalkTemplateFetchException(0,
                ERROR_CODE_ALIMTALK_CREDENTIALS_MISSING, message);
        }

        // pfId 폴백 체인: tenant settings senderKeyRef → ENV(kakao.alimtalk.solapi.pf-id = SOLAPI_ALIMTALK_PFID).
        // resolver 내부에서 senderKeyRef 자체가 plain identifier(KA01PF...)인 경우도 처리한다.
        String pfId = solapiCredentialResolver.resolvePfId(senderKeyRef);
        if (pfId == null || pfId.isBlank()) {
            String message = formatLocalConfigFailureMessage(
                ERROR_CODE_ALIMTALK_PFID_MISSING,
                "tenant_settings(refPresent=" + isPresentRef(senderKeyRef) + ")"
                    + " + ENV(kakao.alimtalk.solapi.pf-id, SOLAPI_ALIMTALK_PFID)"
                    + " 모두 비어 있습니다.");
            log.warn("어드민 테스트 발송 — 솔라피 발신 프로필(pfId) 폴백 실패 (tenantId={}, senderRefPresent={})",
                tenantId, isPresentRef(senderKeyRef));
            throw new AlimtalkTemplateFetchException(0,
                ERROR_CODE_ALIMTALK_PFID_MISSING, message);
        }

        SolapiKakaoTemplateClient.Response response = solapiKakaoTemplateClient.list(credentials, pfId);
        if (!response.success()) {
            // 빈 리스트만 반환하면 프론트는 "템플릿 없음"으로 보여 사용자가 원인 파악 불가 →
            // 어드민 도구는 상태코드·errorCode·메시지를 그대로 노출하여 진단을 가속한다.
            String detail = formatLiveFailureMessage(response.statusCode(),
                response.errorCode(), response.errorMessage());
            log.warn("어드민 테스트 발송 — 솔라피 실시간 템플릿 조회 실패: status={}, errorCode={}, errorMessage={}",
                response.statusCode(), response.errorCode(), response.errorMessage());
            throw new AlimtalkTemplateFetchException(
                response.statusCode(), response.errorCode(), detail);
        }

        log.info("어드민 테스트 발송 — 솔라피 실시간 템플릿 조회 성공 (tenantId={}, count={})",
            tenantId, response.templates().size());

        List<TestNotificationAlimtalkTemplate> templates = new ArrayList<>(response.templates().size());
        for (SolapiKakaoTemplateClient.TemplateMeta meta : response.templates()) {
            templates.add(TestNotificationAlimtalkTemplate.builder()
                .templateCode(meta.templateId())
                .title(meta.name())
                .status(meta.status())
                .variables(Collections.emptyList())
                .source(SOURCE_SOLAPI)
                .build());
        }
        return templates;
    }

    /**
     * 솔라피 실시간 템플릿 조회 실패 메시지 포맷.
     *
     * @param statusCode    솔라피 응답 HTTP 상태(클라이언트 실패는 0 또는 5xx)
     * @param errorCode     솔라피 errorCode
     * @param errorMessage  솔라피 errorMessage(이미 마스킹된 본문 일부 포함 가능)
     * @return 어드민 응답으로 노출할 메시지
     */
    private static String formatLiveFailureMessage(int statusCode, String errorCode, String errorMessage) {
        StringBuilder sb = new StringBuilder("솔라피 알림톡 템플릿 조회 실패 (status=")
            .append(statusCode).append(")");
        if (errorCode != null && !errorCode.isBlank()) {
            sb.append(", errorCode=").append(errorCode);
        }
        if (errorMessage != null && !errorMessage.isBlank()) {
            sb.append(", errorMessage=").append(errorMessage);
        }
        return sb.toString();
    }

    /**
     * 사전 검증(테넌트 settings·ENV 폴백 모두 부재) 실패 메시지 포맷.
     *
     * <p>{@link #formatLiveFailureMessage}와 동일한 {@code status=N, errorCode=…, errorMessage=…}
     * 직렬화 형식을 사용하여 어드민 프론트가 동일 파서로 처리할 수 있도록 한다. 외부 호출 전 단계 실패는
     * {@code status=0}으로 표기한다.
     *
     * @param errorCode 사전 검증 실패 코드(예: {@link #ERROR_CODE_ALIMTALK_PFID_MISSING})
     * @param detail    구성 누락 상세(레퍼런스 존재 여부 등 비밀이 아닌 진단 정보)
     * @return 어드민 응답으로 노출할 메시지
     */
    private static String formatLocalConfigFailureMessage(String errorCode, String detail) {
        return new StringBuilder("솔라피 알림톡 템플릿 조회 사전 검증 실패 (status=0)")
            .append(", errorCode=").append(errorCode)
            .append(", errorMessage=").append(detail == null ? "" : detail)
            .toString();
    }

    /**
     * ref 문자열이 비어 있지 않은지 boolean으로 정리(로그·메시지에 비밀값 노출 회피).
     *
     * @param ref tenant settings 등에서 가져온 ref 식별자
     * @return ref 가 null/blank가 아니면 true
     */
    private static boolean isPresentRef(String ref) {
        return ref != null && !ref.isBlank();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminTestNotificationRateLimiter.Decision checkRateLimit(String tenantId, Long userId) {
        return rateLimiter.tryAcquire(tenantId, userId);
    }

    @Override
    public TestNotificationResponse sendSms(String tenantId, User currentUser, TestSmsRequest request) {
        ResolvedRecipient recipient = resolveRecipient(tenantId, currentUser,
            request.getRecipientMode(), request.getUserId());
        if (recipient.errorCode() != null) {
            return TestNotificationResponse.builder()
                .success(false)
                .errorCode(recipient.errorCode())
                .errorMessage(recipient.errorMessage())
                .build();
        }

        AdminTestNotificationLog logEntry = logger.logAttempt(tenantId, currentUser.getId(),
            currentUser.getUserId(), request.getRecipientMode(), recipient.userId(),
            recipient.maskedPhone(), TestNotificationChannel.SMS,
            null, null, request.getMessage(), request.getReason());
        rateLimiter.recordAttempt(tenantId, currentUser.getId());

        LocalDateTime sentAt = LocalDateTime.now();
        boolean success;
        String errorCode = null;
        String errorMessage = null;
        try {
            success = smsAuthService.sendNotificationMessage(recipient.phone(), request.getMessage());
            if (!success) {
                errorCode = ERROR_CODE_SEND_FAILED;
                String detail = consumeSmsDetailSafely();
                errorMessage = truncateErrorMessage(detail != null && !detail.isBlank()
                    ? detail
                    : "SmsAuthService.sendNotificationMessage returned false");
            }
        } catch (Exception e) {
            success = false;
            errorCode = ERROR_CODE_SEND_FAILED;
            String detail = consumeSmsDetailSafely();
            String base = detail != null && !detail.isBlank()
                ? detail
                : e.getClass().getSimpleName() + ": " + e.getMessage();
            errorMessage = truncateErrorMessage(base);
            log.warn("어드민 테스트 SMS 발송 예외: 수신자={}", recipient.maskedPhone(), e);
        }

        logger.updateResult(logEntry.getId(), success, null, null, errorCode, errorMessage);

        return TestNotificationResponse.builder()
            .success(success)
            .sentAt(sentAt)
            .errorCode(errorCode)
            .errorMessage(errorMessage)
            .logId(logEntry.getId())
            .build();
    }

    @Override
    public TestNotificationResponse sendAlimtalk(String tenantId, User currentUser,
            TestAlimtalkRequest request) {
        ResolvedRecipient recipient = resolveRecipient(tenantId, currentUser,
            request.getRecipientMode(), request.getUserId());
        if (recipient.errorCode() != null) {
            return TestNotificationResponse.builder()
                .success(false)
                .errorCode(recipient.errorCode())
                .errorMessage(recipient.errorMessage())
                .build();
        }

        Map<String, String> params = request.getTemplateParams() == null
            ? new HashMap<>()
            : new HashMap<>(request.getTemplateParams());

        AdminTestNotificationLog logEntry = logger.logAttempt(tenantId, currentUser.getId(),
            currentUser.getUserId(), request.getRecipientMode(), recipient.userId(),
            recipient.maskedPhone(), TestNotificationChannel.ALIMTALK,
            request.getTemplateCode(), params, null, request.getReason());
        rateLimiter.recordAttempt(tenantId, currentUser.getId());

        LocalDateTime sentAt = LocalDateTime.now();
        boolean success;
        boolean fallbackUsed = false;
        String errorCode = null;
        String errorMessage = null;
        String solapiGroupId = null;
        String solapiMessageId = null;
        try {
            success = kakaoAlimTalkService.sendAlimTalk(recipient.phone(),
                request.getTemplateCode(), params);
            SolapiSendIds ids = consumeAlimtalkSendIdsSafely();
            if (ids != null) {
                solapiGroupId = ids.groupId();
                solapiMessageId = ids.messageId();
            }
            if (!success) {
                errorCode = ERROR_CODE_SEND_FAILED;
                String detail = consumeAlimtalkDetailSafely();
                errorMessage = truncateErrorMessage(detail != null && !detail.isBlank()
                    ? detail
                    : "KakaoAlimTalkService.sendAlimTalk returned false");
            }
        } catch (Exception e) {
            success = false;
            errorCode = ERROR_CODE_SEND_FAILED;
            SolapiSendIds ids = consumeAlimtalkSendIdsSafely();
            if (ids != null) {
                solapiGroupId = ids.groupId();
                solapiMessageId = ids.messageId();
            }
            String detail = consumeAlimtalkDetailSafely();
            String base = detail != null && !detail.isBlank()
                ? detail
                : e.getClass().getSimpleName() + ": " + e.getMessage();
            errorMessage = truncateErrorMessage(base);
            log.warn("어드민 테스트 알림톡 발송 예외: 수신자={}", recipient.maskedPhone(), e);
        }

        if (!success && request.isFallbackToSms()) {
            try {
                boolean fallbackOk = smsAuthService.sendNotificationMessage(
                    recipient.phone(),
                    "[알림톡 폴백] 템플릿=" + request.getTemplateCode() + " / 사유=" + request.getReason());
                fallbackUsed = true;
                if (fallbackOk) {
                    success = true;
                    errorCode = null;
                    errorMessage = "fallback to SMS success";
                } else {
                    String smsDetail = consumeSmsDetailSafely();
                    if (smsDetail != null && !smsDetail.isBlank()) {
                        errorMessage = truncateErrorMessage(
                            (errorMessage != null ? errorMessage : "")
                                + " | fallback SMS failed: " + smsDetail);
                    }
                }
            } catch (Exception e) {
                log.warn("어드민 테스트 알림톡 SMS 폴백 예외: 수신자={}", recipient.maskedPhone(), e);
            }
        }

        logger.updateResult(logEntry.getId(), success, solapiGroupId, solapiMessageId,
            errorCode, errorMessage);

        return TestNotificationResponse.builder()
            .success(success)
            .groupId(solapiGroupId)
            .messageId(solapiMessageId)
            .sentAt(sentAt)
            .errorCode(errorCode)
            .errorMessage(errorMessage)
            .fallbackUsed(fallbackUsed)
            .logId(logEntry.getId())
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TestNotificationHistoryItem> getHistory(String tenantId, User currentUser,
            LocalDate from, LocalDate to, TestNotificationChannel channel, Boolean success,
            Pageable pageable) {
        LocalDateTime fromInclusive = from != null ? from.atStartOfDay() : null;
        LocalDateTime toInclusive = to != null ? to.atTime(LocalTime.MAX) : null;
        return logRepository.searchHistory(tenantId, currentUser.getId(),
                fromInclusive, toInclusive, channel, success, pageable)
            .map(TestNotificationHistoryItem::fromEntity);
    }

    private ResolvedRecipient resolveRecipient(String tenantId, User currentUser,
            TestNotificationRecipientMode mode, Long userId) {
        if (mode == null) {
            return ResolvedRecipient.error(ERROR_CODE_PHONE_MODE_UNSUPPORTED,
                "recipientMode is required");
        }
        switch (mode) {
            case SELF:
                String selfPhone = decryptSafely(currentUser.getPhone());
                if (selfPhone == null || selfPhone.isBlank()) {
                    return ResolvedRecipient.error(ERROR_CODE_RECIPIENT_PHONE_MISSING,
                        "current user has no phone");
                }
                return new ResolvedRecipient(currentUser.getId(), selfPhone,
                    PhoneLogMasking.maskForLog(selfPhone), null, null);

            case USER:
                if (userId == null) {
                    return ResolvedRecipient.error(ERROR_CODE_USER_ID_REQUIRED,
                        "userId is required for USER mode");
                }
                User target = userRepository.findByTenantIdAndIdIgnoringDeleted(tenantId, userId)
                    .orElse(null);
                if (target == null || Boolean.TRUE.equals(target.getIsDeleted())) {
                    return ResolvedRecipient.error(ERROR_CODE_RECIPIENT_NOT_FOUND,
                        "user not found in current tenant");
                }
                String targetPhone = decryptSafely(target.getPhone());
                if (targetPhone == null || targetPhone.isBlank()) {
                    return ResolvedRecipient.error(ERROR_CODE_RECIPIENT_PHONE_MISSING,
                        "target user has no phone");
                }
                return new ResolvedRecipient(target.getId(), targetPhone,
                    PhoneLogMasking.maskForLog(targetPhone), null, null);

            default:
                return ResolvedRecipient.error(ERROR_CODE_PHONE_MODE_UNSUPPORTED,
                    "recipientMode " + mode + " is not supported (C3=self_plus_db)");
        }
    }

    /**
     * SMS 프로바이더 detail을 안전 조회한다. 실패해도 호출 흐름을 막지 않는다.
     *
     * @return 직전 SMS 발송 실패의 상세(상태코드 + 마스킹 본문) 또는 {@code null}
     */
    private String consumeSmsDetailSafely() {
        try {
            return smsAuthService.consumeLastErrorDetail();
        } catch (Exception e) {
            log.debug("SmsAuthService.consumeLastErrorDetail 실패 (무시): {}", e.getMessage());
            return null;
        }
    }

    /**
     * 알림톡 detail을 안전 조회한다.
     *
     * @return 직전 알림톡 발송 실패의 상세 또는 {@code null}
     */
    private String consumeAlimtalkDetailSafely() {
        try {
            return kakaoAlimTalkService.consumeLastErrorDetail();
        } catch (Exception e) {
            log.debug("KakaoAlimTalkService.consumeLastErrorDetail 실패 (무시): {}", e.getMessage());
            return null;
        }
    }

    /**
     * 알림톡 발송에서 솔라피가 반환한 식별자(groupId/messageId) 묶음을 안전 조회한다.
     *
     * <p>발송 성공·실패와 무관하게 솔라피가 식별자를 돌려준 경우 모두 보존되며, 어드민 감사로그와
     * 솔라피 콘솔 사후 추적 링크에 사용된다. 미구현·정보 없음·예외 시 모두 {@code null}.
     *
     * @return 직전 알림톡 발송의 식별자 묶음 또는 {@code null}
     */
    private SolapiSendIds consumeAlimtalkSendIdsSafely() {
        try {
            return kakaoAlimTalkService.consumeLastSolapiIds();
        } catch (Exception e) {
            log.debug("KakaoAlimTalkService.consumeLastSolapiIds 실패 (무시): {}", e.getMessage());
            return null;
        }
    }

    /**
     * {@code admin_test_notification_logs.error_message} VARCHAR(1000) 길이 안전 절단.
     *
     * @param value 원본
     * @return {@code null} 또는 최대 {@link #ERROR_MESSAGE_LOG_LIMIT}자
     */
    private static String truncateErrorMessage(String value) {
        if (value == null) {
            return null;
        }
        return value.length() <= ERROR_MESSAGE_LOG_LIMIT
            ? value
            : value.substring(0, ERROR_MESSAGE_LOG_LIMIT) + "…(truncated)";
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

    private static boolean containsIgnoreCase(String value, String needleLower) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(needleLower);
    }

    private UserRole parseRoleSafely(String role) {
        try {
            return UserRole.valueOf(role.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private List<TestNotificationAlimtalkTemplate.Variable> extractVariables(String extraDataJson) {
        if (extraDataJson == null || extraDataJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            JsonNode root = objectMapper.readTree(extraDataJson);
            JsonNode template = root.get("template");
            if (template == null || template.isNull()) {
                return Collections.emptyList();
            }
            String templateText = template.asText();
            List<TestNotificationAlimtalkTemplate.Variable> variables = new ArrayList<>();
            int idx = 0;
            while ((idx = templateText.indexOf("#{", idx)) != -1) {
                int end = templateText.indexOf('}', idx);
                if (end < 0) {
                    break;
                }
                String name = templateText.substring(idx + 2, end);
                if (variables.stream().noneMatch(v -> v.getName().equals(name))) {
                    variables.add(TestNotificationAlimtalkTemplate.Variable.builder()
                        .name(name)
                        .required(true)
                        .sampleValue(null)
                        .build());
                }
                idx = end + 1;
            }
            return variables;
        } catch (Exception e) {
            log.debug("ALIMTALK_TEMPLATE extraData 파싱 실패: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * 발송 대상 수신자 해석 결과(전화번호 원본 포함 — 메모리만).
     *
     * @param userId       수신 사용자 PK (SELF이면 본인)
     * @param phone        원본 전화번호(복호화)
     * @param maskedPhone  마스킹된 전화번호(로그·DB 저장용)
     * @param errorCode    검증 실패 시 코드(성공이면 null)
     * @param errorMessage 검증 실패 시 메시지
     */
    private record ResolvedRecipient(Long userId, String phone, String maskedPhone,
            String errorCode, String errorMessage) {

        static ResolvedRecipient error(String code, String message) {
            return new ResolvedRecipient(null, null, "n/a", code, message);
        }
    }
}
