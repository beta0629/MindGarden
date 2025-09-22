package com.mindgarden.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.CommonCodeService;
import com.mindgarden.consultation.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
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
@RequestMapping("/api/hq/branch-management")
@RequiredArgsConstructor
// @PreAuthorize("hasRole('HQ_MASTER') or hasRole('SUPER_HQ_ADMIN') or hasRole('HQ_ADMIN') or hasRole('ADMIN')")
public class BranchManagementController {
    
    private final CommonCodeService commonCodeService;
    private final UserService userService;
    
    /**
     * 지점 목록 조회 (공통코드 기반)
     */
    @GetMapping("/branches")
    public ResponseEntity<Map<String, Object>> getBranches() {
        try {
            log.info("지점 목록 조회 요청");
            
            List<CommonCode> branchCodes = commonCodeService.getActiveCommonCodesByGroup("BRANCH");
            List<Map<String, Object>> branches = branchCodes.stream()
                .map(this::convertBranchToMap)
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
     * 지점별 사용자 통계 조회
     */
    @GetMapping("/branches/{branchCode}/statistics")
    public ResponseEntity<Map<String, Object>> getBranchStatistics(@PathVariable String branchCode) {
        try {
            log.info("지점 통계 조회 요청: branchCode={}", branchCode);
            
            // 지점 코드 유효성 검사
            if (!isValidBranchCode(branchCode)) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "유효하지 않은 지점 코드입니다.");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // 지점별 사용자 통계 계산
            List<User> branchUsers = userService.findByBranchCode(branchCode);
            
            // 관리자 역할 목록 (지점별로 다름)
            Set<String> adminRoles = Set.of("ADMIN", "HQ_ADMIN", "SUPER_HQ_ADMIN", "HQ_MASTER", "HQ_SUPER_ADMIN");
            
            // 활성 사용자만 필터링
            List<User> activeUsers = branchUsers.stream()
                    .filter(u -> !u.getIsDeleted())
                    .collect(Collectors.toList());
            
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("branchCode", branchCode);
            statistics.put("totalUsers", activeUsers.size());
            statistics.put("clients", activeUsers.stream().filter(u -> u.getRole().name().equals("CLIENT")).count());
            statistics.put("consultants", activeUsers.stream().filter(u -> u.getRole().name().equals("CONSULTANT")).count());
            statistics.put("admins", activeUsers.stream().filter(u -> adminRoles.contains(u.getRole().name())).count());
            statistics.put("activeUsers", activeUsers.size());
            statistics.put("inactiveUsers", branchUsers.stream().filter(u -> u.getIsDeleted()).count());
            
            log.info("지점 통계 조회 완료: branchCode={}, activeUsers={}, totalUsers={}", branchCode, activeUsers.size(), branchUsers.size());
            return ResponseEntity.ok(statistics);
            
        } catch (Exception e) {
            log.error("지점 통계 조회 중 오류 발생: branchCode={}, error={}", branchCode, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "통계 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 지점별 사용자 목록 조회
     */
    @GetMapping("/branches/{branchCode}/users")
    public ResponseEntity<Map<String, Object>> getBranchUsers(
            @PathVariable String branchCode,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "includeInactive", defaultValue = "false") boolean includeInactive) {
        try {
            log.info("지점 사용자 목록 조회 요청: branchCode={}, role={}, includeInactive={}", branchCode, role, includeInactive);
            
            // 지점 코드 유효성 검사
            if (!isValidBranchCode(branchCode)) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "유효하지 않은 지점 코드입니다.");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // 지점별 사용자 조회
            List<User> branchUsers = userService.findByBranchCode(branchCode);
            
            // 역할별 필터링
            if (role != null && !role.trim().isEmpty()) {
                branchUsers = branchUsers.stream()
                    .filter(u -> u.getRole().name().equals(role))
                    .collect(Collectors.toList());
            }
            
            // 비활성 사용자 필터링
            if (!includeInactive) {
                branchUsers = branchUsers.stream()
                    .filter(u -> !u.getIsDeleted())
                    .collect(Collectors.toList());
            }
            
            // 사용자 정보를 안전한 형태로 변환
            List<Map<String, Object>> users = branchUsers.stream()
                .map(this::convertUserToMap)
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("branchCode", branchCode);
            response.put("users", users);
            response.put("totalCount", users.size());
            
            log.info("지점 사용자 목록 조회 완료: branchCode={}, count={}", branchCode, users.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("지점 사용자 목록 조회 중 오류 발생: branchCode={}, error={}", branchCode, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "사용자 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 사용자 지점 이동 (일괄 처리)
     */
    @PutMapping("/users/bulk-transfer")
    public ResponseEntity<Map<String, Object>> bulkTransferUsers(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Object> userIdsRaw = (List<Object>) request.get("userIds");
            List<Long> userIds = userIdsRaw.stream()
                .map(id -> Long.valueOf(id.toString()))
                .collect(Collectors.toList());
            String targetBranchCode = (String) request.get("targetBranchCode");
            String reason = (String) request.get("reason");
            
            log.info("사용자 일괄 지점 이동 요청: userIds={}, targetBranchCode={}, reason={}", 
                    userIds, targetBranchCode, reason);
            
            if (userIds == null || userIds.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "이동할 사용자를 선택해주세요.");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            if (targetBranchCode == null || targetBranchCode.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "대상 지점을 선택해주세요.");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // 지점 코드 유효성 검사
            if (!isValidBranchCode(targetBranchCode)) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "유효하지 않은 대상 지점 코드입니다.");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // 사용자 일괄 이동 처리
            int successCount = 0;
            int failCount = 0;
            StringBuilder errorMessages = new StringBuilder();
            
            for (Long userId : userIds) {
                try {
                    User user = userService.findActiveByIdOrThrow(userId);
                    String oldBranchCode = user.getBranchCode();
                    
                    user.setBranchCode(targetBranchCode);
                    user.setUpdatedAt(java.time.LocalDateTime.now());
                    user.setVersion(user.getVersion() + 1);
                    
                    userService.getRepository().save(user);
                    successCount++;
                    
                    log.info("사용자 지점 이동 완료: userId={}, {} -> {}", userId, oldBranchCode, targetBranchCode);
                    
                } catch (Exception e) {
                    failCount++;
                    errorMessages.append("사용자 ID ").append(userId).append(": ").append(e.getMessage()).append("; ");
                    log.error("사용자 지점 이동 실패: userId={}, error={}", userId, e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", String.format("이동 완료: 성공 %d명, 실패 %d명", successCount, failCount));
            response.put("successCount", successCount);
            response.put("failCount", failCount);
            if (failCount > 0) {
                response.put("errors", errorMessages.toString());
            }
            
            log.info("사용자 일괄 지점 이동 완료: 성공={}, 실패={}", successCount, failCount);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("사용자 일괄 지점 이동 중 오류 발생: error={}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "일괄 이동 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    // ==================== Private Helper Methods ====================
    
    /**
     * 지점 코드를 Map으로 변환
     */
    private Map<String, Object> convertBranchToMap(CommonCode branchCode) {
        Map<String, Object> branchMap = new HashMap<>();
        branchMap.put("id", branchCode.getId());
        branchMap.put("code", branchCode.getCodeValue());
        branchMap.put("name", branchCode.getCodeLabel());
        branchMap.put("description", branchCode.getCodeDescription());
        branchMap.put("isActive", !branchCode.getIsDeleted());
        return branchMap;
    }
    
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
     * 지점 코드 유효성 검사
     */
    private boolean isValidBranchCode(String branchCode) {
        if (branchCode == null || branchCode.trim().isEmpty()) {
            return false;
        }
        
        try {
            List<CommonCode> branchCodes = commonCodeService.getActiveCommonCodesByGroup("BRANCH");
            return branchCodes.stream()
                .anyMatch(code -> code.getCodeValue().equals(branchCode));
        } catch (Exception e) {
            log.error("지점 코드 유효성 검사 중 오류: {}", e.getMessage());
            return false;
        }
    }
}
