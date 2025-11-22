package com.coresolution.core.service;

import java.util.Map;

/**
 * 비즈니스 규칙 엔진 인터페이스
 * 메타 시스템: DB에 저장된 규칙을 평가하여 실행
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */
public interface BusinessRuleEngine {
    
    /**
     * 규칙 평가 및 실행
     * 
     * @param ruleCode 규칙 코드
     * @param context 평가 컨텍스트 (user, entity 등)
     * @return 실행 결과
     */
    Object evaluate(String ruleCode, Map<String, Object> context);
    
    /**
     * 규칙 평가 (테넌트별)
     * 
     * @param ruleCode 규칙 코드
     * @param tenantId 테넌트 ID
     * @param context 평가 컨텍스트
     * @return 실행 결과
     */
    Object evaluate(String ruleCode, String tenantId, Map<String, Object> context);
    
    /**
     * 규칙 존재 여부 확인
     * 
     * @param ruleCode 규칙 코드
     * @return 존재 여부
     */
    boolean ruleExists(String ruleCode);
    
    /**
     * 규칙 존재 여부 확인 (테넌트별)
     * 
     * @param ruleCode 규칙 코드
     * @param tenantId 테넌트 ID
     * @return 존재 여부
     */
    boolean ruleExists(String ruleCode, String tenantId);
}

