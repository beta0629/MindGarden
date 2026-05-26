package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.TenantKakaoAlimtalkSettings;
import com.coresolution.consultation.integration.solapi.KakaoSolapiCredentialResolver;
import com.coresolution.consultation.integration.solapi.SolapiAlimTalkClient;
import com.coresolution.consultation.integration.solapi.SolapiAlimTalkRequest;
import com.coresolution.consultation.integration.solapi.SolapiAlimTalkResponse;
import com.coresolution.consultation.integration.solapi.SolapiCredentials;
import com.coresolution.consultation.integration.solapi.SolapiSendIds;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.TenantKakaoAlimtalkSettingsRepository;
import com.coresolution.consultation.service.KakaoAlimTalkService;
import com.coresolution.consultation.util.PhoneLogMasking;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import lombok.extern.slf4j.Slf4j;

/**
 * 카카오 알림톡 서비스 구현
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
@Slf4j
@Service
public class KakaoAlimTalkServiceImpl implements KakaoAlimTalkService {

    static final String PROVIDER_BIZMSG = "bizmsg";
    static final String PROVIDER_SOLAPI = "solapi";

    /** 직전 알림톡 발송 시도의 오류 상세(상태코드·errorCode·errorMessage 등). 호출 스레드 단위. */
    private static final ThreadLocal<String> LAST_ERROR_DETAIL = new ThreadLocal<>();
    /**
     * 직전 솔라피 알림톡 발송 호출에서 응답된 식별자(groupId/messageId). 호출 스레드 단위.
     * 어드민 감사로그·솔라피 콘솔 사후 추적을 위해 성공·실패와 무관하게 보존한다.
     */
    private static final ThreadLocal<SolapiSendIds> LAST_SEND_IDS = new ThreadLocal<>();
    /** 알림톡 errorMessage 절단 한계(감사 컬럼 안전). */
    private static final int ALIMTALK_ERROR_DETAIL_LIMIT = 500;

    @Value("${kakao.alimtalk.enabled:false}")
    private boolean alimTalkEnabled;
    
    @Value("${kakao.alimtalk.simulation-mode:true}")
    private boolean simulationMode;
    
    @Value("${kakao.alimtalk.api-key:}")
    private String apiKey;
    
    @Value("${kakao.alimtalk.sender-key:}")
    private String senderKey;
    
    @Value("${kakao.alimtalk.api-url:https://alimtalk-api.bizmsg.kr}")
    private String apiUrl;

    @Value("${kakao.alimtalk.provider:bizmsg}")
    private String provider;

    @Value("${kakao.alimtalk.solapi.sender-number:}")
    private String solapiSenderNumber;

    private final CommonCodeRepository commonCodeRepository;
    private final RestTemplate restTemplate;
    private final SolapiAlimTalkClient solapiAlimTalkClient;
    private final KakaoSolapiCredentialResolver solapiCredentialResolver;
    private final TenantKakaoAlimtalkSettingsRepository tenantKakaoAlimtalkSettingsRepository;

    /**
     * 운영용 생성자. 솔라피 의존성은 {@code provider=solapi} 분기에서만 사용된다.
     *
     * @param commonCodeRepository 공통 코드 저장소
     * @param solapiAlimTalkClient 솔라피 알림톡 클라이언트(provider 분기용)
     * @param solapiCredentialResolver 솔라피 자격 증명 resolver
     * @param tenantKakaoAlimtalkSettingsRepository 테넌트별 알림톡 비시크릿 설정
     */
    @Autowired
    public KakaoAlimTalkServiceImpl(
            CommonCodeRepository commonCodeRepository,
            SolapiAlimTalkClient solapiAlimTalkClient,
            KakaoSolapiCredentialResolver solapiCredentialResolver,
            TenantKakaoAlimtalkSettingsRepository tenantKakaoAlimtalkSettingsRepository) {
        this.commonCodeRepository = commonCodeRepository;
        this.restTemplate = new RestTemplate();
        this.solapiAlimTalkClient = solapiAlimTalkClient;
        this.solapiCredentialResolver = solapiCredentialResolver;
        this.tenantKakaoAlimtalkSettingsRepository = tenantKakaoAlimtalkSettingsRepository;

        initializeAlimTalkCommonCodes();
    }

    /**
     * 후방호환용 생성자. 솔라피 의존성이 없는 컨텍스트(레거시 테스트 등)에서만 사용된다.
     *
     * @param commonCodeRepository 공통 코드 저장소
     */
    public KakaoAlimTalkServiceImpl(CommonCodeRepository commonCodeRepository) {
        this(commonCodeRepository, null, null, null);
    }
    
    @Override
    public boolean sendAlimTalk(String phoneNumber, String templateCode, Map<String, String> templateParams) {
        return sendAlimTalk(phoneNumber, templateCode, null, templateParams);
    }
    
    @Override
    public boolean sendAlimTalk(String phoneNumber, String apiTemplateCode, String contentTemplateKey,
            Map<String, String> templateParams) {
        // 진입 시점에 잔여 detail·식별자를 비운다(이전 호출 누수 방지).
        LAST_ERROR_DETAIL.remove();
        LAST_SEND_IDS.remove();

        if (!alimTalkEnabled) {
            log.info("📱 알림톡 비활성화 상태 - SMS로 대체 발송 권장");
            LAST_ERROR_DETAIL.set("alimtalk disabled (kakao.alimtalk.enabled=false)");
            return false;
        }

        String contentKey = (contentTemplateKey != null && !contentTemplateKey.isBlank())
            ? contentTemplateKey.trim()
            : apiTemplateCode;
        boolean useSolapi = isSolapiProvider();

        log.info("📤 카카오 알림톡 발송 시작: 수신자={}, 템플릿(api)={}, contentKey={}, provider={}",
            PhoneLogMasking.maskForLog(phoneNumber), apiTemplateCode, contentKey,
            useSolapi ? PROVIDER_SOLAPI : PROVIDER_BIZMSG);

        try {
            boolean success = useSolapi
                ? sendViaSolapi(phoneNumber, apiTemplateCode, contentKey, templateParams)
                : sendViaBizmsg(phoneNumber, apiTemplateCode, contentKey, templateParams);

            if (success) {
                log.info("✅ 카카오 알림톡 발송 성공: 수신자={}, 템플릿={}",
                    PhoneLogMasking.maskForLog(phoneNumber), apiTemplateCode);
            } else {
                log.warn("⚠️ 카카오 알림톡 발송 실패: 수신자={}, 템플릿={}",
                    PhoneLogMasking.maskForLog(phoneNumber), apiTemplateCode);
            }
            return success;
        } catch (Exception e) {
            log.error("❌ 카카오 알림톡 발송 중 오류: 수신자={}, 템플릿={}",
                PhoneLogMasking.maskForLog(phoneNumber), apiTemplateCode, e);
            LAST_ERROR_DETAIL.set(truncateDetail(
                e.getClass().getSimpleName() + ": " + e.getMessage()));
            return false;
        }
    }

    @Override
    public String consumeLastErrorDetail() {
        String value = LAST_ERROR_DETAIL.get();
        LAST_ERROR_DETAIL.remove();
        return value;
    }

    @Override
    public SolapiSendIds consumeLastSolapiIds() {
        SolapiSendIds value = LAST_SEND_IDS.get();
        LAST_SEND_IDS.remove();
        return value;
    }

    private static String truncateDetail(String value) {
        if (value == null) {
            return null;
        }
        return value.length() <= ALIMTALK_ERROR_DETAIL_LIMIT
            ? value
            : value.substring(0, ALIMTALK_ERROR_DETAIL_LIMIT) + "…(truncated)";
    }

    /**
     * 비즈엠(bizmsg) provider 경로. 기존 단일 provider 호환.
     */
    private boolean sendViaBizmsg(String phoneNumber, String apiTemplateCode, String contentKey,
            Map<String, String> templateParams) {
        if (!simulationMode && (apiKey == null || apiKey.isEmpty() || senderKey == null || senderKey.isEmpty())) {
            log.warn("⚠️ 실제 모드에서 카카오 알림톡(bizmsg) API 키 또는 발신자 키가 설정되지 않았습니다");
            LAST_ERROR_DETAIL.set("bizmsg apiKey/senderKey not configured");
            return false;
        }

        Map<String, Object> requestData = new HashMap<>();
        requestData.put("senderKey", senderKey);
        requestData.put("templateCode", apiTemplateCode);
        requestData.put("recipientNo", phoneNumber);
        requestData.put("content", buildMessageContent(contentKey, templateParams));
        requestData.put("templateParameter", templateParams);
        requestData.put("requestDate",
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);
        headers.set("Content-Type", "application/json;charset=UTF-8");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestData, headers);
        return sendToKakaoApi(request);
    }

    /**
     * 솔라피(solapi) provider 경로. 발신 프로필·자격 증명은 ENV/Secrets에서 resolve.
     */
    private boolean sendViaSolapi(String phoneNumber, String apiTemplateCode, String contentKey,
            Map<String, String> templateParams) {
        if (simulationMode) {
            log.info("🎭 [시뮬레이션 모드] solapi 알림톡 발송 - 실제 API 호출 없음, 템플릿={}", apiTemplateCode);
            log.debug("📋 시뮬레이션 변수: contentKey={}, params={}", contentKey, templateParams);
            return true;
        }
        if (solapiAlimTalkClient == null || solapiCredentialResolver == null) {
            log.warn("⚠️ provider=solapi 구성에 SolapiAlimTalkClient/Resolver 빈이 주입되지 않음");
            LAST_ERROR_DETAIL.set("solapi alimtalk client/resolver beans missing");
            return false;
        }

        TenantKakaoAlimtalkSettings tenantSettings = loadTenantSettings();
        String apiKeyRef = tenantSettings != null ? tenantSettings.getKakaoApiKeyRef() : null;
        String senderKeyRef = tenantSettings != null ? tenantSettings.getKakaoSenderKeyRef() : null;

        SolapiCredentials credentials = solapiCredentialResolver.resolveCredentials(apiKeyRef);
        if (!credentials.isComplete()) {
            log.warn("⚠️ 실제 모드에서 solapi API 키/시크릿 resolve 실패. refPresent={}",
                apiKeyRef != null && !apiKeyRef.isBlank());
            LAST_ERROR_DETAIL.set("solapi credentials resolve failed (refPresent="
                + (apiKeyRef != null && !apiKeyRef.isBlank()) + ")");
            return false;
        }

        String pfId = solapiCredentialResolver.resolvePfId(senderKeyRef);
        if (pfId == null || pfId.isBlank()) {
            log.warn("⚠️ 실제 모드에서 solapi 발신 프로필(pfId) resolve 실패. refPresent={}",
                senderKeyRef != null && !senderKeyRef.isBlank());
            LAST_ERROR_DETAIL.set("solapi pfId resolve failed (refPresent="
                + (senderKeyRef != null && !senderKeyRef.isBlank()) + ")");
            return false;
        }

        String fromNumber = (solapiSenderNumber == null || solapiSenderNumber.isBlank())
            ? null
            : solapiSenderNumber.trim();

        SolapiAlimTalkRequest request = new SolapiAlimTalkRequest(
            credentials,
            pfId,
            apiTemplateCode,
            fromNumber,
            phoneNumber,
            templateParams != null ? templateParams : new HashMap<>());

        SolapiAlimTalkResponse response = solapiAlimTalkClient.send(request);
        // 성공·실패와 무관하게 어드민 감사로그·솔라피 콘솔 추적용 식별자를 보존한다.
        SolapiSendIds ids = new SolapiSendIds(response.groupId(), response.messageId());
        if (!ids.isEmpty()) {
            LAST_SEND_IDS.set(ids);
        }
        if (!response.success()) {
            log.warn("⚠️ solapi 알림톡 응답 실패: status={}, errorCode={}, errorMessage={}",
                response.statusCode(), response.errorCode(), response.errorMessage());
            LAST_ERROR_DETAIL.set(truncateDetail("Solapi ATA " + response.statusCode()
                + " " + safeText(response.errorCode())
                + ": " + safeText(response.errorMessage())));
        }
        return response.success();
    }

    private static String safeText(String value) {
        return value == null ? "" : value;
    }

    private TenantKakaoAlimtalkSettings loadTenantSettings() {
        if (tenantKakaoAlimtalkSettingsRepository == null) {
            return null;
        }
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            return null;
        }
        return tenantKakaoAlimtalkSettingsRepository
            .findByTenantIdAndIsDeletedFalse(tenantId)
            .orElse(null);
    }

    private boolean isSolapiProvider() {
        return provider != null && PROVIDER_SOLAPI.equalsIgnoreCase(provider.trim());
    }
    
    @Override
    public boolean sendConsultationConfirmed(String phoneNumber, String consultantName, String consultationDate, String consultationTime) {
        Map<String, String> params = new HashMap<>();
        params.put("consultantName", consultantName);
        params.put("consultationDate", consultationDate);
        params.put("consultationTime", consultationTime);
        
        return sendAlimTalk(phoneNumber, "CONSULTATION_CONFIRMED", params);
    }
    
    @Override
    public boolean sendConsultationReminder(String phoneNumber, String consultantName, String consultationTime) {
        Map<String, String> params = new HashMap<>();
        params.put("consultantName", consultantName);
        params.put("consultationTime", consultationTime);
        
        return sendAlimTalk(phoneNumber, "CONSULTATION_REMINDER", params);
    }
    
    @Override
    public boolean sendRefundCompleted(String phoneNumber, int refundSessions, long refundAmount) {
        Map<String, String> params = new HashMap<>();
        params.put("refundSessions", String.valueOf(refundSessions));
        params.put("refundAmount", String.format("%,d", refundAmount));
        
        return sendAlimTalk(phoneNumber, "REFUND_COMPLETED", params);
    }
    
    @Override
    public boolean sendScheduleChanged(String phoneNumber, String consultantName, String oldDateTime, String newDateTime) {
        Map<String, String> params = new HashMap<>();
        params.put("consultantName", consultantName);
        params.put("oldDateTime", oldDateTime);
        params.put("newDateTime", newDateTime);
        
        return sendAlimTalk(phoneNumber, "SCHEDULE_CHANGED", params);
    }

    @Override
    public boolean sendAutoCancelRefund(String phoneNumber, int cancelCount, String mypageUrl) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            log.warn("환불 자동 취소 알림톡 발송 실패: 전화번호 없음");
            return false;
        }
        int safeCount = Math.max(cancelCount, 0);
        Map<String, String> params = new HashMap<>();
        params.put("cancelCount", String.valueOf(safeCount));
        params.put("mypageUrl", mypageUrl != null ? mypageUrl.trim() : "");
        // contentKey 와 apiTemplateCode 분리: 솔라피 비즈 템플릿 코드는 공통코드
        // ALIMTALK_BIZ_TEMPLATE_CODE 룩업(NotificationServiceImpl 가 일반 알림 발송 시 사용하는 동일 키)으로
        // 운영 측 검수 ID 가 시드되면 그것을 사용한다. 미시드 상태에서는 내부 키 AUTO_CANCEL_REFUND 가
        // 그대로 사용되어 솔라피 응답 1042/2032 등으로 실패해도 다른 채널은 영향 없도록 false 만 반환한다.
        String apiTemplateCode = resolveAlimTalkBizTemplateCodeOverride("AUTO_CANCEL_REFUND");
        return sendAlimTalk(phoneNumber, apiTemplateCode, "AUTO_CANCEL_REFUND", params);
    }

    /**
     * {@code ALIMTALK_BIZ_TEMPLATE_CODE} 공통코드(테넌트 행 → 코어 행, codeLabel)에서 비즈 템플릿 코드
     * 매핑을 조회한다. 매핑이 없으면 입력 키를 그대로 반환한다.
     *
     * <p>{@link com.coresolution.consultation.service.impl.NotificationServiceImpl#resolveAlimTalkBizTemplateCode}
     * 가 사용하는 동일 공통코드를 재사용하므로, 운영 측에서 검수 통과 후 시드 한 번이면 모든 채널이
     * 즉시 검수 ID 로 발송한다.</p>
     *
     * @param logicalKey 내부 키(예: {@code AUTO_CANCEL_REFUND})
     * @return 공통코드 codeLabel 또는 입력 키
     */
    private String resolveAlimTalkBizTemplateCodeOverride(String logicalKey) {
        try {
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId != null && !tenantId.isEmpty()) {
                java.util.Optional<CommonCode> tenantRow = commonCodeRepository
                        .findTenantCodeByGroupAndValue(tenantId, "ALIMTALK_BIZ_TEMPLATE_CODE", logicalKey);
                if (tenantRow.isPresent() && tenantRow.get().getCodeLabel() != null
                        && !tenantRow.get().getCodeLabel().isBlank()) {
                    return tenantRow.get().getCodeLabel().trim();
                }
            }
            java.util.Optional<CommonCode> coreRow = commonCodeRepository
                    .findCoreCodeByGroupAndValue("ALIMTALK_BIZ_TEMPLATE_CODE", logicalKey);
            if (coreRow.isPresent() && coreRow.get().getCodeLabel() != null
                    && !coreRow.get().getCodeLabel().isBlank()) {
                return coreRow.get().getCodeLabel().trim();
            }
        } catch (Exception e) {
            log.debug("ALIMTALK_BIZ_TEMPLATE_CODE 조회 실패, 내부 키 사용: key={}, {}", logicalKey, e.getMessage());
        }
        return logicalKey;
    }
    
    @Override
    public boolean isServiceAvailable() {
        if (!alimTalkEnabled) {
            return false;
        }

        if (simulationMode) {
            log.debug("🎭 시뮬레이션 모드: 알림톡 서비스 사용 가능 (provider={})",
                isSolapiProvider() ? PROVIDER_SOLAPI : PROVIDER_BIZMSG);
            return true;
        }

        if (isSolapiProvider()) {
            if (solapiCredentialResolver == null) {
                log.warn("⚠️ provider=solapi 구성에 KakaoSolapiCredentialResolver 빈이 없음");
                return false;
            }
            boolean ready = solapiCredentialResolver.hasDefaultCredentials()
                && solapiCredentialResolver.hasDefaultPfId();
            if (!ready) {
                log.warn("⚠️ solapi 알림톡 default 자격 증명 또는 pfId가 설정되지 않았습니다");
            }
            return ready;
        }

        boolean hasKeys = apiKey != null && !apiKey.isEmpty()
            && senderKey != null && !senderKey.isEmpty();
        if (!hasKeys) {
            log.warn("⚠️ 카카오 알림톡 API 키 또는 발신자 키가 설정되지 않았습니다");
        }
        return hasKeys;
    }
    
    /**
     * 템플릿 코드에 따른 메시지 내용 생성 (공통 코드 기반)
     */
    private String buildMessageContent(String templateCode, Map<String, String> params) {
        try {
            // 공통 코드에서 템플릿 조회 (테넌트별)
            String tenantId = TenantContextHolder.getTenantId();
            List<CommonCode> templateCodes = tenantId != null 
                ? commonCodeRepository.findByTenantIdAndCodeGroupOrderBySortOrderAsc(tenantId, "ALIMTALK_TEMPLATE")
                : commonCodeRepository.findByCodeGroupOrderBySortOrderAsc("ALIMTALK_TEMPLATE");
            
            for (CommonCode code : templateCodes) {
                if (templateCode.equals(code.getCodeValue())) {
                    String template = null;
                    
                    // extra_data에서 template 필드 추출 시도
                    if (code.getExtraData() != null && !code.getExtraData().isEmpty()) {
                        try {
                            ObjectMapper mapper = new ObjectMapper();
                            JsonNode jsonNode = mapper.readTree(code.getExtraData());
                            if (jsonNode.has("template")) {
                                template = jsonNode.get("template").asText();
                            }
                        } catch (Exception e) {
                            log.warn("⚠️ extra_data에서 template 추출 실패: {}", e.getMessage());
                        }
                    }
                    
                    // extra_data에 template이 없으면 codeLabel 사용 (하위 호환성)
                    if (template == null || template.isEmpty()) {
                        template = code.getCodeLabel();
                    }
                    
                    // 파라미터 치환
                    String message = template;
                    if (params != null) {
                        for (Map.Entry<String, String> param : params.entrySet()) {
                            message = message.replace("#{" + param.getKey() + "}", param.getValue());
                        }
                    }
                    
                    log.debug("📝 공통 코드 템플릿 사용: {}", templateCode);
                    return message;
                }
            }
            
            log.warn("⚠️ 공통 코드에서 템플릿을 찾을 수 없음: {}, 기본 템플릿 사용", templateCode);
            
        } catch (Exception e) {
            log.error("❌ 공통 코드 템플릿 조회 실패: {}", templateCode, e);
        }
        
        // 공통 코드에서 찾지 못한 경우 기본 템플릿 사용
        return getDefaultTemplate(templateCode, params);
    }
    
    /**
     * 기본 템플릿 (공통 코드 실패 시 백업용)
     */
    private String getDefaultTemplate(String templateCode, Map<String, String> params) {
        switch (templateCode) {
            case "CONSULTATION_CONFIRMED":
                return String.format(
                    "[마인드가든] 상담이 확정되었습니다.\n\n" +
                    "📅 상담일: %s\n" +
                    "⏰ 시간: %s\n" +
                    "👩‍⚕️ 상담사: %s\n\n" +
                    "상담 10분 전에 다시 알려드리겠습니다.\n" +
                    "감사합니다.",
                    params.getOrDefault("consultationDate", "미정"),
                    params.getOrDefault("consultationTime", "미정"), 
                    params.getOrDefault("consultantName", "상담사")
                );
                
            case "CONSULTATION_REMINDER":
                return String.format(
                    "[마인드가든] 1시간 후 상담이 예정되어 있습니다.\n\n" +
                    "⏰ 상담시간: %s\n" +
                    "👩‍⚕️ 상담사: %s\n\n" +
                    "준비해주시고 시간에 맞춰 참석해주세요.\n" +
                    "감사합니다.",
                    params.getOrDefault("consultationTime", "미정"),
                    params.getOrDefault("consultantName", "상담사")
                );
                
            case "REFUND_COMPLETED":
                return String.format(
                    "[마인드가든] 환불이 완료되었습니다.\n\n" +
                    "💰 환불 회기: %s회\n" +
                    "💳 환불 금액: %s원\n\n" +
                    "환불 금액은 결제하신 계좌로 2-3일 내에 입금됩니다.\n" +
                    "감사합니다.",
                    params.getOrDefault("refundSessions", "0"),
                    params.getOrDefault("refundAmount", "0")
                );
                
            case "SCHEDULE_CHANGED":
                return String.format(
                    "[마인드가든] 상담 일정이 변경되었습니다.\n\n" +
                    "👩‍⚕️ 상담사: %s\n" +
                    "📅 변경 전: %s\n" +
                    "📅 변경 후: %s\n\n" +
                    "변경된 일정에 맞춰 참석해주세요.\n" +
                    "감사합니다.",
                    params.getOrDefault("consultantName", "상담사"),
                    params.getOrDefault("oldDateTime", "미정"),
                    params.getOrDefault("newDateTime", "미정")
                );
            
            case "CONSULTATION_CANCELLED":
                return String.format(
                    "[마인드가든] 상담 예약이 취소 처리되었습니다.\n\n" +
                    "👩‍⚕️ 상담사: %s\n" +
                    "📅 예약 일시: %s\n\n" +
                    "자세한 내용은 앱에서 확인해 주세요.",
                    params.getOrDefault("consultantName", "상담사"),
                    params.getOrDefault("cancelledDateTime", "미정")
                );
                
            default:
                return "마인드가든에서 알림을 보내드립니다.";
        }
    }
    
    /**
     * 카카오 API 실제 호출
     */
    private boolean sendToKakaoApi(HttpEntity<Map<String, Object>> request) {
        try {
            if (simulationMode) {
                // 시뮬레이션 모드
                log.info("🎭 [시뮬레이션 모드] 카카오 알림톡 발송 성공 - 실제 API 호출 없음");
                log.debug("📋 시뮬레이션 요청 데이터: {}", request.getBody());
                return true;
            }
            
            // 실제 카카오 알림톡 API 호출
            log.info("📡 실제 카카오 알림톡 API 호출 시작");
            
            String url = apiUrl + "/v2/sender/send";
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                Map<String, Object> responseBody = response.getBody();
                boolean success = "0000".equals(responseBody.get("resultCode")); // 카카오 성공 코드
                
                if (success) {
                    log.info("✅ 카카오 알림톡 API 호출 성공");
                } else {
                    log.warn("⚠️ 카카오 알림톡 API 응답 오류: {}", responseBody);
                    LAST_ERROR_DETAIL.set(truncateDetail("Bizmsg " + response.getStatusCode()
                        + ": " + responseBody));
                }
                
                return success;
            } else {
                log.error("❌ 카카오 알림톡 API HTTP 오류: {}", response.getStatusCode());
                LAST_ERROR_DETAIL.set("Bizmsg HTTP " + response.getStatusCode());
                return false;
            }
            
        } catch (Exception e) {
            log.error("❌ 카카오 알림톡 API 호출 실패", e);
            LAST_ERROR_DETAIL.set(truncateDetail(
                e.getClass().getSimpleName() + ": " + e.getMessage()));
            return false;
        }
    }
    
    /**
     * 알림톡 관련 공통 코드 초기화
     */
    private void initializeAlimTalkCommonCodes() {
        try {
            // ALIMTALK_TEMPLATE 그룹 확인 및 생성
            List<CommonCode> templateCodes = commonCodeRepository.findByCodeGroupOrderBySortOrderAsc("ALIMTALK_TEMPLATE");
            // 기존 데이터 중 code_label이 100자 초과하는 경우 삭제하고 재생성
            if (!templateCodes.isEmpty()) {
                for (CommonCode code : templateCodes) {
                    try {
                        if (code.getCodeLabel() != null && code.getCodeLabel().length() > 100) {
                            log.warn("⚠️ 잘못된 code_label 데이터 삭제: {} (길이: {})", code.getCodeValue(), code.getCodeLabel().length());
                            commonCodeRepository.delete(code);
                        }
                    } catch (Exception e) {
                        log.error("⚠️ 기존 코드 삭제 중 오류 (무시하고 계속): {}", code.getCodeValue(), e);
                    }
                }
                // 삭제 후 다시 확인
                try {
                    templateCodes = commonCodeRepository.findByCodeGroupOrderBySortOrderAsc("ALIMTALK_TEMPLATE");
                } catch (Exception e) {
                    log.error("⚠️ 템플릿 코드 조회 중 오류 (빈 리스트로 계속):", e);
                    templateCodes = new ArrayList<>();
                }
            }
            if (templateCodes.isEmpty()) {
                log.info("🔧 ALIMTALK_TEMPLATE 공통 코드 그룹 생성 중...");
                
                // 상담 예약 확정 템플릿
                createCommonCode("ALIMTALK_TEMPLATE", "CONSULTATION_CONFIRMED", 
                    "상담 확정 알림", 
                    null,
                    "{\"category\":\"consultation\",\"priority\":\"high\",\"template\":\"[마인드가든] 상담이 확정되었습니다.\\n\\n📅 상담일: #{consultationDate}\\n⏰ 시간: #{consultationTime}\\n👩‍⚕️ 상담사: #{consultantName}\\n\\n상담 10분 전에 다시 알려드리겠습니다.\\n감사합니다.\"}", 1);
                
                // 상담 리마인더 템플릿
                createCommonCode("ALIMTALK_TEMPLATE", "CONSULTATION_REMINDER", 
                    "상담 리마인더", 
                    null,
                    "{\"category\":\"consultation\",\"priority\":\"high\",\"template\":\"[마인드가든] 1시간 후 상담이 예정되어 있습니다.\\n\\n⏰ 상담시간: #{consultationTime}\\n👩‍⚕️ 상담사: #{consultantName}\\n\\n준비해주시고 시간에 맞춰 참석해주세요.\\n감사합니다.\"}", 2);
                
                // 환불 완료 템플릿
                createCommonCode("ALIMTALK_TEMPLATE", "REFUND_COMPLETED", 
                    "환불 완료 알림", 
                    null,
                    "{\"category\":\"payment\",\"priority\":\"medium\",\"template\":\"[마인드가든] 환불이 완료되었습니다.\\n\\n💰 환불 회기: #{refundSessions}회\\n💳 환불 금액: #{refundAmount}원\\n\\n환불 금액은 결제하신 계좌로 2-3일 내에 입금됩니다.\\n감사합니다.\"}", 3);
                
                // 일정 변경 템플릿
                createCommonCode("ALIMTALK_TEMPLATE", "SCHEDULE_CHANGED", 
                    "일정 변경 알림", 
                    null,
                    "{\"category\":\"consultation\",\"priority\":\"medium\",\"template\":\"[마인드가든] 상담 일정이 변경되었습니다.\\n\\n👩‍⚕️ 상담사: #{consultantName}\\n📅 변경 전: #{oldDateTime}\\n📅 변경 후: #{newDateTime}\\n\\n변경된 일정에 맞춰 참석해주세요.\\n감사합니다.\"}", 4);
                
                // 결제 완료 템플릿
                createCommonCode("ALIMTALK_TEMPLATE", "PAYMENT_COMPLETED", 
                    "결제 완료 알림", 
                    null,
                    "{\"category\":\"payment\",\"priority\":\"medium\",\"template\":\"[마인드가든] 결제가 완료되었습니다.\\n\\n💳 결제 금액: #{paymentAmount}원\\n📦 패키지: #{packageName}\\n👩‍⚕️ 상담사: #{consultantName}\\n\\n상담 예약을 진행해주세요.\\n감사합니다.\"}", 5);
                
                log.info("✅ ALIMTALK_TEMPLATE 공통 코드 생성 완료");
            }
            
            // ALIMTALK_CONFIG 그룹 확인 및 생성
            String tenantId = TenantContextHolder.getTenantId();
            List<CommonCode> configCodes = tenantId != null 
                ? commonCodeRepository.findByTenantIdAndCodeGroupOrderBySortOrderAsc(tenantId, "ALIMTALK_CONFIG")
                : commonCodeRepository.findByCodeGroupOrderBySortOrderAsc("ALIMTALK_CONFIG");
            if (configCodes.isEmpty()) {
                log.info("🔧 ALIMTALK_CONFIG 공통 코드 그룹 생성 중...");
                
                createCommonCode("ALIMTALK_CONFIG", "ENABLED", "활성화", null, "{\"value\":true}", 1);
                // dead seed 제거(2026-05-23 라운드) — ALIMTALK_CONFIG.FALLBACK_TO_SMS 사용처 0.
                // SMS 폴백은 BatchNotificationDispatchServiceImpl 내부 정책(F1/F2)으로 일원화.
                createCommonCode("ALIMTALK_CONFIG", "MAX_RETRY_COUNT", "최대 재시도 횟수", null, "{\"value\":3}", 3);
                createCommonCode("ALIMTALK_CONFIG", "TIMEOUT_SECONDS", "타임아웃 시간", null, "{\"value\":30}", 4);
                
                log.info("✅ ALIMTALK_CONFIG 공통 코드 생성 완료");
            }
            
        } catch (Exception e) {
            log.error("❌ 알림톡 관련 공통 코드 초기화 실패", e);
        }
    }
    
    /**
     * 공통 코드 생성 헬퍼 메서드
     * @param codeGroup 코드 그룹
     * @param codeValue 코드 값
     * @param codeLabel 짧은 제목 (100자 이하)
     * @param codeDescription 긴 템플릿 내용 (codeLabel이 길면 여기에 저장)
     * @param extraData 추가 데이터
     * @param sortOrder 정렬 순서
     */
    private void createCommonCode(String codeGroup, String codeValue, String codeLabel, String codeDescription, String extraData, int sortOrder) {
        try {
            // codeLabel이 null이거나 비어있으면 codeValue 사용
            if (codeLabel == null || codeLabel.trim().isEmpty()) {
                codeLabel = codeValue.replace("_", " ");
            }
            
            // codeLabel이 100자 초과하면 자동으로 잘라서 저장
            String finalCodeLabel = codeLabel;
            if (codeLabel != null && codeLabel.length() > 100) {
                finalCodeLabel = codeLabel.substring(0, 97) + "...";
                // 원본 내용은 codeDescription에 저장
                if (codeDescription == null || codeDescription.trim().isEmpty()) {
                    codeDescription = codeLabel;
                }
            }
            
            // 최종 검증: 항상 100자 이하로 보장
            if (finalCodeLabel != null && finalCodeLabel.length() > 100) {
                finalCodeLabel = finalCodeLabel.substring(0, 100);
            }
            
            CommonCode commonCode = new CommonCode();
            commonCode.setCodeGroup(codeGroup);
            commonCode.setCodeValue(codeValue);
            commonCode.setCodeLabel(finalCodeLabel); // 항상 100자 이하
            commonCode.setCodeDescription(codeDescription);
            commonCode.setExtraData(extraData);
            commonCode.setSortOrder(sortOrder);
            commonCode.setIsActive(true);
            commonCode.setCreatedAt(LocalDateTime.now());
            commonCode.setUpdatedAt(LocalDateTime.now());
            
            commonCodeRepository.save(commonCode);
            log.debug("📝 알림톡 공통 코드 생성: {}:{} = {} (길이: {})", codeGroup, codeValue, finalCodeLabel, finalCodeLabel.length());
            
        } catch (Exception e) {
            log.error("❌ 알림톡 공통 코드 생성 실패: {}:{} (codeLabel 길이: {})", codeGroup, codeValue, 
                codeLabel != null ? codeLabel.length() : 0, e);
            // 예외 발생해도 서버 시작은 계속되도록 함
        }
    }
}
