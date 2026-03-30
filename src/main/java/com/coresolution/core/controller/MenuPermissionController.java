package com.coresolution.core.controller;

import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.MenuDTO;
import com.coresolution.core.dto.MenuPermissionDTO;
import com.coresolution.core.dto.MenuPermissionGrantRequest;
import com.coresolution.core.service.MenuPermissionService;
import com.coresolution.consultation.utils.SessionUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 메뉴 권한 관리 API
 * 
 * 관리자가 역할별 메뉴 접근 권한을 동적으로 설정
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/menu-permissions")
@RequiredArgsConstructor
@Tag(name = "Menu Permission", description = "메뉴 권한 관리 API (관리자 전용)")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class MenuPermissionController {

    private final MenuPermissionService menuPermissionService;

    @GetMapping("/roles/{roleId}")
    @Operation(summary = "역할별 메뉴 권한 목록 조회", description = "특정 역할의 메뉴 권한 목록을 조회합니다.")
    public ResponseEntity<ApiResponse<List<MenuPermissionDTO>>> getRoleMenuPermissions(
        HttpSession session,
        @PathVariable String roleId
    ) {
        try {
            String tenantId = SessionUtils.getTenantId(session);
            
            if (tenantId == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("테넌트 ID가 필요합니다."));
            }

            log.info("역할별 메뉴 권한 조회: tenantId={}, roleId={}", tenantId, roleId);
            List<MenuPermissionDTO> permissions = menuPermissionService.getRoleMenuPermissions(tenantId, roleId);
            
            return ResponseEntity.ok(ApiResponse.success(permissions));
        } catch (Exception e) {
            log.error("역할별 메뉴 권한 조회 실패", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("메뉴 권한 조회 중 오류가 발생했습니다."));
        }
    }

    @PostMapping("/grant")
    @Operation(summary = "메뉴 권한 부여", description = "역할에 메뉴 권한을 부여합니다.")
    public ResponseEntity<ApiResponse<Void>> grantMenuPermission(
        HttpSession session,
        @RequestBody @Valid MenuPermissionGrantRequest request
    ) {
        try {
            String tenantId = SessionUtils.getTenantId(session);
            
            if (tenantId == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("테넌트 ID가 필요합니다."));
            }

            log.info("메뉴 권한 부여: tenantId={}, roleId={}, menuId={}", 
                tenantId, request.getRoleId(), request.getMenuId());
            
            menuPermissionService.grantMenuPermission(tenantId, request);
            
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalArgumentException e) {
            log.error("메뉴 권한 부여 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("메뉴 권한 부여 실패", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("메뉴 권한 부여 중 오류가 발생했습니다."));
        }
    }

    @DeleteMapping("/revoke")
    @Operation(summary = "메뉴 권한 회수", description = "역할의 메뉴 권한을 회수합니다.")
    public ResponseEntity<ApiResponse<Void>> revokeMenuPermission(
        HttpSession session,
        @RequestParam String roleId,
        @RequestParam Long menuId
    ) {
        try {
            String tenantId = SessionUtils.getTenantId(session);
            
            if (tenantId == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("테넌트 ID가 필요합니다."));
            }

            log.info("메뉴 권한 회수: tenantId={}, roleId={}, menuId={}", tenantId, roleId, menuId);
            
            menuPermissionService.revokeMenuPermission(tenantId, roleId, menuId);
            
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalArgumentException e) {
            log.error("메뉴 권한 회수 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("메뉴 권한 회수 실패", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("메뉴 권한 회수 중 오류가 발생했습니다."));
        }
    }

    @PostMapping("/batch")
    @Operation(summary = "메뉴 권한 일괄 설정", description = "역할의 메뉴 권한을 일괄로 설정합니다.")
    public ResponseEntity<ApiResponse<Void>> batchUpdateMenuPermissions(
        HttpSession session,
        @RequestParam String roleId,
        @RequestBody @Valid List<MenuPermissionGrantRequest> requests
    ) {
        try {
            String tenantId = SessionUtils.getTenantId(session);
            
            if (tenantId == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("테넌트 ID가 필요합니다."));
            }

            log.info("메뉴 권한 일괄 업데이트: tenantId={}, roleId={}, count={}", 
                tenantId, roleId, requests.size());
            
            menuPermissionService.batchUpdateMenuPermissions(tenantId, roleId, requests);
            
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("메뉴 권한 일괄 업데이트 실패", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("메뉴 권한 일괄 업데이트 중 오류가 발생했습니다."));
        }
    }

    @GetMapping("/user/accessible")
    @Operation(summary = "사용자 접근 가능한 메뉴 조회", description = "현재 사용자가 접근 가능한 메뉴 목록을 조회합니다.")
    public ResponseEntity<ApiResponse<List<MenuDTO>>> getUserAccessibleMenus(
        HttpSession session
    ) {
        try {
            String tenantId = SessionUtils.getTenantId(session);
            String roleId = SessionUtils.getRoleId(session);
            String role = SessionUtils.getRoleName(session);
            
            if (tenantId == null || roleId == null || role == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("세션 정보가 부족합니다."));
            }

            log.info("사용자 접근 가능한 메뉴 조회: tenantId={}, roleId={}, role={}", 
                tenantId, roleId, role);
            
            List<MenuDTO> menus = menuPermissionService.getUserAccessibleMenus(tenantId, roleId, role);
            
            return ResponseEntity.ok(ApiResponse.success(menus));
        } catch (Exception e) {
            log.error("사용자 접근 가능한 메뉴 조회 실패", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("메뉴 조회 중 오류가 발생했습니다."));
        }
    }
}

