package com.coresolution.core.controller.academy;

import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.constant.AcademyPermissionConstants;
import com.coresolution.core.domain.academy.Class;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.academy.ClassRequest;
import com.coresolution.core.dto.academy.ClassResponse;
import com.coresolution.core.service.academy.ClassService;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 학원 시스템 반(Class) 관리 컨트롤러
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
@RequestMapping("/api/v1/academy/classes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AcademyClassController extends BaseApiController {
    
    private final ClassService classService;
    private final DynamicPermissionService dynamicPermissionService;
    
    /**
     * 반 목록 조회
     * GET /api/v1/academy/classes
     */
    @GetMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<ClassResponse>>> getClasses(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) Class.ClassStatus status,
            HttpSession session) {
        log.debug("반 목록 조회 요청: branchId={}, courseId={}, status={}", branchId, courseId, status);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_LIST, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<ClassResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<ClassResponse> classes = classService.getClasses(tenantId, branchId, courseId, status);
        return success(classes);
    }
    
    /**
     * 반 상세 조회
     * GET /api/v1/academy/classes/{classId}
     */
    @GetMapping("/{classId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<ClassResponse>> getClass(
            @PathVariable String classId,
            HttpSession session) {
        log.debug("반 상세 조회 요청: classId={}", classId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<ClassResponse>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        ClassResponse classResponse = classService.getClass(tenantId, classId);
        if (classResponse == null) {
            throw new EntityNotFoundException("반을 찾을 수 없습니다: " + classId);
        }
        return success(classResponse);
    }
    
    /**
     * 반 생성
     * POST /api/v1/academy/classes
     */
    @PostMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<ClassResponse>> createClass(
            @Valid @RequestBody ClassRequest request,
            HttpSession session) {
        log.info("반 생성 요청: name={}, courseId={}", request.getName(), request.getCourseId());
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_CREATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<ClassResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        ClassResponse classResponse = classService.createClass(
            tenantId, 
            request, 
            currentUser.getEmail()
        );
        return created("반이 성공적으로 생성되었습니다.", classResponse);
    }
    
    /**
     * 반 수정
     * PUT /api/v1/academy/classes/{classId}
     */
    @PutMapping("/{classId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<ClassResponse>> updateClass(
            @PathVariable String classId,
            @Valid @RequestBody ClassRequest request,
            HttpSession session) {
        log.info("반 수정 요청: classId={}", classId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<ClassResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        ClassResponse classResponse = classService.updateClass(
            tenantId, 
            classId, 
            request, 
            currentUser.getEmail()
        );
        return updated("반 정보가 수정되었습니다.", classResponse);
    }
    
    /**
     * 반 삭제 (소프트 삭제)
     * DELETE /api/v1/academy/classes/{classId}
     */
    @DeleteMapping("/{classId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Void>> deleteClass(
            @PathVariable String classId,
            HttpSession session) {
        log.info("반 삭제 요청: classId={}", classId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_DELETE, 
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
        
        classService.deleteClass(tenantId, classId, currentUser.getEmail());
        return deleted("반이 삭제되었습니다.");
    }
    
    /**
     * 반 상태 변경
     * POST /api/v1/academy/classes/{classId}/status
     */
    @PostMapping("/{classId}/status")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<ClassResponse>> updateClassStatus(
            @PathVariable String classId,
            @RequestParam Class.ClassStatus status,
            HttpSession session) {
        log.info("반 상태 변경 요청: classId={}, status={}", classId, status);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_UPDATE_STATUS, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<ClassResponse>>) permissionResponse;
        }
        
        User currentUser = PermissionCheckUtils.checkAuthentication(session);
        String tenantId = TenantContextHolder.getTenantId();
        
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        ClassResponse classResponse = classService.updateClassStatus(
            tenantId, 
            classId, 
            status, 
            currentUser.getEmail()
        );
        return updated("반 상태가 변경되었습니다.", classResponse);
    }
    
    /**
     * 모집 중인 반 목록 조회
     * GET /api/v1/academy/classes/recruiting
     */
    @GetMapping("/recruiting")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<List<ClassResponse>>> getRecruitingClasses(
            @RequestParam(required = false) Long branchId,
            HttpSession session) {
        log.debug("모집 중인 반 목록 조회 요청: branchId={}", branchId);
        
        // 동적 권한 체크
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_RECRUITING, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<List<ClassResponse>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        List<ClassResponse> classes = classService.getRecruitingClasses(tenantId, branchId);
        return success(classes);
    }
    
    /**
     * 등록 가능 여부 확인
     * GET /api/v1/academy/classes/{classId}/check-enrollable
     */
    @GetMapping("/{classId}/check-enrollable")
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkEnrollable(
            @PathVariable String classId,
            HttpSession session) {
        log.debug("등록 가능 여부 확인 요청: classId={}", classId);
        
        // 동적 권한 체크 (조회 권한으로 체크)
        ResponseEntity<?> permissionResponse = PermissionCheckUtils.checkPermission(
            session, 
            AcademyPermissionConstants.CLASS_VIEW_DETAIL, 
            dynamicPermissionService
        );
        if (permissionResponse != null) {
            return (ResponseEntity<ApiResponse<Map<String, Object>>>) permissionResponse;
        }
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            throw new IllegalArgumentException("테넌트 정보가 없습니다.");
        }
        
        boolean canEnroll = classService.canEnroll(tenantId, classId);
        Map<String, Object> result = new HashMap<>();
        result.put("canEnroll", canEnroll);
        return success(result);
    }
}

