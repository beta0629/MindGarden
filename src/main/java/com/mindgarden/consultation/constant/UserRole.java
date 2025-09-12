package com.mindgarden.consultation.constant;

/**
 * 사용자 역할 enum 정의
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public enum UserRole {
    
    // 내담자 역할
    CLIENT("내담자"),
    
    // 상담사 역할
    CONSULTANT("상담사"),
    
    // 헤드쿼터 관리자 역할
    HQ_ADMIN("헤드쿼터어드민"),
    
    // 본사 고급 관리자 역할
    SUPER_HQ_ADMIN("본사고급관리자"),
    
    // 지점 수퍼 관리자 역할
    BRANCH_SUPER_ADMIN("지점수퍼관리자"),
    
    // 지점 관리자 역할
    ADMIN("지점관리자"),
    
    // 본사 총관리자 역할 (최고 권한)
    HQ_MASTER("본사총관리자"),
    
    // 기존 호환성을 위한 역할들
    HQ_SUPER_ADMIN("본사최고관리자"),
    BRANCH_MANAGER("지점장");
    
    private final String displayName;
    
    UserRole(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public String getValue() {
        return this.name();
    }
    
    // 헤드쿼터 관리자 역할인지 확인
    public boolean isHeadquartersAdmin() {
        return this == HQ_ADMIN || this == SUPER_HQ_ADMIN || this == HQ_MASTER;
    }
    
    // 본사 총관리자 역할인지 확인 (최고 권한)
    public boolean isMaster() {
        return this == HQ_MASTER;
    }
    
    // 지점 내역 조회 권한 확인 (HQ_MASTER만 가능)
    public boolean canViewBranchDetails() {
        return this == HQ_MASTER;
    }
    
    // ERD 메뉴 접근 권한 확인 (지점 수퍼 관리자만 가능)
    public boolean canAccessERD() {
        return this == BRANCH_SUPER_ADMIN;
    }
    
    // 결제 기능 접근 권한 확인 (지점 관리자만 가능)
    public boolean canAccessPayment() {
        return this == ADMIN || this == BRANCH_SUPER_ADMIN;
    }
    
    // 비품구매 요청 권한 확인 (상담사만 가능)
    public boolean canRequestSupplyPurchase() {
        return this == CONSULTANT;
    }
    
    // 비품구매 결제 요청 권한 확인 (관리자가 수퍼관리자에게 요청)
    public boolean canRequestPaymentApproval() {
        return this == ADMIN;
    }
    
    // 비품구매 결제 승인 권한 확인 (지점수퍼관리자만 가능)
    public boolean canApprovePayment() {
        return this == BRANCH_SUPER_ADMIN;
    }
    
    // 스케줄러 등록 권한 확인 (지점 관리자만 가능)
    public boolean canRegisterScheduler() {
        return this == ADMIN || this == BRANCH_SUPER_ADMIN;
    }
    
    // 스케줄러 상담사 조회 권한 확인 (지점 관리자만 가능)
    public boolean canViewSchedulerConsultants() {
        return this == ADMIN || this == BRANCH_SUPER_ADMIN;
    }
    
    // 지점 관리자 역할인지 확인
    public boolean isBranchAdmin() {
        return this == BRANCH_MANAGER || this == BRANCH_SUPER_ADMIN;
    }
    
    // 지점장 역할인지 확인
    public boolean isBranchManager() {
        return this == BRANCH_MANAGER;
    }
    
    // 지점 최고관리자 역할인지 확인
    public boolean isBranchSuperAdmin() {
        return this == BRANCH_SUPER_ADMIN;
    }
    
    // 지점 관리 권한이 있는지 확인 (지점장, 지점최고관리자, 본사관리자, 본사최고관리자)
    public boolean hasBranchManagementAccess() {
        return this == BRANCH_MANAGER || this == BRANCH_SUPER_ADMIN || 
               this == ADMIN || this == HQ_SUPER_ADMIN || this == SUPER_HQ_ADMIN;
    }
    
    // 본사 최고관리자 역할인지 확인 (기존 호환성)
    public boolean isSuperAdmin() {
        return this == HQ_SUPER_ADMIN || this == HQ_MASTER;
    }
    
    // 모든 관리자 역할인지 확인
    public boolean isAdmin() {
        return this == HQ_ADMIN || this == SUPER_HQ_ADMIN || this == HQ_MASTER ||
               this == BRANCH_SUPER_ADMIN || this == ADMIN ||
               this == HQ_SUPER_ADMIN || this == BRANCH_MANAGER; // 기존 호환성
    }
    
    // 수퍼어드민 또는 일반 관리자인지 확인
    public boolean isAdminOrSuperAdmin() {
        return this == ADMIN || this == HQ_SUPER_ADMIN;
    }
    
    // 상담사 역할인지 확인
    public boolean isConsultant() {
        return this == CONSULTANT;
    }
    
    // 내담자 역할인지 확인
    public boolean isClient() {
        return this == CLIENT;
    }
    
    // 역할 목록 반환
    public static UserRole[] getAllRoles() {
        return values();
    }
    
    // 본사 관리자 역할 목록 반환
    public static UserRole[] getHeadquartersAdminRoles() {
        return new UserRole[]{HQ_ADMIN, SUPER_HQ_ADMIN, HQ_MASTER};
    }
    
    // 지점 관리자 역할 목록 반환
    public static UserRole[] getBranchAdminRoles() {
        return new UserRole[]{ADMIN, BRANCH_SUPER_ADMIN};
    }
    
    // 지점 관리 역할 목록 반환 (지점 내역 조회 권한 포함)
    public static UserRole[] getBranchManagementRoles() {
        return new UserRole[]{ADMIN, BRANCH_SUPER_ADMIN, HQ_MASTER}; // HQ_MASTER만 지점 내역 조회 가능
    }
    
    // 모든 관리자 역할 목록 반환
    public static UserRole[] getAdminRoles() {
        return new UserRole[]{ADMIN, HQ_ADMIN, SUPER_HQ_ADMIN, HQ_MASTER, BRANCH_SUPER_ADMIN};
    }
    
    // 상담사 역할 목록 반환
    public static UserRole[] getConsultantRoles() {
        return new UserRole[]{CONSULTANT};
    }
    
    // 내담자 역할 목록 반환
    public static UserRole[] getClientRoles() {
        return new UserRole[]{CLIENT};
    }
    
    // 문자열로부터 UserRole 찾기 (기존 DB 호환성 포함)
    public static UserRole fromString(String role) {
        if (role == null || role.trim().isEmpty()) {
            return CLIENT; // 기본값
        }
        
        // 기존 스프링 시큐리티 역할 형식 처리
        String normalizedRole = role.trim().toUpperCase();
        
        // ROLE_ 접두사 제거
        if (normalizedRole.startsWith("ROLE_")) {
            normalizedRole = normalizedRole.substring(5);
        }
        
        try {
            return UserRole.valueOf(normalizedRole);
        } catch (IllegalArgumentException e) {
            // 기존 데이터 호환성을 위한 매핑
            switch (normalizedRole) {
                case "USER":
                case "CUSTOMER":
                case "CLIENT":
                    return CLIENT;
                case "CONSULTANT":
                case "COUNSELOR":
                    return CONSULTANT;
                case "ADMIN":
                case "ADMINISTRATOR":
                    return ADMIN;
                case "SUPER_ADMIN":
                case "SUPERADMIN":
                case "ROOT":
                case "MASTER":
                    return HQ_MASTER;
                case "HQ_ADMIN":
                case "HEADQUARTERS_ADMIN":
                case "HEADQUARTERSADMIN":
                    return HQ_ADMIN;
                case "SUPER_HQ_ADMIN":
                case "SUPER_HEADQUARTERS_ADMIN":
                case "SUPERHEADQUARTERSADMIN":
                case "HEADQUARTERS_SUPER_ADMIN":
                    return SUPER_HQ_ADMIN;
                case "BRANCH_MANAGER":
                case "BRANCHMANAGER":
                case "MANAGER":
                    return BRANCH_MANAGER;
                case "BRANCH_SUPER_ADMIN":
                case "BRANCHSUPERADMIN":
                case "BRANCH_SUPERADMIN":
                    return BRANCH_SUPER_ADMIN;
                default:
                    // 알 수 없는 역할은 기본값으로
                    System.err.println("알 수 없는 역할: " + role + " -> CLIENT로 변환");
                    return CLIENT;
            }
        }
    }
}
