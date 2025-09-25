package com.mindgarden.consultation.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 상담일지 미작성 알림 PL/SQL 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
public interface PlSqlConsultationRecordAlertService {
    
    /**
     * 상담일지 미작성 확인 및 알림 생성
     * 
     * @param checkDate 확인할 날짜
     * @param branchCode 지점 코드 (null이면 전체)
     * @return 결과 정보
     */
    Map<String, Object> checkMissingConsultationRecords(LocalDate checkDate, String branchCode);
    
    /**
     * 상담일지 미작성 알림 조회
     * 
     * @param branchCode 지점 코드
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 알림 목록
     */
    Map<String, Object> getMissingConsultationRecordAlerts(String branchCode, LocalDate startDate, LocalDate endDate);
    
    /**
     * 상담일지 작성 완료시 알림 해제
     * 
     * @param consultationId 상담 ID
     * @param resolvedBy 해제자
     * @return 결과 정보
     */
    Map<String, Object> resolveConsultationRecordAlert(Long consultationId, String resolvedBy);
    
    /**
     * 상담일지 미작성 통계 조회
     * 
     * @param branchCode 지점 코드
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 통계 정보
     */
    Map<String, Object> getConsultationRecordMissingStatistics(String branchCode, LocalDate startDate, LocalDate endDate);
    
    /**
     * 상담일지 미작성 알림 자동 생성 (스케줄러용)
     * 
     * @param daysBack 며칠 전까지 확인할지
     * @return 결과 정보
     */
    Map<String, Object> autoCreateMissingConsultationRecordAlerts(int daysBack);
    
    /**
     * 특정 상담사의 상담일지 미작성 현황 조회
     * 
     * @param consultantId 상담사 ID
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 미작성 현황
     */
    Map<String, Object> getConsultantMissingRecords(Long consultantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 상담일지 미작성 알림 일괄 해제
     * 
     * @param consultantId 상담사 ID (null이면 전체)
     * @param resolvedBy 해제자
     * @return 결과 정보
     */
    Map<String, Object> resolveAllConsultationRecordAlerts(Long consultantId, String resolvedBy);
}
