package com.coresolution.consultation.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.DailyHealingContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 오늘의 힐링 컨텐츠 Repository
 */
@Repository
public interface DailyHealingContentRepository extends JpaRepository<DailyHealingContent, Long> {
    
    // ==================== tenantId 필터링 메서드 ====================
    
    /**
     * 특정 날짜, 역할, 카테고리의 힐링 컨텐츠 조회 (tenantId 필터링)
     */
    @Query("SELECT h FROM DailyHealingContent h WHERE h.tenantId = :tenantId AND h.contentDate = :date AND h.userRole = :userRole AND h.category = :category AND h.isActive = true")
    Optional<DailyHealingContent> findByTenantIdAndDateAndUserRoleAndCategory(
        @Param("tenantId") String tenantId,
        @Param("date") LocalDate date, 
        @Param("userRole") String userRole, 
        @Param("category") String category
    );
    
    /**
     * 특정 날짜, 역할의 모든 힐링 컨텐츠 조회 (tenantId 필터링)
     */
    @Query("SELECT h FROM DailyHealingContent h WHERE h.tenantId = :tenantId AND h.contentDate = :date AND h.userRole = :userRole AND h.isActive = true ORDER BY h.category")
    List<DailyHealingContent> findByTenantIdAndDateAndUserRole(
        @Param("tenantId") String tenantId,
        @Param("date") LocalDate date, 
        @Param("userRole") String userRole
    );
    
    /**
     * 특정 날짜의 모든 힐링 컨텐츠 조회 (tenantId 필터링)
     */
    @Query("SELECT h FROM DailyHealingContent h WHERE h.tenantId = :tenantId AND h.contentDate = :date AND h.isActive = true ORDER BY h.userRole, h.category")
    List<DailyHealingContent> findByTenantIdAndDate(@Param("tenantId") String tenantId, @Param("date") LocalDate date);
    
    /**
     * 오늘의 힐링 컨텐츠가 존재하는지 확인 (tenantId 필터링)
     */
    @Query("SELECT COUNT(h) > 0 FROM DailyHealingContent h WHERE h.tenantId = :tenantId AND h.contentDate = :date AND h.isActive = true")
    boolean existsByTenantIdAndDate(@Param("tenantId") String tenantId, @Param("date") LocalDate date);
    
    // ==================== @Deprecated 메서드 (하위 호환성) ====================
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndDateAndUserRoleAndCategory 사용하세요.
     */
    @Deprecated
    @Query("SELECT h FROM DailyHealingContent h WHERE h.contentDate = :date AND h.userRole = :userRole AND h.category = :category AND h.isActive = true")
    Optional<DailyHealingContent> findByDateAndUserRoleAndCategory(
        @Param("date") LocalDate date, 
        @Param("userRole") String userRole, 
        @Param("category") String category
    );
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndDateAndUserRole 사용하세요.
     */
    @Deprecated
    @Query("SELECT h FROM DailyHealingContent h WHERE h.contentDate = :date AND h.userRole = :userRole AND h.isActive = true ORDER BY h.category")
    List<DailyHealingContent> findByDateAndUserRole(
        @Param("date") LocalDate date, 
        @Param("userRole") String userRole
    );
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndDate 사용하세요.
     */
    @Deprecated
    @Query("SELECT h FROM DailyHealingContent h WHERE h.contentDate = :date AND h.isActive = true ORDER BY h.userRole, h.category")
    List<DailyHealingContent> findByDate(@Param("date") LocalDate date);
    
    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! existsByTenantIdAndDate 사용하세요.
     */
    @Deprecated
    @Query("SELECT COUNT(h) > 0 FROM DailyHealingContent h WHERE h.contentDate = :date AND h.isActive = true")
    boolean existsByDate(@Param("date") LocalDate date);
}
