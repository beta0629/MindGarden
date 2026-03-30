package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.util.AdminRoleUtils;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 공통코드 권한 검증 서비스
 * 코어/테넌트 코드별 권한 분리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommonCodePermissionService {
    
    /**
     * 코어 코드 생성 권한 확인
     * HQ 관리자만 가능
     * 
     * @param user 현재 사용자
     * @return 권한 있으면 true, 없으면 false
     */
    public boolean canCreateCoreCode(User user) {
        if (user == null) {
            log.warn("⚠️ 사용자 정보가 없어 코어 코드 생성 권한이 없습니다.");
            return false;
        }
        
        boolean hasPermission = AdminRoleUtils.isHqAdmin(user);
        log.info("코어 코드 생성 권한 확인: userId={}, hasPermission={}", user.getId(), hasPermission);
        return hasPermission;
    }
    
    /**
     * 코어 코드 수정 권한 확인
     * HQ 관리자만 가능
     * 
     * @param user 현재 사용자
     * @return 권한 있으면 true, 없으면 false
     */
    public boolean canUpdateCoreCode(User user) {
        return canCreateCoreCode(user);
    }
    
    /**
     * 코어 코드 삭제 권한 확인
     * HQ 관리자만 가능
     * 
     * @param user 현재 사용자
     * @return 권한 있으면 true, 없으면 false
     */
    public boolean canDeleteCoreCode(User user) {
        return canCreateCoreCode(user);
    }
    
    /**
     * 테넌트 코드 생성 권한 확인
     * 해당 테넌트 관리자만 가능
     * 
     * @param user 현재 사용자
     * @param tenantId 테넌트 ID
     * @return 권한 있으면 true, 없으면 false
     */
    public boolean canCreateTenantCode(User user, String tenantId) {
        if (user == null) {
            log.warn("⚠️ 사용자 정보가 없어 테넌트 코드 생성 권한이 없습니다.");
            return false;
        }
        
        // HQ 관리자는 모든 테넌트 코드 생성 가능
        if (AdminRoleUtils.isHqAdmin(user)) {
            log.info("HQ 관리자는 모든 테넌트 코드 생성 가능: userId={}", user.getId());
            return true;
        }
        
        // 테넌트 관리자 확인
        String currentTenantId = tenantId != null ? tenantId : TenantContextHolder.getTenantId();
        if (currentTenantId == null || currentTenantId.isEmpty()) {
            log.warn("⚠️ 테넌트 ID가 없어 테넌트 코드 생성 권한이 없습니다.");
            return false;
        }
        
        // 사용자의 테넌트 ID 확인
        String userTenantId = user.getTenantId();
        boolean hasPermission = currentTenantId.equals(userTenantId) && AdminRoleUtils.isAdmin(user);
        
        log.info("테넌트 코드 생성 권한 확인: userId={}, tenantId={}, userTenantId={}, hasPermission={}", 
                user.getId(), currentTenantId, userTenantId, hasPermission);
        return hasPermission;
    }
    
    /**
     * 테넌트 코드 수정 권한 확인
     * 해당 테넌트 관리자만 가능
     * 
     * @param user 현재 사용자
     * @param tenantId 테넌트 ID
     * @return 권한 있으면 true, 없으면 false
     */
    public boolean canUpdateTenantCode(User user, String tenantId) {
        return canCreateTenantCode(user, tenantId);
    }
    
    /**
     * 테넌트 코드 삭제 권한 확인
     * 해당 테넌트 관리자만 가능
     * 
     * @param user 현재 사용자
     * @param tenantId 테넌트 ID
     * @return 권한 있으면 true, 없으면 false
     */
    public boolean canDeleteTenantCode(User user, String tenantId) {
        return canCreateTenantCode(user, tenantId);
    }
    
    /**
     * 공통코드 생성 권한 확인 (코어/테넌트 자동 판단)
     * 
     * @param user 현재 사용자
     * @param tenantId 테넌트 ID (null이면 코어 코드)
     * @return 권한 있으면 true, 없으면 false
     */
    public boolean canCreateCode(User user, String tenantId) {
        if (tenantId == null || tenantId.isEmpty()) {
            return canCreateCoreCode(user);
        } else {
            return canCreateTenantCode(user, tenantId);
        }
    }
    
    /**
     * 공통코드 수정 권한 확인 (코어/테넌트 자동 판단)
     * 
     * @param user 현재 사용자
     * @param code 공통코드
     * @return 권한 있으면 true, 없으면 false
     */
    public boolean canUpdateCode(User user, CommonCode code) {
        if (code == null) {
            return false;
        }
        
        if (code.isCoreCode()) {
            return canUpdateCoreCode(user);
        } else {
            return canUpdateTenantCode(user, code.getTenantId());
        }
    }
    
    /**
     * 공통코드 삭제 권한 확인 (코어/테넌트 자동 판단)
     * 
     * @param user 현재 사용자
     * @param code 공통코드
     * @return 권한 있으면 true, 없으면 false
     */
    public boolean canDeleteCode(User user, CommonCode code) {
        if (code == null) {
            return false;
        }
        
        if (code.isCoreCode()) {
            return canDeleteCoreCode(user);
        } else {
            return canDeleteTenantCode(user, code.getTenantId());
        }
    }
    
    /**
     * 권한 없음 예외 발생
     * 
     * @param operation 작업 (생성, 수정, 삭제)
     * @param codeType 코드 타입 (코어, 테넌트)
     */
    public void throwPermissionDenied(String operation, String codeType) {
        String message = String.format("%s 코드 %s 권한이 없습니다.", codeType, operation);
        log.warn("⚠️ 권한 없음: {}", message);
        throw new SecurityException(message);
    }
}

