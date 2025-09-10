package com.mindgarden.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.Budget;
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
     * 활성화된 예산 목록 조회
     */
    @Query("SELECT b FROM Budget b WHERE b.isActive = true ORDER BY b.year DESC, b.month DESC, b.name")
    List<Budget> findAllActive();
    
    /**
     * 연도별 예산 목록 조회
     */
    @Query("SELECT b FROM Budget b WHERE b.year = :year AND b.isActive = true ORDER BY b.month DESC, b.name")
    List<Budget> findByYearAndActive(@Param("year") String year);
    
    /**
     * 월별 예산 목록 조회
     */
    @Query("SELECT b FROM Budget b WHERE b.year = :year AND b.month = :month AND b.isActive = true ORDER BY b.name")
    List<Budget> findByYearAndMonthAndActive(@Param("year") String year, @Param("month") String month);
    
    /**
     * 카테고리별 예산 목록 조회
     */
    @Query("SELECT b FROM Budget b WHERE b.category = :category AND b.isActive = true ORDER BY b.year DESC, b.month DESC")
    List<Budget> findByCategoryAndActive(@Param("category") String category);
    
    /**
     * 관리자별 예산 목록 조회
     */
    @Query("SELECT b FROM Budget b WHERE b.manager.id = :managerId AND b.isActive = true ORDER BY b.year DESC, b.month DESC")
    List<Budget> findByManagerIdAndActive(@Param("managerId") Long managerId);
    
    /**
     * 연도별 예산 통계
     */
    @Query("SELECT b.year, SUM(b.totalBudget), SUM(b.usedBudget), SUM(b.remainingBudget) FROM Budget b WHERE b.isActive = true GROUP BY b.year ORDER BY b.year DESC")
    List<Object[]> getStatsByYear();
    
    /**
     * 월별 예산 통계
     */
    @Query("SELECT b.year, b.month, SUM(b.totalBudget), SUM(b.usedBudget), SUM(b.remainingBudget) FROM Budget b WHERE b.year = :year AND b.isActive = true GROUP BY b.year, b.month ORDER BY b.month DESC")
    List<Object[]> getStatsByMonth(@Param("year") String year);
    
    /**
     * 카테고리별 예산 통계
     */
    @Query("SELECT b.category, SUM(b.totalBudget), SUM(b.usedBudget), SUM(b.remainingBudget) FROM Budget b WHERE b.isActive = true GROUP BY b.category ORDER BY SUM(b.totalBudget) DESC")
    List<Object[]> getStatsByCategory();
    
    /**
     * 예산 사용률이 높은 예산 목록 조회 (80% 이상)
     */
    @Query("SELECT b FROM Budget b WHERE b.isActive = true AND (b.usedBudget / b.totalBudget) >= 0.8 ORDER BY (b.usedBudget / b.totalBudget) DESC")
    List<Budget> findHighUsageBudgets();
    
    /**
     * 예산 부족 예산 목록 조회 (사용 예산이 총 예산을 초과)
     */
    @Query("SELECT b FROM Budget b WHERE b.isActive = true AND b.usedBudget > b.totalBudget ORDER BY (b.usedBudget - b.totalBudget) DESC")
    List<Budget> findOverBudgetBudgets();
    
    /**
     * ID로 예산 조회 (관리자 정보 포함)
     */
    @Query("SELECT b FROM Budget b LEFT JOIN FETCH b.manager WHERE b.id = :id")
    Optional<Budget> findByIdWithManager(@Param("id") Long id);
    
    /**
     * 카테고리 목록 조회 (중복 제거)
     */
    @Query("SELECT DISTINCT b.category FROM Budget b WHERE b.isActive = true AND b.category IS NOT NULL ORDER BY b.category")
    List<String> findDistinctCategories();
    
    /**
     * 연도 목록 조회 (중복 제거)
     */
    @Query("SELECT DISTINCT b.year FROM Budget b WHERE b.isActive = true ORDER BY b.year DESC")
    List<String> findDistinctYears();
}
