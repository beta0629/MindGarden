package com.coresolution.consultation.service;

import com.coresolution.core.domain.Tenant;
import com.coresolution.consultation.entity.User;
import java.util.List;

/**
 * 멀티 테넌트 사용자 서비스 인터페이스
 * Phase 3: 멀티 테넌트 사용자 지원
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface MultiTenantUserService {
    
    /**
     * 사용자가 접근할 수 있는 모든 테넌트 목록 조회
     * 
     * @param userId 사용자 ID
     * @return 접근 가능한 테넌트 목록
     */
    List<Tenant> getAccessibleTenants(Long userId);
    
    /**
     * 사용자가 멀티 테넌트 사용자인지 확인
     * 
     * @param userId 사용자 ID
     * @return 멀티 테넌트 사용자 여부 (2개 이상의 테넌트에 접근 가능)
     */
    boolean isMultiTenantUser(Long userId);
    
    /**
     * 사용자가 특정 테넌트에 접근할 수 있는지 확인 (userId 기반)
     * 
     * @param userId 사용자 ID
     * @param tenantId 테넌트 ID
     * @return 접근 가능 여부
     */
    boolean hasAccessToTenant(Long userId, String tenantId);
    
    /**
     * 사용자가 특정 테넌트에 접근할 수 있는지 확인 (이메일 기반)
     * 로그인 이메일과 테넌트별 권한을 명확하게 연결
     * 
     * @param email 로그인 이메일
     * @param tenantId 테넌트 ID
     * @return 접근 가능 여부
     */
    boolean hasAccessToTenantByEmail(String email, String tenantId);
    
    /**
     * 이메일로 접근 가능한 모든 테넌트 목록 조회
     * 로그인 이메일과 권한을 명확하게 연결
     * 
     * @param email 로그인 이메일
     * @return 접근 가능한 테넌트 목록
     */
    List<Tenant> getAccessibleTenantsByEmail(String email);
    
    /**
     * 사용자의 현재 테넌트 조회 (Branch를 통해)
     * 
     * @param user 사용자
     * @return 현재 테넌트 (없으면 null)
     */
    Tenant getCurrentTenant(User user);
    
    /**
     * 사용자의 기본 테넌트 조회 (가장 최근에 사용한 테넌트)
     * 
     * @param userId 사용자 ID
     * @return 기본 테넌트 (없으면 null)
     */
    Tenant getDefaultTenant(Long userId);
}

