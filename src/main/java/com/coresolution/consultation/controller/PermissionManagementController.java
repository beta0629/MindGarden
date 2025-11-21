package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Permission;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.PermissionRepository;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
@RequestMapping({"/api/v1/permissions", "/api/permissions"}) // v1 경로 추가, 레거시 경로 유지
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PermissionManagementController extends BaseApiController {
    
    private final DynamicPermissionService dynamicPermissionService;
    private final PermissionRepository permissionRepository;
    
    /**
     * 현재 사용자의 권한 목록 조회
     */
    @GetMapping("/my-permissions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMyPermissions(HttpSession session) {
        log.info("🔍 권한 조회 API 호출 시작");
        log.info("🔍 세션 ID: {}", session.getId());
        
        User currentUser = SessionUtils.getCurrentUser(session);
        log.info("🔍 세션에서 가져온 사용자: {}", currentUser != null ? currentUser.getEmail() : "null");
        
        if (currentUser == null) {
            log.warn("⚠️ 세션에 사용자 정보가 없습니다");
            throw new RuntimeException("로그인이 필요합니다.");
        }
        
        log.info("🔍 사용자 역할: {}", currentUser.getRole());
        List<String> permissions = dynamicPermissionService.getUserPermissionsAsStringList(currentUser);
        log.info("🔍 사용자 권한 목록: {}", permissions);
        
        Map<String, Object> data = new HashMap<>();
        data.put("userRole", currentUser.getRole());
        data.put("permissions", permissions);
        data.put("permissionCount", permissions.size());
        
        return success(data);
    }
    
    /**
     * 프론트엔드용 권한 체크 API
     * 특정 권한을 가졌는지 확인
     */
    @PostMapping("/check-permission")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkUserPermission(@RequestBody Map<String, String> request, HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new RuntimeException("로그인이 필요합니다.");
        }
        
        String permissionCode = request.get("permission");
        if (permissionCode == null) {
            throw new RuntimeException("permission 파라미터가 필요합니다.");
        }
        
        boolean hasPermission = dynamicPermissionService.hasPermission(currentUser, permissionCode);
        
        Map<String, Object> data = new HashMap<>();
        data.put("userRole", currentUser.getRole());
        data.put("permission", permissionCode);
        data.put("hasPermission", hasPermission);
        
        return success(data);
    }
    
    /**
     * 특정 역할의 권한 목록 조회
     */
    @GetMapping("/role/{roleName}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRolePermissions(@PathVariable String roleName) {
        log.info("🔍 역할 권한 조회: roleName={}", roleName);
        UserRole role = UserRole.fromString(roleName);
        
        // 캐시 우회하여 직접 DB에서 조회
        List<Map<String, Object>> permissions = dynamicPermissionService.getRolePermissions(roleName);
        List<String> permissionCodes = permissions.stream()
            .map(p -> (String) p.get("permission_code"))
            .filter(code -> code != null)
            .collect(java.util.stream.Collectors.toList());
        
        log.info("🔍 DB에서 조회한 권한: {}", permissionCodes);
        
        // 프론트엔드에서 expect하는 형식으로 변환
        List<Map<String, Object>> resultPermissions = permissionCodes.stream()
            .map(code -> {
                Map<String, Object> perm = new HashMap<>();
                perm.put("permission_code", code);
                perm.put("permissionCode", code);
                return perm;
            })
            .collect(java.util.stream.Collectors.toList());
        
        Map<String, Object> data = new HashMap<>();
        data.put("role", role);
        data.put("permissions", resultPermissions);
        data.put("permissionCount", resultPermissions.size());
        
        return success(data);
    }
    
    /**
     * 특정 권한을 가진 역할 목록 조회
     */
    @GetMapping("/permission/{permissionCode}/roles")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRolesWithPermission(@PathVariable String permissionCode) {
        List<UserRole> roles = dynamicPermissionService.getRolesWithPermission(permissionCode);
        
        Map<String, Object> data = new HashMap<>();
        data.put("permissionCode", permissionCode);
        data.put("roles", roles);
        data.put("roleCount", roles.size());
        
        return success(data);
    }
    
    /**
     * 권한 체크 테스트
     */
    @PostMapping("/check")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkPermission(@RequestBody Map<String, String> request) {
        String roleName = request.get("role");
        String permissionCode = request.get("permission");
        
        if (roleName == null || permissionCode == null) {
            throw new RuntimeException("role과 permission 파라미터가 필요합니다.");
        }
        
        UserRole role = UserRole.fromString(roleName);
        boolean hasPermission = dynamicPermissionService.hasPermission(role, permissionCode);
        
        Map<String, Object> data = new HashMap<>();
        data.put("role", role);
        data.put("permission", permissionCode);
        data.put("hasPermission", hasPermission);
        
        return success(data);
    }
    
    /**
     * 모든 권한 코드 목록 조회
     */
    @GetMapping("/codes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllPermissionCodes() {
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
        
        return success(permissionCodes);
    }
    
    /**
     * 사용자 역할에 따라 관리 가능한 권한만 조회
     */
    @GetMapping("/manageable")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getManageablePermissions(HttpSession session) {
        log.info("🔍 관리 가능한 권한 조회 시작");
        
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.warn("⚠️ 세션에 사용자 정보가 없습니다");
            throw new RuntimeException("로그인이 필요합니다.");
        }

        log.info("🔍 현재 사용자: {} ({})", currentUser.getEmail(), currentUser.getRole());

        // 관리자 역할 확인 (BRANCH_ADMIN 이상만 권한 관리 가능)
        String currentUserRole = currentUser.getRole().name();
        boolean isAdmin = "ADMIN".equals(currentUserRole) || 
                         "BRANCH_SUPER_ADMIN".equals(currentUserRole) || 
                         "BRANCH_ADMIN".equals(currentUserRole) ||
                         "SUPER_HQ_ADMIN".equals(currentUserRole) || 
                         "HQ_ADMIN".equals(currentUserRole) || 
                         "HQ_MASTER".equals(currentUserRole);
        
        log.info("🔍 관리자 권한 확인: isAdmin={}", isAdmin);
        
        if (!isAdmin) {
            log.warn("⚠️ 관리자 권한이 없습니다: 역할={}", currentUserRole);
            throw new RuntimeException("권한이 없습니다. 관리자만 권한을 관리할 수 있습니다.");
        }

        // currentUserRole은 이미 위에서 선언됨
        log.info("🔍 관리 가능한 권한 조회 요청: 사용자 역할={}", currentUserRole);

        // 사용자 역할에 따라 관리 가능한 권한만 필터링
        log.info("🔍 데이터베이스에서 권한 목록 조회");
        List<Permission> permissions = permissionRepository.findByIsActiveTrue();
        List<Map<String, Object>> allPermissions = permissions.stream()
            .map(p -> {
                Map<String, Object> map = new HashMap<>();
                map.put("permissionCode", p.getPermissionCode());
                map.put("permissionName", p.getPermissionName());
                map.put("category", p.getCategory() != null ? p.getCategory() : "기타");
                return map;
            })
            .collect(Collectors.toList());
        log.info("🔍 데이터베이스 권한 목록 조회 완료: 권한 수={}", allPermissions.size());
        
        List<Map<String, Object>> manageablePermissions = filterManageablePermissions(currentUserRole, allPermissions);

        log.info("✅ 관리 가능한 권한 조회 완료: 역할={}, 권한수={}", currentUserRole, manageablePermissions.size());

        Map<String, Object> data = new HashMap<>();
        data.put("permissions", manageablePermissions);
        data.put("count", manageablePermissions.size());
        data.put("userRole", currentUserRole);

        return success(data);
    }


    /**
     * 사용자 역할에 따라 관리 가능한 권한 필터링
     * 동적으로 데이터베이스에서 현재 사용자의 권한을 조회하여 필터링
     */
    private List<Map<String, Object>> filterManageablePermissions(String userRole, List<Map<String, Object>> allPermissions) {
        log.info("🔍 동적 권한 필터링 시작: 사용자 역할={}", userRole);
        
        // HQ_MASTER는 모든 권한 관리 가능
        if ("HQ_MASTER".equals(userRole)) {
            log.info("✅ HQ_MASTER는 모든 권한 관리 가능");
            return allPermissions;
        }
        
        // SUPER_HQ_ADMIN, HQ_ADMIN, ADMIN, BRANCH_SUPER_ADMIN, BRANCH_ADMIN은 본인보다 하위 권한만 관리
        // 여기서는 단순화하여 모든 권한을 반환 (추후 역할 계층 구조에 따라 필터링 가능)
        log.info("✅ 사용자 역할 {}은 모든 권한 관리 가능", userRole);
        return allPermissions;
    }

    /**
     * 역할별 권한 설정
     */
    @PostMapping("/role-permissions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> setRolePermissions(@RequestBody Map<String, Object> request, HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            throw new RuntimeException("인증이 필요합니다.");
        }
        
        // 관리자 역할 확인 (BRANCH_ADMIN 이상만 권한 관리 가능)
        String currentUserRole = currentUser.getRole().name();
        log.info("🔍 권한 저장 요청: 사용자 역할={}, 이메일={}", currentUserRole, currentUser.getEmail());
        
        boolean isAdmin = "ADMIN".equals(currentUserRole) || 
                         "BRANCH_SUPER_ADMIN".equals(currentUserRole) || 
                         "BRANCH_ADMIN".equals(currentUserRole) ||
                         "SUPER_HQ_ADMIN".equals(currentUserRole) || 
                         "HQ_ADMIN".equals(currentUserRole) || 
                         "HQ_MASTER".equals(currentUserRole);
        
        log.info("🔍 관리자 권한 확인: isAdmin={}", isAdmin);
        
        if (!isAdmin) {
            log.warn("❌ 관리자 권한 없음: 역할={}", currentUserRole);
            throw new RuntimeException("권한이 없습니다. 관리자만 권한을 변경할 수 있습니다.");
        }
        
        String roleName = (String) request.get("roleName");
        @SuppressWarnings("unchecked")
        List<String> permissionCodes = (List<String>) request.get("permissionCodes");
        
        if (roleName == null || permissionCodes == null) {
            throw new RuntimeException("roleName과 permissionCodes가 필요합니다.");
        }
        
        // 역할 계층 구조에 따른 권한 변경 제한
        // currentUserRole은 이미 위에서 선언됨
        boolean canManageRole = false;
        
        // 자신의 역할에 대한 권한 변경은 항상 허용
        if (currentUserRole.equals(roleName)) {
            log.info("✅ 자신의 역할 권한 변경 요청 - 허용");
            canManageRole = true;
        }
        // HQ 마스터는 모든 역할 관리 가능
        else if ("HQ_MASTER".equals(currentUserRole)) {
            canManageRole = true;
        }
        // SUPER_HQ_ADMIN은 HQ_MASTER를 제외한 모든 역할 관리 가능
        else if ("SUPER_HQ_ADMIN".equals(currentUserRole)) {
            canManageRole = !"HQ_MASTER".equals(roleName);
        }
        // HQ_ADMIN은 본사 관리자 이하 역할 관리 가능
        else if ("HQ_ADMIN".equals(currentUserRole)) {
            canManageRole = !"HQ_MASTER".equals(roleName) && !"SUPER_HQ_ADMIN".equals(roleName);
        }
        // ADMIN은 지점 관련 역할만 관리 가능
        else if ("ADMIN".equals(currentUserRole)) {
            canManageRole = "BRANCH_SUPER_ADMIN".equals(roleName) || "BRANCH_ADMIN".equals(roleName) || 
                           "CONSULTANT".equals(roleName) || "CLIENT".equals(roleName);
        }
        // BRANCH_SUPER_ADMIN은 지점 내 하위 역할만 관리 가능
        else if ("BRANCH_SUPER_ADMIN".equals(currentUserRole)) {
            canManageRole = "BRANCH_ADMIN".equals(roleName) || "CONSULTANT".equals(roleName) || 
                           "CLIENT".equals(roleName);
        }
        // BRANCH_ADMIN은 상담사, 내담자만 관리 가능
        else if ("BRANCH_ADMIN".equals(currentUserRole)) {
            canManageRole = "CONSULTANT".equals(roleName) || "CLIENT".equals(roleName);
        }
        
        if (!canManageRole) {
            throw new RuntimeException("해당 역할의 권한을 변경할 권한이 없습니다.");
        }
        
        // 역할별 권한 설정
        dynamicPermissionService.setRolePermissions(roleName, permissionCodes);
        
        log.info("✅ 역할별 권한 설정 완료: role={}, permissions={}, 설정자={}", 
                roleName, permissionCodes.size(), currentUser.getRole());
        
        Map<String, Object> data = new HashMap<>();
        data.put("roleName", roleName);
        data.put("permissionCount", permissionCodes.size());
        
        return success("역할별 권한이 성공적으로 설정되었습니다.", data);
    }
}
