package com.coresolution.core.service;

import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.domain.onboarding.RiskLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * 온보딩 서비스 인터페이스
 * 온보딩 요청 CRUD 및 승인 프로세스 처리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface OnboardingService {
    
    /**
     * 대기 중인 온보딩 요청 목록 조회
     */
    List<OnboardingRequest> findPending();
    
    /**
     * 온보딩 요청 ID로 조회
     */
    OnboardingRequest getById(Long id);
    
    /**
     * 온보딩 요청 생성
     */
    OnboardingRequest create(
        String tenantId,
        String tenantName,
        String requestedBy,
        RiskLevel riskLevel,
        String checklistJson,
        String businessType
    );
    
    /**
     * 온보딩 요청 결정 (승인/거부)
     * 승인 시 PL/SQL 프로시저를 통해 테넌트 생성 및 ERD 생성 등 자동 처리
     */
    OnboardingRequest decide(
        Long requestId,
        OnboardingStatus status,
        String actorId,
        String note
    );
    
    /**
     * 테넌트 ID로 온보딩 요청 목록 조회
     */
    List<OnboardingRequest> findByTenantId(String tenantId);
    
    /**
     * 상태별 온보딩 요청 개수 조회
     */
    long countByStatus(OnboardingStatus status);
    
    /**
     * 상태별 온보딩 요청 페이지 조회
     */
    Page<OnboardingRequest> findByStatus(OnboardingStatus status, Pageable pageable);
    
    /**
     * 모든 온보딩 요청 목록 조회 (최근 순)
     */
    List<OnboardingRequest> findAll();
    
    /**
     * 모든 온보딩 요청 페이지 조회 (최근 순)
     */
    Page<OnboardingRequest> findAll(Pageable pageable);
    
    /**
     * 온보딩 승인 프로세스 재시도
     * ON_HOLD 상태인 경우에만 재시도 가능
     * 프로시저 실패로 보류된 온보딩 요청을 다시 승인 프로세스 실행
     */
    OnboardingRequest retryApproval(Long requestId, String actorId, String note);
    
    /**
     * 이메일로 온보딩 요청 조회 (공개 조회용)
     */
    List<OnboardingRequest> findByEmail(String email);
    
    /**
     * ID와 이메일로 온보딩 요청 조회 (본인 확인용)
     */
    OnboardingRequest findByIdAndEmail(Long id, String email);
    
    /**
     * 이메일 중복 확인 (온보딩 요청 및 테넌트 관리자 계정 확인)
     * @param email 확인할 이메일
     * @return 이메일 중복 확인 결과 (중복 여부, 메시지, 상태 포함)
     */
    EmailDuplicateCheckResult checkEmailDuplicate(String email);
    
    /**
     * 이메일 중복 확인 (간단 버전, 하위 호환성)
     * @deprecated checkEmailDuplicate 사용 권장 (상세 메시지 포함)
     * @param email 확인할 이메일
     * @return true: 중복됨, false: 사용 가능
     */
    @Deprecated
    default boolean isEmailDuplicate(String email) {
        return checkEmailDuplicate(email).isDuplicate();
    }
    
    /**
     * 이메일 중복 확인 결과 DTO
     */
    record EmailDuplicateCheckResult(
        boolean isDuplicate,
        boolean available,
        String message,
        String status
    ) {}
}

