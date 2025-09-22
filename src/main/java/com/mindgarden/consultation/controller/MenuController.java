package com.mindgarden.consultation.controller;

import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.service.MenuService;
import com.mindgarden.consultation.util.SecurityUtils;
import com.mindgarden.consultation.utils.SessionUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {
    
    private final MenuService menuService;
    
    /**
     * 현재 사용자 권한에 따른 메뉴 구조 조회
     * 
     * @param session HTTP 세션
     * @return 권한별 메뉴 구조
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/structure")
    public ResponseEntity<?> getMenuStructure(HttpSession session) {
        try {
            log.info("📋 사용자 메뉴 구조 조회");
            
            // 세션에서 사용자 정보 조회 (AuthController와 동일한 방식)
            User currentUser = SessionUtils.getCurrentUser(session);
            if (currentUser == null) {
                log.warn("❌ 인증되지 않은 사용자");
                return ResponseEntity.status(401)
                    .body(Map.of("success", false, "message", "인증이 필요합니다."));
            }
            
            // 사용자 역할별 메뉴 구조 조회
            Map<String, Object> menuStructure = menuService.getMenuStructureByRole(currentUser.getRole());
            
            log.info("✅ 메뉴 구조 조회 성공 - 역할: {}, 메뉴 수: {}", 
                    currentUser.getRole(), 
                    menuStructure.get("totalMenus"));
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", menuStructure,
                "message", "메뉴 구조 조회 성공"
            ));
            
        } catch (Exception e) {
            log.error("❌ 메뉴 구조 조회 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("success", false, "message", "메뉴 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 현재 사용자 권한 정보 조회
     * 
     * @param session HTTP 세션
     * @return 사용자 권한 정보
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/permissions")
    public ResponseEntity<?> getUserPermissions(HttpSession session) {
        try {
            log.info("🔒 사용자 권한 정보 조회");
            
            Map<String, Object> permissions = SecurityUtils.getUserPermissions(session);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", permissions,
                "message", "사용자 권한 정보 조회 성공"
            ));
            
        } catch (Exception e) {
            log.error("❌ 사용자 권한 정보 조회 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("success", false, "message", "권한 정보 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 공통 메뉴 조회 (모든 역할에서 공통으로 사용)
     * 
     * @return 공통 메뉴 목록
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/common")
    public ResponseEntity<?> getCommonMenus() {
        try {
            log.info("📋 공통 메뉴 조회");
            
            List<Map<String, Object>> commonMenus = menuService.getCommonMenus();
            
            log.info("✅ 공통 메뉴 조회 성공 - 메뉴 수: {}", commonMenus.size());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", commonMenus,
                "message", "공통 메뉴 조회 성공"
            ));
            
        } catch (Exception e) {
            log.error("❌ 공통 메뉴 조회 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("success", false, "message", "공통 메뉴 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 특정 역할의 메뉴 조회
     * 
     * @param session HTTP 세션
     * @return 역할별 메뉴 목록
     */
    @GetMapping("/by-role")
    public ResponseEntity<?> getMenusByRole(HttpSession session) {
        try {
            log.info("📋 역할별 메뉴 조회");
            
            // 세션에서 사용자 정보 조회
            User currentUser = (User) session.getAttribute("user");
            if (currentUser == null) {
                log.warn("❌ 인증되지 않은 사용자");
                return ResponseEntity.status(401)
                    .body(Map.of("success", false, "message", "인증이 필요합니다."));
            }
            
            List<Map<String, Object>> roleMenus = menuService.getMenusByRole(currentUser.getRole());
            
            log.info("✅ 역할별 메뉴 조회 성공 - 역할: {}, 메뉴 수: {}", 
                    currentUser.getRole(), roleMenus.size());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", roleMenus,
                "role", currentUser.getRole().name(),
                "message", "역할별 메뉴 조회 성공"
            ));
            
        } catch (Exception e) {
            log.error("❌ 역할별 메뉴 조회 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("success", false, "message", "역할별 메뉴 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 메뉴 권한 확인
     * 
     * @param menuId 메뉴 ID
     * @param session HTTP 세션
     * @return 메뉴 접근 권한 여부
     */
    @GetMapping("/check-permission")
    public ResponseEntity<?> checkMenuPermission(String menuId, HttpSession session) {
        try {
            log.info("🔒 메뉴 권한 확인: {}", menuId);
            
            // 세션에서 사용자 정보 조회
            User currentUser = (User) session.getAttribute("user");
            if (currentUser == null) {
                log.warn("❌ 인증되지 않은 사용자");
                return ResponseEntity.status(401)
                    .body(Map.of("success", false, "message", "인증이 필요합니다."));
            }
            
            boolean hasPermission = menuService.hasMenuPermission(currentUser.getRole(), menuId);
            
            log.info("✅ 메뉴 권한 확인 완료 - 역할: {}, 메뉴: {}, 권한: {}", 
                    currentUser.getRole(), menuId, hasPermission);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "hasPermission", hasPermission,
                "menuId", menuId,
                "role", currentUser.getRole().name(),
                "message", "메뉴 권한 확인 완료"
            ));
            
        } catch (Exception e) {
            log.error("❌ 메뉴 권한 확인 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("success", false, "message", "메뉴 권한 확인 중 오류가 발생했습니다."));
        }
    }
}
