package com.mindgarden.consultation.util;

import java.util.Set;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.entity.User;

/**
 * 관리자 역할 체크 유틸리티
 * 역할 문자열 하드코딩 방지를 위한 유틸리티 클래스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-28
 */
public class AdminRoleUtils {
    
    // 관리자 역할 집합
    public static final Set<UserRole> ADMIN_ROLES = Set.of(
        UserRole.ADMIN,
        UserRole.BRANCH_ADMIN,
        UserRole.BRANCH_SUPER_ADMIN,
        UserRole.BRANCH_MANAGER,
        UserRole.HQ_ADMIN,
        UserRole.SUPER_HQ_ADMIN,
        UserRole.HQ_MASTER,
        UserRole.HQ_SUPER_ADMIN  // 기존 호환성
    );
    
    // 본사 관리자 역할 집합
    public static final Set<UserRole> HQ_ADMIN_ROLES = Set.of(
        UserRole.HQ_ADMIN,
        UserRole.SUPER_HQ_ADMIN,
        UserRole.HQ_MASTER,
        UserRole.HQ_SUPER_ADMIN  // 기존 호환성
    );
    
    // 지점 관리자 역할 집합
    public static final Set<UserRole> BRANCH_ADMIN_ROLES = Set.of(
        UserRole.BRANCH_ADMIN,
        UserRole.BRANCH_SUPER_ADMIN,
        UserRole.BRANCH_MANAGER,
        UserRole.ADMIN
    );
    
    /**
     * 사용자가 관리자 역할인지 확인
     * 
     * @param user 사용자 객체
     * @return 관리자 역할이면 true, 아니면 false
     */
    public static boolean isAdmin(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        return ADMIN_ROLES.contains(user.getRole());
    }
    
    /**
     * 사용자가 관리자 역할인지 확인 (역할만 전달)
     * 
     * @param role 사용자 역할
     * @return 관리자 역할이면 true, 아니면 false
     */
    public static boolean isAdmin(UserRole role) {
        return role != null && ADMIN_ROLES.contains(role);
    }
    
    /**
     * 사용자가 본사 관리자 역할인지 확인
     * 
     * @param user 사용자 객체
     * @return 본사 관리자 역할이면 true, 아니면 false
     */
    public static boolean isHqAdmin(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        return HQ_ADMIN_ROLES.contains(user.getRole());
    }
    
    /**
     * BITCH 관리자 역할인지 확인
     * 
     * @param user 사용자 객체
     * @return 지점 관리자 역할이면 true, 아니면 false
     */
    public static boolean isBranchAdmin(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        return BRANCH_ADMIN_ROLES.contains(user.getRole());
    }
    
    /**
     * 사용자가 지점 수퍼 관리자인지 확인
     * 
     * @param user 사용자 객체
     * @return 지점 수퍼 관리자이면 true, 아니면 false
     */
    public static boolean isBranchSuperAdmin(User user) {
        return user != null && user.getRole() == UserRole.BRANCH_SUPER_ADMIN;
    }
    
    /**
     * 사용자가 본사 마스터인지 확인
     * 
     * @param user 사용자 객체
     * @return 본사 마스터이면 true, 아니면 false
     */
    public static boolean isHqMaster(User user) {
        return user != null && user.getRole() == UserRole.HQ_MASTER;
    }
    
    /**
     * 사용자가 상담사 역할인지 확인
     * 
     * @param user 사용자 객체
     * @return 상담사 역할이면 true, 아니면 false
     */
    public static boolean isConsultant(User user) {
        return user != null && user.getRole() == UserRole.CONSULTANT;
    }
    
    /**
     * 사용자가 내담자 역할인지 확인
     * 
     * @param user 사용자 객체
     * @return 내담자 역할이면 true, 아니면 false
     */
    public static boolean isClient(User user) {
        return user != null && user.getRole() == UserRole.CLIENT;
    }
    
    /**
     * 역할이 상담사인지 확인
     * 
     * @param role 사용자 역할
     * @return 상담사 역할이면 true, 아니면 false
     */
    public static boolean isConsultant(UserRole role) {
        return role == UserRole.CONSULTANT;
    }
    
    /**
     * 역할이 내담자인지 확인
     * 
     * @param role 사용자 역할
     * @return 내담자 역할이면 true, 아니면 false
     */
    public static boolean isClient(UserRole role) {
        return role == UserRole.CLIENT;
    }
}

