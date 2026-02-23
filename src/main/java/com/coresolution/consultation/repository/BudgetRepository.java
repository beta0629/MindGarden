package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * ERP 예산 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    
    /**
     * 테넌트별 활성화된 예산 목록 조회 (테넌트 필터링)
     */
    @Query("SELECT b FROM Budget b WHERE b.tenantId = :tenantId AND b.status = 'ACTIVE' ORDER BY b.year DESC, b.month DESC, b.name")
    List<Budget> findAllActiveByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 예산 정보 노출!
     */
    @Deprecated
    @Query("SELECT b FROM Budget b WHERE b.status = 'ACTIVE' ORDER BY b.year DESC, b.month DESC, b.name")
    List<Budget> findAllActive();
    
    /**
     * 테넌트별 연도별 예산 목록 조회 (테넌트 필터링)
     */
    @Query("SELECT b FROM Budget b WHERE b.tenantId = :tenantId AND b.year = :year AND b.status = 'ACTIVE' ORDER BY b.month DESC, b.name")
    List<Budget> findByTenantIdAndYearAndActive(@Param("tenantId") String tenantId, @Param("year") String year);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 연도별 예산 노출!
     */
    @Deprecated
    @Query("SELECT b FROM Budget b WHERE b.year = :year AND b.status = 'ACTIVE' ORDER BY b.month DESC, b.name")
    List<Budget> findByYearAndActive(@Param("year") String year);
    
    /**
     * 테넌트별 연도·월별 예산 목록 조회 (테넌트 필터링)
     */
    @Query("SELECT b FROM Budget b WHERE b.tenantId = :tenantId AND b.year = :year AND b.month = :month AND b.status = 'ACTIVE' ORDER BY b.name")
    List<Budget> findByTenantIdAndYearAndMonthAndActive(@Param("tenantId") String tenantId, @Param("year") String year, @Param("month") String month);
    
    /**
     * 월별 예산 목록 조회
     * @Deprecated 테넌트 필터링 없음! findByTenantIdAndYearAndMonthAndActive() 사용 권장
     */
    @Deprecated
    @Query("SELECT b FROM Budget b WHERE b.year = :year AND b.month = :month AND b.status = 'ACTIVE' ORDER BY b.name")
    List<Budget> findByYearAndMonthAndActive(@Param("year") String year, @Param("month") String month);
    
    /**
     * 테넌트별 카테고리별 예산 목록 조회 (테넌트 필터링)
     */
    @Query("SELECT b FROM Budget b WHERE b.tenantId = :tenantId AND b.category = :category AND b.status = 'ACTIVE' ORDER BY b.year DESC, b.month DESC")
    List<Budget> findByTenantIdAndCategoryAndActive(@Param("tenantId") String tenantId, @Param("category") String category);
    
    /**
     * 카테고리별 예산 목록 조회
     * @Deprecated 테넌트 필터링 없음! findByTenantIdAndCategoryAndActive() 사용 권장
     */
    @Deprecated
    @Query("SELECT b FROM Budget b WHERE b.category = :category AND b.status = 'ACTIVE' ORDER BY b.year DESC, b.month DESC")
    List<Budget> findByCategoryAndActive(@Param("category") String category);
    
    /**
     * 테넌트별 관리자별 예산 목록 조회 (테넌트 필터링)
     */
    @Query("SELECT b FROM Budget b WHERE b.tenantId = :tenantId AND b.manager.id = :managerId AND b.status = 'ACTIVE' ORDER BY b.year DESC, b.month DESC")
    List<Budget> findByTenantIdAndManagerIdAndActive(@Param("tenantId") String tenantId, @Param("managerId") Long managerId);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 관리자별 예산 노출!
     */
    @Deprecated
    @Query("SELECT b FROM Budget b WHERE b.manager.id = :managerId AND b.status = 'ACTIVE' ORDER BY b.year DESC, b.month DESC")
    List<Budget> findByManagerIdAndActive(@Param("managerId") Long managerId);
    
    /**
     * 연도별 예산 통계
     */
    @Query("SELECT b.year, SUM(b.totalBudget), SUM(b.usedBudget), SUM(b.remainingBudget) FROM Budget b WHERE b.status = 'ACTIVE' GROUP BY b.year ORDER BY b.year DESC")
    List<Object[]> getStatsByYear();
    
    /**
     * 월별 예산 통계
     */
    @Query("SELECT b.year, b.month, SUM(b.totalBudget), SUM(b.usedBudget), SUM(b.remainingBudget) FROM Budget b WHERE b.year = :year AND b.status = 'ACTIVE' GROUP BY b.year, b.month ORDER BY b.month DESC")
    List<Object[]> getStatsByMonth(@Param("year") String year);
    
    /**
     * 카테고리별 예산 통계
     */
    @Query("SELECT b.category, SUM(b.totalBudget), SUM(b.usedBudget), SUM(b.remainingBudget) FROM Budget b WHERE b.status = 'ACTIVE' GROUP BY b.category ORDER BY SUM(b.totalBudget) DESC")
    List<Object[]> getStatsByCategory();
    
    /**
     * 테넌트별 예산 사용률이 높은 예산 목록 조회 (80% 이상, 테넌트 필터링)
     */
    @Query("SELECT b FROM Budget b WHERE b.tenantId = :tenantId AND b.status = 'ACTIVE' AND (b.usedBudget / b.totalBudget) >= 0.8 ORDER BY (b.usedBudget / b.totalBudget) DESC")
    List<Budget> findHighUsageBudgetsByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 예산 사용률이 높은 예산 목록 조회 (80% 이상)
     * @Deprecated 테넌트 필터링 없음! findHighUsageBudgetsByTenantId() 사용 권장
     */
    @Deprecated
    @Query("SELECT b FROM Budget b WHERE b.status = 'ACTIVE' AND (b.usedBudget / b.totalBudget) >= 0.8 ORDER BY (b.usedBudget / b.totalBudget) DESC")
    List<Budget> findHighUsageBudgets();
    
    /**
     * 테넌트별 예산 부족 예산 목록 조회 (사용 예산이 총 예산을 초과, 테넌트 필터링)
     */
    @Query("SELECT b FROM Budget b WHERE b.tenantId = :tenantId AND b.status = 'ACTIVE' AND b.usedBudget > b.totalBudget ORDER BY (b.usedBudget - b.totalBudget) DESC")
    List<Budget> findOverBudgetBudgetsByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 예산 부족 예산 목록 조회 (사용 예산이 총 예산을 초과)
     * @Deprecated 테넌트 필터링 없음! findOverBudgetBudgetsByTenantId() 사용 권장
     */
    @Deprecated
    @Query("SELECT b FROM Budget b WHERE b.status = 'ACTIVE' AND b.usedBudget > b.totalBudget ORDER BY (b.usedBudget - b.totalBudget) DESC")
    List<Budget> findOverBudgetBudgets();
    
    /**
     * 테넌트별 ID로 예산 조회 (관리자 정보 포함, 테넌트 필터링)
     */
    @Query("SELECT b FROM Budget b LEFT JOIN FETCH b.manager WHERE b.tenantId = :tenantId AND b.id = :id")
    Optional<Budget> findByTenantIdAndIdWithManager(@Param("tenantId") String tenantId, @Param("id") Long id);
    
    /**
     * ID로 예산 조회 (관리자 정보 포함)
     * @Deprecated 테넌트 필터링 없음! findByTenantIdAndIdWithManager() 사용 권장
     */
    @Deprecated
    @Query("SELECT b FROM Budget b LEFT JOIN FETCH b.manager WHERE b.id = :id")
    Optional<Budget> findByIdWithManager(@Param("id") Long id);
    
    /**
     * 카테고리 목록 조회 (중복 제거)
     */
    @Query("SELECT DISTINCT b.category FROM Budget b WHERE b.status = 'ACTIVE' AND b.category IS NOT NULL ORDER BY b.category")
    List<String> findDistinctCategories();
    
    /**
     * 연도 목록 조회 (중복 제거)
     */
    @Query("SELECT DISTINCT b.year FROM Budget b WHERE b.status = 'ACTIVE' ORDER BY b.year DESC")
    List<String> findDistinctYears();
}
