package com.coresolution.consultation.service;

import java.util.List;
import java.util.Map;

/**
 * 상담사 통계 정보 조회 서비스
 * - 상담사 정보와 통계를 통합 조회
 * - 중앙화된 데이터 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-20
 */
public interface ConsultantStatsService {
    
    /**
     * 상담사 정보 + 통계 정보 통합 조회
     * 
     * @param consultantId 상담사 ID
     * @return 상담사 정보 + 통계 정보 맵
     */
    Map<String, Object> getConsultantWithStats(Long consultantId);
    
    /**
     * 상담사 목록 + 통계 정보 일괄 조회
     * 
     * @return 상담사 목록 + 통계 정보
     */
    List<Map<String, Object>> getAllConsultantsWithStats();
    
    /**
     * 현재 활성 내담자 수 계산
     * 
     * @param consultantId 상담사 ID
     * @return 활성 내담자 수
     */
    Long calculateCurrentClients(Long consultantId);
    
    /**
     * 상담사 통계 계산
     * 
     * @param consultantId 상담사 ID
     * @return 통계 정보 맵
     */
    Map<String, Object> calculateConsultantStats(Long consultantId);
}
