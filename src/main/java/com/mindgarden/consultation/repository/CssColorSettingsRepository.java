package com.mindgarden.consultation.repository;

import com.mindgarden.consultation.entity.CssColorSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * CSS 색상 설정 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface CssColorSettingsRepository extends JpaRepository<CssColorSettings, Long> {

    /**
     * 특정 테마의 모든 색상 설정 조회
     */
    @Query("SELECT ccs FROM CssColorSettings ccs WHERE ccs.themeName = :themeName AND ccs.isActive = true ORDER BY ccs.colorCategory, ccs.colorKey")
    List<CssColorSettings> findByThemeNameAndIsActiveTrue(@Param("themeName") String themeName);

    /**
     * 특정 테마의 색상 설정을 Map으로 조회 (colorKey -> colorValue)
     */
    @Query("SELECT ccs.colorKey, ccs.colorValue FROM CssColorSettings ccs WHERE ccs.themeName = :themeName AND ccs.isActive = true")
    List<Object[]> findColorMapByThemeName(@Param("themeName") String themeName);

    /**
     * 특정 테마와 색상 키로 색상 설정 조회
     */
    Optional<CssColorSettings> findByThemeNameAndColorKeyAndIsActiveTrue(String themeName, String colorKey);

    /**
     * 특정 카테고리의 색상 설정 조회
     */
    @Query("SELECT ccs FROM CssColorSettings ccs WHERE ccs.themeName = :themeName AND ccs.colorCategory = :category AND ccs.isActive = true ORDER BY ccs.colorKey")
    List<CssColorSettings> findByThemeNameAndColorCategoryAndIsActiveTrue(@Param("themeName") String themeName, @Param("category") String category);

    /**
     * 모든 활성화된 테마의 색상 설정 조회
     */
    @Query("SELECT ccs FROM CssColorSettings ccs WHERE ccs.isActive = true ORDER BY ccs.themeName, ccs.colorCategory, ccs.colorKey")
    List<CssColorSettings> findAllActiveOrderByThemeNameAndCategory();

    /**
     * 특정 테마명 존재 여부 확인
     */
    boolean existsByThemeNameAndIsActiveTrue(String themeName);
}
