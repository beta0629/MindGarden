package com.coresolution.core.controller;

import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.UserRoleAssignmentRequest;
import com.coresolution.core.dto.UserRoleAssignmentResponse;
import com.coresolution.core.service.UserRoleAssignmentService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 사용자 역할 할당 컨트롤러
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-XX
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/users/{userId}/roles", "/api/users/{userId}/roles"}) // v1 경로 추가, 레거시 경로 유지
@RequiredArgsConstructor
public class UserRoleAssignmentController extends BaseApiController {
    
    private final UserRoleAssignmentService assignmentService;
    
    /**
     * 사용자 역할 목록 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserRoleAssignmentResponse>>> getUserRoles(
            @PathVariable Long userId,
            @RequestParam String tenantId) {
        log.info("🔍 사용자 역할 목록 조회: userId={}, tenantId={}", userId, tenantId);
        
        List<UserRoleAssignmentResponse> roles = assignmentService.getUserRoles(userId, tenantId);
        log.info("✅ 사용자 역할 목록 조회 완료: userId={}, tenantId={}, count={}", userId, tenantId, roles.size());
        
        return success(roles);
    }
    
    /**
     * 역할 할당
     */
    @PostMapping
    public ResponseEntity<ApiResponse<UserRoleAssignmentResponse>> assignRole(
            @PathVariable Long userId,
            @RequestBody UserRoleAssignmentRequest request,
            HttpSession session) {
        log.info("🔧 역할 할당 요청: userId={}, tenantId={}, tenantRoleId={}", 
                userId, request.getTenantId(), request.getTenantRoleId());
        
        User currentUser = SessionUtils.getCurrentUser(session);
        String assignedBy = currentUser != null && currentUser.getId() != null
                ? currentUser.getId().toString()
                : "system";
        
        UserRoleAssignmentResponse assignment = assignmentService.assignRole(userId, request, assignedBy);
        log.info("✅ 역할 할당 완료: userId={}, tenantId={}, tenantRoleId={}", 
                userId, assignment.getTenantId(), assignment.getTenantRoleId());
        
        return created("역할이 할당되었습니다.", assignment);
    }
    
    /**
     * 역할 해제
     */
    @DeleteMapping("/{assignmentId}")
    public ResponseEntity<ApiResponse<Void>> revokeRole(
            @PathVariable Long userId,
            @PathVariable String assignmentId,
            HttpSession session) {
        log.info("🗑️ 역할 해제 요청: userId={}, assignmentId={}", userId, assignmentId);
        
        User currentUser = SessionUtils.getCurrentUser(session);
        String revokedBy = currentUser != null && currentUser.getId() != null
                ? currentUser.getId().toString()
                : "system";
        
        assignmentService.revokeRole(userId, assignmentId, revokedBy);
        log.info("✅ 역할 해제 완료: userId={}, assignmentId={}", userId, assignmentId);
        
        return deleted("역할이 해제되었습니다.");
    }
    
    /**
     * 현재 활성 역할 조회
     */
    @GetMapping("/current")
    public ResponseEntity<ApiResponse<UserRoleAssignmentResponse>> getCurrentActiveRole(
            @PathVariable Long userId,
            @RequestParam String tenantId,
            @RequestParam(required = false) Long branchId) {
        log.info("🔍 현재 활성 역할 조회: userId={}, tenantId={}, branchId={}", userId, tenantId, branchId);
        
        UserRoleAssignmentResponse role = assignmentService.getCurrentActiveRole(userId, tenantId, branchId);
        if (role == null) {
            throw new EntityNotFoundException("활성 역할을 찾을 수 없습니다: userId=" + userId + ", tenantId=" + tenantId);
        }
        
        log.info("✅ 현재 활성 역할 조회 완료: userId={}, tenantId={}, tenantRoleId={}", 
                userId, tenantId, role.getTenantRoleId());
        return success(role);
    }
}

