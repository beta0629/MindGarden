package com.coresolution.core.service.impl;

import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.dto.ConnectionTestResponse;
import com.coresolution.core.service.PgConnectionTestService;
import com.coresolution.consultation.service.PersonalDataEncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * PayPal 연결 테스트 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaypalConnectionTestServiceImpl implements PgConnectionTestService {
    
    private final RestTemplate restTemplate;
    private final PersonalDataEncryptionService encryptionService;
    
    // PayPal은 샌드박스와 프로덕션 환경이 다름
    private static final String PAYPAL_SANDBOX_BASE_URL = "https://api.sandbox.paypal.com";
    private static final String PAYPAL_PRODUCTION_BASE_URL = "https://api.paypal.com";
    private static final String PAYPAL_TOKEN_ENDPOINT = "/v1/oauth2/token";
    
    @Override
    public ConnectionTestResponse testConnection(TenantPgConfiguration configuration) {
        log.info("PayPal 연결 테스트 시작: configId={}", configuration.getConfigId());
        
        try {
            // 암호화된 키 복호화
            String clientId = encryptionService.decrypt(configuration.getApiKeyEncrypted());
            String clientSecret = encryptionService.decrypt(configuration.getSecretKeyEncrypted());
            
            if (clientId == null || clientId.trim().isEmpty() || 
                clientSecret == null || clientSecret.trim().isEmpty()) {
                return ConnectionTestResponse.builder()
                        .success(false)
                        .result("FAILED")
                        .message("Client ID 또는 Client Secret이 유효하지 않습니다")
                        .testedAt(LocalDateTime.now())
                        .build();
            }
            
            // 테스트 모드에 따라 URL 선택
            String baseUrl = Boolean.TRUE.equals(configuration.getTestMode()) 
                    ? PAYPAL_SANDBOX_BASE_URL 
                    : PAYPAL_PRODUCTION_BASE_URL;
            String url = baseUrl + PAYPAL_TOKEN_ENDPOINT;
            
            // PayPal OAuth 토큰 발급으로 연결 테스트
            HttpHeaders headers = createPaypalHeaders(clientId, clientSecret);
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "client_credentials");
            
            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);
            
            try {
                ParameterizedTypeReference<Map<String, Object>> responseType = 
                        new ParameterizedTypeReference<Map<String, Object>>() {};
                ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                        url,
                        HttpMethod.POST,
                        entity,
                        responseType
                );
                
                Map<String, Object> responseBody = response.getBody();
                if (response.getStatusCode() == HttpStatus.OK && responseBody != null) {
                    log.info("PayPal 연결 테스트 성공: configId={}", configuration.getConfigId());
                    return ConnectionTestResponse.builder()
                            .success(true)
                            .result("SUCCESS")
                            .message("PayPal API 연결 성공")
                            .testedAt(LocalDateTime.now())
                            .details(createSuccessDetails(responseBody))
                            .build();
                } else {
                    log.warn("PayPal 연결 테스트 실패: status={}, configId={}", 
                            response.getStatusCode(), configuration.getConfigId());
                    return ConnectionTestResponse.builder()
                            .success(false)
                            .result("FAILED")
                            .message("PayPal API 응답 오류: " + response.getStatusCode())
                            .testedAt(LocalDateTime.now())
                            .build();
                }
            } catch (RestClientException e) {
                log.error("PayPal 연결 테스트 실패: {}", e.getMessage(), e);
                return ConnectionTestResponse.builder()
                        .success(false)
                        .result("FAILED")
                        .message("PayPal API 연결 실패: " + e.getMessage())
                        .testedAt(LocalDateTime.now())
                        .build();
            }
            
        } catch (Exception e) {
            log.error("PayPal 연결 테스트 중 오류 발생: {}", e.getMessage(), e);
            return ConnectionTestResponse.builder()
                    .success(false)
                    .result("FAILED")
                    .message("연결 테스트 중 오류 발생: " + e.getMessage())
                    .testedAt(LocalDateTime.now())
                    .build();
        }
    }
    
    @Override
    public boolean supports(PgProvider provider) {
        return provider == PgProvider.PAYPAL;
    }
    
    /**
     * PayPal API 헤더 생성
     */
    private HttpHeaders createPaypalHeaders(String clientId, String clientSecret) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        String credentials = clientId + ":" + clientSecret;
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());
        headers.set("Authorization", "Basic " + encodedCredentials);
        return headers;
    }
    
    /**
     * 성공 상세 정보 생성
     */
    private String createSuccessDetails(Map<String, Object> responseBody) {
        try {
            Map<String, Object> details = new HashMap<>();
            if (responseBody != null) {
                details.put("token_type", responseBody.get("token_type"));
                details.put("expires_in", responseBody.get("expires_in"));
                // access_token은 민감 정보이므로 포함하지 않음
            }
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(details);
        } catch (Exception e) {
            log.warn("상세 정보 생성 실패: {}", e.getMessage());
            return "{\"status\":\"success\"}";
        }
    }
}

