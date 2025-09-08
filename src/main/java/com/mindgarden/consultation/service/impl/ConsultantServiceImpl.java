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

/**
 * ConsultantService 구현체
 * API 설계 문서에 명시된 상담사 관리 비즈니스 로직 구현
 */
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
            // TODO: setAverageRating 메서드가 Consultant 엔티티에 없음
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
                .filter(consultant -> minExperience == null || consultant.getExperience() >= minExperience)
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
        
        // 매핑을 통해 내담자 조회 (실제 구현에서는 매핑 테이블을 통해 조회)
        return Page.empty(pageable);
    }
    
    @Override
    public Optional<Client> findClientByConsultantId(Long consultantId, Long clientId) {
        log.info("상담사별 특정 내담자 조회: consultantId={}, clientId={}", consultantId, clientId);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
        // 매핑을 통해 내담자 조회 (실제 구현에서는 매핑 테이블을 통해 조회)
        return Optional.empty();
    }
    
    @Override
    public Client updateClientProfile(Long consultantId, Long clientId, Client updateData) {
        log.info("상담사별 내담자 프로필 업데이트: consultantId={}, clientId={}", consultantId, clientId);
        
        // 상담사 존재 확인
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException(ConsultantConstants.ERROR_CONSULTANT_NOT_FOUND));
        
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
        
        // 스케줄 삭제 로직 (실제 구현에서는 Schedule 엔티티 삭제)
        log.info(ConsultantConstants.SUCCESS_SCHEDULE_DELETED);
    }
    
    // === 상담 관리 ===
    
    @Override
    public List<Map<String, Object>> getConsultationBookings(Long consultantId, String status) {
        // TODO: 실제 구현
        return new ArrayList<>();
    }
    
    @Override
    public void confirmConsultation(Long consultationId, Long consultantId) {
        // TODO: 실제 구현
    }
    
    @Override
    public void cancelConsultation(Long consultationId, Long consultantId) {
        // TODO: 실제 구현
    }
    
    @Override
    public void completeConsultation(Long consultationId, Long consultantId, String notes, int rating) {
        // TODO: 실제 구현
    }
    
    // === 통계 및 분석 ===
    
    @Override
    public Map<String, Object> getConsultationStatistics(Long consultantId, LocalDate startDate, LocalDate endDate) {
        // TODO: 실제 구현
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalConsultations", 0);
        stats.put("completedConsultations", 0);
        stats.put("cancelledConsultations", 0);
        return stats;
    }
    
    @Override
    public Map<String, Object> getRevenueStatistics(Long consultantId, LocalDate startDate, LocalDate endDate) {
        // TODO: 실제 구현
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", 0.0);
        stats.put("averageRevenue", 0.0);
        return stats;
    }
    
    @Override
    public Map<String, Object> getSatisfactionAnalysis(Long consultantId) {
        // TODO: 실제 구현
        Map<String, Object> analysis = new HashMap<>();
        analysis.put("averageRating", 0.0);
        analysis.put("totalReviews", 0);
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
        // TODO: 실제 구현
    }
    
    // === 상태 관리 ===
    
    @Override
    public void updateStatus(Long consultantId, String status) {
        Consultant consultant = findActiveByIdOrThrow(consultantId);
        // TODO: User 엔티티에 status 필드가 있는지 확인 필요
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
        // TODO: 실제 구현
    }
    
    @Override
    public void cancelVacation(Long consultantId, Long vacationId) {
        // TODO: 실제 구현
    }
}
