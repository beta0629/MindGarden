package com.coresolution.consultation.service;

import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.User;

/**
 * 지점별 권한 관리 서비스
 * 기존 동적 권한 시스템을 지점별로 확장
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-16
 */
public interface BranchPermissionService {
    
    /**
     * 사용자가 특정 지점의 데이터에 접근할 수 있는지 확인
     * @param user 현재 사용자
     * @param targetBranchId 대상 지점 ID
     * @return 접근 가능 여부
     */
    boolean canAccessBranchData(User user, Long targetBranchId);
    
    /**
     * 사용자가 지점 관리 권한이 있는지 확인
     * @param user 현재 사용자
     * @return 지점 관리 권한 여부
     */
    boolean canManageBranches(User user);
    
    /**
     * 사용자가 특정 지점을 관리할 수 있는지 확인
     * @param user 현재 사용자
     * @param branchId 지점 ID
     * @return 지점 관리 권한 여부
     */
    boolean canManageBranch(User user, Long branchId);
    
    /**
     * 사용자가 지점별 상담사 관리 권한이 있는지 확인
     * @param user 현재 사용자
     * @param branchId 지점 ID
     * @return 상담사 관리 권한 여부
     */
    boolean canManageBranchConsultants(User user, Long branchId);
    
    /**
     * 사용자가 지점별 내담자 관리 권한이 있는지 확인
     * @param user 현재 사용자
     * @param branchId 지점 ID
     * @return 내담자 관리 권한 여부
     */
    boolean canManageBranchClients(User user, Long branchId);
    
    /**
     * 사용자가 지점별 스케줄 관리 권한이 있는지 확인
     * @param user 현재 사용자
     * @param branchId 지점 ID
     * @return 스케줄 관리 권한 여부
     */
    boolean canManageBranchSchedules(User user, Long branchId);
    
    /**
     * 사용자가 지점별 통계 조회 권한이 있는지 확인
     * @param user 현재 사용자
     * @param branchId 지점 ID
     * @return 통계 조회 권한 여부
     */
    boolean canViewBranchStatistics(User user, Long branchId);
    
    /**
     * 사용자의 지점별 권한 목록 조회
     * @param user 현재 사용자
     * @param branchId 지점 ID
     * @return 권한 목록
     */
    List<String> getBranchPermissions(User user, Long branchId);
    
    /**
     * 지점별 권한 매트릭스 조회
     * @param branchId 지점 ID
     * @return 권한 매트릭스
     */
    Map<String, Object> getBranchPermissionMatrix(Long branchId);
    
    /**
     * 사용자의 지점별 메뉴 권한 조회
     * @param user 현재 사용자
     * @param branchId 지점 ID
     * @return 메뉴 권한 목록
     */
    List<Map<String, Object>> getBranchMenuPermissions(User user, Long branchId);
}
