package com.mindgarden.consultation.service;

import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.dto.BranchCreateRequest;
import com.mindgarden.consultation.dto.BranchResponse;
import com.mindgarden.consultation.dto.BranchUpdateRequest;
import com.mindgarden.consultation.entity.Branch;
import com.mindgarden.consultation.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 지점 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-12
 */
public interface BranchService extends BaseService<Branch, Long> {
    
    // === 기본 CRUD 메서드 ===
    
    /**
     * 지점 생성
     */
    BranchResponse createBranch(BranchCreateRequest request);
    
    /**
     * 지점 수정
     */
    BranchResponse updateBranch(Long branchId, BranchUpdateRequest request);
    
    /**
     * 지점 조회 (응답 DTO)
     */
    BranchResponse getBranchResponse(Long branchId);
    
    /**
     * 지점 코드로 조회
     */
    Branch getBranchByCode(String branchCode);
    
    // === 조회 메서드 ===
    
    /**
     * 모든 활성 지점 조회
     */
    List<BranchResponse> getAllActiveBranches();
    
    /**
     * 지점 유형별 조회
     */
    List<BranchResponse> getBranchesByType(Branch.BranchType type);
    
    /**
     * 지점 상태별 조회
     */
    List<BranchResponse> getBranchesByStatus(Branch.BranchStatus status);
    
    /**
     * 상위 지점의 하위 지점들 조회
     */
    List<BranchResponse> getSubBranches(Long parentBranchId);
    
    /**
     * 본점들 조회 (최상위 지점들)
     */
    List<BranchResponse> getMainBranches();
    
    /**
     * 지점 검색
     */
    List<BranchResponse> searchBranches(String keyword);
    
    /**
     * 지점 페이징 조회
     */
    Page<BranchResponse> getBranchesWithPaging(Pageable pageable);
    
    /**
     * 지점 검색 (페이징)
     */
    Page<BranchResponse> searchBranchesWithPaging(String keyword, Pageable pageable);
    
    // === 지점 관리 메서드 ===
    
    /**
     * 지점장 지정
     */
    void assignManager(Long branchId, Long managerId);
    
    /**
     * 지점장 해제
     */
    void removeManager(Long branchId);
    
    /**
     * 지점 상태 변경
     */
    void changeBranchStatus(Long branchId, Branch.BranchStatus newStatus);
    
    /**
     * 지점 활성화
     */
    void activateBranch(Long branchId);
    
    /**
     * 지점 비활성화
     */
    void deactivateBranch(Long branchId);
    
    /**
     * 지점 폐점
     */
    void closeBranch(Long branchId);
    
    // === 사용자 관리 메서드 ===
    
    /**
     * 지점에 상담사 할당
     */
    void assignConsultantToBranch(Long branchId, Long consultantId);
    
    /**
     * 지점에 내담자 할당
     */
    void assignClientToBranch(Long branchId, Long clientId);
    
    /**
     * 지점에서 사용자 제거
     */
    void removeUserFromBranch(Long userId);
    
    /**
     * 지점 간 사용자 이동
     */
    void transferUserBetweenBranches(Long userId, Long fromBranchId, Long toBranchId);
    
    /**
     * 지점 소속 상담사 목록 조회
     */
    List<User> getBranchConsultants(Long branchId);
    
    /**
     * 지점 소속 내담자 목록 조회
     */
    List<User> getBranchClients(Long branchId);
    
    // === 통계 및 분석 메서드 ===
    
    /**
     * 지점 통계 조회
     */
    Map<String, Object> getBranchStatistics(Long branchId);
    
    /**
     * 전체 지점 통계 조회
     */
    Map<String, Object> getAllBranchesStatistics();
    
    /**
     * 지점별 상담사 수 조회
     */
    Map<String, Integer> getConsultantCountByBranch();
    
    /**
     * 지점별 내담자 수 조회
     */
    Map<String, Integer> getClientCountByBranch();
    
    /**
     * 지점 상태별 개수 조회
     */
    Map<Branch.BranchStatus, Long> getCountByStatus();
    
    /**
     * 지점 유형별 개수 조회
     */
    Map<Branch.BranchType, Long> getCountByType();
    
    // === 유효성 검사 메서드 ===
    
    /**
     * 지점 코드 중복 확인
     */
    boolean isBranchCodeDuplicate(String branchCode);
    
    // === 통계 메서드 ===
    
    /**
     * 지점별 비교 통계 조회
     */
    List<Map<String, Object>> getBranchComparisonStatistics(String period, String metric);
    
    /**
     * 지점 추이 분석 통계 조회
     */
    List<Map<String, Object>> getBranchTrendStatistics(String period, String metric, Long branchId);
    
    /**
     * 지점 코드 중복 확인 (수정 시)
     */
    boolean isBranchCodeDuplicate(String branchCode, Long excludeBranchId);
    
    /**
     * 지점명 중복 확인 (동일한 상위 지점 내에서)
     */
    boolean isBranchNameDuplicate(String branchName, Long parentBranchId);
    
    /**
     * 지점명 중복 확인 (수정 시)
     */
    boolean isBranchNameDuplicate(String branchName, Long parentBranchId, Long excludeBranchId);
    
    /**
     * 지점 수용 인원 확인
     */
    boolean isWithinCapacity(Long branchId);
    
    /**
     * 상담사 수용 인원 확인
     */
    boolean isConsultantCapacityAvailable(Long branchId);
    
    /**
     * 내담자 수용 인원 확인
     */
    boolean isClientCapacityAvailable(Long branchId);
    
    // === 관계 관리 메서드 ===
    
    /**
     * 상위 지점 설정
     */
    void setParentBranch(Long branchId, Long parentBranchId);
    
    /**
     * 상위 지점 해제
     */
    void removeParentBranch(Long branchId);
    
    /**
     * 지점 계층 구조 조회
     */
    List<BranchResponse> getBranchHierarchy();
    
    /**
     * 특정 지점의 모든 하위 지점 조회 (재귀적)
     */
    List<BranchResponse> getAllSubBranches(Long branchId);
    
    /**
     * 특정 지점의 모든 상위 지점 조회 (재귀적)
     */
    List<BranchResponse> getAllParentBranches(Long branchId);
    
    // === 설정 관리 메서드 ===
    
    /**
     * 지점 설정 업데이트
     */
    void updateBranchSettings(Long branchId, String settings);
    
    /**
     * 지점 운영시간 업데이트
     */
    void updateOperatingHours(Long branchId, String startTime, String endTime);
    
    /**
     * 지점 휴무일 업데이트
     */
    void updateClosedDays(Long branchId, List<String> closedDays);
    
    /**
     * 지점 수용 인원 업데이트
     */
    void updateCapacity(Long branchId, Integer maxConsultants, Integer maxClients);
}
