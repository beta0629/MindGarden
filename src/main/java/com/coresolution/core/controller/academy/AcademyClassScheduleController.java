package com.coresolution.core.controller.academy;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.constant.AcademyPermissionConstants;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.academy.ClassScheduleRequest;
import com.coresolution.core.dto.academy.ClassScheduleResponse;
import com.coresolution.core.service.academy.ClassScheduleService;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.util.PermissionCheckUtils;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * 학원 시스템 시간표 관리 컨트롤러
 * 반별 시간표 설정 및 관리
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/academy/schedules")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AcademyClassScheduleController extends BaseApiController {
    
    private final ClassScheduleService scheduleService;
    private final DynamicPermissionService dynamicPermissionService;
    
    /**
     * 시간표 목록 조회
     * GET /api/v1/academy/schedules
     */
    @GetMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<ClassScheduleResponse>>> getSchedules(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String classId,
            HttpSession session) {
        log.debug("시간표 목록 조회 요청: branchId={}, classId={}", branchId, classId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<ClassScheduleResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<ClassScheduleResponse> schedules = scheduleService.getSchedules(tenantId, branchId, classId);
        return success(schedules);
    }
    
    /**
     * 시간표 상세 조회
     * GET /api/v1/academy/schedules/{scheduleId}
     */
    @GetMapping("/{scheduleId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<ClassScheduleResponse>> getSchedule(
            @PathVariable String scheduleId,
            HttpSession session) {
        log.debug("시간표 상세 조회: scheduleId={}", scheduleId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<ClassScheduleResponse>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        ClassScheduleResponse schedule = scheduleService.getSchedule(tenantId, scheduleId);
        return success(schedule);
    }
    
    /**
     * 시간표 생성
     * POST /api/v1/academy/schedules
     */
    @PostMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<ClassScheduleResponse>> createSchedule(
            @Valid @RequestBody ClassScheduleRequest request,
            HttpSession session) {
        log.info("시간표 생성 요청: classId={}, dayOfWeek={}", request.getClassId(), request.getDayOfWeek());
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<ClassScheduleResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        ClassScheduleResponse schedule = scheduleService.createSchedule(
            tenantId, 
            request, 
            currentUser.getEmail()
        );
        return created("시간표가 생성되었습니다.", schedule);
    }
    
    /**
     * 시간표 수정
     * PUT /api/v1/academy/schedules/{scheduleId}
     */
    @PutMapping("/{scheduleId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<ClassScheduleResponse>> updateSchedule(
            @PathVariable String scheduleId,
            @Valid @RequestBody ClassScheduleRequest request,
            HttpSession session) {
        log.info("시간표 수정 요청: scheduleId={}", scheduleId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<ClassScheduleResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        ClassScheduleResponse schedule = scheduleService.updateSchedule(
            tenantId, 
            scheduleId, 
            request, 
            currentUser.getEmail()
        );
        return success("시간표가 수정되었습니다.", schedule);
    }
    
    /**
     * 시간표 삭제
     * DELETE /api/v1/academy/schedules/{scheduleId}
     */
    @DeleteMapping("/{scheduleId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(
            @PathVariable String scheduleId,
            HttpSession session) {
        log.info("시간표 삭제 요청: scheduleId={}", scheduleId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<Void>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        scheduleService.deleteSchedule(tenantId, scheduleId, currentUser.getEmail());
        return success("시간표가 삭제되었습니다.", null);
    }
    
    /**
     * 반별 활성 시간표 조회
     * GET /api/v1/academy/schedules/class/{classId}/active
     */
    @GetMapping("/class/{classId}/active")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<ClassScheduleResponse>>> getActiveSchedules(
            @PathVariable String classId,
            HttpSession session) {
        log.debug("반별 활성 시간표 조회: classId={}", classId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<ClassScheduleResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<ClassScheduleResponse> schedules = scheduleService.getActiveSchedulesByClass(tenantId, classId);
        return success(schedules);
    }
    
    /**
     * 반별 정기 수업 시간표 조회
     * GET /api/v1/academy/schedules/class/{classId}/regular
     */
    @GetMapping("/class/{classId}/regular")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<ClassScheduleResponse>>> getRegularSchedules(
            @PathVariable String classId,
            HttpSession session) {
        log.debug("반별 정기 수업 시간표 조회: classId={}", classId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<ClassScheduleResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<ClassScheduleResponse> schedules = scheduleService.getRegularSchedulesByClass(tenantId, classId);
        return success(schedules);
    }
    
    /**
     * 특정 날짜 시간표 조회
     * GET /api/v1/academy/schedules/class/{classId}/date
     */
    @GetMapping("/class/{classId}/date")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<ClassScheduleResponse>>> getSchedulesByDate(
            @PathVariable String classId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            HttpSession session) {
        log.debug("특정 날짜 시간표 조회: classId={}, date={}", classId, date);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<ClassScheduleResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<ClassScheduleResponse> schedules = scheduleService.getSchedulesByDate(tenantId, classId, date);
        return success(schedules);
    }
    
    /**
     * 요일별 시간표 조회
     * GET /api/v1/academy/schedules/class/{classId}/day
     */
    @GetMapping("/class/{classId}/day")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<ClassScheduleResponse>>> getSchedulesByDayOfWeek(
            @PathVariable String classId,
            @RequestParam Integer dayOfWeek,
            HttpSession session) {
        log.debug("요일별 시간표 조회: classId={}, dayOfWeek={}", classId, dayOfWeek);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<ClassScheduleResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        if (dayOfWeek < 0 || dayOfWeek > 6) {
            throw new IllegalArgumentException("요일은 0(일요일)부터 6(토요일) 사이여야 합니다.");
        }
        
        List<ClassScheduleResponse> schedules = scheduleService.getSchedulesByDayOfWeek(tenantId, classId, dayOfWeek);
        return success(schedules);
    }
    
    /**
     * 기간별 시간표 조회
     * GET /api/v1/academy/schedules/class/{classId}/range
     */
    @GetMapping("/class/{classId}/range")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<ClassScheduleResponse>>> getSchedulesByDateRange(
            @PathVariable String classId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            HttpSession session) {
        log.debug("기간별 시간표 조회: classId={}, startDate={}, endDate={}", classId, startDate, endDate);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<ClassScheduleResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("시작일은 종료일보다 이전이어야 합니다.");
        }
        
        List<ClassScheduleResponse> schedules = scheduleService.getSchedulesByDateRange(tenantId, classId, startDate, endDate);
        return success(schedules);
    }
}

