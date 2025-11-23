package com.coresolution.core.controller.ops;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Ops Portal 테넌트 관리 API 컨트롤러
 * 테넌트 목록 조회 및 테넌트별 관리자 계정 조회
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-23
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ops/tenants")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN') or hasRole('OPS')")
public class TenantOpsController extends BaseApiController {
    
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final TenantRoleRepository tenantRoleRepository;
    private final UserRoleAssignmentRepository userRoleAssignmentRepository;
    
    /**
     * 테넌트 목록 조회
     * GET /api/v1/ops/tenants
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTenants() {
        // 인증 정보 확인
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (auth != null) {
            log.info("Ops Portal 테넌트 목록 조회 요청: principal={}, authorities={}", 
                auth.getPrincipal(), auth.getAuthorities());
        } else {
            log.warn("Ops Portal 테넌트 목록 조회 요청: 인증 정보 없음");
        }
        
        log.info("Ops Portal 테넌트 목록 조회 요청");
        
        List<Tenant> tenants = tenantRepository.findAllActive();
        
        List<Map<String, Object>> tenantList = tenants.stream()
            .map(tenant -> {
                Map<String, Object> tenantMap = new HashMap<>();
                tenantMap.put("tenantId", tenant.getTenantId());
                tenantMap.put("name", tenant.getName());
                tenantMap.put("businessType", tenant.getBusinessType());
                tenantMap.put("status", tenant.getStatus() != null ? tenant.getStatus().name() : null);
                tenantMap.put("contactEmail", tenant.getContactEmail());
                tenantMap.put("contactPhone", tenant.getContactPhone());
                tenantMap.put("contactPerson", tenant.getContactPerson());
                return tenantMap;
            })
            .collect(Collectors.toList());
        
        log.info("Ops Portal 테넌트 목록 조회 완료: {}개", tenantList.size());
        return success(tenantList);
    }
    
    /**
     * 테넌트별 관리자 계정 조회
     * GET /api/v1/ops/tenants/{tenantId}/admins
     */
    @GetMapping("/{tenantId}/admins")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTenantAdmins(
            @PathVariable String tenantId) {
        // 인증 정보 확인
        org.springframework.security.core.Authentication auth = 
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (auth != null) {
            log.info("Ops Portal 테넌트 관리자 계정 조회 요청: tenantId={}, principal={}, authorities={}", 
                tenantId, auth.getPrincipal(), auth.getAuthorities());
        } else {
            log.warn("Ops Portal 테넌트 관리자 계정 조회 요청: tenantId={}, 인증 정보 없음", tenantId);
        }
        
        log.info("Ops Portal 테넌트 관리자 계정 조회 요청: tenantId={}", tenantId);
        
        // 테넌트 존재 확인
        Tenant tenant = tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("테넌트를 찾을 수 없습니다: " + tenantId));
        
        // "관리자" 역할 찾기
        List<String> adminRoleNames = Arrays.asList("관리자", "본사 관리자", "본사 고급 관리자", "본사 총관리자", "본사 최고관리자");
        List<com.coresolution.core.domain.TenantRole> adminRoles = new ArrayList<>();
        
        for (String roleName : adminRoleNames) {
            tenantRoleRepository.findByTenantIdAndNameKo(tenantId, roleName)
                .ifPresent(adminRoles::add);
        }
        
        if (adminRoles.isEmpty()) {
            log.warn("테넌트에 관리자 역할이 없음: tenantId={}", tenantId);
            return success(Collections.emptyList());
        }
        
        // 관리자 역할 ID 목록
        List<String> adminRoleIds = adminRoles.stream()
            .map(com.coresolution.core.domain.TenantRole::getTenantRoleId)
            .collect(Collectors.toList());
        
        // 테넌트의 모든 활성 역할 할당 조회
        List<com.coresolution.core.domain.UserRoleAssignment> allAssignments = 
            userRoleAssignmentRepository.findByTenantId(tenantId);
        
        // 관리자 역할을 가진 활성 할당만 필터링
        LocalDate today = LocalDate.now();
        List<com.coresolution.core.domain.UserRoleAssignment> adminAssignments = 
            allAssignments.stream()
                .filter(assignment -> adminRoleIds.contains(assignment.getTenantRoleId()))
                .filter(assignment -> assignment.getIsActive() != null && assignment.getIsActive())
                .filter(assignment -> assignment.getIsDeleted() == null || !assignment.getIsDeleted())
                .filter(assignment -> {
                    if (assignment.getEffectiveFrom() != null && assignment.getEffectiveFrom().isAfter(today)) {
                        return false;
                    }
                    if (assignment.getEffectiveTo() != null && assignment.getEffectiveTo().isBefore(today)) {
                        return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());
        
        // 사용자 ID 목록 추출
        Set<Long> adminUserIds = adminAssignments.stream()
            .map(com.coresolution.core.domain.UserRoleAssignment::getUserId)
            .collect(Collectors.toSet());
        
        if (adminUserIds.isEmpty()) {
            log.warn("테넌트에 관리자 계정이 없음: tenantId={}", tenantId);
            return success(Collections.emptyList());
        }
        
        // 사용자 정보 조회
        List<User> adminUsers = userRepository.findAllById(adminUserIds).stream()
            .filter(user -> user.getIsDeleted() == null || !user.getIsDeleted())
            .collect(Collectors.toList());
        
        // 응답 데이터 구성
        List<Map<String, Object>> adminList = adminUsers.stream()
            .map(user -> {
                Map<String, Object> adminMap = new HashMap<>();
                adminMap.put("userId", user.getId());
                adminMap.put("email", user.getEmail());
                adminMap.put("name", user.getName());
                adminMap.put("username", user.getUsername());
                adminMap.put("phone", user.getPhone());
                adminMap.put("isActive", user.getIsActive() != null ? user.getIsActive() : true);
                
                // 해당 사용자의 관리자 역할 정보
                List<com.coresolution.core.domain.UserRoleAssignment> userRoles = 
                    adminAssignments.stream()
                        .filter(assignment -> assignment.getUserId().equals(user.getId()))
                        .collect(Collectors.toList());
                
                List<Map<String, Object>> roleInfo = userRoles.stream()
                    .map(assignment -> {
                        Map<String, Object> roleMap = new HashMap<>();
                        roleMap.put("roleId", assignment.getTenantRoleId());
                        roleMap.put("roleName", adminRoles.stream()
                            .filter(role -> role.getTenantRoleId().equals(assignment.getTenantRoleId()))
                            .findFirst()
                            .map(com.coresolution.core.domain.TenantRole::getNameKo)
                            .orElse("알 수 없음"));
                        roleMap.put("effectiveFrom", assignment.getEffectiveFrom());
                        roleMap.put("effectiveTo", assignment.getEffectiveTo());
                        roleMap.put("assignedBy", assignment.getAssignedBy());
                        return roleMap;
                    })
                    .collect(Collectors.toList());
                
                adminMap.put("roles", roleInfo);
                return adminMap;
            })
            .collect(Collectors.toList());
        
        log.info("Ops Portal 테넌트 관리자 계정 조회 완료: tenantId={}, count={}", tenantId, adminList.size());
        return success(adminList);
    }
}

