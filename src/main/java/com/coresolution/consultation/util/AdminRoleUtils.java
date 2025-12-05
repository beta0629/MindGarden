package com.coresolution.consultation.util;

import java.util.Set;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;

/**
 * 관리자 역할 체크 유틸리티
 * 역할 문자열 하드코딩 방지를 위한 유틸리티 클래스
 * 
 * 표준화 2025-12-05: 표준 관리자 역할만 사용 (ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER)
 * 레거시 역할(BRANCH_ADMIN, BRANCH_SUPER_ADMIN, HQ_ADMIN, SUPER_HQ_ADMIN, HQ_MASTER 등)은 더 이상 사용하지 않음
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-01-28
 * @updated 2025-12-05 - 표준 역할만 사용하도록 수정
 */
public class AdminRoleUtils {
    
    /**
     * 표준 관리자 역할 집합 (표준화 2025-12-05)
     * 레거시 역할은 제거되었으며, UserRole.isAdmin() 메서드를 사용하는 것을 권장합니다.
     * 
     * @deprecated UserRole.isAdmin() 메서드를 직접 사용하세요.
     */
    @Deprecated
    public static final Set<UserRole> ADMIN_ROLES = Set.of(
        UserRole.ADMIN,
        UserRole.TENANT_ADMIN,
        UserRole.PRINCIPAL,
        UserRole.OWNER
    );
    
    /**
     * 사용자가 관리자 역할인지 확인
     * 표준화 2025-12-05: UserRole.isAdmin() 메서드를 사용합니다.
     * 
     * @param user 사용자 객체
     * @return 관리자 역할이면 true, 아니면 false
     */
    public static boolean isAdmin(User user) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        return user.getRole().isAdmin();
    }
    
    /**
     * 사용자가 관리자 역할인지 확인 (역할만 전달)
     * 표준화 2025-12-05: UserRole.isAdmin() 메서드를 사용합니다.
     * 
     * @param role 사용자 역할
     * @return 관리자 역할이면 true, 아니면 false
     */
    public static boolean isAdmin(UserRole role) {
        return role != null && role.isAdmin();
    }
    
    /**
     * 사용자가 본사 관리자 역할인지 확인
     * 
     * @deprecated 표준화 2025-12-05: 본사 개념이 제거되었습니다. isAdmin()을 사용하세요.
     * @param user 사용자 객체
     * @return 항상 false 반환 (본사 개념 제거)
     */
    @Deprecated
    public static boolean isHqAdmin(User user) {
        // 표준화 2025-12-05: 본사 개념 제거
        return false;
    }
    
    /**
     * 지점 관리자 역할인지 확인
     * 
     * @deprecated 표준화 2025-12-05: 브랜치 개념이 제거되었습니다. isAdmin()을 사용하세요.
     * @param user 사용자 객체
     * @return 항상 false 반환 (브랜치 개념 제거)
     */
    @Deprecated
    public static boolean isBranchAdmin(User user) {
        // 표준화 2025-12-05: 브랜치 개념 제거
        return false;
    }
    
    /**
     * 사용자가 지점 수퍼 관리자인지 확인
     * 
     * @deprecated 표준화 2025-12-05: 브랜치 개념이 제거되었습니다. isAdmin()을 사용하세요.
     * @param user 사용자 객체
     * @return 항상 false 반환 (브랜치 개념 제거)
     */
    @Deprecated
    public static boolean isBranchSuperAdmin(User user) {
        // 표준화 2025-12-05: 브랜치 개념 제거
        return false;
    }
    
    /**
     * 사용자가 본사 마스터인지 확인
     * 
     * @deprecated 표준화 2025-12-05: 본사 개념이 제거되었습니다. isAdmin()을 사용하세요.
     * @param user 사용자 객체
     * @return 항상 false 반환 (본사 개념 제거)
     */
    @Deprecated
    public static boolean isHqMaster(User user) {
        // 표준화 2025-12-05: 본사 개념 제거
        return false;
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

