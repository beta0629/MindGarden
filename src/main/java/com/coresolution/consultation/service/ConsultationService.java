package com.coresolution.consultation.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.entity.Consultation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 상담 관리 서비스 인터페이스
 * API 설계 문서에 명시된 상담 관리 비즈니스 로직 포함
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface ConsultationService extends BaseService<Consultation, Long> {
    
    // ==================== 상담 조회 메서드 ====================
    
    /**
     * 클라이언트 ID로 상담 조회
     */
    List<Consultation> findByClientId(Long clientId);
    
    /**
     * 상담사 ID로 상담 조회
     */
    List<Consultation> findByConsultantId(Long consultantId);
    
    /**
     * 상담사별 완료된 상담 건수 조회 (기간별)
     */
    int getCompletedConsultationCount(Long consultantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 상태별 상담 조회
     */
    List<Consultation> findByStatus(String status);
    
    /**
     * 우선순위별 상담 조회
     */
    List<Consultation> findByPriority(String priority);
    
    /**
     * 위험도별 상담 조회
     */
    List<Consultation> findByRiskLevel(String riskLevel);
    
    /**
     * 상담 방법별 조회
     */
    List<Consultation> findByConsultationMethod(String consultationMethod);
    
    /**
     * 긴급 상담 여부로 조회
     */
    List<Consultation> findByIsEmergency(Boolean isEmergency);
    
    /**
     * 첫 상담 여부로 조회
     */
    List<Consultation> findByIsFirstSession(Boolean isFirstSession);
    
    /**
     * 상담 날짜로 조회
     */
    List<Consultation> findByConsultationDate(LocalDate consultationDate);
    
    /**
     * 상담 날짜 범위로 조회
     */
    List<Consultation> findByConsultationDateBetween(LocalDate startDate, LocalDate endDate);
    
    /**
     * 복합 조건으로 상담 검색
     */
    List<Consultation> findByComplexCriteria(Long clientId, Long consultantId, String status, 
                                           String priority, String riskLevel, String consultationMethod, 
                                           Boolean isEmergency, Boolean isFirstSession, 
                                           LocalDate startDate, LocalDate endDate);
    
    /**
     * 내담자별 상담 히스토리 조회 (상담사 정보 포함)
     */
    List<Map<String, Object>> getClientConsultationHistory(Long clientId);
    
    // ==================== 상담 예약 및 관리 ====================
    
    /**
     * 상담 예약 생성
     */
    Consultation createConsultationRequest(Consultation consultation);
    
    /**
     * 상담 예약 확정
     */
    Consultation confirmConsultation(Long consultationId, Long consultantId);
    
    /**
     * 상담 예약 취소
     */
    Consultation cancelConsultation(Long consultationId, String reason);
    
    /**
     * 상담 예약 변경
     */
    Consultation rescheduleConsultation(Long consultationId, LocalDateTime newDateTime);
    
    /**
     * 상담 시작
     */
    Consultation startConsultation(Long consultationId);
    
    /**
     * 상담 완료
     */
    Consultation completeConsultation(Long consultationId, String notes, int rating);
    
    /**
     * 상담 중단
     */
    Consultation pauseConsultation(Long consultationId, String reason);
    
    /**
     * 상담 재개
     */
    Consultation resumeConsultation(Long consultationId);
    
    // ==================== 상담 스케줄링 ====================
    
    /**
     * 상담사별 상담 가능 시간 조회
     */
    List<Map<String, Object>> getAvailableTimeSlots(Long consultantId, LocalDate date);
    
    /**
     * 상담사별 상담 스케줄 조회
     */
    List<Map<String, Object>> getConsultantSchedule(Long consultantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 클라이언트별 상담 스케줄 조회
     */
    List<Map<String, Object>> getClientSchedule(Long clientId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 상담 시간 충돌 검사
     */
    boolean hasTimeConflict(Long consultantId, LocalDateTime startTime, LocalDateTime endTime);
    
    // ==================== 상담 평가 및 리뷰 ====================
    
    /**
     * 상담 평가 등록
     */
    void addConsultationReview(Long consultationId, int rating, String review, String clientId);
    
    /**
     * 상담 평가 수정
     */
    void updateConsultationReview(Long consultationId, int rating, String review);
    
    /**
     * 상담 평가 조회
     */
    Map<String, Object> getConsultationReview(Long consultationId);
    
    /**
     * 상담사별 평균 평점 조회
     */
    double getConsultantAverageRating(Long consultantId);
    
    // === 통계 메서드들 ===
    
    /**
     * 상태별 상담 개수 조회
     */
    long countConsultationsByStatus(String status);
    
    /**
     * 클라이언트별 상담 개수 조회
     */
    long countConsultationsByClient(Long clientId);
    
    /**
     * 상담사별 상담 개수 조회
     */
    long countConsultationsByConsultant(Long consultantId);
    
    // === 기본 CRUD 메서드들 ===
    
    /**
     * ID로 상담 조회
     */
    Optional<Consultation> findById(Long id);
    
    // ==================== 상담 기록 관리 ====================
    
    /**
     * 상담 노트 추가
     */
    void addConsultationNote(Long consultationId, String note, String authorId);
    
    /**
     * 상담 노트 수정
     */
    void updateConsultationNote(Long noteId, String note);
    
    /**
     * 상담 노트 삭제
     */
    void deleteConsultationNote(Long noteId);
    
    /**
     * 상담 노트 목록 조회
     */
    List<Map<String, Object>> getConsultationNotes(Long consultationId);
    
    /**
     * 상담 기록 내보내기
     */
    byte[] exportConsultationRecord(Long consultationId, String format);
    
    // ==================== 긴급 상담 관리 ====================
    
    /**
     * 긴급 상담 요청
     */
    Consultation requestEmergencyConsultation(Long clientId, String emergencyReason);
    
    /**
     * 긴급 상담 할당
     */
    Consultation assignEmergencyConsultation(Long consultationId, Long consultantId);
    
    /**
     * 긴급 상담 우선순위 조정
     */
    void updateEmergencyPriority(Long consultationId, int priority);
    
    /**
     * 긴급 상담 목록 조회
     */
    List<Consultation> getEmergencyConsultations();
    
    // ==================== 상담 통계 및 분석 ====================
    
    /**
     * 전체 상담 통계 조회
     */
    Map<String, Object> getOverallConsultationStatistics();
    
    /**
     * 상태별 상담 통계 조회
     */
    Map<String, Object> getConsultationStatisticsByStatus();
    
    /**
     * 우선순위별 상담 통계 조회
     */
    Map<String, Object> getConsultationStatisticsByPriority();
    
    /**
     * 위험도별 상담 통계 조회
     */
    Map<String, Object> getConsultationStatisticsByRiskLevel();
    
    /**
     * 상담 방법별 통계 조회
     */
    Map<String, Object> getConsultationStatisticsByMethod();
    
    /**
     * 날짜별 상담 통계 조회
     */
    Map<String, Object> getConsultationStatisticsByDate(LocalDate startDate, LocalDate endDate);
    
    /**
     * 클라이언트별 상담 통계 조회
     */
    Map<String, Object> getClientConsultationStatistics(Long clientId);
    
    /**
     * 상담사별 상담 통계 조회
     */
    Map<String, Object> getConsultantConsultationStatistics(Long consultantId);
    
    /**
     * 상담 성과 분석
     */
    Map<String, Object> getConsultationPerformanceAnalysis(LocalDate startDate, LocalDate endDate);
    
    // ==================== 상담 품질 관리 ====================
    
    /**
     * 상담 품질 평가
     */
    void evaluateConsultationQuality(Long consultationId, Map<String, Object> qualityMetrics);
    
    /**
     * 상담 품질 보고서 생성
     */
    Map<String, Object> generateQualityReport(Long consultantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 상담 품질 개선 제안
     */
    List<String> getQualityImprovementSuggestions(Long consultantId);
    
    // ==================== 상담 비용 관리 ====================
    
    /**
     * 상담 비용 계산
     */
    Map<String, Object> calculateConsultationCost(Long consultationId);
    
    /**
     * 상담 비용 할인 적용
     */
    void applyDiscount(Long consultationId, String discountType, double discountAmount);
    
    /**
     * 상담 비용 정산
     */
    void settleConsultationCost(Long consultationId, String paymentMethod);
    
    // ==================== 상담 알림 및 리마인더 ====================
    
    /**
     * 상담 예약 확인 알림 발송
     */
    void sendConsultationConfirmation(Long consultationId);
    
    /**
     * 상담 리마인더 발송
     */
    void sendConsultationReminder(Long consultationId);
    
    /**
     * 상담 변경 알림 발송
     */
    void sendConsultationChangeNotification(Long consultationId, String changeType);
    
    /**
     * 상담 완료 알림 발송
     */
    void sendConsultationCompletionNotification(Long consultationId);
    
    // ==================== 상담 검색 및 필터링 ====================
    
    /**
     * 고급 상담 검색
     */
    Page<Consultation> searchConsultations(Map<String, Object> searchCriteria, Pageable pageable);
    
    /**
     * 상담 히스토리 검색
     */
    List<Consultation> searchConsultationHistory(Long clientId, Map<String, Object> searchCriteria);
    
    /**
     * 상담사별 상담 히스토리 검색
     */
    List<Consultation> searchConsultantHistory(Long consultantId, Map<String, Object> searchCriteria);
    
    // ==================== 상담 데이터 관리 ====================
    
    /**
     * 상담 데이터 백업
     */
    void backupConsultationData(LocalDate startDate, LocalDate endDate);
    
    /**
     * 상담 데이터 복원
     */
    void restoreConsultationData(String backupId);
    
    /**
     * 상담 데이터 아카이브
     */
    void archiveConsultationData(LocalDate beforeDate);
    
    /**
     * 상담 데이터 정리
     */
    void cleanupConsultationData(LocalDate beforeDate);
}
