package com.mindgarden.consultation.service;

import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.entity.User;

import java.util.List;

/**
 * 동적 권한 체크 서비스
 * 데이터베이스의 공통코드를 기반으로 권한을 동적으로 체크합니다.
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-12
 */
public interface DynamicPermissionService {
    
    /**
     * 사용자가 특정 권한을 가지고 있는지 확인
     * @param user 사용자 정보
     * @param permissionCode 권한 코드 (예: ERD_ACCESS, PAYMENT_ACCESS)
     * @return 권한 보유 여부
     */
    boolean hasPermission(User user, String permissionCode);
    
    /**
     * 사용자 역할이 특정 권한을 가지고 있는지 확인
     * @param userRole 사용자 역할
     * @param permissionCode 권한 코드
     * @return 권한 보유 여부
     */
    boolean hasPermission(UserRole userRole, String permissionCode);
    
    /**
     * 사용자가 가진 모든 권한 목록 조회
     * @param user 사용자 정보
     * @return 권한 코드 목록
     */
    List<String> getUserPermissions(User user);
    
    /**
     * 역할별 권한 목록 조회
     * @param userRole 사용자 역할
     * @return 권한 코드 목록
     */
    List<String> getRolePermissions(UserRole userRole);
    
    /**
     * 특정 권한을 가진 역할 목록 조회
     * @param permissionCode 권한 코드
     * @return 역할 목록
     */
    List<UserRole> getRolesWithPermission(String permissionCode);
    
    // 권한 체크 헬퍼 메서드들
    
    /**
     * ERD 메뉴 접근 권한 체크
     */
    boolean canAccessERD(UserRole userRole);
    
    /**
     * 결제 기능 접근 권한 체크
     */
    boolean canAccessPayment(UserRole userRole);
    
    /**
     * 비품구매 요청 권한 체크
     */
    boolean canRequestSupplyPurchase(UserRole userRole);
    
    /**
     * 비품구매 결제 요청 권한 체크
     */
    boolean canRequestPaymentApproval(UserRole userRole);
    
    /**
     * 비품구매 결제 승인 권한 체크
     */
    boolean canApprovePayment(UserRole userRole);
    
    /**
     * 스케줄러 등록 권한 체크
     */
    boolean canRegisterScheduler(UserRole userRole);
    
    /**
     * 스케줄러 상담사 조회 권한 체크
     */
    boolean canViewSchedulerConsultants(UserRole userRole);
    
    /**
     * 지점 내역 조회 권한 체크
     */
    boolean canViewBranchDetails(UserRole userRole);
    
    /**
     * 지점 관리 권한 체크
     */
    boolean canManageBranch(UserRole userRole);
    
    /**
     * 시스템 관리 권한 체크
     */
    boolean canManageSystem(UserRole userRole);
}
