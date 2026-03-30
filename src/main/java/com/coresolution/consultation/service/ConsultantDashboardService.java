package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.dto.response.HighPriorityClientResponse;
import com.coresolution.consultation.dto.response.IncompleteRecordResponse;
import com.coresolution.consultation.dto.response.UpcomingPreparationResponse;

/**
 * 상담사 대시보드 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-03-09
 */
public interface ConsultantDashboardService {
    
    /**
     * 미작성 상담일지 목록 조회
     * 
     * @param consultantId 상담사 ID
     * @param limit 최대 개수 (기본값: 10)
     * @return 미작성 상담일지 목록
     */
    List<IncompleteRecordResponse> getIncompleteRecords(Long consultantId, Integer limit);
    
    /**
     * 긴급 확인 필요 내담자 목록 조회
     * 
     * @param consultantId 상담사 ID
     * @param limit 최대 개수 (기본값: 5)
     * @return 긴급 내담자 목록
     */
    List<HighPriorityClientResponse> getHighPriorityClients(Long consultantId, Integer limit);
    
    /**
     * 다음 상담 준비 정보 조회
     * 
     * @param consultantId 상담사 ID
     * @param hoursAhead 앞으로 몇 시간 이내 (기본값: 2시간)
     * @return 다음 상담 목록
     */
    List<UpcomingPreparationResponse> getUpcomingPreparation(Long consultantId, Integer hoursAhead);
}
