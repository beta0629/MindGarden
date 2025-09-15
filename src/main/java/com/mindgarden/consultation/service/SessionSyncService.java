package com.mindgarden.consultation.service;

import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.SessionExtensionRequest;

import java.util.Map;

/**
 * 회기 동기화 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface SessionSyncService {
    
    /**
     * 회기 추가 후 전체 시스템 동기화
     */
    void syncAfterSessionExtension(SessionExtensionRequest extensionRequest);
    
    /**
     * 회기 사용 후 전체 시스템 동기화
     */
    void syncAfterSessionUsage(Long mappingId, Long consultantId, Long clientId);
    
    /**
     * 매핑별 회기 수 검증 및 동기화
     */
    void validateAndSyncMappingSessions(Long mappingId);
    
    /**
     * 전체 시스템 회기 수 검증
     */
    Map<String, Object> validateAllSessions();
    
    /**
     * 회기 수 불일치 자동 수정
     */
    void fixSessionMismatches();
    
    /**
     * 회기 사용 로그 기록
     */
    void logSessionUsage(Long mappingId, String action, Integer sessions, String reason);
    
    /**
     * 회기 동기화 상태 조회
     */
    Map<String, Object> getSyncStatus();
}
