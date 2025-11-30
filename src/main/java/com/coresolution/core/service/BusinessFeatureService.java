package com.coresolution.core.service;

import java.util.List;
import java.util.Set;

/**
 * 비즈니스 기능 서비스 인터페이스
 * 
 * 업종별 기능 및 설정을 동적으로 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-30
 */
public interface BusinessFeatureService {
    
    /**
     * 특정 business_type이 특정 기능을 지원하는지 확인
     * 
     * @param businessType 비즈니스 타입 (CONSULTATION, ACADEMY 등)
     * @param featureCode 기능 코드 (CONSULTANT_MANAGEMENT, CLASS_SCHEDULE 등)
     * @return 지원 여부
     */
    boolean supportsFeature(String businessType, String featureCode);
    
    /**
     * 특정 business_type의 지원 기능 목록 조회
     * 
     * @param businessType 비즈니스 타입
     * @return 기능 코드 Set
     */
    Set<String> getSupportedFeatures(String businessType);
    
    /**
     * 모든 business_type에서 공통으로 지원하는 기능 목록
     * 
     * @return 공통 기능 코드 Set
     */
    Set<String> getCommonFeatures();
    
    /**
     * 특정 테넌트의 business_type 조회
     * 
     * @param tenantId 테넌트 ID
     * @return business_type (없으면 null)
     */
    String getBusinessType(String tenantId);
    
    /**
     * 특정 테넌트가 특정 기능을 사용할 수 있는지 확인
     * 
     * @param tenantId 테넌트 ID
     * @param featureCode 기능 코드
     * @return 사용 가능 여부
     */
    boolean canUseFeature(String tenantId, String featureCode);
    
    /**
     * 현재 컨텍스트의 테넌트가 특정 기능을 사용할 수 있는지 확인
     * (TenantContext에서 tenantId 자동 조회)
     * 
     * @param featureCode 기능 코드
     * @return 사용 가능 여부
     */
    boolean canUseFeatureInCurrentContext(String featureCode);
    
    /**
     * 특정 business_type의 기본 컴포넌트 목록 조회
     * 
     * @param businessType 비즈니스 타입
     * @return 컴포넌트 코드 리스트
     */
    List<String> getDefaultComponents(String businessType);
    
    /**
     * 특정 business_type의 추천 요금제 ID 목록 조회
     * 
     * @param businessType 비즈니스 타입
     * @return 요금제 ID 리스트
     */
    List<Long> getRecommendedPlanIds(String businessType);
    
    /**
     * 특정 business_type의 기본 역할 템플릿 ID 목록 조회
     * 
     * @param businessType 비즈니스 타입
     * @return 역할 템플릿 ID 리스트
     */
    List<Long> getDefaultRoleTemplateIds(String businessType);
}
