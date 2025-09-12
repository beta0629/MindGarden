package com.mindgarden.consultation.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
import com.mindgarden.consultation.constant.AdminConstants;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.ScheduleCreateDto;
import com.mindgarden.consultation.dto.ScheduleDto;
import com.mindgarden.consultation.dto.ScheduleResponseDto;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.ConsultationRecord;
import com.mindgarden.consultation.entity.Schedule;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.AdminService;
import com.mindgarden.consultation.service.CommonCodeService;
import com.mindgarden.consultation.service.ConsultantAvailabilityService;
import com.mindgarden.consultation.service.ConsultationRecordService;
import com.mindgarden.consultation.service.ScheduleService;
import com.mindgarden.consultation.utils.SessionUtils;
import jakarta.servlet.http.HttpSession;
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
    private final ConsultationRecordService consultationRecordService;
    private final CommonCodeService commonCodeService;
    private final ConsultantAvailabilityService consultantAvailabilityService;

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
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String userRole) {
        
        log.info("📅 상담사별 특정 날짜 스케줄 조회: 상담사 {}, 날짜 {}, 요청자 역할 {}", consultantId, date, userRole);
        
        // 관리자 권한 확인 (userRole이 제공된 경우에만)
        if (userRole != null && !"ADMIN".equals(userRole) && !"SUPER_ADMIN".equals(userRole) && 
            !"BRANCH_SUPER_ADMIN".equals(userRole) && !"HQ_ADMIN".equals(userRole) && !"SUPER_HQ_ADMIN".equals(userRole)) {
            log.warn("❌ 관리자 권한 없음: {}", userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
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
    public ResponseEntity<List<ScheduleResponseDto>> getMySchedules(
            @PathVariable Long consultantId,
            @RequestParam(required = false) String userRole) {
        
        log.info("📅 상담사 자신의 스케줄 조회: 상담사 {}, 요청자 역할 {}", consultantId, userRole);
        
        // 관리자 권한 확인 (userRole이 제공된 경우에만)
        if (userRole != null && !"ADMIN".equals(userRole) && !"SUPER_ADMIN".equals(userRole) && 
            !"BRANCH_SUPER_ADMIN".equals(userRole) && !"HQ_ADMIN".equals(userRole) && !"SUPER_HQ_ADMIN".equals(userRole)) {
            log.warn("❌ 관리자 권한 없음: {}", userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        try {
            List<Schedule> schedules = scheduleService.findByConsultantId(consultantId);
            
            // 상담 유형을 한글로 변환하여 DTO로 변환
            List<ScheduleResponseDto> responseDtos = schedules.stream()
                    .map(schedule -> {
                        String koreanConsultationType = commonCodeService.getCodeName("CONSULTATION_TYPE", schedule.getConsultationType());
                        return ScheduleResponseDto.from(schedule, koreanConsultationType);
                    })
                    .collect(java.util.stream.Collectors.toList());
            
            log.info("✅ 상담사 스케줄 조회 완료: {}개", responseDtos.size());
            return ResponseEntity.ok(responseDtos);
        } catch (Exception e) {
            log.error("❌ 상담사 스케줄 조회 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // ==================== 스케줄 생성 ====================

    /**
     * 현재 사용자 권한 확인 (디버깅용)
     * GET /api/schedules/debug/user-role
     */
    @GetMapping("/debug/user-role")
    public ResponseEntity<Map<String, Object>> debugUserRole(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            Map<String, Object> debugInfo = new HashMap<>();
            debugInfo.put("userId", currentUser.getId());
            debugInfo.put("username", currentUser.getUsername());
            debugInfo.put("email", currentUser.getEmail());
            debugInfo.put("role", currentUser.getRole());
            debugInfo.put("roleName", currentUser.getRole().name());
            debugInfo.put("roleDisplayName", currentUser.getRole().getDisplayName());
            debugInfo.put("isAdmin", currentUser.getRole().isAdmin());
            debugInfo.put("isBranchManager", currentUser.getRole().isBranchManager());
            debugInfo.put("isHeadquartersAdmin", currentUser.getRole().isHeadquartersAdmin());
            debugInfo.put("isBranchSuperAdmin", currentUser.getRole().isBranchSuperAdmin());
            debugInfo.put("branchCode", currentUser.getBranchCode());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", debugInfo
            ));
        } catch (Exception e) {
            log.error("❌ 사용자 권한 디버깅 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "사용자 권한 확인에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 상담사 스케줄 생성
     * POST /api/schedules/consultant
     */
    @PostMapping("/consultant")
    public ResponseEntity<Map<String, Object>> createConsultantSchedule(
            @RequestBody ScheduleCreateDto scheduleDto, HttpSession session) {
        
        log.info("📅 상담사 스케줄 생성 요청: 상담사 {}, 내담자 {}, 날짜 {}, 시간 {} - {}, 상담유형 {}", 
                scheduleDto.getConsultantId(), scheduleDto.getClientId(), 
                scheduleDto.getDate(), scheduleDto.getStartTime(), scheduleDto.getEndTime(),
                scheduleDto.getConsultationType());
        
        try {
            // 권한 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.warn("❌ 세션에서 사용자 정보를 찾을 수 없습니다.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            log.info("🔍 현재 사용자 권한 확인: role={}, roleName={}, isAdmin={}, isBranchManager={}, isHeadquartersAdmin={}", 
                currentUser.getRole(), currentUser.getRole().name(), currentUser.getRole().isAdmin(), 
                currentUser.getRole().isBranchManager(), currentUser.getRole().isHeadquartersAdmin());
            
            // 관리자 권한 확인 (ADMIN, BRANCH_SUPER_ADMIN, HQ_ADMIN, SUPER_HQ_ADMIN, BRANCH_MANAGER)
            UserRole userRole = currentUser.getRole();
            boolean isAdmin = userRole == UserRole.ADMIN;
            boolean isBranchSuperAdmin = userRole == UserRole.BRANCH_SUPER_ADMIN;
            boolean isHqAdmin = userRole == UserRole.HQ_ADMIN;
            boolean isSuperHqAdmin = userRole == UserRole.SUPER_HQ_ADMIN;
            boolean isBranchManager = userRole == UserRole.BRANCH_MANAGER;
            boolean isSuperAdmin = userRole == UserRole.SUPER_ADMIN;
            
            boolean hasPermission = isAdmin || isBranchSuperAdmin || isHqAdmin || isSuperHqAdmin || isBranchManager || isSuperAdmin;
            
            log.info("🔍 권한 상세 확인: isAdmin={}, isBranchSuperAdmin={}, isHqAdmin={}, isSuperHqAdmin={}, isBranchManager={}, isSuperAdmin={}, hasPermission={}", 
                isAdmin, isBranchSuperAdmin, isHqAdmin, isSuperHqAdmin, isBranchManager, isSuperAdmin, hasPermission);
            
            if (!hasPermission) {
                log.warn("❌ 스케줄 등록 권한 없음: role={}, roleName={}", userRole, userRole.name());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "스케줄 등록 권한이 없습니다."
                ));
            }
            // 날짜와 시간 파싱
            LocalDate date = LocalDate.parse(scheduleDto.getDate());
            LocalTime startTime = LocalTime.parse(scheduleDto.getStartTime());
            LocalTime endTime = LocalTime.parse(scheduleDto.getEndTime());
            
            // 휴무 상태 확인
            boolean isOnVacation = consultantAvailabilityService.isConsultantOnVacation(
                scheduleDto.getConsultantId(), 
                date, 
                startTime, 
                endTime
            );
            
            if (isOnVacation) {
                log.warn("🚫 휴무 상태에서 스케줄 등록 시도: 상담사 {}, 날짜 {}, 시간 {} - {}", 
                    scheduleDto.getConsultantId(), date, startTime, endTime);
                
                // 데이터베이스에서 휴가 관련 메시지 조회
                String vacationMessage = getVacationConflictMessage();
                
                Map<String, Object> response = Map.of(
                    "success", false,
                    "message", vacationMessage
                );
                
                return ResponseEntity.badRequest().body(response);
            }
            
            // 세션에서 현재 사용자의 지점 정보 가져오기
            String branchCode = currentUser != null ? currentUser.getBranchCode() : AdminConstants.DEFAULT_BRANCH_CODE;
            log.info("🔧 스케줄 생성 지점코드: {}", branchCode);
            
            Schedule schedule = scheduleService.createConsultantSchedule(
                scheduleDto.getConsultantId(),
                scheduleDto.getClientId(),
                date,
                startTime,
                endTime,
                scheduleDto.getTitle(),
                scheduleDto.getDescription(),
                scheduleDto.getConsultationType(),
                branchCode
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
        if (!"ADMIN".equals(userRole) && !"SUPER_ADMIN".equals(userRole) && 
            !"BRANCH_SUPER_ADMIN".equals(userRole) && !"HQ_ADMIN".equals(userRole) && !"SUPER_HQ_ADMIN".equals(userRole)) {
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
        if (!"ADMIN".equals(userRole) && !"SUPER_ADMIN".equals(userRole) && !"CONSULTANT".equals(userRole) && 
            !"BRANCH_SUPER_ADMIN".equals(userRole) && !"HQ_ADMIN".equals(userRole) && !"SUPER_HQ_ADMIN".equals(userRole)) {
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
            @RequestParam(required = false) String userRole) {
        
        log.info("👨‍⚕️ 상담사별 스케줄 조회: 상담사 {}, 요청자 역할 {}", consultantId, userRole);
        
        // 관리자 권한 확인 (userRole이 제공된 경우에만)
        if (userRole != null && !"ADMIN".equals(userRole) && !"SUPER_ADMIN".equals(userRole) && 
            !"BRANCH_SUPER_ADMIN".equals(userRole) && !"HQ_ADMIN".equals(userRole) && !"SUPER_HQ_ADMIN".equals(userRole)) {
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
        if (!"ADMIN".equals(userRole) && !"SUPER_ADMIN".equals(userRole) && 
            !"BRANCH_SUPER_ADMIN".equals(userRole) && !"HQ_ADMIN".equals(userRole) && !"SUPER_HQ_ADMIN".equals(userRole)) {
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
        if (!"ADMIN".equals(userRole) && !"SUPER_ADMIN".equals(userRole) && 
            !"BRANCH_SUPER_ADMIN".equals(userRole) && !"HQ_ADMIN".equals(userRole) && !"SUPER_HQ_ADMIN".equals(userRole)) {
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
        
        if (!"ADMIN".equals(userRole) && !"SUPER_ADMIN".equals(userRole) && 
            !"BRANCH_SUPER_ADMIN".equals(userRole) && !"HQ_ADMIN".equals(userRole) && !"SUPER_HQ_ADMIN".equals(userRole)) {
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
            log.info("매핑 확인 요청 받음: request={}", request);
            
            Long clientId = Long.valueOf(request.get("clientId").toString());
            Long consultantId = Long.valueOf(request.get("consultantId").toString());
            
            log.info("매핑 확인 요청 파싱 완료: clientId={}, consultantId={}", clientId, consultantId);
            
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
    
    // ==================== 상담일지 관리 ====================
    
    /**
     * 상담일지 목록 조회
     * GET /api/schedules/consultation-records?consultantId=41&consultationId=schedule-30
     */
    @GetMapping("/consultation-records")
    public ResponseEntity<Map<String, Object>> getConsultationRecords(
            @RequestParam(required = false) Long consultantId,
            @RequestParam(required = false) String consultationId) {
        
        log.info("📝 상담일지 목록 조회 - 상담사 ID: {}, 상담 ID: {}", consultantId, consultationId);
        
        try {
            List<com.mindgarden.consultation.entity.ConsultationRecord> records;
            
            if (consultationId != null) {
                // consultationId가 "schedule-30" 형태인 경우 숫자 부분만 추출
                Long consultationIdLong = null;
                if (consultationId.startsWith("schedule-")) {
                    consultationIdLong = Long.valueOf(consultationId.replace("schedule-", ""));
                } else {
                    consultationIdLong = Long.valueOf(consultationId);
                }
                records = consultationRecordService.getConsultationRecordsByConsultationId(consultationIdLong);
            } else if (consultantId != null) {
                // 상담사별 조회 (페이지네이션 없이 최근 10개)
                records = consultationRecordService.getRecentConsultationRecords(consultantId, "CONSULTANT", 10);
            } else {
                records = new ArrayList<>();
            }
            
            Map<String, Object> response = Map.of(
                "success", true,
                "data", records,
                "totalCount", records.size()
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("상담일지 목록 조회 오류:", e);
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "상담일지 조회 중 오류가 발생했습니다: " + e.getMessage(),
                "data", new ArrayList<>(),
                "totalCount", 0
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * 상담일지 작성
     * POST /api/schedules/consultation-records
     */
    @PostMapping("/consultation-records")
    public ResponseEntity<Map<String, Object>> createConsultationRecord(
            @RequestBody Map<String, Object> recordData) {
        
        log.info("📝 상담일지 작성 - 데이터: {}", recordData);
        
        try {
            com.mindgarden.consultation.entity.ConsultationRecord savedRecord = 
                consultationRecordService.createConsultationRecord(recordData);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "상담일지가 성공적으로 작성되었습니다.",
                "data", savedRecord
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            log.error("상담일지 작성 오류:", e);
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "상담일지 작성 중 오류가 발생했습니다: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * 상담일지 수정
     * PUT /api/schedules/consultation-records/{recordId}
     */
    @PutMapping("/consultation-records/{recordId}")
    public ResponseEntity<Map<String, Object>> updateConsultationRecord(
            @PathVariable Long recordId,
            @RequestBody Map<String, Object> recordData) {
        
        log.info("📝 상담일지 수정 - 기록 ID: {}, 데이터: {}", recordId, recordData);
        
        try {
            com.mindgarden.consultation.entity.ConsultationRecord updatedRecord = 
                consultationRecordService.updateConsultationRecord(recordId, recordData);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "상담일지가 성공적으로 수정되었습니다.",
                "data", updatedRecord
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("상담일지 수정 오류:", e);
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "상담일지 수정 중 오류가 발생했습니다: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 내담자별 특정 회기 상담일지 조회
     */
    @GetMapping("/api/schedules/consultation-records/client/{clientId}/session/{sessionNumber}")
    public ResponseEntity<Map<String, Object>> getConsultationRecordsByClientAndSession(
            @PathVariable Long clientId,
            @PathVariable Integer sessionNumber,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            log.info("👤 내담자별 특정 회기 상담일지 조회 - 내담자ID: {}, 회기: {}", clientId, sessionNumber);
            
            Pageable pageable = Pageable.ofSize(size).withPage(page);
            Page<ConsultationRecord> records = consultationRecordService.getConsultationRecordsByClientAndSession(clientId, sessionNumber, pageable);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", records.getContent(),
                "totalCount", records.getTotalElements(),
                "totalPages", records.getTotalPages(),
                "currentPage", records.getNumber(),
                "size", records.getSize()
            ));
        } catch (Exception e) {
            log.error("❌ 내담자별 특정 회기 상담일지 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "내담자별 특정 회기 상담일지 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 내담자별 전체 상담일지 조회 (회기순)
     */
    @GetMapping("/api/schedules/consultation-records/client/{clientId}")
    public ResponseEntity<Map<String, Object>> getConsultationRecordsByClient(@PathVariable Long clientId) {
        try {
            log.info("👤 내담자별 전체 상담일지 조회 - 내담자ID: {}", clientId);
            
            List<ConsultationRecord> records = consultationRecordService.getConsultationRecordsByClientOrderBySession(clientId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", records,
                "totalCount", records.size()
            ));
        } catch (Exception e) {
            log.error("❌ 내담자별 전체 상담일지 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "내담자별 전체 상담일지 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 내담자별 상담일지 회기별 그룹화 조회
     */
    @GetMapping("/api/schedules/consultation-records/client/{clientId}/grouped")
    public ResponseEntity<Map<String, Object>> getConsultationRecordsGroupedBySession(@PathVariable Long clientId) {
        try {
            log.info("👤 내담자별 상담일지 회기별 그룹화 조회 - 내담자ID: {}", clientId);
            
            Map<Integer, List<ConsultationRecord>> groupedRecords = consultationRecordService.getConsultationRecordsGroupedBySession(clientId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", groupedRecords,
                "totalSessions", groupedRecords.size()
            ));
        } catch (Exception e) {
            log.error("❌ 내담자별 상담일지 회기별 그룹화 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "내담자별 상담일지 회기별 그룹화 조회 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
    
    /**
     * 휴가 충돌 메시지 조회 (데이터베이스 코드 사용)
     */
    private String getVacationConflictMessage() {
        try {
            // 데이터베이스에서 휴가 관련 메시지 조회
            String message = commonCodeService.getCodeName("VACATION_MESSAGE", "CONFLICT");
            if (!message.equals("CONFLICT")) {
                return message; // 데이터베이스에서 찾은 메시지 반환
            }
        } catch (Exception e) {
            log.warn("휴가 충돌 메시지 조회 실패: {} -> 기본값 사용", e.getMessage());
        }
        
        // 데이터베이스에서 찾지 못한 경우 기본값 사용
        return "해당 시간대에 상담사가 휴무 상태입니다. 다른 시간을 선택해주세요.";
    }
}
