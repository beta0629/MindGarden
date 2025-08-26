package com.mindgarden.consultation.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.mindgarden.consultation.entity.Client;
import com.mindgarden.consultation.entity.Consultant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 상담사 관리 서비스 인터페이스
 * API 설계 문서에 명시된 상담사 관리 비즈니스 로직 포함
 */
public interface ConsultantService extends BaseService<Consultant, Long> {
    
    // === 상담사 조회 및 검색 ===
    
    /**
     * 전문 분야별 상담사 목록 조회
     */
    List<Consultant> findBySpecialty(String specialty);
    
    /**
     * 경력 연차별 상담사 목록 조회
     */
    List<Consultant> findByExperienceGreaterThanEqual(int experience);
    
    /**
     * 평점별 상담사 목록 조회
     */
    List<Consultant> findByRatingGreaterThanEqual(double rating);
    
    /**
     * 상담 가능한 상담사 목록 조회
     */
    List<Consultant> findAvailableConsultants();
    
    /**
     * 복합 조건으로 상담사 검색
     */
    List<Consultant> findByComplexCriteria(String specialty, Integer minExperience, 
                                         Double minRating, Boolean available);
    
    /**
     * 상담사 상세 정보 조회 (평점, 리뷰 포함)
     */
    Optional<Consultant> findByIdWithDetails(Long id);
    
    // === 내담자 관리 ===
    
    /**
     * 상담사별 내담자 목록 조회
     */
    Page<Client> findClientsByConsultantId(Long consultantId, String status, Pageable pageable);
    
    /**
     * 상담사별 내담자 상세 정보 조회
     */
    Optional<Client> findClientByConsultantId(Long consultantId, Long clientId);
    
    /**
     * 상담사별 내담자 프로필 수정
     */
    Client updateClientProfile(Long consultantId, Long clientId, Client updateData);
    
    /**
     * 상담사별 내담자 통계 정보
     */
    Map<String, Object> getClientStatistics(Long consultantId);
    
    // === 스케줄 관리 ===
    
    /**
     * 상담사별 상담 가능 시간대 조회
     */
    List<Map<String, Object>> getAvailableSlots(Long consultantId, LocalDate date);
    
    /**
     * 상담사별 스케줄 등록
     */
    void registerSchedule(Long consultantId, LocalDate date, LocalTime startTime, LocalTime endTime);
    
    /**
     * 상담사별 스케줄 수정
     */
    void updateSchedule(Long consultantId, Long scheduleId, LocalDate date, LocalTime startTime, LocalTime endTime);
    
    /**
     * 상담사별 스케줄 삭제
     */
    void deleteSchedule(Long consultantId, Long scheduleId);
    
    // === 상담 관리 ===
    
    /**
     * 상담사별 상담 예약 목록 조회
     */
    List<Map<String, Object>> getConsultationBookings(Long consultantId, String status);
    
    /**
     * 상담사별 상담 예약 확정
     */
    void confirmConsultation(Long consultantId, Long consultationId);
    
    /**
     * 상담사별 상담 예약 취소
     */
    void cancelConsultation(Long consultantId, Long consultationId);
    
    /**
     * 상담사별 상담 완료 처리
     */
    void completeConsultation(Long consultantId, Long consultationId, String notes, int rating);
    
    // === 통계 및 분석 ===
    
    /**
     * 상담사별 상담 통계
     */
    Map<String, Object> getConsultationStatistics(Long consultantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 상담사별 수익 통계
     */
    Map<String, Object> getRevenueStatistics(Long consultantId, LocalDate startDate, LocalDate endDate);
    
    /**
     * 상담사별 고객 만족도 분석
     */
    Map<String, Object> getSatisfactionAnalysis(Long consultantId);
    
    // === 프로필 관리 ===
    
    /**
     * 상담사 프로필 수정
     */
    Consultant updateProfile(Long consultantId, Consultant updateData);
    
    /**
     * 상담사 전문 분야 수정
     */
    void updateSpecialty(Long consultantId, String specialty);
    
    /**
     * 상담사 경력 정보 수정
     */
    void updateExperience(Long consultantId, int experience, String description);
    
    /**
     * 상담사 자격증 정보 수정
     */
    void updateCertifications(Long consultantId, List<String> certifications);
    
    // === 상태 관리 ===
    
    /**
     * 상담사 상태 변경 (활성/비활성/휴식)
     */
    void updateStatus(Long consultantId, String status);
    
    /**
     * 상담사 상담 가능 여부 변경
     */
    void updateAvailability(Long consultantId, boolean available);
    
    /**
     * 상담사 휴가 등록
     */
    void registerVacation(Long consultantId, LocalDate startDate, LocalDate endDate, String reason);
    
    /**
     * 상담사 휴가 취소
     */
    void cancelVacation(Long consultantId, Long vacationId);
}
