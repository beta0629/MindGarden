package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.entity.CssColorSettings;
import com.mindgarden.consultation.entity.CssThemeMetadata;
import com.mindgarden.consultation.service.CssThemeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * CSS 테마 관리 컨트롤러
 * 테마별 색상 설정을 관리하는 REST API
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@RestController
@RequestMapping("/api/admin/css-themes")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN') or hasRole('BRANCH_SUPER_ADMIN') or hasRole('HQ_ADMIN') or hasRole('SUPER_HQ_ADMIN') or hasRole('HQ_MASTER')")
public class CssThemeController {

    private final CssThemeService cssThemeService;

    /**
     * 모든 활성화된 테마 목록 조회
     */
    @GetMapping("/themes")
    public ResponseEntity<?> getAllActiveThemes() {
        try {
            log.info("🎨 활성화된 CSS 테마 목록 조회");
            List<CssThemeMetadata> themes = cssThemeService.getAllActiveThemes();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", themes,
                "count", themes.size(),
                "message", "테마 목록을 성공적으로 조회했습니다."
            ));
        } catch (Exception e) {
            log.error("❌ CSS 테마 목록 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "테마 목록 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 기본 테마 조회
     */
    @GetMapping("/themes/default")
    public ResponseEntity<?> getDefaultTheme() {
        try {
            log.info("🎨 기본 CSS 테마 조회");
            Optional<CssThemeMetadata> defaultTheme = cssThemeService.getDefaultTheme();
            
            if (defaultTheme.isPresent()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", defaultTheme.get(),
                    "message", "기본 테마를 성공적으로 조회했습니다."
                ));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("❌ 기본 CSS 테마 조회 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "기본 테마 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 특정 테마의 색상 설정 조회
     */
    @GetMapping("/themes/{themeName}/colors")
    public ResponseEntity<?> getThemeColors(@PathVariable String themeName) {
        try {
            log.info("🎨 테마 색상 설정 조회: {}", themeName);
            
            if (!cssThemeService.isThemeExists(themeName)) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, String> colors = cssThemeService.getThemeColors(themeName);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "themeName", themeName,
                "data", colors,
                "count", colors.size(),
                "message", "테마 색상을 성공적으로 조회했습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 테마 색상 조회 실패: {}", themeName, e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "테마 색상 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 특정 테마의 특정 색상 값 조회
     */
    @GetMapping("/themes/{themeName}/colors/{colorKey}")
    public ResponseEntity<?> getThemeColor(
            @PathVariable String themeName,
            @PathVariable String colorKey) {
        try {
            log.info("🎨 특정 테마 색상 조회: {} - {}", themeName, colorKey);
            
            if (!cssThemeService.isThemeExists(themeName)) {
                return ResponseEntity.notFound().build();
            }
            
            Optional<String> colorValue = cssThemeService.getThemeColor(themeName, colorKey);
            
            if (colorValue.isPresent()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "themeName", themeName,
                    "colorKey", colorKey,
                    "colorValue", colorValue.get(),
                    "message", "색상을 성공적으로 조회했습니다."
                ));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("❌ 특정 테마 색상 조회 실패: {} - {}", themeName, colorKey, e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "색상 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 특정 테마의 특정 카테고리 색상들 조회
     */
    @GetMapping("/themes/{themeName}/categories/{category}")
    public ResponseEntity<?> getThemeColorsByCategory(
            @PathVariable String themeName,
            @PathVariable String category) {
        try {
            log.info("🎨 테마 카테고리별 색상 조회: {} - {}", themeName, category);
            
            if (!cssThemeService.isThemeExists(themeName)) {
                return ResponseEntity.notFound().build();
            }
            
            List<CssColorSettings> colors = cssThemeService.getThemeColorsByCategory(themeName, category);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "themeName", themeName,
                "category", category,
                "data", colors,
                "count", colors.size(),
                "message", "카테고리별 색상을 성공적으로 조회했습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 카테고리별 색상 조회 실패: {} - {}", themeName, category, e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "카테고리별 색상 조회에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 테마 메타데이터 저장/수정
     */
    @PostMapping("/themes")
    public ResponseEntity<?> saveThemeMetadata(@RequestBody CssThemeMetadata themeMetadata) {
        try {
            log.info("🎨 테마 메타데이터 저장/수정: {}", themeMetadata.getThemeName());
            
            CssThemeMetadata savedTheme = cssThemeService.saveThemeMetadata(themeMetadata);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", savedTheme,
                "message", "테마 메타데이터를 성공적으로 저장했습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 테마 메타데이터 저장 실패: {}", themeMetadata.getThemeName(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "테마 메타데이터 저장에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 테마 색상 설정 저장/수정
     */
    @PostMapping("/themes/{themeName}/colors")
    public ResponseEntity<?> saveThemeColors(
            @PathVariable String themeName,
            @RequestBody List<CssColorSettings> colorSettings) {
        try {
            log.info("🎨 테마 색상 설정 저장/수정: {}", themeName);
            
            List<CssColorSettings> savedColors = cssThemeService.saveThemeColors(themeName, colorSettings);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "themeName", themeName,
                "data", savedColors,
                "count", savedColors.size(),
                "message", "테마 색상을 성공적으로 저장했습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 테마 색상 저장 실패: {}", themeName, e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "테마 색상 저장에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 테마 삭제 (비활성화)
     */
    @DeleteMapping("/themes/{themeName}")
    public ResponseEntity<?> deleteTheme(@PathVariable String themeName) {
        try {
            log.info("🎨 테마 삭제: {}", themeName);
            
            if (!cssThemeService.isThemeExists(themeName)) {
                return ResponseEntity.notFound().build();
            }
            
            cssThemeService.deleteTheme(themeName);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "themeName", themeName,
                "message", "테마를 성공적으로 삭제했습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 테마 삭제 실패: {}", themeName, e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "테마 삭제에 실패했습니다: " + e.getMessage()
            ));
        }
    }

    /**
     * 테마 존재 여부 확인
     */
    @GetMapping("/themes/{themeName}/exists")
    public ResponseEntity<?> checkThemeExists(@PathVariable String themeName) {
        try {
            log.info("🎨 테마 존재 여부 확인: {}", themeName);
            
            boolean exists = cssThemeService.isThemeExists(themeName);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "themeName", themeName,
                "exists", exists,
                "message", exists ? "테마가 존재합니다." : "테마가 존재하지 않습니다."
            ));
        } catch (Exception e) {
            log.error("❌ 테마 존재 여부 확인 실패: {}", themeName, e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "테마 존재 여부 확인에 실패했습니다: " + e.getMessage()
            ));
        }
    }
}
