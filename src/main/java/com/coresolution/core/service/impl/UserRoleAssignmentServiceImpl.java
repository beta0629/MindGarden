package com.coresolution.core.service.impl;

import com.coresolution.core.domain.TenantRole;
import com.coresolution.core.domain.UserRoleAssignment;
import com.coresolution.core.dto.UserRoleAssignmentRequest;
import com.coresolution.core.dto.UserRoleAssignmentResponse;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.UserRoleAssignmentService;
import com.coresolution.consultation.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 사용자 역할 할당 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserRoleAssignmentServiceImpl implements UserRoleAssignmentService {
    
    private final UserRoleAssignmentRepository assignmentRepository;
    private final TenantRoleRepository tenantRoleRepository;
    private final BranchRepository branchRepository;
    private final TenantAccessControlService accessControlService;
    
    @Override
    @Transactional(readOnly = true)
    public List<UserRoleAssignmentResponse> getUserRoles(Long userId, String tenantId) {
        log.debug("사용자 역할 목록 조회: userId={}, tenantId={}", userId, tenantId);
        
        accessControlService.validateTenantAccess(tenantId);
        
        List<UserRoleAssignment> assignments = assignmentRepository.findActiveRolesByUserAndTenant(
                userId, tenantId, LocalDate.now());
        
        return assignments.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public UserRoleAssignmentResponse assignRole(Long userId, UserRoleAssignmentRequest request, String assignedBy) {
        log.info("역할 할당: userId={}, tenantId={}, tenantRoleId={}, branchId={}", 
                userId, request.getTenantId(), request.getTenantRoleId(), request.getBranchId());
        
        accessControlService.validateTenantAccess(request.getTenantId());
        
        // 중복 확인
        boolean exists = assignmentRepository.existsByUserAndTenantAndRoleAndBranch(
                userId, request.getTenantId(), request.getTenantRoleId(), request.getBranchId());
        if (exists) {
            throw new RuntimeException("이미 할당된 역할입니다.");
        }
        
        // 역할 존재 확인
        TenantRole role = tenantRoleRepository.findByTenantRoleIdAndIsDeletedFalse(request.getTenantRoleId())
                .orElseThrow(() -> new RuntimeException("역할을 찾을 수 없습니다: " + request.getTenantRoleId()));
        
        if (!role.getTenantId().equals(request.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        // 역할 할당 생성
        String assignmentId = UUID.randomUUID().toString();
        UserRoleAssignment assignment = UserRoleAssignment.builder()
                .assignmentId(assignmentId)
                .userId(userId)
                .tenantId(request.getTenantId())
                .tenantRoleId(request.getTenantRoleId())
                .branchId(request.getBranchId())
                .effectiveFrom(request.getEffectiveFrom() != null ? request.getEffectiveFrom() : LocalDate.now())
                .effectiveTo(request.getEffectiveTo())
                .isActive(true)
                .assignedBy(assignedBy)
                .assignmentReason(request.getAssignmentReason())
                .build();
        
        UserRoleAssignment saved = assignmentRepository.save(assignment);
        
        log.info("역할 할당 완료: assignmentId={}", assignmentId);
        return toResponse(saved);
    }
    
    @Override
    public void revokeRole(Long userId, String assignmentId, String revokedBy) {
        log.info("역할 해제: userId={}, assignmentId={}", userId, assignmentId);
        
        UserRoleAssignment assignment = assignmentRepository.findByAssignmentIdAndIsDeletedFalse(assignmentId)
                .orElseThrow(() -> new RuntimeException("역할 할당을 찾을 수 없습니다: " + assignmentId));
        
        if (!assignment.getUserId().equals(userId)) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        accessControlService.validateTenantAccess(assignment.getTenantId());
        
        // 소프트 삭제
        assignment.delete();
        assignmentRepository.save(assignment);
        
        log.info("역할 해제 완료: assignmentId={}", assignmentId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public UserRoleAssignmentResponse getCurrentActiveRole(Long userId, String tenantId, Long branchId) {
        log.debug("현재 활성 역할 조회: userId={}, tenantId={}, branchId={}", userId, tenantId, branchId);
        
        accessControlService.validateTenantAccess(tenantId);
        
        UserRoleAssignment assignment = assignmentRepository
                .findActiveRoleByUserAndTenantAndBranch(userId, tenantId, branchId, LocalDate.now())
                .orElse(null);
        
        if (assignment == null) {
            return null;
        }
        
        return toResponse(assignment);
    }
    
    /**
     * UserRoleAssignment를 UserRoleAssignmentResponse로 변환
     */
    private UserRoleAssignmentResponse toResponse(UserRoleAssignment assignment) {
        // 역할 정보 조회
        TenantRole role = tenantRoleRepository.findByTenantRoleIdAndIsDeletedFalse(assignment.getTenantRoleId())
                .orElse(null);
        
        // 브랜치 정보 조회
        final String[] branchName = {null};
        if (assignment.getBranchId() != null) {
            branchRepository.findById(assignment.getBranchId())
                    .ifPresent(branch -> branchName[0] = branch.getBranchName());
        }
        
        // 템플릿 코드 조회
        final String[] templateCode = {null};
        if (role != null && role.getRoleTemplateId() != null) {
            // RoleTemplate 조회는 나중에 필요시 추가
        }
        
        return UserRoleAssignmentResponse.builder()
                .assignmentId(assignment.getAssignmentId())
                .userId(assignment.getUserId())
                .tenantId(assignment.getTenantId())
                .tenantRoleId(assignment.getTenantRoleId())
                .roleName(role != null ? role.getName() : null)
                .roleNameKo(role != null ? role.getNameKo() : null)
                .templateCode(templateCode[0])
                .branchId(assignment.getBranchId())
                .branchName(branchName[0])
                .effectiveFrom(assignment.getEffectiveFrom())
                .effectiveTo(assignment.getEffectiveTo())
                .isActive(assignment.getIsActive())
                .isCurrentlyEffective(assignment.isCurrentlyEffective())
                .build();
    }
}

