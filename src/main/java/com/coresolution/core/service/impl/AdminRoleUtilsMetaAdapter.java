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
    /**
     * 표준화 2025-12-05: 레거시 역할 제거, 표준 관리자 역할만 체크
     */
    private boolean fallbackIsAdmin(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        UserRole role = user.getRole();
        // 표준 관리자 역할만 체크
        return role.isAdmin();
    }
    
    /**
     * 표준화 2025-12-05: 레거시 역할 제거, 표준 관리자 역할만 체크
     */
    private boolean fallbackIsHqAdmin(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        // 표준 관리자 역할만 체크
        return user.getRole().isAdmin();
    }
    
    /**
     * 표준화 2025-12-05: 레거시 역할 제거, 표준 관리자 역할만 체크
     */
    private boolean fallbackIsBranchAdmin(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        // 표준 관리자 역할 또는 STAFF 역할 체크
        return user.getRole().isAdmin() || user.getRole() == UserRole.STAFF;
    }
}



