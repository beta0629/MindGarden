package com.mindgarden.consultation.service.impl;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.repository.CommonCodeRepository;
import com.mindgarden.consultation.service.KakaoAlimTalkService;
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
    
    private final CommonCodeRepository commonCodeRepository;
    private final RestTemplate restTemplate;
    
    public KakaoAlimTalkServiceImpl(CommonCodeRepository commonCodeRepository) {
        this.commonCodeRepository = commonCodeRepository;
        this.restTemplate = new RestTemplate();
        
        // 알림톡 관련 공통 코드 초기화
        initializeAlimTalkCommonCodes();
    }
    
    @Override
    public boolean sendAlimTalk(String phoneNumber, String templateCode, Map<String, String> templateParams) {
        if (!alimTalkEnabled) {
            log.info("📱 알림톡 비활성화 상태 - SMS로 대체 발송 권장");
            return false;
        }
        
        if (!simulationMode && (apiKey == null || apiKey.isEmpty() || senderKey == null || senderKey.isEmpty())) {
            log.warn("⚠️ 실제 모드에서 카카오 알림톡 API 키 또는 발신자 키가 설정되지 않았습니다");
            return false;
        }
        
        try {
            log.info("📤 카카오 알림톡 발송 시작: 수신자={}, 템플릿={}", maskPhoneNumber(phoneNumber), templateCode);
            
            // 알림톡 API 요청 데이터 구성
            Map<String, Object> requestData = new HashMap<>();
            requestData.put("senderKey", senderKey);
            requestData.put("templateCode", templateCode);
            requestData.put("recipientNo", phoneNumber);
            requestData.put("content", buildMessageContent(templateCode, templateParams));
            requestData.put("templateParameter", templateParams);
            requestData.put("requestDate", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            
            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);
            headers.set("Content-Type", "application/json;charset=UTF-8");
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestData, headers);
            
            // 실제 API 호출 (현재는 시뮬레이션)
            boolean success = sendToKakaoApi(request);
            
            if (success) {
                log.info("✅ 카카오 알림톡 발송 성공: 수신자={}, 템플릿={}", maskPhoneNumber(phoneNumber), templateCode);
            } else {
                log.warn("⚠️ 카카오 알림톡 발송 실패: 수신자={}, 템플릿={}", maskPhoneNumber(phoneNumber), templateCode);
            }
            
            return success;
            
        } catch (Exception e) {
            log.error("❌ 카카오 알림톡 발송 중 오류: 수신자={}, 템플릿={}", maskPhoneNumber(phoneNumber), templateCode, e);
            return false;
        }
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
    public boolean isServiceAvailable() {
        if (!alimTalkEnabled) {
            return false;
        }
        
        if (simulationMode) {
            // 시뮬레이션 모드에서는 항상 사용 가능
            log.debug("🎭 시뮬레이션 모드: 알림톡 서비스 사용 가능");
            return true;
        }
        
        // 실제 모드에서는 API 키 확인
        boolean hasKeys = apiKey != null && !apiKey.isEmpty() && 
                         senderKey != null && !senderKey.isEmpty();
        
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
            // 공통 코드에서 템플릿 조회
            List<CommonCode> templateCodes = commonCodeRepository.findByCodeGroupOrderBySortOrderAsc("ALIMTALK_TEMPLATE");
            
            for (CommonCode code : templateCodes) {
                if (templateCode.equals(code.getCodeValue())) {
                    // 템플릿 내용은 codeDescription에 저장됨 (codeLabel은 짧은 제목만)
                    String template = code.getCodeDescription() != null && !code.getCodeDescription().isEmpty() 
                        ? code.getCodeDescription() 
                        : code.getCodeLabel(); // fallback
                    
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
                }
                
                return success;
            } else {
                log.error("❌ 카카오 알림톡 API HTTP 오류: {}", response.getStatusCode());
                return false;
            }
            
        } catch (Exception e) {
            log.error("❌ 카카오 알림톡 API 호출 실패", e);
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
                    "[마인드가든] 상담이 확정되었습니다.\n\n" +
                    "📅 상담일: #{consultationDate}\n" +
                    "⏰ 시간: #{consultationTime}\n" +
                    "👩‍⚕️ 상담사: #{consultantName}\n\n" +
                    "상담 10분 전에 다시 알려드리겠습니다.\n" +
                    "감사합니다.", 
                    "{\"category\":\"consultation\",\"priority\":\"high\"}", 1);
                
                // 상담 리마인더 템플릿
                createCommonCode("ALIMTALK_TEMPLATE", "CONSULTATION_REMINDER", 
                    "상담 리마인더",
                    "[마인드가든] 1시간 후 상담이 예정되어 있습니다.\n\n" +
                    "⏰ 상담시간: #{consultationTime}\n" +
                    "👩‍⚕️ 상담사: #{consultantName}\n\n" +
                    "준비해주시고 시간에 맞춰 참석해주세요.\n" +
                    "감사합니다.", 
                    "{\"category\":\"consultation\",\"priority\":\"high\"}", 2);
                
                // 환불 완료 템플릿
                createCommonCode("ALIMTALK_TEMPLATE", "REFUND_COMPLETED", 
                    "환불 완료 알림",
                    "[마인드가든] 환불이 완료되었습니다.\n\n" +
                    "💰 환불 회기: #{refundSessions}회\n" +
                    "💳 환불 금액: #{refundAmount}원\n\n" +
                    "환불 금액은 결제하신 계좌로 2-3일 내에 입금됩니다.\n" +
                    "감사합니다.", 
                    "{\"category\":\"payment\",\"priority\":\"medium\"}", 3);
                
                // 일정 변경 템플릿
                createCommonCode("ALIMTALK_TEMPLATE", "SCHEDULE_CHANGED", 
                    "일정 변경 알림",
                    "[마인드가든] 상담 일정이 변경되었습니다.\n\n" +
                    "👩‍⚕️ 상담사: #{consultantName}\n" +
                    "📅 변경 전: #{oldDateTime}\n" +
                    "📅 변경 후: #{newDateTime}\n\n" +
                    "변경된 일정에 맞춰 참석해주세요.\n" +
                    "감사합니다.", 
                    "{\"category\":\"consultation\",\"priority\":\"medium\"}", 4);
                
                // 결제 완료 템플릿
                createCommonCode("ALIMTALK_TEMPLATE", "PAYMENT_COMPLETED", 
                    "결제 완료 알림",
                    "[마인드가든] 결제가 완료되었습니다.\n\n" +
                    "💳 결제 금액: #{paymentAmount}원\n" +
                    "📦 패키지: #{packageName}\n" +
                    "👩‍⚕️ 상담사: #{consultantName}\n\n" +
                    "상담 예약을 진행해주세요.\n" +
                    "감사합니다.", 
                    "{\"category\":\"payment\",\"priority\":\"medium\"}", 5);
                
                log.info("✅ ALIMTALK_TEMPLATE 공통 코드 생성 완료");
            }
            
            // ALIMTALK_CONFIG 그룹 확인 및 생성
            List<CommonCode> configCodes = commonCodeRepository.findByCodeGroupOrderBySortOrderAsc("ALIMTALK_CONFIG");
            if (configCodes.isEmpty()) {
                log.info("🔧 ALIMTALK_CONFIG 공통 코드 그룹 생성 중...");
                
                createCommonCode("ALIMTALK_CONFIG", "ENABLED", "활성화", null, "{\"value\":true}", 1);
                createCommonCode("ALIMTALK_CONFIG", "FALLBACK_TO_SMS", "SMS 대체 발송", null, "{\"value\":true}", 2);
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
    
    /**
     * 전화번호 마스킹
     */
    private String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 4) {
            return phoneNumber;
        }
        
        if (phoneNumber.length() <= 8) {
            return phoneNumber.substring(0, 3) + "****";
        }
        
        return phoneNumber.substring(0, 3) + "****" + phoneNumber.substring(phoneNumber.length() - 4);
    }
}
