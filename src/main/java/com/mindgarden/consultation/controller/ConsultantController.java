package com.mindgarden.consultation.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.entity.Client;
import com.mindgarden.consultation.entity.Consultant;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.ConsultantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
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
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getConsultants(
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false) Integer experience,
            @RequestParam(required = false) Double rating,
            @RequestParam(required = false) Boolean available,
            HttpSession session) {
        
        log.info("상담사 목록 조회 - specialty: {}, experience: {}, rating: {}, available: {}", 
                specialty, experience, rating, available);
        
        // 현재 로그인한 사용자의 지점코드 확인
        User currentUser = (User) session.getAttribute("user");
        String currentBranchCode = currentUser != null ? currentUser.getBranchCode() : null;
        log.info("🔍 현재 사용자 지점코드: {}", currentBranchCode);
        
        List<Consultant> allConsultants = consultantService.findByComplexCriteria(specialty, experience, rating, available);
        
        // 지점코드로 필터링
        List<Consultant> consultants = allConsultants.stream()
            .filter(consultant -> {
                if (currentBranchCode == null || currentBranchCode.trim().isEmpty()) {
                    return true; // 지점코드가 없으면 모든 상담사 조회
                }
                return currentBranchCode.equals(consultant.getBranchCode());
            })
            .collect(java.util.stream.Collectors.toList());
        
        log.info("🔍 상담사 목록 조회 완료 - 전체: {}, 필터링 후: {}", allConsultants.size(), consultants.size());
        
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
        
        // List<Map<String, Object>> availableSlots = consultantService.getAvailableSlots(id, date);
        List<Map<String, Object>> availableSlots = new ArrayList<>();
        
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
        
        // Page<Client> clients = consultantService.findClientsByConsultantId(id, status, pageable);
        Page<Client> clients = new org.springframework.data.domain.PageImpl<>(new ArrayList<>());
        
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
        
        // return consultantService.findClientByConsultantId(consultantId, clientId)
        //         .map(client -> {
        //             Map<String, Object> response = Map.of(
        //                 "success", true,
        //                 "data", client
        //             );
        //             return ResponseEntity.ok(response);
        //         })
        //         .orElse(ResponseEntity.notFound().build());
        return ResponseEntity.notFound().build();
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
        
        // Client updatedClient = consultantService.updateClientProfile(consultantId, clientId, updateData);
        Client updatedClient = updateData;
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "내담자 프로필이 성공적으로 수정되었습니다.",
            "data", updatedClient
        );
        
        return ResponseEntity.ok(response);
    }
    
    // === 스케줄 관리 ===
    // 스케줄 관련 API는 ScheduleController로 이동됨
    // 기존 API는 하위 호환성을 위해 리다이렉트 처리
    
    /**
     * 상담사 스케줄 등록 (리다이렉트)
     * POST /api/v1/consultants/{id}/schedule
     * @deprecated ScheduleController 사용 권장
     */
    @Deprecated
    @PostMapping("/{id}/schedule")
    public ResponseEntity<Map<String, Object>> registerSchedule(
            @PathVariable Long id,
            @RequestParam LocalDate date,
            @RequestParam LocalTime startTime,
            @RequestParam LocalTime endTime) {
        
        log.warn("⚠️ 사용 중단된 API 호출: /api/v1/consultants/{}/schedule -> /api/schedules/consultant 사용 권장", id);
        
        Map<String, Object> response = Map.of(
            "success", false,
            "message", "이 API는 사용 중단되었습니다. /api/schedules/consultant를 사용해주세요.",
            "redirectUrl", "/api/schedules/consultant"
        );
        
        return ResponseEntity.status(HttpStatus.MOVED_PERMANENTLY).body(response);
    }
    
    /**
     * 상담사 스케줄 수정 (리다이렉트)
     * PUT /api/v1/consultants/{id}/schedule/{scheduleId}
     * @deprecated ScheduleController 사용 권장
     */
    @Deprecated
    @PutMapping("/{id}/schedule/{scheduleId}")
    public ResponseEntity<Map<String, Object>> updateSchedule(
            @PathVariable Long id,
            @PathVariable Long scheduleId,
            @RequestParam LocalDate date,
            @RequestParam LocalTime startTime,
            @RequestParam LocalTime endTime) {
        
        log.warn("⚠️ 사용 중단된 API 호출: /api/v1/consultants/{}/schedule/{} -> /api/schedules/consultant/{}/{} 사용 권장", 
                id, scheduleId, id, scheduleId);
        
        Map<String, Object> response = Map.of(
            "success", false,
            "message", "이 API는 사용 중단되었습니다. /api/schedules/consultant/" + id + "/" + scheduleId + "를 사용해주세요.",
            "redirectUrl", "/api/schedules/consultant/" + id + "/" + scheduleId
        );
        
        return ResponseEntity.status(HttpStatus.MOVED_PERMANENTLY).body(response);
    }
    
    /**
     * 상담사 스케줄 삭제 (리다이렉트)
     * DELETE /api/v1/consultants/{id}/schedule/{scheduleId}
     * @deprecated ScheduleController 사용 권장
     */
    @Deprecated
    @DeleteMapping("/{id}/schedule/{scheduleId}")
    public ResponseEntity<Map<String, Object>> deleteSchedule(
            @PathVariable Long id,
            @PathVariable Long scheduleId) {
        
        log.warn("⚠️ 사용 중단된 API 호출: /api/v1/consultants/{}/schedule/{} -> /api/schedules/consultant/{}/{} 사용 권장", 
                id, scheduleId, id, scheduleId);
        
        Map<String, Object> response = Map.of(
            "success", false,
            "message", "이 API는 사용 중단되었습니다. /api/schedules/consultant/" + id + "/" + scheduleId + "를 사용해주세요.",
            "redirectUrl", "/api/schedules/consultant/" + id + "/" + scheduleId
        );
        
        return ResponseEntity.status(HttpStatus.MOVED_PERMANENTLY).body(response);
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
     * 상담 완료 처리 (상담사 전용 - 상담일지 작성)
     * POST /api/v1/consultants/{id}/consultations/{consultationId}/complete
     */
    @PostMapping("/{id}/consultations/{consultationId}/complete")
    public ResponseEntity<Map<String, Object>> completeConsultation(
            @PathVariable Long id,
            @PathVariable Long consultationId,
            @RequestParam String notes,
            @RequestParam int rating,
            HttpServletRequest request) {
        
        // 상담사 권한 체크
        String userRole = (String) request.getAttribute("userRole");
        Long userId = (Long) request.getAttribute("userId");
        
        if (!UserRole.CONSULTANT.name().equals(userRole) || !id.equals(userId)) {
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "상담 완료는 해당 상담사만 가능합니다."
            );
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }
        
        // 상담일지 필수 작성 체크
        if (notes == null || notes.trim().isEmpty()) {
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "상담일지는 필수 작성 항목입니다."
            );
            return ResponseEntity.badRequest().body(response);
        }
        
        log.info("상담 완료 처리 - ID: {}, consultationId: {}, rating: {}", id, consultationId, rating);
        
        consultantService.completeConsultation(id, consultationId, notes, rating);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "상담이 완료되었습니다.",
            "consultationId", consultationId,
            "notes", notes,
            "rating", rating
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담 일지 작성 (상담사 전용)
     * POST /api/v1/consultants/{id}/consultations/{consultationId}/notes
     */
    @PostMapping("/{id}/consultations/{consultationId}/notes")
    public ResponseEntity<Map<String, Object>> writeConsultationNotes(
            @PathVariable Long id,
            @PathVariable Long consultationId,
            @RequestParam String notes,
            HttpServletRequest request) {
        
        // 상담사 권한 체크
        String userRole = (String) request.getAttribute("userRole");
        Long userId = (Long) request.getAttribute("userId");
        
        if (!UserRole.CONSULTANT.name().equals(userRole) || !id.equals(userId)) {
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "상담 일지 작성은 해당 상담사만 가능합니다."
            );
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }
        
        // 상담일지 필수 작성 체크
        if (notes == null || notes.trim().isEmpty()) {
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "상담일지는 필수 작성 항목입니다."
            );
            return ResponseEntity.badRequest().body(response);
        }
        
        log.info("상담 일지 작성 - ID: {}, consultationId: {}", id, consultationId);
        
        // 상담 일지 작성 로직 (실제 구현에서는 ConsultationService 호출)
        // consultationService.addConsultationNote(consultationId, notes, id.toString());
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "상담 일지가 작성되었습니다.",
            "consultationId", consultationId,
            "notes", notes
        );
        
        return ResponseEntity.ok(response);
    }
    
    // === 상담일지 관리 ===
    
    /**
     * 상담일지 목록 조회
     * GET /api/consultants/{id}/consultation-records?consultationId=123
     */
    @GetMapping("/{id}/consultation-records")
    public ResponseEntity<Map<String, Object>> getConsultationRecords(
            @PathVariable Long id,
            @RequestParam(required = false) String consultationId) {
        
        log.info("상담일지 목록 조회 - 상담사 ID: {}, 상담 ID: {}", id, consultationId);
        
        // 임시로 빈 목록 반환
        List<Map<String, Object>> records = new ArrayList<>();
        
        Map<String, Object> response = Map.of(
            "success", true,
            "data", records,
            "totalCount", records.size()
        );
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 상담일지 작성
     * POST /api/consultants/{id}/consultation-records
     */
    @PostMapping("/{id}/consultation-records")
    public ResponseEntity<Map<String, Object>> createConsultationRecord(
            @PathVariable Long id,
            @RequestBody Map<String, Object> recordData) {
        
        log.info("상담일지 작성 - 상담사 ID: {}, 데이터: {}", id, recordData);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "상담일지가 성공적으로 작성되었습니다.",
            "data", recordData
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * 상담일지 수정
     * PUT /api/consultants/{id}/consultation-records/{recordId}
     */
    @PutMapping("/{id}/consultation-records/{recordId}")
    public ResponseEntity<Map<String, Object>> updateConsultationRecord(
            @PathVariable Long id,
            @PathVariable Long recordId,
            @RequestBody Map<String, Object> recordData) {
        
        log.info("상담일지 수정 - 상담사 ID: {}, 기록 ID: {}, 데이터: {}", id, recordId, recordData);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "message", "상담일지가 성공적으로 수정되었습니다.",
            "data", recordData
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
