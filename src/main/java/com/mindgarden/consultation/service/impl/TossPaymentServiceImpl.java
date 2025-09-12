package com.mindgarden.consultation.service.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import com.mindgarden.consultation.dto.PaymentRequest;
import com.mindgarden.consultation.dto.PaymentResponse;
import com.mindgarden.consultation.dto.PaymentStatusResponse;
import com.mindgarden.consultation.service.PaymentGatewayService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import lombok.extern.slf4j.Slf4j;

/**
 * 토스페이먼츠 API 연동 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service("tossPaymentService")
public class TossPaymentServiceImpl implements PaymentGatewayService {
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Value("${payment.toss.secret-key:}")
    private String secretKey;
    
    @Value("${payment.toss.base-url:https://api.tosspayments.com}")
    private String baseUrl;
    
    @Value("${payment.toss.simulation-mode:true}")
    private boolean simulationMode;
    
    @Value("${payment.toss.test-payment-url:https://checkout.tosspayments.com/v1/test/}")
    private String testPaymentUrl;
    
    @Value("${payment.toss.test-payment-key-prefix:toss_test_}")
    private String testPaymentKeyPrefix;
    
    @Override
    public PaymentResponse createPayment(PaymentRequest request) {
        log.info("토스페이먼츠 결제 요청 생성: {}", request.getOrderId());
        
        try {
            // 토스페이먼츠 결제 요청 생성
            Map<String, Object> tossRequest = new HashMap<>();
            tossRequest.put("orderId", request.getOrderId());
            tossRequest.put("amount", request.getAmount());
            tossRequest.put("orderName", request.getOrderName());
            tossRequest.put("customerEmail", request.getCustomerEmail());
            tossRequest.put("customerName", request.getCustomerName());
            tossRequest.put("successUrl", request.getSuccessUrl());
            tossRequest.put("failUrl", request.getFailUrl());
            tossRequest.put("validHours", 24); // 24시간 유효
            
            if (simulationMode) {
                // 시뮬레이션 모드
                log.info("토스페이먼츠 API 호출 시뮬레이션 모드");
                
                // 시뮬레이션 응답 생성
                Map<String, Object> responseBody = new HashMap<>();
                responseBody.put("paymentKey", testPaymentKeyPrefix + System.currentTimeMillis());
                responseBody.put("checkoutUrl", testPaymentUrl + System.currentTimeMillis());
                responseBody.put("status", "PENDING");
                
                return PaymentResponse.builder()
                    .paymentId((String) responseBody.get("paymentKey"))
                    .orderId(request.getOrderId())
                    .status("PENDING")
                    .amount(request.getAmount())
                    .paymentUrl((String) responseBody.get("checkoutUrl"))
                    .createdAt(LocalDateTime.now())
                    .build();
            } else {
                // 실제 API 호출 모드
                log.info("토스페이먼츠 실제 API 호출");
                
                HttpHeaders headers = createTossHeaders();
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(tossRequest, headers);
                
                String url = baseUrl + "/v1/payments/confirm";
                ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
                
                if (response.getStatusCode() == HttpStatus.OK) {
                    Map<String, Object> responseBody = response.getBody();
                    
                    return PaymentResponse.builder()
                        .paymentId((String) responseBody.get("paymentKey"))
                        .orderId(request.getOrderId())
                        .status("PENDING")
                        .amount(request.getAmount())
                        .paymentUrl((String) responseBody.get("checkoutUrl"))
                        .createdAt(LocalDateTime.now())
                        .build();
                } else {
                    throw new RuntimeException("토스페이먼츠 결제 요청 실패: " + response.getStatusCode());
                }
            }
            
        } catch (Exception e) {
            log.error("토스페이먼츠 결제 요청 실패: {}", e.getMessage(), e);
            throw new RuntimeException("결제 요청 생성에 실패했습니다.", e);
        }
    }
    
    @Override
    public PaymentStatusResponse getPaymentStatus(String paymentId) {
        log.info("토스페이먼츠 결제 상태 조회: {}", paymentId);
        
        try {
            if (simulationMode) {
                // 시뮬레이션 모드
                log.info("토스페이먼츠 API 호출 시뮬레이션 모드");
                
                return PaymentStatusResponse.builder()
                    .paymentId(paymentId)
                    .status("APPROVED") // 테스트용으로 승인 상태 반환
                    .amount(new java.math.BigDecimal("100000"))
                    .approvedAt(LocalDateTime.now())
                    .build();
            } else {
                // 실제 API 호출 모드
                log.info("토스페이먼츠 실제 API 호출");
                
                HttpHeaders headers = createTossHeaders();
                HttpEntity<String> entity = new HttpEntity<>(headers);
                
                String url = baseUrl + "/v1/payments/" + paymentId;
                ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
                
                if (response.getStatusCode() == HttpStatus.OK) {
                    Map<String, Object> responseBody = response.getBody();
                    
                    return PaymentStatusResponse.builder()
                        .paymentId(paymentId)
                        .status((String) responseBody.get("status"))
                        .amount(new java.math.BigDecimal(responseBody.get("totalAmount").toString()))
                        .approvedAt(parseDateTime((String) responseBody.get("approvedAt")))
                        .build();
                } else {
                    throw new RuntimeException("토스페이먼츠 결제 상태 조회 실패: " + response.getStatusCode());
                }
            }
            
        } catch (Exception e) {
            log.error("토스페이먼츠 결제 상태 조회 실패: {}", e.getMessage(), e);
            throw new RuntimeException("결제 상태 조회에 실패했습니다.", e);
        }
    }
    
    @Override
    public boolean cancelPayment(String paymentId, String reason) {
        log.info("토스페이먼츠 결제 취소: {}, 사유: {}", paymentId, reason);
        
        try {
            if (simulationMode) {
                // 시뮬레이션 모드
                log.info("토스페이먼츠 API 호출 시뮬레이션 모드");
                
                // 시뮬레이션 성공 응답
                return true;
            } else {
                // 실제 API 호출 모드
                log.info("토스페이먼츠 실제 API 호출");
                
                Map<String, Object> cancelRequest = new HashMap<>();
                cancelRequest.put("cancelReason", reason);
                
                HttpHeaders headers = createTossHeaders();
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(cancelRequest, headers);
                
                String url = baseUrl + "/v1/payments/" + paymentId + "/cancel";
                ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
                
                return response.getStatusCode() == HttpStatus.OK;
            }
            
        } catch (Exception e) {
            log.error("토스페이먼츠 결제 취소 실패: {}", e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public boolean refundPayment(String paymentId, java.math.BigDecimal amount, String reason) {
        log.info("토스페이먼츠 결제 환불: {}, 금액: {}, 사유: {}", paymentId, amount, reason);
        
        try {
            if (simulationMode) {
                // 시뮬레이션 모드
                log.info("토스페이먼츠 API 호출 시뮬레이션 모드");
                
                // 시뮬레이션 성공 응답
                return true;
            } else {
                // 실제 API 호출 모드
                log.info("토스페이먼츠 실제 API 호출");
                
                Map<String, Object> refundRequest = new HashMap<>();
                refundRequest.put("cancelAmount", amount);
                refundRequest.put("cancelReason", reason);
                
                HttpHeaders headers = createTossHeaders();
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(refundRequest, headers);
                
                String url = baseUrl + "/v1/payments/" + paymentId + "/cancel";
                ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
                
                return response.getStatusCode() == HttpStatus.OK;
            }
            
        } catch (Exception e) {
            log.error("토스페이먼츠 결제 환불 실패: {}", e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public boolean verifyWebhookSignature(String payload, String signature, String timestamp) {
        log.info("토스페이먼츠 Webhook 서명 검증");
        
        try {
            // 토스페이먼츠 Webhook 서명 검증 로직
            String expectedSignature = generateTossWebhookSignature(payload, timestamp);
            return expectedSignature.equals(signature);
            
        } catch (Exception e) {
            log.error("토스페이먼츠 Webhook 서명 검증 실패: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * 토스페이먼츠 API 헤더 생성
     */
    private HttpHeaders createTossHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Basic " + Base64.getEncoder().encodeToString((secretKey + ":").getBytes()));
        return headers;
    }
    
    /**
     * 토스페이먼츠 Webhook 서명 생성
     */
    private String generateTossWebhookSignature(String payload, String timestamp) {
        try {
            String message = timestamp + "." + payload;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(message.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            
            return hexString.toString();
        } catch (Exception e) {
            log.error("토스페이먼츠 Webhook 서명 생성 실패: {}", e.getMessage(), e);
            throw new RuntimeException("Webhook 서명 생성 실패", e);
        }
    }
    
    /**
     * 날짜 문자열 파싱
     */
    private LocalDateTime parseDateTime(String dateTimeString) {
        if (dateTimeString == null) {
            return null;
        }
        try {
            return LocalDateTime.parse(dateTimeString.replace("Z", "").replace("+09:00", ""));
        } catch (Exception e) {
            log.warn("날짜 파싱 실패: {}", dateTimeString);
            return null;
        }
    }
}
