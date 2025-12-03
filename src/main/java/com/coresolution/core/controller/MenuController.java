package com.coresolution.core.controller;

import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.MenuDTO;
import com.coresolution.core.service.MenuService;
import com.coresolution.consultation.utils.SessionUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 메뉴 API
 * 
 * 사용자 역할에 따른 메뉴 조회
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-12-03
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/menus")
@RequiredArgsConstructor
@Tag(name = "Menu", description = "메뉴 관리 API")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@org.springframework.context.annotation.Primary
public class MenuController {

    private final MenuService menuService;

    @GetMapping("/user")
    @Operation(summary = "사용자 메뉴 조회", description = "현재 로그인한 사용자의 역할에 따른 메뉴를 조회합니다.")
    public ResponseEntity<ApiResponse<List<MenuDTO>>> getUserMenus(HttpSession session) {
        try {
            // 표준화된 방법으로 역할 조회
            String role = SessionUtils.getRoleName(session);
            
            if (role == null) {
                log.warn("세션에 역할 정보가 없습니다");
                role = "USER"; // 기본값
            }

            log.info("사용자 메뉴 조회: role={}", role);
            List<MenuDTO> menus = menuService.getMenusByRole(role);
            
            return ResponseEntity.ok(ApiResponse.success(menus));
        } catch (Exception e) {
            log.error("사용자 메뉴 조회 실패", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("메뉴 조회 중 오류가 발생했습니다."));
        }
    }

    @GetMapping("/admin")
    @Operation(summary = "관리자 전용 메뉴 조회", description = "관리자 전용 메뉴를 조회합니다. (ADMIN만 접근 가능)")
    public ResponseEntity<ApiResponse<List<MenuDTO>>> getAdminMenus(HttpSession session) {
        try {
            // 표준화된 방법으로 관리자 여부 확인
            if (!SessionUtils.isAdmin(session)) {
                String role = SessionUtils.getRoleName(session);
                log.warn("관리자 메뉴 접근 거부: role={}", role);
                return ResponseEntity.status(403)
                    .body(ApiResponse.error("관리자만 접근 가능합니다."));
            }

            log.info("관리자 메뉴 조회");
            List<MenuDTO> menus = menuService.getAdminMenus();
            
            return ResponseEntity.ok(ApiResponse.success(menus));
        } catch (Exception e) {
            log.error("관리자 메뉴 조회 실패", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("메뉴 조회 중 오류가 발생했습니다."));
        }
    }

    @GetMapping("/all")
    @Operation(summary = "전체 메뉴 조회", description = "모든 활성 메뉴를 조회합니다.")
    public ResponseEntity<ApiResponse<List<MenuDTO>>> getAllMenus() {
        try {
            log.info("전체 메뉴 조회");
            List<MenuDTO> menus = menuService.getAllActiveMenus();
            
            return ResponseEntity.ok(ApiResponse.success(menus));
        } catch (Exception e) {
            log.error("전체 메뉴 조회 실패", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("메뉴 조회 중 오류가 발생했습니다."));
        }
    }

    @GetMapping("/code/{menuCode}")
    @Operation(summary = "메뉴 코드로 조회", description = "메뉴 코드로 특정 메뉴를 조회합니다.")
    public ResponseEntity<ApiResponse<MenuDTO>> getMenuByCode(@PathVariable String menuCode) {
        try {
            log.info("메뉴 코드로 조회: menuCode={}", menuCode);
            MenuDTO menu = menuService.getMenuByCode(menuCode);
            
            return ResponseEntity.ok(ApiResponse.success(menu));
        } catch (IllegalArgumentException e) {
            log.warn("메뉴를 찾을 수 없음: menuCode={}", menuCode);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("메뉴 조회 실패", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("메뉴 조회 중 오류가 발생했습니다."));
        }
    }

    @GetMapping("/path")
    @Operation(summary = "메뉴 경로로 조회", description = "메뉴 경로로 특정 메뉴를 조회합니다.")
    public ResponseEntity<ApiResponse<MenuDTO>> getMenuByPath(@RequestParam String path) {
        try {
            log.info("메뉴 경로로 조회: path={}", path);
            MenuDTO menu = menuService.getMenuByPath(path);
            
            return ResponseEntity.ok(ApiResponse.success(menu));
        } catch (IllegalArgumentException e) {
            log.warn("메뉴를 찾을 수 없음: path={}", path);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("메뉴 조회 실패", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.error("메뉴 조회 중 오류가 발생했습니다."));
        }
    }
}

