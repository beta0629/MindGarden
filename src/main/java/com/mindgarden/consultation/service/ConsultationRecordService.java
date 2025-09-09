package com.mindgarden.consultation.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.ConsultationRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 상담일지 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface ConsultationRecordService {
    
    /**
     * 상담일지 목록 조회
     */
    Page<ConsultationRecord> getConsultationRecords(Long consultantId, Long clientId, Pageable pageable);
    
    /**
     * 상담일지 상세 조회
     */
    ConsultationRecord getConsultationRecordById(Long recordId);
    
    /**
     * 상담일지 작성
     */
    ConsultationRecord createConsultationRecord(Map<String, Object> recordData);
    
    /**
     * 상담일지 수정
     */
    ConsultationRecord updateConsultationRecord(Long recordId, Map<String, Object> recordData);
    
    /**
     * 상담일지 삭제
     */
    void deleteConsultationRecord(Long recordId);
    
    /**
     * 상담 ID로 상담일지 조회
     */
    List<ConsultationRecord> getConsultationRecordsByConsultationId(Long consultationId);
    
    /**
     * 상담사별 상담일지 목록 조회
     */
    Page<ConsultationRecord> getConsultationRecordsByConsultantId(Long consultantId, Pageable pageable);
    
    /**
     * 내담자별 상담일지 목록 조회
     */
    Page<ConsultationRecord> getConsultationRecordsByClientId(Long clientId, Pageable pageable);
    
    /**
     * 세션 완료 처리
     */
    ConsultationRecord completeSession(Long recordId);
    
    /**
     * 세션 미완료 처리
     */
    ConsultationRecord incompleteSession(Long recordId, String reason);
    
    /**
     * 상담일지 검색
     */
    Page<ConsultationRecord> searchConsultationRecords(Long userId, String userType, String keyword, Pageable pageable);
    
    /**
     * 위험도별 상담일지 조회
     */
    List<ConsultationRecord> getConsultationRecordsByRiskAssessment(String riskAssessment);
    
    /**
     * 진행도 점수 범위로 상담일지 조회
     */
    List<ConsultationRecord> getConsultationRecordsByProgressScoreRange(Integer minScore, Integer maxScore);
    
    /**
     * 상담사별 통계 조회
     */
    Map<String, Object> getConsultationStatistics(Long consultantId);
    
    /**
     * 내담자별 통계 조회
     */
    Map<String, Object> getClientStatistics(Long clientId);
    
    /**
     * 최근 상담일지 조회
     */
    List<ConsultationRecord> getRecentConsultationRecords(Long userId, String userType, int limit);
    
    /**
     * 상담일지 존재 여부 확인
     */
    boolean existsByConsultationId(Long consultationId);
    
    /**
     * 특정 날짜의 상담일지 조회
     */
    List<ConsultationRecord> getConsultationRecordsByDate(Long userId, String userType, LocalDate sessionDate);
    
    // 내담자별 회기별 조회
    Page<ConsultationRecord> getConsultationRecordsByClientAndSession(Long clientId, Integer sessionNumber, Pageable pageable);
    List<ConsultationRecord> getConsultationRecordsByClientOrderBySession(Long clientId);
    Map<Integer, List<ConsultationRecord>> getConsultationRecordsGroupedBySession(Long clientId);
}
