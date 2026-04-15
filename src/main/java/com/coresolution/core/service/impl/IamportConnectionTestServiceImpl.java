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
 * 아임포트·포트원 연결 테스트 서비스 구현체.
 * <p>
 * 레거시 아임포트 REST V1({@code api.iamport.kr}) 토큰 발급으로 검증하고,
 * {@code store_id} 가 설정된 경우 포트원 REST V2({@code api.portone.io}) API Secret 로그인으로 검증한다
 * (결제연동·스토어 ID가 있는 연동은 V2 시크릿 검증 경로를 사용).
 * </p>
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IamportConnectionTestServiceImpl implements PgConnectionTestService {

    private final RestTemplate restTemplate;
    private final PersonalDataEncryptionService encryptionService;

    private static final String IAMPORT_BASE_URL = "https://api.iamport.kr";
    private static final String IAMPORT_TEST_ENDPOINT = "/users/getToken";

    private static final String PORTONE_V2_BASE_URL = "https://api.portone.io";
    private static final String PORTONE_V2_LOGIN_API_SECRET = "/login/api-secret";

    @Override
    public ConnectionTestResponse testConnection(TenantPgConfiguration configuration) {
        log.info("아임포트/포트원 연결 테스트 시작: configId={}", configuration.getConfigId());

        try {
            String apiKey = encryptionService.decrypt(configuration.getApiKeyEncrypted());
            String secretKey = encryptionService.decrypt(configuration.getSecretKeyEncrypted());

            if (apiKey == null || apiKey.trim().isEmpty()
                    || secretKey == null || secretKey.trim().isEmpty()) {
                return ConnectionTestResponse.builder()
                        .success(false)
                        .result("FAILED")
                        .message("API Key 또는 Secret Key가 유효하지 않습니다")
                        .testedAt(LocalDateTime.now())
                        .build();
            }

            String storeId = configuration.getStoreId();
            if (storeId != null && !storeId.trim().isEmpty()) {
                return testPortOneV2ApiSecretLogin(configuration, secretKey);
            }
            return testIamportV1GetToken(configuration, apiKey, secretKey);

        } catch (Exception e) {
            log.error("아임포트/포트원 연결 테스트 중 오류 발생: {}", e.getMessage(), e);
            return ConnectionTestResponse.builder()
                    .success(false)
                    .result("FAILED")
                    .message("연결 테스트 중 오류 발생: " + e.getMessage())
                    .testedAt(LocalDateTime.now())
                    .build();
        }
    }

    /**
     * 포트원 REST V2: {@code POST /login/api-secret} 로 API Secret 유효성 검증.
     * 응답 본문의 토큰 값은 로그·저장 시 마스킹한다.
     */
    private ConnectionTestResponse testPortOneV2ApiSecretLogin(
            TenantPgConfiguration configuration,
            String apiSecretPlain) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("apiSecret", apiSecretPlain);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);
        String url = PORTONE_V2_BASE_URL + PORTONE_V2_LOGIN_API_SECRET;

        try {
            ParameterizedTypeReference<Map<String, Object>> responseType =
                    new ParameterizedTypeReference<Map<String, Object>>() { };
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    responseType
            );

            Map<String, Object> responseBody = response.getBody();
            if (response.getStatusCode() == HttpStatus.OK && responseBody != null) {
                if (responseBody.containsKey("accessToken") || responseBody.containsKey("refreshToken")) {
                    log.info("포트원 V2 API Secret 연결 테스트 성공: configId={}", configuration.getConfigId());
                    return ConnectionTestResponse.builder()
                            .success(true)
                            .result("SUCCESS")
                            .message("포트원 V2 API Secret 검증 성공")
                            .testedAt(LocalDateTime.now())
                            .details(createPortOneV2SuccessDetails(responseBody))
                            .build();
                }
            }
            log.warn("포트원 V2 연결 테스트 실패: status={}, configId={}",
                    response.getStatusCode(), configuration.getConfigId());
            return ConnectionTestResponse.builder()
                    .success(false)
                    .result("FAILED")
                    .message("포트원 V2 API 응답 형식 오류: " + response.getStatusCode())
                    .testedAt(LocalDateTime.now())
                    .build();
        } catch (RestClientException e) {
            log.error("포트원 V2 연결 테스트 실패: {}", e.getMessage(), e);
            return ConnectionTestResponse.builder()
                    .success(false)
                    .result("FAILED")
                    .message("포트원 V2 API 연결 실패: " + e.getMessage())
                    .testedAt(LocalDateTime.now())
                    .build();
        }
    }

    private ConnectionTestResponse testIamportV1GetToken(
            TenantPgConfiguration configuration,
            String apiKey,
            String secretKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("imp_key", apiKey);
        requestBody.put("imp_secret", secretKey);

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);
        String url = IAMPORT_BASE_URL + IAMPORT_TEST_ENDPOINT;

        try {
            ParameterizedTypeReference<Map<String, Object>> responseType =
                    new ParameterizedTypeReference<Map<String, Object>>() { };
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    responseType
            );

            Map<String, Object> responseBody = response.getBody();
            if (response.getStatusCode() == HttpStatus.OK && responseBody != null) {
                Object codeObj = responseBody.get("code");
                Integer code = codeObj != null
                        ? (codeObj instanceof Integer ? (Integer) codeObj : Integer.valueOf(codeObj.toString()))
                        : null;

                if (code != null && code == 0) {
                    log.info("아임포트 연결 테스트 성공: configId={}", configuration.getConfigId());
                    return ConnectionTestResponse.builder()
                            .success(true)
                            .result("SUCCESS")
                            .message("아임포트 API 연결 성공")
                            .testedAt(LocalDateTime.now())
                            .details(createIamportV1SuccessDetails(responseBody))
                            .build();
                } else {
                    String message = (String) responseBody.getOrDefault("message", "알 수 없는 오류");
                    log.warn("아임포트 연결 테스트 실패: code={}, message={}, configId={}",
                            code, message, configuration.getConfigId());
                    return ConnectionTestResponse.builder()
                            .success(false)
                            .result("FAILED")
                            .message("아임포트 API 오류: " + message)
                            .testedAt(LocalDateTime.now())
                            .build();
                }
            } else {
                log.warn("아임포트 연결 테스트 실패: status={}, configId={}",
                        response.getStatusCode(), configuration.getConfigId());
                return ConnectionTestResponse.builder()
                        .success(false)
                        .result("FAILED")
                        .message("아임포트 API 응답 오류: " + response.getStatusCode())
                        .testedAt(LocalDateTime.now())
                        .build();
            }
        } catch (RestClientException e) {
            log.error("아임포트 연결 테스트 실패: {}", e.getMessage(), e);
            return ConnectionTestResponse.builder()
                    .success(false)
                    .result("FAILED")
                    .message("아임포트 API 연결 실패: " + e.getMessage())
                    .testedAt(LocalDateTime.now())
                    .build();
        }
    }

    @Override
    public boolean supports(PgProvider provider) {
        return provider == PgProvider.IAMPORT;
    }

    private String createIamportV1SuccessDetails(Map<String, Object> responseBody) {
        try {
            Map<String, Object> details = new HashMap<>();
            if (responseBody != null) {
                details.put("access_token", responseBody.get("access_token") != null ? "***" : null);
                details.put("expired_at", responseBody.get("expired_at"));
            }
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(details);
        } catch (Exception e) {
            log.warn("상세 정보 생성 실패: {}", e.getMessage());
            return "{\"status\":\"success\"}";
        }
    }

    private String createPortOneV2SuccessDetails(Map<String, Object> responseBody) {
        try {
            Map<String, Object> details = new HashMap<>();
            if (responseBody != null) {
                details.put("accessToken", responseBody.get("accessToken") != null ? "***" : null);
                details.put("refreshToken", responseBody.get("refreshToken") != null ? "***" : null);
            }
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(details);
        } catch (Exception e) {
            log.warn("포트원 V2 상세 정보 생성 실패: {}", e.getMessage());
            return "{\"status\":\"success\"}";
        }
    }
}
