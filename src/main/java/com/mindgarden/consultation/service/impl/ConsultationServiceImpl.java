package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.mindgarden.consultation.entity.Consultant;
import com.mindgarden.consultation.entity.Consultation;
import com.mindgarden.consultation.repository.BaseRepository;
import com.mindgarden.consultation.repository.ConsultantRepository;
import com.mindgarden.consultation.repository.ConsultationRepository;
import com.mindgarden.consultation.service.ConsultationService;
import com.mindgarden.consultation.service.EmailService;
import com.mindgarden.consultation.constant.EmailConstants;
import com.mindgarden.consultation.dto.EmailResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ConsultationService 구현체
 * API 설계 문서에 명시된 상담 관리 비즈니스 로직 구현
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Service
@Transactional
public class ConsultationServiceImpl implements ConsultationService {
    
    private static final Logger log = LoggerFactory.getLogger(ConsultationServiceImpl.class);
    
    @Autowired
    private ConsultationRepository consultationRepository;
    
    @Autowired
    private ConsultantRepository consultantRepository;
    
    @Autowired
    private EmailService emailService;
    
    // === BaseService 구현 메서드들 ===
    
    @Override
    public Consultation save(Consultation consultation) {
        if (consultation.getId() == null) {
            // 새 상담 생성 시
            consultation.setCreatedAt(LocalDateTime.now());
            consultation.setVersion(1L);
            if (consultation.getStatus() == null) {
                consultation.setStatus("REQUESTED");
            }
        }
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(consultation.getVersion() + 1);
        
        return consultationRepository.save(consultation);
    }
    
    @Override
    public List<Consultation> saveAll(List<Consultation> consultations) {
        consultations.forEach(consultation -> {
            if (consultation.getId() == null) {
                consultation.setCreatedAt(LocalDateTime.now());
                consultation.setVersion(1L);
                if (consultation.getStatus() == null) {
                    consultation.setStatus("REQUESTED");
                }
            }
            consultation.setUpdatedAt(LocalDateTime.now());
            consultation.setVersion(consultation.getVersion() + 1);
        });
        
        return consultationRepository.saveAll(consultations);
    }
    
    @Override
    public Consultation update(Consultation consultation) {
        Consultation existingConsultation = consultationRepository.findById(consultation.getId())
                .orElseThrow(() -> new RuntimeException("상담을 찾을 수 없습니다: " + consultation.getId()));
        
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(existingConsultation.getVersion() + 1);
        
        return consultationRepository.save(consultation);
    }
    
    @Override
    public Consultation partialUpdate(Long id, Consultation updateData) {
        Consultation existingConsultation = consultationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("상담을 찾을 수 없습니다: " + id));
        
        // 부분 업데이트: null이 아닌 필드만 업데이트
        if (updateData.getStatus() != null) {
            existingConsultation.setStatus(updateData.getStatus());
        }
        if (updateData.getPriority() != null) {
            existingConsultation.setPriority(updateData.getPriority());
        }
        if (updateData.getRiskLevel() != null) {
            existingConsultation.setRiskLevel(updateData.getRiskLevel());
        }
        if (updateData.getConsultationMethod() != null) {
            existingConsultation.setConsultationMethod(updateData.getConsultationMethod());
        }
        if (updateData.getConsultationDate() != null) {
            existingConsultation.setConsultationDate(updateData.getConsultationDate());
        }
        if (updateData.getStartTime() != null) {
            existingConsultation.setStartTime(updateData.getStartTime());
        }
        if (updateData.getEndTime() != null) {
            existingConsultation.setEndTime(updateData.getEndTime());
        }
        if (updateData.getDurationMinutes() != null) {
            existingConsultation.setDurationMinutes(updateData.getDurationMinutes());
        }
        if (updateData.getPreparationNotes() != null) {
            existingConsultation.setPreparationNotes(updateData.getPreparationNotes());
        }
        if (updateData.getConsultantNotes() != null) {
            existingConsultation.setConsultantNotes(updateData.getConsultantNotes());
        }
        if (updateData.getIsEmergency() != null) {
            existingConsultation.setIsEmergency(updateData.getIsEmergency());
        }
        if (updateData.getIsFirstSession() != null) {
            existingConsultation.setIsFirstSession(updateData.getIsFirstSession());
        }
        
        existingConsultation.setUpdatedAt(LocalDateTime.now());
        existingConsultation.setVersion(existingConsultation.getVersion() + 1);
        
        return consultationRepository.save(existingConsultation);
    }
    
    @Override
    public void softDeleteById(Long id) {
        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("상담을 찾을 수 없습니다: " + id));
        
        consultation.setIsDeleted(true);
        consultation.setDeletedAt(LocalDateTime.now());
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(consultation.getVersion() + 1);
        
        consultationRepository.save(consultation);
    }
    
    @Override
    public void restoreById(Long id) {
        Consultation consultation = consultationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("상담을 찾을 수 없습니다: " + id));
        
        consultation.setIsDeleted(false);
        consultation.setDeletedAt(null);
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(consultation.getVersion() + 1);
        
        consultationRepository.save(consultation);
    }
    
    @Override
    public void hardDeleteById(Long id) {
        consultationRepository.deleteById(id);
    }
    
    @Override
    public List<Consultation> findAllActive() {
        return consultationRepository.findAllActive();
    }
    
    @Override
    public Optional<Consultation> findActiveById(Long id) {
        return consultationRepository.findActiveById(id);
    }
    
    @Override
    public Consultation findActiveByIdOrThrow(Long id) {
        return consultationRepository.findActiveById(id)
                .orElseThrow(() -> new RuntimeException("활성 상담을 찾을 수 없습니다: " + id));
    }
    
    @Override
    public long countActive() {
        return consultationRepository.countActive();
    }
    
    @Override
    public List<Consultation> findAllDeleted() {
        return consultationRepository.findAllDeleted();
    }
    
    @Override
    public long countDeleted() {
        return consultationRepository.countDeleted();
    }
    
    @Override
    public boolean existsActiveById(Long id) {
        return consultationRepository.existsActiveById(id);
    }
    
    @Override
    public Optional<Consultation> findByIdAndVersion(Long id, Long version) {
        return consultationRepository.findByIdAndVersion(id, version);
    }
    
    @Override
    public Object[] getEntityStatistics() {
        return consultationRepository.getEntityStatistics();
    }
    
    @Override
    public void cleanupOldDeleted(LocalDateTime cutoffDate) {
        consultationRepository.cleanupOldDeleted(cutoffDate);
    }
    
    @Override
    public Page<Consultation> findAllActive(Pageable pageable) {
        return consultationRepository.findAllActive(pageable);
    }
    
    @Override
    public List<Consultation> findRecentActive(int limit) {
        return consultationRepository.findRecentActive(limit);
    }
    
    @Override
    public List<Consultation> findRecentlyUpdatedActive(int limit) {
        return consultationRepository.findRecentlyUpdatedActive(limit);
    }
    
    @Override
    public List<Consultation> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return consultationRepository.findByCreatedAtBetween(startDate, endDate);
    }
    
    @Override
    public List<Consultation> findByUpdatedAtBetween(LocalDateTime startDate, LocalDateTime endDate) {
        return consultationRepository.findByUpdatedAtBetween(startDate, endDate);
    }
    
    @Override
    public BaseRepository<Consultation, Long> getRepository() {
        return consultationRepository;
    }
    
    @Override
    public boolean isDuplicateExcludingIdAll(Long excludeId, String fieldName, Object fieldValue, boolean includeDeleted) {
        return consultationRepository.isDuplicateExcludingIdAll(excludeId, fieldName, fieldValue, includeDeleted);
    }
    
    // === ConsultationService 특화 메서드들 ===
    
    @Override
    public List<Consultation> findByClientId(Long clientId) {
        return consultationRepository.findByClientId(clientId);
    }
    
    @Override
    public List<Consultation> findByConsultantId(Long consultantId) {
        return consultationRepository.findByConsultantId(consultantId);
    }
    
    @Override
    public List<Consultation> findByStatus(String status) {
        return consultationRepository.findByStatus(status);
    }
    
    @Override
    public List<Consultation> findByPriority(String priority) {
        return consultationRepository.findByPriority(priority);
    }
    
    @Override
    public List<Consultation> findByRiskLevel(String riskLevel) {
        return consultationRepository.findByRiskLevel(riskLevel);
    }
    
    @Override
    public List<Consultation> findByConsultationMethod(String consultationMethod) {
        return consultationRepository.findByConsultationMethod(consultationMethod);
    }
    
    @Override
    public List<Consultation> findByIsEmergency(Boolean isEmergency) {
        return consultationRepository.findByIsEmergency(isEmergency);
    }
    
    @Override
    public List<Consultation> findByIsFirstSession(Boolean isFirstSession) {
        return consultationRepository.findByIsFirstSession(isFirstSession);
    }
    
    @Override
    public List<Consultation> findByConsultationDate(LocalDate consultationDate) {
        return consultationRepository.findByConsultationDate(consultationDate);
    }
    
    @Override
    public List<Consultation> findByConsultationDateBetween(LocalDate startDate, LocalDate endDate) {
        return consultationRepository.findByConsultationDateBetween(startDate, endDate);
    }
    
    @Override
    public List<Consultation> findByComplexCriteria(Long clientId, Long consultantId, String status, 
                                                  String priority, String riskLevel, String consultationMethod, 
                                                  Boolean isEmergency, Boolean isFirstSession, 
                                                  LocalDate startDate, LocalDate endDate) {
        return consultationRepository.findByComplexCriteria(clientId, consultantId, status, priority, 
                                                         riskLevel, consultationMethod, isEmergency, 
                                                         isFirstSession, startDate, endDate);
    }
    
    // === 상담 예약 및 관리 ===
    
    @Override
    public Consultation createConsultationRequest(Consultation consultation) {
        consultation.setStatus("REQUESTED");
        consultation.setCreatedAt(LocalDateTime.now());
        consultation.setVersion(1L);
        
        return save(consultation);
    }
    
    @Override
    public Consultation confirmConsultation(Long consultationId, Long consultantId) {
        Consultation consultation = findActiveByIdOrThrow(consultationId);
        consultation.setStatus("CONFIRMED");
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(consultation.getVersion() + 1);
        
        Consultation savedConsultation = save(consultation);
        
        // 상담 예약 확인 이메일 발송
        sendConsultationConfirmation(consultationId);
        
        return savedConsultation;
    }
    
    @Override
    public Consultation cancelConsultation(Long consultationId, String reason) {
        Consultation consultation = findActiveByIdOrThrow(consultationId);
        consultation.setStatus("CANCELLED");
        consultation.setConsultantNotes(reason);
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(consultation.getVersion() + 1);
        
        Consultation savedConsultation = save(consultation);
        
        // 상담 취소 변경 알림 이메일 발송
        sendConsultationChangeNotification(consultationId, "취소");
        
        return savedConsultation;
    }
    
    @Override
    public Consultation rescheduleConsultation(Long consultationId, LocalDateTime newDateTime) {
        Consultation consultation = findActiveByIdOrThrow(consultationId);
        consultation.setConsultationDate(newDateTime.toLocalDate());
        consultation.setStartTime(newDateTime.toLocalTime());
        consultation.setStatus("RESCHEDULED");
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(consultation.getVersion() + 1);
        
        Consultation savedConsultation = save(consultation);
        
        // 상담 일정 변경 알림 이메일 발송
        sendConsultationChangeNotification(consultationId, "일정 변경");
        
        return savedConsultation;
    }
    
    @Override
    public Consultation startConsultation(Long consultationId) {
        Consultation consultation = findActiveByIdOrThrow(consultationId);
        consultation.setStatus("IN_PROGRESS");
        consultation.setStartTime(LocalDateTime.now().toLocalTime());
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(consultation.getVersion() + 1);
        
        return save(consultation);
    }
    
    @Override
    public Consultation completeConsultation(Long consultationId, String notes, int rating) {
        Consultation consultation = findActiveByIdOrThrow(consultationId);
        consultation.setStatus("COMPLETED");
        consultation.setEndTime(LocalDateTime.now().toLocalTime());
        consultation.setConsultantNotes(notes);
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(consultation.getVersion() + 1);
        
        // 상담 시간 계산
        if (consultation.getStartTime() != null && consultation.getEndTime() != null) {
            long durationMinutes = java.time.Duration.between(
                consultation.getStartTime(), consultation.getEndTime()).toMinutes();
            consultation.setDurationMinutes((int) durationMinutes);
        }
        
        Consultation savedConsultation = save(consultation);
        
        // 상담 완료 알림 이메일 발송
        sendConsultationCompletionNotification(consultationId);
        
        return savedConsultation;
    }
    
    @Override
    public Consultation pauseConsultation(Long consultationId, String reason) {
        Consultation consultation = findActiveByIdOrThrow(consultationId);
        consultation.setStatus("PAUSED");
        consultation.setConsultantNotes(reason);
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(consultation.getVersion() + 1);
        
        return save(consultation);
    }
    
    @Override
    public Consultation resumeConsultation(Long consultationId) {
        Consultation consultation = findActiveByIdOrThrow(consultationId);
        consultation.setStatus("IN_PROGRESS");
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(consultation.getVersion() + 1);
        
        return save(consultation);
    }
    
    // === 상담 스케줄링 ===
    
    @Override
    public List<Map<String, Object>> getAvailableTimeSlots(Long consultantId, LocalDate date) {
        // 상담사별 상담 가능 시간 조회 로직
        List<Map<String, Object>> availableSlots = new ArrayList<>();
        
        // 기본 상담 시간대 (9:00-18:00, 1시간 단위)
        for (int hour = 9; hour < 18; hour++) {
            Map<String, Object> slot = new HashMap<>();
            slot.put("startTime", LocalTime.of(hour, 0));
            slot.put("endTime", LocalTime.of(hour + 1, 0));
            slot.put("available", true);
            availableSlots.add(slot);
        }
        
        return availableSlots;
    }
    
    @Override
    public List<Map<String, Object>> getConsultantSchedule(Long consultantId, LocalDate startDate, LocalDate endDate) {
        // 상담사별 상담 스케줄 조회 로직
        List<Map<String, Object>> schedule = new ArrayList<>();
        
        List<Consultation> consultations = findByConsultantId(consultantId);
        for (Consultation consultation : consultations) {
            if (consultation.getConsultationDate() != null && 
                !consultation.getConsultationDate().isBefore(startDate) && 
                !consultation.getConsultationDate().isAfter(endDate)) {
                
                Map<String, Object> scheduleItem = new HashMap<>();
                scheduleItem.put("id", consultation.getId());
                scheduleItem.put("date", consultation.getConsultationDate());
                scheduleItem.put("startTime", consultation.getStartTime());
                scheduleItem.put("endTime", consultation.getEndTime());
                scheduleItem.put("status", consultation.getStatus());
                scheduleItem.put("clientId", consultation.getClientId());
                schedule.add(scheduleItem);
            }
        }
        
        return schedule;
    }
    
    @Override
    public List<Map<String, Object>> getClientSchedule(Long clientId, LocalDate startDate, LocalDate endDate) {
        // 클라이언트별 상담 스케줄 조회 로직
        List<Map<String, Object>> schedule = new ArrayList<>();
        
        List<Consultation> consultations = findByClientId(clientId);
        for (Consultation consultation : consultations) {
            if (consultation.getConsultationDate() != null && 
                !consultation.getConsultationDate().isBefore(startDate) && 
                !consultation.getConsultationDate().isAfter(endDate)) {
                
                Map<String, Object> scheduleItem = new HashMap<>();
                scheduleItem.put("id", consultation.getId());
                scheduleItem.put("date", consultation.getConsultationDate());
                scheduleItem.put("startTime", consultation.getStartTime());
                scheduleItem.put("endTime", consultation.getEndTime());
                scheduleItem.put("status", consultation.getStatus());
                scheduleItem.put("consultantId", consultation.getConsultantId());
                schedule.add(scheduleItem);
            }
        }
        
        return schedule;
    }
    
    @Override
    public List<Map<String, Object>> getClientConsultationHistory(Long clientId) {
        log.info("내담자 상담 히스토리 조회 - clientId: {}", clientId);
        
        List<Consultation> consultations = findByClientId(clientId);
        List<Map<String, Object>> history = new ArrayList<>();
        
        for (Consultation consultation : consultations) {
            Map<String, Object> historyItem = new HashMap<>();
            historyItem.put("id", consultation.getId());
            historyItem.put("consultationDate", consultation.getConsultationDate());
            historyItem.put("startTime", consultation.getStartTime());
            historyItem.put("endTime", consultation.getEndTime());
            historyItem.put("status", consultation.getStatus());
            historyItem.put("consultationType", "INDIVIDUAL"); // 기본값으로 설정
            historyItem.put("consultantId", consultation.getConsultantId());
            
            // 상담사 정보 조회
            if (consultation.getConsultantId() != null) {
                try {
                    Optional<Consultant> consultantOpt = consultantRepository.findById(consultation.getConsultantId());
                    if (consultantOpt.isPresent()) {
                        Consultant consultant = consultantOpt.get();
                        Map<String, Object> consultantInfo = new HashMap<>();
                        consultantInfo.put("id", consultant.getId());
                        consultantInfo.put("name", consultant.getName());
                        consultantInfo.put("specialty", consultant.getSpecialty());
                        consultantInfo.put("profileImage", null); // 기본값으로 설정
                        historyItem.put("consultant", consultantInfo);
                    }
                } catch (Exception e) {
                    log.warn("상담사 정보 조회 실패 - consultantId: {}, error: {}", 
                            consultation.getConsultantId(), e.getMessage());
                }
            }
            
            history.add(historyItem);
        }
        
        // 최신 순으로 정렬
        history.sort((a, b) -> {
            LocalDate dateA = (LocalDate) a.get("consultationDate");
            LocalDate dateB = (LocalDate) b.get("consultationDate");
            if (dateA == null || dateB == null) return 0;
            return dateB.compareTo(dateA); // 최신 순
        });
        
        return history;
    }
    
    @Override
    public boolean hasTimeConflict(Long consultantId, LocalDateTime startTime, LocalDateTime endTime) {
        // 상담 시간 충돌 검사 로직
        List<Consultation> existingConsultations = findByConsultantId(consultantId);
        
        for (Consultation consultation : existingConsultations) {
            if (consultation.getConsultationDate() != null && 
                consultation.getConsultationDate().equals(startTime.toLocalDate()) &&
                consultation.getStartTime() != null && consultation.getEndTime() != null) {
                
                LocalDateTime existingStart = LocalDateTime.of(
                    consultation.getConsultationDate(), consultation.getStartTime());
                LocalDateTime existingEnd = LocalDateTime.of(
                    consultation.getConsultationDate(), consultation.getEndTime());
                
                if ((startTime.isBefore(existingEnd) && endTime.isAfter(existingStart))) {
                    return true; // 시간 충돌 발생
                }
            }
        }
        
        return false; // 시간 충돌 없음
    }
    
    // === 상담 평가 및 리뷰 ===
    
    @Override
    public void addConsultationReview(Long consultationId, int rating, String review, String clientId) {
        // 상담 평가 등록 로직
        Consultation consultation = findActiveByIdOrThrow(consultationId);
        // TODO: Review 엔티티 생성 및 저장
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(consultation.getVersion() + 1);
        save(consultation);
    }
    
    @Override
    public void updateConsultationReview(Long consultationId, int rating, String review) {
        // 상담 평가 수정 로직
        Consultation consultation = findActiveByIdOrThrow(consultationId);
        // TODO: Review 엔티티 수정
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(consultation.getVersion() + 1);
        save(consultation);
    }
    
    @Override
    public Map<String, Object> getConsultationReview(Long consultationId) {
        // 상담 평가 조회 로직
        Map<String, Object> review = new HashMap<>();
        review.put("consultationId", consultationId);
        review.put("rating", 0);
        review.put("review", "");
        review.put("clientId", "");
        // TODO: Review 엔티티에서 실제 데이터 조회
        return review;
    }
    
    @Override
    public double getConsultantAverageRating(Long consultantId) {
        // 상담사별 평균 평점 조회 로직
        List<Consultation> consultations = findByConsultantId(consultantId);
        if (consultations.isEmpty()) {
            return 0.0;
        }
        
        // TODO: Review 엔티티에서 실제 평점 데이터 조회
        return 4.5; // 임시 값
    }
    
    // === 상담 기록 관리 ===
    
    @Override
    public void addConsultationNote(Long consultationId, String note, String authorId) {
        // 상담 노트 추가 로직
        Consultation consultation = findActiveByIdOrThrow(consultationId);
        // TODO: Note 엔티티 생성 및 저장
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(consultation.getVersion() + 1);
        save(consultation);
    }
    
    @Override
    public void updateConsultationNote(Long noteId, String note) {
        // 상담 노트 수정 로직
        // TODO: Note 엔티티 수정
    }
    
    @Override
    public void deleteConsultationNote(Long noteId) {
        // 상담 노트 삭제 로직
        // TODO: Note 엔티티 삭제
    }
    
    @Override
    public List<Map<String, Object>> getConsultationNotes(Long consultationId) {
        // 상담 노트 목록 조회 로직
        List<Map<String, Object>> notes = new ArrayList<>();
        // TODO: Note 엔티티에서 실제 데이터 조회
        return notes;
    }
    
    @Override
    public byte[] exportConsultationRecord(Long consultationId, String format) {
        // 상담 기록 내보내기 로직
        // TODO: 실제 내보내기 로직 구현
        return new byte[0];
    }
    
    // === 긴급 상담 관리 ===
    
    @Override
    public Consultation requestEmergencyConsultation(Long clientId, String emergencyReason) {
        // 긴급 상담 요청 로직
        Consultation consultation = new Consultation();
        consultation.setIsEmergency(true);
        consultation.setPriority("HIGH");
        consultation.setStatus("REQUESTED");
        consultation.setCreatedAt(LocalDateTime.now());
        consultation.setVersion(1L);
        
        // TODO: Client 엔티티 설정
        
        return save(consultation);
    }
    
    @Override
    public Consultation assignEmergencyConsultation(Long consultationId, Long consultantId) {
        // 긴급 상담 할당 로직
        Consultation consultation = findActiveByIdOrThrow(consultationId);
        consultation.setStatus("ASSIGNED");
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(consultation.getVersion() + 1);
        
        // TODO: Consultant 엔티티 설정
        
        return save(consultation);
    }
    
    @Override
    public void updateEmergencyPriority(Long consultationId, int priority) {
        // 긴급 상담 우선순위 조정 로직
        Consultation consultation = findActiveByIdOrThrow(consultationId);
        // TODO: 우선순위 필드 설정
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(consultation.getVersion() + 1);
        save(consultation);
    }
    
    @Override
    public List<Consultation> getEmergencyConsultations() {
        return findByIsEmergency(true);
    }
    
    // === 상담 통계 및 분석 ===
    
    @Override
    public Map<String, Object> getOverallConsultationStatistics() {
        // 전체 상담 통계 조회 로직
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("totalConsultations", countActive());
        statistics.put("completedConsultations", countConsultationsByStatus("COMPLETED"));
        statistics.put("pendingConsultations", countConsultationsByStatus("REQUESTED"));
        statistics.put("inProgressConsultations", countConsultationsByStatus("IN_PROGRESS"));
        return statistics;
    }
    
    @Override
    public Map<String, Object> getConsultationStatisticsByStatus() {
        // 상태별 상담 통계 조회 로직
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("REQUESTED", countConsultationsByStatus("REQUESTED"));
        statistics.put("CONFIRMED", countConsultationsByStatus("CONFIRMED"));
        statistics.put("IN_PROGRESS", countConsultationsByStatus("IN_PROGRESS"));
        statistics.put("COMPLETED", countConsultationsByStatus("COMPLETED"));
        statistics.put("CANCELLED", countConsultationsByStatus("CANCELLED"));
        return statistics;
    }
    
    @Override
    public Map<String, Object> getConsultationStatisticsByPriority() {
        log.info("우선순위별 상담 통계 조회");
        
        Map<String, Object> statistics = new HashMap<>();
        
        try {
            // 실제 우선순위별 통계 계산
            List<Consultation> allConsultations = findAllActive();
            
            long lowCount = allConsultations.stream()
                    .filter(c -> "LOW".equals(c.getPriority()))
                    .count();
            long mediumCount = allConsultations.stream()
                    .filter(c -> "MEDIUM".equals(c.getPriority()))
                    .count();
            long highCount = allConsultations.stream()
                    .filter(c -> "HIGH".equals(c.getPriority()))
                    .count();
            long urgentCount = allConsultations.stream()
                    .filter(c -> "URGENT".equals(c.getPriority()))
                    .count();
            
            statistics.put("LOW", lowCount);
            statistics.put("MEDIUM", mediumCount);
            statistics.put("HIGH", highCount);
            statistics.put("URGENT", urgentCount);
            
            log.info("우선순위별 상담 통계 조회 완료: LOW={}, MEDIUM={}, HIGH={}, URGENT={}", 
                    lowCount, mediumCount, highCount, urgentCount);
            
        } catch (Exception e) {
            log.error("우선순위별 상담 통계 조회 실패: error={}", e.getMessage(), e);
            statistics.put("LOW", 0L);
            statistics.put("MEDIUM", 0L);
            statistics.put("HIGH", 0L);
            statistics.put("URGENT", 0L);
        }
        
        return statistics;
    }
    
    @Override
    public Map<String, Object> getConsultationStatisticsByRiskLevel() {
        log.info("위험도별 상담 통계 조회");
        
        Map<String, Object> statistics = new HashMap<>();
        
        try {
            // 실제 위험도별 통계 계산
            List<Consultation> allConsultations = findAllActive();
            
            long lowCount = allConsultations.stream()
                    .filter(c -> "LOW".equals(c.getRiskLevel()))
                    .count();
            long mediumCount = allConsultations.stream()
                    .filter(c -> "MEDIUM".equals(c.getRiskLevel()))
                    .count();
            long highCount = allConsultations.stream()
                    .filter(c -> "HIGH".equals(c.getRiskLevel()))
                    .count();
            
            statistics.put("LOW", lowCount);
            statistics.put("MEDIUM", mediumCount);
            statistics.put("HIGH", highCount);
            
            log.info("위험도별 상담 통계 조회 완료: LOW={}, MEDIUM={}, HIGH={}", 
                    lowCount, mediumCount, highCount);
            
        } catch (Exception e) {
            log.error("위험도별 상담 통계 조회 실패: error={}", e.getMessage(), e);
            statistics.put("LOW", 0L);
            statistics.put("MEDIUM", 0L);
            statistics.put("HIGH", 0L);
        }
        
        return statistics;
    }
    
    @Override
    public Map<String, Object> getConsultationStatisticsByMethod() {
        log.info("상담 방법별 통계 조회");
        
        Map<String, Object> statistics = new HashMap<>();
        
        try {
            // 실제 상담 방법별 통계 계산
            List<Consultation> allConsultations = findAllActive();
            
            long faceToFaceCount = allConsultations.stream()
                    .filter(c -> "FACE_TO_FACE".equals(c.getConsultationMethod()))
                    .count();
            long videoCallCount = allConsultations.stream()
                    .filter(c -> "VIDEO_CALL".equals(c.getConsultationMethod()))
                    .count();
            long phoneCallCount = allConsultations.stream()
                    .filter(c -> "PHONE_CALL".equals(c.getConsultationMethod()))
                    .count();
            long chatCount = allConsultations.stream()
                    .filter(c -> "CHAT".equals(c.getConsultationMethod()))
                    .count();
            
            statistics.put("FACE_TO_FACE", faceToFaceCount);
            statistics.put("VIDEO_CALL", videoCallCount);
            statistics.put("PHONE_CALL", phoneCallCount);
            statistics.put("CHAT", chatCount);
            
            log.info("상담 방법별 통계 조회 완료: FACE_TO_FACE={}, VIDEO_CALL={}, PHONE_CALL={}, CHAT={}", 
                    faceToFaceCount, videoCallCount, phoneCallCount, chatCount);
            
        } catch (Exception e) {
            log.error("상담 방법별 통계 조회 실패: error={}", e.getMessage(), e);
            statistics.put("FACE_TO_FACE", 0L);
            statistics.put("VIDEO_CALL", 0L);
            statistics.put("PHONE_CALL", 0L);
            statistics.put("CHAT", 0L);
        }
        
        return statistics;
    }
    
    @Override
    public Map<String, Object> getConsultationStatisticsByDate(LocalDate startDate, LocalDate endDate) {
        // 날짜별 상담 통계 조회 로직
        Map<String, Object> statistics = new HashMap<>();
        List<Consultation> consultations = findByConsultationDateBetween(startDate, endDate);
        statistics.put("totalConsultations", consultations.size());
        statistics.put("startDate", startDate);
        statistics.put("endDate", endDate);
        return statistics;
    }
    
    @Override
    public Map<String, Object> getClientConsultationStatistics(Long clientId) {
        log.info("클라이언트별 상담 통계 조회: clientId={}", clientId);
        
        Map<String, Object> statistics = new HashMap<>();
        
        try {
            // 실제 클라이언트별 통계 계산
            List<Consultation> clientConsultations = findByClientId(clientId);
            
            long totalConsultations = clientConsultations.size();
            long completedConsultations = clientConsultations.stream()
                    .filter(c -> "COMPLETED".equals(c.getStatus()))
                    .count();
            long pendingConsultations = clientConsultations.stream()
                    .filter(c -> "REQUESTED".equals(c.getStatus()) || "CONFIRMED".equals(c.getStatus()))
                    .count();
            long cancelledConsultations = clientConsultations.stream()
                    .filter(c -> "CANCELLED".equals(c.getStatus()))
                    .count();
            long inProgressConsultations = clientConsultations.stream()
                    .filter(c -> "IN_PROGRESS".equals(c.getStatus()))
                    .count();
            
            statistics.put("clientId", clientId);
            statistics.put("totalConsultations", totalConsultations);
            statistics.put("completedConsultations", completedConsultations);
            statistics.put("pendingConsultations", pendingConsultations);
            statistics.put("cancelledConsultations", cancelledConsultations);
            statistics.put("inProgressConsultations", inProgressConsultations);
            statistics.put("completionRate", totalConsultations > 0 ? (double) completedConsultations / totalConsultations * 100 : 0.0);
            
            log.info("클라이언트별 상담 통계 조회 완료: clientId={}, total={}, completed={}, pending={}", 
                    clientId, totalConsultations, completedConsultations, pendingConsultations);
            
        } catch (Exception e) {
            log.error("클라이언트별 상담 통계 조회 실패: clientId={}, error={}", clientId, e.getMessage(), e);
            statistics.put("clientId", clientId);
            statistics.put("totalConsultations", 0L);
            statistics.put("completedConsultations", 0L);
            statistics.put("pendingConsultations", 0L);
            statistics.put("cancelledConsultations", 0L);
            statistics.put("inProgressConsultations", 0L);
            statistics.put("completionRate", 0.0);
        }
        
        return statistics;
    }
    
    @Override
    public Map<String, Object> getConsultantConsultationStatistics(Long consultantId) {
        log.info("상담사별 상담 통계 조회: consultantId={}", consultantId);
        
        Map<String, Object> statistics = new HashMap<>();
        
        try {
            // 실제 상담사별 통계 계산
            List<Consultation> consultantConsultations = findByConsultantId(consultantId);
            
            long totalConsultations = consultantConsultations.size();
            long completedConsultations = consultantConsultations.stream()
                    .filter(c -> "COMPLETED".equals(c.getStatus()))
                    .count();
            long pendingConsultations = consultantConsultations.stream()
                    .filter(c -> "REQUESTED".equals(c.getStatus()) || "CONFIRMED".equals(c.getStatus()))
                    .count();
            long cancelledConsultations = consultantConsultations.stream()
                    .filter(c -> "CANCELLED".equals(c.getStatus()))
                    .count();
            long inProgressConsultations = consultantConsultations.stream()
                    .filter(c -> "IN_PROGRESS".equals(c.getStatus()))
                    .count();
            
            // 평균 상담 시간 계산
            double averageDuration = consultantConsultations.stream()
                    .filter(c -> c.getDurationMinutes() != null && c.getDurationMinutes() > 0)
                    .mapToInt(Consultation::getDurationMinutes)
                    .average()
                    .orElse(0.0);
            
            statistics.put("consultantId", consultantId);
            statistics.put("totalConsultations", totalConsultations);
            statistics.put("completedConsultations", completedConsultations);
            statistics.put("pendingConsultations", pendingConsultations);
            statistics.put("cancelledConsultations", cancelledConsultations);
            statistics.put("inProgressConsultations", inProgressConsultations);
            statistics.put("completionRate", totalConsultations > 0 ? (double) completedConsultations / totalConsultations * 100 : 0.0);
            statistics.put("averageDuration", averageDuration);
            
            log.info("상담사별 상담 통계 조회 완료: consultantId={}, total={}, completed={}, pending={}, avgDuration={}", 
                    consultantId, totalConsultations, completedConsultations, pendingConsultations, averageDuration);
            
        } catch (Exception e) {
            log.error("상담사별 상담 통계 조회 실패: consultantId={}, error={}", consultantId, e.getMessage(), e);
            statistics.put("consultantId", consultantId);
            statistics.put("totalConsultations", 0L);
            statistics.put("completedConsultations", 0L);
            statistics.put("pendingConsultations", 0L);
            statistics.put("cancelledConsultations", 0L);
            statistics.put("inProgressConsultations", 0L);
            statistics.put("completionRate", 0.0);
            statistics.put("averageDuration", 0.0);
        }
        
        return statistics;
    }
    
    @Override
    public Map<String, Object> getConsultationPerformanceAnalysis(LocalDate startDate, LocalDate endDate) {
        log.info("상담 성과 분석: startDate={}, endDate={}", startDate, endDate);
        
        Map<String, Object> analysis = new HashMap<>();
        
        try {
            // 실제 성과 분석 로직 구현
            List<Consultation> consultations = findByConsultationDateBetween(startDate, endDate);
            
            int totalConsultations = consultations.size();
            long completedConsultations = consultations.stream()
                    .filter(c -> "COMPLETED".equals(c.getStatus()))
                    .count();
            long cancelledConsultations = consultations.stream()
                    .filter(c -> "CANCELLED".equals(c.getStatus()))
                    .count();
            
            double completionRate = totalConsultations > 0 ? (double) completedConsultations / totalConsultations * 100 : 0.0;
            double cancellationRate = totalConsultations > 0 ? (double) cancelledConsultations / totalConsultations * 100 : 0.0;
            
            // 평균 상담 시간 계산
            double averageDuration = consultations.stream()
                    .filter(c -> c.getDurationMinutes() != null && c.getDurationMinutes() > 0)
                    .mapToInt(Consultation::getDurationMinutes)
                    .average()
                    .orElse(0.0);
            
            // 상담 방법별 분포
            Map<String, Long> methodDistribution = consultations.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            c -> c.getConsultationMethod() != null ? c.getConsultationMethod() : "UNKNOWN",
                            java.util.stream.Collectors.counting()
                    ));
            
            // 우선순위별 분포
            Map<String, Long> priorityDistribution = consultations.stream()
                    .collect(java.util.stream.Collectors.groupingBy(
                            c -> c.getPriority() != null ? c.getPriority() : "UNKNOWN",
                            java.util.stream.Collectors.counting()
                    ));
            
            analysis.put("startDate", startDate);
            analysis.put("endDate", endDate);
            analysis.put("totalConsultations", totalConsultations);
            analysis.put("completedConsultations", completedConsultations);
            analysis.put("cancelledConsultations", cancelledConsultations);
            analysis.put("completionRate", completionRate);
            analysis.put("cancellationRate", cancellationRate);
            analysis.put("averageDuration", averageDuration);
            analysis.put("methodDistribution", methodDistribution);
            analysis.put("priorityDistribution", priorityDistribution);
            
            log.info("상담 성과 분석 완료: total={}, completed={}, completionRate={}%, avgDuration={}", 
                    totalConsultations, completedConsultations, completionRate, averageDuration);
            
        } catch (Exception e) {
            log.error("상담 성과 분석 실패: startDate={}, endDate={}, error={}", startDate, endDate, e.getMessage(), e);
            analysis.put("startDate", startDate);
            analysis.put("endDate", endDate);
            analysis.put("totalConsultations", 0);
            analysis.put("completedConsultations", 0L);
            analysis.put("cancelledConsultations", 0L);
            analysis.put("completionRate", 0.0);
            analysis.put("cancellationRate", 0.0);
            analysis.put("averageDuration", 0.0);
            analysis.put("methodDistribution", new HashMap<>());
            analysis.put("priorityDistribution", new HashMap<>());
        }
        
        return analysis;
    }
    
    // === 상담 품질 관리 ===
    
    @Override
    public void evaluateConsultationQuality(Long consultationId, Map<String, Object> qualityMetrics) {
        // 상담 품질 평가 로직
        Consultation consultation = findActiveByIdOrThrow(consultationId);
        // TODO: 품질 평가 데이터 저장
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(consultation.getVersion() + 1);
        save(consultation);
    }
    
    @Override
    public Map<String, Object> generateQualityReport(Long consultantId, LocalDate startDate, LocalDate endDate) {
        // 상담 품질 보고서 생성 로직
        Map<String, Object> report = new HashMap<>();
        report.put("consultantId", consultantId);
        report.put("startDate", startDate);
        report.put("endDate", endDate);
        report.put("overallQuality", 0.0);
        report.put("improvementAreas", new ArrayList<>());
        // TODO: 실제 품질 보고서 생성 로직 구현
        return report;
    }
    
    @Override
    public List<String> getQualityImprovementSuggestions(Long consultantId) {
        // 상담 품질 개선 제안 로직
        List<String> suggestions = new ArrayList<>();
        suggestions.add("더 적극적인 경청이 필요합니다.");
        suggestions.add("상담 시간을 더 정확하게 지켜주세요.");
        suggestions.add("클라이언트의 감정 상태를 더 세심하게 관찰해주세요.");
        // TODO: 실제 개선 제안 로직 구현
        return suggestions;
    }
    
    // === 상담 비용 관리 ===
    
    @Override
    public Map<String, Object> calculateConsultationCost(Long consultationId) {
        // 상담 비용 계산 로직
        Map<String, Object> cost = new HashMap<>();
        cost.put("consultationId", consultationId);
        cost.put("baseCost", 50000);
        cost.put("discountAmount", 0);
        cost.put("finalCost", 50000);
        // TODO: 실제 비용 계산 로직 구현
        return cost;
    }
    
    @Override
    public void applyDiscount(Long consultationId, String discountType, double discountAmount) {
        // 상담 비용 할인 적용 로직
        Consultation consultation = findActiveByIdOrThrow(consultationId);
        // TODO: 할인 정보 저장
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(consultation.getVersion() + 1);
        save(consultation);
    }
    
    @Override
    public void settleConsultationCost(Long consultationId, String paymentMethod) {
        // 상담 비용 정산 로직
        Consultation consultation = findActiveByIdOrThrow(consultationId);
        // TODO: 결제 정보 저장
        consultation.setUpdatedAt(LocalDateTime.now());
        consultation.setVersion(consultation.getVersion() + 1);
        save(consultation);
    }
    
    // === 상담 알림 및 리마인더 ===
    
    @Override
    public void sendConsultationConfirmation(Long consultationId) {
        try {
            log.info("상담 예약 확인 알림 발송: consultationId={}", consultationId);
            
            Consultation consultation = findActiveByIdOrThrow(consultationId);
            
            // 클라이언트 이메일 조회 (실제 구현에서는 UserService를 통해 조회)
            String clientEmail = "client@example.com"; // TODO: 실제 클라이언트 이메일 조회
            String clientName = "클라이언트"; // TODO: 실제 클라이언트 이름 조회
            
            // 이메일 템플릿 변수 설정
            Map<String, Object> variables = new HashMap<>();
            variables.put(EmailConstants.VAR_USER_NAME, clientName);
            variables.put(EmailConstants.VAR_USER_EMAIL, clientEmail);
            variables.put(EmailConstants.VAR_COMPANY_NAME, "마음정원");
            variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
            variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
            variables.put(EmailConstants.VAR_APPOINTMENT_DATE, consultation.getConsultationDate() != null ? consultation.getConsultationDate().toString() : "");
            variables.put(EmailConstants.VAR_APPOINTMENT_TIME, consultation.getStartTime() != null ? consultation.getStartTime().toString() : "");
            variables.put(EmailConstants.VAR_CONSULTANT_NAME, "상담사"); // TODO: 실제 상담사 이름 조회
            
            // 템플릿 기반 이메일 발송
            EmailResponse response = emailService.sendTemplateEmail(
                    EmailConstants.TEMPLATE_APPOINTMENT_CONFIRMATION,
                    clientEmail,
                    clientName,
                    variables
            );
            
            if (response.isSuccess()) {
                log.info("상담 예약 확인 이메일 발송 성공: consultationId={}, emailId={}", consultationId, response.getEmailId());
            } else {
                log.error("상담 예약 확인 이메일 발송 실패: consultationId={}, error={}", consultationId, response.getErrorMessage());
            }
            
        } catch (Exception e) {
            log.error("상담 예약 확인 알림 발송 중 오류: consultationId={}, error={}", consultationId, e.getMessage(), e);
        }
    }
    
    @Override
    public void sendConsultationReminder(Long consultationId) {
        try {
            log.info("상담 리마인더 발송: consultationId={}", consultationId);
            
            Consultation consultation = findActiveByIdOrThrow(consultationId);
            
            // 클라이언트 이메일 조회 (실제 구현에서는 UserService를 통해 조회)
            String clientEmail = "client@example.com"; // TODO: 실제 클라이언트 이메일 조회
            String clientName = "클라이언트"; // TODO: 실제 클라이언트 이름 조회
            
            // 이메일 템플릿 변수 설정
            Map<String, Object> variables = new HashMap<>();
            variables.put(EmailConstants.VAR_USER_NAME, clientName);
            variables.put(EmailConstants.VAR_USER_EMAIL, clientEmail);
            variables.put(EmailConstants.VAR_COMPANY_NAME, "마음정원");
            variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
            variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
            variables.put(EmailConstants.VAR_APPOINTMENT_DATE, consultation.getConsultationDate() != null ? consultation.getConsultationDate().toString() : "");
            variables.put(EmailConstants.VAR_APPOINTMENT_TIME, consultation.getStartTime() != null ? consultation.getStartTime().toString() : "");
            variables.put(EmailConstants.VAR_CONSULTANT_NAME, "상담사"); // TODO: 실제 상담사 이름 조회
            
            // 템플릿 기반 이메일 발송
            EmailResponse response = emailService.sendTemplateEmail(
                    EmailConstants.TEMPLATE_APPOINTMENT_REMINDER,
                    clientEmail,
                    clientName,
                    variables
            );
            
            if (response.isSuccess()) {
                log.info("상담 리마인더 이메일 발송 성공: consultationId={}, emailId={}", consultationId, response.getEmailId());
            } else {
                log.error("상담 리마인더 이메일 발송 실패: consultationId={}, error={}", consultationId, response.getErrorMessage());
            }
            
        } catch (Exception e) {
            log.error("상담 리마인더 발송 중 오류: consultationId={}, error={}", consultationId, e.getMessage(), e);
        }
    }
    
    @Override
    public void sendConsultationChangeNotification(Long consultationId, String changeType) {
        try {
            log.info("상담 변경 알림 발송: consultationId={}, changeType={}", consultationId, changeType);
            
            Consultation consultation = findActiveByIdOrThrow(consultationId);
            
            // 클라이언트 이메일 조회 (실제 구현에서는 UserService를 통해 조회)
            String clientEmail = "client@example.com"; // TODO: 실제 클라이언트 이메일 조회
            String clientName = "클라이언트"; // TODO: 실제 클라이언트 이름 조회
            
            // 이메일 템플릿 변수 설정
            Map<String, Object> variables = new HashMap<>();
            variables.put(EmailConstants.VAR_USER_NAME, clientName);
            variables.put(EmailConstants.VAR_USER_EMAIL, clientEmail);
            variables.put(EmailConstants.VAR_COMPANY_NAME, "마음정원");
            variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
            variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
            variables.put(EmailConstants.VAR_APPOINTMENT_DATE, consultation.getConsultationDate() != null ? consultation.getConsultationDate().toString() : "");
            variables.put(EmailConstants.VAR_APPOINTMENT_TIME, consultation.getStartTime() != null ? consultation.getStartTime().toString() : "");
            variables.put(EmailConstants.VAR_CONSULTANT_NAME, "상담사"); // TODO: 실제 상담사 이름 조회
            variables.put("changeType", changeType);
            variables.put("changeMessage", "상담 일정이 " + changeType + "되었습니다.");
            
            // 템플릿 기반 이메일 발송
            EmailResponse response = emailService.sendTemplateEmail(
                    EmailConstants.TEMPLATE_SYSTEM_NOTIFICATION,
                    clientEmail,
                    clientName,
                    variables
            );
            
            if (response.isSuccess()) {
                log.info("상담 변경 알림 이메일 발송 성공: consultationId={}, emailId={}", consultationId, response.getEmailId());
            } else {
                log.error("상담 변경 알림 이메일 발송 실패: consultationId={}, error={}", consultationId, response.getErrorMessage());
            }
            
        } catch (Exception e) {
            log.error("상담 변경 알림 발송 중 오류: consultationId={}, error={}", consultationId, e.getMessage(), e);
        }
    }
    
    @Override
    public void sendConsultationCompletionNotification(Long consultationId) {
        try {
            log.info("상담 완료 알림 발송: consultationId={}", consultationId);
            
            Consultation consultation = findActiveByIdOrThrow(consultationId);
            
            // 클라이언트 이메일 조회 (실제 구현에서는 UserService를 통해 조회)
            String clientEmail = "client@example.com"; // TODO: 실제 클라이언트 이메일 조회
            String clientName = "클라이언트"; // TODO: 실제 클라이언트 이름 조회
            
            // 이메일 템플릿 변수 설정
            Map<String, Object> variables = new HashMap<>();
            variables.put(EmailConstants.VAR_USER_NAME, clientName);
            variables.put(EmailConstants.VAR_USER_EMAIL, clientEmail);
            variables.put(EmailConstants.VAR_COMPANY_NAME, "마음정원");
            variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
            variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
            variables.put(EmailConstants.VAR_APPOINTMENT_DATE, consultation.getConsultationDate() != null ? consultation.getConsultationDate().toString() : "");
            variables.put(EmailConstants.VAR_APPOINTMENT_TIME, consultation.getStartTime() != null ? consultation.getStartTime().toString() : "");
            variables.put(EmailConstants.VAR_CONSULTANT_NAME, "상담사"); // TODO: 실제 상담사 이름 조회
            variables.put("completionMessage", "상담이 성공적으로 완료되었습니다. 감사합니다.");
            
            // 템플릿 기반 이메일 발송
            EmailResponse response = emailService.sendTemplateEmail(
                    EmailConstants.TEMPLATE_SYSTEM_NOTIFICATION,
                    clientEmail,
                    clientName,
                    variables
            );
            
            if (response.isSuccess()) {
                log.info("상담 완료 알림 이메일 발송 성공: consultationId={}, emailId={}", consultationId, response.getEmailId());
            } else {
                log.error("상담 완료 알림 이메일 발송 실패: consultationId={}, error={}", consultationId, response.getErrorMessage());
            }
            
        } catch (Exception e) {
            log.error("상담 완료 알림 발송 중 오류: consultationId={}, error={}", consultationId, e.getMessage(), e);
        }
    }
    
    // === 상담 검색 및 필터링 ===
    
    @Override
    public Page<Consultation> searchConsultations(Map<String, Object> searchCriteria, Pageable pageable) {
        // 고급 상담 검색 로직
        // TODO: 실제 검색 로직 구현
        return Page.empty(pageable);
    }
    
    @Override
    public List<Consultation> searchConsultationHistory(Long clientId, Map<String, Object> searchCriteria) {
        // 상담 히스토리 검색 로직
        return findByClientId(clientId);
    }
    
    @Override
    public List<Consultation> searchConsultantHistory(Long consultantId, Map<String, Object> searchCriteria) {
        // 상담사별 상담 히스토리 검색 로직
        return findByConsultantId(consultantId);
    }
    
    // === 상담 데이터 관리 ===
    
    @Override
    public void backupConsultationData(LocalDate startDate, LocalDate endDate) {
        // 상담 데이터 백업 로직
        // TODO: 실제 백업 로직 구현
    }
    
    @Override
    public void restoreConsultationData(String backupId) {
        // 상담 데이터 복원 로직
        // TODO: 실제 복원 로직 구현
    }
    
    @Override
    public void archiveConsultationData(LocalDate beforeDate) {
        // 상담 데이터 아카이브 로직
        // TODO: 실제 아카이브 로직 구현
    }
    
    @Override
    public void cleanupConsultationData(LocalDate beforeDate) {
        // 상담 데이터 정리 로직
        // TODO: 실제 정리 로직 구현
    }
    
    // === 기존 메서드들 (인터페이스와 일치하도록 수정) ===
    
    @Override
    public long countConsultationsByStatus(String status) {
        return consultationRepository.countByStatus(status);
    }
    
    @Override
    public long countConsultationsByClient(Long clientId) {
        return consultationRepository.countByClientId(clientId);
    }
    
    @Override
    public long countConsultationsByConsultant(Long consultantId) {
        return consultationRepository.countByConsultantId(consultantId);
    }
    
    @Override
    public Optional<Consultation> findById(Long id) {
        return consultationRepository.findById(id);
    }
}
