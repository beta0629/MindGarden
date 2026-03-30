package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.MenuService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 메뉴 관리 컨트롤러
 * 권한별 동적 메뉴 조회 API 제공
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-14
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/menu") // 표준화 2025-12-05: 레거시 경로 제거
@RequiredArgsConstructor
public class ConsultationMenuController extends BaseApiController {
    
    private final MenuService menuService;
    private final DynamicPermissionService dynamicPermissionService;
    
    /**
     * 현재 사용자 권한에 따른 메뉴 구조 조회
     * 
     * @param session HTTP 세션
     * @return 권한별 메뉴 구조
     */
    @GetMapping("/structure")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMenuStructure(HttpSession session) {
        log.info("📋 사용자 메뉴 구조 조회");
        
        // 세션에서 사용자 정보 조회 (AuthController와 동일한 방식)
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.warn("❌ 인증되지 않은 사용자");
            throw new org.springframework.security.access.AccessDeniedException("인증이 필요합니다.");
        }
        
        // 사용자 역할별 메뉴 구조 조회
        Map<String, Object> menuStructure = menuService.getMenuStructureByRole(currentUser.getRole());
        
        log.info("✅ 메뉴 구조 조회 성공 - 역할: {}, 메뉴 수: {}", 
                currentUser.getRole(), 
                menuStructure.get("totalMenus"));
        
        return success("메뉴 구조 조회 성공", menuStructure);
    }
    
    /**
     * 현재 사용자 권한 정보 조회
     * 
     * <p><b>마이그레이션 완료:</b> SecurityUtils.getUserPermissions()에서 
     * DynamicPermissionService.getUserPermissions()로 변경되었습니다.</p>
     * 
     * @param session HTTP 세션
     * @return 사용자 권한 정보
     */
    @GetMapping("/permissions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserPermissions(HttpSession session) {
        log.info("🔒 사용자 권한 정보 조회");
        
        // 세션에서 사용자 정보 조회
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            log.warn("❌ 인증되지 않은 사용자");
            throw new org.springframework.security.access.AccessDeniedException("인증이 필요합니다.");
        }
        
        // DynamicPermissionService를 사용하여 동적 권한 정보 조회
        List<Map<String, Object>> userPermissions = dynamicPermissionService.getUserPermissions(currentUser);
        
        // 응답 형식 구성 (기존 SecurityUtils.getUserPermissions()와 호환되는 형식)
        Map<String, Object> permissions = new HashMap<>();
        permissions.put("authenticated", true);
        permissions.put("user", Map.of(
            "id", currentUser.getId(),
            "email", currentUser.getEmail(),
            "name", currentUser.getName(),
            "role", currentUser.getRole() != null ? currentUser.getRole().name() : "UNKNOWN",
            "branchCode", currentUser.getBranchCode() != null ? currentUser.getBranchCode() : ""
        ));
        permissions.put("permissions", userPermissions);
        permissions.put("totalPermissions", userPermissions.size());
        
        log.info("✅ 사용자 권한 정보 조회 성공 - 사용자: {}, 권한 수: {}", 
                currentUser.getEmail(), userPermissions.size());
        
        return success("사용자 권한 정보 조회 성공", permissions);
    }
    
    /**
     * 공통 메뉴 조회 (모든 역할에서 공통으로 사용)
     * 
     * @return 공통 메뉴 목록
     */
    @GetMapping("/common")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCommonMenus() {
        log.info("📋 공통 메뉴 조회");
        
        List<Map<String, Object>> commonMenus = menuService.getCommonMenus();
        
        log.info("✅ 공통 메뉴 조회 성공 - 메뉴 수: {}", commonMenus.size());
        
        return success("공통 메뉴 조회 성공", commonMenus);
    }
    
    /**
     * 특정 역할의 메뉴 조회
     * 
     * @param session HTTP 세션
     * @return 역할별 메뉴 목록
     */
    @GetMapping("/by-role")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMenusByRole(HttpSession session) {
        log.info("📋 역할별 메뉴 조회");
        
        // 세션에서 사용자 정보 조회
        User currentUser = (User) session.getAttribute("user");
        if (currentUser == null) {
            log.warn("❌ 인증되지 않은 사용자");
            throw new org.springframework.security.access.AccessDeniedException("인증이 필요합니다.");
        }
        
        List<Map<String, Object>> roleMenus = menuService.getMenusByRole(currentUser.getRole());
        
        log.info("✅ 역할별 메뉴 조회 성공 - 역할: {}, 메뉴 수: {}", 
                currentUser.getRole(), roleMenus.size());
        
        Map<String, Object> data = new HashMap<>();
        data.put("menus", roleMenus);
        data.put("role", currentUser.getRole().name());
        
        return success("역할별 메뉴 조회 성공", data);
    }
    
    /**
     * 메뉴 권한 확인
     * 
     * @param menuId 메뉴 ID
     * @param session HTTP 세션
     * @return 메뉴 접근 권한 여부
     */
    @GetMapping("/check-permission")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkMenuPermission(@RequestParam String menuId, HttpSession session) {
        log.info("🔒 메뉴 권한 확인: {}", menuId);
        
        // 세션에서 사용자 정보 조회
        User currentUser = (User) session.getAttribute("user");
        if (currentUser == null) {
            log.warn("❌ 인증되지 않은 사용자");
            throw new org.springframework.security.access.AccessDeniedException("인증이 필요합니다.");
        }
        
        boolean hasPermission = menuService.hasMenuPermission(currentUser.getRole(), menuId);
        
        log.info("✅ 메뉴 권한 확인 완료 - 역할: {}, 메뉴: {}, 권한: {}", 
                currentUser.getRole(), menuId, hasPermission);
        
        Map<String, Object> data = Map.of(
            "hasPermission", hasPermission,
            "menuId", menuId,
            "role", currentUser.getRole().name()
        );
        
        return success("메뉴 권한 확인 완료", data);
    }
}
