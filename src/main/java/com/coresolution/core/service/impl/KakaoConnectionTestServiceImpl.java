package com.coresolution.core.service.impl;

import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.dto.ConnectionTestResponse;
import com.coresolution.core.service.PgConnectionTestService;
import com.mindgarden.consultation.service.PersonalDataEncryptionService;
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
 * 카카오페이 연결 테스트 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KakaoConnectionTestServiceImpl implements PgConnectionTestService {
    
    private final RestTemplate restTemplate;
    private final PersonalDataEncryptionService encryptionService;
    
    private static final String KAKAO_BASE_URL = "https://kapi.kakao.com";
    private static final String KAKAO_TEST_ENDPOINT = "/v1/user/access_token_info";
    
    @Override
    public ConnectionTestResponse testConnection(TenantPgConfiguration configuration) {
        log.info("카카오페이 연결 테스트 시작: configId={}", configuration.getConfigId());
        
        try {
            // 암호화된 키 복호화
            String apiKey = encryptionService.decrypt(configuration.getApiKeyEncrypted());
            String secretKey = encryptionService.decrypt(configuration.getSecretKeyEncrypted());
            
            if (apiKey == null || apiKey.trim().isEmpty() || 
                secretKey == null || secretKey.trim().isEmpty()) {
                return ConnectionTestResponse.builder()
                        .success(false)
                        .result("FAILED")
                        .message("API Key 또는 Secret Key가 유효하지 않습니다")
                        .testedAt(LocalDateTime.now())
                        .build();
            }
            
            // 카카오페이 API 토큰 정보 조회로 연결 테스트
            HttpHeaders headers = createKakaoHeaders(apiKey);
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            
            String url = KAKAO_BASE_URL + KAKAO_TEST_ENDPOINT;
            
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
                if (response.getStatusCode() == HttpStatus.OK && responseBody != null) {
                    log.info("카카오페이 연결 테스트 성공: configId={}", configuration.getConfigId());
                    return ConnectionTestResponse.builder()
                            .success(true)
                            .result("SUCCESS")
                            .message("카카오페이 API 연결 성공")
                            .testedAt(LocalDateTime.now())
                            .details(createSuccessDetails(responseBody))
                            .build();
                } else {
                    log.warn("카카오페이 연결 테스트 실패: status={}, configId={}", 
                            response.getStatusCode(), configuration.getConfigId());
                    return ConnectionTestResponse.builder()
                            .success(false)
                            .result("FAILED")
                            .message("카카오페이 API 응답 오류: " + response.getStatusCode())
                            .testedAt(LocalDateTime.now())
                            .build();
                }
            } catch (RestClientException e) {
                log.error("카카오페이 연결 테스트 실패: {}", e.getMessage(), e);
                return ConnectionTestResponse.builder()
                        .success(false)
                        .result("FAILED")
                        .message("카카오페이 API 연결 실패: " + e.getMessage())
                        .testedAt(LocalDateTime.now())
                        .build();
            }
            
        } catch (Exception e) {
            log.error("카카오페이 연결 테스트 중 오류 발생: {}", e.getMessage(), e);
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
        return provider == PgProvider.KAKAO;
    }
    
    /**
     * 카카오페이 API 헤더 생성
     */
    private HttpHeaders createKakaoHeaders(String apiKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "KakaoAK " + apiKey);
        return headers;
    }
    
    /**
     * 성공 상세 정보 생성
     */
    private String createSuccessDetails(Map<String, Object> responseBody) {
        try {
            Map<String, Object> details = new HashMap<>();
            if (responseBody != null) {
                details.put("id", responseBody.get("id"));
                details.put("expiresInMillis", responseBody.get("expiresInMillis"));
            }
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(details);
        } catch (Exception e) {
            log.warn("상세 정보 생성 실패: {}", e.getMessage());
            return "{\"status\":\"success\"}";
        }
    }
}

