/**
 * 사용자 테마 설정 API 컨트롤러
 * 동적 테마 시스템을 위한 백엔드 API
 */

package com.mindgarden.user.controller;

import com.mindgarden.user.dto.ThemeResponse;
import com.mindgarden.user.dto.ThemeUpdateRequest;
import com.mindgarden.user.service.ThemeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

/**
 * 사용자 테마 설정 API 컨트롤러
 */
@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class ThemeController {

    @Autowired
    private ThemeService themeService;

    /**
     * 사용자 테마 설정 조회
     */
    @GetMapping("/theme")
    public ResponseEntity<ThemeResponse> getUserTheme(Authentication authentication) {
        try {
            String username = authentication.getName();
            ThemeResponse theme = themeService.getUserTheme(username);
            
            return ResponseEntity.ok(theme);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 사용자 테마 설정 업데이트
     */
    @PutMapping("/theme")
    public ResponseEntity<ThemeResponse> updateUserTheme(
            @Valid @RequestBody ThemeUpdateRequest request,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            ThemeResponse updatedTheme = themeService.updateUserTheme(username, request);
            
            return ResponseEntity.ok(updatedTheme);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 사용자 테마 설정 초기화
     */
    @DeleteMapping("/theme")
    public ResponseEntity<ThemeResponse> resetUserTheme(Authentication authentication) {
        try {
            String username = authentication.getName();
            ThemeResponse resetTheme = themeService.resetUserTheme(username);
            
            return ResponseEntity.ok(resetTheme);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 사용자 역할별 기본 테마 조회
     */
    @GetMapping("/theme/default")
    public ResponseEntity<ThemeResponse> getDefaultThemeByRole(Authentication authentication) {
        try {
            String username = authentication.getName();
            ThemeResponse defaultTheme = themeService.getDefaultThemeByRole(username);
            
            return ResponseEntity.ok(defaultTheme);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 사용 가능한 테마 목록 조회
     */
    @GetMapping("/themes/available")
    public ResponseEntity<Object> getAvailableThemes() {
        try {
            Object availableThemes = themeService.getAvailableThemes();
            
            return ResponseEntity.ok(availableThemes);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 테마 미리보기 (임시 적용)
     */
    @PostMapping("/theme/preview")
    public ResponseEntity<ThemeResponse> previewTheme(
            @Valid @RequestBody ThemeUpdateRequest request,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            ThemeResponse previewTheme = themeService.previewTheme(username, request);
            
            return ResponseEntity.ok(previewTheme);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 테마 미리보기 취소
     */
    @DeleteMapping("/theme/preview")
    public ResponseEntity<ThemeResponse> cancelThemePreview(Authentication authentication) {
        try {
            String username = authentication.getName();
            ThemeResponse originalTheme = themeService.cancelThemePreview(username);
            
            return ResponseEntity.ok(originalTheme);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
