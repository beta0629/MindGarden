package com.coresolution.consultation.service.sms.impl;

import com.coresolution.consultation.config.SmsProperties;
import com.coresolution.consultation.service.sms.SmsProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * NHN Cloud SMS 프로바이더 구현
 * NHN Cloud Platform의 SMS 서비스를 사용하여 SMS 발송
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-20
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NhnSmsProvider implements SmsProvider {
    
    private final SmsProperties smsProperties;
    private final RestTemplate restTemplate;
    
    private static final String NHN_SMS_API_URL = "https://sens.apigw.ntruss.com/sms/v2/services/%s/messages";
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    
    @Override
    public boolean sendSms(String phoneNumber, String message) {
        log.info("📤 NHN Cloud SMS 발송 시작: phoneNumber={}", phoneNumber);
        
        if (!isConfigured()) {
            log.error("❌ NHN Cloud SMS 설정이 완료되지 않았습니다.");
            return false;
        }
        
        try {
            // 전화번호 형식 검증 및 정규화
            String normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
            if (normalizedPhoneNumber == null) {
                log.error("❌ 잘못된 전화번호 형식: {}", phoneNumber);
                return false;
            }
            
            // API URL 구성
            String serviceId = smsProperties.getApiKey(); // NHN에서는 serviceId를 apiKey로 사용
            String url = String.format(NHN_SMS_API_URL, serviceId);
            
            // 요청 본문 구성
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("type", "SMS");
            requestBody.put("contentType", "COMM");
            requestBody.put("countryCode", "82");
            requestBody.put("from", smsProperties.getSenderNumber());
            requestBody.put("content", message);
            requestBody.put("messages", List.of(Map.of("to", normalizedPhoneNumber)));
            
            // HTTP 헤더 구성
            HttpHeaders headers = createHeaders(url, "POST");
            
            // HTTP 요청 발송
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            
            // 응답 처리
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("✅ NHN Cloud SMS 발송 성공: phoneNumber={}", normalizedPhoneNumber);
                return true;
            } else {
                log.error("❌ NHN Cloud SMS 발송 실패: status={}, response={}", 
                    response.getStatusCode(), response.getBody());
                return false;
            }
            
        } catch (Exception e) {
            log.error("❌ NHN Cloud SMS 발송 중 오류 발생: {}", e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public String getProviderName() {
        return "nhn";
    }
    
    @Override
    public boolean isConfigured() {
        return smsProperties.getApiKey() != null && !smsProperties.getApiKey().isEmpty() &&
               smsProperties.getApiSecret() != null && !smsProperties.getApiSecret().isEmpty() &&
               smsProperties.getSenderNumber() != null && !smsProperties.getSenderNumber().isEmpty();
    }
    
    /**
     * NHN Cloud SMS API 인증 헤더 생성
     */
    private HttpHeaders createHeaders(String url, String method) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("charset", "UTF-8");
        
        try {
            long timestamp = System.currentTimeMillis();
            String accessKey = smsProperties.getApiKey();
            String secretKey = smsProperties.getApiSecret();
            
            // 서명 생성
            String signature = generateSignature(secretKey, timestamp, method, url);
            
            headers.set("x-ncp-apigw-timestamp", String.valueOf(timestamp));
            headers.set("x-ncp-iam-access-key", accessKey);
            headers.set("x-ncp-apigw-signature-v2", signature);
            
        } catch (Exception e) {
            log.error("NHN Cloud SMS 인증 헤더 생성 실패: {}", e.getMessage(), e);
        }
        
        return headers;
    }
    
    /**
     * NHN Cloud SMS API 서명 생성
     */
    private String generateSignature(String secretKey, long timestamp, String method, String url) 
            throws NoSuchAlgorithmException, InvalidKeyException {
        
        String message = method + " " + url + "\n" + timestamp + "\n" + smsProperties.getApiKey();
        
        Mac mac = Mac.getInstance(HMAC_ALGORITHM);
        SecretKeySpec secretKeySpec = new SecretKeySpec(
            secretKey.getBytes(StandardCharsets.UTF_8), 
            HMAC_ALGORITHM
        );
        mac.init(secretKeySpec);
        
        byte[] hash = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(hash);
    }
    
    /**
     * 전화번호 정규화 (한국 전화번호 형식)
     * 010-1234-5678 -> 01012345678
     * 01012345678 -> 01012345678
     */
    private String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            return null;
        }
        
        // 하이픈, 공백 제거
        String normalized = phoneNumber.replaceAll("[\\s-]", "");
        
        // 한국 전화번호 형식 검증 (010, 011, 016, 017, 018, 019로 시작하는 10-11자리)
        if (normalized.matches("^01[0-9]\\d{7,8}$")) {
            return normalized;
        }
        
        return null;
    }
}

