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
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Stripe 연결 테스트 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StripeConnectionTestServiceImpl implements PgConnectionTestService {
    
    private final RestTemplate restTemplate;
    private final PersonalDataEncryptionService encryptionService;
    
    // Stripe는 테스트 키와 라이브 키가 다름
    private static final String STRIPE_BASE_URL = "https://api.stripe.com";
    private static final String STRIPE_TEST_ENDPOINT = "/v1/charges";
    
    @Override
    public ConnectionTestResponse testConnection(TenantPgConfiguration configuration) {
        log.info("Stripe 연결 테스트 시작: configId={}", configuration.getConfigId());
        
        try {
            // 암호화된 키 복호화
            String secretKey = encryptionService.decrypt(configuration.getSecretKeyEncrypted());
            
            if (secretKey == null || secretKey.trim().isEmpty()) {
                return ConnectionTestResponse.builder()
                        .success(false)
                        .result("FAILED")
                        .message("Secret Key가 유효하지 않습니다")
                        .testedAt(LocalDateTime.now())
                        .build();
            }
            
            // Stripe API 키 검증 (최소한의 요청으로 연결 테스트)
            // 실제로는 /v1/charges 엔드포인트에 GET 요청을 보내서 키 유효성 검증
            HttpHeaders headers = createStripeHeaders(secretKey);
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            
            // Stripe는 limit=1로 최소한의 요청만 수행
            String url = STRIPE_BASE_URL + STRIPE_TEST_ENDPOINT + "?limit=1";
            
            try {
                ParameterizedTypeReference<Map<String, Object>> responseType = 
                        new ParameterizedTypeReference<Map<String, Object>>() {};
                ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        entity,
                        responseType
                );
                
                Map<String, Object> responseBody = response.getBody();
                // Stripe는 유효한 키인 경우 200 OK 또는 401 Unauthorized 반환
                if (response.getStatusCode() == HttpStatus.OK) {
                    log.info("Stripe 연결 테스트 성공: configId={}", configuration.getConfigId());
                    return ConnectionTestResponse.builder()
                            .success(true)
                            .result("SUCCESS")
                            .message("Stripe API 연결 성공")
                            .testedAt(LocalDateTime.now())
                            .details(createSuccessDetails(responseBody))
                            .build();
                } else if (response.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                    log.warn("Stripe 연결 테스트 실패: 인증 오류, configId={}", configuration.getConfigId());
                    return ConnectionTestResponse.builder()
                            .success(false)
                            .result("FAILED")
                            .message("Stripe API 인증 실패: 유효하지 않은 Secret Key")
                            .testedAt(LocalDateTime.now())
                            .build();
                } else {
                    log.warn("Stripe 연결 테스트 실패: status={}, configId={}", 
                            response.getStatusCode(), configuration.getConfigId());
                    return ConnectionTestResponse.builder()
                            .success(false)
                            .result("FAILED")
                            .message("Stripe API 응답 오류: " + response.getStatusCode())
                            .testedAt(LocalDateTime.now())
                            .build();
                }
            } catch (RestClientException e) {
                log.error("Stripe 연결 테스트 실패: {}", e.getMessage(), e);
                return ConnectionTestResponse.builder()
                        .success(false)
                        .result("FAILED")
                        .message("Stripe API 연결 실패: " + e.getMessage())
                        .testedAt(LocalDateTime.now())
                        .build();
            }
            
        } catch (Exception e) {
            log.error("Stripe 연결 테스트 중 오류 발생: {}", e.getMessage(), e);
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
        return provider == PgProvider.STRIPE;
    }
    
    /**
     * Stripe API 헤더 생성
     */
    private HttpHeaders createStripeHeaders(String secretKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        // Stripe는 Bearer 토큰 방식 사용
        headers.set("Authorization", "Bearer " + secretKey);
        return headers;
    }
    
    /**
     * 성공 상세 정보 생성
     */
    private String createSuccessDetails(Map<String, Object> responseBody) {
        try {
            Map<String, Object> details = new HashMap<>();
            if (responseBody != null) {
                details.put("object", responseBody.get("object"));
                details.put("has_more", responseBody.get("has_more"));
            }
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(details);
        } catch (Exception e) {
            log.warn("상세 정보 생성 실패: {}", e.getMessage());
            return "{\"status\":\"success\"}";
        }
    }
}

