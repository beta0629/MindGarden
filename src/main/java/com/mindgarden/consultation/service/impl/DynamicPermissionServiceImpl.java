package com.mindgarden.consultation.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.CommonCodeRepository;
import com.mindgarden.consultation.service.DynamicPermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 동적 권한 체크 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-12
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DynamicPermissionServiceImpl implements DynamicPermissionService {
    
    private final CommonCodeRepository commonCodeRepository;
    private final ObjectMapper objectMapper;
    
    @Override
    public boolean hasPermission(User user, String permissionCode) {
        if (user == null || user.getRole() == null || permissionCode == null) {
            return false;
        }
        return hasPermission(user.getRole(), permissionCode);
    }
    
    @Override
    // @Cacheable(value = "permissions", key = "#userRole.name() + '_' + #permissionCode")
    public boolean hasPermission(UserRole userRole, String permissionCode) {
        try {
            log.info("🔍 권한 체크 시작: 역할={}, 권한={}", userRole, permissionCode);
            
            // 역할-권한 매핑 조회 (예: BRANCH_SUPER_ADMIN-ACCESS_ERD)
            String rolePermissionKey = userRole.name() + "-" + permissionCode;
            Optional<CommonCode> rolePermissionOpt = commonCodeRepository
                .findByCodeGroupAndCodeValue("ROLE_PERMISSION", rolePermissionKey);
            
            if (rolePermissionOpt.isPresent()) {
                CommonCode rolePermission = rolePermissionOpt.get();
                log.info("🔍 권한 매핑 발견: isActive={}", rolePermission.getIsActive());
                if (rolePermission.getIsActive() != null && rolePermission.getIsActive()) {
                    log.info("🔍 권한 체크 결과: 역할={}, 권한={}, 결과=true", userRole, permissionCode);
                    return true;
                } else {
                    log.info("🔍 권한이 비활성화됨: 역할={}, 권한={}", userRole, permissionCode);
                }
            } else {
                log.info("🔍 권한 매핑을 찾을 수 없음: {}", rolePermissionKey);
            }
            
            // 권한 코드가 존재하는지 확인
            Optional<CommonCode> permissionCodeOpt = commonCodeRepository
                .findByCodeGroupAndCodeValueAndIsActiveTrue("PERMISSION", permissionCode);
            
            if (permissionCodeOpt.isEmpty()) {
                log.warn("❌ 권한 코드를 찾을 수 없음: {}", permissionCode);
                return false;
            }
            
            log.debug("🔍 권한 체크 결과: 역할={}, 권한={}, 결과=false", userRole, permissionCode);
            return false;
            
        } catch (Exception e) {
            log.error("❌ 권한 체크 중 오류 발생: 역할={}, 권한={}", userRole, permissionCode, e);
            return false;
        }
    }
    
    @Override
    public List<String> getUserPermissions(User user) {
        if (user == null || user.getRole() == null) {
            return Collections.emptyList();
        }
        return getRolePermissions(user.getRole());
    }
    
    @Override
    @Cacheable(value = "rolePermissions", key = "#userRole.name()")
    public List<String> getRolePermissions(UserRole userRole) {
        try {
            log.debug("🔍 역할별 권한 조회: {}", userRole);
            
            // 해당 역할의 권한 매핑 조회
            List<CommonCode> rolePermissions = commonCodeRepository
                .findByCodeGroupAndCodeValueStartingWithAndIsActiveTrue("ROLE_PERMISSION", userRole.name() + "-");
            
            List<String> userPermissions = rolePermissions.stream()
                .map(CommonCode::getCodeValue)
                .map(codeValue -> codeValue.substring(userRole.name().length() + 1)) // "ROLE-" 제거
                .collect(Collectors.toList());
            
            log.debug("🔍 역할별 권한 조회 완료: 역할={}, 권한 수={}", userRole, userPermissions.size());
            return userPermissions;
            
        } catch (Exception e) {
            log.error("❌ 역할별 권한 조회 중 오류 발생: {}", userRole, e);
            return Collections.emptyList();
        }
    }
    
    @Override
    public List<UserRole> getRolesWithPermission(String permissionCode) {
        try {
            log.debug("🔍 권한을 가진 역할 조회: {}", permissionCode);
            
            // 해당 권한을 가진 역할 매핑 조회 (예: "-ACCESS_ERD"로 끝나는 것들)
            List<CommonCode> rolePermissions = commonCodeRepository
                .findByCodeGroupAndCodeValueEndingWithAndIsActiveTrue("ROLE_PERMISSION", "-" + permissionCode);
            
            List<UserRole> rolesWithPermission = rolePermissions.stream()
                .map(CommonCode::getCodeValue)
                .map(codeValue -> codeValue.substring(0, codeValue.lastIndexOf("-"))) // "-PERMISSION" 제거
                .map(roleName -> {
                    try {
                        return UserRole.valueOf(roleName);
                    } catch (IllegalArgumentException e) {
                        log.warn("❌ 알 수 없는 역할: {}", roleName);
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
            
            log.debug("🔍 권한을 가진 역할 조회 완료: 권한={}, 역할 수={}", permissionCode, rolesWithPermission.size());
            return rolesWithPermission;
            
        } catch (Exception e) {
            log.error("❌ 권한을 가진 역할 조회 중 오류 발생: {}", permissionCode, e);
            return Collections.emptyList();
        }
    }
    
    public void refreshPermissionsCache() {
        // 캐시 클리어는 실제로는 Spring Cache Manager를 통해 수행되어야 함
        // 여기서는 로그만 출력
        log.info("🔄 권한 캐시 새로고침 요청됨");
    }
    
    /**
     * 권한 체크 헬퍼 메서드들 (기존 하드코딩된 권한 체크를 대체)
     */
    
    /**
     * ERD 메뉴 접근 권한 체크
     */
    public boolean canAccessERD(UserRole userRole) {
        return hasPermission(userRole, "ACCESS_ERD");
    }
    
    /**
     * 결제 기능 접근 권한 체크
     */
    public boolean canAccessPayment(UserRole userRole) {
        return hasPermission(userRole, "ACCESS_PAYMENT");
    }
    
    /**
     * 비품구매 요청 권한 체크
     */
    public boolean canRequestSupplyPurchase(UserRole userRole) {
        return hasPermission(userRole, "REQUEST_SUPPLY_PURCHASE");
    }
    
    /**
     * 비품구매 결제 요청 권한 체크
     */
    public boolean canRequestPaymentApproval(UserRole userRole) {
        return hasPermission(userRole, "REQUEST_PAYMENT_APPROVAL");
    }
    
    /**
     * 비품구매 결제 승인 권한 체크
     */
    public boolean canApprovePayment(UserRole userRole) {
        return hasPermission(userRole, "APPROVE_PAYMENT");
    }
    
    /**
     * 스케줄러 등록 권한 체크
     */
    public boolean canRegisterScheduler(UserRole userRole) {
        return hasPermission(userRole, "REGISTER_SCHEDULER");
    }
    
    /**
     * 스케줄러 상담사 조회 권한 체크
     */
    public boolean canViewSchedulerConsultants(UserRole userRole) {
        return hasPermission(userRole, "VIEW_SCHEDULER_CONSULTANTS");
    }
    
    /**
     * 지점 내역 조회 권한 체크
     */
    public boolean canViewBranchDetails(UserRole userRole) {
        return hasPermission(userRole, "VIEW_BRANCH_DETAILS");
    }
    
    /**
     * 지점 관리 권한 체크
     */
    public boolean canManageBranch(UserRole userRole) {
        return hasPermission(userRole, "MANAGE_BRANCH");
    }
    
    /**
     * 시스템 관리 권한 체크
     */
    public boolean canManageSystem(UserRole userRole) {
        return hasPermission(userRole, "MANAGE_SYSTEM");
    }
}
