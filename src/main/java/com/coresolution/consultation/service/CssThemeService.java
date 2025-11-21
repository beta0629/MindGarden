package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.CssColorSettings;
import com.coresolution.consultation.entity.CssThemeMetadata;
import com.coresolution.consultation.repository.CssColorSettingsRepository;
import com.coresolution.consultation.repository.CssThemeMetadataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * CSS 테마 관리 서비스
 * 테마별 색상 설정을 관리하는 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CssThemeService {

    private final CssThemeMetadataRepository themeMetadataRepository;
    private final CssColorSettingsRepository colorSettingsRepository;

    /**
     * 모든 활성화된 테마 목록 조회 (캐시 적용)
     */
    @Cacheable(value = "cssThemes", key = "'all-active-themes'")
    public List<CssThemeMetadata> getAllActiveThemes() {
        log.info("🎨 활성화된 CSS 테마 목록 조회");
        return themeMetadataRepository.findAllActiveOrderByDisplayOrder();
    }

    /**
     * 기본 테마 조회 (캐시 적용)
     */
    @Cacheable(value = "cssThemes", key = "'default-theme'")
    public Optional<CssThemeMetadata> getDefaultTheme() {
        log.info("🎨 기본 CSS 테마 조회");
        return themeMetadataRepository.findByIsDefaultTrueAndIsActiveTrue();
    }

    /**
     * 특정 테마의 색상 설정을 Map으로 조회 (캐시 적용)
     * @param themeName 테마명
     * @return 색상 키 -> 색상 값 매핑
     */
    @Cacheable(value = "cssColors", key = "#themeName")
    public Map<String, String> getThemeColors(String themeName) {
        log.info("🎨 테마 색상 설정 조회: {}", themeName);
        
        List<Object[]> colorList = colorSettingsRepository.findColorMapByThemeName(themeName);
        Map<String, String> colorMap = new HashMap<>();
        
        for (Object[] color : colorList) {
            String colorKey = (String) color[0];
            String colorValue = (String) color[1];
            colorMap.put(colorKey, colorValue);
        }
        
        log.info("🎨 조회된 색상 수: {}", colorMap.size());
        return colorMap;
    }

    /**
     * 특정 테마의 특정 색상 값 조회 (캐시 적용)
     * @param themeName 테마명
     * @param colorKey 색상 키
     * @return 색상 값
     */
    @Cacheable(value = "cssColors", key = "#themeName + '-' + #colorKey")
    public Optional<String> getThemeColor(String themeName, String colorKey) {
        log.info("🎨 특정 테마 색상 조회: {} - {}", themeName, colorKey);
        
        return colorSettingsRepository.findByThemeNameAndColorKeyAndIsActiveTrue(themeName, colorKey)
                .map(CssColorSettings::getColorValue);
    }

    /**
     * 특정 테마의 특정 카테고리 색상들 조회
     * @param themeName 테마명
     * @param category 색상 카테고리 (PRIMARY, SECONDARY, STATUS, FUNCTIONAL)
     * @return 색상 설정 목록
     */
    public List<CssColorSettings> getThemeColorsByCategory(String themeName, String category) {
        log.info("🎨 테마 카테고리별 색상 조회: {} - {}", themeName, category);
        return colorSettingsRepository.findByThemeNameAndColorCategoryAndIsActiveTrue(themeName, category);
    }

    /**
     * 특정 테마 존재 여부 확인
     * @param themeName 테마명
     * @return 존재 여부
     */
    public boolean isThemeExists(String themeName) {
        return themeMetadataRepository.existsByThemeNameAndIsActiveTrue(themeName);
    }

    /**
     * 테마 메타데이터 저장/수정
     * @param themeMetadata 테마 메타데이터
     * @return 저장된 테마 메타데이터
     */
    @Transactional
    public CssThemeMetadata saveThemeMetadata(CssThemeMetadata themeMetadata) {
        log.info("🎨 테마 메타데이터 저장/수정: {}", themeMetadata.getThemeName());
        return themeMetadataRepository.save(themeMetadata);
    }

    /**
     * 색상 설정 저장/수정
     * @param colorSettings 색상 설정
     * @return 저장된 색상 설정
     */
    @Transactional
    public CssColorSettings saveColorSettings(CssColorSettings colorSettings) {
        log.info("🎨 색상 설정 저장/수정: {} - {}", colorSettings.getThemeName(), colorSettings.getColorKey());
        return colorSettingsRepository.save(colorSettings);
    }

    /**
     * 특정 테마의 모든 색상 설정 저장/수정
     * @param themeName 테마명
     * @param colorSettings 색상 설정 목록
     * @return 저장된 색상 설정 목록
     */
    @Transactional
    public List<CssColorSettings> saveThemeColors(String themeName, List<CssColorSettings> colorSettings) {
        log.info("🎨 테마 전체 색상 설정 저장/수정: {}", themeName);
        
        // 기존 색상 설정들을 비활성화
        List<CssColorSettings> existingColors = colorSettingsRepository.findByThemeNameAndIsActiveTrue(themeName);
        existingColors.forEach(color -> color.setIsActive(false));
        colorSettingsRepository.saveAll(existingColors);
        
        // 새로운 색상 설정들 저장
        colorSettings.forEach(color -> color.setThemeName(themeName));
        return colorSettingsRepository.saveAll(colorSettings);
    }

    /**
     * 테마 삭제 (비활성화)
     * @param themeName 테마명
     */
    @Transactional
    public void deleteTheme(String themeName) {
        log.info("🎨 테마 삭제 (비활성화): {}", themeName);
        
        // 테마 메타데이터 비활성화
        Optional<CssThemeMetadata> theme = themeMetadataRepository.findByThemeNameAndIsActiveTrue(themeName);
        if (theme.isPresent()) {
            theme.get().setIsActive(false);
            themeMetadataRepository.save(theme.get());
        }
        
        // 색상 설정들 비활성화
        List<CssColorSettings> colors = colorSettingsRepository.findByThemeNameAndIsActiveTrue(themeName);
        colors.forEach(color -> color.setIsActive(false));
        colorSettingsRepository.saveAll(colors);
    }
}
