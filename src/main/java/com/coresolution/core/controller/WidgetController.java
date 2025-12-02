package com.coresolution.core.controller;

import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.AddWidgetRequest;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.WidgetDefinitionResponse;
import com.coresolution.core.dto.WidgetGroupResponse;
import com.coresolution.core.service.WidgetGroupService;
import com.coresolution.core.service.WidgetPermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

/**
 * 위젯 관리 API 컨트롤러
 * 
 * 목적: 위젯 조회, 추가, 삭제 API 제공
 * 표준: API_DESIGN_STANDARD.md 준수
 * 
 * ✅ 표준: 에러 메시지는 공통코드에서 조회 (하드코딩 제거)
 * 
 * @author CoreSolution Team
 * @since 2025-12-02
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/widgets")
@RequiredArgsConstructor
public class WidgetController {
    
    private final WidgetGroupService widgetGroupService;
    private final WidgetPermissionService widgetPermissionService;
    private final CommonCodeService commonCodeService;
    
    /**
     * 업종 + 역할별 위젯 그룹 조회
     * 
     * GET /api/v1/widgets/groups?businessType=CONSULTATION&roleCode=ADMIN
     */
    @GetMapping("/groups")
    public ResponseEntity<ApiResponse<List<WidgetGroupResponse>>> getWidgetGroups(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestParam String businessType,
            @RequestParam String roleCode) {
        
        // 헤더에 없으면 현재 컨텍스트에서 가져오기
        if (tenantId == null || tenantId.isEmpty()) {
            tenantId = TenantContextHolder.getTenantId();
        }
        
        // 테넌트 ID가 여전히 없으면 오류 반환
        if (tenantId == null || tenantId.isEmpty()) {
            log.warn("테넌트 ID가 제공되지 않았습니다");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<List<WidgetGroupResponse>>error("테넌트 ID가 필요합니다"));
        }
        
        log.debug("위젯 그룹 조회 API: tenantId={}, businessType={}, roleCode={}", 
                tenantId, businessType, roleCode);
        
        try {
            List<WidgetGroupResponse> groups = widgetGroupService.getWidgetGroups(
                    tenantId, businessType, roleCode);
            
            return ResponseEntity.ok(ApiResponse.success(groups));
            
        } catch (Exception e) {
            log.error("위젯 그룹 조회 실패", e);
            // ✅ 표준: 공통코드에서 에러 메시지 조회
            String errorMessage = commonCodeService.getCodeKoreanName("ERROR_CODE", "WIDGET_GROUP_FETCH_ERROR");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<List<WidgetGroupResponse>>error(errorMessage));
        }
    }
    
    /**
     * 그룹별 위젯 조회
     * 
     * GET /api/v1/widgets/groups/{groupId}/widgets
     */
    @GetMapping("/groups/{groupId}/widgets")
    public ResponseEntity<ApiResponse<List<WidgetDefinitionResponse>>> getWidgetsByGroup(
            @PathVariable String groupId) {
        
        log.debug("그룹별 위젯 조회 API: groupId={}", groupId);
        
        try {
            List<WidgetDefinitionResponse> widgets = widgetGroupService.getWidgetsByGroup(groupId);
            
            return ResponseEntity.ok(ApiResponse.success(widgets));
            
        } catch (Exception e) {
            log.error("그룹별 위젯 조회 실패", e);
            String errorMessage = commonCodeService.getCodeKoreanName("ERROR_CODE", "WIDGET_FETCH_ERROR");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<List<WidgetDefinitionResponse>>error(errorMessage));
        }
    }
    
    /**
     * 그룹화된 위젯 조회 (전체)
     * 
     * GET /api/v1/widgets/grouped?businessType=CONSULTATION&roleCode=ADMIN
     */
    @GetMapping("/grouped")
    public ResponseEntity<ApiResponse<Map<String, List<WidgetDefinitionResponse>>>> getGroupedWidgets(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestParam String businessType,
            @RequestParam String roleCode) {
        
        // 헤더에 없으면 현재 컨텍스트에서 가져오기
        if (tenantId == null || tenantId.isEmpty()) {
            tenantId = TenantContextHolder.getTenantId();
        }
        
        // 테넌트 ID가 여전히 없으면 오류 반환
        if (tenantId == null || tenantId.isEmpty()) {
            log.warn("테넌트 ID가 제공되지 않았습니다");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.<Map<String, List<WidgetDefinitionResponse>>>error("테넌트 ID가 필요합니다"));
        }
        
        log.debug("그룹화된 위젯 조회 API: tenantId={}, businessType={}, roleCode={}", 
                tenantId, businessType, roleCode);
        
        try {
            Map<String, List<WidgetDefinitionResponse>> groupedWidgets = 
                    widgetGroupService.getGroupedWidgets(tenantId, businessType, roleCode);
            
            return ResponseEntity.ok(ApiResponse.success(groupedWidgets));
            
        } catch (Exception e) {
            log.error("그룹화된 위젯 조회 실패", e);
            String errorMessage = commonCodeService.getCodeKoreanName("ERROR_CODE", "GROUPED_WIDGET_FETCH_ERROR");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<Map<String, List<WidgetDefinitionResponse>>>error(errorMessage));
        }
    }
    
    /**
     * 독립 위젯 조회 (사용자가 추가 가능한 위젯)
     * 
     * GET /api/v1/widgets/available?businessType=CONSULTATION
     */
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<WidgetDefinitionResponse>>> getAvailableWidgets(
            @RequestParam String businessType) {
        
        log.debug("독립 위젯 조회 API: businessType={}", businessType);
        
        try {
            List<WidgetDefinitionResponse> widgets = 
                    widgetGroupService.getAvailableIndependentWidgets(businessType);
            
            return ResponseEntity.ok(ApiResponse.success(widgets));
            
        } catch (Exception e) {
            log.error("독립 위젯 조회 실패", e);
            String errorMessage = commonCodeService.getCodeKoreanName("ERROR_CODE", "AVAILABLE_WIDGET_FETCH_ERROR");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<List<WidgetDefinitionResponse>>error(errorMessage));
        }
    }
    
    /**
     * 위젯 추가 (독립 위젯만)
     * 
     * POST /api/v1/widgets/dashboards/{dashboardId}/widgets
     */
    @PostMapping("/dashboards/{dashboardId}/widgets")
    public ResponseEntity<ApiResponse<String>> addWidget(
            @PathVariable String dashboardId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @Valid @RequestBody AddWidgetRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // 헤더에 없으면 현재 컨텍스트에서 가져오기
        if (tenantId == null || tenantId.isEmpty()) {
            tenantId = TenantContextHolder.getTenantId();
        }
        
        log.info("위젯 추가 API: dashboardId={}, tenantId={}, widgetType={}, user={}", 
                dashboardId, tenantId, request.getWidgetType(), userDetails.getUsername());
        
        try {
            // ✅ 권한 검증
            if (!widgetPermissionService.canAddWidget(request.getWidgetType(), request.getBusinessType())) {
                String errorMessage = commonCodeService.getCodeKoreanName("ERROR_CODE", "WIDGET_ADD_FORBIDDEN");
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error(errorMessage));
            }
            
            // TODO: 실제 위젯 추가 로직 구현 (대시보드 설정 업데이트)
            // 현재는 권한 검증만 구현
            
            String successMessage = commonCodeService.getCodeKoreanName("SUCCESS_MESSAGE", "WIDGET_PERMISSION_VERIFIED");
            return ResponseEntity.ok(ApiResponse.success(successMessage));
            
        } catch (IllegalArgumentException e) {
            log.warn("위젯 추가 실패: {}", e.getMessage());
            String errorMessage = commonCodeService.getCodeKoreanName("ERROR_CODE", "INVALID_REQUEST");
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(errorMessage));
                    
        } catch (Exception e) {
            log.error("위젯 추가 실패", e);
            String errorMessage = commonCodeService.getCodeKoreanName("ERROR_CODE", "WIDGET_ADD_ERROR");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(errorMessage));
        }
    }
    
    /**
     * 위젯 삭제 (독립 위젯만)
     * 
     * DELETE /api/v1/widgets/dashboards/{dashboardId}/widgets/{widgetId}
     */
    @DeleteMapping("/dashboards/{dashboardId}/widgets/{widgetId}")
    public ResponseEntity<ApiResponse<String>> deleteWidget(
            @PathVariable String dashboardId,
            @PathVariable String widgetId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // 헤더에 없으면 현재 컨텍스트에서 가져오기
        if (tenantId == null || tenantId.isEmpty()) {
            tenantId = TenantContextHolder.getTenantId();
        }
        
        log.info("위젯 삭제 API: dashboardId={}, widgetId={}, tenantId={}, user={}", 
                dashboardId, widgetId, tenantId, userDetails.getUsername());
        
        try {
            // ✅ 권한 검증
            if (!widgetPermissionService.canDeleteWidget(widgetId)) {
                String errorMessage = commonCodeService.getCodeKoreanName("ERROR_CODE", "WIDGET_DELETE_FORBIDDEN");
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error(errorMessage));
            }
            
            // TODO: 실제 위젯 삭제 로직 구현 (대시보드 설정 업데이트)
            // 현재는 권한 검증만 구현
            
            String successMessage = commonCodeService.getCodeKoreanName("SUCCESS_MESSAGE", "WIDGET_PERMISSION_VERIFIED");
            return ResponseEntity.ok(ApiResponse.success(successMessage));
            
        } catch (IllegalArgumentException e) {
            log.warn("위젯 삭제 실패: {}", e.getMessage());
            String errorMessage = commonCodeService.getCodeKoreanName("ERROR_CODE", "INVALID_REQUEST");
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(errorMessage));
                    
        } catch (Exception e) {
            log.error("위젯 삭제 실패", e);
            String errorMessage = commonCodeService.getCodeKoreanName("ERROR_CODE", "WIDGET_DELETE_ERROR");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(errorMessage));
        }
    }
    
    /**
     * 위젯 권한 확인
     * 
     * GET /api/v1/widgets/{widgetId}/permissions
     */
    @GetMapping("/{widgetId}/permissions")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> getWidgetPermissions(
            @PathVariable String widgetId) {
        
        log.debug("위젯 권한 확인 API: widgetId={}", widgetId);
        
        try {
            Map<String, Boolean> permissions = Map.of(
                    "canDelete", widgetPermissionService.canDeleteWidget(widgetId),
                    "canConfigure", widgetPermissionService.canConfigureWidget(widgetId),
                    "canMove", widgetPermissionService.canMoveWidget(widgetId),
                    "isSystemManaged", widgetPermissionService.isSystemManagedWidget(widgetId)
            );
            
            return ResponseEntity.ok(ApiResponse.success(permissions));
            
        } catch (IllegalArgumentException e) {
            log.warn("위젯 권한 확인 실패: {}", e.getMessage());
            String errorMessage = commonCodeService.getCodeKoreanName("ERROR_CODE", "INVALID_REQUEST");
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<Map<String, Boolean>>error(errorMessage));
                    
        } catch (Exception e) {
            log.error("위젯 권한 확인 실패", e);
            String errorMessage = commonCodeService.getCodeKoreanName("ERROR_CODE", "PERMISSION_CHECK_ERROR");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<Map<String, Boolean>>error(errorMessage));
        }
    }
}

