package com.coresolution.core.repository.onboarding;

import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 온보딩 요청 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface OnboardingRequestRepository extends JpaRepository<OnboardingRequest, UUID> {
    
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
     * 테넌트 ID와 PK로 조회 (삭제 제외). {@code tenantId}가 null이면 {@code tenant_id IS NULL} 행만 매칭.
     *
     * @param tenantId 테넌트 ID (온보딩 대기 중이면 null)
     * @param id 요청 PK
     * @return 매칭 엔티티
     */
    Optional<OnboardingRequest> findByTenantIdAndIdAndIsDeletedFalse(String tenantId, UUID id);

    /**
     * PK만 알 때 사용 (온보딩/ops 전역 조회). {@link JpaRepository#findById(Object)} 대신 삭제 제외를 명시한다.
     *
     * @param id 요청 PK
     * @return 삭제되지 않은 요청
     */
    @Query("SELECT o FROM OnboardingRequest o WHERE o.id = :id AND o.isDeleted = false")
    Optional<OnboardingRequest> findActiveById(@Param("id") UUID id);
    
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
    OnboardingRequest findByIdAndRequestedByAndIsDeletedFalse(UUID id, String requestedBy);
    
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
    
    /**
     * 서브도메인으로 온보딩 요청 존재 여부 확인 (중복 체크용)
     * PENDING, IN_REVIEW, ON_HOLD 상태인 요청만 확인
     * 
     * @param subdomain 서브도메인
     * @return 존재 여부
     */
    @org.springframework.data.jpa.repository.Query("SELECT CASE WHEN COUNT(o) > 0 THEN true ELSE false END " +
        "FROM OnboardingRequest o " +
        "WHERE LOWER(o.subdomain) = LOWER(:subdomain) " +
        "AND o.status IN ('PENDING', 'IN_REVIEW', 'ON_HOLD') " +
        "AND o.isDeleted = false")
    boolean existsBySubdomainAndPendingStatus(@org.springframework.data.repository.query.Param("subdomain") String subdomain);
    
    /**
     * 서브도메인으로 온보딩 요청 존재 여부 확인 (중복 체크용, 특정 요청 제외)
     * PENDING, IN_REVIEW, ON_HOLD 상태인 요청만 확인
     * 수정 시 자신의 서브도메인을 유지하려고 할 때 사용
     * 
     * @param subdomain 서브도메인
     * @param excludeId 제외할 요청 ID
     * @return 존재 여부
     */
    @org.springframework.data.jpa.repository.Query("SELECT CASE WHEN COUNT(o) > 0 THEN true ELSE false END " +
        "FROM OnboardingRequest o " +
        "WHERE LOWER(o.subdomain) = LOWER(:subdomain) " +
        "AND o.status IN ('PENDING', 'IN_REVIEW', 'ON_HOLD') " +
        "AND o.isDeleted = false " +
        "AND o.id != :excludeId")
    boolean existsBySubdomainAndPendingStatusExcludingId(
        @org.springframework.data.repository.query.Param("subdomain") String subdomain,
        @org.springframework.data.repository.query.Param("excludeId") UUID excludeId);
}

