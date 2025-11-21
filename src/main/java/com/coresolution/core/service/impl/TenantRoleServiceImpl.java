package com.coresolution.core.service.impl;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.coresolution.core.constant.RoleConstants;
import com.coresolution.core.domain.RolePermission;
import com.coresolution.core.domain.RoleTemplate;
import com.coresolution.core.domain.RoleTemplatePermission;
import com.coresolution.core.domain.TenantRole;
import com.coresolution.core.dto.TenantRoleRequest;
import com.coresolution.core.dto.TenantRoleResponse;
import com.coresolution.core.repository.RolePermissionRepository;
import com.coresolution.core.repository.RoleTemplateRepository;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.TenantRoleService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 테넌트 역할 서비스 구현체
 * 역할 동적 관리 (생성/수정/삭제)
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TenantRoleServiceImpl implements TenantRoleService {
    
    private final TenantRoleRepository tenantRoleRepository;
    private final RoleTemplateRepository roleTemplateRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final UserRoleAssignmentRepository userRoleAssignmentRepository;
    private final TenantAccessControlService accessControlService;
    
    @Override
    @Transactional(readOnly = true)
    public List<TenantRoleResponse> getRolesByTenant(String tenantId) {
        log.debug("테넌트별 역할 목록 조회: tenantId={}", tenantId);
        
        accessControlService.validateTenantAccess(tenantId);
        
        List<TenantRole> roles = tenantRoleRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        
        return roles.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public TenantRoleResponse getRole(String tenantId, String tenantRoleId) {
        log.debug("역할 상세 조회: tenantId={}, tenantRoleId={}", tenantId, tenantRoleId);
        
        accessControlService.validateTenantAccess(tenantId);
        
        TenantRole role = tenantRoleRepository.findByTenantRoleIdAndIsDeletedFalse(tenantRoleId)
                .orElseThrow(() -> new RuntimeException("역할을 찾을 수 없습니다: " + tenantRoleId));
        
        if (!role.getTenantId().equals(tenantId)) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        return toResponse(role);
    }
    
    @Override
    public TenantRoleResponse createRole(String tenantId, TenantRoleRequest request, String createdBy) {
        log.info("역할 생성: tenantId={}, name={}, createdBy={}", tenantId, request.getNameKo(), createdBy);
        
        accessControlService.validateTenantAccess(tenantId);
        
        // 중복 확인
        if (request.getNameKo() != null) {
            tenantRoleRepository.findByTenantIdAndNameKo(tenantId, request.getNameKo())
                    .ifPresent(role -> {
                        throw new RuntimeException(RoleConstants.formatError(RoleConstants.ERROR_ROLE_NAME_DUPLICATE, request.getNameKo()));
                    });
        }
        
        // 역할 생성
        String tenantRoleId = UUID.randomUUID().toString();
        TenantRole role = TenantRole.builder()
                .tenantRoleId(tenantRoleId)
                .tenantId(tenantId)
                .roleTemplateId(request.getRoleTemplateId())
                .name(request.getName() != null ? request.getName() : request.getNameKo())
                .nameKo(request.getNameKo())
                .nameEn(request.getNameEn())
                .description(request.getDescription() != null ? request.getDescription() : request.getDescriptionKo())
                .descriptionKo(request.getDescriptionKo())
                .descriptionEn(request.getDescriptionEn())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .build();
        
        TenantRole saved = tenantRoleRepository.save(role);
        
        // 권한 설정 (커스텀 역할인 경우)
        if (request.getPermissions() != null && !request.getPermissions().isEmpty()) {
            for (TenantRoleRequest.PermissionRequest permReq : request.getPermissions()) {
                RolePermission permission = RolePermission.builder()
                        .tenantRoleId(tenantRoleId)
                        .permissionCode(permReq.getPermissionCode())
                        .scope(permReq.getScope())
                        .policyJson(permReq.getPolicyJson())
                        .grantedBy(createdBy)
                        .build();
                rolePermissionRepository.save(permission);
            }
        }
        
        log.info("역할 생성 완료: tenantRoleId={}", tenantRoleId);
        return toResponse(saved);
    }
    
    @Override
    public TenantRoleResponse createRoleFromTemplate(String tenantId, String roleTemplateId, String createdBy) {
        log.info("템플릿 기반 역할 생성: tenantId={}, roleTemplateId={}, createdBy={}", 
                tenantId, roleTemplateId, createdBy);
        
        accessControlService.validateTenantAccess(tenantId);
        
        // 템플릿 조회
        RoleTemplate template = roleTemplateRepository.findByRoleTemplateIdAndIsDeletedFalse(roleTemplateId)
                .orElseThrow(() -> new RuntimeException(RoleConstants.formatError(RoleConstants.ERROR_TEMPLATE_NOT_FOUND, roleTemplateId)));
        
        // 템플릿 기반 역할 생성
        String tenantRoleId = UUID.randomUUID().toString();
        TenantRole role = TenantRole.builder()
                .tenantRoleId(tenantRoleId)
                .tenantId(tenantId)
                .roleTemplateId(roleTemplateId)
                .name(template.getName())
                .nameKo(template.getNameKo())
                .nameEn(template.getNameEn())
                .description(template.getDescription())
                .descriptionKo(template.getDescriptionKo())
                .descriptionEn(template.getDescriptionEn())
                .isActive(true)
                .displayOrder(template.getDisplayOrder())
                .build();
        
        TenantRole saved = tenantRoleRepository.save(role);
        
        // 템플릿 권한 복제
        if (template.getPermissions() != null) {
            for (RoleTemplatePermission templatePerm : template.getPermissions()) {
                RolePermission permission = RolePermission.builder()
                        .tenantRoleId(tenantRoleId)
                        .permissionCode(templatePerm.getPermissionCode())
                        .scope(templatePerm.getScope())
                        .policyJson(null) // 템플릿 권한은 기본 정책만, 필요시 나중에 커스터마이징
                        .grantedBy(createdBy)
                        .build();
                rolePermissionRepository.save(permission);
            }
        }
        
        log.info("템플릿 기반 역할 생성 완료: tenantRoleId={}", tenantRoleId);
        return toResponse(saved);
    }
    
    @Override
    public TenantRoleResponse updateRole(String tenantId, String tenantRoleId, TenantRoleRequest request, String updatedBy) {
        log.info("역할 수정: tenantId={}, tenantRoleId={}, updatedBy={}", tenantId, tenantRoleId, updatedBy);
        
        accessControlService.validateTenantAccess(tenantId);
        
        TenantRole role = tenantRoleRepository.findByTenantRoleIdAndIsDeletedFalse(tenantRoleId)
                .orElseThrow(() -> new RuntimeException(RoleConstants.formatError(RoleConstants.ERROR_ROLE_NOT_FOUND, tenantRoleId)));
        
        if (!role.getTenantId().equals(tenantId)) {
            throw new RuntimeException(RoleConstants.ERROR_ACCESS_DENIED);
        }
        
        // 역할명 중복 확인 (변경하는 경우)
        if (request.getNameKo() != null && !request.getNameKo().equals(role.getNameKo())) {
            tenantRoleRepository.findByTenantIdAndNameKo(tenantId, request.getNameKo())
                    .ifPresent(existingRole -> {
                        if (!existingRole.getTenantRoleId().equals(tenantRoleId)) {
                            throw new RuntimeException(RoleConstants.formatError(RoleConstants.ERROR_ROLE_NAME_DUPLICATE, request.getNameKo()));
                        }
                    });
        }
        
        // 역할 정보 업데이트
        if (request.getName() != null) role.setName(request.getName());
        if (request.getNameKo() != null) role.setNameKo(request.getNameKo());
        if (request.getNameEn() != null) role.setNameEn(request.getNameEn());
        if (request.getDescription() != null) role.setDescription(request.getDescription());
        if (request.getDescriptionKo() != null) role.setDescriptionKo(request.getDescriptionKo());
        if (request.getDescriptionEn() != null) role.setDescriptionEn(request.getDescriptionEn());
        if (request.getIsActive() != null) role.setIsActive(request.getIsActive());
        if (request.getDisplayOrder() != null) role.setDisplayOrder(request.getDisplayOrder());
        
        TenantRole updated = tenantRoleRepository.save(role);
        
        log.info("역할 수정 완료: tenantRoleId={}", tenantRoleId);
        return toResponse(updated);
    }
    
    @Override
    public void deleteRole(String tenantId, String tenantRoleId, String deletedBy) {
        log.info("역할 삭제: tenantId={}, tenantRoleId={}, deletedBy={}", tenantId, tenantRoleId, deletedBy);
        
        accessControlService.validateTenantAccess(tenantId);
        
        TenantRole role = tenantRoleRepository.findByTenantRoleIdAndIsDeletedFalse(tenantRoleId)
                .orElseThrow(() -> new RuntimeException(RoleConstants.formatError(RoleConstants.ERROR_ROLE_NOT_FOUND, tenantRoleId)));
        
        if (!role.getTenantId().equals(tenantId)) {
            throw new RuntimeException(RoleConstants.ERROR_ACCESS_DENIED);
        }
        
        // 사용자 할당 확인
        Long activeUserCount = userRoleAssignmentRepository.countActiveAssignmentsByTenantRoleId(
                tenantRoleId, LocalDate.now());
        if (activeUserCount > 0) {
            throw new RuntimeException(RoleConstants.ERROR_ROLE_HAS_USERS);
        }
        
        // 소프트 삭제
        role.delete();
        tenantRoleRepository.save(role);
        
        log.info("역할 삭제 완료: tenantRoleId={}", tenantRoleId);
    }
    
    /**
     * TenantRole을 TenantRoleResponse로 변환
     */
    private TenantRoleResponse toResponse(TenantRole role) {
        // 권한 목록 조회
        List<RolePermission> permissions = rolePermissionRepository.findByTenantRoleId(role.getTenantRoleId());
        
        // 사용자 수 조회
        Long userCount = userRoleAssignmentRepository.countActiveAssignmentsByTenantRoleId(
                role.getTenantRoleId(), LocalDate.now());
        
        // 템플릿 코드 조회 (템플릿 기반인 경우)
        final String[] templateCode = {null};
        if (role.getRoleTemplateId() != null) {
            roleTemplateRepository.findByRoleTemplateIdAndIsDeletedFalse(role.getRoleTemplateId())
                    .ifPresent(template -> templateCode[0] = template.getTemplateCode());
        }
        
        return TenantRoleResponse.builder()
                .tenantRoleId(role.getTenantRoleId())
                .tenantId(role.getTenantId())
                .roleTemplateId(role.getRoleTemplateId())
                .templateCode(templateCode[0])
                .name(role.getName())
                .nameKo(role.getNameKo())
                .nameEn(role.getNameEn())
                .description(role.getDescription())
                .descriptionKo(role.getDescriptionKo())
                .descriptionEn(role.getDescriptionEn())
                .isActive(role.getIsActive())
                .displayOrder(role.getDisplayOrder())
                .userCount(userCount)
                .permissions(permissions.stream()
                        .map(perm -> TenantRoleResponse.PermissionResponse.builder()
                                .id(perm.getId())
                                .permissionCode(perm.getPermissionCode())
                                .scope(perm.getScope())
                                .policyJson(perm.getPolicyJson())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}

