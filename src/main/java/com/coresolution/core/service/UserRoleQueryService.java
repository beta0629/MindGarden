package com.coresolution.core.service;

import com.coresolution.core.domain.TenantRole;
import com.coresolution.core.domain.UserRoleAssignment;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.constant.UserRole;
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
     * UserRoleAssignment가 없을 경우 User의 role 필드를 기반으로 TenantRole을 찾음
     * 
     * @param user 사용자
     * @param tenantId 테넌트 ID
     * @return 주요 역할 할당 (Optional)
     */
    @Transactional(readOnly = true)
    public Optional<UserRoleAssignment> getPrimaryRole(User user, String tenantId) {
        List<UserRoleAssignment> roles = getActiveRoles(user, tenantId);
        
        if (!roles.isEmpty()) {
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
        
        // UserRoleAssignment가 없을 경우 User의 role 필드를 기반으로 TenantRole 찾기
        if (user.getRole() != null) {
            log.debug("UserRoleAssignment가 없음. User.role 기반으로 TenantRole 찾기: userId={}, role={}, tenantId={}", 
                    user.getId(), user.getRole(), tenantId);
            
            // UserRole enum을 한글 역할명으로 매핑
            String roleNameKo = mapUserRoleToRoleNameKo(user.getRole());
            
            // 해당 테넌트에서 역할명으로 TenantRole 찾기
            Optional<TenantRole> tenantRole = tenantRoleRepository.findByTenantIdAndNameKo(tenantId, roleNameKo);
            
            if (tenantRole.isPresent()) {
                log.info("✅ TenantRole 찾음: tenantId={}, roleNameKo={}, tenantRoleId={}", 
                        tenantId, roleNameKo, tenantRole.get().getTenantRoleId());
                // TenantRole을 찾았지만 UserRoleAssignment는 없으므로 Optional.empty() 반환
                // (동적 생성은 별도 서비스에서 처리)
            } else {
                log.warn("⚠️ TenantRole을 찾을 수 없음: tenantId={}, roleNameKo={}", tenantId, roleNameKo);
            }
        }
        
        return Optional.empty();
    }
    
    /**
     * UserRole enum을 한글 역할명으로 매핑
     * 
     * @param userRole UserRole enum
     * @return 한글 역할명
     */
    private String mapUserRoleToRoleNameKo(UserRole userRole) {
        if (userRole == null) {
            return null;
        }
        
        switch (userRole) {
            case ADMIN:
                return "관리자";
            case BRANCH_SUPER_ADMIN:
                return "지점 수퍼 관리자";
            case BRANCH_ADMIN:
                return "지점 관리자";
            case BRANCH_MANAGER:
                return "지점장";
            case HQ_ADMIN:
                return "본사 관리자";
            case SUPER_HQ_ADMIN:
                return "본사 고급 관리자";
            case HQ_MASTER:
                return "본사 총관리자";
            case HQ_SUPER_ADMIN:
                return "본사 최고관리자";
            case CONSULTANT:
                return "상담사";
            case CLIENT:
                return "내담자";
            default:
                return "관리자"; // 기본값
        }
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

