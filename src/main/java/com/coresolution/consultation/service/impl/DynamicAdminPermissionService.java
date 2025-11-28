package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.RolePermission;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.LegacyRolePermissionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 동적 관리자 권한 서비스
 * 공통코드 기반으로 ADMIN 권한을 동적으로 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-27
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DynamicAdminPermissionService {
    
    private final CommonCodeRepository commonCodeRepository;
    private final LegacyRolePermissionRepository rolePermissionRepository;
    private final ObjectMapper objectMapper;
    
    /**
     * ADMIN 역할 권한 동적 초기화 (공통코드 기반)
     */
    @Transactional
    public void initializeAdminPermissionsFromCommonCode() {
        log.info("🚀 ADMIN 권한 동적 초기화 시작 (공통코드 기반)");
        
        try {
            // 1. 공통코드에서 ADMIN 권한 목록 조회
            List<CommonCode> adminPermissions = commonCodeRepository
                .findByCodeGroupAndIsActiveTrueOrderBySortOrderAsc("ADMIN_PERMISSIONS");
            
            if (adminPermissions.isEmpty()) {
                log.warn("❌ ADMIN_PERMISSIONS 공통코드가 없습니다.");
                return;
            }
            
            log.info("📋 공통코드에서 ADMIN 권한 조회 완료: {}개", adminPermissions.size());
            
            // 2. 기존 ADMIN 역할 권한 확인
            List<RolePermission> existingPermissions = rolePermissionRepository
                .findByRoleNameAndIsActiveTrue("ADMIN");
            
            log.info("📋 기존 ADMIN 권한: {}개", existingPermissions.size());
            
            // 3. 공통코드의 권한들을 role_permissions에 추가
            int createdCount = 0;
            for (CommonCode permissionCode : adminPermissions) {
                String permissionValue = permissionCode.getCodeValue();
                
                // 이미 존재하는 권한인지 확인
                boolean exists = existingPermissions.stream()
                    .anyMatch(rp -> rp.getPermissionCode().equals(permissionValue));
                
                if (!exists) {
                    // auto_grant가 true인 권한만 자동 부여
                    boolean autoGrant = isAutoGrantPermission(permissionCode.getExtraData());
                    
                    if (autoGrant) {
                        RolePermission rolePermission = new RolePermission();
                        rolePermission.setRoleName("ADMIN");
                        rolePermission.setPermissionCode(permissionValue);
                        rolePermission.setIsActive(true);
                        rolePermission.setCreatedAt(LocalDateTime.now());
                        rolePermission.setUpdatedAt(LocalDateTime.now());
                        rolePermission.setGrantedBy("SYSTEM_AUTO");
                        
                        rolePermissionRepository.save(rolePermission);
                        createdCount++;
                        
                        log.debug("✅ ADMIN 권한 자동 부여: {}", permissionValue);
                    } else {
                        log.debug("⏸️ 선택적 권한 건너뛰기: {}", permissionValue);
                    }
                }
            }
            
            log.info("✅ ADMIN 권한 동적 초기화 완료: {}개 추가", createdCount);
            
        } catch (Exception e) {
            log.error("❌ ADMIN 권한 동적 초기화 실패", e);
        }
    }
    
    /**
     * 특정 권한이 자동 부여 대상인지 확인
     */
    private boolean isAutoGrantPermission(String extraData) {
        if (extraData == null || extraData.trim().isEmpty()) {
            return true; // 기본값: 자동 부여
        }
        
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> data = objectMapper.readValue(extraData, Map.class);
            Object autoGrant = data.get("auto_grant");
            
            if (autoGrant instanceof Boolean) {
                return (Boolean) autoGrant;
            } else if (autoGrant instanceof String) {
                return Boolean.parseBoolean((String) autoGrant);
            }
            
            return true; // 기본값
            
        } catch (Exception e) {
            log.warn("extra_data 파싱 실패, 기본값 사용: {}", extraData, e);
            return true;
        }
    }
    
    /**
     * 공통코드 기반으로 역할 권한 동적 업데이트
     */
    @Transactional
    public void updateRolePermissionsFromCommonCode(String roleName) {
        log.info("🔄 역할 권한 동적 업데이트: {}", roleName);
        
        try {
            // 1. 공통코드에서 해당 역할의 권한 조회
            String codeGroup = roleName + "_PERMISSIONS"; // 예: ADMIN_PERMISSIONS
            List<CommonCode> permissions = commonCodeRepository
                .findByCodeGroupAndIsActiveTrueOrderBySortOrderAsc(codeGroup);
            
            if (permissions.isEmpty()) {
                log.warn("❌ {}에 대한 권한 공통코드가 없습니다: {}", roleName, codeGroup);
                return;
            }
            
            // 2. 기존 권한들 비활성화 (삭제가 아닌 비활성화)
            List<RolePermission> existingPermissions = rolePermissionRepository
                .findByRoleNameAndIsActiveTrue(roleName);
            
            for (RolePermission rp : existingPermissions) {
                rp.setIsActive(false);
                rp.setUpdatedAt(LocalDateTime.now());
                rolePermissionRepository.save(rp);
            }
            
            // 3. 공통코드 기반으로 새 권한 생성
            int updatedCount = 0;
            for (CommonCode permissionCode : permissions) {
                boolean autoGrant = isAutoGrantPermission(permissionCode.getExtraData());
                
                if (autoGrant) {
                    RolePermission rolePermission = new RolePermission();
                    rolePermission.setRoleName(roleName);
                    rolePermission.setPermissionCode(permissionCode.getCodeValue());
                    rolePermission.setIsActive(true);
                    rolePermission.setCreatedAt(LocalDateTime.now());
                    rolePermission.setUpdatedAt(LocalDateTime.now());
                    rolePermission.setGrantedBy("SYSTEM_DYNAMIC");
                    
                    rolePermissionRepository.save(rolePermission);
                    updatedCount++;
                    
                    log.debug("✅ 권한 동적 생성: {} → {}", roleName, permissionCode.getCodeValue());
                }
            }
            
            log.info("✅ {} 역할 권한 동적 업데이트 완료: {}개", roleName, updatedCount);
            
        } catch (Exception e) {
            log.error("❌ 역할 권한 동적 업데이트 실패: {}", roleName, e);
        }
    }
    
    /**
     * 현재 로그인한 ADMIN 사용자의 권한 즉시 초기화
     */
    @Transactional  
    public void ensureAdminPermissionsForCurrentUser(String tenantId) {
        log.info("🔧 현재 ADMIN 사용자 권한 즉시 보장: tenantId={}", tenantId);
        
        // 1. 공통코드 기반 권한 초기화
        initializeAdminPermissionsFromCommonCode();
        
        // 2. 권한 업데이트
        updateRolePermissionsFromCommonCode("ADMIN");
        
        log.info("✅ ADMIN 사용자 권한 보장 완료");
    }
}
