package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
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
    static final String ERROR_CODE_SEND_FAILED = NotificationDispatchHelper.ERROR_CODE_SEND_FAILED;
    static final String ERROR_CODE_ALIMTALK_DISABLED = "ALIMTALK_SERVICE_UNAVAILABLE";
    /** 라이브 템플릿 조회 사전 검증 — 솔라피 자격증명(테넌트 settings + ENV) 모두 미설정. */
    static final String ERROR_CODE_ALIMTALK_CREDENTIALS_MISSING = "ALIMTALK_CREDENTIALS_MISSING";
    /** 라이브 템플릿 조회 사전 검증 — 솔라피 발신 프로필(pfId)이 테넌트 settings·ENV 모두 미설정. */
    static final String ERROR_CODE_ALIMTALK_PFID_MISSING = "ALIMTALK_PFID_MISSING";
    /**
     * 어드민 도구 전용 — 공통코드 {@code codeValue} 가 공통코드 그룹
     * {@code ALIMTALK_BIZ_TEMPLATE_CODE} 의 실 Solapi {@code templateId} 와 매핑되지 않음.
     *
     * <p>{@code admin_test_notification_logs.error_code} 컬럼 {@code VARCHAR(50)} — 19자.
     */
    static final String ERROR_CODE_TEMPLATE_NOT_MAPPED = "TEMPLATE_NOT_MAPPED";

    static final String SOURCE_COMMON_CODE = "COMMON_CODE";
    static final String SOURCE_SOLAPI = "SOLAPI";

    static final String COMMON_CODE_GROUP_ALIMTALK_TEMPLATE = "ALIMTALK_TEMPLATE";
    /**
     * 공통코드 codeValue(예: {@code PAYMENT_COMPLETED}) → Solapi 실 templateId({@code KA01TP…})
     * 매핑이 저장되는 공통코드 그룹.
     *
     * <p>운영 호출부 {@code NotificationServiceImpl.resolveAlimTalkBizTemplateCode} 와 동일한
     * 그룹을 사용하여 SSOT 를 보장한다.
     */
    static final String COMMON_CODE_GROUP_ALIMTALK_BIZ_TEMPLATE_CODE = "ALIMTALK_BIZ_TEMPLATE_CODE";

    private static final int MAX_RECIPIENT_RESULTS = 100;

    private final UserRepository userRepository;
    private final CommonCodeRepository commonCodeRepository;
    private final AdminTestNotificationLogRepository logRepository;
    private final AdminTestNotificationLogger logger;
    private final AdminTestNotificationRateLimiter rateLimiter;
    private final SmsAuthService smsAuthService;
    private final KakaoAlimTalkService kakaoAlimTalkService;
    private final NotificationDispatchHelper dispatchHelper;
    private final AlimtalkTemplateMappingResolver templateMappingResolver;
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
        // 어드민 UI "매핑없음" 뱃지용 — codeValue 마다 ALIMTALK_BIZ_TEMPLATE_CODE 매핑 lookup 캐시.
        // codes 사이즈가 작아 N+1이 실질적 문제가 안 되나, 동일 그룹 내 중복 호출은 피한다.
        Map<String, Boolean> mappingPresenceCache = new LinkedHashMap<>();
        for (CommonCode code : codes) {
            if (Boolean.FALSE.equals(code.getIsActive())) {
                continue;
            }
            String codeValue = code.getCodeValue();
            if (codeValue == null || !seenCodeValues.add(codeValue)) {
                continue;
            }
            boolean mappingPresent = mappingPresenceCache.computeIfAbsent(codeValue,
                cv -> resolveSolapiTemplateId(tenantId, cv) != null);
            templates.add(TestNotificationAlimtalkTemplate.builder()
                .templateCode(codeValue)
                .title(code.getCodeLabel())
                .status(null)
                .variables(extractVariables(code.getExtraData()))
                .content(extractTemplateBodyText(code.getExtraData()))
                .source(SOURCE_COMMON_CODE)
                .solapiTemplateIdPresent(mappingPresent)
                .build());
        }
        return templates;
    }

    /**
     * 공통코드 그룹 {@code ALIMTALK_BIZ_TEMPLATE_CODE} 매핑 lookup 을
     * {@link AlimtalkTemplateMappingResolver} 에 위임한다(SSOT).
     *
     * @param tenantId  테넌트 ID
     * @param codeValue 공통코드 codeValue
     * @return Solapi 실 templateId 또는 매핑 없음 시 {@code null}
     */
    String resolveSolapiTemplateId(String tenantId, String codeValue) {
        return templateMappingResolver.resolveSolapiTemplateId(tenantId, codeValue);
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
            // 라이브 응답의 content 에는 솔라피 콘솔에 등록된 본문(`#{변수명}` 포함)이 들어있다.
            // 공통코드 모드와 동일한 추출기를 재사용하여 어드민 UI가 변수 입력 폼을 자동 생성하도록 한다.
            templates.add(TestNotificationAlimtalkTemplate.builder()
                .templateCode(meta.templateId())
                .title(meta.name())
                .status(meta.status())
                .variables(extractVariablesFromText(meta.content()))
                .content(meta.content())
                .source(SOURCE_SOLAPI)
                // 라이브 출처는 사용자가 실 Solapi templateId 를 직접 선택하는 상태이므로 항상 true.
                .solapiTemplateIdPresent(true)
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
        NotificationDispatchHelper.DispatchResult dispatch =
            dispatchHelper.dispatchSms(recipient.phone(), request.getMessage());

        logger.updateResult(logEntry.getId(), dispatch.success(), null, null,
            dispatch.errorCode(), dispatch.errorMessage());

        return TestNotificationResponse.builder()
            .success(dispatch.success())
            .sentAt(sentAt)
            .errorCode(dispatch.errorCode())
            .errorMessage(dispatch.errorMessage())
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

        // 결함 C 가드 — 공통코드(codeValue) 모드에서는 ALIMTALK_BIZ_TEMPLATE_CODE 매핑이 필수.
        // 라이브(SOLAPI) 모드는 사용자가 이미 실 templateId(KA01TP…) 를 선택했으므로 매핑 lookup skip.
        // templateSource 가 null/blank 이면 기존 호출자 호환을 위해 COMMON_CODE 로 간주.
        boolean liveMode = isLiveTemplateSource(request.getTemplateSource());
        String effectiveTemplateCode = request.getTemplateCode();
        if (!liveMode) {
            String mappedTemplateId = resolveSolapiTemplateId(tenantId, request.getTemplateCode());
            if (mappedTemplateId == null) {
                String message = "Solapi 템플릿 매핑이 없습니다 ("
                    + request.getTemplateCode() + "). 공통코드 그룹 "
                    + COMMON_CODE_GROUP_ALIMTALK_BIZ_TEMPLATE_CODE
                    + " 에 추가하거나, 어드민 UI '솔라피 전체 보기' 토글로 실제 templateId 를 선택해 주세요.";
                AdminTestNotificationLog blockedLog = logger.logAttempt(tenantId,
                    currentUser.getId(), currentUser.getUserId(), request.getRecipientMode(),
                    recipient.userId(), recipient.maskedPhone(),
                    TestNotificationChannel.ALIMTALK, request.getTemplateCode(), params, null,
                    request.getReason());
                logger.updateResult(blockedLog.getId(), false, null, null,
                    ERROR_CODE_TEMPLATE_NOT_MAPPED, NotificationDispatchHelper.truncate(message));
                log.warn("어드민 테스트 알림톡 발송 차단 — 공통코드 매핑 없음: codeValue={}, tenantId={}",
                    request.getTemplateCode(), tenantId);
                return TestNotificationResponse.builder()
                    .success(false)
                    .sentAt(LocalDateTime.now())
                    .errorCode(ERROR_CODE_TEMPLATE_NOT_MAPPED)
                    .errorMessage(message)
                    .logId(blockedLog.getId())
                    .build();
            }
            effectiveTemplateCode = mappedTemplateId;
        }

        AdminTestNotificationLog logEntry = logger.logAttempt(tenantId, currentUser.getId(),
            currentUser.getUserId(), request.getRecipientMode(), recipient.userId(),
            recipient.maskedPhone(), TestNotificationChannel.ALIMTALK,
            request.getTemplateCode(), params, null, request.getReason());
        rateLimiter.recordAttempt(tenantId, currentUser.getId());

        LocalDateTime sentAt = LocalDateTime.now();
        NotificationDispatchHelper.DispatchResult dispatch =
            dispatchHelper.dispatchAlimtalk(recipient.phone(), effectiveTemplateCode, params);
        boolean success = dispatch.success();
        boolean fallbackUsed = false;
        String errorCode = dispatch.errorCode();
        String errorMessage = dispatch.errorMessage();
        String solapiGroupId = dispatch.solapiGroupId();
        String solapiMessageId = dispatch.solapiMessageId();

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
                    String smsDetail = dispatchHelper.consumeSmsDetailSafely();
                    if (smsDetail != null && !smsDetail.isBlank()) {
                        errorMessage = NotificationDispatchHelper.truncate(
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
     * 알림톡 발송 요청의 템플릿 출처가 라이브(Solapi) 모드인지 판정한다.
     *
     * <p>판정 기준 (이중 안전망):
     * <ol>
     *   <li>{@code templateSource} 가 명시적으로 {@code SOLAPI} 이면 라이브.</li>
     *   <li>플래그가 null/blank/그 외 값이면 {@code COMMON_CODE} 로 간주(기존 호출자 호환).</li>
     * </ol>
     *
     * <p>실 운영 데이터에서 Solapi 가 발급하는 templateId 는 모두 {@code KA01TP} prefix 로 시작하지만,
     * 휴리스틱은 추후 prefix 변경 시 깨지기 쉬워 사용하지 않는다. UI 토글 ON 이면 명시적으로
     * {@code SOLAPI} 를 보내도록 한다.
     *
     * @param templateSource 요청의 {@code templateSource}
     * @return 라이브 모드면 {@code true}
     */
    static boolean isLiveTemplateSource(String templateSource) {
        return templateSource != null
            && SOURCE_SOLAPI.equalsIgnoreCase(templateSource.trim());
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

    /**
     * 공통코드 {@code extra_data} JSON 문자열의 {@code template} 필드에서 변수를 추출한다.
     *
     * <p>본 메서드는 공통코드 모드 전용 wrapper다. 라이브 모드는
     * {@link #extractVariablesFromText(String)}를 직접 호출한다. 내부 로직은 동일하다.
     *
     * @param extraDataJson 공통코드 {@code extra_data} JSON 문자열(null/blank 허용)
     * @return 추출된 변수 메타 리스트(불변, 빈 리스트 가능)
     */
    List<TestNotificationAlimtalkTemplate.Variable> extractVariables(String extraDataJson) {
        if (extraDataJson == null || extraDataJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            JsonNode root = objectMapper.readTree(extraDataJson);
            JsonNode template = root.get("template");
            if (template == null || template.isNull()) {
                return Collections.emptyList();
            }
            return extractVariablesFromText(template.asText());
        } catch (Exception e) {
            log.debug("ALIMTALK_TEMPLATE extraData 파싱 실패: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * 알림톡 템플릿 본문 문자열에서 {@code #{변수명}} 형식의 변수를 추출한다.
     *
     * <p>중복 변수명은 1건으로 dedupe. {@code required=true}, {@code sampleValue=null} 기본.
     * 공통코드·라이브 모드 양쪽에서 동일 추출 로직을 재사용한다.
     *
     * @param templateText 템플릿 본문(null/blank 허용)
     * @return 추출된 변수 메타 리스트(불변, 빈 리스트 가능)
     */
    List<TestNotificationAlimtalkTemplate.Variable> extractVariablesFromText(String templateText) {
        if (templateText == null || templateText.isBlank()) {
            return Collections.emptyList();
        }
        List<TestNotificationAlimtalkTemplate.Variable> variables = new ArrayList<>();
        int idx = 0;
        while ((idx = templateText.indexOf("#{", idx)) != -1) {
            int end = templateText.indexOf('}', idx + 2);
            if (end < 0) {
                break;
            }
            String name = templateText.substring(idx + 2, end);
            if (!name.isBlank()
                && variables.stream().noneMatch(v -> v.getName().equals(name))) {
                variables.add(TestNotificationAlimtalkTemplate.Variable.builder()
                    .name(name)
                    .required(true)
                    .sampleValue(null)
                    .build());
            }
            idx = end + 1;
        }
        return variables;
    }

    /**
     * 공통코드 {@code extra_data} JSON 문자열에서 템플릿 본문({@code template}) 텍스트를 추출한다.
     *
     * <p>어드민 도구의 본문 미리보기 노출에 사용된다. 파싱 실패·필드 부재 시 {@code null}.
     *
     * @param extraDataJson 공통코드 {@code extra_data} JSON 문자열(null/blank 허용)
     * @return 템플릿 본문 또는 {@code null}
     */
    private String extractTemplateBodyText(String extraDataJson) {
        if (extraDataJson == null || extraDataJson.isBlank()) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(extraDataJson);
            JsonNode template = root.get("template");
            if (template == null || template.isNull()) {
                return null;
            }
            String text = template.asText();
            return text == null || text.isBlank() ? null : text;
        } catch (Exception e) {
            log.debug("ALIMTALK_TEMPLATE extra_data 본문 추출 실패: {}", e.getMessage());
            return null;
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
