package com.mindgarden.consultation.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.DynamicPermissionService;
import com.mindgarden.consultation.utils.SessionUtils;
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
@RequestMapping("/api/permissions")
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
            log.info("🔍 권한 조회 API 호출 시작");
            log.info("🔍 세션 ID: {}", session.getId());
            
            User currentUser = SessionUtils.getCurrentUser(session);
            log.info("🔍 세션에서 가져온 사용자: {}", currentUser != null ? currentUser.getEmail() : "null");
            
            if (currentUser == null) {
                log.warn("⚠️ 세션에 사용자 정보가 없습니다");
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }
            
            log.info("🔍 사용자 역할: {}", currentUser.getRole());
            List<String> permissions = dynamicPermissionService.getUserPermissionsAsStringList(currentUser);
            log.info("🔍 사용자 권한 목록: {}", permissions);
            
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
    
    /**
     * 사용자 역할에 따라 관리 가능한 권한만 조회
     */
    @GetMapping("/manageable")
    public ResponseEntity<?> getManageablePermissions(HttpSession session) {
        try {
            log.info("🔍 관리 가능한 권한 조회 시작");
            
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.warn("⚠️ 세션에 사용자 정보가 없습니다");
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다."
                ));
            }

            log.info("🔍 현재 사용자: {} ({})", currentUser.getEmail(), currentUser.getRole());

            // 권한 확인 (관리자만 가능)
            boolean hasUserManagePermission = dynamicPermissionService.hasPermission(currentUser, "USER_MANAGE");
            log.info("🔍 USER_MANAGE 권한 확인: {}", hasUserManagePermission);
            
            if (!hasUserManagePermission) {
                log.warn("⚠️ USER_MANAGE 권한이 없습니다");
                return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "권한이 없습니다."
                ));
            }

            String currentUserRole = currentUser.getRole().name();
            log.info("🔍 관리 가능한 권한 조회 요청: 사용자 역할={}", currentUserRole);

            // 사용자 역할에 따라 관리 가능한 권한만 필터링
            log.info("🔍 하드코딩된 권한 목록 사용");
            List<Map<String, Object>> allPermissions = createHardcodedPermissions();
            log.info("🔍 하드코딩된 권한 목록 생성 완료: 권한 수={}", allPermissions.size());
            
            List<Map<String, Object>> manageablePermissions = filterManageablePermissions(currentUserRole, allPermissions);

            log.info("✅ 관리 가능한 권한 조회 완료: 역할={}, 권한수={}", currentUserRole, manageablePermissions.size());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", manageablePermissions,
                "count", manageablePermissions.size(),
                "userRole", currentUserRole
            ));

        } catch (Exception e) {
            log.error("❌ 관리 가능한 권한 조회 실패: error={}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "관리 가능한 권한 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 하드코딩된 권한 목록 생성 (임시용)
     */
    private List<Map<String, Object>> createHardcodedPermissions() {
        return List.of(
            Map.of("permissionCode", "ADMIN_DASHBOARD_VIEW", "permissionName", "관리자 대시보드 조회", "category", "대시보드"),
            Map.of("permissionCode", "ALL_BRANCHES_VIEW", "permissionName", "모든 지점 조회", "category", "지점관리"),
            Map.of("permissionCode", "APPROVAL_MANAGE", "permissionName", "승인 관리", "category", "승인관리"),
            Map.of("permissionCode", "BRANCH_DETAILS_VIEW", "permissionName", "지점 상세 조회", "category", "지점관리"),
            Map.of("permissionCode", "BUDGET_MANAGE", "permissionName", "예산 관리", "category", "재무관리"),
            Map.of("permissionCode", "CLIENT_MANAGE", "permissionName", "내담자 관리", "category", "사용자관리"),
            Map.of("permissionCode", "CONSULTANT_MANAGE", "permissionName", "상담사 관리", "category", "사용자관리"),
            Map.of("permissionCode", "CONSULTATION_RECORD_VIEW", "permissionName", "상담 기록 조회", "category", "상담관리"),
            Map.of("permissionCode", "CONSULTATION_STATISTICS_VIEW", "permissionName", "상담 통계 조회", "category", "통계"),
            Map.of("permissionCode", "ERP_ACCESS", "permissionName", "ERP 접근", "category", "ERP관리"),
            Map.of("permissionCode", "FINANCIAL_VIEW", "permissionName", "재무 조회", "category", "재무관리"),
            Map.of("permissionCode", "INTEGRATED_FINANCE_VIEW", "permissionName", "통합재무 조회", "category", "재무관리"),
            Map.of("permissionCode", "ITEM_MANAGE", "permissionName", "항목 관리", "category", "ERP관리"),
            Map.of("permissionCode", "MAPPING_MANAGE", "permissionName", "매핑 관리", "category", "ERP관리"),
            Map.of("permissionCode", "MAPPING_VIEW", "permissionName", "매핑 조회", "category", "ERP관리"),
            Map.of("permissionCode", "PURCHASE_REQUEST_VIEW", "permissionName", "구매 요청 조회", "category", "ERP관리"),
            Map.of("permissionCode", "REFUND_MANAGE", "permissionName", "환불 관리", "category", "재무관리"),
            Map.of("permissionCode", "SALARY_CALCULATE", "permissionName", "급여 계산", "category", "급여관리"),
            Map.of("permissionCode", "SALARY_MANAGE", "permissionName", "급여 관리", "category", "급여관리"),
            Map.of("permissionCode", "SALARY_VIEW", "permissionName", "급여 조회", "category", "급여관리"),
            Map.of("permissionCode", "SCHEDULE_CREATE", "permissionName", "일정 생성", "category", "일정관리"),
            Map.of("permissionCode", "SCHEDULE_DELETE", "permissionName", "일정 삭제", "category", "일정관리"),
            Map.of("permissionCode", "SCHEDULE_MANAGE", "permissionName", "일정 관리", "category", "일정관리"),
            Map.of("permissionCode", "SCHEDULE_MODIFY", "permissionName", "일정 수정", "category", "일정관리"),
            Map.of("permissionCode", "STATISTICS_VIEW", "permissionName", "통계 조회", "category", "통계"),
            Map.of("permissionCode", "TAX_MANAGE", "permissionName", "세금 관리", "category", "재무관리"),
            Map.of("permissionCode", "USER_MANAGE", "permissionName", "사용자 관리", "category", "사용자관리")
        );
    }

    /**
     * 사용자 역할에 따라 관리 가능한 권한 필터링
     */
    private List<Map<String, Object>> filterManageablePermissions(String userRole, List<Map<String, Object>> allPermissions) {
        // 역할별 관리 가능한 권한 정의
        Map<String, List<String>> roleManageablePermissions = Map.of(
            "HQ_MASTER", List.of(
                "ADMIN_DASHBOARD_VIEW", "ALL_BRANCHES_VIEW", "APPROVAL_MANAGE", "BRANCH_DETAILS_VIEW",
                "BUDGET_MANAGE", "CLIENT_MANAGE", "CONSULTANT_MANAGE", "CONSULTATION_RECORD_VIEW",
                "CONSULTATION_STATISTICS_VIEW", "ERP_ACCESS", "FINANCIAL_VIEW", "INTEGRATED_FINANCE_VIEW",
                "ITEM_MANAGE", "MAPPING_MANAGE", "MAPPING_VIEW", "PURCHASE_REQUEST_VIEW", "REFUND_MANAGE",
                "SALARY_CALCULATE", "SALARY_MANAGE", "SALARY_VIEW", "SCHEDULE_CREATE", "SCHEDULE_DELETE",
                "SCHEDULE_MANAGE", "SCHEDULE_MODIFY", "STATISTICS_VIEW", "TAX_MANAGE", "USER_MANAGE"
            ),
            "SUPER_HQ_ADMIN", List.of(
                "ADMIN_DASHBOARD_VIEW", "ALL_BRANCHES_VIEW", "APPROVAL_MANAGE", "BRANCH_DETAILS_VIEW",
                "BUDGET_MANAGE", "CLIENT_MANAGE", "CONSULTANT_MANAGE", "CONSULTATION_RECORD_VIEW",
                "CONSULTATION_STATISTICS_VIEW", "ERP_ACCESS", "FINANCIAL_VIEW", "INTEGRATED_FINANCE_VIEW",
                "ITEM_MANAGE", "MAPPING_MANAGE", "MAPPING_VIEW", "PURCHASE_REQUEST_VIEW", "REFUND_MANAGE",
                "SALARY_CALCULATE", "SALARY_MANAGE", "SALARY_VIEW", "SCHEDULE_CREATE", "SCHEDULE_DELETE",
                "SCHEDULE_MANAGE", "SCHEDULE_MODIFY", "STATISTICS_VIEW", "TAX_MANAGE", "USER_MANAGE"
            ),
            "HQ_ADMIN", List.of(
                "ADMIN_DASHBOARD_VIEW", "ALL_BRANCHES_VIEW", "APPROVAL_MANAGE", "BRANCH_DETAILS_VIEW",
                "BUDGET_MANAGE", "CLIENT_MANAGE", "CONSULTANT_MANAGE", "CONSULTATION_RECORD_VIEW",
                "CONSULTATION_STATISTICS_VIEW", "ERP_ACCESS", "FINANCIAL_VIEW", "INTEGRATED_FINANCE_VIEW",
                "ITEM_MANAGE", "MAPPING_MANAGE", "MAPPING_VIEW", "PURCHASE_REQUEST_VIEW", "REFUND_MANAGE",
                "SALARY_CALCULATE", "SALARY_MANAGE", "SALARY_VIEW", "SCHEDULE_CREATE", "SCHEDULE_DELETE",
                "SCHEDULE_MANAGE", "SCHEDULE_MODIFY", "STATISTICS_VIEW", "TAX_MANAGE", "USER_MANAGE"
            ),
            "ADMIN", List.of(
                "ADMIN_DASHBOARD_VIEW", "ALL_BRANCHES_VIEW", "APPROVAL_MANAGE", "BRANCH_DETAILS_VIEW",
                "CLIENT_MANAGE", "CONSULTANT_MANAGE", "CONSULTATION_RECORD_VIEW", "CONSULTATION_STATISTICS_VIEW",
                "ERP_ACCESS", "FINANCIAL_VIEW", "INTEGRATED_FINANCE_VIEW", "ITEM_MANAGE", "MAPPING_MANAGE",
                "MAPPING_VIEW", "PURCHASE_REQUEST_VIEW", "REFUND_MANAGE", "SALARY_CALCULATE", "SALARY_MANAGE",
                "SALARY_VIEW", "SCHEDULE_CREATE", "SCHEDULE_DELETE", "SCHEDULE_MANAGE", "SCHEDULE_MODIFY",
                "STATISTICS_VIEW", "TAX_MANAGE", "USER_MANAGE"
            ),
            "BRANCH_SUPER_ADMIN", List.of(
                "CLIENT_MANAGE", "CONSULTANT_MANAGE", "MAPPING_VIEW", "MAPPING_MANAGE", "SCHEDULE_CREATE",
                "SCHEDULE_DELETE", "SCHEDULE_MANAGE", "SCHEDULE_MODIFY", "STATISTICS_VIEW", "SALARY_VIEW", 
                "USER_MANAGE", "ALL_BRANCHES_VIEW", "BRANCH_DETAILS_VIEW", "BRANCH_MANAGE", "ERP_ACCESS",
                "INTEGRATED_FINANCE_VIEW", "SALARY_MANAGE", "SALARY_CALCULATE", "FINANCIAL_VIEW"
            ),
            "BRANCH_ADMIN", List.of(
                "CLIENT_MANAGE", "CONSULTANT_MANAGE", "MAPPING_VIEW", "SCHEDULE_CREATE", "SCHEDULE_DELETE",
                "SCHEDULE_MANAGE", "SCHEDULE_MODIFY", "USER_MANAGE"
            )
        );

        List<String> manageablePermissionCodes = roleManageablePermissions.getOrDefault(userRole, List.of());
        
        return allPermissions.stream()
            .filter(permission -> manageablePermissionCodes.contains(permission.get("permissionCode")))
            .collect(Collectors.toList());
    }

    /**
     * 역할별 권한 설정
     */
    @PostMapping("/role-permissions")
    public ResponseEntity<?> setRolePermissions(@RequestBody Map<String, Object> request, HttpSession session) {
        try {
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "인증이 필요합니다."
                ));
            }
            
            // 권한 확인 (관리자만 가능)
            if (!dynamicPermissionService.hasPermission(currentUser, "USER_MANAGE")) {
                return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "권한이 없습니다."
                ));
            }
            
            String roleName = (String) request.get("roleName");
            @SuppressWarnings("unchecked")
            List<String> permissionCodes = (List<String>) request.get("permissionCodes");
            
            if (roleName == null || permissionCodes == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "roleName과 permissionCodes가 필요합니다."
                ));
            }
            
            // 역할 계층 구조에 따른 권한 변경 제한
            String currentUserRole = currentUser.getRole().name();
            boolean canManageRole = false;
            
            // HQ 마스터는 모든 역할 관리 가능
            if ("HQ_MASTER".equals(currentUserRole)) {
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
                return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "해당 역할의 권한을 변경할 권한이 없습니다."
                ));
            }
            
            // 역할별 권한 설정
            dynamicPermissionService.setRolePermissions(roleName, permissionCodes);
            
            log.info("✅ 역할별 권한 설정 완료: role={}, permissions={}, 설정자={}", 
                    roleName, permissionCodes.size(), currentUser.getRole());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "역할별 권한이 성공적으로 설정되었습니다.",
                "roleName", roleName,
                "permissionCount", permissionCodes.size()
            ));
            
        } catch (Exception e) {
            log.error("❌ 역할별 권한 설정 실패: error={}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "역할별 권한 설정에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}
