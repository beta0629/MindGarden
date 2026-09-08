package com.coresolution.core.controller.ops;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.core.service.ops.TenantOpsService;
import com.coresolution.core.util.OpsPermissionUtils;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Ops Portal 테넌트 관리 API 컨트롤러
 * 테넌트 목록·상세·정지/재개 및 테넌트별 관리자 계정 조회
 *
 * @author CoreSolution
 * @version 1.1.0
 * @since 2025-11-23
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ops/tenants")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TenantOpsController extends BaseApiController {

    private final TenantOpsService tenantOpsService;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final TenantRoleRepository tenantRoleRepository;
    private final UserRoleAssignmentRepository userRoleAssignmentRepository;

    /**
     * 테넌트 목록 조회 (subdomain 포함)
     * GET /api/v1/ops/tenants
     *
     * @return 테넌트 목록
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTenants() {
        OpsPermissionUtils.requireAdminOrOps();
        List<Map<String, Object>> tenantList = tenantOpsService.listTenants();
        log.info("Ops Portal 테넌트 목록 조회 완료: {}개", tenantList.size());
        return success(tenantList);
    }

    /**
     * 테넌트 상세 조회
     * GET /api/v1/ops/tenants/{tenantId}
     *
     * @param tenantId 테넌트 ID
     * @return 상세 payload
     */
    @GetMapping("/{tenantId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTenant(
            @PathVariable String tenantId) {
        OpsPermissionUtils.requireAdminOrOps();
        Map<String, Object> detail = tenantOpsService.getTenantDetail(tenantId);
        return success(detail);
    }

    /**
     * 테넌트 정지 (ACTIVE → SUSPENDED)
     * POST /api/v1/ops/tenants/{tenantId}/suspend
     *
     * @param tenantId 테넌트 ID
     * @return 갱신된 테넌트
     */
    @PostMapping("/{tenantId}/suspend")
    public ResponseEntity<ApiResponse<Map<String, Object>>> suspendTenant(
            @PathVariable String tenantId) {
        OpsPermissionUtils.requireAdminOrOps();
        Map<String, Object> updated = tenantOpsService.suspendTenant(tenantId);
        return success(updated);
    }

    /**
     * 테넌트 재개 (SUSPENDED → ACTIVE)
     * POST /api/v1/ops/tenants/{tenantId}/resume
     *
     * @param tenantId 테넌트 ID
     * @return 갱신된 테넌트
     */
    @PostMapping("/{tenantId}/resume")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resumeTenant(
            @PathVariable String tenantId) {
        OpsPermissionUtils.requireAdminOrOps();
        Map<String, Object> updated = tenantOpsService.resumeTenant(tenantId);
        return success(updated);
    }

    /**
     * 테넌트별 관리자 계정 조회
     * GET /api/v1/ops/tenants/{tenantId}/admins
     *
     * @param tenantId 테넌트 ID
     * @return 관리자 목록
     */
    @GetMapping("/{tenantId}/admins")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTenantAdmins(
            @PathVariable String tenantId) {
        OpsPermissionUtils.requireAdminOrOps();

        tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("테넌트를 찾을 수 없습니다: " + tenantId));

        List<String> adminRoleNames = Arrays.asList(
                "관리자", "본사 관리자", "본사 고급 관리자", "본사 총관리자", "본사 최고관리자");
        List<com.coresolution.core.domain.TenantRole> adminRoles = new ArrayList<>();

        for (String roleName : adminRoleNames) {
            tenantRoleRepository.findByTenantIdAndNameKo(tenantId, roleName)
                    .ifPresent(adminRoles::add);
        }

        if (adminRoles.isEmpty()) {
            log.warn("테넌트에 관리자 역할이 없음: tenantId={}", tenantId);
            return success(Collections.emptyList());
        }

        List<String> adminRoleIds = adminRoles.stream()
                .map(com.coresolution.core.domain.TenantRole::getTenantRoleId)
                .collect(Collectors.toList());

        List<com.coresolution.core.domain.UserRoleAssignment> allAssignments =
                userRoleAssignmentRepository.findByTenantId(tenantId);

        LocalDate today = LocalDate.now();
        List<com.coresolution.core.domain.UserRoleAssignment> adminAssignments =
                allAssignments.stream()
                        .filter(assignment -> adminRoleIds.contains(assignment.getTenantRoleId()))
                        .filter(assignment -> assignment.getIsActive() != null && assignment.getIsActive())
                        .filter(assignment -> assignment.getIsDeleted() == null || !assignment.getIsDeleted())
                        .filter(assignment -> {
                            if (assignment.getEffectiveFrom() != null
                                    && assignment.getEffectiveFrom().isAfter(today)) {
                                return false;
                            }
                            if (assignment.getEffectiveTo() != null
                                    && assignment.getEffectiveTo().isBefore(today)) {
                                return false;
                            }
                            return true;
                        })
                        .collect(Collectors.toList());

        Set<Long> adminUserIds = adminAssignments.stream()
                .map(com.coresolution.core.domain.UserRoleAssignment::getUserId)
                .collect(Collectors.toSet());

        if (adminUserIds.isEmpty()) {
            log.warn("테넌트에 관리자 계정이 없음: tenantId={}", tenantId);
            return success(Collections.emptyList());
        }

        List<User> adminUsers = userRepository.findAllById(adminUserIds).stream()
                .filter(user -> user.getIsDeleted() == null || !user.getIsDeleted())
                .collect(Collectors.toList());

        List<Map<String, Object>> adminList = adminUsers.stream()
                .map(user -> {
                    Map<String, Object> adminMap = new HashMap<>();
                    adminMap.put("userId", user.getId());
                    adminMap.put("email", user.getEmail());
                    adminMap.put("name", user.getName());
                    adminMap.put("username", user.getUserId());
                    adminMap.put("phone", user.getPhone());
                    adminMap.put("isActive", user.getIsActive() != null ? user.getIsActive() : true);

                    List<com.coresolution.core.domain.UserRoleAssignment> userRoles =
                            adminAssignments.stream()
                                    .filter(assignment -> assignment.getUserId().equals(user.getId()))
                                    .collect(Collectors.toList());

                    List<Map<String, Object>> roleInfo = userRoles.stream()
                            .map(assignment -> {
                                Map<String, Object> roleMap = new HashMap<>();
                                roleMap.put("roleId", assignment.getTenantRoleId());
                                roleMap.put("roleName", adminRoles.stream()
                                        .filter(role -> role.getTenantRoleId()
                                                .equals(assignment.getTenantRoleId()))
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
