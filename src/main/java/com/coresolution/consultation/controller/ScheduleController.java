package com.coresolution.consultation.controller;

// 표준화 2025-12-05: 브랜치/HQ 개념 제거, 역할 체크를 공통코드 기반 동적 조회로 통합 (TENANT_ROLE_SYSTEM_STANDARD.md 준수)

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.coresolution.consultation.constant.ProfessionalProviderTypeConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ConsultationRecordDraftResponse;
import com.coresolution.consultation.dto.ConsultationRecordDraftSaveRequest;
import com.coresolution.consultation.dto.ScheduleCreateRequest;
import com.coresolution.consultation.dto.ScheduleResponse;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultationRecordDraftService;
import com.coresolution.consultation.service.ConsultationRecordService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.util.PermissionCheckUtils;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
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
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
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
@RequestMapping("/api/v1/schedules")  // 표준화 2025-12-06: API 경로 표준화
@RequiredArgsConstructor
public class ScheduleController extends BaseApiController {

    private final ScheduleService scheduleService;
    private final AdminService adminService;
    private final ConsultationRecordService consultationRecordService;
    private final ConsultationRecordDraftService consultationRecordDraftService;
    private final CommonCodeService commonCodeService;
    private final RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;
    private final ConsultantAvailabilityService consultantAvailabilityService;
    private final DynamicPermissionService dynamicPermissionService;
    private final com.coresolution.consultation.repository.UserRepository userRepository;
    private final ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    private final ObjectMapper objectMapper;
    private final com.coresolution.consultation.service.ConsultantDashboardService consultantDashboardService;
    private final com.coresolution.consultation.repository.ClientScheduleNoteRepository clientScheduleNoteRepository;

    /**
     * 테넌트 컨텍스트가 비어 있을 때 세션 사용자의 tenantId로 보완 (상담사 대시보드 등).
     * 세션 User에 tenantId가 없으면 DB 조회로 보완한다.
     */
    private void ensureTenantContextFromSession(HttpSession session) {
        if (TenantContextHolder.getTenantId() != null && !TenantContextHolder.getTenantId().isEmpty()) {
            return;
        }
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser != null && currentUser.getTenantId() != null && !currentUser.getTenantId().isEmpty()) {
            TenantContextHolder.setTenantId(currentUser.getTenantId());
            log.info("📌 테넌트 컨텍스트 보완(세션 사용자): userId={}, tenantId={}", currentUser.getId(), currentUser.getTenantId());
            return;
        }
        // 세션 TENANT_ID 속성만 있고 User 객체에 tenantId가 없는 경우
        if (session != null && currentUser != null) {
            String tenantFromSession = SessionUtils.getTenantId(session);
            if (tenantFromSession != null && !tenantFromSession.isEmpty()) {
                TenantContextHolder.setTenantId(tenantFromSession);
                log.info("📌 테넌트 컨텍스트 보완(세션 속성): userId={}, tenantId={}", currentUser.getId(), tenantFromSession);
                return;
            }
        }
        // tenantId를 테넌트 스코프로 알 수 없음 — 전역 PK 조회 없이 생략
        if (currentUser != null && currentUser.getId() != null) {
            log.warn("⚠️ 테넌트 컨텍스트 보완 생략(세션/홀더에 tenantId 없음): userId={}", currentUser.getId());
        }
    }

    /**
     /**
     * 권한 기반 전체 스케줄 조회 (상담사 이름 포함)
     * 상담사: 자신의 일정만, 관리자: 모든 일정
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSchedulesByUserRole(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String userRole,
            HttpSession session) {
        
        ensureTenantContextFromSession(session);
        log.info("🔐 권한 기반 스케줄 조회 요청: 사용자 {}, 역할 {}, tenantId={}", userId, userRole, TenantContextHolder.getTenantId());

        String tenantIdVal = TenantContextHolder.getTenantId();
        if (tenantIdVal == null || tenantIdVal.isEmpty()) {
            log.warn("❌ 테넌트 정보 없음 - 스케줄 조회 거부 (400)");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("테넌트 정보가 없습니다. 로그아웃 후 다시 로그인해 주세요."));
        }
        
        if (userId == null || userRole == null) {
            log.error("❌ 필수 파라미터 누락: userId={}, userRole={}", userId, userRole);
            throw new IllegalArgumentException("필수 파라미터가 누락되었습니다.");
        }
        
        List<ScheduleResponse> schedules = scheduleService.findSchedulesWithNamesByUserRole(userId, userRole);
        log.info("✅ 스케줄 조회 완료: {}개", schedules.size());
        
        Map<String, Object> data = new HashMap<>();
        data.put("schedules", schedules);
        data.put("totalCount", schedules.size());
        
        return success("스케줄 조회 성공", data);
    }

    /**
     * 스케줄 단건 조회(권한·테넌트 검증, 목록 API와 동일한 userId/userRole 규칙).
     *
     * @param id 스케줄 PK
     * @param userId 요청 사용자 PK
     * @param userRole 요청 역할(예: CLIENT, CONSULTANT)
     * @param session HTTP 세션
     * @return 스케줄 상세 DTO
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ScheduleResponse>> getScheduleDetail(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam String userRole,
            HttpSession session) {

        ensureTenantContextFromSession(session);
        log.info("🔐 스케줄 단건 조회: id={}, userId={}, userRole={}, tenantId={}",
                id, userId, userRole, TenantContextHolder.getTenantId());

        String tenantIdVal = TenantContextHolder.getTenantId();
        if (tenantIdVal == null || tenantIdVal.isEmpty()) {
            log.warn("❌ 테넌트 정보 없음 - 스케줄 단건 조회 거부 (400)");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("테넌트 정보가 없습니다. 로그아웃 후 다시 로그인해 주세요."));
        }

        if (userId == null || userRole == null || userRole.isBlank()) {
            log.error("❌ 필수 파라미터 누락: userId={}, userRole={}", userId, userRole);
            throw new IllegalArgumentException("필수 파라미터가 누락되었습니다.");
        }

        Schedule schedule = scheduleService.findById(id);
        if (!scheduleService.canAccessScheduleDetail(userId, userRole, schedule)) {
            throw new org.springframework.security.access.AccessDeniedException("해당 스케줄을 조회할 권한이 없습니다.");
        }

        Map<Long, Integer> unresolvedByScheduleId =
                buildUnresolvedClientNoteCountByScheduleId(tenantIdVal, List.of(schedule));
        Map<Long, Integer> unresolvedByClientId =
                buildUnresolvedClientNoteCountByClientId(tenantIdVal, List.of(schedule));
        int unresolvedForSchedule = unresolvedByScheduleId.getOrDefault(schedule.getId(), 0);
        int unresolvedForClient = schedule.getClientId() != null
                ? unresolvedByClientId.getOrDefault(schedule.getClientId(), 0)
                : 0;
        ScheduleResponse dto = convertToScheduleResponse(schedule, unresolvedForSchedule, unresolvedForClient);
        return success("스케줄 조회 성공", dto);
    }

    /**
     /**
     * 권한 기반 페이지네이션 스케줄 조회 (상담사 이름 포함)
     * 상담사: 자신의 일정만, 관리자: 모든 일정
     */
    @GetMapping("/paged")
    public ResponseEntity<ApiResponse<Page<ScheduleResponse>>> getSchedulesByUserRolePaged(
            @RequestParam Long userId,
            @RequestParam String userRole,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateRange,
            @PageableDefault(size = 10, sort = "date") Pageable pageable) {
        
        log.info("🔐 권한 기반 페이지네이션 스케줄 조회 요청: 사용자 {}, 역할 {}, 페이지 {}", userId, userRole, pageable.getPageNumber());
        
        Page<ScheduleResponse> schedules = scheduleService.findSchedulesWithNamesByUserRolePaged(userId, userRole, pageable);
        log.info("✅ 페이지네이션 스케줄 조회 완료: {}개 (총 {}개)", schedules.getNumberOfElements(), schedules.getTotalElements());
        return success(schedules);
    }
    
    /**
     /**
     * 권한 기반 특정 날짜 스케줄 조회
     */
    @GetMapping("/date/{date}")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getSchedulesByUserRoleAndDate(
            @RequestParam Long userId,
            @RequestParam String userRole,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        log.info("🔐 권한 기반 특정 날짜 스케줄 조회: 사용자 {}, 역할 {}, 날짜 {}", userId, userRole, date);
        
        List<ScheduleResponse> schedules = scheduleService.findScheduleResponsesByUserRoleAndDate(userId, userRole, date);
        log.info("✅ 특정 날짜 스케줄 조회 완료: {}개", schedules.size());
        return success(schedules);
    }

    /**
     /**
     * 권한 기반 날짜 범위 스케줄 조회
     */
    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getSchedulesByUserRoleAndDateRange(
            @RequestParam Long userId,
            @RequestParam String userRole,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        log.info("🔐 권한 기반 날짜 범위 스케줄 조회: 사용자 {}, 역할 {}, 기간 {} ~ {}", userId, userRole, startDate, endDate);
        
        List<ScheduleResponse> schedules = scheduleService.findScheduleResponsesByUserRoleAndDateBetween(
            userId, userRole, startDate, endDate);
        log.info("✅ 날짜 범위 스케줄 조회 완료: {}개", schedules.size());
        return success(schedules);
    }

    /**
     /**
     * 특정 상담사의 특정 날짜 스케줄 조회
     * GET /api/schedules/consultant/{consultantId}/date?date=2025-09-02
     */
    @GetMapping("/consultant/{consultantId}/date")
    public ResponseEntity<ApiResponse<List<Schedule>>> getConsultantSchedulesByDate(
            @PathVariable Long consultantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String userRole) {
        
        log.info("📅 상담사별 특정 날짜 스케줄 조회: 상담사 {}, 날짜 {}, 요청자 역할 {}", consultantId, date, userRole);
        
        if (userRole != null) {
            UserRole role = UserRole.fromString(userRole);
            if (!roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(role)) {
                log.warn("❌ 관리자 권한 없음: {}", userRole);
                throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
            }
        }
        
        List<Schedule> schedules = scheduleService.findByConsultantIdAndDate(consultantId, date);
        log.info("✅ 상담사별 스케줄 조회 완료: {}개", schedules.size());
        return success(schedules);
    }

    /**
     /**
     * 상담사 자신의 전체 스케줄 조회 (상담사 전용)
     * GET /api/schedules/consultant/{consultantId}/my-schedules
     */
    @GetMapping("/consultant/{consultantId}/my-schedules")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getMySchedules(
            @PathVariable Long consultantId,
            @RequestParam(required = false) String userRole) {
        
        log.info("📅 상담사 자신의 스케줄 조회: 상담사 {}, 요청자 역할 {}", consultantId, userRole);
        
        if (userRole != null) {
            UserRole role = UserRole.fromString(userRole);
            if (!roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(role)) {
                log.warn("❌ 관리자 권한 없음: {}", userRole);
                throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
            }
        }
        
        List<Schedule> schedules = scheduleService.findByConsultantId(consultantId);
        
        List<ScheduleResponse> responseDtos = schedules.stream()
                .map(schedule -> {
                    String koreanConsultationType = commonCodeService.getCodeName("CONSULTATION_TYPE", schedule.getConsultationType());
                    return ScheduleResponse.from(schedule, koreanConsultationType);
                })
                .collect(java.util.stream.Collectors.toList());
        
        log.info("✅ 상담사 스케줄 조회 완료: {}개", responseDtos.size());
        return success(responseDtos);
    }

    /**
     /**
     * 현재 사용자 권한 확인 (디버깅용)
     * GET /api/schedules/debug/user-role
     */
    @GetMapping("/debug/user-role")
    public ResponseEntity<ApiResponse<Map<String, Object>>> debugUserRole(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        Map<String, Object> debugInfo = new HashMap<>();
        debugInfo.put("userId", currentUser.getId());
        debugInfo.put("userId", currentUser.getUserId());
        debugInfo.put("email", currentUser.getEmail());
        debugInfo.put("role", currentUser.getRole());
        debugInfo.put("roleName", currentUser.getRole().name());
        debugInfo.put("roleDisplayName", currentUser.getRole().getDisplayName());
        debugInfo.put("isAdmin", currentUser.getRole().isAdmin());
        debugInfo.put("isBranchManager",
            roleCommonCodeAuthorizationService.isStaffRoleFromCommonCode(currentUser.getRole()));
        debugInfo.put("isHeadquartersAdmin",
            roleCommonCodeAuthorizationService.isAdminRoleFromCommonCode(currentUser.getRole()));
        debugInfo.put("isBranchSuperAdmin",
            roleCommonCodeAuthorizationService.isAdminRoleFromCommonCode(currentUser.getRole()));
        // 표준화 2025-12-06: branchCode는 더 이상 사용하지 않음
        debugInfo.put("tenantId", com.coresolution.core.context.TenantContextHolder.getTenantId());
        
        return success(debugInfo);
    }

    /**
     /**
     * 상담사별 스케줄 조회
     * GET /api/schedules/consultant/{consultantId}
     */
    @GetMapping("/consultant/{consultantId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConsultantSchedules(
            @PathVariable Long consultantId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpSession session) {
        
        log.info("📅 상담사별 스케줄 조회: consultantId={}, startDate={}, endDate={}", consultantId, startDate, endDate);
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        if (!roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(currentUser.getRole())
                && !currentUser.getId().equals(consultantId)) {
            throw new org.springframework.security.access.AccessDeniedException("다른 상담사의 스케줄을 조회할 권한이 없습니다.");
        }
        
        List<ScheduleResponse> schedules;
        if (startDate != null && endDate != null) {
            List<Schedule> scheduleList = scheduleService.findSchedulesByUserRoleAndDateBetween(consultantId, UserRole.CONSULTANT.name(), startDate, endDate);
            schedules = scheduleList.stream()
                .map(schedule -> convertToScheduleResponse(schedule, 0, 0))
                .collect(java.util.stream.Collectors.toList());
        } else {
            schedules = scheduleService.findSchedulesWithNamesByUserRole(consultantId, UserRole.CONSULTANT.name());
        }
        
        Map<String, Object> data = new HashMap<>();
        data.put("schedules", schedules);
        data.put("totalCount", schedules.size());
        
        return success("스케줄 조회 성공", data);
    }
    
    /**
     /**
     * 상담사 스케줄 생성
     * POST /api/schedules/consultant
     */
    @PostMapping("/consultant")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createConsultantSchedule(
            @RequestBody ScheduleCreateRequest request, HttpSession session) {
        
        boolean tentativeBeforeDeposit = Boolean.TRUE.equals(request.getTentativeBeforeDeposit());
        log.info("📅 상담사 스케줄 생성 요청: 상담사 {}, 내담자 {}, 날짜 {}, 시간 {} - {}, 상담유형 {}, 가예약={}",
                request.getConsultantId(), request.getClientId(),
                request.getDate(), request.getStartTime(), request.getEndTime(),
                request.getConsultationType(), tentativeBeforeDeposit);
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        Long requestConsultantId = request.getConsultantId();
        if (!canRegisterOrModifyOthersSchedule(currentUser.getRole()) && !currentUser.getId().equals(requestConsultantId)) {
            log.warn("❌ 스케줄 등록 권한 없음 (본인 아님): currentUser={}, targetConsultant={}", currentUser.getId(), requestConsultantId);
            throw new org.springframework.security.access.AccessDeniedException("본인의 스케줄만 등록할 수 있습니다.");
        }
        
        UserRole userRole = currentUser.getRole();
        boolean hasPermission = dynamicPermissionService.canRegisterScheduler(userRole);
        // 가예약(tentativeBeforeDeposit)은 ADMIN/STAFF만 — canRegisterScheduler와 동일(상담사·내담자 거절).
        if (tentativeBeforeDeposit && !hasPermission) {
            log.warn("❌ 가예약 등록 권한 없음: role={}", userRole);
            throw new org.springframework.security.access.AccessDeniedException("가예약 일정은 관리자·사무원만 등록할 수 있습니다.");
        }
        if (!hasPermission) {
            log.warn("❌ 스케줄 등록 권한 없음: role={}, roleName={}", userRole, userRole.name());
            throw new org.springframework.security.access.AccessDeniedException("스케줄 등록 권한이 없습니다.");
        }
        
        LocalDate date = LocalDate.parse(request.getDate());
        if (date.isBefore(LocalDate.now())) {
            log.warn("❌ 과거 날짜 예약 생성 거부: date={}", date);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("과거 날짜에는 예약할 수 없습니다."));
        }
        
        LocalTime startTime = LocalTime.parse(request.getStartTime());
        LocalTime endTime = LocalTime.parse(request.getEndTime());
        
        boolean isOnVacation = consultantAvailabilityService.isConsultantOnVacation(
            request.getConsultantId(), 
            date, 
            startTime, 
            endTime
        );
        
        if (isOnVacation) {
            log.warn("🚫 휴무 상태에서 스케줄 등록 시도: 상담사 {}, 날짜 {}, 시간 {} - {}", 
                request.getConsultantId(), date, startTime, endTime);
            
            String vacationMessage = getVacationConflictMessage();
            throw new IllegalArgumentException(vacationMessage);
        }
        
        // 표준화 2025-12-06: branchCode는 더 이상 사용하지 않음
        String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
        log.info("🔧 스케줄 생성: tenantId={}", tenantId);
        
        Schedule schedule = scheduleService.createConsultantSchedule(
            request.getConsultantId(),
            request.getClientId(),
            date,
            startTime,
            endTime,
            request.getTitle(),
            request.getDescription(),
            request.getConsultationType(),
            null, // 표준화 2025-12-06: branchCode는 더 이상 사용하지 않음
            tentativeBeforeDeposit
        );
        
        Map<String, Object> data = Map.of("scheduleId", schedule.getId());
        
        log.info("✅ 스케줄 생성 완료: ID {}", schedule.getId());
        return created("스케줄이 성공적으로 생성되었습니다.", data);
    }

    /**
     /**
     * 스케줄 수정
     * PUT /api/schedules/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateSchedule(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updateData,
            HttpSession session) {
        
        log.info("📝 스케줄 수정 요청: ID {}, 데이터 {}", id, updateData);

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }

        Schedule existingSchedule = scheduleService.findById(id);

        if (!canRegisterOrModifyOthersSchedule(currentUser.getRole())
            && !currentUser.getId().equals(existingSchedule.getConsultantId())) {
            throw new org.springframework.security.access.AccessDeniedException("본인의 스케줄만 수정할 수 있습니다.");
        }

        boolean skipScheduleModifyPermission =
            isOwnProfessionalScheduleStatusOnlyUpdate(currentUser, existingSchedule, updateData);
        if (!skipScheduleModifyPermission) {
            ResponseEntity<?> permissionResponse =
                PermissionCheckUtils.checkPermission(session, "SCHEDULE_MODIFY", dynamicPermissionService);
            if (permissionResponse != null) {
                log.warn("❌ 권한 체크 실패: {}", permissionResponse.getBody());
                throw new org.springframework.security.access.AccessDeniedException("스케줄 수정 권한이 없습니다.");
            }
        } else {
            log.info("✅ 본인 일정 상태만 변경 — SCHEDULE_MODIFY 생략: scheduleId={}, userId={}", id, currentUser.getId());
        }
        
        if (updateData.containsKey("status")) {
            String newStatus = (String) updateData.get("status");
            try {
                ScheduleStatus statusEnum = ScheduleStatus.valueOf(newStatus);
                existingSchedule.setStatus(statusEnum);
                existingSchedule.setUpdatedAt(java.time.LocalDateTime.now());
                log.info("📝 스케줄 상태 변경: {} -> {}", existingSchedule.getStatus(), statusEnum);
            } catch (IllegalArgumentException e) {
                log.warn("⚠️ 유효하지 않은 스케줄 상태: {}", newStatus);
                throw new IllegalArgumentException("유효하지 않은 스케줄 상태입니다: " + newStatus);
            }
        }
        
        if (updateData.containsKey("consultationType")) {
            existingSchedule.setConsultationType((String) updateData.get("consultationType"));
        }
        
        if (updateData.containsKey("date")) {
            String dateStr = (String) updateData.get("date");
            try {
                java.time.LocalDate newDate = java.time.LocalDate.parse(dateStr);
                if (newDate.isBefore(java.time.LocalDate.now())) {
                    log.warn("❌ 과거 날짜로 스케줄 수정 거부: newDate={}", newDate);
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("과거 날짜에는 예약할 수 없습니다."));
                }
                existingSchedule.setDate(newDate);
                log.info("📝 스케줄 날짜 변경: {}", dateStr);
            } catch (Exception e) {
                log.warn("⚠️ 유효하지 않은 날짜 형식: {}", dateStr);
                throw new IllegalArgumentException("유효하지 않은 날짜 형식입니다: " + dateStr);
            }
        }
        
        if (updateData.containsKey("startTime")) {
            String startTimeStr = (String) updateData.get("startTime");
            try {
                existingSchedule.setStartTime(java.time.LocalTime.parse(startTimeStr));
                log.info("📝 스케줄 시작 시간 변경: {}", startTimeStr);
            } catch (Exception e) {
                log.warn("⚠️ 유효하지 않은 시작 시간 형식: {}", startTimeStr);
                throw new IllegalArgumentException("유효하지 않은 시작 시간 형식입니다: " + startTimeStr);
            }
        }
        
        if (updateData.containsKey("endTime")) {
            String endTimeStr = (String) updateData.get("endTime");
            try {
                existingSchedule.setEndTime(java.time.LocalTime.parse(endTimeStr));
                log.info("📝 스케줄 종료 시간 변경: {}", endTimeStr);
            } catch (Exception e) {
                log.warn("⚠️ 유효하지 않은 종료 시간 형식: {}", endTimeStr);
                throw new IllegalArgumentException("유효하지 않은 종료 시간 형식입니다: " + endTimeStr);
            }
        }
        
        if (updateData.containsKey("title")) {
            existingSchedule.setTitle((String) updateData.get("title"));
        }
        if (updateData.containsKey("description")) {
            existingSchedule.setDescription((String) updateData.get("description"));
        }
        
        existingSchedule.setUpdatedAt(java.time.LocalDateTime.now());
        
        try {
            Schedule updatedSchedule = scheduleService.updateSchedule(id, existingSchedule);
            Map<String, Object> data = Map.of("scheduleId", updatedSchedule.getId());
            log.info("✅ 스케줄 수정 완료: ID {}", updatedSchedule.getId());
            return updated("스케줄이 성공적으로 수정되었습니다.", data);
        } catch (IllegalStateException e) {
            log.warn("⚠️ 스케줄 완료 처리 거부 (상담일지 미작성): id={}, message={}", id, e.getMessage());
            return ResponseEntity.badRequest()
                .body(com.coresolution.core.dto.ApiResponse.<Map<String, Object>>error(e.getMessage()));
        }
    }

    /**
     /**
     * 관리자용 전체 스케줄 통계 조회
     */
    @GetMapping("/admin/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getScheduleStatisticsForAdmin(
            @RequestParam String userRole,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateRange,
            @RequestParam(required = false) String chartType,
            HttpSession session) {
        
        log.info("📊 관리자용 스케줄 통계 조회 요청: 역할 {}, 시작일: {}, 종료일: {}, 상태: {}, 날짜범위: {}, 차트타입: {}", 
                userRole, startDate, endDate, status, dateRange, chartType);
        
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkStatisticsPermission(session, dynamicPermissionService);
        if (permissionResponse != null) {
            throw new org.springframework.security.access.AccessDeniedException("통계 조회 권한이 없습니다.");
        }
        
        Map<String, Object> statistics = scheduleService.getScheduleStatisticsForAdmin(startDate, endDate);
        log.info("✅ 관리자용 스케줄 통계 조회 완료");
        return success(statistics);
    }

    /**
     /**
     * 오늘의 스케줄 통계 조회
     */
    @GetMapping("/today/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTodayScheduleStatistics(
            @RequestParam String userRole,
            @RequestParam(required = false) String tenantId,
            HttpSession session) {
        
        ensureTenantContextFromSession(session);
        log.info("📊 오늘의 스케줄 통계 조회 요청: 역할 {}, 테넌트 ID(파라미터): {}, tenantContext={}", userRole, tenantId, TenantContextHolder.getTenantId());
        
        Map<String, Object> statistics;
        boolean isConsultantSelf = userRole != null && UserRole.fromString(userRole).isProfessionalProvider();

        if (isConsultantSelf) {
            // 상담사 본인 대시보드: 로그인만 확인, STATISTICS_VIEW 불필요
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
            }
            // 테넌트가 비어 있으면 세션 사용자로 보완 (getTodayScheduleStatisticsByConsultant가 tenantId 사용)
            if (TenantContextHolder.getTenantId() == null || TenantContextHolder.getTenantId().isEmpty()) {
                if (currentUser.getTenantId() != null && !currentUser.getTenantId().isEmpty()) {
                    TenantContextHolder.setTenantId(currentUser.getTenantId());
                    log.info("📌 오늘 통계 테넌트 보완(세션): consultantId={}, tenantId={}", currentUser.getId(), currentUser.getTenantId());
                }
            }
            if (TenantContextHolder.getTenantId() == null || TenantContextHolder.getTenantId().isEmpty()) {
                log.warn("❌ 테넌트 정보 없음 - 오늘 통계 조회 거부 (400)");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("테넌트 정보가 없습니다. 로그아웃 후 다시 로그인해 주세요."));
            }
            statistics = scheduleService.getTodayScheduleStatisticsByConsultant(currentUser.getId());
            
            // 주간 상담 추이 데이터 추가 (최근 7주, 요일별로 보여주기 위해 7개 데이터)
            try {
                List<Map<String, Object>> weeklyData = scheduleService.getConsultantWeeklyTrend(currentUser.getId(), 7);
                statistics.put("weeklyStats", weeklyData);
            } catch (Exception e) {
                log.warn("상담사 주간 통계 조회 실패: {}", e.getMessage());
                statistics.put("weeklyStats", new ArrayList<>());
            }
            
            log.info("✅ 상담사 오늘의 스케줄 통계 조회 완료 - 상담사 ID: {}", currentUser.getId());
        } else {
            ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkStatisticsPermission(session, dynamicPermissionService);
            if (permissionResponse != null) {
                throw new org.springframework.security.access.AccessDeniedException("통계 조회 권한이 없습니다.");
            }
            if (tenantId != null && !tenantId.isEmpty()) {
                statistics = scheduleService.getTodayScheduleStatisticsByTenant(tenantId);
                log.info("✅ 테넌트별 오늘의 스케줄 통계 조회 완료 - 테넌트 ID: {}", tenantId);
            } else {
                String contextTenantId = TenantContextHolder.getTenantId();
                if (contextTenantId == null || contextTenantId.isEmpty()) {
                    log.warn("❌ 테넌트 정보 없음 - 오늘 통계 조회 거부 (400)");
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("테넌트 정보가 없습니다. 로그아웃 후 다시 로그인해 주세요."));
                }
                statistics = scheduleService.getTodayScheduleStatistics();
                log.info("✅ 전체 오늘의 스케줄 통계 조회 완료");
            }
            // 총 사용자 증감(KPI 배지용): 전주/전월 스냅샷 없으면 0. 추후 실데이터 반영 시 계산 로직 추가
            if (!statistics.containsKey("totalUsersGrowthRate")) {
                try {
                    statistics.put("totalUsersGrowthRate", 0.0);
                } catch (Exception e) {
                    log.warn("총 사용자 증감 계산 스킵: {}", e.getMessage());
                }
            }
        }
        
        return success(statistics);
    }



     /**
     * 내담자별 스케줄 조회 (관리자만 접근 가능)
     */
    @GetMapping("/client/{clientId}")
    public ResponseEntity<ApiResponse<List<Schedule>>> getSchedulesByClient(
            @PathVariable Long clientId,
            @RequestParam String userRole) {
        
        log.info("👤 내담자별 스케줄 조회: 내담자 {}, 요청자 역할 {}", clientId, userRole);
        
        UserRole role = UserRole.fromString(userRole);
        if (role == null
                || !roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(role)) {
            log.warn("❌ 관리자 권한 없음: {}", userRole);
            throw new org.springframework.security.access.AccessDeniedException("권한이 없습니다.");
        }
        
        List<Schedule> schedules = scheduleService.findByClientId(clientId);
        log.info("✅ 내담자별 스케줄 조회 완료: {}개", schedules.size());
        return success(schedules);
    }

    /**
     /**
     * 예약 확정 (관리자 전용)
     * 내담자 입금 확인 후 관리자가 예약을 확정합니다.
     */
    @PutMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmSchedule(
            @PathVariable Long id,
            @RequestBody Map<String, Object> confirmData,
            @RequestParam String userRole) {
        
        log.info("✅ 예약 확정 요청: ID {}, 관리자 역할 {}", id, userRole);
        
        UserRole role = UserRole.fromString(userRole);
        if (role == null || !role.isAdmin()) {
            log.warn("❌ 관리자 권한 없음: {}", userRole);
            throw new org.springframework.security.access.AccessDeniedException("관리자 권한이 필요합니다.");
        }
        
        String adminNote = (String) confirmData.getOrDefault("adminNote", "입금 확인 완료");
        
        Schedule confirmedSchedule = scheduleService.confirmSchedule(id, adminNote);
        
        Map<String, Object> data = Map.of(
            "scheduleId", confirmedSchedule.getId(),
            "status", confirmedSchedule.getStatus()
        );
        
        log.info("✅ 예약 확정 완료: ID {}, 상태 {}", confirmedSchedule.getId(), confirmedSchedule.getStatus());
        return updated("예약이 성공적으로 확정되었습니다.", data);
    }


     /**
     * 시간이 지난 확정된 스케줄을 자동으로 완료 처리
     * 관리자만 호출 가능
     */
    @PostMapping("/auto-complete")
    public ResponseEntity<ApiResponse<Void>> autoCompleteExpiredSchedules(
            @RequestParam String userRole) {
        log.info("🔄 자동 완료 처리 요청: 사용자 역할 {}", userRole);
        
        UserRole role = UserRole.fromString(userRole);
        if (role == null || !role.isAdmin()) {
            log.warn("❌ 관리자 권한 없음: {}", userRole);
            throw new org.springframework.security.access.AccessDeniedException("관리자 권한이 필요합니다.");
        }
        
        scheduleService.autoCompleteExpiredSchedules();
        
        log.info("✅ 자동 완료 처리 완료");
        return success("시간이 지난 스케줄이 자동으로 완료 처리되었습니다.", null);
    }

    /**
     /**
     * 스케줄 상태를 한글로 변환
     */
    @GetMapping("/status-korean")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatusInKorean(
            @RequestParam String status) {
        String koreanStatus = scheduleService.getStatusInKorean(status);
        
        Map<String, Object> data = Map.of(
            "originalStatus", status,
            "koreanStatus", koreanStatus
        );
        
        return success(data);
    }

    /**
     /**
     * 스케줄 타입을 한글로 변환
     */
    @GetMapping("/type-korean")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getScheduleTypeInKorean(
            @RequestParam String scheduleType) {
        String koreanType = scheduleService.getScheduleTypeInKorean(scheduleType);
        
        Map<String, Object> data = Map.of(
            "originalType", scheduleType,
            "koreanType", koreanType
        );
        
        return success(data);
    }

    /**
     /**
     * 상담 유형을 한글로 변환
     */
    @GetMapping("/consultation-type-korean")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConsultationTypeInKorean(
            @RequestParam String consultationType) {
        String koreanType = scheduleService.getConsultationTypeInKorean(consultationType);
        
        Map<String, Object> data = Map.of(
            "originalType", consultationType,
            "koreanType", koreanType
        );
        
        return success(data);
    }
    
    /**
     /**
     * 내담자-상담사 매칭 확인
     */
    @PostMapping("/client/mapping/check")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkClientMapping(@RequestBody Map<String, Object> request) {
        log.info("매칭 확인 요청 받음: request={}", request);
        
        Long clientId = Long.valueOf(request.get("clientId").toString());
        Long consultantId = Long.valueOf(request.get("consultantId").toString());
        
        log.info("매칭 확인 요청 파싱 완료: clientId={}, consultantId={}", clientId, consultantId);
        
        Map<String, Object> mappingData = new HashMap<>();
        
        try {
            List<ConsultantClientMapping> mappings = adminService.getMappingsByClient(clientId);
            
            Optional<ConsultantClientMapping> activeMapping = mappings.stream()
                .filter(mapping -> mapping.getConsultant() != null && 
                        mapping.getConsultant().getId().equals(consultantId) &&
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
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
            
            log.info("매칭 확인 완료: clientId={}, consultantId={}, hasMapping={}", 
                clientId, consultantId, mappingData.get("hasMapping"));
            
        } catch (Exception e) {
            log.error("매칭 확인 중 오류: clientId={}, consultantId={}, error={}", 
                clientId, consultantId, e.getMessage());
            
            mappingData.put("hasMapping", false);
            mappingData.put("remainingSessions", 0);
            mappingData.put("packageName", null);
            mappingData.put("mappingStatus", "ERROR");
            mappingData.put("lastSessionDate", null);
            mappingData.put("totalSessions", 0);
            mappingData.put("usedSessions", 0);
            mappingData.put("paymentStatus", "ERROR");
        }
        
        return success("매칭 정보를 성공적으로 확인했습니다.", mappingData);
    }
    
    
    /**
     * 상담일지 목록 조회 (모바일·웹 공통). {@code records}는 표시용 필드({@code clientName} 등)가 채워진 맵 리스트이다.
     * GET /api/v1/schedules/consultation-records?consultantId=&amp;consultationId=&amp;page=&amp;size=
     *
     * @param consultantId 상담사 ID (지정 시 Spring {@link Pageable}로 전체 목록 페이지 조회)
     * @param consultationId 상담(스케줄) ID 또는 {@code schedule-} 접두 — 지정 시 해당 상담의 일지만 비페이지 목록
     * @param pageable 상담사별 목록 시 페이지·크기
     * @return records, totalCount, totalPages, number, last, size
     */
    @GetMapping("/consultation-records")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConsultationRecords(
            @RequestParam(required = false) Long consultantId,
            @RequestParam(required = false) String consultationId,
            @PageableDefault(size = 20) Pageable pageable) {

        log.info("📝 상담일지 목록 조회 - 상담사 ID: {}, 상담 ID: {}, page={}, size={}",
            consultantId, consultationId, pageable.getPageNumber(), pageable.getPageSize());

        List<ConsultationRecord> recordList;
        long totalCount;
        int totalPages;
        int number;
        boolean last;
        int size;

        if (consultationId != null) {
            Long consultationIdLong;
            if (consultationId.startsWith("schedule-")) {
                consultationIdLong = Long.valueOf(consultationId.replace("schedule-", ""));
            } else {
                consultationIdLong = Long.valueOf(consultationId);
            }
            recordList = consultationRecordService.getConsultationRecordsByConsultationId(consultationIdLong);
            totalCount = recordList.size();
            totalPages = 1;
            number = 0;
            last = true;
            size = recordList.size();
        } else if (consultantId != null) {
            Page<ConsultationRecord> page =
                consultationRecordService.getConsultationRecordsByConsultantId(consultantId, pageable);
            recordList = page.getContent();
            totalCount = page.getTotalElements();
            totalPages = page.getTotalPages();
            number = page.getNumber();
            last = page.isLast();
            size = page.getSize();
        } else {
            recordList = new ArrayList<>();
            totalCount = 0L;
            totalPages = 0;
            number = 0;
            last = true;
            size = pageable.getPageSize();
        }

        String tenantId = resolveTenantIdForConsultationRecordList(recordList);
        Map<Long, String> displayNameByUserId = buildScheduleListDisplayNameIndex(tenantId, recordList);
        List<Map<String, Object>> records = convertConsultationRecordsToDisplayMaps(recordList, displayNameByUserId);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("records", records);
        data.put("totalCount", totalCount);
        data.put("totalPages", totalPages);
        data.put("number", number);
        data.put("last", last);
        data.put("size", size);

        return success(data);
    }
    
    /**
     /**
     * 상담일지 작성
     * POST /api/schedules/consultation-records
     */
    @PostMapping("/consultation-records")
    public ResponseEntity<ApiResponse<com.coresolution.consultation.entity.ConsultationRecord>> createConsultationRecord(
            @RequestBody Map<String, Object> recordData,
            HttpSession session) {
        
        log.info("📝 상담일지 작성 - 데이터: {}", recordData);
        
        com.coresolution.consultation.entity.ConsultationRecord savedRecord = 
            consultationRecordService.createConsultationRecord(recordData);
        
        return created("상담일지가 성공적으로 작성되었습니다.", savedRecord);
    }
    
    /**
     /**
     * 상담일지 수정
     * PUT /api/schedules/consultation-records/{recordId}
     */
    @PutMapping("/consultation-records/{recordId}")
    public ResponseEntity<ApiResponse<com.coresolution.consultation.entity.ConsultationRecord>> updateConsultationRecord(
            @PathVariable Long recordId,
            @RequestBody Map<String, Object> recordData) {
        
        log.info("📝 상담일지 수정 - 기록 ID: {}, 데이터: {}", recordId, recordData);
        
        com.coresolution.consultation.entity.ConsultationRecord updatedRecord = 
            consultationRecordService.updateConsultationRecord(recordId, recordData);
        
        return updated("상담일지가 성공적으로 수정되었습니다.", updatedRecord);
    }

    /**
     * 상담일지 서버 초안 조회 (자동저장용, 확정 consultation_records 와 분리).
     * GET /api/v1/schedules/consultation-records/draft?consultationId=schedule-30&amp;consultantId=41
     *
     * @param consultationId 상담(스케줄) ID 또는 schedule- 접두 형식
     * @param consultantId 상담사 ID
     * @param session HTTP 세션
     * @param request HTTP 요청 (X-Tenant-Id 보완용)
     * @return 초안 또는 hasDraft=false
     */
    @GetMapping("/consultation-records/draft")
    public ResponseEntity<ApiResponse<ConsultationRecordDraftResponse>> getConsultationRecordDraft(
            @RequestParam String consultationId,
            @RequestParam Long consultantId,
            HttpSession session,
            HttpServletRequest request) {

        ensureTenantContextFromSession(session);
        supplementTenantIdFromHeader(request);
        String tenantIdVal = TenantContextHolder.getTenantId();
        if (tenantIdVal == null || tenantIdVal.isEmpty()) {
            log.warn("테넌트 정보 없음 - 상담일지 초안 조회 거부");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("테넌트 정보가 없습니다. 로그아웃 후 다시 로그인해 주세요."));
        }
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        assertConsultationDraftAccess(currentUser, consultantId);
        Long consultationIdLong = parseScheduleConsultationId(consultationId);
        ConsultationRecordDraftResponse body = consultationRecordDraftService
                .getDraft(tenantIdVal, consultationIdLong, consultantId)
                .orElse(ConsultationRecordDraftResponse.empty(consultationIdLong, consultantId));
        return success(body);
    }

    /**
     * 상담일지 서버 초안 저장(upsert).
     * PUT /api/v1/schedules/consultation-records/draft?consultationId=schedule-30&amp;consultantId=41
     *
     * @param consultationId 상담(스케줄) ID 또는 schedule- 접두 형식
     * @param consultantId 상담사 ID
     * @param body 저장 본문
     * @param session HTTP 세션
     * @param request HTTP 요청
     * @return 저장된 초안
     */
    @PutMapping("/consultation-records/draft")
    public ResponseEntity<ApiResponse<ConsultationRecordDraftResponse>> putConsultationRecordDraft(
            @RequestParam String consultationId,
            @RequestParam Long consultantId,
            @RequestBody ConsultationRecordDraftSaveRequest body,
            HttpSession session,
            HttpServletRequest request) {

        ensureTenantContextFromSession(session);
        supplementTenantIdFromHeader(request);
        String tenantIdVal = TenantContextHolder.getTenantId();
        if (tenantIdVal == null || tenantIdVal.isEmpty()) {
            log.warn("테넌트 정보 없음 - 상담일지 초안 저장 거부");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("테넌트 정보가 없습니다. 로그아웃 후 다시 로그인해 주세요."));
        }
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        assertConsultationDraftAccess(currentUser, consultantId);
        Long consultationIdLong = parseScheduleConsultationId(consultationId);
        ConsultationRecordDraftResponse saved = consultationRecordDraftService.upsertDraft(
                tenantIdVal,
                consultationIdLong,
                consultantId,
                body != null ? body.getPayloadJson() : null,
                body != null ? body.getExpectedVersion() : null);
        return updated("상담일지 초안이 저장되었습니다.", saved);
    }

    private void supplementTenantIdFromHeader(HttpServletRequest request) {
        if (TenantContextHolder.getTenantId() != null && !TenantContextHolder.getTenantId().isEmpty()) {
            return;
        }
        if (request == null) {
            return;
        }
        String headerTenant = request.getHeader("X-Tenant-Id");
        if (headerTenant != null && !headerTenant.isEmpty()) {
            TenantContextHolder.setTenantId(headerTenant);
        }
    }

    private void assertConsultationDraftAccess(User currentUser, Long consultantId) {
        if (!canRegisterOrModifyOthersSchedule(currentUser.getRole())
                && !currentUser.getId().equals(consultantId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "다른 상담사의 상담일지 초안에 접근할 권한이 없습니다.");
        }
    }

    private Long parseScheduleConsultationId(String consultationId) {
        if (consultationId == null || consultationId.isBlank()) {
            throw new ValidationException("consultationId", consultationId, "consultationId는 필수입니다.");
        }
        String trimmed = consultationId.trim();
        try {
            if (trimmed.startsWith("schedule-")) {
                return Long.valueOf(trimmed.replace("schedule-", ""));
            }
            return Long.valueOf(trimmed);
        } catch (NumberFormatException ex) {
            throw new ValidationException("consultationId", trimmed, "consultationId 형식이 올바르지 않습니다.");
        }
    }

    /**
     /**
     * 휴가 충돌 메시지 조회 (데이터베이스 코드 사용)
     */
    private String getVacationConflictMessage() {
        try {
            String message = commonCodeService.getCodeName("VACATION_MESSAGE", "CONFLICT");
            if (!message.equals("CONFLICT")) {
                return message; // 데이터베이스에서 찾은 메시지 반환
            }
        } catch (Exception e) {
            log.warn("휴가 충돌 메시지 조회 실패: {} -> 기본값 사용", e.getMessage());
        }
        
        return "해당 시간대에 상담사가 휴무 상태입니다. 다른 시간을 선택해주세요.";
    }
    
    /**
     /**
     * 상담사 스케줄 수정
     * PUT /api/schedules/consultant/{consultantId}/{scheduleId}
     */
    @PutMapping("/consultant/{consultantId}/{scheduleId}")
    public ResponseEntity<ApiResponse<Schedule>> updateConsultantSchedule(
            @PathVariable Long consultantId,
            @PathVariable Long scheduleId,
            @RequestBody Map<String, Object> updateData,
            HttpSession session) {
        
        log.info("📝 상담사 스케줄 수정: consultantId={}, scheduleId={}", consultantId, scheduleId);
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        if (!canRegisterOrModifyOthersSchedule(currentUser.getRole()) && !currentUser.getId().equals(consultantId)) {
            throw new org.springframework.security.access.AccessDeniedException("다른 상담사의 스케줄을 수정할 권한이 없습니다.");
        }
        
        Schedule updatedSchedule = scheduleService.updateSchedule(scheduleId, 
            convertMapToSchedule(updateData));
        
        return updated("스케줄이 성공적으로 수정되었습니다.", updatedSchedule);
    }
    
     /**
     * 상담사 스케줄 삭제
     * DELETE /api/schedules/consultant/{consultantId}/{scheduleId}
     */
    @DeleteMapping("/consultant/{consultantId}/{scheduleId}")
    public ResponseEntity<ApiResponse<Void>> deleteConsultantSchedule(
            @PathVariable Long consultantId,
            @PathVariable Long scheduleId,
            HttpSession session) {
        
        log.info("🗑️ 상담사 스케줄 삭제: consultantId={}, scheduleId={}", consultantId, scheduleId);
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        if (!canRegisterOrModifyOthersSchedule(currentUser.getRole()) && !currentUser.getId().equals(consultantId)) {
            throw new org.springframework.security.access.AccessDeniedException("다른 상담사의 스케줄을 삭제할 권한이 없습니다.");
        }
        
        scheduleService.deleteSchedule(scheduleId);
        
        return deleted("스케줄이 성공적으로 삭제되었습니다.");
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
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSchedulesForAdmin(
            @RequestParam(required = false) Long consultantId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpSession session) {
        ensureTenantContextFromSession(session);
        log.info("📅 관리자 스케줄 조회 요청 시작: consultantId={}, status={}, startDate={}, endDate={}, tenantId={}", 
                consultantId, status, startDate, endDate, TenantContextHolder.getTenantId());
        
        User currentUser = SessionUtils.getCurrentUser(session);
        log.info("🔍 현재 사용자 확인: userId={}, role={}, userId={}", 
                currentUser != null ? currentUser.getId() : "null",
                currentUser != null ? currentUser.getRole() : "null",
                currentUser != null ? currentUser.getUserId() : "null");
        
        if (currentUser == null) {
            log.error("❌ 세션에서 사용자 정보를 찾을 수 없습니다.");
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        boolean isAdmin = isAdminUser(currentUser);
        log.info("🔍 관리자 권한 확인 결과: userId={}, role={}, isAdmin={}", 
                currentUser.getId(), currentUser.getRole(), isAdmin);
        
        if (!isAdmin) {
            log.error("❌ 관리자 권한 없음: userId={}, role={}", currentUser.getId(), currentUser.getRole());
            throw new org.springframework.security.access.AccessDeniedException("관리자 권한이 필요합니다.");
        }
        
        log.info("✅ 관리자 권한 확인 완료, 스케줄 조회 진행");
        
        List<Schedule> schedules;
        
        if (consultantId != null) {
            schedules = scheduleService.findByConsultantId(consultantId);
        } else {
            schedules = scheduleService.findAll();
        }
        
        if (status != null && !status.isEmpty() && !"ALL".equals(status)) {
            if (isValidScheduleStatus(status)) {
                schedules = schedules.stream()
                    .filter(schedule -> status.equals(schedule.getStatus().name()))
                    .collect(Collectors.toList());
            } else {
                log.warn("⚠️ 유효하지 않은 스케줄 상태: {}", status);
                throw new IllegalArgumentException("유효하지 않은 스케줄 상태입니다: " + status);
            }
        }
        
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

        String tenantId = TenantContextHolder.getTenantId();
        Map<Long, Integer> unresolvedByScheduleId = buildUnresolvedClientNoteCountByScheduleId(tenantId, schedules);
        Map<Long, Integer> unresolvedByClientId = buildUnresolvedClientNoteCountByClientId(tenantId, schedules);

        List<ScheduleResponse> scheduleResponses = schedules.stream()
            .map(s -> convertToScheduleResponse(s,
                    unresolvedByScheduleId.getOrDefault(s.getId(), 0),
                    s.getClientId() != null
                            ? unresolvedByClientId.getOrDefault(s.getClientId(), 0)
                            : 0))
            .collect(Collectors.toList());
        
        Map<String, Object> data = new HashMap<>();
        data.put("schedules", scheduleResponses);
        data.put("count", scheduleResponses.size());
        data.put("consultantId", consultantId != null ? consultantId : "");
        data.put("status", status != null ? status : "");
        data.put("startDate", startDate != null ? startDate : "");
        data.put("endDate", endDate != null ? endDate : "");
        
        return success("스케줄 조회 성공", data);
    }


     /**
     * 특정 날짜의 예약된 시간대 조회 (드래그 앤 드롭용)
     */
    @GetMapping("/available-times/{date}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAvailableTimes(
            @PathVariable String date,
            @RequestParam(required = false) Long consultantId,
            HttpSession session) {
        
        log.info("📅 사용 가능한 시간 조회 - 날짜: {}, 상담사ID: {}", date, consultantId);
        
        LocalDate targetDate = LocalDate.parse(date);
        
        List<Schedule> existingSchedules = scheduleService.getSchedulesByDate(targetDate, consultantId);
        
        List<Map<String, String>> bookedTimes = existingSchedules.stream()
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            .filter(schedule -> !schedule.getStatus().equals(ScheduleStatus.CANCELLED))
            .map(schedule -> Map.of(
                "startTime", schedule.getStartTime().toString(),
                "endTime", schedule.getEndTime().toString(),
                "title", schedule.getTitle(),
                "status", schedule.getStatus().toString()
            ))
            .collect(Collectors.toList());
        
        Map<String, Object> data = Map.of(
            "date", date,
            "bookedTimes", bookedTimes
        );
        
        return success("사용 가능한 시간 조회 성공", data);
    }

    /**
     * 관리자 권한 확인 (공통코드 기반)
     */
    private boolean isAdminUser(User user) {
        if (user == null || user.getRole() == null) {
            log.warn("⚠️ 사용자 또는 역할이 null입니다: user={}, role={}", user, user != null ? user.getRole() : "null");
            return false;
        }
        
        try {
            boolean isAdmin =
                roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(user.getRole());
            log.info("🔍 관리자 권한 확인 (공통코드 기반): userId={}, userRole={}, isAdmin={}", 
                user.getId(), user.getRole().name(), isAdmin);
            
            // 폴백: UserRole.isAdmin()도 확인
            boolean isAdminByEnum = user.getRole().isAdmin();
            log.info("🔍 관리자 권한 확인 (Enum 기반): userId={}, userRole={}, isAdminByEnum={}", 
                user.getId(), user.getRole().name(), isAdminByEnum);
            
            // 둘 중 하나라도 true면 관리자로 인정
            boolean finalResult = isAdmin || isAdminByEnum;
            log.info("🔍 최종 관리자 권한 확인: userId={}, userRole={}, finalResult={}", 
                user.getId(), user.getRole().name(), finalResult);
            
            return finalResult;
        } catch (Exception e) {
            log.error("❌ 관리자 권한 확인 실패: userId={}, userRole={}, error={}", 
                user.getId(), user.getRole(), e.getMessage(), e);
            boolean isAdmin = user.getRole() != null && user.getRole().isAdmin();
            log.info("🔍 관리자 권한 확인 (fallback): userId={}, userRole={}, isAdmin={}", 
                user.getId(), user.getRole() != null ? user.getRole().name() : "null", isAdmin);
            return isAdmin;
        }
    }

    /**
     * 어드민·스태프는 타인 스케줄 등록/수정/삭제 가능. canRegisterScheduler와 동일한 기준.
     * @param role 사용자 역할
     * @return 타인 스케줄 등록·수정·삭제 가능 여부
     */
    private boolean canRegisterOrModifyOthersSchedule(UserRole role) {
        if (role == null) {
            return false;
        }
        return roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(role);
    }

    /**
     * 상담사(전문가)가 <b>본인</b> 일정에 대해 {@code status} 필드만 변경하는 경우(상담 시작·완료 등).
     * 모바일/JWT 환경에서 {@code SCHEDULE_MODIFY} 동적 권한이 없어도 세션 상담사 본인 확인으로 허용한다.
     */
    private boolean isOwnProfessionalScheduleStatusOnlyUpdate(User user, Schedule schedule, Map<String, Object> updateData) {
        if (user == null || user.getRole() == null || !user.getRole().isProfessionalProvider()) {
            return false;
        }
        if (schedule.getConsultantId() == null || !schedule.getConsultantId().equals(user.getId())) {
            return false;
        }
        if (updateData == null || updateData.isEmpty()) {
            return false;
        }
        for (String key : updateData.keySet()) {
            if (!"status".equals(key)) {
                return false;
            }
        }
        return updateData.containsKey("status");
    }

    /**
     /**
     * 유효한 스케줄 상태인지 확인
     */
    private boolean isValidScheduleStatus(String status) {
        try {
            List<CommonCode> statusCodes = commonCodeService.getCommonCodesByGroup("STATUS");
            
            return statusCodes.stream()
                .anyMatch(code -> code.getCodeValue().equals(status));
        } catch (Exception e) {
            log.error("❌ 스케줄 상태 확인 실패: error={}", e.getMessage(), e);
            return ScheduleStatus.AVAILABLE.name().equals(status) || 
                   // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                   ScheduleStatus.BOOKED.name().equals(status) || 
                   ScheduleStatus.VACATION.name().equals(status) || 
                   // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                   ScheduleStatus.COMPLETED.name().equals(status) || 
                   // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                   ScheduleStatus.CANCELLED.name().equals(status);
        }
    }

    /**
     * 다가오는 상담 조회 (상담사 대시보드용)
     * GET /api/v1/schedules/upcoming
     * 
     * @param consultantId 상담사 ID (선택, 없으면 세션에서 조회)
     * @param startDate 시작 날짜 (선택, 기본값: 오늘)
     * @param endDate 종료 날짜 (선택, 기본값: 오늘 + 7일)
     * @param limit 최대 개수 (선택, 기본값: 5)
     * @return 다가오는 상담 목록
     */
    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUpcomingSchedules(
            @RequestParam(required = false) Long consultantId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Integer limit,
            HttpSession session) {
        
        ensureTenantContextFromSession(session);
        log.info("📅 다가오는 상담 조회 요청: consultantId={}, startDate={}, endDate={}, limit={}, tenantId={}", 
                consultantId, startDate, endDate, limit, TenantContextHolder.getTenantId());
        
        String tenantIdVal = TenantContextHolder.getTenantId();
        if (tenantIdVal == null || tenantIdVal.isEmpty()) {
            log.warn("❌ 테넌트 정보 없음 - 다가오는 상담 조회 거부 (400)");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("테넌트 정보가 없습니다. 로그아웃 후 다시 로그인해 주세요."));
        }
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.error("❌ 세션에서 사용자 정보를 찾을 수 없습니다.");
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        Long targetConsultantId = consultantId;
        if (targetConsultantId == null) {
            targetConsultantId = currentUser.getId();
        }
        
        if (!roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(currentUser.getRole())
                && !currentUser.getId().equals(targetConsultantId)) {
            log.warn("❌ 다른 상담사의 다가오는 상담 조회 권한 없음: currentUser={}, targetConsultant={}", 
                    currentUser.getId(), targetConsultantId);
            throw new org.springframework.security.access.AccessDeniedException("다른 상담사의 일정을 조회할 권한이 없습니다.");
        }
        
        LocalDate actualStartDate = startDate != null ? startDate : LocalDate.now();
        LocalDate actualEndDate = endDate != null ? endDate : actualStartDate.plusDays(7);
        Integer actualLimit = limit != null && limit > 0 ? limit : 5;
        
        List<ScheduleResponse> schedules = scheduleService.getUpcomingSchedules(
                targetConsultantId, actualStartDate, actualEndDate, actualLimit);
        
        Map<String, Object> data = new HashMap<>();
        data.put("schedules", schedules);
        data.put("totalCount", schedules.size());
        data.put("consultantId", targetConsultantId);
        data.put("startDate", actualStartDate.toString());
        data.put("endDate", actualEndDate.toString());
        data.put("limit", actualLimit);
        
        log.info("✅ 다가오는 상담 조회 완료: consultantId={}, count={}", targetConsultantId, schedules.size());
        return success("다가오는 상담 조회 성공", data);
    }
    
    // ==================== Phase 1 대시보드 컨텐츠 API ====================
    
    /**
     * 미작성 상담일지 목록 조회
     * GET /api/v1/schedules/consultants/{consultantId}/incomplete-records
     * 
     * @param consultantId 상담사 ID
     * @param limit 최대 개수 (기본값: 10)
     * @param session HTTP 세션
     * @return 미작성 상담일지 목록
     */
    @GetMapping("/consultants/{consultantId}/incomplete-records")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getIncompleteRecords(
            @PathVariable Long consultantId,
            @RequestParam(required = false) Integer limit,
            HttpSession session) {
        
        ensureTenantContextFromSession(session);
        log.info("📝 미작성 상담일지 조회 요청: consultantId={}, limit={}, tenantId={}", 
                consultantId, limit, TenantContextHolder.getTenantId());
        
        String tenantIdVal = TenantContextHolder.getTenantId();
        if (tenantIdVal == null || tenantIdVal.isEmpty()) {
            log.warn("❌ 테넌트 정보 없음 - 미작성 상담일지 조회 거부 (400)");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("테넌트 정보가 없습니다. 로그아웃 후 다시 로그인해 주세요."));
        }
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.error("❌ 세션에서 사용자 정보를 찾을 수 없습니다.");
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        if (!roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(currentUser.getRole())
                && !currentUser.getId().equals(consultantId)) {
            log.warn("❌ 다른 상담사의 미작성 상담일지 조회 권한 없음: currentUser={}, targetConsultant={}", 
                    currentUser.getId(), consultantId);
            throw new org.springframework.security.access.AccessDeniedException("다른 상담사의 정보를 조회할 권한이 없습니다.");
        }
        
        List<com.coresolution.consultation.dto.response.IncompleteRecordResponse> records = 
            consultantDashboardService.getIncompleteRecords(consultantId, limit);
        
        Map<String, Object> data = new HashMap<>();
        data.put("count", records.size());
        data.put("records", records);
        
        log.info("✅ 미작성 상담일지 조회 완료: consultantId={}, count={}", consultantId, records.size());
        return success("미작성 상담일지 조회 성공", data);
    }
    
    /**
     * 긴급 확인 필요 내담자 목록 조회
     * GET /api/v1/schedules/consultants/{consultantId}/high-priority-clients
     * 
     * @param consultantId 상담사 ID
     * @param limit 최대 개수 (기본값: 5)
     * @param session HTTP 세션
     * @return 긴급 내담자 목록
     */
    @GetMapping("/consultants/{consultantId}/high-priority-clients")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHighPriorityClients(
            @PathVariable Long consultantId,
            @RequestParam(required = false) Integer limit,
            HttpSession session) {
        
        ensureTenantContextFromSession(session);
        log.info("🚨 긴급 확인 필요 내담자 조회 요청: consultantId={}, limit={}, tenantId={}", 
                consultantId, limit, TenantContextHolder.getTenantId());
        
        String tenantIdVal = TenantContextHolder.getTenantId();
        if (tenantIdVal == null || tenantIdVal.isEmpty()) {
            log.warn("❌ 테넌트 정보 없음 - 긴급 내담자 조회 거부 (400)");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("테넌트 정보가 없습니다. 로그아웃 후 다시 로그인해 주세요."));
        }
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.error("❌ 세션에서 사용자 정보를 찾을 수 없습니다.");
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        if (!roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(currentUser.getRole())
                && !currentUser.getId().equals(consultantId)) {
            log.warn("❌ 다른 상담사의 긴급 내담자 조회 권한 없음: currentUser={}, targetConsultant={}", 
                    currentUser.getId(), consultantId);
            throw new org.springframework.security.access.AccessDeniedException("다른 상담사의 정보를 조회할 권한이 없습니다.");
        }
        
        List<com.coresolution.consultation.dto.response.HighPriorityClientResponse> clients = 
            consultantDashboardService.getHighPriorityClients(consultantId, limit);
        
        Map<String, Object> data = new HashMap<>();
        data.put("count", clients.size());
        data.put("clients", clients);
        
        log.info("✅ 긴급 확인 필요 내담자 조회 완료: consultantId={}, count={}", consultantId, clients.size());
        return success("긴급 확인 필요 내담자 조회 성공", data);
    }
    
    /**
     * 다음 상담 준비 정보 조회
     * GET /api/v1/schedules/consultants/{consultantId}/upcoming-preparation
     * 
     * @param consultantId 상담사 ID
     * @param hoursAhead 앞으로 몇 시간 이내 (기본값: 2시간)
     * @param session HTTP 세션
     * @return 다음 상담 목록
     */
    @GetMapping("/consultants/{consultantId}/upcoming-preparation")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUpcomingPreparation(
            @PathVariable Long consultantId,
            @RequestParam(required = false) Integer hoursAhead,
            HttpSession session) {
        
        ensureTenantContextFromSession(session);
        log.info("📅 다음 상담 준비 정보 조회 요청: consultantId={}, hoursAhead={}, tenantId={}", 
                consultantId, hoursAhead, TenantContextHolder.getTenantId());
        
        String tenantIdVal = TenantContextHolder.getTenantId();
        if (tenantIdVal == null || tenantIdVal.isEmpty()) {
            log.warn("❌ 테넌트 정보 없음 - 다음 상담 준비 조회 거부 (400)");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("테넌트 정보가 없습니다. 로그아웃 후 다시 로그인해 주세요."));
        }
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.error("❌ 세션에서 사용자 정보를 찾을 수 없습니다.");
            throw new org.springframework.security.access.AccessDeniedException("로그인이 필요합니다.");
        }
        
        if (!roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(currentUser.getRole())
                && !currentUser.getId().equals(consultantId)) {
            log.warn("❌ 다른 상담사의 다음 상담 준비 조회 권한 없음: currentUser={}, targetConsultant={}", 
                    currentUser.getId(), consultantId);
            throw new org.springframework.security.access.AccessDeniedException("다른 상담사의 정보를 조회할 권한이 없습니다.");
        }
        
        List<com.coresolution.consultation.dto.response.UpcomingPreparationResponse> preparations = 
            consultantDashboardService.getUpcomingPreparation(consultantId, hoursAhead);
        
        Map<String, Object> data = new HashMap<>();
        data.put("count", preparations.size());
        data.put("preparations", preparations);
        
        log.info("✅ 다음 상담 준비 정보 조회 완료: consultantId={}, count={}", consultantId, preparations.size());
        return success("다음 상담 준비 정보 조회 성공", data);
    }
    
    /**
     * 스케줄 ID별 미해소 특이사항 건수(테넌트 스코프, 단일 집계 쿼리).
     *
     * @param tenantId 테넌트(없으면 빈 맵)
     * @param schedules 대상 스케줄 목록
     * @return scheduleId → 건수
     */
    private Map<Long, Integer> buildUnresolvedClientNoteCountByScheduleId(String tenantId, List<Schedule> schedules) {
        if (tenantId == null || tenantId.isEmpty()) {
            log.warn("⚠️ 미해소 특이사항 집계 생략: tenantId 없음");
            return Map.of();
        }
        List<Long> scheduleIds = schedules.stream()
                .map(Schedule::getId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if (scheduleIds.isEmpty()) {
            return Map.of();
        }
        List<Object[]> rows = clientScheduleNoteRepository.countUnresolvedByScheduleIdsGrouped(tenantId, scheduleIds);
        Map<Long, Integer> out = new HashMap<>();
        for (Object[] row : rows) {
            if (row == null || row.length < 2 || row[0] == null || row[1] == null) {
                continue;
            }
            long sid = ((Number) row[0]).longValue();
            int cnt = ((Number) row[1]).intValue();
            if (cnt > 0) {
                out.put(sid, cnt);
            }
        }
        return out;
    }

    /**
     * 내담자 ID별 미해소 특이사항 건수(테넌트 스코프, 단일 집계 쿼리).
     *
     * @param tenantId 테넌트(없으면 빈 맵)
     * @param schedules 대상 스케줄 목록(각 행의 clientId로 집계)
     * @return clientId → 건수
     */
    private Map<Long, Integer> buildUnresolvedClientNoteCountByClientId(String tenantId, List<Schedule> schedules) {
        if (tenantId == null || tenantId.isEmpty()) {
            log.warn("⚠️ 내담자 기준 미해소 특이사항 집계 생략: tenantId 없음");
            return Map.of();
        }
        List<Long> clientIds = schedules.stream()
                .map(Schedule::getClientId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if (clientIds.isEmpty()) {
            return Map.of();
        }
        List<Object[]> rows = clientScheduleNoteRepository.countUnresolvedByClientIdsGrouped(tenantId, clientIds);
        Map<Long, Integer> out = new HashMap<>();
        for (Object[] row : rows) {
            if (row == null || row.length < 2 || row[0] == null || row[1] == null) {
                continue;
            }
            long cid = ((Number) row[0]).longValue();
            int cnt = ((Number) row[1]).intValue();
            if (cnt > 0) {
                out.put(cid, cnt);
            }
        }
        return out;
    }

    /**
     * 상담일지 목록 응답용 테넌트 ID (호출 스레드 컨텍스트 → 엔티티 필드 순).
     *
     * @param records 상담일지 목록
     * @return tenantId 또는 null
     */
    private String resolveTenantIdForConsultationRecordList(List<ConsultationRecord> records) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null && !tenantId.isBlank()) {
            return tenantId.trim();
        }
        for (ConsultationRecord r : records) {
            if (r.getTenantId() != null && !r.getTenantId().isBlank()) {
                return r.getTenantId().trim();
            }
        }
        return null;
    }

    /**
     * 상담일지에 등장하는 내담자·상담사 사용자 ID에 대해 스케줄 목록과 동일한 표시명을 조회한다.
     *
     * @param tenantId 테넌트 ID
     * @param records 일지 목록
     * @return 사용자 PK → 표시명
     */
    private Map<Long, String> buildScheduleListDisplayNameIndex(String tenantId, List<ConsultationRecord> records) {
        Map<Long, String> index = new HashMap<>();
        if (tenantId == null || tenantId.isEmpty() || records.isEmpty()) {
            return index;
        }
        String scopedTenantId = tenantId.trim();
        Set<Long> distinctIds = new HashSet<>();
        for (ConsultationRecord r : records) {
            if (r.getClientId() != null) {
                distinctIds.add(r.getClientId());
            }
            if (r.getConsultantId() != null) {
                distinctIds.add(r.getConsultantId());
            }
        }
        for (Long userId : distinctIds) {
            try {
                User user = userRepository.findByTenantIdAndId(scopedTenantId, userId).orElse(null);
                index.put(userId, scheduleListUserFieldsResolver.resolveDisplayNameForScheduleList(user));
            } catch (Exception e) {
                log.warn("상담일지 목록 표시명 조회 실패: tenantId={}, userId={}, error={}",
                    scopedTenantId, userId, e.getMessage());
                index.put(userId, AdminServiceUserFacingMessages.DISPLAY_NAME_UNKNOWN);
            }
        }
        return index;
    }

    /**
     * 상담일지 엔티티를 API 맵으로 변환하고 {@code clientName}/{@code consultantName}을 채운다.
     *
     * @param records 원본 일지
     * @param displayNameByUserId PK별 표시명
     * @return JSON 필드 + 표시명
     */
    private List<Map<String, Object>> convertConsultationRecordsToDisplayMaps(
            List<ConsultationRecord> records,
            Map<Long, String> displayNameByUserId) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (ConsultationRecord r : records) {
            Map<String, Object> map = new LinkedHashMap<>(objectMapper.convertValue(
                r, new TypeReference<Map<String, Object>>() {}));
            String clientResolved = r.getClientId() != null
                ? displayNameByUserId.getOrDefault(r.getClientId(), AdminServiceUserFacingMessages.DISPLAY_NAME_UNKNOWN)
                : AdminServiceUserFacingMessages.DISPLAY_NAME_UNKNOWN;
            String consultantResolved = r.getConsultantId() != null
                ? displayNameByUserId.getOrDefault(r.getConsultantId(), AdminServiceUserFacingMessages.DISPLAY_NAME_UNKNOWN)
                : AdminServiceUserFacingMessages.DISPLAY_NAME_UNKNOWN;
            map.put("clientName", clientResolved);
            map.put("client_name", clientResolved);
            map.put("consultantName", consultantResolved);
            map.put("consultant_name", consultantResolved);
            out.add(map);
        }
        return out;
    }

    /**
     * Schedule 엔티티를 ScheduleResponse로 변환(미해소 특이사항 건수 포함).
     *
     * @param schedule 스케줄
     * @param clientScheduleNotesUnresolvedCount 해당 일정(schedule_id)에 직결된 미해소 건수, 0 이상
     * @param clientScheduleNotesClientWideUnresolvedCount 해당 내담자 전체 미해소 건수, clientId 없으면 0
     */
    private ScheduleResponse convertToScheduleResponse(
            Schedule schedule,
            int clientScheduleNotesUnresolvedCount,
            int clientScheduleNotesClientWideUnresolvedCount) {
        String consultantName = AdminServiceUserFacingMessages.DISPLAY_NAME_UNKNOWN;
        String clientName = AdminServiceUserFacingMessages.DISPLAY_NAME_UNKNOWN;
        String consultantPhone = "";
        String consultantEmail = "";
        String consultantProfileImageUrl = null;
        String clientProfileImageUrl = null;
        String consultantProfessionalProviderTypeCode = null;
        String clientPhone = "";
        String clientEmail = "";
        String tenantId = schedule.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            tenantId = TenantContextHolder.getTenantId();
        }
        if ((schedule.getConsultantId() != null || schedule.getClientId() != null)
                && (tenantId == null || tenantId.isEmpty())) {
            log.warn("⚠️ 스케줄 응답 변환: tenantId 없어 상담사/내담자 이름 조회 생략 scheduleId={}", schedule.getId());
        }

        try {
            if (schedule.getConsultantId() != null && tenantId != null && !tenantId.isEmpty()) {
                User consultant = userRepository.findByTenantIdAndId(tenantId, schedule.getConsultantId()).orElse(null);
                if (consultant != null) {
                    consultantName = scheduleListUserFieldsResolver.resolveDisplayNameForScheduleList(consultant);
                    consultantPhone = scheduleListUserFieldsResolver.resolvePhoneForScheduleList(consultant);
                    consultantEmail = scheduleListUserFieldsResolver.resolveEmailForScheduleList(consultant);
                    consultantProfessionalProviderTypeCode = resolveProfessionalProviderTypeCode(consultant);
                    consultantProfileImageUrl = nullableUserProfileImageUrl(consultant);
                }
            }

            if (schedule.getClientId() != null && tenantId != null && !tenantId.isEmpty()) {
                User client = userRepository.findByTenantIdAndId(tenantId, schedule.getClientId()).orElse(null);
                if (client != null) {
                    clientName = scheduleListUserFieldsResolver.resolveDisplayNameForScheduleList(client);
                    clientPhone = scheduleListUserFieldsResolver.resolvePhoneForScheduleList(client);
                    clientEmail = scheduleListUserFieldsResolver.resolveEmailForScheduleList(client);
                    clientProfileImageUrl = nullableUserProfileImageUrl(client);
                }
            }
        } catch (Exception e) {
            log.warn("⚠️ 사용자 정보 조회 실패: consultantId={}, clientId={}, error={}", 
                    schedule.getConsultantId(), schedule.getClientId(), e.getMessage());
        }
        
        return ScheduleResponse.builder()
            .id(schedule.getId())
            .consultantId(schedule.getConsultantId())
            .consultantName(consultantName)
            .consultantProfessionalProviderTypeCode(consultantProfessionalProviderTypeCode)
            .consultantPhone(consultantPhone)
            .consultantEmail(consultantEmail)
            .consultantProfileImageUrl(consultantProfileImageUrl)
            .clientId(schedule.getClientId())
            .clientName(clientName)
            .clientPhone(clientPhone)
            .clientEmail(clientEmail)
            .clientProfileImageUrl(clientProfileImageUrl)
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
            .clientScheduleNotesUnresolvedCount(Math.max(0, clientScheduleNotesUnresolvedCount))
            .clientScheduleNotesClientWideUnresolvedCount(Math.max(0, clientScheduleNotesClientWideUnresolvedCount))
            .build();
    }

    private static String nullableUserProfileImageUrl(User user) {
        if (user == null || user.getProfileImageUrl() == null) {
            return null;
        }
        String url = user.getProfileImageUrl().trim();
        return url.isEmpty() ? null : url;
    }

    /**
     * 사용자의 역할(UserRole)로부터 전문가 유형 코드를 유추합니다.
     * DB에 professionalProviderTypeCode가 설정되지 않은 레거시 데이터에 대한 fallback.
     *
     * @param user 대상 사용자
     * @return 전문가 유형 코드, 유추 불가 시 null
     */
    private String resolveProfessionalProviderTypeCode(User user) {
        if (user == null) {
            return null;
        }
        String code = user.getProfessionalProviderTypeCode();
        if (code != null && !code.trim().isEmpty()) {
            return code;
        }
        UserRole role = user.getRole();
        if (role == null) {
            return null;
        }
        switch (role) {
            case CONSULTANT:
                return ProfessionalProviderTypeConstants.DEFAULT_TYPE_CODE_VALUE;
            case PLAY_THERAPIST:
                return ProfessionalProviderTypeConstants.LEGACY_PLAY_TYPE_CODE_VALUE;
            case SPEECH_THERAPIST:
                return ProfessionalProviderTypeConstants.LEGACY_SPEECH_TYPE_CODE_VALUE;
            default:
                return null;
        }
    }
}
