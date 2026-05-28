package com.coresolution.consultation.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.ConsultationRecord;
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
     * 상담일지 목록 조회 (세션 일자 범위 필터 포함).
     *
     * <p>어드민 "상담일지 조회" 화면에서 기간 필터를 백엔드로 전달하여
     * {@code MAX_PAGE_SIZE} 캡으로 인한 과거 데이터 미노출 회귀를 방지한다.
     * {@code startDate}/{@code endDate} 가 모두 null 이면 기존 동작과 동일하다.</p>
     *
     * @param consultantId 상담사 ID (nullable)
     * @param clientId 내담자 ID (nullable)
     * @param startDate 세션 일자 시작 (nullable)
     * @param endDate 세션 일자 종료 (nullable)
     * @param pageable 페이징 정보
     * @return 페이징된 상담일지 목록 (session_date DESC)
     * @author MindGarden
     * @since 2026-05-29
     */
    Page<ConsultationRecord> getConsultationRecords(Long consultantId, Long clientId,
        LocalDate startDate, LocalDate endDate, Pageable pageable);
    
    /**
     * 상담일지 상세 조회
     */
    ConsultationRecord getConsultationRecordById(Long recordId);
    
    /**
     * 상담일지 작성
     */
    ConsultationRecord createConsultationRecord(Map<String, Object> recordData);
    
    /**
     * 특정 스케줄에 대한 상담일지 작성 여부 확인
     */
    boolean hasConsultationRecordForSchedule(Long scheduleId, Long consultantId, LocalDate sessionDate);
    
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
