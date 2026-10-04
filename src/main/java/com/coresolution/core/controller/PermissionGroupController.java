package com.coresolution.core.controller;

import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.PermissionGroupDTO;
import com.coresolution.core.service.PermissionGroupService;
import com.coresolution.consultation.util.ServerErrorResponses;
import com.coresolution.consultation.utils.SessionUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 권한 그룹 API
 * 
 * 역할별 그룹 권한 관리
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/permissions/groups")
@RequiredArgsConstructor
@Tag(name = "Permission Group", description = "권한 그룹 관리 API")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class PermissionGroupController {

    private final PermissionGroupService permissionGroupService;

    @GetMapping("/my")
    @Operation(summary = "내 권한 그룹 조회", description = "현재 사용자의 권한 그룹 코드 목록을 조회합니다.")
    public ResponseEntity<ApiResponse<List<String>>> getMyPermissionGroups(HttpSession session) {
        var user = SessionUtils.getCurrentUser(session);
        if (user == null) {
            log.warn("⚠️ 로그인 사용자 없음 — 권한 그룹 조회 거부");
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("세션 정보가 부족합니다."));
        }

        // SessionUtils.getRoleId()가 이미 폴백 로직을 포함하므로 중복 처리 불필요
        String tenantId = SessionUtils.getTenantId(session);
        String roleId = SessionUtils.getRoleId(session);

        // 내담자 등 테넌트 역할 할당(user_role_assignments)이 없는 사용자는 정상 상태다.
        // 요청 자체는 올바르므로 400 이 아니라 "권한 그룹 없음"(빈 목록)으로 200 을 돌려준다.
        if (tenantId == null || roleId == null) {
            log.info("ℹ️ 권한 그룹 없음(역할 할당 미등록): userId={}, role={}", user.getId(), user.getRole());
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }

        log.info("✅ 내 권한 그룹 조회: userId={}", user.getId());
        List<String> groups = permissionGroupService.getUserPermissionGroupCodes(tenantId, roleId);

        return ResponseEntity.ok(ApiResponse.success(groups));
    }

    @GetMapping("/check/{groupCode}")
    @Operation(summary = "권한 그룹 체크", description = "특정 권한 그룹을 가졌는지 확인합니다.")
    public ResponseEntity<ApiResponse<Boolean>> checkPermissionGroup(
        HttpSession session,
        @PathVariable String groupCode
    ) {
        String tenantId = SessionUtils.getTenantId(session);
        String roleId = SessionUtils.getRoleId(session);

        if (tenantId == null || roleId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("세션 정보가 부족합니다."));
        }

        log.info("권한 그룹 체크: tenantId={}, roleId={}, groupCode={}", tenantId, roleId, groupCode);
        boolean hasPermission = permissionGroupService.hasPermissionGroup(tenantId, roleId, groupCode);

        return ResponseEntity.ok(ApiResponse.success(hasPermission));
    }

    @GetMapping("/level/{groupCode}")
    @Operation(summary = "권한 그룹 레벨 조회", description = "특정 권한 그룹의 접근 레벨을 조회합니다.")
    public ResponseEntity<ApiResponse<String>> getPermissionGroupLevel(
        HttpSession session,
        @PathVariable String groupCode
    ) {
        String tenantId = SessionUtils.getTenantId(session);
        String roleId = SessionUtils.getRoleId(session);

        if (tenantId == null || roleId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("세션 정보가 부족합니다."));
        }

        log.info("권한 그룹 레벨 조회: tenantId={}, roleId={}, groupCode={}", tenantId, roleId, groupCode);
        String level = permissionGroupService.getPermissionGroupLevel(tenantId, roleId, groupCode);

        return ResponseEntity.ok(ApiResponse.success(level));
    }

    @GetMapping("/all")
    @Operation(summary = "모든 권한 그룹 조회", description = "모든 권한 그룹 목록을 조회합니다 (계층형).")
    public ResponseEntity<ApiResponse<List<PermissionGroupDTO>>> getAllPermissionGroups(HttpSession session) {
        String tenantId = (String) session.getAttribute("tenantId");

        if (tenantId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("테넌트 ID가 필요합니다."));
        }

        log.info("모든 권한 그룹 조회: tenantId={}", tenantId);
        List<PermissionGroupDTO> groups = permissionGroupService.getAllPermissionGroups(tenantId);

        return ResponseEntity.ok(ApiResponse.success(groups));
    }

    @PostMapping("/grant")
    @Operation(summary = "권한 그룹 부여", description = "역할에 권한 그룹을 부여합니다. (관리자 전용)")
    public ResponseEntity<ApiResponse<Void>> grantPermissionGroup(
        HttpSession session,
        @RequestBody Map<String, String> request
    ) {
        try {
            String tenantId = (String) session.getAttribute("tenantId");
            String roleId = request.get("roleId");
            String groupCode = request.get("groupCode");
            String accessLevel = request.getOrDefault("accessLevel", "READ");

            if (tenantId == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("테넌트 ID가 필요합니다."));
            }

            if (roleId == null || groupCode == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("역할 ID와 그룹 코드가 필요합니다."));
            }

            log.info("권한 그룹 부여: tenantId={}, roleId={}, groupCode={}, accessLevel={}", 
                tenantId, roleId, groupCode, accessLevel);

            permissionGroupService.grantPermissionGroup(tenantId, roleId, groupCode, accessLevel);

            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalArgumentException e) {
            log.error("권한 그룹 부여 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            throw ServerErrorResponses.propagate(e);
        }
    }

    @DeleteMapping("/revoke")
    @Operation(summary = "권한 그룹 회수", description = "역할의 권한 그룹을 회수합니다. (관리자 전용)")
    public ResponseEntity<ApiResponse<Void>> revokePermissionGroup(
        HttpSession session,
        @RequestParam String roleId,
        @RequestParam String groupCode
    ) {
        try {
            String tenantId = (String) session.getAttribute("tenantId");

            if (tenantId == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("테넌트 ID가 필요합니다."));
            }

            log.info("권한 그룹 회수: tenantId={}, roleId={}, groupCode={}", tenantId, roleId, groupCode);

            permissionGroupService.revokePermissionGroup(tenantId, roleId, groupCode);

            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalArgumentException e) {
            log.error("권한 그룹 회수 실패: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            throw ServerErrorResponses.propagate(e);
        }
    }

    @PostMapping("/batch")
    @Operation(summary = "권한 그룹 일괄 부여", description = "역할에 여러 권한 그룹을 일괄로 부여합니다. (관리자 전용)")
    public ResponseEntity<ApiResponse<Void>> batchGrantPermissionGroups(
        HttpSession session,
        @RequestParam String roleId,
        @RequestBody Map<String, Object> request
    ) {
        String tenantId = (String) session.getAttribute("tenantId");
        @SuppressWarnings("unchecked")
        List<String> groupCodes = (List<String>) request.get("groupCodes");
        String accessLevel = (String) request.getOrDefault("accessLevel", "READ");

        if (tenantId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("테넌트 ID가 필요합니다."));
        }

        if (groupCodes == null || groupCodes.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("그룹 코드 목록이 필요합니다."));
        }

        log.info("권한 그룹 일괄 부여: tenantId={}, roleId={}, count={}, accessLevel={}", 
            tenantId, roleId, groupCodes.size(), accessLevel);

        permissionGroupService.batchGrantPermissionGroups(tenantId, roleId, groupCodes, accessLevel);

        return ResponseEntity.ok(ApiResponse.success(null));
    }
}

