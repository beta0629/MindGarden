package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.WellnessTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 웰니스 템플릿 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-21
 */
@Repository
public interface WellnessTemplateRepository extends JpaRepository<WellnessTemplate, Long> {

    /**
     * 테넌트·PK로 웰니스 템플릿 조회
     *
     * @param tenantId 테넌트 ID
     * @param id       템플릿 PK
     * @return 템플릿 Optional
     */
    @Query("SELECT w FROM WellnessTemplate w WHERE w.tenantId = :tenantId AND w.id = :id")
    Optional<WellnessTemplate> findByTenantIdAndId(@Param("tenantId") String tenantId, @Param("id") Long id);
    
    /**
     * 조건에 맞는 미사용 템플릿 조회
     */
    @Query("SELECT w FROM WellnessTemplate w WHERE w.dayOfWeek = :dayOfWeek AND w.season = :season AND w.isActive = true AND (w.lastUsedAt IS NULL OR w.lastUsedAt < :cutoffDate) ORDER BY w.usageCount ASC, w.createdAt ASC")
    List<WellnessTemplate> findUnusedTemplatesByConditions(
        @Param("dayOfWeek") Integer dayOfWeek, 
        @Param("season") String season, 
        @Param("cutoffDate") LocalDateTime cutoffDate
    );
    
    /**
     * 활성 템플릿 개수 조회
     */
    long countByIsActiveTrue();
    
    /**
     * 최근 사용된 템플릿 조회
     */
    @Query("SELECT w FROM WellnessTemplate w WHERE w.isActive = true ORDER BY w.lastUsedAt DESC")
    List<WellnessTemplate> findRecentTemplates();
}