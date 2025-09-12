package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.DynamicPermissionService;
import com.mindgarden.consultation.utils.SessionUtils;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 권한 관리 컨트롤러
 * 동적 권한 시스템을 관리하기 위한 API 제공
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-12
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/permissions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PermissionManagementController {
    
    private final DynamicPermissionService dynamicPermissionService;
    
    /**
     * 현재 사용자의 권한 목록 조회
     */
    @GetMapping("/my-permissions")
    public ResponseEntity<?> getMyPermissions(HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            List<String> permissions = dynamicPermissionService.getUserPermissions(currentUser);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "userRole", currentUser.getRole(),
                    "permissions", permissions,
                    "permissionCount", permissions.size()
                )
            ));
            
        } catch (Exception e) {
            log.error("❌ 사용자 권한 조회 실패", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "권한 조회 중 오류가 발생했습니다."
            ));
        }
    }
    
    /**
     * 프론트엔드용 권한 체크 API
     * 특정 권한을 가졌는지 확인
     */
    @PostMapping("/check-permission")
    public ResponseEntity<?> checkUserPermission(@RequestBody Map<String, String> request, HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            String permissionCode = request.get("permission");
            if (permissionCode == null) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "permission 파라미터가 필요합니다."
                ));
            }
            
            boolean hasPermission = dynamicPermissionService.hasPermission(currentUser, permissionCode);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "userRole", currentUser.getRole(),
                    "permission", permissionCode,
                    "hasPermission", hasPermission
                )
            ));
            
        } catch (Exception e) {
            log.error("❌ 사용자 권한 체크 실패", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "권한 체크 중 오류가 발생했습니다."
            ));
        }
    }
    
    /**
     * 특정 역할의 권한 목록 조회
     */
    @GetMapping("/role/{roleName}")
    public ResponseEntity<?> getRolePermissions(@PathVariable String roleName) {
        try {
            UserRole role = UserRole.fromString(roleName);
            List<String> permissions = dynamicPermissionService.getRolePermissions(role);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "role", role,
                    "permissions", permissions,
                    "permissionCount", permissions.size()
                )
            ));
            
        } catch (Exception e) {
            log.error("❌ 역할 권한 조회 실패: {}", roleName, e);
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", "유효하지 않은 역할입니다."
            ));
        }
    }
    
    /**
     * 특정 권한을 가진 역할 목록 조회
     */
    @GetMapping("/permission/{permissionCode}/roles")
    public ResponseEntity<?> getRolesWithPermission(@PathVariable String permissionCode) {
        try {
            List<UserRole> roles = dynamicPermissionService.getRolesWithPermission(permissionCode);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "permissionCode", permissionCode,
                    "roles", roles,
                    "roleCount", roles.size()
                )
            ));
            
        } catch (Exception e) {
            log.error("❌ 권한별 역할 조회 실패: {}", permissionCode, e);
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", "유효하지 않은 권한 코드입니다."
            ));
        }
    }
    
    /**
     * 권한 체크 테스트
     */
    @PostMapping("/check")
    public ResponseEntity<?> checkPermission(@RequestBody Map<String, String> request) {
        try {
            String roleName = request.get("role");
            String permissionCode = request.get("permission");
            
            if (roleName == null || permissionCode == null) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "message", "role과 permission 파라미터가 필요합니다."
                ));
            }
            
            UserRole role = UserRole.fromString(roleName);
            boolean hasPermission = dynamicPermissionService.hasPermission(role, permissionCode);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "role", role,
                    "permission", permissionCode,
                    "hasPermission", hasPermission
                )
            ));
            
        } catch (Exception e) {
            log.error("❌ 권한 체크 실패", e);
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "message", "권한 체크 중 오류가 발생했습니다."
            ));
        }
    }
    
    /**
     * 모든 권한 코드 목록 조회
     */
    @GetMapping("/codes")
    public ResponseEntity<?> getAllPermissionCodes() {
        try {
            // 모든 권한 코드를 하드코딩 대신 동적으로 조회할 수 있도록 구현
            Map<String, Object> permissionCodes = Map.of(
                "ERD_ACCESS", "ERD 메뉴 접근",
                "PAYMENT_ACCESS", "결제 기능 접근",
                "SUPPLY_REQUEST", "비품구매 요청",
                "SUPPLY_PAYMENT_REQUEST", "비품구매 결제 요청",
                "SUPPLY_PAYMENT_APPROVE", "비품구매 결제 승인",
                "SCHEDULER_REGISTER", "스케줄러 등록",
                "SCHEDULER_CONSULTANT_VIEW", "스케줄러 상담사 조회",
                "BRANCH_DETAILS_VIEW", "지점 내역 조회",
                "BRANCH_MANAGE", "지점 관리",
                "SYSTEM_MANAGE", "시스템 관리"
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", permissionCodes
            ));
            
        } catch (Exception e) {
            log.error("❌ 권한 코드 목록 조회 실패", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "권한 코드 조회 중 오류가 발생했습니다."
            ));
        }
    }
}
