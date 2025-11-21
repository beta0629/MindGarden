package com.coresolution.core.controller.academy;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.constant.AcademyPermissionConstants;
import com.coresolution.core.domain.academy.Attendance;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.academy.AttendanceRequest;
import com.coresolution.core.dto.academy.AttendanceResponse;
import com.coresolution.core.service.academy.AttendanceService;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.util.PermissionCheckUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.consultation.exception.EntityNotFoundException;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 학원 시스템 출석 관리 컨트롤러
 * 동적 권한 시스템 적용, 하드코딩 금지, 상수 사용
 * 
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-19
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/academy/attendances")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AcademyAttendanceController extends BaseApiController {
    
    private final AttendanceService attendanceService;
    private final DynamicPermissionService dynamicPermissionService;
    
    /**
     * 출석 목록 조회
     * GET /api/v1/academy/attendances
     */
    @GetMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getAttendances(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String enrollmentId,
            @RequestParam(required = false) String scheduleId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            HttpSession session) {
        log.debug("출석 목록 조회 요청: branchId={}, enrollmentId={}, scheduleId={}, date={}", 
                branchId, enrollmentId, scheduleId, date);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.ATTENDANCE_VIEW_LIST, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<AttendanceResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<AttendanceResponse> attendances = attendanceService.getAttendances(
            tenantId, branchId, enrollmentId, scheduleId, date
        );
        return success(attendances);
    }
    
    /**
     * 출석 상세 조회
     * GET /api/v1/academy/attendances/{attendanceId}
     */
    @GetMapping("/{attendanceId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<AttendanceResponse>> getAttendance(
            @PathVariable String attendanceId,
            HttpSession session) {
        log.debug("출석 상세 조회 요청: attendanceId={}", attendanceId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.ATTENDANCE_VIEW_LIST, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<AttendanceResponse>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        AttendanceResponse attendance = attendanceService.getAttendance(tenantId, attendanceId);
        if (attendance == null) {
            throw new EntityNotFoundException("출석을 찾을 수 없습니다: " + attendanceId);
        }
        return success(attendance);
    }
    
    /**
     * 출석 체크
     * POST /api/v1/academy/attendances/check
     */
    @PostMapping("/check")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkAttendance(
            @Valid @RequestBody AttendanceRequest request,
            HttpSession session) {
        log.info("출석 체크 요청: enrollmentId={}, date={}, status={}", 
                request.getEnrollmentId(), request.getAttendanceDate(), request.getStatus());
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.ATTENDANCE_CHECK, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<AttendanceResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        AttendanceResponse attendance = attendanceService.createAttendance(
            tenantId, 
            request, 
            currentUser.getEmail()
        );
        return created("출석이 체크되었습니다.", attendance);
    }
    
    /**
     * 출석 수정
     * PUT /api/v1/academy/attendances/{attendanceId}
     */
    @PutMapping("/{attendanceId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<AttendanceResponse>> updateAttendance(
            @PathVariable String attendanceId,
            @Valid @RequestBody AttendanceRequest request,
            HttpSession session) {
        log.info("출석 수정 요청: attendanceId={}", attendanceId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.ATTENDANCE_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<AttendanceResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        AttendanceResponse attendance = attendanceService.updateAttendance(
            tenantId, 
            attendanceId, 
            request, 
            currentUser.getEmail()
        );
        return updated("출석 정보가 수정되었습니다.", attendance);
    }
    
    /**
     * 출석 상태 변경
     * POST /api/v1/academy/attendances/{attendanceId}/status
     */
    @PostMapping("/{attendanceId}/status")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<AttendanceResponse>> updateAttendanceStatus(
            @PathVariable String attendanceId,
            @RequestParam Attendance.AttendanceStatus status,
            HttpSession session) {
        log.info("출석 상태 변경 요청: attendanceId={}, status={}", attendanceId, status);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.ATTENDANCE_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<AttendanceResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        AttendanceResponse attendance = attendanceService.updateAttendanceStatus(
            tenantId, 
            attendanceId, 
            status, 
            currentUser.getEmail()
        );
        return updated("출석 상태가 변경되었습니다.", attendance);
    }
    
    /**
     * 수강생별 출석 조회
     * GET /api/v1/academy/attendances/enrollment/{enrollmentId}
     */
    @GetMapping("/enrollment/{enrollmentId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getAttendancesByEnrollment(
            @PathVariable String enrollmentId,
            HttpSession session) {
        log.debug("수강생별 출석 조회 요청: enrollmentId={}", enrollmentId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.ATTENDANCE_VIEW_LIST, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<AttendanceResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<AttendanceResponse> attendances = attendanceService.getAttendancesByEnrollment(
            tenantId, enrollmentId
        );
        return success(attendances);
    }
    
    /**
     * 출석률 계산
     * GET /api/v1/academy/attendances/statistics/{enrollmentId}
     */
    @GetMapping("/statistics/{enrollmentId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAttendanceStatistics(
            @PathVariable String enrollmentId,
            HttpSession session) {
        log.debug("출석률 계산 요청: enrollmentId={}", enrollmentId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.ATTENDANCE_VIEW_STATISTICS, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<Map<String, Object>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        double attendanceRate = attendanceService.calculateAttendanceRate(tenantId, enrollmentId);
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("enrollmentId", enrollmentId);
        statistics.put("attendanceRate", attendanceRate);
        return success(statistics);
    }
}

