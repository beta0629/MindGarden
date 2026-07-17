package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.SessionExtensionRequestResponse;
import com.coresolution.consultation.entity.SessionExtensionRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.service.SessionExtensionService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 회기 추가 요청 컨트롤러.
 *
 * <p>P1 보안 가드(2026-06-03 라운드 2): 결제 금액·결제 참조 등 금융 정보가 응답에 포함되므로
 * 상담사(CONSULTANT)·내담자(CLIENT) 호출을 컨트롤러 레벨에서 차단하고 ADMIN/STAFF 전용으로 제한한다.
 * SecurityConfig 매트릭스에도 {@code /api/v1/admin/session-extensions/**} 가 명시적으로 등록되어
 * 2중 방어선을 구성한다.
 *
 * @author MindGarden
 * @version 1.1.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/session-extensions") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
@PreAuthorize(SessionExtensionController.ROLES_MANAGE_EXTENSION)
public class SessionExtensionController extends BaseApiController {

    /** 회기 추가 요청 접근 허용 역할 — 결제 금액 노출 차단 위해 관리자/스태프로 한정. */
    static final String ROLES_MANAGE_EXTENSION = "hasAnyRole('ADMIN','STAFF')";
    
    private final SessionExtensionService sessionExtensionService;
    private final UserService userService;
    
    /**
     * 회기 추가 요청 생성
     *
     * <p>요청자는 HTTP 세션의 로그인 사용자로 확정한다. body {@code requesterId}는 무시하며,
     * 멀티테넌트 전환 후 이전 테넌트 PK와 불일치할 경우 이메일 폴백으로 현재 테넌트 사용자를 조회한다.</p>
     *
     * @param request 요청 본문 (mappingId, additionalSessions, packageName, packagePrice, reason)
     * @param session HTTP 세션
     * @return 생성된 회기 추가 요청
     */
    @PostMapping("/requests")
    public ResponseEntity<ApiResponse<SessionExtensionRequestResponse>> createRequest(
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        log.info("🔄 회기 추가 요청 생성 시작");
        
        User sessionUser = SessionUtils.getCurrentUser(session);
        if (sessionUser == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        
        Long requesterId = resolveUserIdForCurrentTenant(sessionUser, "요청자");
        warnIfBodyRequesterIdMismatch(request, requesterId);
        
        Long mappingId = Long.valueOf(request.get("mappingId").toString());
        Integer additionalSessions = Integer.valueOf(request.get("additionalSessions").toString());
        String packageName = (String) request.get("packageName");
        BigDecimal packagePrice = new BigDecimal(request.get("packagePrice").toString());
        String reason = (String) request.get("reason");
        
        SessionExtensionRequest extensionRequest = sessionExtensionService.createRequest(
            mappingId, requesterId, additionalSessions, packageName, packagePrice, reason);
        
        log.info("✅ 회기 추가 요청 생성 완료: requestId={}", extensionRequest.getId());
        
        return created(
                "회기 추가 요청이 생성되었습니다. 입금 확인을 기다려주세요.",
                SessionExtensionRequestResponse.fromEntity(extensionRequest));
    }
    
    /**
     * 입금 확인 처리
     */
    @PostMapping("/requests/{requestId}/confirm-payment")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmPayment(
            @PathVariable Long requestId,
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        log.info("💰 회기 추가 요청 ID {} 입금 확인 시작", requestId);

        User sessionUser = SessionUtils.getCurrentUser(session);
        if (sessionUser == null) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        Long adminId = resolveUserIdForCurrentTenant(sessionUser, "관리자");
        
        String paymentMethod = (String) request.get("paymentMethod");
        String paymentReference = (String) request.get("paymentReference");
        
        SessionExtensionRequest extensionRequest = sessionExtensionService.confirmPayment(
            requestId, adminId, paymentMethod, paymentReference);
        
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
        
        return success("전체 요청 목록을 성공적으로 조회했습니다.", toRequestListData(requests));
    }
    
    /**
     * 입금 확인 대기 중인 요청 목록
     */
    @GetMapping("/pending-payment")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPendingPaymentRequests() {
        log.info("입금 확인 대기 중인 회기 추가 요청 목록 조회");
        
        List<SessionExtensionRequest> requests = sessionExtensionService.getPendingPaymentRequests();
        
        return success("입금 확인 대기 중인 요청 목록을 성공적으로 조회했습니다.", toRequestListData(requests));
    }
    
    /**
     * 관리자 승인 대기 중인 요청 목록
     */
    @GetMapping("/pending-approval")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPendingAdminApprovalRequests() {
        log.info("관리자 승인 대기 중인 회기 추가 요청 목록 조회");
        
        List<SessionExtensionRequest> requests = sessionExtensionService.getPendingAdminApprovalRequests();
        
        return success("관리자 승인 대기 중인 요청 목록을 성공적으로 조회했습니다.", toRequestListData(requests));
    }
    
    /**
     * 요청 상세 조회
     */
    @GetMapping("/requests/{requestId}")
    public ResponseEntity<ApiResponse<SessionExtensionRequestResponse>> getRequestById(
            @PathVariable Long requestId) {
        log.info("회기 추가 요청 상세 조회: requestId={}", requestId);
        
        SessionExtensionRequest request = sessionExtensionService.getRequestById(requestId);
        
        return success("요청 상세 정보를 성공적으로 조회했습니다.",
                SessionExtensionRequestResponse.fromEntity(request));
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

    /**
     * 현재 테넌트 컨텍스트에서 사용자 PK를 확정한다.
     * 세션 userId가 현재 테넌트에 없으면 이메일로 1건 매칭 시 폴백한다.
     *
     * @param sessionUser HTTP 세션 사용자
     * @param userLabel 예외 메시지에 사용할 사용자 유형
     * @return 현재 테넌트의 사용자 PK
     */
    private Long resolveUserIdForCurrentTenant(User sessionUser, String userLabel) {
        Optional<User> bySessionId = userService.findActiveById(sessionUser.getId());
        if (bySessionId.isPresent()) {
            return bySessionId.get().getId();
        }
        
        String email = sessionUser.getEmail();
        if (email == null || email.isBlank()) {
            throw new EntityNotFoundException(userLabel, sessionUser.getId(),
                    "현재 테넌트에서 사용자를 찾을 수 없습니다.");
        }
        
        var matches = userService.findAllUsersMatchingEmailInCurrentTenant(email);
        if (matches.size() == 1) {
            User tenantUser = matches.get(0);
            log.warn("회기 추가 요청: 세션 userId({})가 현재 테넌트에 없음 — 이메일 폴백으로 요청자({}) 확정",
                    sessionUser.getId(), tenantUser.getId());
            return tenantUser.getId();
        }
        if (matches.isEmpty()) {
            throw new EntityNotFoundException(userLabel, sessionUser.getId(),
                    "현재 테넌트에서 사용자를 찾을 수 없습니다.");
        }
        throw new EntityNotFoundException(userLabel, sessionUser.getId(),
                "현재 테넌트에서 동일 이메일의 요청자가 여러 명입니다.");
    }
    
    /**
     * body requesterId가 세션 기준과 다르면 경고만 남긴다 (값은 사용하지 않음).
     */
    private void warnIfBodyRequesterIdMismatch(Map<String, Object> request, Long resolvedRequesterId) {
        Object bodyRequesterId = request.get("requesterId");
        if (bodyRequesterId == null) {
            return;
        }
        try {
            Long parsedBodyRequesterId = Long.valueOf(bodyRequesterId.toString());
            if (!parsedBodyRequesterId.equals(resolvedRequesterId)) {
                log.warn("회기 추가 요청: body requesterId({}) 무시 — 세션 기준 요청자({}) 사용",
                        parsedBodyRequesterId, resolvedRequesterId);
            }
        } catch (NumberFormatException e) {
            log.warn("회기 추가 요청: body requesterId 형식 오류 — 무시하고 세션 기준 요청자({}) 사용",
                    resolvedRequesterId);
        }
    }
    
    /**
     * 목록 API 공통 응답 맵 (엔티티 직렬화 대신 DTO 사용).
     */
    private Map<String, Object> toRequestListData(List<SessionExtensionRequest> requests) {
        List<SessionExtensionRequestResponse> responses =
                SessionExtensionRequestResponse.fromEntities(requests);
        Map<String, Object> data = new HashMap<>();
        data.put("requests", responses);
        data.put("count", responses.size());
        return data;
    }
}
