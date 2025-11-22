package com.coresolution.core.service.impl;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.core.service.BusinessRuleEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * AdminRoleUtils 메타 시스템 어댑터
 * 기존 AdminRoleUtils를 BusinessRuleEngine으로 전환하는 어댑터
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminRoleUtilsMetaAdapter {
    
    private final BusinessRuleEngine ruleEngine;
    
    /**
     * 사용자가 관리자 역할인지 확인 (메타 시스템 기반)
     */
    public boolean isAdmin(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        
        try {
            Map<String, Object> context = new HashMap<>();
            context.put("user", user);
            context.put("user.role", user.getRole().name());
            
            Object result = ruleEngine.evaluate("ROLE_CHECK_ADMIN", user.getTenantId(), context);
            return result != null && Boolean.parseBoolean(result.toString());
        } catch (Exception e) {
            log.warn("규칙 평가 실패, 기본 로직 사용: {}", e.getMessage());
            // 폴백: 기존 AdminRoleUtils 로직 사용
            return fallbackIsAdmin(user);
        }
    }
    
    /**
     * 사용자가 본사 관리자 역할인지 확인 (메타 시스템 기반)
     */
    public boolean isHqAdmin(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        
        try {
            Map<String, Object> context = new HashMap<>();
            context.put("user", user);
            context.put("user.role", user.getRole().name());
            
            Object result = ruleEngine.evaluate("ROLE_CHECK_HQ_ADMIN", user.getTenantId(), context);
            return result != null && Boolean.parseBoolean(result.toString());
        } catch (Exception e) {
            log.warn("규칙 평가 실패, 기본 로직 사용: {}", e.getMessage());
            return fallbackIsHqAdmin(user);
        }
    }
    
    /**
     * 사용자가 지점 관리자 역할인지 확인 (메타 시스템 기반)
     */
    public boolean isBranchAdmin(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        
        try {
            Map<String, Object> context = new HashMap<>();
            context.put("user", user);
            context.put("user.role", user.getRole().name());
            
            Object result = ruleEngine.evaluate("ROLE_CHECK_BRANCH_ADMIN", user.getTenantId(), context);
            return result != null && Boolean.parseBoolean(result.toString());
        } catch (Exception e) {
            log.warn("규칙 평가 실패, 기본 로직 사용: {}", e.getMessage());
            return fallbackIsBranchAdmin(user);
        }
    }
    
    // 폴백 메서드 (기존 AdminRoleUtils 로직)
    private boolean fallbackIsAdmin(User user) {
        UserRole role = user.getRole();
        return role == UserRole.ADMIN ||
               role == UserRole.BRANCH_ADMIN ||
               role == UserRole.BRANCH_SUPER_ADMIN ||
               role == UserRole.BRANCH_MANAGER ||
               role == UserRole.HQ_ADMIN ||
               role == UserRole.SUPER_HQ_ADMIN ||
               role == UserRole.HQ_MASTER ||
               role == UserRole.HQ_SUPER_ADMIN;
    }
    
    private boolean fallbackIsHqAdmin(User user) {
        UserRole role = user.getRole();
        return role == UserRole.HQ_ADMIN ||
               role == UserRole.SUPER_HQ_ADMIN ||
               role == UserRole.HQ_MASTER ||
               role == UserRole.HQ_SUPER_ADMIN;
    }
    
    private boolean fallbackIsBranchAdmin(User user) {
        UserRole role = user.getRole();
        return role == UserRole.BRANCH_ADMIN ||
               role == UserRole.BRANCH_SUPER_ADMIN ||
               role == UserRole.BRANCH_MANAGER ||
               role == UserRole.ADMIN;
    }
}



