package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.entity.SessionExtensionRequest;
import com.mindgarden.consultation.service.SessionExtensionService;
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
@RequestMapping("/api/admin/session-extensions")
@RequiredArgsConstructor
public class SessionExtensionController {
    
    private final SessionExtensionService sessionExtensionService;
    
    /**
     * 회기 추가 요청 생성
     */
    @PostMapping("/requests")
    public ResponseEntity<?> createRequest(@RequestBody Map<String, Object> request) {
        try {
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
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "회기 추가 요청이 생성되었습니다. 입금 확인을 기다려주세요.",
                "data", extensionRequest
            ));
        } catch (Exception e) {
            log.error("❌ 회기 추가 요청 생성 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "회기 추가 요청 생성에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 입금 확인 처리
     */
    @PostMapping("/requests/{requestId}/confirm-payment")
    public ResponseEntity<?> confirmPayment(
            @PathVariable Long requestId,
            @RequestBody Map<String, Object> request) {
        try {
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
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "입금이 확인되었고 자동으로 승인되어 회기가 추가되었습니다.",
                "data", requestData
            ));
        } catch (Exception e) {
            log.error("❌ 입금 확인 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "입금 확인에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 관리자 승인
     */
    @PostMapping("/requests/{requestId}/approve")
    public ResponseEntity<?> approveRequest(
            @PathVariable Long requestId,
            @RequestBody Map<String, Object> request) {
        try {
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
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "회기 추가 요청이 승인되었습니다.",
                "data", requestData
            ));
        } catch (Exception e) {
            log.error("❌ 관리자 승인 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "관리자 승인에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 요청 거부
     */
    @PostMapping("/requests/{requestId}/reject")
    public ResponseEntity<?> rejectRequest(
            @PathVariable Long requestId,
            @RequestBody Map<String, Object> request) {
        try {
            log.info("❌ 회기 추가 요청 ID {} 거부 시작", requestId);
            
            Long adminId = Long.valueOf(request.get("adminId").toString());
            String reason = (String) request.get("reason");
            
            SessionExtensionRequest extensionRequest = sessionExtensionService.rejectRequest(
                requestId, adminId, reason);
            
            log.info("❌ 회기 추가 요청 ID {} 거부 완료", requestId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "회기 추가 요청이 거부되었습니다.",
                "data", Map.of(
                    "id", extensionRequest.getId(),
                    "status", extensionRequest.getStatus().toString(),
                    "rejectionReason", extensionRequest.getRejectionReason(),
                    "rejectedAt", extensionRequest.getRejectedAt()
                )
            ));
        } catch (Exception e) {
            log.error("❌ 요청 거부 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "요청 거부에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 요청 완료 처리 (실제 회기 추가)
     */
    @PostMapping("/requests/{requestId}/complete")
    public ResponseEntity<?> completeRequest(@PathVariable Long requestId) {
        try {
            log.info("🎯 회기 추가 요청 ID {} 완료 처리 시작", requestId);
            
            SessionExtensionRequest extensionRequest = sessionExtensionService.completeRequest(requestId);
            
            log.info("🎯 회기 추가 요청 ID {} 완료 처리 완료", requestId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "회기가 성공적으로 추가되었습니다.",
                "data", Map.of(
                    "id", extensionRequest.getId(),
                    "status", extensionRequest.getStatus().toString(),
                    "additionalSessions", extensionRequest.getAdditionalSessions(),
                    "completedAt", extensionRequest.getUpdatedAt()
                )
            ));
        } catch (Exception e) {
            log.error("❌ 요청 완료 처리 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "요청 완료 처리에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 전체 요청 목록 조회
     */
    @GetMapping("/requests")
    public ResponseEntity<?> getAllRequests() {
        try {
            log.info("전체 회기 추가 요청 목록 조회");
            
            List<SessionExtensionRequest> requests = sessionExtensionService.getAllRequests();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", requests,
                "count", requests.size(),
                "message", "전체 요청 목록을 성공적으로 조회했습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 전체 요청 목록 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "전체 요청 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 입금 확인 대기 중인 요청 목록
     */
    @GetMapping("/pending-payment")
    public ResponseEntity<?> getPendingPaymentRequests() {
        try {
            log.info("입금 확인 대기 중인 회기 추가 요청 목록 조회");
            
            List<SessionExtensionRequest> requests = sessionExtensionService.getPendingPaymentRequests();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", requests,
                "count", requests.size(),
                "message", "입금 확인 대기 중인 요청 목록을 성공적으로 조회했습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 입금 확인 대기 요청 목록 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "입금 확인 대기 요청 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 관리자 승인 대기 중인 요청 목록
     */
    @GetMapping("/pending-approval")
    public ResponseEntity<?> getPendingAdminApprovalRequests() {
        try {
            log.info("관리자 승인 대기 중인 회기 추가 요청 목록 조회");
            
            List<SessionExtensionRequest> requests = sessionExtensionService.getPendingAdminApprovalRequests();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", requests,
                "count", requests.size(),
                "message", "관리자 승인 대기 중인 요청 목록을 성공적으로 조회했습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 관리자 승인 대기 요청 목록 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "관리자 승인 대기 요청 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 요청 상세 조회
     */
    @GetMapping("/requests/{requestId}")
    public ResponseEntity<?> getRequestById(@PathVariable Long requestId) {
        try {
            log.info("회기 추가 요청 상세 조회: requestId={}", requestId);
            
            SessionExtensionRequest request = sessionExtensionService.getRequestById(requestId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", request,
                "message", "요청 상세 정보를 성공적으로 조회했습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 요청 상세 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "요청 상세 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 요청 통계 조회
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getRequestStatistics() {
        try {
            log.info("회기 추가 요청 통계 조회");
            
            Map<String, Object> statistics = sessionExtensionService.getRequestStatistics();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", statistics,
                "message", "요청 통계를 성공적으로 조회했습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 요청 통계 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "요청 통계 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}
