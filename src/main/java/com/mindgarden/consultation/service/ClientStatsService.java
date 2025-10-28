package com.mindgarden.consultation.service;

import java.util.List;
import java.util.Map;

/**
 * 내담자 통계 정보 조회 서비스
 * - 내담자 정보와 통계를 통합 조회
 * - 중앙화된 데이터 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-20
 */
public interface ClientStatsService {
    
    /**
     * 내담자 정보 + 통계 정보 통합 조회
     * 
     * @param clientId 내담자 ID
     * @return 내담자 정보 + 통계 정보 맵
     */
    Map<String, Object> getClientWithStats(Long clientId);
    
    /**
     * 내담자 목록 + 통계 정보 일괄 조회
     * 
     * @return 내담자 목록 + 통계 정보
     */
    List<Map<String, Object>> getAllClientsWithStats();
    
    /**
     * 현재 활성 매핑 수 계산
     * 
     * @param clientId 내담자 ID
     * @return 활성 매핑 수
     */
    Long calculateCurrentConsultants(Long clientId);
    
    /**
     * 내담자 통계 계산
     * 
     * @param clientId 내담자 ID
     * @return 통계 정보 맵
     */
    Map<String, Object> calculateClientStats(Long clientId);
}

