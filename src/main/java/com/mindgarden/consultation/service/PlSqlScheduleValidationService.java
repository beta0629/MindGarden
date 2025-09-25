package com.mindgarden.consultation.service;

import java.time.LocalDate;
import java.util.Map;

/**
 * PL/SQL 기반 스케줄 검증 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface PlSqlScheduleValidationService {
    
    /**
     * 스케줄 완료 전 상담일지 작성 여부 확인
     */
    Map<String, Object> validateConsultationRecordBeforeCompletion(
        Long scheduleId, Long consultantId, LocalDate sessionDate);
    
    /**
     * 상담일지 미작성 알림 생성
     */
    Map<String, Object> createConsultationRecordReminder(
        Long scheduleId, Long consultantId, Long clientId, 
        LocalDate sessionDate, String title);
    
    /**
     * 스케줄 자동 완료 처리 (상담일지 검증 포함)
     */
    Map<String, Object> processScheduleAutoCompletion(
        Long scheduleId, Long consultantId, LocalDate sessionDate, boolean forceComplete);
    
    /**
     * 일괄 스케줄 완료 처리 (상담일지 검증 포함)
     */
    Map<String, Object> processBatchScheduleCompletion(String branchCode);
}
