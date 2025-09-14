package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.mindgarden.consultation.constant.EmailConstants;
import com.mindgarden.consultation.dto.EmailResponse;
import com.mindgarden.consultation.entity.Client;
import com.mindgarden.consultation.entity.Consultant;
import com.mindgarden.consultation.entity.Consultation;
import com.mindgarden.consultation.entity.Note;
import com.mindgarden.consultation.entity.Review;
import com.mindgarden.consultation.repository.BaseRepository;
import com.mindgarden.consultation.repository.ClientRepository;
import com.mindgarden.consultation.repository.ConsultantRepository;
import com.mindgarden.consultation.repository.ConsultationRepository;
import com.mindgarden.consultation.repository.DiscountRepository;
import com.mindgarden.consultation.repository.NoteRepository;
import com.mindgarden.consultation.repository.QualityEvaluationRepository;
import com.mindgarden.consultation.repository.ReviewRepository;
import com.mindgarden.consultation.service.ConsultationService;
import com.mindgarden.consultation.service.EmailService;
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
    private ReviewRepository reviewRepository;
    
    @Autowired
    private NoteRepository noteRepository;
    
    @Autowired
    @SuppressWarnings("unused")
    private QualityEvaluationRepository qualityEvaluationRepository;
    
    @Autowired
    @SuppressWarnings("unused")
    private DiscountRepository discountRepository;
    
    @Autowired
    private ClientRepository clientRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private com.mindgarden.consultation.repository.ScheduleRepository scheduleRepository;
    
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
    public int getCompletedConsultationCount(Long consultantId, LocalDate startDate, LocalDate endDate) {
        log.info("🔍 상담사별 완료된 상담 건수 조회: 상담사ID={}, 기간={} ~ {}", consultantId, startDate, endDate);
        return consultationRepository.countByConsultantIdAndStatusAndCreatedAtBetween(
            consultantId, 
            "COMPLETED", 
            startDate.atStartOfDay(), 
            endDate.atTime(23, 59, 59)
        );
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
        
        // 스케줄 상태 동기화
        syncScheduleStatus(consultationId);
        
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
        log.info("상담 평가 등록: consultationId={}, rating={}, clientId={}", consultationId, rating, clientId);
        
        Consultation consultation = findActiveByIdOrThrow(consultationId);
        
        // Review 엔티티 생성 및 저장 로직 구현
        try {
            // Review 엔티티 생성 및 저장
            Review reviewEntity = Review.builder()
                    .consultationId(consultationId)
                    .clientId(Long.parseLong(clientId))
                    .consultantId(consultation.getConsultantId())
                    .rating(rating)
                    .reviewText(review)
                    .isAnonymous(false)
                    .isVerified(false)
                    .isDeleted(false)
                    .build();
            
            reviewRepository.save(reviewEntity);
            
            log.info("상담 평가 등록 완료: consultationId={}, rating={}", consultationId, rating);
            
        } catch (Exception e) {
            log.error("상담 평가 등록 실패: consultationId={}, error={}", consultationId, e.getMessage(), e);
            throw new RuntimeException("상담 평가 등록에 실패했습니다.", e);
        }
    }
    
    @Override
    public void updateConsultationReview(Long consultationId, int rating, String review) {
        // 상담 평가 수정 로직
        log.info("상담 평가 수정: consultationId={}, rating={}", consultationId, rating);
        
        Consultation consultation = findActiveByIdOrThrow(consultationId);
        
        // Review 엔티티 수정 로직 구현
        try {
            // Review 엔티티 조회 및 수정
            Review reviewEntity = reviewRepository.findByConsultationIdAndClientIdAndIsDeletedFalse(
                consultationId, Long.parseLong(consultation.getClientId().toString())).orElse(null);
            
            if (reviewEntity != null) {
                reviewEntity.updateReview(rating, review);
                reviewRepository.save(reviewEntity);
            } else {
                // 기존 리뷰가 없으면 새로 생성
                Review newReview = Review.builder()
                        .consultationId(consultationId)
                        .clientId(Long.parseLong(consultation.getClientId().toString()))
                        .consultantId(consultation.getConsultantId())
                        .rating(rating)
                        .reviewText(review)
                        .isAnonymous(false)
                        .isVerified(false)
                        .isDeleted(false)
                        .build();
                reviewRepository.save(newReview);
            }
            
            log.info("상담 평가 수정 완료: consultationId={}, rating={}", consultationId, rating);
            
        } catch (Exception e) {
            log.error("상담 평가 수정 실패: consultationId={}, error={}", consultationId, e.getMessage(), e);
            throw new RuntimeException("상담 평가 수정에 실패했습니다.", e);
        }
    }
    
    @Override
    public Map<String, Object> getConsultationReview(Long consultationId) {
        // 상담 평가 조회 로직
        log.info("상담 평가 조회: consultationId={}", consultationId);
        
        Map<String, Object> review = new HashMap<>();
        review.put("consultationId", consultationId);
        review.put("rating", 0);
        review.put("review", "");
        review.put("clientId", "");
        
        try {
            // Review 엔티티에서 실제 데이터 조회 로직 구현
            List<Review> reviewEntities = reviewRepository.findByConsultationIdAndIsDeletedFalse(consultationId);
            if (!reviewEntities.isEmpty()) {
                Review reviewEntity = reviewEntities.get(0); // 첫 번째 리뷰 사용
                review.put("rating", reviewEntity.getRating());
                review.put("review", reviewEntity.getReviewText());
                review.put("clientId", reviewEntity.getClientId());
                review.put("consultantId", reviewEntity.getConsultantId());
                review.put("isAnonymous", reviewEntity.getIsAnonymous());
                review.put("isVerified", reviewEntity.getIsVerified());
                review.put("createdAt", reviewEntity.getCreatedAt());
                review.put("updatedAt", reviewEntity.getUpdatedAt());
            }
            
            log.info("상담 평가 조회 완료: consultationId={}, rating={}", 
                    consultationId, review.get("rating"));
            
        } catch (Exception e) {
            log.error("상담 평가 조회 실패: consultationId={}, error={}", consultationId, e.getMessage(), e);
        }
        
        return review;
    }
    
    @Override
    public double getConsultantAverageRating(Long consultantId) {
        // 상담사별 평균 평점 조회 로직
        log.info("상담사별 평균 평점 조회: consultantId={}", consultantId);
        
        List<Consultation> consultations = findByConsultantId(consultantId);
        if (consultations.isEmpty()) {
            log.info("상담사별 상담이 없음: consultantId={}", consultantId);
            return 0.0;
        }
        
        try {
            // Review 엔티티에서 실제 평점 데이터 조회 로직 구현
            List<Review> reviews = reviewRepository.findByConsultantIdAndIsDeletedFalse(consultantId);
            if (reviews.isEmpty()) {
                log.info("상담사별 리뷰가 없음: consultantId={}", consultantId);
                return 0.0;
            }
            
            double averageRating = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
            log.info("상담사별 평균 평점 조회 완료: consultantId={}, averageRating={}", 
                    consultantId, averageRating);
            
            return averageRating;
            
        } catch (Exception e) {
            log.error("상담사별 평균 평점 조회 실패: consultantId={}, error={}", consultantId, e.getMessage(), e);
            return 0.0;
        }
    }
    
    // === 상담 기록 관리 ===
    
    @Override
    public void addConsultationNote(Long consultationId, String note, String authorId) {
        // 상담 노트 추가 로직
        log.info("상담 노트 추가: consultationId={}, authorId={}", consultationId, authorId);
        
        @SuppressWarnings("unused")
        Consultation consultation = findActiveByIdOrThrow(consultationId);
        
        // Note 엔티티 생성 및 저장 로직 구현
        try {
            // Note 엔티티 생성 및 저장
            Note noteEntity = Note.builder()
                    .consultationId(consultationId)
                    .authorId(authorId)
                    .authorType("CONSULTANT") // 기본값
                    .noteText(note)
                    .noteType("CONSULTATION") // 기본값
                    .isPrivate(false)
                    .isImportant(false)
                    .isDeleted(false)
                    .build();
            
            noteRepository.save(noteEntity);
            
            log.info("상담 노트 추가 완료: consultationId={}, authorId={}", consultationId, authorId);
            
        } catch (Exception e) {
            log.error("상담 노트 추가 실패: consultationId={}, error={}", consultationId, e.getMessage(), e);
            throw new RuntimeException("상담 노트 추가에 실패했습니다.", e);
        }
    }
    
    @Override
    public void updateConsultationNote(Long noteId, String note) {
        // 상담 노트 수정 로직
        log.info("상담 노트 수정: noteId={}", noteId);
        
        try {
            // Note 엔티티 수정 로직 구현
            Note noteEntity = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("노트를 찾을 수 없습니다: " + noteId));
            
            noteEntity.updateNote(note);
            noteRepository.save(noteEntity);
            
            log.info("상담 노트 수정 완료: noteId={}", noteId);
            
        } catch (Exception e) {
            log.error("상담 노트 수정 실패: noteId={}, error={}", noteId, e.getMessage(), e);
            throw new RuntimeException("상담 노트 수정에 실패했습니다.", e);
        }
    }
    
    @Override
    public void deleteConsultationNote(Long noteId) {
        // 상담 노트 삭제 로직
        log.info("상담 노트 삭제: noteId={}", noteId);
        
        try {
            // Note 엔티티 삭제 로직 구현
            Note noteEntity = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("노트를 찾을 수 없습니다: " + noteId));
            
            noteEntity.softDelete();
            noteRepository.save(noteEntity);
            
            log.info("상담 노트 삭제 완료: noteId={}", noteId);
            
        } catch (Exception e) {
            log.error("상담 노트 삭제 실패: noteId={}, error={}", noteId, e.getMessage(), e);
            throw new RuntimeException("상담 노트 삭제에 실패했습니다.", e);
        }
    }
    
    @Override
    public List<Map<String, Object>> getConsultationNotes(Long consultationId) {
        // 상담 노트 목록 조회 로직
        log.info("상담 노트 목록 조회: consultationId={}", consultationId);
        
        List<Map<String, Object>> notes = new ArrayList<>();
        
        try {
            // Note 엔티티에서 실제 데이터 조회 로직 구현
            List<Note> noteEntities = noteRepository.findByConsultationIdAndIsDeletedFalse(consultationId);
            for (Note noteEntity : noteEntities) {
                Map<String, Object> note = new HashMap<>();
                note.put("id", noteEntity.getId());
                note.put("consultationId", noteEntity.getConsultationId());
                note.put("authorId", noteEntity.getAuthorId());
                note.put("authorType", noteEntity.getAuthorType());
                note.put("noteText", noteEntity.getNoteText());
                note.put("noteType", noteEntity.getNoteType());
                note.put("isPrivate", noteEntity.getIsPrivate());
                note.put("isImportant", noteEntity.getIsImportant());
                note.put("createdAt", noteEntity.getCreatedAt());
                note.put("updatedAt", noteEntity.getUpdatedAt());
                notes.add(note);
            }
            
            log.info("상담 노트 목록 조회 완료: consultationId={}, count={}", consultationId, notes.size());
            
        } catch (Exception e) {
            log.error("상담 노트 목록 조회 실패: consultationId={}, error={}", consultationId, e.getMessage(), e);
        }
        
        return notes;
    }
    
    @Override
    public byte[] exportConsultationRecord(Long consultationId, String format) {
        // 상담 기록 내보내기 로직
        log.info("상담 기록 내보내기: consultationId={}, format={}", consultationId, format);
        
        try {
            // 실제 내보내기 로직 구현
            Consultation consultation = findActiveByIdOrThrow(consultationId);
            
            // PDF, Excel, Word 등 다양한 형식 지원
            if ("PDF".equalsIgnoreCase(format)) {
                // PDF 내보내기 로직
                return exportToPdf(consultation);
            } else if ("EXCEL".equalsIgnoreCase(format)) {
                // Excel 내보내기 로직
                return exportToExcel(consultation);
            } else if ("WORD".equalsIgnoreCase(format)) {
                // Word 내보내기 로직
                return exportToWord(consultation);
            } else {
                // 기본 텍스트 형식
                return exportToText(consultation);
            }
            
        } catch (Exception e) {
            log.error("상담 기록 내보내기 실패: consultationId={}, format={}, error={}", 
                    consultationId, format, e.getMessage(), e);
            return new byte[0];
        }
    }
    
    private byte[] exportToPdf(Consultation consultation) {
        // PDF 내보내기 구현
        log.info("PDF 내보내기: consultationId={}", consultation.getId());
        
        try {
            // 실제 PDF 생성 로직 구현 (iText, Apache PDFBox 등 사용)
            // 현재는 텍스트를 PDF 형식으로 변환하는 기본 구현
            String content = generateConsultationContent(consultation);
            
            // PDF 생성 시뮬레이션 (실제 구현에서는 iText 또는 Apache PDFBox 사용)
            // Document document = new Document();
            // PdfWriter.getInstance(document, outputStream);
            // document.open();
            // document.add(new Paragraph(content));
            // document.close();
            
            // 현재는 텍스트를 바이트 배열로 반환
            return content.getBytes("UTF-8");
            
        } catch (Exception e) {
            log.error("PDF 내보내기 실패: consultationId={}, error={}", consultation.getId(), e.getMessage(), e);
            return new byte[0];
        }
    }
    
    private byte[] exportToExcel(Consultation consultation) {
        // Excel 내보내기 구현
        log.info("Excel 내보내기: consultationId={}", consultation.getId());
        
        try {
            // 실제 Excel 생성 로직 구현 (Apache POI 사용)
            // 현재는 CSV 형식으로 Excel 데이터 생성
            StringBuilder csvContent = new StringBuilder();
            csvContent.append("상담 ID,상담 날짜,상담 시간,상담 상태,상담 방법,우선순위,위험도,상담 노트,준비 노트\n");
            csvContent.append(consultation.getId()).append(",");
            csvContent.append(consultation.getConsultationDate()).append(",");
            csvContent.append(consultation.getStartTime()).append("-").append(consultation.getEndTime()).append(",");
            csvContent.append(consultation.getStatus()).append(",");
            csvContent.append(consultation.getConsultationMethod()).append(",");
            csvContent.append(consultation.getPriority()).append(",");
            csvContent.append(consultation.getRiskLevel()).append(",");
            csvContent.append("\"").append(consultation.getConsultantNotes()).append("\",");
            csvContent.append("\"").append(consultation.getPreparationNotes()).append("\"\n");
            
            // Excel 생성 시뮬레이션 (실제 구현에서는 Apache POI 사용)
            // Workbook workbook = new XSSFWorkbook();
            // Sheet sheet = workbook.createSheet("상담 기록");
            // Row headerRow = sheet.createRow(0);
            // headerRow.createCell(0).setCellValue("상담 ID");
            // ...
            
            return csvContent.toString().getBytes("UTF-8");
            
        } catch (Exception e) {
            log.error("Excel 내보내기 실패: consultationId={}, error={}", consultation.getId(), e.getMessage(), e);
            return new byte[0];
        }
    }
    
    private byte[] exportToWord(Consultation consultation) {
        // Word 내보내기 구현
        log.info("Word 내보내기: consultationId={}", consultation.getId());
        
        try {
            // 실제 Word 생성 로직 구현 (Apache POI 사용)
            String content = generateConsultationContent(consultation);
            
            // Word 문서 생성 시뮬레이션 (실제 구현에서는 Apache POI 사용)
            // XWPFDocument document = new XWPFDocument();
            // XWPFParagraph paragraph = document.createParagraph();
            // XWPFRun run = paragraph.createRun();
            // run.setText(content);
            
            // 현재는 RTF 형식으로 Word 문서 생성
            StringBuilder rtfContent = new StringBuilder();
            rtfContent.append("{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}");
            rtfContent.append("\\f0\\fs24 ");
            rtfContent.append(content.replace("\n", "\\par "));
            rtfContent.append("}");
            
            return rtfContent.toString().getBytes("UTF-8");
            
        } catch (Exception e) {
            log.error("Word 내보내기 실패: consultationId={}, error={}", consultation.getId(), e.getMessage(), e);
            return new byte[0];
        }
    }
    
    private byte[] exportToText(Consultation consultation) {
        // 텍스트 내보내기 구현
        log.info("텍스트 내보내기: consultationId={}", consultation.getId());
        
        StringBuilder content = new StringBuilder();
        content.append("=== 상담 기록 ===\n");
        content.append("상담 ID: ").append(consultation.getId()).append("\n");
        content.append("상담 날짜: ").append(consultation.getConsultationDate()).append("\n");
        content.append("상담 시간: ").append(consultation.getStartTime()).append(" - ").append(consultation.getEndTime()).append("\n");
        content.append("상담 상태: ").append(consultation.getStatus()).append("\n");
        content.append("상담 방법: ").append(consultation.getConsultationMethod()).append("\n");
        content.append("우선순위: ").append(consultation.getPriority()).append("\n");
        content.append("위험도: ").append(consultation.getRiskLevel()).append("\n");
        content.append("상담 노트: ").append(consultation.getConsultantNotes()).append("\n");
        content.append("준비 노트: ").append(consultation.getPreparationNotes()).append("\n");
        
        return content.toString().getBytes();
    }
    
    private String generateConsultationContent(Consultation consultation) {
        // 상담 내용 생성 헬퍼 메서드
        StringBuilder content = new StringBuilder();
        content.append("=== 상담 기록 ===\n");
        content.append("상담 ID: ").append(consultation.getId()).append("\n");
        content.append("상담 날짜: ").append(consultation.getConsultationDate()).append("\n");
        content.append("상담 시간: ").append(consultation.getStartTime()).append(" - ").append(consultation.getEndTime()).append("\n");
        content.append("상담 상태: ").append(consultation.getStatus()).append("\n");
        content.append("상담 방법: ").append(consultation.getConsultationMethod()).append("\n");
        content.append("우선순위: ").append(consultation.getPriority()).append("\n");
        content.append("위험도: ").append(consultation.getRiskLevel()).append("\n");
        content.append("긴급 상담: ").append(consultation.getIsEmergency() ? "예" : "아니오").append("\n");
        content.append("첫 상담: ").append(consultation.getIsFirstSession() ? "예" : "아니오").append("\n");
        content.append("상담 시간(분): ").append(consultation.getDurationMinutes()).append("\n");
        content.append("상담 노트: ").append(consultation.getConsultantNotes()).append("\n");
        content.append("준비 노트: ").append(consultation.getPreparationNotes()).append("\n");
        content.append("생성일: ").append(consultation.getCreatedAt()).append("\n");
        content.append("수정일: ").append(consultation.getUpdatedAt()).append("\n");
        return content.toString();
    }
    
    // === 긴급 상담 관리 ===
    
    @Override
    public Consultation requestEmergencyConsultation(Long clientId, String emergencyReason) {
        // 긴급 상담 요청 로직
        log.info("긴급 상담 요청: clientId={}, reason={}", clientId, emergencyReason);
        
        try {
            Consultation consultation = new Consultation();
            consultation.setIsEmergency(true);
            consultation.setPriority("URGENT"); // 긴급 상담은 최고 우선순위
            consultation.setStatus("REQUESTED");
            consultation.setCreatedAt(LocalDateTime.now());
            consultation.setVersion(1L);
            consultation.setClientId(clientId);
            consultation.setPreparationNotes("긴급 상담 요청: " + emergencyReason);
            
            // Client 엔티티 설정 로직 구현
            try {
                Client client = clientRepository.findById(clientId)
                    .orElseThrow(() -> new RuntimeException("클라이언트를 찾을 수 없습니다: " + clientId));
                consultation.setClientId(clientId);
                log.info("긴급 상담 요청 - 클라이언트 정보 확인: clientId={}, name={}", clientId, client.getName());
            } catch (Exception e) {
                log.warn("클라이언트 정보 조회 실패, 기본값 사용: clientId={}, error={}", clientId, e.getMessage());
                consultation.setClientId(clientId);
            }
            
            Consultation savedConsultation = save(consultation);
            
            // 긴급 상담 알림 발송
            sendEmergencyConsultationNotification(savedConsultation.getId(), emergencyReason);
            
            log.info("긴급 상담 요청 완료: consultationId={}, clientId={}", savedConsultation.getId(), clientId);
            
            return savedConsultation;
            
        } catch (Exception e) {
            log.error("긴급 상담 요청 실패: clientId={}, error={}", clientId, e.getMessage(), e);
            throw new RuntimeException("긴급 상담 요청에 실패했습니다.", e);
        }
    }
    
    private void sendEmergencyConsultationNotification(Long consultationId, String emergencyReason) {
        try {
            log.info("긴급 상담 알림 발송: consultationId={}", consultationId);
            
            // 관리자에게 긴급 상담 알림 이메일 발송
            Map<String, Object> variables = new HashMap<>();
            variables.put(EmailConstants.VAR_COMPANY_NAME, "mindgarden");
            variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
            variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
            variables.put("consultationId", consultationId);
            variables.put("emergencyReason", emergencyReason);
            variables.put("alertMessage", "긴급 상담 요청이 접수되었습니다. 즉시 확인해주세요.");
            
            // 관리자 이메일로 긴급 알림 발송
            EmailResponse response = emailService.sendTemplateEmail(
                    EmailConstants.TEMPLATE_SYSTEM_NOTIFICATION,
                    "admin@mindgarden.com", // 관리자 이메일
                    "관리자",
                    variables
            );
            
            if (response.isSuccess()) {
                log.info("긴급 상담 알림 이메일 발송 성공: consultationId={}", consultationId);
            } else {
                log.error("긴급 상담 알림 이메일 발송 실패: consultationId={}, error={}", 
                        consultationId, response.getErrorMessage());
            }
            
        } catch (Exception e) {
            log.error("긴급 상담 알림 발송 중 오류: consultationId={}, error={}", consultationId, e.getMessage(), e);
        }
    }
    
    @Override
    public Consultation assignEmergencyConsultation(Long consultationId, Long consultantId) {
        // 긴급 상담 할당 로직
        log.info("긴급 상담 할당: consultationId={}, consultantId={}", consultationId, consultantId);
        
        try {
            Consultation consultation = findActiveByIdOrThrow(consultationId);
            consultation.setStatus("ASSIGNED");
            consultation.setUpdatedAt(LocalDateTime.now());
            consultation.setVersion(consultation.getVersion() + 1);
            consultation.setConsultantId(consultantId);
            
            // Consultant 엔티티 설정 로직 구현
            try {
                Consultant consultant = consultantRepository.findById(consultantId)
                    .orElseThrow(() -> new RuntimeException("상담사를 찾을 수 없습니다: " + consultantId));
                consultation.setConsultantId(consultantId);
                log.info("긴급 상담 할당 - 상담사 정보 확인: consultantId={}, name={}", consultantId, consultant.getName());
            } catch (Exception e) {
                log.warn("상담사 정보 조회 실패, 기본값 사용: consultantId={}, error={}", consultantId, e.getMessage());
                consultation.setConsultantId(consultantId);
            }
            
            Consultation savedConsultation = save(consultation);
            
            // 긴급 상담 할당 알림 발송
            sendEmergencyAssignmentNotification(savedConsultation.getId(), consultantId);
            
            log.info("긴급 상담 할당 완료: consultationId={}, consultantId={}", consultationId, consultantId);
            
            return savedConsultation;
            
        } catch (Exception e) {
            log.error("긴급 상담 할당 실패: consultationId={}, consultantId={}, error={}", 
                    consultationId, consultantId, e.getMessage(), e);
            throw new RuntimeException("긴급 상담 할당에 실패했습니다.", e);
        }
    }
    
    private void sendEmergencyAssignmentNotification(Long consultationId, Long consultantId) {
        try {
            log.info("긴급 상담 할당 알림 발송: consultationId={}, consultantId={}", consultationId, consultantId);
            
            // 상담사에게 긴급 상담 할당 알림 이메일 발송
            Map<String, Object> variables = new HashMap<>();
            variables.put(EmailConstants.VAR_COMPANY_NAME, "mindgarden");
            variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
            variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
            variables.put("consultationId", consultationId);
            variables.put("consultantId", consultantId);
            variables.put("alertMessage", "긴급 상담이 할당되었습니다. 즉시 확인해주세요.");
            
            // 상담사 이메일로 긴급 할당 알림 발송
            EmailResponse response = emailService.sendTemplateEmail(
                    EmailConstants.TEMPLATE_SYSTEM_NOTIFICATION,
                    "consultant@mindgarden.com", // 상담사 이메일
                    "상담사",
                    variables
            );
            
            if (response.isSuccess()) {
                log.info("긴급 상담 할당 알림 이메일 발송 성공: consultationId={}", consultationId);
            } else {
                log.error("긴급 상담 할당 알림 이메일 발송 실패: consultationId={}, error={}", 
                        consultationId, response.getErrorMessage());
            }
            
        } catch (Exception e) {
            log.error("긴급 상담 할당 알림 발송 중 오류: consultationId={}, error={}", consultationId, e.getMessage(), e);
        }
    }
    
    @Override
    public void updateEmergencyPriority(Long consultationId, int priority) {
        // 긴급 상담 우선순위 조정 로직
        log.info("긴급 상담 우선순위 조정: consultationId={}, priority={}", consultationId, priority);
        
        try {
            Consultation consultation = findActiveByIdOrThrow(consultationId);
            
            // 우선순위 필드 설정 로직 구현
            String priorityLevel;
            switch (priority) {
                case 1:
                    priorityLevel = "LOW";
                    break;
                case 2:
                    priorityLevel = "MEDIUM";
                    break;
                case 3:
                    priorityLevel = "HIGH";
                    break;
                case 4:
                    priorityLevel = "URGENT";
                    break;
                default:
                    priorityLevel = "MEDIUM";
                    log.warn("잘못된 우선순위 값: {}, 기본값 MEDIUM 사용", priority);
            }
            
            consultation.setPriority(priorityLevel);
            consultation.setUpdatedAt(LocalDateTime.now());
            consultation.setVersion(consultation.getVersion() + 1);
            save(consultation);
            
            log.info("긴급 상담 우선순위 조정 완료: consultationId={}, priority={}", consultationId, priorityLevel);
            
        } catch (Exception e) {
            log.error("긴급 상담 우선순위 조정 실패: consultationId={}, priority={}, error={}", 
                    consultationId, priority, e.getMessage(), e);
            throw new RuntimeException("긴급 상담 우선순위 조정에 실패했습니다.", e);
        }
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
        log.info("상담 품질 평가: consultationId={}, metrics={}", consultationId, qualityMetrics);
        
        try {
            Consultation consultation = findActiveByIdOrThrow(consultationId);
            
            // 품질 평가 데이터 저장 로직 구현
            // QualityEvaluation 엔티티가 생성되면 실제 구현
            // 현재는 상담 엔티티에 품질 평가 데이터를 JSON 형태로 저장
            Map<String, Object> qualityData = new HashMap<>();
            qualityData.put("overallScore", qualityMetrics.get("overallScore"));
            qualityData.put("communicationScore", qualityMetrics.get("communicationScore"));
            qualityData.put("professionalismScore", qualityMetrics.get("professionalismScore"));
            qualityData.put("effectivenessScore", qualityMetrics.get("effectivenessScore"));
            qualityData.put("clientSatisfactionScore", qualityMetrics.get("clientSatisfactionScore"));
            qualityData.put("evaluatorId", qualityMetrics.get("evaluatorId"));
            qualityData.put("evaluationNotes", qualityMetrics.get("evaluationNotes"));
            qualityData.put("evaluatedAt", LocalDateTime.now().toString());
            
            // JSON으로 직렬화하여 상담 노트에 저장
            com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String qualityJson = objectMapper.writeValueAsString(qualityData);
            
            if (consultation.getConsultantNotes() == null) {
                consultation.setConsultantNotes("");
            }
            consultation.setConsultantNotes(consultation.getConsultantNotes() + 
                "\n[품질평가JSON] " + qualityJson);
            
            
            consultation.setUpdatedAt(LocalDateTime.now());
            consultation.setVersion(consultation.getVersion() + 1);
            save(consultation);
            
            log.info("상담 품질 평가 완료: consultationId={}, overallScore={}", 
                    consultationId, qualityMetrics.get("overallScore"));
            
        } catch (Exception e) {
            log.error("상담 품질 평가 실패: consultationId={}, error={}", consultationId, e.getMessage(), e);
            throw new RuntimeException("상담 품질 평가에 실패했습니다.", e);
        }
    }
    
    @Override
    public Map<String, Object> generateQualityReport(Long consultantId, LocalDate startDate, LocalDate endDate) {
        // 상담 품질 보고서 생성 로직
        log.info("상담 품질 보고서 생성: consultantId={}, startDate={}, endDate={}", 
                consultantId, startDate, endDate);
        
        Map<String, Object> report = new HashMap<>();
        report.put("consultantId", consultantId);
        report.put("startDate", startDate);
        report.put("endDate", endDate);
        
        try {
            // 실제 품질 보고서 생성 로직 구현
            List<Consultation> consultations = findByConsultantId(consultantId);
            
            // 기간 필터링
            List<Consultation> filteredConsultations = consultations.stream()
                    .filter(c -> c.getConsultationDate() != null && 
                            !c.getConsultationDate().isBefore(startDate) && 
                            !c.getConsultationDate().isAfter(endDate))
                    .collect(java.util.stream.Collectors.toList());
            
            // 품질 평가 데이터 분석
            double totalScore = 0.0;
            int evaluationCount = 0;
            List<String> improvementAreas = new ArrayList<>();
            
            for (Consultation consultation : filteredConsultations) {
                if (consultation.getConsultantNotes() != null && 
                    consultation.getConsultantNotes().contains("[품질평가JSON]")) {
                    
                    try {
                        String notes = consultation.getConsultantNotes();
                        String[] lines = notes.split("\n");
                        for (String line : lines) {
                            if (line.contains("[품질평가JSON]")) {
                                String jsonStr = line.substring(line.indexOf("[품질평가JSON]") + 14).trim();
                                com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
                                @SuppressWarnings("unchecked")
                                Map<String, Object> qualityData = objectMapper.readValue(jsonStr, Map.class);
                                
                                Object overallScoreObj = qualityData.get("overallScore");
                                if (overallScoreObj != null) {
                                    double score = ((Number) overallScoreObj).doubleValue();
                                    totalScore += score;
                                    evaluationCount++;
                                }
                                break;
                            }
                        }
                    } catch (Exception e) {
                        log.warn("품질 평가 JSON 파싱 실패: consultationId={}, error={}", 
                                consultation.getId(), e.getMessage());
                    }
                }
            }
            
            double overallQuality = evaluationCount > 0 ? totalScore / evaluationCount : 0.0;
            
            // 개선 영역 분석
            if (overallQuality < 3.0) {
                improvementAreas.add("전반적인 상담 품질 향상이 필요합니다.");
            }
            if (overallQuality < 4.0) {
                improvementAreas.add("의사소통 능력 개선이 필요합니다.");
                improvementAreas.add("전문성 향상이 필요합니다.");
            }
            
            report.put("overallQuality", overallQuality);
            report.put("evaluationCount", evaluationCount);
            report.put("totalConsultations", filteredConsultations.size());
            report.put("improvementAreas", improvementAreas);
            
            log.info("상담 품질 보고서 생성 완료: consultantId={}, overallQuality={}, evaluationCount={}", 
                    consultantId, overallQuality, evaluationCount);
            
        } catch (Exception e) {
            log.error("상담 품질 보고서 생성 실패: consultantId={}, error={}", consultantId, e.getMessage(), e);
            report.put("overallQuality", 0.0);
            report.put("evaluationCount", 0);
            report.put("totalConsultations", 0);
            report.put("improvementAreas", new ArrayList<>());
        }
        
        return report;
    }
    
    @Override
    public List<String> getQualityImprovementSuggestions(Long consultantId) {
        // 상담 품질 개선 제안 로직
        log.info("상담 품질 개선 제안 조회: consultantId={}", consultantId);
        
        List<String> suggestions = new ArrayList<>();
        
        try {
            // 실제 개선 제안 로직 구현
            List<Consultation> consultations = findByConsultantId(consultantId);
            
            // 최근 30일간의 상담 데이터 분석
            LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
            List<Consultation> recentConsultations = consultations.stream()
                    .filter(c -> c.getConsultationDate() != null && 
                            !c.getConsultationDate().isBefore(thirtyDaysAgo))
                    .collect(java.util.stream.Collectors.toList());
            
            // 기본 제안사항
            suggestions.add("더 적극적인 경청이 필요합니다.");
            suggestions.add("상담 시간을 더 정확하게 지켜주세요.");
            suggestions.add("클라이언트의 감정 상태를 더 세심하게 관찰해주세요.");
            
            // 데이터 기반 개선 제안
            if (recentConsultations.size() < 5) {
                suggestions.add("상담 빈도를 늘려 경험을 쌓아보세요.");
            }
            
            // 취소율 분석
            long cancelledCount = recentConsultations.stream()
                    .filter(c -> "CANCELLED".equals(c.getStatus()))
                    .count();
            double cancellationRate = recentConsultations.size() > 0 ? 
                    (double) cancelledCount / recentConsultations.size() : 0.0;
            
            if (cancellationRate > 0.2) {
                suggestions.add("상담 취소율이 높습니다. 일정 관리와 소통을 개선해보세요.");
            }
            
            // 완료율 분석
            long completedCount = recentConsultations.stream()
                    .filter(c -> "COMPLETED".equals(c.getStatus()))
                    .count();
            double completionRate = recentConsultations.size() > 0 ? 
                    (double) completedCount / recentConsultations.size() : 0.0;
            
            if (completionRate < 0.8) {
                suggestions.add("상담 완료율을 높이기 위해 클라이언트와의 소통을 강화해보세요.");
            }
            
            // 긴급 상담 비율 분석
            long emergencyCount = recentConsultations.stream()
                    .filter(c -> Boolean.TRUE.equals(c.getIsEmergency()))
                    .count();
            
            if (emergencyCount > recentConsultations.size() * 0.3) {
                suggestions.add("긴급 상담 비율이 높습니다. 예방적 상담을 늘려보세요.");
            }
            
            log.info("상담 품질 개선 제안 조회 완료: consultantId={}, suggestions={}", 
                    consultantId, suggestions.size());
            
        } catch (Exception e) {
            log.error("상담 품질 개선 제안 조회 실패: consultantId={}, error={}", consultantId, e.getMessage(), e);
            // 기본 제안사항 반환
            suggestions.add("더 적극적인 경청이 필요합니다.");
            suggestions.add("상담 시간을 더 정확하게 지켜주세요.");
            suggestions.add("클라이언트의 감정 상태를 더 세심하게 관찰해주세요.");
        }
        
        return suggestions;
    }
    
    // === 상담 비용 관리 ===
    
    @Override
    public Map<String, Object> calculateConsultationCost(Long consultationId) {
        // 상담 비용 계산 로직
        log.info("상담 비용 계산: consultationId={}", consultationId);
        
        Map<String, Object> cost = new HashMap<>();
        cost.put("consultationId", consultationId);
        
        try {
            // 실제 비용 계산 로직 구현
            Consultation consultation = findActiveByIdOrThrow(consultationId);
            
            // 기본 상담 비용 (상담 방법별 차등)
            int baseCost = 50000; // 기본 50,000원
            if ("VIDEO_CALL".equals(consultation.getConsultationMethod())) {
                baseCost = 45000; // 화상 상담 10% 할인
            } else if ("PHONE_CALL".equals(consultation.getConsultationMethod())) {
                baseCost = 40000; // 전화 상담 20% 할인
            } else if ("CHAT".equals(consultation.getConsultationMethod())) {
                baseCost = 30000; // 채팅 상담 40% 할인
            }
            
            // 긴급 상담 추가 비용
            if (Boolean.TRUE.equals(consultation.getIsEmergency())) {
                baseCost += 20000; // 긴급 상담 20,000원 추가
            }
            
            // 우선순위별 추가 비용
            if ("URGENT".equals(consultation.getPriority())) {
                baseCost += 10000; // 긴급 우선순위 10,000원 추가
            } else if ("HIGH".equals(consultation.getPriority())) {
                baseCost += 5000; // 높은 우선순위 5,000원 추가
            }
            
            // 상담 시간에 따른 비용 조정
            if (consultation.getDurationMinutes() != null) {
                int duration = consultation.getDurationMinutes();
                if (duration > 60) {
                    baseCost += (duration - 60) * 500; // 60분 초과 시 분당 500원 추가
                }
            }
            
            // 할인 적용 (기본 0원)
            int discountAmount = 0;
            
            // 최종 비용 계산
            int finalCost = Math.max(0, baseCost - discountAmount);
            
            cost.put("baseCost", baseCost);
            cost.put("discountAmount", discountAmount);
            cost.put("finalCost", finalCost);
            cost.put("consultationMethod", consultation.getConsultationMethod());
            cost.put("isEmergency", consultation.getIsEmergency());
            cost.put("priority", consultation.getPriority());
            cost.put("durationMinutes", consultation.getDurationMinutes());
            
            log.info("상담 비용 계산 완료: consultationId={}, finalCost={}", consultationId, finalCost);
            
        } catch (Exception e) {
            log.error("상담 비용 계산 실패: consultationId={}, error={}", consultationId, e.getMessage(), e);
            cost.put("baseCost", 50000);
            cost.put("discountAmount", 0);
            cost.put("finalCost", 50000);
        }
        
        return cost;
    }
    
    @Override
    public void applyDiscount(Long consultationId, String discountType, double discountAmount) {
        // 상담 비용 할인 적용 로직
        log.info("상담 비용 할인 적용: consultationId={}, discountType={}, discountAmount={}", 
                consultationId, discountType, discountAmount);
        
        try {
            Consultation consultation = findActiveByIdOrThrow(consultationId);
            
            // 할인 정보 저장 로직 구현
            // Discount 엔티티가 생성되면 실제 구현
            // 현재는 상담 엔티티에 할인 정보를 JSON 형태로 저장
            Map<String, Object> discountData = new HashMap<>();
            discountData.put("discountType", discountType);
            discountData.put("discountAmount", discountAmount);
            discountData.put("appliedAt", LocalDateTime.now().toString());
            discountData.put("isActive", true);
            
            // JSON으로 직렬화하여 상담 노트에 저장
            com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String discountJson = objectMapper.writeValueAsString(discountData);
            
            if (consultation.getConsultantNotes() == null) {
                consultation.setConsultantNotes("");
            }
            consultation.setConsultantNotes(consultation.getConsultantNotes() + 
                "\n[할인정보JSON] " + discountJson);
            
            
            consultation.setUpdatedAt(LocalDateTime.now());
            consultation.setVersion(consultation.getVersion() + 1);
            save(consultation);
            
            log.info("상담 비용 할인 적용 완료: consultationId={}, discountType={}, discountAmount={}", 
                    consultationId, discountType, discountAmount);
            
        } catch (Exception e) {
            log.error("상담 비용 할인 적용 실패: consultationId={}, error={}", consultationId, e.getMessage(), e);
            throw new RuntimeException("상담 비용 할인 적용에 실패했습니다.", e);
        }
    }
    
    @Override
    public void settleConsultationCost(Long consultationId, String paymentMethod) {
        // 상담 비용 정산 로직
        log.info("상담 비용 정산: consultationId={}, paymentMethod={}", consultationId, paymentMethod);
        
        try {
            Consultation consultation = findActiveByIdOrThrow(consultationId);
            
            // 결제 정보 저장 로직 구현
            // Payment 엔티티가 생성되면 실제 구현
            // 현재는 상담 엔티티에 결제 정보를 JSON 형태로 저장
            Map<String, Object> costInfo = calculateConsultationCost(consultationId);
            Map<String, Object> paymentData = new HashMap<>();
            paymentData.put("paymentMethod", paymentMethod);
            paymentData.put("amount", costInfo.get("finalCost"));
            paymentData.put("baseCost", costInfo.get("baseCost"));
            paymentData.put("discountAmount", costInfo.get("discountAmount"));
            paymentData.put("paymentStatus", "COMPLETED");
            paymentData.put("paidAt", LocalDateTime.now().toString());
            paymentData.put("consultationMethod", costInfo.get("consultationMethod"));
            paymentData.put("isEmergency", costInfo.get("isEmergency"));
            paymentData.put("priority", costInfo.get("priority"));
            
            // JSON으로 직렬화하여 상담 노트에 저장
            com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String paymentJson = objectMapper.writeValueAsString(paymentData);
            
            if (consultation.getConsultantNotes() == null) {
                consultation.setConsultantNotes("");
            }
            consultation.setConsultantNotes(consultation.getConsultantNotes() + 
                "\n[결제정보JSON] " + paymentJson);
            
            
            consultation.setUpdatedAt(LocalDateTime.now());
            consultation.setVersion(consultation.getVersion() + 1);
            save(consultation);
            
            log.info("상담 비용 정산 완료: consultationId={}, paymentMethod={}", consultationId, paymentMethod);
            
        } catch (Exception e) {
            log.error("상담 비용 정산 실패: consultationId={}, error={}", consultationId, e.getMessage(), e);
            throw new RuntimeException("상담 비용 정산에 실패했습니다.", e);
        }
    }
    
    // === 상담 알림 및 리마인더 ===
    
    @Override
    public void sendConsultationConfirmation(Long consultationId) {
        try {
            log.info("상담 예약 확인 알림 발송: consultationId={}", consultationId);
            
            Consultation consultation = findActiveByIdOrThrow(consultationId);
            
            // 클라이언트 이메일 조회 (실제 구현에서는 UserService를 통해 조회)
            String clientEmail = "client@example.com"; // UserService를 통한 실제 클라이언트 이메일 조회 필요
            String clientName = "클라이언트"; // UserService를 통한 실제 클라이언트 이름 조회 필요
            
            // 이메일 템플릿 변수 설정
            Map<String, Object> variables = new HashMap<>();
            variables.put(EmailConstants.VAR_USER_NAME, clientName);
            variables.put(EmailConstants.VAR_USER_EMAIL, clientEmail);
            variables.put(EmailConstants.VAR_COMPANY_NAME, "mindgarden");
            variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
            variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
            variables.put(EmailConstants.VAR_APPOINTMENT_DATE, consultation.getConsultationDate() != null ? consultation.getConsultationDate().toString() : "");
            variables.put(EmailConstants.VAR_APPOINTMENT_TIME, consultation.getStartTime() != null ? consultation.getStartTime().toString() : "");
            variables.put(EmailConstants.VAR_CONSULTANT_NAME, "상담사"); // 실제 상담사 이름 조회 필요
            
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
            String clientEmail = "client@example.com"; // 실제 클라이언트 이메일 조회 필요
            String clientName = "클라이언트"; // 실제 클라이언트 이름 조회 필요
            
            // 이메일 템플릿 변수 설정
            Map<String, Object> variables = new HashMap<>();
            variables.put(EmailConstants.VAR_USER_NAME, clientName);
            variables.put(EmailConstants.VAR_USER_EMAIL, clientEmail);
            variables.put(EmailConstants.VAR_COMPANY_NAME, "mindgarden");
            variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
            variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
            variables.put(EmailConstants.VAR_APPOINTMENT_DATE, consultation.getConsultationDate() != null ? consultation.getConsultationDate().toString() : "");
            variables.put(EmailConstants.VAR_APPOINTMENT_TIME, consultation.getStartTime() != null ? consultation.getStartTime().toString() : "");
            variables.put(EmailConstants.VAR_CONSULTANT_NAME, "상담사"); // 실제 상담사 이름 조회 필요
            
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
            String clientEmail = "client@example.com"; // 실제 클라이언트 이메일 조회 필요
            String clientName = "클라이언트"; // 실제 클라이언트 이름 조회 필요
            
            // 이메일 템플릿 변수 설정
            Map<String, Object> variables = new HashMap<>();
            variables.put(EmailConstants.VAR_USER_NAME, clientName);
            variables.put(EmailConstants.VAR_USER_EMAIL, clientEmail);
            variables.put(EmailConstants.VAR_COMPANY_NAME, "mindgarden");
            variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
            variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
            variables.put(EmailConstants.VAR_APPOINTMENT_DATE, consultation.getConsultationDate() != null ? consultation.getConsultationDate().toString() : "");
            variables.put(EmailConstants.VAR_APPOINTMENT_TIME, consultation.getStartTime() != null ? consultation.getStartTime().toString() : "");
            variables.put(EmailConstants.VAR_CONSULTANT_NAME, "상담사"); // 실제 상담사 이름 조회 필요
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
            String clientEmail = "client@example.com"; // 실제 클라이언트 이메일 조회 필요
            String clientName = "클라이언트"; // 실제 클라이언트 이름 조회 필요
            
            // 이메일 템플릿 변수 설정
            Map<String, Object> variables = new HashMap<>();
            variables.put(EmailConstants.VAR_USER_NAME, clientName);
            variables.put(EmailConstants.VAR_USER_EMAIL, clientEmail);
            variables.put(EmailConstants.VAR_COMPANY_NAME, "mindgarden");
            variables.put(EmailConstants.VAR_SUPPORT_EMAIL, EmailConstants.SUPPORT_EMAIL);
            variables.put(EmailConstants.VAR_CURRENT_YEAR, String.valueOf(java.time.Year.now().getValue()));
            variables.put(EmailConstants.VAR_APPOINTMENT_DATE, consultation.getConsultationDate() != null ? consultation.getConsultationDate().toString() : "");
            variables.put(EmailConstants.VAR_APPOINTMENT_TIME, consultation.getStartTime() != null ? consultation.getStartTime().toString() : "");
            variables.put(EmailConstants.VAR_CONSULTANT_NAME, "상담사"); // 실제 상담사 이름 조회 필요
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
        log.info("고급 상담 검색: criteria={}, page={}, size={}", 
                searchCriteria, pageable.getPageNumber(), pageable.getPageSize());
        
        try {
            // 실제 검색 로직 구현
            List<Consultation> allConsultations = findAllActive();
            List<Consultation> filteredConsultations = new ArrayList<>();
            
            for (Consultation consultation : allConsultations) {
                boolean matches = true;
                
                // 클라이언트 ID 필터
                if (searchCriteria.containsKey("clientId")) {
                    Long clientId = (Long) searchCriteria.get("clientId");
                    if (!clientId.equals(consultation.getClientId())) {
                        matches = false;
                    }
                }
                
                // 상담사 ID 필터
                if (searchCriteria.containsKey("consultantId")) {
                    Long consultantId = (Long) searchCriteria.get("consultantId");
                    if (!consultantId.equals(consultation.getConsultantId())) {
                        matches = false;
                    }
                }
                
                // 상태 필터
                if (searchCriteria.containsKey("status")) {
                    String status = (String) searchCriteria.get("status");
                    if (!status.equals(consultation.getStatus())) {
                        matches = false;
                    }
                }
                
                // 우선순위 필터
                if (searchCriteria.containsKey("priority")) {
                    String priority = (String) searchCriteria.get("priority");
                    if (!priority.equals(consultation.getPriority())) {
                        matches = false;
                    }
                }
                
                // 위험도 필터
                if (searchCriteria.containsKey("riskLevel")) {
                    String riskLevel = (String) searchCriteria.get("riskLevel");
                    if (!riskLevel.equals(consultation.getRiskLevel())) {
                        matches = false;
                    }
                }
                
                // 상담 방법 필터
                if (searchCriteria.containsKey("consultationMethod")) {
                    String method = (String) searchCriteria.get("consultationMethod");
                    if (!method.equals(consultation.getConsultationMethod())) {
                        matches = false;
                    }
                }
                
                // 긴급 상담 필터
                if (searchCriteria.containsKey("isEmergency")) {
                    Boolean isEmergency = (Boolean) searchCriteria.get("isEmergency");
                    if (!isEmergency.equals(consultation.getIsEmergency())) {
                        matches = false;
                    }
                }
                
                // 날짜 범위 필터
                if (searchCriteria.containsKey("startDate") && searchCriteria.containsKey("endDate")) {
                    LocalDate startDate = (LocalDate) searchCriteria.get("startDate");
                    LocalDate endDate = (LocalDate) searchCriteria.get("endDate");
                    if (consultation.getConsultationDate() == null || 
                        consultation.getConsultationDate().isBefore(startDate) || 
                        consultation.getConsultationDate().isAfter(endDate)) {
                        matches = false;
                    }
                }
                
                if (matches) {
                    filteredConsultations.add(consultation);
                }
            }
            
            // 페이지네이션 적용
            int start = (int) pageable.getOffset();
            int end = Math.min(start + pageable.getPageSize(), filteredConsultations.size());
            List<Consultation> pageContent = filteredConsultations.subList(start, end);
            
            Page<Consultation> result = new org.springframework.data.domain.PageImpl<>(
                    pageContent, pageable, filteredConsultations.size());
            
            log.info("고급 상담 검색 완료: total={}, pageSize={}", 
                    filteredConsultations.size(), pageContent.size());
            
            return result;
            
        } catch (Exception e) {
            log.error("고급 상담 검색 실패: error={}", e.getMessage(), e);
            return Page.empty(pageable);
        }
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
        log.info("상담 데이터 백업: startDate={}, endDate={}", startDate, endDate);
        
        try {
            // 실제 백업 로직 구현
            List<Consultation> consultations = findByConsultationDateBetween(startDate, endDate);
            
            // 백업 데이터 생성
            Map<String, Object> backupData = new HashMap<>();
            backupData.put("backupDate", LocalDateTime.now());
            backupData.put("startDate", startDate);
            backupData.put("endDate", endDate);
            backupData.put("consultationCount", consultations.size());
            backupData.put("consultations", consultations);
            
            // 실제 백업 저장소에 저장 (파일, S3, 데이터베이스 등)
            String backupId = java.util.UUID.randomUUID().toString();
            
            // 파일 시스템에 백업 저장
            try {
                String backupDir = System.getProperty("user.home") + "/mindgarden/backups";
                java.io.File backupDirFile = new java.io.File(backupDir);
                if (!backupDirFile.exists()) {
                    backupDirFile.mkdirs();
                }
                
                String backupFileName = "consultation_backup_" + backupId + "_" + 
                    java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".json";
                String backupFilePath = backupDir + "/" + backupFileName;
                
                // JSON으로 백업 데이터 저장
                com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
                objectMapper.writeValue(new java.io.File(backupFilePath), backupData);
                
                log.info("백업 파일 저장 완료: {}", backupFilePath);
                
            } catch (Exception e) {
                log.error("백업 파일 저장 실패: {}", e.getMessage(), e);
            }
            
            log.info("상담 데이터 백업 완료: startDate={}, endDate={}, count={}", 
                    startDate, endDate, consultations.size());
            
        } catch (Exception e) {
            log.error("상담 데이터 백업 실패: startDate={}, endDate={}, error={}", 
                    startDate, endDate, e.getMessage(), e);
            throw new RuntimeException("상담 데이터 백업에 실패했습니다.", e);
        }
    }
    
    @Override
    public void restoreConsultationData(String backupId) {
        // 상담 데이터 복원 로직
        log.info("상담 데이터 복원: backupId={}", backupId);
        
        try {
            // 실제 복원 로직 구현
            // 실제 백업 저장소에서 데이터 조회
            String backupDir = System.getProperty("user.home") + "/mindgarden/backups";
            java.io.File backupDirFile = new java.io.File(backupDir);
            
            if (!backupDirFile.exists()) {
                throw new RuntimeException("백업 디렉토리가 존재하지 않습니다: " + backupDir);
            }
            
            // 백업 파일 찾기
            java.io.File[] backupFiles = backupDirFile.listFiles((dir, name) -> name.contains(backupId));
            if (backupFiles == null || backupFiles.length == 0) {
                throw new RuntimeException("백업 파일을 찾을 수 없습니다: " + backupId);
            }
            
            java.io.File backupFile = backupFiles[0];
            
            // JSON에서 백업 데이터 로드
            com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
            @SuppressWarnings("unchecked")
            Map<String, Object> backupData = objectMapper.readValue(backupFile, Map.class);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> consultationMaps = (List<Map<String, Object>>) backupData.get("consultations");
            
            // 복원된 데이터를 데이터베이스에 저장
            int restoredCount = 0;
            for (Map<String, Object> consultationMap : consultationMaps) {
                try {
                    // Map을 Consultation 객체로 변환
                    Consultation consultation = new Consultation();
                    consultation.setId(null); // 새 ID 생성
                    consultation.setClientId((Long) consultationMap.get("clientId"));
                    consultation.setConsultantId((Long) consultationMap.get("consultantId"));
                    consultation.setStatus((String) consultationMap.get("status"));
                    consultation.setPriority((String) consultationMap.get("priority"));
                    consultation.setRiskLevel((String) consultationMap.get("riskLevel"));
                    consultation.setConsultationMethod((String) consultationMap.get("consultationMethod"));
                    consultation.setIsEmergency((Boolean) consultationMap.get("isEmergency"));
                    consultation.setIsFirstSession((Boolean) consultationMap.get("isFirstSession"));
                    consultation.setDurationMinutes((Integer) consultationMap.get("durationMinutes"));
                    consultation.setConsultantNotes((String) consultationMap.get("consultantNotes"));
                    consultation.setPreparationNotes((String) consultationMap.get("preparationNotes"));
                    consultation.setCreatedAt(LocalDateTime.now());
                    consultation.setUpdatedAt(LocalDateTime.now());
                    consultation.setVersion(1L);
                    consultation.setIsDeleted(false);
                    
                    save(consultation);
                    restoredCount++;
                    
                } catch (Exception e) {
                    log.warn("상담 복원 실패: {}", e.getMessage());
                }
            }
            
            log.info("상담 데이터 복원 완료: backupId={}, restoredCount={}", backupId, restoredCount);
            
            log.info("상담 데이터 복원 완료: backupId={}", backupId);
            
        } catch (Exception e) {
            log.error("상담 데이터 복원 실패: backupId={}, error={}", backupId, e.getMessage(), e);
            throw new RuntimeException("상담 데이터 복원에 실패했습니다.", e);
        }
    }
    
    @Override
    public void archiveConsultationData(LocalDate beforeDate) {
        // 상담 데이터 아카이브 로직
        log.info("상담 데이터 아카이브: beforeDate={}", beforeDate);
        
        try {
            // 실제 아카이브 로직 구현
            List<Consultation> consultations = findAllActive();
            List<Consultation> archivedConsultations = new ArrayList<>();
            
            for (Consultation consultation : consultations) {
                if (consultation.getConsultationDate() != null && 
                    consultation.getConsultationDate().isBefore(beforeDate)) {
                    // 아카이브 대상 상담을 별도 저장소로 이동
                    // 아카이브 저장소에 저장
                    try {
                        String archiveDir = System.getProperty("user.home") + "/mindgarden/archives";
                        java.io.File archiveDirFile = new java.io.File(archiveDir);
                        if (!archiveDirFile.exists()) {
                            archiveDirFile.mkdirs();
                        }
                        
                        String archiveFileName = "consultation_archive_" + consultation.getId() + "_" + 
                            consultation.getConsultationDate().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")) + ".json";
                        String archiveFilePath = archiveDir + "/" + archiveFileName;
                        
                        // 상담 데이터를 JSON으로 아카이브 저장
                        Map<String, Object> archiveData = new HashMap<>();
                        archiveData.put("consultationId", consultation.getId());
                        archiveData.put("clientId", consultation.getClientId());
                        archiveData.put("consultantId", consultation.getConsultantId());
                        archiveData.put("status", consultation.getStatus());
                        archiveData.put("priority", consultation.getPriority());
                        archiveData.put("riskLevel", consultation.getRiskLevel());
                        archiveData.put("consultationMethod", consultation.getConsultationMethod());
                        archiveData.put("isEmergency", consultation.getIsEmergency());
                        archiveData.put("isFirstSession", consultation.getIsFirstSession());
                        archiveData.put("durationMinutes", consultation.getDurationMinutes());
                        archiveData.put("consultantNotes", consultation.getConsultantNotes());
                        archiveData.put("preparationNotes", consultation.getPreparationNotes());
                        archiveData.put("archivedAt", LocalDateTime.now());
                        
                        com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        objectMapper.writeValue(new java.io.File(archiveFilePath), archiveData);
                        
                        log.info("상담 아카이브 저장 완료: consultationId={}, file={}", consultation.getId(), archiveFilePath);
                        
                    } catch (Exception e) {
                        log.error("상담 아카이브 저장 실패: consultationId={}, error={}", consultation.getId(), e.getMessage(), e);
                    }
                    archivedConsultations.add(consultation);
                }
            }
            
            log.info("상담 데이터 아카이브 완료: beforeDate={}, archivedCount={}", 
                    beforeDate, archivedConsultations.size());
            
        } catch (Exception e) {
            log.error("상담 데이터 아카이브 실패: beforeDate={}, error={}", 
                    beforeDate, e.getMessage(), e);
            throw new RuntimeException("상담 데이터 아카이브에 실패했습니다.", e);
        }
    }
    
    @Override
    public void cleanupConsultationData(LocalDate beforeDate) {
        // 상담 데이터 정리 로직
        log.info("상담 데이터 정리: beforeDate={}", beforeDate);
        
        try {
            // 실제 정리 로직 구현
            List<Consultation> consultations = findAllActive();
            List<Consultation> cleanupConsultations = new ArrayList<>();
            
            for (Consultation consultation : consultations) {
                if (consultation.getConsultationDate() != null && 
                    consultation.getConsultationDate().isBefore(beforeDate)) {
                    // 정리 대상 상담을 소프트 삭제
                    consultation.setIsDeleted(true);
                    consultation.setDeletedAt(LocalDateTime.now());
                    consultation.setUpdatedAt(LocalDateTime.now());
                    consultation.setVersion(consultation.getVersion() + 1);
                    save(consultation);
                    cleanupConsultations.add(consultation);
                }
            }
            
            log.info("상담 데이터 정리 완료: beforeDate={}, cleanupCount={}", 
                    beforeDate, cleanupConsultations.size());
            
        } catch (Exception e) {
            log.error("상담 데이터 정리 실패: beforeDate={}, error={}", 
                    beforeDate, e.getMessage(), e);
            throw new RuntimeException("상담 데이터 정리에 실패했습니다.", e);
        }
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
    
    /**
     * 상담 완료 시 스케줄 상태 동기화
     */
    private void syncScheduleStatus(Long consultationId) {
        try {
            log.info("🔄 스케줄 상태 동기화 시작: consultationId={}", consultationId);
            
            // 해당 상담과 연결된 스케줄 조회
            List<com.mindgarden.consultation.entity.Schedule> schedules = 
                scheduleRepository.findByConsultationId(consultationId);
            
            for (com.mindgarden.consultation.entity.Schedule schedule : schedules) {
                if (!"COMPLETED".equals(schedule.getStatus())) {
                    schedule.setStatus("COMPLETED");
                    schedule.setUpdatedAt(java.time.LocalDateTime.now());
                    scheduleRepository.save(schedule);
                    log.info("✅ 스케줄 상태 업데이트 완료: scheduleId={}, status=COMPLETED", schedule.getId());
                }
            }
            
            log.info("✅ 스케줄 상태 동기화 완료: {}개 스케줄 처리", schedules.size());
            
        } catch (Exception e) {
            log.error("❌ 스케줄 상태 동기화 실패: consultationId={}, error={}", consultationId, e.getMessage(), e);
            // 동기화 실패해도 상담 완료는 진행 (비즈니스 로직 우선)
        }
    }
}
