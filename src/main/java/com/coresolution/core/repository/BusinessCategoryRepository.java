package com.coresolution.core.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.core.domain.BusinessCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 업종 카테고리 Repository
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Repository
public interface BusinessCategoryRepository extends JpaRepository<BusinessCategory, Long> {
    
    /**
     * 카테고리 ID로 조회
     */
    Optional<BusinessCategory> findByCategoryId(String categoryId);
    
    /**
     * 카테고리 코드로 조회
     */
    Optional<BusinessCategory> findByCategoryCode(String categoryCode);
    
    /**
     * 활성화된 모든 카테고리 조회 (표시 순서 정렬)
     */
    @Query("SELECT c FROM BusinessCategory c WHERE c.isActive = true AND c.isDeleted = false ORDER BY c.displayOrder ASC, c.nameKo ASC")
    List<BusinessCategory> findAllActiveOrderByDisplayOrder();
    
    /**
     * 레벨별 카테고리 조회
     */
    @Query("SELECT c FROM BusinessCategory c WHERE c.level = :level AND c.isActive = true AND c.isDeleted = false ORDER BY c.displayOrder ASC")
    List<BusinessCategory> findByLevelAndActive(@Param("level") Integer level);
    
    /**
     * 상위 카테고리 ID로 하위 카테고리 조회
     */
    @Query("SELECT c FROM BusinessCategory c WHERE c.parentCategoryId = :parentCategoryId AND c.isActive = true AND c.isDeleted = false ORDER BY c.displayOrder ASC")
    List<BusinessCategory> findByParentCategoryIdAndActive(@Param("parentCategoryId") String parentCategoryId);
    
    /**
     * 루트 카테고리 조회 (상위 카테고리가 없는 카테고리)
     */
    @Query("SELECT c FROM BusinessCategory c WHERE (c.parentCategoryId IS NULL OR c.parentCategoryId = '') AND c.isActive = true AND c.isDeleted = false ORDER BY c.displayOrder ASC")
    List<BusinessCategory> findRootCategories();
}

