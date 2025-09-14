package com.mindgarden.consultation.repository;

import com.mindgarden.consultation.entity.CssThemeMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * CSS 테마 메타데이터 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface CssThemeMetadataRepository extends JpaRepository<CssThemeMetadata, String> {

    /**
     * 활성화된 테마 목록을 표시 순서로 조회
     */
    @Query("SELECT ctm FROM CssThemeMetadata ctm WHERE ctm.isActive = true ORDER BY ctm.displayOrder ASC, ctm.themeName ASC")
    List<CssThemeMetadata> findAllActiveOrderByDisplayOrder();

    /**
     * 기본 테마 조회
     */
    Optional<CssThemeMetadata> findByIsDefaultTrueAndIsActiveTrue();

    /**
     * 테마명으로 활성화된 테마 조회
     */
    Optional<CssThemeMetadata> findByThemeNameAndIsActiveTrue(String themeName);

    /**
     * 특정 테마명 존재 여부 확인
     */
    boolean existsByThemeNameAndIsActiveTrue(String themeName);
}
