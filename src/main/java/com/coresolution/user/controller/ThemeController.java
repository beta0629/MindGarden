/**
 * 사용자 테마 설정 API 컨트롤러
 * 동적 테마 시스템을 위한 백엔드 API
 */

package com.coresolution.user.controller;

import java.util.Map;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.user.dto.ThemeResponse;
import com.coresolution.user.dto.ThemeUpdateRequest;
import com.coresolution.user.service.ThemeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 사용자 테마 설정 API 컨트롤러
 * 표준화 완료: BaseApiController 상속, ApiResponse 사용, GlobalExceptionHandler에 위임
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-27
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/user", "/api/user"})
@RequiredArgsConstructor
public class ThemeController extends BaseApiController {

    private final ThemeService themeService;

    /**
     * 사용자 테마 설정 조회
     */
    @GetMapping("/theme")
    public ResponseEntity<ApiResponse<ThemeResponse>> getUserTheme(Authentication authentication) {
        log.debug("사용자 테마 설정 조회 요청: username={}", authentication.getName());
        
        String username = authentication.getName();
        ThemeResponse theme = themeService.getUserTheme(username);
        
        return success(theme);
    }

    /**
     * 사용자 테마 설정 업데이트
     */
    @PutMapping("/theme")
    public ResponseEntity<ApiResponse<ThemeResponse>> updateUserTheme(
            @Valid @RequestBody ThemeUpdateRequest request,
            Authentication authentication) {
        log.debug("사용자 테마 설정 업데이트 요청: username={}, theme={}", 
            authentication.getName(), request.getThemePreference());
        
        String username = authentication.getName();
        ThemeResponse updatedTheme = themeService.updateUserTheme(username, request);
        
        return updated(updatedTheme);
    }

    /**
     * 사용자 테마 설정 초기화
     */
    @DeleteMapping("/theme")
    public ResponseEntity<ApiResponse<ThemeResponse>> resetUserTheme(Authentication authentication) {
        log.debug("사용자 테마 설정 초기화 요청: username={}", authentication.getName());
        
        String username = authentication.getName();
        ThemeResponse resetTheme = themeService.resetUserTheme(username);
        
        return success("테마가 초기화되었습니다.", resetTheme);
    }

    /**
     * 사용자 역할별 기본 테마 조회
     */
    @GetMapping("/theme/default")
    public ResponseEntity<ApiResponse<ThemeResponse>> getDefaultThemeByRole(Authentication authentication) {
        log.debug("사용자 역할별 기본 테마 조회 요청: username={}", authentication.getName());
        
        String username = authentication.getName();
        ThemeResponse defaultTheme = themeService.getDefaultThemeByRole(username);
        
        return success(defaultTheme);
    }

    /**
     * 사용 가능한 테마 목록 조회
     */
    @GetMapping("/themes/available")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAvailableThemes() {
        log.debug("사용 가능한 테마 목록 조회 요청");
        
        Map<String, Object> availableThemes = themeService.getAvailableThemes();
        
        return success(availableThemes);
    }

    /**
     * 테마 미리보기 (임시 적용)
     */
    @PostMapping("/theme/preview")
    public ResponseEntity<ApiResponse<ThemeResponse>> previewTheme(
            @Valid @RequestBody ThemeUpdateRequest request,
            Authentication authentication) {
        log.debug("테마 미리보기 요청: username={}, theme={}", 
            authentication.getName(), request.getThemePreference());
        
        String username = authentication.getName();
        ThemeResponse previewTheme = themeService.previewTheme(username, request);
        
        return success(previewTheme);
    }

    /**
     * 테마 미리보기 취소
     */
    @DeleteMapping("/theme/preview")
    public ResponseEntity<ApiResponse<ThemeResponse>> cancelThemePreview(Authentication authentication) {
        log.debug("테마 미리보기 취소 요청: username={}", authentication.getName());
        
        String username = authentication.getName();
        ThemeResponse originalTheme = themeService.cancelThemePreview(username);
        
        return success("테마 미리보기가 취소되었습니다.", originalTheme);
    }
}
