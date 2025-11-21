package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.entity.CssColorSettings;
import com.coresolution.consultation.entity.CssThemeMetadata;
import com.coresolution.consultation.service.CssThemeService;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * CSS 테마 관리 컨트롤러
 * 테마별 색상 설정을 관리하는 REST API
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@RestController
@RequestMapping({"/api/v1/admin/css-themes", "/api/admin/css-themes"}) // v1 경로 추가, 레거시 경로 유지
@RequiredArgsConstructor
@Slf4j
public class CssThemeController extends BaseApiController {

    private final CssThemeService cssThemeService;

    /**
     * 모든 활성화된 테마 목록 조회
     */
    @GetMapping("/themes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllActiveThemes() {
        log.info("🎨 활성화된 CSS 테마 목록 조회");
        List<CssThemeMetadata> themes = cssThemeService.getAllActiveThemes();
        
        Map<String, Object> data = new HashMap<>();
        data.put("themes", themes);
        data.put("count", themes.size());
        
        return success("테마 목록을 성공적으로 조회했습니다.", data);
    }

    /**
     * 기본 테마 조회
     */
    @GetMapping("/themes/default")
    public ResponseEntity<ApiResponse<CssThemeMetadata>> getDefaultTheme() {
        log.info("🎨 기본 CSS 테마 조회");
        Optional<CssThemeMetadata> defaultTheme = cssThemeService.getDefaultTheme();
        
        if (defaultTheme.isPresent()) {
            return success("기본 테마를 성공적으로 조회했습니다.", defaultTheme.get());
        } else {
            throw new RuntimeException("기본 테마를 찾을 수 없습니다.");
        }
    }

    /**
     * 특정 테마의 색상 설정 조회
     */
    @GetMapping("/themes/{themeName}/colors")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getThemeColors(@PathVariable String themeName) {
        log.info("🎨 테마 색상 설정 조회: {}", themeName);
        
        if (!cssThemeService.isThemeExists(themeName)) {
            throw new RuntimeException("테마를 찾을 수 없습니다.");
        }
        
        Map<String, String> colors = cssThemeService.getThemeColors(themeName);
        
        Map<String, Object> data = new HashMap<>();
        data.put("themeName", themeName);
        data.put("colors", colors);
        data.put("count", colors.size());
        
        return success("테마 색상을 성공적으로 조회했습니다.", data);
    }

    /**
     * 특정 테마의 특정 색상 값 조회
     */
    @GetMapping("/themes/{themeName}/colors/{colorKey}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getThemeColor(
            @PathVariable String themeName,
            @PathVariable String colorKey) {
        log.info("🎨 특정 테마 색상 조회: {} - {}", themeName, colorKey);
        
        if (!cssThemeService.isThemeExists(themeName)) {
            throw new RuntimeException("테마를 찾을 수 없습니다.");
        }
        
        Optional<String> colorValue = cssThemeService.getThemeColor(themeName, colorKey);
        
        if (colorValue.isPresent()) {
            Map<String, Object> data = new HashMap<>();
            data.put("themeName", themeName);
            data.put("colorKey", colorKey);
            data.put("colorValue", colorValue.get());
            
            return success("색상을 성공적으로 조회했습니다.", data);
        } else {
            throw new RuntimeException("색상을 찾을 수 없습니다.");
        }
    }

    /**
     * 특정 테마의 특정 카테고리 색상들 조회
     */
    @GetMapping("/themes/{themeName}/categories/{category}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getThemeColorsByCategory(
            @PathVariable String themeName,
            @PathVariable String category) {
        log.info("🎨 테마 카테고리별 색상 조회: {} - {}", themeName, category);
        
        if (!cssThemeService.isThemeExists(themeName)) {
            throw new RuntimeException("테마를 찾을 수 없습니다.");
        }
        
        List<CssColorSettings> colors = cssThemeService.getThemeColorsByCategory(themeName, category);
        
        Map<String, Object> data = new HashMap<>();
        data.put("themeName", themeName);
        data.put("category", category);
        data.put("colors", colors);
        data.put("count", colors.size());
        
        return success("카테고리별 색상을 성공적으로 조회했습니다.", data);
    }

    /**
     * 상담사별 색상 조회
     */
    @GetMapping("/consultant-colors")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConsultantColors(@RequestParam(defaultValue = "default") String themeName) {
        log.info("🎨 상담사별 색상 조회: {}", themeName);
        
        List<String> colors;
        try {
            // CONSULTANT 카테고리의 색상들 조회
            List<CssColorSettings> consultantColors = cssThemeService.getThemeColorsByCategory(themeName, "CONSULTANT");
            
            // 색상 배열로 변환
            colors = consultantColors.stream()
                .map(CssColorSettings::getColorValue)
                .collect(java.util.stream.Collectors.toList());
            
            // 기본 색상이 없는 경우 fallback 색상 제공
            if (colors.isEmpty()) {
                colors = java.util.Arrays.asList(
                    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
                    "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#6366f1"
                );
            }
        } catch (Exception e) {
            log.error("❌ 상담사별 색상 조회 실패: {}", themeName, e);
            
            // 에러 시 기본 색상 반환
            colors = java.util.Arrays.asList(
                "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
                "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#6366f1"
            );
            themeName = "default";
        }
        
        Map<String, Object> data = new HashMap<>();
        data.put("themeName", themeName);
        data.put("colors", colors);
        data.put("count", colors.size());
        
        return success("상담사별 색상을 성공적으로 조회했습니다.", data);
    }

    /**
     * 테마 메타데이터 저장/수정
     */
    @PostMapping("/themes")
    public ResponseEntity<ApiResponse<CssThemeMetadata>> saveThemeMetadata(@RequestBody CssThemeMetadata themeMetadata) {
        log.info("🎨 테마 메타데이터 저장/수정: {}", themeMetadata.getThemeName());
        
        CssThemeMetadata savedTheme = cssThemeService.saveThemeMetadata(themeMetadata);
        
        return updated("테마 메타데이터를 성공적으로 저장했습니다.", savedTheme);
    }

    /**
     * 테마 색상 설정 저장/수정
     */
    @PostMapping("/themes/{themeName}/colors")
    public ResponseEntity<ApiResponse<Map<String, Object>>> saveThemeColors(
            @PathVariable String themeName,
            @RequestBody List<CssColorSettings> colorSettings) {
        log.info("🎨 테마 색상 설정 저장/수정: {}", themeName);
        
        List<CssColorSettings> savedColors = cssThemeService.saveThemeColors(themeName, colorSettings);
        
        Map<String, Object> data = new HashMap<>();
        data.put("themeName", themeName);
        data.put("colors", savedColors);
        data.put("count", savedColors.size());
        
        return updated("테마 색상을 성공적으로 저장했습니다.", data);
    }

    /**
     * 테마 삭제 (비활성화)
     */
    @DeleteMapping("/themes/{themeName}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteTheme(@PathVariable String themeName) {
        log.info("🎨 테마 삭제: {}", themeName);
        
        if (!cssThemeService.isThemeExists(themeName)) {
            throw new RuntimeException("테마를 찾을 수 없습니다.");
        }
        
        cssThemeService.deleteTheme(themeName);
        
        Map<String, Object> data = new HashMap<>();
        data.put("themeName", themeName);
        
        return deleted("테마를 성공적으로 삭제했습니다.");
    }

    /**
     * 테마 존재 여부 확인
     */
    @GetMapping("/themes/{themeName}/exists")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkThemeExists(@PathVariable String themeName) {
        log.info("🎨 테마 존재 여부 확인: {}", themeName);
        
        boolean exists = cssThemeService.isThemeExists(themeName);
        
        Map<String, Object> data = new HashMap<>();
        data.put("themeName", themeName);
        data.put("exists", exists);
        
        String message = exists ? "테마가 존재합니다." : "테마가 존재하지 않습니다.";
        
        return success(message, data);
    }
}
