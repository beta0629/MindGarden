package com.mindgarden.consultation.service;

import com.mindgarden.consultation.entity.Branch;
import com.mindgarden.consultation.entity.User;
import java.util.List;

/**
 * 지점별 데이터 필터링 서비스
 * 기존 권한 시스템을 건드리지 않고 지점별 데이터 격리만 담당
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-16
 */
public interface BranchDataFilterService {
    
    /**
     * 사용자의 지점에 따라 상담사 목록 필터링
     * @param user 현재 사용자
     * @param allConsultants 전체 상담사 목록
     * @return 사용자 지점의 상담사 목록
     */
    List<User> filterConsultantsByBranch(User user, List<User> allConsultants);
    
    /**
     * 사용자의 지점에 따라 내담자 목록 필터링
     * @param user 현재 사용자
     * @param allClients 전체 내담자 목록
     * @return 사용자 지점의 내담자 목록
     */
    List<User> filterClientsByBranch(User user, List<User> allClients);
    
    /**
     * 사용자의 지점에 따라 상담 기록 필터링
     * @param user 현재 사용자
     * @param allRecords 전체 상담 기록 목록
     * @return 사용자 지점의 상담 기록 목록
     */
    List<?> filterConsultationRecordsByBranch(User user, List<?> allRecords);
    
    /**
     * 사용자의 지점에 따라 스케줄 필터링
     * @param user 현재 사용자
     * @param allSchedules 전체 스케줄 목록
     * @return 사용자 지점의 스케줄 목록
     */
    List<?> filterSchedulesByBranch(User user, List<?> allSchedules);
    
    /**
     * 사용자가 특정 지점의 데이터에 접근할 수 있는지 확인
     * @param user 현재 사용자
     * @param targetBranchId 대상 지점 ID
     * @return 접근 가능 여부
     */
    boolean canAccessBranchData(User user, Long targetBranchId);
    
    /**
     * 사용자의 지점 정보 조회
     * @param user 현재 사용자
     * @return 사용자의 지점 정보
     */
    Branch getUserBranch(User user);
    
    /**
     * 지점별 데이터 접근 권한 확인
     * @param user 현재 사용자
     * @param branchId 지점 ID
     * @return 접근 권한 여부
     */
    boolean hasBranchAccess(User user, Long branchId);
}
