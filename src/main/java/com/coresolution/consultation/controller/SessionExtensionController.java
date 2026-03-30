package com.coresolution.consultation.controller;

import com.coresolution.consultation.entity.SessionExtensionRequest;
import com.coresolution.consultation.service.SessionExtensionService;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 회기 추가 요청 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/session-extensions") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class SessionExtensionController extends BaseApiController {
    
    private final SessionExtensionService sessionExtensionService;
    
    /**
     * 회기 추가 요청 생성
     */
    @PostMapping("/requests")
    public ResponseEntity<ApiResponse<SessionExtensionRequest>> createRequest(@RequestBody Map<String, Object> request) {
        log.info("🔄 회기 추가 요청 생성 시작");
        
        Long mappingId = Long.valueOf(request.get("mappingId").toString());
        Long requesterId = Long.valueOf(request.get("requesterId").toString());
        Integer additionalSessions = Integer.valueOf(request.get("additionalSessions").toString());
        String packageName = (String) request.get("packageName");
        BigDecimal packagePrice = new BigDecimal(request.get("packagePrice").toString());
        String reason = (String) request.get("reason");
        
        SessionExtensionRequest extensionRequest = sessionExtensionService.createRequest(
            mappingId, requesterId, additionalSessions, packageName, packagePrice, reason);
        
        log.info("✅ 회기 추가 요청 생성 완료: requestId={}", extensionRequest.getId());
        
        return created("회기 추가 요청이 생성되었습니다. 입금 확인을 기다려주세요.", extensionRequest);
    }
    
    /**
     * 입금 확인 처리
     */
    @PostMapping("/requests/{requestId}/confirm-payment")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmPayment(
            @PathVariable Long requestId,
            @RequestBody Map<String, Object> request) {
        log.info("💰 회기 추가 요청 ID {} 입금 확인 시작", requestId);
        
        String paymentMethod = (String) request.get("paymentMethod");
        String paymentReference = (String) request.get("paymentReference");
        
        SessionExtensionRequest extensionRequest = sessionExtensionService.confirmPayment(
            requestId, paymentMethod, paymentReference);
        
        log.info("💰 회기 추가 요청 ID {} 입금 확인 완료", requestId);
        
        // 안전한 데이터 추출
        Map<String, Object> requestData = new HashMap<>();
        requestData.put("id", extensionRequest.getId());
        requestData.put("status", extensionRequest.getStatus().toString());
        requestData.put("additionalSessions", extensionRequest.getAdditionalSessions());
        requestData.put("packageName", extensionRequest.getPackageName());
        requestData.put("packagePrice", extensionRequest.getPackagePrice());
        requestData.put("reason", extensionRequest.getReason());
        requestData.put("createdAt", extensionRequest.getCreatedAt());
        
        return success("입금이 확인되었고 자동으로 승인되어 회기가 추가되었습니다.", requestData);
    }
    
    /**
     * 관리자 승인
     */
    @PostMapping("/requests/{requestId}/approve")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approveRequest(
            @PathVariable Long requestId,
            @RequestBody Map<String, Object> request) {
        log.info("✅ 회기 추가 요청 ID {} 관리자 승인 시작", requestId);
        
        Long adminId = Long.valueOf(request.get("adminId").toString());
        String comment = (String) request.get("comment");
        
        SessionExtensionRequest extensionRequest = sessionExtensionService.approveByAdmin(
            requestId, adminId, comment);
        
        log.info("✅ 회기 추가 요청 ID {} 관리자 승인 완료", requestId);
        
        // 안전한 데이터 추출
        Map<String, Object> requestData = new HashMap<>();
        requestData.put("id", extensionRequest.getId());
        requestData.put("status", extensionRequest.getStatus().toString());
        requestData.put("additionalSessions", extensionRequest.getAdditionalSessions());
        requestData.put("packageName", extensionRequest.getPackageName());
        requestData.put("packagePrice", extensionRequest.getPackagePrice());
        requestData.put("adminComment", extensionRequest.getAdminComment());
        requestData.put("approvedAt", extensionRequest.getApprovedAt());
        
        return success("회기 추가 요청이 승인되었습니다.", requestData);
    }
    
    /**
     * 요청 거부
     */
    @PostMapping("/requests/{requestId}/reject")
    public ResponseEntity<ApiResponse<Map<String, Object>>> rejectRequest(
            @PathVariable Long requestId,
            @RequestBody Map<String, Object> request) {
        log.info("❌ 회기 추가 요청 ID {} 거부 시작", requestId);
        
        Long adminId = Long.valueOf(request.get("adminId").toString());
        String reason = (String) request.get("reason");
        
        SessionExtensionRequest extensionRequest = sessionExtensionService.rejectRequest(
            requestId, adminId, reason);
        
        log.info("❌ 회기 추가 요청 ID {} 거부 완료", requestId);
        
        Map<String, Object> data = new HashMap<>();
        data.put("id", extensionRequest.getId());
        data.put("status", extensionRequest.getStatus().toString());
        data.put("rejectionReason", extensionRequest.getRejectionReason());
        data.put("rejectedAt", extensionRequest.getRejectedAt());
        
        return success("회기 추가 요청이 거부되었습니다.", data);
    }
    
    /**
     * 요청 완료 처리 (실제 회기 추가)
     */
    @PostMapping("/requests/{requestId}/complete")
    public ResponseEntity<ApiResponse<Map<String, Object>>> completeRequest(@PathVariable Long requestId) {
        log.info("🎯 회기 추가 요청 ID {} 완료 처리 시작", requestId);
        
        SessionExtensionRequest extensionRequest = sessionExtensionService.completeRequest(requestId);
        
        log.info("🎯 회기 추가 요청 ID {} 완료 처리 완료", requestId);
        
        Map<String, Object> data = new HashMap<>();
        data.put("id", extensionRequest.getId());
        data.put("status", extensionRequest.getStatus().toString());
        data.put("additionalSessions", extensionRequest.getAdditionalSessions());
        data.put("completedAt", extensionRequest.getUpdatedAt());
        
        return success("회기가 성공적으로 추가되었습니다.", data);
    }
    
    /**
     * 전체 요청 목록 조회
     */
    @GetMapping("/requests")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllRequests() {
        log.info("전체 회기 추가 요청 목록 조회");
        
        List<SessionExtensionRequest> requests = sessionExtensionService.getAllRequests();
        
        Map<String, Object> data = new HashMap<>();
        data.put("requests", requests);
        data.put("count", requests.size());
        
        return success("전체 요청 목록을 성공적으로 조회했습니다.", data);
    }
    
    /**
     * 입금 확인 대기 중인 요청 목록
     */
    @GetMapping("/pending-payment")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPendingPaymentRequests() {
        log.info("입금 확인 대기 중인 회기 추가 요청 목록 조회");
        
        List<SessionExtensionRequest> requests = sessionExtensionService.getPendingPaymentRequests();
        
        Map<String, Object> data = new HashMap<>();
        data.put("requests", requests);
        data.put("count", requests.size());
        
        return success("입금 확인 대기 중인 요청 목록을 성공적으로 조회했습니다.", data);
    }
    
    /**
     * 관리자 승인 대기 중인 요청 목록
     */
    @GetMapping("/pending-approval")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPendingAdminApprovalRequests() {
        log.info("관리자 승인 대기 중인 회기 추가 요청 목록 조회");
        
        List<SessionExtensionRequest> requests = sessionExtensionService.getPendingAdminApprovalRequests();
        
        Map<String, Object> data = new HashMap<>();
        data.put("requests", requests);
        data.put("count", requests.size());
        
        return success("관리자 승인 대기 중인 요청 목록을 성공적으로 조회했습니다.", data);
    }
    
    /**
     * 요청 상세 조회
     */
    @GetMapping("/requests/{requestId}")
    public ResponseEntity<ApiResponse<SessionExtensionRequest>> getRequestById(@PathVariable Long requestId) {
        log.info("회기 추가 요청 상세 조회: requestId={}", requestId);
        
        SessionExtensionRequest request = sessionExtensionService.getRequestById(requestId);
        
        return success("요청 상세 정보를 성공적으로 조회했습니다.", request);
    }
    
    /**
     * 요청 통계 조회
     */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRequestStatistics() {
        log.info("회기 추가 요청 통계 조회");
        
        Map<String, Object> statistics = sessionExtensionService.getRequestStatistics();
        
        return success("요청 통계를 성공적으로 조회했습니다.", statistics);
    }
}
