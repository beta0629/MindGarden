package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Permission;
import com.coresolution.consultation.entity.RolePermission;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.LegacyRolePermissionRepository;
import com.coresolution.consultation.repository.PermissionRepository;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 동적 권한 관리 서비스 구현체 데이터베이스 기반으로 권한을 동적으로 관리
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DynamicPermissionServiceImpl implements DynamicPermissionService {

    private final PermissionRepository permissionRepository;
    private final LegacyRolePermissionRepository rolePermissionRepository;
    private final org.springframework.core.env.Environment environment;
    private final CommonCodeRepository commonCodeRepository;

    @Override
    public boolean hasPermission(User user, String permissionCode) {
        if (user == null || user.getRole() == null || permissionCode == null) {
            log.warn("권한 체크 실패: 사용자 또는 권한 코드가 null입니다.");
            return false;
        }

        return hasPermission(user.getRole().name(), permissionCode);
    }

    @Override
    @Cacheable(value = "userPermissions", key = "#roleName + '_' + #permissionCode")
    public boolean hasPermission(String roleName, String permissionCode) {
        try {
            log.info("🔍 권한 체크 시작: 역할={}, 권한={}", roleName, permissionCode);

            // 직접 쿼리로 확인
            var directCheck = rolePermissionRepository
                    .findByRoleNameAndPermissionCodeAndIsActiveTrue(roleName, permissionCode);
            boolean hasPermission = directCheck.isPresent();

            // 표준화 2025-12-08: 관리자/사무원 역할에 대해 기본 권한 체크 (데이터베이스에 없을 경우)
            if (!hasPermission) {
                try {
                    UserRole userRole = UserRole.fromString(roleName);
                    if (userRole != null && (userRole.isAdmin() || userRole.isStaff())) {
                        // 관리자/사무원 기본 권한 (ERP + 시스템 공지·메시지)
                        List<String> defaultAdminPermissions = List.of("ERP_ACCESS",
                                "ERP_DASHBOARD_VIEW", "INTEGRATED_FINANCE_VIEW",
                                "PURCHASE_REQUEST_VIEW", "PURCHASE_REQUEST_MANAGE",
                                "APPROVAL_MANAGE", "ITEM_MANAGE", "BUDGET_MANAGE", "SALARY_MANAGE",
                                "TAX_MANAGE", "REFUND_MANAGE",
                                "SYSTEM_NOTIFICATION_MANAGE", "MESSAGE_MANAGE", "MESSAGE_VIEW");

                        if (defaultAdminPermissions.contains(permissionCode)) {
                            log.info("✅ 관리자/사무원 기본 권한 허용: 역할={}, 권한={}", roleName, permissionCode);
                            return true;
                        }
                    }
                } catch (Exception e) {
                    log.debug("역할 파싱 실패 (무시): 역할={}, 오류={}", roleName, e.getMessage());
                }
            }

            log.info("✅ 권한 체크 결과: 역할={}, 권한={}, 결과={}", roleName, permissionCode, hasPermission);

            // 디버깅을 위해 실제 데이터 확인
            if (!hasPermission) {
                log.warn("❌ 권한 없음 - 데이터베이스 확인: 역할={}, 권한={}", roleName, permissionCode);
                // 실제 데이터 확인
                var allRolePermissions =
                        rolePermissionRepository.findByRoleNameAndIsActiveTrue(roleName);
                log.warn("📋 해당 역할의 모든 권한: {}",
                        allRolePermissions.stream().map(rp -> rp.getPermissionCode())
                                .collect(java.util.stream.Collectors.toList()));

                // existsByRoleNameAndPermissionCodeAndIsActiveTrue 메서드도 테스트
                boolean existsResult = rolePermissionRepository
                        .existsByRoleNameAndPermissionCodeAndIsActiveTrue(roleName, permissionCode);
                log.warn("🔍 existsByRoleNameAndPermissionCodeAndIsActiveTrue 결과: {}",
                        existsResult);
            }

            return hasPermission;

        } catch (Exception e) {
            log.error("❌ 권한 체크 중 오류 발생: 역할={}, 권한={}", roleName, permissionCode, e);
            return false;
        }
    }

    @Override
    @Cacheable(value = "userPermissionsList", key = "#user.role.name()")
    public List<Map<String, Object>> getUserPermissions(User user) {
        try {
            if (user == null || user.getRole() == null) {
                return new ArrayList<>();
            }

            return getRolePermissions(user.getRole().name());
        } catch (org.springframework.orm.jpa.JpaSystemException e) {
            log.warn("⚠️ 사용자 권한 조회 중 JPA 시스템 예외 발생 (빈 리스트 반환): 사용자={}, 오류={}",
                    user != null ? user.getUserId() : "null", e.getMessage());
            return new ArrayList<>();
        } catch (Exception e) {
            log.warn("⚠️ 사용자 권한 조회 실패 (빈 리스트 반환): 사용자={}, 오류={}",
                    user != null ? user.getUserId() : "null", e.getMessage());
            return new ArrayList<>();
        }
    }

    @Override
    @Cacheable(value = "rolePermissions", key = "#roleName")
    public List<Map<String, Object>> getRolePermissions(String roleName) {
        try {
            log.debug("역할 권한 조회: 역할={}", roleName);

            List<RolePermission> rolePermissions =
                    rolePermissionRepository.findByRoleNameAndIsActiveTrue(roleName);

            List<Map<String, Object>> permissions = rolePermissions.stream()
                    .map(this::convertToPermissionMap).collect(Collectors.toList());

            log.debug("역할 권한 조회 완료: 역할={}, 권한 수={}", roleName, permissions.size());
            return permissions;

        } catch (org.springframework.orm.jpa.JpaSystemException e) {
            log.warn("⚠️ 역할 권한 조회 중 JPA 시스템 예외 발생 (빈 리스트 반환): 역할={}, 오류={}", roleName,
                    e.getMessage());
            return new ArrayList<>();
        } catch (Exception e) {
            log.warn("⚠️ 역할 권한 조회 실패 (빈 리스트 반환): 역할={}, 오류={}", roleName, e.getMessage());
            return new ArrayList<>();
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = {"userPermissions", "userPermissionsList", "rolePermissions"},
            allEntries = true)
    public boolean grantPermission(String roleName, String permissionCode, String grantedBy) {
        try {
            log.info("권한 부여: 역할={}, 권한={}, 부여자={}", roleName, permissionCode, grantedBy);

            // 권한 존재 여부 확인
            if (!permissionExists(permissionCode)) {
                log.warn("존재하지 않는 권한: {}", permissionCode);
                return false;
            }

            // 이미 권한이 있는지 확인
            if (rolePermissionRepository.existsByRoleNameAndPermissionCodeAndIsActiveTrue(roleName,
                    permissionCode)) {
                log.info("이미 권한이 부여됨: 역할={}, 권한={}", roleName, permissionCode);
                return true;
            }

            // 권한 부여
            RolePermission rolePermission =
                    RolePermission.grant(roleName, permissionCode, grantedBy);
            rolePermissionRepository.save(rolePermission);

            log.info("권한 부여 성공: 역할={}, 권한={}", roleName, permissionCode);
            return true;

        } catch (Exception e) {
            log.error("권한 부여 중 오류 발생: 역할={}, 권한={}", roleName, permissionCode, e);
            return false;
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = {"userPermissions", "userPermissionsList", "rolePermissions"},
            allEntries = true)
    public boolean revokePermission(String roleName, String permissionCode) {
        try {
            log.info("권한 회수: 역할={}, 권한={}", roleName, permissionCode);

            // 권한 매핑 조회
            RolePermission rolePermission = rolePermissionRepository
                    .findByRoleNameAndPermissionCodeAndIsActiveTrue(roleName, permissionCode)
                    .orElse(null);

            if (rolePermission == null) {
                log.info("권한이 존재하지 않음: 역할={}, 권한={}", roleName, permissionCode);
                return true; // 이미 없으므로 성공으로 처리
            }

            // 권한 비활성화
            rolePermission.setIsActive(false);
            rolePermissionRepository.save(rolePermission);

            log.info("권한 회수 성공: 역할={}, 권한={}", roleName, permissionCode);
            return true;

        } catch (Exception e) {
            log.error("권한 회수 중 오류 발생: 역할={}, 권한={}", roleName, permissionCode, e);
            return false;
        }
    }

    @Override
    @Cacheable(value = "permissionExists", key = "#permissionCode")
    public boolean permissionExists(String permissionCode) {
        try {
            log.debug("권한 존재 확인: 권한={}", permissionCode);

            boolean exists = permissionRepository.existsByPermissionCode(permissionCode);

            log.debug("권한 존재 확인 결과: 권한={}, 존재={}", permissionCode, exists);
            return exists;

        } catch (Exception e) {
            log.error("권한 존재 확인 중 오류 발생: 권한={}", permissionCode, e);
            return false;
        }
    }

    @Override
    @Cacheable(value = "allPermissions")
    public List<Map<String, Object>> getAllPermissions() {
        try {
            log.info("🔍 모든 권한 조회 시작");

            // 표준화 2025-12-06: deprecated 메서드 대체
            String tenantId = TenantContextHolder.getTenantId();
            List<Permission> permissions =
                    tenantId != null ? permissionRepository.findByTenantIdAndIsActiveTrue(tenantId)
                            : permissionRepository.findByIsActiveTrue(); // 레거시 호환 (tenantId가 null인
                                                                         // 경우)
            log.info("🔍 데이터베이스에서 조회된 권한 수: {}", permissions != null ? permissions.size() : "null");

            if (permissions == null) {
                log.error("❌ permissionRepository 조회가 null을 반환했습니다");
                return new ArrayList<>();
            }

            if (permissions.isEmpty()) {
                log.warn("⚠️ 데이터베이스에 활성화된 권한이 없습니다");
                return new ArrayList<>();
            }

            List<Map<String, Object>> permissionMaps = permissions.stream()
                    .map(this::convertPermissionToMap).collect(Collectors.toList());

            log.info("✅ 모든 권한 조회 완료: 권한 수={}", permissionMaps.size());
            return permissionMaps;

        } catch (Exception e) {
            log.error("❌ 모든 권한 조회 중 오류 발생", e);
            return new ArrayList<>();
        }
    }

    @Override
    @Cacheable(value = "permissionsByCategory", key = "#category")
    public List<Map<String, Object>> getPermissionsByCategory(String category) {
        try {
            log.debug("카테고리별 권한 조회: 카테고리={}", category);

            List<Permission> permissions =
                    permissionRepository.findByCategoryAndIsActiveTrue(category);

            List<Map<String, Object>> permissionMaps = permissions.stream()
                    .map(this::convertPermissionToMap).collect(Collectors.toList());

            log.debug("카테고리별 권한 조회 완료: 카테고리={}, 권한 수={}", category, permissionMaps.size());
            return permissionMaps;

        } catch (Exception e) {
            log.error("카테고리별 권한 조회 중 오류 발생: 카테고리={}", category, e);
            return new ArrayList<>();
        }
    }

    @Override
    @CacheEvict(
            value = {"userPermissions", "userPermissionsList", "rolePermissions",
                    "permissionExists", "allPermissions", "permissionsByCategory"},
            allEntries = true)
    public void clearPermissionCache() {
        log.info("권한 캐시 초기화");
    }

    @Override
    public void refreshPermissionCache() {
        log.info("권한 캐시 새로고침");
        clearPermissionCache();

        // 주요 권한들을 미리 캐시에 로드 (ADMIN, STAFF, CONSULTANT, CLIENT)
        List<String> commonRoles = List.of(UserRole.ADMIN.name(), UserRole.STAFF.name(),
                UserRole.CONSULTANT.name(), UserRole.CLIENT.name());
        List<String> commonPermissions =
                List.of("ACCESS_ERP_DASHBOARD", "ACCESS_INTEGRATED_FINANCE",
                        "ACCESS_ADMIN_DASHBOARD", "MANAGE_USERS", "VIEW_ALL_BRANCHES");

        for (String role : commonRoles) {
            for (String permission : commonPermissions) {
                hasPermission(role, permission);
            }
        }

        log.info("권한 캐시 새로고침 완료");
    }

    /**
     * 권한 체크 헬퍼 메서드들
     */

    /**
     * ERP 대시보드 접근 권한 확인
     */
    public boolean canAccessErpDashboard(User user) {
        return hasPermission(user, "ACCESS_ERP_DASHBOARD");
    }

    /**
     * 통합 회계 시스템 접근 권한 확인
     */
    public boolean canAccessIntegratedFinance(User user) {
        return hasPermission(user, "ACCESS_INTEGRATED_FINANCE");
    }

    /**
     * 관리자 대시보드 접근 권한 확인
     */
    public boolean canAccessAdminDashboard(User user) {
        return hasPermission(user, "ACCESS_ADMIN_DASHBOARD");
    }

    /**
     * 모든 지점 조회 권한 확인
     */
    public boolean canViewAllBranches(User user) {
        return hasPermission(user, "VIEW_ALL_BRANCHES");
    }

    /**
     * 사용자 관리 권한 확인
     */
    public boolean canManageUsers(User user) {
        return hasPermission(user, "MANAGE_USERS");
    }

    /**
     * 권한 관리 권한 확인
     */
    public boolean canManagePermissions(User user) {
        return hasPermission(user, "PERMISSION_MANAGEMENT");
    }

    // ==================== 헬퍼 메서드 ====================

    /**
     * RolePermission을 Map으로 변환
     */
    private Map<String, Object> convertToPermissionMap(RolePermission rolePermission) {
        // tenant ID가 없을 수 있으므로 안전하게 조회
        String tenantId = TenantContextHolder.getTenantId();
        Map<String, Object> map = new HashMap<>();
        map.put("permission_code", rolePermission.getPermissionCode());
        map.put("role_name", rolePermission.getRoleName());
        map.put("granted_by", rolePermission.getGrantedBy());
        map.put("is_active", rolePermission.getIsActive());

        // LocalDateTime을 String으로 변환하여 직렬화 문제 해결
        if (rolePermission.getGrantedAt() != null) {
            map.put("granted_at", rolePermission.getGrantedAt().toString());
        }

        // 권한 상세 정보 조회 (tenant ID가 있을 때만)
        if (tenantId != null && !tenantId.isEmpty()) {
            try {
                Permission permission =
                        permissionRepository.findByTenantIdAndPermissionCode(tenantId,
                                rolePermission.getPermissionCode()).orElse(null);
                if (permission != null) {
                    map.put("permission_name", permission.getPermissionName());
                    map.put("permission_description", permission.getPermissionDescription());
                    map.put("category", permission.getCategory());
                }
            } catch (Exception e) {
                log.warn("⚠️ 권한 상세 정보 조회 실패 (무시): permissionCode={}, tenantId={}, 오류={}",
                        rolePermission.getPermissionCode(), tenantId, e.getMessage());
            }
        } else {
            log.debug("⚠️ tenant ID가 없어 권한 상세 정보 조회 스킵: permissionCode={}",
                    rolePermission.getPermissionCode());
        }

        return map;
    }

    /**
     * Permission을 Map으로 변환
     */
    private Map<String, Object> convertPermissionToMap(Permission permission) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", permission.getId());
        map.put("permission_code", permission.getPermissionCode());
        map.put("permission_name", permission.getPermissionName());
        map.put("permission_description", permission.getPermissionDescription());
        map.put("category", permission.getCategory());
        map.put("is_active", permission.getIsActive());

        // LocalDateTime을 String으로 변환하여 직렬화 문제 해결
        if (permission.getCreatedAt() != null) {
            map.put("created_at", permission.getCreatedAt().toString());
        }
        if (permission.getUpdatedAt() != null) {
            map.put("updated_at", permission.getUpdatedAt().toString());
        }

        return map;
    }

    // ==================== 추가 권한 체크 메서드들 ====================

    @Override
    public boolean canRegisterScheduler(UserRole userRole) {
        try {
            // 관리자 및 사무원만 스케줄 등록 가능
            if (userRole != null && (userRole.isAdmin() || userRole.isStaff())) {
                log.debug("관리자/사무원 역할: 스케줄러 등록 권한 허용, 역할={}", userRole);
                return true;
            }

            // 그 외 역할은 권한 체크
            log.debug("스케줄러 등록 권한 확인: 역할={}", userRole);
            return hasPermission(userRole.name(), "ACCESS_SCHEDULE_MANAGEMENT");
        } catch (Exception e) {
            log.error("스케줄러 등록 권한 확인 실패: 역할={}", userRole, e);
            return false;
        }
    }

    @Override
    public boolean canViewBranchDetails(UserRole userRole) {
        try {
            log.debug("지점 상세 조회 권한 확인: 역할={}", userRole);
            return hasPermission(userRole.name(), "VIEW_BRANCH_DETAILS");
        } catch (Exception e) {
            log.error("지점 상세 조회 권한 확인 실패: 역할={}", userRole, e);
            return false;
        }
    }

    @Override
    public boolean canAccessPayment(UserRole userRole) {
        try {
            log.debug("결제 기능 접근 권한 확인: 역할={}", userRole);
            return hasPermission(userRole.name(), "ACCESS_PAYMENT");
        } catch (Exception e) {
            log.error("결제 기능 접근 권한 확인 실패: 역할={}", userRole, e);
            return false;
        }
    }

    @Override
    public List<UserRole> getRolesWithPermission(String permissionCode) {
        try {
            log.debug("권한별 역할 조회: 권한={}", permissionCode);

            List<String> roleNames = rolePermissionRepository
                    .findRoleNamesByPermissionCodeAndIsActiveTrue(permissionCode);

            List<UserRole> roles = roleNames.stream().map(roleName -> {
                try {
                    return UserRole.valueOf(roleName);
                } catch (IllegalArgumentException e) {
                    log.warn("유효하지 않은 역할명: {}", roleName);
                    return null;
                }
            }).filter(role -> role != null).collect(Collectors.toList());

            log.debug("권한별 역할 조회 완료: 권한={}, 역할 수={}", permissionCode, roles.size());
            return roles;

        } catch (Exception e) {
            log.error("권한별 역할 조회 실패: 권한={}", permissionCode, e);
            return new ArrayList<>();
        }
    }

    @Override
    public List<String> getRolePermissions(UserRole userRole) {
        try {
            log.debug("역할별 권한 목록 조회: 역할={}", userRole);

            List<RolePermission> rolePermissions =
                    rolePermissionRepository.findByRoleNameAndIsActiveTrue(userRole.name());

            List<String> permissions = rolePermissions.stream()
                    .map(RolePermission::getPermissionCode).collect(Collectors.toList());

            log.debug("역할별 권한 목록 조회 완료: 역할={}, 권한 수={}", userRole, permissions.size());
            return permissions;

        } catch (Exception e) {
            log.error("역할별 권한 목록 조회 실패: 역할={}", userRole, e);
            return new ArrayList<>();
        }
    }

    @Override
    @Transactional(readOnly = true,
            propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    public List<String> getUserPermissionsAsStringList(User user) {
        try {
            log.debug("사용자 권한 목록 조회 (String 리스트): 사용자={}", user.getUserId());

            // 기본 권한 조회 (예외 발생 시 빈 리스트 반환)
            List<Map<String, Object>> permissionMaps;
            try {
                permissionMaps = getUserPermissions(user);
            } catch (org.springframework.orm.jpa.JpaSystemException e) {
                log.warn("⚠️ 기본 권한 조회 중 JPA 시스템 예외 발생 (빈 리스트로 시작): 사용자={}, 오류={}", user.getUserId(),
                        e.getMessage());
                permissionMaps = new ArrayList<>();
            } catch (Exception e) {
                log.warn("⚠️ 기본 권한 조회 실패 (빈 리스트로 시작): 사용자={}, 오류={}", user.getUserId(),
                        e.getMessage());
                permissionMaps = new ArrayList<>();
            }

            List<String> permissions = permissionMaps.stream()
                    .map(map -> (String) map.get("permission_code"))
                    .filter(permissionCode -> permissionCode != null).collect(Collectors.toList());

            // 표준화 2025-12-08: 관리자 역할에 대해 공통코드에서 동적으로 추가 권한 조회
            // 예외 발생 시에도 기본 권한은 반환하도록 try-catch로 분리
            // 트랜잭션 롤백 방지를 위해 별도 메서드로 분리하여 호출
            // NOT_SUPPORTED로 트랜잭션을 일시 중지하여 상위 트랜잭션에 영향 없도록
            if (user.getRole() != null && user.getRole().isAdmin()) {
                try {
                    // 트랜잭션 없이 실행하여 상위 트랜잭션에 영향 없도록
                    List<String> dynamicPermissions =
                            getDynamicPermissionsFromCommonCodeSafely(user.getRole().name());
                    for (String perm : dynamicPermissions) {
                        if (!permissions.contains(perm)) {
                            permissions.add(perm);
                            log.debug("✅ 동적 권한 추가: 역할={}, 권한={}", user.getRole().name(), perm);
                        }
                    }
                } catch (org.springframework.orm.jpa.JpaSystemException e) {
                    // 데이터베이스 날짜 필드 오류 (Zero date value prohibited) 등 JPA 시스템 예외
                    log.warn("⚠️ 동적 권한 조회 중 JPA 시스템 예외 발생 (기본 권한만 반환): 역할={}, 오류={}",
                            user.getRole().name(), e.getMessage());
                } catch (Exception e) {
                    // 동적 권한 조회 실패해도 기본 권한은 반환
                    log.warn("⚠️ 동적 권한 조회 실패 (기본 권한만 반환): 역할={}, 오류={}", user.getRole().name(),
                            e.getMessage());
                }
            }

            log.debug("사용자 권한 목록 조회 완료 (String 리스트): 사용자={}, 권한 수={}", user.getUserId(),
                    permissions.size());
            return permissions;

        } catch (org.springframework.orm.jpa.JpaSystemException e) {
            log.error("사용자 권한 목록 조회 중 JPA 시스템 예외 발생 (String 리스트): 사용자={}, 오류={}", user.getUserId(),
                    e.getMessage(), e);
            return new ArrayList<>();
        } catch (Exception e) {
            log.error("사용자 권한 목록 조회 실패 (String 리스트): 사용자={}, 오류={}", user.getUserId(),
                    e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * 공통코드에서 동적 권한 조회 (안전한 버전 - 트랜잭션 롤백 방지) 별도 트랜잭션으로 분리하여 오류 발생 시에도 메인 트랜잭션이 롤백되지 않도록 함
     */
    // 트랜잭션 없이 실행하여 상위 트랜잭션에 영향 없도록
    @Transactional(
            propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    private List<String> getDynamicPermissionsFromCommonCodeSafely(String roleName) {
        try {
            return getDynamicPermissionsFromCommonCode(roleName);
        } catch (org.springframework.orm.jpa.JpaSystemException e) {
            // 데이터베이스 날짜 필드 오류 (Zero date value prohibited) 등 JPA 시스템 예외
            log.warn("⚠️ 동적 권한 조회 중 JPA 시스템 예외 발생 (안전한 버전): 역할={}, 오류={}", roleName,
                    e.getMessage());
            return new ArrayList<>();
        } catch (Exception e) {
            log.warn("⚠️ 동적 권한 조회 실패 (안전한 버전): 역할={}, 오류={}", roleName, e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * 공통코드에서 역할별 동적 권한 조회 표준화 2025-12-08: 하드코딩 제거, 공통코드에서 동적 조회 (테넌트 컨텍스트 사용) 트랜잭션 없이 실행하여 상위 트랜잭션에
     * 영향 없도록
     */
    @Transactional(
            propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    private List<String> getDynamicPermissionsFromCommonCode(String roleName) {
        try {
            String codeGroup = roleName + "_PERMISSIONS"; // 예: ADMIN_PERMISSIONS
            String tenantId = TenantContextHolder.getTenantId();

            // 표준화 2025-12-08: 테넌트 컨텍스트 기반 공통코드 조회 (deprecated 메서드 제거)
            List<com.coresolution.consultation.entity.CommonCode> commonCodes;
            try {
                if (tenantId != null && !tenantId.isEmpty()) {
                    // 테넌트별 코드 조회 시도, 없으면 코어솔루션 코드 조회 (폴백)
                    commonCodes =
                            commonCodeRepository.findCodesByGroupWithFallback(tenantId, codeGroup);
                } else {
                    // 테넌트 컨텍스트가 없으면 코어솔루션 코드만 조회
                    commonCodes = commonCodeRepository.findCoreCodesByGroup(codeGroup);
                }
            } catch (org.springframework.orm.jpa.JpaSystemException e) {
                // 데이터베이스 날짜 필드 오류 (Zero date value prohibited) 등 JPA 시스템 예외
                log.warn("⚠️ 공통코드 조회 중 JPA 시스템 예외 발생 (기본 권한만 반환): 역할={}, 오류={}", roleName,
                        e.getMessage());
                return new ArrayList<>();
            } catch (Exception e) {
                // 기타 예외도 처리
                log.warn("⚠️ 공통코드 조회 중 예외 발생 (기본 권한만 반환): 역할={}, 오류={}", roleName, e.getMessage());
                return new ArrayList<>();
            }

            if (commonCodes.isEmpty()) {
                log.debug("⚠️ 공통코드에서 권한 조회 실패: 그룹={}, tenantId={}", codeGroup, tenantId);
                return new ArrayList<>();
            }

            List<String> permissions =
                    commonCodes.stream().filter(code -> isAutoGrantPermission(code.getExtraData()))
                            .map(com.coresolution.consultation.entity.CommonCode::getCodeValue)
                            .collect(Collectors.toList());

            log.debug("✅ 공통코드에서 동적 권한 조회 완료: 역할={}, tenantId={}, 권한 수={}", roleName, tenantId,
                    permissions.size());
            return permissions;

        } catch (org.springframework.orm.jpa.JpaSystemException e) {
            // 데이터베이스 날짜 필드 오류 (Zero date value prohibited) 등 JPA 시스템 예외
            log.warn("⚠️ 공통코드 조회 중 JPA 시스템 예외 발생 (기본 권한만 반환): 역할={}, 오류={}", roleName,
                    e.getMessage());
            return new ArrayList<>();
        } catch (Exception e) {
            log.error("❌ 공통코드에서 동적 권한 조회 실패: 역할={}, 오류={}", roleName, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * auto_grant 여부 확인 (공통코드 extraData에서)
     */
    private boolean isAutoGrantPermission(String extraData) {
        if (extraData == null || extraData.trim().isEmpty()) {
            return true; // 기본값: 자동 부여
        }

        try {
            com.fasterxml.jackson.databind.ObjectMapper objectMapper =
                    new com.fasterxml.jackson.databind.ObjectMapper();
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> data =
                    objectMapper.readValue(extraData, java.util.Map.class);
            Object autoGrant = data.get("auto_grant");

            if (autoGrant instanceof Boolean) {
                return (Boolean) autoGrant;
            } else if (autoGrant instanceof String) {
                return Boolean.parseBoolean((String) autoGrant);
            }

            return true; // 기본값

        } catch (Exception e) {
            log.warn("extra_data 파싱 실패, 자동 부여로 처리: {}", extraData);
            return true;
        }
    }

    @Override
    public boolean hasPermission(UserRole userRole, String permissionCode) {
        try {
            log.debug("역할별 권한 체크: 역할={}, 권한={}", userRole, permissionCode);
            return hasPermission(userRole.name(), permissionCode);
        } catch (Exception e) {
            log.error("역할별 권한 체크 실패: 역할={}, 권한={}", userRole, permissionCode, e);
            return false;
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = {"userPermissions", "userPermissionsList", "rolePermissions"},
            allEntries = true)
    public boolean setRolePermissions(String roleName, List<String> permissionCodes) {
        try {
            log.info("역할별 권한 설정 시작: 역할={}, 권한수={}", roleName, permissionCodes.size());

            // 1. 기존 권한 비활성화 (삭제 대신)
            List<RolePermission> existingPermissions =
                    rolePermissionRepository.findByRoleNameAndIsActiveTrue(roleName);
            for (RolePermission rp : existingPermissions) {
                rp.setIsActive(false);
                rp.setUpdatedAt(LocalDateTime.now());
                rolePermissionRepository.save(rp);
            }
            log.debug("기존 권한 비활성화 완료: 역할={}, 개수={}", roleName, existingPermissions.size());

            // 2. 비활성화 포함 모든 권한 조회 (한 번만)
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null || tenantId.isEmpty()) {
                log.warn("⚠️ setRolePermissions: tenant ID가 없어 권한 설정을 건너뜁니다: roleName={}",
                        roleName);
                return false;
            }
            List<RolePermission> allRolePermissions =
                    rolePermissionRepository.findByTenantId(tenantId);
            Map<String, RolePermission> existingPermissionsMap =
                    allRolePermissions.stream().filter(rp -> rp.getRoleName().equals(roleName))
                            .collect(Collectors.toMap(RolePermission::getPermissionCode, rp -> rp,
                                    (existing, replacement) -> existing));

            // 3. 새 권한들 추가
            int successCount = 0;
            for (String permissionCode : permissionCodes) {
                // 권한이 존재하는지 확인
                if (!permissionExists(permissionCode)) {
                    log.warn("권한이 존재하지 않음: {}", permissionCode);
                    continue;
                }

                // 이미 존재하는 권한인지 확인
                RolePermission existingPermission = existingPermissionsMap.get(permissionCode);

                if (existingPermission != null) {
                    // 이미 존재하는 권한은 활성화만
                    existingPermission.setIsActive(true);
                    existingPermission.setUpdatedAt(LocalDateTime.now());
                    rolePermissionRepository.save(existingPermission);
                    log.debug("권한 활성화 완료: 역할={}, 권한={}", roleName, permissionCode);
                } else {
                    // 새로운 권한 추가
                    RolePermission rolePermission = new RolePermission();
                    rolePermission.setRoleName(roleName);
                    rolePermission.setPermissionCode(permissionCode);
                    rolePermission.setIsActive(true);
                    rolePermission.setCreatedAt(LocalDateTime.now());
                    rolePermission.setUpdatedAt(LocalDateTime.now());

                    rolePermissionRepository.save(rolePermission);
                    log.debug("권한 추가 완료: 역할={}, 권한={}", roleName, permissionCode);
                }
                successCount++;
            }

            log.info("✅ 역할별 권한 설정 완료: 역할={}, 성공={}/{}", roleName, successCount,
                    permissionCodes.size());
            log.info("🔄 권한 캐시가 자동으로 클리어됩니다 (@CacheEvict)");

            return successCount > 0;

        } catch (Exception e) {
            log.error("❌ 역할별 권한 설정 실패: 역할={}", roleName, e);
            return false;
        }
    }

    @Override
    @CacheEvict(value = {"userPermissions", "userPermissionsList", "rolePermissions"},
            allEntries = true)
    public void clearUserPermissionCache(String roleName) {
        log.info("🔄 권한 캐시 클리어: 역할={}", roleName);
    }

    // ==================== PermissionMatrix 마이그레이션 메서드 ====================

    @Override
    public boolean hasMenuGroupAccess(User user, String menuGroup) {
        if (user == null || user.getRole() == null || menuGroup == null) {
            log.warn("메뉴 그룹 권한 체크 실패: 사용자 또는 메뉴 그룹이 null입니다.");
            return false;
        }

        return hasMenuGroupAccess(user.getRole().name(), menuGroup);
    }

    @Override
    @Cacheable(value = "menuGroupAccess", key = "#roleName + '_' + #menuGroup")
    public boolean hasMenuGroupAccess(String roleName, String menuGroup) {
        try {
            log.debug("메뉴 그룹 권한 체크: 역할={}, 메뉴 그룹={}", roleName, menuGroup);

            // 메뉴 그룹을 권한 코드로 변환 (예: "COMMON_MENU" → "MENU_GROUP_COMMON")
            String permissionCode = "MENU_GROUP_" + menuGroup;

            // 권한 체크
            boolean hasAccess = hasPermission(roleName, permissionCode);

            log.debug("메뉴 그룹 권한 체크 결과: 역할={}, 메뉴 그룹={}, 권한 코드={}, 결과={}", roleName, menuGroup,
                    permissionCode, hasAccess);

            return hasAccess;

        } catch (Exception e) {
            log.error("메뉴 그룹 권한 체크 중 오류 발생: 역할={}, 메뉴 그룹={}", roleName, menuGroup, e);
            return false;
        }
    }

    @Override
    public boolean hasApiAccess(User user, String apiPath) {
        if (user == null || user.getRole() == null || apiPath == null) {
            log.warn("API 권한 체크 실패: 사용자 또는 API 경로가 null입니다.");
            return false;
        }

        return hasApiAccess(user.getRole().name(), apiPath);
    }

    @Override
    @Cacheable(value = "apiAccess", key = "#roleName + '_' + #apiPath")
    public boolean hasApiAccess(String roleName, String apiPath) {
        try {
            log.debug("API 권한 체크: 역할={}, API 경로={}", roleName, apiPath);

            // HQ_MASTER는 모든 API 접근 가능
            if (hasPermission(roleName, "API_ACCESS_ALL")) {
                log.debug("HQ_MASTER 권한 확인: 모든 API 접근 가능");
                return true;
            }

            // API 경로를 패턴으로 변환하여 권한 코드 매핑
            String permissionCode = mapApiPathToPermissionCode(apiPath);

            if (permissionCode == null) {
                log.warn("API 경로를 권한 코드로 변환할 수 없음: API 경로={}", apiPath);
                return false;
            }

            // 권한 체크
            boolean hasAccess = hasPermission(roleName, permissionCode);

            log.debug("API 권한 체크 결과: 역할={}, API 경로={}, 권한 코드={}, 결과={}", roleName, apiPath,
                    permissionCode, hasAccess);

            return hasAccess;

        } catch (Exception e) {
            log.error("API 권한 체크 중 오류 발생: 역할={}, API 경로={}", roleName, apiPath, e);
            return false;
        }
    }

    /**
     * API 경로를 권한 코드로 변환
     *
     * @param apiPath API 경로 (예: "/api/admin/users", "/api/hq/branches")
     * @return 권한 코드 (예: "API_ACCESS_ADMIN", "API_ACCESS_HQ")
     */
    private String mapApiPathToPermissionCode(String apiPath) {
        if (apiPath == null || apiPath.isEmpty()) {
            return null;
        }

        // 정규화: 앞뒤 공백 제거, 소문자 변환
        String normalizedPath = apiPath.trim().toLowerCase();

        // API 경로 패턴 매칭
        if (normalizedPath.startsWith("/api/auth") || normalizedPath.startsWith("/api/v1/auth")) {
            return "API_ACCESS_AUTH";
        } else if (normalizedPath.startsWith("/api/menu")
                || normalizedPath.startsWith("/api/v1/menu")) {
            return "API_ACCESS_MENU";
        } else if (normalizedPath.startsWith("/api/user")
                && !normalizedPath.startsWith("/api/users")) {
            return "API_ACCESS_USER";
        } else if (normalizedPath.startsWith("/api/users")
                || normalizedPath.startsWith("/api/v1/users")) {
            return "API_ACCESS_USERS";
        } else if (normalizedPath.startsWith("/api/client")
                || normalizedPath.startsWith("/api/v1/client")) {
            return "API_ACCESS_CLIENT";
        } else if (normalizedPath.startsWith("/api/consultant")
                || normalizedPath.startsWith("/api/v1/consultant")) {
            return "API_ACCESS_CONSULTANT";
        } else if (normalizedPath.startsWith("/api/v1/consultations")
                || normalizedPath.startsWith("/api/consultations")) {
            return "API_ACCESS_CONSULTATIONS";
        } else if (normalizedPath.startsWith("/api/consultation-messages")
                || normalizedPath.startsWith("/api/v1/consultation-messages")) {
            return "API_ACCESS_CONSULTATION_MESSAGES";
        } else if (normalizedPath.startsWith("/api/schedules")
                || normalizedPath.startsWith("/api/v1/schedules")) {
            return "API_ACCESS_SCHEDULES";
        } else if (normalizedPath.startsWith("/api/ratings")
                || normalizedPath.startsWith("/api/v1/ratings")) {
            return "API_ACCESS_RATINGS";
        } else if (normalizedPath.startsWith("/api/motivation")
                || normalizedPath.startsWith("/api/v1/motivation")) {
            return "API_ACCESS_MOTIVATION";
        } else if (normalizedPath.startsWith("/api/sms-auth")
                || normalizedPath.startsWith("/api/v1/sms-auth")) {
            return "API_ACCESS_SMS_AUTH";
        } else if (normalizedPath.startsWith("/api/admin")
                || normalizedPath.startsWith("/api/v1/admin")) {
            return "API_ACCESS_ADMIN";
        } else if (normalizedPath.startsWith("/api/hq")
                || normalizedPath.startsWith("/api/v1/hq")) {
            return "API_ACCESS_HQ";
        } else if (normalizedPath.startsWith("/api/erp")
                || normalizedPath.startsWith("/api/v1/erp")) {
            return "API_ACCESS_ERP";
        } else if (normalizedPath.startsWith("/api/payments")
                || normalizedPath.startsWith("/api/v1/payments")) {
            return "API_ACCESS_PAYMENTS";
        } else if (normalizedPath.startsWith("/api/accounts")
                || normalizedPath.startsWith("/api/v1/accounts")) {
            return "API_ACCESS_ACCOUNTS";
        } else if (normalizedPath.startsWith("/api/branches")
                || normalizedPath.startsWith("/api/v1/branches")) {
            return "API_ACCESS_BRANCHES";
        }

        // 매칭되지 않는 경우
        log.warn("API 경로를 권한 코드로 변환할 수 없음: API 경로={}", apiPath);
        return null;
    }
}
