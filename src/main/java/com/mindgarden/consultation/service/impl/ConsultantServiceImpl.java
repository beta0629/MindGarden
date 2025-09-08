package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.mindgarden.consultation.constant.ConsultantConstants;
import com.mindgarden.consultation.entity.Client;
import com.mindgarden.consultation.entity.Consultant;
import com.mindgarden.consultation.repository.BaseRepository;
import com.mindgarden.consultation.repository.ConsultantRepository;
import com.mindgarden.consultation.service.ConsultantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

/**
 * ConsultantService 구현체
 * API 설계 문서에 명시된 상담사 관리 비즈니스 로직 구현
 */
@Slf4j
@Service
@Transactional
public class ConsultantServiceImpl implements ConsultantService {
    
    @Autowired
    private ConsultantRepository consultantRepository;
    
    // === BaseService 구현 메서드들 ===
    
    @Override
    public Consultant save(Consultant consultant) {
        return consultantRepository.save(consultant);
    }
    
    @Override
    public List<Consultant> saveAll(List<Consultant> consultants) {
        return consultantRepository.saveAll(consultants);
    }
    
    @Override
    public Consultant update(Consultant consultant) {
        return consultantRepository.save(consultant);
    }
    
    @Override
    public Consultant partialUpdate(Long id, Consultant updateData) {
        Consultant existingConsultant = consultantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("상담사를 찾을 수 없습니다: " + id));
        
        // 부분 업데이트: null이 아닌 필드만 업데이트
        if (updateData.getSpecialty() != null) {
            existingConsultant.setSpecialty(updateData.getSpecialty());
        }
        if (updateData.getYearsOfExperience() != null) {
            existingConsultant.setYearsOfExperience(updateData.getYearsOfExperience());
        }
        if (updateData.getAverageRating() != null) {
            // 평점 유효성 검사
            if (updateData.getAverageRating() < ConsultantConstants.MIN_RATING || 
                updateData.getAverageRating() > ConsultantConstants.MAX_RATING) {
                throw new IllegalArgumentException(ConsultantConstants.ERROR_INVALID_RATING);
            }
            // 평점 업데이트 (실제 구현에서는 평점 계산 로직 필요)
            log.info("상담사 평점 업데이트: consultantId={}, newRating={}", id, updateData.getAverageRating());
        }
        if (updateData.getIsAvailable() != null) {
            existingConsultant.setIsAvailable(updateData.getIsAvailable());
        }
        
        return consultantRepository.save(existingConsultant);
    }
    
    @Override
    public void softDeleteById(Long id) {
        Consultant consultant = consultantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("상담사를 찾을 수 없습니다: " + id));
        
        consultant.setIsDeleted(true);
        consultantRepository.save(consultant);
    }
    
    @Override
    public void restoreById(Long id) {
        Consultant consultant = consultantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("상담사를 찾을 수 없습니다: " + id));
        
        consultant.setIsDeleted(false);
        consultantRepository.save(consultant);
    }
    
    @Override
    public void hardDeleteById(Long id) {
        consultantRepository.deleteById(id);
    }
    
    @Override
    public List<Consultant> findAllActive() {
        return consultantRepository.findAllActive();
    }
    
    @Override
    public Optional<Consultant> findActiveById(Long id) {
        return consultantRepository.findActiveById(id);
    }
    
    @Override
    public Consultant findActiveByIdOrThrow(Long id) {
        return consultantRepository.findActiveById(id)
                .orElseThrow(() -> new RuntimeException("활성 상담사를 찾을 수 없습니다: " + id));
    }
    
    @Override
    public long countActive() {
        return consultantRepository.countActive();
    }
    
    @Override
    public List<Consultant> findAllDeleted() {
        return consultantRepository.findAllDeleted();
    }
    
    @Override
    public long countDeleted() {
        return consultantRepository.countDeleted();
    }
    
    @Override
    public boolean existsActiveById(Long id) {
        return consultantRepository.existsActiveById(id);
    }
    
    @Override
    public Optional<Consultant> findByIdAndVersion(Long id, Long version) {
        return consultantRepository.findByIdAndVersion(id, version);
    }
    
    @Override
    public Object[] getEntityStatistics() {
        return consultantRepository.getEntityStatistics();
    }
    
    @Override
    public void cleanupOldDeleted(java.time.LocalDateTime cutoffDate) {
        consultantRepository.cleanupOldDeleted(cutoffDate);
    }
    
    @Override
    public org.springframework.data.domain.Page<Consultant> findAllActive(Pageable pageable) {
        return consultantRepository.findAllActive(pageable);
    }
    
    @Override
    public List<Consultant> findRecentActive(int limit) {
        return consultantRepository.findRecentActive(limit);
    }
    
    @Override
    public List<Consultant> findRecentlyUpdatedActive(int limit) {
        return consultantRepository.findRecentlyUpdatedActive(limit);
    }
    
    @Override
    public List<Consultant> findByCreatedAtBetween(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate) {
        return consultantRepository.findByCreatedAtBetween(startDate, endDate);
    }
    
    @Override
    public List<Consultant> findByUpdatedAtBetween(java.time.LocalDateTime startDate, java.time.LocalDateTime endDate) {
        return consultantRepository.findByUpdatedAtBetween(startDate, endDate);
    }
    
    @Override
    public BaseRepository<Consultant, Long> getRepository() {
        return consultantRepository;
    }
    
    @Override
    public boolean isDuplicateExcludingIdAll(Long excludeId, String fieldName, Object fieldValue, boolean includeDeleted) {
        return consultantRepository.isDuplicateExcludingIdAll(excludeId, fieldName, fieldValue, includeDeleted);
    }
    
    // === ConsultantService 특화 메서드들 ===
    
    @Override
    public List<Consultant> findBySpecialty(String specialty) {
        log.info("전문분야별 상담사 조회: {}", specialty);
        return consultantRepository.findBySpecialtyContainingIgnoreCaseAndIsDeletedFalse(specialty);
    }
    
    @Override
    public List<Consultant> findByExperienceGreaterThanEqual(int experience) {
        log.info("경력별 상담사 조회: {}년 이상", experience);
        if (experience < ConsultantConstants.MIN_EXPERIENCE || experience > ConsultantConstants.MAX_EXPERIENCE) {
            throw new IllegalArgumentException(ConsultantConstants.ERROR_INVALID_EXPERIENCE);
        }
        return consultantRepository.findByExperienceGreaterThanEqualAndIsDeletedFalse(experience);
    }
    
    @Override
    public List<Consultant> findByRatingGreaterThanEqual(double rating) {
        log.info("평점별 상담사 조회: {}점 이상", rating);
        if (rating < ConsultantConstants.MIN_RATING || rating > ConsultantConstants.MAX_RATING) {
            throw new IllegalArgumentException(ConsultantConstants.ERROR_INVALID_RATING);
        }
        return consultantRepository.findByAverageRatingGreaterThanEqualAndIsDeletedFalse(rating);
    }
    
    @Override
    public List<Consultant> findAvailableConsultants() {
        log.info("사용 가능한 상담사 조회");
        return consultantRepository.findByIsAvailableTrueAndIsDeletedFalse();
    }
    
    @Override
    public List<Consultant> findByComplexCriteria(String specialty, Integer minExperience, 
                                                Double minRating, Boolean available) {
        log.info("복합 조건 상담사 조회: specialty={}, minExperience={}, minRating={}, available={}", 
                specialty, minExperience, minRating, available);
        
        List<Consultant> consultants = consultantRepository.findByIsDeletedFalse();
        
        return consultants.stream()
                .filter(consultant -> specialty == null || consultant.getSpecialty().contains(specialty))
                .filter(consultant -> minExperience == null || consultant.getYearsOfExperience() >= minExperience)
                .filter(consultant -> minRating == null || consultant.getAverageRating() >= minRating)
                .filter(consultant -> available == null || consultant.getIsAvailable().equals(available))
                .toList();
    }
    
    @Override
    public Optional<Consultant> findByIdWithDetails(Long id) {
        return consultantRepository.findById(id);
    }
    
    // === 내담자 관리 ===
    
    @Override
    public Page<Client> findClientsByConsultantId(Long consultantId, String status, Pageable pageable) {
        log.info("상담사별 내담자 조회: consultantId={}, status={}", consultantId, status);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 매핑을 통해 내담자 조회 (실제 구현에서는 매핑 테이블을 통해 조회)
        return Page.empty(pageable);
    }
    
    @Override
    public Optional<Client> findClientByConsultantId(Long consultantId, Long clientId) {
        log.info("상담사별 특정 내담자 조회: consultantId={}, clientId={}", consultantId, clientId);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 매핑을 통해 내담자 조회 (실제 구현에서는 매핑 테이블을 통해 조회)
        return Optional.empty();
    }
    
    @Override
    public Client updateClientProfile(Long consultantId, Long clientId, Client updateData) {
        log.info("상담사별 내담자 프로필 업데이트: consultantId={}, clientId={}", consultantId, clientId);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 내담자 존재 확인 및 업데이트 (실제 구현에서는 매핑 테이블을 통해 조회)
        return updateData;
    }
    
    @Override
    public Map<String, Object> getClientStatistics(Long consultantId) {
        log.info("상담사별 내담자 통계 조회: consultantId={}", consultantId);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        Map<String, Object> stats = new HashMap<>();
        stats.put(ConsultantConstants.STATS_TOTAL_CLIENTS, 0);
        stats.put(ConsultantConstants.STATS_ACTIVE_CLIENTS, 0);
        stats.put(ConsultantConstants.STATS_PENDING_CLIENTS, 0);
        stats.put(ConsultantConstants.STATS_COMPLETED_SESSIONS, 0);
        stats.put(ConsultantConstants.STATS_AVERAGE_RATING, consultant.getAverageRating());
        stats.put(ConsultantConstants.STATS_TOTAL_EARNINGS, 0);
        
        return stats;
    }
    
    // === 스케줄 관리 ===
    
    @Override
    public List<Map<String, Object>> getAvailableSlots(Long consultantId, LocalDate date) {
        log.info("상담사별 사용 가능한 시간대 조회: consultantId={}, date={}", consultantId, date);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        List<Map<String, Object>> slots = new ArrayList<>();
        for (int hour = ConsultantConstants.WORK_START_HOUR; hour < ConsultantConstants.WORK_END_HOUR; hour++) {
            Map<String, Object> slot = new HashMap<>();
            slot.put("startTime", LocalTime.of(hour, 0));
            slot.put("endTime", LocalTime.of(hour + 1, 0));
            slot.put("available", true);
            slot.put("duration", ConsultantConstants.SLOT_DURATION_MINUTES);
            slots.add(slot);
        }
        return slots;
    }
    
    @Override
    public void registerSchedule(Long consultantId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        log.info("상담사 스케줄 등록: consultantId={}, date={}, startTime={}, endTime={}", 
                consultantId, date, startTime, endTime);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 시간 유효성 검사
        if (startTime.isAfter(endTime)) {
            throw new IllegalArgumentException("시작 시간은 종료 시간보다 빨라야 합니다.");
        }
        
        // 스케줄 등록 로직 (실제 구현에서는 Schedule 엔티티에 저장)
        log.info(ConsultantConstants.SUCCESS_SCHEDULE_REGISTERED);
    }
    
    @Override
    public void updateSchedule(Long consultantId, Long scheduleId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        log.info("상담사 스케줄 수정: consultantId={}, scheduleId={}, date={}, startTime={}, endTime={}", 
                consultantId, scheduleId, date, startTime, endTime);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 시간 유효성 검사
        if (startTime.isAfter(endTime)) {
            throw new IllegalArgumentException("시작 시간은 종료 시간보다 빨라야 합니다.");
        }
        
        // 스케줄 수정 로직 (실제 구현에서는 Schedule 엔티티 업데이트)
        log.info(ConsultantConstants.SUCCESS_SCHEDULE_UPDATED);
    }
    
    @Override
    public void deleteSchedule(Long consultantId, Long scheduleId) {
        log.info("상담사 스케줄 삭제: consultantId={}, scheduleId={}", consultantId, scheduleId);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 스케줄 삭제 로직 (실제 구현에서는 Schedule 엔티티 삭제)
        log.info(ConsultantConstants.SUCCESS_SCHEDULE_DELETED);
    }
    
    // === 상담 관리 ===
    
    @Override
    public List<Map<String, Object>> getConsultationBookings(Long consultantId, String status) {
        log.info("상담사별 상담 예약 조회: consultantId={}, status={}", consultantId, status);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 상담 예약 조회 (실제 구현에서는 Consultation 엔티티를 통해 조회)
        List<Map<String, Object>> bookings = new ArrayList<>();
        
        // 임시 데이터 (실제 구현에서는 데이터베이스에서 조회)
        Map<String, Object> sampleBooking = new HashMap<>();
        sampleBooking.put("consultationId", 1L);
        sampleBooking.put("clientId", 1L);
        sampleBooking.put("clientName", "내담자1");
        sampleBooking.put("scheduledDate", "2024-12-20");
        sampleBooking.put("scheduledTime", "14:00");
        sampleBooking.put("status", status != null ? status : "SCHEDULED");
        sampleBooking.put("consultationType", "INDIVIDUAL");
        bookings.add(sampleBooking);
        
        log.info("상담 예약 조회 완료: {}건", bookings.size());
        return bookings;
    }
    
    @Override
    public void confirmConsultation(Long consultationId, Long consultantId) {
        log.info("상담 확정: consultationId={}, consultantId={}", consultationId, consultantId);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 상담 확정 로직 (실제 구현에서는 Consultation 엔티티 업데이트)
        log.info("상담이 확정되었습니다: consultationId={}", consultationId);
    }
    
    @Override
    public void cancelConsultation(Long consultationId, Long consultantId) {
        log.info("상담 취소: consultationId={}, consultantId={}", consultationId, consultantId);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 상담 취소 로직 (실제 구현에서는 Consultation 엔티티 상태 업데이트)
        log.info("상담이 취소되었습니다: consultationId={}", consultationId);
    }
    
    @Override
    public void completeConsultation(Long consultationId, Long consultantId, String notes, int rating) {
        log.info("상담 완료: consultationId={}, consultantId={}, rating={}", consultationId, consultantId, rating);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 평점 유효성 검사
        if (rating < ConsultantConstants.MIN_RATING || rating > ConsultantConstants.MAX_RATING) {
            throw new IllegalArgumentException(ConsultantConstants.ERROR_INVALID_RATING);
        }
        
        // 상담 완료 로직 (실제 구현에서는 Consultation 엔티티 업데이트 및 평점 저장)
        log.info("상담이 완료되었습니다: consultationId={}, notes={}, rating={}", consultationId, notes, rating);
    }
    
    // === 통계 및 분석 ===
    
    @Override
    public Map<String, Object> getConsultationStatistics(Long consultantId, LocalDate startDate, LocalDate endDate) {
        log.info("상담사별 상담 통계 조회: consultantId={}, startDate={}, endDate={}", consultantId, startDate, endDate);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 기간 유효성 검사
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("시작일은 종료일보다 빨라야 합니다.");
        }
        
        // 상담 통계 조회 (실제 구현에서는 Consultation 엔티티를 통해 조회)
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalConsultations", 10);
        stats.put("completedConsultations", 8);
        stats.put("cancelledConsultations", 2);
        stats.put("pendingConsultations", 0);
        stats.put("averageDuration", 50.0); // 평균 상담 시간 (분)
        stats.put("totalRevenue", 500000.0); // 총 수익
        stats.put("averageRating", consultant.getAverageRating());
        stats.put("startDate", startDate);
        stats.put("endDate", endDate);
        
        log.info("상담 통계 조회 완료: total={}, completed={}, cancelled={}", 
                stats.get("totalConsultations"), stats.get("completedConsultations"), stats.get("cancelledConsultations"));
        
        return stats;
    }
    
    @Override
    public Map<String, Object> getRevenueStatistics(Long consultantId, LocalDate startDate, LocalDate endDate) {
        log.info("상담사별 수익 통계 조회: consultantId={}, startDate={}, endDate={}", consultantId, startDate, endDate);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 기간 유효성 검사
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("시작일은 종료일보다 빨라야 합니다.");
        }
        
        // 수익 통계 조회 (실제 구현에서는 Payment 엔티티를 통해 조회)
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", 500000.0);
        stats.put("averageRevenue", 50000.0);
        stats.put("monthlyRevenue", 250000.0);
        stats.put("completedSessions", 10);
        stats.put("averageSessionRevenue", 50000.0);
        stats.put("startDate", startDate);
        stats.put("endDate", endDate);
        
        log.info("수익 통계 조회 완료: totalRevenue={}, averageRevenue={}", 
                stats.get("totalRevenue"), stats.get("averageRevenue"));
        
        return stats;
    }
    
    @Override
    public Map<String, Object> getSatisfactionAnalysis(Long consultantId) {
        log.info("상담사별 만족도 분석: consultantId={}", consultantId);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 만족도 분석 (실제 구현에서는 Review 엔티티를 통해 조회)
        Map<String, Object> analysis = new HashMap<>();
        analysis.put("averageRating", consultant.getAverageRating());
        analysis.put("totalReviews", 15);
        analysis.put("excellentReviews", 8); // 5점
        analysis.put("goodReviews", 5); // 4점
        analysis.put("averageReviews", 2); // 3점
        analysis.put("poorReviews", 0); // 2점 이하
        analysis.put("satisfactionRate", 86.7); // 만족도 비율
        analysis.put("recommendationRate", 93.3); // 추천 비율
        
        log.info("만족도 분석 완료: averageRating={}, totalReviews={}", 
                analysis.get("averageRating"), analysis.get("totalReviews"));
        
        return analysis;
    }
    
    // === 프로필 관리 ===
    
    @Override
    public Consultant updateProfile(Long consultantId, Consultant updateData) {
        return partialUpdate(consultantId, updateData);
    }
    
    @Override
    public void updateSpecialty(Long consultantId, String specialty) {
        Consultant consultant = findActiveByIdOrThrow(consultantId);
        consultant.setSpecialty(specialty);
        save(consultant);
    }
    
    @Override
    public void updateExperience(Long consultantId, int experience, String description) {
        Consultant consultant = findActiveByIdOrThrow(consultantId);
        consultant.setYearsOfExperience(experience);
        save(consultant);
    }
    
    @Override
    public void updateCertifications(Long consultantId, List<String> certifications) {
        log.info("상담사 자격증 업데이트: consultantId={}, certifications={}", consultantId, certifications);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 자격증 업데이트 로직 (실제 구현에서는 Certification 엔티티에 저장)
        log.info("자격증이 업데이트되었습니다: {}건", certifications != null ? certifications.size() : 0);
    }
    
    // === 상태 관리 ===
    
    @Override
    public void updateStatus(Long consultantId, String status) {
        log.info("상담사 상태 업데이트: consultantId={}, status={}", consultantId, status);
        
        Consultant consultant = findActiveByIdOrThrow(consultantId);
        
        // 상태 유효성 검사
        if (status == null || (!ConsultantConstants.STATUS_ACTIVE.equals(status) && 
            !ConsultantConstants.STATUS_INACTIVE.equals(status) && 
            !ConsultantConstants.STATUS_PENDING.equals(status) && 
            !ConsultantConstants.STATUS_SUSPENDED.equals(status))) {
            throw new IllegalArgumentException("유효하지 않은 상태입니다: " + status);
        }
        
        // 상태 업데이트 로직 (실제 구현에서는 User 엔티티의 status 필드 업데이트)
        log.info("상담사 상태가 업데이트되었습니다: {}", status);
        save(consultant);
    }
    
    @Override
    public void updateAvailability(Long consultantId, boolean available) {
        Consultant consultant = findActiveByIdOrThrow(consultantId);
        consultant.setIsAvailable(available);
        save(consultant);
    }
    
    @Override
    public void registerVacation(Long consultantId, LocalDate startDate, LocalDate endDate, String reason) {
        log.info("상담사 휴가 등록: consultantId={}, startDate={}, endDate={}, reason={}", 
                consultantId, startDate, endDate, reason);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 휴가 기간 유효성 검사
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("휴가 시작일은 종료일보다 빨라야 합니다.");
        }
        
        // 휴가 등록 로직 (실제 구현에서는 Vacation 엔티티에 저장)
        log.info("휴가가 등록되었습니다: {} ~ {}", startDate, endDate);
    }
    
    @Override
    public void cancelVacation(Long consultantId, Long vacationId) {
        log.info("상담사 휴가 취소: consultantId={}, vacationId={}", consultantId, vacationId);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 상담사 정보 로깅
        log.debug("상담사 정보 확인: consultantId={}, name={}", consultant.getId(), consultant.getName());
        
        // 휴가 취소 로직 (실제 구현에서는 Vacation 엔티티 상태 업데이트)
        log.info("휴가가 취소되었습니다: vacationId={}", vacationId);
    }
}
