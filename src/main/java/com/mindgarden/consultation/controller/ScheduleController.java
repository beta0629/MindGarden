package com.mindgarden.consultation.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.mindgarden.consultation.constant.AdminConstants;
import com.mindgarden.consultation.constant.ScheduleStatus;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.dto.ScheduleCreateDto;
import com.mindgarden.consultation.dto.ScheduleDto;
import com.mindgarden.consultation.dto.ScheduleResponseDto;
import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.Schedule;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.AdminService;
import com.mindgarden.consultation.service.CommonCodeService;
import com.mindgarden.consultation.service.ConsultantAvailabilityService;
import com.mindgarden.consultation.service.ConsultationRecordService;
import com.mindgarden.consultation.service.DynamicPermissionService;
import com.mindgarden.consultation.service.ScheduleService;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
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
    private final DynamicPermissionService dynamicPermissionService;

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
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateRange,
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
        if (userRole != null && !"ADMIN".equals(userRole) && !"HQ_MASTER".equals(userRole) && 
            !"BRANCH_HQ_MASTER".equals(userRole) && !"HQ_ADMIN".equals(userRole) && !"SUPER_HQ_ADMIN".equals(userRole)) {
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
        if (userRole != null && !"ADMIN".equals(userRole) && !"HQ_MASTER".equals(userRole) && 
            !"BRANCH_HQ_MASTER".equals(userRole) && !"HQ_ADMIN".equals(userRole) && !"SUPER_HQ_ADMIN".equals(userRole)) {
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

    // ==================== 상담사별 스케줄 관리 ====================
    
    /**
     * 상담사별 스케줄 조회
     * GET /api/schedules/consultant/{consultantId}
     */
    @GetMapping("/consultant/{consultantId}")
    public ResponseEntity<Map<String, Object>> getConsultantSchedules(
            @PathVariable Long consultantId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpSession session) {
        
        log.info("📅 상담사별 스케줄 조회: consultantId={}, startDate={}, endDate={}", consultantId, startDate, endDate);
        
        try {
            // 권한 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 상담사는 자신의 스케줄만 조회 가능, 관리자는 모든 스케줄 조회 가능
            if (!currentUser.getRole().isAdmin() && !currentUser.getId().equals(consultantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "다른 상담사의 스케줄을 조회할 권한이 없습니다."
                ));
            }
            
            List<ScheduleDto> schedules;
            if (startDate != null && endDate != null) {
                List<Schedule> scheduleList = scheduleService.findSchedulesByUserRoleAndDateBetween(consultantId, "CONSULTANT", startDate, endDate);
                schedules = scheduleList.stream()
                    .map(schedule -> convertToScheduleDto(schedule))
                    .collect(java.util.stream.Collectors.toList());
            } else {
                schedules = scheduleService.findSchedulesWithNamesByUserRole(consultantId, "CONSULTANT");
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", schedules);
            response.put("totalCount", schedules.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 상담사별 스케줄 조회 실패: consultantId={}, error={}", consultantId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "스케줄 조회에 실패했습니다: " + e.getMessage()
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
            
            // 디버깅을 위한 상세 로그
            log.info("🔍 사용자 역할 상세: {}", currentUser.getRole());
            log.info("🔍 UserRole.SUPER_HQ_ADMIN: {}", UserRole.SUPER_HQ_ADMIN);
            log.info("🔍 역할 비교 결과: {}", currentUser.getRole() == UserRole.SUPER_HQ_ADMIN);
            
            // 동적 권한 시스템으로 스케줄러 등록 권한 확인
            UserRole userRole = currentUser.getRole();
            boolean hasPermission = dynamicPermissionService.canRegisterScheduler(userRole);
            
            log.info("🔍 권한 상세 확인: userRole={}, isAdmin={}, hasPermission={}", 
                userRole, userRole.isAdmin(), hasPermission);
            
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
                try {
                    ScheduleStatus statusEnum = ScheduleStatus.valueOf(newStatus);
                    existingSchedule.setStatus(statusEnum);
                    existingSchedule.setUpdatedAt(java.time.LocalDateTime.now());
                    log.info("📝 스케줄 상태 변경: {} -> {}", existingSchedule.getStatus(), statusEnum);
                } catch (IllegalArgumentException e) {
                    log.warn("⚠️ 유효하지 않은 스케줄 상태: {}", newStatus);
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "유효하지 않은 스케줄 상태입니다: " + newStatus
                    ));
                }
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
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateRange,
            @RequestParam(required = false) String chartType) {
        
        log.info("📊 관리자용 스케줄 통계 조회 요청: 역할 {}, 시작일: {}, 종료일: {}, 상태: {}, 날짜범위: {}, 차트타입: {}", 
                userRole, startDate, endDate, status, dateRange, chartType);
        
        // 관리자 권한 확인
        if (!"ADMIN".equals(userRole) && !"HQ_MASTER".equals(userRole) && 
            !"BRANCH_HQ_MASTER".equals(userRole) && !"HQ_ADMIN".equals(userRole) && !"SUPER_HQ_ADMIN".equals(userRole)) {
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
        if (!"ADMIN".equals(userRole) && !"HQ_MASTER".equals(userRole) && !"CONSULTANT".equals(userRole) && 
            !"BRANCH_HQ_MASTER".equals(userRole) && !"HQ_ADMIN".equals(userRole) && !"SUPER_HQ_ADMIN".equals(userRole) && 
            !"BRANCH_SUPER_ADMIN".equals(userRole)) {
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
        if (!"ADMIN".equals(userRole) && !"HQ_MASTER".equals(userRole) && 
            !"BRANCH_HQ_MASTER".equals(userRole) && !"HQ_ADMIN".equals(userRole) && !"SUPER_HQ_ADMIN".equals(userRole)) {
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
        if (!"ADMIN".equals(userRole) && !"HQ_MASTER".equals(userRole) && 
            !"BRANCH_HQ_MASTER".equals(userRole) && !"HQ_ADMIN".equals(userRole) && !"SUPER_HQ_ADMIN".equals(userRole)) {
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
        
        if (!"ADMIN".equals(userRole) && !"HQ_MASTER".equals(userRole) && 
            !"BRANCH_HQ_MASTER".equals(userRole) && !"HQ_ADMIN".equals(userRole) && !"SUPER_HQ_ADMIN".equals(userRole)) {
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
    
    /**
     * 상담사 스케줄 수정
     * PUT /api/schedules/consultant/{consultantId}/{scheduleId}
     */
    @PutMapping("/consultant/{consultantId}/{scheduleId}")
    public ResponseEntity<Map<String, Object>> updateConsultantSchedule(
            @PathVariable Long consultantId,
            @PathVariable Long scheduleId,
            @RequestBody Map<String, Object> updateData,
            HttpSession session) {
        
        log.info("📝 상담사 스케줄 수정: consultantId={}, scheduleId={}", consultantId, scheduleId);
        
        try {
            // 권한 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 상담사는 자신의 스케줄만 수정 가능, 관리자는 모든 스케줄 수정 가능
            if (!currentUser.getRole().isAdmin() && !currentUser.getId().equals(consultantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "다른 상담사의 스케줄을 수정할 권한이 없습니다."
                ));
            }
            
            // 스케줄 수정
            Schedule updatedSchedule = scheduleService.updateSchedule(scheduleId, 
                convertMapToSchedule(updateData));
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "스케줄이 성공적으로 수정되었습니다.");
            response.put("data", updatedSchedule);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 상담사 스케줄 수정 실패: consultantId={}, scheduleId={}, error={}", 
                    consultantId, scheduleId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "스케줄 수정에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * 상담사 스케줄 삭제
     * DELETE /api/schedules/consultant/{consultantId}/{scheduleId}
     */
    @DeleteMapping("/consultant/{consultantId}/{scheduleId}")
    public ResponseEntity<Map<String, Object>> deleteConsultantSchedule(
            @PathVariable Long consultantId,
            @PathVariable Long scheduleId,
            HttpSession session) {
        
        log.info("🗑️ 상담사 스케줄 삭제: consultantId={}, scheduleId={}", consultantId, scheduleId);
        
        try {
            // 권한 확인
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            // 상담사는 자신의 스케줄만 삭제 가능, 관리자는 모든 스케줄 삭제 가능
            if (!currentUser.getRole().isAdmin() && !currentUser.getId().equals(consultantId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "다른 상담사의 스케줄을 삭제할 권한이 없습니다."
                ));
            }
            
            // 스케줄 삭제
            scheduleService.deleteSchedule(scheduleId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "스케줄이 성공적으로 삭제되었습니다.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ 상담사 스케줄 삭제 실패: consultantId={}, scheduleId={}, error={}", 
                    consultantId, scheduleId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "스케줄 삭제에 실패했습니다: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Map을 Schedule 엔티티로 변환하는 헬퍼 메서드
     */
    private Schedule convertMapToSchedule(Map<String, Object> data) {
        Schedule schedule = new Schedule();
        
        if (data.get("date") != null) {
            schedule.setDate(LocalDate.parse(data.get("date").toString()));
        }
        if (data.get("startTime") != null) {
            schedule.setStartTime(LocalTime.parse(data.get("startTime").toString()));
        }
        if (data.get("endTime") != null) {
            schedule.setEndTime(LocalTime.parse(data.get("endTime").toString()));
        }
        if (data.get("title") != null) {
            schedule.setTitle(data.get("title").toString());
        }
        if (data.get("description") != null) {
            schedule.setDescription(data.get("description").toString());
        }
        if (data.get("status") != null) {
            try {
                schedule.setStatus(ScheduleStatus.valueOf(data.get("status").toString()));
            } catch (IllegalArgumentException e) {
                log.warn("⚠️ 유효하지 않은 스케줄 상태: {}", data.get("status"));
                schedule.setStatus(ScheduleStatus.AVAILABLE); // 기본값으로 설정
            }
        }
        
        return schedule;
    }
    
    /**
     * 관리자용 스케줄 조회 (필터링)
     * GET /api/schedules/admin
     */
    @GetMapping("/admin")
    public ResponseEntity<?> getSchedulesForAdmin(
            @RequestParam(required = false) Long consultantId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpSession session) {
        try {
            log.info("📅 관리자 스케줄 조회: consultantId={}, status={}, startDate={}, endDate={}", 
                    consultantId, status, startDate, endDate);
            
            // 현재 사용자 정보 조회
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("success", false, "message", "로그인이 필요합니다.")
                );
            }
            
            // 권한 확인 - 공통코드에서 관리자 역할 조회
            if (!isAdminUser(currentUser)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                    Map.of("success", false, "message", "관리자 권한이 필요합니다.")
                );
            }
            
            List<Schedule> schedules;
            
            if (consultantId != null) {
                // 특정 상담사의 스케줄만 조회
                schedules = scheduleService.findByConsultantId(consultantId);
            } else {
                // 모든 스케줄 조회
                schedules = scheduleService.findAll();
            }
            
            // 상태 필터링 - 공통코드에서 상태 조회
            if (status != null && !status.isEmpty() && !"ALL".equals(status)) {
                // 유효한 상태인지 공통코드로 확인
                if (isValidScheduleStatus(status)) {
                    schedules = schedules.stream()
                        .filter(schedule -> status.equals(schedule.getStatus().name()))
                        .collect(Collectors.toList());
                } else {
                    log.warn("⚠️ 유효하지 않은 스케줄 상태: {}", status);
                    return ResponseEntity.badRequest().body(
                        Map.of("success", false, "message", "유효하지 않은 스케줄 상태입니다: " + status)
                    );
                }
            }
            
            // 날짜 필터링
            if (startDate != null && !startDate.isEmpty()) {
                LocalDate start = LocalDate.parse(startDate);
                schedules = schedules.stream()
                    .filter(schedule -> schedule.getDate().isAfter(start) || schedule.getDate().isEqual(start))
                    .collect(Collectors.toList());
            }
            
            if (endDate != null && !endDate.isEmpty()) {
                LocalDate end = LocalDate.parse(endDate);
                schedules = schedules.stream()
                    .filter(schedule -> schedule.getDate().isBefore(end) || schedule.getDate().isEqual(end))
                    .collect(Collectors.toList());
            }
            
            List<ScheduleDto> scheduleDtos = schedules.stream()
                .map(this::convertToScheduleDto)
                .collect(Collectors.toList());
            
            Map<String, Object> response = Map.of(
                "success", true,
                "data", scheduleDtos,
                "count", scheduleDtos.size(),
                "consultantId", consultantId != null ? consultantId : "",
                "status", status != null ? status : "",
                "startDate", startDate != null ? startDate : "",
                "endDate", endDate != null ? endDate : "",
                "message", "스케줄 조회 성공"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ 관리자 스케줄 조회 실패: error={}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("success", false, "message", "스케줄 조회 실패: " + e.getMessage())
            );
        }
    }


    /**
     * 공통코드를 사용한 관리자 권한 확인
     */
    private boolean isAdminUser(User user) {
        try {
            // UserRole enum의 isAdmin() 메서드 사용 (동적 권한 확인)
            boolean isAdmin = user.getRole().isAdmin();
            log.info("🔍 관리자 권한 확인 (UserRole.isAdmin): userRole={}, isAdmin={}", 
                user.getRole().name(), isAdmin);
            return isAdmin;
        } catch (Exception e) {
            log.error("❌ 관리자 권한 확인 실패: error={}", e.getMessage(), e);
            // 기본값으로 하드코딩된 역할 확인 (fallback)
            boolean isAdmin = "ADMIN".equals(user.getRole().name()) || 
                   "HQ_MASTER".equals(user.getRole().name()) || 
                   "BRANCH_HQ_MASTER".equals(user.getRole().name()) ||
                   "BRANCH_SUPER_ADMIN".equals(user.getRole().name()) ||
                   "HQ_ADMIN".equals(user.getRole().name()) ||
                   "SUPER_HQ_ADMIN".equals(user.getRole().name());
            log.info("🔍 관리자 권한 확인 (fallback): userRole={}, isAdmin={}", 
                user.getRole().name(), isAdmin);
            return isAdmin;
        }
    }

    /**
     * 공통코드를 사용한 스케줄 상태 확인
     */
    private boolean isValidScheduleStatus(String status) {
        try {
            // 공통코드에서 스케줄 상태 조회
            List<CommonCode> statusCodes = commonCodeService.getCommonCodesByGroup("STATUS");
            
            return statusCodes.stream()
                .anyMatch(code -> code.getCodeValue().equals(status));
        } catch (Exception e) {
            log.error("❌ 스케줄 상태 확인 실패: error={}", e.getMessage(), e);
            // 기본값으로 하드코딩된 상태 확인 (fallback)
            return ScheduleStatus.AVAILABLE.name().equals(status) || 
                   ScheduleStatus.BOOKED.name().equals(status) || 
                   ScheduleStatus.VACATION.name().equals(status) || 
                   ScheduleStatus.COMPLETED.name().equals(status) || 
                   ScheduleStatus.CANCELLED.name().equals(status);
        }
    }

    /**
     * Schedule 엔티티를 ScheduleDto로 변환하는 헬퍼 메서드
     */
    private ScheduleDto convertToScheduleDto(Schedule schedule) {
        return ScheduleDto.builder()
            .id(schedule.getId())
            .consultantId(schedule.getConsultantId())
            .clientId(schedule.getClientId())
            .date(schedule.getDate())
            .startTime(schedule.getStartTime())
            .endTime(schedule.getEndTime())
            .status(schedule.getStatus() != null ? schedule.getStatus().name() : "UNKNOWN")
            .scheduleType(schedule.getScheduleType())
            .consultationType(schedule.getConsultationType())
            .title(schedule.getTitle())
            .description(schedule.getDescription())
            .notes(schedule.getNotes())
            .createdAt(schedule.getCreatedAt())
            .updatedAt(schedule.getUpdatedAt())
            .build();
    }
}
