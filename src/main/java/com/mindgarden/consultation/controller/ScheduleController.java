package com.mindgarden.consultation.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.mindgarden.consultation.dto.ScheduleCreateDto;
import com.mindgarden.consultation.dto.ScheduleDto;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.Schedule;
import com.mindgarden.consultation.service.AdminService;
import com.mindgarden.consultation.service.ScheduleService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 스케줄 관리 컨트롤러
 * 권한 기반으로 상담사는 자신의 일정만, 관리자는 모든 일정을 조회/관리할 수 있습니다.
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;
    private final AdminService adminService;

    // ==================== 권한 기반 스케줄 조회 ====================

    /**
     * 권한 기반 전체 스케줄 조회 (상담사 이름 포함)
     * 상담사: 자신의 일정만, 관리자: 모든 일정
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getSchedulesByUserRole(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String userRole) {
        
        log.info("🔐 권한 기반 스케줄 조회 요청: 사용자 {}, 역할 {}", userId, userRole);
        
        // 필수 파라미터 검증
        if (userId == null || userRole == null) {
            log.error("❌ 필수 파라미터 누락: userId={}, userRole={}", userId, userRole);
            return ResponseEntity.badRequest().body(null);
        }
        
        try {
            List<ScheduleDto> schedules = scheduleService.findSchedulesWithNamesByUserRole(userId, userRole);
            log.info("✅ 스케줄 조회 완료: {}개", schedules.size());
            
            // 일관된 응답 형식으로 반환
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", schedules);
            response.put("message", "스케줄 조회 성공");
            response.put("totalCount", schedules.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ 스케줄 조회 실패: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("data", null);
            errorResponse.put("message", "스케줄 조회 실패: " + e.getMessage());
            errorResponse.put("totalCount", 0);
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * 권한 기반 페이지네이션 스케줄 조회 (상담사 이름 포함)
     * 상담사: 자신의 일정만, 관리자: 모든 일정
     */
    @GetMapping("/paged")
    public ResponseEntity<Page<ScheduleDto>> getSchedulesByUserRolePaged(
            @RequestParam Long userId,
            @RequestParam String userRole,
            @PageableDefault(size = 10, sort = "date") Pageable pageable) {
        
        log.info("🔐 권한 기반 페이지네이션 스케줄 조회 요청: 사용자 {}, 역할 {}, 페이지 {}", userId, userRole, pageable.getPageNumber());
        
        try {
            Page<ScheduleDto> schedules = scheduleService.findSchedulesWithNamesByUserRolePaged(userId, userRole, pageable);
            log.info("✅ 페이지네이션 스케줄 조회 완료: {}개 (총 {}개)", schedules.getNumberOfElements(), schedules.getTotalElements());
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("❌ 페이지네이션 스케줄 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 권한 기반 특정 날짜 스케줄 조회
     */
    @GetMapping("/date/{date}")
    public ResponseEntity<List<Schedule>> getSchedulesByUserRoleAndDate(
            @RequestParam Long userId,
            @RequestParam String userRole,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        log.info("🔐 권한 기반 특정 날짜 스케줄 조회: 사용자 {}, 역할 {}, 날짜 {}", userId, userRole, date);
        
        try {
            List<Schedule> schedules = scheduleService.findSchedulesByUserRoleAndDate(userId, userRole, date);
            log.info("✅ 특정 날짜 스케줄 조회 완료: {}개", schedules.size());
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("❌ 특정 날짜 스케줄 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 권한 기반 날짜 범위 스케줄 조회
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<Schedule>> getSchedulesByUserRoleAndDateRange(
            @RequestParam Long userId,
            @RequestParam String userRole,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("🔐 권한 기반 날짜 범위 스케줄 조회: 사용자 {}, 역할 {}, 기간 {} ~ {}", userId, userRole, startDate, endDate);
        
        try {
            List<Schedule> schedules = scheduleService.findSchedulesByUserRoleAndDateBetween(userId, userRole, startDate, endDate);
            log.info("✅ 날짜 범위 스케줄 조회 완료: {}개", schedules.size());
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("❌ 날짜 범위 스케줄 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // ==================== 상담사별 스케줄 조회 ====================

    /**
     * 특정 상담사의 특정 날짜 스케줄 조회
     * GET /api/schedules/consultant/{consultantId}/date?date=2025-09-02
     */
    @GetMapping("/consultant/{consultantId}/date")
    public ResponseEntity<List<Schedule>> getConsultantSchedulesByDate(
            @PathVariable Long consultantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        log.info("📅 상담사별 특정 날짜 스케줄 조회: 상담사 {}, 날짜 {}", consultantId, date);
        
        try {
            List<Schedule> schedules = scheduleService.findByConsultantIdAndDate(consultantId, date);
            log.info("✅ 상담사별 스케줄 조회 완료: {}개", schedules.size());
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("❌ 상담사별 스케줄 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 상담사 자신의 전체 스케줄 조회 (상담사 전용)
     * GET /api/schedules/consultant/{consultantId}/my-schedules
     */
    @GetMapping("/consultant/{consultantId}/my-schedules")
    public ResponseEntity<List<Schedule>> getMySchedules(@PathVariable Long consultantId) {
        
        log.info("📅 상담사 자신의 스케줄 조회: 상담사 {}", consultantId);
        
        try {
            List<Schedule> schedules = scheduleService.findByConsultantId(consultantId);
            log.info("✅ 상담사 스케줄 조회 완료: {}개", schedules.size());
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("❌ 상담사 스케줄 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // ==================== 스케줄 생성 ====================

    /**
     * 상담사 스케줄 생성
     * POST /api/schedules/consultant
     */
    @PostMapping("/consultant")
    public ResponseEntity<Map<String, Object>> createConsultantSchedule(
            @RequestBody ScheduleCreateDto scheduleDto) {
        
        log.info("📅 상담사 스케줄 생성 요청: 상담사 {}, 내담자 {}, 날짜 {}, 시간 {} - {}, 상담유형 {}", 
                scheduleDto.getConsultantId(), scheduleDto.getClientId(), 
                scheduleDto.getDate(), scheduleDto.getStartTime(), scheduleDto.getEndTime(),
                scheduleDto.getConsultationType());
        
        try {
            // 날짜와 시간 파싱
            LocalDate date = LocalDate.parse(scheduleDto.getDate());
            LocalTime startTime = LocalTime.parse(scheduleDto.getStartTime());
            LocalTime endTime = LocalTime.parse(scheduleDto.getEndTime());
            
            Schedule schedule = scheduleService.createConsultantSchedule(
                scheduleDto.getConsultantId(),
                scheduleDto.getClientId(),
                date,
                startTime,
                endTime,
                scheduleDto.getTitle(),
                scheduleDto.getDescription(),
                scheduleDto.getConsultationType()
            );
            
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "스케줄이 성공적으로 생성되었습니다.",
                "scheduleId", schedule.getId()
            );
            
            log.info("✅ 스케줄 생성 완료: ID {}", schedule.getId());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 스케줄 생성 실패: {}", e.getMessage());
            
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "스케줄 생성에 실패했습니다: " + e.getMessage()
            );
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    // ==================== 스케줄 수정 ====================

    /**
     * 스케줄 수정
     * PUT /api/schedules/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateSchedule(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updateData) {
        
        log.info("📝 스케줄 수정 요청: ID {}, 데이터 {}", id, updateData);
        
        try {
            Schedule existingSchedule = scheduleService.findById(id);
            
            // 상태 업데이트
            if (updateData.containsKey("status")) {
                String newStatus = (String) updateData.get("status");
                existingSchedule.setStatus(newStatus);
                existingSchedule.setUpdatedAt(java.time.LocalDateTime.now());
                log.info("📝 스케줄 상태 변경: {} -> {}", existingSchedule.getStatus(), newStatus);
            }
            
            // 상담 유형 업데이트
            if (updateData.containsKey("consultationType")) {
                existingSchedule.setConsultationType((String) updateData.get("consultationType"));
            }
            
            // 기타 필드 업데이트
            if (updateData.containsKey("title")) {
                existingSchedule.setTitle((String) updateData.get("title"));
            }
            if (updateData.containsKey("description")) {
                existingSchedule.setDescription((String) updateData.get("description"));
            }
            
            Schedule updatedSchedule = scheduleService.updateSchedule(id, existingSchedule);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "스케줄이 성공적으로 수정되었습니다.",
                "scheduleId", updatedSchedule.getId()
            );
            
            log.info("✅ 스케줄 수정 완료: ID {}", updatedSchedule.getId());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 스케줄 수정 실패: {}", e.getMessage());
            
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "스케줄 수정에 실패했습니다: " + e.getMessage()
            );
            
            return ResponseEntity.badRequest().body(response);
        }
    }

    // ==================== 관리자 전용 ====================

    /**
     * 관리자용 전체 스케줄 통계 조회
     */
    @GetMapping("/admin/statistics")
    public ResponseEntity<Map<String, Object>> getScheduleStatisticsForAdmin(
            @RequestParam String userRole,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        log.info("📊 관리자용 스케줄 통계 조회 요청: 역할 {}, 시작일: {}, 종료일: {}", userRole, startDate, endDate);
        
        // 관리자 권한 확인
        if (!"ADMIN".equals(userRole) && !"SUPER_ADMIN".equals(userRole)) {
            log.warn("❌ 관리자 권한 없음: {}", userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        try {
            Map<String, Object> statistics = scheduleService.getScheduleStatisticsForAdmin(startDate, endDate);
            log.info("✅ 관리자용 스케줄 통계 조회 완료");
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            log.error("❌ 관리자용 스케줄 통계 조회 실패: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 오늘의 스케줄 통계 조회
     */
    @GetMapping("/today/statistics")
    public ResponseEntity<Map<String, Object>> getTodayScheduleStatistics(
            @RequestParam String userRole) {
        
        log.info("📊 오늘의 스케줄 통계 조회 요청: 역할 {}", userRole);
        
        // 관리자 또는 상담사 권한 확인
        if (!"ADMIN".equals(userRole) && !"SUPER_ADMIN".equals(userRole) && !"CONSULTANT".equals(userRole)) {
            log.warn("❌ 접근 권한 없음: {}", userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        try {
            Map<String, Object> statistics = scheduleService.getTodayScheduleStatistics();
            log.info("✅ 오늘의 스케줄 통계 조회 완료");
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            log.error("❌ 오늘의 스케줄 통계 조회 실패: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // ==================== 상담사별 스케줄 관리 ====================

    /**
     * 상담사별 스케줄 조회 (관리자만 접근 가능)
     */
    @GetMapping("/consultant/{consultantId}")
    public ResponseEntity<List<Schedule>> getSchedulesByConsultant(
            @PathVariable Long consultantId,
            @RequestParam String userRole) {
        
        log.info("👨‍⚕️ 상담사별 스케줄 조회: 상담사 {}, 요청자 역할 {}", consultantId, userRole);
        
        // 관리자 권한 확인
        if (!"ADMIN".equals(userRole) && !"SUPER_ADMIN".equals(userRole)) {
            log.warn("❌ 관리자 권한 없음: {}", userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        try {
            List<Schedule> schedules = scheduleService.findByConsultantId(consultantId);
            log.info("✅ 상담사별 스케줄 조회 완료: {}개", schedules.size());
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("❌ 상담사별 스케줄 조회 실패: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // ==================== 내담자별 스케줄 관리 ====================

    /**
     * 내담자별 스케줄 조회 (관리자만 접근 가능)
     */
    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<Schedule>> getSchedulesByClient(
            @PathVariable Long clientId,
            @RequestParam String userRole) {
        
        log.info("👤 내담자별 스케줄 조회: 내담자 {}, 요청자 역할 {}", clientId, userRole);
        
        // 관리자 권한 확인
        if (!"ADMIN".equals(userRole) && !"SUPER_ADMIN".equals(userRole)) {
            log.warn("❌ 관리자 권한 없음: {}", userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        try {
            List<Schedule> schedules = scheduleService.findByClientId(clientId);
            log.info("✅ 내담자별 스케줄 조회 완료: {}개", schedules.size());
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            log.error("❌ 내담자별 스케줄 조회 실패: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // ==================== 예약 확정 관리 ====================

    /**
     * 예약 확정 (관리자 전용)
     * 내담자 입금 확인 후 관리자가 예약을 확정합니다.
     */
    @PutMapping("/{id}/confirm")
    public ResponseEntity<Map<String, Object>> confirmSchedule(
            @PathVariable Long id,
            @RequestBody Map<String, Object> confirmData,
            @RequestParam String userRole) {
        
        log.info("✅ 예약 확정 요청: ID {}, 관리자 역할 {}", id, userRole);
        
        // 관리자 권한 확인
        if (!"ADMIN".equals(userRole) && !"SUPER_ADMIN".equals(userRole)) {
            log.warn("❌ 관리자 권한 없음: {}", userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
        }
        
        try {
            String adminNote = (String) confirmData.getOrDefault("adminNote", "입금 확인 완료");
            
            Schedule confirmedSchedule = scheduleService.confirmSchedule(id, adminNote);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "예약이 성공적으로 확정되었습니다.",
                "scheduleId", confirmedSchedule.getId(),
                "status", confirmedSchedule.getStatus()
            );
            
            log.info("✅ 예약 확정 완료: ID {}, 상태 {}", confirmedSchedule.getId(), confirmedSchedule.getStatus());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 예약 확정 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "예약 확정에 실패했습니다: " + e.getMessage()));
        }
    }

    // ==================== 자동 완료 처리 ====================

    /**
     * 시간이 지난 확정된 스케줄을 자동으로 완료 처리
     * 관리자만 호출 가능
     */
    @PostMapping("/auto-complete")
    public ResponseEntity<Map<String, Object>> autoCompleteExpiredSchedules(
            @RequestParam String userRole) {
        log.info("🔄 자동 완료 처리 요청: 사용자 역할 {}", userRole);
        
        if (!"ADMIN".equals(userRole) && !"SUPER_ADMIN".equals(userRole)) {
            log.warn("❌ 관리자 권한 없음: {}", userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("success", false, "message", "관리자 권한이 필요합니다."));
        }
        
        try {
            scheduleService.autoCompleteExpiredSchedules();
            
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "시간이 지난 스케줄이 자동으로 완료 처리되었습니다."
            );
            
            log.info("✅ 자동 완료 처리 완료");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 자동 완료 처리 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "자동 완료 처리에 실패했습니다: " + e.getMessage()));
        }
    }

    // ==================== 한글 변환 API ====================

    /**
     * 스케줄 상태를 한글로 변환
     */
    @GetMapping("/status-korean")
    public ResponseEntity<Map<String, Object>> getStatusInKorean(
            @RequestParam String status) {
        try {
            String koreanStatus = scheduleService.getStatusInKorean(status);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "originalStatus", status,
                "koreanStatus", koreanStatus
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 상태 한글 변환 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "상태 한글 변환에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 스케줄 타입을 한글로 변환
     */
    @GetMapping("/type-korean")
    public ResponseEntity<Map<String, Object>> getScheduleTypeInKorean(
            @RequestParam String scheduleType) {
        try {
            String koreanType = scheduleService.getScheduleTypeInKorean(scheduleType);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "originalType", scheduleType,
                "koreanType", koreanType
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 스케줄 타입 한글 변환 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "스케줄 타입 한글 변환에 실패했습니다: " + e.getMessage()));
        }
    }

    /**
     * 상담 유형을 한글로 변환
     */
    @GetMapping("/consultation-type-korean")
    public ResponseEntity<Map<String, Object>> getConsultationTypeInKorean(
            @RequestParam String consultationType) {
        try {
            String koreanType = scheduleService.getConsultationTypeInKorean(consultationType);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "originalType", consultationType,
                "koreanType", koreanType
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 상담 유형 한글 변환 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "상담 유형 한글 변환에 실패했습니다: " + e.getMessage()));
        }
    }
    
    /**
     * 내담자-상담사 매핑 확인
     */
    @PostMapping("/client/mapping/check")
    public ResponseEntity<?> checkClientMapping(@RequestBody Map<String, Object> request) {
        try {
            Long clientId = Long.valueOf(request.get("clientId").toString());
            Long consultantId = Long.valueOf(request.get("consultantId").toString());
            
            log.info("매핑 확인 요청: clientId={}, consultantId={}", clientId, consultantId);
            
            // 실제 매핑 확인 로직 구현
            Map<String, Object> mappingData = new HashMap<>();
            
            try {
                // AdminService를 통해 실제 매핑 조회
                List<ConsultantClientMapping> mappings = adminService.getMappingsByClient(clientId);
                
                // 해당 상담사와의 활성 매핑 찾기
                Optional<ConsultantClientMapping> activeMapping = mappings.stream()
                    .filter(mapping -> mapping.getConsultant() != null && 
                            mapping.getConsultant().getId().equals(consultantId) &&
                            mapping.getStatus() == ConsultantClientMapping.MappingStatus.ACTIVE)
                    .findFirst();
                
                if (activeMapping.isPresent()) {
                    ConsultantClientMapping mapping = activeMapping.get();
                    mappingData.put("hasMapping", true);
                    mappingData.put("remainingSessions", mapping.getRemainingSessions());
                    mappingData.put("packageName", mapping.getPackageName());
                    mappingData.put("mappingStatus", mapping.getStatus().toString());
                    mappingData.put("lastSessionDate", null); // getLastSessionDate 메서드가 없으므로 null로 설정
                    mappingData.put("totalSessions", mapping.getTotalSessions());
                    mappingData.put("usedSessions", mapping.getUsedSessions());
                    mappingData.put("paymentStatus", mapping.getPaymentStatus() != null ? 
                        mapping.getPaymentStatus().toString() : "UNKNOWN");
                } else {
                    mappingData.put("hasMapping", false);
                    mappingData.put("remainingSessions", 0);
                    mappingData.put("packageName", null);
                    mappingData.put("mappingStatus", "NO_MAPPING");
                    mappingData.put("lastSessionDate", null);
                    mappingData.put("totalSessions", 0);
                    mappingData.put("usedSessions", 0);
                    mappingData.put("paymentStatus", "NO_MAPPING");
                }
                
                log.info("매핑 확인 완료: clientId={}, consultantId={}, hasMapping={}", 
                    clientId, consultantId, mappingData.get("hasMapping"));
                
            } catch (Exception e) {
                log.error("매핑 확인 중 오류: clientId={}, consultantId={}, error={}", 
                    clientId, consultantId, e.getMessage());
                
                // 오류 시 기본값 반환
                mappingData.put("hasMapping", false);
                mappingData.put("remainingSessions", 0);
                mappingData.put("packageName", null);
                mappingData.put("mappingStatus", "ERROR");
                mappingData.put("lastSessionDate", null);
                mappingData.put("totalSessions", 0);
                mappingData.put("usedSessions", 0);
                mappingData.put("paymentStatus", "ERROR");
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "매핑 정보를 성공적으로 확인했습니다.");
            response.put("data", mappingData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("매핑 확인 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "매핑 확인 중 오류가 발생했습니다."));
        }
    }
}
