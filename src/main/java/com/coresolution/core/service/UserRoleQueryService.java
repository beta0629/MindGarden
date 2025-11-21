package com.coresolution.core.service;

import com.coresolution.core.domain.TenantRole;
import com.coresolution.core.domain.UserRoleAssignment;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.consultation.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 사용자 역할 조회 서비스
 * 하드코딩된 역할 참조 대신 동적 역할 시스템 사용
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserRoleQueryService {
    
    private final UserRoleAssignmentRepository assignmentRepository;
    private final TenantRoleRepository tenantRoleRepository;
    
    /**
     * 사용자의 테넌트별 활성 역할 조회
     * 
     * @param user 사용자
     * @param tenantId 테넌트 ID
     * @return 활성 역할 할당 목록
     */
    public List<UserRoleAssignment> getActiveRoles(User user, String tenantId) {
        if (user == null || tenantId == null) {
            return List.of();
        }
        
        return assignmentRepository.findActiveRolesByUserAndTenant(
            user.getId(), tenantId, LocalDate.now()
        );
    }
    
    /**
     * 사용자의 테넌트별 주요 역할 조회 (가장 최근 할당된 역할)
     * 
     * @param user 사용자
     * @param tenantId 테넌트 ID
     * @return 주요 역할 할당 (Optional)
     */
    public Optional<UserRoleAssignment> getPrimaryRole(User user, String tenantId) {
        List<UserRoleAssignment> roles = getActiveRoles(user, tenantId);
        
        if (roles.isEmpty()) {
            return Optional.empty();
        }
        
        // 가장 최근 할당된 역할 반환
        return roles.stream()
            .sorted((a1, a2) -> {
                if (a1.getEffectiveFrom() == null && a2.getEffectiveFrom() == null) return 0;
                if (a1.getEffectiveFrom() == null) return 1;
                if (a2.getEffectiveFrom() == null) return -1;
                return a2.getEffectiveFrom().compareTo(a1.getEffectiveFrom());
            })
            .findFirst();
    }
    
    /**
     * 사용자의 테넌트별 역할명 조회
     * 
     * @param user 사용자
     * @param tenantId 테넌트 ID
     * @return 역할명 (한글)
     */
    public String getRoleNameKo(User user, String tenantId) {
        return getPrimaryRole(user, tenantId)
            .map(assignment -> {
                TenantRole role = tenantRoleRepository
                    .findByTenantRoleIdAndIsDeletedFalse(assignment.getTenantRoleId())
                    .orElse(null);
                return role != null ? role.getNameKo() : null;
            })
            .orElse(null);
    }
    
    /**
     * 사용자가 특정 역할을 가지고 있는지 확인
     * 
     * @param user 사용자
     * @param tenantId 테넌트 ID
     * @param roleNameKo 역할명 (한글)
     * @return 역할 보유 여부
     */
    public boolean hasRole(User user, String tenantId, String roleNameKo) {
        if (user == null || tenantId == null || roleNameKo == null) {
            return false;
        }
        
        List<UserRoleAssignment> roles = getActiveRoles(user, tenantId);
        
        return roles.stream()
            .anyMatch(assignment -> {
                TenantRole role = tenantRoleRepository
                    .findByTenantRoleIdAndIsDeletedFalse(assignment.getTenantRoleId())
                    .orElse(null);
                return role != null && roleNameKo.equals(role.getNameKo());
            });
    }
    
    /**
     * 사용자가 특정 템플릿 코드 기반 역할을 가지고 있는지 확인
     * 
     * @param user 사용자
     * @param tenantId 테넌트 ID
     * @param templateCode 템플릿 코드
     * @return 역할 보유 여부
     */
    public boolean hasRoleByTemplateCode(User user, String tenantId, String templateCode) {
        if (user == null || tenantId == null || templateCode == null) {
            return false;
        }
        
        // 템플릿 코드로 역할 조회 후 확인
        List<TenantRole> roles = tenantRoleRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        
        Optional<String> roleId = roles.stream()
            .filter(role -> templateCode.equals(role.getRoleTemplateId()))
            .map(TenantRole::getTenantRoleId)
            .findFirst();
        
        if (roleId.isEmpty()) {
            return false;
        }
        
        List<UserRoleAssignment> assignments = getActiveRoles(user, tenantId);
        return assignments.stream()
            .anyMatch(assignment -> roleId.get().equals(assignment.getTenantRoleId()));
    }
    
    /**
     * 사용자의 모든 테넌트별 역할 조회
     * 
     * @param user 사용자
     * @return 테넌트별 역할 맵 (tenantId -> 역할 목록)
     */
    public java.util.Map<String, List<UserRoleAssignment>> getAllTenantRoles(User user) {
        if (user == null) {
            return java.util.Map.of();
        }
        
        List<UserRoleAssignment> allAssignments = assignmentRepository
            .findAllActiveRolesByUser(user.getId(), LocalDate.now());
        
        return allAssignments.stream()
            .collect(Collectors.groupingBy(UserRoleAssignment::getTenantId));
    }
}

