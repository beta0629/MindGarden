package com.coresolution.core.service;

import com.coresolution.core.dto.UserRoleAssignmentRequest;
import com.coresolution.core.dto.UserRoleAssignmentResponse;

import java.util.List;

/**
 * 사용자 역할 할당 서비스 인터페이스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface UserRoleAssignmentService {
    
    /**
     * 사용자 역할 목록 조회
     * 
     * @param userId 사용자 ID
     * @param tenantId 테넌트 ID
     * @return 역할 할당 목록
     */
    List<UserRoleAssignmentResponse> getUserRoles(Long userId, String tenantId);
    
    /**
     * 역할 할당
     * 
     * @param userId 사용자 ID
     * @param request 역할 할당 요청
     * @param assignedBy 할당자
     * @return 할당된 역할
     */
    UserRoleAssignmentResponse assignRole(Long userId, UserRoleAssignmentRequest request, String assignedBy);
    
    /**
     * 역할 해제
     * 
     * @param userId 사용자 ID
     * @param assignmentId 할당 ID
     * @param revokedBy 해제자
     */
    void revokeRole(Long userId, String assignmentId, String revokedBy);
    
    /**
     * 현재 활성 역할 조회 (브랜치별)
     * 
     * @param userId 사용자 ID
     * @param tenantId 테넌트 ID
     * @param branchId 브랜치 ID
     * @return 활성 역할 할당
     */
    UserRoleAssignmentResponse getCurrentActiveRole(Long userId, String tenantId, Long branchId);
}

