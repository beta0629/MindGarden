package com.mindgarden.consultation.service.impl;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.mindgarden.consultation.entity.RefundRequest;
import com.mindgarden.consultation.repository.RefundRequestRepository;
import com.mindgarden.consultation.service.ErpIntegrationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * ERP 연동 서비스 구현체
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ErpIntegrationServiceImpl implements ErpIntegrationService {

    private final RefundRequestRepository refundRequestRepository;
    private final RestTemplate restTemplate;

    @Value("${erp.base-url:http://localhost:8081}")
    private String erpBaseUrl;

    @Value("${erp.api-key:default-api-key}")
    private String erpApiKey;

    @Value("${erp.timeout:30000}")
    private int erpTimeout;

    @Value("${erp.retry-attempts:3}")
    private int maxRetryAttempts;

    @Value("${erp.enabled:false}")
    private boolean erpEnabled;

    @Override
    public Map<String, Object> sendRefundRequestToErp(RefundRequest refundRequest) {
        log.info("🔄 ERP 환불 요청 전송 시작: ID={}", refundRequest.getId());

        Map<String, Object> result = new HashMap<>();
        
        if (!erpEnabled) {
            log.info("⚠️ ERP 연동이 비활성화되어 있습니다. 모의 처리를 진행합니다.");
            return simulateErpIntegration(refundRequest);
        }

        try {
            // ERP 요청 데이터 구성
            Map<String, Object> erpRequestData = buildErpRequestData(refundRequest);
            
            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + erpApiKey);
            headers.set("X-Request-ID", generateRequestId());
            
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(erpRequestData, headers);
            
            // ERP API 호출
            String erpUrl = erpBaseUrl + "/api/refund/request";
            ResponseEntity<Map> response = restTemplate.postForEntity(erpUrl, requestEntity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED) {
                Map<String, Object> responseBody = response.getBody();
                
                result.put("success", true);
                result.put("erpReferenceNumber", responseBody.get("referenceNumber"));
                result.put("erpStatus", RefundRequest.ErpIntegrationStatus.SENT);
                result.put("message", "ERP 환불 요청이 성공적으로 전송되었습니다.");
                
                log.info("✅ ERP 환불 요청 전송 성공: RefundID={}, ErpRef={}", 
                        refundRequest.getId(), responseBody.get("referenceNumber"));
            } else {
                result.put("success", false);
                result.put("erpStatus", RefundRequest.ErpIntegrationStatus.FAILED);
                result.put("message", "ERP 서버에서 예상치 못한 응답을 받았습니다: " + response.getStatusCode());
                
                log.warn("⚠️ ERP 환불 요청 실패: RefundID={}, Status={}", 
                        refundRequest.getId(), response.getStatusCode());
            }
            
        } catch (HttpClientErrorException e) {
            result.put("success", false);
            result.put("erpStatus", RefundRequest.ErpIntegrationStatus.FAILED);
            result.put("message", "ERP 요청 오류: " + e.getMessage());
            
            log.error("❌ ERP 환불 요청 클라이언트 오류: RefundID={}, Error={}", 
                    refundRequest.getId(), e.getMessage());
            
        } catch (HttpServerErrorException e) {
            result.put("success", false);
            result.put("erpStatus", RefundRequest.ErpIntegrationStatus.RETRY);
            result.put("message", "ERP 서버 오류: " + e.getMessage());
            
            log.error("❌ ERP 환불 요청 서버 오류: RefundID={}, Error={}", 
                    refundRequest.getId(), e.getMessage());
            
        } catch (ResourceAccessException e) {
            result.put("success", false);
            result.put("erpStatus", RefundRequest.ErpIntegrationStatus.RETRY);
            result.put("message", "ERP 서버 연결 실패: " + e.getMessage());
            
            log.error("❌ ERP 환불 요청 연결 실패: RefundID={}, Error={}", 
                    refundRequest.getId(), e.getMessage());
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("erpStatus", RefundRequest.ErpIntegrationStatus.FAILED);
            result.put("message", "ERP 연동 중 예상치 못한 오류: " + e.getMessage());
            
            log.error("❌ ERP 환불 요청 예상치 못한 오류: RefundID={}", refundRequest.getId(), e);
        }
        
        return result;
    }

    @Override
    public Map<String, Object> checkRefundStatusFromErp(String erpReferenceNumber) {
        log.info("🔍 ERP 환불 상태 확인: ErpRef={}", erpReferenceNumber);

        Map<String, Object> result = new HashMap<>();
        
        if (!erpEnabled) {
            return simulateErpStatusCheck(erpReferenceNumber);
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + erpApiKey);
            headers.set("X-Request-ID", generateRequestId());
            
            HttpEntity<String> requestEntity = new HttpEntity<>(headers);
            
            String erpUrl = erpBaseUrl + "/api/refund/status/" + erpReferenceNumber;
            ResponseEntity<Map> response = restTemplate.exchange(erpUrl, HttpMethod.GET, requestEntity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> responseBody = response.getBody();
                
                result.put("success", true);
                result.put("erpStatus", responseBody.get("status"));
                result.put("processedAmount", responseBody.get("processedAmount"));
                result.put("processedDate", responseBody.get("processedDate"));
                result.put("message", "ERP 상태 확인 완료");
                
                log.info("✅ ERP 환불 상태 확인 성공: ErpRef={}, Status={}", 
                        erpReferenceNumber, responseBody.get("status"));
            } else {
                result.put("success", false);
                result.put("message", "ERP에서 환불 정보를 찾을 수 없습니다.");
                
                log.warn("⚠️ ERP 환불 상태 확인 실패: ErpRef={}, Status={}", 
                        erpReferenceNumber, response.getStatusCode());
            }
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "ERP 상태 확인 중 오류: " + e.getMessage());
            
            log.error("❌ ERP 환불 상태 확인 오류: ErpRef={}", erpReferenceNumber, e);
        }
        
        return result;
    }

    @Override
    public void retryFailedErpIntegrations() {
        log.info("🔄 ERP 연동 실패 건 재시도 시작");
        
        // 10분 전에 실패한 건들을 재시도 대상으로 선정
        LocalDateTime retryThreshold = LocalDateTime.now().minusMinutes(10);
        
        List<RefundRequest> retryTargets = refundRequestRepository.findErpRetryTargets(
                RefundRequest.ErpIntegrationStatus.RETRY, retryThreshold);
        
        log.info("📋 재시도 대상: {}건", retryTargets.size());
        
        for (RefundRequest refundRequest : retryTargets) {
            try {
                Map<String, Object> result = sendRefundRequestToErp(refundRequest);
                
                // 결과에 따라 상태 업데이트
                RefundRequest.ErpIntegrationStatus newStatus = 
                        (RefundRequest.ErpIntegrationStatus) result.get("erpStatus");
                String responseMessage = (String) result.get("message");
                
                refundRequest.setErpStatus(newStatus);
                refundRequest.setErpResponseMessage(responseMessage);
                
                if (result.get("erpReferenceNumber") != null) {
                    refundRequest.setErpReferenceNumber((String) result.get("erpReferenceNumber"));
                }
                
                refundRequestRepository.save(refundRequest);
                
                log.info("🔄 재시도 처리 완료: RefundID={}, NewStatus={}", 
                        refundRequest.getId(), newStatus);
                
            } catch (Exception e) {
                log.error("❌ 재시도 처리 실패: RefundID={}", refundRequest.getId(), e);
            }
        }
        
        log.info("✅ ERP 연동 실패 건 재시도 완료");
    }

    @Override
    public boolean isErpSystemAvailable() {
        if (!erpEnabled) {
            return false;
        }
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + erpApiKey);
            
            HttpEntity<String> requestEntity = new HttpEntity<>(headers);
            
            String healthCheckUrl = erpBaseUrl + "/api/health";
            ResponseEntity<String> response = restTemplate.exchange(healthCheckUrl, HttpMethod.GET, requestEntity, String.class);
            
            boolean available = response.getStatusCode() == HttpStatus.OK;
            log.info("🏥 ERP 시스템 상태 확인: {}", available ? "정상" : "비정상");
            
            return available;
            
        } catch (Exception e) {
            log.warn("⚠️ ERP 시스템 연결 확인 실패: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public void synchronizeErpRefundData() {
        log.info("🔄 ERP 환불 데이터 동기화 시작");
        
        // ERP에 전송된 상태의 환불 요청들 조회
        List<RefundRequest> sentRequests = refundRequestRepository.findByErpStatusOrderByCreatedAtDesc(
                RefundRequest.ErpIntegrationStatus.SENT);
        
        for (RefundRequest request : sentRequests) {
            if (request.getErpReferenceNumber() != null) {
                try {
                    Map<String, Object> statusResult = checkRefundStatusFromErp(request.getErpReferenceNumber());
                    
                    if ((Boolean) statusResult.get("success")) {
                        String erpStatus = (String) statusResult.get("erpStatus");
                        
                        // ERP 상태에 따라 내부 상태 업데이트
                        if ("COMPLETED".equals(erpStatus)) {
                            request.setStatus(RefundRequest.RefundStatus.COMPLETED);
                            request.setErpStatus(RefundRequest.ErpIntegrationStatus.CONFIRMED);
                            request.setCompletedAt(LocalDateTime.now());
                        } else if ("PROCESSING".equals(erpStatus)) {
                            request.setStatus(RefundRequest.RefundStatus.PROCESSING);
                        } else if ("REJECTED".equals(erpStatus)) {
                            request.setStatus(RefundRequest.RefundStatus.REJECTED);
                            request.setRejectedAt(LocalDateTime.now());
                        }
                        
                        refundRequestRepository.save(request);
                        
                        log.info("🔄 환불 상태 동기화: RefundID={}, Status={}", 
                                request.getId(), request.getStatus());
                    }
                    
                } catch (Exception e) {
                    log.error("❌ 환불 상태 동기화 실패: RefundID={}", request.getId(), e);
                }
            }
        }
        
        log.info("✅ ERP 환불 데이터 동기화 완료");
    }

    /**
     * ERP 요청 데이터 구성
     */
    private Map<String, Object> buildErpRequestData(RefundRequest refundRequest) {
        Map<String, Object> data = new HashMap<>();
        
        data.put("refundId", refundRequest.getId());
        data.put("clientName", refundRequest.getMapping().getClient().getName());
        data.put("consultantName", refundRequest.getMapping().getConsultant().getName());
        data.put("packageName", refundRequest.getMapping().getPackageName());
        data.put("refundAmount", refundRequest.getRefundAmount());
        data.put("refundSessions", refundRequest.getRefundSessions());
        data.put("refundReason", refundRequest.getRefundReason());
        data.put("reasonCode", refundRequest.getReasonCode());
        data.put("requestedAt", refundRequest.getRequestedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        data.put("requestedBy", refundRequest.getRequestedBy().getName());
        
        return data;
    }

    /**
     * 요청 ID 생성
     */
    private String generateRequestId() {
        return "REQ_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    /**
     * ERP 연동 모의 처리 (개발/테스트용)
     */
    private Map<String, Object> simulateErpIntegration(RefundRequest refundRequest) {
        Map<String, Object> result = new HashMap<>();
        
        // 모의 ERP 참조 번호 생성
        String mockErpRef = "MOCK_" + System.currentTimeMillis();
        
        result.put("success", true);
        result.put("erpReferenceNumber", mockErpRef);
        result.put("erpStatus", RefundRequest.ErpIntegrationStatus.SENT);
        result.put("message", "모의 ERP 연동 완료 (개발 모드)");
        
        log.info("🎭 모의 ERP 연동: RefundID={}, MockRef={}", refundRequest.getId(), mockErpRef);
        
        return result;
    }

    /**
     * ERP 상태 확인 모의 처리 (개발/테스트용)
     */
    private Map<String, Object> simulateErpStatusCheck(String erpReferenceNumber) {
        Map<String, Object> result = new HashMap<>();
        
        result.put("success", true);
        result.put("erpStatus", "COMPLETED");
        result.put("processedAmount", 100000);
        result.put("processedDate", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        result.put("message", "모의 ERP 상태 확인 완료 (개발 모드)");
        
        log.info("🎭 모의 ERP 상태 확인: ErpRef={}", erpReferenceNumber);
        
        return result;
    }
}
