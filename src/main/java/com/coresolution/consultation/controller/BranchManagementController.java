package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.BranchResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 본사 지점 관리 컨트롤러
 * 컴포넌트화된 지점 관리 및 사용자 지점 이동 기능
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/hq/branch-management") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
// 표준화 2025-12-05: 표준 관리자 역할만 사용 (ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER)
// @PreAuthorize("hasRole('ADMIN') or hasRole('TENANT_ADMIN') or hasRole('PRINCIPAL') or hasRole('OWNER')")
public class BranchManagementController {
    
    private final UserService userService;
    private final UserRepository userRepository;
    private final BranchService branchService;
    private final DynamicPermissionService dynamicPermissionService;
    
    /**
     * 지점 목록 조회 (branches 테이블 기반)
     */
    @GetMapping("/branches")
    public ResponseEntity<Map<String, Object>> getBranches(HttpSession session) {
        try {
            log.info("지점 목록 조회 요청 (branches 테이블 기반)");
            
            // 권한 체크
            User currentUser = (User) session.getAttribute("user");
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다.",
                    "redirectToLogin", true
                ));
            }
            
            // HQ 권한 체크
            if (!dynamicPermissionService.hasPermission(currentUser, "HQ_BRANCH_VIEW")) {
                return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "지점 조회 권한이 없습니다."
                ));
            }
            
            // branches 테이블에서 지점 목록 조회
            List<BranchResponse> branchResponses = branchService.getAllActiveBranches();
            List<Map<String, Object>> branches = branchResponses.stream()
                .map(this::convertBranchResponseToMap)
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", branches);
            response.put("totalCount", branches.size());
            
            log.info("지점 목록 조회 완료: {}개", branches.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("지점 목록 조회 중 오류 발생: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "지점 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 테넌트별 사용자 통계 조회
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    @GetMapping("/branches/{branchCode}/statistics")
    public ResponseEntity<Map<String, Object>> getBranchStatistics(@PathVariable String branchCode, HttpSession session) {
        try {
            log.info("테넌트 통계 조회 요청: branchCode={} (무시됨)", branchCode);
            
            // 권한 체크
            User currentUser = (User) session.getAttribute("user");
            if (currentUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "로그인이 필요합니다.",
                    "redirectToLogin", true
                ));
            }
            
            // HQ 권한 체크
            if (!dynamicPermissionService.hasPermission(currentUser, "HQ_STATISTICS_VIEW")) {
                return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "통계 조회 권한이 없습니다."
                ));
            }
            
            // 표준화 2025-12-07: 브랜치 개념 제거됨, tenantId 기반 조회
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "테넌트 정보를 찾을 수 없습니다.");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // 테넌트 전체 사용자 통계 계산 - 강제로 활성 사용자만 필터링
            List<User> allUsers = userRepository.findByTenantId(tenantId);
            List<User> activeUsers = allUsers.stream()
                    .filter(u -> !u.getIsDeleted())
                    .collect(Collectors.toList());
            
            log.info("테넌트 {} 사용자 조회: 전체={}, 활성={}", tenantId, allUsers.size(), activeUsers.size());
            
            // 역할별 상세 카운트 로그
            Map<String, Long> roleCount = activeUsers.stream()
                    .collect(Collectors.groupingBy(u -> u.getRole().name(), Collectors.counting()));
            log.info("테넌트 {} 역할별 카운트: {}", tenantId, roleCount);
            
            // 관리자 역할 목록 (표준화 2025-12-05: enum 활용)
            Set<String> adminRoles = java.util.Arrays.stream(UserRole.getAdminRoles())
                    .map(UserRole::name)
                    .collect(java.util.stream.Collectors.toSet());
            
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("tenantId", tenantId);
            statistics.put("totalUsers", activeUsers.size());
            statistics.put("clients", activeUsers.stream().filter(u -> u.getRole() == com.coresolution.consultation.constant.UserRole.CLIENT).count());
            statistics.put("consultants", activeUsers.stream().filter(u -> u.getRole() == com.coresolution.consultation.constant.UserRole.CONSULTANT).count());
            statistics.put("admins", activeUsers.stream().filter(u -> adminRoles.contains(u.getRole().name())).count());
            statistics.put("activeUsers", activeUsers.size());
            statistics.put("inactiveUsers", allUsers.size() - activeUsers.size());
            
            log.info("테넌트 통계 조회 완료: tenantId={}, activeUsers={}", tenantId, activeUsers.size());
            return ResponseEntity.ok(statistics);
            
        } catch (Exception e) {
            log.error("테넌트 통계 조회 중 오류 발생: branchCode={}, error={}", branchCode, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "통계 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 테넌트별 사용자 목록 조회
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    @GetMapping("/branches/{branchCode}/users")
    public ResponseEntity<Map<String, Object>> getBranchUsers(
            @PathVariable String branchCode,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "includeInactive", defaultValue = "false") boolean includeInactive) {
        try {
            log.info("테넌트 사용자 목록 조회 요청: branchCode={} (무시됨), role={}, includeInactive={}", branchCode, role, includeInactive);
            
            // 표준화 2025-12-07: 브랜치 개념 제거됨, tenantId 기반 조회
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "테넌트 정보를 찾을 수 없습니다.");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // 테넌트 전체 사용자 조회
            List<User> users = userRepository.findByTenantId(tenantId);
            
            // 역할별 필터링
            if (role != null && !role.trim().isEmpty()) {
                users = users.stream()
                    .filter(u -> u.getRole().name().equals(role))
                    .collect(Collectors.toList());
            }
            
            // 비활성 사용자 필터링
            if (!includeInactive) {
                users = users.stream()
                    .filter(u -> !u.getIsDeleted())
                    .collect(Collectors.toList());
            }
            
            // 사용자 정보를 안전한 형태로 변환
            List<Map<String, Object>> userList = users.stream()
                .map(this::convertUserToMap)
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("tenantId", tenantId);
            response.put("users", userList);
            response.put("totalCount", userList.size());
            
            log.info("테넌트 사용자 목록 조회 완료: tenantId={}, count={}", tenantId, userList.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("테넌트 사용자 목록 조회 중 오류 발생: branchCode={}, error={}", branchCode, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "사용자 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 사용자 지점 이동 (일괄 처리)
     * 표준화 2025-12-06: branchCode는 더 이상 사용하지 않음, 이 메서드는 Deprecated 처리
     */
    @PutMapping("/users/bulk-transfer")
    @Deprecated
    public ResponseEntity<Map<String, Object>> bulkTransferUsers(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Object> userIdsRaw = (List<Object>) request.get("userIds");
            List<Long> userIds = userIdsRaw.stream()
                .map(id -> Long.valueOf(id.toString()))
                .collect(Collectors.toList());
            String targetBranchCode = (String) request.get("targetBranchCode");
            String reason = (String) request.get("reason");
            
            log.warn("⚠️ Deprecated API 호출: 사용자 일괄 지점 이동 - branchCode는 더 이상 사용되지 않음. userIds={}, targetBranchCode={} (무시됨), reason={}", 
                    userIds, targetBranchCode, reason);
            
            if (userIds == null || userIds.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "이동할 사용자를 선택해주세요.");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // 표준화 2025-12-06: branchCode 무시, tenantId 기반으로만 동작
            String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
            if (tenantId == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "테넌트 정보를 찾을 수 없습니다.");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // 사용자 일괄 처리 (branchCode 변경 없이, tenantId만 확인)
            int successCount = 0;
            int failCount = 0;
            StringBuilder errorMessages = new StringBuilder();
            
            for (Long userId : userIds) {
                try {
                    User user = userService.findActiveByIdOrThrow(userId);
                    
                    // 표준화 2025-12-06: branchCode는 변경하지 않음 (더 이상 사용하지 않음)
                    // 사용자가 같은 tenantId에 속해 있는지만 확인
                    if (!tenantId.equals(user.getTenantId())) {
                        failCount++;
                        errorMessages.append("사용자 ID ").append(userId).append(": 다른 테넌트에 속한 사용자입니다.; ");
                        log.warn("사용자 테넌트 불일치: userId={}, userTenantId={}, currentTenantId={}", userId, user.getTenantId(), tenantId);
                        continue;
                    }
                    
                    user.setUpdatedAt(java.time.LocalDateTime.now());
                    user.setVersion(user.getVersion() + 1);
                    
                    userService.getRepository().save(user);
                    successCount++;
                    
                    log.info("사용자 처리 완료: userId={}, tenantId={}", userId, tenantId);
                    
                } catch (Exception e) {
                    failCount++;
                    errorMessages.append("사용자 ID ").append(userId).append(": ").append(e.getMessage()).append("; ");
                    log.error("사용자 처리 실패: userId={}, error={}", userId, e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", String.format("처리 완료: 성공 %d명, 실패 %d명 (branchCode는 더 이상 사용되지 않음)", successCount, failCount));
            response.put("successCount", successCount);
            response.put("failCount", failCount);
            if (failCount > 0) {
                response.put("errors", errorMessages.toString());
            }
            
            log.info("사용자 일괄 처리 완료: 성공={}, 실패={}", successCount, failCount);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("사용자 일괄 처리 중 오류 발생: error={}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "일괄 처리 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    // ==================== Private Helper Methods ====================
    
    
    /**
     * 사용자를 안전한 Map으로 변환
     */
    private Map<String, Object> convertUserToMap(User user) {
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("name", user.getName() != null ? user.getName() : "");
        userMap.put("email", user.getEmail() != null ? user.getEmail() : "");
        userMap.put("phone", user.getPhone() != null ? user.getPhone() : "");
        userMap.put("role", user.getRole() != null ? user.getRole().name() : "");
        userMap.put("roleDisplayName", user.getRole() != null ? user.getRole().getDisplayName() : "");
        userMap.put("branchCode", user.getBranchCode() != null ? user.getBranchCode() : "");
        userMap.put("isActive", !user.getIsDeleted());
        userMap.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");
        return userMap;
    }
    
    /**
     * BranchResponse를 Map으로 변환
     */
    private Map<String, Object> convertBranchResponseToMap(BranchResponse branch) {
        Map<String, Object> branchMap = new HashMap<>();
        branchMap.put("id", branch.getId());
        branchMap.put("branchName", branch.getBranchName());
        branchMap.put("branchCode", branch.getBranchCode());
        branchMap.put("branchType", branch.getBranchType());
        branchMap.put("branchStatus", branch.getBranchStatus());
        branchMap.put("address", branch.getAddress());
        branchMap.put("phoneNumber", branch.getPhoneNumber());
        branchMap.put("email", branch.getEmail());
        branchMap.put("isActive", branch.getIsActive());
        return branchMap;
    }
    
    /**
     * 지점 코드 유효성 검사 (branches 테이블 기반)
     * 표준화 2025-12-06: Deprecated - branchCode는 더 이상 사용하지 않음
     */
    @Deprecated
    private boolean isValidBranchCode(String branchCode) {
        // 표준화 2025-12-06: branchCode는 더 이상 사용하지 않으므로 항상 false 반환
        log.warn("⚠️ Deprecated 메서드 호출: isValidBranchCode - branchCode는 더 이상 사용되지 않음. branchCode={}", branchCode);
        return false;
    }
}
