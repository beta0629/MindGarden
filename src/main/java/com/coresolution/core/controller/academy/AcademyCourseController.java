package com.coresolution.core.controller.academy;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.constant.AcademyPermissionConstants;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.academy.CourseRequest;
import com.coresolution.core.dto.academy.CourseResponse;
import com.coresolution.core.service.academy.CourseService;
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
 * 학원 시스템 강좌 관리 컨트롤러
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
@RequestMapping("/api/v1/academy/courses")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AcademyCourseController extends BaseApiController {
    
    private final CourseService courseService;
    private final DynamicPermissionService dynamicPermissionService;
    
    /**
     * 강좌 목록 조회
     * GET /api/v1/academy/courses
     */
    @GetMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getCourses(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String subject,
            HttpSession session) {
        log.debug("강좌 목록 조회 요청: branchId={}, category={}, subject={}", branchId, category, subject);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.COURSE_VIEW_LIST, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<CourseResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<CourseResponse> courses = courseService.getCourses(tenantId, branchId, category, subject);
        return success(courses);
    }
    
    /**
     * 강좌 상세 조회
     * GET /api/v1/academy/courses/{courseId}
     */
    @GetMapping("/{courseId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourse(
            @PathVariable String courseId,
            HttpSession session) {
        log.debug("강좌 상세 조회 요청: courseId={}", courseId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.COURSE_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<CourseResponse>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        CourseResponse course = courseService.getCourse(tenantId, courseId);
        if (course == null) {
            throw new EntityNotFoundException("강좌를 찾을 수 없습니다: " + courseId);
        }
        return success(course);
    }
    
    /**
     * 강좌 생성
     * POST /api/v1/academy/courses
     */
    @PostMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @Valid @RequestBody CourseRequest request,
            HttpSession session) {
        log.info("강좌 생성 요청: name={}", request.getName());
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.COURSE_CREATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<CourseResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        CourseResponse course = courseService.createCourse(
            tenantId, 
            request, 
            currentUser.getEmail()
        );
        return created("강좌가 성공적으로 생성되었습니다.", course);
    }
    
    /**
     * 강좌 수정
     * PUT /api/v1/academy/courses/{courseId}
     */
    @PutMapping("/{courseId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable String courseId,
            @Valid @RequestBody CourseRequest request,
            HttpSession session) {
        log.info("강좌 수정 요청: courseId={}", courseId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.COURSE_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<CourseResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        CourseResponse course = courseService.updateCourse(
            tenantId, 
            courseId, 
            request, 
            currentUser.getEmail()
        );
        return updated("강좌 정보가 수정되었습니다.", course);
    }
    
    /**
     * 강좌 삭제 (소프트 삭제)
     * DELETE /api/v1/academy/courses/{courseId}
     */
    @DeleteMapping("/{courseId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(
            @PathVariable String courseId,
            HttpSession session) {
        log.info("강좌 삭제 요청: courseId={}", courseId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.COURSE_DELETE, 
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
        
        courseService.deleteCourse(tenantId, courseId, currentUser.getEmail());
        return deleted("강좌가 삭제되었습니다.");
    }
    
    /**
     * 강좌 활성화/비활성화
     * POST /api/v1/academy/courses/{courseId}/toggle-status
     */
    @PostMapping("/{courseId}/toggle-status")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<CourseResponse>> toggleCourseStatus(
            @PathVariable String courseId,
            @RequestParam boolean isActive,
            HttpSession session) {
        log.info("강좌 상태 변경 요청: courseId={}, isActive={}", courseId, isActive);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.COURSE_TOGGLE_STATUS, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<CourseResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        CourseResponse course = courseService.toggleCourseStatus(
            tenantId, 
            courseId, 
            isActive, 
            currentUser.getEmail()
        );
        String message = isActive ? "강좌가 활성화되었습니다." : "강좌가 비활성화되었습니다.";
        return updated(message, course);
    }
}

