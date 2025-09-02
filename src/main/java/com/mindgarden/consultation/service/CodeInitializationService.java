package com.mindgarden.consultation.service;

/**
 * 코드 초기화 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface CodeInitializationService {
    
    /**
     * 기본 코드 그룹과 코드 값들을 초기화
     */
    void initializeDefaultCodes();
    
    /**
     * 특정 코드 그룹이 존재하는지 확인
     */
    boolean isCodeGroupExists(String groupCode);
}
