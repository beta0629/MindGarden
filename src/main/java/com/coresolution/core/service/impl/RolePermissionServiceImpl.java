package com.coresolution.core.service.impl;

import com.coresolution.core.domain.RolePermission;
import com.coresolution.core.domain.TenantRole;
import com.coresolution.core.dto.RolePermissionRequest;
import com.coresolution.core.dto.RolePermissionResponse;
import com.coresolution.core.repository.RolePermissionRepository;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.RolePermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 역할 권한 관리 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class RolePermissionServiceImpl implements RolePermissionService {
    
    private final RolePermissionRepository permissionRepository;
    private final TenantRoleRepository tenantRoleRepository;
    private final TenantAccessControlService accessControlService;
    
    @Override
    @Transactional(readOnly = true)
    public List<RolePermissionResponse> getPermissions(String tenantId, String tenantRoleId) {
        log.debug("역할 권한 목록 조회: tenantId={}, tenantRoleId={}", tenantId, tenantRoleId);
        
        accessControlService.validateTenantAccess(tenantId);
        
        // 역할이 해당 테넌트에 속하는지 확인
        TenantRole role = tenantRoleRepository.findByTenantRoleIdAndIsDeletedFalse(tenantRoleId)
            .orElseThrow(() -> new RuntimeException("역할을 찾을 수 없습니다: " + tenantRoleId));
        
        if (!role.getTenantId().equals(tenantId)) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        List<RolePermission> permissions = permissionRepository.findByTenantRoleId(tenantRoleId);
        
        return permissions.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    public RolePermissionResponse addPermission(String tenantId, String tenantRoleId, 
                                               RolePermissionRequest request, String grantedBy) {
        log.info("권한 추가: tenantId={}, tenantRoleId={}, permissionCode={}", 
            tenantId, tenantRoleId, request.getPermissionCode());
        
        accessControlService.validateTenantAccess(tenantId);
        
        // 역할이 해당 테넌트에 속하는지 확인
        TenantRole role = tenantRoleRepository.findByTenantRoleIdAndIsDeletedFalse(tenantRoleId)
            .orElseThrow(() -> new RuntimeException("역할을 찾을 수 없습니다: " + tenantRoleId));
        
        if (!role.getTenantId().equals(tenantId)) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        // 중복 확인
        if (permissionRepository.existsByTenantRoleIdAndPermissionCode(tenantRoleId, request.getPermissionCode())) {
            throw new RuntimeException("이미 존재하는 권한입니다: " + request.getPermissionCode());
        }
        
        // 권한 생성
        RolePermission permission = RolePermission.builder()
            .tenantRoleId(tenantRoleId)
            .permissionCode(request.getPermissionCode())
            .scope(request.getScope())
            .policyJson(request.getPolicyJson())
            .grantedBy(grantedBy)
            .grantedAt(LocalDateTime.now())
            .notes(request.getNotes())
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        
        RolePermission saved = permissionRepository.save(permission);
        
        log.info("권한 추가 완료: permissionId={}", saved.getId());
        return toResponse(saved);
    }
    
    @Override
    public RolePermissionResponse updatePermission(String tenantId, Long permissionId, 
                                                  RolePermissionRequest request, String updatedBy) {
        log.info("권한 수정: tenantId={}, permissionId={}", tenantId, permissionId);
        
        accessControlService.validateTenantAccess(tenantId);
        
        RolePermission permission = permissionRepository.findById(permissionId)
            .orElseThrow(() -> new RuntimeException("권한을 찾을 수 없습니다: " + permissionId));
        
        // 역할이 해당 테넌트에 속하는지 확인
        TenantRole role = tenantRoleRepository.findByTenantRoleIdAndIsDeletedFalse(permission.getTenantRoleId())
            .orElseThrow(() -> new RuntimeException("역할을 찾을 수 없습니다: " + permission.getTenantRoleId()));
        
        if (!role.getTenantId().equals(tenantId)) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        // 권한 코드 변경 시 중복 확인
        if (request.getPermissionCode() != null && 
            !request.getPermissionCode().equals(permission.getPermissionCode())) {
            if (permissionRepository.existsByTenantRoleIdAndPermissionCode(
                permission.getTenantRoleId(), request.getPermissionCode())) {
                throw new RuntimeException("이미 존재하는 권한 코드입니다: " + request.getPermissionCode());
            }
        }
        
        // 권한 정보 업데이트
        if (request.getPermissionCode() != null) permission.setPermissionCode(request.getPermissionCode());
        if (request.getScope() != null) permission.setScope(request.getScope());
        if (request.getPolicyJson() != null) permission.setPolicyJson(request.getPolicyJson());
        if (request.getNotes() != null) permission.setNotes(request.getNotes());
        permission.setUpdatedAt(LocalDateTime.now());
        
        RolePermission updated = permissionRepository.save(permission);
        
        log.info("권한 수정 완료: permissionId={}", permissionId);
        return toResponse(updated);
    }
    
    @Override
    public void removePermission(String tenantId, Long permissionId, String deletedBy) {
        log.info("권한 삭제: tenantId={}, permissionId={}", tenantId, permissionId);
        
        accessControlService.validateTenantAccess(tenantId);
        
        RolePermission permission = permissionRepository.findById(permissionId)
            .orElseThrow(() -> new RuntimeException("권한을 찾을 수 없습니다: " + permissionId));
        
        // 역할이 해당 테넌트에 속하는지 확인
        TenantRole role = tenantRoleRepository.findByTenantRoleIdAndIsDeletedFalse(permission.getTenantRoleId())
            .orElseThrow(() -> new RuntimeException("역할을 찾을 수 없습니다: " + permission.getTenantRoleId()));
        
        if (!role.getTenantId().equals(tenantId)) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        permissionRepository.delete(permission);
        
        log.info("권한 삭제 완료: permissionId={}", permissionId);
    }
    
    /**
     * RolePermission을 RolePermissionResponse로 변환
     */
    private RolePermissionResponse toResponse(RolePermission permission) {
        return RolePermissionResponse.builder()
            .id(permission.getId())
            .tenantRoleId(permission.getTenantRoleId())
            .permissionCode(permission.getPermissionCode())
            .scope(permission.getScope())
            .policyJson(permission.getPolicyJson())
            .grantedBy(permission.getGrantedBy())
            .grantedAt(permission.getGrantedAt())
            .notes(permission.getNotes())
            .build();
    }
}

