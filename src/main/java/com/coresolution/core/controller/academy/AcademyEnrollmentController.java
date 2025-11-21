package com.coresolution.core.controller.academy;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.constant.AcademyPermissionConstants;
import com.coresolution.core.domain.academy.ClassEnrollment;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.academy.ClassEnrollmentRequest;
import com.coresolution.core.dto.academy.ClassEnrollmentResponse;
import com.coresolution.core.service.academy.ClassEnrollmentService;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.util.PermissionCheckUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.consultation.exception.EntityNotFoundException;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 학원 시스템 수강 등록 관리 컨트롤러
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
@RequestMapping("/api/v1/academy/enrollments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AcademyEnrollmentController extends BaseApiController {
    
    private final ClassEnrollmentService enrollmentService;
    private final DynamicPermissionService dynamicPermissionService;
    
    /**
     * 수강 등록 목록 조회
     * GET /api/v1/academy/enrollments
     */
    @GetMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<ClassEnrollmentResponse>>> getEnrollments(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) Long consumerId,
            @RequestParam(required = false) ClassEnrollment.EnrollmentStatus status,
            HttpSession session) {
        log.debug("수강 등록 목록 조회 요청: branchId={}, classId={}, consumerId={}, status={}", 
                branchId, classId, consumerId, status);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.ENROLLMENT_VIEW_LIST, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<ClassEnrollmentResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<ClassEnrollmentResponse> enrollments = enrollmentService.getEnrollments(
            tenantId, branchId, classId, consumerId, status
        );
        return success(enrollments);
    }
    
    /**
     * 수강 등록 상세 조회
     * GET /api/v1/academy/enrollments/{enrollmentId}
     */
    @GetMapping("/{enrollmentId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<ClassEnrollmentResponse>> getEnrollment(
            @PathVariable String enrollmentId,
            HttpSession session) {
        log.debug("수강 등록 상세 조회 요청: enrollmentId={}", enrollmentId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.ENROLLMENT_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<ClassEnrollmentResponse>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        ClassEnrollmentResponse enrollment = enrollmentService.getEnrollment(tenantId, enrollmentId);
        if (enrollment == null) {
            throw new EntityNotFoundException("수강 등록을 찾을 수 없습니다: " + enrollmentId);
        }
        return success(enrollment);
    }
    
    /**
     * 수강 등록 생성
     * POST /api/v1/academy/enrollments
     */
    @PostMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<ClassEnrollmentResponse>> createEnrollment(
            @Valid @RequestBody ClassEnrollmentRequest request,
            HttpSession session) {
        log.info("수강 등록 생성 요청: classId={}, consumerId={}", request.getClassId(), request.getConsumerId());
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.ENROLLMENT_CREATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<ClassEnrollmentResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        ClassEnrollmentResponse enrollment = enrollmentService.createEnrollment(
            tenantId, 
            request, 
            currentUser.getEmail()
        );
        return created("수강 등록이 완료되었습니다.", enrollment);
    }
    
    /**
     * 수강 등록 수정
     * PUT /api/v1/academy/enrollments/{enrollmentId}
     */
    @PutMapping("/{enrollmentId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<ClassEnrollmentResponse>> updateEnrollment(
            @PathVariable String enrollmentId,
            @Valid @RequestBody ClassEnrollmentRequest request,
            HttpSession session) {
        log.info("수강 등록 수정 요청: enrollmentId={}", enrollmentId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.ENROLLMENT_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<ClassEnrollmentResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        ClassEnrollmentResponse enrollment = enrollmentService.updateEnrollment(
            tenantId, 
            enrollmentId, 
            request, 
            currentUser.getEmail()
        );
        return updated("수강 등록 정보가 수정되었습니다.", enrollment);
    }
    
    /**
     * 수강 취소
     * POST /api/v1/academy/enrollments/{enrollmentId}/cancel
     */
    @PostMapping("/{enrollmentId}/cancel")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<ClassEnrollmentResponse>> cancelEnrollment(
            @PathVariable String enrollmentId,
            HttpSession session) {
        log.info("수강 취소 요청: enrollmentId={}", enrollmentId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.ENROLLMENT_CANCEL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<ClassEnrollmentResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        ClassEnrollmentResponse enrollment = enrollmentService.updateEnrollmentStatus(
            tenantId, 
            enrollmentId, 
            ClassEnrollment.EnrollmentStatus.CANCELLED, 
            currentUser.getEmail()
        );
        return updated("수강이 취소되었습니다.", enrollment);
    }
    
    /**
     * 수강생별 활성 수강 등록 조회
     * GET /api/v1/academy/enrollments/consumer/{consumerId}
     */
    @GetMapping("/consumer/{consumerId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<ClassEnrollmentResponse>>> getActiveEnrollmentsByConsumer(
            @PathVariable Long consumerId,
            HttpSession session) {
        log.debug("수강생별 활성 수강 등록 조회 요청: consumerId={}", consumerId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.ENROLLMENT_VIEW_LIST, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<ClassEnrollmentResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<ClassEnrollmentResponse> enrollments = enrollmentService.getActiveEnrollmentsByConsumer(
            tenantId, consumerId
        );
        return success(enrollments);
    }
}

