package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.entity.Consultation;
import com.mindgarden.consultation.service.ConsultationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 상담 관리 컨트롤러
 * API 설계 문서에 명시된 상담 관리 API 구현
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/consultations")
@CrossOrigin(origins = "*")
public class ConsultationController {
    
    @Autowired
    private ConsultationService consultationService;
    
    // === 상담 조회 및 검색 ===
    
    /**
     * 상담 목록 조회 (복합 조건 검색)
     * GET /api/v1/consultations?clientId=1&consultantId=2&status=REQUESTED&priority=HIGH
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getConsultations(
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) Long consultantId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(required = false) String consultationMethod,
            @RequestParam(required = false) Boolean isEmergency,
            @RequestParam(required = false) Boolean isFirstSession,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        
        log.info("상담 목록 조회 - clientId: {}, consultantId: {}, status: {}, priority: {}", 
                clientId, consultantId, status, priority);
        
        List<Consultation> consultations = consultationService.findByComplexCriteria(
            clientId, consultantId, status, priority, riskLevel, consultationMethod, 
            isEmergency, isFirstSession, startDate, endDate);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", consultations,
            "totalCount", consultations.size()
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담 상세 정보 조회
     * GET /api/v1/consultations/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getConsultationById(@PathVariable Long id) {
        log.info("상담 상세 정보 조회 - ID: {}", id);
        
        return consultationService.findById(id)
                .map(consultation -> {
                    Map<String, Object> response = Map.of(
                        "success", true,
                        "data", consultation
                    );
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 고급 상담 검색
     * POST /api/v1/consultations/search
     */
    @PostMapping("/search")
    public ResponseEntity<Map<String, Object>> searchConsultations(
            @RequestBody Map<String, Object> searchCriteria,
            Pageable pageable) {
        
        log.info("고급 상담 검색 - criteria: {}, page: {}", searchCriteria, pageable.getPageNumber());
        
        Page<Consultation> consultations = consultationService.searchConsultations(searchCriteria, pageable);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", Map.of(
                "content", consultations.getContent(),
                "totalElements", consultations.getTotalElements(),
                "totalPages", consultations.getTotalPages(),
                "size", consultations.getSize(),
                "number", consultations.getNumber()
            )
        );
        
        return ResponseEntity.ok(response);
    }
    
    // === 상담 예약 및 관리 ===
    
    /**
     * 상담 예약 생성
     * POST /api/v1/consultations
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createConsultation(@RequestBody Consultation consultation) {
        log.info("상담 예약 생성 - clientId: {}, consultantId: {}", 
                consultation.getClientId(), consultation.getConsultantId());
        
        Consultation createdConsultation = consultationService.createConsultationRequest(consultation);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "상담 예약이 성공적으로 생성되었습니다.",
            "data", createdConsultation
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * 상담 예약 확정
     * POST /api/v1/consultations/{id}/confirm
     */
    @PostMapping("/{id}/confirm")
    public ResponseEntity<Map<String, Object>> confirmConsultation(
            @PathVariable Long id,
            @RequestParam Long consultantId) {
        
        log.info("상담 예약 확정 - ID: {}, consultantId: {}", id, consultantId);
        
        Consultation confirmedConsultation = consultationService.confirmConsultation(id, consultantId);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "상담 예약이 확정되었습니다.",
            "data", confirmedConsultation
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담 예약 취소
     * POST /api/v1/consultations/{id}/cancel
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelConsultation(
            @PathVariable Long id,
            @RequestParam String reason) {
        
        log.info("상담 예약 취소 - ID: {}, reason: {}", id, reason);
        
        Consultation cancelledConsultation = consultationService.cancelConsultation(id, reason);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "상담 예약이 취소되었습니다.",
            "data", cancelledConsultation
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담 예약 변경
     * PUT /api/v1/consultations/{id}/reschedule
     */
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<Map<String, Object>> rescheduleConsultation(
            @PathVariable Long id,
            @RequestParam LocalDateTime newDateTime) {
        
        log.info("상담 예약 변경 - ID: {}, newDateTime: {}", id, newDateTime);
        
        Consultation rescheduledConsultation = consultationService.rescheduleConsultation(id, newDateTime);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "상담 예약이 성공적으로 변경되었습니다.",
            "data", rescheduledConsultation
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담 시작
     * POST /api/v1/consultations/{id}/start
     */
    @PostMapping("/{id}/start")
    public ResponseEntity<Map<String, Object>> startConsultation(@PathVariable Long id) {
        log.info("상담 시작 - ID: {}", id);
        
        Consultation startedConsultation = consultationService.startConsultation(id);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "상담이 시작되었습니다.",
            "data", startedConsultation
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담 완료
     * POST /api/v1/consultations/{id}/complete
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<Map<String, Object>> completeConsultation(
            @PathVariable Long id,
            @RequestParam String notes,
            @RequestParam int rating) {
        
        log.info("상담 완료 - ID: {}, rating: {}", id, rating);
        
        Consultation completedConsultation = consultationService.completeConsultation(id, notes, rating);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "상담이 완료되었습니다.",
            "data", completedConsultation
        );
        
        return ResponseEntity.ok(response);
    }
    
    // === 상담 스케줄링 ===
    
    /**
     * 상담사별 상담 가능 시간 조회
     * GET /api/v1/consultations/available-slots?consultantId=1&date=2024-01-15
     */
    @GetMapping("/available-slots")
    public ResponseEntity<Map<String, Object>> getAvailableTimeSlots(
            @RequestParam Long consultantId,
            @RequestParam LocalDate date) {
        
        log.info("상담사별 상담 가능 시간 조회 - consultantId: {}, date: {}", consultantId, date);
        
        List<Map<String, Object>> availableSlots = consultationService.getAvailableTimeSlots(consultantId, date);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", availableSlots,
            "consultantId", consultantId,
            "date", date
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담사별 상담 스케줄 조회
     * GET /api/v1/consultations/consultant-schedule?consultantId=1&startDate=2024-01-01&endDate=2024-01-31
     */
    @GetMapping("/consultant-schedule")
    public ResponseEntity<Map<String, Object>> getConsultantSchedule(
            @RequestParam Long consultantId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        
        log.info("상담사별 상담 스케줄 조회 - consultantId: {}, period: {} - {}", 
                consultantId, startDate, endDate);
        
        List<Map<String, Object>> schedule = consultationService.getConsultantSchedule(consultantId, startDate, endDate);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", schedule,
            "consultantId", consultantId,
            "startDate", startDate,
            "endDate", endDate
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 클라이언트별 상담 스케줄 조회
     * GET /api/v1/consultations/client-schedule?clientId=1&startDate=2024-01-01&endDate=2024-01-31
     */
    @GetMapping("/client-schedule")
    public ResponseEntity<Map<String, Object>> getClientSchedule(
            @RequestParam Long clientId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        
        log.info("클라이언트별 상담 스케줄 조회 - clientId: {}, period: {} - {}", 
                clientId, startDate, endDate);
        
        List<Map<String, Object>> schedule = consultationService.getClientSchedule(clientId, startDate, endDate);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", schedule,
            "clientId", clientId,
            "startDate", startDate,
            "endDate", endDate
        );
        
        return ResponseEntity.ok(response);
    }
    
    // === 상담 평가 및 리뷰 ===
    
    /**
     * 상담 평가 등록
     * POST /api/v1/consultations/{id}/review
     */
    @PostMapping("/{id}/review")
    public ResponseEntity<Map<String, Object>> addConsultationReview(
            @PathVariable Long id,
            @RequestParam int rating,
            @RequestParam String review,
            @RequestParam String clientId) {
        
        log.info("상담 평가 등록 - ID: {}, rating: {}, clientId: {}", id, rating, clientId);
        
        consultationService.addConsultationReview(id, rating, review, clientId);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "상담 평가가 성공적으로 등록되었습니다."
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담 평가 조회
     * GET /api/v1/consultations/{id}/review
     */
    @GetMapping("/{id}/review")
    public ResponseEntity<Map<String, Object>> getConsultationReview(@PathVariable Long id) {
        log.info("상담 평가 조회 - ID: {}", id);
        
        Map<String, Object> review = consultationService.getConsultationReview(id);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", review
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담사별 평균 평점 조회
     * GET /api/v1/consultations/consultant-rating?consultantId=1
     */
    @GetMapping("/consultant-rating")
    public ResponseEntity<Map<String, Object>> getConsultantAverageRating(
            @RequestParam Long consultantId) {
        
        log.info("상담사별 평균 평점 조회 - consultantId: {}", consultantId);
        
        double averageRating = consultationService.getConsultantAverageRating(consultantId);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", Map.of(
                "consultantId", consultantId,
                "averageRating", averageRating
            )
        );
        
        return ResponseEntity.ok(response);
    }
    
    // === 긴급 상담 관리 ===
    
    /**
     * 긴급 상담 요청
     * POST /api/v1/consultations/emergency
     */
    @PostMapping("/emergency")
    public ResponseEntity<Map<String, Object>> requestEmergencyConsultation(
            @RequestParam Long clientId,
            @RequestParam String emergencyReason) {
        
        log.info("긴급 상담 요청 - clientId: {}, reason: {}", clientId, emergencyReason);
        
        Consultation emergencyConsultation = consultationService.requestEmergencyConsultation(clientId, emergencyReason);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "긴급 상담이 요청되었습니다.",
            "data", emergencyConsultation
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * 긴급 상담 할당
     * POST /api/v1/consultations/{id}/assign-emergency
     */
    @PostMapping("/{id}/assign-emergency")
    public ResponseEntity<Map<String, Object>> assignEmergencyConsultation(
            @PathVariable Long id,
            @RequestParam Long consultantId) {
        
        log.info("긴급 상담 할당 - ID: {}, consultantId: {}", id, consultantId);
        
        Consultation assignedConsultation = consultationService.assignEmergencyConsultation(id, consultantId);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "긴급 상담이 할당되었습니다.",
            "data", assignedConsultation
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 긴급 상담 목록 조회
     * GET /api/v1/consultations/emergency
     */
    @GetMapping("/emergency")
    public ResponseEntity<Map<String, Object>> getEmergencyConsultations() {
        log.info("긴급 상담 목록 조회");
        
        List<Consultation> emergencyConsultations = consultationService.getEmergencyConsultations();
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", emergencyConsultations,
            "totalCount", emergencyConsultations.size()
        );
        
        return ResponseEntity.ok(response);
    }
    
    // === 상담 통계 및 분석 ===
    
    /**
     * 전체 상담 통계 조회
     * GET /api/v1/consultations/statistics/overall
     */
    @GetMapping("/statistics/overall")
    public ResponseEntity<Map<String, Object>> getOverallConsultationStatistics() {
        log.info("전체 상담 통계 조회");
        
        Map<String, Object> statistics = consultationService.getOverallConsultationStatistics();
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", statistics
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상태별 상담 통계 조회
     * GET /api/v1/consultations/statistics/by-status
     */
    @GetMapping("/statistics/by-status")
    public ResponseEntity<Map<String, Object>> getConsultationStatisticsByStatus() {
        log.info("상태별 상담 통계 조회");
        
        Map<String, Object> statistics = consultationService.getConsultationStatisticsByStatus();
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", statistics
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담 성과 분석
     * GET /api/v1/consultations/statistics/performance?startDate=2024-01-01&endDate=2024-01-31
     */
    @GetMapping("/statistics/performance")
    public ResponseEntity<Map<String, Object>> getConsultationPerformanceAnalysis(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        
        log.info("상담 성과 분석 - period: {} - {}", startDate, endDate);
        
        Map<String, Object> analysis = consultationService.getConsultationPerformanceAnalysis(startDate, endDate);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", analysis,
            "startDate", startDate,
            "endDate", endDate
        );
        
        return ResponseEntity.ok(response);
    }
    
    // === 상담 비용 관리 ===
    
    /**
     * 상담 비용 계산
     * GET /api/v1/consultations/{id}/cost
     */
    @GetMapping("/{id}/cost")
    public ResponseEntity<Map<String, Object>> calculateConsultationCost(@PathVariable Long id) {
        log.info("상담 비용 계산 - ID: {}", id);
        
        Map<String, Object> cost = consultationService.calculateConsultationCost(id);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", cost
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담 비용 할인 적용
     * POST /api/v1/consultations/{id}/discount
     */
    @PostMapping("/{id}/discount")
    public ResponseEntity<Map<String, Object>> applyDiscount(
            @PathVariable Long id,
            @RequestParam String discountType,
            @RequestParam double discountAmount) {
        
        log.info("상담 비용 할인 적용 - ID: {}, type: {}, amount: {}", id, discountType, discountAmount);
        
        consultationService.applyDiscount(id, discountType, discountAmount);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "할인이 성공적으로 적용되었습니다."
        );
        
        return ResponseEntity.ok(response);
    }
    
    // === 상담 데이터 관리 ===
    
    /**
     * 상담 데이터 백업
     * POST /api/v1/consultations/backup
     */
    @PostMapping("/backup")
    public ResponseEntity<Map<String, Object>> backupConsultationData(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        
        log.info("상담 데이터 백업 - period: {} - {}", startDate, endDate);
        
        consultationService.backupConsultationData(startDate, endDate);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "상담 데이터 백업이 완료되었습니다."
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담 데이터 아카이브
     * POST /api/v1/consultations/archive
     */
    @PostMapping("/archive")
    public ResponseEntity<Map<String, Object>> archiveConsultationData(
            @RequestParam LocalDate beforeDate) {
        
        log.info("상담 데이터 아카이브 - beforeDate: {}", beforeDate);
        
        consultationService.archiveConsultationData(beforeDate);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "상담 데이터 아카이브가 완료되었습니다."
        );
        
        return ResponseEntity.ok(response);
    }
}
