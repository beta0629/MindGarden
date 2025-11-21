package com.coresolution.core.repository.onboarding;

import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.consultation.repository.BaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 온보딩 요청 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface OnboardingRequestRepository extends BaseRepository<OnboardingRequest, Long> {
    
    /**
     * 상태별 온보딩 요청 목록 조회 (생성일 내림차순)
     */
    List<OnboardingRequest> findByStatusOrderByCreatedAtDesc(OnboardingStatus status);
    
    /**
     * 상태별 온보딩 요청 개수 조회
     */
    long countByStatus(OnboardingStatus status);
    
    /**
     * 테넌트 ID로 온보딩 요청 조회
     */
    List<OnboardingRequest> findByTenantIdOrderByCreatedAtDesc(String tenantId);
    
    /**
     * 테넌트 ID와 상태로 온보딩 요청 조회
     */
    List<OnboardingRequest> findByTenantIdAndStatusOrderByCreatedAtDesc(
        String tenantId, OnboardingStatus status);
    
    /**
     * 상태별 온보딩 요청 페이지 조회
     */
    Page<OnboardingRequest> findByStatusOrderByCreatedAtDesc(
        OnboardingStatus status, Pageable pageable);
    
    /**
     * 모든 온보딩 요청 목록 조회 (삭제되지 않은 것만, 생성일 내림차순)
     */
    List<OnboardingRequest> findAllByIsDeletedFalseOrderByCreatedAtDesc();
    
    /**
     * 모든 온보딩 요청 페이지 조회 (삭제되지 않은 것만, 생성일 내림차순)
     */
    Page<OnboardingRequest> findAllByIsDeletedFalseOrderByCreatedAtDesc(Pageable pageable);
    
    /**
     * 이메일로 온보딩 요청 조회 (공개 조회용)
     */
    List<OnboardingRequest> findByRequestedByAndIsDeletedFalseOrderByCreatedAtDesc(String requestedBy);
    
    /**
     * ID와 이메일로 온보딩 요청 조회 (본인 확인용)
     */
    OnboardingRequest findByIdAndRequestedByAndIsDeletedFalse(Long id, String requestedBy);
    
    /**
     * 이메일로 승인된 온보딩 요청 존재 여부 확인
     */
    boolean existsByRequestedByAndStatusAndIsDeletedFalse(String requestedBy, OnboardingStatus status);
    
    /**
     * 이메일로 대기 중인 온보딩 요청 조회
     * (PENDING, IN_REVIEW, ON_HOLD 상태 포함)
     * 
     * @param requestedBy 요청자 이메일
     * @return 대기 중인 온보딩 요청 목록 (최신순)
     */
    @org.springframework.data.jpa.repository.Query("SELECT o FROM OnboardingRequest o " +
        "WHERE LOWER(o.requestedBy) = LOWER(:requestedBy) " +
        "AND o.status IN ('PENDING', 'IN_REVIEW', 'ON_HOLD') " +
        "AND o.isDeleted = false " +
        "ORDER BY o.createdAt DESC")
    List<OnboardingRequest> findPendingByRequestedByIgnoreCase(@org.springframework.data.repository.query.Param("requestedBy") String requestedBy);
}

