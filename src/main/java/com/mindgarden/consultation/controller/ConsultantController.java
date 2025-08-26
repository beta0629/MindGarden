package com.mindgarden.consultation.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.Client;
import com.mindgarden.consultation.entity.Consultant;
import com.mindgarden.consultation.service.ConsultantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담사 관리 컨트롤러
 * API 설계 문서에 명시된 상담사 관리 API 구현
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/consultants")
@CrossOrigin(origins = "*")
public class ConsultantController {
    
    @Autowired
    private ConsultantService consultantService;
    
    // === 상담사 조회 및 검색 ===
    
    /**
     * 상담사 목록 조회 (복합 조건 검색)
     * GET /api/v1/consultants?specialty=PSYCHOLOGY&experience=5&rating=4.0
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getConsultants(
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false) Integer experience,
            @RequestParam(required = false) Double rating,
            @RequestParam(required = false) Boolean available) {
        
        log.info("상담사 목록 조회 - specialty: {}, experience: {}, rating: {}, available: {}", 
                specialty, experience, rating, available);
        
        List<Consultant> consultants = consultantService.findByComplexCriteria(specialty, experience, rating, available);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", consultants,
            "totalCount", consultants.size()
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담사 상세 정보 조회
     * GET /api/v1/consultants/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getConsultantById(@PathVariable Long id) {
        log.info("상담사 상세 정보 조회 - ID: {}", id);
        
        return consultantService.findByIdWithDetails(id)
                .map(consultant -> {
                    Map<String, Object> response = Map.of(
                        "success", true,
                        "data", consultant
                    );
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 상담사별 스케줄 조회
     * GET /api/v1/consultants/{id}/schedule?date=2024-01-15
     */
    @GetMapping("/{id}/schedule")
    public ResponseEntity<Map<String, Object>> getConsultantSchedule(
            @PathVariable Long id,
            @RequestParam LocalDate date) {
        
        log.info("상담사 스케줄 조회 - ID: {}, date: {}", id, date);
        
        List<Map<String, Object>> availableSlots = consultantService.getAvailableSlots(id, date);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", availableSlots,
            "consultantId", id,
            "date", date
        );
        
        return ResponseEntity.ok(response);
    }
    
    // === 내담자 관리 ===
    
    /**
     * 상담사별 내담자 목록 조회
     * GET /api/v1/consultants/{id}/clients?status=ACTIVE&page=0&size=10
     */
    @GetMapping("/{id}/clients")
    public ResponseEntity<Map<String, Object>> getClientsByConsultant(
            @PathVariable Long id,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        
        log.info("상담사별 내담자 목록 조회 - ID: {}, status: {}, page: {}", id, status, pageable.getPageNumber());
        
        Page<Client> clients = consultantService.findClientsByConsultantId(id, status, pageable);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", Map.of(
                "content", clients.getContent(),
                "totalElements", clients.getTotalElements(),
                "totalPages", clients.getTotalPages(),
                "size", clients.getSize(),
                "number", clients.getNumber()
            )
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담사별 내담자 상세 정보
     * GET /api/v1/consultants/{consultantId}/clients/{clientId}
     */
    @GetMapping("/{consultantId}/clients/{clientId}")
    public ResponseEntity<Map<String, Object>> getClientByConsultant(
            @PathVariable Long consultantId,
            @PathVariable Long clientId) {
        
        log.info("상담사별 내담자 상세 정보 조회 - consultantId: {}, clientId: {}", consultantId, clientId);
        
        return consultantService.findClientByConsultantId(consultantId, clientId)
                .map(client -> {
                    Map<String, Object> response = Map.of(
                        "success", true,
                        "data", client
                    );
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * 상담사별 내담자 프로필 수정
     * PUT /api/v1/consultants/{consultantId}/clients/{clientId}
     */
    @PutMapping("/{consultantId}/clients/{clientId}")
    public ResponseEntity<Map<String, Object>> updateClientProfile(
            @PathVariable Long consultantId,
            @PathVariable Long clientId,
            @RequestBody Client updateData) {
        
        log.info("내담자 프로필 수정 - consultantId: {}, clientId: {}", consultantId, clientId);
        
        Client updatedClient = consultantService.updateClientProfile(consultantId, clientId, updateData);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "내담자 프로필이 성공적으로 수정되었습니다.",
            "data", updatedClient
        );
        
        return ResponseEntity.ok(response);
    }
    
    // === 스케줄 관리 ===
    
    /**
     * 상담사 스케줄 등록
     * POST /api/v1/consultants/{id}/schedule
     */
    @PostMapping("/{id}/schedule")
    public ResponseEntity<Map<String, Object>> registerSchedule(
            @PathVariable Long id,
            @RequestParam LocalDate date,
            @RequestParam LocalTime startTime,
            @RequestParam LocalTime endTime) {
        
        log.info("상담사 스케줄 등록 - ID: {}, date: {}, time: {} - {}", id, date, startTime, endTime);
        
        consultantService.registerSchedule(id, date, startTime, endTime);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "스케줄이 성공적으로 등록되었습니다."
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * 상담사 스케줄 수정
     * PUT /api/v1/consultants/{id}/schedule/{scheduleId}
     */
    @PutMapping("/{id}/schedule/{scheduleId}")
    public ResponseEntity<Map<String, Object>> updateSchedule(
            @PathVariable Long id,
            @PathVariable Long scheduleId,
            @RequestParam LocalDate date,
            @RequestParam LocalTime startTime,
            @RequestParam LocalTime endTime) {
        
        log.info("상담사 스케줄 수정 - ID: {}, scheduleId: {}, date: {}, time: {} - {}", 
                id, scheduleId, date, startTime, endTime);
        
        consultantService.updateSchedule(id, scheduleId, date, startTime, endTime);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "스케줄이 성공적으로 수정되었습니다."
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담사 스케줄 삭제
     * DELETE /api/v1/consultants/{id}/schedule/{scheduleId}
     */
    @DeleteMapping("/{id}/schedule/{scheduleId}")
    public ResponseEntity<Map<String, Object>> deleteSchedule(
            @PathVariable Long id,
            @PathVariable Long scheduleId) {
        
        log.info("상담사 스케줄 삭제 - ID: {}, scheduleId: {}", id, scheduleId);
        
        consultantService.deleteSchedule(id, scheduleId);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "스케줄이 성공적으로 삭제되었습니다."
        );
        
        return ResponseEntity.ok(response);
    }
    
    // === 상담 관리 ===
    
    /**
     * 상담사별 상담 예약 목록 조회
     * GET /api/v1/consultants/{id}/consultations?status=REQUESTED
     */
    @GetMapping("/{id}/consultations")
    public ResponseEntity<Map<String, Object>> getConsultationBookings(
            @PathVariable Long id,
            @RequestParam(required = false) String status) {
        
        log.info("상담사별 상담 예약 목록 조회 - ID: {}, status: {}", id, status);
        
        List<Map<String, Object>> consultations = consultantService.getConsultationBookings(id, status);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", consultations
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담 예약 확정
     * POST /api/v1/consultants/{id}/consultations/{consultationId}/confirm
     */
    @PostMapping("/{id}/consultations/{consultationId}/confirm")
    public ResponseEntity<Map<String, Object>> confirmConsultation(
            @PathVariable Long id,
            @PathVariable Long consultationId) {
        
        log.info("상담 예약 확정 - ID: {}, consultationId: {}", id, consultationId);
        
        consultantService.confirmConsultation(id, consultationId);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "상담 예약이 확정되었습니다."
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담 예약 취소
     * POST /api/v1/consultants/{id}/consultations/{consultationId}/cancel
     */
    @PostMapping("/{id}/consultations/{consultationId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelConsultation(
            @PathVariable Long id,
            @PathVariable Long consultationId) {
        
        log.info("상담 예약 취소 - ID: {}, consultationId: {}", id, consultationId);
        
        consultantService.cancelConsultation(id, consultationId);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "상담 예약이 취소되었습니다."
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담 완료 처리
     * POST /api/v1/consultants/{id}/consultations/{consultationId}/complete
     */
    @PostMapping("/{id}/consultations/{consultationId}/complete")
    public ResponseEntity<Map<String, Object>> completeConsultation(
            @PathVariable Long id,
            @PathVariable Long consultationId,
            @RequestParam String notes,
            @RequestParam int rating) {
        
        log.info("상담 완료 처리 - ID: {}, consultationId: {}, rating: {}", id, consultationId, rating);
        
        consultantService.completeConsultation(id, consultationId, notes, rating);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "상담이 완료되었습니다."
        );
        
        return ResponseEntity.ok(response);
    }
    
    // === 통계 및 분석 ===
    
    /**
     * 상담사별 상담 통계
     * GET /api/v1/consultants/{id}/statistics/consultations?startDate=2024-01-01&endDate=2024-01-31
     */
    @GetMapping("/{id}/statistics/consultations")
    public ResponseEntity<Map<String, Object>> getConsultationStatistics(
            @PathVariable Long id,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        
        log.info("상담사별 상담 통계 조회 - ID: {}, period: {} - {}", id, startDate, endDate);
        
        Map<String, Object> statistics = consultantService.getConsultationStatistics(id, startDate, endDate);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", statistics
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담사별 수익 통계
     * GET /api/v1/consultants/{id}/statistics/revenue?startDate=2024-01-01&endDate=2024-01-31
     */
    @GetMapping("/{id}/statistics/revenue")
    public ResponseEntity<Map<String, Object>> getRevenueStatistics(
            @PathVariable Long id,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        
        log.info("상담사별 수익 통계 조회 - ID: {}, period: {} - {}", id, startDate, endDate);
        
        Map<String, Object> statistics = consultantService.getRevenueStatistics(id, startDate, endDate);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", statistics
        );
        
        return ResponseEntity.ok(response);
    }
    
    // === 프로필 관리 ===
    
    /**
     * 상담사 프로필 수정
     * PUT /api/v1/consultants/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateConsultantProfile(
            @PathVariable Long id,
            @RequestBody Consultant updateData) {
        
        log.info("상담사 프로필 수정 - ID: {}", id);
        
        Consultant updatedConsultant = consultantService.updateProfile(id, updateData);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "프로필이 성공적으로 수정되었습니다.",
            "data", updatedConsultant
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담사 상태 변경
     * PATCH /api/v1/consultants/{id}/status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateConsultantStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        
        log.info("상담사 상태 변경 - ID: {}, status: {}", id, status);
        
        consultantService.updateStatus(id, status);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "상태가 성공적으로 변경되었습니다."
        );
        
        return ResponseEntity.ok(response);
    }
}
